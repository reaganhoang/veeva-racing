import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { ASPHALT_COLOR, GRASS_COLOR, CURB_RED, CURB_WHITE, VEEVA_ORANGE } from '../../lib/constants'
import { TRACK_POINTS, ROAD_WIDTH, TRACK_SEGMENTS } from '../../lib/gameConstants'

// ── Build a smooth closed CatmullRom curve ────────────────────────────────────
export const trackCurve = new THREE.CatmullRomCurve3(TRACK_POINTS, true, 'catmullrom', 0.5)

// Pre-sampled points for off-road detection (done once at module load)
export const TRACK_SAMPLES = trackCurve.getPoints(600)

// ── Road mesh generator ───────────────────────────────────────────────────────
function buildRoadGeometry(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  halfWidth: number,
  yOffset = 0.02
) {
  const positions: number[] = []
  const normals: number[]   = []
  const uvs: number[]       = []
  const indices: number[]   = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const pt  = curve.getPoint(t)
    const tan = curve.getTangent(t).normalize()
    const side = new THREE.Vector3(-tan.z, 0, tan.x) // perpendicular (XZ plane)

    const left  = pt.clone().addScaledVector(side, -halfWidth)
    const right = pt.clone().addScaledVector(side,  halfWidth)

    positions.push(left.x,  yOffset, left.z)
    positions.push(right.x, yOffset, right.z)
    normals.push(0, 1, 0, 0, 1, 0)
    uvs.push(0, t * 20, 1, t * 20)
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1
    indices.push(a, c, b, b, c, d)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  return geo
}

// ── Curb stripe geometry (alternating red / white along edge) ─────────────────
function buildCurbGeometry(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  side: -1 | 1,
  halfWidth: number,
  curbW = 1.2
) {
  const positions: number[] = []
  const colors: number[]    = []
  const indices: number[]   = []

  const redCol   = new THREE.Color(CURB_RED)
  const whiteCol = new THREE.Color(CURB_WHITE)

  for (let i = 0; i <= segments; i++) {
    const t   = i / segments
    const pt  = curve.getPoint(t)
    const tan = curve.getTangent(t).normalize()
    const perp = new THREE.Vector3(-tan.z, 0, tan.x)

    const inner = pt.clone().addScaledVector(perp, side * halfWidth)
    const outer = pt.clone().addScaledVector(perp, side * (halfWidth + curbW))

    positions.push(inner.x, 0.14, inner.z)
    positions.push(outer.x, 0.14, outer.z)

    const col = Math.floor(t * 60) % 2 === 0 ? redCol : whiteCol
    colors.push(col.r, col.g, col.b, col.r, col.g, col.b)
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1
    indices.push(a, c, b, b, c, d)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3))
  geo.setIndex(indices)
  return geo
}

// ── Barrier wall builder ──────────────────────────────────────────────────────
function buildBarrierPositions(
  curve: THREE.CatmullRomCurve3,
  numWalls: number,
  side: -1 | 1,
  halfWidth: number,
  wallSpacing = 3
): { pos: THREE.Vector3; rot: number }[] {
  const walls: { pos: THREE.Vector3; rot: number }[] = []
  const step = 1 / numWalls
  for (let i = 0; i < numWalls; i++) {
    const t   = i * step
    const pt  = curve.getPoint(t)
    const tan = curve.getTangent(t)
    const perp = new THREE.Vector3(-tan.z, 0, tan.x)
    const pos = pt.clone().addScaledVector(perp, side * (halfWidth + 0.6))
    const rot = Math.atan2(tan.x, tan.z)
    walls.push({ pos, rot })
  }
  return walls
}


