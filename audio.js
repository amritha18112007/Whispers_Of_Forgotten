const GameAudio = (() => {
  const SETTINGS_KEY = 'whispersAudioSettings'

  const BATTLE_MUSIC_SRC = 'audio/music/battle-theme.mp3'
  const EXPLORATION_MUSIC_SRC = 'audio/music/exploration-theme.mp3'

  const SFX = {
    'sword-swing': { src: 'audio/sfx/sword-swing.mp3', vol: 1, maxMs: 1100 },
    'sword-hit': { src: 'audio/sfx/sword-hit.mp3', vol: 0.8 },
    'heavy-hit': { src: 'audio/sfx/heavy-hit.mp3', vol: 0.95 },
    'enemy-hurt': { src: 'audio/sfx/enemy-hurt.mp3', vol: 0.75 },
    'shield-raise': { src: 'audio/sfx/shield-raise.mp3', vol: 0.85 },
    'shield-block': { src: 'audio/sfx/shield-block.mp3', vol: 0.95 },
    'magic-guard': { src: 'audio/sfx/magic-guard.mp3', vol: 0.8, maxMs: 2600 },
    victory: { src: 'audio/sfx/victory.mp3', vol: 1, cue: true },
    defeat: { src: 'audio/sfx/defeat.mp3', vol: 1, cue: true }
  }

  const defaults = {
    musicOn: true,
    musicVol: 0.3,
    sfxVol: 0.8
  }

  const MAX_SAME_SOUND = 2
  const warned = new Set()
  const controlButtons = new Set()
  const activeSfx = new Set()
  const timers = new Set()

  const clamp = value =>
    Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))

  function warnOnce (key, message) {
    if (warned.has(key)) return
    warned.add(key)
    console.warn('[audio]', message)
  }

  let settings = { ...defaults }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY)

    if (saved) {
      const data = JSON.parse(saved)

      settings = {
        musicOn:
          typeof data.musicOn === 'boolean' ? data.musicOn : defaults.musicOn,
        musicVol: clamp(data.musicVol ?? defaults.musicVol),
        sfxVol: clamp(data.sfxVol ?? defaults.sfxVol)
      }
    }
  } catch (error) {
    console.warn('Could not load audio settings.')
  }

  function saveSettings () {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('Could not save audio settings.')
    }
  }

  function fadeEl (audio, target, duration, done) {
    if (!audio) return

    clearInterval(audio._fade)
    audio._fade = null
    target = clamp(target)

    if (duration <= 0) {
      audio.volume = target
      if (done) done()
      return
    }

    const startVolume = audio.volume
    const startTime = performance.now()

    audio._fade = setInterval(() => {
      const progress = Math.min(1, (performance.now() - startTime) / duration)

      audio.volume = clamp(startVolume + (target - startVolume) * progress)

      if (progress >= 1) {
        clearInterval(audio._fade)
        audio._fade = null
        if (done) done()
      }
    }, 30)
  }

  let battleMusicEl = null
  let explorationMusicEl = null
  let battleMusicFailed = false
  let explorationMusicFailed = false
  let inBattle = false
  let unlockArmed = false

  function isEffectiveMuted () {
    const musicMuted = !settings.musicOn || settings.musicVol === 0
    const sfxMuted = settings.sfxVol === 0
    const muted =!settings.musicOn

    return musicMuted && sfxMuted || muted
  }

  function syncControlButtons () {
    const muted = isEffectiveMuted()

    controlButtons.forEach(button => {
      button.textContent = muted ? '🔇 Sound' : '🔊 Sound'
      button.setAttribute(
        'aria-label',
        muted ? 'Sound settings (muted)' : 'Sound settings'
      )
    })
  }

  function createAudioTrack (src, onFail, id) {
    const audio = document.createElement('audio')

    audio.id = id
    audio.className = 'whispers-audio-tag sr-only'
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    audio.src = src

    audio.addEventListener('error', onFail, { once: true })

    if (document.body) {
      document.body.appendChild(audio)
    } else {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          if (!audio.parentNode && document.body) {
            document.body.appendChild(audio)
          }
        },
        { once: true }
      )
    }

    return audio
  }

  function ensureBattleMusic () {
    if (battleMusicFailed) return null

    if (!battleMusicEl) {
      battleMusicEl = createAudioTrack(
        BATTLE_MUSIC_SRC,
        () => {
          battleMusicFailed = true
          warnOnce('battle-music', 'Battle music could not be loaded.')
        },
        'audio-battle-music'
      )
    }

    return battleMusicEl
  }

  function ensureExplorationMusic () {
    if (explorationMusicFailed) return null

    if (!explorationMusicEl) {
      explorationMusicEl = createAudioTrack(
        EXPLORATION_MUSIC_SRC,
        () => {
          explorationMusicFailed = true
          warnOnce(
            'exploration-music',
            'Exploration music could not be loaded.'
          )
        },
        'audio-exploration-music'
      )
    }

    return explorationMusicEl
  }

  function armUnlock () {
    if (unlockArmed) return

    unlockArmed = true

    const retry = () => {
      document.removeEventListener('pointerdown', retry, true)
      document.removeEventListener('keydown', retry, true)

      unlockArmed = false
      applyMusicState(800)
    }

    document.addEventListener('pointerdown', retry, true)
    document.addEventListener('keydown', retry, true)
  }

  function applyMusicState (fadeMs = 600) {
    const activeTrack = inBattle
      ? ensureBattleMusic()
      : ensureExplorationMusic()

    const inactiveTrack = inBattle ? explorationMusicEl : battleMusicEl

    if (inactiveTrack && !inactiveTrack.paused) {
      fadeEl(inactiveTrack, 0, fadeMs, () => {
        inactiveTrack.pause()
        inactiveTrack.currentTime = 0
      })
    }

    const shouldPlay = settings.musicOn && settings.musicVol > 0

    if (!activeTrack) return

    if (shouldPlay) {
      if (activeTrack.paused) {
        activeTrack.volume = 0

        const playback = activeTrack.play()

        if (playback && typeof playback.then === 'function') {
          playback
            .then(() => {
              if (settings.musicOn && settings.musicVol > 0) {
                fadeEl(activeTrack, settings.musicVol, 1000)
              } else {
                activeTrack.pause()
              }
            })
            .catch(error => {
              if (error.name === 'NotAllowedError') {
                armUnlock()
              } else if (error.name !== 'AbortError') {
                warnOnce('music-play', 'Music playback failed.')
              }
            })
        } else {
          fadeEl(activeTrack, settings.musicVol, 1000)
        }
      } else {
        fadeEl(activeTrack, settings.musicVol, fadeMs)
      }
    } else if (!activeTrack.paused) {
      fadeEl(activeTrack, 0, fadeMs, () => {
        activeTrack.pause()
      })
    }
  }

  function startBattleMusic () {
    inBattle = true
    applyMusicState(600)
  }

  function stopBattleMusic (duration = 900) {
    inBattle = false
    applyMusicState(duration)
  }

  function startExplorationMusic () {
    inBattle = false
    applyMusicState(800)
  }

  function sfxBase (name) {
    const sound = SFX[name]

    if (!sound || sound.failed) return null

    if (!sound.el) {
      sound.el = new Audio(sound.src)
      sound.el.preload = 'auto'

      sound.el.addEventListener(
        'error',
        () => {
          sound.failed = true
          warnOnce(name, `Sound could not be loaded: ${sound.src}`)
        },
        { once: true }
      )
    }

    return sound.el
  }

  function later (callback, delay) {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)

    timers.add(timer)
  }

  function playSfx (name, options = {}) {
    if (options.delay > 0) {
      return later(() => playSfx(name, { ...options, delay: 0 }), options.delay)
    }

    if (settings.sfxVol <= 0) return

    const sound = SFX[name]
    const base = sfxBase(name)

    if (!sound || !base) return

    let playingCount = 0

    activeSfx.forEach(audio => {
      if (audio._name === name) playingCount++
    })

    if (playingCount >= MAX_SAME_SOUND) return

    const audio = base.cloneNode(true)

    audio._name = name
    audio._cue = !!sound.cue
    audio.volume = clamp(settings.sfxVol * sound.vol * (options.gain ?? 1))

    activeSfx.add(audio)

    const done = () => {
      activeSfx.delete(audio)
      clearInterval(audio._fade)
    }

    audio.addEventListener('ended', done)
    audio.addEventListener('error', done)

    try {
      const playback = audio.play()

      if (playback && typeof playback.catch === 'function') {
        playback.catch(done)
      }
    } catch (error) {
      done()
    }

    if (sound.maxMs) {
      later(() => {
        if (activeSfx.has(audio)) {
          fadeEl(audio, 0, 160, () => {
            audio.pause()
            done()
          })
        }
      }, sound.maxMs)
    }
  }

  function stopSfx (everything = false) {
    timers.forEach(clearTimeout)
    timers.clear()

    activeSfx.forEach(audio => {
      if (audio._cue && !everything) return

      fadeEl(audio, 0, 120, () => {
        audio.pause()
        activeSfx.delete(audio)
      })
    })
  }

  function preload () {
    Object.keys(SFX).forEach(sfxBase)
    ensureBattleMusic()
    ensureExplorationMusic()
  }

  function handleSound (name, data = {}) {
    switch (name) {
      case 'swing':
        playSfx('sword-swing')
        break

      case 'hit':
      case 'crit':
        if (data.target === 'enemy') {
          const heavy =
            name === 'crit' || data.fx === 'magic' || data.fx === 'frost'

          playSfx(heavy ? 'heavy-hit' : 'sword-hit')
          playSfx('enemy-hurt', { delay: 70 })
        } else if (data.target === 'player') {
          playSfx(data.heavy ? 'heavy-hit' : 'sword-hit', {
            gain: data.guarded ? 0.4 : 1
          })
        }
        break

      case 'block':
        if (data.kind === 'companion') {
          playSfx('magic-guard')
        } else if (data.kind === 'impact') {
          playSfx('shield-block')
        } else {
          playSfx('shield-raise')
        }
        break

      case 'victory':
      case 'defeat':
        stopBattleMusic(700)
        playSfx(name)
        break
    }
  }

  function handleBattle (kind, data) {
    if (kind === 'start') {
      preload()
      startBattleMusic()
    } else if (kind === 'end') {
      stopBattleMusic(700)
      stopSfx(!!(data && data.result === 'cancelled'))
      startExplorationMusic()
    }
  }

  function setMusicOn (on) {
    settings.musicOn = !!on
    saveSettings()
    applyMusicState(400)
    syncControlButtons()
  }

  function setMusicVolume (volume) {
    settings.musicVol = clamp(Number(volume))
    saveSettings()
    applyMusicState(120)
    syncControlButtons()
  }

  function setSfxVolume (volume) {
    settings.sfxVol = clamp(Number(volume))
    saveSettings()
    syncControlButtons()
  }

  function createControls () {
    const wrap = document.createElement('div')
    const button = document.createElement('button')
    const panel = document.createElement('div')

    wrap.className = 'audio-ctl'

    button.type = 'button'
    button.className = 'ui-btn small audio-btn'
    button.setAttribute('aria-expanded', 'false')
    button.setAttribute('aria-controls', 'audio-panel')

    controlButtons.add(button)
    syncControlButtons()

    panel.id = 'audio-panel'
    panel.className = 'audio-panel'
    panel.hidden = true
    panel.setAttribute('role', 'group')
    panel.setAttribute('aria-label', 'Sound settings')

    const musicToggle = document.createElement('button')

    musicToggle.type = 'button'
    musicToggle.className = 'ui-btn small audio-toggle'

    function renderToggle () {
      musicToggle.textContent = `Music: ${settings.musicOn ? 'On' : 'Off'}`
      musicToggle.setAttribute('aria-pressed', String(settings.musicOn))
    }

    renderToggle()

    musicToggle.addEventListener('click', () => {
      setMusicOn(!settings.musicOn)
      renderToggle()
    })

    function createSlider (label, value, onInput) {
      const row = document.createElement('label')
      const text = document.createElement('span')
      const input = document.createElement('input')

      row.className = 'audio-row'
      text.textContent = label

      input.type = 'range'
      input.min = '0'
      input.max = '100'
      input.step = '1'
      input.value = String(Math.round(value * 100))
      input.setAttribute('aria-label', label)

      input.addEventListener('input', () => {
        onInput(Number(input.value) / 100)
      })

      row.append(text, input)
      return row
    }

    panel.append(
      musicToggle,
      createSlider('Music volume', settings.musicVol, setMusicVolume),
      createSlider('Effects volume', settings.sfxVol, setSfxVolume)
    )

    const sliders = panel.querySelectorAll('input[type="range"]')
    const musicSlider = sliders[0]
    const sfxSlider = sliders[1]

    function closePanel () {
      panel.hidden = true
      button.setAttribute('aria-expanded', 'false')
    }

    button.addEventListener('click', () => {
      panel.hidden = !panel.hidden
      button.setAttribute('aria-expanded', String(!panel.hidden))

      if (!panel.hidden) {
        renderToggle()
        musicSlider.value = String(Math.round(settings.musicVol * 100))
        sfxSlider.value = String(Math.round(settings.sfxVol * 100))
        syncControlButtons()
      }
    })

    document.addEventListener('pointerdown', event => {
      if (!panel.hidden && !wrap.contains(event.target)) {
        closePanel()
      }
    })

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) {
        closePanel()
        button.focus()
      }
    })

    wrap.append(button, panel)
    return wrap
  }

  if (typeof combatConfig !== 'undefined') {
    combatConfig.onSound = handleSound
    combatConfig.onBattle = handleBattle
  }

  return {
    createControls,
    startMusic: startBattleMusic,
    stopMusic: stopBattleMusic,
    startExplorationMusic,
    stopSfx,
    playSfx,
    setMusicOn,
    setMusicVolume,
    setSfxVolume,
    syncControlButtons,
    isEffectiveMuted,

    get settings () {
      return { ...settings }
    },

    get musicPlaying () {
      return !!(
        (battleMusicEl && !battleMusicEl.paused) ||
        (explorationMusicEl && !explorationMusicEl.paused)
      )
    }
  }
})()
