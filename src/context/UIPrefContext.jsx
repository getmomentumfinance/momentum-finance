import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const UIPrefContext = createContext({
  prefs: {}, loaded: false,
  setPref: () => {}, setPrefs: () => {},
  deletePref: () => {}, deletePrefs: () => {},
})

export function UIPrefProvider({ children }) {
  const { user } = useAuth()
  const [prefs, setPrefsState] = useState({})
  const [loaded, setLoaded]   = useState(false)
  const pendingRef = useRef({})
  const timerRef   = useRef(null)
  const userIdRef  = useRef(null)

  useEffect(() => {
    if (!user?.id) { setPrefsState({}); setLoaded(false); return }
    userIdRef.current = user.id

    supabase
      .from('user_preferences')
      .select('prefs')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const remote = data?.prefs ?? {}
        // Seed localStorage — remote values win over local
        Object.entries(remote).forEach(([k, v]) => {
          try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)) } catch {}
        })
        setPrefsState(remote)
        setLoaded(true)
        window.dispatchEvent(new CustomEvent('ui-prefs-loaded', { detail: remote }))
      })
  }, [user?.id])

  function flush(next) {
    pendingRef.current = next
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (!userIdRef.current) return
      await supabase.from('user_preferences').upsert(
        { user_id: userIdRef.current, prefs: pendingRef.current, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }, 800)
  }

  const setPref = useCallback((key, value) => {
    try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)) } catch {}
    setPrefsState(prev => { const next = { ...prev, [key]: value }; flush(next); return next })
  }, [])

  const setPrefs = useCallback((map) => {
    Object.entries(map).forEach(([k, v]) => {
      try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)) } catch {}
    })
    setPrefsState(prev => { const next = { ...prev, ...map }; flush(next); return next })
  }, [])

  const deletePref = useCallback((key) => {
    try { localStorage.removeItem(key) } catch {}
    setPrefsState(prev => { const next = { ...prev }; delete next[key]; flush(next); return next })
  }, [])

  const deletePrefs = useCallback((keys) => {
    keys.forEach(k => { try { localStorage.removeItem(k) } catch {} })
    setPrefsState(prev => {
      const next = { ...prev }
      keys.forEach(k => delete next[k])
      flush(next)
      return next
    })
  }, [])

  return (
    <UIPrefContext.Provider value={{ prefs, loaded, setPref, setPrefs, deletePref, deletePrefs }}>
      {children}
    </UIPrefContext.Provider>
  )
}

export function useUIPrefs() { return useContext(UIPrefContext) }
