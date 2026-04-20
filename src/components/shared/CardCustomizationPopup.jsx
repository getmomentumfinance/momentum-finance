import { createPortal } from 'react-dom'

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-accent' : 'bg-white/20'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

function Label({ children }) {
  return <p className="text-[10px] text-white/40 uppercase tracking-widest">{children}</p>
}

export default function CardCustomizationPopup({
  popupRef, pos,
  enableColor, setEnableColor,
  showBorder, setShowBorder,
  tab, setTab,
  selectedColor, setSelectedColor,
  opacity, setOpacity,
  darkOverlay, setDarkOverlay,
  colors,
}) {
  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[999] w-72 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ top: pos.top, left: pos.left, background: 'color-mix(in srgb, var(--color-dash-card) 78%, transparent)', border: '1px solid var(--color-border)', backdropFilter: 'blur(var(--card-blur, 14px))', WebkitBackdropFilter: 'blur(var(--card-blur, 14px))' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Toggle checked={enableColor} onChange={setEnableColor} />
          <span className="text-sm font-medium text-white">Enable Color</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Border</span>
          <Toggle checked={showBorder} onChange={setShowBorder} />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Solid / Gradient tabs */}
        <div className="flex bg-white/5 rounded-xl p-0.5">
          {['solid', 'gradient'].map((t) => (
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

        {/* Colour swatches */}
        <div key={tab} className="tab-fade-in">
          <Label>Color</Label>
          <div className="grid grid-cols-6 gap-1.5 mt-2">
            {colors.map((c, i) => {
              const bg   = typeof c === 'string' ? c : c.value
              const name = typeof c === 'string' ? undefined : c.name
              const isSelected = enableColor && bg === selectedColor
              return (
                <button
                  key={i}
                  type="button"
                  title={name}
                  onClick={() => { setSelectedColor(bg); setEnableColor(true) }}
                  className={`w-9 h-9 rounded-full transition-transform hover:scale-110 ${
                    isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--color-dash-card)]' : ''
                  }`}
                  style={{ background: bg }}
                />
              )
            })}
          </div>
        </div>

        {/* Opacity */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label>Opacity</Label>
            <span className="text-[10px] text-white/40">{opacity}%</span>
          </div>
          <input type="range" min={0} max={100} value={opacity}
            onChange={(e) => setOpacity(+e.target.value)} className="w-full" style={{ accentColor: 'var(--color-progress-bar)' }} />
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={() => {
            setEnableColor(false)
            setShowBorder(false)
            setTab('gradient')
            setSelectedColor(null)
            setOpacity(50)
            setDarkOverlay(5)
          }}
          className="flex items-center gap-2 text-xs text-red-400/70 hover:text-red-400 transition-colors pt-3 border-t border-white/8 w-fit"
        >
          ↺ Reset to Default
        </button>
      </div>
    </div>,
    document.body
  )
}
