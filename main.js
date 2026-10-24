;(function () {
  let started = false

  function showFatal (root, messages) {
    root.replaceChildren()

    const box = document.createElement('div')
    box.className = 'fatal'
    box.setAttribute('role', 'alert')

    const heading = document.createElement('h2')
    heading.textContent = 'The game could not start'
    box.appendChild(heading)

    messages.forEach(function (message) {
      const paragraph = document.createElement('p')
      paragraph.textContent = message
      box.appendChild(paragraph)
    })

    root.appendChild(box)
  }

  function boot () {
    if (started) return
    started = true

    const root = document.getElementById('app')

    if (!root) {
      console.error('Missing <div id="app">.')
      return
    }

    try {
      const problems = validateGameData()

      if (problems.length > 0) {
        console.error('Game data validation problems:', problems)

        showFatal(root, ['The game data has validation problems:', ...problems])
        return
      }

      Auth.mount(root, function (session) {
        console.log(
          'Authentication successful:',
          session.guest ? 'Guest' : session.username
        )

        root.replaceChildren()
        Game.mount(root)
      })
    } catch (error) {
      console.error('Game startup failed:', error)

      showFatal(root, [
        'Could not start the game.',
        error.message || 'Check the browser console for details.'
      ])
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true })
  } else {
    boot()
  }
})()
