import { useState, useEffect, useRef, useCallback } from 'react'
import { TitleScreen } from './components/Game/TitleScreen/TitleScreen'
import { HUD } from './components/Game/HUD/HUD'
import { useGameStore, playerPositionRef } from './stores/gameStore'
import { COLORS } from './utils/constants'
import './styles/global.css'

const WORLD_W = 400
const WORLD_H = 700
const PLAYER_R = 22
const ENEMY_R = 18
const AUTO_ATTACK_RANGE = 160
const AUTO_ATTACK_CD = 600
const DODGE_SPEED = 320
const DODGE_DURATION = 180
const WAVE_COOLDOWN = 1800

const ENEMY_TYPES = {
  scout: { name: 'Scout', hp: 30, speed: 1.4, damage: 6, color: '#e67e22', radius: ENEMY_R, score: 10 },
  fighter: { name: 'Fighter', hp: 55, speed: 1.0, damage: 10, color: '#c0392b', radius: ENEMY_R + 2, score: 20 },
  brute: { name: 'Brute', hp: 90, speed: 0.7, damage: 16, color: '#8e44ad', radius: ENEMY_R + 5, score: 35 },
  boss: { name: 'Champion', hp: 180, speed: 0.55, damage: 22, color: '#2c3e50', radius: ENEMY_R + 8, score: 100 },
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
      position: 'absolute', inset: 0, background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
      <div style={{ color: '#d4af37', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', fontFamily: 'serif' }}>
        ROTATE YOUR DEVICE
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', maxWidth: '400px' }}>
        Titan Simulator requires landscape mode for the best combat experience.
      </div>
    </div>
  )
}

function Game2D() {
  const canvasRef = useRef(null)
  const store = useGameStore()
  const [phase, setPhase] = useState('playing')
  const [wave, setWave] = useState(1)
  const [combo, setCombo] = useState(0)
  const [comboTimer, setComboTimer] = useState(0)
  const [lastDamage, setLastDamage] = useState(0)
  const [enemies, setEnemies] = useState([])
  const [particles, setParticles] = useState([])
  const [damageTexts, setDamageTexts] = useState([])
  const [waveTimer, setWaveTimer] = useState(0)
  const [upgrades, setUpgrades] = useState(() => {
    try {
      const s = localStorage.getItem('titan-simulator-upgrades')
      return s ? JSON.parse(s) : { damage: 0, speed: 0, health: 0 }
    } catch { return { damage: 0, speed: 0, health: 0 } }
  })
  const [upgradesScreen, setUpgradesScreen] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const playerRef = useRef({
    x: WORLD_W / 2, y: WORLD_H - 140,
    vx: 0, vy: 0,
    hp: 100, maxHp: 100,
    dodgeTimer: 0, dodgeDir: { x: 0, y: 0 },
    invulnTimer: 0,
    lastAutoAttack: 0,
    attacking: false,
    attackTimer: 0,
    targetId: null,
  })

  const cameraRef = useRef({ x: 0, y: 0 })
  const inputRef = useRef({ x: 0, y: 0, tapping: false, tapX: 0, tapY: 0 })
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
  const playerRefCurrent = useRef(playerRef.current)

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

  const saveUpgrades = useCallback((u) => {
    setUpgrades(u)
    upgradesRef.current = u
    try { localStorage.setItem('titan-simulator-upgrades', JSON.stringify(u)) } catch {}
  }, [])

  const addParticles = useCallback((x, y, color, count = 8) => {
    const newParticles = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 60 + Math.random() * 120
      newParticles.push({
        id: Date.now() + Math.random(),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 1.5 + Math.random() * 1.5,
        color,
        radius: 2 + Math.random() * 3,
      })
    }
    setParticles((p) => [...p, ...newParticles])
  }, [])

  const addDamageText = useCallback((x, y, text, color = '#fff') => {
    setDamageTexts((t) => [...t, { id: Date.now() + Math.random(), x, y, text, color, life: 1, decay: 1.2 }])
  }, [])

  const spawnWave = useCallback((waveNum) => {
    const newEnemies = []
    const count = Math.min(3 + waveNum, 12)
    const types = ['scout']
    if (waveNum >= 2) types.push('fighter')
    if (waveNum >= 4) types.push('brute')
    if (waveNum >= 6 && waveNum % 3 === 0) types.push('boss')

    for (let i = 0; i < count; i++) {
      const typeKey = types[Math.floor(Math.random() * types.length)]
      const type = ENEMY_TYPES[typeKey]
      const hpScale = 1 + (waveNum - 1) * 0.15
      newEnemies.push({
        id: Date.now() + i,
        type: typeKey,
        x: 40 + Math.random() * (WORLD_W - 80),
        y: -40 - Math.random() * 120,
        vx: (Math.random() - 0.5) * 20,
        vy: type.speed * (40 + waveNum * 4),
        hp: Math.floor(type.hp * hpScale),
        maxHp: Math.floor(type.hp * hpScale),
        damage: type.damage + Math.floor(waveNum * 1.5),
        color: type.color,
        radius: type.radius,
        score: type.score,
        lastAttack: 0,
        attackCd: 1200 + Math.random() * 800,
        stunned: 0,
      })
    }
    setEnemies(newEnemies)
  }, [])

  const playerAttack = useCallback((target) => {
    const p = playerRef.current
    if (p.attackTimer > 0 || phaseRef.current !== 'playing') return
    p.attacking = true
    p.attackTimer = 180
    p.targetId = target.id

    const baseDamage = 12 + upgradesRef.current.damage * 8
    const isCrit = Math.random() < 0.15 + comboRef.current * 0.02
    const damage = isCrit ? Math.floor(baseDamage * 1.8) : baseDamage
    const newHp = target.hp - damage

    setEnemies((prev) => prev.map((e) => e.id === target.id ? { ...e, hp: newHp } : e))
    addDamageText(target.x, target.y - 20, `${damage}${isCrit ? '!' : ''}`, isCrit ? '#ffdd57' : '#fff')
    addParticles(target.x, target.y, target.color, isCrit ? 14 : 8)

    if (newHp <= 0) {
      setCombo((c) => c + 1)
      setComboTimer(1.5)
      setWave((w) => w + 0)
      addParticles(target.x, target.y, target.color, 16)
      addDamageText(target.x, target.y - 35, `+${target.score}`, '#d4af37')
      store.addDenarii(target.score)
      store.addFame(Math.floor(target.score / 2))
    }
  }, [addParticles, addDamageText, store])

  const playerDodge = useCallback(() => {
    const p = playerRef.current
    if (p.dodgeTimer > 0 || phaseRef.current !== 'playing') return
    const input = inputRef.current
    const dirX = input.x || 0
    const dirY = input.y || -1
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1
    p.dodgeTimer = DODGE_DURATION
    p.dodgeDir = { x: (dirX / len) * DODGE_SPEED, y: (dirY / len) * DODGE_SPEED }
    p.invulnTimer = 250
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf
    let lastTime = performance.now()

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time
      const p = playerRef.current

      if (phaseRef.current === 'playing' && !upgradesScreenRef.current && !gameOverRef.current) {
        if (comboTimerRef.current > 0) {
          setComboTimer((t) => t - dt)
          if (comboTimerRef.current <= 0) setCombo(0)
        }

        if (p.attackTimer > 0) {
          p.attackTimer -= dt * 1000
          if (p.attackTimer <= 0) {
            p.attacking = false
            p.attackTimer = 0
          }
        }

        if (p.dodgeTimer > 0) {
          p.dodgeTimer -= dt * 1000
          p.x += p.dodgeDir.x * dt
          p.y += p.dodgeDir.y * dt
          p.x = Math.max(PLAYER_R, Math.min(WORLD_W - PLAYER_R, p.x))
          p.y = Math.max(PLAYER_R, Math.min(WORLD_H - PLAYER_R, p.y))
          if (p.dodgeTimer <= 0) p.dodgeTimer = 0
        } else {
          const speed = 180 + upgradesRef.current.speed * 35
          const input = inputRef.current
          const moveX = input.x || 0
          const moveY = input.y || 0
          const len = Math.sqrt(moveX * moveX + moveY * moveY) || 1
          if (len > 1) { input.x = moveX / len; input.y = moveY / len }
          p.x += (input.x || 0) * speed * dt
          p.y += (input.y || 0) * speed * dt
          p.x = Math.max(PLAYER_R, Math.min(WORLD_W - PLAYER_R, p.x))
          p.y = Math.max(PLAYER_R, Math.min(WORLD_H - PLAYER_R, p.y))
        }

        if (p.invulnTimer > 0) p.invulnTimer -= dt * 1000

        playerPositionRef.current = [p.x / WORLD_W, 1 - p.y / WORLD_H]

        const now = Date.now()
        const aliveEnemies = enemiesRef.current.filter((e) => e.hp > 0)

        if (aliveEnemies.length === 0 && waveTimer <= 0) {
          setWaveTimer(WAVE_COOLDOWN)
        }

        if (waveTimer > 0) {
          setWaveTimer((t) => t - dt * 1000)
          if (waveTimer <= 0 && phaseRef.current === 'playing') {
            const next = waveRef.current + 1
            setWave(next)
            spawnWave(next)
          }
        }

        if (now - p.lastAutoAttack > AUTO_ATTACK_CD && aliveEnemies.length > 0) {
          const nearest = aliveEnemies.reduce((a, b) => {
            const da = Math.hypot(a.x - p.x, a.y - p.y)
            const db = Math.hypot(b.x - p.x, b.y - p.y)
            return da < db ? a : b
          })
          const dist = Math.hypot(nearest.x - p.x, nearest.y - p.y)
          if (dist < AUTO_ATTACK_RANGE) {
            p.lastAutoAttack = now
            const baseDamage = 8 + upgradesRef.current.damage * 5
            const newHp = nearest.hp - baseDamage
            setEnemies((prev) => prev.map((e) => e.id === nearest.id ? { ...e, hp: newHp } : e))
            addDamageText(nearest.x, nearest.y - 20, `${baseDamage}`, '#aaa')
            addParticles(nearest.x, nearest.y, '#fff', 4)
            if (newHp <= 0) {
              store.addDenarii(nearest.score)
              store.addFame(Math.floor(nearest.score / 2))
            }
          }
        }

        setEnemies((prev) =>
          prev.map((e) => {
            if (e.hp <= 0) return e
            const dx = p.x - e.x
            const dy = p.y - e.y
            const dist = Math.hypot(dx, dy) || 1

            if (e.stunned > 0) {
              return { ...e, stunned: e.stunned - dt * 1000 }
            }

            const speed = e.vy * dt
            e.x += (dx / dist) * speed
            e.y += (dy / dist) * speed

            if (dist < e.radius + PLAYER_R && now - e.lastAttack > e.attackCd && p.invulnTimer <= 0 && p.dodgeTimer <= 0) {
              const dmg = Math.max(1, e.damage - upgradesRef.current.health * 2)
              p.hp -= dmg
              p.invulnTimer = 400
              e.lastAttack = now
              addDamageText(p.x, p.y - 30, `-${dmg}`, '#e74c3c')
              addParticles(p.x, p.y, '#e74c3c', 6)
              if (p.hp <= 0) {
                p.hp = 0
                setGameOver(true)
              }
            }

            return e
          })
        )

        setParticles((prev) =>
          prev
            .map((pt) => ({
              ...pt,
              x: pt.x + pt.vx * dt,
              y: pt.y + pt.vy * dt,
              vx: pt.vx * 0.96,
              vy: pt.vy * 0.96,
              life: pt.life - pt.decay * dt,
            }))
            .filter((pt) => pt.life > 0)
        )

        setDamageTexts((prev) =>
          prev
            .map((t) => ({ ...t, y: t.y - 40 * dt, life: t.life - t.decay * dt }))
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
      const targetCamY = p.y - ch * 0.35
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 4 * dt
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 4 * dt
      const camX = cameraRef.current.x
      const camY = cameraRef.current.y

      ctx.fillStyle = '#0f0f1a'
      ctx.fillRect(0, 0, cw, ch)

      ctx.save()
      ctx.translate(cw / 2 - camX, ch / 2 - camY)

      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(-WORLD_W, -WORLD_H, WORLD_W * 2, WORLD_H * 2)
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)'
      ctx.lineWidth = 1
      for (let x = -WORLD_W; x < WORLD_W * 2; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, -WORLD_H); ctx.lineTo(x, WORLD_H * 2); ctx.stroke()
      }
      for (let y = -WORLD_H; y < WORLD_H * 2; y += 40) {
        ctx.beginPath(); ctx.moveTo(-WORLD_W, y); ctx.lineTo(WORLD_W * 2, y); ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(139, 0, 0, 0.35)'
      ctx.lineWidth = 4
      ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(0, 0, 94, 0, Math.PI * 2); ctx.stroke()

      enemiesRef.current.forEach((e) => {
        if (e.hp <= 0) return
        const flash = e.stunned > 0 && Math.floor(e.stunned / 80) % 2 === 0
        ctx.save()
        ctx.translate(e.x, e.y)
        ctx.globalAlpha = flash ? 0.6 : 1
        ctx.fillStyle = e.color
        ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#1a0a00'
        ctx.beginPath(); ctx.arc(0, -2, e.radius * 0.45, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
        ctx.restore()

        const hpPct = e.hp / e.maxHp
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(e.x - e.radius, e.y - e.radius - 10, e.radius * 2, 5)
        ctx.fillStyle = hpPct > 0.5 ? '#27ae60' : hpPct > 0.25 ? '#f39c12' : '#e74c3c'
        ctx.fillRect(e.x - e.radius, e.y - e.radius - 10, e.radius * 2 * hpPct, 5)
      })

      particlesRef.current.forEach((pt) => {
        ctx.globalAlpha = pt.life
        ctx.fillStyle = pt.color
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2); ctx.fill()
      })
      ctx.globalAlpha = 1

      damageTextsRef.current.forEach((t) => {
        ctx.globalAlpha = t.life
        ctx.fillStyle = t.color
        ctx.font = 'bold 14px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(t.text, t.x, t.y)
      })
      ctx.globalAlpha = 1

      ctx.save()
      ctx.translate(p.x, p.y)
      if (p.invulnTimer > 0 && Math.floor(p.invulnTimer / 60) % 2 === 0) ctx.globalAlpha = 0.5
      ctx.fillStyle = '#d4a574'
      ctx.beginPath(); ctx.arc(0, 0, PLAYER_R, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3; ctx.stroke()
      ctx.fillStyle = '#2c1810'
      ctx.beginPath(); ctx.arc(0, -3, PLAYER_R * 0.45, 0, Math.PI * 2); ctx.fill()
      if (p.attacking) {
        ctx.strokeStyle = '#ffdd57'; ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(0, 0, PLAYER_R + 6 + Math.random() * 3, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.restore()

      ctx.restore()

      const hpPct = p.hp / p.maxHp
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(20, ch - 60, 180, 18)
      ctx.fillStyle = hpPct > 0.5 ? '#27ae60' : hpPct > 0.25 ? '#f39c12' : '#e74c3c'
      ctx.fillRect(20, ch - 60, 180 * hpPct, 18)
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.strokeRect(20, ch - 60, 180, 18)
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(`HP ${Math.max(0, p.hp)} / ${p.maxHp}`, 110, ch - 46)

      ctx.fillStyle = '#d4af37'; ctx.font = 'bold 14px Inter, sans-serif'; ctx.textAlign = 'left'
      ctx.fillText(`WAVE ${waveRef.current}`, 20, 30)
      ctx.fillStyle = '#fff'; ctx.font = '12px Inter, sans-serif'
      ctx.fillText(`Denarii: ${store.denarii}`, 20, 52)

      if (comboRef.current > 1) {
        ctx.save()
        ctx.fillStyle = '#ffdd57'
        ctx.font = 'bold 22px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowColor = '#d4af37'; ctx.shadowBlur = 10
        ctx.fillText(`${comboRef.current}x COMBO`, cw / 2, 70)
        ctx.restore()
      }

      if (phaseRef.current === 'playing' && waveTimer > 0) {
        ctx.fillStyle = '#d4af37'; ctx.font = 'bold 18px Inter, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`NEXT WAVE IN ${Math.ceil(waveTimer / 1000)}`, cw / 2, ch / 2 - 20)
        ctx.fillStyle = 'rgba(212,175,55,0.3)'; ctx.font = '13px Inter, sans-serif'
        ctx.fillText('Tap UPGRADE to spend denarii', cw / 2, ch / 2 + 10)
      }

      if (phaseRef.current === 'playing') {
        const btnY = ch - 120
        ctx.fillStyle = 'rgba(10,10,10,0.7)'
        ctx.roundRect(cw - 120, btnY, 100, 40, 10)
        ctx.fill()
        ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#d4af37'; ctx.font = 'bold 13px Inter, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('UPGRADE', cw - 70, btnY + 26)
      }

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [addParticles, addDamageText, spawnWave, store, playerAttack, playerDodge])

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
      inputRef.current.x = dx / 40
      inputRef.current.y = dy / 40
      const len = Math.hypot(inputRef.current.x, inputRef.current.y) || 1
      if (len > 1) { inputRef.current.x /= len; inputRef.current.y /= len }
    }

    const onEnd = (e) => {
      const wasTapping = inputRef.current.tapping
      const startX = inputRef.current.startX || 0
      const startY = inputRef.current.startY || 0
      const tapX = inputRef.current.tapX || 0
      const tapY = inputRef.current.tapY || 0
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

      if (dist < 15 && elapsed < 300) {
        if (tapX > cw - 130 && tapY > ch - 140) {
          setUpgradesScreen(true)
          return
        }

        const worldTapX = tapX - cw / 2 + cameraRef.current.x
        const worldTapY = tapY - ch / 2 + cameraRef.current.y
        const p = playerRef.current
        const hit = enemiesRef.current
          .filter((e) => e.hp > 0)
          .find((e) => Math.hypot(e.x - worldTapX, e.y - worldTapY) < e.radius + 20)

        if (hit) {
          playerAttack(hit)
        } else if (Math.hypot(worldTapX - p.x, worldTapY - p.y) < PLAYER_R + 30) {
          playerDodge()
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
  }, [addParticles, addDamageText, playerAttack, playerDodge, store])

  const buyUpgrade = useCallback((key) => {
    const costs = { damage: 50, speed: 40, health: 45 }
    const cost = (costs[key] || 50) * (upgradesRef.current[key] + 1)
    if (store.denarii >= cost) {
      store.removeDenarii(cost)
      saveUpgrades({ ...upgradesRef.current, [key]: upgradesRef.current[key] + 1 })
      addParticles(playerRef.current.x, playerRef.current.y, '#d4af37', 12)
    }
  }, [store, saveUpgrades, addParticles])

  const resetGame = useCallback(() => {
    const p = playerRef.current
    p.x = WORLD_W / 2
    p.y = WORLD_H - 140
    p.vx = 0
    p.vy = 0
    p.hp = 100
    p.maxHp = 100 + upgradesRef.current.health * 25
    p.dodgeTimer = 0
    p.invulnTimer = 0
    p.lastAutoAttack = 0
    p.attacking = false
    p.attackTimer = 0
    p.targetId = null
    setEnemies([])
    setParticles([])
    setDamageTexts([])
    setWaveTimer(0)
    setCombo(0)
    setComboTimer(0)
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
    }
  }, [phase, gameOver])

  if (phase === 'title') {
    return <TitleScreen onStart={() => { store.setGameState('zone'); setPhase('playing'); spawnWave(1); setGameOver(false); resetGame() }} />
  }

  if (phase === 'gameover') {
    return (
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.85)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: '20px', textAlign: 'center',
      }}>
        <div style={{ color: '#8b0000', fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>DEFEAT</div>
        <div style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>You have been defeated.</div>
        <div style={{ color: COLORS.TITANS_GOLD, fontSize: '14px', marginBottom: '20px' }}>Wave {wave} · Fame: {store.gladiatorProgress.fame}</div>
        <button onClick={() => { const p = playerRef.current; p.hp = p.maxHp; setGameOver(false); setPhase('playing'); spawnWave(1); setWave(1); setWaveTimer(0); store.setGameState('zone'); store.exitCombat && store.exitCombat(); store.denarii && store.removeDenarii(0); }} style={{
          padding: '12px 30px', background: 'linear-gradient(135deg, #8b0000, #b22222)',
          border: '1px solid #d4af37', borderRadius: '4px', color: '#d4af37',
          cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px',
        }}>
          Try Again
        </button>
        <button onClick={() => setPhase('title')} style={{
          padding: '10px 24px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(212,175,55,0.3)', borderRadius: '4px', color: '#d4af37',
          cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
        }}>
          Title Screen
        </button>
      </div>
    )
  }

  if (upgradesScreen) {
    const costs = { damage: 50, speed: 40, health: 45 }
    return (
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.9)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: '20px', textAlign: 'center',
      }}>
        <div style={{ color: COLORS.TITANS_GOLD, fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>UPGRADES</div>
        <div style={{ color: '#fff', fontSize: '14px', marginBottom: '20px' }}>Denarii: {store.denarii}</div>
        {['damage', 'speed', 'health'].map((key) => {
          const cost = (costs[key] || 50) * (upgrades[key] + 1)
          const canBuy = store.denarii >= cost
          const labels = { damage: 'Damage', speed: 'Speed', health: 'Max HP' }
          const icons = { damage: '⚔️', speed: '💨', health: '❤️' }
          return (
            <button key={key} onClick={() => canBuy && buyUpgrade(key)} style={{
              padding: '14px 24px', marginBottom: '10px', width: '100%', maxWidth: '280px',
              background: canBuy ? 'rgba(139,0,0,0.3)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${canBuy ? '#d4af37' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px', color: canBuy ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: canBuy ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{icons[key]} {labels[key]} Lv.{upgrades[key]}</span>
              <span style={{ color: canBuy ? '#d4af37' : 'rgba(255,255,255,0.3)' }}>{cost} 💰</span>
            </button>
          )
        })}
        <button onClick={() => setUpgradesScreen(false)} style={{
          marginTop: '16px', padding: '10px 24px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(212,175,55,0.3)', borderRadius: '4px', color: '#d4af37',
          cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
        }}>
          Close
        </button>
      </div>
    )
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'block', touchAction: 'none',
        }}
      />
      <HUD />
    </>
  )
}

export default function App() {
  const landscape = useLandscape()
  const [phase, setPhase] = useState('loading')
  const store = useGameStore()

  useEffect(() => {
    const timer = setTimeout(() => setPhase('title'), 600)
    return () => clearTimeout(timer)
  }, [])

  if (phase === 'loading') {
    return (
      <div style={{
        position: 'absolute', inset: 0, background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200,
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

  if (phase === 'title') {
    return (
      <>
        <TitleScreen onStart={() => { store.setGameState('zone'); setPhase('game'); }} />
        <style>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { overflow: hidden; touch-action: manipulation; -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; } button:active { transform: scale(0.95); } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    )
  }

  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100vh', height: '100dvh',
      overflow: 'hidden', background: '#0a0a0a',
    }}>
      {!landscape && <PortraitWarning />}
      <Game2D key="game2d" />
    </div>
  )
}
