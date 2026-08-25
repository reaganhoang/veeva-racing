import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'

import Buildings from './Buildings'
import Vehicle from './Vehicle'
import Checkpoints from './Checkpoints'
import ItemBoxes, { ITEM_BOX_POSITIONS, ITEM_BOX_COUNT } from './ItemBoxes'
import Track, { trackCurve } from './Track'
import BuildingTeleportGates, { BUILDING_GATE_POSITIONS, BUILDING_GATE_COUNT } from './BuildingTeleportGates'
import JumpRamp, { JUMP_PAD_POSITION } from './JumpRamp'

import HUD from '../UI/HUD'
import ControlsOverlay from '../UI/ControlsOverlay'
import FinishScreen from '../UI/FinishScreen'

import { useVehicleControls } from '../../hooks/useVehicleControls'
import { saveRaceResult } from '../../lib/leaderboard'
import { submitToGoogleSheet, isSheetConfigured, type SubmitPayload } from '../../lib/googleSheets'
import {
  STARTING_POSITIONS, STARTING_ROTATION_Y,
  TOTAL_LAPS, PHYSICS_GRAVITY,
} from '../../lib/gameConstants'

interface Props {
  playerName: string
  colorIndex: number
  onExit:             () => void
  onViewLeaderboard:  () => void
}

const COUNTDOWN_SECS = 3

