import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CITIES, CHARACTER_SEX, SOCIAL_CLASSES, ATTRIBUTES, STANCES, ABILITIES, WEAPONS, SHIELDS, GLADIATOR_TYPES, LEGIONARY_RANKS, PHYSICS_CONFIG, CAMERA_CONFIG } from '../utils/constants'

export const playerPositionRef = { current: [0, 0, 5] }

const DEFAULT_ATTRIBUTES = {
  [ATTRIBUTES.STRENGTH]: 5,
  [ATTRIBUTES.AGILITY]: 5,
  [ATTRIBUTES.ENDURANCE]: 5,
  [ATTRIBUTES.CHARISMA]: 5,
  [ATTRIBUTES.INTELLECT]: 5,
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      gameState: 'title',
      currentCity: CITIES.CAPUA,
      currentZone: 'arena',
      worldTime: { year: 80, month: 3, day: 15, hour: 8, minute: 0 },
      denarii: 50,
      inventory: [],
      ownedProperties: [],
      relationships: [],
      patrons: [],
      rivals: [],
      gladiatorProgress: { tier: 1, fame: 0, wins: 0, losses: 0, isFree: false },
      legionaryProgress: { enlisted: false, rank: null, yearsServed: 0, campaigns: [] },
      abilities: ['quick_strike', 'shield_bash', 'parry', 'heal'],
      visitedCities: [CITIES.CAPUA],
      tutorialCompleted: false,
      settings: {
        graphicsQuality: 'medium',
        sfxVolume: 0.7,
        musicVolume: 0.5,
        touchSensitivity: 1.0,
      },

      setGameState: (state) => set({ gameState: state }),

      travelToCity: (cityId) => {
        const state = get()
        const hours = 3
        const totalMinutes = state.worldTime.hour * 60 + state.worldTime.minute + hours * 60
        const newDay = state.worldTime.day + Math.floor(totalMinutes / (24 * 60))
        const newHour = totalMinutes % (24 * 60) / 60
        const newMonth = state.worldTime.month + Math.floor(newDay / 30)
        const newYear = state.worldTime.year + Math.floor(newMonth / 12)

        set({
          currentCity: cityId,
          worldTime: {
            year: newYear % 100 + 80,
            month: (newMonth - 1) % 12 + 1,
            day: (newDay - 1) % 30 + 1,
            hour: Math.floor(newHour) % 24,
            minute: Math.floor((newHour % 1) * 60),
          },
          visitedCities: state.visitedCities.includes(cityId)
            ? state.visitedCities
            : [...state.visitedCities, cityId],
          gameState: 'zone',
        })
      },

      enterZone: (zoneId) => set({ currentZone: zoneId, gameState: 'zone' }),

      addDenarii: (amount) => set((s) => ({ denarii: Math.max(0, s.denarii + amount) })),

      removeDenarii: (amount) =>
        set((s) => ({ denarii: Math.max(0, s.denarii - amount) })),

      addToInventory: (item) =>
        set((s) => ({ inventory: [...s.inventory, item] })),

      removeFromInventory: (itemId) =>
        set((s) => ({
          inventory: s.inventory.filter((i) => i.id !== itemId),
        })),

      addFame: (amount) =>
        set((s) => ({
          gladiatorProgress: { ...s.gladiatorProgress, fame: Math.max(0, s.gladiatorProgress.fame + amount) },
        })),

      recordVictory: () =>
        set((s) => ({
          gladiatorProgress: {
            ...s.gladiatorProgress,
            wins: s.gladiatorProgress.wins + 1,
            fame: s.gladiatorProgress.fame + 5,
          },
        })),

      recordLoss: () =>
        set((s) => ({
          gladiatorProgress: {
            ...s.gladiatorProgress,
            losses: s.gladiatorProgress.losses + 1,
          },
        })),

      unlockCity: (cityId) =>
        set((s) => ({
          visitedCities: s.visitedCities.includes(cityId)
            ? s.visitedCities
            : [...s.visitedCities, cityId],
        })),

      updateSettings: (newSettings) =>
        set((s) => ({ settings: { ...s.settings, ...newSettings } })),

      setTutorialCompleted: () => set({ tutorialCompleted: true }),

      resetGame: () =>
        set({
          gameState: 'title',
          currentCity: CITIES.CAPUA,
          currentZone: 'arena',
          worldTime: { year: 80, month: 3, day: 15, hour: 8, minute: 0 },
          denarii: 50,
          inventory: [],
          ownedProperties: [],
          relationships: [],
          patrons: [],
          rivals: [],
          gladiatorProgress: { tier: 1, fame: 0, wins: 0, losses: 0, isFree: false },
          legionaryProgress: { enlisted: false, rank: null, yearsServed: 0, campaigns: [] },
          abilities: ['quick_strike', 'shield_bash', 'parry', 'heal'],
          visitedCities: [CITIES.CAPUA],
          tutorialCompleted: false,
        }),
    }),
    {
      name: 'titan-simulator-save',
      partialize: (state) => ({
        gameState: state.gameState,
        currentCity: state.currentCity,
        currentZone: state.currentZone,
        worldTime: state.worldTime,
        denarii: state.denarii,
        inventory: state.inventory,
        ownedProperties: state.ownedProperties,
        relationships: state.relationships,
        patrons: state.patrons,
        rivals: state.rivals,
        gladiatorProgress: state.gladiatorProgress,
        legionaryProgress: state.legionaryProgress,
        abilities: state.abilities,
        visitedCities: state.visitedCities,
        tutorialCompleted: state.tutorialCompleted,
        settings: state.settings,
      }),
    }
  )
)

