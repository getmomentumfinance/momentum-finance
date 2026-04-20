import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { SOLIDS, GRADIENTS } from '../../constants/gradients'
import { usePalette } from '../../context/PaletteContext'

export function useColorPicker() {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, left: 0 })
  const btnRef   = useRef(null)
  const popupRef = useRef(null)

  function toggle(showGradients = false) {
    if (!btnRef.current) return
    const rect        = btnRef.current.getBoundingClientRect()
    const popupWidth  = 288
    const popupHeight = showGradients ? 268 : 220
    const spaceBelow  = window.innerHeight - rect.bottom
    const top = spaceBelow < popupHeight + 16
      ? rect.top - popupHeight - 8
      : rect.bottom + 8
    setPos({ top, left: rect.right - popupWidth })
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (popupRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return { open, setOpen, pos, btnRef, popupRef, toggle }
}

export default function ColorPickerPopup({ popupRef, pos, onSelect, showGradients = false, selected }) {
  const [tab, setTab] = useState('solid')

  // Read from active palette when available, fall back to built-in constants
  const paletteCtx  = usePalette()
  const solids    = paletteCtx?.activeSolids    ?? SOLIDS
  const gradients = paletteCtx?.activeGradients ?? GRADIENTS

  const colors = tab === 'gradient' ? gradients : solids

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[999] w-72 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{
        top: pos.top, left: pos.left,
        background: 'color-mix(in srgb, var(--color-dash-card) 78%, transparent)',
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(var(--card-blur, 14px))',
        WebkitBackdropFilter: 'blur(var(--card-blur, 14px))',
      }}
    >
      <div className="flex flex-col gap-4 p-4">
        {showGradients && (
          <div className="flex bg-white/5 rounded-xl p-0.5">
            {['solid', 'gradient'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs rounded-lg transition-colors capitalize font-medium
                  ${tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                {t === 'gradient' ? '✦ Gradient' : 'Solid'}
              </button>
            ))}
          </div>
        )}

        <div key={tab} className="grid grid-cols-6 gap-1.5 tab-fade-in">
          {colors.map((c, i) => {
            const bg   = typeof c === 'string' ? c : c.value
            const name = typeof c === 'string' ? c : c.name
            const isSelected = selected && bg === selected
            return (
              <button
                key={i}
                type="button"
                title={name}
                onClick={() => onSelect(bg)}
                className={`w-9 h-9 rounded-full transition-transform hover:scale-110 ${
                  isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--color-dash-card)]' : ''
                }`}
                style={{ background: bg }}
              />
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
