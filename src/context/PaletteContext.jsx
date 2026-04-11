import { createContext, useContext, useState } from 'react'
import { SOLIDS, GRADIENTS } from '../constants/gradients'

const K_PALETTES = 'app_palettes'
const K_ACTIVE   = 'app_palette_active_id'

function uid() { return Math.random().toString(36).slice(2, 10) }
function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

// The built-in default palette — always restorable
function makeDefaultPalette() {
  return { id: 'default', name: 'Default', solids: [...SOLIDS], gradients: GRADIENTS.map(g => ({ ...g })) }
}

const PaletteContext = createContext(null)

export function PaletteProvider({ children }) {
  const [palettes, setPalettes] = useState(() => {
    const saved = loadJSON(K_PALETTES, null)
    if (!saved?.length) return [makeDefaultPalette()]
    // Always ensure a 'default' entry exists
    return saved.some(p => p.id === 'default') ? saved : [makeDefaultPalette(), ...saved]
  })
  const [activePaletteId, setActivePaletteId] = useState(() => loadJSON(K_ACTIVE, 'default') ?? 'default')

  function _savePalettes(next) {
    setPalettes(next)
    saveJSON(K_PALETTES, next)
  }
  function _saveActive(id) {
    setActivePaletteId(id)
    saveJSON(K_ACTIVE, id)
  }

  // Create a new palette duplicated from the currently active one
  function addPalette(name) {
    const id = uid()
    const source = palettes.find(p => p.id === activePaletteId) ?? palettes[0]
    _savePalettes([
      ...palettes,
      { id, name, solids: [...source.solids], gradients: source.gradients.map(g => ({ ...g })) },
    ])
    _saveActive(id)
    return id
  }

  // Delete any palette except 'default'
  function deletePalette(id) {
    if (id === 'default') return
    const next = palettes.filter(p => p.id !== id)
    _savePalettes(next)
    if (activePaletteId === id) _saveActive('default')
  }

  // Replace solids/gradients/name of a palette
  function updatePalette(id, patch) {
    _savePalettes(palettes.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  // Restore the default palette to built-in colors
  function resetDefault() {
    _savePalettes(palettes.map(p => p.id === 'default' ? makeDefaultPalette() : p))
  }

  function setActivePalette(id) { _saveActive(id) }

  const activePalette    = palettes.find(p => p.id === activePaletteId) ?? palettes[0]
  const activeSolids     = activePalette?.solids    ?? SOLIDS
  const activeGradients  = activePalette?.gradients ?? GRADIENTS

  return (
    <PaletteContext.Provider value={{
      palettes, activePaletteId, activePalette,
      activeSolids, activeGradients,
      addPalette, deletePalette, updatePalette, resetDefault, setActivePalette,
    }}>
      {children}
    </PaletteContext.Provider>
  )
}

export const usePalette = () => useContext(PaletteContext)