export const useCharacterStore = create(
  persist(
    (set, get) => ({
      character: null,
      sex: CHARACTER_SEX.MALE,
      socialClass: SOCIAL_CLASSES.FREEBORN_PLEBEIAN,
      name: '',
      attributes: { ...DEFAULT_ATTRIBUTES },
      pointsRemaining: 10,
      selectedGladiatorType: GLADIATOR_TYPES.MURMILLO,
      appearance: {
        skinTone: 0.7,
        hairColor: '#3d2817',
        hairStyle: 'short',
        bodyType: 'average',
        eyeColor: '#4a3728',
      },

      setCharacter: (character) => set({ character }),

      setSex: (sex) => set({ sex }),

      setSocialClass: (socialClass) => {
        const bonuses = {
          [SOCIAL_CLASSES.FREEBORN_PLEBEIAN]: { charisma: 1, intellect: 1, denarii: 20 },
          [SOCIAL_CLASSES.FREEDMAN]: { intellect: 2, denarii: 30 },
          [SOCIAL_CLASSES.SLAVE]: { strength: 1, endurance: 1, denarii: 5 },
        }
        const bonus = bonuses[socialClass] || {}
        set({
          socialClass,
          attributes: {
            ...DEFAULT_ATTRIBUTES,
            ...Object.fromEntries(
              Object.entries(bonus).filter(([k]) => k !== 'denarii').map(([k, v]) => [k, DEFAULT_ATTRIBUTES[k] + v])
            ),
          },
          denarii: (get().denarii || 0) + (bonus.denarii || 0),
        })
      },

      setName: (name) => set({ name }),

      setAttribute: (attr, value) => {
        const current = get().attributes[attr]
        const remaining = get().pointsRemaining
        const newValue = current + value
        if (newValue < 1 || newValue > 10) return
        const cost = value > 0 ? -1 : 1
        if (cost > 0 && remaining < 1) return
        if (cost < 0 && newValue < 1) return
        set((s) => ({
          attributes: { ...s.attributes, [attr]: newValue },
          pointsRemaining: s.pointsRemaining + cost,
        }))
      },

      setAppearance: (key, value) =>
        set((s) => ({
          appearance: { ...s.appearance, [key]: value },
        })),

      setGladiatorType: (type) => set({ selectedGladiatorType: type }),

      createCharacter: () => {
        const { character, sex, socialClass, name, attributes, appearance, selectedGladiatorType } = get()
        if (!name.trim()) return false

        const newChar = {
          id: crypto.randomUUID(),
          name: name.trim(),
          sex,
          socialClass,
          attributes: { ...attributes },
          appearance: { ...appearance },
          gladiatorType: selectedGladiatorType,
          createdAt: new Date().toISOString(),
        }

        set({ character: newChar })
        return true
      },

      resetCharacter: () =>
        set({
          character: null,
          sex: CHARACTER_SEX.MALE,
          socialClass: SOCIAL_CLASSES.FREEBORN_PLEBEIAN,
          name: '',
          attributes: { ...DEFAULT_ATTRIBUTES },
          pointsRemaining: 10,
          selectedGladiatorType: GLADIATOR_TYPES.MURMILLO,
          appearance: {
            skinTone: 0.7,
            hairColor: '#3d2817',
            hairStyle: 'short',
            bodyType: 'average',
            eyeColor: '#4a3728',
          },
        }),
    }),
    {
      name: 'titan-simulator-character',
    }
  )
)

