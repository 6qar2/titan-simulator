import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { TitleScreen } from './components/Game/TitleScreen/TitleScreen'
import { WorldMap } from './components/Game/WorldMap/WorldMap'
import { HUD } from './components/Game/HUD/HUD'
import { CapuaZone } from './components/Game/Zones/Capua'
import { PlayerCharacter, EnemyMesh, NPCMesh } from './components/Game/Character/Character'
import { useGameStore, useCombatStore, useControlsStore, useZoneStore, useCharacterStore } from './stores/gameStore'
import { useCombatSystem, useZoneSystem } from './systems/combatSystem'
import { CITIES, COLORS, CAMERA_CONFIG } from './utils/constants'
import './styles/global.css'

function useMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024))
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

function GameScene() {
  const gameStore = useGameStore()
  const charStore = useCharacterStore()
  const combatStore = useCombatStore()
  const combatSystem = useCombatSystem()
  const zoneSystem = useZoneSystem()

  const [showWorldMap, setShowWorldMap] = useState(false)
  const [enemies, setEnemies] = useState([])
  const [playerPosition, setPlayerPosition] = useState([0, 0, 5])
  const [renderError, setRenderError] = useState(null)
  const [sceneReady, setSceneReady] = useState(false)
  const clockRef = useRef(new THREE.Clock())

  useEffect(() => {
    const errorHandler = (error) => {
      console.error('Game render error:', error)
      setRenderError(error.message)
    }
    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', errorHandler)
    return () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', errorHandler)
    }
  }, [])

  useEffect(() => {
    if (enemies.length === 0 && combatStore.combatState === 'idle' && sceneReady) {
      const newEnemies = zoneSystem.spawnEnemiesForZone('arena').map((e, i) => ({
        ...e,
        id: `enemy-${Date.now()}-${i}`,
        health: e.health,
        maxHealth: e.health,
        position: [
          (Math.random() - 0.5) * 16,
          0,
          (Math.random() - 0.5) * 16,
        ],
        lastAttackTime: 0,
        stunnedUntil: 0,
        state: 'idle',
      }))
      setEnemies(newEnemies)
      combatStore.startCombat(newEnemies)
    }
  }, [sceneReady, enemies.length, combatStore.combatState, zoneSystem, combatStore])

  useEffect(() => {
    const timer = setTimeout(() => setSceneReady(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      enemies.forEach((enemy) => {
        if (enemy.health <= 0) return
        const dx = playerPosition[0] - enemy.position[0]
        const dz = playerPosition[2] - enemy.position[2]
        const distance = Math.sqrt(dx * dx + dz * dz)
        if (distance < enemy.attackRange && now > (enemy.lastAttackTime || 0) + enemy.attackCooldown * 1000) {
          const result = combatSystem.enemyAttack(enemy)
          if (result?.success) {
            setEnemies((prev) => prev.map((e) => e.id === enemy.id ? { ...e, lastAttackTime: now } : e))
          }
        }
      })
    }, 500)
    return () => clearInterval(interval)
  }, [enemies, playerPosition, combatSystem])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStore.gameState !== 'zone') return
      const controlsStore = useControlsStore.getState()
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': controlsStore.setMoveInput((prev) => ({ ...prev, y: -1 })); break
        case 's': case 'arrowdown': controlsStore.setMoveInput((prev) => ({ ...prev, y: 1 })); break
        case 'a': case 'arrowleft': controlsStore.setMoveInput((prev) => ({ ...prev, x: -1 })); break
        case 'd': case 'arrowright': controlsStore.setMoveInput((prev) => ({ ...prev, x: 1 })); break
        case ' ':
          e.preventDefault()
          controlsStore.setAttacking(true)
          setTimeout(() => controlsStore.setAttacking(false), 200)
          break
        case 'tab':
          e.preventDefault()
          combatStore.toggleTacticalPause?.()
          break
        case 'escape':
          setShowWorldMap((prev) => !prev)
          break
        default: break
      }
    }
    const handleKeyUp = (e) => {
      const controlsStore = useControlsStore.getState()
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': controlsStore.setMoveInput((prev) => ({ ...prev, y: 0 })); break
        case 's': case 'arrowdown': controlsStore.setMoveInput((prev) => ({ ...prev, y: 0 })); break
        case 'a': case 'arrowleft': controlsStore.setMoveInput((prev) => ({ ...prev, x: 0 })); break
        case 'd': case 'arrowright': controlsStore.setMoveInput((prev) => ({ ...prev, x: 0 })); break
        case ' ': controlsStore.setAttacking(false); break
        default: break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameStore.gameState, combatStore])

  useEffect(() => {
    if (!sceneReady) return
    const raf = requestAnimationFrame(() => combatSystem.processEffects(clockRef.current.getDelta()))
    return () => cancelAnimationFrame(raf)
  }, [sceneReady, combatSystem])

  useEffect(() => {
    const regenInterval = setInterval(() => {
      if (combatStore.combatState === 'active') {
        const staminaRegen = combatSystem.getStaminaRegenRate() * 0.5
        if (combatStore.playerStamina < combatStore.playerMaxStamina) {
          combatStore.modifyStamina(staminaRegen)
        }
      }
    }, 500)
    return () => clearInterval(regenInterval)
  }, [combatStore, combatSystem])

  const handleTravel = (cityId) => {
    gameStore.travelToCity(cityId)
    setShowWorldMap(false)
    setEnemies([])
    combatStore.exitCombat()
    setPlayerPosition([0, 0, 5])
  }

  if (renderError) {
    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: '#0a0a0a', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px',
      }}>
        <div style={{ color: COLORS.TITANS_CRIMSON, fontSize: '18px', marginBottom: '12px', textAlign: 'center' }}>
          Rendering Error
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '20px', textAlign: 'center', maxWidth: '400px' }}>
          {renderError}
        </div>
        <button onClick={() => window.location.reload()} style={{
          padding: '12px 24px', background: 'linear-gradient(135deg, #8b0000, #b22222)',
          border: '1px solid #d4af37', borderRadius: '4px', color: '#d4af37',
          cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
        }}>
          Reload
        </button>
      </div>
    )
  }

  return (
    <>
      <Canvas shadows dpr={[1, 1.5]} resize={{ scroll: false, debounce: 100 }}>
        <PerspectiveCamera makeDefault position={[0, CAMERA_CONFIG.THIRD_PERSON_HEIGHT, CAMERA_CONFIG.THIRD_PERSON_DISTANCE]} fov={60} />
        <Suspense fallback={null}>
          <CapuaZone />
        </Suspense>
        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={30} blur={2} far={4} />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={CAMERA_CONFIG.ZOOM_MIN}
          maxDistance={CAMERA_CONFIG.ZOOM_MAX}
          maxPolarAngle={Math.PI / 2.2}
          target={[playerPosition[0], 1, playerPosition[2]]}
        />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[15, 25, 10]} intensity={1.5} castShadow
          shadow-mapSize-width={1024} shadow-mapSize-height={1024}
          shadow-camera-far={60} shadow-camera-left={-25} shadow-camera-right={25}
          shadow-camera-top={25} shadow-camera-bottom={-25}
        />
        <hemisphereLight skyColor="#87ceeb" groundColor="#d4c4a8" intensity={0.4} />
        <PlayerCharacter position={playerPosition} />
        {enemies.filter((e) => e.health > 0).map((enemy) => (
          <EnemyMesh key={enemy.id} position={enemy.position} color={enemy.color} enemyType={enemy.id} />
        ))}
      </Canvas>

      <HUD />

      {showWorldMap && (
        <WorldMap onTravel={handleTravel} onClose={() => setShowWorldMap(false)} />
      )}

      {combatStore.combatState === 'victory' && (
        <VictoryModal enemies={enemies} onContinue={() => { combatStore.exitCombat(); setEnemies([]); }} />
      )}
      {combatStore.combatState === 'defeat' && (
        <DefeatModal onRecover={() => { combatStore.exitCombat(); setEnemies([]); combatStore.modifyHealth(50); }} />
      )}
    </>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0a0a0a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        width: '50px', height: '50px',
        border: '3px solid rgba(212, 175, 55, 0.2)', borderTop: '3px solid #d4af37',
        borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px',
      }} />
      <div style={{ color: '#d4af37', fontSize: '14px', letterSpacing: '3px' }}>LOADING...</div>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState('loading')
  const gameStore = useGameStore()

  useEffect(() => {
    const timer = setTimeout(() => setPhase('title'), 600)
    return () => clearTimeout(timer)
  }, [])

  const enterGame = () => {
    sessionStorage.setItem('titan-simulator-entered', 'true')
    gameStore.setGameState('zone')
    setPhase('game')
  }

  if (phase === 'loading') {
    return <LoadingScreen />
  }

  if (phase === 'title') {
    return (
      <>
        <TitleScreen onStart={enterGame} />
        <style>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { overflow: hidden; touch-action: manipulation; -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; } button:active { transform: scale(0.95); } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    )
  }

  if (phase === 'game') {
    return (
      <div style={{
        position: 'relative', width: '100vw', height: '100vh', height: '100dvh',
        overflow: 'hidden', background: '#0a0a0a',
      }}>
        <GameScene />
      </div>
    )
  }

  return null
}

