import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { VEEVA_ORANGE, VEEVA_NAVY } from '../../lib/constants'

// Shared geometry + material for all building windows — created once, reused via InstancedMesh
const WINDOW_GEO = new THREE.PlaneGeometry(2.2, 1.8)
const WINDOW_MAT = new THREE.MeshStandardMaterial({
  color: '#7EC8E3',
  emissive: '#3A8FB5',
  emissiveIntensity: 0.3,
  transparent: true,
  opacity: 0.8,
})

interface BuildingProps {
  position: [number, number, number]
  size: [number, number, number]   // [width, height, depth]
  color: string
  label?: string
  labelColor?: string
}

function Building({ position, size, color, label, labelColor = '#FFFFFF' }: BuildingProps) {
  const [w, h, d] = size
  const rows = Math.floor(h / 3)
  const cols = Math.floor(w / 4)

  // Replace N×M individual window planes with a single InstancedMesh (one draw call)
  const windowMesh = useMemo(() => {
    const count = rows * cols
    if (count === 0) return null
    const dummy = new THREE.Object3D()
    const mesh  = new THREE.InstancedMesh(WINDOW_GEO, WINDOW_MAT, count)
    let idx = 0
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        dummy.position.set(-w / 2 + 2 + col * 4, -h / 2 + 1.5 + row * 3, d / 2 + 0.05)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx++, dummy.matrix)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }, [w, h, d, rows, cols])

  return (
    <RigidBody type="fixed" position={[position[0], h / 2, position[2]]}>
      <CuboidCollider args={[w / 2, h / 2, d / 2]} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Roof trim */}
      <mesh position={[0, h / 2 + 0.25, 0]}>
        <boxGeometry args={[w + 0.4, 0.5, d + 0.4]} />
        <meshStandardMaterial color={VEEVA_ORANGE} roughness={0.5} />
      </mesh>
      {/* Windows — single InstancedMesh replaces individual planes */}
      {windowMesh && <primitive object={windowMesh} />}
      {/* Label sign */}
      {label && (
        <Text
          position={[0, h / 2 + 1.5, d / 2 + 0.1]}
          fontSize={1.4}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={w - 2}
        >
          {label}
        </Text>
      )}
    </RigidBody>
  )
}

function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.3, 5, 8]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} />
      </mesh>
      {/* Fronds */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(angle * Math.PI / 180) * 2.5,
            2.5,
            Math.cos(angle * Math.PI / 180) * 2.5,
          ]}
          rotation={[0.6, angle * Math.PI / 180, 0]}
        >
          <coneGeometry args={[1.2, 2.5, 4]} />
          <meshStandardMaterial color="#2D7A2D" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Flagpole({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.08, 12, 8]} />
        <meshStandardMaterial color="#AAAAAA" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.2, 4, 0]}>
        <planeGeometry args={[2.4, 1.4]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
    </group>
  )
}

// Road surface tile with asphalt material
function RoadSlab({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#606270" roughness={0.85} metalness={0.05} />
    </mesh>
  )
}

// Curb stripe along an infield road edge
function InfieldCurb({ x, z, length, axis }: { x: number; z: number; length: number; axis: 'x' | 'z' }) {
  const segments = Math.floor(length / 3)
  return (
    <group>
      {Array.from({ length: segments }).map((_, i) => {
        const isRed = i % 2 === 0
        const px = axis === 'x' ? x - length / 2 + (i + 0.5) * (length / segments) : x
        const pz = axis === 'z' ? z - length / 2 + (i + 0.5) * (length / segments) : z
        const w  = axis === 'x' ? length / segments : 1.0
        const d  = axis === 'z' ? length / segments : 1.0
        return (
          <mesh key={i} position={[px, 0.04, pz]}>
            <boxGeometry args={[w, 0.08, d]} />
            <meshStandardMaterial color={isRed ? '#CC2200' : '#EEEEEE'} roughness={0.7} />
          </mesh>
        )
      })}
    </group>
  )
}

function InfieldRoads() {
  // Road half-width for infield roads
  const rw = 7

  return (
    <group>
      {/*
        Infield road layout — top-down view (Z increases toward camera/south):
        ┌─────────────────────── Main track ───────────────────────────────┐
        │                                                                   │
        │   East alley (X=35)    West alley (X=-35)                        │
        │   both run Z=0 → Z=-32                                           │
        │                                                                   │
        │        ┌─────┐         ┌─────┐                                   │
        │        │     │         │     │                                   │
        │        │  2  │ B1 HQ   │  3  │                                   │
        │        │     │         │     │                                   │
        │        └─────┘         └─────┘                                   │
        │   ═══════ south connector at Z=-38 ════════                      │
        │                  [4]    [5]  [6]                                 │
        └──────────────────────────────────────────────────────────────────┘

        Shortcut road at Z=0 cuts east-west through the full infield.
      */}

      {/* ── East-west shortcut road (Z=0, connects east & west straights) ── */}
      {/* Main slab */}
      <RoadSlab position={[0, 0.04, 0]} size={[178, 0.08, rw * 2]} />
      {/* Curbs */}
      <InfieldCurb x={0} z={rw}      length={178} axis="x" />
      <InfieldCurb x={0} z={-rw}     length={178} axis="x" />

      {/* ── East alley: between Veeva HQ (east X=25) & Bay Area Fencing (west X=44) ── */}
      {/* HQ east face = 25, Bay Area west face = 44 → center at X=34.5, width=6 */}
      <RoadSlab position={[34.5, 0.04, -16]} size={[6, 0.08, 32]} />
      <InfieldCurb x={34.5 - 3} z={-16} length={32} axis="z" />
      <InfieldCurb x={34.5 + 3} z={-16} length={32} axis="z" />

      {/* ── West alley: between Veeva HQ (west X=-25) & Smile Solutions (east X=-45) ── */}
      <RoadSlab position={[-35, 0.04, -16]} size={[6, 0.08, 32]} />
      <InfieldCurb x={-35 - 3} z={-16} length={32} axis="z" />
      <InfieldCurb x={-35 + 3} z={-16} length={32} axis="z" />

      {/* ── South connector: behind Veeva HQ, links east & west alleys ── */}
      {/* HQ south face = -32, Bay Area south = -38 → connector at Z=-38 */}
      {/* Span from east alley (X=34.5) to west alley (X=-35): total ~70 units */}
      <RoadSlab position={[0, 0.04, -38]} size={[76, 0.08, 6]} />
      <InfieldCurb x={0} z={-38 - 3} length={76} axis="x" />
      <InfieldCurb x={0} z={-38 + 3} length={76} axis="x" />

      {/* Junction pads — smooth the corners where roads meet */}
      <RoadSlab position={[34.5, 0.04, 0]}   size={[6, 0.08, rw * 2]} />  {/* east alley meets shortcut */}
      <RoadSlab position={[-35,  0.04, 0]}   size={[6, 0.08, rw * 2]} />  {/* west alley meets shortcut */}
      <RoadSlab position={[34.5, 0.04, -38]} size={[6, 0.08, 6]} />       {/* east alley meets south connector */}
      <RoadSlab position={[-35,  0.04, -38]} size={[6, 0.08, 6]} />       {/* west alley meets south connector */}
    </group>
  )
}

