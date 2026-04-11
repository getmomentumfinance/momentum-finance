import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePreferences } from '../context/UserPreferencesContext'

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="gradient-text text-3xl font-bold mb-2">{t('reg.title')}</h1>
          <p className="text-muted text-sm">{t('reg.subtitle')}</p>
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
  )
}
