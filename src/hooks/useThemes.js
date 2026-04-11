import { useState, useCallback } from 'react'

const key = userId => `saved_themes_${userId}`

function load(userId) {
  try { return JSON.parse(localStorage.getItem(key(userId)) ?? '[]') }
  catch { return [] }
}

function persist(userId, themes) {
  localStorage.setItem(key(userId), JSON.stringify(themes))
}

export function useThemes(userId) {
  const [themes, setThemes] = useState(() => userId ? load(userId) : [])

  const saveTheme = useCallback((name, data) => {
    const theme = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString(), ...data }
    setThemes(prev => {
      const next = [...prev, theme]
      if (userId) persist(userId, next)
      return next
    })
  }, [userId])

  const deleteTheme = useCallback((id) => {
    setThemes(prev => {
      const next = prev.filter(t => t.id !== id)
      if (userId) persist(userId, next)
      return next
    })
  }, [userId])

  return { themes, saveTheme, deleteTheme }
}
