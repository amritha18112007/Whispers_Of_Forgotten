function E(health, attack, moves, extra = {}) {
  return {
    health,
    attack,
    moves: moves.split(' ').map(m => {
      const [type, weight] = m.split(':')
      return { type, weight: Number(weight) }
    }),
    boss: false,
    ...extra
  }
}

const combatConfig = {
  rng: Math.random,
  speed: 1,
  critChance: 0.1,
  critMult: 1.75,
  defendReduction: 0.6,
  xpRatio: 0.5,
  defeatReturnHealthPct: 0.5,
  scoreReward: { enemy: 50, boss: 200 },
  miniGames: {
    enabled: true,
    chance: { attack: 1.0, defend: 1.0, special: 1.0 },
    pools: {
      attack: [
        'precision',
        'reaction',
        'timing',
        'precision',
        'reaction',
        'code',
        'rune',
        'memory'
      ],
      defend: [
        'timing',
        'memory',
        'reaction',
        'timing',
        'memory',
        'code',
        'precision',
        'rune'
      ],
      special: [
        'rune',
        'code',
        'memory',
        'rune',
        'code',
        'precision',
        'reaction',
        'timing'
      ]
    },
    bonus: {
      attackMult: 1.4,
      specialMult: 1.25,
      specialFailMult: 0.85,
      defendReduction: 0.85,
      specialFocusRefund: 1
    }
  },
  moves: {
    attack: { label: 'Attack', icon: '⚔', mult: 1, text: 'attacks' },
    heavy: {
      label: 'Heavy strike',
      icon: '⚠',
      mult: 1.8,
      text: 'unleashes a crushing blow',
      telegraph: 'raises its weapon for a crushing blow!',
      danger: true
    },
    guard: {
      label: 'Raising guard',
      icon: '🛡',
      mult: 0,
      text: 'raises its guard',
      telegraph: 'braces behind its guard.'
    },
    bleed: {
      label: 'Rending strike',
      icon: '🩸',
      mult: 0.7,
      text: 'slashes viciously',
      telegraph: 'readies a rending strike.',
      status: { type: 'bleed', turns: 3, dmg: 3 }
    },
    freeze: {
      label: 'Freezing strike',
      icon: '❄',
      mult: 0.7,
      text: 'strikes with freezing cold',
      telegraph: 'gathers freezing cold.',
      status: { type: 'frozen', turns: 1 }
    }
  },
  enemies: {
    'goblin-scout': E(30, 7, 'attack:3 heavy:1'),
    'forest-wolf': E(35, 8, 'attack:3 heavy:1 bleed:1'),
    'corrupted-boar': E(45, 9, 'attack:2 heavy:2'),
    'goblin-warrior': E(50, 10, 'attack:3 heavy:2 guard:1'),
    'goblin-shaman': E(45, 9, 'attack:2 heavy:1 bleed:2'),
    'goblin-king': E(110, 13, 'attack:3 heavy:2 guard:1 bleed:1', {
      boss: true,
      intro:
        'The Goblin King rises from his throne of bone and root, the crystal shard glinting in his claws!',
      enrage: {
        at: 0.5,
        atkMult: 1.25,
        text: 'The Goblin King roars and the crystal shard flares with rage!'
      }
    }),
    'desert-falcon': E(32, 8, 'attack:3 heavy:1'),
    'sand-scorpion': E(45, 9, 'attack:2 bleed:2 heavy:1'),
    'desert-bandit': E(50, 10, 'attack:3 heavy:1 guard:1'),
    'sand-spirit': E(48, 9, 'attack:2 heavy:1 bleed:2'),
    'mummy-guardian': E(60, 11, 'attack:3 heavy:2 guard:1'),
    'temple-guardian': E(70, 12, 'attack:2 heavy:2 guard:2'),
    'sand-serpent': E(115, 14, 'attack:3 heavy:2 bleed:2', {
      boss: true,
      intro:
        'The ground trembles as the Sand Serpent rises, golden scales glittering.',
      enrage: {
        at: 0.5,
        atkMult: 1.25,
        text: 'The Sand Serpent thrashes in fury, sand whipping the air!'
      }
    }),
    'ice-wolf': E(40, 9, 'attack:3 heavy:1 freeze:1'),
    'frost-spirit': E(50, 10, 'attack:2 freeze:2 heavy:1'),
    'frozen-soldier': E(55, 11, 'attack:3 heavy:1 guard:2'),
    'ice-golem': E(80, 13, 'attack:2 heavy:3 guard:1'),
    'crystal-guardian': E(90, 14, 'attack:2 heavy:2 guard:1 freeze:1'),
    'ice-dragon': E(140, 16, 'attack:2 heavy:2 freeze:2 guard:1', {
      boss: true,
      intro:
        'The Ice Dragon opens its eyes and the whole cavern turns bitterly cold.',
      enrage: {
        at: 0.5,
        atkMult: 1.25,
        text: 'The Ice Dragon bellows and a blizzard fills the lair!'
      }
    })
  },
  defaultEnemy: E(40, 8, 'attack:3 heavy:1'),
  companions: {
    'forest-wolf': {
      action: {
        name: 'Wolf Bite',
        power: 1.1,
        cooldown: 1,
        fx: 'slash',
        status: { type: 'bleed', turns: 3, dmg: 3 },
        statusChance: 0.4
      },
      blockChance: 0.25,
      blockText: 'The Forest Wolf leaps in and blocks the blow!'
    },
    'desert-falcon': {
      action: {
        name: 'Falcon Dive',
        power: 1.3,
        cooldown: 1,
        fx: 'slash',
        ignoreGuard: true
      },
      blockChance: 0.15,
      blockText: 'The Desert Falcon dives in and distracts the attacker!'
    },
    'ice-wolf': {
      action: {
        name: 'Frost Bite',
        power: 0.9,
        cooldown: 1,
        fx: 'frost',
        status: { type: 'frozen', turns: 1 },
        statusChance: 0.5
      },
      blockChance: 0.15,
      blockText: 'The Ice Wolf throws itself in the way!'
    },
    'ice-dragon': {
      action: {
        name: 'Dragon Breath',
        power: 2.2,
        cooldown: 2,
        fx: 'frost',
        status: { type: 'frozen', turns: 1 },
        statusChance: 0.6
      },
      blockChance: 0.3,
      blockText: 'The Ice Dragon shields you with its wing!'
    }
  },
  assets: {
    player: classId =>
      `images/characters/${{
        mystic: 'mystic-ready',
        wanderer: 'wanderer-battle',
        warrior: 'warrior-battle'
      }[classId] || 'wanderer-battle'}.png`,
    playerCombat: classId => `images/characters/${classId}-attack.png`,
    playerReady: classId => `images/characters/${classId}-battle.png`,
    weapon: classId => `images/weapons/${classId}-weapon.png`,
    companion: id => `images/companions/${id}.png`,
    enemy: id => `images/enemies/${id}.png`,
    background: locationId => `images/worlds/${locationId}.png`,
  },
  onSound: null,
  onBattle: null
}

