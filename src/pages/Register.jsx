import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePreferences } from '../context/UserPreferencesContext'
const logoImg = '/momentum_transparant.png'

const MAUVE = 'linear-gradient(135deg, #a77693 0%, #2d3b6e 60%, #174871 100%)'

const rules = [
  { label: '6+ characters', test: (p) => p.length >= 6 },
  { label: '1 Number',      test: (p) => /\d/.test(p) },
  { label: '1 Capital',     test: (p) => /[A-Z]/.test(p) },
  { label: '1 Special Sign',test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export default function Register() {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const passwordValid = rules.every((r) => r.test(password))
  const passwordsMatch = password === confirmPassword

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError(null)

    if (!passwordValid) return setError('Password does not meet all requirements.')
    if (!passwordsMatch) return setError('Passwords do not match.')

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
    } else if (data.session) {
      navigate('/dashboard')
    } else {
      setConfirmed(true)
    }

    setLoading(false)
  }

  if (confirmed) return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: MAUVE }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.4))', zIndex: 0 }} />
      <div className="relative z-10 glass w-full max-w-md rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white/60"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        <h2 className="gradient-text text-2xl font-bold mb-2">{t('reg.checkEmail')}</h2>
        <p className="text-muted text-sm">
          {t('reg.emailSent').split('{email}')[0]}
          <span className="text-white">{email}</span>
          {t('reg.emailSent').split('{email}')[1]}
        </p>
        <Link to="/login" className="inline-block mt-6 text-accent text-sm font-semibold hover:underline">{t('reg.backToLogin')}</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative" style={{ background: MAUVE }}>
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

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="gradient-text text-3xl font-bold mb-2">{t('reg.title')}</h1>
          <p className="text-muted text-sm">{t('reg.subtitle')}</p>
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

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('reg.fullName')}</label>
            <input
              type="text"
              placeholder={t('reg.fullNamePh')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="bg-input border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('reg.email')}</label>
            <input
              type="email"
              placeholder={t('reg.emailPh')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('reg.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-input border border-border rounded-xl px-4 py-3 pr-12 text-sm text-white outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
              >
                {showPassword
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
              </button>
            </div>

            {/* Password rules */}
            {password.length > 0 && (
              <div className="bg-input border border-border rounded-xl px-4 py-3 grid grid-cols-2 gap-1 mt-1">
                {rules.map((rule) => (
                  <span
                    key={rule.label}
                    className={`text-xs flex items-center gap-1 transition-colors ${rule.test(password) ? 'text-green-400' : 'text-muted'}`}
                  >
                    <span>{rule.test(password) ? '●' : '○'}</span>
                    {rule.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('reg.confirmPw')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`bg-input border rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors ${
                confirmPassword.length > 0
                  ? passwordsMatch ? 'border-green-400' : 'border-red-400'
                  : 'border-border focus:border-accent'
              }`}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Create Account */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary rounded-xl py-3 font-semibold mt-2 disabled:opacity-50 transition-opacity"
          >
            {loading ? t('reg.creating') : t('reg.create')}
          </button>

        </form>

        {/* Log in link */}
        <p className="text-center text-sm mt-6 text-muted">
          {t('reg.hasAccount')}{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            {t('reg.logIn')}
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
