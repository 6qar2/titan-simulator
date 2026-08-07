export const ROMAN_MONTHS = [
  'Ianuaris', 'Februaris', 'Martius', 'Aprilis', 'Maius', 'Iunius',
  'Quintilis', 'Sextilis', 'September', 'October', 'November', 'December'
]

export const FESTIVALS = [
  { name: 'Ludi Romani', month: 8, days: [4, 5, 6, 10, 11, 12] },
  { name: 'Saturnalia', month: 11, days: [17, 18, 19, 20, 21, 22, 23] },
  { name: 'Cerealia', month: 3, days: [12, 13, 14, 15] },
]

export const ATTRIBUTES = {
  STRENGTH: 'strength',
  AGILITY: 'agility',
  ENDURANCE: 'endurance',
  CHARISMA: 'charisma',
  INTELLECT: 'intellect',
}

export const ATTRIBUTE_LABELS = {
  [ATTRIBUTES.STRENGTH]: 'Strength',
  [ATTRIBUTES.AGILITY]: 'Agility',
  [ATTRIBUTES.ENDURANCE]: 'Endurance',
  [ATTRIBUTES.CHARISMA]: 'Charisma',
  [ATTRIBUTES.INTELLECT]: 'Intellect',
}

export const SOCIAL_CLASSES = {
  FREEBORN_PLEBEIAN: 'freeborn_plebeian',
  FREEDMAN: 'freedman',
  SLAVE: 'slave',
}

export const SOCIAL_CLASS_LABELS = {
  [SOCIAL_CLASSES.FREEBORN_PLEBEIAN]: 'Freeborn Plebeian',
  [SOCIAL_CLASSES.FREEDMAN]: 'Freedman',
  [SOCIAL_CLASSES.SLAVE]: 'Slave',
}

export const CAREER_PATHS = {
  GLADIATOR: 'gladiator',
  LEGIONARY: 'legionary',
  CIVIC: 'civic',
}

export const CITIES = {
  ROME: 'rome',
  CAPUA: 'capua',
  POMPEII: 'pompeii',
  CASTRA_FERRUM: 'castra_ferrum',
  OSTIA: 'ostia',
  ALEXANDRIA: 'alexandria',
  LONDINIUM: 'londinium',
}

export const CITY_DATA = {
  [CITIES.ROME]: {
    id: CITIES.ROME,
    name: 'Roma',
    displayName: 'Rome',
    description: 'The eternal city and heart of the Empire.',
    zones: ['forum', 'senate', 'circus_maximus', 'docks', 'subura'],
    connections: [
      { to: CITIES.CAPUA, distance: 215, travelTime: 3, cost: 25 },
      { to: CITIES.OSTIA, distance: 35, travelTime: 1, cost: 5 },
    ],
    unlocked: true,
  },
  [CITIES.CAPUA]: {
    id: CITIES.CAPUA,
    name: 'Capua',
    displayName: 'Capua',
    description: 'Famous gladiator schools and a grand arena.',
    zones: ['ludus', 'arena', 'forum', 'tavern_district'],
    connections: [
      { to: CITIES.ROME, distance: 215, travelTime: 3, cost: 25 },
      { to: CITIES.POMPEII, distance: 80, travelTime: 1, cost: 10 },
    ],
    unlocked: true,
  },
  [CITIES.POMPEII]: {
    id: CITIES.POMPEII,
    name: 'Pompeii',
    displayName: 'Pompeii',
    description: 'A wealthy provincial city near Vesuvius.',
    zones: ['amphitheater', 'forum', 'villa_district', 'market'],
    connections: [
      { to: CITIES.CAPUA, distance: 80, travelTime: 1, cost: 10 },
    ],
    unlocked: false,
  },
  [CITIES.CASTRA_FERRUM]: {
    id: CITIES.CASTRA_FERRUM,
    name: 'Castra Ferrum',
    displayName: 'Castra Ferrum',
    description: 'A frontier fort on the edge of civilization.',
    zones: ['fort', 'training_yard', 'battlefield'],
    connections: [],
    unlocked: false,
  },
  [CITIES.OSTIA]: {
    id: CITIES.OSTIA,
    name: 'Ostia',
    displayName: 'Ostia',
    description: 'The port city of Rome.',
    zones: ['harbor', 'warehouses', 'forum'],
    connections: [
      { to: CITIES.ROME, distance: 35, travelTime: 1, cost: 5 },
    ],
    unlocked: false,
  },
  [CITIES.ALEXANDRIA]: {
    id: CITIES.ALEXANDRIA,
    name: 'Alexandria',
    displayName: 'Alexandria',
    description: 'The jewel of the Nile.',
    zones: ['library', 'harbor', 'royal_quarter'],
    connections: [],
    unlocked: false,
  },
  [CITIES.LONDINIUM]: {
    id: CITIES.LONDINIUM,
    name: 'Londinium',
    displayName: 'Londinium',
    description: 'A growing provincial town in Britannia.',
    zones: ['forum', 'walls', 'harbor'],
    connections: [],
    unlocked: false,
  },
}

