import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Check } from 'lucide-react'

// ─── Gradient helpers ──────────────────────────────────────────────────────────

function parseGradient(value) {
  if (!value) return { type: 'linear', angle: 135, stops: ['#cccccc', '#888888'] }
  const isRadial  = value.startsWith('radial')
  const hexes     = [...value.matchAll(/#[0-9a-fA-F]{6}/gi)].map(m => m[0])
  const angleMatch = value.match(/(\d+)deg/)
  return {
    type:  isRadial ? 'radial' : 'linear',
    angle: angleMatch ? parseInt(angleMatch[1]) : 135,
    stops: hexes.length >= 2 ? hexes : ['#cccccc', '#888888'],
  }
}

function buildGradient({ type, angle, stops }) {
  const s = stops.join(', ')
  return type === 'radial'
    ? `radial-gradient(circle farthest-corner at 6.3% 21.8%, ${s})`
    : `linear-gradient(${angle}deg, ${s})`
}

function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/i.test(v) }

// ─── Solid swatch editor ───────────────────────────────────────────────────────

function SolidEditor({ initial, isNew, onConfirm, onRemove, onCancel }) {
  const [hex, setHex] = useState(initial ?? '#cccccc')
  const safeHex = isValidHex(hex) ? hex : (isValidHex(initial) ? initial : '#cccccc')

  function commit() { onConfirm(safeHex) }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10">
      <label className="relative w-8 h-8 rounded-lg overflow-hidden cursor-pointer border border-white/20 shrink-0">
        <input
          type="color"
          value={safeHex}
          onChange={e => setHex(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-full h-full" style={{ background: safeHex }} />
      </label>
      <input
        autoFocus
        type="text"
        value={hex}
        onChange={e => setHex(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel() }}
        maxLength={7}
        placeholder="#rrggbb"
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white/30 min-w-0"
      />
      <button type="button" onClick={commit}
        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors shrink-0">
        <Check size={12} />
      </button>
      {!isNew && onRemove && (
        <button type="button" onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/35 hover:text-red-400 transition-colors shrink-0">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

// ─── Gradient editor ───────────────────────────────────────────────────────────

function GradientEditor({ initial, isNew, onConfirm, onRemove, onCancel }) {
  const parsed = parseGradient(initial?.value)
  const [name,  setName]  = useState(initial?.name ?? '')
  const [type,  setType]  = useState(parsed.type)
  const [angle, setAngle] = useState(parsed.angle)
  const [stops, setStops] = useState(parsed.stops)

  const preview = buildGradient({ type, angle, stops })

  function updateStop(i, val) { setStops(s => s.map((c, idx) => idx === i ? val : c)) }
  function addStop()           { if (stops.length < 4) setStops(s => [...s, '#cccccc']) }
  function removeStop(i)       { if (stops.length > 2) setStops(s => s.filter((_, idx) => idx !== i)) }

  function commit() {
    onConfirm({ name: name.trim() || 'Gradient', value: preview })
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
      {/* Preview */}
      <div className="h-9 rounded-lg" style={{ background: preview }} />

      {/* Name */}
      <input
        autoFocus
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
        placeholder="Gradient name…"
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
      />

      {/* Type + angle */}
      <div className="flex items-center gap-3">
        <div className="flex bg-white/5 rounded-lg p-0.5 shrink-0">
          {['linear', 'radial'].map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`px-2.5 py-1 text-[10px] rounded-md transition-colors capitalize ${type === t ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
              {t}
            </button>
          ))}
        </div>
        {type === 'linear' && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] text-white/40 shrink-0">Angle</span>
            <input
              type="range" min="0" max="360"
              value={angle}
              onChange={e => setAngle(Number(e.target.value))}
              className="flex-1 h-1 accent-white/60 min-w-0"
            />
            <span className="text-[10px] text-white/70 w-9 text-right tabular-nums shrink-0">{angle}°</span>
          </div>
        )}
      </div>

      {/* Color stops */}
      <div className="flex flex-col gap-1.5">
        {stops.map((stop, i) => {
          const safe = isValidHex(stop) ? stop : '#cccccc'
          return (
            <div key={i} className="flex items-center gap-2">
              <label className="relative w-6 h-6 rounded-md overflow-hidden cursor-pointer border border-white/20 shrink-0">
                <input type="color" value={safe} onChange={e => updateStop(i, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-full h-full" style={{ background: safe }} />
              </label>
              <input
                type="text" value={stop}
                onChange={e => updateStop(i, e.target.value)}
                maxLength={7}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-white/30 min-w-0"
              />
              {stops.length > 2 && (
                <button type="button" onClick={() => removeStop(i)}
                  className="text-white/25 hover:text-red-400 transition-colors shrink-0 p-0.5">
                  <X size={10} />
                </button>
              )}
            </div>
          )
        })}
        {stops.length < 4 && (
          <button type="button" onClick={addStop}
            className="flex items-center gap-1 text-[10px] text-white/35 hover:text-white/60 transition-colors mt-0.5 w-fit">
            <Plus size={10} /> Add stop
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-0.5">
        <button type="button" onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg text-xs text-white/50 hover:text-white border border-white/10 transition-colors">
          Cancel
        </button>
        {!isNew && onRemove && (
          <button type="button" onClick={onRemove}
            className="py-1.5 px-3 rounded-lg text-xs text-white/35 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        )}
        <button type="button" onClick={commit}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/15 transition-colors">
          {isNew ? 'Add' : 'Update'}
        </button>
      </div>
    </div>
  )
}

// ─── Main modal ────────────────────────────────────────────────────────────────

export default function PaletteEditorModal({ palette, onSave, onClose }) {
  const [name,      setName]      = useState(palette.name)
  const [solids,    setSolids]    = useState([...palette.solids])
  const [gradients, setGradients] = useState(palette.gradients.map(g => ({ ...g })))
  const [tab,       setTab]       = useState('solids')
  // null = none open, -1 = adding new, >=0 = editing that index
  const [editingIdx, setEditingIdx] = useState(null)

  function switchTab(t) { setTab(t); setEditingIdx(null) }

  // ── Solid handlers
  function confirmSolid(hex) {
    if (editingIdx === -1) setSolids(s => [...s, hex])
    else setSolids(s => s.map((c, i) => i === editingIdx ? hex : c))
    setEditingIdx(null)
  }
  function removeSolid(i) { setSolids(s => s.filter((_, idx) => idx !== i)); setEditingIdx(null) }

  // ── Gradient handlers
  function confirmGradient(grad) {
    if (editingIdx === -1) setGradients(g => [...g, grad])
    else setGradients(g => g.map((c, i) => i === editingIdx ? grad : c))
    setEditingIdx(null)
  }
  function removeGradient(i) { setGradients(g => g.filter((_, idx) => idx !== i)); setEditingIdx(null) }

  function handleSave() {
    onSave({ ...palette, name: name.trim() || palette.name, solids, gradients })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-popup border border-white/10 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">Edit Palette</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Name */}
        <div className="px-6 py-4 border-b border-white/5 shrink-0">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Palette name…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Tab bar */}
        <div className="flex px-6 pt-3 pb-1 shrink-0">
          <div className="flex bg-white/5 rounded-xl p-0.5">
            {[['solids', `Solids (${solids.length}/54)`], ['gradients', `Gradients (${gradients.length})`]].map(([t, label]) => (
              <button key={t} type="button" onClick={() => switchTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div key={tab} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 tab-fade-in">

          {/* ── Solids ── */}
          {tab === 'solids' && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}>
                {solids.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    title={c}
                    onClick={() => setEditingIdx(editingIdx === i ? null : i)}
                    className={`w-full aspect-square rounded-lg transition-all ${
                      editingIdx === i
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--color-dash-card)]'
                        : 'hover:scale-110'
                    }`}
                    style={{ background: c }}
                  />
                ))}
                {solids.length < 54 && (
                  <button
                    type="button"
                    onClick={() => setEditingIdx(editingIdx === -1 ? null : -1)}
                    className={`w-full aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                      editingIdx === -1
                        ? 'border-white/50 text-white/70'
                        : 'border-white/15 text-white/25 hover:border-white/30 hover:text-white/50'
                    }`}
                  >
                    <Plus size={11} />
                  </button>
                )}
              </div>

              {editingIdx !== null && (
                <SolidEditor
                  initial={editingIdx === -1 ? '#cccccc' : solids[editingIdx]}
                  isNew={editingIdx === -1}
                  onConfirm={confirmSolid}
                  onRemove={editingIdx >= 0 ? () => removeSolid(editingIdx) : undefined}
                  onCancel={() => setEditingIdx(null)}
                />
              )}

              {solids.length === 0 && editingIdx === null && (
                <p className="text-xs text-muted italic text-center py-4">No solid colors yet — click + to add one.</p>
              )}
            </div>
          )}

          {/* ── Gradients ── */}
          {tab === 'gradients' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-2">
                {gradients.map((g, i) => (
                  <button
                    key={i}
                    type="button"
                    title={g.name}
                    onClick={() => setEditingIdx(editingIdx === i ? null : i)}
                    className={`relative h-14 rounded-xl transition-all ${
                      editingIdx === i
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--color-dash-card)]'
                        : 'hover:scale-105'
                    }`}
                    style={{ background: g.value }}
                  >
                    <span className="absolute bottom-1 left-1 right-1">
                      <span className="text-[8px] text-white/80 bg-black/30 px-1 py-0.5 rounded truncate block leading-tight">
                        {g.name}
                      </span>
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setEditingIdx(editingIdx === -1 ? null : -1)}
                  className={`h-14 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${
                    editingIdx === -1
                      ? 'border-white/50 text-white/70'
                      : 'border-white/15 text-white/25 hover:border-white/30 hover:text-white/50'
                  }`}
                >
                  <Plus size={14} />
                </button>
              </div>

              {editingIdx !== null && (
                <GradientEditor
                  initial={editingIdx === -1 ? null : gradients[editingIdx]}
                  isNew={editingIdx === -1}
                  onConfirm={confirmGradient}
                  onRemove={editingIdx >= 0 ? () => removeGradient(editingIdx) : undefined}
                  onCancel={() => setEditingIdx(null)}
                />
              )}

              {gradients.length === 0 && editingIdx === null && (
                <p className="text-xs text-muted italic text-center py-4">No gradients yet — click + to build one.</p>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-white/5 shrink-0 flex gap-3">
          <button type="button" onClick={onClose} className="btn-modal-cancel">Cancel</button>
          <button type="button" onClick={handleSave} className="btn-modal-primary">Save changes</button>
        </div>

      </div>
    </div>,
    document.body
  )
}
