import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CATEGORY_ICONS } from '../shared/CategoryPill'
import ColorPickerPopup, { useColorPicker } from '../shared/ColorPickerPopup'
import { usePreferences } from '../../context/UserPreferencesContext'

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/25'

function IconPickerInline({ value, onChange }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const q        = query.trim().toLowerCase()
  const filtered = q
    ? CATEGORY_ICONS.filter(({ id, group }) => id.includes(q) || group.toLowerCase().includes(q))
    : CATEGORY_ICONS
  const selected = CATEGORY_ICONS.find(i => i.id === value)
  function pick(id) { onChange(id); setOpen(false); setQuery('') }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(v => !v)}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-white/25 flex items-center justify-center shrink-0 transition-colors">
          {selected ? <selected.Icon size={16} className="text-white/70" /> : <span className="text-white/20 text-xs">—</span>}
        </button>
        <span className="text-sm text-white/40">{selected ? selected.id : 'No icon'}</span>
        {value
          ? <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="ml-auto text-white/30 hover:text-white/60 transition-colors text-xs">Clear</button>
          : <button type="button" onClick={() => setOpen(v => !v)} className="ml-auto text-white/30 hover:text-white/60 transition-colors text-xs">{open ? 'Close' : 'Choose'}</button>
        }
      </div>
      {open && (
        <div className="flex flex-col gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search icons…" autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/25" />
          <div className="max-h-32 overflow-y-auto scrollbar-thin grid grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-1 bg-white/[0.03] rounded-xl p-2 border border-white/8">
            {filtered.map(({ id, Icon }) => (
              <button key={id} type="button" onClick={() => pick(id)} title={id}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${value === id ? 'bg-white/20 text-white' : 'text-white/40 hover:bg-white/10 hover:text-white/80'}`}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AddSavingsGoalModal({ goal = null, available, onClose, onSaved }) {
  const isEdit = !!goal
  const { user } = useAuth()
  const { fmt } = usePreferences()

  const [name,      setName]      = useState(goal?.name             ?? '')
  const [icon,      setIcon]      = useState(goal?.icon             ?? '')
  const [color,     setColor]     = useState(goal?.color            ?? '#a78bfa')
  const [allocated, setAllocated] = useState(goal?.allocated_amount ?? '')
  const [target,    setTarget]    = useState(goal?.target_amount    ?? '')
  const [note,      setNote]      = useState(goal?.note             ?? '')
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  const colorPicker = useColorPicker()

  // When editing, the goal's current allocation is freed up
  const maxAllocate = isEdit ? available + (goal?.allocated_amount ?? 0) : available

  const selectedIcon = CATEGORY_ICONS.find(i => i.id === icon)

  async function handleSave() {
    if (!name.trim()) return
    const allocatedNum = Math.min(Math.max(parseFloat(allocated) || 0, 0), maxAllocate)
    setSaving(true)
    const payload = {
      name:             name.trim(),
      icon:             icon || null,
      color,
      allocated_amount: allocatedNum,
      target_amount:    target && !isNaN(parseFloat(target)) ? parseFloat(target) : null,
      note:             note.trim() || null,
      // preserve monthly_transfer if already set (slider on savings page handles it separately)
      ...(isEdit && goal.monthly_transfer != null ? { monthly_transfer: goal.monthly_transfer } : {}),
    }
    const { error } = isEdit
      ? await supabase.from('savings_goals').update(payload).eq('id', goal.id)
      : await supabase.from('savings_goals').insert({ ...payload, user_id: user.id })
    if (error) { console.error(error); setSaving(false); return }
    setSaving(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${goal.name}"?`)) return
    setDeleting(true)
    await supabase.from('savings_goals').delete().eq('id', goal.id)
    setDeleting(false)
    onSaved()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-2xl w-full max-w-md flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Edit Goal' : 'New Savings Goal'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-5 p-6 scrollbar-thin">

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Goal name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Emergency fund" className={inp} autoFocus />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Icon</label>
            <IconPickerInline value={icon} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Color</label>
            <div className="flex items-center gap-3">
              <button
                ref={colorPicker.btnRef}
                type="button"
                onClick={() => colorPicker.toggle(true)}
                className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors shrink-0"
                style={{ background: color }}
                title="Choose color"
              />
              <span className="text-sm text-white/40 truncate">{color}</span>
            </div>
            {colorPicker.open && (
              <ColorPickerPopup
                popupRef={colorPicker.popupRef}
                pos={colorPicker.pos}
                selected={color}
                showGradients
                onSelect={c => { setColor(c); colorPicker.setOpen(false) }}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest flex items-center justify-between">
              Allocate from savings
              <span className="normal-case font-normal text-white/30">{fmt(maxAllocate)} available</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
              <input value={allocated} onChange={e => setAllocated(e.target.value)}
                type="number" step="0.01" min="0" max={maxAllocate}
                placeholder="0,00" className={inp + ' pl-8'} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              Target amount <span className="text-white/30 normal-case font-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
              <input value={target} onChange={e => setTarget(e.target.value)}
                type="number" step="0.01" min="0"
                placeholder="0,00" className={inp + ' pl-8'} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              Note <span className="text-white/30 normal-case font-normal">(optional)</span>
            </label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="What are you saving for?" className={inp} />
          </div>

          <div className="flex gap-3 pt-1">
            {isEdit && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="p-2.5 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-40">
                <Trash2 size={15} />
              </button>
            )}
            <button type="button" onClick={onClose}
              className="btn-modal-cancel">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !name.trim()}
              className="btn-modal-primary">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
