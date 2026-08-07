import { useState, useEffect, useCallback } from 'react'
import { useGameStore, useCombatStore, useControlsStore } from '../../../stores/gameStore'
import { useCombatSystem } from '../../../systems/combatSystem'
import { ABILITIES, COLORS, INPUT_CONFIG } from '../../../utils/constants'
import { VirtualJoystick, GestureZone, TacticsButton } from '../Controls/Controls'
import { requestFullscreen, exitFullscreen, isFullscreen } from '../../../utils/fullscreen'

const isMobileScreen = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024)
}

export function HUD() {
  const gameStore = useGameStore()
  const combatStore = useCombatStore()
  const controlsStore = useControlsStore()
  const combatSystem = useCombatSystem()
  const [showTactics, setShowTactics] = useState(false)
  const [mobileControls, setMobileControls] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileScreen())
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setMobileControls(isMobile)
  }, [isMobile])

  const handleMove = useCallback((input) => {
    controlsStore.setMoveInput(input)
  }, [controlsStore])

  const handleAttack = useCallback(() => {
    if (combatStore.combatState === 'active') {
      const target = combatStore.enemies.find((e) => e.health > 0) || null
      const result = combatSystem.performAttack('quick_strike', target)
      console.log('Attack result:', result)
    }
  }, [combatStore, combatSystem])

  const handleBlock = useCallback(() => {
    controlsStore.setBlocking(true)
    setTimeout(() => controlsStore.setBlocking(false), 500)
  }, [controlsStore])

  const handleDodge = useCallback(() => {
    controlsStore.setDodging(true)
    setTimeout(() => controlsStore.setDodging(false), 300)
  }, [controlsStore])

  const handleTacticsToggle = useCallback(() => {
    const newState = !combatStore.tacticalPause
    combatStore.setTacticalPause(newState)
    setShowTactics(newState)
  }, [combatStore])

  const useAbility = useCallback(
    (abilityId) => {
      if (combatStore.tacticalPause || combatSystem.canUseAbility(abilityId)) {
        combatStore.setSelectedAbility(abilityId)
        const target = combatStore.enemies.find((e) => e.health > 0) || null
        const result = combatSystem.performAttack(abilityId, target)
        console.log('Ability result:', result)
        setShowTactics(false)
        combatStore.setTacticalPause(false)
      }
    },
    [combatStore, combatSystem]
  )

  const playerHealthPercent = (combatStore.playerHealth / combatStore.playerMaxHealth) * 100
  const playerStaminaPercent = (combatStore.playerStamina / combatStore.playerMaxStamina) * 100

  const availableAbilities = gameStore.abilities
    .map((id) => ABILITIES[id.toUpperCase().replace(/-/g, '_')])
    .filter(Boolean)

  if (gameStore.gameState === 'title' || gameStore.gameState === 'character_creation') {
    return null
  }

  const topPadding = isMobile ? 'max(12px, var(--safe-top))' : '20px'
  const sidePadding = isMobile ? '12px' : '20px'
  const panelMinWidth = isMobile ? '140px' : '200px'

  return (
    <div className="hud-container" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 10,
      paddingTop: 'var(--safe-top)',
    }}>
      <button
        onClick={() => isFullscreen() ? exitFullscreen() : requestFullscreen()}
        style={{
          position: 'absolute',
          top: topPadding,
          right: sidePadding,
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
        }}
      >
        ⛶
      </button>

      <div style={{
        position: 'absolute',
        top: topPadding,
        left: sidePadding,
        right: sidePadding,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: isMobile ? '8px' : '16px',
        pointerEvents: 'auto',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}>
        <div style={{
          background: COLORS.BG_PANEL,
          border: `1px solid ${COLORS.TITANS_GOLD}`,
          borderRadius: '8px',
          padding: isMobile ? '10px 12px' : '12px 16px',
          minWidth: panelMinWidth,
          flex: isMobile ? '1 1 auto' : '0 0 auto',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        }}>
          <div style={{ color: COLORS.TITANS_GOLD, fontSize: isMobile ? '10px' : '12px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '2px' }}>
            CHARACTER
          </div>
          <div style={{ color: '#fff', fontSize: isMobile ? '12px' : '14px', marginBottom: '4px' }}>
            <span style={{ color: COLORS.TITANS_GOLD }}>HP</span>{' '}
            <div style={{
              width: '100%',
              height: isMobile ? '6px' : '8px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              marginTop: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${playerHealthPercent}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${COLORS.HEALTH_GREEN}, #2ecc71)`,
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
          <div style={{ color: '#fff', fontSize: isMobile ? '12px' : '14px', marginBottom: '4px' }}>
            <span style={{ color: COLORS.STAMINA_BLUE }}>STA</span>{' '}
            <div style={{
              width: '100%',
              height: isMobile ? '6px' : '8px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              marginTop: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${playerStaminaPercent}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${COLORS.STAMINA_BLUE}, #3498db)`,
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
          <div style={{ color: COLORS.FAMA_PURPLE, fontSize: isMobile ? '10px' : '12px', marginTop: '6px' }}>
            FAMA: {gameStore.gladiatorProgress.fame}
          </div>
          <div style={{ color: COLORS.TITANS_GOLD, fontSize: isMobile ? '10px' : '12px', marginTop: '2px' }}>
            {gameStore.denarii} denarii
          </div>
        </div>

        <div style={{
          background: COLORS.BG_PANEL,
          border: `1px solid ${COLORS.TITANS_CRIMSON}`,
          borderRadius: '8px',
          padding: isMobile ? '8px 10px' : '10px 14px',
          textAlign: 'right',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          flex: isMobile ? '0 0 auto' : '0 0 auto',
        }}>
          <div style={{ color: COLORS.TITANS_GOLD, fontSize: isMobile ? '10px' : '11px', letterSpacing: '1px' }}>
            {gameStore.currentCity?.toUpperCase()}
          </div>
          <div style={{ color: '#fff', fontSize: isMobile ? '11px' : '13px', marginTop: '2px' }}>
            {gameStore.worldTime.day}/{gameStore.worldTime.month}/{gameStore.worldTime.year} AD
          </div>
          <div style={{ color: COLORS.TITANS_GOLD_LIGHT, fontSize: isMobile ? '9px' : '11px' }}>
            {String(gameStore.worldTime.hour).padStart(2, '0')}:
            {String(gameStore.worldTime.minute).padStart(2, '0')}
          </div>
        </div>
      </div>

      {combatStore.combatState === 'active' && (
        <div style={{
          position: 'absolute',
          bottom: isMobile ? 'max(16px, var(--safe-bottom))' : '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: isMobile ? '6px' : '8px',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '100%',
          padding: '0 8px',
        }}>
          {availableAbilities.map((ability) => (
            <button
              key={ability.id}
              onClick={() => useAbility(ability.id)}
              disabled={!combatSystem.canUseAbility(ability.id)}
              style={{
                width: isMobile ? '44px' : '50px',
                height: isMobile ? '44px' : '50px',
                borderRadius: '8px',
                background: combatSystem.canUseAbility(ability.id)
                  ? `linear-gradient(135deg, ${COLORS.TITANS_CRIMSON}, ${COLORS.TITANS_CRIMSON_LIGHT})`
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${combatSystem.canUseAbility(ability.id) ? COLORS.TITANS_GOLD : 'rgba(255,255,255,0.1)'}`,
                color: combatSystem.canUseAbility(ability.id) ? COLORS.TITANS_GOLD : 'rgba(255,255,255,0.3)',
                fontSize: isMobile ? '16px' : '20px',
                cursor: combatSystem.canUseAbility(ability.id) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: combatSystem.canUseAbility(ability.id)
                  ? '0 0 10px rgba(139, 0, 0, 0.4)'
                  : 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              title={ability.name}
            >
              {ability.icon}
            </button>
          ))}
        </div>
      )}

      {mobileControls && (
        <>
          <VirtualJoystick onMove={handleMove} onEnd={() => controlsStore.setMoveInput({ x: 0, y: 0 })} />
          <GestureZone onAttack={handleAttack} onBlock={handleBlock} onDodge={handleDodge} />
          {combatStore.combatState === 'active' && (
            <TacticsButton onClick={handleTacticsToggle} active={combatStore.tacticalPause} />
          )}
        </>
      )}

      {combatStore.tacticalPause && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: COLORS.BG_PANEL,
          border: `2px solid ${COLORS.TITANS_GOLD}`,
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          pointerEvents: 'auto',
          width: isMobile ? 'calc(100% - 32px)' : 'auto',
          minWidth: isMobile ? 'unset' : '300px',
          maxWidth: isMobile ? '400px' : '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
        }}>
          <div style={{
            color: COLORS.TITANS_GOLD,
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 'bold',
            marginBottom: '12px',
            textAlign: 'center',
            letterSpacing: '2px',
          }}>
            TACTICS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableAbilities.map((ability) => (
              <button
                key={ability.id}
                onClick={() => useAbility(ability.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '8px' : '12px',
                  padding: isMobile ? '8px 10px' : '10px 14px',
                  background: combatSystem.canUseAbility(ability.id)
                    ? 'rgba(139, 0, 0, 0.3)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${combatSystem.canUseAbility(ability.id) ? COLORS.TITANS_CRIMSON : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '6px',
                  color: combatSystem.canUseAbility(ability.id) ? '#fff' : 'rgba(255,255,255,0.3)',
                  cursor: combatSystem.canUseAbility(ability.id) ? 'pointer' : 'not-allowed',
                  fontSize: isMobile ? '12px' : '13px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: isMobile ? '16px' : '18px' }}>{ability.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: COLORS.TITANS_GOLD, fontSize: isMobile ? '13px' : '14px' }}>{ability.name}</div>
                  {!isMobile && (
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>{ability.description}</div>
                  )}
                  <div style={{ fontSize: isMobile ? '9px' : '10px', opacity: 0.5, marginTop: '2px' }}>
                    STA: {ability.staminaCost} | CD: {ability.cooldown}s
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setShowTactics(false)
              combatStore.setTacticalPause(false)
            }}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: isMobile ? '10px' : '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '6px',
              color: COLORS.TITANS_GOLD,
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '13px',
              minHeight: '44px',
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