function VictoryModal({ enemies, onContinue }) {
  const mobile = useMobile()
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: 'rgba(10,10,10,0.85)', border: '2px solid #d4af37', borderRadius: '12px',
      padding: mobile ? '20px' : '30px 40px', textAlign: 'center', zIndex: 60,
      boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)',
      width: mobile ? 'calc(100% - 32px)' : 'auto', maxWidth: '400px',
    }}>
      <div style={{ color: '#d4af37', fontSize: mobile ? '24px' : '32px', fontWeight: 'bold', marginBottom: '12px' }}>
        VICTORIA
      </div>
      <div style={{ color: '#fff', fontSize: mobile ? '14px' : '16px', marginBottom: '8px' }}>
        +{enemies.reduce((sum, e) => sum + (e.fameReward || 0), 0)} Fama
      </div>
      <div style={{ color: '#d4af37', fontSize: mobile ? '13px' : '14px', marginBottom: '20px' }}>
        +{enemies.reduce((sum, e) => sum + (e.denariiReward || 0), 0)} Denarii
      </div>
      <button onClick={onContinue} style={{
        padding: '12px 30px', background: 'linear-gradient(135deg, #8b0000, #b22222)',
        border: '1px solid #d4af37', borderRadius: '4px', color: '#d4af37',
        cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px',
        minHeight: '44px', width: mobile ? '100%' : 'auto',
      }}>
        Continue
      </button>
    </div>
  )
}

