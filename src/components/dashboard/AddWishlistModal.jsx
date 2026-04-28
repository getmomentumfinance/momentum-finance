import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Trash2, Building2, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSharedData } from '../../context/SharedDataContext'
import { CategoryPill, CATEGORY_ICONS } from '../shared/CategoryPill'
import { ReceiverAvatar } from '../shared/ReceiverCombobox'
import { useImportance } from '../../hooks/useImportance'
import ImportancePicker from '../shared/ImportancePicker'

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/25'

function IconPickerInline({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
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
        {value && <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="ml-auto text-white/30 hover:text-white/60 transition-colors text-xs">Clear</button>}
        {!value && <button type="button" onClick={() => setOpen(v => !v)} className="ml-auto text-white/30 hover:text-white/60 transition-colors text-xs">{open ? 'Close' : 'Choose'}</button>}
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

function CategorySelect({ value, onChange, options, placeholder = 'None', disabled = false }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref       = useRef(null)
  const searchRef = useRef(null)
  useEffect(() => {
    if (!open) { setSearch(''); return }
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    setTimeout(() => searchRef.current?.focus(), 0)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const selected = options.find(o => o.id === value)
  const q        = search.trim().toLowerCase()
  const filtered = q ? options.filter(o => o.name.toLowerCase().includes(q)) : options
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 bg-[var(--color-dash-card)] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left transition-colors hover:border-white/20 disabled:opacity-30">
        {selected ? <CategoryPill name={selected.name} color={selected.color} icon={selected.icon} /> : <span className="text-white/25">{placeholder}</span>}
        <ChevronDown size={13} className="ml-auto text-white/25 shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
          </div>
          <div className="max-h-44 overflow-y-auto scrollbar-thin">
            {!q && <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="w-full px-3 py-2.5 text-left text-sm text-white/25 hover:bg-white/5 transition-colors">None</button>}
            {filtered.length === 0
              ? <p className="text-xs text-white/30 px-3 py-3">No results</p>
              : filtered.map(opt => (
                  <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setOpen(false) }}
                    className={`w-full flex items-center px-3 py-2 hover:bg-white/5 transition-colors ${value === opt.id ? 'bg-white/8' : ''}`}>
                    <CategoryPill name={opt.name} color={opt.color} icon={opt.icon} />
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

function ReceiverCombobox({ value, onChange, receiverId, onReceiverSelect, onAddReceiver, receivers }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const q = value.trim().toLowerCase()
  const filtered = q.length > 0 ? receivers.filter(r => r.name.toLowerCase().includes(q)).slice(0, 6) : []
  const exactMatch = receivers.find(r => r.name.toLowerCase() === q)
  const showAdd = q.length > 0 && !exactMatch
  const showDropdown = open && (filtered.length > 0 || showAdd)
  function select(r) { onChange(r.name); onReceiverSelect(r.id); setOpen(false) }
  return (
    <div ref={ref} className="relative"
      onBlur={e => { if (!ref.current?.contains(e.relatedTarget)) setOpen(false) }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); onReceiverSelect(null); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Where will you buy it?"
        className={inp}
      />
      {receiverId && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {(() => {
            const r = receivers.find(r => r.id === receiverId)
            return r ? (
              <>
                <ReceiverAvatar receiver={r} />
                <span className="text-xs text-muted">{r.name}</span>
                <button type="button" onClick={() => onReceiverSelect(null)}
                  className="ml-auto text-white/20 hover:text-white/50 transition-colors" tabIndex={-1}>
                  <X size={11} />
                </button>
              </>
            ) : null
          })()}
        </div>
      )}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
          {filtered.map(r => (
            <button key={r.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => select(r)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 transition-colors text-left">
              <ReceiverAvatar receiver={r} />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white">{r.name}</span>
                {r.domain && <span className="text-xs text-muted ml-2">{r.domain}</span>}
              </div>
              <span className="text-[10px] text-white/25 shrink-0">{r.type}</span>
            </button>
          ))}
          {showAdd && (
            <div className="border-t border-white/8">
              <p className="px-3 pt-2 pb-1 text-[10px] text-white/30 uppercase tracking-widest">
                Add <span className="text-white/60 normal-case">"{value.trim()}"</span> as
              </p>
              <div className="flex gap-1.5 px-3 pb-2.5">
                <button type="button" onMouseDown={e => e.preventDefault()}
                  onClick={() => { onAddReceiver(value.trim(), 'business'); setOpen(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white">
                  <Building2 size={12} /> Business
                </button>
                <button type="button" onMouseDown={e => e.preventDefault()}
                  onClick={() => { onAddReceiver(value.trim(), 'person'); setOpen(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white">
                  <UserRound size={12} /> Person
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AddWishlistModal({ onClose, onSaved, item = null }) {
  const isEdit = !!item
  const { user } = useAuth()
  const { categories: sharedCategories, receivers: sharedReceivers } = useSharedData()
  const { importance: importanceOptions } = useImportance()

  const [name,        setName]        = useState(item?.name           ?? '')
  const [icon,        setIcon]        = useState(item?.icon           ?? '')
  const [url,         setUrl]         = useState(item?.url            ?? '')
  const [amount,      setAmount]      = useState(item?.amount         ?? '')
  const [description, setDescription] = useState(item?.description    ?? '')
  const [receiverId,  setReceiverId]  = useState(item?.receiver_id    ?? null)
  const [date,        setDate]        = useState(item?.planned_date   ?? '')
  const [categoryId,  setCategoryId]  = useState(item?.category_id    ?? '')
  const [subId,       setSubId]       = useState(item?.subcategory_id ?? '')
  const [comment,     setComment]     = useState(item?.comment        ?? '')
  const [importance,  setImportance]  = useState(item?.importance     ?? '')
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [extraReceivers, setExtraReceivers] = useState([])

  useEffect(() => { if (!isEdit) setSubId('') }, [categoryId])

  const categories = sharedCategories
  const receivers  = [...sharedReceivers, ...extraReceivers]
  const topCategories = categories.filter(c => !c.parent_id)
  const subcategories = categories.filter(c => c.parent_id === categoryId)

  async function handleAddReceiver(name, type) {
    const { data } = await supabase.from('receivers').insert({
      user_id: user.id, name, type, domain: null, logo_url: null,
    }).select().single()
    if (data) setExtraReceivers(prev => [...prev, data])
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name:           name.trim(),
      icon:           icon            || null,
      url:            url.trim()      || null,
      amount:         amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) : null,
      description:    description.trim() || null,
      receiver_id:    receiverId      || null,
      planned_date:   date            || null,
      category_id:    categoryId      || null,
      subcategory_id: subId           || null,
      comment:        comment.trim()  || null,
      importance:     importance      || null,
    }
    const { error } = isEdit
      ? await supabase.from('wishlist').update(payload).eq('id', item.id)
      : await supabase.from('wishlist').insert({ ...payload, user_id: user.id, status: 'active' })
    if (error) { console.error('wishlist save error:', error.message); setSaving(false); return }
    setSaving(false)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    setDeleting(true)
    await supabase.from('wishlist').delete().eq('id', item.id)
    setDeleting(false)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    onSaved()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[92vh] flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Edit Wishlist Item' : 'Add to Wishlist'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-5 p-6 scrollbar-thin">

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dyson Airwrap" className={inp} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Icon</label>
            <IconPickerInline value={icon} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              URL <span className="text-white/30 normal-case font-normal">(optional)</span>
            </label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                Amount <span className="text-white/30 normal-case font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                <input value={amount} onChange={e => setAmount(e.target.value)}
                  type="number" step="0.01" min="0" placeholder="0,00" className={inp + ' pl-8'} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                Planned Date <span className="text-white/30 normal-case font-normal">(optional)</span>
              </label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className={inp + ' [color-scheme:dark]'} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              Receiver <span className="text-white/30 normal-case font-normal">(optional)</span>
            </label>
            <ReceiverCombobox
              value={description}
              onChange={setDescription}
              receiverId={receiverId}
              onReceiverSelect={setReceiverId}
              onAddReceiver={handleAddReceiver}
              receivers={receivers}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest">Category</label>
              <CategorySelect value={categoryId} onChange={setCategoryId} options={topCategories} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest">Subcategory</label>
              <CategorySelect value={subId} onChange={setSubId} options={subcategories} disabled={!categoryId || subcategories.length === 0} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              Comment <span className="text-white/30 normal-case font-normal">(optional)</span>
            </label>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Add any notes…" rows={3} className={inp + ' resize-none'} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Importance</label>
            <ImportancePicker value={importance} onChange={setImportance} options={importanceOptions} />
          </div>

          <div className="flex gap-3 pt-1">
            {isEdit && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="p-2.5 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-40">
                <Trash2 size={15} />
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-modal-cancel">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving || !name.trim()} className="btn-modal-primary">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Save'}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
