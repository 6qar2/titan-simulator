import { useState, useEffect, useRef, useCallback } from 'react'
import { TitleScreen } from './components/Game/TitleScreen/TitleScreen'
import { HUD } from './components/Game/HUD/HUD'
import { useGameStore, playerPositionRef } from './stores/gameStore'
import { COLORS } from './utils/constants'
import './styles/global.css'

const WORLD_W = 420
const WORLD_H = 720
const PLAYER_R = 20
const ENEMY_BASE_R = 16
const DODGE_SPEED = 340
const DODGE_DURATION = 200
const WAVE_COOLDOWN = 2200
const POWERUP_CHANCE = 0.18
const POWERUP_DURATION = 5000

const ENEMY_TYPES = {
  scout: { name: 'Scout', hp: 28, speed: 2.2, damage: 7, color: '#ff9f43', radius: ENEMY_BASE_R, score: 10, behavior: 'swarm' },
  fighter: { name: 'Fighter', hp: 52, speed: 1.4, damage: 12, color: '#ff6b6b', radius: ENEMY_BASE_R + 2, score: 20, behavior: 'chase' },
  brute: { name: 'Brute', hp: 95, speed: 0.9, damage: 18, color: '#c44569', radius: ENEMY_BASE_R + 4, score: 35, behavior: 'charge' },
  boss: { name: 'Overlord', hp: 220, speed: 0.7, damage: 26, color: '#5f27cd', radius: ENEMY_BASE_R + 8, score: 120, behavior: 'boss' },
}

const POWERUPS = {
  rapid: { color: '#00d2d3', label: 'RAPID', duration: POWERUP_DURATION },
  shield: { color: '#feca57', label: 'SHIELD', duration: POWERUP_DURATION },
  bomb: { color: '#ff9ff3', label: 'BOMB', duration: 200 },
  heal: { color: '#1dd1a1', label: 'HEAL', duration: 200 },
}

