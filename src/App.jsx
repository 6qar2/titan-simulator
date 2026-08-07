import { useState, useEffect, useRef } from 'react'
import { TitleScreen } from './components/Game/TitleScreen/TitleScreen'
import { WorldMap } from './components/Game/WorldMap/WorldMap'
import { HUD } from './components/Game/HUD/HUD'
import { useGameStore, useCombatStore, useControlsStore, useCharacterStore, playerPositionRef } from './stores/gameStore'
import { useCombatSystem, useZoneSystem } from './systems/combatSystem'
import { COLORS, PHYSICS_CONFIG } from './utils/constants'
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

function useLandscape() {
  const [landscape, setLandscape] = useState(true)
  useEffect(() => {
    const check = () => setLandscape(window.innerWidth > window.innerHeight)
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])
  return landscape
}

function PortraitWarning() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
      <div style={{
        color: '#d4af37',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '12px',
        fontFamily: 'serif',
      }}>
        ROTATE YOUR DEVICE
      </div>
      <div style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: '16px',
        maxWidth: '400px',
      }}>
        Titan Simulator requires landscape mode for the best combat experience.
      </div>
    </div>
  )
}

function drawPlayer(ctx, x, y, appearance, sex, isAttacking) {
  const bodyColor = appearance?.skinTone ? `hsl(${30 + appearance.skinTone * 20}, 50%, ${40 + appearance.skinTone * 20}%)` : '#d4a574'
  const size = 20
  const headSize = 8

  ctx.save()
  ctx.translate(x, y)

  if (isAttacking) {
    ctx.shadowColor = COLORS.TITANS_GOLD
    ctx.shadowBlur = 15
  }

  ctx.fillStyle = bodyColor
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = COLORS.TITANS_GOLD
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#2c1810'
  ctx.beginPath()
  ctx.arc(0, 0, headSize, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawEnemy(ctx, enemy, cameraX, cameraY, canvasWidth, canvasHeight) {
  const screenX = enemy.position[0] - cameraX + canvasWidth / 2
  const screenY = enemy.position[1] - cameraY + canvasHeight / 2
  const scale = enemy.typeId === 'beast' ? 1.3 : enemy.typeId === 'legionary_enemy' ? 1.1 : 1.0
  const size = 18 * scale

  ctx.save()
  ctx.translate(screenX, screenY)

  const alpha = enemy.health > 0 ? 1 : 0.3
  ctx.globalAlpha = alpha

  ctx.fillStyle = enemy.color || '#c0392b'
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = COLORS.TITANS_CRIMSON
  ctx.lineWidth = 2
  ctx.stroke()

  const headSize = 7 * scale
  ctx.fillStyle = '#1a0a00'
  ctx.beginPath()
  ctx.arc(0, 0, headSize, 0, Math.PI * 2)
  ctx.fill()

  const stunActive = enemy.stunnedUntil > Date.now()
  if (stunActive) {
    ctx.strokeStyle = '#ffff00'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, size + 4, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.restore()
}

function drawGround(ctx, canvasWidth, canvasHeight, cameraX, cameraY) {
  const groundSize = 1200
  const startX = ((cameraX - canvasWidth / 2) % groundSize + groundSize) % groundSize - groundSize / 2
  const startY = ((cameraY - canvasHeight / 2) % groundSize + groundSize) % groundSize - groundSize / 2

  ctx.fillStyle = '#c4b080'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.strokeStyle = 'rgba(0,0,0,0.05)'
  ctx.lineWidth = 1
  for (let x = startX; x < canvasWidth + groundSize; x += groundSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasHeight)
    ctx.stroke()
  }
  for (let y = startY; y < canvasHeight + groundSize; y += groundSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvasWidth, y)
    ctx.stroke()
  }
}

function drawBuildings(ctx, cameraX, cameraY, canvasWidth, canvasHeight) {
  const buildingData = [
    { pos: [-80, -80], size: [30, 40], color: '#d4c4a8' },
    { pos: [80, -80], size: [25, 35], color: '#c4b498' },
    { pos: [-80, 80], size: [40, 50], color: '#e0d0b0' },
    { pos: [80, 80], size: [30, 40], color: '#d0c0a0' },
    { pos: [0, -120], size: [60, 40], color: '#bca88c' },
    { pos: [-120, 0], size: [30, 40], color: '#c8b898' },
    { pos: [120, 0], size: [30, 50], color: '#d8c8a8' },
    { pos: [0, 120], size: [50, 40], color: '#c0b090' },
  ]

  buildingData.forEach((b) => {
    const screenX = b.pos[0] - cameraX + canvasWidth / 2
    const screenY = b.pos[1] - cameraY + canvasHeight / 2
    const w = b.size[0]
    const h = b.size[1]

    ctx.fillStyle = b.color
    ctx.fillRect(screenX - w / 2, screenY - h / 2, w, h)
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 2
    ctx.strokeRect(screenX - w / 2, screenY - h / 2, w, h)

    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(screenX - w / 2 + 2, screenY - h / 2 + 2, w - 4, h / 2)
  })
}

function drawArenaRing(ctx, cameraX, cameraY, canvasWidth, canvasHeight) {
  const centerX = 0 - cameraX + canvasWidth / 2
  const centerY = 0 - cameraY + canvasHeight / 2
  const outerRadius = 120
  const innerRadius = 100

  ctx.beginPath()
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(196, 168, 130, 0.3)'
  ctx.fill()
  ctx.strokeStyle = '#c4a882'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
  ctx.strokeStyle = '#8b0000'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(centerX, centerY, outerRadius + 10, 0, Math.PI * 2)
  ctx.strokeStyle = COLORS.TITANS_GOLD
  ctx.lineWidth = 4
  ctx.stroke()
}

function drawPillars(ctx, cameraX, cameraY, canvasWidth, canvasHeight) {
  const pillarPositions = [[0, -60], [-30, -60], [30, -60]]

  pillarPositions.forEach(([px, py]) => {
    const screenX = px - cameraX + canvasWidth / 2
    const screenY = py - cameraY + canvasHeight / 2

    ctx.fillStyle = '#e8dcc8'
    ctx.fillRect(screenX - 6, screenY - 30, 12, 60)
    ctx.strokeStyle = '#d8c8a8'
    ctx.lineWidth = 2
    ctx.strokeRect(screenX - 6, screenY - 30, 12, 60)

    ctx.fillStyle = '#d8c8a8'
    ctx.fillRect(screenX - 10, screenY - 35, 20, 8)
    ctx.strokeRect(screenX - 10, screenY - 35, 20, 8)
  })
}

function drawDecor(ctx, cameraX, cameraY, canvasWidth, canvasHeight) {
  for (let i = 0; i < 30; i++) {
    const seed = i * 137.508
    const dx = ((seed * 7.3) % 800) - 400
    const dy = ((seed * 13.7) % 800) - 400
    const screenX = dx - cameraX + canvasWidth / 2
    const screenY = dy - cameraY + canvasHeight / 2

    if (screenX < -20 || screenX > canvasWidth + 20 || screenY < -20 || screenY > canvasHeight + 20) continue

    ctx.fillStyle = `hsl(${30 + (i % 20)}, 60%, ${25 + (i % 15)}%)`
    ctx.beginPath()
    ctx.arc(screenX, screenY, 3 + (i % 3), 0, Math.PI * 2)
    ctx.fill()
  }
}

function Game2D() {
  const canvasRef = useRef(null)
  const gameStore = useGameStore()
  const charStore = useCharacterStore()
  const combatStore = useCombatStore()
  const controlsStore = useControlsStore()
  const combatSystem = useCombatSystem()
  const zoneSystem = useZoneSystem()

  const [showWorldMap, setShowWorldMap] = useState(false)
  const [renderError, setRenderError] = useState(null)
  const [sceneReady, setSceneReady] = useState(false)

  const controlsRef = useRef(controlsStore)
  const combatRef = useRef(combatStore)
  const charRef = useRef(charStore)
  const combatSystemRef = useRef(combatSystem)
  const zoneSystemRef = useRef(zoneSystem)

  useEffect(() => {
    controlsRef.current = controlsStore
    combatRef.current = combatStore
    charRef.current = charStore
    combatSystemRef.current = combatSystem
    zoneSystemRef.current = zoneSystem
  })

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
    if (combatStore.enemies.length === 0 && combatStore.combatState === 'idle' && sceneReady) {
      const newEnemies = zoneSystem.spawnEnemiesForZone('arena').map((e, i) => ({
        ...e,
        id: `enemy-${Date.now()}-${i}`,
        health: e.health,
        maxHealth: e.health,
        position: [
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 16,
        ],
        lastAttackTime: 0,
        stunnedUntil: 0,
        state: 'idle',
      }))
      combatStore.startCombat(newEnemies)
    }
  }, [sceneReady, combatStore.enemies.length, combatStore.combatState, combatStore, zoneSystem])

  useEffect(() => {
    const timer = setTimeout(() => setSceneReady(true), 50)
    const worldMapFlag = sessionStorage.getItem('titan-simulator-worldmap')
    if (worldMapFlag) {
      setShowWorldMap(true)
      sessionStorage.removeItem('titan-simulator-worldmap')
    }
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const playerPos = playerPositionRef.current
      const store = combatRef.current
      store.enemies.forEach((enemy) => {
        if (enemy.health <= 0) return
        const dx = playerPos[0] - enemy.position[0]
        const dy = playerPos[1] - enemy.position[1]
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < enemy.attackRange && now > (enemy.lastAttackTime || 0) + enemy.attackCooldown * 1000) {
          const result = combatSystemRef.current.enemyAttack(enemy)
          if (result?.success) {
            store.updateEnemy(enemy.id, { lastAttackTime: now })
          }
        }
      })
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStore.gameState !== 'zone') return
      const controlsStore = useControlsStore.getState()
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': controlsStore.setMoveInput({ x: 0, y: -1 }); break
        case 's': case 'arrowdown': controlsStore.setMoveInput({ x: 0, y: 1 }); break
        case 'a': case 'arrowleft': controlsStore.setMoveInput({ x: -1, y: 0 }); break
        case 'd': case 'arrowright': controlsStore.setMoveInput({ x: 1, y: 0 }); break
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
        case 'w': case 'arrowup': controlsStore.setMoveInput({ x: 0, y: 0 }); break
        case 's': case 'arrowdown': controlsStore.setMoveInput({ x: 0, y: 0 }); break
        case 'a': case 'arrowleft': controlsStore.setMoveInput({ x: 0, y: 0 }); break
        case 'd': case 'arrowright': controlsStore.setMoveInput({ x: 0, y: 0 }); break
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
    const interval = setInterval(() => {
      combatSystemRef.current.processEffects(0.1)
    }, 100)
    return () => clearInterval(interval)
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId
    let lastTime = performance.now()
    const camera = { x: 0, y: 0 }

    const render = (time) => {
      const deltaTime = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      const controls = controlsRef.current
      const char = charRef.current
      const combat = combatRef.current

      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * (window.devicePixelRatio || 1)
      canvas.height = rect.height * (window.devicePixelRatio || 1)
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0)
      const canvasWidth = rect.width
      const canvasHeight = rect.height

      const speed = PHYSICS_CONFIG.PLAYER_SPEED * (controls.isAttacking ? 0.6 : 1.0)
      const { x, y } = controls.moveInput

      if (x !== 0 || y !== 0) {
        playerPositionRef.current[0] += x * speed * deltaTime
        playerPositionRef.current[1] += y * speed * deltaTime
      }

      const targetCamX = playerPositionRef.current[0]
      const targetCamY = playerPositionRef.current[1]
      camera.x += (targetCamX - camera.x) * 3 * deltaTime
      camera.y += (targetCamY - camera.y) * 3 * deltaTime

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      drawGround(ctx, canvasWidth, canvasHeight, camera.x, camera.y)
      drawBuildings(ctx, camera.x, camera.y, canvasWidth, canvasHeight)
      drawDecor(ctx, camera.x, camera.y, canvasWidth, canvasHeight)
      drawArenaRing(ctx, camera.x, camera.y, canvasWidth, canvasHeight)
      drawPillars(ctx, camera.x, camera.y, canvasWidth, canvasHeight)

      const screenPlayerX = playerPositionRef.current[0] - camera.x + canvasWidth / 2
      const screenPlayerY = playerPositionRef.current[1] - camera.y + canvasHeight / 2
      drawPlayer(ctx, screenPlayerX, screenPlayerY, char.appearance, char.sex, controls.isAttacking)

      combat.enemies.forEach((enemy) => {
        drawEnemy(ctx, enemy, camera.x, camera.y, canvasWidth, canvasHeight)
      })

      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationId)
  }, [sceneReady])

  const handleTravel = (cityId) => {
    gameStore.travelToCity(cityId)
    setShowWorldMap(false)
    combatStore.exitCombat()
    playerPositionRef.current = [0, 0]
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
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          touchAction: 'none',
        }}
      />

      <HUD />

      {showWorldMap && (
        <WorldMap onTravel={handleTravel} onClose={() => setShowWorldMap(false)} />
      )}

      {combatStore.combatState === 'victory' && (
        <VictoryModal enemies={combatStore.enemies} onContinue={() => { combatStore.exitCombat(); }} />
      )}
      {combatStore.combatState === 'defeat' && (
        <DefeatModal onRecover={() => { combatStore.exitCombat(); combatStore.modifyHealth(50); }} />
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
  const landscape = useLandscape()

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
        {!landscape && <PortraitWarning />}
        <Game2D />
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
