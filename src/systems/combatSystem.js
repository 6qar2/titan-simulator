import { useMemo } from 'react'
import { useCombatStore, useGameStore, useZoneStore } from '../stores/gameStore'
import { ABILITIES, ENEMY_TYPES, PHYSICS_CONFIG, GLADIATOR_TYPES } from '../utils/constants'

export function useCombatSystem() {
  const store = useCombatStore()
  const gameStore = useGameStore()

  const combatSystem = useMemo(() => ({
    processEffects: (deltaTime) => {
      const now = Date.now()
      const updatedEffects = store.activeEffects.filter((effect) => {
        const elapsed = (now - effect.appliedAt) / 1000
        if (elapsed >= effect.duration) return false
        return true
      })

      if (updatedEffects.length !== store.activeEffects.length) {
        store.set({
          activeEffects: updatedEffects,
          stunDuration: updatedEffects.find((e) => e.type === 'stun')?.remaining || 0,
          rootDuration: updatedEffects.find((e) => e.type === 'root')?.remaining || 0,
        })
      }
    },

    performAttack: (abilityId, targetEnemy) => {
      const ability = ABILITIES[abilityId.toUpperCase()] || ABILITIES.QUICK_STRIKE
      const characterAttrs = { strength: 5, agility: 5 }

      if (store.playerStamina < ability.staminaCost) {
        return { success: false, message: 'Not enough stamina' }
      }

      store.modifyStamina(-ability.staminaCost)

      if (ability.effect === 'stun' && targetEnemy) {
        store.applyEffect({
          id: `stun-${Date.now()}`,
          type: 'stun',
          duration: ability.effectDuration,
          remaining: ability.effectDuration,
          targetId: targetEnemy.id,
        })
        store.setStun(ability.effectDuration)
      }

      if (ability.effect === 'root' && targetEnemy) {
        store.applyEffect({
          id: `root-${Date.now()}`,
          type: 'root',
          duration: ability.effectDuration,
          remaining: ability.effectDuration,
          targetId: targetEnemy.id,
        })
        store.setRoot(ability.effectDuration)
      }

      if (ability.effect === 'heal') {
        store.modifyHealth(-ability.damage)
        return { success: true, message: 'Bandage applied', healAmount: -ability.damage }
      }

      if (ability.effect === 'parry') {
        store.applyEffect({
          id: `parry-${Date.now()}`,
          type: 'parry',
          duration: ability.effectDuration,
          remaining: ability.effectDuration,
        })
        return { success: true, message: 'Parrying...' }
      }

      let damage = ability.damage + characterAttrs.strength * 2

      if (targetEnemy) {
        store.updateEnemy(targetEnemy.id, { health: targetEnemy.health - damage })
        store.incrementCombo()

        if (targetEnemy.health - damage <= 0) {
          store.removeEnemy(targetEnemy.id)
          gameStore.recordVictory()

          if (store.enemies.length === 0) {
            store.endCombat(true)
          }
        }

        return { success: true, damage, message: `Dealt ${damage} damage` }
      }

      return { success: true, damage, message: `Attack prepared` }
    },

    enemyAttack: (enemy) => {
      if (!enemy || enemy.health <= 0) return

      const now = Date.now()
      const lastAttack = enemy.lastAttackTime || 0
      if (now - lastAttack < enemy.attackCooldown * 1000) return

      const parryActive = store.activeEffects.some((e) => e.type === 'parry')
      if (parryActive) {
        store.removeEffect(store.activeEffects.find((e) => e.type === 'parry').id)
        store.updateEnemy(enemy.id, { lastAttackTime: now, stunnedUntil: now + 500 })
        return { blocked: true, message: 'Parried!' }
      }

      const damage = enemy.damage
      store.modifyHealth(-damage)
      store.updateEnemy(enemy.id, { lastAttackTime: now })

      if (store.playerHealth <= 0) {
        store.endCombat(false)
      }

      return { success: true, damage, message: `Took ${damage} damage` }
    },

    getAvailableAbilities: () => {
      return store.abilities
        .map((id) => {
          const key = id.toUpperCase().replace(/-/g, '_')
          return ABILITIES[key] || ABILITIES.QUICK_STRIKE
        })
        .filter((ability) => store.playerStamina >= ability.staminaCost)
    },

    canUseAbility: (abilityId) => {
      const ability = ABILITIES[abilityId.toUpperCase()] || ABILITIES.QUICK_STRIKE
      return store.playerStamina >= ability.staminaCost
    },

    getStaminaRegenRate: () => 8,

    getHealthRegenRate: () => 0.5,
  }), [store, gameStore])

  return combatSystem
}

