const Game = (() => {
  const config = {
    saveKey: 'whispers-of-the-forgotten-save-v1',
    settingsKey: 'whispers-of-the-forgotten-settings-v1'
  }
  const rules = { searchRequiresVictory: true }
  const h = UI.el
  let root = null,
    els = {},
    inCombat = false,
    bgToken = 0,
    mountedOnce = false
  let openOverlayName = null,
    overlayOpener = null,
    selectedItemId = null,
    bagNote = ''
  function resolveSaveKey (k) {
    const session = typeof Auth !== 'undefined' ? Auth.getSession() : null
    if (!session || session.guest) {
      return {
        storage: window.sessionStorage,
        key: 'guest-' + k,
        isGuest: true
      }
    }
    const userKey =
      'user-' + (session.username || '').trim().toLowerCase() + '-' + k
    return { storage: window.localStorage, key: userKey, isGuest: false }
  }
  const store = {
    get (k) {
      try {
        const { storage, key } = resolveSaveKey(k)
        return storage.getItem(key) || null
      } catch (e) {
        return null
      }
    },
    set (k, v) {
      try {
        const { storage, key } = resolveSaveKey(k)
        storage.setItem(key, v)
        return true
      } catch (e) {
        return false
      }
    },
    del (k) {
      try {
        const { storage, key } = resolveSaveKey(k)
        storage.removeItem(key)
      } catch (e) {}
    }
  }
  function animateBag () {
    if (!els || !els.bagBtn) return
    els.bagBtn.classList.remove('bag-bounce')
    void els.bagBtn.offsetWidth
    els.bagBtn.classList.add('bag-bounce')
    const onEnd = () => {
      if (els && els.bagBtn) {
        els.bagBtn.classList.remove('bag-bounce')
        els.bagBtn.removeEventListener('animationend', onEnd)
      }
    }
    els.bagBtn.addEventListener('animationend', onEnd, { once: true })
  }
  if (
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function'
  ) {
    window.addEventListener('whispers:item-added', () => {
      animateBag()
    })
  }
  function ensureExtras () {
    gameState.searched = gameState.searched || []
    gameState.defeatedLocations = gameState.defeatedLocations || []
    gameState.score = gameState.score || 0
    gameState.inventory = gameState.inventory || []
    gameState.companions = gameState.companions || []
    gameState.completedWorlds = gameState.completedWorlds || []
    gameState.visited = gameState.visited || []
    gameState.unlockedLocations = gameState.unlockedLocations || []
    gameState.illuminatedLocations = gameState.illuminatedLocations || []
    gameState.clues = gameState.clues || {}
    gameState.puzzlesSolved = gameState.puzzlesSolved || {}
    gameState.dunesCalibrated = !!gameState.dunesCalibrated
    gameState.keyThawed = !!gameState.keyThawed
    gameState.frostBridgeFrozen = !!gameState.frostBridgeFrozen
    gameState.crownEquipped = !!gameState.crownEquipped
    gameState.worldPurified = gameState.worldPurified || {}
    gameState.unlockedLocks = gameState.unlockedLocks || []
    ;[...gameState.visited, gameState.currentLocationId].forEach(id => {
      const l = getLocation(id)
      if (l && l.lock && !gameState.unlockedLocations.includes(id))
        gameState.unlockedLocations.push(id)
    })
  }
  function resetState () {
    if (typeof Combat !== 'undefined') Combat.cancel()
    MiniGames.cancel()
    inCombat = false
    Object.keys(gameState).forEach(k => delete gameState[k])
    Object.assign(gameState, createGameState())
    ensureExtras()
    Player.reset()
    if (els.feed) UI.clear(els.feed)
    document.body.classList.remove('page-dark-environment')
  }
  const loc = () => getLocation(gameState.currentLocationId)
  const isDefeated = id => gameState.defeatedLocations.includes(id)
  const nextWorldOf = worldId =>
    Object.entries(worlds)
      .map(([id, w]) => ({ id, w }))
      .find(
        x =>
          x.w.unlockRequirement &&
          x.w.unlockRequirement.completedWorldId === worldId
      ) || null
  const itemName = id => (getItem(id) || {}).name || id
  function hasSave () {
    return !!store.get(config.saveKey)
  }
  function save () {
    if (!Player.state.classId) return false
    return store.set(
      config.saveKey,
      JSON.stringify({
        v: 2,
        gameState: JSON.parse(JSON.stringify(gameState)),
        player: Player.snapshot()
      })
    )
  }
  function load () {
    let data
    try {
      data = JSON.parse(store.get(config.saveKey))
    } catch (e) {
      data = null
    }
    if (
      !data ||
      !data.gameState ||
      !data.player ||
      !Player.CLASSES[data.player.classId] ||
      !getLocation(data.gameState.currentLocationId)
    ) {
      UI.toast('Saved game could not be loaded.', 'bad')
      return false
    }
    resetState()
    Object.assign(gameState, data.gameState)
    ensureExtras()
    gameState.inventory = gameState.inventory.filter(id => getItem(id))
    Player.restore(data.player)
    showScreen('explore')
    say([`You continue your journey at ${loc().name}.`], 'system')
    renderExplore()
    return true
  }
  function showScreen (name) {
    Object.entries(els.screens).forEach(([k, s]) => {
      s.hidden = k !== name
      s.classList.toggle('active', k === name)
    })
    root.dataset.screen = name
    if (name !== 'explore') {
      closeOverlay()
      document.body.classList.remove('page-dark-environment')
    }
    refreshTopbar()
  }
  function refreshTopbar () {
    const on = combatConfig.miniGames.enabled
    els.miniBtn.textContent = `Mini-games: ${on ? 'On' : 'Off'}`
    els.miniBtn.setAttribute('aria-pressed', String(on))
    els.saveBtn.disabled = !Player.state.classId || inCombat
    const screen = root ? root.dataset.screen : 'title'
    const isTitleOrClass = screen === 'title' || screen === 'class'
    const buttonText =
      hasSave() || Player.state.classId ? 'New Game' : 'Start Game'
    els.newBtn.textContent = buttonText
    els.newBtn.style.transition = 'opacity 0.3s ease'
    if (isTitleOrClass) {
      els.newBtn.style.opacity = '0'
      els.newBtn.style.pointerEvents = 'none'
      els.newBtn.disabled = true
    } else {
      els.newBtn.style.opacity = '1'
      els.newBtn.style.pointerEvents = 'auto'
      els.newBtn.disabled = false
    }
  }
  function say (lines, kind = 'narration', speaker = '') {
    if (lines && lines.length)
      UI.appendDialogue(els.feed, { speaker, lines, kind })
  }

async function promptLogout () {
  const confirmed = await UI.confirm(
    'You will remain logged in if you cancel. Any progress since your last save may be lost. Log out?',
    {
      title: 'Confirm Logout',
      yes: 'Yes, Log Out',
      no: 'Cancel'
    }
  )
  if (!confirmed) return
  if (typeof Combat !== 'undefined') Combat.cancel()
  MiniGames.cancel()
  if (typeof GameAudio !== 'undefined') GameAudio.stop()
  if (typeof ItemFX !== 'undefined' && ItemFX.cancelAll) ItemFX.cancelAll()
  document.removeEventListener('keydown', onGameKey)
  Auth.logout()
}

  function mount (rootEl) {
    root = rootEl
    UI.clear(root)
    root.classList.remove('auth-screen')
    root.classList.add('game-root')
    resetState()
    const top = h('header', 'topbar'),
      title = h('h1', 'game-title', 'Whispers of the Forgotten'),
      btns = h('div', 'topbtns')
    const miniBtn = UI.btn('Mini-games: On', 'ui-btn small', () => {
      combatConfig.miniGames.enabled = !combatConfig.miniGames.enabled
      store.set(
        config.settingsKey,
        JSON.stringify({ miniGames: combatConfig.miniGames.enabled })
      )
      refreshTopbar()
    })
    const saveBtn = UI.btn('Save', 'ui-btn small', () => {
      const saved = save()
      UI.toast(
        saved ? 'Game saved.' : 'Could not save.',
        saved ? 'good' : 'bad'
      )
    })
    const newBtn = UI.btn('Start Game', 'ui-btn small danger', () => restart())
    const logoutBtn = UI.btn('Log Out', 'ui-btn small danger', promptLogout)
    btns.append(miniBtn, saveBtn, newBtn,logoutBtn)
    if (typeof GameAudio !== 'undefined')
      btns.prepend(GameAudio.createControls())
    top.append(title, btns)
    const main = h('main', 'screens'),
      screens = {}
    ;['title', 'class', 'explore', 'combat', 'end'].forEach(n => {
      const s = h('section', `screen screen-${n}`)
      s.id = 'screen-' + n
      s.hidden = true
      screens[n] = s
      main.append(s)
    })
    root.append(top, main)
    els = { screens, miniBtn, saveBtn, newBtn, logoutBtn, combat: screens.combat }
    buildExploreShell()
    buildOverlays()
    document.removeEventListener('keydown', onGameKey)
    document.addEventListener('keydown', onGameKey)
    try {
      const s = JSON.parse(store.get(config.settingsKey))
      if (s && typeof s.miniGames === 'boolean')
        combatConfig.miniGames.enabled = s.miniGames
    } catch (e) {}
    renderTitle()
    showScreen('title')
    mountedOnce = true
  }
  function renderTitle () {
    const s = UI.clear(els.screens.title),
      box = h('div', 'title-box')
    box.append(
      h('h2', 'title-big', 'Whispers of the Forgotten'),
      h(
        'p',
        'title-sub',
        'Three worlds. One shattered crystal. Something old is waking.'
      )
    )
    const userHasSave = hasSave()
    const row = h('div', 'title-buttons')
    const newB = UI.btn(
      userHasSave ? 'New Game' : 'Start Game',
      'ui-btn primary',
      async () => {
        if (
          userHasSave &&
          !(await UI.confirm(
            'Starting a new game will overwrite your saved game.',
            { yes: 'Start new game' }
          ))
        )
          return
        store.del(config.saveKey)
        resetState()
        renderClassSelect()
        showScreen('class')
      }
    )
    row.append(newB)
    if (userHasSave)
      row.append(UI.btn('Continue', 'ui-btn primary', () => load()))
    const how = h('ul', 'howto')
    ;[
      'Explore, search and talk to uncover the story.',
      'Every item in your pack has an active gameplay purpose—use them to solve puzzles, uncover paths, and overcome enemies.',
      'In battle, choose Attack, Defend, Use Item or your class Special.',
      'Optional mini-games give bonuses; skip them any time with Esc.'
    ].forEach(t => how.append(h('li', '', t)))
    box.append(row, how)
    s.append(box)
  }
  function renderClassSelect () {
    const s = UI.clear(els.screens.class)
    s.append(h('h2', 'section-title', 'Choose your path'))
    const grid = h('div', 'class-grid')
    const characterImages = {
      wanderer: 'Wanderer.png',
      warrior: 'Warrior.png',
      mystic: 'Mystic.png'
    }
    Object.values(Player.CLASSES).forEach(c => {
      const card = h('article', `class-card class-${c.id}`)
      const stats = h('ul', 'class-stats')
      const imageName = characterImages[c.id]
      if (imageName) {
        const portrait = UI.art(
          `images/characters/${imageName}`,
          `${c.name} character artwork`,
          'class-art'
        )
        card.append(portrait)
      }
      ;[
        `Health ${c.maxHp}`,
        `Attack ${c.attack}`,
        `Defense ${c.defense}`
      ].forEach(text => {
        stats.append(h('li', '', text))
      })
      card.append(
        h('h3', '', c.name),
        h('p', 'class-tag', c.tagline),
        h('p', '', c.description),
        stats,
        h('p', 'class-passive', `Passive: ${c.passive}`),
        h('p', 'class-special', `${c.special.name}: ${c.special.desc}`),
        UI.btn(`Play as ${c.name}`, 'ui-btn primary', () => startNew(c.id))
      )
      grid.append(card)
    })
    s.append(grid)
  }
  function startNew (classId) {
    resetState()
    Player.init(classId)
    const start = getWorld(Object.keys(worlds)[0]).startingLocationId
    gameState.currentLocationId = start
    showScreen('explore')
    say([`You begin as a ${Player.info().name}.`], 'system')
    arrive(start, [])
    save()
  }
  function buildExploreShell () {
    const s = els.screens.explore
    const status = h('section', 'status-bar')
    status.setAttribute('aria-label', 'Hero status')
    const compList = h('div', 'comp-chips')
    const layout = h('div', 'explore-layout'),
      main = h('div', 'explore-main')
    const scene = h('div', 'scene'),
      head = h('div', 'scene-head')
    const worldLine = h('div', 'scene-world'),
      place = h('h2', 'scene-title'),
      objective = h('p', 'scene-objective')
    head.append(worldLine, place, objective)
    scene.append(head)
    const feed = h('div', 'feed')
    feed.setAttribute('aria-label', 'Story')
    feed.tabIndex = 0
    const actions = h('div', 'actions')
    actions.setAttribute('role', 'group')
    actions.setAttribute('aria-label', 'Actions')
    main.append(scene, feed, actions)
    const rail = h('nav', 'rail')
    rail.setAttribute('aria-label', 'Map and inventory')
    const mapBtn = railButton('🗺', 'Map', 'Open map', () =>
      openOverlay('map', mapBtn)
    )
    const bagBtn = railButton('🎒', 'Bag', 'Open inventory', () =>
      openOverlay('bag', bagBtn)
    )
    const bagBadge = h('span', 'rail-badge', '0')
    bagBtn.append(bagBadge)
    rail.append(mapBtn, bagBtn)
    layout.append(main, rail)
    let sceneBg = document.getElementById('whispers-scene-bg')
    let sceneLayers
    if (!sceneBg) {
      sceneBg = h('div', 'scene-bg')
      sceneBg.id = 'whispers-scene-bg'
      sceneBg.setAttribute('aria-hidden', 'true')
      sceneBg.dataset.art = 'none'
      sceneLayers = [h('div', 'scene-bg-layer'), h('div', 'scene-bg-layer')]
      sceneBg.append(...sceneLayers)
      document.body.prepend(sceneBg)
    } else {
      sceneLayers = Array.from(sceneBg.querySelectorAll('.scene-bg-layer'))
    }
    s.append(status, layout)
    Object.assign(els, {
      status,
      compList,
      scene,
      sceneBg,
      sceneLayers,
      place,
      worldLine,
      objective,
      feed,
      actions,
      mapBtn,
      bagBtn,
      bagBadge
    })
  }
  function railButton (icon, label, ariaLabel, onClick) {
    const b = UI.btn('', 'rail-btn', onClick)
    b.setAttribute('aria-label', ariaLabel)
    b.append(h('span', 'rail-icon', icon), h('span', 'rail-label', label))
    return b
  }
  const SCENE_IMAGE_FILES = { W2P6: 'W2P6.jpeg' }
  let sceneArtId = null
  let sceneActive = 0
  async function setSceneArt (locationId) {
    if (locationId === sceneArtId) return
    sceneArtId = locationId
    const token = ++bgToken
    const imageName = SCENE_IMAGE_FILES[locationId] || `${locationId}.png`
    const imagePath = `images/worlds/${imageName}`
    const imageExists = await UI.loadImage(imagePath)
    if (token !== bgToken) return
    const current = els.sceneLayers[sceneActive]
    const next = els.sceneLayers[1 - sceneActive]
    if (!imageExists) {
      current.classList.remove('is-visible')
      current.dataset.src = ''
      els.sceneBg.dataset.art = 'none'
      return
    }
    els.sceneBg.dataset.art = 'location'
    if (
      current.dataset.src === imagePath &&
      current.classList.contains('is-visible')
    ) {
      return
    }
    next.style.transition = 'none'
    next.classList.remove('is-visible')
    next.style.backgroundImage = `url("${imagePath}")`
    next.dataset.src = imagePath
    void next.offsetWidth
    next.style.transition = ''
    next.classList.add('is-visible')
    current.classList.remove('is-visible')
    sceneActive = 1 - sceneActive
  }
  function arrive (locationId, unlockLines) {
    const l = getLocation(locationId),
      first = !gameState.visited.includes(locationId)
    gameState.currentLocationId = locationId
    if (unlockLines && unlockLines.length) say(unlockLines, 'unlock')
    say(first ? l.firstVisit : l.revisit, 'narration', l.name)
    if (first) gameState.visited.push(locationId)
    renderExplore()
    save()
    if (typeof GameAudio !== 'undefined' && !inCombat) {
      GameAudio.startExplorationMusic()
    }
  }
  function isPlaceDone (l) {
    const fought = !l.enemyId || isDefeated(l.id),
      searched =
        !l.search.length ||
        gameState.searched.includes(l.id) ||
        l.itemSource === 'enemy'
    return fought && searched
  }
  function objectiveText (l) {
    if (l.id === 'W1P2' && !gameState.illuminatedLocations.includes('W1P2')) {
      return 'The forest entrance is pitch-black. Use the Rusty Lantern to illuminate the path.'
    }
    if (l.id === 'W1P5' && !gameState.illuminatedLocations.includes('W1P5')) {
      return 'The cave interior is pitch-black. Illuminate it with the Rusty Lantern to search and navigate safely.'
    }
    if (l.id === 'W1P6' && !gameState.puzzlesSolved['shrine_riddle']) {
      return 'Inspect the Waterlogged Diary and solve the Ancient Shrine Riddle to unlock the pedestal.'
    }
    if (l.id === 'W2P2' && !gameState.dunesCalibrated) {
      return 'The dunes are shifting uncontrollably. Use the Ancient Compass to calibrate the route.'
    }
    if (l.id === 'W2P4' && !gameState.puzzlesSolved['temple_glyphs']) {
      return 'The temple door is locked behind serpent hieroglyphs. Study the Carved Stone to decipher the cipher.'
    }
    if (l.id === 'W2P6' && !gameState.puzzlesSolved['altar_ritual']) {
      return 'The crystal altar is dormant. Read the Ancient Tablet and perform the harmonic attunement ritual.'
    }
    if (l.id === 'W3P1' && hasItem('frozen-key') && !gameState.keyThawed) {
      return 'The Frozen Key is trapped in glacier ice. Thaw it at the village hearth or using a heat source.'
    }
    if (l.id === 'W3P5' && !gameState.frostBridgeFrozen) {
      return 'A bottomless melting chasm blocks the way. Use the Ice Rune to freeze a solid bridge across.'
    }
    if (l.id === 'W3P6' && !gameState.crownEquipped) {
      return 'The Crystal Guardian is shielded by a Sovereign Ward. Don the Ancient Crown to dispel its defenses.'
    }
    if (
      l.id === 'W3P7' &&
      isDefeated('W3P7') &&
      !gameState.worldPurified['frostfell']
    ) {
      return 'Unite The Green Crystal, The Serpent Crystal, and The Dragon Crystal at the Grand Monolith to finish your adventure!'
    }
    return (isPlaceDone(l) ? l.nextObjective : l.objective)[0] || ''
  }
  function renderExplore () {
    const l = loc()
    if (!l) return
    const w = getWorld(l.worldId)
    els.worldLine.textContent = w.name
    els.place.textContent = l.name
    els.objective.textContent = 'Objective: ' + objectiveText(l)
    const isDarkArea =
      (l.id === 'W1P2' || l.id === 'W1P5') &&
      !gameState.illuminatedLocations.includes(l.id)
    document.body.classList.toggle('page-dark-environment', isDarkArea)
    els.scene.classList.toggle(
      'is-illuminated',
      gameState.illuminatedLocations.includes(l.id)
    )
    setSceneArt(l.id)
    renderActions(l)
    renderStatus()
    refreshTopbar()
    els.bagBadge.textContent = String(gameState.inventory.length)
    els.bagBadge.hidden = gameState.inventory.length === 0
    if (openOverlayName === 'bag') renderBag()
  }
  function renderStatus () {
    const S = Player.state,
      info = Player.info()
    UI.clear(els.status)
    if (!info) return
    const bar = UI.healthBar(
      `${info.name} Lv ${S.level}`,
      S.hp,
      S.maxHp,
      'player'
    )
    bar.extra.textContent = `XP ${S.xp}/${Player.xpToNext()} · Score ${
      gameState.score
    } · ATK ${S.attack} DEF ${S.defense}`
    UI.renderCompanions(
      els.compList,
      gameState.companions.map(getCompanion).filter(Boolean)
    )
    els.status.append(bar.root, els.compList)
  }
  function actionButton (label, cls, onClick, note) {
    const wrap = h('div', 'action'),
      b = UI.btn(label, `ui-btn ${cls}`, onClick)
    wrap.append(b)
    if (note) wrap.append(h('div', 'action-note', note))
    return { wrap, b }
  }
  function renderActions (l) {
    const box = UI.clear(els.actions)
    if (
      (l.id === 'W1P2' || l.id === 'W1P5') &&
      hasItem('rusty-lantern') &&
      !gameState.illuminatedLocations.includes(l.id)
    ) {
      box.append(
        actionButton('Illuminate Area with Lantern', 'primary', () => {
          useItem('rusty-lantern')
        }).wrap
      )
    }
    if (l.id === 'W1P6' && !gameState.puzzlesSolved['shrine_riddle']) {
      box.append(
        actionButton('Solve Shrine Riddle', 'primary', () =>
          solveShrineRiddle()
        ).wrap
      )
    }
    if (
      l.id === 'W2P2' &&
      hasItem('ancient-compass') &&
      !gameState.dunesCalibrated
    ) {
      box.append(
        actionButton('Calibrate Path with Compass', 'primary', () => {
          useItem('ancient-compass')
        }).wrap
      )
    }
    if (l.id === 'W2P4' && !gameState.puzzlesSolved['temple_glyphs']) {
      box.append(
        actionButton('Align Temple Serpent Glyphs', 'primary', () =>
          solveTempleGlyphs()
        ).wrap
      )
    }
    if (l.id === 'W2P6' && !gameState.puzzlesSolved['altar_ritual']) {
      box.append(
        actionButton('Perform Crystal Altar Ritual', 'primary', () =>
          solveAltarRitual()
        ).wrap
      )
    }
    if (
      hasItem('frozen-key') &&
      !gameState.keyThawed &&
      (l.id === 'W3P1' ||
        hasItem('the-serpent-crystal') ||
        hasItem('rusty-lantern'))
    ) {
      box.append(
        actionButton('Thaw Frozen Key', 'primary', () => {
          thawFrozenKey()
          renderExplore()
        }).wrap
      )
    }
    if (
      l.id === 'W3P5' &&
      hasItem('ice-rune') &&
      !gameState.frostBridgeFrozen
    ) {
      box.append(
        actionButton('Freeze Chasm with Ice Rune', 'primary', () => {
          useItem('ice-rune')
        }).wrap
      )
    }
    if (
      l.id === 'W3P6' &&
      hasItem('ancient-crown') &&
      !gameState.crownEquipped
    ) {
      box.append(
        actionButton('Don Ancient Crown', 'primary', () => {
          useItem('ancient-crown')
        }).wrap
      )
    }
    if (
      l.id === 'W3P7' &&
      isDefeated('W3P7') &&
      hasItem('the-dragon-crystal') &&
      !gameState.worldPurified['frostfell']
    ) {
      box.append(
        actionButton('Unite the Three Crystals', 'gate', () => uniteCrystals())
          .wrap
      )
    }
    l.choiceIds
      .map(getChoice)
      .filter(Boolean)
      .forEach(c => {
        if (c.type === 'search') {
          const done = gameState.searched.includes(l.id)
          box.append(
            actionButton(
              done ? 'Search the area (searched)' : c.text,
              done ? 'dim' : '',
              () => search()
            ).wrap
          )
        } else if (c.type === 'talk')
          box.append(actionButton(c.text, '', () => talk()).wrap)
        else if (c.type === 'fight') {
          if (!isDefeated(l.id))
            box.append(actionButton(c.text, 'danger', () => fight()).wrap)
        } else if (c.type === 'travel') {
          const gate = canEnterLocation(c.nextLocationId, gameState)
          if (gate.allowed) {
            const isVisited = gameState.visited.includes(c.nextLocationId)
            box.append(
              actionButton(
                c.text,
                isVisited ? 'travel visited' : 'travel',
                () => travelTo(c.nextLocationId)
              ).wrap
            )
          } else {
            const a = actionButton(
              '🔒 ' + c.text,
              'locked',
              () => travelTo(c.nextLocationId),
              gate.text.join(' ')
            )
            a.b.setAttribute('aria-disabled', 'true')
            box.append(a.wrap)
          }
        }
      })
    if (gameState.completedWorlds.includes(l.worldId)) {
      const nxt = nextWorldOf(l.worldId)
      if (nxt && isWorldUnlocked(nxt.id, gameState))
        box.append(
          actionButton(`Journey to ${nxt.w.name}`, 'gate', () =>
            journey(nxt.id)
          ).wrap
        )
      else if (!nxt)
        box.append(
          actionButton('Complete your adventure', 'gate', () => showEnding())
            .wrap
        )
    }
  }
  async function solveShrineRiddle () {
    if (!gameState.clues['waterlogged_diary']) {
      UI.toast(
        'You cannot make sense of these symbols yet. Find a clue first.',
        'bad'
      )
      say(
        [
          'The elemental dials on the shrine pedestal are inscribed with ancient glyphs. Without a deciphering clue, any attempt to turn them causes them to snap back into locked positions.'
        ],
        'locked'
      )
      return
    }
    const choice = await UI.modal({
      title: 'Ancient Shrine Riddle',
      body: [
        'The pedestal features three rotating elemental dials depicting Water, Earth, and Fire.',
        'According to the Waterlogged Diary, in which order must the elements of nature flow?'
      ],
      buttons: [
        {
          label: '1. River Water → Deep Earth → Sun Fire',
          value: 'correct',
          kind: 'primary'
        },
        { label: '2. Sun Fire → Deep Earth → River Water', value: 'wrong1' },
        { label: '3. Deep Earth → Sun Fire → River Water', value: 'wrong2' }
      ],
      dismissValue: null
    })
    if (choice === 'correct') {
      gameState.puzzlesSolved['shrine_riddle'] = true
      say(
        [
          'You turn the dials: River Water, Deep Earth, and Sun Fire. With a resonant melodic chime, the stone mechanism unlocks! The pedestal is now prepared for the Ancient Symbol Stone.'
        ],
        'unlock'
      )
      UI.toast(
        'Shrine Riddle solved! The pedestal sockets are unlocked.',
        'good'
      )
      renderExplore()
      save()
    } else if (choice) {
      say(
        [
          'You turn the dials, but the runes glow crimson and lock back with a harsh metallic clang. That combination does not match the sacred flow.'
        ],
        'locked'
      )
      UI.toast(
        'The puzzle remains unsolved. Check your clue and try again.',
        'bad'
      )
    }
  }
  async function solveTempleGlyphs () {
    if (!gameState.clues['carved_stone']) {
      UI.toast(
        'You cannot make sense of these symbols yet. Find a clue first.',
        'bad'
      )
      say(
        [
          'The temple gate is barred by three rotating circular stone discs bearing serpent pictographs. You cannot understand their order without a translated carving.'
        ],
        'locked'
      )
      return
    }
    const choice = await UI.modal({
      title: 'Forgotten Temple Serpent Cipher',
      body: [
        'Three stone serpent glyphs must be aligned to unseal the inner catacombs.',
        "According to the Carved Stone, what is the sacred sequence of the Serpent's Chant?"
      ],
      buttons: [
        {
          label: '1. Serpent Head → Solar Disc → Coiled Tail',
          value: 'correct',
          kind: 'primary'
        },
        {
          label: '2. Solar Disc → Coiled Tail → Serpent Head',
          value: 'wrong1'
        },
        { label: '3. Coiled Tail → Serpent Head → Solar Disc', value: 'wrong2' }
      ],
      dismissValue: null
    })
    if (choice === 'correct') {
      gameState.puzzlesSolved['temple_glyphs'] = true
      say(
        [
          'You align the three dials: Serpent Head, Solar Disc, Coiled Tail. The stone serpent eyes ignite with golden fire, and the inner temple portal glides open!'
        ],
        'unlock'
      )
      UI.toast(
        'Serpent Cipher solved! The inner temple catacombs are unsealed.',
        'good'
      )
      renderExplore()
      save()
    } else if (choice) {
      say(
        [
          'The serpent dials grind stubbornly and lock in place. The glyph sequence was incorrect.'
        ],
        'locked'
      )
      UI.toast('The puzzle remains unsolved. Consult the Carved Stone.', 'bad')
    }
  }
  async function solveAltarRitual () {
    if (!gameState.clues['ancient_tablet']) {
      UI.toast(
        'You cannot make sense of these symbols yet. Find a clue first.',
        'bad'
      )
      say(
        [
          'The crystal altar hums discordantly. Without studying the ceremonial rites on the Ancient Tablet, attempting to channel the energy would cause a dangerous magical backlash.'
        ],
        'locked'
      )
      return
    }
    const choice = await UI.modal({
      title: 'Crystal Chamber Harmonic Ritual',
      body: [
        'Three crystal focal points on the altar must be struck in harmonic frequency.',
        'According to the Ancient Tablet, what is the proper elemental order of resonance?'
      ],
      buttons: [
        {
          label: '1. Solar Gold → Azure Sky → Crimson Fire',
          value: 'correct',
          kind: 'primary'
        },
        { label: '2. Crimson Fire → Solar Gold → Azure Sky', value: 'wrong1' },
        { label: '3. Azure Sky → Crimson Fire → Solar Gold', value: 'wrong2' }
      ],
      dismissValue: null
    })
    if (choice === 'correct') {
      gameState.puzzlesSolved['altar_ritual'] = true
      addItem('crystal-seal', gameState)
      say(
        [
          'You strike the crystal nodes in harmony: Solar Gold, Azure Sky, and Crimson Fire. A brilliant column of crystalline energy erupts from the altar, solidifying into the sacred Crystal Seal!'
        ],
        'unlock'
      )
      UI.toast('Altar Ritual complete! You obtained the Crystal Seal.', 'good')
      renderExplore()
      save()
    } else if (choice) {
      say(
        [
          'The crystal notes clash in dissonance, and a burst of wild sparks fizzles out. The harmonic sequence failed.'
        ],
        'locked'
      )
      UI.toast('The ritual failed. Review the Ancient Tablet.', 'bad')
    }
  }
  function thawFrozenKey () {
    gameState.keyThawed = true
    say(
      [
        'You hold the icy block near the blazing heat. The ancient glacier permafrost hisses into steam, leaving a gleaming, master-crafted key in your hand!'
      ],
      'unlock'
    )
    UI.toast(
      'The Frozen Key has been thawed! It can now unlock the Castle Gate.',
      'good'
    )
    save()
  }
  function uniteCrystals () {
    gameState.worldPurified['frostfell'] = true
    say(
      [
        'You place The Dragon Crystal alongside the Green and Serpent Crystals at the Grand Monolith.',
        'A blinding celestial pillar erupts into the heavens! The dark whispers dissolve into eternal serenity. The three worlds are restored!'
      ],
      'reward'
    )
    UI.toast('All three crystals are united! The world is restored.', 'good')
    save()
    setTimeout(() => {
      showEnding()
    }, 600)
  }
  function makeOverlay (id, title, closeLabel) {
    const ov = h('div', 'overlay'),
      box = h('div', 'overlay-box'),
      head = h('header', 'overlay-head'),
      body = h('div', 'overlay-body')
    ov.id = id
    ov.hidden = true
    box.setAttribute('role', 'dialog')
    box.setAttribute('aria-modal', 'true')
    box.setAttribute('aria-label', title)
    const close = UI.btn('✕', 'ui-btn overlay-close', () => closeOverlay())
    close.setAttribute('aria-label', closeLabel)
    head.append(h('h2', 'overlay-title', title), close)
    box.append(head, body)
    ov.append(box)
    return { ov, box, body, close }
  }
  function buildOverlays () {
    els.map = makeOverlay('map-overlay', 'Map', 'Close map')
    els.bag = makeOverlay('bag-overlay', 'Inventory', 'Close inventory')
    root.append(els.map.ov, els.bag.ov)
  }
  function openOverlay (name, opener) {
    if (
      openOverlayName ||
      inCombat ||
      !root ||
      root.dataset.screen !== 'explore' ||
      !gameState.currentLocationId
    )
      return false
    const o = name === 'map' ? els.map : els.bag
    selectedItemId = null
    bagNote = ''
    try {
      if (name === 'map') renderMap()
      else renderBag()
    } catch (err) {
      console.error(`Could not open the ${name} overlay:`, err)
      UI.toast(`The ${name} could not be opened.`, 'bad')
      return false
    }
    openOverlayName = name
    overlayOpener = opener || document.activeElement
    o.ov.hidden = false
    document.body.classList.add('no-scroll')
    o.close.focus()
    return true
  }
  function closeOverlay () {
    if (!openOverlayName) return false
    const o = openOverlayName === 'map' ? els.map : els.bag
    o.ov.hidden = true
    openOverlayName = null
    document.body.classList.remove('no-scroll')
    if (overlayOpener && overlayOpener.focus) overlayOpener.focus()
    overlayOpener = null
    return true
  }
  function onGameKey (e) {
    if (!openOverlayName) return
    if (e.key === 'Escape' && !document.querySelector('.modal-back')) {
      e.preventDefault()
      closeOverlay()
      return
    }
    if (e.key === 'Tab') {
      const box = openOverlayName === 'map' ? els.map.box : els.bag.box
      const focusable = [...box.querySelectorAll('button:not(:disabled)')]
      if (!focusable.length) return
      const first = focusable[0],
        last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
  const STATUS_LABEL = {
    current: 'you are here',
    available: 'you can travel here now',
    visited: 'visited',
    completed: 'completed',
    locked: 'locked',
    unexplored: 'not visited yet'
  }
  const STATUS_ICON = {
    current: '📍',
    available: '➜',
    visited: '•',
    completed: '✔',
    locked: '🔒',
    unexplored: '?'
  }
  function canTravelNow (id) {
    return (
      loc().nextLocationIds.includes(id) &&
      canEnterLocation(id, gameState).allowed
    )
  }
  function locationStatus (id) {
    if (id === gameState.currentLocationId) return 'current'
    if (!canEnterLocation(id, gameState).allowed) return 'locked'
    if (gameState.visited.includes(id))
      return isPlaceDone(getLocation(id)) ? 'completed' : 'visited'
    return canTravelNow(id) ? 'available' : 'unexplored'
  }
  function layoutWorld (world) {
    const depth = {},
      queue = [world.startingLocationId]
    depth[queue[0]] = 0
    while (queue.length) {
      const id = queue.shift()
      getLocation(id).nextLocationIds.forEach(next => {
        if (depth[next] === undefined && world.locationIds.includes(next)) {
          depth[next] = depth[id] + 1
          queue.push(next)
        }
      })
    }
    const lastColumn = Math.max(0, ...Object.values(depth))
    world.locationIds.forEach(id => {
      if (depth[id] === undefined) depth[id] = lastColumn + 1
    })
    const columns = Math.max(...Object.values(depth)) + 1,
      byColumn = {},
      pos = {}
    world.locationIds.forEach(id => {
      ;(byColumn[depth[id]] = byColumn[depth[id]] || []).push(id)
    })
    Object.entries(byColumn).forEach(([col, ids]) =>
      ids.forEach((id, row) => {
        pos[id] = {
          x: ((Number(col) + 0.5) / columns) * 100,
          y: ((row + 1) / (ids.length + 1)) * 100
        }
      })
    )
    return pos
  }
  function renderMap () {
    const body = UI.clear(els.map.body),
      here = loc()
    els.mapMessage = h(
      'p',
      'map-message',
      `You are at ${here.name}. Click a place to travel there.`
    )
    els.mapMessage.setAttribute('role', 'status')
    const legend = h('div', 'map-legend')
    Object.keys(STATUS_LABEL).forEach(k =>
      legend.append(
        h(
          'span',
          `legend-item status-${k}`,
          `${STATUS_ICON[k]} ${
            k === 'current'
              ? 'You are here'
              : k === 'available'
              ? 'Travel now'
              : STATUS_LABEL[k][0].toUpperCase() + STATUS_LABEL[k].slice(1)
          }`
        )
      )
    )
    body.append(els.mapMessage, legend, buildWorldMap(here.worldId))
    Object.keys(worlds)
      .filter(worldId => worldId !== here.worldId)
      .forEach(worldId => {
        const w = getWorld(worldId),
          done = gameState.completedWorlds.includes(worldId),
          open = isWorldUnlocked(worldId, gameState),
          req = w.unlockRequirement
        body.append(
          h(
            'p',
            'map-world-note',
            `${done ? '✔ ' : open ? '' : '🔒 '}${w.name}: ${
              done
                ? 'completed'
                : open
                ? 'unlocked'
                : `locked until you complete ${
                    getWorld(req.completedWorldId).name
                  }`
            }`
          )
        )
      })
  }
  function buildWorldMap (worldId) {
    const world = getWorld(worldId),
      section = h('section', 'map-world'),
      unlocked = isWorldUnlocked(worldId, gameState),
      finished = gameState.completedWorlds.includes(worldId)
    const seen = world.locationIds.filter(id =>
        gameState.visited.includes(id)
      ).length,
      req = world.unlockRequirement
    const note = unlocked
      ? `${seen}/${world.locationIds.length} places visited`
      : `Locked: complete ${getWorld(req.completedWorldId).name} first`
    section.append(
      h(
        'h3',
        'map-world-title',
        `${finished ? '✔ ' : unlocked ? '' : '🔒 '}${world.name}`
      ),
      h('p', 'map-world-note', note)
    )
    const layout = layoutWorld(world)
    const canvas = h('div', 'map-canvas')
    const SVG = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(SVG, 'svg')
    svg.setAttribute('class', 'map-lines')
    const drawn = new Set()
    world.locationIds.forEach(id =>
      getLocation(id).nextLocationIds.forEach(toId => {
        const key = [id, toId].sort().join('-')
        if (!layout[toId] || drawn.has(key)) return
        drawn.add(key)
        const line = document.createElementNS(SVG, 'line'),
          lockedEdge = [id, toId].some(x => {
            const k = getLocation(x).lock
            return k && !gameState.unlockedLocations.includes(x)
          })
        line.setAttribute('x1', layout[id].x + '%')
        line.setAttribute('y1', layout[id].y + '%')
        line.setAttribute('x2', layout[toId].x + '%')
        line.setAttribute('y2', layout[toId].y + '%')
        line.setAttribute(
          'class',
          'map-edge' + (lockedEdge ? ' is-locked' : '')
        )
        line.setAttribute('data-from', id)
        line.setAttribute('data-to', toId)
        svg.append(line)
      })
    )
    canvas.append(svg)
    world.locationIds.forEach(id => canvas.append(buildMapNode(id, layout[id])))
    section.append(canvas)
    return section
  }
  function buildMapNode (id, pos) {
    const l = getLocation(id),
      status = locationStatus(id),
      node = h(
        'button',
        `map-node status-${status}${canTravelNow(id) ? ' is-adjacent' : ''}`
      )
    node.type = 'button'
    node.dataset.id = id
    node.style.left = pos.x + '%'
    node.style.top = pos.y + '%'
    node.setAttribute('aria-label', `${l.name}: ${STATUS_LABEL[status]}`)
    node.append(
      h('span', 'node-dot', STATUS_ICON[status]),
      h('span', 'node-name', l.name),
      h(
        'span',
        'node-links',
        'Leads to: ' +
          l.nextLocationIds.map(n => getLocation(n).name).join(', ')
      )
    )
    node.addEventListener('click', () => onMapNodeClick(id))
    return node
  }
  function mapSay (text, kind = '') {
    els.mapMessage.textContent = text
    els.mapMessage.className = 'map-message ' + kind
  }
  function onMapNodeClick (id) {
    const l = getLocation(id),
      here = loc()
    if (id === here.id) {
      closeOverlay()
      return
    }
    const gate = canEnterLocation(id, gameState),
      connected = here.nextLocationIds.includes(id)
    if (!gate.allowed)
      return mapSay(
        `${l.name} is locked. ${gate.text.join(' ')}${
          connected ? '' : ' It is also not connected to where you stand.'
        }`,
        'bad'
      )
    if (!connected)
      return mapSay(
        `You can't reach ${l.name} directly from ${here.name}. Follow the lines between places.`,
        'bad'
      )
    closeOverlay()
    travelTo(id)
  }
  const TYPE_LABEL = {
    consumable: 'Consumable Potion',
    key: 'Key Item',
    quest: 'Quest Artifact',
    tool: 'Adventuring Tool',
    clue: 'Puzzle Clue',
    relic: 'Sacred Relic',
    story: 'Story Relic'
  }
  const typeLabel = item =>
    item.type === 'key'
      ? `Key Item (${item.rules === 'consumed' ? 'Single-use' : 'Reusable'})`
      : TYPE_LABEL[item.type] || 'Item'
  const countOf = id => gameState.inventory.filter(x => x === id).length
  const placesLockedBy = itemId =>
    Object.values(locations).filter(l => l.lock === itemId)
  function itemEffectText (item) {
    if (item.type === 'consumable' && Player.ITEM_HEAL[item.effect])
      return `Restores about ${Math.round(
        Player.ITEM_HEAL[item.effect] * ((Player.info() || {}).potionBonus || 1)
      )} HP. Used up on success.`
    if (item.type === 'key') {
      const opens = placesLockedBy(item.id).map(l => l.name)
      return `${
        opens.length
          ? `Opens the way to: ${opens.join(', ')}.`
          : 'Fits into its designated locking mechanism.'
      } ${
        item.rules === 'consumed'
          ? 'Used up after a successful use.'
          : 'Never used up.'
      }`
    }
    return item.purpose || 'Active item in your pack.'
  }
  function itemStatusText (item) {
    if (item.id === 'waterlogged-diary-page') {
      return gameState.clues['waterlogged_diary']
        ? 'Clue Discovered & Recorded'
        : 'Unread'
    }
    if (item.id === 'carved-stone') {
      return gameState.clues['carved_stone']
        ? 'Cipher Decoded & Recorded'
        : 'Unstudied'
    }
    if (item.id === 'ancient-tablet') {
      return gameState.clues['ancient_tablet']
        ? 'Ritual Rites Studied'
        : 'Unread'
    }
    if (item.id === 'rusty-lantern') {
      return gameState.illuminatedLocations.length > 0
        ? `Illuminating (${gameState.illuminatedLocations.length} areas revealed)`
        : 'Ready to light'
    }
    if (item.id === 'ancient-compass') {
      return gameState.dunesCalibrated
        ? 'Calibrated to Leyline'
        : 'Uncalibrated'
    }
    if (item.id === 'frozen-key') {
      return gameState.keyThawed
        ? 'Thawed & Ready'
        : 'Trapped in Glacier Permafrost'
    }
    if (item.id === 'ice-rune') {
      return gameState.frostBridgeFrozen
        ? 'Bridge Frozen & Combat Ready'
        : 'Charged with Frost'
    }
    if (item.id === 'ancient-crown') {
      return gameState.crownEquipped
        ? 'Donned (Sovereign Ward Dispelled)'
        : 'In Pack'
    }
    if (item.id === 'the-green-crystal') {
      return gameState.worldPurified['elderwood']
        ? 'Attuned & Elderwood Purified'
        : 'Ready for Attunement'
    }
    if (item.id === 'the-serpent-crystal') {
      return gameState.worldPurified['aranu']
        ? 'Attuned & Aranu Purified'
        : 'Ready for Attunement'
    }
    if (item.id === 'the-dragon-crystal') {
      return gameState.worldPurified['frostfell']
        ? 'United at Grand Monolith'
        : 'Ready to Unite'
    }
    if (item.type === 'key') {
      return gameState.unlockedLocks.includes(item.id)
        ? 'Used to Unlock Passage'
        : 'Ready for Use'
    }
    return 'In Pack'
  }
  function applyItem (itemId) {
    const it = getItem(itemId)
    if (!it) return { ok: false, text: 'Unknown item.' }
    if (!gameState.inventory.includes(itemId))
      return { ok: false, text: `You do not have the ${it.name}.` }
    if (inCombat)
      return {
        ok: false,
        text: 'You cannot do that through the bag during battle. Use the combat action menu.'
      }
    const here = loc()
    if (it.type === 'consumable') {
      if (!Player.ITEM_HEAL[it.effect])
        return { ok: false, text: `The ${it.name} has no effect.` }
      if (Player.state.hp >= Player.state.maxHp)
        return {
          ok: false,
          text: `You are already at full health. The ${it.name} is kept.`
        }
      const gained = Player.healFromItem(it.effect)
      gameState.inventory.splice(gameState.inventory.indexOf(itemId), 1)
      return {
        ok: true,
        text: `You drink the ${it.name} and recover ${gained} HP.`,
        kind: 'reward',
        note: `Recovered ${gained} HP.`
      }
    }
    if (itemId === 'rusty-lantern') {
      if (here.id === 'W1P2' || here.id === 'W1P5') {
        if (gameState.illuminatedLocations.includes(here.id)) {
          return {
            ok: false,
            text: `${here.name} is already brightly illuminated by the lantern.`
          }
        }
        gameState.illuminatedLocations.push(here.id)
        document.body.classList.remove('page-dark-environment')
        return {
          ok: true,
          text: `You raise the Rusty Lantern! Its brilliant golden flame cuts through the darkness of ${here.name}, revealing hidden details and pathways!`,
          kind: 'unlock',
          note: 'The area is now illuminated!'
        }
      }
      return {
        ok: true,
        text: 'The Rusty Lantern burns with a warm, steady glow, ready to pierce pitch-black caves and blind shadow foes in battle.',
        kind: 'narration'
      }
    }
    if (itemId === 'waterlogged-diary-page') {
      gameState.clues['waterlogged_diary'] = true
      return {
        ok: true,
        text: 'You inspect the smudged diary page carefully: "...The ancient shrine mechanism responds to the flow of nature: [1] River Water, [2] Deep Earth, [3] Sun Fire." (Clue recorded in journal!)',
        kind: 'search',
        note: 'You discovered a clue in the diary! Apply it to the Shrine Riddle.'
      }
    }
    if (itemId === 'carved-stone') {
      gameState.clues['carved_stone'] = true
      return {
        ok: true,
        text: 'You study the sandstone pictographs: "...The sacred temple gate yields to the serpent\'s chant: [1] Serpent Head, [2] Solar Disc, [3] Coiled Tail." (Clue recorded in journal!)',
        kind: 'search',
        note: 'You deciphered the Carved Stone! Apply the serpent cipher to the Temple Gate.'
      }
    }
    if (itemId === 'ancient-tablet') {
      gameState.clues['ancient_tablet'] = true
      return {
        ok: true,
        text: 'You decipher the celestial runes on the tablet: "...To awaken the slumbering Crystal Altar, resonate the crystals in harmony: [1] Solar Gold, [2] Azure Sky, [3] Crimson Fire." (Clue recorded in journal!)',
        kind: 'search',
        note: 'You studied the Ancient Tablet! Apply the harmonic resonance at the Crystal Altar.'
      }
    }
    if (itemId === 'ancient-compass') {
      if (here.id === 'W2P2') {
        if (gameState.dunesCalibrated) {
          return {
            ok: false,
            text: 'The dunes have already been mapped and calibrated by the compass.'
          }
        }
        gameState.dunesCalibrated = true
        return {
          ok: true,
          text: 'The compass needle locks onto the buried leyline! The shifting dunes stabilize before your eyes, opening safe paths to the Ancient Marketplace and the Forgotten Temple!',
          kind: 'unlock',
          note: 'The desert routes have been calibrated!'
        }
      }
      return {
        ok: true,
        text: 'The brass needle of the Ancient Compass quivers gently, ready to guide your footsteps across shifting sands or anticipate enemy attacks in battle.',
        kind: 'narration'
      }
    }
    if (itemId === 'ice-rune') {
      if (here.id === 'W3P5') {
        if (gameState.frostBridgeFrozen) {
          return {
            ok: false,
            text: 'The frost bridge across the chasm is already solidly frozen.'
          }
        }
        gameState.frostBridgeFrozen = true
        return {
          ok: true,
          text: 'You raise the Ice Rune. Streams of sub-zero cryogenic mist freeze the chasm into a gleaming, solid bridge of diamond ice! Safe passage to the Throne Room is restored!',
          kind: 'unlock',
          note: 'The Ice Rune created a solid frost bridge to the Throne Room!'
        }
      }
      return {
        ok: true,
        text: 'The Ice Rune pulses with intense cryogenic cold. In combat, you can unleash it to freeze any foe solid for two turns!',
        kind: 'narration'
      }
    }
    if (itemId === 'ancient-crown') {
      if (gameState.crownEquipped) {
        return {
          ok: false,
          text: 'You are already wearing the Ancient Crown. Its royal authority shields you and dispels ancient wards.'
        }
      }
      gameState.crownEquipped = true
      return {
        ok: true,
        text: "You place the Ancient Crown upon your brow. Ancient starlight illuminates your presence. The royal authority of Frostfell surrounds you—the Crystal Guardian's invulnerability ward will be powerless against you!",
        kind: 'reward',
        note: "Ancient Crown donned! The Crystal Guardian's ward is shattered."
      }
    }
    if (itemId === 'the-green-crystal') {
      if (gameState.worldPurified['elderwood']) {
        return {
          ok: false,
          text: 'The Green Crystal is already attuned and pulsating with pure restorative life.'
        }
      }
      gameState.worldPurified['elderwood'] = true
      Player.state.maxHp += 15
      Player.state.hp = Math.min(Player.state.maxHp, Player.state.hp + 15)
      Player.state.attack += 1
      return {
        ok: true,
        text: 'You hold The Green Crystal aloft! A wave of emerald radiance sweeps through Elderwood Forest, purging the corrupt whispers! Your vitality strengthens permanently (+15 Max HP, +1 ATK). The portal to the Sands of Aranu awakens!',
        kind: 'reward',
        note: 'Elderwood is purified! Your power grows, and the Desert Gate awakens.'
      }
    }
    if (itemId === 'the-serpent-crystal') {
      if (gameState.worldPurified['aranu']) {
        return {
          ok: false,
          text: 'The Serpent Crystal is already radiating its eternal solar warmth.'
        }
      }
      gameState.worldPurified['aranu'] = true
      Player.state.maxHp += 15
      Player.state.hp = Math.min(Player.state.maxHp, Player.state.hp + 15)
      Player.state.defense += 1
      let thawMsg = ''
      if (hasItem('frozen-key') && !gameState.keyThawed) {
        gameState.keyThawed = true
        thawMsg =
          ' The intense heat also melts the glacier ice encasing your Frozen Key!'
      }
      return {
        ok: true,
        text: `You invoke The Serpent Crystal! Waves of solar fire purge the desert corruption (+15 Max HP, +1 DEF).${thawMsg} The frozen mountain path into Frostfell Peaks is unsealed!`,
        kind: 'reward',
        note: 'The Sands of Aranu are cleansed! Defenses increased, and Frostfell Peaks unlocked.'
      }
    }
    if (itemId === 'the-dragon-crystal') {
      if (here.id === 'W3P7' && isDefeated('W3P7')) {
        uniteCrystals()
        return {
          ok: true,
          text: 'You unite The Dragon Crystal with the Green and Serpent Crystals at the Grand Monolith!',
          kind: 'reward'
        }
      }
      return {
        ok: true,
        text: 'The Dragon Crystal pulses with cosmic energy, ready to be united at the Grand Monolith once the Ice Dragon is defeated.',
        kind: 'narration'
      }
    }
    if (it.type === 'key') {
      if (itemId === 'frozen-key') {
        if (!gameState.keyThawed) {
          if (
            here.id === 'W3P1' ||
            hasItem('the-serpent-crystal') ||
            hasItem('rusty-lantern')
          ) {
            thawFrozenKey()
            return {
              ok: true,
              text: 'You thaw the Frozen Key with heat. It is now ready to unlock the Castle Gate!',
              kind: 'unlock'
            }
          }
          return {
            ok: false,
            text: 'The Frozen Key is encased in solid glacier ice! You must thaw it with heat (such as the Serpent Crystal, Lantern, or Village Hearth) before use.'
          }
        }
      }
      if (
        itemId === 'ancient-symbol-stone' &&
        !gameState.puzzlesSolved['shrine_riddle']
      ) {
        return {
          ok: false,
          text: "The pedestal's rune sockets are locked tight behind stone seals. You must solve the Shrine Riddle before the stone can be placed."
        }
      }
      const sealed = placesLockedBy(it.id)
      const isOpen = id =>
        gameState.unlockedLocations.includes(id) ||
        gameState.unlockedLocks.includes(it.id)
      if (!sealed.length)
        return {
          ok: false,
          text: `No lock in the game responds to the ${it.name} yet.`
        }
      const doors = here.nextLocationIds
        .map(getLocation)
        .filter(l => l && l.lock === it.id)
      if (!doors.length && here.lock !== it.id) {
        return {
          ok: false,
          text: `The ${
            it.name
          } doesn't fit anything here. It opens the sealed way to ${sealed
            .map(d => d.name)
            .join(' and ')}.`
        }
      }
      const closed = doors.filter(d => !isOpen(d.id))
      if (!closed.length && isOpen(here.id)) {
        return {
          ok: false,
          text: `The way locked by the ${it.name} is already open.`
        }
      }
      closed.forEach(d => {
        gameState.unlockedLocations.push(d.id)
      })
      if (!gameState.unlockedLocks.includes(it.id)) {
        gameState.unlockedLocks.push(it.id)
      }
      return {
        ok: true,
        text: `The ${
          it.name
        } fits the lock and turns with a mechanical clunk. The sealed way to ${closed
          .map(d => d.name)
          .join(' and ')} is open!`,
        kind: 'unlock',
        note: `The passage is now unlocked!`
      }
    }
    return {
      ok: true,
      text: `${it.name}: ${it.purpose || (it.description || []).join(' ')}`,
      kind: 'search'
    }
  }
  function renderBag () {
    const body = UI.clear(els.bag.body),
      ids = [...new Set(gameState.inventory)].filter(id => getItem(id)),
      items = ids.map(getItem)
    if (!items.length) {
      body.append(
        h(
          'p',
          'empty',
          'Your pack is empty. Search places and defeat enemies to find items.'
        )
      )
      return
    }
    if (!items.some(it => it.id === selectedItemId)) selectedItemId = null
    const note = h('p', 'bag-note', bagNote)
    note.setAttribute('role', 'status')
    const layout = h('div', 'bag-layout'),
      grid = h('div', 'bag-grid'),
      detail = h('div', 'bag-detail')
    items.forEach(it => grid.append(buildItemTile(it)))
    layout.append(grid, detail)
    body.append(note, layout)
    renderItemDetail(detail)
  }
  function buildItemTile (item) {
    const tile = h(
      'button',
      `item-tile item-${item.type || 'story'}${
        item.id === selectedItemId ? ' selected' : ''
      }`
    )
    tile.type = 'button'
    tile.dataset.id = item.id
    const tip = h('span', 'tooltip')
    tip.id = 'tip-' + item.id
    tip.setAttribute('role', 'tooltip')
    tip.append(
      h('strong', '', item.name),
      h('span', '', item.purpose || itemEffectText(item))
    )
    tile.append(
      UI.art(`images/items/${item.id}.png`, item.name, 'item-art'),
      h('span', 'item-name', item.name),
      tip
    )
    if (countOf(item.id) > 1)
      tile.append(h('span', 'item-count', `×${countOf(item.id)}`))
    tile.setAttribute('aria-describedby', tip.id)
    tile.addEventListener('click', () => {
      selectedItemId = item.id
      bagNote = ''
      renderBag()
      const t = els.bag.body.querySelector(`[data-id="${item.id}"]`)
      if (t) t.focus()
    })
    return tile
  }
  function renderItemDetail (box) {
    UI.clear(box)
    const item = getItem(selectedItemId)
    if (!item) {
      box.append(
        h(
          'p',
          'empty',
          'Select an item to read its lore and activate its gameplay effect.'
        )
      )
      return
    }
    const scrollContainer = h('div', 'bag-detail-content')
    const statusBadge = h(
      'div',
      'item-status-badge',
      `Status: ${itemStatusText(item)}`
    )
    if (
      /Discovered|Attuned|Thawed|Illuminating|Calibrated|Dispelled|Frozen/i.test(
        itemStatusText(item)
      )
    ) {
      statusBadge.classList.add('active')
    } else if (/Trapped|Unread|Uncalibrated/i.test(itemStatusText(item))) {
      statusBadge.classList.add('warning')
    }
    const parts = [
      UI.art(`images/items/${item.id}.png`, item.name, 'detail-art'),
      h('h3', 'detail-name', item.name),
      h('p', 'detail-type', typeLabel(item)),
      statusBadge,
      h('p', '', (item.description || []).join(' '))
    ]
    if (item.lore) parts.push(h('p', 'detail-lore', `Lore: ${item.lore}`))
    if (item.purpose)
      parts.push(h('p', 'detail-purpose', `Gameplay Purpose: ${item.purpose}`))
    if (item.usageInstructions)
      parts.push(
        h('p', 'detail-instructions', `Usage: ${item.usageInstructions}`)
      )
    parts.push(h('p', 'detail-effect', itemEffectText(item)))
    if (item.type === 'consumable')
      parts.push(h('p', 'detail-note', `You have: ${countOf(item.id)}`))
    scrollContainer.append(...parts)
    const use = UI.btn('Use / Activate', 'ui-btn primary detail-use', () =>
      onBagUse(item.id)
    )
    box.append(scrollContainer, use)
  }
  async function onBagUse (itemId) {
    closeOverlay()
    if (typeof ItemSystem !== 'undefined' && ItemSystem.useItem) {
      try {
        const r = await ItemSystem.useItem(itemId, {
          gameState,
          player: Player.state,
          currentLocationId: gameState.currentLocationId
        })
        if (r && (r.message || r.text)) {
          const msg = r.message || r.text
          say([msg], r.success || r.ok ? r.kind || 'reward' : 'locked')
          UI.toast(msg, r.success || r.ok ? 'good' : 'bad')
        }
        renderExplore()
        save()
        return
      } catch (err) {}
    }
    let r
    try {
      r = applyItem(itemId)
      if (r.ok) {
        say([r.text], r.kind)
        renderExplore()
        save()
      } else say([r.text], 'locked')
    } catch (err) {
      console.error('Item use failed:', err)
      UI.toast('That item could not be used.', 'bad')
      return
    }
    UI.toast(
      r.ok ? r.note || `You activated the ${getItem(itemId).name}.` : r.text,
      r.ok ? 'good' : 'bad'
    )
  }
  function renderLocation (locationId) {
    if (!getLocation(locationId)) return false
    gameState.currentLocationId = locationId
    showScreen('explore')
    renderExplore()
    return true
  }
  function travelTo (locationId) {
    if (inCombat) return false
    const here = loc()
    if (!here || !here.nextLocationIds.includes(locationId)) {
      UI.toast("You can't travel there from here.", 'bad')
      return false
    }
    const gate = canEnterLocation(locationId, gameState)
    if (!gate.allowed) {
      say(gate.text, 'locked')
      UI.toast(gate.text.join(' '), 'bad')
      return false
    }
    arrive(locationId, gate.text)
    return true
  }
  function search () {
    if (inCombat) return false
    const l = loc()
    if (!l.search.length) {
      say(['There is nothing to search here.'], 'system')
      return false
    }
    if (rules.searchRequiresVictory && l.enemyId && !isDefeated(l.id)) {
      say(
        [
          `You can't search safely while the ${l.enemyName} is still here. Deal with it first.`
        ],
        'locked'
      )
      UI.toast('Defeat the enemy first.', 'bad')
      return false
    }
    if (l.id === 'W1P5' && !gameState.illuminatedLocations.includes('W1P5')) {
      say(
        [
          'The cave interior is pitch black. You stumble blindly over loose rocks and cannot search safely. Illuminate the cave with your Rusty Lantern first!'
        ],
        'locked'
      )
      UI.toast('Use the Rusty Lantern to illuminate the cave first.', 'bad')
      return false
    }
    if (l.id === 'W2P6' && !gameState.puzzlesSolved['altar_ritual']) {
      say(
        [
          'The crystal altar remains dark and dormant. You must perform the Crystal Altar attunement ritual described in the Ancient Tablet to solidify the Crystal Seal!'
        ],
        'locked'
      )
      UI.toast('Perform the Altar Ritual first.', 'bad')
      return false
    }
    if (gameState.searched.includes(l.id)) {
      say(
        ['You have already searched here. There is nothing new to find.'],
        'system'
      )
      return false
    }
    gameState.searched.push(l.id)
    say(l.search, 'search')
    const before = [...gameState.inventory]
    onSearch(l.id, gameState)
    const found = gameState.inventory.filter(i => !before.includes(i))
    found.forEach(i => {
      say([`You found: ${itemName(i)}.`], 'reward')
      UI.toast(`Found: ${itemName(i)}`, 'good')
    })
    renderExplore()
    save()
    return true
  }
  function talk () {
    if (inCombat) return false
    const l = loc()
    if (!l.npcName) {
      say(['There is no one here to talk to.'], 'system')
      return false
    }
    say(l.dialogue, 'dialogue', l.npcName)
    renderExplore()
    return true
  }
  function fight () {
    if (inCombat) return false
    const l = loc()
    if (!l.enemyId || isDefeated(l.id)) {
      say(['There is nothing to fight here.'], 'system')
      return false
    }
    inCombat = true
    showScreen('combat')
    const r = Combat.start(l.id, { container: els.combat, onEnd: onCombatEnd })
    if (!r.ok) {
      inCombat = false
      showScreen('explore')
      say([r.reason], 'locked')
      return false
    }
    return true
  }
  function onCombatEnd (res) {
    inCombat = false
    showScreen('explore')
    const l = getLocation(res.locationId)
    if (res.result === 'victory') {
      const r = res.rewards || {}
      if (r.items && r.items.length) animateBag()
      say([`You defeated the ${l.enemyName}.`, ...l.enemyReward], 'reward')
      ;(r.companionsGained || []).forEach(c => {
        say(c.recruitmentText, 'reward')
        UI.toast(`${c.name} joined you!`, 'good')
      })
      ;(r.items || []).forEach(n => UI.toast(`Found: ${n}`, 'good'))
      ;(r.companionsLost || []).forEach(n =>
        say([`${n} leaves your side.`], 'narration')
      )
      if (r.levelsGained)
        UI.toast(`Level up! You are now level ${r.level}.`, 'good')
      renderExplore()
      save()
      if (r.worldCompleted && r.worldCompleted.length) worldComplete(l)
    } else if (res.result === 'defeat') {
      say(
        [
          'You come to, battered but alive. The enemy remains. No rewards were earned.'
        ],
        'locked'
      )
      renderExplore()
      save()
    } else renderExplore()
  }
  async function worldComplete (l) {
    const w = getWorld(l.worldId),
      nxt = nextWorldOf(l.worldId),
      buttons = [{ label: 'Stay here', value: 'stay' }]
    if (nxt)
      buttons.push({
        label: `Journey to ${nxt.w.name}`,
        value: 'journey',
        kind: 'primary'
      })
    else
      buttons.push({
        label: 'Complete your adventure',
        value: 'end',
        kind: 'primary'
      })
    const choice = await UI.modal({
      title: `${w.name} Completed!`,
      body: [
        ...l.enemyReward.filter(t => !/Completed/.test(t)),
        nxt
          ? `A new world unlocks: ${nxt.w.name}.`
          : 'Your journey through the three worlds is complete.'
      ],
      buttons,
      dismissValue: 'stay',
      cls: 'modal-world'
    })
    if (choice === 'journey') journey(nxt.id)
    else if (choice === 'end') showEnding()
  }
  function journey (worldId) {
    const w = getWorld(worldId)
    if (!w || inCombat) return false
    if (!isWorldUnlocked(worldId, gameState)) {
      say(['That world is still locked.'], 'locked')
      return false
    }
    const gate = canEnterLocation(w.startingLocationId, gameState)
    if (!gate.allowed) {
      say(gate.text, 'locked')
      return false
    }
    say([`You set out for ${w.name}...`], 'system')
    arrive(w.startingLocationId, gate.text)
    return true
  }
  async function useItem (itemId) {
    if (typeof ItemSystem !== 'undefined' && ItemSystem.useItem) {
      try {
        const r = await ItemSystem.useItem(itemId, {
          gameState,
          player: Player.state,
          currentLocationId: gameState.currentLocationId
        })
        if (r && (r.message || r.text)) {
          const msg = r.message || r.text
          say([msg], r.success || r.ok ? r.kind || 'reward' : 'locked')
          UI.toast(msg, r.success || r.ok ? 'good' : 'bad')
        }
        renderExplore()
        save()
        return !!(r && (r.success || r.ok))
      } catch (err) {}
    }
    const r = applyItem(itemId)
    if (r.ok) {
      say([r.text], r.kind)
      renderExplore()
      save()
    } else UI.toast(r.text, 'bad')
    return r.ok
  }
  function showEnding () {
    const s = UI.clear(els.screens.end),
      S = Player.state,
      box = h('div', 'end-box')
    box.append(
      h('h2', 'title-big', 'Your Journey Is Complete'),
      h(
        'p',
        'title-sub',
        'The three crystals are restored, and the whispers fall silent forever.'
      )
    )
    const ul = h('end-stats')
    ;[
      `Hero: ${Player.info().name} (Level ${S.level})`,
      `Score: ${gameState.score}`,
      `Worlds completed: ${gameState.completedWorlds.length}/${
        Object.keys(worlds).length
      }`,
      `Places explored: ${gameState.visited.length}/${
        Object.keys(locations).length
      }`,
      `Enemies defeated: ${gameState.defeatedLocations.length}`,
      `Companions: ${
        gameState.companions.map(id => getCompanion(id).name).join(', ') ||
        'none'
      }`
    ].forEach(t => ul.append(h('li', '', t)))
    box.append(
      ul,
      UI.btn('Play again', 'ui-btn primary', () => {
        store.del(config.saveKey)
        resetState()
        renderClassSelect()
        showScreen('class')
      })
    )
    s.append(box)
    showScreen('end')
  }
  async function restart ({ skipConfirm = false } = {}) {
    if (
      !skipConfirm &&
      Player.state.classId &&
      !(await UI.confirm('Your current progress will be lost.', {
        yes: 'Start over',
        title: 'Start a new game?'
      }))
    )
      return false
    store.del(config.saveKey)
    resetState()
    renderClassSelect()
    showScreen('class')
    return true
  }
  return {
    mount,
    startNew,
    renderLocation,
    config,
    openOverlay,
    closeOverlay,
    get openOverlayName () {
      return openOverlayName
    },
    travelTo,
    search,
    talk,
    fight,
    useItem,
    journey,
    save,
    load,
    hasSave,
    restart,
    reset: resetState,
    showEnding,
    rules,
    get inCombat () {
      return inCombat
    },
    get mounted () {
      return mountedOnce
    },
    get els () {
      return els
    }
  }
})()
