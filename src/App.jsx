import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TransactionModalProvider } from './context/TransactionModalContext'
import { CardPreferencesProvider } from './context/CardPreferencesContext'
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
import Summary from './pages/Summary'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" />
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
      <Route path="/summary"      element={<ProtectedRoute><Summary /></ProtectedRoute>} />
      <Route path="*"             element={<Navigate to={user ? landingPage : "/"} />} />
    </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserPreferencesProvider>
          <PaletteProvider>
          <CardPreferencesProvider>
            <SharedDataProvider>
              <TransactionModalProvider>
              <ThemeApplier />
              <Toast />
              <div id="design-overlay" aria-hidden="true" />
              <ParticleLayer />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <AppRoutes />
              </div>
              </TransactionModalProvider>
            </SharedDataProvider>
          </CardPreferencesProvider>
          </PaletteProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
