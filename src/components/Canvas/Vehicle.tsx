import React, { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import type { VehicleControls } from '../../hooks/useVehicleControls'
import { CAR_COLORS } from '../../lib/constants'
import {
  ENGINE_FORCE, BRAKE_FORCE,
  MAX_SPEED, DOWNFORCE,
  LINEAR_DAMPING, DRIFT_LINEAR_DAMPING,
  GRASS_DAMPING_MULT,
} from '../../lib/gameConstants'

interface TeleportTarget {
  pos: [number, number, number]
  rotY: number
}

interface Props {
  startPosition: [number, number, number]
  startRotationY: number
  controlsRef: React.RefObject<VehicleControls>
  playerPosRef: React.MutableRefObject<[number, number, number]>
  playerQuatRef: React.MutableRefObject<[number, number, number, number]>
  onSpeedChange: (kmh: number) => void
  isOffRoad: boolean
  gamePhase: 'countdown' | 'racing' | 'finished'
  colorIndex: number
  itemBoxPositions: THREE.Vector3[]
  itemBoxAvailableRef: React.MutableRefObject<boolean[]>
  onItemBoxCollected: (index: number) => void
  currentItemRef: React.MutableRefObject<string | null>
  onItemUsed: () => void
  buildingGatePositions: THREE.Vector3[]
  buildingGateAvailableRef: React.MutableRefObject<boolean[]>
  onBuildingGateEntered: (index: number) => void
  teleportTargetRef: React.MutableRefObject<TeleportTarget | null>
  jumpPadPosition: THREE.Vector3
  onReset?: () => void
}

// Re-usable temporaries to avoid per-frame GC allocations
const _fwd       = new THREE.Vector3()
const _vel       = new THREE.Vector3()
const _pos       = new THREE.Vector3()
const _right     = new THREE.Vector3()
const _quat      = new THREE.Quaternion()
const _camTarget = new THREE.Vector3()
const _camPos    = new THREE.Vector3()
const _camOffset = new THREE.Vector3()


export default function Vehicle({
  startPosition,
  startRotationY,
  controlsRef,
  playerPosRef,
  playerQuatRef,
  onSpeedChange,
  isOffRoad,
  gamePhase,
  colorIndex,
  itemBoxPositions,
  itemBoxAvailableRef,
  onItemBoxCollected,
  currentItemRef,
  onItemUsed,
  buildingGatePositions,
  buildingGateAvailableRef,
  onBuildingGateEntered,
  teleportTargetRef,
  jumpPadPosition,
  onReset,
}: Props) {
  const rigidBody = useRef<RapierRigidBody>(null)
  const { camera } = useThree()
  const brakeMat1 = useRef<THREE.MeshStandardMaterial>(null)
  const brakeMat2 = useRef<THREE.MeshStandardMaterial>(null)
  const boostEndRef    = useRef(0)
  const turboEndRef    = useRef(0)
  const jumpPadUsedRef = useRef(false)
  const boostLightRef  = useRef<THREE.PointLight>(null)
  const stuckFramesRef = useRef(0)


  const resetCar = useCallback(() => {
    const rb = rigidBody.current
    if (!rb) return
    rb.setTranslation({ x: startPosition[0], y: startPosition[1] + 0.5, z: startPosition[2] }, true)
    const q = new THREE.Quaternion()
    q.setFromEuler(new THREE.Euler(0, startRotationY, 0))
    rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true)
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }, [startPosition, startRotationY])

  useFrame((state, delta) => {
    const rb = rigidBody.current
    if (!rb) return

    const ctrl = controlsRef.current
    if (!ctrl) return

    // ── Apply scheduled teleport (from building gates) ───────────────────────
    if (teleportTargetRef.current) {
      const { pos, rotY } = teleportTargetRef.current
      teleportTargetRef.current = null
      rb.setTranslation({ x: pos[0], y: pos[1], z: pos[2] }, true)
      const tq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0))
      rb.setRotation({ x: tq.x, y: tq.y, z: tq.z, w: tq.w }, true)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    // ── Reset car ────────────────────────────────────────────────────────────
    if (ctrl.reset) {
      resetCar()
      onReset?.()
      return
    }

    // ── Freeze during countdown ──────────────────────────────────────────────
    if (gamePhase === 'countdown') {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    if (gamePhase === 'finished') return

    // ── Gather physics state ─────────────────────────────────────────────────
    const translation = rb.translation()
    const rotation    = rb.rotation()
    _pos.set(translation.x, translation.y, translation.z)
    _quat.set(rotation.x, rotation.y, rotation.z, rotation.w)

    _fwd.set(0, 0, -1).applyQuaternion(_quat)

    const rawVel = rb.linvel()
    _vel.set(rawVel.x, rawVel.y, rawVel.z)
    const forwardSpeed = _fwd.dot(_vel)
    const speed        = _vel.length()

    // ── Item box pickup (racing only, no item already held) ──────────────────
    if (gamePhase === 'racing' && !currentItemRef.current) {
      itemBoxPositions.forEach((boxPos, i) => {
        if (!itemBoxAvailableRef.current[i]) return
        const dx = translation.x - boxPos.x
        const dz = translation.z - boxPos.z
        if (dx * dx + dz * dz < 6.25) {
          itemBoxAvailableRef.current[i] = false
          onItemBoxCollected(i)
        }
      })
    }

    // ── Building gate proximity check ────────────────────────────────────────
    if (gamePhase === 'racing') {
      buildingGatePositions.forEach((gatePos, i) => {
        if (!buildingGateAvailableRef.current[i]) return
        const dx = translation.x - gatePos.x
        const dy = translation.y - gatePos.y
        const dz = translation.z - gatePos.z
        if (dx * dx + dy * dy + dz * dz < 36) {  // 3D radius 6 — must be physically near the gate ring
          buildingGateAvailableRef.current[i] = false
          onBuildingGateEntered(i)
        }
      })
    }

    // ── Boost multiplier ─────────────────────────────────────────────────────
    const elapsed = state.clock.elapsedTime
    const boostMult = elapsed < turboEndRef.current ? 2.2
                    : elapsed < boostEndRef.current  ? 1.7
                    : 1.0

    // ── Linear damping (friction) ────────────────────────────────────────────
    const offRoadMult = isOffRoad ? GRASS_DAMPING_MULT : 1
    const baseDamp = (ctrl.drift ? DRIFT_LINEAR_DAMPING : LINEAR_DAMPING) * offRoadMult
    rb.setLinearDamping(baseDamp)
    rb.setAngularDamping(0.5)

    // ── Forces (only when racing) ────────────────────────────────────────────
    if (gamePhase === 'racing') {
      const dt = Math.min(delta, 0.05)

      rb.applyImpulse({ x: 0, y: -DOWNFORCE * dt, z: 0 }, true)

      if (ctrl.forward && forwardSpeed < MAX_SPEED * (boostMult > 1 ? boostMult : 1)) {
        const force = ENGINE_FORCE * boostMult * dt
        rb.applyImpulse({ x: _fwd.x * force, y: 0, z: _fwd.z * force }, true)
      }

      if (ctrl.backward) {
        if (forwardSpeed > 1) {
          rb.applyImpulse({ x: -_fwd.x * BRAKE_FORCE * dt, y: 0, z: -_fwd.z * BRAKE_FORCE * dt }, true)
        } else {
          const curLV = rb.linvel()
          rb.setLinearDamping(0)
          rb.setLinvel({ x: -_fwd.x * 12, y: curLV.y, z: -_fwd.z * 12 }, true)
        }
      }

      // ── Steering ────────────────────────────────────────────────────────
      const steerInput  = (ctrl.left ? 1 : 0) - (ctrl.right ? 1 : 0)
      const curAngVel   = rb.angvel()
      const maxTurnRate = ctrl.drift ? 3.2 : 2.5
      const speedFactor    = Math.max(0.3, Math.min(speed / 6, 1))
      const targetAngVelY  = steerInput * maxTurnRate * speedFactor
      const lerpRate       = steerInput !== 0 ? 0.3 : 0.15
      rb.setAngvel({ x: 0, y: curAngVel.y + (targetAngVelY - curAngVel.y) * lerpRate, z: 0 }, true)

      // ── Item use (E / Shift) ─────────────────────────────────────────────
      if (ctrl.useItem && currentItemRef.current) {
        const item = currentItemRef.current
        ctrl.useItem = false
        onItemUsed()
        if (item === 'boost') {
          boostEndRef.current = state.clock.elapsedTime + 3
        } else if (item === 'turbo') {
          turboEndRef.current = state.clock.elapsedTime + 5
        } else if (item === 'jump') {
          rb.applyImpulse({ x: _fwd.x * 250, y: 700, z: _fwd.z * 250 }, true)
        }
      }

      // ── Jump pad ────────────────────────────────────────────────────────
      const jdx = translation.x - jumpPadPosition.x
      const jdz = translation.z - jumpPadPosition.z
      if (!jumpPadUsedRef.current && jdx * jdx + jdz * jdz < 16) {
        jumpPadUsedRef.current = true
        rb.applyImpulse({ x: _fwd.x * 180, y: 500, z: _fwd.z * 180 }, true)
        setTimeout(() => { jumpPadUsedRef.current = false }, 3000)
      }

      // ── Lateral friction ─────────────────────────────────────────────────
      if (!ctrl.drift) {
        _right.set(1, 0, 0).applyQuaternion(_quat)
        const lateralVel = _right.dot(_vel)
        rb.applyImpulse({
          x: -_right.x * lateralVel * 14 * dt,
          y: 0,
          z: -_right.z * lateralVel * 14 * dt,
        }, true)
      }

      // ── Stuck detection: if input pressed but car isn't moving, nudge free ──
      const anyInput = ctrl.forward || ctrl.backward || ctrl.left || ctrl.right
      if (anyInput && speed < 0.4) {
        stuckFramesRef.current++
        if (stuckFramesRef.current > 25) {
          stuckFramesRef.current = 0
          rb.setLinearDamping(0)
          // Kick slightly backward + up to break contact with wall or ground
          rb.setLinvel({ x: -_fwd.x * 3, y: 1.5, z: -_fwd.z * 3 }, true)
        }
      } else {
        stuckFramesRef.current = 0
      }

    } else {
      const curAngVel = rb.angvel()
      rb.setAngvel({ x: 0, y: curAngVel.y * 0.8, z: 0 }, true)
    }

    // ── Brake-light visual ───────────────────────────────────────────────────
    const braking = ctrl.backward
    ;[brakeMat1.current, brakeMat2.current].forEach(mat => {
      if (!mat) return
      mat.emissive.set(braking ? '#FFFFFF' : '#FF2200')
      mat.emissiveIntensity = braking ? 6 : 1.5
    })
    if (boostLightRef.current) {
      boostLightRef.current.intensity = boostMult > 1 ? (boostMult > 2 ? 12 : 6) : 0
    }

    // ── Export state ─────────────────────────────────────────────────────────
    playerPosRef.current  = [translation.x, translation.y, translation.z]
    playerQuatRef.current = [rotation.x, rotation.y, rotation.z, rotation.w]
    onSpeedChange(speed * 3.6)

    // ── Camera follow ────────────────────────────────────────────────────────
    const camDist = ctrl.drift ? 16 : 14
    _camOffset.set(0, 5.5, camDist).applyQuaternion(_quat)
    _camPos.copy(_pos).add(_camOffset)
    camera.position.lerp(_camPos, 0.08)
    _camTarget.copy(_pos)
    _camTarget.y += 1.5
    camera.lookAt(_camTarget)
  })

  const color = CAR_COLORS[colorIndex] ?? '#FF5F00'

  return (
    <RigidBody
      ref={rigidBody}
      type="dynamic"
      colliders={false}
      enabledRotations={[false, true, false]}
      mass={450}
      linearDamping={LINEAR_DAMPING}
      angularDamping={0.5}
      position={startPosition}
      rotation={[0, startRotationY, 0]}
      restitution={0.3}
      friction={0.3}
      ccd={true}
    >
      {/* Collision box — slightly inset from visual mesh */}
      <CuboidCollider args={[0.9, 0.35, 1.45]} position={[0, 0.35, 0]} />

      {/* ── Car mesh ──────────────────────────────────────────────────── */}
      <group>
        {/* ── Body panels ───────────────────────────────────────────── */}
        {/* Lower chassis / sills */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[2.0, 0.44, 4.2]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.35} />
        </mesh>

        {/* Hood */}
        <mesh position={[0, 0.48, -1.5]} rotation={[0.07, 0, 0]} castShadow>
          <boxGeometry args={[1.88, 0.1, 1.3]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
        </mesh>

        {/* Trunk lid */}
        <mesh position={[0, 0.46, 1.55]} rotation={[-0.05, 0, 0]} castShadow>
          <boxGeometry args={[1.88, 0.1, 0.9]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
        </mesh>

        {/* Cabin / greenhouse */}
        <mesh position={[0, 0.72, 0.05]} castShadow>
          <boxGeometry args={[1.72, 0.52, 2.1]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.3} />
        </mesh>

        {/* Roof */}
        <mesh position={[0, 1.0, 0.05]} castShadow>
          <boxGeometry args={[1.66, 0.12, 1.9]} />
          <meshStandardMaterial color={color} roughness={0.28} metalness={0.4} />
        </mesh>

        {/* Front bumper */}
        <mesh position={[0, 0.2, -2.2]} castShadow>
          <boxGeometry args={[1.98, 0.32, 0.22]} />
          <meshStandardMaterial color="#111111" roughness={0.7} />
        </mesh>

        {/* Front grille */}
        <mesh position={[0, 0.27, -2.22]}>
          <boxGeometry args={[1.1, 0.18, 0.04]} />
          <meshStandardMaterial color="#222222" roughness={0.8} metalness={0.3} />
        </mesh>

        {/* Rear bumper */}
        <mesh position={[0, 0.2, 2.2]} castShadow>
          <boxGeometry args={[1.98, 0.32, 0.22]} />
          <meshStandardMaterial color="#111111" roughness={0.7} />
        </mesh>

        {/* Rear diffuser */}
        <mesh position={[0, 0.1, 2.22]}>
          <boxGeometry args={[1.2, 0.12, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>

        {/* ── Windows ───────────────────────────────────────────────── */}
        {/* Windshield */}
        <mesh position={[0, 0.84, -0.92]} rotation={[-0.52, 0, 0]}>
          <planeGeometry args={[1.55, 0.72]} />
          <meshStandardMaterial color="#7EC8E3" transparent opacity={0.45} side={2} metalness={0.1} />
        </mesh>

        {/* Rear window */}
        <mesh position={[0, 0.84, 1.02]} rotation={[0.52, 0, 0]}>
          <planeGeometry args={[1.55, 0.58]} />
          <meshStandardMaterial color="#7EC8E3" transparent opacity={0.45} side={2} metalness={0.1} />
        </mesh>

        {/* Left side window */}
        <mesh position={[-0.87, 0.8, 0.05]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.65, 0.44]} />
          <meshStandardMaterial color="#7EC8E3" transparent opacity={0.4} side={2} />
        </mesh>

        {/* Right side window */}
        <mesh position={[0.87, 0.8, 0.05]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.65, 0.44]} />
          <meshStandardMaterial color="#7EC8E3" transparent opacity={0.4} side={2} />
        </mesh>

        {/* ── Lights ────────────────────────────────────────────────── */}
        {/* Headlights — slim LED bar style */}
        <mesh position={[-0.62, 0.37, -2.21]}>
          <boxGeometry args={[0.5, 0.1, 0.04]} />
          <meshStandardMaterial color="#FFFFCC" emissive="#FFFF99" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[0.62, 0.37, -2.21]}>
          <boxGeometry args={[0.5, 0.1, 0.04]} />
          <meshStandardMaterial color="#FFFFCC" emissive="#FFFF99" emissiveIntensity={2.5} />
        </mesh>

        {/* Tail lights — brake indicator */}
        <mesh position={[-0.62, 0.37, 2.21]}>
          <boxGeometry args={[0.5, 0.1, 0.04]} />
          <meshStandardMaterial ref={brakeMat1} color="#FF2200" emissive="#FF2200" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0.62, 0.37, 2.21]}>
          <boxGeometry args={[0.5, 0.1, 0.04]} />
          <meshStandardMaterial ref={brakeMat2} color="#FF2200" emissive="#FF2200" emissiveIntensity={1.5} />
        </mesh>

        {/* ── Wheels + rims ─────────────────────────────────────────── */}
        {/* Front-left tyre */}
        <mesh position={[-1.1, 0, -1.25]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 14]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
        </mesh>
        <mesh position={[-1.27, 0, -1.25]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.06, 10]} />
          <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Front-right tyre */}
        <mesh position={[1.1, 0, -1.25]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 14]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
        </mesh>
        <mesh position={[1.27, 0, -1.25]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.06, 10]} />
          <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Rear-left tyre */}
        <mesh position={[-1.1, 0, 1.25]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.44, 0.44, 0.34, 14]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
        </mesh>
        <mesh position={[-1.28, 0, 1.25]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.06, 10]} />
          <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Rear-right tyre */}
        <mesh position={[1.1, 0, 1.25]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.44, 0.44, 0.34, 14]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
        </mesh>
        <mesh position={[1.28, 0, 1.25]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.06, 10]} />
          <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Exhaust glow */}
        <pointLight position={[0, 0.25, 2.2]} color="#FF6600" intensity={1.5} distance={3} />

        {/* Boost glow light — intensity controlled in useFrame */}
        <pointLight ref={boostLightRef} color="#FF5F00" intensity={0} distance={12} decay={2} position={[0, 0.5, 0]} />
      </group>
    </RigidBody>
  )
}