const Combat = (() => {
  const CANCEL = Symbol('cancelled')
  const cfg = combatConfig
  let battle = null
  let ui = null
  let token = 0
  let opts = null
  const h = UI.el
  const rnd = () => cfg.rng()

  const preloaded = new Set()

  async function resolveClassAssets(classId) {
    if (preloaded.has(classId)) return
    preloaded.add(classId)
    await Promise.all(
      [
        cfg.assets.player(classId),
        cfg.assets.playerCombat(classId),
        cfg.assets.weapon(classId)
      ].map(src => UI.loadImage(src))
    )
  }

  function createSwordElement(imgSrc) {
    const img = document.createElement('img')
    img.src = imgSrc || cfg.assets.weapon(Player.state.classId)
    img.className = 'cb-thrown-sword-img'
    img.alt = 'Sword'
    img.draggable = false
    return img
  }

  function createArrowElement(imgSrc) {
    const img = document.createElement('img')
    img.src = imgSrc || cfg.assets.weapon(Player.state.classId)
    img.className = 'cb-arrow-img'
    img.alt = 'Arrow'
    img.draggable = false
    return img
  }

  const sfx = (n, detail) => {
    try {
      if (typeof cfg.onSound === 'function') cfg.onSound(n, detail)
    } catch (e) { }
  }

  const battleEvent = (kind, detail) => {
    try {
      if (typeof cfg.onBattle === 'function') cfg.onBattle(kind, detail)
    } catch (e) { }
  }

  const reduced = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const getEnemyStats = id => ({
    ...(cfg.enemies[id] || cfg.defaultEnemy),
    known: !!cfg.enemies[id]
  })

  function wait(ms) {
    const t = token
    return new Promise(r =>
      setTimeout(r, ms * cfg.speed * (reduced() ? 0.3 : 1))
    ).then(() => {
      if (t !== token) throw CANCEL
    })
  }

  function anim(el, frames, o = {}, motion = true) {
    const t = token
    if (!el || typeof el.animate !== 'function' || (motion && reduced())) {
      return Promise.resolve()
    }
    const a = el.animate(frames, {
      easing: 'ease-out',
      ...o,
      duration: Math.max(0, (o.duration || 300) * cfg.speed)
    })
    return a.finished
      .catch(() => { })
      .then(() => {
        if (t !== token) throw CANCEL
      })
  }

  const FX = {
    burst: {
      f: [
        { transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 },
        { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0 }
      ],
      d: 380
    },
    crit: {
      f: [
        {
          transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)',
          opacity: 1
        },
        {
          transform: 'translate(-50%,-50%) scale(2.6) rotate(45deg)',
          opacity: 0
        }
      ],
      d: 520
    },
    slash: {
      f: [
        {
          transform: 'translate(-50%,-50%) rotate(-35deg) scaleX(0)',
          opacity: 1
        },
        {
          transform: 'translate(-50%,-50%) rotate(-35deg) scaleX(1.2)',
          opacity: 1,
          offset: 0.5
        },
        {
          transform: 'translate(-50%,-50%) rotate(-35deg) scaleX(1.2)',
          opacity: 0
        }
      ],
      d: 360
    },
    magic: {
      f: [
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
        { transform: 'translate(-50%,-50%) scale(2)', opacity: 0 }
      ],
      d: 520
    },
    frost: {
      f: [
        {
          transform: 'translate(-50%,-50%) scale(.3) rotate(0deg)',
          opacity: 1
        },
        {
          transform: 'translate(-50%,-50%) scale(1.9) rotate(60deg)',
          opacity: 0
        }
      ],
      d: 560
    },
    heal: {
      f: [
        { transform: 'translate(-50%,-30%) scale(.6)', opacity: 1 },
        { transform: 'translate(-50%,-90%) scale(1.5)', opacity: 0 }
      ],
      d: 700
    },
    shield: {
      f: [
        { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0.95 },
        { transform: 'translate(-50%,-50%) scale(1.25)', opacity: 0 }
      ],
      d: 520
    },
    num: {
      f: [
        { transform: 'translate(-50%,-50%)', opacity: 1 },
        { transform: 'translate(-50%,-190%)', opacity: 0 }
      ],
      d: 950
    }
  }

  function centerIn(el) {
    if (!el || !ui) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    const a = ui.arena.getBoundingClientRect()
    return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2 }
  }

  function spawn(kind, target, text = '', cls = '') {
    if (!ui) return Promise.resolve()
    const p = centerIn(target)
    const e = h('div', `cb-fx cb-fx-${kind} ${cls}`, text)
    const fx = FX[kind] || FX.burst
    e.style.left = p.x + 'px'
    e.style.top = p.y + 'px'
    ui.fx.append(e)
    return anim(e, fx.f, { duration: fx.d, fill: 'forwards' }, false).finally(
      () => e.remove()
    )
  }

  const floatNum = (text, target, cls) =>
    spawn('num', target, text, `cb-num ${cls}`)

  const flash = el =>
    anim(
      el,
      [
        { filter: 'brightness(1)' },
        { filter: 'brightness(3) saturate(0)' },
        { filter: 'brightness(1)' }
      ],
      { duration: 240 },
      false
    )

  const shake = (p = 6) =>
    anim(
      ui.arena,
      [
        { transform: 'translate(0,0)' },
        { transform: `translate(${-p}px,${p / 2}px)` },
        { transform: `translate(${p}px,${-p / 2}px)` },
        { transform: `translate(${-p / 2}px,0)` },
        { transform: 'translate(0,0)' }
      ],
      { duration: 280 }
    )

  const resetAnims = el => {
    if (el && el.getAnimations) el.getAnimations().forEach(x => x.cancel())
  }

  async function lunge(el, target, onImpact) {
    const a = centerIn(el)
    const b = centerIn(target)
    const dx = (b.x - a.x) * 0.72
    const dy = (b.y - a.y) * 0.3

    await anim(
      el,
      [
        { transform: 'translate(0,0)' },
        { transform: `translate(${dx}px,${dy}px) scale(1.08)` }
      ],
      { duration: 170, fill: 'forwards', easing: 'ease-in' }
    )

    const imp = onImpact()
    await anim(
      el,
      [
        { transform: `translate(${dx}px,${dy}px) scale(1.08)` },
        { transform: 'translate(0,0) scale(1)' }
      ],
      { duration: 230 }
    )
    resetAnims(el)
    await imp
  }

  const companionList = () =>
    [...new Set(gameState.companions)].filter(
      id => cfg.companions[id] && getCompanion(id)
    )

  const combatItems = () =>
    gameState.inventory.filter(id => {
      const it = getItem(id)
      if (!it) return false
      if (it.type === 'consumable' && Player.ITEM_HEAL[it.effect]) return true
      if (
        [
          'rusty-lantern',
          'ancient-compass',
          'ice-rune',
          'ancient-crown'
        ].includes(id)
      ) {
        return true
      }
      return false
    })

  const hasStatus = (side, type) =>
    battle.statusEffects[side].some(s => s.type === type)

  function addStatus(side, st) {
    const list = battle.statusEffects[side]
    const old = list.find(s => s.type === st.type)
    if (old) Object.assign(old, st)
    else list.push({ ...st })
  }

  function say(text, cls = '') {
    battle.battleLog.push({ text, cls })
    if (ui) ui.log.add(text, cls)
  }

  const canAct = () =>
    !!(
      battle &&
      battle.active &&
      !battle.result &&
      battle.isPlayerTurn &&
      !battle.isAnimating &&
      ui &&
      !ui.overlay.classList.contains('open')
    )

  const focusFirst = () => {
    const f = Object.values(ui.buttons).find(x => !x.disabled)
    if (
      f &&
      (document.activeElement === document.body || !document.activeElement)
    ) {
      f.focus()
    }
  }

  function buildUI(container, enemy) {
    const root = h('div', 'cb-root')
    root.setAttribute('role', 'region')
    root.setAttribute('aria-label', 'Battle')
    const arena = h('div', 'cb-arena')
    const fx = h('div', 'cb-fxlayer')
    const info = Player.info()
    const pName = info.name

    const hp = UI.healthBar(
      `${pName} (Lv ${Player.state.level})`,
      Player.state.hp,
      Player.state.maxHp,
      'player'
    )
    const he = UI.healthBar(
      enemy.name + (battle.boss ? ' ★' : ''),
      battle.enemyHealth,
      battle.enemyMax,
      'enemy'
    )

    const focus = h('div', 'cb-focus')
    const intent = h('div', 'cb-intent')
    hp.extra.append(focus)
    he.extra.append(intent)

    const left = h('div', 'cb-side cb-left')
    const right = h('div', 'cb-side cb-right')

    const playerClassId = Player.state.classId
    const playerEl = UI.art(
      cfg.assets.player(playerClassId),
      pName,
      `cb-fighter cb-player cb-player-${playerClassId}`
    )

    const enemyEl = UI.art(
      cfg.assets.enemy(enemy.id),
      enemy.name,
      'cb-fighter cb-enemy'
    )
    const comps = {}

    companionList().forEach(id => {
      comps[id] = UI.art(
        cfg.assets.companion(id),
        getCompanion(id).name,
        'cb-fighter cb-companion'
      )
      left.append(comps[id])
    })

    left.prepend(playerEl)
    right.append(enemyEl)
    arena.append(hp.root, he.root, left, right, fx)

    const logEl = h('div', 'cb-log')
    const actions = h('div', 'cb-actions')
    const overlay = h('div', 'cb-overlay')
    overlay.setAttribute('role', 'region')
    root.append(arena, logEl, actions, overlay)

    UI.clear(container)
    container.append(root)

    return {
      root,
      arena,
      fx,
      log: UI.logger(logEl, 5),
      actions,
      overlay,
      hp,
      he,
      focus,
      intent,
      player: playerEl,
      enemyEl,
      comps,
      buttons: {},
      container
    }
  }

  function addButton(id, key, label, hint, fn) {
    const b = UI.el('button', 'ui-btn cb-act')
    b.type = 'button'
    b.dataset.action = id
    b.dataset.key = key
    b.append(
      h('span', 'cb-act-label', `${key}. ${label}`),
      h('span', 'cb-act-hint', hint)
    )
    b.addEventListener('click', fn)
    ui.actions.append(b)
    ui.buttons[id] = b
    return b
  }

  function buildActions() {
    const info = Player.info()
    const sp = info.special
    addButton(
      'attack',
      '1',
      info.attackName,
      info.attackIgnoresGuard ? 'pierces guard' : 'reliable damage',
      () => act('attack')
    )
    addButton(
      'defend',
      '2',
      'Defend',
      `-${Math.round(cfg.defendReduction * 100)}% damage, +focus`,
      () => act('defend')
    )
    addButton('item', '3', 'Use Item', 'potions & relics', () => showItemMenu())
    addButton('special', '4', sp.name, `${sp.cost} focus`, () => act('special'))
  }

  function refresh() {
    if (!battle || !ui) return
    const info = Player.info()
    const sp = info.special
    const S = Player.state

    ui.hp.update(S.hp, S.maxHp)
    ui.he.update(battle.enemyHealth, battle.enemyMax)
    ui.hp.name.textContent = `${info.name} (Lv ${S.level})`

    const chips = side =>
      battle.statusEffects[side].map(s => ({
        text:
          {
            bleed: `🩸 Bleed ${s.turns}`,
            frozen: '❄ Frozen',
            guard: '🛡 Guard'
          }[s.type] || s.type,
        kind: s.type
      }))

    UI.setChips(ui.hp.chips, [
      ...chips('player'),
      ...(battle.stance === 'defend'
        ? [{ text: '🛡 Defending', kind: 'stance' }]
        : [])
    ])
    UI.setChips(ui.he.chips, [
      ...chips('enemy'),
      ...(battle.enraged ? [{ text: '🔥 Enraged', kind: 'enrage' }] : [])
    ])

    ui.focus.textContent = `Focus ${'◆'.repeat(S.focus)}${'◇'.repeat(
      Player.FOCUS_MAX - S.focus
    )}`

    const mv = battle.intent && cfg.moves[battle.intent.type]
    ui.intent.textContent =
      mv && !battle.result ? `Next: ${mv.icon} ${mv.label}` : ''
    ui.intent.classList.toggle('danger', !!(mv && mv.danger))

    Object.entries(ui.buttons).forEach(([id, b]) => {
      let ok = canAct()
      if (id === 'special') {
        ok = ok && S.focus >= sp.cost && battle.cooldown === 0
      }
      if (id === 'item') {
        ok = ok && combatItems().length > 0
      }
      b.disabled = !ok
      if (id === 'special') {
        b.querySelector('.cb-act-hint').textContent =
          battle.cooldown > 0
            ? `cooldown ${battle.cooldown}`
            : `${sp.cost} focus`
      }
    })
  }

  function onKey(e) {
    if (!canAct() || MiniGames.current || e.ctrlKey || e.metaKey || e.altKey) {
      return
    }
    if (e.target && e.target.tagName === 'INPUT') return
    const b = Object.values(ui.buttons).find(x => x.dataset.key === e.key)
    if (b && !b.disabled) {
      e.preventDefault()
      b.click()
    }
  }
  async function setBackground(loc) {
    const t = token
    const src = cfg.assets.background(loc.id)
    if ((await UI.loadImage(src)) && t === token && ui) {
      ui.arena.style.backgroundImage = `url("${src}")`
    }
  }
  function chooseIntent() {
    const prof = getEnemyStats(battle.enemyId)
    const last = battle.lastIntent
    let pool = prof.moves.filter(m => {
      if (m.type === 'heavy' && last === 'heavy') return false
      if (
        m.type === 'guard' &&
        (last === 'guard' || hasStatus('enemy', 'guard'))
      ) {
        return false
      }
      if (m.type === 'bleed' && hasStatus('player', 'bleed')) return false
      if (
        m.type === 'freeze' &&
        (hasStatus('player', 'frozen') || last === 'freeze')
      ) {
        return false
      }
      return !!cfg.moves[m.type]
    })
    if (!pool.length) pool = [{ type: 'attack', weight: 1 }]
    if (battle.enraged) {
      pool = pool.map(m =>
        m.type === 'heavy' ? { ...m, weight: m.weight + 1 } : m
      )
    }
    let r = rnd() * pool.reduce((s, m) => s + m.weight, 0)
    for (const m of pool) {
      r -= m.weight
      if (r <= 0) return { type: m.type }
    }
    return { type: pool[pool.length - 1].type }
  }

  function telegraph() {
    const mv = cfg.moves[battle.intent.type]
    if (mv && mv.telegraph) {
      say(`${battle.enemyName} ${mv.telegraph}`, mv.danger ? 'danger' : 'warn')
    }
    ui.enemyEl.classList.toggle('cb-charging', !!(mv && mv.danger))
  }

  function playerDamage(mult, { crit = false, ignoreGuard = false } = {}) {
    let d = Player.attackPower() * mult * (0.9 + rnd() * 0.2)
    if (crit) d *= cfg.critMult
    if (
      !ignoreGuard &&
      !Player.info().attackIgnoresGuard &&
      hasStatus('enemy', 'guard')
    ) {
      d *= 0.5
    }
    if (
      battle &&
      battle.enemyId === 'crystal-guardian' &&
      !gameState.crownEquipped
    ) {
      say(
        "The Crystal Guardian's Sovereign Ward deflects your attack! You must equip the Ancient Crown to dispel its shield!",
        'warn'
      )
      return 1
    }

    return Math.max(1, Math.round(d))
  }

  function damageEnemy(n) {
    battle.enemyHealth = Math.max(0, battle.enemyHealth - n)
    checkEnrage()
    refresh()
  }

  function checkEnrage() {
    const en = battle.profile.enrage
    if (
      !en ||
      battle.enraged ||
      battle.enemyHealth <= 0 ||
      battle.enemyHealth > battle.enemyMax * en.at
    ) {
      return
    }
    battle.enraged = true
    say(en.text, 'danger')
    sfx('crit')
  }

  async function enemyHit(dmg, { crit = false, fx = 'burst' } = {}) {
    sfx(crit ? 'crit' : 'hit', { target: 'enemy', crit, fx })
    floatNum(
      crit ? `CRIT -${dmg}` : `-${dmg}`,
      ui.enemyEl,
      crit ? 'cb-num-crit' : 'cb-num-dmg'
    )
    const impactParts = [
      spawn(crit ? 'crit' : fx, ui.enemyEl, '', crit ? 'cb-crit' : ''),
      flash(ui.enemyEl),
      anim(
        ui.enemyEl,
        [
          { transform: 'translateX(0)' },
          { transform: `translateX(${crit ? 26 : 14}px)` },
          { transform: 'translateX(0)' }
        ],
        { duration: 240 }
      ),
      crit ? shake(10) : null
    ].filter(Boolean)
    damageEnemy(dmg)
    await Promise.all(impactParts)
  }

  let lastMiniGame = null

  async function maybeMiniGame(action) {
    const mg = cfg.miniGames
    const t0 = token
    if (!mg.enabled || !mg.pools[action] || rnd() >= (mg.chance[action] ?? 0)) {
      await Promise.resolve()
      if (t0 !== token) throw CANCEL
      return null
    }
    const b = battle
    const pool = mg.pools[action] || MiniGames.TYPES
    const distinct = [...new Set(pool)]
    let available = pool
    if (distinct.length > 1 && lastMiniGame) {
      const filtered = pool.filter(t => t !== lastMiniGame)
      if (filtered.length > 0) available = filtered
    }
    const type = MiniGames.randomType(available)
    lastMiniGame = type

    b.phase = 'mini-game'
    ui.overlay.classList.add('open')
    say(
      `Focus challenge: ${MiniGames.GAMES[type].title}! (Esc to skip)`,
      'warn'
    )

    let r = null
    try {
      r = await MiniGames.start(type, {
        container: ui.overlay,
        difficulty: action === 'special' ? 'hard' : 'easy'
      })
    } finally {
      ui.overlay.classList.remove('open')
      UI.clear(ui.overlay)
    }

    if (battle !== b || !b.active || t0 !== token) throw CANCEL
    b.phase = 'animating'
    say(
      r && r.success
        ? 'Perfect focus!'
        : r && r.cancelled
          ? 'You rely on instinct.'
          : 'Your focus slips...',
      r && r.success ? 'good' : ''
    )
    return r
  }

  async function launchAttackProjectile(fromEl, toEl, effectType, count = 1) {
    const a = centerIn(fromEl)
    const b = centerIn(toEl)

    const promises = []
    const baseAngle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
    const classId = Player.state.classId
    const weaponSrc = cfg.assets.weapon(classId)

    for (let i = 0; i < count; i++) {
      const proj = h('div', `cb-attack-projectile cb-proj-${effectType}`)

      if (effectType === 'sword') {
        const swordEl = createSwordElement(weaponSrc)
        proj.append(swordEl)
      } else if (effectType === 'arrow') {
        const arrowEl = createArrowElement(weaponSrc)
        proj.append(arrowEl)
      } else {
        const core = h('div', `cb-proj-core cb-proj-core-${effectType}`)
        proj.append(core)
      }

      const startX =
        a.x + (effectType === 'sword' ? 26 : effectType === 'arrow' ? 30 : 20)
      const startY = a.y + (i - (count - 1) / 2) * 12 - 10
      proj.style.left = startX + 'px'
      proj.style.top = startY + 'px'
      ui.fx.append(proj)

      const spread = (i - (count - 1) / 2) * 14
      const dx = b.x - startX
      const dy = b.y - startY + (i - (count - 1) / 2) * 16

      const startTransform =
        effectType === 'sword'
          ? `translate(-50%, -50%) rotate(${baseAngle + spread - 45}deg) scale(0.95)`
          : `translate(-50%, -50%) rotate(${baseAngle + spread}deg) scale(0.7)`

      const endTransform =
        effectType === 'sword'
          ? `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${baseAngle + spread + 720
          }deg) scale(1.15)`
          : `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${baseAngle + spread
          }deg) scale(1.2)`

      const p = anim(
        proj,
        [
          { transform: startTransform, opacity: 1 },
          { transform: endTransform, opacity: 1 }
        ],
        {
          duration: effectType === 'arrow' ? 280 + i * 60 : 340 + i * 70,
          easing:
            effectType === 'arrow'
              ? 'cubic-bezier(0.12, 0.7, 0.25, 1)'
              : effectType === 'sword'
                ? 'cubic-bezier(0.25, 0.85, 0.35, 1)'
                : 'cubic-bezier(0.2, 0.9, 0.35, 1)',
          fill: 'forwards'
        },
        false
      ).finally(() => proj.remove())
      promises.push(p)
    }
    await Promise.all(promises)
  }

  async function executeAttackAnimation(
    target,
    onImpact,
    { multi = false, crit = false, fx = 'slash' } = {}
  ) {
    const classId = Player.state.classId
    await resolveClassAssets(classId)
    const playerImg = ui && ui.player ? ui.player.querySelector('img') : null
    const idleSrc = cfg.assets.player(classId)
    const attackSrc = cfg.assets.playerCombat(classId)

    if (playerImg && attackSrc) {
      playerImg.src = attackSrc
      try { await playerImg.decode() } catch (e) {}
    }
    if (ui && ui.player) {
      ui.player.classList.remove('cb-recovering')
      ui.player.classList.add('cb-attacking')
    }

    try {
      await wait(220)

      let effectType = 'sword'
      if (classId === 'mystic' || fx === 'magic' || fx === 'frost') {
        effectType = 'magic'
      } else if (classId === 'wanderer') {
        effectType = 'arrow'
      } else {
        effectType = 'sword'
      }

      const count = multi || crit ? (effectType === 'sword' ? 2 : 3) : 1
      await launchAttackProjectile(ui.player, target, effectType, count)

      const imp = onImpact()
      await imp

      await wait(120)

      if (ui && ui.player) {
        ui.player.classList.remove('cb-attacking')
        ui.player.classList.add('cb-recovering')
      }
      if (playerImg && idleSrc) {
        playerImg.src = idleSrc
      }
      await wait(180)
      if (ui && ui.player) {
        ui.player.classList.remove('cb-recovering')
      }
    } finally {
      if (playerImg && idleSrc) {
        playerImg.src = idleSrc
      }
      if (ui && ui.player) {
        ui.player.classList.remove('cb-attacking', 'cb-recovering')
      }
    }
  }

  async function playerAttack() {
    const info = Player.info()
    const mg = await maybeMiniGame('attack')
    const bonus = cfg.miniGames.bonus
    const crit = (mg && mg.perfect) || rnd() < cfg.critChance
    const dmg = playerDamage(mg && mg.success ? bonus.attackMult : 1, { crit })

    Player.gainFocus(info.focusGain)
    sfx('swing')

    await executeAttackAnimation(
      ui.enemyEl,
      async () => {
        say(
          `${crit ? 'CRITICAL! ' : ''}${info.attackName} hits ${battle.enemyName
          } for ${dmg}.`,
          crit ? 'crit' : ''
        )
        await enemyHit(dmg, {
          crit,
          fx: info.attackIgnoresGuard ? 'magic' : 'slash'
        })
      },
      { crit, multi: crit }
    )
    return true
  }

  async function playerDefend() {
    const mg = await maybeMiniGame('defend')
    battle.stance = 'defend'
    battle.defendReduction =
      mg && mg.success
        ? cfg.miniGames.bonus.defendReduction
        : cfg.defendReduction
    Player.gainFocus(Player.info().focusGain + 1)
    say(`You raise your guard${mg && mg.success ? ' perfectly' : ''}.`, 'good')
    refresh()
    sfx('block', { kind: 'raise', side: 'player' })
    await spawn('shield', ui.player, '', 'cb-shield')
    return true
  }

  async function playerSpecial() {
    const sp = Player.info().special
    const S = Player.state
    if (S.focus < sp.cost || battle.cooldown > 0) {
      say("You can't use that yet.", 'warn')
      return false
    }
    if (
      sp.kind === 'heal' &&
      S.hp >= S.maxHp &&
      !Object.keys(statusMap('player')).length
    ) {
      say("You're already at full health.", 'warn')
      return false
    }
    const mg = await maybeMiniGame('special')
    const bonus = cfg.miniGames.bonus
    Player.spendFocus(sp.cost)
    battle.cooldown = sp.cooldown
    if (mg && mg.success) Player.gainFocus(bonus.specialFocusRefund)
    const boost = mg
      ? mg.success
        ? bonus.specialMult
        : mg.cancelled
          ? 1
          : bonus.specialFailMult
      : 1
    refresh()

    if (sp.kind === 'heal') {
      const gain = Player.heal(sp.power * boost)
      if (sp.cleanse) battle.statusEffects.player = []
      sfx('heal')
      say(
        `${sp.name} restores ${gain} HP${sp.cleanse ? ' and cleanses your wounds' : ''
        }.`,
        'good'
      )
      refresh()
      await Promise.all([
        spawn('heal', ui.player, '', 'cb-heal'),
        floatNum(`+${gain}`, ui.player, 'cb-num-heal')
      ])
      return true
    }

    const crit = !!(mg && mg.perfect)
    const dmg = playerDamage(sp.power * boost, {
      crit,
      ignoreGuard: sp.ignoreGuard
    })
    sfx('magic')

    const impact = async () => {
      say(
        `${sp.name}${boost < 1 ? ' (weakened)' : ''} hits ${battle.enemyName
        } for ${dmg}!`,
        crit ? 'crit' : 'good'
      )
      await enemyHit(dmg, { crit, fx: sp.fx })
      if (sp.status && battle.enemyHealth > 0) {
        addStatus('enemy', sp.status)
        say(`${battle.enemyName} is bleeding!`, 'good')
        refresh()
      }
    }
    if (sp.fx === 'magic') {
      const classId = Player.state.classId
      await resolveClassAssets(classId)
      const playerImg = ui && ui.player ? ui.player.querySelector('img') : null
      const idleSrc = cfg.assets.player(classId)
      const attackSrc = cfg.assets.playerCombat(classId)
      if (playerImg && attackSrc) {
        playerImg.src = attackSrc
        try { await playerImg.decode() } catch (e) { }
      }
      if (ui && ui.player) {
        ui.player.classList.remove('cb-recovering')
        ui.player.classList.add('cb-attacking')
      }

      try {
        await anim(
          ui.player,
          [
            { filter: 'brightness(1)' },
            {
              filter: 'brightness(2) hue-rotate(40deg)',
              transform: 'scale(1.08)'
            },
            { filter: 'brightness(1)' }
          ],
          { duration: 380 },
          false
        )
        const a = centerIn(ui.player)
        const b = centerIn(ui.enemyEl)
        const orb = h('div', 'cb-fx cb-orb')
        orb.style.left = a.x + 'px'
        orb.style.top = a.y + 'px'
        ui.fx.append(orb)

        await anim(
          orb,
          [
            { transform: 'translate(-50%,-50%) scale(.6)' },
            {
              transform: `translate(calc(-50% + ${b.x - a.x}px), calc(-50% + ${b.y - a.y
                }px)) scale(1.3)`
            }
          ],
          { duration: 360, easing: 'ease-in', fill: 'forwards' }
        ).finally(() => orb.remove())

        await impact()
        await wait(120)

        if (ui && ui.player) {
          ui.player.classList.remove('cb-attacking')
          ui.player.classList.add('cb-recovering')
        }
        if (playerImg && idleSrc) {
          playerImg.src = idleSrc
        }
        await wait(180)
        if (ui && ui.player) {
          ui.player.classList.remove('cb-recovering')
        }
      } finally {
        if (playerImg && idleSrc) {
          playerImg.src = idleSrc
        }
        if (ui && ui.player) {
          ui.player.classList.remove('cb-attacking', 'cb-recovering')
        }
      }
    } else {
      sfx('swing', { heavy: true })
      await executeAttackAnimation(ui.enemyEl, impact, { multi: true, crit })
    }
    return true
  }

  const statusMap = side =>{
    Object.fromEntries(battle.statusEffects[side].map(s => [s.type, s]))
  }
  async function useItem(itemId) {
    const it = getItem(itemId)
    if (!it) {
      say("You can't use that.", 'warn')
      return false
    }
    const idx = gameState.inventory.indexOf(itemId)
    if (idx < 0) {
      say("You don't have that item.", 'warn')
      return false
    }

    if (it.type === 'consumable') {
      if (Player.state.hp >= Player.state.maxHp) {
        say("You're already at full health. The item is saved.", 'warn')
        return false
      }
      gameState.inventory.splice(idx, 1)
      const gain = Player.healFromItem(it.effect)
      sfx('heal')
      say(`You use the ${it.name} and recover ${gain} HP.`, 'good')
      refresh()
      await Promise.all([
        spawn('heal', ui.player, '', 'cb-heal'),
        floatNum(`+${gain}`, ui.player, 'cb-num-heal')
      ])
      return true
    }

    if (itemId === 'rusty-lantern') {
      sfx('magic')
      say(
        `You raise the Rusty Lantern! A brilliant golden beam pierces the shadows, blinding ${battle.enemyName} and breaking its guard!`,
        'good'
      )
      battle.statusEffects.enemy = battle.statusEffects.enemy.filter(
        s => s.type !== 'guard'
      )
      const blindDmg = Math.max(8, Math.round(Player.attackPower() * 0.8))
      await Promise.all([
        spawn('burst', ui.enemyEl, '', 'cb-fx-burst'),
        floatNum(`EXPOSED -${blindDmg}`, ui.enemyEl, 'cb-num-crit'),
        flash(ui.enemyEl)
      ])
      damageEnemy(blindDmg)

      if (
        (battle.locationId === 'W1P2' || battle.locationId === 'W1P5') &&
        !gameState.illuminatedLocations.includes(battle.locationId)
      ) {
        gameState.illuminatedLocations.push(battle.locationId)
        say('The battlefield is now permanently illuminated!', 'good')
      }
      refresh()
      return true
    }

    if (itemId === 'ancient-compass') {
      sfx('block', { kind: 'companion' })
      say(
        `You attune the Ancient Compass! Its spinning needle tracks ${battle.enemyName}'s movements, granting high evasion and tactical focus!`,
        'good'
      )
      Player.gainFocus(2)
      battle.stance = 'defend'
      battle.defendReduction = 0.9
      refresh()
      await spawn('shield', ui.player, '', 'cb-shield')
      return true
    }

    if (itemId === 'ice-rune') {
      sfx('magic')
      say(
        `You invoke the Ice Rune! A howling cryogenic blizzard freezes ${battle.enemyName} solid for 2 turns!`,
        'good'
      )
      addStatus('enemy', { type: 'frozen', turns: 2 })
      refresh()
      await Promise.all([
        spawn('frost', ui.enemyEl, '', 'cb-frost'),
        floatNum('FROZEN (2 TURNS)', ui.enemyEl, 'cb-num-block'),
        flash(ui.enemyEl)
      ])
      return true
    }

    if (itemId === 'ancient-crown') {
      sfx('crit')
      gameState.crownEquipped = true
      if (battle.enemyId === 'crystal-guardian') {
        say(
          `You don the Ancient Crown! The Crystal Guardian bows in reverence—its Sovereign Ward shatters completely!`,
          'good'
        )
        const wardDmg = Math.max(15, Math.round(Player.attackPower() * 1.5))
        await Promise.all([
          spawn('crit', ui.enemyEl, '', 'cb-crit'),
          floatNum(`WARD SHATTERED -${wardDmg}`, ui.enemyEl, 'cb-num-crit'),
          flash(ui.enemyEl)
        ])
        damageEnemy(wardDmg)
      } else {
        say(
          `You don the Ancient Crown! Its royal majesty bolsters your spirit, granting +2 Focus!`,
          'good'
        )
        Player.gainFocus(2)
      }
      refresh()
      return true
    }

    say('That item cannot be used in battle.', 'warn')
    return false
  }

  async function companionPhase() {
    for (const id of companionList()) {
      if (battle.result) return
      const c = cfg.companions[id]
      const comp = getCompanion(id)
      const el = ui.comps[id]
      const a = c.action

      if ((battle.compCooldown[id] || 0) > 0) {
        battle.compCooldown[id]--
        continue
      }
      battle.compCooldown[id] = a.cooldown

      const dmg = Math.max(
        1,
        Math.round(
          Player.attackPower() *
          a.power *
          (0.9 + rnd() * 0.2) *
          (!a.ignoreGuard && hasStatus('enemy', 'guard') ? 0.5 : 1)
        )
      )
      say(`${comp.name} uses ${a.name} for ${dmg}!`, 'good')

      await lunge(el, ui.enemyEl, async () => {
        await enemyHit(dmg, { fx: a.fx })
        if (
          a.status &&
          battle.enemyHealth > 0 &&
          rnd() < (a.statusChance ?? 1)
        ) {
          addStatus('enemy', a.status)
          say(
            a.status.type === 'frozen'
              ? `${battle.enemyName} is frozen!`
              : `${battle.enemyName} is bleeding!`,
            'good'
          )
          refresh()
        }
      })
      checkEnd()
    }
  }

  async function tick(side) {
    const list = battle.statusEffects[side]
    for (const s of [...list]) {
      if (s.type === 'bleed' && !battle.result) {
        const target = side === 'player' ? ui.player : ui.enemyEl
        say(
          `${side === 'player' ? 'You bleed' : battle.enemyName + ' bleeds'
          } for ${s.dmg}.`,
          'warn'
        )
        if (side === 'player') Player.damage(s.dmg)
        else damageEnemy(s.dmg)
        refresh()
        await Promise.all([
          floatNum(`-${s.dmg}`, target, 'cb-num-bleed'),
          flash(target)
        ])
        checkEnd()
      }
      s.turns--
    }
    battle.statusEffects[side] = list.filter(s => s.turns > 0)
    refresh()
  }

  async function resolveEnemyHit(mv) {
    const e = getEnemyStats(battle.enemyId)
    const info = Player.info()

    for (const id of companionList()) {
      const c = cfg.companions[id]
      if (c.blockChance && rnd() < c.blockChance) {
        sfx('block', { kind: 'companion' })
        say(c.blockText, 'good')
        await Promise.all([
          spawn('shield', ui.comps[id], '', 'cb-shield'),
          floatNum('BLOCK!', ui.comps[id], 'cb-num-block'),
          anim(
            ui.comps[id],
            [
              { transform: 'translateY(0)' },
              { transform: 'translateY(-18px)' },
              { transform: 'translateY(0)' }
            ],
            { duration: 300 }
          )
        ])
        return
      }
    }

    const isDark =
      (battle.locationId === 'W1P2' || battle.locationId === 'W1P5') &&
      !gameState.illuminatedLocations.includes(battle.locationId)

    if (isDark) {
      say(
        'The enemy strikes from pitch-black shadows! Use your Rusty Lantern to illuminate the dark!',
        'warn'
      )
    }

    let raw =
      e.attack *
      mv.mult *
      (battle.enraged ? e.enrage.atkMult : 1) *
      (isDark ? 1.25 : 1) *
      (0.9 + rnd() * 0.2)

    if (battle.stance === 'defend') {
      raw *= 1 - battle.defendReduction
      sfx('block', { kind: 'impact' })
      await Promise.all([
        spawn('shield', ui.player, '', 'cb-shield'),
        floatNum('GUARDED', ui.player, 'cb-num-block')
      ])
    }

    const dmg = Math.max(
      1,
      Math.round(raw * info.damageTakenMult - Math.floor(Player.defense() / 2))
    )
    say(`${battle.enemyName} ${mv.text} for ${dmg}.`, mv.danger ? 'danger' : '')
    sfx('hit', {
      target: 'player',
      heavy: !!mv.danger,
      guarded: battle.stance === 'defend'
    })
    Player.damage(dmg)
    refresh()

    await Promise.all([
      spawn('burst', ui.player, '', 'cb-hurt'),
      floatNum(`-${dmg}`, ui.player, 'cb-num-dmg'),
      flash(ui.player),
      mv.danger ? shake(10) : null,
      anim(
        ui.player,
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-14px)' },
          { transform: 'translateX(0)' }
        ],
        { duration: 260 }
      )
    ])

    if (mv.status && Player.state.hp > 0 && !battle.result) {
      addStatus('player', mv.status)
      say(
        mv.status.type === 'frozen'
          ? 'You are chilled to the bone!'
          : 'You are bleeding!',
        'warn'
      )
      refresh()
    }
    checkEnd()
  }

  async function enemyTurn() {
    battle.phase = 'enemy-turn'
    battle.isPlayerTurn = false
    refresh()

    const intent = battle.intent
    const mv = cfg.moves[intent.type]
    await wait(350)

    if (hasStatus('enemy', 'frozen')) {
      say(`${battle.enemyName} is frozen solid and cannot move!`, 'good')
      await anim(
        ui.enemyEl,
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(0)' }
        ],
        { duration: 300 }
      )
    } else if (intent.type === 'guard') {
      say(`${battle.enemyName} ${mv.text}.`, 'warn')
      addStatus('enemy', { type: 'guard', turns: 2 })
      sfx('block', { kind: 'raise', side: 'enemy' })
      await spawn('shield', ui.enemyEl, '', 'cb-shield cb-shield-enemy')
    } else {
      if (mv.danger) {
        await anim(
          ui.enemyEl,
          [
            { transform: 'translate(0,0) scale(1)' },
            { transform: 'translate(18px,0) scale(1.08)' }
          ],
          { duration: 500, fill: 'forwards' }
        )
        resetAnims(ui.enemyEl)
      }
      await lunge(ui.enemyEl, ui.player, () => resolveEnemyHit(mv))
    }

    ui.enemyEl.classList.remove('cb-charging')
    if (battle.result) return
    await tick('enemy')
    if (battle.result) return

    battle.stance = null
    battle.lastIntent = intent.type
    battle.intent = chooseIntent()
    telegraph()
    refresh()
  }

  async function beginPlayerTurn() {
    battle.turn++
    if (battle.cooldown > 0) battle.cooldown--
    const frozen = hasStatus('player', 'frozen')
    await tick('player')
    if (battle.result) return false

    if (frozen) {
      say('You are frozen solid and lose your turn!', 'danger')
      await wait(500)
      return true
    }

    battle.phase = 'player-turn'
    battle.isPlayerTurn = true
    battle.isAnimating = false
    refresh()
    return false
  }

  async function act(kind, arg) {
    if (!canAct()) return false
    const b = battle
    const t = token

    b.isAnimating = true
    b.phase = 'animating'
    refresh()

    try {
      const used = await (
        {
          attack: playerAttack,
          defend: playerDefend,
          special: playerSpecial,
          item: () => useItem(arg)
        }[kind] || (async () => false)
      )()

      if (!used) {
        b.isAnimating = false
        b.phase = 'player-turn'
        b.isPlayerTurn = true
        refresh()
        return false
      }

      b.isPlayerTurn = false
      checkEnd()

      if (!b.result) {
        await companionPhase()
        checkEnd()
      }

      if (!b.result) {
        await wait(240)
        let skip
        do {
          await enemyTurn()
          if (b.result) break
          skip = await beginPlayerTurn()
        } while (skip && !b.result)
      }
      return true
    } catch (e) {
      if (e !== CANCEL) console.error('[combat]', e)
      if (battle && !battle.result) {
        battle.isPlayerTurn = true
        battle.phase = 'player-turn'
        battle.isAnimating = false
      }
      return false
    } finally {
      if (t === token && battle === b) {
        b.isAnimating = false
        if (b.result) {
          await conclude()
        } else {
          b.isPlayerTurn = true
          b.phase = 'player-turn'
          refresh()
          if (ui && b.isPlayerTurn) focusFirst()
        }
      }
    }
  }

  function checkEnd() {
    if (!battle || battle.result) return
    if (battle.enemyHealth <= 0) battle.result = 'victory'
    else if (Player.state.hp <= 0) battle.result = 'defeat'
    if (battle.result) {
      battle.isPlayerTurn = false
      battle.phase = battle.result
    }
  }

  async function conclude() {
    const b = battle
    const t = token
    if (b.concluding) return
    b.concluding = true
    refresh()

    try {
      if (b.result === 'victory') {
        sfx('victory')
        say(`${b.enemyName} is defeated!`, 'good')
        ui.enemyEl.classList.remove('cb-charging')
        await anim(
          ui.enemyEl,
          [
            {
              opacity: 1,
              transform: 'translateY(0) rotate(0)',
              filter: 'brightness(1)'
            },
            { opacity: 0.8, filter: 'brightness(2.5)', offset: 0.3 },
            {
              opacity: 0,
              transform: 'translateY(40px) rotate(14deg) scale(.9)',
              filter: 'brightness(1)'
            }
          ],
          { duration: 1000, fill: 'forwards' }
        )
        ui.enemyEl.classList.add('cb-dead')
        const rewards = grantVictory()
        if (t !== token) return
        await anim(
          ui.root,
          [
            { filter: 'brightness(1)' },
            { filter: 'brightness(1.6) sepia(.4)' },
            { filter: 'brightness(1)' }
          ],
          { duration: 600 },
          false
        )
        showResult('victory', rewards)
      } else {
        sfx('defeat')
        say('You collapse...', 'danger')
        await anim(
          ui.player,
          [
            { opacity: 1, transform: 'rotate(0)' },
            { opacity: 0.35, transform: 'translateY(30px) rotate(-80deg)' }
          ],
          { duration: 800, fill: 'forwards' }
        )
        showResult('defeat', null)
      }
    } catch (e) {
      if (e !== CANCEL) console.error('[combat]', e)
    }
  }

  function grantVictory() {
    if (battle.rewarded) return battle.rewards
    battle.rewarded = true
    const before = {
      inv: [...gameState.inventory],
      comp: [...gameState.companions],
      worlds: [...gameState.completedWorlds]
    }
    onEnemyDefeated(battle.locationId, gameState)
    const loc = getLocation(battle.locationId)
    const world = getWorld(loc.worldId)
    const boss =
      !!world && world.locationIds[world.locationIds.length - 1] === loc.id
    const score = boss ? cfg.scoreReward.boss : cfg.scoreReward.enemy
    const xp = Math.round(battle.profile.health * cfg.xpRatio)
    const lv = Player.gainXp(xp)

    gameState.score = (gameState.score || 0) + score
    gameState.defeatedLocations = gameState.defeatedLocations || []
    if (!gameState.defeatedLocations.includes(loc.id)) {
      gameState.defeatedLocations.push(loc.id)
    }

    battle.rewards = {
      score,
      xp,
      levelsGained: lv.levels,
      level: lv.level,
      boss,
      lines: [...loc.enemyReward],
      items: gameState.inventory
        .filter(i => !before.inv.includes(i))
        .map(i => getItem(i).name),
      companionsGained: gameState.companions
        .filter(c => !before.comp.includes(c))
        .map(c => getCompanion(c)),
      companionsLost: before.comp
        .filter(c => !gameState.companions.includes(c))
        .map(c => getCompanion(c).name),
      worldCompleted: gameState.completedWorlds
        .filter(w => !before.worlds.includes(w))
        .map(w => getWorld(w).name)
    }
    return battle.rewards
  }

  function showResult(kind, rewards) {
    const box = h('div', `cb-result cb-result-${kind}`)
    UI.clear(ui.overlay)
    box.append(
      h(
        'h2',
        '',
        kind === 'victory'
          ? rewards.boss
            ? 'Boss Defeated!'
            : 'Victory!'
          : 'Defeated'
      )
    )
    if (kind === 'victory') {
      rewards.lines.forEach(l => box.append(h('p', '', l)))
      rewards.companionsGained.forEach(c =>
        c.recruitmentText.forEach(l => box.append(h('p', 'cb-recruit', l)))
      )
      rewards.items.forEach(i => box.append(h('p', 'cb-reward', `Found: ${i}`)))
      rewards.companionsLost.forEach(n =>
        box.append(h('p', '', `${n} leaves your side.`))
      )
      box.append(
        h(
          'p',
          'cb-reward',
          `+${rewards.score} score, +${rewards.xp} XP` +
          (rewards.levelsGained ? ` - Level up! (Lv ${rewards.level})` : '')
        )
      )
    } else {
      box.append(
        h('p', '', 'Your journey is not over. No rewards were earned.')
      )
    }

    const row = h('div', 'modal-buttons')
    const mk = (text, fn, cls = '') => {
      const b = UI.btn(text, 'ui-btn ' + cls, fn)
      row.append(b)
      return b
    }
    const first =
      kind === 'victory'
        ? mk('Continue', () => finish('victory'))
        : (mk('Retry', retry), mk('Return', () => finish('defeat')))
    box.append(row)
    ui.overlay.append(box)
    ui.overlay.classList.add('open')
    ui.root.classList.add('cb-ended')
    first.focus()
  }

  function finish(result) {
    const b = battle
    const cb = opts && opts.onEnd
    if (!b || b.finished) return
    b.finished = true
    if (result === 'defeat') {
      Player.state.hp = Math.max(
        1,
        Math.ceil(Player.state.maxHp * cfg.defeatReturnHealthPct)
      )
    }
    gameState.currentLocationId = b.locationId
    const out = {
      result,
      locationId: b.locationId,
      enemyId: b.enemyId,
      rewards: b.rewards || null
    }
    teardown()
    if (typeof cb === 'function') cb(out)
  }

  function retry() {
    const o = { ...opts, replay: true }
    const loc = battle.locationId
    Player.state.hp = Player.state.maxHp
    teardown()
    start(loc, o)
  }

  function teardown() {
    if (battle && battle.active) {
      battleEvent('end', { result: battle.result || 'cancelled' })
    }
    token++
    MiniGames.cancel()
    document.removeEventListener('keydown', onKey)
    if (ui && ui.container) UI.clear(ui.container)
    if (battle) battle.active = false
    ui = null
  }

  const fail = reason => {
    console.warn('[combat]', reason)
    return { ok: false, reason }
  }

  function start(locationId, options = {}) {
    if (battle && battle.active && ui) {
      return fail('A battle is already in progress.')
    }
    const loc = getLocation(locationId)
    if (!loc) return fail(`Unknown location "${locationId}".`)
    if (!loc.enemyId) return fail(`There is no enemy at ${loc.name}.`)
    const enemy = getEnemy(loc.enemyId)
    if (!enemy) return fail(`Unknown enemy "${loc.enemyId}".`)
    const gate = canEnterLocation(locationId, gameState)
    if (!gate.allowed) return fail(gate.text.join(' '))
    if (!Player.state.classId) return fail('Choose a class before fighting.')

    gameState.defeatedLocations = gameState.defeatedLocations || []
    if (gameState.defeatedLocations.includes(locationId) && !options.replay) {
      return fail(`${enemy.name} has already been defeated.`)
    }
    const container =
      options.container || document.getElementById('combat-screen')
    if (!container) return fail('No battle container found.')

    opts = options
    token++
    if (Player.state.hp <= 0) {
      Player.state.hp = Math.ceil(
        Player.state.maxHp * cfg.defeatReturnHealthPct
      )
    }
    Player.state.focus = 0

    resolveClassAssets(Player.state.classId)

    const prof = getEnemyStats(enemy.id)
    battle = {
      active: true,
      locationId,
      enemyId: enemy.id,
      enemyName: enemy.name,
      profile: prof,
      boss: !!prof.boss,
      enraged: false,
      turn: 1,
      phase: 'player-turn',
      isPlayerTurn: true,
      isAnimating: false,
      result: null,
      rewarded: false,
      rewards: null,
      enemyHealth: prof.health,
      enemyMax: prof.health,
      stance: null,
      defendReduction: cfg.defendReduction,
      intent: null,
      lastIntent: null,
      cooldown: 0,
      compCooldown: {},
      battleLog: [],
      statusEffects: { player: [], enemy: [] },
      get playerHealth() {
        return Player.state.hp
      }
    }

    ui = buildUI(container, enemy)
    buildActions()
    document.addEventListener('keydown', onKey)
    battle.intent = chooseIntent()
    say(prof.intro || `${enemy.name} blocks your path!`, 'warn')
    telegraph()
    refresh()
    setBackground(loc)
    focusFirst()
    battleEvent('start')
    return { ok: true }
  }

  function showItemMenu() {
    if (!canAct()) return
    UI.clear(ui.overlay)
    const box = h('div', 'cb-result')
    box.append(h('h2', '', 'Use Item'))
    const list = combatItems()
    if (!list.length) box.append(h('p', '', 'You have no combat items to use.'))
    list.forEach(id => {
      const it = getItem(id)
      let label = it.name
      if (it.type === 'consumable' && Player.ITEM_HEAL[it.effect]) {
        label += ` (+${Player.ITEM_HEAL[it.effect]} HP)`
      } else if (id === 'rusty-lantern') {
        label += ' (Blind Foe & Expose)'
      } else if (id === 'ancient-compass') {
        label += ' (Predict Moves & +Focus)'
      } else if (id === 'ice-rune') {
        label += ' (Freeze Foe for 2 Turns)'
      } else if (id === 'ancient-crown') {
        label += ' (Shatter Sovereign Ward)'
      }

      const b = UI.btn(label, 'ui-btn', () => {
        ui.overlay.classList.remove('open')
        UI.clear(ui.overlay)
        act('item', id)
      })
      box.append(b)
    })

    const back = UI.btn('Cancel', 'ui-btn', () => {
      ui.overlay.classList.remove('open')
      UI.clear(ui.overlay)
      refresh()
    })
    box.append(back)
    ui.overlay.append(box)
    ui.overlay.classList.add('open')
      ; (box.querySelector('button') || back).focus()
  }

  function cancel() {
    if (!battle || !battle.active) return false
    const b = battle
    const cb = opts && opts.onEnd
    b.finished = true
    teardown()
    if (typeof cb === 'function') {
      cb({
        result: 'cancelled',
        locationId: b.locationId,
        enemyId: b.enemyId,
        rewards: null
      })
    }
    return true
  }

  return {
    start,
    cancel,
    act,
    getEnemyStats,
    get state() {
      return battle
    },
    get active() {
      return !!(battle && battle.active)
    },
    config: cfg
  }
})()