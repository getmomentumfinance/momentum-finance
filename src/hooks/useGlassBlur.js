import { useState, useEffect, useCallback } from 'react'
import { useUIPrefs } from '../context/UIPrefContext'

const storageKey = userId => `app_glass_blur_${userId ?? 'guest'}`

function applyBlur(enabled) {
  if (enabled) {
    document.documentElement.style.removeProperty('--card-blur')
  } else {
    document.documentElement.style.setProperty('--card-blur', '0px')
  }
}

export function useGlassBlur(userId) {
  const { setPref } = useUIPrefs()
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey(userId))
    const val   = saved === null ? true : saved === 'true'
    setEnabled(val)
    applyBlur(val)
  }, [userId])

  // Re-apply when prefs sync from Supabase on another device
  useEffect(() => {
    if (!userId) return
    function onLoad() {
      const saved = localStorage.getItem(storageKey(userId))
      const val   = saved === null ? true : saved === 'true'
      setEnabled(val)
      applyBlur(val)
    }
    window.addEventListener('ui-prefs-loaded', onLoad)
    return () => window.removeEventListener('ui-prefs-loaded', onLoad)
  }, [userId])

  const toggle = useCallback((val) => {
    setEnabled(val)
    applyBlur(val)
    localStorage.setItem(storageKey(userId), String(val))
    setPref(storageKey(userId), String(val))
  }, [userId, setPref])

  return { enabled, toggle }
}
