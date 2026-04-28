import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useCardPreferences } from '../context/CardPreferencesContext'
import { usePalette } from '../context/PaletteContext'
import { GRADIENTS, SOLIDS } from '../constants/gradients'

// Convert legacy selectedIdx prefs to an actual color value
function idxToColor(tab, idx) {
  const list = tab === 'gradient' ? GRADIENTS : SOLIDS
  const c = list[idx]
  return c ? (typeof c === 'string' ? c : c.value) : null
}

function applyPrefs(p, setters) {
  const { setEnableColor, setShowBorder, setTab, setSelectedColor, setOpacity, setDarkOverlay, setCustomIconColor, setIconColor } = setters
  if (p.enableColor     != null) setEnableColor(p.enableColor)
  if (p.showBorder      != null) setShowBorder(p.showBorder)
  if (p.tab             != null) setTab(p.tab)
  if (p.selectedColor   != null) {
    setSelectedColor(p.selectedColor)
  } else if (p.selectedIdx != null) {
    // Legacy format: convert index → color value
    const c = idxToColor(p.tab ?? 'gradient', p.selectedIdx)
    if (c) setSelectedColor(c)
  }
  if (p.opacity         != null) setOpacity(p.opacity)
  if (p.darkOverlay     != null) setDarkOverlay(p.darkOverlay)
  if (p.customIconColor != null) setCustomIconColor(p.customIconColor)
  if (p.iconColor       != null) setIconColor(p.iconColor)
}

export function useCardCustomization(label) {
  const { prefsMap, loaded, updatePrefs } = useCardPreferences()
  const paletteCtx      = usePalette()
  const activeSolids    = paletteCtx?.activeSolids    ?? SOLIDS
  const activeGradients = paletteCtx?.activeGradients ?? GRADIENTS

  const [open,            setOpen]           = useState(false)
  const [enableColor,     setEnableColor]    = useState(false)
  const [showBorder,      setShowBorder]     = useState(false)
  const [tab,             setTab]            = useState('gradient')
  const [selectedColor,   setSelectedColor]  = useState(null)
  const [opacity,         setOpacity]        = useState(50)
  const [darkOverlay,     setDarkOverlay]    = useState(5)
  const [customIconColor, setCustomIconColor] = useState(false)
  const [iconColor,       setIconColor]      = useState(null)
  const [pos,             setPos]            = useState({ top: 0, left: 0 })

  const initializedRef = useRef(false)
  const dirtyRef       = useRef(false)
  const btnRef         = useRef(null)
  const popupRef       = useRef(null)

  const setters = { setEnableColor, setShowBorder, setTab, setSelectedColor, setOpacity, setDarkOverlay, setCustomIconColor, setIconColor }

  // Apply preferences once the context has loaded them
  useEffect(() => {
    if (!loaded || initializedRef.current) return
    const p = prefsMap[label]
    if (p) applyPrefs(p, setters)
    initializedRef.current = true
  }, [loaded, prefsMap, label])

  // Re-apply when a theme is applied externally
  useEffect(() => {
    function onReset(e) {
      dirtyRef.current = false          // cancel any pending debounced save
      const p = e.detail?.[label]
      if (!p) return
      applyPrefs(p, setters)
    }
    window.addEventListener('card-prefs-reset', onReset)
    return () => window.removeEventListener('card-prefs-reset', onReset)
  }, [label])

  // Debounced save when user explicitly changes settings
  useEffect(() => {
    if (!loaded || !initializedRef.current || !dirtyRef.current) return
    const timer = setTimeout(() => {
      updatePrefs(label, { enableColor, showBorder, tab, selectedColor, opacity, darkOverlay, customIconColor, iconColor })
    }, 600)
    return () => clearTimeout(timer)
  }, [loaded, label, enableColor, showBorder, tab, selectedColor, opacity, darkOverlay, customIconColor, iconColor])

  // Close popup on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (popupRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggleOpen() {
    if (open) { setOpen(false); return }
    const rect       = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < 356  // 340 is the base estimate; flip if tight
      ? Math.max(8, rect.top - 340 - 8)
      : rect.bottom + 8
    setPos({ top, left: Math.max(8, rect.right - 288) })
    setOpen(true)
  }

  // After the popup renders, measure its actual height and clamp to viewport
  useLayoutEffect(() => {
    if (!open || !popupRef.current) return
    const popupRect = popupRef.current.getBoundingClientRect()
    const overflow  = popupRect.bottom - (window.innerHeight - 8)
    if (overflow > 0) setPos(prev => ({ ...prev, top: Math.max(8, prev.top - overflow) }))
  }, [open])

  const colors      = tab === 'gradient' ? activeGradients : activeSolids
  const bgGradient  = enableColor ? selectedColor : null
  const borderStyle = showBorder ? '1px solid var(--color-border)' : 'none'

  function dirty(setter) {
    return (v) => { dirtyRef.current = true; setter(v) }
  }

  return {
    open, setOpen, toggleOpen,
    enableColor,    setEnableColor:    dirty(setEnableColor),
    showBorder,     setShowBorder:     dirty(setShowBorder),
    tab,            setTab:            dirty(setTab),
    selectedColor,  setSelectedColor:  dirty(setSelectedColor),
    opacity,        setOpacity:        dirty(setOpacity),
    darkOverlay,    setDarkOverlay:    dirty(setDarkOverlay),
    customIconColor, setCustomIconColor: dirty(setCustomIconColor),
    iconColor,      setIconColor:      dirty(setIconColor),
    pos, btnRef, popupRef,
    bgGradient, borderStyle,
    colors,
  }
}
