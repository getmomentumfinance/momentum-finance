import { useState, useEffect } from 'react'

function readColors() {
  const s = getComputedStyle(document.documentElement)
  const g = (v) => s.getPropertyValue(v).trim()
  return {
    income:          g('--type-income')            || '#4ade80',
    expense:         g('--type-expense')           || '#f87171',
    savings:         g('--type-savings')           || '#a78bfa',
    invest:          g('--type-invest')            || '#60a5fa',
    transfer:        g('--type-transfer')          || '#94a3b8',
    cashOut:         g('--type-cash-out')          || '#fb923c',
    incomeEarned:    g('--type-income-earned')     || '#4ade80',
    incomeNotEarned: g('--type-income-not-earned') || '#a78bfa',
    progressBar: g('--color-progress-bar')    || '#4ade80',
    alert:       g('--color-alert')           || '#ef4444',
    warning:     g('--color-warning')         || '#f59e0b',
    accent:      g('--color-accent')          || '#a78bfa',
    lineChart:   g('--color-line-chart')      || '#4ade80',
    barChart:    g('--color-bar-chart')       || '#60a5fa',
  }
}

export function useThemeColors() {
  const [colors, setColors] = useState(readColors)

  useEffect(() => {
    const handler = () => setColors(readColors())
    window.addEventListener('theme-updated', handler)
    // Re-read after mount in case theme loaded async from Supabase
    setColors(readColors())
    return () => window.removeEventListener('theme-updated', handler)
  }, [])

  return colors
}
