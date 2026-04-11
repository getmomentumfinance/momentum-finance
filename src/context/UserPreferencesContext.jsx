import { createContext, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'
import en from '../i18n/en'
import nl from '../i18n/nl'

const TRANSLATIONS = { en, nl }

const CURRENCY_SYMBOLS = {
  EUR: '€', USD: '$',   GBP: '£',    CHF: 'CHF ',
  JPY: '¥', CAD: 'CA$', AUD: 'A$',  SEK: 'kr',
  NOK: 'kr', DKK: 'kr',
}

const CURRENCY_LOCALES = {
  EUR: 'nl-NL', USD: 'en-US', GBP: 'en-GB', CHF: 'de-CH',
  JPY: 'ja-JP', CAD: 'en-CA', AUD: 'en-AU', SEK: 'sv-SE',
  NOK: 'nb-NO', DKK: 'da-DK',
}

const PreferencesContext = createContext(null)

export function UserPreferencesProvider({ children }) {
  const { user } = useAuth()

  const currency    = user?.user_metadata?.currency     ?? 'EUR'
  const dateFormat  = user?.user_metadata?.date_format  ?? 'DD/MM/YYYY'
  const landingPage = user?.user_metadata?.landing_page ?? '/dashboard'
  const language    = user?.user_metadata?.language     ?? 'en'

  const symbol = CURRENCY_SYMBOLS[currency] ?? '€'
  const locale = CURRENCY_LOCALES[currency] ?? 'nl-NL'

  const fmt = useMemo(() => (n) => {
    if (n == null || isNaN(n)) return '—'
    const formatted = Math.abs(n).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${n < 0 ? '−' : ''}${symbol}${formatted}`
  }, [symbol, locale])

  const fmtK = useMemo(() => (n) => {
    if (n == null || isNaN(n)) return '—'
    if (Math.abs(n) >= 1000) {
      const k = Math.abs(n) / 1000
      const formatted = k.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      return `${n < 0 ? '−' : ''}${symbol}${formatted}k`
    }
    return fmt(n)
  }, [fmt, symbol, locale])

  const t = useMemo(() => (key, vars = {}) => {
    const dict = TRANSLATIONS[language] ?? TRANSLATIONS.en
    const str  = dict[key] ?? TRANSLATIONS.en[key] ?? key
    return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), str)
  }, [language])

  return (
    <PreferencesContext.Provider value={{ currency, dateFormat, landingPage, language, fmt, fmtK, symbol, locale, t }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  return useContext(PreferencesContext)
}
