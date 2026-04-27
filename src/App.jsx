import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TransactionModalProvider } from './context/TransactionModalContext'
import { CardPreferencesProvider } from './context/CardPreferencesContext'
import { UIPrefProvider } from './context/UIPrefContext'
import { SharedDataProvider } from './context/SharedDataContext'
import { PaletteProvider } from './context/PaletteContext'
import { useTheme } from './hooks/useTheme'
import { useDesign } from './hooks/useDesign'
import { UserPreferencesProvider, usePreferences } from './context/UserPreferencesContext'
import ParticleLayer from './components/shared/ParticleLayer'
import Toast from './components/shared/Toast'
import { useGlassBlur } from './hooks/useGlassBlur'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Savings from './pages/Savings'
import Budgets from './pages/Budgets'
import Transactions from './pages/Transactions'
import Settings from './pages/Settings'
import Portfolio from './pages/Portfolio'
import CalendarPage from './pages/CalendarPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" />
}

// Debounce transaction-saved at the source — all 20+ listeners collapse into one burst
function TransactionSavedDebouncer() {
  useEffect(() => {
    let timer = null
    let pending = null
    const original = window.dispatchEvent.bind(window)
    window.dispatchEvent = function(event) {
      if (event.type === 'transaction-saved') {
        pending = event
        clearTimeout(timer)
        timer = setTimeout(() => { original(pending); pending = null }, 350)
        return true
      }
      return original(event)
    }
    return () => {
      window.dispatchEvent = original
      clearTimeout(timer)
    }
  }, [])
  return null
}

// Silently checks for updates on startup — only runs inside the Tauri app
function UpdateChecker() {
  useEffect(() => {
    async function check() {
      try {
        const { check } = await import('@tauri-apps/plugin-updater')
        const { relaunch } = await import('@tauri-apps/plugin-process')
        const update = await check()
        if (!update) return
        await update.downloadAndInstall()
        await relaunch()
      } catch {
        // Not in Tauri, or update check failed — silently ignore
      }
    }
    check()
  }, [])
  return null
}

function ThemeApplier() {
  const { user } = useAuth()
  useTheme()
  useDesign(user?.id)
  useGlassBlur(user?.id)
  return null
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const { landingPage }   = usePreferences()
  const location          = useLocation()
  if (loading) return null

  return (
    <div key={location.pathname} className="page-fade-in">
      <Routes>
        <Route path="/"             element={user ? <Navigate to={landingPage} /> : <LandingPage />} />
        <Route path="/login"        element={user ? <Navigate to={landingPage} /> : <Login />} />
        <Route path="/register"     element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics"    element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/savings"      element={<ProtectedRoute><Savings /></ProtectedRoute>} />
        <Route path="/budgets"      element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/portfolio"    element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/calendar"     element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="*"             element={<Navigate to={user ? landingPage : "/"} />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIPrefProvider>
        <UserPreferencesProvider>
          <PaletteProvider>
          <CardPreferencesProvider>
            <SharedDataProvider>
              <TransactionModalProvider>
              <ThemeApplier />
              <TransactionSavedDebouncer />
              <UpdateChecker />
              <Toast />
              <div id="design-overlay" aria-hidden="true" />
              <VercelAnalytics />
              <ParticleLayer />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <AppRoutes />
              </div>
              </TransactionModalProvider>
            </SharedDataProvider>
          </CardPreferencesProvider>
          </PaletteProvider>
        </UserPreferencesProvider>
        </UIPrefProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
