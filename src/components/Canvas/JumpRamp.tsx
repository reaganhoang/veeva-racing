import React from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

export const JUMP_PAD_POSITION = new THREE.Vector3(94, 0, 14)

export default function JumpRamp() {
  return (
    <group>
      {/* Main ramp surface — low entry at +Z side, kart launches off −Z side */}
      <mesh position={[94, 0.5, 16]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[13, 0.5, 7]} />
        <meshStandardMaterial color="#FF5F00" emissive="#FF5F00" emissiveIntensity={0.3} />
      </mesh>

      {/* Approach arrow stripes (kart passes over these before the ramp) */}
      <mesh position={[94, 0.02, 24]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 1.5]} />
        <meshStandardMaterial color="#FF5F00" />
      </mesh>
      <mesh position={[94, 0.02, 26]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 1.5]} />
        <meshStandardMaterial color="#FF5F00" />
      </mesh>
      <mesh position={[94, 0.02, 28]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 1.5]} />
        <meshStandardMaterial color="#FF5F00" />
      </mesh>

      {/* Label visible to the approaching kart */}
      <Text
        position={[94, 3, 20]}
        rotation={[0, 0, 0]}
        fontSize={1.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        LAUNCH ZONE
      </Text>

      <pointLight position={[94, 3, 16]} color="#FF5F00" intensity={4} distance={15} />
    </group>
  )
}
