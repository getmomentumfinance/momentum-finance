import { useState } from 'react'

export function useCollapsed(key) {
  const storageKey = `card-collapsed:${key}`
  const [collapsed, setCollapsedState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) ?? false } catch { return false }
  })

  function setCollapsed(valueOrFn) {
    setCollapsedState(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return [collapsed, setCollapsed]
}