export default function Buildings() {
  return (
    <group>
      {/* ── Main Veeva Systems HQ (Building 1) ─────────────────────────── */}
      <Building
        position={[0, 0, -20]}
        size={[50, 18, 24]}
        color={VEEVA_NAVY}
        label="VEEVA SYSTEMS"
        labelColor={VEEVA_ORANGE}
      />

      {/* ── Bay Area Fencing Club (Building 2) ──────────────────────────── */}
      <Building
        position={[55, 0, -30]}
        size={[22, 8, 16]}
        color="#3A3A4A"
        label="BAY AREA FENCING"
        labelColor="#FFFFFF"
      />

      {/* ── Smile Solutions (Building 3) ─────────────────────────────────── */}
      <Building
        position={[-55, 0, -30]}
        size={[20, 10, 16]}
        color="#2A4A3A"
        label="SMILE SOLUTIONS"
        labelColor="#FFFFFF"
      />

      {/* ── Pulte Mortgage (Building 4) ──────────────────────────────────── */}
      <Building
        position={[20, 0, -46]}
        size={[18, 12, 14]}
        color="#4A3A2A"
        label="PULTE MORTGAGE"
        labelColor="#FFFFFF"
      />


      {/* ── Parking structure hint ───────────────────────────────────────── */}
      <mesh position={[40, 0.1, 20]} receiveShadow>
        <boxGeometry args={[30, 0.2, 20]} />
        <meshStandardMaterial color="#444455" roughness={0.9} />
      </mesh>
      <mesh position={[-40, 0.1, 20]} receiveShadow>
        <boxGeometry args={[25, 0.2, 18]} />
        <meshStandardMaterial color="#444455" roughness={0.9} />
      </mesh>

      {/* ── Decorative elements ──────────────────────────────────────────── */}
      {/* Flagpoles */}
      <Flagpole position={[30, 0, 50]}  color={VEEVA_ORANGE} />
      <Flagpole position={[-30, 0, 50]} color={VEEVA_ORANGE} />
      <Flagpole position={[0, 0, 45]}   color="#FFFFFF" />

      {/* Palm trees around the infield */}
      <PalmTree position={[30, 5, -5]}  />
      <PalmTree position={[-30, 5, -5]} />
      <PalmTree position={[0, 5, 0]}    />
      <PalmTree position={[45, 5, -50]} />
      <PalmTree position={[-45, 5, -50]}/>

      {/* ── Infield road network ─────────────────────────────────────────── */}
      <InfieldRoads />

      {/* ── Grandstands (south side) ─────────────────────────────────────── */}
      <mesh position={[0, 2, 88]} castShadow>
        <boxGeometry args={[80, 4, 8]} />
        <meshStandardMaterial color="#1A2A3A" roughness={0.8} />
      </mesh>
      {/* Grandstand rows */}
      {[0, 1, 2, 3].map(row => (
        <mesh key={row} position={[0, 0.5 + row * 1.2, 84 + row * 1.5]} receiveShadow>
          <boxGeometry args={[78, 0.3, 1.2]} />
          <meshStandardMaterial color="#2A4A6A" roughness={0.9} />
        </mesh>
      ))}

      {/* ── Large Veeva billboard (north infield) ─────────────────────────── */}
      <group position={[0, 0, -35]}>
        <mesh position={[0, 12, 0]}>
          <boxGeometry args={[28, 8, 0.4]} />
          <meshStandardMaterial color={VEEVA_NAVY} roughness={0.6} />
        </mesh>
        <Text
          position={[0, 12, 0.3]}
          fontSize={3.5}
          color={VEEVA_ORANGE}
          anchorX="center"
          anchorY="middle"
        >
          VEEVA
        </Text>
        {/* Support poles */}
        <mesh position={[-10, 6, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 12, 8]} />
          <meshStandardMaterial color="#555555" metalness={0.5} />
        </mesh>
        <mesh position={[10, 6, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 12, 8]} />
          <meshStandardMaterial color="#555555" metalness={0.5} />
        </mesh>
      </group>
    </group>
  )
}