function DefeatModal({ onRecover }) {
  const mobile = useMobile()
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: 'rgba(10,10,10,0.85)', border: '2px solid #8b0000', borderRadius: '12px',
      padding: mobile ? '20px' : '30px 40px', textAlign: 'center', zIndex: 60,
      boxShadow: '0 0 40px rgba(139, 0, 0, 0.4)',
      width: mobile ? 'calc(100% - 32px)' : 'auto', maxWidth: '400px',
    }}>
      <div style={{ color: '#8b0000', fontSize: mobile ? '24px' : '32px', fontWeight: 'bold', marginBottom: '12px' }}>
        DEFEAT
      </div>
      <div style={{ color: '#fff', fontSize: mobile ? '14px' : '16px', marginBottom: '8px' }}>
        You have been defeated, but not destroyed.
      </div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: mobile ? '12px' : '13px', marginBottom: '20px' }}>
        Recover and return stronger.
      </div>
      <button onClick={onRecover} style={{
        padding: '12px 30px', background: 'linear-gradient(135deg, #8b0000, #b22222)',
        border: '1px solid #d4af37', borderRadius: '4px', color: '#d4af37',
        cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px',
        minHeight: '44px', width: mobile ? '100%' : 'auto',
      }}>
        Recover
      </button>
    </div>
  )
}