export default function GameScene({ playerName, colorIndex, onExit, onViewLeaderboard }: Props) {
  const [gamePhase, setGamePhase] = useState<'countdown' | 'racing' | 'finished'>('countdown')
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS)

  const [currentLap, setCurrentLap]         = useState(0)
  const [nextCheckpoint, setNextCheckpoint] = useState(0)
  const [speed, setSpeed]                   = useState(0)
  const [lapTimes, setLapTimes]             = useState<number[]>([])
  const [bestLap, setBestLap]               = useState(0)
  const [totalElapsed, setTotalElapsed]     = useState(0)

  const [isOffRoad, setIsOffRoad]       = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const itemBoxAvailableRef      = useRef<boolean[]>(new Array(ITEM_BOX_COUNT).fill(true))
  const currentItemRef           = useRef<string | null>(null)
  const [currentItem, setCurrentItem] = useState<string | null>(null)

  const buildingGateAvailableRef = useRef<boolean[]>(new Array(BUILDING_GATE_COUNT).fill(true))
  const teleportTargetRef        = useRef<{ pos: [number, number, number]; rotY: number } | null>(null)
  const [isTeleporting, setIsTeleporting] = useState(false)

  const playerPosRef  = useRef<[number, number, number]>([0, 1, 65])
  const playerQuatRef = useRef<[number, number, number, number]>([0, 0, 0, 1])
  const lapStartRef   = useRef(0)
  const raceStartRef  = useRef(0)
  const bestLapRef    = useRef(0)
  const lapTimesRef   = useRef<number[]>([])
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  const { controlsRef, setTouchControl } = useVehicleControls()

  // Countdown → racing
  useEffect(() => {
    let remaining = COUNTDOWN_SECS
    const tick = setInterval(() => {
      remaining--
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(tick)
        setGamePhase('racing')
        const now = Date.now()
        lapStartRef.current  = now
        raceStartRef.current = now
        timerRef.current = setInterval(
          () => setTotalElapsed(Date.now() - raceStartRef.current),
          100
        )
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function handleRaceComplete(finalLapTimes: number[], totalMs: number) {
    const best = finalLapTimes.reduce((a, b) => Math.min(a, b))
    const payload: SubmitPayload = { driverName: playerName, lapTimes: finalLapTimes, bestLapMs: best, totalTimeMs: totalMs }
    saveRaceResult(payload)
    if (isSheetConfigured) {
      setSubmitStatus('sending')
      submitToGoogleSheet(payload)
        .then(() => setSubmitStatus('sent'))
        .catch(() => setSubmitStatus('error'))
    } else {
      setSubmitStatus('error')
    }
  }

  const handleCheckpointHit = useCallback((index: number) => setNextCheckpoint(index + 1), [])

  const handleReset = useCallback(() => {
    setCurrentLap(0)
    setNextCheckpoint(0)
  }, [])

  const handleFinishLine = useCallback(() => {
    if (gamePhase !== 'racing') return
    const now   = Date.now()
    const lapMs = now - lapStartRef.current
    lapStartRef.current = now
    const newBest = bestLapRef.current === 0 || lapMs < bestLapRef.current ? lapMs : bestLapRef.current
    bestLapRef.current = newBest
    setBestLap(newBest)
    const updatedTimes = [...lapTimesRef.current, lapMs]
    lapTimesRef.current = updatedTimes
    setLapTimes(updatedTimes)
    setCurrentLap(prev => Math.min(prev + 1, TOTAL_LAPS))
    setNextCheckpoint(0)
    if (updatedTimes.length >= TOTAL_LAPS) {
      const total = Date.now() - raceStartRef.current
      if (timerRef.current) clearInterval(timerRef.current)
      setTotalElapsed(total)
      setGamePhase('finished')
      handleRaceComplete(updatedTimes, total)
    }
  }, [gamePhase, playerName]) // eslint-disable-line

  const handleItemBoxCollected = useCallback((index: number) => {
    const roll = Math.random()
    const item = roll < 0.50 ? 'boost' : roll < 0.80 ? 'turbo' : 'jump'
    currentItemRef.current = item
    setCurrentItem(item)
    setTimeout(() => { itemBoxAvailableRef.current[index] = true }, 5000)
  }, [])

  const handleItemUsed = useCallback(() => {
    currentItemRef.current = null
    setCurrentItem(null)
  }, [])

  const handleBuildingGateEntered = useCallback((index: number) => {
    // Teleport to a random position along the main track curve
    const t   = Math.random()
    const pt  = trackCurve.getPoint(t)
    const tan = trackCurve.getTangent(t).normalize()
    const rotY = Math.atan2(-tan.x, -tan.z)
    teleportTargetRef.current = { pos: [pt.x, 1.2, pt.z], rotY }

    setIsTeleporting(true)
    setTimeout(() => setIsTeleporting(false), 1500)

    // Gate respawns after 5 seconds
    setTimeout(() => { buildingGateAvailableRef.current[index] = true }, 5000)
  }, [])

  const startPos = STARTING_POSITIONS[0]
  const finishedBestLap = lapTimesRef.current.length
    ? lapTimesRef.current.reduce((a, b) => Math.min(a, b))
    : bestLap

  return (
    <div className="w-screen h-screen relative bg-black overflow-hidden">
      <Canvas
        shadows
        camera={{ fov: 65, near: 0.1, far: 1000, position: [0, 6, 80] }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[60, 80, -40]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-150}
          shadow-camera-right={150}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
        />
        <hemisphereLight args={['#87CEEB', '#4A7C59', 0.3]} />
        <Sky sunPosition={[100, 30, -100]} turbidity={4} rayleigh={0.5} />
        <fog attach="fog" args={['#C8D8E8', 150, 450]} />

        <Physics gravity={[0, PHYSICS_GRAVITY, 0]}>
          <RigidBody type="fixed">
            <CuboidCollider args={[300, 0.5, 300]} position={[0, -0.5, 0]} />
          </RigidBody>

          <Track />
          <Buildings />
          <ItemBoxes availableRef={itemBoxAvailableRef} />
          <BuildingTeleportGates availableRef={buildingGateAvailableRef} />
          <JumpRamp />

          <Checkpoints
            playerPosRef={playerPosRef}
            nextCheckpoint={nextCheckpoint}
            gamePhase={gamePhase}
            onCheckpointHit={handleCheckpointHit}
            onFinishLine={handleFinishLine}
            onOffRoad={setIsOffRoad}
          />

          <Vehicle
            startPosition={startPos}
            startRotationY={STARTING_ROTATION_Y}
            controlsRef={controlsRef}
            playerPosRef={playerPosRef}
            playerQuatRef={playerQuatRef}
            onSpeedChange={setSpeed}
            isOffRoad={isOffRoad}
            gamePhase={gamePhase}
            colorIndex={colorIndex}
            itemBoxPositions={ITEM_BOX_POSITIONS}
            itemBoxAvailableRef={itemBoxAvailableRef}
            onItemBoxCollected={handleItemBoxCollected}
            currentItemRef={currentItemRef}
            onItemUsed={handleItemUsed}
            buildingGatePositions={BUILDING_GATE_POSITIONS}
            buildingGateAvailableRef={buildingGateAvailableRef}
            onBuildingGateEntered={handleBuildingGateEntered}
            teleportTargetRef={teleportTargetRef}
            jumpPadPosition={JUMP_PAD_POSITION}
            onReset={handleReset}
          />
        </Physics>
      </Canvas>

      {gamePhase !== 'finished' && (
        <HUD
          speed={speed}
          currentLap={Math.max(1, currentLap + 1)}
          lapTimes={lapTimes}
          bestLap={bestLap}
          totalElapsed={totalElapsed}
          position={1}
          totalPlayers={1}
          nextCheckpoint={nextCheckpoint}
          countdown={gamePhase === 'countdown' ? countdown : -1}
          currentItem={currentItem}
          isTeleporting={isTeleporting}
        />
      )}

      <ControlsOverlay setTouchControl={setTouchControl} />

      {gamePhase === 'finished' && (
        <FinishScreen
          driverName={playerName}
          lapTimes={lapTimesRef.current}
          bestLapMs={finishedBestLap}
          totalTimeMs={totalElapsed}
          submitStatus={submitStatus}
          onPlayAgain={onExit}
          onViewLeaderboard={onViewLeaderboard}
        />
      )}

      <button
        onClick={onExit}
        className="absolute top-4 left-4 text-slate-500 hover:text-white text-sm transition z-50 bg-black/40 px-3 py-1.5 rounded-lg"
      >
        ← Lobby
      </button>
    </div>
  )
}
