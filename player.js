const Player = (() => {
  const CLASSES = {
    wanderer: {
      id: 'wanderer',
      name: 'Wanderer',
      tagline: 'Balanced and resourceful',

      description:
        'A road-worn survivor who adapts to anything. ' +
        'Potions heal 25% more, and Spirit Burst ignores enemy guard.',

      maxHp: 100,
      attack: 10,
      defense: 2,

      focusGain: 1,
      damageTakenMult: 1,
      potionBonus: 1.25,

      attackName: 'Strike',
      attackIgnoresGuard: false,

      passive: 'Potions heal 25% more.',

      special: {
        name: 'Spirit Burst',
        desc: 'A blast of spirit energy (2.4x damage, ignores guard).',
        kind: 'damage',
        power: 2.4,
        cost: 3,
        cooldown: 2,
        fx: 'magic',
        ignoreGuard: true
      }
    },

    warrior: {
      id: 'warrior',
      name: 'Warrior',
      tagline: 'Tough and relentless',

      description:
        'Heavy armour and heavy blows. Takes 15% less damage, ' +
        'and Power Cleave leaves enemies bleeding.',

      maxHp: 125,
      attack: 11,
      defense: 4,

      focusGain: 1,
      damageTakenMult: 0.85,
      potionBonus: 1,

      attackName: 'Slash',
      attackIgnoresGuard: false,

      passive: 'Takes 15% less damage.',

      special: {
        name: 'Power Cleave',
        desc: 'A brutal cleave (2.2x damage) that causes bleeding.',
        kind: 'damage',
        power: 2.2,
        cost: 3,
        cooldown: 2,
        fx: 'slash',
        ignoreGuard: false,

        status: {
          type: 'bleed',
          turns: 3,
          dmg: 3
        }
      }
    },

    mystic: {
      id: 'mystic',
      name: 'Mystic',
      tagline: 'Fragile but powerful',

      description:
        'A scholar of forgotten magic. Arcane Bolts pierce guard ' +
        'and focus builds twice as fast, so Mending Light is always near.',

      maxHp: 80,
      attack: 8,
      defense: 1,

      focusGain: 2,
      damageTakenMult: 1,
      potionBonus: 1,

      attackName: 'Arcane Bolt',
      attackIgnoresGuard: true,

      passive: 'Builds focus twice as fast; bolts ignore guard.',

      special: {
        name: 'Mending Light',
        desc: 'Restores 40 HP and cleanses bleeding and cold.',
        kind: 'heal',
        power: 40,
        cost: 3,
        cooldown: 2,
        fx: 'heal',
        cleanse: true
      }
    }
  }
  const ITEM_HEAL = {
    heal: 35,
    'large-heal': 70
  }

  const FOCUS_MAX = 5
  const state = {
    classId: null,
    level: 1,
    xp: 0,
    hp: 0,
    maxHp: 0,
    attack: 0,
    defense: 0,
    focus: 0
  }
  function info () {
    return CLASSES[state.classId] || null
  }
  function init (classId) {
    const playerClass = CLASSES[classId]

    if (!playerClass) {
      throw new Error(`Unknown class "${classId}".`)
    }

    Object.assign(state, {
      classId: classId,
      level: 1,
      xp: 0,
      hp: playerClass.maxHp,
      maxHp: playerClass.maxHp,
      attack: playerClass.attack,
      defense: playerClass.defense,
      focus: 0
    })

    return state
  }
  function reset () {
    Object.assign(state, {
      classId: null,
      level: 1,
      xp: 0,
      hp: 0,
      maxHp: 0,
      attack: 0,
      defense: 0,
      focus: 0
    })
  }
  function xpToNext () {
    return 30 + 20 * state.level
  }
  function heal (n) {
    const before = state.hp

    state.hp = Math.min(state.maxHp, state.hp + Math.max(0, Math.round(n)))

    return state.hp - before
  }
  function damage (n) {
    state.hp = Math.max(0, state.hp - Math.max(0, Math.round(n)))

    return state.hp
  }
  function healFromItem (effect) {
    const base = ITEM_HEAL[effect]

    if (!base || !info()) {
      return 0
    }

    return heal(base * info().potionBonus)
  }
  function gainFocus (n) {
    state.focus = Math.max(0, Math.min(FOCUS_MAX, state.focus + n))
  }
  function spendFocus (n) {
    if (state.focus < n) {
      return false
    }

    state.focus -= n

    return true
  }
  function gainXp (n) {
    let levels = 0

    state.xp += Math.max(0, Math.round(n))

    while (state.xp >= xpToNext()) {
      state.xp -= xpToNext()

      state.level++
      levels++

      state.maxHp += 10
      state.attack += 1

      if (state.level % 2 === 0) {
        state.defense += 1
      }

      heal(15)
    }

    return {
      levels: levels,
      level: state.level
    }
  }
  function attackPower () {
    return state.attack
  }

  function defense () {
    return state.defense
  }
  function snapshot () {
    return { ...state }
  }
  function restore (s) {
    if (s && CLASSES[s.classId]) {
      Object.assign(state, { focus: 0 }, s)
    }

    return state
  }
  return {
    CLASSES,
    ITEM_HEAL,
    FOCUS_MAX,
    state,
    info,
    init,
    reset,
    xpToNext,
    heal,
    damage,
    healFromItem,
    gainFocus,
    spendFocus,
    gainXp,
    attackPower,
    defense,
    snapshot,
    restore
  }
})()
