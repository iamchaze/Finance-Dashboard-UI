import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import { useAppState } from './context/AppStateContext'
import './App.css'

const THEME_STORAGE_KEY = 'finance-dashboard-theme'

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const SunIcon = () => (
  <svg aria-hidden="true" className="theme-icon" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07 6.7 17.3M17.3 6.7l1.77-1.77" />
  </svg>
)

const MoonIcon = () => (
  <svg aria-hidden="true" className="theme-icon" viewBox="0 0 24 24">
    <path d="M20.2 14.7A8.6 8.6 0 1 1 9.3 3.8a7 7 0 0 0 10.9 10.9Z" />
  </svg>
)

const EyeIcon = () => (
  <svg aria-hidden="true" className="theme-icon" viewBox="0 0 24 24">
    <path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="3.3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg aria-hidden="true" className="theme-icon" viewBox="0 0 24 24">
    <path d="M2 12s3.8-6 10-6a10.8 10.8 0 0 1 7.2 2.7M22 12s-3.8 6-10 6A10.8 10.8 0 0 1 4.8 15.3" />
    <path d="m3 3 18 18" />
    <circle cx="12" cy="12" r="3.3" />
  </svg>
)

const getRouteFromHash = (hash) => {
  if (hash === '#/transactions') {
    return 'transactions'
  }

  return 'dashboard'
}

function App() {
  const { roleOptions, selectedRole, setSelectedRole, user } = useAppState()
  const [theme, setTheme] = useState(getInitialTheme)
  const [route, setRoute] = useState(getRouteFromHash(window.location.hash))
  const [showFinancialValues, setShowFinancialValues] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '#/dashboard'
    }

    const onHashChange = () => {
      setRoute(getRouteFromHash(window.location.hash))
    }

    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <h1>Finance Dashboard</h1>
          <div className="header-user">
            <img alt={user.name} className="header-user-avatar" src={user.profilePhoto} />
            <div className="header-user-meta">
              <p>{user.name}</p>
              <span>{selectedRole}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <label className="visually-hidden" htmlFor="selected-role">
            Select role
          </label>
          <select
            className="role-select"
            id="selected-role"
            onChange={(event) => setSelectedRole(event.target.value)}
            value={selectedRole}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            aria-label={showFinancialValues ? 'Hide balance, income and expenses' : 'Show balance, income and expenses'}
            className="theme-toggle"
            onClick={() => setShowFinancialValues((current) => !current)}
            type="button"
          >
            {showFinancialValues ? <EyeIcon /> : <EyeOffIcon />}
          </button>
          <button
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="theme-toggle"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main className="app-content">
        {route === 'transactions' ? (
          <Transactions />
        ) : (
          <Dashboard showFinancialValues={showFinancialValues} />
        )}
      </main>
    </div>
  )
}

export default App