export function useZoneSystem() {
  const store = useZoneStore()

  const getZoneConfig = (zoneId) => {
    const zoneConfigs = {
      arena: {
        name: 'Arena',
        description: 'The Capuan arena, where gladiators fight for glory.',
        enemies: [ENEMY_TYPES.GLADIATOR_OPPONENT],
        allowCombat: true,
      },
      ludus: {
        name: 'Ludus',
        description: 'The gladiator school where you train.',
        enemies: [],
        allowCombat: false,
      },
      forum: {
        name: 'Forum',
        description: 'The bustling marketplace of Capua.',
        enemies: [],
        allowCombat: false,
      },
      tavern_district: {
        name: 'Tavern District',
        description: 'Drink, gamble, and gather rumors.',
        enemies: [],
        allowCombat: false,
      },
    }
    return zoneConfigs[zoneId] || { name: zoneId, description: '', enemies: [], allowCombat: false }
  }

  const zoneSystem = useMemo(() => ({
    getZoneConfig,
    spawnEnemiesForZone: (zoneId) => {
      const config = getZoneConfig(zoneId)
      if (!config.allowCombat) return []

      return config.enemies.map((enemyType, index) => ({
        ...enemyType,
        typeId: enemyType.id,
        id: `enemy-${Date.now()}-${index}`,
        health: enemyType.health,
        maxHealth: enemyType.health,
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
        ],
        lastAttackTime: 0,
        stunnedUntil: 0,
        state: 'idle',
      }))
    },
  }), [store])

  return zoneSystem
}

export function useCharacterSystem() {
  const gameStore = useGameStore()
  const charStore = useCharacterStore()

  function calculateDerivedStats() {
    const attrs = charStore.attributes
    return {
      maxHealth: 80 + attrs.endurance * 10,
      maxStamina: 60 + attrs.endurance * 5 + attrs.strength * 2,
      damage: 5 + attrs.strength * 3 + attrs.agility,
      speed: 3 + attrs.agility * 0.5,
      blockChance: attrs.endurance * 2 + attrs.agility,
      critChance: attrs.agility * 1.5,
    }
  }

  function getCharacterMeshConfig() {
    const sex = charStore.sex
    const bodyType = charStore.appearance.bodyType
    return {
      sex,
      bodyType,
      height: bodyType === 'tall' ? 1.9 : bodyType === 'short' ? 1.6 : 1.75,
      width: bodyType === 'broad' ? 1.3 : bodyType === 'slender' ? 0.8 : 1.0,
      skinTone: charStore.appearance.skinTone,
      hairColor: charStore.appearance.hairColor,
      hairStyle: charStore.appearance.hairStyle,
    }
  }

  function getStartingInventory() {
    const classBonus = {
      [charStore.socialClass]: {
        [charStore.selectedGladiatorType]: {
          weapon: 'gladius',
          shield: 'scutum',
          armor: 'light',
        },
      },
    }

    const baseInventory = [
      { id: 'potion_minor', name: 'Minor Healing Potion', type: 'consumable', quantity: 2 },
      { id: 'bread', name: 'Bread', type: 'food', quantity: 3 },
    ]

    const gladiatorStart = {
      [GLADIATOR_TYPES.MURMILLO]: [
        { id: 'gladius', name: 'Gladius', type: 'weapon', quantity: 1, weapon: 'gladius' },
        { id: 'scutum', name: 'Scutum', type: 'shield', quantity: 1, shield: 'scutum' },
        { id: 'armor_light', name: 'Light Armor', type: 'armor', quantity: 1 },
      ],
      [GLADIATOR_TYPES.RETIARIUS]: [
        { id: 'trident', name: 'Trident', type: 'weapon', quantity: 1, weapon: 'trident' },
        { id: 'net', name: 'Net', type: 'weapon', quantity: 3, weapon: 'net' },
        { id: 'armor_light', name: 'Light Armor', type: 'armor', quantity: 1 },
      ],
      [GLADIATOR_TYPES.THRAEX]: [
        { id: 'sica', name: 'Sica', type: 'weapon', quantity: 1, weapon: 'sica' },
        { id: 'parma', name: 'Parma', type: 'shield', quantity: 1, shield: 'parma' },
        { id: 'armor_medium', name: 'Medium Armor', type: 'armor', quantity: 1 },
      ],
    }

    return [...baseInventory, ...(gladiatorStart[charStore.selectedGladiatorType] || [])]
  }

  return {
    calculateDerivedStats,
    getCharacterMeshConfig,
    getStartingInventory,
  }
}
