import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCards } from '../../hooks/useCards'
import { CategoryPill, CATEGORY_ICONS } from '../shared/CategoryPill'
import { ReceiverCombobox } from '../shared/ReceiverCombobox'
import { useImportance } from '../../hooks/useImportance'
import ImportancePicker from '../shared/ImportancePicker'

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/25'
const sel = 'w-full appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-sm text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer'

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
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-white/25 flex items-center justify-center shrink-0 transition-colors"
        >
          {selected ? <selected.Icon size={16} className="text-white/70" /> : <span className="text-white/20 text-xs">—</span>}
        </button>
        <span className="text-sm text-white/40">{selected ? selected.id : 'No icon'}</span>
        {value && (
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            className="ml-auto text-white/30 hover:text-white/60 transition-colors text-xs">
            Clear
          </button>
        )}
        {!value && (
          <button type="button" onClick={() => setOpen(v => !v)}
            className="ml-auto text-white/30 hover:text-white/60 transition-colors text-xs">
            {open ? 'Close' : 'Choose'}
          </button>
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search icons…"
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/25"
          />
          <div className="max-h-32 overflow-y-auto scrollbar-thin grid grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-1 bg-white/[0.03] rounded-xl p-2 border border-white/8">
            {filtered.map(({ id, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => pick(id)}
                title={id}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                  ${value === id ? 'bg-white/20 text-white' : 'text-white/40 hover:bg-white/10 hover:text-white/80'}`}
              >
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
    const handler = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    setTimeout(() => searchRef.current?.focus(), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => o.id === value)
  const q        = search.trim().toLowerCase()
  const filtered = q ? options.filter(o => o.name.toLowerCase().includes(q)) : options

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 bg-[var(--color-dash-card)] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left transition-colors hover:border-white/20 disabled:opacity-30">
        {selected
          ? <CategoryPill name={selected.name} color={selected.color} icon={selected.icon} />
          : <span className="text-white/25">{placeholder}</span>}
        <ChevronDown size={13} className="ml-auto text-white/25 shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
          </div>
          <div className="max-h-44 overflow-y-auto scrollbar-thin">
            {!q && (
              <button type="button" onClick={() => { onChange(''); setOpen(false) }}
                className="w-full px-3 py-2.5 text-left text-sm text-white/25 hover:bg-white/5 transition-colors">
                None
              </button>
            )}
            {filtered.length === 0
              ? <p className="text-xs text-white/30 px-3 py-3">No results</p>
              : filtered.map(opt => (
                  <button key={opt.id} type="button"
                    onClick={() => { onChange(opt.id); setOpen(false) }}
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

export default function AddPendingModal({ onClose, onSaved, item = null }) {
  const isEdit = !!item
  const { user } = useAuth()
  const { cards } = useCards()
  const { importance: importanceOptions } = useImportance()

  const [name,       setName]       = useState(item?.name        ?? '')
  const [icon,       setIcon]       = useState(item?.icon        ?? '')
  const [receiverId, setReceiverId] = useState(item?.receiver_id ?? '')
  const [amount,     setAmount]     = useState(item?.amount      ?? '')
  const [payBefore,  setPayBefore]  = useState(item?.pay_before  ?? '')
  const [categoryId, setCategoryId] = useState(item?.category_id    ?? '')
  const [subId,      setSubId]      = useState(item?.subcategory_id ?? '')
  const [cardId,     setCardId]     = useState(item?.card_id     ?? '')
  const [comment,    setComment]    = useState(item?.comment     ?? '')
  const [importance, setImportance] = useState(item?.importance  ?? '')
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [categories, setCategories] = useState([])
  const [receivers,  setReceivers]  = useState([])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('categories').select('*').eq('user_id', user.id)
      .then(({ data }) => setCategories(data ?? []))
    supabase.from('receivers').select('*').eq('user_id', user.id).order('name')
      .then(({ data }) => setReceivers(data ?? []))
  }, [user?.id])

  useEffect(() => { if (!isEdit) setSubId('') }, [categoryId])

  const topCategories  = categories.filter(c => !c.parent_id)
  const subcategories  = categories.filter(c => c.parent_id === categoryId)
  const availableCards = (cards ?? []).filter(c => c.type !== 'savings' && c.type !== 'cash')

  async function handleAddReceiver(name, type) {
    const { data } = await supabase.from('receivers').insert({
      user_id: user.id, name, type, domain: null, logo_url: null,
    }).select().single()
    if (data) setReceivers(prev => [...prev, data])
  }

  function parseAmount(val) { return parseFloat(String(val).replace(',', '.')) }

  async function handleSave() {
    if (!amount || isNaN(parseAmount(amount)) || !payBefore) return
    setSaving(true)
    const payload = {
      name:           name.trim(),
      icon:           icon        || null,
      receiver_id:    receiverId  || null,
      amount:         parseAmount(amount),
      pay_before:     payBefore,
      category_id:    categoryId  || null,
      subcategory_id: subId       || null,
      card_id:        cardId      || null,
      comment:        comment.trim() || null,
      importance:     importance     || null,
    }
    const { error } = isEdit
      ? await supabase.from('pending_items').update(payload).eq('id', item.id)
      : await supabase.from('pending_items').insert({ ...payload, user_id: user.id, status: 'pending' })
    if (error) { console.error('pending_items save error:', error.message); setSaving(false); return }
    setSaving(false)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    setDeleting(true)
    if (item.transaction_id) {
      await supabase.from('transactions').delete().eq('id', item.transaction_id)
    }
    await supabase.from('pending_items').delete().eq('id', item.id)
    setDeleting(false)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    onSaved()
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-popup border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Edit Pending Item' : 'Add Pending Item'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex flex-col gap-5 p-6 scrollbar-thin">

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              Description <span className="text-white/30 normal-case font-normal">(optional)</span>
            </label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New phone" className={inp} />
          </div>

          {/* Icon */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Icon</label>
            <IconPickerInline value={icon} onChange={setIcon} />
          </div>

          {/* Receiver */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Receiver</label>
            <ReceiverCombobox
              receiverId={receiverId}
              onReceiverSelect={setReceiverId}
              receivers={receivers}
              onAddReceiver={handleAddReceiver}
              inputClass={inp}
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
              <input
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                type="text" inputMode="decimal" placeholder="0,00"
                className={inp + ' pl-8'}
              />
            </div>
          </div>

          {/* Pay before */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Pay before</label>
            <input
              type="date"
              value={payBefore}
              onChange={e => setPayBefore(e.target.value)}
              className={inp + ' [color-scheme:dark]'}
            />
          </div>

          {/* Category + Subcategory */}
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

          {/* Card */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Card</label>
            <select value={cardId} onChange={e => setCardId(e.target.value)} className={sel}>
              <option value="">No card</option>
              {availableCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              Comment <span className="text-white/30 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment…"
              rows={3}
              className={inp + ' resize-none'}
            />
          </div>

          {/* Importance */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Importance</label>
            <ImportancePicker value={importance} onChange={setImportance} options={importanceOptions} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="p-2.5 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-40"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !amount || !payBefore}
              className="btn-modal-primary"
            >
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Save'}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
