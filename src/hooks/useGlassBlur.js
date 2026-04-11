import { useState, useEffect, useCallback } from 'react'

const storageKey = userId => `app_glass_blur_${userId ?? 'guest'}`

function applyBlur(enabled) {
  if (enabled) {
    document.documentElement.style.removeProperty('--card-blur')
  } else {
    document.documentElement.style.setProperty('--card-blur', '0px')
  }
}

export function useGlassBlur(userId) {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey(userId))
    const val   = saved === null ? true : saved === 'true'
    setEnabled(val)
    applyBlur(val)
  }, [userId])

  const toggle = useCallback((val) => {
    setEnabled(val)
    applyBlur(val)
    localStorage.setItem(storageKey(userId), String(val))
  }, [userId])

  return { enabled, toggle }
}
