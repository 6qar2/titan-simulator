import { openDB } from 'idb'
import { v4 as uuidv4 } from 'uuid'

const DB_NAME = 'titan-simulator-db'
const DB_VERSION = 1
const SAVE_STORE = 'saves'
const SETTINGS_STORE = 'settings'

let dbInstance = null

async function getDB() {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SAVE_STORE)) {
        const saveStore = db.createObjectStore(SAVE_STORE, { keyPath: 'id' })
        saveStore.createIndex('slot', 'slot')
        saveStore.createIndex('updatedAt', 'updatedAt')
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' })
      }
    },
  })

  return dbInstance
}

export async function saveGame(slot, data) {
  const db = await getDB()
  const save = {
    id: `save-${slot}`,
    slot,
    data,
    updatedAt: new Date().toISOString(),
  }
  await db.put(SAVE_STORE, save)
  return save
}

export async function loadGame(slot) {
  const db = await getDB()
  const save = await db.get(SAVE_STORE, `save-${slot}`)
  return save?.data || null
}

export async function deleteSave(slot) {
  const db = await getDB()
  await db.delete(SAVE_STORE, `save-${slot}`)
}

export async function getAllSaves() {
  const db = await getDB()
  const saves = await db.getAllFromIndex(SAVE_STORE, 'updatedAt')
  return saves.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function saveSetting(key, value) {
  const db = await getDB()
  await db.put(SETTINGS_STORE, { key, value })
}

export async function loadSetting(key) {
  const db = await getDB()
  const setting = await db.get(SETTINGS_STORE, key)
  return setting?.value ?? null
}

export function generateCharacterId() {
  return uuidv4()
}

export function createNewCharacter(characterData) {
  return {
    id: generateCharacterId(),
    createdAt: new Date().toISOString(),
    ...characterData,
  }
}

export function createNewGameState() {
  return {
    id: generateCharacterId(),
    createdAt: new Date().toISOString(),
    lastSaved: new Date().toISOString(),
    character: null,
    currentCity: 'capua',
    currentZone: 'arena',
    gameState: 'title',
    combatState: 'idle',
    worldTime: {
      year: 80,
      month: 3,
      day: 15,
      hour: 8,
      minute: 0,
    },
    denarii: 50,
    inventory: [],
    ownedProperties: [],
    relationships: [],
    patrons: [],
    rivals: [],
    gladiatorProgress: {
      tier: 1,
      fame: 0,
      wins: 0,
      losses: 0,
      isFree: false,
    },
    legionaryProgress: {
      enlisted: false,
      rank: null,
      yearsServed: 0,
      campaigns: [],
    },
    abilities: ['quick_strike', 'shield_bash', 'parry', 'heal'],
    visitedCities: ['capua'],
    tutorialCompleted: false,
    settings: {
      graphicsQuality: 'medium',
      sfxVolume: 0.7,
      musicVolume: 0.5,
      touchSensitivity: 1.0,
    },
  }
}
