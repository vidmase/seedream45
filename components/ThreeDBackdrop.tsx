import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, Sparkles, Stars } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function EnergyCore() {
  const core = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (core.current) {
      core.current.rotation.x += delta * 0.08
      core.current.rotation.y += delta * 0.16
    }
    if (ring.current) {
      ring.current.rotation.z -= delta * 0.12
      ring.current.rotation.x = Math.sin(Date.now() * 0.00025) * 0.25
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.22} floatIntensity={0.5}>
      <group position={[0.2, 0.05, -0.8]}>
        <mesh ref={core}>
          <icosahedronGeometry args={[1.48, 3]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={0.8}
            chromaticAberration={0.12}
            anisotropy={0.25}
            distortion={0.18}
            distortionScale={0.35}
            temporalDistortion={0.1}
            color="#6d7cff"
            transmission={0.96}
            roughness={0.12}
          />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 3, 0.2, 0]}>
          <torusGeometry args={[2.1, 0.012, 16, 160]} />
          <meshBasicMaterial color="#9aa4ff" transparent opacity={0.45} />
        </mesh>
        <mesh rotation={[-Math.PI / 5, 0.7, 0.2]}>
          <torusGeometry args={[2.55, 0.008, 12, 160]} />
          <meshBasicMaterial color="#ed6bff" transparent opacity={0.28} />
        </mesh>
      </group>
    </Float>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#05050b"]} />
      <fog attach="fog" args={["#05050b", 5, 12]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 2, 4]} color="#7285ff" intensity={10} distance={8} />
      <pointLight position={[-4, -2, 2]} color="#d95bff" intensity={8} distance={7} />
      <EnergyCore />
      <Sparkles count={90} scale={[10, 6, 7]} size={1.8} speed={0.25} color="#aeb5ff" noise={1.5} />
      <Stars radius={10} depth={5} count={180} factor={1.8} saturation={0.2} fade speed={0.3} />
    </>
  )
}

export function ThreeDBackdrop() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-90" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6.5], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(5,5,11,0.3)_45%,rgba(5,5,11,0.88)_100%)]" />
    </div>
  )
}
