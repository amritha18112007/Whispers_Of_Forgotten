;(function () {
  const ITEM_CONFIG = {
    'rusty-lantern': {
      name: 'Rusty Lantern',
      image: 'images/items/rusty-lantern.png',
      type: 'tool',
      discoveryAnim: 'fly',
      useAnim: 'effect',
      effectType: 'illumination',
      retained: true,
      validLocations: ['W1P2', 'W1P5'],
      onUse: function (ctx) {
        const loc = ctx.currentLocationId
        if (!this.validLocations.includes(loc)) {
          return {
            success: false,
            message:
              "The lantern's flame flickers, but it reveals nothing hidden here."
          }
        }
        const isIlluminated =
          ctx.gameState.illuminatedLocations &&
          ctx.gameState.illuminatedLocations.includes(loc)
        if (isIlluminated) {
          return {
            success: false,
            message: 'This area is already brightly illuminated.'
          }
        }
        return {
          success: true,
          message:
            'The warm flame drives back the ancient shadows, revealing hidden passageways!'
        }
      }
    },

    'waterlogged-diary-page': {
      name: 'Waterlogged Diary Page',
      image: 'images/items/waterlogged-diary-page.png',
      type: 'document',
      discoveryAnim: 'fly',
      useAnim: 'document',
      retained: true,
      document: {
        title: 'Waterlogged Diary Page',
        subtitle: 'Recovered from the sunken crypt waters',
        clueKey: 'waterlogged_diary',
        html: `
                    <p><em>Day 47 — The Temple Gate Sequence:</em></p>
                    <p>"The waters rose faster than we anticipated. The high priests sealed the inner sanctum before fleeing.
                    Remember the sequence of the coiled serpents: the one looking to the <strong>Dawn</strong> opens the valve, 
                    the serpent of the <strong>Eclipse</strong> turns the lock, and the serpent crowned in <strong>Fire</strong> seals the tomb."</p>
                    <p><em>"Trust not the carved eyes that stare into the void..."</em></p>
                `
      }
    },

    'carved-stone': {
      name: 'Carved Stone',
      image: 'images/items/carved-stone.png',
      type: 'document',
      discoveryAnim: 'fly',
      useAnim: 'document',
      retained: true,
      document: {
        title: 'Carved Serpent Stone',
        subtitle: 'An engraved key to the Temple Gate riddles',
        clueKey: 'carved_stone',
        html: `
                    <p>Three ancient glyphs are chiseled deep into the granite surface:</p>
                    <div class="doc-pictographs" aria-label="Pictographs: Serpent, Sun, Flame">
                        <span>🐍</span> <span>☀️</span> <span>🔥</span>
                    </div>
                    <p>An inscription below translates:</p>
                    <p><em>"When the stone pedestal drinks the serpent's breath, the seal of three turns shall yield to the bearer of the symbol."</em></p>
                `
      }
    },

    'ancient-symbol-stone': {
      name: 'Ancient Symbol Stone',
      image: 'images/items/ancient-symbol-stone.png',
      type: 'puzzle',
      discoveryAnim: 'fly',
      useAnim: 'insert',
      retained: true,
      condition: function (ctx) {
        const solved =
          ctx.gameState.puzzlesSolved &&
          (ctx.gameState.puzzlesSolved['shrine_riddle'] ||
            ctx.gameState.puzzlesSolved['shrine-riddle'] ||
            ctx.gameState.puzzlesSolved['shrine'])
        return !!solved
      },
      onUse: function (ctx) {
        if (!this.condition(ctx)) {
          return {
            success: false,
            message:
              'The pedestal socket remains sealed tight. You must solve the Shrine Riddle first.'
          }
        }
        return {
          success: true,
          puzzleSolvedKey: 'pedestal_symbol_inserted',
          message:
            'The symbol stone locks firmly into the pedestal! Heavy stone gears grind inside the walls.'
        }
      }
    },

    'healing-potion': {
      name: 'Healing Potion',
      image: 'images/items/healing-potion.png',
      type: 'consumable',
      discoveryAnim: 'fly',
      useAnim: 'effect',
      effectType: 'heal',
      retained: false,
      onUse: function (ctx) {
        if (ctx.player && ctx.player.hp >= ctx.player.maxHp) {
          return { success: false, message: 'Your health is already full.' }
        }
        return {
          success: true,
          healAmount: 35,
          message: 'A soothing warmth mends your wounds (+35 HP).'
        }
      }
    }
  }
  function isConfigured (itemId) {
    if (!itemId) return false
    const normalized = String(itemId).toLowerCase().trim().replace(/_/g, '-')
    return Object.prototype.hasOwnProperty.call(ITEM_CONFIG, normalized)
  }

  function getConfig (itemId) {
    if (!itemId) return null
    const normalized = String(itemId).toLowerCase().trim().replace(/_/g, '-')
    return (
      ITEM_CONFIG[normalized] || {
        name: itemId.replace(/[-_]/g, ' '),
        image: `images/items/${normalized}.png`,
        type: 'general',
        discoveryAnim: 'fly',
        useAnim: 'reveal',
        retained: true
      }
    )
  }

  const ItemAnim = {
    isReducedMotion () {
      return (
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
    },
    getBagRect () {
      const bagEl =
        document.querySelector('.rail-btn.bag') ||
        document.querySelector("[data-action='bag']") ||
        document.querySelector('#btn-bag') ||
        document.querySelector('.rail-btn')
      if (bagEl) {
        return bagEl.getBoundingClientRect()
      }
      return {
        left: window.innerWidth - 60,
        top: 80,
        width: 50,
        height: 50
      }
    },
    getSceneRect () {
      const sceneEl =
        document.querySelector('.scene') ||
        document.querySelector('.explore-main') ||
        document.querySelector('#app')
      if (sceneEl) {
        return sceneEl.getBoundingClientRect()
      }
      return {
        left: window.innerWidth / 2 - 100,
        top: window.innerHeight / 2 - 100,
        width: 200,
        height: 200
      }
    },
    fly (imageSrc, startRect, endRect, options = {}) {
      return new Promise(resolve => {
        if (this.isReducedMotion()) {
          resolve()
          return
        }

        const sX = startRect
          ? startRect.left + (startRect.width || 0) / 2
          : window.innerWidth / 2
        const sY = startRect
          ? startRect.top + (startRect.height || 0) / 2
          : window.innerHeight / 2
        const eX = endRect
          ? endRect.left + (endRect.width || 0) / 2
          : window.innerWidth - 50
        const eY = endRect ? endRect.top + (endRect.height || 0) / 2 : 60

        const proxy = document.createElement('div')
        proxy.className = 'item-fly-proxy'
        proxy.innerHTML = `<img src="${imageSrc}" alt="" onerror="this.style.display='none'">`
        document.body.appendChild(proxy)
        proxy.style.left = `${sX}px`
        proxy.style.top = `${sY}px`
        proxy.style.opacity = '0'
        proxy.style.transform =
          'translate(-50%, -50%) scale(0.3) rotate(-10deg)'

        const duration = options.duration || 800
        const startTime = performance.now() + 1000

        function frame (now) {
          const elapsed = now - startTime
          const p = Math.min(1, elapsed / duration)
          const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p
          const curX = sX + (eX - sX) * ease
          const arcHeight = -Math.sin(p * Math.PI) * 90
          const curY = sY + (eY - sY) * ease + arcHeight

          const scale = 0.3 + 0.9 * Math.sin(p * Math.PI) + (1 - p) * 0.1
          const rot = p * 360 * (options.spin ? 1 : 0.25)
          const opacity = p < 0.15 ? p / 0.15 : p > 0.85 ? (1 - p) / 0.15 : 1

          proxy.style.left = `${curX}px`
          proxy.style.top = `${curY}px`
          proxy.style.opacity = String(opacity)
          proxy.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rot}deg)`

          if (p < 1) {
            requestAnimationFrame(frame)
          } else {
            if (proxy.parentNode) proxy.parentNode.removeChild(proxy)
            resolve()
          }
        }

        requestAnimationFrame(frame)
      })
    },
    reveal (imageSrc, targetRect, options = {}) {
      return new Promise(resolve => {
        if (this.isReducedMotion()) {
          resolve()
          return
        }
        const rect = targetRect || this.getSceneRect()
        const proxy = document.createElement('div')
        proxy.className = 'item-insert-proxy'
        proxy.innerHTML = `<img src="${imageSrc}" alt="">`
        proxy.style.left = `${rect.left + rect.width / 2}px`
        proxy.style.top = `${rect.top + rect.height / 2}px`
        proxy.style.opacity = '0'
        proxy.style.transform = 'translate(-50%, -50%) scale(0.2)'
        document.body.appendChild(proxy)

        const anim = proxy.animate(
          [
            {
              transform: 'translate(-50%, -50%) scale(0.2)',
              opacity: 0,
              filter: 'brightness(2) drop-shadow(0 0 0 gold)'
            },
            {
              transform: 'translate(-50%, -50%) scale(1.15)',
              opacity: 1,
              filter: 'brightness(1.5) drop-shadow(0 0 30px gold)',
              offset: 0.7
            },
            {
              transform: 'translate(-50%, -50%) scale(1)',
              opacity: 1,
              filter: 'brightness(1) drop-shadow(0 0 10px gold)'
            }
          ],
          { duration: 600, easing: 'cubic-bezier(0.18, 0.9, 0.32, 1.15)' }
        )

        anim.onfinish = () => {
          setTimeout(() => {
            if (proxy.parentNode) proxy.parentNode.removeChild(proxy)
            resolve()
          }, options.holdDuration || 400)
        }
      })
    },
    transform (startImg, endImg, targetRect) {
      return new Promise(resolve => {
        const rect = targetRect || this.getSceneRect()
        this.reveal(startImg, rect, { holdDuration: 200 }).then(() => {
          this.effect('flash', targetRect).then(() => {
            this.reveal(endImg, rect, { holdDuration: 400 }).then(resolve)
          })
        })
      })
    },
    document (docConfig) {
      return new Promise(resolve => {
        const overlay = document.createElement('div')
        overlay.className = 'doc-overlay'
        overlay.setAttribute('role', 'dialog')
        overlay.setAttribute('aria-modal', 'true')

        const container = document.createElement('div')
        container.className = 'doc-container'

        container.innerHTML = `
                    <div class="doc-parchment" tabindex="-1">
                        <header class="doc-header">
                            <img src="${
                              docConfig.image ||
                              'images/items/waterlogged-diary-page.png'
                            }" class="doc-icon" alt="" onerror="this.style.display='none'">
                            <div class="doc-heading-text">
                                <h3 class="doc-title">${docConfig.title}</h3>
                                ${
                                  docConfig.subtitle
                                    ? `<p class="doc-sub">${docConfig.subtitle}</p>`
                                    : ''
                                }
                            </div>
                            <button type="button" class="doc-close-btn" aria-label="Close document">&times;</button>
                        </header>
                        <div class="doc-body">
                            ${docConfig.html}
                        </div>
                        <footer class="doc-footer">
                            <span>Whispers of the Forgotten</span>
                            <span class="doc-hint">Press [Esc] or click anywhere outside to close</span>
                        </footer>
                    </div>
                `

        overlay.appendChild(container)
        document.body.appendChild(overlay)
        const parchment = container.querySelector('.doc-parchment')
        const closeBtn = container.querySelector('.doc-close-btn')
        requestAnimationFrame(() => {
          overlay.classList.add('is-visible')
          closeBtn.focus()
        })

        let isClosing = false
        const close = () => {
          if (isClosing) return
          isClosing = true

          container.classList.add('is-folding')
          overlay.classList.remove('is-visible')
          const bagRect = this.getBagRect()
          const docRect = container.getBoundingClientRect()
          this.fly(
            docConfig.image || 'images/items/waterlogged-diary-page.png',
            docRect,
            bagRect,
            { duration: 420 }
          ).catch(() => {})

          setTimeout(() => {
            document.removeEventListener('keydown', onKeyDown)
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay)
            resolve()
          }, 350)
        }

        const onKeyDown = e => {
          if (e.key === 'Escape') {
            e.preventDefault()
            close()
          }
        }

        closeBtn.addEventListener('click', close)
        overlay.addEventListener('click', e => {
          if (e.target === overlay) close()
        })
        document.addEventListener('keydown', onKeyDown)
      })
    },
    insert (imageSrc, targetRect) {
      return new Promise(resolve => {
        const bagRect = this.getBagRect()
        const destRect = targetRect || this.getSceneRect()

        this.fly(imageSrc, bagRect, destRect, {
          duration: 520,
          spin: false
        }).then(() => {
          this.effect('flash', destRect).then(() => {
            resolve()
          })
        })
      })
    },
    effect (type, targetRect, options = {}) {
      return new Promise(resolve => {
        const rect = targetRect || this.getSceneRect()
        const container = document.body

        if (type === 'illumination') {
          const sceneEl = document.querySelector('.scene')
          if (sceneEl) {
            const lanternProp = document.createElement('div')
            lanternProp.className = 'lantern-active-prop'
            lanternProp.innerHTML = `<img src="images/items/rusty-lantern.png" alt="">`
            sceneEl.appendChild(lanternProp)
            const flare = document.createElement('div')
            flare.className = 'scene-illumination-flare'
            sceneEl.appendChild(flare)
            sceneEl.classList.add('is-illuminated')
            document.body.classList.remove('page-dark-environment')

            setTimeout(() => {
              lanternProp.style.transition = 'opacity 0.6s ease'
              lanternProp.style.opacity = '0'
              setTimeout(() => {
                if (lanternProp.parentNode)
                  lanternProp.parentNode.removeChild(lanternProp)
                resolve()
              }, 600)
            }, 2400)
          } else {
            resolve()
          }
        } else if (type === 'heal') {
          const ring = document.createElement('div')
          ring.className = 'heal-ring'
          const statusEl =
            document.querySelector('.status-bar') ||
            document.querySelector('.cb-player')
          const stRect = statusEl ? statusEl.getBoundingClientRect() : rect
          ring.style.left = `${stRect.left + stRect.width / 2}px`
          ring.style.top = `${stRect.top + stRect.height / 2}px`
          container.appendChild(ring)

          setTimeout(() => {
            if (ring.parentNode) ring.parentNode.removeChild(ring)
            resolve()
          }, 750)
        } else if (type === 'flash') {
          const flash = document.createElement('div')
          flash.className = 'socket-flash'
          flash.style.left = `${rect.left + rect.width / 2}px`
          flash.style.top = `${rect.top + rect.height / 2}px`
          container.appendChild(flash)

          setTimeout(() => {
            if (flash.parentNode) flash.parentNode.removeChild(flash)
            resolve()
          }, 600)
        } else {
          resolve()
        }
      })
    }
  }

  const ItemSystem = {
    isBusy: false,
    onItemDiscovered (itemId, sourceElOrRect) {
      const config = getConfig(itemId)
      const bagRect = ItemAnim.getBagRect()
      const startRect =
        sourceElOrRect instanceof HTMLElement
          ? sourceElOrRect.getBoundingClientRect()
          : sourceElOrRect || ItemAnim.getSceneRect()

      return ItemAnim.fly(config.image, startRect, bagRect, {
        duration: 650
      }).then(() => {
        if (typeof window.animateBag === 'function') {
          window.animateBag()
        } else {
          const bagBtn =
            document.querySelector('.rail-btn.bag') ||
            document.querySelector('#btn-bag')
          if (bagBtn) {
            bagBtn.classList.remove('bag-bounce')
            void bagBtn.offsetWidth
            bagBtn.classList.add('bag-bounce')
          }
        }

        if (window.AudioSys && typeof window.AudioSys.play === 'function') {
          try {
            window.AudioSys.play('item')
          } catch (e) {}
        }
      })
    },
    handles (itemId) {
      return isConfigured(itemId)
    },
    // Presentation only: plays the item's use animation. It changes no game state
    // and must only be called after the gameplay layer has reported a real success.
    async animateUse (itemId) {
      if (this.isBusy) return
      this.isBusy = true
      try {
        const config = getConfig(itemId)
        if (config.useAnim === 'insert') await ItemAnim.insert(config.image)
        else await ItemAnim.reveal(config.image)
      } catch (err) {
        console.error('ItemSystem animation error:', err)
      } finally {
        this.isBusy = false
      }
    },
    async useItem (itemId, ctx = {}) {
      // An item with no use-effect here must NOT be reported as a success:
      // callers fall back to the game's own item logic when handled === false.
      if (!isConfigured(itemId)) return { success: false, handled: false }
      if (this.isBusy) return { success: false, busy: true }
      this.isBusy = true

      const config = getConfig(itemId)
      const gameState = ctx.gameState || window.gameState
      const player = ctx.player || window.player
      const currentLoc =
        ctx.currentLocationId || (gameState ? gameState.currentLocation : null)

      const callCtx = { gameState, player, currentLocationId: currentLoc }

      try {
        if (config.type === 'document' && config.document) {
          if (window.AudioSys && typeof window.AudioSys.play === 'function') {
            try {
              window.AudioSys.play('reveal')
            } catch (e) {}
          }
          if (gameState && gameState.clues && config.document.clueKey) {
            gameState.clues[config.document.clueKey] = true
          }

          await ItemAnim.document(config.document)
          return { success: true, message: `Finished reading ${config.name}.` }
        }
        if (typeof config.onUse === 'function') {
          const check = config.onUse(callCtx)
          if (!check.success) {
            if (typeof window.showToast === 'function') {
              window.showToast(check.message, 'bad')
            }
            return check
          }
          if (
            config.useAnim === 'effect' &&
            config.effectType === 'illumination'
          ) {
            if (gameState && Array.isArray(gameState.illuminatedLocations)) {
              if (!gameState.illuminatedLocations.includes(currentLoc)) {
                gameState.illuminatedLocations.push(currentLoc)
              }
            }
            await ItemAnim.effect('illumination')
          } else if (config.useAnim === 'insert') {
            await ItemAnim.insert(config.image)
            if (check.puzzleSolvedKey && gameState && gameState.puzzlesSolved) {
              gameState.puzzlesSolved[check.puzzleSolvedKey] = true
            }
          } else if (
            config.useAnim === 'effect' &&
            config.effectType === 'heal'
          ) {
            if (player && check.healAmount) {
              player.hp = Math.min(player.maxHp, player.hp + check.healAmount)
              if (typeof window.renderStatusBar === 'function')
                window.renderStatusBar()
            }
            await ItemAnim.effect('heal')
          }
          if (
            !config.retained &&
            gameState &&
            Array.isArray(gameState.inventory)
          ) {
            const idx = gameState.inventory.indexOf(itemId)
            if (idx > -1) gameState.inventory.splice(idx, 1)
            if (typeof window.updateBagBadge === 'function')
              window.updateBagBadge()
          }

          if (typeof window.showToast === 'function') {
            window.showToast(check.message, 'good')
          }
          return check
        }
        await ItemAnim.reveal(config.image)
        return { success: true }
      } catch (err) {
        console.error('ItemSystem error:', err)
        return { success: false, error: err }
      } finally {
        this.isBusy = false
      }
    }
  }
  window.addEventListener('whispers:item-added', evt => {
    const detail = evt.detail || {}
    const itemId = detail.id || detail.itemId
    if (itemId) {
      ItemSystem.onItemDiscovered(itemId, detail.sourceEl || null)
    }
  })
  window.ItemSystem = ItemSystem
  window.ItemAnim = ItemAnim
  window.ITEM_CONFIG = ITEM_CONFIG
})()