export const CHARACTER_SEX = {
  MALE: 'male',
  FEMALE: 'female',
}

export const GLADIATOR_TYPES = {
  MURMILLO: 'murmillo',
  RETIARIUS: 'retiarius',
  THRAEX: 'thraex',
}

export const GLADIATOR_TYPE_DATA = {
  [GLADIATOR_TYPES.MURMILLO]: {
    name: 'Murmillo',
    description: 'Heavily armored with a gladius and scutum.',
    weapon: 'gladius',
    shield: 'scutum',
    style: 'heavy',
  },
  [GLADIATOR_TYPES.RETIARIUS]: {
    name: 'Retiarius',
    description: 'Light fighter with a net and trident.',
    weapon: 'trident',
    shield: null,
    style: 'agile',
  },
  [GLADIATOR_TYPES.THRAEX]: {
    name: 'Thraex',
    description: 'Wielder of the curved sica sword.',
    weapon: 'sica',
    shield: 'parma',
    style: 'balanced',
  },
}

export const LEGIONARY_RANKS = {
  MILES: 'miles',
  DECANUS: 'decanus',
  CENTURION: 'centurion',
  PRIMUS_PILUS: 'primus_pilus',
}

export const RANK_LABELS = {
  [LEGIONARY_RANKS.MILES]: 'Miles (Legionary)',
  [LEGIONARY_RANKS.DECANUS]: 'Decanus (Squad Leader)',
  [LEGIONARY_RANKS.CENTURION]: 'Centurion',
  [LEGIONARY_RANKS.PRIMUS_PILUS]: 'Primus Pilus',
}

export const SEX_LABELS = {
  [CHARACTER_SEX.MALE]: 'Male',
  [CHARACTER_SEX.FEMALE]: 'Female',
}

export const GAME_STATES = {
  TITLE: 'title',
  CHARACTER_CREATION: 'character_creation',
  WORLD_MAP: 'world_map',
  ZONE: 'zone',
  COMBAT: 'combat',
  DIALOGUE: 'dialogue',
  SHOP: 'shop',
  LOADING: 'loading',
  PAUSED: 'paused',
}

export const COMBAT_STATES = {
  IDLE: 'idle',
  ACTIVE: 'active',
  TACTICAL_PAUSE: 'tactical_pause',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
}

export const ZONES = {
  FORUM: 'forum',
  LUDUS: 'ludus',
  ARENA: 'arena',
  TRAINING_YARD: 'training_yard',
  MARKET: 'market',
  DOCKS: 'docks',
  TAVERN: 'tavern',
  FORT: 'fort',
  BATTLEFIELD: 'battlefield',
}

