import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, useControlsStore, useCharacterStore, playerPositionRef } from '../../../stores/gameStore'
import { PlayerCharacter } from '../Character/Character'
import { PHYSICS_CONFIG } from '../../../utils/constants'

export function CapuaZone() {
  const { currentZone } = useGameStore()
  const controlsStore = useControlsStore()
  const charStore = useCharacterStore()
  const playerRef = useRef()

  useFrame((state, delta) => {
    if (!playerRef.current) return

    const speed = PHYSICS_CONFIG.PLAYER_SPEED * (controlsStore.isAttacking ? 0.6 : 1.0)
    const { x, y } = controlsStore.moveInput

    if (x !== 0 || y !== 0) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion)
      forward.y = 0
      forward.normalize()
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(state.camera.quaternion)
      right.y = 0
      right.normalize()

      const moveDir = new THREE.Vector3()
        .addScaledVector(forward, -y)
        .addScaledVector(right, x)
        .normalize()

      playerRef.current.position.x += moveDir.x * speed * delta
      playerRef.current.position.z += moveDir.z * speed * delta

      const targetRotation = Math.atan2(moveDir.x, moveDir.z)
      playerRef.current.rotation.y = THREE.MathUtils.lerp(
        playerRef.current.rotation.y,
        targetRotation,
        0.15
      )
    }

    playerRef.current.position.y = 0
    playerPositionRef.current = [
      playerRef.current.position.x,
      playerRef.current.position.y,
      playerRef.current.position.z,
    ]
  })

  const buildings = useMemo(() => {
    const buildingData = [
      { pos: [-8, 0, -8], size: [3, 4, 3], color: '#d4c4a8' },
      { pos: [8, 0, -8], size: [2.5, 3.5, 2.5], color: '#c4b498' },
      { pos: [-8, 0, 8], size: [4, 5, 3], color: '#e0d0b0' },
      { pos: [8, 0, 8], size: [3, 3, 4], color: '#d0c0a0' },
      { pos: [0, 0, -12], size: [6, 4, 3], color: '#bca88c' },
      { pos: [-12, 0, 0], size: [3, 3, 3], color: '#c8b898' },
      { pos: [12, 0, 0], size: [3, 4, 3], color: '#d8c8a8' },
      { pos: [0, 0, 12], size: [5, 3.5, 4], color: '#c0b090' },
    ]
    return buildingData.map((b, i) => (
      <Building key={i} position={b.pos} size={b.size} color={b.color} />
    ))
  }, [])

  const groundDecor = useMemo(() => {
    const decor = []
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 40
      const z = (Math.random() - 0.5) * 40
      decor.push(
        <mesh key={`decor-${i}`} position={[x, 0.1, z]} rotation={[0, Math.random() * Math.PI, 0]}>
          <cylinderGeometry args={[0.1, 0.15, 0.2, 4]} />
          <meshStandardMaterial color="#8b4513" roughness={0.9} />
        </mesh>
      )
    }
    return decor
  }, [])

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight skyColor="#87ceeb" groundColor="#d4c4a8" intensity={0.3} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#c4b080" roughness={0.95} />
      </mesh>

      {buildings}
      {groundDecor}

      <Pillar position={[0, 0, -6]} />
      <Pillar position={[-3, 0, -6]} />
      <Pillar position={[3, 0, -6]} />

      <ArenaRing position={[0, 0, 0]} />

      <group ref={playerRef} position={[0, 0, 5]}>
        <PlayerCharacter position={[0, 0, 0]} appearance={charStore.appearance} sex={charStore.sex} />
      </group>
    </group>
  )
}

function Building({ position, size, color }) {
  return (
    <group position={position}>
      <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, size[1] / 2 + 0.01, size[2] / 2 + 0.01]} rotation={[0, 0, 0]}>
        <planeGeometry args={[size[0] - 0.1, size[1] - 0.1]} />
        <meshStandardMaterial color="#4a3728" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Pillar({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 3, 8]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#d8c8a8" roughness={0.6} />
      </mesh>
    </group>
  )
}

function ArenaRing({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[8, 12, 32]} />
        <meshStandardMaterial color="#c4a882" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.8, 11.8, 32]} />
        <meshStandardMaterial color="#8b0000" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[10, 0.4, 8, 32]} />
        <meshStandardMaterial color="#d4af37" roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  )
}
