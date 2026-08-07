import { useRef, useCallback, useEffect } from 'react'
import { useControlsStore, useGameStore } from '../../../stores/gameStore'
import { INPUT_CONFIG } from '../../../utils/constants'

export function VirtualJoystick({ onMove, onEnd }) {
  const containerRef = useRef(null)
  const originRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const isActiveRef = useRef(false)

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
      const maxDistance = 60
      const clampedDistance = Math.min(distance, maxDistance)
      const angle = Math.atan2(dy, dx)
      const nx = (clampedDistance / maxDistance) * Math.cos(angle)
      const ny = (clampedDistance / maxDistance) * Math.sin(angle)

      if (distance > INPUT_CONFIG.JOYSTICK_DEADZONE) {
        onMove?.({ x: nx, y: ny })
      }
    },
    [onMove]
  )

  const handleEnd = useCallback(() => {
    isActiveRef.current = false
    onMove?.({ x: 0, y: 0 })
    onEnd?.()
  }, [onMove, onEnd])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onTouchStart = (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    }

    const onTouchMove = (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    const onTouchEnd = (e) => {
      e.preventDefault()
      handleEnd()
    }

    const onMouseDown = (e) => {
      handleStart(e.clientX, e.clientY)
    }

    const onMouseMove = (e) => {
      if (isActiveRef.current) {
        handleMove(e.clientX, e.clientY)
      }
    }

    const onMouseUp = () => {
      if (isActiveRef.current) {
        handleEnd()
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: false })
    container.addEventListener('touchcancel', onTouchEnd, { passive: false })
    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseup', onMouseUp)
    container.addEventListener('mouseleave', onMouseUp)

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('touchcancel', onTouchEnd)
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('mouseleave', onMouseUp)
    }
  }, [handleStart, handleMove, handleEnd])

  const dx = currentRef.current.x - originRef.current.x
  const dy = currentRef.current.y - originRef.current.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const maxDistance = 60
  const clampedDistance = Math.min(distance, maxDistance)
  const angle = Math.atan2(dy, dx)
  const thumbX = clampedDistance * Math.cos(angle)
  const thumbY = clampedDistance * Math.sin(angle)

  return (
    <div
      ref={containerRef}
      className="joystick-container"
      style={{
        position: 'absolute',
        bottom: '120px',
        left: '40px',
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(212, 175, 55, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isActiveRef.current
            ? 'rgba(212, 175, 55, 0.4)'
            : 'rgba(212, 175, 55, 0.2)',
          border: '2px solid rgba(212, 175, 55, 0.6)',
          transform: `translate(${thumbX}px, ${thumbY}px)`,
          transition: isActiveRef.current ? 'none' : 'transform 0.2s ease-out',
          boxShadow: isActiveRef.current
            ? '0 0 15px rgba(212, 175, 55, 0.5)'
            : '0 0 5px rgba(212, 175, 55, 0.2)',
        }}
      />
    </div>
  )
}

export function GestureZone({ onAttack, onBlock, onDodge }) {
  const zoneRef = useRef(null)
  const startRef = useRef({ x: 0, y: 0 })

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

    const onTouchStart = (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    }

    const onTouchEnd = (e) => {
      e.preventDefault()
      const touch = e.changedTouches[0]
      handleEnd(touch.clientX, touch.clientY)
    }

    const onMouseDown = (e) => {
      handleStart(e.clientX, e.clientY)
    }

    const onMouseUp = (e) => {
      handleEnd(e.clientX, e.clientY)
    }

    zone.addEventListener('touchstart', onTouchStart, { passive: false })
    zone.addEventListener('touchend', onTouchEnd, { passive: false })
    zone.addEventListener('touchcancel', onTouchEnd, { passive: false })
    zone.addEventListener('mousedown', onMouseDown)
    zone.addEventListener('mouseup', onMouseUp)

    return () => {
      zone.removeEventListener('touchstart', onTouchStart)
      zone.removeEventListener('touchend', onTouchEnd)
      zone.removeEventListener('touchcancel', onTouchEnd)
      zone.removeEventListener('mousedown', onMouseDown)
      zone.removeEventListener('mouseup', onMouseUp)
    }
  }, [handleStart, handleEnd])

  return (
    <div
      ref={zoneRef}
      className="gesture-zone"
      style={{
        position: 'absolute',
        bottom: '120px',
        right: '40px',
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '2px solid rgba(212, 175, 55, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          color: 'rgba(212, 175, 55, 0.5)',
          fontSize: '12px',
          textAlign: 'center',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}
      >
        TAP<br />ATTACK
      </div>
    </div>
  )
}

export function TacticsButton({ onClick, active }) {
  return (
    <button
      onClick={onClick}
      className="tactics-button"
      style={{
        position: 'absolute',
        bottom: '40px',
        right: '40px',
        width: `${INPUT_CONFIG.TACTICS_BUTTON_SIZE}px`,
        height: `${INPUT_CONFIG.TACTICS_BUTTON_SIZE}px`,
        borderRadius: '50%',
        background: active
          ? 'linear-gradient(135deg, #8b0000, #b22222)'
          : 'linear-gradient(135deg, #1a1a2e, #16213e)',
        border: `2px solid ${active ? '#d4af37' : 'rgba(212, 175, 55, 0.4)'}`,
        color: '#d4af37',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        touchAction: 'manipulation',
        userSelect: 'none',
        boxShadow: active
          ? '0 0 20px rgba(139, 0, 0, 0.6), inset 0 0 10px rgba(212, 175, 55, 0.3)'
          : '0 4px 15px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.2s ease',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}
    >
      TAC
    </button>
  )
}