export const ZONE_NAMES = {
  [ZONES.FORUM]: 'Forum',
  [ZONES.LUDUS]: 'Ludus',
  [ZONES.ARENA]: 'Arena',
  [ZONES.TRAINING_YARD]: 'Training Yard',
  [ZONES.MARKET]: 'Market',
  [ZONES.DOCKS]: 'Docks',
  [ZONES.TAVERN]: 'Tavern',
  [ZONES.FORT]: 'Fort',
  [ZONES.BATTLEFIELD]: 'Battlefield',
}

export const ABILITY_TYPES = {
  ATTACK: 'attack',
  DEFEND: 'defend',
  SPECIAL: 'special',
  STANCE: 'stance',
  CONSUMABLE: 'consumable',
  COMMAND: 'command',
}

export const STANCES = {
  AGGRESSIVE: 'aggressive',
  DEFENSIVE: 'defensive',
  SHOWMAN: 'showman',
}

export const WEAPONS = {
  GLADIUS: { name: 'Gladius', damage: 12, speed: 1.2, type: 'sword' },
  SICA: { name: 'Sica', damage: 14, speed: 1.1, type: 'curved_sword' },
  TRIDENT: { name: 'Trident', damage: 10, speed: 1.0, type: 'polearm' },
  SPEAR: { name: 'Spear', damage: 13, speed: 0.9, type: 'polearm' },
  GLADIUS_SHORT: { name: 'Pugio', damage: 8, speed: 1.4, type: 'dagger' },
  PILUM: { name: 'Pilum', damage: 11, speed: 0.8, type: 'javelin' },
}

export const SHIELDS = {
  SCUTUM: { name: 'Scutum', block: 25, type: 'large' },
  PARMA: { name: 'Parma', block: 15, type: 'small' },
}

export const ABILITIES = {
  SHIELD_BASH: {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Stun the target with a shield impact.',
    type: ABILITY_TYPES.SPECIAL,
    staminaCost: 15,
    cooldown: 5,
    damage: 5,
    effect: 'stun',
    effectDuration: 2,
    icon: '🛡️',
  },
  NET_THROW: {
    id: 'net_throw',
    name: 'Net Throw',
    description: 'Throw a net to root the target.',
    type: ABILITY_TYPES.SPECIAL,
    staminaCost: 20,
    cooldown: 8,
    damage: 0,
    effect: 'root',
    effectDuration: 3,
    icon: '🕸️',
  },
  POWER_STRIKE: {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'A heavy blow dealing bonus damage.',
    type: ABILITY_TYPES.ATTACK,
    staminaCost: 25,
    cooldown: 4,
    damage: 25,
    effect: null,
    effectDuration: 0,
    icon: '⚔️',
  },
  QUICK_STRIKE: {
    id: 'quick_strike',
    name: 'Quick Strike',
    description: 'A fast light attack.',
    type: ABILITY_TYPES.ATTACK,
    staminaCost: 8,
    cooldown: 1,
    damage: 10,
    effect: null,
    effectDuration: 0,
    icon: '🗡️',
  },
  WHIRLING_DEATH: {
    id: 'whirling_death',
    name: 'Whirling Death',
    description: 'Spin and hit all nearby enemies.',
    type: ABILITY_TYPES.SPECIAL,
    staminaCost: 30,
    cooldown: 10,
    damage: 18,
    effect: 'aoe',
    effectDuration: 0,
    icon: '🌀',
  },
  BATTLE_CRY: {
    id: 'battle_cry',
    name: 'Battle Cry',
    description: 'Boost nearby allies attack power.',
    type: ABILITY_TYPES.SPECIAL,
    staminaCost: 15,
    cooldown: 15,
    damage: 0,
    effect: 'buff_attack',
    effectDuration: 8,
    icon: '📯',
  },
  TESTUDO: {
    id: 'testudo',
    name: 'Testudo',
    description: 'Form a shield wall, reducing incoming damage.',
    type: ABILITY_TYPES.COMMAND,
    staminaCost: 20,
    cooldown: 20,
    damage: 0,
    effect: 'form_testudo',
    effectDuration: 10,
    icon: '🏛️',
  },
  CHARGE: {
    id: 'charge',
    name: 'Charge',
    description: 'Rush forward and deal damage.',
    type: ABILITY_TYPES.COMMAND,
    staminaCost: 25,
    cooldown: 12,
    damage: 15,
    effect: 'charge',
    effectDuration: 0,
    icon: '⚡',
  },
  HEAL: {
    id: 'heal',
    name: 'Bandage',
    description: 'Apply a bandage to recover health.',
    type: ABILITY_TYPES.CONSUMABLE,
    staminaCost: 0,
    cooldown: 30,
    damage: -30,
    effect: 'heal',
    effectDuration: 0,
    icon: '🩹',
  },
  PARRY: {
    id: 'parry',
    name: 'Parry',
    description: 'Prepare to block the next attack perfectly.',
    type: ABILITY_TYPES.DEFEND,
    staminaCost: 10,
    cooldown: 3,
    damage: 0,
    effect: 'parry',
    effectDuration: 1.5,
    icon: '🛡️',
  },
}

