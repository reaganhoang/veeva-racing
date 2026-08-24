import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { trackCurve } from './Track'

const BOX_T_VALUES = [0.05, 0.20, 0.38, 0.52, 0.70, 0.87]
const BOX_HEIGHT = 1.5

export const ITEM_BOX_COUNT = 6

export const ITEM_BOX_POSITIONS: THREE.Vector3[] = BOX_T_VALUES.map(t => {
  const pt = trackCurve.getPoint(t)
  return new THREE.Vector3(pt.x, BOX_HEIGHT, pt.z)
})

interface Props {
  availableRef: React.MutableRefObject<boolean[]>
}

export default function ItemBoxes({ availableRef }: Props) {
  const groupRefs = useRef<(THREE.Group | null)[]>(Array(ITEM_BOX_COUNT).fill(null))

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    groupRefs.current.forEach((grp, i) => {
      if (!grp) return
      grp.visible = availableRef.current[i]
      if (!grp.visible) return
      grp.rotation.y += delta * 1.8
      grp.position.y = BOX_HEIGHT + Math.sin(time * 1.5 + i) * 0.15
    })
  })

  return (
    <>
      {ITEM_BOX_POSITIONS.map((pos, i) => (
        <group
          key={i}
          ref={el => { groupRefs.current[i] = el }}
          position={[pos.x, pos.y, pos.z]}
        >
          {/* Outer orange cube */}
          <mesh>
            <boxGeometry args={[1.4, 1.4, 1.4]} />
            <meshStandardMaterial
              color="#FF5F00"
              metalness={0.4}
              roughness={0.2}
              emissive="#FF5F00"
              emissiveIntensity={0.4}
            />
          </mesh>
          {/* Inner navy cube */}
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial color="#0B192C" metalness={0.6} />
          </mesh>
          {/* Wireframe overlay */}
          <mesh>
            <boxGeometry args={[1.42, 1.42, 1.42]} />
            <meshStandardMaterial color="white" wireframe />
          </mesh>
          {/* Glow light */}
          <pointLight color="#FF5F00" intensity={2} distance={5} />
        </group>
      ))}
    </>
  )
}
