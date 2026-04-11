import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import { usePreferences } from '../context/UserPreferencesContext'

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8">

        <div className="text-center mb-8">
          <h1 className="gradient-text text-3xl font-bold mb-2">{t('login.welcome')}</h1>
          <p className="text-muted text-sm">{t('login.subtitle')}</p>
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
  )
}
