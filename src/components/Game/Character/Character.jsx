import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore, useControlsStore, useCombatStore } from '../../../stores/gameStore'
import { PHYSICS_CONFIG, CHARACTER_SEX } from '../../../utils/constants'

function CharacterMesh({ position = [0, 0, 0], sex = CHARACTER_SEX.MALE, appearance }) {
  const meshRef = useRef()
  const { playerHealth, combatState } = useCombatStore()

  const bodyColor = useMemo(() => {
    const skinTone = appearance?.skinTone ?? 0.7
    return new THREE.Color().setHSL(0.08, 0.3, skinTone * 0.6 + 0.2)
  }, [appearance?.skinTone])

  const armorColor = useMemo(() => {
    if (combatState === 'active' && playerHealth < 30) return '#8b0000'
    return '#c0c0c0'
  }, [combatState, playerHealth])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.y = position[1]
    const breathe = Math.sin(state.clock.elapsedTime * 2) * 0.02
    meshRef.current.scale.y = 1 + breathe
  })

  return (
    <group ref={meshRef} position={[position[0], position[1], position[2]]}>
      <Legs sex={sex} bodyColor={bodyColor} />
      <Torso bodyColor={bodyColor} armorColor={armorColor} />
      <Head sex={sex} bodyColor={bodyColor} appearance={appearance} />
      <Arms sex={sex} bodyColor={bodyColor} />
      <Weapon weaponType="gladius" />
    </group>
  )
}

function Legs({ sex, bodyColor }) {
  return (
    <group position={[0, 0.9, 0]}>
      <mesh position={[-0.2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.8, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.8, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.45, 0.05]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.5]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Torso({ bodyColor, armorColor }) {
  return (
    <group position={[0, 1.7, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.05, 0.15]}>
        <boxGeometry args={[0.5, 0.55, 0.2]} />
        <meshStandardMaterial color={armorColor} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.35, 0.05]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.1]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Head({ sex, bodyColor, appearance }) {
  const headSize = sex === CHARACTER_SEX.FEMALE ? 0.22 : 0.24
  const hairColor = appearance?.hairColor || '#3d2817'

  return (
    <group position={[0, 2.15, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[headSize, 16, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>

      <mesh position={[0, 0.02, -0.05]} castShadow>
        <boxGeometry args={[0.35, 0.2, 0.15]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>

      <mesh position={[-0.08, 0.02, 0.12]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={appearance?.eyeColor || '#4a3728'} roughness={0.3} />
      </mesh>
      <mesh position={[0.08, 0.02, 0.12]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={appearance?.eyeColor || '#4a3728'} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Arms({ sex, bodyColor }) {
  const armLength = sex === CHARACTER_SEX.FEMALE ? 0.6 : 0.7

  return (
    <group position={[0, 1.9, 0]}>
      <mesh position={[-0.4, -0.1, 0]} rotation={[0, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.08, armLength, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.4, -0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.08, armLength, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Weapon({ weaponType = 'gladius' }) {
  return (
    <group position={[0.55, 1.6, 0.2]} rotation={[0, -0.5, 0.3]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.05, 0.15, 0.02]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} />
      </mesh>
    </group>
  )
}

export function PlayerCharacter({ position = [0, 0, 0], appearance, sex }) {
  return <CharacterMesh position={position} sex={sex} appearance={appearance} />
}

export function NPCMesh({ position = [0, 0, 0], color = '#c0392b' }) {
  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.8, 4, 8]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.8)} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 4, 8]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.9)} roughness={0.8} />
      </mesh>
    </group>
  )
}

export function EnemyMesh({ position = [0, 0, 0], color = '#c0392b', enemyType }) {
  const meshRef = useRef()
  const { stunDuration, rootDuration } = useCombatStore()

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime
    meshRef.current.position.y = position[1] + Math.sin(time * 2) * 0.03

    if (stunDuration > 0 || rootDuration > 0) {
      meshRef.current.rotation.z = Math.sin(time * 10) * 0.1
    }
  })

  const scale = enemyType === 'beast' ? 1.3 : enemyType === 'legionary_enemy' ? 1.1 : 1.0

  return (
    <group ref={meshRef} position={[position[0], position[1], position[2]]} scale={scale}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.9, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.55, 4, 8]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.85)} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.9)} roughness={0.7} />
      </mesh>
      {enemyType === 'beast' && (
        <mesh position={[0, 2.35, -0.1]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.6} />
        </mesh>
      )}
    </group>
  )
}
