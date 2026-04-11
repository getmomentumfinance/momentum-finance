import { useState, useEffect, useCallback } from 'react'
import { DESIGNS, DEFAULT_DESIGN_ID, CUSTOM_DESIGN_DEFAULTS } from '../constants/designs'
import { applyCustomVars, clearCustomVars } from './useCustomDesign'

const storageKey = userId => `app_design_${userId}`
const customVarsKey = userId => `app_custom_design_${userId ?? 'guest'}`

export function getDesignById(id) {
  return DESIGNS.find(d => d.id === id) ?? DESIGNS.find(d => d.id === DEFAULT_DESIGN_ID)
}

export function applyDesign(design, userId) {
  document.documentElement.setAttribute('data-design', design.id)
  if (design.id === 'custom') {
    try {
      const saved = JSON.parse(localStorage.getItem(customVarsKey(userId)))
      applyCustomVars(saved ? { ...CUSTOM_DESIGN_DEFAULTS, ...saved } : CUSTOM_DESIGN_DEFAULTS)
    } catch {
      applyCustomVars(CUSTOM_DESIGN_DEFAULTS)
    }
  } else {
    clearCustomVars()
  }
}

export function useDesign(userId) {
  const [activeId, setActiveId] = useState(DEFAULT_DESIGN_ID)

  useEffect(() => {
    const saved = userId
      ? (localStorage.getItem(storageKey(userId)) ?? DEFAULT_DESIGN_ID)
      : DEFAULT_DESIGN_ID
    setActiveId(saved)
    applyDesign(getDesignById(saved), userId)
  }, [userId])

  const setDesign = useCallback((designId) => {
    const design = getDesignById(designId)
    applyDesign(design, userId)
    setActiveId(designId)
    if (userId) localStorage.setItem(storageKey(userId), designId)
  }, [userId])

  return { activeId, setDesign }
}
