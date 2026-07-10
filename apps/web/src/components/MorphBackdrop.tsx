import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { useRef } from 'react'
import type { Mesh } from 'three'

function Spinner() {
  const ref = useRef<Mesh>(null)
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.2 })
  return (
    <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh ref={ref}>
        <torusKnotGeometry args={[1, 0.28, 128, 32]} />
        <meshStandardMaterial color="#000000" roughness={0.5} metalness={0.1} />
      </mesh>
    </Float>
  )
}

export default function MorphBackdrop() {
  return (
    <Canvas className="!absolute inset-0" camera={{ position: [0, 0, 5] }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 3, 3]} intensity={0.6} />
      <Spinner />
    </Canvas>
  )
}
