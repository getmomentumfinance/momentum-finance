import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Banknote, ChevronDown, Building2, UserRound, Calendar, Scissors, Plus } from 'lucide-react'
import SplitTransactionModal from './SplitTransactionModal'
import { TRANSACTION_TYPES as TYPES } from '../../constants/transactionTypes'
import { useImportance } from '../../hooks/useImportance'
import { fetchHistoricalPrice, fetchLivePrice } from '../../lib/yahooFinance'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useCards } from '../../hooks/useCards'
import { CategoryPill } from '../shared/CategoryPill'
import { ReceiverAvatar as SharedReceiverAvatar } from '../shared/ReceiverCombobox'

// ── Category custom select ────────────────────────────────────
function CategorySelect({ value, onChange, options, placeholder = 'Empty', disabled = false }) {
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
              placeholder="Search…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
          </div>
          <div className="max-h-44 overflow-y-auto scrollbar-thin">
            {!q && <button type="button" onClick={() => { onChange(''); setOpen(false) }}
              className="w-full px-3 py-2.5 text-left text-sm text-white/25 hover:bg-white/5 transition-colors">Empty</button>}
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

// Use shared ReceiverAvatar
const ReceiverAvatar = ({ receiver }) => <SharedReceiverAvatar receiver={receiver} size="sm" />

// ── Description combobox ──────────────────────────────────────
function DescriptionCombobox({ value, onChange, receiverId, onReceiverSelect, onAddReceiver, receivers, inputClass }) {
  const [open, setOpen] = useState(false)
  const ref  = useRef(null)

  const q        = value.trim().toLowerCase()
  const filtered = q.length > 0
    ? receivers.filter(r => r.name.toLowerCase().includes(q)).slice(0, 6)
    : []
  const exactMatch  = receivers.find(r => r.name.toLowerCase() === q)
  const showAdd     = q.length > 0 && !exactMatch
  const showDropdown = open && (filtered.length > 0 || showAdd)

  function select(receiver) {
    onChange(receiver.name)
    onReceiverSelect(receiver.id)
    setOpen(false)
  }

  return (
    <div
      ref={ref}
      className="relative"
      onBlur={e => { if (!ref.current?.contains(e.relatedTarget)) setOpen(false) }}
    >
      <input
        value={value}
        onChange={e => { onChange(e.target.value); onReceiverSelect(null); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="What was this for?"
        className={inputClass}
      />

      {/* Linked receiver badge */}
      {receiverId && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {(() => {
            const r = receivers.find(r => r.id === receiverId)
            return r ? (
              <>
                <ReceiverAvatar receiver={r} />
                <span className="text-xs text-muted">{r.name}</span>
                <button
                  type="button"
                  onClick={() => onReceiverSelect(null)}
                  className="ml-auto text-white/20 hover:text-white/50 transition-colors"
                  tabIndex={-1}
                >
                  <X size={11} />
                </button>
              </>
            ) : null
          })()}
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
          {filtered.map(r => (
            <button
              key={r.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => select(r)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 transition-colors text-left"
            >
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
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onAddReceiver(value.trim(), 'business'); setOpen(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white"
                >
                  <Building2 size={12} /> Business
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onAddReceiver(value.trim(), 'person'); setOpen(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white"
                >
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


// ── Ticker combobox ───────────────────────────────────────────
function TickerCombobox({ value, onChange, tickers, onAddToList, inputClass }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const q = value.trim().toUpperCase()
  const filtered = q
    ? tickers.filter(t => t.symbol.includes(q) || (t.name ?? '').toUpperCase().includes(q)).slice(0, 8)
    : tickers.slice(0, 8)
  const exactMatch = tickers.some(t => t.symbol === q)
  const showAdd = q.length > 0 && !exactMatch
  const showDropdown = open && (filtered.length > 0 || showAdd)

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="AAPL"
        className={inputClass + ' uppercase'}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-30 shadow-xl max-h-52 overflow-y-auto">
          {filtered.map(t => (
            <button
              key={t.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(t.symbol); setOpen(false) }}
              className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center justify-between gap-3"
            >
              <span className="text-sm text-white font-mono">{t.symbol}</span>
              {t.name && <span className="text-xs text-white/35 truncate">{t.name}</span>}
            </button>
          ))}
          {showAdd && (
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onAddToList(q); setOpen(false) }}
              className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-2 border-t border-white/[0.06]"
            >
              <Plus size={11} className="text-white/40 shrink-0" />
              <span className="text-xs text-white/40">Add <span className="font-mono text-white/60">{q}</span> to list</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const STATUSES = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending',   label: 'Pending'   },
  { value: 'cancelled', label: 'Cancelled' },
]

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/25'
const sel = 'w-full appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-sm text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer'

function Toggle({ label, on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 group"
    >
      <div className={`w-7 h-[15px] rounded-full flex items-center px-[2px] transition-colors shrink-0 ${on ? 'bg-white/40' : 'bg-white/10 group-hover:bg-white/15'}`}>
        <div className={`w-[11px] h-[11px] rounded-full bg-white transition-transform ${on ? 'translate-x-[13px]' : ''}`} />
      </div>
      <span className={`text-xs transition-colors ${on ? 'text-white/70' : 'text-white/35 group-hover:text-white/50'}`}>{label}</span>
    </button>
  )
}

function ImportancePicker({ value, onChange, options }) {
  return (
    <div className="flex gap-1.5">
      {options.map(imp => {
        const active = value === imp.value
        return (
          <button
            key={imp.value}
            type="button"
            onClick={() => onChange(active ? '' : imp.value)}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-medium transition-all"
            style={{
              borderColor: active ? imp.color : 'rgba(255,255,255,0.08)',
              background:  active ? `color-mix(in srgb, ${imp.color} 15%, transparent)` : 'rgba(255,255,255,0.02)',
              color:       active ? imp.color : 'rgba(255,255,255,0.35)',
            }}
          >
            <span className="flex gap-0.5">
              {Array.from({ length: imp.dots }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: active ? imp.color : 'rgba(255,255,255,0.2)' }} />
              ))}
            </span>
            {imp.label}
          </button>
        )
      })}
    </div>
  )
}

export default function AddTransactionModal({ onClose, defaults = {}, transaction = null }) {
  const isEditing = !!transaction
  const { user } = useAuth()
  const { fmt } = usePreferences()
  const { cards } = useCards()
  const { importance: importanceOptions } = useImportance()

  const [type,        setType]        = useState(transaction?.type           ?? defaults.type        ?? 'expense')
  const [description, setDescription] = useState(transaction?.description    ?? defaults.description ?? '')
  const [amount,      setAmount]      = useState(transaction?.amount != null  ? String(Math.abs(transaction.amount)) : (defaults.amount ?? ''))
  const [categoryId,  setCategoryId]  = useState(transaction?.category_id    ?? defaults.category_id ?? '')
  const [subId,       setSubId]       = useState(transaction?.subcategory_id ?? '')
  const [isCash,      setIsCash]      = useState(transaction?.is_cash        ?? false)
  const [cardId,      setCardId]      = useState(transaction?.card_id        ?? '')
  const [toCardId,    setToCardId]    = useState('')
  const [savingsDir,  setSavingsDir]  = useState(transaction?.source === 'savings_out' ? 'out' : 'in')
  const [companionId, setCompanionId] = useState(null)
  const [ticker,        setTicker]        = useState(transaction?.ticker   ?? '')
  const [quantity,      setQuantity]      = useState(transaction?.quantity != null ? String(transaction.quantity) : '')
  const [pricePerUnit,  setPricePerUnit]  = useState(transaction?.price_per_unit != null ? String(transaction.price_per_unit) : '')
  const [fee,           setFee]           = useState('')
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [priceDate,     setPriceDate]     = useState(transaction?.date ?? defaults.date ?? new Date().toISOString().slice(0, 10))
  const priceDateRef = useRef(null)
  const [date,        setDate]        = useState(transaction?.date            ?? defaults.date ?? new Date().toISOString().slice(0, 10))
  const [comment,     setComment]     = useState(transaction?.comment        ?? '')
  const [status,      setStatus]      = useState(transaction?.status         ?? 'completed')
  const [isEarned,    setIsEarned]    = useState(transaction?.is_earned      ?? false)
  const [receiverId,  setReceiverId]  = useState(transaction?.receiver_id    ?? null)
  const [importance,  setImportance]  = useState(transaction?.importance     ?? '')
  const [saving,      setSaving]      = useState(false)
  const [pendingSplit, setPendingSplit] = useState(null) // transaction to split after save
  const [savedTxId,   setSavedTxId]   = useState(null)  // id of already-saved tx (for back-from-split edit)
  const [categories,    setCategories]    = useState([])
  const [receivers,     setReceivers]     = useState([])
  const [tickers,       setTickers]       = useState([])
  const [cardTxs,       setCardTxs]       = useState([])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('categories').select('*').eq('user_id', user.id)
      .then(({ data }) => { if (data) setCategories(data) })
    supabase.from('receivers').select('*').eq('user_id', user.id).order('name')
      .then(({ data }) => { if (data) setReceivers(data) })
    supabase.from('transactions').select('card_id, type, amount, is_cash, split_parent_id').eq('user_id', user.id).eq('is_deleted', false)
      .then(({ data }) => { if (data) setCardTxs(data) })
    supabase.from('tickers').select('*').eq('user_id', user.id).order('symbol')
      .then(({ data }) => { if (data) setTickers(data) })
  }, [user?.id])

  async function handleAddReceiver(name, type = 'person') {
    const { data, error } = await supabase
      .from('receivers')
      .insert({ user_id: user.id, name, type })
      .select()
      .single()
    if (!error && data) {
      setReceivers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setDescription(data.name)
      setReceiverId(data.id)
    }
  }

  // When editing a paired transaction, fetch its companion to populate toCardId and track its ID
  useEffect(() => {
    if (!isEditing || !user?.id || !transaction) return
    const txType = transaction.type
    if (txType !== 'savings' && txType !== 'transfer' && txType !== 'cash_out') return
    supabase.from('transactions')
      .select('id, card_id')
      .eq('user_id', user.id)
      .eq('type', transaction.type)
      .eq('date', transaction.date)
      .eq('amount', -transaction.amount)
      .neq('id', transaction.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCompanionId(data[0].id)
          if (txType === 'savings' || txType === 'transfer') setToCardId(data[0].card_id ?? '')
        }
      })
  }, [isEditing, user?.id, transaction?.id])

  // Auto-fetch price when ticker + quantity are set and price is empty
  useEffect(() => {
    if (!ticker.trim() || !quantity) return
    let cancelled = false
    const t = setTimeout(async () => {
      if (pricePerUnit !== '') return
      setFetchingPrice(true)
      const today = new Date().toISOString().slice(0, 10)
      const result = priceDate === today
        ? await fetchLivePrice(ticker.trim())
        : await fetchHistoricalPrice(ticker.trim(), priceDate)
      if (!cancelled && result) setPricePerUnit(String(parseFloat(result.price.toFixed(4))))
      if (!cancelled) setFetchingPrice(false)
    }, 600)
    return () => { cancelled = true; clearTimeout(t) }
  }, [ticker, quantity]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddTickerToList(symbol) {
    const { data } = await supabase
      .from('tickers').insert({ user_id: user.id, symbol })
      .select().single()
    if (data) setTickers(prev => [...prev, data].sort((a, b) => a.symbol.localeCompare(b.symbol)))
  }


  // Auto-select main card
  useEffect(() => {
    if (isCash) { setCardId(''); return }
    if (isEditing) return
    if (type === 'savings') {
      const fromType = savingsDir === 'in' ? 'debit' : 'savings'
      const toType   = savingsDir === 'in' ? 'savings' : 'debit'
      const fromCard = cards.find(c => c.type === fromType && c.is_main) ?? cards.find(c => c.type === fromType)
      const toCard   = cards.find(c => c.type === toType   && c.is_main) ?? cards.find(c => c.type === toType)
      if (fromCard) setCardId(fromCard.id)
      if (toCard)   setToCardId(toCard.id)
      return
    }
    if (type === 'transfer') return
    if (type === 'cash_out') {
      const debit = cards.find(c => c.type === 'debit' && c.is_main) ?? cards.find(c => c.type === 'debit')
      if (debit) setCardId(debit.id)
      return
    }
    if (type === 'invest') {
      const trading = cards.find(c => c.type === 'trading')
      if (trading) setCardId(trading.id)
      return
    }
    const preferredType = 'debit'
    const main = cards.find(c => c.type === preferredType && c.is_main) ?? cards.find(c => c.type === preferredType)
    if (main) setCardId(main.id)
  }, [type, savingsDir, cards, isCash, isEditing])

  // Reset toCardId when switching away from transfer/savings
  useEffect(() => { if (type !== 'transfer' && type !== 'savings') setToCardId('') }, [type])

  // After all hooks — safe to reference savedTxId now
  const effectiveIsEditing = isEditing || !!savedTxId
  const editId = transaction?.id ?? savedTxId

  const topCategories  = categories.filter(c => !c.parent_id)
  const subcategories  = categories.filter(c => c.parent_id === categoryId)
  const CREDIT_TYPES = new Set(['income'])
  function cardBalance(card) {
    const delta = cardTxs
      .filter(t => t.card_id === card.id && !t.is_cash && !t.split_parent_id)
      .reduce((s, t) => s + (CREDIT_TYPES.has(t.type) ? t.amount : -t.amount), 0)
    return Number(card.initial_balance) + delta
  }

  const transferCards  = cards.filter(c => c.type === 'debit' || c.type === 'credit' || c.type === 'trading')
  const tradingCards   = cards.filter(c => c.type === 'trading')
  const savingsFromCards = savingsDir === 'in'
    ? cards.filter(c => c.type === 'debit' || c.type === 'credit')
    : cards.filter(c => c.type === 'savings')
  const savingsToCards = savingsDir === 'in'
    ? cards.filter(c => c.type === 'savings')
    : cards.filter(c => c.type === 'debit' || c.type === 'credit')
  const availableCards = cards.filter(c => c.type !== 'cash' && c.type !== 'trading')
  const selectedCard   = cards.find(c => c.id === cardId)
  const activeType     = TYPES.find(t => t.value === type)

  async function handleSave(splitAfter = false) {
    if (type === 'invest') {
      const qty = parseFloat(quantity)
      const ppu = parseFloat(pricePerUnit)
      if (!(qty > 0) || !(ppu > 0)) return
    } else {
      if (!amount || isNaN(parseFloat(amount.replace(',', '.')))) return
    }
    if ((type === 'transfer' || type === 'savings') && (!cardId || !toCardId || cardId === toCardId)) return
    if (type === 'cash_out' && !cardId) return
    setSaving(true)
    const parsed = parseFloat(amount.replace(',', '.'))

    if (type === 'cash_out') {
      const fromCard = cards.find(c => c.id === cardId)
      const desc = `Cash withdrawal from ${fromCard?.name ?? 'card'}`
      if (effectiveIsEditing) {
        const [r1, r2] = await Promise.all([
          supabase.from('transactions').update({ amount: parsed,  date, comment: comment.trim() || null, description: desc, card_id: cardId, is_cash: false }).eq('id', editId),
          companionId ? supabase.from('transactions').update({ amount: -parsed, date, comment: comment.trim() || null, description: desc, card_id: null,   is_cash: true  }).eq('id', companionId) : { error: null },
        ])
        if (r1.error || r2.error) { console.error('cash_out edit error:', r1.error?.message ?? r2.error?.message); setSaving(false); return }
      } else {
        const base = { user_id: user.id, type: 'cash_out', source: 'cash_out', description: desc, date, comment: comment.trim() || null, status: 'completed', is_deleted: false, category_id: null, subcategory_id: null, receiver_id: null }
        const { error } = await supabase.from('transactions').insert([
          { ...base, card_id: cardId, amount:  parsed, is_cash: false },
          { ...base, card_id: null,   amount: -parsed, is_cash: true  },
        ])
        if (error) { console.error('cash_out error:', error.message); setSaving(false); return }
      }
    } else if (type === 'transfer') {
      const fromCard = cards.find(c => c.id === cardId)
      const toCard   = cards.find(c => c.id === toCardId)
      const transferDesc = `From ${fromCard?.name ?? 'card'} to ${toCard?.name ?? 'card'}`
      if (effectiveIsEditing) {
        const [r1, r2] = await Promise.all([
          supabase.from('transactions').update({ amount: parsed,  date, comment: comment.trim() || null, status, card_id: cardId,   description: transferDesc }).eq('id', editId),
          companionId ? supabase.from('transactions').update({ amount: -parsed, date, comment: comment.trim() || null, status, card_id: toCardId, description: transferDesc }).eq('id', companionId) : { error: null },
        ])
        if (r1.error || r2.error) { console.error('transfer edit error:', r1.error?.message ?? r2.error?.message); setSaving(false); return }
      } else {
        const base = { user_id: user.id, type: 'transfer', date, comment: comment.trim() || null, status, is_cash: false, is_deleted: false, category_id: null, subcategory_id: null, receiver_id: null }
        const { error } = await supabase.from('transactions').insert([
          { ...base, card_id: cardId,   amount:  parsed, description: transferDesc },
          { ...base, card_id: toCardId, amount: -parsed, description: transferDesc },
        ])
        if (error) { console.error('transfer error:', error.message); setSaving(false); return }
      }
    } else if (type === 'savings') {
      const fromCard = cards.find(c => c.id === cardId)
      const toCard   = cards.find(c => c.id === toCardId)
      const savingsDesc = savingsDir === 'in'
        ? `Savings deposit from ${fromCard?.name ?? 'card'}`
        : `Savings withdrawal to ${toCard?.name ?? 'card'}`
      const source = savingsDir === 'in' ? 'savings_in' : 'savings_out'
      if (effectiveIsEditing) {
        const [r1, r2] = await Promise.all([
          supabase.from('transactions').update({ amount: parsed,  date, comment: comment.trim() || null, status, card_id: cardId,   source, description: savingsDesc }).eq('id', editId),
          companionId ? supabase.from('transactions').update({ amount: -parsed, date, comment: comment.trim() || null, status, card_id: toCardId, source, description: savingsDesc }).eq('id', companionId) : { error: null },
        ])
        if (r1.error || r2.error) { console.error('savings edit error:', r1.error?.message ?? r2.error?.message); setSaving(false); return }
      } else {
        const base = { user_id: user.id, type: 'savings', date, comment: comment.trim() || null, status, is_cash: false, is_deleted: false, category_id: null, subcategory_id: null, receiver_id: null, source, description: savingsDesc }
        // outflow from source card (positive = deducted), inflow to dest card (negative = added via -(-x))
        const { error } = await supabase.from('transactions').insert([
          { ...base, card_id: cardId,   amount:  parsed },
          { ...base, card_id: toCardId, amount: -parsed },
        ])
        if (error) { console.error('savings error:', error.message); setSaving(false); return }
      }
    } else if (type === 'invest') {
      const qty      = parseFloat(quantity)
      const ppu      = parseFloat(pricePerUnit)
      const feeAmt   = parseFloat(fee) || 0
      const computed = qty * ppu + feeAmt
      const payload  = {
        type,
        description:    ticker.trim().toUpperCase() || null,
        amount:         computed,
        ticker:         ticker.trim().toUpperCase() || null,
        quantity:       qty,
        price_per_unit: ppu,
        card_id:        cardId || null,
        is_cash:        false,
        category_id:    null,
        subcategory_id: null,
        receiver_id:    null,
        date,
        comment:        comment.trim() || null,
        status:         'completed',
      }
      if (effectiveIsEditing) {
        await supabase.from('transactions').update(payload).eq('id', editId)
      } else {
        await supabase.from('transactions').insert({ user_id: user.id, ...payload })
      }
    } else {
      const payload = {
        type,
        description:    description.trim() || null,
        amount:         parsed,
        category_id:    categoryId || null,
        subcategory_id: subId || null,
        card_id:        isCash ? null : (cardId || null),
        receiver_id:    receiverId || null,
        is_cash:        isCash,
        ...(type === 'income' && { is_earned: isEarned }),
        ...(type === 'expense' && { importance: importance || null }),
        date,
        comment:        comment.trim() || null,
        status,
      }
      if (effectiveIsEditing) {
        const { error: updateErr } = await supabase.from('transactions').update(payload).eq('id', editId)
        if (updateErr) { console.error('transaction update failed:', updateErr.message); setSaving(false); return }
        if (transaction?.is_split_parent) {
          await supabase.from('transactions')
            .update({ card_id: isCash ? null : (cardId || null), date })
            .eq('split_parent_id', editId)
        }
      } else {
        if (splitAfter) {
          const { data: saved } = await supabase.from('transactions').insert({ user_id: user.id, ...payload }).select().single()
          setSaving(false)
          window.dispatchEvent(new CustomEvent('transaction-saved'))
          if (saved) { setSavedTxId(saved.id); setPendingSplit(saved); return }
          onClose(); return
        }
        await supabase.from('transactions').insert({ user_id: user.id, ...payload })
      }
    }

    setSaving(false)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    onClose()
  }

  if (pendingSplit) {
    return (
      <SplitTransactionModal
        transaction={pendingSplit}
        allCategories={categories}
        onClose={onClose}
        onBack={() => setPendingSplit(null)}
      />
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-popup border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">{effectiveIsEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex flex-col gap-5 p-6 scrollbar-thin">

          {/* Type */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(({ value, label, Icon, color }) => {
                const active = type === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                    style={{
                      borderColor: active ? color : 'rgba(255,255,255,0.08)',
                      background:  active ? `color-mix(in srgb, ${color} 12%, transparent)` : 'rgba(255,255,255,0.02)',
                      color:       active ? color : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    <Icon size={14} strokeWidth={1.75} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Receiver — hidden for transfer/savings/invest/cash_out */}
          {type !== 'transfer' && type !== 'savings' && type !== 'invest' && type !== 'cash_out' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest">{type === 'income' ? 'Sender' : 'Receiver'}</label>
              <DescriptionCombobox
                value={description}
                onChange={setDescription}
                receiverId={receiverId}
                onReceiverSelect={setReceiverId}
                onAddReceiver={handleAddReceiver}
                receivers={receivers}
                inputClass={inp}
              />
            </div>
          )}

          {/* Amount — hidden for invest (auto-computed) */}
          {type !== 'invest' && (
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
          )}

          {/* Invest fields: Ticker + Quantity + Price per unit + Fee */}
          {type === 'invest' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                  Ticker <span className="text-white/30 normal-case font-normal">(e.g. AAPL, BTC-USD, VWCE.AS)</span>
                </label>
                <TickerCombobox
                  value={ticker}
                  onChange={setTicker}
                  tickers={tickers}
                  onAddToList={handleAddTickerToList}
                  inputClass={inp}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted uppercase tracking-widest">Quantity</label>
                  <input
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    type="number" step="any" min="0" placeholder="0"
                    className={inp}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                    Price per unit
                    {ticker.trim() && (
                      <span className="ml-auto flex items-center gap-1.5">
                        {fetchingPrice
                          ? <span className="text-[10px] text-white/30">Fetching…</span>
                          : <span className="text-[10px] text-white/30">{priceDate}</span>
                        }
                        <span className="relative" title="Pick date to fetch price">
                          <Calendar size={12} className="text-white/30 hover:text-white/60 transition-colors pointer-events-none" />
                          <input
                            ref={priceDateRef}
                            type="date"
                            value={priceDate}
                            disabled={fetchingPrice || !ticker.trim()}
                            onChange={async e => {
                              const d = e.target.value
                              setPriceDate(d)
                              if (!d || !ticker.trim()) return
                              setFetchingPrice(true)
                              const result = await fetchHistoricalPrice(ticker.trim(), d)
                              if (result) setPricePerUnit(String(parseFloat(result.price.toFixed(4))))
                              setFetchingPrice(false)
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full disabled:cursor-not-allowed"
                          />
                        </span>
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                    <input
                      value={pricePerUnit}
                      onChange={e => setPricePerUnit(e.target.value)}
                      type="number" step="any" min="0" placeholder="0,00"
                      className={inp + ' pl-8'}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                  Fee <span className="text-white/30 normal-case font-normal">(optional, not counted in cost basis)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                  <input
                    value={fee}
                    onChange={e => setFee(e.target.value)}
                    type="number" step="0.01" min="0" placeholder="0,00"
                    className={inp + ' pl-8'}
                  />
                </div>
              </div>
              {parseFloat(quantity) > 0 && parseFloat(pricePerUnit) > 0 && (
                <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/[0.03] border border-white/8 text-xs">
                  <span className="text-muted">Total deducted from card</span>
                  <span className="text-white/60">
                    €{(parseFloat(quantity) * parseFloat(pricePerUnit) + (parseFloat(fee) || 0))
                      .toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Savings: In / Out + card selectors */}
          {type === 'savings' && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {['in', 'out'].map(dir => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setSavingsDir(dir)}
                    className="flex-1 py-2 rounded-xl border text-sm font-medium transition-all capitalize"
                    style={{
                      borderColor: savingsDir === dir ? activeType?.color : 'rgba(255,255,255,0.08)',
                      background:  savingsDir === dir ? `color-mix(in srgb, ${activeType?.color} 12%, transparent)` : 'rgba(255,255,255,0.02)',
                      color:       savingsDir === dir ? activeType?.color : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {dir === 'in' ? '↓ Save (In)' : '↑ Withdraw (Out)'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                    From
                    {cards.find(c => c.id === cardId) && (
                      <span className="text-white/30 normal-case font-normal">{fmt(cardBalance(cards.find(c => c.id === cardId)))}</span>
                    )}
                  </label>
                  <select value={cardId} onChange={e => setCardId(e.target.value)} className={sel}>
                    <option value="">Select card</option>
                    {savingsFromCards.map(c => (
                      <option key={c.id} value={c.id} disabled={c.id === toCardId}>{c.name}  ·  {fmt(cardBalance(c))}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                    To
                    {cards.find(c => c.id === toCardId) && (
                      <span className="text-white/30 normal-case font-normal">{fmt(cardBalance(cards.find(c => c.id === toCardId)))}</span>
                    )}
                  </label>
                  <select value={toCardId} onChange={e => setToCardId(e.target.value)} className={sel}>
                    <option value="">Select card</option>
                    {savingsToCards.map(c => (
                      <option key={c.id} value={c.id} disabled={c.id === cardId}>{c.name}  ·  {fmt(cardBalance(c))}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Cash Out: From debit card → cash wallet */}
          {type === 'cash_out' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                  From
                  {selectedCard && (
                    <span className="text-white/30 normal-case font-normal">{fmt(cardBalance(selectedCard))}</span>
                  )}
                </label>
                <select value={cardId} onChange={e => setCardId(e.target.value)} className={sel}>
                  <option value="">Select card</option>
                  {cards.filter(c => c.type === 'debit').map(c => (
                    <option key={c.id} value={c.id}>{c.name}  ·  {fmt(cardBalance(c))}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest">To</label>
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50">
                  <Banknote size={14} className="text-white/25" />
                  Cash Wallet
                </div>
              </div>
            </div>
          )}

          {/* Transfer: From / To cards */}
          {type === 'transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                  From
                  {cards.find(c => c.id === cardId) && (
                    <span className="text-white/30 normal-case font-normal">
                      {fmt(cardBalance(cards.find(c => c.id === cardId)))}
                    </span>
                  )}
                </label>
                <select value={cardId} onChange={e => setCardId(e.target.value)} className={sel}>
                  <option value="">Select card</option>
                  {transferCards.map(c => (
                    <option key={c.id} value={c.id} disabled={c.id === toCardId}>
                      {c.name}  ·  {fmt(cardBalance(c))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                  To
                  {cards.find(c => c.id === toCardId) && (
                    <span className="text-white/30 normal-case font-normal">
                      {fmt(cardBalance(cards.find(c => c.id === toCardId)))}
                    </span>
                  )}
                </label>
                <select value={toCardId} onChange={e => setToCardId(e.target.value)} className={sel}>
                  <option value="">Select card</option>
                  {transferCards.map(c => (
                    <option key={c.id} value={c.id} disabled={c.id === cardId}>
                      {c.name}  ·  {fmt(cardBalance(c))}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Category + Subcategory — hidden for income, transfer, savings, invest, cash_out */}
          {type !== 'income' && type !== 'transfer' && type !== 'savings' && type !== 'invest' && type !== 'cash_out' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest">Category</label>
                <CategorySelect value={categoryId} onChange={v => { setCategoryId(v); setSubId('') }} options={topCategories} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest">Subcategory</label>
                <CategorySelect value={subId} onChange={setSubId} options={subcategories} disabled={!categoryId || subcategories.length === 0} />
              </div>
            </div>
          )}

          {/* Importance — expense only, required */}
          {type === 'expense' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                Importance
                {!importance && <span className="text-[10px] text-white/30 normal-case font-normal">required</span>}
              </label>
              <ImportancePicker value={importance} onChange={setImportance} options={importanceOptions} />
            </div>
          )}

          {/* Inline toggles — hidden for transfer/savings/invest/cash_out */}
          {type !== 'transfer' && type !== 'savings' && type !== 'invest' && type !== 'cash_out' && (
            <div className="flex items-center gap-5">
              {type !== 'income' && (
                <Toggle
                  label="Cash expense"
                  on={isCash}
                  onToggle={() => { setIsCash(v => !v); setCardId('') }}
                />
              )}
              {type === 'income' && (
                <Toggle
                  label="Earned"
                  on={isEarned}
                  onToggle={() => setIsEarned(v => !v)}
                />
              )}
              {type === 'income' && (
                <Toggle
                  label="Cash"
                  on={isCash}
                  onToggle={() => setIsCash(v => !v)}
                />
              )}
            </div>
          )}

          {/* Card / Cash wallet — hidden for transfer/savings (handled above) */}
          {type === 'invest' ? (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                Trading account
                {selectedCard && (
                  <span className="text-white/30 normal-case font-normal">
                    Balance: {fmt(cardBalance(selectedCard))}
                  </span>
                )}
              </label>
              <select value={cardId} onChange={e => setCardId(e.target.value)} className={sel}>
                <option value="">Select trading account</option>
                {tradingCards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}  ·  {fmt(cardBalance(c))}
                  </option>
                ))}
              </select>
              {tradingCards.length === 0 && (
                <p className="text-[11px] text-white/30">No trading accounts yet. Add one in Settings → Cards.</p>
              )}
            </div>
          ) : type !== 'transfer' && type !== 'savings' && type !== 'cash_out' && (isCash ? (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest">Wallet</label>
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50">
                <Banknote size={14} className="text-white/25" />
                Cash Wallet
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
                Card
                {selectedCard && (
                  <span className="text-white/30 normal-case font-normal">
                    Balance: {fmt(cardBalance(selectedCard))}
                  </span>
                )}
              </label>
              <select value={cardId} onChange={e => setCardId(e.target.value)} className={sel}>
                <option value="">No card</option>
                {availableCards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}  ·  {fmt(cardBalance(c))}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              Description <span className="text-white/30 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className={inp + ' resize-none'}
            />
          </div>


          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-cancel"
            >
              Cancel
            </button>
            {type === 'expense' && !effectiveIsEditing && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || !amount || !importance}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
                title="Save and immediately split into parts"
              >
                <Scissors size={13} /> Split
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={
                saving ||
                (type === 'invest'
                  ? !(parseFloat(quantity) > 0) || !(parseFloat(pricePerUnit) > 0)
                  : !amount) ||
                ((type === 'transfer' || type === 'savings') && (!cardId || !toCardId || cardId === toCardId)) ||
                (type === 'cash_out' && !cardId) ||
                (type === 'expense' && !importance)
              }
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-40"
              style={{
                background:  activeType ? `color-mix(in srgb, ${activeType.color} 12%, transparent)` : 'transparent',
                color:       activeType?.color,
                borderColor: activeType ? `color-mix(in srgb, ${activeType.color} 40%, transparent)` : 'transparent',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
