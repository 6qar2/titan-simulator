import { useState, useEffect } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { COLORS } from '../../../utils/constants'
import { requestFullscreen, exitFullscreen, isFullscreen } from '../../../utils/fullscreen'

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

export function TitleScreen({ onStart }) {
  const [screen, setScreen] = useState('main')
  const [fullscreen, setFullscreen] = useState(false)
  const gameStore = useGameStore()
  const mobile = useMobile()

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
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '20px', textAlign: 'center',
    }}>
      <div style={{
        width: '80px', height: '80px',
        border: '3px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 0 30px rgba(139, 0, 0, 0.3)',
      }}>
        <div style={{
          width: '60px', height: '60px',
          background: 'linear-gradient(135deg, #8b0000, #b22222)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px',
        }}>⚔️</div>
      </div>

      <h1 style={{
        color: COLORS.TITANS_GOLD,
        fontSize: mobile ? '28px' : '36px',
        fontWeight: '900',
        letterSpacing: mobile ? '3px' : '6px',
        marginBottom: '8px',
        textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
        fontFamily: 'serif',
      }}>
        TITAN RISE
      </h1>

      <div style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: mobile ? '11px' : '12px',
        letterSpacing: '2px',
        marginBottom: '40px',
      }}>
        A PORTAL COMBAT EXPERIENCE
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
        <button
          onClick={onStart}
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #8b0000, #b22222)',
            border: '2px solid #d4af37',
            borderRadius: '8px',
            color: '#d4af37',
            fontSize: mobile ? '16px' : '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            boxShadow: '0 0 20px rgba(139, 0, 0, 0.4)',
            minHeight: '56px',
          }}
        >
          ⚔️ ENTER THE ARENA
        </button>

        {gameStore.fame > 0 && (
          <button
            onClick={() => setScreen('stats')}
            style={{
              padding: '14px 24px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '8px',
              color: '#d4af37',
              fontSize: mobile ? '13px' : '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '1px',
              minHeight: '48px',
            }}
          >
            📊 WARRIOR STATS
          </button>
        )}

        <button
          onClick={() => {
            if (confirm('Reset all progress? This cannot be undone.')) {
              gameStore.resetProgress()
              localStorage.removeItem('titan-simulator-upgrades')
            }
          }}
          style={{
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px',
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          RESET PROGRESS
        </button>
      </div>

      {screen === 'stats' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(10,10,10,0.95)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '20px',
        }}>
          <div style={{ color: COLORS.TITANS_GOLD, fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            WARRIOR STATS
          </div>
          <div style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Fame: {gameStore.fame}</div>
          <div style={{ color: '#d4af37', fontSize: '14px', marginBottom: '8px' }}>Denarii: {gameStore.denarii}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '24px' }}>Wave Reached: {gameStore.wave}</div>
          <button onClick={() => setScreen('main')} style={{
            padding: '12px 30px', background: 'linear-gradient(135deg, #8b0000, #b22222)',
            border: '1px solid #d4af37', borderRadius: '4px', color: '#d4af37',
            cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
          }}>
            Back
          </button>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: mobile ? 'max(16px, env(safe-area-inset-bottom))' : '20px',
        color: 'rgba(255,255,255,0.3)',
        fontSize: mobile ? '10px' : '11px',
        letterSpacing: '1px',
      }}>
        v1.0 · Titans Club
      </div>

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
          bottom: mobile ? 'max(60px, calc(env(safe-area-inset-bottom) + 40px))' : '50px',
          right: mobile ? 'max(12px, env(safe-area-inset-right))' : '20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: '8px',
          color: '#d4af37',
          fontSize: mobile ? '11px' : '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          padding: mobile ? '8px 12px' : '10px 14px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          zIndex: 101,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {fullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
      </button>
    </div>
  )
}
