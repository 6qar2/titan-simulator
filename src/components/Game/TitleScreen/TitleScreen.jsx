import { useState, useEffect } from 'react'
import { useGameStore, useCharacterStore } from '../../../stores/gameStore'
import { CITIES, CHARACTER_SEX, SOCIAL_CLASSES, ATTRIBUTES, ATTRIBUTE_LABELS, COLORS } from '../../../utils/constants'
import { createNewCharacter } from '../../../systems/saveSystem'
import { requestFullscreen, exitFullscreen, isFullscreen, hideAddressBar } from '../../../utils/fullscreen'

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
  const charStore = useCharacterStore()
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

  const handleStart = () => {
    if (charStore.character) {
      onStart?.()
    } else {
      setScreen('creation')
    }
  }

  const handleContinue = () => {
    if (charStore.character) {
      onStart?.()
    }
  }

  const titleSize = mobile ? '42px' : '64px'
  const letterSpacing = mobile ? '4px' : '8px'
  const subtitleSize = mobile ? '12px' : '14px'
  const mottoSize = mobile ? '11px' : '13px'
  const buttonPadding = mobile ? '12px 16px' : '14px 24px'
  const buttonFontSize = mobile ? '14px' : '16px'

  return (
    <div className="title-screen" style={{
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
      zIndex: 100,
      overflow: 'hidden',
      padding: mobile ? '16px' : '0',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 30%, rgba(139, 0, 0, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: '5%',
        left: '5%',
        right: '5%',
        bottom: '5%',
        border: `1px solid rgba(212, 175, 55, 0.15)`,
        borderRadius: '4px',
        pointerEvents: 'none',
      }} />

      <div style={{
        textAlign: 'center',
        marginBottom: mobile ? '40px' : '60px',
        padding: '0 16px',
        maxWidth: '100%',
      }}>
        <div style={{
          fontSize: titleSize,
          fontWeight: '900',
          color: COLORS.TITANS_GOLD,
          textShadow: '0 0 40px rgba(212, 175, 55, 0.5), 0 4px 8px rgba(0,0,0,0.8)',
          letterSpacing: letterSpacing,
          lineHeight: '1.1',
          fontFamily: 'serif',
        }}>
          TITAN<br />SIMULATOR
        </div>
        <div style={{
          marginTop: '12px',
          fontSize: subtitleSize,
          color: COLORS.TITANS_CRIMSON_LIGHT,
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          A Titans Club Production
        </div>
        <div style={{
          marginTop: '10px',
          fontSize: mottoSize,
          color: COLORS.TITANS_GOLD,
          letterSpacing: '3px',
          fontStyle: 'italic',
        }}>
          Fortitudo · Disciplina · Gloria
        </div>
      </div>

      {screen === 'main' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: mobile ? '10px' : '12px',
          width: mobile ? '100%' : '280px',
          maxWidth: mobile ? 'calc(100% - 32px)' : '280px',
          padding: mobile ? '0 16px' : '0',
        }}>
          <button
            onClick={handleStart}
            style={{
              padding: buttonPadding,
              background: 'linear-gradient(135deg, #8b0000, #b22222)',
              border: '1px solid #d4af37',
              borderRadius: '4px',
              color: '#d4af37',
              fontSize: buttonFontSize,
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              boxShadow: '0 0 20px rgba(139, 0, 0, 0.4)',
              transition: 'all 0.2s ease',
              minHeight: mobile ? '48px' : 'auto',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)'
              e.target.style.boxShadow = '0 0 30px rgba(139, 0, 0, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
              e.target.style.boxShadow = '0 0 20px rgba(139, 0, 0, 0.4)'
            }}
          >
            New Game
          </button>
          <button
            onClick={handleContinue}
            style={{
              padding: buttonPadding,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '4px',
              color: COLORS.TITANS_GOLD,
              fontSize: buttonFontSize,
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              minHeight: mobile ? '48px' : 'auto',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = COLORS.TITANS_GOLD
              e.target.style.background = 'rgba(212, 175, 55, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)'
              e.target.style.background = 'rgba(255,255,255,0.03)'
            }}
          >
            Continue
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('titan-simulator-worldmap', 'true')
              onStart?.()
            }}
            style={{
              padding: buttonPadding,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '4px',
              color: COLORS.TITANS_GOLD,
              fontSize: buttonFontSize,
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              minHeight: mobile ? '48px' : 'auto',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = COLORS.TITANS_GOLD
              e.target.style.background = 'rgba(212, 175, 55, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)'
              e.target.style.background = 'rgba(255,255,255,0.03)'
            }}
          >
            World Map
          </button>
          <button
            onClick={() => gameStore.resetGame()}
            style={{
              padding: mobile ? '10px 16px' : '10px 20px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: 'rgba(255,255,255,0.4)',
              fontSize: mobile ? '12px' : '13px',
              cursor: 'pointer',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              minHeight: mobile ? '40px' : 'auto',
              width: '100%',
            }}
          >
            Reset
          </button>
        </div>
      )}

      {screen === 'creation' && (
        <CharacterCreation
          onBack={() => setScreen('main')}
          onComplete={() => {
            onStart?.()
          }}
        />
      )}

      <div style={{
        position: 'absolute',
        bottom: mobile ? 'max(16px, var(--safe-bottom))' : '20px',
        color: 'rgba(255,255,255,0.3)',
        fontSize: mobile ? '10px' : '11px',
        letterSpacing: '1px',
      }}>
        v0.1.0 · Phase 1 Prototype
      </div>

      <button
        onClick={async () => {
          if (fullscreen) {
            exitFullscreen()
          } else {
            const ok = await requestFullscreen()
            if (!ok) {
              hideAddressBar()
            }
          }
        }}
        style={{
          position: 'absolute',
          bottom: mobile ? 'max(60px, calc(var(--safe-bottom) + 40px))' : '50px',
          right: mobile ? 'max(12px, var(--safe-right))' : '20px',
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

function CharacterCreation({ onBack, onComplete }) {
  const charStore = useCharacterStore()
  const gameStore = useGameStore()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const mobile = useMobile()

  useEffect(() => {
    if (charStore.character && gameStore.gameState === 'character_creation') {
      gameStore.setGameState('zone')
      onComplete?.()
    }
  }, [charStore.character])

  const handleCreate = () => {
    if (step === 1) {
      if (!charStore.name.trim()) {
        setError('Please enter a name')
        return
      }
      setError('')
      setStep(2)
    } else if (step === 2) {
      if (!charStore.character) {
        const success = charStore.createCharacter()
        if (!success) {
          setError('Failed to create character')
          return
        }
      }
      setError('')
      setStep(3)
    } else {
      onComplete?.()
    }
  }

  const cardPadding = mobile ? '16px' : '24px'
  const headingSize = mobile ? '16px' : '18px'
  const labelSize = mobile ? '12px' : '13px'
  const buttonPadding = mobile ? '10px 12px' : '10px 14px'
  const buttonFontSize = mobile ? '12px' : '13px'

  return (
    <div style={{
      background: COLORS.BG_PANEL,
      border: `1px solid ${COLORS.TITANS_GOLD}`,
      borderRadius: '8px',
      padding: cardPadding,
      width: mobile ? 'calc(100% - 32px)' : '500px',
      maxWidth: '500px',
      maxHeight: mobile ? 'calc(100vh - 120px)' : 'none',
      overflowY: mobile ? 'auto' : 'visible',
      boxShadow: '0 0 40px rgba(212, 175, 55, 0.2)',
    }}>
      <div style={{ color: COLORS.TITANS_GOLD, fontSize: mobile ? '11px' : '12px', letterSpacing: '2px', marginBottom: '8px', textAlign: 'center' }}>
        STEP {step} OF 3
      </div>

      {step === 1 && (
        <div>
          <h3 style={{ color: '#fff', marginBottom: mobile ? '16px' : '20px', textAlign: 'center', fontSize: headingSize }}>
            Who are you, citizen?
          </h3>

          <div style={{ marginBottom: mobile ? '16px' : '20px' }}>
            <label style={{ color: COLORS.TITANS_GOLD, fontSize: labelSize, display: 'block', marginBottom: '6px' }}>
              Name
            </label>
            <input
              type="text"
              value={charStore.name}
              onChange={(e) => charStore.setName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={30}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                minHeight: '44px',
              }}
            />
          </div>

          <div style={{ marginBottom: mobile ? '16px' : '20px' }}>
            <label style={{ color: COLORS.TITANS_GOLD, fontSize: labelSize, display: 'block', marginBottom: '8px' }}>
              Sex
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[CHARACTER_SEX.MALE, CHARACTER_SEX.FEMALE].map((sex) => (
                <button
                  key={sex}
                  onClick={() => charStore.setSex(sex)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: charStore.sex === sex
                      ? 'linear-gradient(135deg, #8b0000, #b22222)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${charStore.sex === sex ? COLORS.TITANS_GOLD : 'rgba(212, 175, 55, 0.2)'}`,
                    borderRadius: '4px',
                    color: charStore.sex === sex ? COLORS.TITANS_GOLD : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    fontSize: buttonFontSize,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    minHeight: '44px',
                  }}
                >
                  {sex === CHARACTER_SEX.MALE ? '♂ Male' : '♀ Female'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ color: COLORS.TITANS_GOLD, fontSize: labelSize, display: 'block', marginBottom: '8px' }}>
              Social Class
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.values(SOCIAL_CLASSES).map((socialClass) => (
                <button
                  key={socialClass}
                  onClick={() => charStore.setSocialClass(socialClass)}
                  style={{
                    padding: buttonPadding,
                    background: charStore.socialClass === socialClass
                      ? 'linear-gradient(135deg, #8b0000, #b22222)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${charStore.socialClass === socialClass ? COLORS.TITANS_GOLD : 'rgba(212, 175, 55, 0.2)'}`,
                    borderRadius: '4px',
                    color: charStore.socialClass === socialClass ? COLORS.TITANS_GOLD : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    fontSize: buttonFontSize,
                    textAlign: 'left',
                    minHeight: '44px',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {socialClass === SOCIAL_CLASSES.FREEBORN_PLEBEIAN && 'Freeborn Plebeian'}
                    {socialClass === SOCIAL_CLASSES.FREEDMAN && 'Freedman'}
                    {socialClass === SOCIAL_CLASSES.SLAVE && 'Slave'}
                  </div>
                  <div style={{ fontSize: mobile ? '10px' : '11px', opacity: 0.7, marginTop: '2px' }}>
                    {socialClass === SOCIAL_CLASSES.FREEBORN_PLEBEIAN && '+1 Charisma, +1 Intellect, 20 denarii'}
                    {socialClass === SOCIAL_CLASSES.FREEDMAN && '+2 Intellect, 30 denarii'}
                    {socialClass === SOCIAL_CLASSES.SLAVE && '+1 Strength, +1 Endurance, 5 denarii'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ color: '#fff', marginBottom: mobile ? '16px' : '20px', textAlign: 'center', fontSize: headingSize }}>
            Distribute Attributes
          </h3>

          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <span style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '4px',
              padding: '6px 16px',
              color: COLORS.TITANS_GOLD,
              fontSize: mobile ? '13px' : '14px',
              fontWeight: 'bold',
            }}>
              Points Remaining: {charStore.pointsRemaining}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(ATTRIBUTES).map(([key, attr]) => (
              <div key={attr} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: buttonPadding,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                minHeight: '44px',
              }}>
                <span style={{ color: '#fff', fontSize: labelSize, minWidth: mobile ? '80px' : '100px' }}>
                  {ATTRIBUTE_LABELS[attr]}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => charStore.setAttribute(attr, -1)}
                    disabled={charStore.attributes[attr] <= 1 || charStore.pointsRemaining >= 10}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      background: 'rgba(139, 0, 0, 0.3)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      color: COLORS.TITANS_GOLD,
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      minWidth: '32px',
                    }}
                  >
                    -
                  </button>
                  <span style={{
                    color: COLORS.TITANS_GOLD,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    minWidth: '30px',
                    textAlign: 'center',
                  }}>
                    {charStore.attributes[attr]}
                  </span>
                  <button
                    onClick={() => charStore.setAttribute(attr, 1)}
                    disabled={charStore.attributes[attr] >= 10 || charStore.pointsRemaining <= 0}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      background: 'rgba(139, 0, 0, 0.3)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      color: COLORS.TITANS_GOLD,
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      minWidth: '32px',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 style={{ color: '#fff', marginBottom: mobile ? '16px' : '20px', textAlign: 'center', fontSize: headingSize }}>
            Choose Your Path
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { type: 'murmillo', name: 'Murmillo', desc: 'Heavily armored sword and shield fighter. Balanced and resilient.', style: 'heavy' },
              { type: 'retiarius', name: 'Retiarius', desc: 'Light net and trident fighter. Agile and tricky.', style: 'agile' },
              { type: 'thraex', name: 'Thraex', desc: 'Wielder of the curved sica. Balanced and vicious.', style: 'balanced' },
            ].map((gladType) => (
              <button
                key={gladType.type}
                onClick={() => charStore.setGladiatorType(gladType.type)}
                style={{
                  padding: buttonPadding,
                  background: charStore.selectedGladiatorType === gladType.type
                    ? 'linear-gradient(135deg, #8b0000, #b22222)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${charStore.selectedGladiatorType === gladType.type ? COLORS.TITANS_GOLD : 'rgba(212, 175, 55, 0.2)'}`,
                  borderRadius: '4px',
                  color: charStore.selectedGladiatorType === gladType.type ? COLORS.TITANS_GOLD : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: '48px',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: mobile ? '14px' : '15px' }}>{gladType.name}</div>
                <div style={{ fontSize: mobile ? '11px' : '12px', opacity: 0.7, marginTop: '4px' }}>{gladType.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          color: '#e74c3c',
          fontSize: '12px',
          textAlign: 'center',
          marginTop: '12px',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        {step > 1 && (
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '4px',
              color: COLORS.TITANS_GOLD,
              cursor: 'pointer',
              fontSize: '13px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              minHeight: '44px',
            }}
          >
            Back
          </button>
        )}
        <button
          onClick={handleCreate}
          style={{
            flex: 2,
            padding: '10px',
            background: 'linear-gradient(135deg, #8b0000, #b22222)',
            border: '1px solid #d4af37',
            borderRadius: '4px',
            color: '#d4af37',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            boxShadow: '0 0 15px rgba(139, 0, 0, 0.4)',
            minHeight: '44px',
          }}
        >
          {step === 3 ? 'Begin Your Journey' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
