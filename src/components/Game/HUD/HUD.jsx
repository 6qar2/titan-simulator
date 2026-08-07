import { useState, useEffect } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { COLORS } from '../../../utils/constants'
import { requestFullscreen, exitFullscreen, isFullscreen } from '../../../utils/fullscreen'

const isMobileScreen = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024)
}

export function HUD({ onOpenShop }) {
  const gameStore = useGameStore()
  const [fullscreen, setFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileScreen())
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const onFsChange = () => setFullscreen(isFullscreen())
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none', zIndex: 10,
    }}>
      <button
        onClick={async () => {
          if (fullscreen) exitFullscreen()
          else {
            const ok = await requestFullscreen()
            if (!ok) window.scrollTo(0, 1)
          }
        }}
        style={{
          position: 'absolute',
          top: isMobile ? 'max(12px, env(safe-area-inset-top))' : '20px',
          right: isMobile ? 'max(12px, env(safe-area-inset-right))' : '20px',
          background: 'rgba(10,10,10,0.7)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '8px',
          color: '#d4af37',
          fontSize: isMobile ? '18px' : '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: isMobile ? '40px' : '36px',
          height: isMobile ? '40px' : '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 11,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: 0,
          lineHeight: 1,
          pointerEvents: 'auto',
        }}
      >
        {fullscreen ? '⛶' : '⛶'}
      </button>

      <div style={{
        position: 'absolute',
        top: isMobile ? 'max(12px, env(safe-area-inset-top))' : '20px',
        left: isMobile ? '12px' : '20px',
        color: COLORS.TITANS_GOLD,
        fontSize: isMobile ? '11px' : '12px',
        fontWeight: 'bold',
        letterSpacing: '2px',
        background: 'rgba(10,10,10,0.5)',
        padding: '6px 10px',
        borderRadius: '6px',
      }}>
        TITAN RISE
      </div>

      <div style={{
        position: 'absolute',
        bottom: isMobile ? 'max(16px, env(safe-area-inset-bottom))' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '10px',
        letterSpacing: '1px',
        textAlign: 'center',
      }}>
        TAP TO SHOOT · TAP HERO TO DODGE · SWIPE TO MOVE
      </div>
    </div>
  )
}
