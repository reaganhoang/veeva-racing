import React from 'react'
import { Text } from '@react-three/drei'

export default function VeevaArch() {
  return (
    <group position={[0, 0, 65]}>
      {/* Left pillar at Z=-9 */}
      <mesh position={[0, 4.5, -9]} castShadow>
        <boxGeometry args={[1.4, 9, 1.4]} />
        <meshStandardMaterial color="#0B192C" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Right pillar at Z=+9 */}
      <mesh position={[0, 4.5, 9]} castShadow>
        <boxGeometry args={[1.4, 9, 1.4]} />
        <meshStandardMaterial color="#0B192C" metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Orange crossbar spanning both pillars */}
      <mesh position={[0, 9.5, 0]} castShadow>
        <boxGeometry args={[1.5, 2.2, 20]} />
        <meshStandardMaterial color="#FF5F00" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Text on the crossbar facing the approaching kart (−X direction) */}
      <Text
        position={[-0.9, 9.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={1.8}
        color="white"
        outlineColor="#0B192C"
        outlineWidth={0.05}
        anchorX="center"
        anchorY="middle"
      >
        VEEVA RACING
      </Text>

      {/* Accent bands on left pillar */}
      <mesh position={[0, 2.5, -9]}>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        <meshStandardMaterial color="#FF5F00" />
      </mesh>
      <mesh position={[0, 7.5, -9]}>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        <meshStandardMaterial color="#FF5F00" />
      </mesh>

      {/* Accent bands on right pillar */}
      <mesh position={[0, 2.5, 9]}>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        <meshStandardMaterial color="#FF5F00" />
      </mesh>
      <mesh position={[0, 7.5, 9]}>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        <meshStandardMaterial color="#FF5F00" />
      </mesh>

      {/* Top glow light */}
      <pointLight position={[0, 12, 0]} color="#FF5F00" intensity={5} distance={22} />
    </group>
  )
}
