const UI = (() => {
  const el = (tag, cls = '', text = '') => {
    const e = document.createElement(tag)
    if (cls) e.className = cls
    if (text !== '') e.textContent = text
    return e
  }
  const clear = node => {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild)
    }
    return node
  }
  const btn = (label, cls = 'ui-btn', onClick) => {
    const b = el('button', cls, label)
    b.type = 'button'
    if (onClick) {
      b.addEventListener('click', onClick)
    }
    return b
  }
  function loadImage (src) {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = src
    })
  }
  function art (src, label, cls = '') {
    const wrap = el('div', `art ${cls}`)
    const img = new Image()
    img.alt = label
    img.className = 'art-img'
    img.draggable = false
    img.onerror = () => {
      img.remove()
      wrap.classList.add('art-missing')
    }
    img.src = src
    wrap.append(img)
    return wrap
  }
  function root (id, cls, attrs = {}) {
    let r = document.getElementById(id)
    if (!r) {
      r = el('div', cls)
      r.id = id
      Object.entries(attrs).forEach(([key, value]) => {
        r.setAttribute(key, value)
      })
      document.body.append(r)
    }
    return r
  }

  function announce (text) {
    const r = root('ui-live', 'sr-only', {
      'aria-live': 'polite',
      role: 'status'
    })
    r.textContent = ''
    setTimeout(() => {
      r.textContent = text
    }, 20)
  }
  function toast (text, kind = 'info', ms = 3200) {
    const box = root('ui-toasts', 'toasts center-toast-area')
    const t = el('div', `toast toast-${kind} prominent-toast`, text)
    box.append(t)
    announce(text)
    const timer = setTimeout(() => t.remove(), ms)
    t.addEventListener('click', () => {
      clearTimeout(timer)
      t.remove()
    })
    return t
  }
  function healthBar (label, cur, max, kind = 'player') {
    const rootEl = el('div', `hud hud-${kind}`)
    const name = el('div', 'hud-name', label)
    const bar = el('div', 'bar')
    const fill = el('div', 'bar-fill')
    const txt = el('div', 'hud-text')
    const chips = el('div', 'chips')
    const extra = el('div', 'hud-extra')
    bar.setAttribute('role', 'progressbar')
    bar.setAttribute('aria-label', `${label} health`)
    bar.setAttribute('aria-valuemin', '0')
    bar.append(fill)
    rootEl.append(name, bar, txt, chips, extra)
    function update (c, m) {
      const pct = Math.max(0, Math.min(100, (c / m) * 100))
      fill.style.width = pct + '%'
      fill.classList.toggle('low', pct <= 30)
      txt.textContent = `❤ HP ${c}/${m}`
      bar.setAttribute('aria-valuenow', String(c))
      bar.setAttribute('aria-valuemax', String(m))
    }
    update(cur, max)
    return {
      root: rootEl,
      name,
      fill,
      txt,
      chips,
      extra,
      update
    }
  }

  function setChips (container, list) {
    clear(container)
    list.forEach(c => {
      container.append(el('span', `chip chip-${c.kind || 'plain'}`, c.text))
    })
  }

  function logger (container, max = 5) {
    const lines = []
    container.setAttribute('aria-live', 'polite')
    const draw = () => {
      clear(container)
      lines.slice(-max).forEach(line => {
        container.append(el('p', `log-line ${line.cls}`, line.text))
      })
    }
    return {
      add (text, cls = '') {
        lines.push({ text, cls })
        if (lines.length > 80) {
          lines.shift()
        }
        draw()
      },
      clear () {
        lines.length = 0
        draw()
      },
      get lines () {
        return lines
      }
    }
  }

  let activeTypewriters = new Set()

  function cancelAllTypewriters () {
    activeTypewriters.forEach(cancel => cancel())
    activeTypewriters.clear()
  }

  function dialogueEntry ({ speaker = '', lines = [], kind = 'narration' }) {
    const box = el('div', `dialogue dialogue-${kind}`)
    if (speaker) {
      box.append(el('div', 'dialogue-speaker', speaker))
    }
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    lines.forEach(line => {
      const p = el('p', 'dialogue-line')
      box.append(p)
      if (reducedMotion || kind === 'system') {
        p.textContent = line
      } else {
        let i = 0
        let cancelled = false
        const cancel = () => {
          cancelled = true
          p.textContent = line
          activeTypewriters.delete(cancel)
        }
        activeTypewriters.add(cancel)
        const typeChar = () => {
          if (cancelled) return
          if (i < line.length) {
            p.textContent += line.charAt(i)
            i++
            cancel._timer = setTimeout(typeChar, 18)
          } else {
            activeTypewriters.delete(cancel)
          }
        }
        box.addEventListener(
          'click',
          () => {
            if (cancel._timer) {
              clearTimeout(cancel._timer)
            }
            cancel()
          },
          { once: true }
        )
        typeChar()
      }
    })

    return box
  }

  function appendDialogue (container, entry, max = 14) {
    container.append(dialogueEntry(entry))

    while (container.children.length > max) {
      container.firstChild.remove()
    }

    container.scrollTop = container.scrollHeight

    announce([entry.speaker, ...(entry.lines || [])].filter(Boolean).join('. '))
  }

  function renderCompanions (container, comps) {
    clear(container)

    if (!comps.length) {
      container.append(el('span', 'empty', 'No companions yet'))

      return
    }

    comps.forEach(companion => {
      const chip = el('span', 'comp-chip', '🐾 ' + companion.name)

      chip.title = companion.ability.join(' ')
      container.append(chip)
    })
  }

  function modal ({
    title = '',
    body = [],
    buttons = [{ label: 'OK', value: true }],
    dismissValue = null,
    cls = ''
  }) {
    return new Promise(resolve => {
      const prev = document.activeElement
      const back = el('div', 'modal-back')
      const box = el('div', `modal ${cls}`)

      box.setAttribute('role', 'dialog')
      box.setAttribute('aria-modal', 'true')

      if (title) {
        box.setAttribute('aria-label', title)
        box.append(el('h2', 'modal-title', title))
      }

      ;(Array.isArray(body) ? body : [body]).forEach(item => {
        box.append(
          typeof item === 'string' ? el('p', 'modal-text', item) : item
        )
      })

      const row = el('div', 'modal-buttons')
      let done = false

      const close = value => {
        if (done) return

        done = true

        document.removeEventListener('keydown', onKey, true)
        back.remove()

        if (prev && prev.focus) {
          prev.focus()
        }

        resolve(value)
      }

      const onKey = event => {
        if (event.key === 'Escape' && dismissValue !== undefined) {
          event.stopPropagation()
          close(dismissValue)
        }
      }

      buttons.forEach(button => {
        row.append(
          btn(button.label, `ui-btn ${button.kind || ''}`, () =>
            close(button.value)
          )
        )
      })

      box.append(row)
      back.append(box)
      document.body.append(back)

      document.addEventListener('keydown', onKey, true)

      const first = row.querySelector('button')

      if (first) {
        first.focus()
      }
    })
  }

  const confirm = (
    message,
    { yes = 'Yes', no = 'Cancel', title = 'Are you sure?' } = {}
  ) =>
    modal({
      title,
      body: message,
      buttons: [
        { label: no, value: false },
        { label: yes, value: true, kind: 'danger' }
      ],
      dismissValue: false
    })

  return {
    el,
    clear,
    btn,
    art,
    loadImage,
    announce,
    toast,
    healthBar,
    setChips,
    logger,
    dialogueEntry,
    appendDialogue,
    cancelAllTypewriters,
    renderCompanions,
    modal,
    confirm
  }
})()