export const ENEMY_TYPES = {
  GLADIATOR_OPPONENT: {
    id: 'gladiator_opponent',
    name: 'Arena Opponent',
    health: 80,
    damage: 12,
    speed: 3.5,
    attackRange: 2.5,
    attackCooldown: 2,
    fameReward: 10,
    denariiReward: 15,
    color: '#c0392b',
  },
  BEAST: {
    id: 'beast',
    name: 'Wild Beast',
    health: 60,
    damage: 18,
    speed: 5,
    attackRange: 2,
    attackCooldown: 1.5,
    fameReward: 15,
    denariiReward: 10,
    color: '#8e44ad',
  },
  LEGIONARY_ENEMY: {
    id: 'legionary_enemy',
    name: 'Enemy Legionary',
    health: 100,
    damage: 14,
    speed: 3,
    attackRange: 2.8,
    attackCooldown: 2.2,
    fameReward: 20,
    denariiReward: 25,
    color: '#2c3e50',
  },
  BANDIT: {
    id: 'bandit',
    name: 'Bandit',
    health: 50,
    damage: 10,
    speed: 4,
    attackRange: 2,
    attackCooldown: 1.8,
    fameReward: 5,
    denariiReward: 20,
    color: '#27ae60',
  },
}

export const COLORS = {
  TITANS_BLACK: '#0a0a0a',
  TITANS_CRIMSON: '#8b0000',
  TITANS_GOLD: '#d4af37',
  TITANS_GOLD_LIGHT: '#f0d878',
  TITANS_CRIMSON_LIGHT: '#b22222',
  HEALTH_GREEN: '#27ae60',
  STAMINA_BLUE: '#2980b9',
  FAMA_PURPLE: '#8e44ad',
  BG_DARK: '#1a1a2e',
  BG_PANEL: 'rgba(10, 10, 10, 0.85)',
}

export const INPUT_CONFIG = {
  JOYSTICK_DEADZONE: 0.15,
  ATTACK_GESTURE_THRESHOLD: 30,
  DODGE_GESTURE_THRESHOLD: 50,
  TACTICS_BUTTON_SIZE: 64,
  TOUCH_TARGET_MIN: 44,
}

export const CAMERA_CONFIG = {
  THIRD_PERSON_DISTANCE: 8,
  THIRD_PERSON_HEIGHT: 4,
  COMBAT_DISTANCE: 10,
  COMBAT_HEIGHT: 5,
  ORBIT_SPEED: 0.005,
  ZOOM_MIN: 4,
  ZOOM_MAX: 20,
}

export const PHYSICS_CONFIG = {
  GRAVITY: -9.8,
  PLAYER_SPEED: 5,
  PLAYER_SPRINT_SPEED: 8,
  ENEMY_SPEED: 3,
  GROUND_Y: 0,
}
