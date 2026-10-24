const MiniGames = (() => {
  const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ']
  const config = { speed: 1, rng: Math.random }
  let current = null
  const rnd = () => config.rng()
  const ri = n => Math.floor(rnd() * n)
  const shuffle = a => {
    const r = [...a]
    for (let i = r.length - 1; i > 0; i--) {
      const j = ri(i + 1)
      ;[r[i], r[j]] = [r[j], r[i]]
    }
    return r
  }
  const clamp01 = x => Math.max(0, Math.min(1, x))
  const GAMES = {
    reaction: {
      title: 'Reaction Challenge',
      instructions:
        'Wait for the box to turn GREEN, then click it or press Space. Too early and you fumble!',
      start (ctx) {
        const windowMs = ctx.hard ? 550 : 800,
          pad = UI.el('button', 'mg-pad mg-pad-wait', 'Wait...')
        pad.type = 'button'
        ctx.body.append(pad)
        let state = 'wait',
          goAt = 0
        const press = () => {
          if (state === 'wait') {
            state = 'done'
            ctx.say('Too early!', 'bad')
            ctx.finish(false, {})
          } else if (state === 'go') {
            const rt = performance.now() - goAt
            state = 'done'
            const ok = rt <= windowMs
            ctx.say(
              ok ? `${Math.round(rt)} ms!` : 'Too slow!',
              ok ? 'good' : 'bad'
            )
            ctx.finish(ok, {
              score: ok ? 1 - rt / windowMs : 0,
              perfect: ok && rt < 250
            })
          }
        }
        ctx.listen(pad, 'click', press)
        ctx.listen(document, 'keydown', e => {
          if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault()
            press()
          }
        })
        ctx.after(() => {
          state = 'go'
          goAt = performance.now()
          pad.className = 'mg-pad mg-pad-go'
          pad.textContent = 'NOW!'
          ctx.afterReal(() => {
            if (state === 'go') {
              state = 'done'
              ctx.say('Too slow!', 'bad')
              ctx.finish(false, { timedOut: true })
            }
          }, windowMs)
        }, 900 + rnd() * 1600)
        ctx.startTimer(12)
        pad.focus()
        return { state: () => state, press }
      }
    },
    memory: {
      title: 'Memory Sequence',
      instructions:
        'Memorise the glowing runes, then repeat them in the same order (click or keys 1-4).',
      start (ctx) {
        const len = ctx.hard ? 5 : 4,
          seq = Array.from({ length: len }, () => ri(4)),
          row = UI.el('div', 'mg-runes')
        let step = 0,
          listening = false
        const btns = RUNES.slice(0, 4).map((r, i) => {
          const b = UI.el('button', 'mg-rune', r)
          b.type = 'button'
          b.disabled = true
          b.setAttribute('aria-label', `Rune ${i + 1}`)
          ctx.listen(b, 'click', () => {
            if (!listening) return
            b.classList.add('lit')
            ctx.after(() => b.classList.remove('lit'), 180)
            if (i !== seq[step]) {
              listening = false
              b.classList.add('mg-wrong')
              ctx.say('Wrong rune!', 'bad')
              return ctx.settle(false, btns, {})
            }
            step++
            ctx.say(`${step}/${len}`)
            if (step === len) {
              listening = false
              ctx.say('Perfect memory!', 'good')
              ctx.settle(true, btns, { score: 1, perfect: true })
            }
          })
          row.append(b)
          return b
        })
        ctx.body.append(row)
        ctx.say('Watch carefully...')
        ctx.listen(document, 'keydown', e => {
          const n = Number(e.key)
          if (listening && n >= 1 && n <= 4) btns[n - 1].click()
        })
        let t = 500
        seq.forEach(idx => {
          ctx.after(() => btns[idx].classList.add('lit'), t)
          ctx.after(() => btns[idx].classList.remove('lit'), t + 450)
          t += 650
        })
        ctx.after(() => {
          btns.forEach(b => (b.disabled = false))
          listening = true
          ctx.say(`Your turn: 0/${len}`)
          ctx.startTimer(ctx.hard ? 10 : 12)
          btns[0].focus()
        }, t)
        return { sequence: seq, buttons: btns, listening: () => listening }
      }
    },
    rune: {
      title: 'Rune Puzzle',
      instructions:
        'Flip two tiles at a time and match every rune pair before you run out of flips.',
      start (ctx) {
        const pairs = ctx.hard ? 4 : 3,
          limit = pairs * 2 + (ctx.hard ? 2 : 3),
          faces = shuffle(RUNES).slice(0, pairs)
        const symbols = shuffle([...faces, ...faces]),
          grid = UI.el('div', 'mg-grid')
        let first = null,
          flips = 0,
          matched = 0,
          lock = false
        const tiles = symbols.map((sym, i) => {
          const b = UI.el('button', 'mg-tile', '?')
          b.type = 'button'
          b.setAttribute('aria-label', `Tile ${i + 1}`)
          ctx.listen(b, 'click', () => {
            if (lock || b.dataset.up === '1') return
            b.dataset.up = '1'
            b.textContent = sym
            b.classList.add('up')
            if (first === null) {
              first = i
              return
            }
            const a = first
            first = null
            flips++
            if (symbols[a] === sym) {
              matched++
              tiles[a].classList.add('mg-right')
              b.classList.add('mg-right')
              tiles[a].disabled = true
              b.disabled = true
              ctx.say(`Matched ${matched}/${pairs}`, 'good')
              if (matched === pairs)
                ctx.settle(true, tiles, {
                  score: clamp01(1 - (flips - pairs) / limit),
                  perfect: flips === pairs
                })
              else if (flips >= limit) ctx.settle(false, tiles, {})
            } else {
              lock = true
              ctx.say(`No match. Flips left: ${limit - flips}`, 'bad')
              ctx.after(() => {
                ;[tiles[a], b].forEach(t => {
                  t.dataset.up = '0'
                  t.textContent = '?'
                  t.classList.remove('up')
                })
                lock = false
                if (flips >= limit) ctx.settle(false, tiles, {})
              }, 650)
            }
          })
          grid.append(b)
          return b
        })
        ctx.body.append(grid)
        ctx.say(`Flips: ${limit}`)
        ctx.startTimer(ctx.hard ? 30 : 35)
        tiles[0].focus()
        return { symbols, tiles, click: i => tiles[i].click(), limit }
      }
    },
    precision: {
      title: 'Precision Challenge',
      instructions:
        'Click, press Space to freeze the marker inside the golden zone.',
      start (ctx) {
        const width = ctx.hard ? 0.14 : 0.24,
          center = 0.25 + rnd() * 0.5,
          period = ctx.hard ? 1100 : 1600,
          t0 = performance.now()
        const bar = UI.el('div', 'mg-bar'),
          zone = UI.el('div', 'mg-zone'),
          marker = UI.el('div', 'mg-marker'),
          stop = UI.btn('Stop!', 'ui-btn mg-stop')
        let done = false
        zone.style.left = (center - width / 2) * 100 + '%'
        zone.style.width = width * 100 + '%'
        bar.append(zone, marker)
        ctx.body.append(bar, stop)
        const pos = () => {
          const t = ((performance.now() - t0) % period) / period
          return t < 0.5 ? t * 2 : 2 - t * 2
        }
        const draw = () => {
          marker.style.left = pos() * 100 + '%'
        }
        const halt = () => {
          if (done) return
          done = true
          const p = pos(),
            dist = Math.abs(p - center),
            ok = dist <= width / 2
          marker.style.left = p * 100 + '%'
          ctx.say(
            ok
              ? dist <= width * 0.15
                ? 'Dead centre!'
                : 'Inside the zone!'
              : 'Missed!',
            ok ? 'good' : 'bad'
          )
          ctx.finish(ok, {
            score: ok ? 1 - dist / (width / 2) : 0,
            perfect: ok && dist <= width * 0.15
          })
        }
        ctx.frame(draw)
        ctx.listen(stop, 'click', halt)
        ctx.listen(bar, 'click', halt)
        ctx.listen(document, 'keydown', e => {
          if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault()
            halt()
          }
        })
        ctx.startTimer(10)
        stop.focus()
        return { position: pos, zone: { center, width }, stop: halt }
      }
    },
    code: {
      title: 'Code/Pattern Challenge',
      instructions:
        'Find the rule and choose the number that comes next (click or keys 1-3).',
      start (ctx) {
        const kind = ['arith', 'geo', 'square', 'fib', 'zigzag'][
            ri(ctx.hard ? 5 : 3)
          ],
          a = 2 + ri(7),
          d = 2 + ri(5)
        let seq, ans
        if (kind === 'arith') {
          seq = [a, a + d, a + 2 * d, a + 3 * d]
          ans = a + 4 * d
        } else if (kind === 'geo') {
          const r = ctx.hard ? 3 : 2,
            s = 1 + ri(3)
          seq = [s, s * r, s * r ** 2, s * r ** 3]
          ans = s * r ** 4
        } else if (kind === 'square') {
          const n = 1 + ri(4)
          seq = [n * n, (n + 1) ** 2, (n + 2) ** 2, (n + 3) ** 2]
          ans = (n + 4) ** 2
        } else if (kind === 'fib') {
          const b = 1 + ri(4)
          seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b]
          ans = 3 * a + 5 * b
        } else {
          const e = 1 + ri(3)
          seq = [a, a + d, a + d - e, a + 2 * d - e, a + 2 * d - 2 * e]
          ans = a + 3 * d - 2 * e
        }
        const wrong = shuffle(
            [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6]
              .map(x => ans + x)
              .filter(x => x > 0)
          ).slice(0, 2),
          options = shuffle([ans, ...wrong])
        ctx.body.append(UI.el('p', 'mg-seq', `${seq.join('  ')}  ?`))
        const wrap = UI.el('div', 'mg-options')
        const btns = options.map((o, i) => {
          const b = UI.el('button', 'ui-btn mg-option', `${i + 1}. ${o}`)
          b.type = 'button'
          ctx.listen(b, 'click', () => {
            const ok = o === ans
            b.classList.add(ok ? 'mg-right' : 'mg-wrong')
            ctx.say(
              ok ? 'Correct!' : `Wrong - it was ${ans}.`,
              ok ? 'good' : 'bad'
            )
            ctx.settle(ok, btns, { score: ok ? 1 : 0, perfect: false })
          })
          wrap.append(b)
          return b
        })
        ctx.body.append(wrap)
        ctx.listen(document, 'keydown', e => {
          const n = Number(e.key)
          if (n >= 1 && n <= 3 && !btns[0].disabled) btns[n - 1].click()
        })
        ctx.startTimer(ctx.hard ? 12 : 15)
        btns[0].focus()
        return { answer: ans, options, sequence: seq, buttons: btns }
      }
    },
    timing: {
      title: 'Timing Challenge',
      instructions:
        'Press the arrow keys (or buttons) in the order shown before time runs out. A mistake restarts the sequence!',
      start (ctx) {
        const KEYS = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'],
          ARROWS = ['←', '↑', '→', '↓'],
          len = ctx.hard ? 7 : 5,
          total = ctx.hard ? 5.5 : 6.5,
          seq = Array.from({ length: len }, () => ri(4))
        const row = UI.el('div', 'mg-arrows'),
          cells = seq.map(i => {
            const c = UI.el('span', 'mg-arrow', ARROWS[i])
            row.append(c)
            return c
          }),
          pad = UI.el('div', 'mg-dpad')
        let step = 0,
          done = false
        const press = i => {
          if (done) return
          if (i === seq[step]) {
            cells[step].classList.add('done')
            step++
            if (step === len) {
              done = true
              const left = clamp01(ctx.remaining())
              ctx.say('Flawless timing!', 'good')
              ctx.finish(true, { score: left, perfect: left > 0.5 })
            }
          } else {
            step = 0
            cells.forEach(c => c.classList.remove('done'))
            ctx.say('Fumble! Start again.', 'bad')
          }
        }
        ARROWS.forEach((a, i) => {
          const b = UI.btn(a, 'ui-btn mg-key')
          b.setAttribute('aria-label', ['Left', 'Up', 'Right', 'Down'][i])
          ctx.listen(b, 'click', () => press(i))
          pad.append(b)
        })
        ctx.listen(document, 'keydown', e => {
          const i = KEYS.indexOf(e.key)
          if (i >= 0) {
            e.preventDefault()
            press(i)
          }
        })
        const seqLabel = UI.el(
          'p',
          'mg-instructions-label',
          'SEQUENCE TO MATCH:'
        )
        const padLabel = UI.el(
          'p',
          'mg-instructions-label',
          'PRESS ARROW KEYS / BUTTONS:'
        )
        ctx.body.append(row, pad)
        ctx.startTimer(total)
        pad.firstChild.focus()
        return { sequence: seq, press, keys: KEYS }
      }
    }
  }

  const TYPES = Object.keys(GAMES)
  function start (
    type,
    { container = document.body, difficulty = 'easy', seconds = null } = {}
  ) {
    if (!GAMES[type]) type = TYPES[ri(TYPES.length)]

    if (current) {
      current.finish(false, { cancelled: true })
    }

    const game = GAMES[type]

    return new Promise(resolve => {
      let done = false
      let interval = null
      let timerEnd = 0
      let timerTotal = 1
      let box = null
      let gameCleanups = []

      function finish (ok, extra = {}) {
        if (done) return

        done = true
        clearInterval(interval)
        gameCleanups.forEach(cleanup => cleanup())
        gameCleanups.length = 0

        if (box) box.remove()

        if (current && current.type === type) {
          current = null
        }

        const success = !!ok && !extra.cancelled && !extra.timedOut

        resolve({
          type,
          success,
          score: clamp01(extra.score ?? (success ? 1 : 0)),
          perfect: !!extra.perfect && success,
          timedOut: !!extra.timedOut,
          cancelled: !!extra.cancelled
        })
      }
      const intro = UI.el('section', 'mg-box mg-instructions')
      intro.tabIndex = -1
      intro.setAttribute('role', 'dialog')
      intro.setAttribute('aria-modal', 'true')
      intro.setAttribute('aria-label', game.title + ' instructions')

      const introTitle = UI.el('h3', 'mg-title', game.title)
      const introLabel = UI.el('p', 'mg-instructions-label', 'HOW TO PLAY')
      const introText = UI.el('p', 'mg-prompt', game.instructions)

      const introHint = UI.el(
        'p',
        'mg-instructions-hint',
        "Read the instructions, then press Play when you're ready."
      )

      const introActions = UI.el('div', 'mg-intro-actions')
      const playButton = UI.btn('▶ Play', 'ui-btn primary mg-play')
      const cancelButton = UI.btn('Cancel', 'ui-btn mg-skip')

      introActions.append(playButton, cancelButton)
      intro.append(introTitle, introLabel, introText, introHint, introActions)

      container.append(intro)
      box = intro

      const onIntroKey = event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          finish(false, { cancelled: true })
        } else if (
          event.key === 'Enter' &&
          document.activeElement !== cancelButton
        ) {
          event.preventDefault()
          beginGame()
        }
      }

      document.addEventListener('keydown', onIntroKey)

      const removeIntroKey = () => {
        document.removeEventListener('keydown', onIntroKey)
      }

      cancelButton.addEventListener('click', () => {
        finish(false, { cancelled: true })
      })

      playButton.addEventListener('click', beginGame)

      current = {
        type,
        get box () {
          return box
        },
        finish,
        debug: null,
        game
      }

      intro.focus()
      playButton.focus()

      function beginGame () {
        if (done || box !== intro) return

        removeIntroKey()
        intro.remove()

        gameCleanups = []
        interval = null

        const gameBox = UI.el('section', 'mg-box mg-playing')
        const bar = UI.el('div', 'mg-timer')
        const fill = UI.el('div', 'mg-timer-fill')
        const body = UI.el('div', 'mg-body')
        const status = UI.el('p', 'mg-status')
        const cancel = UI.btn('Skip / Cancel [Esc]', 'ui-btn mg-skip')

        gameBox.tabIndex = -1
        gameBox.setAttribute('role', 'dialog')
        gameBox.setAttribute('aria-modal', 'true')
        gameBox.setAttribute('aria-label', game.title)

        bar.append(fill)
        gameBox.append(
          UI.el('h3', 'mg-title', game.title),
          bar,
          body,
          status,
          cancel
        )

        container.append(gameBox)
        box = gameBox

        const ctx = {
          hard: difficulty === 'hard',
          difficulty,
          body,

          say (text, cls = '') {
            status.textContent = text
            status.className = 'mg-status ' + cls
          },

          listen (target, eventName, handler) {
            target.addEventListener(eventName, handler)
            gameCleanups.push(() =>
              target.removeEventListener(eventName, handler)
            )
          },

          after (callback, ms) {
            const id = setTimeout(() => {
              if (!done) callback()
            }, ms * config.speed)

            gameCleanups.push(() => clearTimeout(id))
          },

          afterReal (callback, ms) {
            const id = setTimeout(() => {
              if (!done) callback()
            }, ms)

            gameCleanups.push(() => clearTimeout(id))
          },

          frame (callback) {
            let id

            const loop = () => {
              if (done) return
              callback()
              id = requestAnimationFrame(loop)
            }

            id = requestAnimationFrame(loop)
            gameCleanups.push(() => cancelAnimationFrame(id))
          },

          startTimer (secondsToUse) {
            const duration = seconds || secondsToUse

            timerTotal = duration * 1000
            timerEnd = Date.now() + timerTotal

            clearInterval(interval)

            interval = setInterval(() => {
              const remaining = timerEnd - Date.now()

              fill.style.width =
                Math.max(0, (remaining / timerTotal) * 100) + '%'

              if (remaining <= 0) {
                ctx.say('Out of time!', 'bad')
                finish(false, { timedOut: true })
              }
            }, 80)
          },

          remaining () {
            return (timerEnd - Date.now()) / timerTotal
          },

          settle (ok, buttons, extra = {}) {
            buttons.forEach(button => {
              button.disabled = true
            })

            clearInterval(interval)

            ctx.after(() => finish(ok, extra), 450)
          },

          finish
        }

        ctx.listen(document, 'keydown', event => {
          if (event.key === 'Escape') {
            event.preventDefault()
            finish(false, { cancelled: true })
          }
        })

        ctx.listen(document, 'keyup', event => {
          if (event.code === 'Space' || event.key === ' ') {
            event.preventDefault()
          }
        })

        ctx.listen(cancel, 'click', () => {
          finish(false, { cancelled: true })
        })

        try {
          current.debug = game.start(ctx)
          gameBox.focus()
        } catch (error) {
          console.error('[MiniGames] Could not start ' + type, error)
          finish(false, { cancelled: true })
        }
      }
    })
  }

  const cancel = () => {
    if (current) {
      current.finish(false, { cancelled: true })
    }

    return true
  }

  const randomType = (pool = TYPES) => pool[ri(pool.length)]

  return {
    start,
    run: start,
    cancel,
    randomType,
    TYPES,
    config,
    get current () {
      return current
    },
    GAMES
  }
})()
