const Auth = (() => {
  const USERS_KEY = 'users'
  const SESSION_KEY = 'session'

  function readUsers () {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
      return users && typeof users === 'object' && !Array.isArray(users)
        ? users
        : {}
    } catch {
      return {}
    }
  }

  function saveUsers (users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  function normalizeUsername (username) {
    return (username || '').trim().toLowerCase()
  }

  function createSalt () {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(
      ''
    )
  }

  async function hashPassword (password, salt) {
    const data = new TextEncoder().encode(salt + password)
    const hash = await crypto.subtle.digest('SHA-256', data)

    return Array.from(new Uint8Array(hash), byte =>
      byte.toString(16).padStart(2, '0')
    ).join('')
  }

  function getSession () {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
    } catch {
      return null
    }
  }

  function setSession (username, guest = false) {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        username,
        guest,
        createdAt: Date.now()
      })
    )
  }

  function clearSession () {
    sessionStorage.removeItem(SESSION_KEY)
  }

  function validSession () {
    const session = getSession()

    if (!session || typeof session.username !== 'string') {
      return null
    }

    if (session.guest) {
      return session
    }

    const users = readUsers()
    return users[normalizeUsername(session.username)] ? session : null
  }

  function showMessage (element, message, kind = 'error') {
    element.textContent = message
    element.className = `auth-message ${kind}`
  }

  function mount (root, onAuthenticated) {
    const session = validSession()

    if (session) {
      onAuthenticated(session)
      return
    }

    clearSession()

    let mode = 'login'

    function render () {
      root.replaceChildren()
      root.className = 'auth-screen'

      const card = document.createElement('section')
      card.className = 'auth-card'

      const emblem = document.createElement('div')
      emblem.className = 'auth-emblem'
      emblem.textContent = '✦'

      const title = document.createElement('h1')
      title.className = 'auth-title'
      title.textContent = 'Whispers of the Forgotten'

      const subtitle = document.createElement('p')
      subtitle.className = 'auth-subtitle'
      subtitle.textContent =
        mode === 'login'
          ? 'Your forgotten journey awaits.'
          : 'Begin a new journey.'

      const form = document.createElement('form')
      form.className = 'auth-form'

      const usernameLabel = document.createElement('label')
      usernameLabel.textContent = 'Username'

      const usernameInput = document.createElement('input')
      usernameInput.name = 'username'
      usernameInput.type = 'text'
      usernameInput.autocomplete = 'username'
      usernameInput.placeholder = 'Enter your username'
      usernameInput.required = true
      usernameInput.minLength = 3
      usernameInput.maxLength = 24
      usernameLabel.append(usernameInput)

      const passwordLabel = document.createElement('label')
      passwordLabel.textContent = 'Password'

      const passwordInput = document.createElement('input')
      passwordInput.name = 'password'
      passwordInput.type = 'password'
      passwordInput.autocomplete =
        mode === 'login' ? 'current-password' : 'new-password'
      passwordInput.placeholder =
        mode === 'login'
          ? 'Enter your password'
          : 'At least 8 chars (upper, lower, num, special)'
      passwordInput.required = true
      passwordInput.minLength = mode === 'login' ? 1 : 8
      passwordLabel.append(passwordInput)

      form.append(usernameLabel, passwordLabel)

      let confirmInput = null
      if (mode === 'register') {
        const confirmLabel = document.createElement('label')
        confirmLabel.textContent = 'Confirm Password'

        confirmInput = document.createElement('input')
        confirmInput.name = 'confirmPassword'
        confirmInput.type = 'password'
        confirmInput.autocomplete = 'new-password'
        confirmInput.placeholder = 'Confirm your password'
        confirmInput.required = true
        confirmInput.minLength = 8
        confirmLabel.append(confirmInput)

        form.append(confirmLabel)
      }

      const message = document.createElement('p')
      message.className = 'auth-message'
      message.setAttribute('role', 'status')

      const submit = document.createElement('button')
      submit.type = 'submit'
      submit.className = 'ui-btn primary auth-submit'
      submit.textContent =
        mode === 'login' ? 'Enter the Forgotten Realms' : 'Create Account'

      const switchButton = document.createElement('button')
      switchButton.type = 'button'
      switchButton.className = 'auth-link'
      switchButton.textContent =
        mode === 'login'
          ? 'New here? Create an account'
          : 'Already have an account? Log in'

      switchButton.addEventListener('click', () => {
        mode = mode === 'login' ? 'register' : 'login'
        render()
      })

      const divider = document.createElement('div')
      divider.className = 'auth-divider'
      divider.textContent = 'OR'

      const guestButton = document.createElement('button')
      guestButton.type = 'button'
      guestButton.className = 'ui-btn auth-guest'
      guestButton.textContent = 'Continue as Guest'

      guestButton.addEventListener('click', () => {
        try {
          sessionStorage.removeItem('guest-whispers-of-the-forgotten-save-v1')
        } catch (_) {}
        setSession('Guest', true)
        onAuthenticated(getSession())
      })

      form.addEventListener('submit', async event => {
        event.preventDefault()
        submit.disabled = true
        switchButton.disabled = true
        guestButton.disabled = true

        try {
          const username = usernameInput.value.trim()
          const key = normalizeUsername(username)
          const password = passwordInput.value
          const users = readUsers()

          if (!username || !/^[a-zA-Z0-9_-]{3,24}$/.test(username)) {
            throw new Error(
              'Use 3–24 letters, numbers, underscores or hyphens for your username.'
            )
          }

          if (!password) {
            throw new Error('Please enter your password.')
          }

          if (!crypto || !crypto.subtle) {
            throw new Error(
              'Secure password hashing is unavailable in this environment.'
            )
          }

          if (mode === 'register') {
            const passwordComplexityRegex =
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/
            if (!passwordComplexityRegex.test(password)) {
              throw new Error(
                'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.'
              )
            }

            const confirmPassword = confirmInput ? confirmInput.value : ''
            if (password !== confirmPassword) {
              throw new Error(
                'Passwords do not match. Please verify your confirmation.'
              )
            }

            if (users[key]) {
              throw new Error(
                'That username already exists. Please choose a different username or log in.'
              )
            }

            const salt = createSalt()
            const passwordHash = await hashPassword(password, salt)

            users[key] = {
              username,
              salt,
              passwordHash,
              createdAt: Date.now()
            }

            saveUsers(users)
            setSession(username, false)

            showMessage(
              message,
              'Account created! Welcome to the Forgotten Realms.',
              'success'
            )

            setTimeout(() => {
              onAuthenticated(getSession())
            }, 300)
            return
          }
          const account = users[key]

          if (!account) {
            throw new Error(
              'Account not found. Check your username or register.'
            )
          }

          const enteredHash = await hashPassword(password, account.salt)

          if (enteredHash !== account.passwordHash) {
            throw new Error('Incorrect username or password.')
          }

          setSession(account.username, false)
          onAuthenticated(getSession())
        } catch (error) {
          showMessage(message, error.message || 'Something went wrong.')
          submit.disabled = false
          switchButton.disabled = false
          guestButton.disabled = false
        }
      })

      const footer = document.createElement('p')
      footer.className = 'auth-footer'
      footer.textContent =
        'Three worlds. One shattered crystal. Something old is waking.'

      form.append(submit)
      card.append(
        emblem,
        title,
        subtitle,
        form,
        message,
        switchButton,
        divider,
        guestButton,
        footer
      )
      root.append(card)
      usernameInput.focus()
    }

    render()
  }

  function logout () {
    const session = getSession()
    if (session && session.guest) {
      try {
        sessionStorage.removeItem('guest-whispers-of-the-forgotten-save-v1')
      } catch (_) {}
    }
    clearSession()
    window.location.reload()
  }

  return {
    mount,
    logout,
    getSession,
    clearSession
  }
})()
