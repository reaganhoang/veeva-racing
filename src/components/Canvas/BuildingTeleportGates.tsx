import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// One teleport portal ring per building, floating above its rooftop.
//   Gate 0 – Veeva HQ          [0,   22, -20]  (roof y=18, gate center +4)
//   Gate 1 – Bay Area Fencing  [55,  12, -30]  (roof y=8,  gate center +4)
//   Gate 2 – Smile Solutions   [-55, 14, -30]  (roof y=10, gate center +4)
//   Gate 3 – Pulte Mortgage    [20,  16, -46]  (roof y=12, gate center +4)

type GateDef = { x: number; y: number; z: number }

const GATE_DEFS: GateDef[] = [
  { x: 0,   y: 22, z: -20 },
  { x: 55,  y: 12, z: -30 },
  { x: -55, y: 14, z: -30 },
  { x: 20,  y: 16, z: -46 },
]

export const BUILDING_GATE_COUNT = GATE_DEFS.length

// Vehicle detection uses XZ distance only; y value here is unused for detection
export const BUILDING_GATE_POSITIONS: THREE.Vector3[] = GATE_DEFS.map(
  g => new THREE.Vector3(g.x, g.y, g.z)
)

interface Props {
  availableRef: React.MutableRefObject<boolean[]>
}

export default function BuildingTeleportGates({ availableRef }: Props) {
  const gateRefs = useRef<(THREE.Group | null)[]>(Array(BUILDING_GATE_COUNT).fill(null))
  const discRefs = useRef<(THREE.Mesh | null)[]>(Array(BUILDING_GATE_COUNT).fill(null))

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    gateRefs.current.forEach((grp, i) => {
      if (!grp) return
      grp.visible = availableRef.current[i]
      if (!grp.visible) return
      // Gentle float
      grp.position.y = GATE_DEFS[i].y + Math.sin(time * 0.9 + i * 1.5) * 0.3
      // Slow spin around Y axis
      grp.rotation.y += delta * 0.4
    })
    // Spin the inner disc around local Z
    discRefs.current.forEach(disc => {
      if (!disc) return
      disc.rotation.z += delta * 0.8
    })
  })

  return (
    <>
      {GATE_DEFS.map((def, i) => (
        <group
          key={i}
          ref={el => { gateRefs.current[i] = el }}
          position={[def.x, def.y, def.z]}
        >
          {/* Outer ring */}
          <mesh>
            <torusGeometry args={[3, 0.42, 16, 80]} />
            <meshStandardMaterial
              color="#9B30FF"
              emissive="#6600DD"
              emissiveIntensity={1.8}
              metalness={0.6}
              roughness={0.15}
            />
          </mesh>
          {/* Thin halo ring */}
          <mesh scale={[1.14, 1.14, 1]}>
            <torusGeometry args={[3, 0.16, 12, 80]} />
            <meshStandardMaterial
              color="#CC88FF"
              emissive="#9922FF"
              emissiveIntensity={1.2}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Swirling portal disc */}
          <mesh ref={el => { discRefs.current[i] = el }}>
            <circleGeometry args={[2.58, 64]} />
            <meshStandardMaterial
              color="#CC44FF"
              emissive="#7700CC"
              emissiveIntensity={0.9}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Purple glow */}
          <pointLight color="#9B30FF" intensity={5} distance={14} decay={2} />
        </group>
      ))}
    </>
  )
}
