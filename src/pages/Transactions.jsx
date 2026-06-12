import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ChevronUp, ChevronDown, Pencil, Trash2, Search, X, PiggyBank, Banknote, Scissors, CornerDownLeft, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useImportance } from '../hooks/useImportance'
import Navbar from '../components/dashboard/Navbar'
import AddTransactionModal from '../components/transactions/AddTransactionModal'
import SplitTransactionModal from '../components/transactions/SplitTransactionModal'
import { TYPES_MAP, TRANSACTION_TYPES } from '../constants/transactionTypes'
import { CategoryPill } from '../components/shared/CategoryPill'
import { usePreferences } from '../context/UserPreferencesContext'
import { SkeletonRow } from '../components/shared/Skeleton'

const DEFAULT_WIDTHS = {
  description: 240, type: 90, importance: 100, amount: 110,
  category: 120, subcategory: 120, label: 90, date: 80, card: 100, comment: 180,
}

const STORAGE_KEY = 'tx-col-widths'

function useColResize(initial) {
  const [widths, setWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return { ...initial, ...JSON.parse(saved) }
    } catch {}
    return initial
  })
  const dragging = useRef(null)

  const onMouseDown = useCallback((col, e) => {
    e.preventDefault()
    dragging.current = { col, startX: e.clientX, startW: widths[col] }

    function onMove(e) {
      if (!dragging.current) return
      const { col, startX, startW } = dragging.current
      const next = Math.max(50, startW + e.clientX - startX)
      setWidths(w => {
        const updated = { ...w, [col]: next }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
        return updated
      })
    }
    function onUp() {
      dragging.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [widths])

  return { widths, onMouseDown }
}

function Th({ col, width, onMouseDown, className = '', align = 'left', children }) {
  return (
    <th
      className={`relative py-3 font-medium select-none ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
      style={{ width, minWidth: width, maxWidth: width, paddingLeft: '12px', paddingRight: '20px' }}
    >
      {children}
      <div
        onMouseDown={e => onMouseDown(col, e)}
        className="absolute right-0 top-0 h-full w-4 flex items-center justify-center cursor-col-resize group z-10"
      >
        <div className="w-px h-0 bg-transparent" />
      </div>
    </th>
  )
}

function amountColor(type, source) {
  if (type === 'income') return 'var(--type-income)'
  if (type === 'expense') return 'var(--type-expense)'
  if (type === 'cash_out') return source === 'cash' ? 'var(--type-income)' : 'var(--type-expense)'
  return '#9ca3af'  // transfer, savings — neutral (moving between own accounts)
}

function amountSign(type, source, amount = 0) {
  if (type === 'income') return '+'
  if (type === 'expense') return '−'
  if (type === 'cash_out') return source === 'cash' ? '+' : '−'
  // Negative-amount companion row = money arriving at this card
  if ((type === 'savings' || type === 'transfer') && amount < 0) return '+'
  return ''  // outgoing side — no sign
}

// ── Receiver / logo avatar ────────────────────────────────────
function ReceiverAvatar({ receiver }) {
  const [src, setSrc] = useState(() => {
    if (!receiver) return null
    if (receiver.logo_url) return receiver.logo_url
    if (receiver.domain)   return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${receiver.domain}&size=64`
    return null
  })
  const [failed, setFailed] = useState(false)

  if (!receiver) return (
    <div className="w-7 h-7 rounded-full bg-white/8 shrink-0" />
  )

  const initials = receiver.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  function handleError() { setSrc(null); setFailed(true) }

  if (!src || failed) {
    return (
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
        {initials}
      </div>
    )
  }
  return (
    <img src={src} alt={receiver.name} onError={handleError}
      className="w-7 h-7 rounded-full object-contain bg-white/90 shrink-0 p-0.5" />
  )
}

// ── Read-only transaction detail modal ───────────────────────
function TransactionDetailModal({ tx, onClose, onViewLinked, linkedTx, fmt, t, impMap }) {
  if (!tx) return null
  const typeInfo = TYPES_MAP[tx.type] ?? { label: tx.type, color: '#9ca3af' }
  const imp = tx.importance ? impMap[tx.importance] : null
  const isNegativeFlow = tx.type === 'expense' || (tx.type === 'savings' && tx.amount > 0) || tx.type === 'cash_out'

  const Field = ({ label, children }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[11px] text-white/35 uppercase tracking-widest shrink-0 w-28">{label}</span>
      <div className="flex-1 text-right text-sm text-white/80">{children}</div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass-popup border border-white/10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full w-max"
              style={{ background: typeInfo.color + '22', color: typeInfo.color }}>
              {typeInfo.label}
            </span>
            <span className="text-2xl font-bold tabular-nums mt-1"
              style={{ color: isNegativeFlow ? 'var(--type-expense)' : tx.type === 'income' ? 'var(--type-income)' : 'rgba(255,255,255,0.7)' }}>
              {isNegativeFlow ? '−' : tx.type === 'income' ? '+' : ''}{fmt(Math.abs(tx.amount))}
            </span>
            <span className="text-xs text-white/35">
              {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="px-5 pb-2 flex flex-col">
          {tx.description && (
            <Field label="Receiver">
              <div className="flex items-center justify-end gap-2">
                {tx.receiver && (
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                    {tx.receiver.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {tx.description}
              </div>
            </Field>
          )}
          {tx.category && (
            <Field label="Category">
              <CategoryPill name={tx.category.name} color={tx.category.color} icon={tx.category.icon} />
            </Field>
          )}
          {tx.subcategory && (
            <Field label="Subcategory">
              <CategoryPill name={tx.subcategory.name} color={tx.subcategory.color} icon={tx.subcategory.icon} />
            </Field>
          )}
          {imp && (
            <Field label="Importance">
              <div className="flex items-center justify-end gap-1.5">
                <span className="flex items-center gap-[3px]">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: i < imp.dots ? imp.color : imp.color + '30' }} />
                  ))}
                </span>
                <span className="text-white/60 text-xs">{imp.label}</span>
              </div>
            </Field>
          )}
          {tx.card && <Field label="Card">{tx.card.name}</Field>}
          {tx.source && tx.type !== 'cash_out' && (
            <Field label="Source">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 capitalize">
                {tx.source.replace(/_/g, ' ')}
              </span>
            </Field>
          )}
          {tx.comment && <Field label="Note"><span className="text-white/50 italic">{tx.comment}</span></Field>}
        </div>

        {/* Linked expense section */}
        {tx.linked_expense_id && (
          <div className="mx-5 mb-5 mt-2 rounded-xl p-4 flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Funded Expense</p>
            {linkedTx ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm text-white/80 truncate">{linkedTx.description || '—'}</span>
                  {linkedTx.category && (
                    <CategoryPill name={linkedTx.category.name} color={linkedTx.category.color} icon={linkedTx.category.icon} />
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--type-expense)' }}>
                    −{fmt(Math.abs(linkedTx.amount))}
                  </span>
                  <button onClick={() => onViewLinked(linkedTx)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors"
                    title="View expense details">
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-xs text-white/30 italic">Expense not in current view</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Transactions() {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const { importance } = useImportance()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState({ col: 'date', dir: 'desc' })
  const [editingTx,  setEditingTx]  = useState(null)
  const [detailTx,   setDetailTx]   = useState(null)
  const [paybackFor, setPaybackFor] = useState(null)
  const [openPayback, setOpenPayback] = useState(null)
  const [splitTx, setSplitTx] = useState(null)
  const [allCategories, setAllCategories] = useState([])
  const [allReceivers, setAllReceivers] = useState([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterSub, setFilterSub] = useState('')
  const [filterReceiver, setFilterReceiver] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [datePreset, setDatePreset] = useState('month')
  const [filterType, setFilterType] = useState('')
  const [filterImportance, setFilterImportance] = useState(new Set())
  const [filterCard,       setFilterCard]       = useState('')
  const [allCards,         setAllCards]         = useState([])
  const [collapsedParents, setCollapsedParents] = useState(new Set())

  function toggleParent(id) {
    setCollapsedParents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (!user?.id) return

    async function load() {
      setLoading(true)

      const today = new Date()
      const year  = currentDate.getFullYear()
      const month = currentDate.getMonth()
      let start, end
      if (datePreset === 'last_month') {
        const d = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
        end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
      } else if (datePreset === '3months') {
        start = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().slice(0, 10)
        end   = today.toISOString().slice(0, 10)
      } else if (datePreset === 'year') {
        start = `${today.getFullYear()}-01-01`
        end   = `${today.getFullYear()}-12-31`
      } else if (datePreset === 'all') {
        start = `${today.getFullYear() - 5}-01-01`
        end   = today.toISOString().slice(0, 10)
      } else if (datePreset === 'custom' && filterDateFrom && filterDateTo) {
        start = filterDateFrom
        end   = filterDateTo
      } else {
        start = new Date(year, month, 1).toISOString().slice(0, 10)
        end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)
      }

      const [
        { data: txs },
        { data: categories },
        { data: cards },
        { data: receivers },
      ] = await Promise.all([
        supabase.from('transactions')
          .select('id, type, description, amount, date, created_at, comment, status, is_cash, is_earned, source, category_id, subcategory_id, card_id, receiver_id, is_split_parent, split_parent_id, importance, label, linked_expense_id')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('cards').select('id, name, type').eq('user_id', user.id),
        supabase.from('receivers').select('id, name, domain, logo_url').eq('user_id', user.id),
      ])

      if (!txs) { setLoading(false); return }

      const catMap = Object.fromEntries((categories ?? []).map(c => [c.id, c]))
      const cardMap = Object.fromEntries((cards ?? []).map(c => [c.id, c]))
      const receiverMap = Object.fromEntries((receivers ?? []).map(r => [r.id, r]))
      setAllCategories(categories ?? [])
      setAllReceivers(receivers ?? [])
      setAllCards(cards ?? [])

      setRows(txs
        .map(t => ({
        ...t,
        category:    catMap[t.category_id]    ?? null,
        subcategory: catMap[t.subcategory_id] ?? null,
        card:        cardMap[t.card_id]        ?? null,
        receiver:    receiverMap[t.receiver_id] ?? null,
      })))
      setLoading(false)
    }

    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate, datePreset, filterDateFrom, filterDateTo])

  // ── Sorting ──────────────────────────────────────────────────
  function toggleSort(col) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { col, dir: 'desc' })
  }

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      if (sort.col === 'amount') return b.amount - a.amount
      if (sort.col === 'date') {
        const dateDiff = b.date.localeCompare(a.date)
        if (dateDiff !== 0) return dateDiff
        return (b.created_at ?? '').localeCompare(a.created_at ?? '')
      }
      return 0
    })
    return sort.dir === 'asc' ? sorted.reverse() : sorted
  }, [rows, sort])

  const txPaybackMap = useMemo(() => {
    const map = {}
    rows.filter(r => r.type === 'income' && r.linked_expense_id).forEach(r => {
      map[r.linked_expense_id] = (map[r.linked_expense_id] || 0) + Number(r.amount)
    })
    return map
  }, [rows])

  useEffect(() => {
    if (!openPayback) return
    const close = () => setOpenPayback(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openPayback])

  const filteredRows = useMemo(() => {
    let result = sortedRows
    // Without a card filter, hide the receiver-side companion rows (negative amount)
    // to avoid every savings/transfer appearing twice in the full list
    if (!filterCard) {
      result = result.filter(r =>
        (r.type === 'transfer' || r.type === 'savings' || r.type === 'cash_out') ? r.amount > 0 : true
      )
    }
    if (search)                    result = result.filter(r => r.description?.toLowerCase().includes(search.toLowerCase()))
    if (filterCat)                 result = result.filter(r => r.category_id === filterCat)
    if (filterSub)                 result = result.filter(r => r.subcategory_id === filterSub)
    if (filterReceiver)            result = result.filter(r => r.receiver_id === filterReceiver)
    // date filtering is handled server-side via datePreset / filterDateFrom / filterDateTo
    if (filterType)                result = result.filter(r => r.type === filterType)
    if (filterImportance.size > 0) result = result.filter(r => filterImportance.has(r.importance ?? ''))
    if (filterCard)                result = result.filter(r => r.card_id === filterCard)
    return result
  }, [sortedRows, search, filterCat, filterSub, filterReceiver, filterDateFrom, filterDateTo, filterType, filterImportance, filterCard])

  const topCategories = allCategories.filter(c => !c.parent_id)
  const subCategories = allCategories.filter(c => c.parent_id === filterCat)
  const hasFilters = search || filterCat || filterSub || filterReceiver || filterDateFrom || filterDateTo || filterType || filterImportance.size > 0 || filterCard

  // ── Totals (filtered, exclude split parents to avoid double-count) ──
  const totalIncome   = filteredRows.filter(r => r.type === 'income'  && !r.is_split_parent).reduce((s, r) => s + r.amount, 0)
  const totalExpenses = filteredRows.filter(r => r.type === 'expense' && !r.is_split_parent).reduce((s, r) => s + r.amount, 0)
  const net           = totalIncome - totalExpenses

  // ── Display rows: group children under their parent ───────────
  const displayRows = useMemo(() => {
    const parentIdsInFilter = new Set(filteredRows.filter(r => r.is_split_parent).map(r => r.id))
    const childMap = {}
    filteredRows.filter(r => r.split_parent_id).forEach(c => {
      if (!childMap[c.split_parent_id]) childMap[c.split_parent_id] = []
      childMap[c.split_parent_id].push(c)
    })
    const result = []
    for (const row of filteredRows) {
      if (row.split_parent_id) {
        // Skip if parent is collapsed
        if (collapsedParents.has(row.split_parent_id)) continue
        // Orphan child: parent not visible in current filter — show standalone
        if (!parentIdsInFilter.has(row.split_parent_id)) result.push(row)
        continue
      }
      result.push(row)
      if (row.is_split_parent && !collapsedParents.has(row.id)) {
        ;(childMap[row.id] ?? []).forEach(c => result.push(c))
      }
    }
    return result
  }, [filteredRows, collapsedParents])

  // Track orphan children (shown without their parent in filtered results)
  const orphanChildIds = useMemo(() => {
    const parentIdsInFilter = new Set(filteredRows.filter(r => r.is_split_parent).map(r => r.id))
    return new Set(
      filteredRows
        .filter(r => r.split_parent_id && !parentIdsInFilter.has(r.split_parent_id))
        .map(r => r.id)
    )
  }, [filteredRows])

  function clearFilters() {
    setSearch(''); setFilterCat(''); setFilterSub('')
    setFilterReceiver(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterType('')
    setFilterImportance(new Set()); setFilterCard(''); setDatePreset('month')
  }

  async function handleDelete(tx) {
    if (!window.confirm(t('tx.deleteConfirm'))) return
    const { error } = await supabase.from('transactions').update({ is_deleted: true }).eq('id', tx.id)
    if (error) { console.error('Delete failed:', error); return }
    // Also soft-delete split children
    await supabase.from('transactions').update({ is_deleted: true }).eq('split_parent_id', tx.id)
    // Soft-delete the paired companion row for savings/transfer/cash_out
    if (tx.type === 'savings' || tx.type === 'transfer' || tx.type === 'cash_out') {
      await supabase.from('transactions')
        .update({ is_deleted: true })
        .eq('user_id', user.id)
        .eq('type', tx.type)
        .eq('date', tx.date)
        .eq('amount', -tx.amount)
        .neq('id', tx.id)
    }
    window.dispatchEvent(new CustomEvent('transaction-saved'))
  }

  // ── Importance lookup ────────────────────────────────────────
  const impMap = Object.fromEntries(importance.map(i => [i.value, i]))

  const { widths, onMouseDown } = useColResize(DEFAULT_WIDTHS)
  const dateStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar
        currentDate={currentDate}
        onPrev={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
      />

      <div id="page-content" className="py-6 px-4 md:px-8 lg:px-16 pb-24 lg:pb-6">
        <h1 className="text-3xl font-bold mb-1">{t('tx.title')}</h1>
        <p className="text-muted text-sm mb-6">{dateStr}</p>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 py-3 border-b border-white/8">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('tx.searchPh')}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-colors"
              />
            </div>

            {/* Type */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer"
            >
              <option value="">{t('tx.allTypes')}</option>
              {TRANSACTION_TYPES.map(txType => <option key={txType.value} value={txType.value}>{txType.label}</option>)}
            </select>

            {/* Category */}
            <select
              value={filterCat}
              onChange={e => { setFilterCat(e.target.value); setFilterSub('') }}
              className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer"
            >
              <option value="">{t('tx.allCats')}</option>
              {topCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Subcategory */}
            <select
              value={filterSub}
              onChange={e => setFilterSub(e.target.value)}
              disabled={!filterCat || subCategories.length === 0}
              className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer disabled:opacity-30"
            >
              <option value="">{t('tx.allSubs')}</option>
              {subCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Receiver */}
            <select
              value={filterReceiver}
              onChange={e => setFilterReceiver(e.target.value)}
              className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer"
            >
              <option value="">{t('tx.allReceivers')}</option>
              {allReceivers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

            {/* Card */}
            <select
              value={filterCard}
              onChange={e => setFilterCard(e.target.value)}
              className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer"
            >
              <option value="">All cards</option>
              {allCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Date presets */}
            {[
              { id: 'month',      label: 'This month' },
              { id: 'last_month', label: 'Last month' },
              { id: '3months',    label: '3 months' },
              { id: 'year',       label: 'This year' },
              { id: 'all',        label: 'All time' },
              { id: 'custom',     label: 'Custom' },
            ].map(p => (
              <button key={p.id} type="button"
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap
                  ${datePreset === p.id
                    ? 'bg-white/15 text-white border border-white/[0.12]'
                    : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80'}`}>
                {p.label}
              </button>
            ))}
            {datePreset === 'custom' && (
              <>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer" />
                <span className="text-white/20 text-xs">→</span>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer" />
              </>
            )}

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors ml-auto"
              >
                <X size={11} /> {t('tx.clear')}
              </button>
            )}

            {/* Importance filter — multi-select pills */}
            <div className="flex items-center gap-1">
              {importance.map(imp => {
                const active = filterImportance.has(imp.value)
                return (
                  <button key={imp.value} type="button"
                    onClick={() => setFilterImportance(prev => {
                      const next = new Set(prev)
                      if (next.has(imp.value)) next.delete(imp.value)
                      else next.add(imp.value)
                      return next
                    })}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-all"
                    style={{
                      borderColor: active ? imp.color : 'rgba(255,255,255,0.06)',
                      background:  active ? `color-mix(in srgb, ${imp.color} 15%, transparent)` : 'transparent',
                      color:       active ? imp.color : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <span className="flex gap-[2px]">
                      {Array.from({ length: imp.dots }).map((_, i) => (
                        <span key={i} className="w-1 h-1 rounded-full" style={{ background: active ? imp.color : 'rgba(255,255,255,0.25)' }} />
                      ))}
                    </span>
                    {imp.label}
                  </button>
                )
              })}
            </div>

            {/* Importance legend — desktop only */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
              {importance.map(imp => (
                <span key={imp.value} className="flex items-center gap-1">
                  <span className="flex items-center gap-[3px]">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i < imp.dots ? imp.color : imp.color + '30' }} />
                    ))}
                  </span>
                  <span className="text-[10px] text-white/35">{imp.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-white/[0.04]">
            {loading ? (
              <div className="flex flex-col px-4 py-2">{[1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)}</div>
            ) : displayRows.length === 0 ? (
              <p className="text-center py-12 text-muted text-xs">{hasFilters ? t('tx.noMatch') : t('tx.noTx')}</p>
            ) : displayRows.map(row => {
              const typeInfo = TYPES_MAP[row.type] ?? { label: row.type, color: '#9ca3af' }
              const impValue = row.importance ?? null
              const imp = impValue ? impMap[impValue] : null
              const isChild  = !!row.split_parent_id
              const isParent = !!row.is_split_parent
              const isOrphan = orphanChildIds.has(row.id)
              return (
                <div key={row.id} className={`flex items-center gap-3 px-4 py-3 ${isChild ? 'bg-white/[0.01] pl-8' : ''}`}>
                  {isChild && !isOrphan && <span className="text-white/20 text-xs shrink-0">↳</span>}
                  {isOrphan && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                      split
                    </span>
                  )}
                  {row.type === 'transfer' || row.type === 'savings' || row.type === 'cash_out' || row.type === 'invest'
                    ? <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center shrink-0" style={{ color: typeInfo.color }}>
                        {typeInfo.Icon ? <typeInfo.Icon size={14} /> : <PiggyBank size={14} />}
                      </div>
                    : <ReceiverAvatar receiver={row.receiver} />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">
                      {row.description || <span className="text-white/30 italic">—</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-white/35">
                        {new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {row.category && <CategoryPill name={row.category.name} color={row.category.color} icon={row.category.icon} />}
                      {imp && (
                        <span className="flex items-center gap-[2px]">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <span key={i} className="w-1 h-1 rounded-full" style={{ background: i < imp.dots ? imp.color : imp.color + '30' }} />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {row.type === 'expense' && txPaybackMap[row.id] > 0 && (
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenPayback(openPayback === row.id ? null : row.id) }}
                          className="p-0.5 rounded text-white/30 hover:text-white/60 transition-colors"
                        >
                          <CornerDownLeft size={10} />
                        </button>
                        {openPayback === row.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 glass-popup border border-white/15 rounded-xl p-2.5 shadow-xl" style={{ minWidth: 148 }}>
                            <div className="flex justify-between gap-4 text-[11px]">
                              <span className="text-white/40">Original</span>
                              <span className="text-white/40 line-through tabular-nums">−{fmt(Math.abs(row.amount))}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-[11px] mt-0.5">
                              <span className="text-white/40">Payback</span>
                              <span className="text-green-400 tabular-nums">+{fmt(txPaybackMap[row.id])}</span>
                            </div>
                            <div className="h-px bg-white/10 my-1.5" />
                            <div className="flex justify-between gap-4 text-[11px] font-semibold">
                              <span className="text-white/60">Net</span>
                              <span className="text-white/80 tabular-nums">−{fmt(Math.max(0, Math.abs(row.amount) - txPaybackMap[row.id]))}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <span className="text-sm font-semibold tabular-nums" style={{ color: isParent ? 'rgba(255,255,255,0.2)' : amountColor(row.type, row.source) }}>
                      {isParent
                        ? <span className="line-through">{amountSign(row.type, row.source, row.amount)}{fmt(Math.abs(row.amount))}</span>
                        : row.type === 'expense' && txPaybackMap[row.id] > 0
                          ? <>{amountSign(row.type, row.source, row.amount)}{fmt(Math.max(0, Math.abs(row.amount) - txPaybackMap[row.id]))}</>
                          : <>{amountSign(row.type, row.source, row.amount)}{fmt(Math.abs(row.amount))}</>
                      }
                    </span>
                    {!isChild && (
                      <button onClick={() => setEditingTx(row)} className="p-1.5 rounded-lg text-white/25 hover:text-white transition-colors">
                        <Pencil size={13} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg text-white/25 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="text-sm border-collapse" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
              <thead>
                <tr className="border-b border-white/[0.04] text-[11px] uppercase tracking-widest text-muted">
                  <Th col="description" width={widths.description} onMouseDown={onMouseDown}>{t('common.receiver')}</Th>
                  <Th col="importance"  width={widths.importance}  onMouseDown={onMouseDown}>{t('common.importance')}</Th>
                  <Th col="amount"      width={widths.amount}      onMouseDown={onMouseDown} align="right">
                    <button onClick={() => toggleSort('amount')} className="inline-flex items-center gap-1 ml-auto hover:text-white transition-colors">
                      {t('common.amount')}
                      {sort.col === 'amount'
                        ? sort.dir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />
                        : <ChevronDown size={11} className="opacity-25" />}
                    </button>
                  </Th>
                  <Th col="category"    width={widths.category}    onMouseDown={onMouseDown}>{t('common.category')}</Th>
                  <Th col="subcategory" width={widths.subcategory} onMouseDown={onMouseDown}>{t('common.subcategory')}</Th>
                  <Th col="label"       width={widths.label}       onMouseDown={onMouseDown}>{t('common.label')}</Th>
                  <Th col="date"        width={widths.date}        onMouseDown={onMouseDown}>
                    <button onClick={() => toggleSort('date')} className="inline-flex items-center gap-1 hover:text-white transition-colors">
                      {t('common.date')}
                      {sort.col === 'date'
                        ? sort.dir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />
                        : <ChevronDown size={11} className="opacity-25" />}
                    </button>
                  </Th>
                  <Th col="card"        width={widths.card}        onMouseDown={onMouseDown}>{t('common.card')}</Th>
                  <Th col="comment"     width={widths.comment}     onMouseDown={onMouseDown}>{t('common.description')}</Th>
                  <th className="w-24 shrink-0" />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <>
                    {[1,2,3,4,5,6,7,8].map(i => (
                      <tr key={i} className="border-b border-white/[0.03]">
                        <td colSpan={11} className="px-4 py-1"><SkeletonRow /></td>
                      </tr>
                    ))}
                  </>
                ) : displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-16 text-muted text-xs">
                      {hasFilters ? t('tx.noMatch') : t('tx.noTx')}
                    </td>
                  </tr>
                ) : displayRows.map(row => {
                  const typeInfo = TYPES_MAP[row.type] ?? { label: row.type, color: '#9ca3af' }
                  const impValue = row.importance ?? null
                  const imp = impValue ? impMap[impValue] : null
                  const isChild   = !!row.split_parent_id
                  const isParent  = !!row.is_split_parent
                  const isOrphan  = orphanChildIds.has(row.id)

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-white/[0.03] last:border-0 group ${isChild ? 'bg-white/[0.01]' : ''}`}
                    >
                      {/* Receiver — click to open detail modal */}
                      <td className="px-3 py-3 overflow-hidden cursor-pointer" style={{ width: widths.description, maxWidth: widths.description }}
                        onClick={() => setDetailTx(row)}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isParent && (
                            <button
                              type="button"
                              onClick={() => toggleParent(row.id)}
                              className="shrink-0 text-white/30 hover:text-white/70 transition-colors"
                              title={collapsedParents.has(row.id) ? 'Expand' : 'Collapse'}
                            >
                              <ChevronDown size={13} className="transition-transform" style={{ transform: collapsedParents.has(row.id) ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
                            </button>
                          )}
                          {isChild && !isOrphan && (
                            <span className="text-white/20 text-xs shrink-0 ml-1">↳</span>
                          )}
                          {isOrphan && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                              split
                            </span>
                          )}
                          {row.type === 'transfer' && typeInfo.Icon ? (
                            <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center shrink-0"
                              style={{ color: typeInfo.color }}>
                              <typeInfo.Icon size={13} strokeWidth={2} />
                            </div>
                          ) : row.type === 'savings' ? (
                            <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center shrink-0"
                              style={{ color: typeInfo.color }}>
                              <PiggyBank size={13} strokeWidth={2} />
                            </div>
                          ) : row.type === 'cash_out' ? (
                            <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center shrink-0"
                              style={{ color: typeInfo.color }}>
                              <Banknote size={13} strokeWidth={2} />
                            </div>
                          ) : row.type === 'invest' && typeInfo.Icon ? (
                            <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center shrink-0"
                              style={{ color: typeInfo.color }}>
                              <typeInfo.Icon size={13} strokeWidth={2} />
                            </div>
                          ) : (
                            <ReceiverAvatar receiver={row.receiver} />
                          )}
                          <span className="truncate text-white/90 text-sm">
                            {row.description || <span className="text-white/25 italic">—</span>}
                          </span>
                        </div>
                      </td>


                      {/* Importance */}
                      <td className="px-3 py-3 overflow-hidden" style={{ width: widths.importance, maxWidth: widths.importance }}>
                        {imp ? (
                          <span className="flex items-center gap-[3px]" title={imp.label}>
                            {Array.from({ length: 4 }).map((_, i) => (
                              <span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: i < imp.dots ? imp.color : imp.color + '30' }}
                              />
                            ))}
                          </span>
                        ) : <span className="text-white/20">—</span>}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3 text-right tabular-nums font-medium overflow-hidden"
                        style={{ width: widths.amount, maxWidth: widths.amount, color: isParent ? 'rgba(255,255,255,0.2)' : amountColor(row.type, row.source) }}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {row.type === 'expense' && txPaybackMap[row.id] > 0 && (
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenPayback(openPayback === row.id ? null : row.id) }}
                                className="p-0.5 rounded text-white/30 hover:text-white/60 transition-colors"
                              >
                                <CornerDownLeft size={9} />
                              </button>
                              {openPayback === row.id && (
                                <div className="absolute right-0 top-full mt-1 z-50 glass-popup border border-white/15 rounded-xl p-2.5 shadow-xl" style={{ minWidth: 148 }}>
                                  <div className="flex justify-between gap-4 text-[11px]">
                                    <span className="text-white/40">Original</span>
                                    <span className="text-white/40 line-through tabular-nums">−{fmt(Math.abs(row.amount))}</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-[11px] mt-0.5">
                                    <span className="text-white/40">Payback</span>
                                    <span className="text-green-400 tabular-nums">+{fmt(txPaybackMap[row.id])}</span>
                                  </div>
                                  <div className="h-px bg-white/10 my-1.5" />
                                  <div className="flex justify-between gap-4 text-[11px] font-semibold">
                                    <span className="text-white/60">Net</span>
                                    <span className="text-white/80 tabular-nums">−{fmt(Math.max(0, Math.abs(row.amount) - txPaybackMap[row.id]))}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {isParent
                            ? <span className="flex items-center gap-1.5">
                                <Scissors size={10} className="opacity-60" />
                                <span className="line-through">{amountSign(row.type, row.source, row.amount)}{fmt(Math.abs(row.amount))}</span>
                              </span>
                            : row.type === 'expense' && txPaybackMap[row.id] > 0
                              ? <>{amountSign(row.type, row.source, row.amount)}{fmt(Math.max(0, Math.abs(row.amount) - txPaybackMap[row.id]))}</>
                              : <>{amountSign(row.type, row.source, row.amount)}{fmt(Math.abs(row.amount))}</>
                          }
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3 overflow-hidden" style={{ width: widths.category, maxWidth: widths.category }}>
                        {row.category
                          ? <CategoryPill name={row.category.name} color={row.category.color} icon={row.category.icon} />
                          : <span className="text-white/20">—</span>}
                      </td>

                      {/* Subcategory */}
                      <td className="px-3 py-3 overflow-hidden" style={{ width: widths.subcategory, maxWidth: widths.subcategory }}>
                        {row.subcategory
                          ? <CategoryPill name={row.subcategory.name} color={row.subcategory.color} icon={row.subcategory.icon} />
                          : <span className="text-white/20">—</span>}
                      </td>

                      {/* Label */}
                      <td className="px-3 py-3 overflow-hidden" style={{ width: widths.label, maxWidth: widths.label }}>
                        <div className="flex flex-wrap gap-1 items-center">
                          {row.source && row.type !== 'cash_out' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/50 capitalize">
                              {row.source.replace(/_/g, ' ')}
                            </span>
                          )}
                          {row.type === 'income' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/50">
                              {row.linked_expense_id ? 'Payback' : row.is_earned ? t('source.earned') : t('source.gifted')}
                            </span>
                          )}
                          {(row.type === 'income' || row.type === 'expense') && row.is_cash && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/50">{t('source.cash')}</span>
                          )}
                          {row.label && (
                            <span className="text-[10px] text-white/50 truncate">{row.label}</span>
                          )}
                          {row.type === 'transfer' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/50">
                              {t('type.transfer')}
                            </span>
                          )}
                          {row.type === 'cash_out' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/50">
                              {t('type.cash_out')}
                            </span>
                          )}
                          {row.type === 'invest' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/50">
                              {t('type.invest')}
                            </span>
                          )}
                          {row.linked_expense_id && (
                            <button
                              onClick={e => { e.stopPropagation(); setDetailTx(row) }}
                              className="text-[10px] px-1.5 py-0.5 rounded-full transition-colors"
                              style={{ background: 'rgba(251,191,36,0.12)', color: 'rgba(251,191,36,0.7)' }}
                              title="View linked expense">
                              → expense
                            </button>
                          )}
                          {!row.source && !row.label && row.type !== 'income' && !row.is_cash && row.type !== 'transfer' && row.type !== 'cash_out' && row.type !== 'invest' && !row.linked_expense_id && (
                            <span className="text-white/20">—</span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 text-white/50 whitespace-nowrap text-xs overflow-hidden" style={{ width: widths.date, maxWidth: widths.date }}>
                        {new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>

                      {/* Card */}
                      <td className="px-3 py-3 text-white/60 truncate overflow-hidden" style={{ width: widths.card, maxWidth: widths.card }}>
                        {row.card?.name ?? (row.is_cash
                          ? <span className="text-white/40">Cash</span>
                          : <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-3 py-3 text-white/40 text-xs truncate overflow-hidden" style={{ width: widths.comment, maxWidth: widths.comment }}>
                        {row.comment ?? ''}
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-0.5">
                          {/* Scissors — always visible for expense rows */}
                          {row.type === 'expense' && !isChild && (
                            <button
                              onClick={() => setSplitTx(row)}
                              title={isParent ? 'Edit split' : 'Split transaction'}
                              className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/8 transition-colors"
                            >
                              <Scissors size={13} />
                            </button>
                          )}
                          {/* Payback — visible on all expense rows (parent, child, regular) */}
                          {row.type === 'expense' && (
                            <button
                              onClick={() => setPaybackFor(row)}
                              title={isParent ? 'Log payback (select a child)' : 'Log payback for this expense'}
                              className="p-1.5 rounded-lg text-white/25 hover:text-accent hover:bg-white/8 transition-colors"
                            >
                              <CornerDownLeft size={13} />
                            </button>
                          )}
                          {/* Pencil + Delete — hover only */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isChild && (
                              <button
                                onClick={() => setEditingTx(row)}
                                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(row)}
                              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer totals */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04] bg-white/[0.015]">
            {/* Left: income + expenses */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-muted">{t('dash.income')}</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: TYPES_MAP['income'].color }}>
                  +{fmt(totalIncome)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-muted">{t('dash.expenses')}</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: TYPES_MAP['expense'].color }}>
                  −{fmt(totalExpenses)}
                </span>
              </div>
            </div>

            {/* Right: net */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest text-muted">{t('tx.net')}</span>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: net >= 0 ? TYPES_MAP['income'].color : TYPES_MAP['expense'].color }}
              >
                {net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}
              </span>
            </div>
          </div>

      </div>

      {editingTx && (
        <AddTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}
      {paybackFor && (
        <AddTransactionModal
          transaction={{
            type: 'income',
            // split parents: don't pre-link — user will pick a child via the search
            linked_expense_id: paybackFor.is_split_parent ? null : paybackFor.id,
            amount: paybackFor.is_split_parent ? undefined : paybackFor.amount,
            date: new Date().toISOString().slice(0, 10),
            description: paybackFor.is_split_parent ? '' : (paybackFor.description ? `Payback: ${paybackFor.description}` : ''),
            card_id: paybackFor.card_id,
          }}
          paybackParentId={paybackFor.is_split_parent ? paybackFor.id : null}
          onClose={() => setPaybackFor(null)}
        />
      )}

      {splitTx && (
        <SplitTransactionModal
          transaction={splitTx}
          existingChildren={rows.filter(r => r.split_parent_id === splitTx.id)}
          allCategories={allCategories}
          onClose={() => setSplitTx(null)}
        />
      )}

      {detailTx && (
        <TransactionDetailModal
          tx={detailTx}
          linkedTx={detailTx.linked_expense_id ? rows.find(r => r.id === detailTx.linked_expense_id) ?? null : null}
          onClose={() => setDetailTx(null)}
          onViewLinked={tx => setDetailTx(tx)}
          fmt={fmt}
          t={t}
          impMap={impMap}
        />
      )}
    </div>
  )
}
