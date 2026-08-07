import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const playerPositionRef = { current: [0.5, 0.2] }

export const useGameStore = create(
  persist(
    (set, get) => ({
      gameState: 'title',
      denarii: 0,
      fame: 0,
      wave: 1,
      settings: { sfxVolume: 0.7, musicVolume: 0.5 },

      setGameState: (state) => set({ gameState: state }),
      addDenarii: (amount) => set((s) => ({ denarii: Math.max(0, s.denarii + amount) })),
      removeDenarii: (amount) => set((s) => ({ denarii: Math.max(0, s.denarii - amount) })),
      addFame: (amount) => set((s) => ({ fame: Math.max(0, s.fame + amount) })),
      setWave: (wave) => set({ wave }),
      updateSettings: (newSettings) => set((s) => ({ settings: { ...s.settings, ...newSettings } })),
      resetProgress: () => set({ denarii: 0, fame: 0, wave: 1 }),
    }),
    {
      name: 'titan-rise-save',
      partialize: (state) => ({
        denarii: state.denarii,
        fame: state.fame,
        wave: state.wave,
        settings: state.settings,
      }),
    }
  )
)
