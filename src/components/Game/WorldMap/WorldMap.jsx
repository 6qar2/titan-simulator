import { useState, useEffect } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { CITIES, CITY_DATA, COLORS } from '../../../utils/constants'

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

export function WorldMap({ onTravel, onClose }) {
  const gameStore = useGameStore()
  const [selectedCity, setSelectedCity] = useState(null)
  const mobile = useMobile()

  const visitedCities = gameStore.visitedCities || []
  const currentCity = gameStore.currentCity

  const getCityStatus = (cityId) => {
    if (cityId === currentCity) return 'current'
    if (visitedCities.includes(cityId)) return 'visited'
    if (CITY_DATA[cityId]?.connections?.some((c) => visitedCities.includes(c.to))) return 'unlockable'
    return 'locked'
  }

  const cardWidth = mobile ? 'calc(50% - 10px)' : '180px'
  const cardMinWidth = mobile ? '140px' : '180px'

  return (
    <div className="world-map" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: mobile ? '16px' : '0',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(139, 0, 0, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: mobile ? 'max(16px, var(--safe-top))' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        width: mobile ? 'calc(100% - 80px)' : 'auto',
      }}>
        <h2 style={{
          color: COLORS.TITANS_GOLD,
          fontSize: mobile ? '18px' : '24px',
          fontWeight: 'bold',
          letterSpacing: mobile ? '2px' : '4px',
          textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
        }}>
          MAP OF THE EMPIRE
        </h2>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: mobile ? '11px' : '12px', marginTop: '4px' }}>
          Select a city to travel
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: mobile ? '10px' : '20px',
        justifyContent: 'center',
        maxWidth: mobile ? '100%' : '800px',
        padding: mobile ? '60px 8px 80px' : '20px',
        marginTop: mobile ? '0' : '60px',
        width: '100%',
      }}>
        {Object.entries(CITY_DATA).map(([cityId, city]) => {
          const status = getCityStatus(cityId)
          const isSelected = selectedCity === cityId

          let borderColor = 'rgba(255,255,255,0.1)'
          let bgColor = 'rgba(255,255,255,0.02)'
          let textColor = 'rgba(255,255,255,0.3)'

          if (status === 'current') {
            borderColor = COLORS.TITANS_GOLD
            bgColor = 'rgba(212, 175, 55, 0.1)'
            textColor = COLORS.TITANS_GOLD
          } else if (status === 'visited') {
            borderColor = COLORS.TITANS_CRIMSON
            bgColor = 'rgba(139, 0, 0, 0.1)'
            textColor = '#fff'
          } else if (status === 'unlockable') {
            borderColor = 'rgba(212, 175, 55, 0.3)'
            bgColor = 'rgba(212, 175, 55, 0.03)'
            textColor = 'rgba(255,255,255,0.6)'
          }

          const connections = city.connections || []
          const travelInfo = connections.find((c) => c.to === currentCity) || connections[0]

          return (
            <div
              key={cityId}
              onClick={() => status !== 'locked' && setSelectedCity(cityId)}
              style={{
                width: cardWidth,
                minWidth: cardMinWidth,
                padding: mobile ? '12px' : '16px',
                background: isSelected ? 'rgba(212, 175, 55, 0.15)' : bgColor,
                border: `1px solid ${isSelected ? COLORS.TITANS_GOLD : borderColor}`,
                borderRadius: '8px',
                cursor: status === 'locked' ? 'not-allowed' : 'pointer',
                opacity: status === 'locked' ? 0.4 : 1,
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 20px rgba(212, 175, 55, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (status !== 'locked') {
                  e.currentTarget.style.transform = 'scale(1.03)'
                  e.currentTarget.style.borderColor = COLORS.TITANS_GOLD
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.borderColor = borderColor
                }
              }}
            >
              <div style={{ color: textColor, fontSize: mobile ? '14px' : '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                {city.displayName}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: mobile ? '10px' : '11px', marginBottom: '6px' }}>
                {city.description}
              </div>
              {travelInfo && status !== 'locked' && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  fontSize: mobile ? '10px' : '11px',
                  color: COLORS.TITANS_GOLD,
                  opacity: 0.7,
                }}>
                  <span>⚡ {travelInfo.travelTime}h</span>
                  <span>💰 {travelInfo.cost}</span>
                </div>
              )}
              {status === 'current' && (
                <div style={{ color: COLORS.TITANS_GOLD, fontSize: mobile ? '10px' : '11px', marginTop: '4px' }}>
                  ● Current Location
                </div>
              )}
              {status === 'locked' && (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: mobile ? '10px' : '11px', marginTop: '4px' }}>
                  🔒 Not yet discovered
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedCity && selectedCity !== currentCity && (
        <div style={{
          position: 'absolute',
          bottom: mobile ? 'max(24px, var(--safe-bottom))' : '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: COLORS.BG_PANEL,
          border: `1px solid ${COLORS.TITANS_GOLD}`,
          borderRadius: '8px',
          padding: mobile ? '14px 16px' : '16px 24px',
          textAlign: 'center',
          boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)',
          width: mobile ? 'calc(100% - 32px)' : 'auto',
          maxWidth: '400px',
        }}>
          <div style={{ color: '#fff', fontSize: mobile ? '13px' : '14px', marginBottom: '4px' }}>
            Travel to {CITY_DATA[selectedCity]?.displayName}?
          </div>
          <div style={{ color: COLORS.TITANS_GOLD, fontSize: mobile ? '11px' : '12px', marginBottom: '12px' }}>
            Time will pass during your journey
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '4px',
                color: COLORS.TITANS_GOLD,
                cursor: 'pointer',
                fontSize: mobile ? '13px' : '13px',
                minHeight: '44px',
                flex: 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onTravel?.(selectedCity)
                setSelectedCity(null)
              }}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #8b0000, #b22222)',
                border: '1px solid #d4af37',
                borderRadius: '4px',
                color: '#d4af37',
                cursor: 'pointer',
                fontSize: mobile ? '13px' : '13px',
                fontWeight: 'bold',
                minHeight: '44px',
                flex: 1,
              }}
            >
              Travel
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: mobile ? 'max(60px, var(--safe-top))' : '20px',
          right: mobile ? 'max(12px, var(--safe-right))' : '20px',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '4px',
          color: COLORS.TITANS_GOLD,
          cursor: 'pointer',
          fontSize: '13px',
          minHeight: '40px',
        }}
      >
        Close
      </button>
    </div>
  )
}