export const useCombatStore = create((set, get) => ({
  combatState: 'idle',
  enemies: [],
  playerHealth: 100,
  playerMaxHealth: 100,
  playerStamina: 100,
  playerMaxStamina: 100,
  activeEffects: [],
  selectedAbility: null,
  tacticalPause: false,
  timeScale: 1,
  comboCount: 0,
  lastAttackTime: 0,
  parryWindow: 0,
  stunDuration: 0,
  rootDuration: 0,

  startCombat: (enemies) =>
    set({
      combatState: 'active',
      enemies,
      playerHealth: 100,
      playerStamina: 100,
      activeEffects: [],
      tacticalPause: false,
      timeScale: 1,
      comboCount: 0,
      stunDuration: 0,
      rootDuration: 0,
    }),

  endCombat: (victory) =>
    set({
      combatState: victory ? 'victory' : 'defeat',
      tacticalPause: false,
      timeScale: 1,
    }),

  exitCombat: () =>
    set({
      combatState: 'idle',
      enemies: [],
      playerHealth: 100,
      playerStamina: 100,
      activeEffects: [],
      tacticalPause: false,
      timeScale: 1,
      comboCount: 0,
      stunDuration: 0,
      rootDuration: 0,
    }),

  toggleTacticalPause: () =>
    set((s) => ({
      tacticalPause: !s.tacticalPause,
      timeScale: s.tacticalPause ? 1 : 0.1,
    })),

  setTacticalPause: (paused) =>
    set({
      tacticalPause: paused,
      timeScale: paused ? 0.1 : 1,
    }),

  modifyHealth: (amount) =>
    set((s) => ({
      playerHealth: Math.max(0, Math.min(s.playerMaxHealth, s.playerHealth + amount)),
    })),

  modifyStamina: (amount) =>
    set((s) => ({
      playerStamina: Math.max(0, Math.min(s.playerMaxStamina, s.playerStamina + amount)),
    })),

  applyEffect: (effect) =>
    set((s) => ({
      activeEffects: [...s.activeEffects, { ...effect, appliedAt: Date.now() }],
    })),

  removeEffect: (effectId) =>
    set((s) => ({
      activeEffects: s.activeEffects.filter((e) => e.id !== effectId),
    })),

  setStun: (duration) => set({ stunDuration: duration }),

  setRoot: (duration) => set({ rootDuration: duration }),

  incrementCombo: () =>
    set((s) => ({ comboCount: s.comboCount + 1 })),

  resetCombo: () => set({ comboCount: 0 }),

  setSelectedAbility: (ability) => set({ selectedAbility: ability }),

  updateEnemy: (enemyId, updates) =>
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === enemyId ? { ...e, ...updates } : e)),
    })),

  removeEnemy: (enemyId) =>
    set((s) => ({
      enemies: s.enemies.filter((e) => e.id !== enemyId),
    })),
}))

export const useZoneStore = create((set, get) => ({
  currentCity: CITIES.CAPUA,
  currentZone: 'arena',
  cameraPosition: [0, CAMERA_CONFIG.THIRD_PERSON_HEIGHT, CAMERA_CONFIG.THIRD_PERSON_DISTANCE],
  cameraTarget: [0, 1, 0],
  isInCombat: false,
  nearbyNPCs: [],
  interactables: [],

  setCurrentCity: (cityId) => set({ currentCity: cityId }),

  setCurrentZone: (zoneId) => set({ currentZone: zoneId }),

  setCameraPosition: (pos) => set({ cameraPosition: pos }),

  setCameraTarget: (target) => set({ cameraTarget: target }),

  setInCombat: (inCombat) => set({ isInCombat: inCombat }),

  setNearbyNPCs: (npcs) => set({ nearbyNPCs: npcs }),

  setInteractables: (interactables) => set({ interactables }),
}))

export const useControlsStore = create((set, get) => ({
  moveInput: { x: 0, y: 0 },
  isMoving: false,
  isAttacking: false,
  isBlocking: false,
  isDodging: false,
  attackGesture: null,
  joystickActive: false,
  joystickOrigin: { x: 0, y: 0 },
  joystickDelta: { x: 0, y: 0 },

  setMoveInput: (input) =>
    set({
      moveInput: input,
      isMoving: input.x !== 0 || input.y !== 0,
    }),

  setAttacking: (attacking) => set({ isAttacking: attacking }),

  setBlocking: (blocking) => set({ isBlocking: blocking }),

  setDodging: (dodging) => set({ isDodging: dodging }),

  setAttackGesture: (gesture) => set({ attackGesture: gesture }),

  setJoystickActive: (active, origin = { x: 0, y: 0 }) =>
    set({
      joystickActive: active,
      joystickOrigin: origin,
      joystickDelta: active ? { x: 0, y: 0 } : get().joystickDelta,
    }),

  setJoystickDelta: (delta) => set({ joystickDelta: delta }),

  resetControls: () =>
    set({
      moveInput: { x: 0, y: 0 },
      isMoving: false,
      isAttacking: false,
      isBlocking: false,
      isDodging: false,
      attackGesture: null,
      joystickActive: false,
      joystickDelta: { x: 0, y: 0 },
    }),
}))
