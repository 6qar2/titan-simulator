import { useRef, useCallback, useEffect, useState } from 'react'
import { useControlsStore, useGameStore } from '../../../stores/gameStore'
import { INPUT_CONFIG } from '../../../utils/constants'

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

export function VirtualJoystick({ onMove, onEnd }) {
  const containerRef = useRef(null)
  const originRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const isActiveRef = useRef(false)
  const mobile = useMobile()
  const maxDistance = mobile ? 50 : 60
  const containerSize = mobile ? 110 : 140
  const thumbSize = mobile ? 44 : 60

  const handleStart = useCallback(
    (clientX, clientY) => {
      isActiveRef.current = true
      originRef.current = { x: clientX, y: clientY }
      currentRef.current = { x: clientX, y: clientY }
      onMove?.({ x: 0, y: 0 })
    },
    [onMove]
  )

  const handleMove = useCallback(
    (clientX, clientY) => {
      if (!isActiveRef.current) return
      currentRef.current = { x: clientX, y: clientY }
      const dx = clientX - originRef.current.x
      const dy = clientY - originRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const clampedDistance = Math.min(distance, maxDistance)
      const angle = Math.atan2(dy, dx)
      const nx = distance > 5 ? (clampedDistance / maxDistance) * Math.cos(angle) : 0
      const ny = distance > 5 ? (clampedDistance / maxDistance) * Math.sin(angle) : 0
      onMove?.({ x: nx, y: ny })
    },
    [onMove, maxDistance]
  )

  const handleEnd = useCallback(() => {
    if (!isActiveRef.current) return
    isActiveRef.current = false
    onMove?.({ x: 0, y: 0 })
    onEnd?.()
  }, [onMove, onEnd])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const getClient = (e) => {
      if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
      if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
      return { x: e.clientX, y: e.clientY }
    }

    const onStart = (e) => {
      e.preventDefault()
      const { x, y } = getClient(e)
      handleStart(x, y)
    }
    const onMove = (e) => {
      e.preventDefault()
      if (!isActiveRef.current) return
      const { x, y } = getClient(e)
      handleMove(x, y)
    }
    const onEnd = (e) => {
      e.preventDefault()
      handleEnd()
    }

    container.addEventListener('touchstart', onStart, { passive: false })
    container.addEventListener('touchmove', onMove, { passive: false })
    container.addEventListener('touchend', onEnd, { passive: false })
    container.addEventListener('touchcancel', onEnd, { passive: false })
    container.addEventListener('mousedown', onStart)
    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseup', onEnd)
    container.addEventListener('mouseleave', onEnd)

    return () => {
      container.removeEventListener('touchstart', onStart)
      container.removeEventListener('touchmove', onMove)
      container.removeEventListener('touchend', onEnd)
      container.removeEventListener('touchcancel', onEnd)
      container.removeEventListener('mousedown', onStart)
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseup', onEnd)
      container.removeEventListener('mouseleave', onEnd)
    }
  }, [handleStart, handleMove, handleEnd])

  const dx = currentRef.current.x - originRef.current.x
  const dy = currentRef.current.y - originRef.current.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const clampedDistance = Math.min(distance, maxDistance)
  const angle = Math.atan2(dy, dx)
  const thumbX = clampedDistance * Math.cos(angle)
  const thumbY = clampedDistance * Math.sin(angle)
  const thumbBg = isActiveRef.current ? 'rgba(212, 175, 55, 0.35)' : 'rgba(212, 175, 55, 0.15)'
  const borderColor = isActiveRef.current ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.2)'

  return (
    <div
      ref={containerRef}
      className="joystick-container"
      style={{
        position: 'absolute',
        bottom: mobile ? 'max(24px, var(--safe-bottom))' : '120px',
        left: mobile ? 'max(12px, var(--safe-left))' : '40px',
        width: containerSize,
        height: containerSize,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.04)',
        border: `1.5px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 20,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: '50%',
          background: thumbBg,
          border: `1.5px solid ${borderColor}`,
          transform: `translate(${thumbX}px, ${thumbY}px)`,
          transition: isActiveRef.current ? 'none' : 'transform 0.2s ease-out',
          boxShadow: isActiveRef.current
            ? '0 0 18px rgba(212, 175, 55, 0.4)'
            : '0 0 6px rgba(212, 175, 55, 0.15)',
        }}
      />
    </div>
  )
}

export function GestureZone({ onAttack, onBlock, onDodge }) {
  const zoneRef = useRef(null)
  const startRef = useRef({ x: 0, y: 0 })
  const mobile = useMobile()
  const size = mobile ? 100 : 140
  const fontSize = mobile ? '10px' : '12px'

  const handleStart = useCallback(
    (clientX, clientY) => {
      startRef.current = { x: clientX, y: clientY }
    },
    []
  )

  const handleEnd = useCallback(
    (clientX, clientY) => {
      const dx = clientX - startRef.current.x
      const dy = clientY - startRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < INPUT_CONFIG.ATTACK_GESTURE_THRESHOLD) {
        onAttack?.()
      } else if (distance > INPUT_CONFIG.DODGE_GESTURE_THRESHOLD) {
        if (Math.abs(dx) > Math.abs(dy)) {
          onDodge?.()
        } else {
          onBlock?.()
        }
      }
    },
    [onAttack, onBlock, onDodge]
  )

  useEffect(() => {
    const zone = zoneRef.current
    if (!zone) return

    const getClient = (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
      return { x: e.clientX, y: e.clientY }
    }
    const getStart = (e) => {
      if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
      return { x: e.clientX, y: e.clientY }
    }

    const onStart = (e) => {
      e.preventDefault()
      const { x, y } = getStart(e)
      handleStart(x, y)
    }
    const onEnd = (e) => {
      e.preventDefault()
      const { x, y } = getClient(e)
      handleEnd(x, y)
    }

    zone.addEventListener('touchstart', onStart, { passive: false })
    zone.addEventListener('touchend', onEnd, { passive: false })
    zone.addEventListener('touchcancel', onEnd, { passive: false })
    zone.addEventListener('mousedown', onStart)
    zone.addEventListener('mouseup', onEnd)

    return () => {
      zone.removeEventListener('touchstart', onStart)
      zone.removeEventListener('touchend', onEnd)
      zone.removeEventListener('touchcancel', onEnd)
      zone.removeEventListener('mousedown', onStart)
      zone.removeEventListener('mouseup', onEnd)
    }
  }, [handleStart, handleEnd])

  return (
    <div
      ref={zoneRef}
      className="gesture-zone"
      style={{
        position: 'absolute',
        bottom: mobile ? 'max(24px, var(--safe-bottom))' : '120px',
        right: mobile ? 'max(12px, var(--safe-right))' : '40px',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1.5px solid rgba(212, 175, 55, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 20,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          color: 'rgba(212, 175, 55, 0.55)',
          fontSize,
          textAlign: 'center',
          fontWeight: 'bold',
          letterSpacing: '1px',
          lineHeight: 1.4,
        }}
      >
        TAP<br />ATTACK
      </div>
    </div>
  )
}

export function TacticsButton({ onClick, active }) {
  const mobile = useMobile()
  const size = mobile ? 52 : 64
  const fontSize = mobile ? '11px' : '14px'
  const bottom = mobile ? 'max(12px, var(--safe-bottom))' : '40px'
  const right = mobile ? 'max(12px, var(--safe-right))' : '40px'

  return (
    <button
      onClick={onClick}
      className="tactics-button"
      style={{
        position: 'absolute',
        bottom,
        right,
        width: size,
        height: size,
        borderRadius: '50%',
        background: active
          ? 'linear-gradient(135deg, #8b0000, #b22222)'
          : 'linear-gradient(135deg, #1a1a2e, #16213e)',
        border: `1.5px solid ${active ? '#d4af37' : 'rgba(212, 175, 55, 0.35)'}`,
        color: '#d4af37',
        fontSize,
        fontWeight: 'bold',
        cursor: 'pointer',
        touchAction: 'manipulation',
        userSelect: 'none',
        boxShadow: active
          ? '0 0 22px rgba(139, 0, 0, 0.6), inset 0 0 10px rgba(212, 175, 55, 0.3)'
          : '0 4px 15px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.2s ease',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        zIndex: 20,
        minWidth: size,
        minHeight: size,
        pointerEvents: 'auto',
      }}
    >
      TAC
    </button>
  )
}