function Game2D() {
  const canvasRef = useRef(null)
  const store = useGameStore()

  const [phase, setPhase] = useState('playing')
  const [wave, setWave] = useState(1)
  const [combo, setCombo] = useState(0)
  const [comboTimer, setComboTimer] = useState(0)
  const [score, setScore] = useState(0)
  const [enemies, setEnemies] = useState([])
  const [particles, setParticles] = useState([])
  const [damageTexts, setDamageTexts] = useState([])
  const [waveTimer, setWaveTimer] = useState(0)
  const [upgrades, setUpgrades] = useState(() => {
    try {
      const s = localStorage.getItem('titan-rise-upgrades')
      return s ? JSON.parse(s) : { damage: 0, speed: 0, health: 0, multishot: 0 }
    } catch { return { damage: 0, speed: 0, health: 0, multishot: 0 } }
  })
  const [upgradesScreen, setUpgradesScreen] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('titan-rise-highscore') || '0', 10) } catch { return 0 }
  })
  const [powerups, setPowerups] = useState([])

  const playerRef = useRef({
    x: WORLD_W / 2, y: WORLD_H - 140,
    hp: 100, maxHp: 100,
    dodgeTimer: 0, dodgeDir: { x: 0, y: 0 },
    invulnTimer: 0, shieldTimer: 0, rapidTimer: 0,
    lastShot: 0, fireRate: 220,
  })

  const cameraRef = useRef({ x: 0, y: 0, shake: 0 })
  const inputRef = useRef({ x: 0, y: 0, tapping: false, tapX: 0, tapY: 0, startX: 0, startY: 0, startTime: 0 })
  const lastTimeRef = useRef(performance.now())
  const enemiesRef = useRef(enemies)
  const particlesRef = useRef(particles)
  const damageTextsRef = useRef(damageTexts)
  const waveRef = useRef(wave)
  const comboRef = useRef(combo)
  const comboTimerRef = useRef(comboTimer)
  const phaseRef = useRef(phase)
  const upgradesScreenRef = useRef(upgradesScreen)
  const gameOverRef = useRef(gameOver)
  const upgradesRef = useRef(upgrades)
  const powerupsRef = useRef(powerups)
  const scoreRef = useRef(score)

  useEffect(() => { enemiesRef.current = enemies }, [enemies])
  useEffect(() => { particlesRef.current = particles }, [particles])
  useEffect(() => { damageTextsRef.current = damageTexts }, [damageTexts])
  useEffect(() => { waveRef.current = wave }, [wave])
  useEffect(() => { comboRef.current = combo }, [combo])
  useEffect(() => { comboTimerRef.current = comboTimer }, [comboTimer])
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { upgradesScreenRef.current = upgradesScreen }, [upgradesScreen])
  useEffect(() => { gameOverRef.current = gameOver }, [gameOver])
  useEffect(() => { upgradesRef.current = upgrades }, [upgrades])
  useEffect(() => { powerupsRef.current = powerups }, [powerups])
  useEffect(() => { scoreRef.current = score }, [score])

  const saveUpgrades = useCallback((u) => {
    setUpgrades(u)
    upgradesRef.current = u
    try { localStorage.setItem('titan-rise-upgrades', JSON.stringify(u)) } catch {}
  }, [])

  const addParticles = useCallback((x, y, color, count = 10) => {
    const newParticles = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 80 + Math.random() * 180
      newParticles.push({
        id: Date.now() + Math.random(),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 1.2 + Math.random() * 1.8,
        color,
        radius: 2 + Math.random() * 4,
      })
    }
    setParticles((p) => [...p, ...newParticles])
  }, [])

  const addDamageText = useCallback((x, y, text, color = '#fff', size = 14) => {
    setDamageTexts((t) => [...t, { id: Date.now() + Math.random(), x, y, text, color, life: 1, decay: 1.0, size }])
  }, [])

  const screenShake = useCallback((amount = 4) => {
    cameraRef.current.shake = amount
  }, [])

  const spawnPowerup = useCallback((x, y) => {
    if (Math.random() > POWERUP_CHANCE) return
    const keys = Object.keys(POWERUPS)
    const key = keys[Math.floor(Math.random() * keys.length)]
    const pu = POWERUPS[key]
    setPowerups((p) => [...p, {
      id: Date.now() + Math.random(),
      x, y, type: key,
      color: pu.color, label: pu.label, duration: pu.duration,
      vy: 40 + Math.random() * 40,
      life: 6,
    }])
  }, [])

  const activatePowerup = useCallback((type, p) => {
    if (type === 'rapid') { p.rapidTimer = POWERUP_DURATION; p.fireRate = 100 }
    else if (type === 'shield') { p.shieldTimer = POWERUP_DURATION }
    else if (type === 'bomb') {
      enemiesRef.current.forEach((e) => {
        if (e.hp <= 0) return
        const dist = Math.hypot(e.x - p.x, e.y - p.y)
        if (dist < 180) {
          const dmg = 40 + upgradesRef.current.damage * 10
          const newHp = e.hp - dmg
          setEnemies((prev) => prev.map((en) => en.id === e.id ? { ...en, hp: newHp } : en))
          addDamageText(e.x, e.y - 20, `${dmg}`, '#ff9ff3', 18)
          addParticles(e.x, e.y, '#ff9ff3', 12)
          screenShake(6)
          if (newHp <= 0) {
            addParticles(e.x, e.y, e.color, 20)
            store.addDenarii(e.score)
            store.addFame(Math.floor(e.score / 2))
            spawnPowerup(e.x, e.y)
          }
        }
      })
      addParticles(p.x, p.y, '#ff9ff3', 25)
    } else if (type === 'heal') {
      p.hp = Math.min(p.maxHp, p.hp + 35)
      addParticles(p.x, p.y, '#1dd1a1', 15)
      addDamageText(p.x, p.y - 30, '+35', '#1dd1a1', 16)
    }
  }, [addParticles, addDamageText, screenShake, spawnPowerup, store])

  const spawnWave = useCallback((waveNum) => {
    const newEnemies = []
    const count = Math.min(3 + Math.floor(waveNum * 1.3), 14)
    const types = ['scout']
    if (waveNum >= 2) types.push('fighter')
    if (waveNum >= 4) types.push('brute')
    if (waveNum >= 6 && waveNum % 3 === 0) types.push('boss')

    for (let i = 0; i < count; i++) {
      const typeKey = types[Math.floor(Math.random() * types.length)]
      const type = ENEMY_TYPES[typeKey]
      const hpScale = 1 + (waveNum - 1) * 0.18
      newEnemies.push({
        id: Date.now() + i,
        type: typeKey,
        x: 30 + Math.random() * (WORLD_W - 60),
        y: -50 - Math.random() * 140,
        vx: (Math.random() - 0.5) * 25,
        hp: Math.floor(type.hp * hpScale),
        maxHp: Math.floor(type.hp * hpScale),
        damage: type.damage + Math.floor(waveNum * 1.8),
        color: type.color,
        radius: type.radius,
        score: type.score,
        lastAttack: 0,
        attackCd: 1100 + Math.random() * 700,
        stunned: 0,
        behavior: type.behavior,
        chargeTimer: 0,
        chargeDir: { x: 0, y: 0 },
        flash: 0,
      })
    }
    setEnemies(newEnemies)
  }, [])

  const playerShoot = useCallback(() => {
    const p = playerRef.current
    if (p.lastShot > 0 || phaseRef.current !== 'playing') return
    const now = Date.now()
    const fireRate = p.rapidTimer > 0 ? p.fireRate : 220
    if (now - p.lastShot < fireRate) return
    p.lastShot = now

    const baseDamage = 14 + upgradesRef.current.damage * 9
    const multishot = upgradesRef.current.multishot
    const angles = multishot > 0 ? [-0.25, 0, 0.25] : [0]
    const alive = enemiesRef.current.filter((e) => e.hp > 0)
    if (alive.length === 0) return

    const nearest = alive.reduce((a, b) => {
      const da = Math.hypot(a.x - p.x, a.y - p.y)
      const db = Math.hypot(b.x - p.x, b.y - p.y)
      return da < db ? a : b
    })
    const baseAngle = Math.atan2(nearest.y - p.y, nearest.x - p.x)

    angles.forEach((offset) => {
      const angle = baseAngle + offset
      const speed = 600
      const lifetime = 1.2
      const bullet = {
        id: Date.now() + Math.random(),
        x: p.x, y: p.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: baseDamage,
        life: lifetime,
        radius: 4,
        color: '#ffdd57',
      }
      setParticles((prev) => [...prev, bullet])
    })

    const recoil = 3
    p.x -= Math.cos(baseAngle) * recoil
    p.y -= Math.sin(baseAngle) * recoil
  }, [upgradesRef])

  const playerDodge = useCallback(() => {
    const p = playerRef.current
    if (p.dodgeTimer > 0 || phaseRef.current !== 'playing') return
    const input = inputRef.current
    const dirX = input.x || 0
    const dirY = input.y || -1
    const len = Math.hypot(dirX, dirY) || 1
    p.dodgeTimer = DODGE_DURATION
    p.dodgeDir = { x: (dirX / len) * DODGE_SPEED, y: (dirY / len) * DODGE_SPEED }
    p.invulnTimer = 220
    addParticles(p.x, p.y, 'rgba(255,255,255,0.8)', 8)
  }, [addParticles])

  const resetGame = useCallback(() => {
    const p = playerRef.current
    p.x = WORLD_W / 2
    p.y = WORLD_H - 140
    p.hp = 100 + upgradesRef.current.health * 30
    p.maxHp = 100 + upgradesRef.current.health * 30
    p.dodgeTimer = 0
    p.invulnTimer = 0
    p.shieldTimer = 0
    p.rapidTimer = 0
    p.lastShot = 0
    p.fireRate = 220
    setEnemies([])
    setParticles([])
    setDamageTexts([])
    setPowerups([])
    setWaveTimer(0)
    setCombo(0)
    setComboTimer(0)
    setScore(0)
    setGameOver(false)
    setPhase('playing')
    spawnWave(1)
  }, [spawnWave])

  useEffect(() => {
    if (phase === 'playing' && enemies.length === 0 && waveTimer <= 0) {
      setWaveTimer(WAVE_COOLDOWN)
    }
  }, [phase, enemies.length, waveTimer])

  useEffect(() => {
    if (phase === 'playing' && gameOver) {
      setPhase('gameover')
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current)
        try { localStorage.setItem('titan-rise-highscore', String(scoreRef.current)) } catch {}
      }
    }
  }, [phase, gameOver, highScore])

  if (phase === 'title') {
    return <TitleScreen onStart={() => { store.setGameState('zone'); setPhase('playing'); spawnWave(1); setGameOver(false); resetGame() }} highScore={highScore} />
  }

  if (phase === 'gameover') {
    return (
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.88)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: '20px', textAlign: 'center',
      }}>
        <div style={{ color: '#8b0000', fontSize: '34px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '3px' }}>DEFEAT</div>
        <div style={{ color: '#fff', fontSize: '16px', marginBottom: '6px' }}>Your ship was destroyed.</div>
        <div style={{ color: COLORS.TITANS_GOLD, fontSize: '14px', marginBottom: '6px' }}>Wave {wave}</div>
        <div style={{ color: '#fff', fontSize: '14px', marginBottom: '6px' }}>Score: {score}</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '22px' }}>Best: {highScore}</div>
        <button onClick={() => { const p = playerRef.current; p.hp = p.maxHp; setGameOver(false); setPhase('playing'); spawnWave(1); setWave(1); setWaveTimer(0); setScore(0); setCombo(0); }} style={{
          padding: '14px 32px', background: 'linear-gradient(135deg, #8b0000, #b22222)',
          border: '1px solid #d4af37', borderRadius: '6px', color: '#d4af37',
          cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px', minHeight: '50px',
        }}>
          Try Again
        </button>
        <button onClick={() => { setGameOver(false); setPhase('title'); resetGame() }} style={{
          padding: '10px 24px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(212,175,55,0.3)', borderRadius: '6px', color: '#d4af37',
          cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
        }}>
          Title Screen
        </button>
      </div>
    )
  }

  if (upgradesScreen) {
    const costs = { damage: 60, speed: 50, health: 55, multishot: 120 }
    return (
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(8,8,16,0.94)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: '20px', textAlign: 'center',
      }}>
        <div style={{ color: COLORS.TITANS_GOLD, fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '2px' }}>UPGRADES</div>
        <div style={{ color: '#fff', fontSize: '15px', marginBottom: '18px' }}>Score: {score}</div>
        {['damage', 'speed', 'health', 'multishot'].map((key) => {
          const cost = (costs[key] || 50) * (upgrades[key] + 1)
          const canBuy = score >= cost
          const labels = { damage: 'Damage', speed: 'Speed', health: 'Max HP', multishot: 'Multishot' }
          const icons = { damage: '⚔️', speed: '🚀', health: '❤️', multishot: '💥' }
          return (
            <button key={key} onClick={() => canBuy && (() => { setScore((s) => s - cost); saveUpgrades({ ...upgradesRef.current, [key]: upgradesRef.current[key] + 1 }); addParticles(WORLD_W/2, WORLD_H/2, '#d4af37', 15); screenShake(3) })()} style={{
              padding: '14px 22px', marginBottom: '10px', width: '100%', maxWidth: '300px',
              background: canBuy ? 'linear-gradient(135deg, rgba(139,0,0,0.4), rgba(178,34,34,0.25))' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${canBuy ? '#d4af37' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '10px', color: canBuy ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: canBuy ? 'pointer' : 'not-allowed', fontSize: '15px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: canBuy ? '0 0 15px rgba(139,0,0,0.3)' : 'none',
            }}>
              <span>{icons[key]} {labels[key]} Lv.{upgrades[key]}</span>
              <span style={{ color: canBuy ? '#d4af37' : 'rgba(255,255,255,0.3)' }}>{cost} ⭐</span>
            </button>
          )
        })}
        <button onClick={() => setUpgradesScreen(false)} style={{
          marginTop: '18px', padding: '12px 28px', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(212,175,55,0.35)', borderRadius: '8px', color: '#d4af37',
          cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', minHeight: '48px',
        }}>
          Close
        </button>
      </div>
    )
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf
    const bgStars = Array.from({ length: 80 }, () => ({
      x: Math.random() * WORLD_W * 2 - WORLD_W / 2,
      y: Math.random() * WORLD_H * 2 - WORLD_H / 2,
      r: 0.5 + Math.random() * 1.5,
      a: 0.3 + Math.random() * 0.7,
    }))

    const render = (time) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time
      const p = playerRef.current

      if (phaseRef.current === 'playing' && !upgradesScreenRef.current && !gameOverRef.current) {
        if (comboTimerRef.current > 0) {
          setComboTimer((t) => {
            const next = t - dt
            if (next <= 0) setCombo(0)
            return next
          })
        }

        if (p.lastShot > 0) p.lastShot -= dt * 1000
        if (p.rapidTimer > 0) p.rapidTimer -= dt * 1000
        if (p.shieldTimer > 0) p.shieldTimer -= dt * 1000
        if (p.dodgeTimer > 0) {
          p.dodgeTimer -= dt * 1000
          p.x += p.dodgeDir.x * dt
          p.y += p.dodgeDir.y * dt
          p.x = Math.max(PLAYER_R, Math.min(WORLD_W - PLAYER_R, p.x))
          p.y = Math.max(PLAYER_R, Math.min(WORLD_H - PLAYER_R, p.y))
          if (p.dodgeTimer <= 0) p.dodgeTimer = 0
        } else {
          const speed = 190 + upgradesRef.current.speed * 40
          const input = inputRef.current
          const moveX = input.x || 0
          const moveY = input.y || 0
          const len = Math.hypot(moveX, moveY) || 1
          if (len > 1) { input.x = moveX / len; input.y = moveY / len }
          p.x += (input.x || 0) * speed * dt
          p.y += (input.y || 0) * speed * dt
          p.x = Math.max(PLAYER_R, Math.min(WORLD_W - PLAYER_R, p.x))
          p.y = Math.max(PLAYER_R, Math.min(WORLD_H - PLAYER_R, p.y))
        }

        if (p.invulnTimer > 0) p.invulnTimer -= dt * 1000

        const now = Date.now()
        const aliveEnemies = enemiesRef.current.filter((e) => e.hp > 0)

        if (aliveEnemies.length === 0 && waveTimer <= 0 && phaseRef.current === 'playing') {
          setWaveTimer(WAVE_COOLDOWN)
        }

        if (waveTimer > 0) {
          setWaveTimer((t) => {
            const next = t - dt * 1000
            if (next <= 0 && phaseRef.current === 'playing') {
              const nextWave = waveRef.current + 1
              setWave(nextWave)
              spawnWave(nextWave)
            }
            return next
          })
        }

        setEnemies((prev) =>
          prev.map((e) => {
            if (e.hp <= 0) return e
            const dx = p.x - e.x
            const dy = p.y - e.y
            const dist = Math.hypot(dx, dy) || 1
            e.flash = Math.max(0, e.flash - dt * 10)

            if (e.stunned > 0) {
              return { ...e, stunned: e.stunned - dt * 1000 }
            }

            const moveSpeed = e.speed ? e.speed * dt : 1.4 * dt
            if (e.behavior === 'charge' && e.chargeTimer > 0) {
              e.x += e.chargeDir.x * moveSpeed * 2.2
              e.y += e.chargeDir.y * moveSpeed * 2.2
              e.chargeTimer -= dt * 1000
            } else if (e.behavior === 'charge' && e.chargeTimer <= 0 && dist < 200) {
              e.chargeDir = { x: (dx / dist) * 1, y: (dy / dist) * 1 }
              e.chargeTimer = 800 + Math.random() * 400
            } else {
              e.x += (dx / dist) * moveSpeed
              e.y += (dy / dist) * moveSpeed
            }

            e.x = Math.max(-40, Math.min(WORLD_W + 40, e.x))
            e.y = Math.max(-40, Math.min(WORLD_H + 40, e.y))

            if (dist < e.radius + PLAYER_R && now - e.lastAttack > e.attackCd && p.invulnTimer <= 0 && p.dodgeTimer <= 0) {
              if (p.shieldTimer > 0) {
                p.shieldTimer -= 500
                addDamageText(p.x, p.y - 30, 'BLOCKED', '#feca57', 13)
                addParticles(p.x, p.y, '#feca57', 8)
                e.lastAttack = now
                return e
              }
              const dmg = Math.max(1, e.damage - upgradesRef.current.health * 2)
              p.hp -= dmg
              p.invulnTimer = 420
              e.lastAttack = now
              screenShake(5)
              addDamageText(p.x, p.y - 30, `-${dmg}`, '#e74c3c', 15)
              addParticles(p.x, p.y, '#e74c3c', 8)
              if (p.hp <= 0) {
                p.hp = 0
                setGameOver(true)
              }
            }

            return e
          })
        )

        playerShoot()

        setPowerups((prev) =>
          prev
            .map((pu) => {
              const d = Math.hypot(p.x - pu.x, p.y - pu.y)
              if (d < PLAYER_R + pu.radius + 4) {
                activatePowerup(pu.type, p)
                return null
              }
              return { ...pu, y: pu.y + pu.vy * dt, life: pu.life - dt }
            })
            .filter(Boolean)
        )

        setParticles((prev) =>
          prev
            .map((pt) => {
              if (pt.life <= 0) return pt
              const nx = pt.x + pt.vx * dt
              const ny = pt.y + pt.vy * dt
              return {
                ...pt,
                x: nx, y: ny,
                vx: pt.vx * 0.94,
                vy: pt.vy * 0.94,
                life: pt.life - pt.decay * dt,
              }
            })
            .filter((pt) => pt.life > 0 && pt.x > -100 && pt.x < WORLD_W + 100 && pt.y > -100 && pt.y < WORLD_H + 100)
        )

        setDamageTexts((prev) =>
          prev
            .map((t) => ({ ...t, y: t.y - 45 * dt, life: t.life - t.decay * dt }))
            .filter((t) => t.life > 0)
        )
      }

      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * (window.devicePixelRatio || 1)
      canvas.height = rect.height * (window.devicePixelRatio || 1)
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0)
      const cw = rect.width
      const ch = rect.height

      const targetCamX = p.x
      const targetCamY = p.y - ch * 0.38
      const shakeX = cameraRef.current.shake > 0 ? (Math.random() - 0.5) * cameraRef.current.shake : 0
      const shakeY = cameraRef.current.shake > 0 ? (Math.random() - 0.5) * cameraRef.current.shake : 0
      if (cameraRef.current.shake > 0) cameraRef.current.shake = Math.max(0, cameraRef.current.shake - dt * 40)
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 5 * dt
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 5 * dt
      const camX = cameraRef.current.x + shakeX
      const camY = cameraRef.current.y + shakeY

      const bgGrad = ctx.createLinearGradient(0, 0, 0, ch)
      bgGrad.addColorStop(0, '#0b0c15')
      bgGrad.addColorStop(1, '#161831')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, cw, ch)

      ctx.save()
      ctx.translate(cw / 2 - camX, ch / 2 - camY)

      bgStars.forEach((star) => {
        const sx = star.x - camX * 0.3
        const sy = star.y - camY * 0.3
        ctx.globalAlpha = star.a * (0.6 + Math.sin(time * 0.001 + star.x) * 0.4)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath(); ctx.arc(sx, sy, star.r, 0, Math.PI * 2); ctx.fill()
      })
      ctx.globalAlpha = 1

      const gridGrad = ctx.createLinearGradient(-WORLD_W, -WORLD_H, WORLD_W, WORLD_H)
      gridGrad.addColorStop(0, 'rgba(212, 175, 55, 0.03)')
      gridGrad.addColorStop(1, 'rgba(139, 0, 0, 0.05)')
      ctx.strokeStyle = gridGrad
      ctx.lineWidth = 1
      for (let x = -WORLD_W; x < WORLD_W * 2; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, -WORLD_H); ctx.lineTo(x, WORLD_H * 2); ctx.stroke()
      }
      for (let y = -WORLD_H; y < WORLD_H * 2; y += 50) {
        ctx.beginPath(); ctx.moveTo(-WORLD_W, y); ctx.lineTo(WORLD_W * 2, y); ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = 'rgba(139, 0, 0, 0.35)'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(0, 0, 74, 0, Math.PI * 2); ctx.stroke()

      const waveLabel = `WAVE ${waveRef.current}`
      ctx.save()
      ctx.translate(0, -WORLD_H + 60)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.roundRect(-ctx.measureText(waveLabel).width / 2 - 16, -18, ctx.measureText(waveLabel).width + 32, 36, 10)
      ctx.fill()
      ctx.fillStyle = '#d4af37'
      ctx.font = 'bold 16px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(waveLabel, 0, 0)
      ctx.restore()

      powerupsRef.current.forEach((pu) => {
        ctx.save()
        ctx.translate(pu.x, pu.y)
        ctx.shadowColor = pu.color
        ctx.shadowBlur = 12
        ctx.fillStyle = pu.color
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#000'
        ctx.font = 'bold 9px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(pu.label, 0, 0)
        ctx.restore()
      })

      enemiesRef.current.forEach((e) => {
        if (e.hp <= 0) return
        ctx.save()
        ctx.translate(e.x, e.y)

        if (e.flash > 0) {
          ctx.shadowColor = '#fff'
          ctx.shadowBlur = 12
        }

        const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, e.radius)
        bodyGrad.addColorStop(0, e.color)
        bodyGrad.addColorStop(1, 'rgba(0,0,0,0.4)')
        ctx.fillStyle = bodyGrad
        ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke()

        ctx.fillStyle = '#1a0505'
        ctx.beginPath(); ctx.arc(0, -3, e.radius * 0.42, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.beginPath(); ctx.arc(-3, -5, 2, 0, Math.PI * 2); ctx.fill()

        if (e.behavior === 'boss') {
          ctx.strokeStyle = '#5f27cd'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(0, 0, e.radius + 4 + Math.sin(time * 0.008) * 2, 0, Math.PI * 2); ctx.stroke()
        }

        const hpPct = e.hp / e.maxHp
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(-e.radius, -e.radius - 11, e.radius * 2, 5)
        ctx.fillStyle = hpPct > 0.5 ? '#1dd1a1' : hpPct > 0.25 ? '#feca57' : '#ff6b6b'
        ctx.fillRect(-e.radius, -e.radius - 11, e.radius * 2 * Math.max(0, hpPct), 5)
        ctx.restore()
      })

      particlesRef.current.forEach((pt) => {
        ctx.globalAlpha = Math.max(0, pt.life)
        ctx.fillStyle = pt.color
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2); ctx.fill()
      })
      ctx.globalAlpha = 1

      damageTextsRef.current.forEach((t) => {
        ctx.globalAlpha = Math.max(0, t.life)
        ctx.fillStyle = t.color
        ctx.font = `bold ${t.size || 14}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 3
        ctx.fillText(t.text, t.x, t.y)
        ctx.shadowBlur = 0
      })
      ctx.globalAlpha = 1

      ctx.save()
      ctx.translate(p.x, p.y)
      if (p.invulnTimer > 0 && Math.floor(p.invulnTimer / 55) % 2 === 0) ctx.globalAlpha = 0.45

      const shipGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, PLAYER_R)
      shipGrad.addColorStop(0, '#54a0ff')
      shipGrad.addColorStop(1, '#0a3d7c')
      ctx.fillStyle = shipGrad
      ctx.beginPath(); ctx.arc(0, 0, PLAYER_R, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2.5; ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(0, -4, 4, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#000'
      ctx.beginPath(); ctx.arc(-2, -5, 1.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(2, -5, 1.5, 0, Math.PI * 2); ctx.fill()

      if (p.rapidTimer > 0) {
        ctx.strokeStyle = '#00d2d3'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(0, 0, PLAYER_R + 4 + Math.random() * 2, 0, Math.PI * 2); ctx.stroke()
      }
      if (p.shieldTimer > 0) {
        ctx.strokeStyle = 'rgba(254, 202, 87, 0.7)'; ctx.lineWidth = 2.5
        ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.arc(0, 0, PLAYER_R + 7, 0, Math.PI * 2); ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.restore()

      ctx.restore()

      const hpPct = p.hp / p.maxHp
      const barW = Math.min(220, cw - 40)
      const barH = 16
      const barX = 20
      const barY = ch - 70
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.roundRect(barX, barY, barW, barH, 8)
      ctx.fill()
      const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0)
      hpGrad.addColorStop(0, '#e74c3c')
      hpGrad.addColorStop(0.5, '#f39c12')
      hpGrad.addColorStop(1, '#2ecc71')
      ctx.fillStyle = hpGrad
      ctx.roundRect(barX, barY, barW * Math.max(0, hpPct), barH, 8)
      ctx.fill()
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(`HP ${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`, barX + barW / 2, barY + barH / 2)

      const comboY = ch - 110
      if (comboRef.current > 1) {
        ctx.save()
        ctx.fillStyle = '#ffdd57'
        ctx.font = 'bold 22px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowColor = '#d4af37'; ctx.shadowBlur = 12
        ctx.fillText(`${comboRef.current}x COMBO`, cw / 2, comboY)
        ctx.restore()
      }

      ctx.fillStyle = COLORS.TITANS_GOLD; ctx.font = 'bold 15px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      ctx.fillText(`WAVE ${waveRef.current}`, 20, 36)
      ctx.fillStyle = '#fff'; ctx.font = '13px Inter, sans-serif'
      ctx.fillText(`⭐ ${scoreRef.current}`, 20, 58)

      if (phaseRef.current === 'playing' && waveTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.roundRect(cw/2 - 90, ch/2 - 28, 180, 56, 12)
        ctx.fill()
        ctx.fillStyle = '#d4af37'; ctx.font = 'bold 17px Inter, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`NEXT WAVE`, cw / 2, ch / 2 - 4)
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px Inter, sans-serif'
        ctx.fillText(`in ${Math.ceil(waveTimer / 1000)}s`, cw / 2, ch / 2 + 18)
      }

      if (phaseRef.current === 'playing') {
        const btnY = ch - 135
        ctx.fillStyle = 'rgba(8,8,16,0.75)'
        ctx.roundRect(cw - 115, btnY, 95, 42, 12)
        ctx.fill()
        ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#d4af37'; ctx.font = 'bold 13px Inter, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('SHOP', cw - 67, btnY + 27)

        ctx.fillStyle = 'rgba(8,8,16,0.75)'
        ctx.roundRect(20, btnY, 70, 42, 12)
        ctx.fill()
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)'; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('DODGE', 55, btnY + 20)
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px Inter, sans-serif'
        ctx.fillText('tap hero', 55, btnY + 34)
      }

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [addParticles, addDamageText, screenShake, spawnPowerup, activatePowerup, playerShoot, playerDodge, spawnWave, store, upgrades, score, wave, phase, upgradesScreen, gameOver])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches ? e.touches[0] : e
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }

    const onStart = (e) => {
      const pos = getPos(e)
      inputRef.current.tapX = pos.x
      inputRef.current.tapY = pos.y
      inputRef.current.tapping = true
      inputRef.current.startX = pos.x
      inputRef.current.startY = pos.y
      inputRef.current.startTime = Date.now()
    }

    const onMove = (e) => {
      if (!inputRef.current.tapping) return
      const pos = getPos(e)
      const dx = pos.x - inputRef.current.startX
      const dy = pos.y - inputRef.current.startY
      inputRef.current.x = dx / 45
      inputRef.current.y = dy / 45
      const len = Math.hypot(inputRef.current.x, inputRef.current.y) || 1
      if (len > 1) { inputRef.current.x /= len; inputRef.current.y /= len }
    }

    const onEnd = (e) => {
      const wasTapping = inputRef.current.tapping
      const tapX = inputRef.current.tapX || 0
      const tapY = inputRef.current.tapY || 0
      const startX = inputRef.current.startX || 0
      const startY = inputRef.current.startY || 0
      const elapsed = Date.now() - (inputRef.current.startTime || Date.now())
      inputRef.current.tapping = false
      inputRef.current.x = 0
      inputRef.current.y = 0

      if (!wasTapping || phaseRef.current !== 'playing') return

      const dx = tapX - startX
      const dy = tapY - startY
      const dist = Math.hypot(dx, dy)

      const cw = canvas.getBoundingClientRect().width
      const ch = canvas.getBoundingClientRect().height

      if (dist < 12 && elapsed < 280) {
        if (tapX > cw - 125 && tapY > ch - 145 && tapY < ch - 95) {
          setUpgradesScreen(true)
          return
        }

        const worldTapX = tapX - cw / 2 + cameraRef.current.x
        const worldTapY = tapY - ch / 2 + cameraRef.current.y
        const p = playerRef.current
        const heroHit = Math.hypot(worldTapX - p.x, worldTapY - p.y) < PLAYER_R + 35

        if (heroHit) {
          playerDodge()
        } else {
          const hit = enemiesRef.current.find((en) => en.hp > 0 && Math.hypot(en.x - worldTapX, en.y - worldTapY) < en.radius + 22)
          if (hit) {
            const now = Date.now()
            const fireRate = p.rapidTimer > 0 ? 100 : 220
            if (now - p.lastShot >= fireRate) {
              p.lastShot = now
              const baseDamage = 14 + upgradesRef.current.damage * 9
              const isCrit = Math.random() < 0.18
              const damage = isCrit ? Math.floor(baseDamage * 1.9) : baseDamage
              const newHp = hit.hp - damage
              setEnemies((prev) => prev.map((e) => e.id === hit.id ? { ...e, hp: newHp, flash: 1 } : e))
              addDamageText(hit.x, hit.y - 22, `${damage}${isCrit ? '!' : ''}`, isCrit ? '#ffdd57' : '#fff', isCrit ? 18 : 15)
              addParticles(hit.x, hit.y, hit.color, isCrit ? 14 : 7)
              screenShake(isCrit ? 5 : 2)

              if (newHp <= 0) {
                setCombo((c) => c + 1)
                setComboTimer(1.6)
                const pts = hit.score * (1 + comboRef.current * 0.1)
                setScore((s) => s + Math.floor(pts))
                store.addDenarii(hit.score)
                store.addFame(Math.floor(hit.score / 2))
                addDamageText(hit.x, hit.y - 40, `+${Math.floor(pts)}`, '#d4af37', 15)
                addParticles(hit.x, hit.y, hit.color, 18)
                spawnPowerup(hit.x, hit.y)
              }
            }
          }
        }
      }
    }

    canvas.addEventListener('touchstart', onStart, { passive: false })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onEnd)
    canvas.addEventListener('mousedown', onStart)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onEnd)

    return () => {
      canvas.removeEventListener('touchstart', onStart)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onEnd)
      canvas.removeEventListener('mousedown', onStart)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onEnd)
    }
  }, [addParticles, addDamageText, screenShake, spawnPowerup, playerDodge, store])

  const buyUpgrade = useCallback((key) => {
    const costs = { damage: 60, speed: 50, health: 55, multishot: 120 }
    const cost = (costs[key] || 50) * (upgradesRef.current[key] + 1)
    if (score >= cost) {
      setScore((s) => s - cost)
      saveUpgrades({ ...upgradesRef.current, [key]: upgradesRef.current[key] + 1 })
      addParticles(WORLD_W / 2, WORLD_H / 2, '#d4af37', 15)
      screenShake(3)
    }
  }, [saveUpgrades, addParticles, screenShake, score])

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'block', touchAction: 'none',
        }}
      />
      <HUD onOpenShop={() => setUpgradesScreen(true)} />
    </>
  )
}

export default function App() {
  const [phase, setPhase] = useState('loading')
  const store = useGameStore()

  useEffect(() => {
    const timer = setTimeout(() => setPhase('title'), 500)
    return () => clearTimeout(timer)
  }, [])

  if (phase === 'loading') {
    return (
      <div style={{
        position: 'absolute', inset: 0, background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}>
        <div style={{
          width: '48px', height: '48px',
          border: '3px solid rgba(212, 175, 55, 0.2)', borderTop: '3px solid #d4af37',
          borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '18px',
        }} />
        <div style={{ color: '#d4af37', fontSize: '13px', letterSpacing: '3px' }}>LOADING...</div>
      </div>
    )
  }

  if (phase === 'title') {
    return (
      <>
        <TitleScreen onStart={() => { store.setGameState('zone'); setPhase('game'); }} highScore={(() => { try { return parseInt(localStorage.getItem('titan-rise-highscore') || '0', 10) } catch { return 0 } })()} />
        <style>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { overflow: hidden; touch-action: manipulation; -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; } button:active { transform: scale(0.95); } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    )
  }

  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100vh', height: '100dvh',
      overflow: 'hidden', background: '#0a0a0a',
    }}>
      <Game2D key="game2d" />
    </div>
  )
}
