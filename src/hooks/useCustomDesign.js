import { useState, useCallback } from 'react'
import { CUSTOM_DESIGN_DEFAULTS } from '../constants/designs'

const STORAGE_KEY = (userId) => `app_custom_design_${userId ?? 'guest'}`

function hexToRgba(hex, opacity) {
  if (opacity >= 1) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

export const CUSTOM_INLINE_PROPS = [
  '--color-bg-from',
  '--color-bg-to',
  '--color-dash-card',
  '--color-nav-blur',
  '--color-surface',
  '--color-muted',
  '--color-border',
  '--color-input',
]

export function applyCustomVars(vars) {
  const el = document.documentElement
  el.style.setProperty('--color-bg-from',   hexToRgba(vars.bgFrom.hex,   vars.bgFrom.opacity))
  el.style.setProperty('--color-bg-to',     hexToRgba(vars.bgTo.hex,     vars.bgTo.opacity))
  el.style.setProperty('--color-dash-card', hexToRgba(vars.dashCard.hex, vars.dashCard.opacity))
  el.style.setProperty('--color-nav-blur',  hexToRgba(vars.navBlur.hex,  vars.navBlur.opacity))
  el.style.setProperty('--color-surface',   hexToRgba(vars.surface.hex,  vars.surface.opacity))
  el.style.setProperty('--color-muted',     hexToRgba(vars.muted.hex,    vars.muted.opacity))
  el.style.setProperty('--color-border',    hexToRgba(vars.border.hex,   vars.border.opacity))
  el.style.setProperty('--color-input',     hexToRgba(vars.input.hex,    vars.input.opacity))
}

export function clearCustomVars() {
  CUSTOM_INLINE_PROPS.forEach(p => document.documentElement.style.removeProperty(p))
}

export function useCustomDesign(userId) {
  const [vars, setVars] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY(userId)))
      return saved ? { ...CUSTOM_DESIGN_DEFAULTS, ...saved } : CUSTOM_DESIGN_DEFAULTS
    } catch {
      return CUSTOM_DESIGN_DEFAULTS
    }
  })

  const updateVar = useCallback((key, patch) => {
    setVars(prev => {
      const next = { ...prev, [key]: { ...prev[key], ...patch } }
      localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(next))
      applyCustomVars(next)
      return next
    })
  }, [userId])

  const resetToDefaults = useCallback(() => {
    setVars(CUSTOM_DESIGN_DEFAULTS)
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(CUSTOM_DESIGN_DEFAULTS))
    applyCustomVars(CUSTOM_DESIGN_DEFAULTS)
  }, [userId])

  return { vars, updateVar, resetToDefaults }
}
