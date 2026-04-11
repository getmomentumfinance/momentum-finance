import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const CardPreferencesContext = createContext({ prefsMap: {}, loaded: false, updatePrefs: () => {} })

export function CardPreferencesProvider({ children }) {
  const { user } = useAuth()
  const [prefsMap, setPrefsMap] = useState({})
  const [loaded,   setLoaded]   = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('card_preferences')
      .select('card_label, preferences')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const map = {}
        for (const row of (data ?? [])) map[row.card_label] = row.preferences
        setPrefsMap(map)
        setLoaded(true)
      })
  }, [user?.id])

  const updatePrefs = useCallback(async (label, prefs) => {
    if (!user?.id) return
    setPrefsMap(prev => ({ ...prev, [label]: prefs }))
    await supabase.from('card_preferences').upsert({
      user_id:    user.id,
      card_label: label,
      preferences: prefs,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,card_label' })
  }, [user?.id])

  // Synchronously updates prefsMap for all labels at once, then fires off DB saves.
  // Use this when you need the context state to be current before the next render.
  const batchUpdatePrefs = useCallback((map) => {
    if (!user?.id) return
    setPrefsMap(prev => ({ ...prev, ...map }))
    Object.entries(map).forEach(([label, prefs]) => {
      supabase.from('card_preferences').upsert({
        user_id:    user.id,
        card_label: label,
        preferences: prefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,card_label' })
    })
  }, [user?.id])

  const resetAllPrefs = useCallback(async () => {
    if (!user?.id) return
    setPrefsMap({})
    await supabase.from('card_preferences').delete().eq('user_id', user.id)
    window.dispatchEvent(new CustomEvent('card-prefs-reset', { detail: {} }))
  }, [user?.id])

  return (
    <CardPreferencesContext.Provider value={{ prefsMap, loaded, updatePrefs, batchUpdatePrefs, resetAllPrefs }}>
      {children}
    </CardPreferencesContext.Provider>
  )
}

export function useCardPreferences() {
  return useContext(CardPreferencesContext)
}
