import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { trackCurve, TRACK_SAMPLES } from './Track'
import {
  CHECKPOINT_T, CHECKPOINT_RADIUS, FINISH_RADIUS,
  ROAD_WIDTH,
} from '../../lib/constants'

interface Props {
  playerPosRef: React.MutableRefObject<[number, number, number]>
  nextCheckpoint: number        // 0-(N-1): which CP to trigger next; N = need Finish
  gamePhase: 'countdown' | 'racing' | 'finished'
  onCheckpointHit: (index: number) => void
  onFinishLine: () => void
  onOffRoad: (isOff: boolean) => void
}

// ── Pre-compute checkpoint world positions ─────────────────────────────────────
const CHECKPOINT_POSITIONS = CHECKPOINT_T.map(t => trackCurve.getPoint(t))
const FINISH_POSITION      = trackCurve.getPoint(0)

// ── Off-road detection: squared distance from nearest track center ─────────────
const HALF_ROAD    = ROAD_WIDTH / 2 + 1   // small buffer
const HALF_ROAD_SQ = HALF_ROAD * HALF_ROAD

// Pre-compute squared radii so checkpoint tests never call Math.sqrt
const CHECKPOINT_RADIUS_SQ = CHECKPOINT_RADIUS * CHECKPOINT_RADIUS
const FINISH_RADIUS_SQ     = FINISH_RADIUS * FINISH_RADIUS

function distToTrackSq(px: number, pz: number): number {
  let min = Infinity
  for (const pt of TRACK_SAMPLES) {
    const dx = px - pt.x, dz = pz - pt.z
    const d = dx * dx + dz * dz
    if (d < min) {
      min = d
      if (d < 1) break  // clearly on track — stop early
    }
  }
  return min
}

export default function Checkpoints({
  playerPosRef,
  nextCheckpoint,
  gamePhase,
  onCheckpointHit,
  onFinishLine,
  onOffRoad,
}: Props) {
  const offRoadState = useRef(false)
  const finishCooldown   = useRef(0)
  const frameCount       = useRef(0)

  useFrame(() => {
    if (gamePhase !== 'racing') return

    const [px, , pz] = playerPosRef.current ?? [0, 0, 0]
    const now = performance.now()

    // ── Checkpoint detection ─────────────────────────────────────────────────
    if (nextCheckpoint < CHECKPOINT_T.length) {
      const cpPos = CHECKPOINT_POSITIONS[nextCheckpoint]
      const dx = px - cpPos.x, dz = pz - cpPos.z
      if (dx * dx + dz * dz < CHECKPOINT_RADIUS_SQ) {
        onCheckpointHit(nextCheckpoint)
      }
    } else {
      // All checkpoints done → check finish line
      if (now > finishCooldown.current) {
        const dx = px - FINISH_POSITION.x, dz = pz - FINISH_POSITION.z
        if (dx * dx + dz * dz < FINISH_RADIUS_SQ) {
          finishCooldown.current = now + 3000  // 3-second cooldown
          onFinishLine()
        }
      }
    }

    // ── Off-road detection (sampled every 10 frames for perf) ────────────────
    frameCount.current++
    if (frameCount.current % 10 === 0) {
      const isOff = distToTrackSq(px, pz) > HALF_ROAD_SQ
      if (isOff !== offRoadState.current) {
        offRoadState.current = isOff
        onOffRoad(isOff)
      }
    }
  })

  // ── Visual checkpoint gates (in-scene, semi-transparent) ──────────────────
  return (
    <group>
      {CHECKPOINT_POSITIONS.map((pos, i) => {
        const tan = trackCurve.getTangent(CHECKPOINT_T[i])
        const rot = Math.atan2(tan.x, tan.z)
        return (
          <group key={i} position={[pos.x, 0, pos.z]} rotation={[0, rot, 0]}>
            {/* Left post */}
            <mesh position={[-8, 4, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 8, 8]} />
              <meshStandardMaterial color={i < nextCheckpoint ? '#22C55E' : '#FFFFFF'} emissive={i < nextCheckpoint ? '#22C55E' : '#888888'} emissiveIntensity={0.4} />
            </mesh>
            {/* Right post */}
            <mesh position={[8, 4, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 8, 8]} />
              <meshStandardMaterial color={i < nextCheckpoint ? '#22C55E' : '#FFFFFF'} emissive={i < nextCheckpoint ? '#22C55E' : '#888888'} emissiveIntensity={0.4} />
            </mesh>
            {/* Top bar */}
            <mesh position={[0, 7.8, 0]}>
              <boxGeometry args={[16.5, 0.5, 0.4]} />
              <meshStandardMaterial
                color={i < nextCheckpoint ? '#22C55E' : '#FFFFFF'}
                emissive={i < nextCheckpoint ? '#22C55E' : '#444444'}
                emissiveIntensity={0.5}
                transparent opacity={0.8}
              />
            </mesh>
            {/* CP number */}
            <pointLight
              position={[0, 6, 0]}
              color={i < nextCheckpoint ? '#22C55E' : '#FFFFFF'}
              intensity={i === nextCheckpoint ? 4 : 1}
              distance={20}
            />
          </group>
        )
      })}
    </group>
  )
}