// ── Main Track component ──────────────────────────────────────────────────────
export default function Track() {
  const {
    roadGeo,
    curbLeftGeo,
    curbRightGeo,
    barrierLeft,
    barrierRight,
  } = useMemo(() => {
    const half = ROAD_WIDTH / 2
    const roadGeo      = buildRoadGeometry(trackCurve, TRACK_SEGMENTS, half, 0.12)
    const curbLeftGeo  = buildCurbGeometry(trackCurve, TRACK_SEGMENTS, -1, half)
    const curbRightGeo = buildCurbGeometry(trackCurve, TRACK_SEGMENTS,  1, half)
    const barrierLeft  = buildBarrierPositions(trackCurve, 100, -1, half)
    const barrierRight = buildBarrierPositions(trackCurve, 100,  1, half)
    return { roadGeo, curbLeftGeo, curbRightGeo, barrierLeft, barrierRight }
  }, [])

  return (
    <group>
      {/* ── Ground (grass) ─────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color={GRASS_COLOR} roughness={0.9} />
      </mesh>

      {/* ── Road surface ────────────────────────────────────────────────── */}
      <mesh geometry={roadGeo} receiveShadow>
        <meshStandardMaterial
          color={ASPHALT_COLOR}
          roughness={0.85}
          metalness={0.05}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-4}
        />
      </mesh>

      {/* ── Curbs ───────────────────────────────────────────────────────── */}
      <mesh geometry={curbLeftGeo}>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </mesh>
      <mesh geometry={curbRightGeo}>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </mesh>

      {/* ── Barrier walls (physics + visual) ────────────────────────────── */}
      {barrierLeft.map((b, i) => (
        <RigidBody key={`bl-${i}`} type="fixed" position={[b.pos.x, 0.5, b.pos.z]} rotation={[0, b.rot, 0]} friction={0} restitution={0.5}>
          <CuboidCollider args={[1.5, 0.5, 0.25]} />
          <mesh>
            <boxGeometry args={[3, 1, 0.4]} />
            <meshStandardMaterial color="#CC2200" roughness={0.6} />
          </mesh>
        </RigidBody>
      ))}
      {barrierRight.map((b, i) => (
        <RigidBody key={`br-${i}`} type="fixed" position={[b.pos.x, 0.5, b.pos.z]} rotation={[0, b.rot, 0]} friction={0} restitution={0.5}>
          <CuboidCollider args={[1.5, 0.5, 0.25]} />
          <mesh>
            <boxGeometry args={[3, 1, 0.4]} />
            <meshStandardMaterial color="#CC2200" roughness={0.6} />
          </mesh>
        </RigidBody>
      ))}

      {/* ── Start / Finish line ─────────────────────────────────────────── */}
      <StartFinishLine />

      {/* ── Veeva branding ──────────────────────────────────────────────── */}
      <VeevaArch />
    </group>
  )
}

// ── Start/Finish line checkered strip ─────────────────────────────────────────
function StartFinishLine() {
  const startPt  = trackCurve.getPoint(0)
  const startTan = trackCurve.getTangent(0).normalize()
  const rot = Math.atan2(startTan.x, startTan.z)

  return (
    <group position={[startPt.x, 0.04, startPt.z]} rotation={[0, rot, 0]}>
      {/* Checkered boxes */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} position={[(i - 7) * 1, 0, 0]}>
          <boxGeometry args={[1, 0.02, 3]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#ffffff' : '#111111'} />
        </mesh>
      ))}
    </group>
  )
}

// ── Arch + VEEVA text over start line ─────────────────────────────────────────
function VeevaArch() {
  const startPt  = trackCurve.getPoint(0)
  const startTan = trackCurve.getTangent(0).normalize()
  const rot = Math.atan2(startTan.x, startTan.z)

  return (
    <group position={[startPt.x, 0, startPt.z]} rotation={[0, rot, 0]}>
      {/* Left pillar */}
      <mesh position={[-9, 4, 0]} castShadow>
        <boxGeometry args={[1.5, 8, 1.5]} />
        <meshStandardMaterial color={VEEVA_ORANGE} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[9, 4, 0]} castShadow>
        <boxGeometry args={[1.5, 8, 1.5]} />
        <meshStandardMaterial color={VEEVA_ORANGE} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, 8.5, 0]} castShadow>
        <boxGeometry args={[20, 1.5, 1.2]} />
        <meshStandardMaterial color={VEEVA_ORANGE} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* VEEVA text */}
      <Text
        position={[0, 9.8, 0]}
        fontSize={2.8}
        color="#FFFFFF"
        font={undefined}
        anchorX="center"
        anchorY="middle"
      >
        VEEVA RACING
      </Text>
      {/* Glow lights */}
      <pointLight position={[-9, 9, 0]} color={VEEVA_ORANGE} intensity={3} distance={15} />
      <pointLight position={[ 9, 9, 0]} color={VEEVA_ORANGE} intensity={3} distance={15} />
    </group>
  )
}
