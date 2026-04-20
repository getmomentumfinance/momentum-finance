import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import { usePreferences } from '../context/UserPreferencesContext'
const logoImg = '/momentum_transparant.png'

const MAUVE = 'linear-gradient(135deg, #a77693 0%, #2d3b6e 60%, #174871 100%)'

export default function Login() {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [email, setEmail]               = useState(() => localStorage.getItem('remembered_email') ?? '')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe]     = useState(() => !!localStorage.getItem('remembered_email'))
  const [error, setError]               = useState(null)
  const [loading, setLoading]           = useState(false)

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      if (rememberMe) localStorage.setItem('remembered_email', email)
      else localStorage.removeItem('remembered_email')
      navigate('/dashboard')
    }

    setLoading(false)
  }

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: MAUVE }}>
      {/* depth overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.4))', zIndex: 0 }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + back to home */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link to="/" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <img src={logoImg} alt="Momentum Finance" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold text-sm text-white">Momentum Finance</span>
          </Link>
        </div>

      <div className="glass w-full rounded-2xl p-8">

        <div className="text-center mb-8">
          <h1 className="gradient-text text-3xl font-bold mb-2">{t('login.welcome')}</h1>
          <p className="text-muted text-sm">{t('login.subtitle')}</p>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-80 mb-5"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>

        <form onSubmit={handleSignIn} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('login.email')}</label>
            <input
              type="email"
              placeholder={t('login.emailPh')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-input border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">{t('login.password')}</label>
              <button type="button" className="text-sm text-accent">{t('login.forgot')}</button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-input border border-border rounded-xl px-4 py-3 pr-12 text-sm text-white outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="accent-[var(--color-accent)] w-4 h-4 rounded"
            />
            {t('login.remember')}
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary rounded-xl py-3 font-semibold mt-2 disabled:opacity-50 transition-opacity"
          >
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-muted">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-accent font-semibold hover:underline">{t('login.signUp')}</Link>
        </p>
      </div>
      </div>
    </div>
  )
}
