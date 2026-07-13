import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { txMatchesBudget } from '../utils/budgetMatch'
import { toLocalStr, getPeriodBounds, getPeriodPct, calcAllBudgetSpends } from '../utils/budgetPeriod'
import { createPortal } from 'react-dom'
import { Plus, Pencil, ChevronDown, Trash2, Info, X, History, Pin, PinOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSharedData } from '../context/SharedDataContext'
import Navbar from '../components/dashboard/Navbar'
import { CategoryPill } from '../components/shared/CategoryPill'
import { OwnerBadges } from '../components/shared/OwnerBadges'
import { useImportance } from '../hooks/useImportance'
import { useThemeColors } from '../hooks/useThemeColors'
import AddBudgetModal from '../components/budgets/AddBudgetModal'
import { usePreferences } from '../context/UserPreferencesContext'


function barColor(pct) {
  if (pct >= 80) return 'var(--color-alert)'
  if (pct >= 50) return 'var(--color-warning)'
  return 'var(--color-progress-bar)'
}

// ── Importance dots ────────────────────────────────────────────
function ImpDots({ imp }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex gap-[3px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full"
            style={{ background: i < imp.dots ? imp.color : imp.color + '30' }} />
        ))}
      </span>
      <span className="text-sm font-medium" style={{ color: imp.color }}>{imp.label}</span>
    </span>
  )
}

// ── Suggested (no-budget) placeholder card ────────────────────
function SuggestedLimitCard({ cat, avgSpend, onAdd }) {
  const { fmt } = usePreferences()
  return (
    <div onClick={onAdd}
      className="flex flex-col gap-2.5 p-4 rounded-xl border border-dashed border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.025] transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-2">
        <CategoryPill name={cat.name} color={cat.color} icon={cat.icon} />
        <span className="text-[10px] text-white/20 group-hover:text-white/50 transition-colors whitespace-nowrap shrink-0">+ Set limit</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-lg font-bold text-white/20 tabular-nums">{fmt(avgSpend)}</span>
        <span className="text-[10px] text-white/20">avg/mo · no limit</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
        <div className="h-full w-2/3 rounded-full bg-white/[0.09]" />
      </div>
    </div>
  )
}

// ── Section sort dropdown ─────────────────────────────────────
function SortPill({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const current = options.find(o => o.value === value)
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/55 transition-colors px-1.5 py-0.5 rounded-md hover:bg-white/5">
        {current?.label}
        <ChevronDown size={8} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 glass-popup border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[130px]">
          {options.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-[11px] hover:bg-white/5 transition-colors ${value === opt.value ? 'text-white/80 font-medium' : 'text-white/40'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
const LIMIT_SORT_OPTS  = [{ value: 'pct', label: '% used' }, { value: 'spend', label: 'Highest spend' }, { value: 'alpha', label: 'A → Z' }]

// ── Budget Transactions Modal ──────────────────────────────────
function BudgetTransactionsModal({ filter, currentDate, catMap, onClose }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      setLoading(true)
      const period = filter.budget?.period ?? 'monthly'
      const cardId = filter.budget?.card_id ?? null
      const { startStr: start, endStr: end } = getPeriodBounds(period, currentDate, filter.budget?.reset_day)

      let query = supabase
        .from('transactions')
        .select('id, date, description, amount, category_id, subcategory_id, receiver_id, importance')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .eq('type', 'expense')
        .eq('is_split_parent', false)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })

      if (cardId) query = query.eq('card_id', cardId)

      // Only apply single-column DB filter when it's safe (single-value, no multi-select budget)
      const budget = filter.budget
      const hasMultiSelect = budget && (
        budget.category_ids?.length > 1 || budget.subcategory_ids?.length > 1 ||
        budget.importance_ids?.length > 1 || budget.receiver_ids?.length > 1
      )
      if (!hasMultiSelect) {
        if (filter.dimension === 'category')    query = query.eq('category_id',    filter.id)
        if (filter.dimension === 'subcategory') query = query.eq('subcategory_id', filter.id)
        if (filter.dimension === 'merchant')    query = query.eq('receiver_id',    filter.id)
        if (filter.dimension === 'importance')  query = query.eq('importance',     filter.id)
      }

      const { data } = await query

      // Always post-filter using txMatchesBudget when a budget object is available
      // This correctly handles multi-select importance_ids, category_ids, etc.
      if (budget) {
        setTxs((data ?? []).filter(t => txMatchesBudget(t, budget)))
      } else if (filter.dimension === 'importance') {
        setTxs((data ?? []).filter(t => t.importance === filter.id))
      } else {
        setTxs(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [user?.id, filter, currentDate])

  const total = txs.reduce((s, t) => s + t.amount, 0)
  const periodLabel = (() => {
    const period = filter.budget?.period ?? 'monthly'
    if (period === 'weekly') {
      const { startStr } = getPeriodBounds(period, currentDate, filter.budget?.reset_day)
      return `Week of ${new Date(startStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
    if (period === 'quarterly') {
      const q = Math.floor(currentDate.getMonth() / 3) + 1
      return `Q${q} ${currentDate.getFullYear()}`
    }
    if (period === 'yearly') return `${currentDate.getFullYear()}`
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  })()

  return createPortal(
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-2xl w-full max-w-md flex flex-col shadow-2xl max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <Info size={14} className="text-white/40" />
            <div>
              <h2 className="text-sm font-semibold text-white">{t('budgets.transactions')}</h2>
              <p className="text-[11px] text-white/30">{periodLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Filter label */}
        <div className="px-6 py-3 border-b border-white/5 shrink-0">
          {filter.imp
            ? <ImpDots imp={filter.imp} />
            : <CategoryPill name={filter.label} color={filter.color} icon={filter.icon} />
          }
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 scrollbar-thin flex flex-col gap-0">
          {loading ? (
            <div className="text-center py-8 text-muted text-sm">{t('common.loading')}</div>
          ) : txs.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">{t('budgets.noTx')}</div>
          ) : txs.map(tx => {
            const cat = catMap[tx.subcategory_id] ?? catMap[tx.category_id]
            return (
              <div key={tx.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm text-white/90 truncate">
                    {tx.description || <span className="text-white/30 italic">{t('budgets.noDesc')}</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {cat && <CategoryPill name={cat.name} color={cat.color} icon={cat.icon} />}
                  </div>
                </div>
                <span className="text-sm font-medium tabular-nums shrink-0" style={{ color: 'var(--color-alert)' }}>
                  {fmt(tx.amount)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {!loading && txs.length > 0 && (
          <div className="px-6 py-4 border-t border-white/8 shrink-0 flex items-center justify-between">
            <span className="text-xs text-muted">{txs.length} transaction{txs.length !== 1 ? 's' : ''}</span>
            <span className="text-sm font-bold tabular-nums">{fmt(total)}</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── Budget History Section (inline on page) ───────────────────
function BudgetHistorySection({ budget, allExpenses, catMap, importanceLevels, currentDate, onClose }) {
  const { fmt } = usePreferences()
  const colors      = useThemeColors()
  const ref         = useRef(null)
  const limit       = budget.monthly_limit
  const period      = budget.period ?? 'monthly'
  const periodLabel = { weekly: '/wk', monthly: '/mo', quarterly: '/qtr', yearly: '/yr' }[period] ?? '/mo'

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [budget.id])

  const periodSpends = useMemo(() => {
    const byPeriod = {}
    for (const tx of allExpenses) {
      if (budget.card_id && tx.card_id !== budget.card_id) continue
      if (!txMatchesBudget(tx, budget)) continue
      let key
      if (period === 'weekly') {
        key = getPeriodBounds('weekly', new Date(tx.date + 'T12:00:00'), budget.reset_day).startStr
      } else if (period === 'quarterly') {
        const d = new Date(tx.date + 'T12:00:00')
        key = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`
      } else if (period === 'yearly') {
        key = tx.date.slice(0, 4)
      } else {
        key = tx.date.slice(0, 7)
      }
      byPeriod[key] = (byPeriod[key] ?? 0) + tx.amount
    }
    return byPeriod
  }, [budget, allExpenses, period])

  const yearGroups = useMemo(() => {
    const created = new Date(budget.created_at ?? Date.now())
    const byYear  = {}

    if (period === 'monthly') {
      const sy = created.getFullYear(), sm = created.getMonth()
      const ey = currentDate.getFullYear(), em = currentDate.getMonth()
      const count = (ey - sy) * 12 + (em - sm) + 1
      for (let i = 0; i < count; i++) {
        const d    = new Date(sy, sm + i, 1)
        const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const year = d.getFullYear()
        if (!byYear[year]) byYear[year] = []
        byYear[year].push({ key, label: d.toLocaleDateString('en-US', { month: 'short' }), spend: periodSpends[key] ?? null, isCurrent: i === count - 1 })
      }
    } else if (period === 'weekly') {
      const { startStr: firstWk } = getPeriodBounds('weekly', created, budget.reset_day)
      const { startStr: currWk }  = getPeriodBounds('weekly', currentDate, budget.reset_day)
      let d = new Date(firstWk + 'T12:00:00')
      const endD = new Date(currWk + 'T12:00:00')
      while (d <= endD) {
        const key  = toLocalStr(d)
        const year = d.getFullYear()
        if (!byYear[year]) byYear[year] = []
        byYear[year].push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, spend: periodSpends[key] ?? null, isCurrent: key === currWk })
        d = new Date(d.getTime() + 7 * 86400000)
      }
    } else if (period === 'quarterly') {
      let y = created.getFullYear(), q = Math.ceil((created.getMonth() + 1) / 3)
      const ey = currentDate.getFullYear(), eq = Math.ceil((currentDate.getMonth() + 1) / 3)
      while (y < ey || (y === ey && q <= eq)) {
        const key = `${y}-Q${q}`
        if (!byYear[y]) byYear[y] = []
        byYear[y].push({ key, label: `Q${q}`, spend: periodSpends[key] ?? null, isCurrent: y === ey && q === eq })
        q++; if (q > 4) { q = 1; y++ }
      }
    } else {
      for (let y = created.getFullYear(); y <= currentDate.getFullYear(); y++) {
        const key = `${y}`
        if (!byYear[y]) byYear[y] = []
        byYear[y].push({ key, label: `${y}`, spend: periodSpends[key] ?? null, isCurrent: y === currentDate.getFullYear() })
      }
    }

    return Object.entries(byYear).sort(([a], [b]) => a - b).map(([year, months]) => {
      const first = months[0], last = months.at(-1)
      const rangeLabel = period === 'weekly' ? ` · ${first.label} – ${last.label}` : ''
      return { year: Number(year), months, rangeLabel }
    })
  }, [budget, periodSpends, currentDate, period])

  const allWithData = yearGroups.flatMap(g => g.months).filter(m => m.spend !== null)
  const totalOver   = allWithData.filter(m => m.spend > limit).length
  const totalUnder  = allWithData.filter(m => m.spend <= limit).length
  const bestPeriod  = allWithData.length > 0
    ? allWithData.reduce((a, b) => (b.spend ?? Infinity) < (a.spend ?? Infinity) ? b : a, allWithData[0])
    : null

  // Budget label
  let nameEl
  if (budget.category_ids?.length) {
    const cats = budget.category_ids.map(id => catMap[id]).filter(Boolean)
    nameEl = <CategoryPill name={budget.name || cats.map(c => c.name).join(' · ')} color={cats[0]?.color} icon={cats[0]?.icon} />
  } else if (budget.category_id) {
    const cat = catMap[budget.category_id]
    nameEl = <CategoryPill name={budget.name || cat?.name || '—'} color={cat?.color} icon={cat?.icon} />
  } else if (budget.subcategory_id) {
    const cat = catMap[budget.subcategory_id]
    nameEl = <CategoryPill name={budget.name || cat?.name || '—'} color={cat?.color} icon={cat?.icon} />
  } else if (budget.importance) {
    const imp = importanceLevels.find(i => i.value === budget.importance)
    nameEl = imp ? <ImpDots imp={imp} /> : null
  } else {
    nameEl = <span className="text-sm font-semibold text-white">{budget.name || 'Budget'}</span>
  }

  return (
    <div ref={ref} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <History size={13} className="text-white/40" />
          <div className="flex items-center gap-2">
            {nameEl}
            <span className="text-[11px] text-white/30">{fmt(limit)}{periodLabel} limit</span>
            {budget.period && budget.period !== 'monthly' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">
                {{ weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly' }[budget.period]}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-[11px] tabular-nums text-white/40">
            <span><span style={{ color: colors.income }}>{totalUnder}</span> under</span>
            <span><span style={{ color: colors.expense }}>{totalOver}</span> over</span>
            {bestPeriod && (
              <span className="text-white/25">best <span style={{ color: colors.income }}>{fmt(bestPeriod.spend ?? 0)}</span></span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Year charts */}
      <div className="flex flex-col gap-6 px-4 py-4">
        {yearGroups.length === 0 ? (
          <p className="text-xs text-white/25 text-center py-6">No history yet</p>
        ) : yearGroups.map(({ year, months, rangeLabel }) => (
          <YearChart
            key={year}
            yearLabel={`${year}${rangeLabel}`}
            months={months}
            tgt={limit}
            colors={colors}
            uid={`bh-${budget.id}-${year}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Budget card (category / subcategory / importance) ──────────
function BudgetCard({ label, subtitle, color, icon, imp, spent, limit, rolloverAmount, projectedEnd, periodPct, period, cardName, ownerIds, householdMembers, splitLabel, pinned, onPin, onEdit, onInfo, onHistory }) {
  const { fmt } = usePreferences()
  const rollover       = rolloverAmount > 0 ? rolloverAmount : 0
  const effectiveLimit = limit + rollover
  const budgetPct      = effectiveLimit > 0 ? Math.min((spent / effectiveLimit) * 100, 100) : 0
  const budgetPctRaw   = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : 0
  const over           = spent > effectiveLimit
  const periodBadge    = period && period !== 'monthly'
    ? { weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly' }[period]
    : null

  // Pacing: how far through budget vs how far through period
  const slack = (periodPct != null && periodPct > 0) ? periodPct - budgetPctRaw : null
  let paceText  = null
  let paceColor = 'rgba(255,255,255,0.3)'
  if (over) {
    paceText  = `${fmt(spent - effectiveLimit)} over budget`
    paceColor = 'var(--color-alert)'
  } else if (slack !== null) {
    const abs = Math.abs(slack)
    if (abs < 1)      { paceText = 'on pace';                          paceColor = 'rgba(255,255,255,0.35)' }
    else if (slack > 0) { paceText = `${abs.toFixed(1)}% under pace`;  paceColor = 'var(--color-progress-bar)' }
    else                { paceText = `${abs.toFixed(1)}% over pace`;   paceColor = abs > 10 ? 'var(--color-alert)' : 'var(--color-warning)' }
  }

  return (
    <div onClick={onEdit}
      className="group relative flex flex-col gap-2.5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.05] transition-all cursor-pointer">

      {/* Label + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          {imp && !label ? (
            <ImpDots imp={imp} />
          ) : (
            <div className="flex items-center gap-1.5">
              {color && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />}
              <span className="text-sm font-semibold text-white leading-tight truncate">{label || '—'}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-[10px] text-white/30 truncate pl-3.5">{subtitle}</span>
          )}
          {splitLabel && (
            <span className="text-[10px] text-white/30 truncate pl-3.5">{splitLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {onPin && (
            <button type="button" onClick={e => { e.stopPropagation(); onPin() }}
              className={`transition-opacity text-white/50 hover:!opacity-100 ${pinned ? 'opacity-60' : 'opacity-0 group-hover:opacity-40'}`}
              title={pinned ? 'Unpin' : 'Pin as main budget'}>
              {pinned ? <PinOff size={11} /> : <Pin size={11} />}
            </button>
          )}
          {onHistory && (
            <button type="button" onClick={e => { e.stopPropagation(); onHistory() }}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-white/50">
              <History size={11} />
            </button>
          )}
          <button type="button" onClick={e => { e.stopPropagation(); onInfo() }}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-white/50">
            <Info size={11} />
          </button>
          <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity text-white/50" />
        </div>
      </div>

      {/* Period / card badges */}
      {(periodBadge || cardName) && (
        <div className="flex items-center gap-1.5 -mt-0.5 flex-wrap">
          {periodBadge && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">{periodBadge}</span>}
          {cardName    && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">
              {cardName}
              {ownerIds && householdMembers && <OwnerBadges ownerIds={ownerIds} members={householdMembers} size={12} />}
            </span>
          )}
        </div>
      )}

      {/* Dual-marker progress bar: fill = budget %, tick = period % */}
      <div className="relative h-2 w-full rounded-full bg-white/8">
        {rollover > 0 && (
          <div className="absolute inset-y-0 right-0 rounded-r-full"
            style={{ width: `${(rollover / effectiveLimit) * 100}%`, background: 'color-mix(in srgb, var(--color-progress-bar) 22%, transparent)' }} />
        )}
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{ width: `${budgetPct}%`, background: barColor(budgetPct) }} />
        {periodPct != null && periodPct > 0 && (
          <div className="absolute top-[-2px] bottom-[-2px] w-[2px] -translate-x-1/2 rounded-full"
            style={{ left: `${Math.min(periodPct, 99)}%`, background: 'rgba(255,255,255,0.45)' }} />
        )}
      </div>

      {/* Pacing verdict — primary signal */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: paceColor }}>
          {paceText ?? (effectiveLimit > 0 ? `${fmt(effectiveLimit - spent)} remaining` : '—')}
        </span>
        {periodPct != null && periodPct > 0 && (
          <span className="text-[10px] tabular-nums text-white/20 shrink-0">
            {periodPct.toFixed(0)}% into period
          </span>
        )}
      </div>

      {/* Projected end — secondary */}
      {projectedEnd != null && !over && (
        <span className="text-[10px] tabular-nums -mt-1"
          style={{ color: projectedEnd > effectiveLimit ? 'var(--color-warning)' : 'rgba(255,255,255,0.18)' }}>
          projected {fmt(projectedEnd)} by period end
        </span>
      )}

      {/* Spent / limit — tertiary */}
      <div className="flex items-baseline gap-1 tabular-nums border-t border-white/[0.04] pt-2 mt-0.5">
        <span className="text-xs font-medium" style={{ color: over ? 'var(--color-alert)' : 'rgba(255,255,255,0.5)' }}>
          {fmt(spent)}
        </span>
        <span className="text-[10px] text-white/20">
          / {fmt(limit)}
          {rollover > 0 && <span className="ml-1" style={{ color: 'var(--color-progress-bar)' }}>+{fmt(rollover)}</span>}
        </span>
      </div>
    </div>
  )
}

// ── Year chart (shared by BudgetHistorySection) ────────────────
function YearChart({ yearLabel, months, tgt, colors, uid }) {
  const { fmt, t } = usePreferences()
  const pts = (() => {
    const vals = months.filter(m => m.spend !== null)
    if (vals.length === 0) return []
    const max  = Math.max(...vals.map(m => m.spend), tgt) * 1.12
    const W = 500, H = 90, PAD = { t: 8, r: 8, b: 20, l: 8 }
    const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b
    const xOf = i => PAD.l + (vals.length > 1 ? (i / (vals.length - 1)) * iW : iW / 2)
    const yOf = v => PAD.t + (1 - Math.min(v, max) / max) * iH
    return { vals, max, W, H, PAD, iW, iH, xOf, yOf, targetY: yOf(tgt) }
  })()

  if (!pts.vals) return (
    <div className="text-[11px] text-white/25 py-2">{t('budgets.noData')}</div>
  )

  const { vals, W, H, PAD, iH, xOf, yOf, targetY } = pts
  const plotPts   = vals.map((m, i) => ({ ...m, x: xOf(i), y: yOf(m.spend) }))
  const areaPath  = plotPts.length > 1
    ? `${plotPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} L${plotPts.at(-1).x.toFixed(1)},${(PAD.t + iH).toFixed(1)} L${plotPts[0].x.toFixed(1)},${(PAD.t + iH).toFixed(1)} Z`
    : ''

  const met  = vals.filter(m => m.spend <= tgt).length
  const over = vals.filter(m => m.spend >  tgt).length
  const saved = vals.reduce((s, m) => s + Math.max(0, tgt - m.spend), 0)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/60">{yearLabel}</span>
        <span className="flex items-center gap-2 text-[11px] tabular-nums">
          <span style={{ color: colors.income }}>{met}✓</span>
          <span style={{ color: colors.expense }}>{over}✗</span>
          {saved > 0 && (
            <span className="ml-1 tabular-nums" style={{ color: 'var(--color-progress-bar)' }}>
              {t('budgets.savedAmt', { amount: fmt(saved) })}
            </span>
          )}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }}>
        <defs>
          <clipPath id={`${uid}-above`}>
            <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={Math.max(0, targetY - PAD.t)} />
          </clipPath>
          <clipPath id={`${uid}-below`}>
            <rect x={PAD.l} y={targetY} width={W - PAD.l - PAD.r} height={Math.max(0, PAD.t + iH - targetY)} />
          </clipPath>
        </defs>
        {areaPath && <path d={areaPath} fill="var(--color-progress-bar)" opacity="0.12" clipPath={`url(#${uid}-above)`} />}
        {areaPath && <path d={areaPath} fill="var(--color-alert)"        opacity="0.10" clipPath={`url(#${uid}-below)`} />}
        <line x1={PAD.l} y1={targetY} x2={W - PAD.r} y2={targetY}
          stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4 3" />
        {plotPts.slice(1).map((p, i) => {
          const prev   = plotPts[i]
          const under  = prev.spend <= tgt && p.spend <= tgt
          const overSeg = prev.spend > tgt && p.spend > tgt
          return (
            <line key={p.key}
              x1={prev.x.toFixed(1)} y1={prev.y.toFixed(1)}
              x2={p.x.toFixed(1)}   y2={p.y.toFixed(1)}
              stroke={under ? colors.progressBar : overSeg ? colors.alert : 'rgba(255,255,255,0.3)'}
              strokeWidth="1.8" strokeLinecap="round" />
          )
        })}
        {plotPts.map(p => (
          <circle key={p.key} cx={p.x} cy={p.y} r={p.isCurrent ? 3.5 : 2.5}
            fill={p.spend <= tgt ? colors.progressBar : colors.alert}
            opacity={p.isCurrent ? 1 : 0.6} />
        ))}
        {plotPts.map((p, i) => (
          <text key={`${p.key}-l`} x={p.x} y={H - 4} textAnchor="middle"
            fontSize="7" fill={p.isCurrent ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}>
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ── Budget Year Heatmap ───────────────────────────────────────
const BAR_MAX_H = 40

function BudgetHeatmap({ budgets, yearExpenses, catMap, importanceLevels, receivers, currentDate }) {
  const year      = currentDate.getFullYear()
  const today     = new Date()
  const todayYear = today.getFullYear()
  const todayMi   = today.getMonth() // 0-indexed

  const MONTH_LETTERS = ['J','F','M','A','M','J','J','A','S','O','N','D']
  const monthKeys = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)

  const monthlyBudgets = useMemo(
    () => budgets.filter(b => !b.period || b.period === 'monthly'),
    [budgets]
  )

  const expensesByMonth = useMemo(() => {
    const map = {}
    for (const t of yearExpenses) {
      const mk = t.date.slice(0, 7)
      if (!map[mk]) map[mk] = []
      map[mk].push(t)
    }
    return map
  }, [yearExpenses])

  const spendGrid = useMemo(() =>
    monthlyBudgets.map(b => ({
      budget: b,
      months: monthKeys.map(mk => {
        const txs = expensesByMonth[mk] ?? []
        return txs
          .filter(t => (!b.card_id || t.card_id === b.card_id) && txMatchesBudget(t, b))
          .reduce((s, t) => s + t.amount, 0)
      }),
    }))
  , [monthlyBudgets, expensesByMonth])

  function getBudgetLabel(b) {
    if (b.name) return b.name
    if (b.category_ids?.length)    return b.category_ids.map(id => catMap[id]?.name).filter(Boolean).join(' · ') || '—'
    if (b.category_id)             return catMap[b.category_id]?.name ?? '—'
    if (b.subcategory_ids?.length) return b.subcategory_ids.map(id => catMap[id]?.name).filter(Boolean).join(' · ') || '—'
    if (b.subcategory_id)          return catMap[b.subcategory_id]?.name ?? '—'
    if (b.importance_ids?.length)  return b.importance_ids.map(v => importanceLevels.find(i => i.value === v)?.label).filter(Boolean).join(' · ') || '—'
    if (b.importance)              return importanceLevels.find(i => i.value === b.importance)?.label ?? '—'
    if (b.receiver_ids?.length)    return b.receiver_ids.map(id => receivers.find(r => r.id === id)?.name).filter(Boolean).join(' · ') || 'Merchant'
    if (b.receiver_id)             return receivers.find(r => r.id === b.receiver_id)?.name ?? 'Merchant'
    return 'Total'
  }

  function isFutureMonth(mi) {
    if (year < todayYear) return false
    if (year > todayYear) return true
    return mi > todayMi
  }
  function isCurrentMonth(mi) { return year === todayYear && mi === todayMi }

  if (monthlyBudgets.length === 0) return null

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-xs font-semibold text-white/80 uppercase tracking-widest">Year Overview</h2>
        <p className="text-[11px] text-muted mt-0.5">Monthly budget performance · {year}</p>
      </div>

      {/* Month letter labels */}
      <div className="flex items-center gap-1" style={{ paddingLeft: 120 }}>
        {MONTH_LETTERS.map((m, i) => (
          <div key={i} className={`flex-1 text-center text-[9px] font-medium ${isCurrentMonth(i) ? 'text-white/60' : 'text-white/20'}`}>
            {m}
          </div>
        ))}
      </div>

      {/* Sparkline rows */}
      <div className="flex flex-col gap-3">
        {spendGrid.map(({ budget: b, months }) => {
          const label = getBudgetLabel(b)
          return (
            <div key={b.id} className="flex items-end gap-1">
              <div className="shrink-0 text-[11px] text-white/50 truncate pb-0.5" style={{ width: 120 }} title={label}>
                {label}
              </div>
              {months.map((spend, mi) => {
                const pct    = b.monthly_limit > 0 ? spend / b.monthly_limit : 0
                const over   = pct > 1
                const fut    = isFutureMonth(mi) && spend === 0
                const curr   = isCurrentMonth(mi)
                const barH   = fut ? 3 : Math.max(3, Math.min(BAR_MAX_H, pct * BAR_MAX_H))
                const bg     = fut  ? 'rgba(255,255,255,0.07)'
                             : over ? `rgba(239,68,68,${curr ? 0.85 : 0.55})`
                             :        `rgba(34,197,94,${curr ? 0.70 : 0.40})`
                return (
                  <div key={mi} className="flex-1 flex flex-col justify-end" style={{ height: BAR_MAX_H }}>
                    <div className="w-full rounded-sm" style={{ height: barH, background: bg }} />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Budgets() {
  const { user } = useAuth()
  const { fmt, fmtK, t } = usePreferences()
  const { importance: importanceLevels } = useImportance()
  const { cards, budgets, householdMembers } = useSharedData()

  const [currentDate,   setCurrentDate]   = useState(new Date())
  const [categories,    setCategories]    = useState([])
  const [yearExpenses,  setYearExpenses]  = useState([])
  const [allExpenses,   setAllExpenses]   = useState([])
  const [receivers,     setReceivers]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modal,         setModal]         = useState(null)
  const [modalDefDim,   setModalDefDim]   = useState('category')
  const [modalDefId,    setModalDefId]    = useState(null)
  const [modalDefLimit, setModalDefLimit] = useState(0)
  const [modalDefName,  setModalDefName]  = useState('')
  const [searchParams, setSearchParams]  = useSearchParams()
  const [infoFilter,    setInfoFilter]    = useState(null)
  const [historyBudget, setHistoryBudget] = useState(null)
  const [limitsSortBy, setLimitsSortBy] = useState('pct')   // 'pct'|'spend'|'alpha'
  const [showLimitsSort, setShowLimitsSort] = useState(false)

  // FLIP animation refs for Limits columns
  const limitsSnapRef     = useRef({})
  const limitsColRefs     = useRef({ cat: null, sub: null, imp: null, rec: null })
  const [limitsPromoted,  setLimitsPromoted]  = useState(new Set())

  async function togglePin(budgetId, currentPinned) {
    await supabase.from('budgets').update({ pinned: !currentPinned }).eq('id', budgetId)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
  }

  // Auto-open budget modal from URL params (e.g. from Financial Situation tab)
  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    const name  = searchParams.get('name')  ?? ''
    const limit = parseFloat(searchParams.get('limit')) || 0
    const dim   = searchParams.get('dim')   ?? 'all'
    setModalDefName(name)
    setModalDefLimit(limit)
    setModalDefDim(dim)
    setModalDefId(null)
    setModal('new')
    setSearchParams({}, { replace: true })
  }, [searchParams])

  // Year-scoped data (re-fetches when currentDate's year changes)
  useEffect(() => {
    if (!user?.id) return
    async function load() {
      setLoading(true)
      const year  = currentDate.getFullYear()
      const start = `${year}-01-01`
      const end   = `${year}-12-31`

      const [{ data: txs }, { data: cats }] = await Promise.all([
        supabase.from('transactions')
          .select('amount, category_id, subcategory_id, receiver_id, card_id, date, importance')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .eq('type', 'expense')
          .eq('is_split_parent', false)
          .gte('date', start)
          .lte('date', end),
        supabase.from('categories').select('*').eq('user_id', user.id),
      ])

      setYearExpenses(txs  ?? [])
      setCategories(cats   ?? [])
      setLoading(false)
    }

    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])

  // All-time data for historical averages (only re-fetches when user changes)
  useEffect(() => {
    if (!user?.id) return
    async function loadAllTime() {
      const [{ data: allTxs }, { data: recData }] = await Promise.all([
        supabase.from('transactions')
          .select('amount, category_id, subcategory_id, receiver_id, card_id, date, importance')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .eq('type', 'expense')
          .eq('is_split_parent', false),
        supabase.from('receivers').select('id, name, domain, type, logo_url').eq('user_id', user.id),
      ])
      setAllExpenses(allTxs ?? [])
      setReceivers(recData ?? [])
    }
    loadAllTime()
    window.addEventListener('transaction-saved', loadAllTime)
    return () => window.removeEventListener('transaction-saved', loadAllTime)
  }, [user?.id])

  // FLIP helper: call before render (snapshot) then after render (animate)
  function snapPositions(colRef, snapMap) {
    if (!colRef) return
    colRef.querySelectorAll('[data-flip-id]').forEach(el => {
      snapMap[el.dataset.flipId] = el.getBoundingClientRect()
    })
  }
  function animateFlip(colRef, snapMap, promotedSet) {
    if (!colRef) return
    colRef.querySelectorAll('[data-flip-id]').forEach(el => {
      const id   = el.dataset.flipId
      const prev = snapMap[id]
      if (!prev) { snapMap[id] = el.getBoundingClientRect(); return }
      const curr = el.getBoundingClientRect()
      const dy   = prev.top - curr.top
      snapMap[id] = curr
      if (Math.abs(dy) < 3) return
      el.style.transform = `translateY(${dy}px)`
      el.style.transition = 'none'
      void el.getBoundingClientRect()
      el.style.transition = 'transform 360ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      el.style.transform  = ''
      el.addEventListener('transitionend', () => { el.style.transform = ''; el.style.transition = '' }, { once: true })
      if (dy > 3) promotedSet.add(id)
    })
  }

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const cardMap = useMemo(() =>
    Object.fromEntries(cards.map(c => [c.id, c])), [cards])

  function splitLabelText(b) {
    const entries = Object.entries(b.member_splits ?? {})
    if (!entries.length) return null
    return entries.map(([id, amt]) => `${householdMembers.find(m => m.id === id)?.name ?? '?'} ${fmt(amt)}`).join(' · ')
  }

  // Per-budget spending: respects period and optional card filter
  const budgetSpends = useMemo(
    () => calcAllBudgetSpends(budgets, yearExpenses, currentDate),
    [budgets, yearExpenses, currentDate]
  )

  // All-time average monthly spend per dimension (for budget baseline benchmarking)
  function buildAvgMap(keyFn) {
    const acc = {}
    for (const t of allExpenses) {
      const key = keyFn(t)
      if (!key) continue
      if (!acc[key]) acc[key] = { total: 0, months: new Set() }
      acc[key].total += t.amount
      acc[key].months.add(t.date.slice(0, 7))
    }
    return Object.fromEntries(
      Object.entries(acc).map(([id, { total, months }]) => [id, total / months.size])
    )
  }

  const avgByCategory    = useMemo(() => buildAvgMap(t => t.category_id),    [allExpenses])
  const avgBySubcategory = useMemo(() => buildAvgMap(t => t.subcategory_id), [allExpenses])

  // Summary stats
  const allBudgets      = budgets.filter(b => !b.category_id && !b.subcategory_id && !b.importance && !b.receiver_id && !b.category_ids?.length && !b.subcategory_ids?.length && !b.importance_ids?.length && !b.receiver_ids?.length)
  const catBudgets      = budgets.filter(b => b.category_id || b.category_ids?.length)
  const subBudgets      = budgets.filter(b => b.subcategory_id || b.subcategory_ids?.length)
  const impBudgets      = budgets.filter(b => b.importance || b.importance_ids?.length)
  const recBudgets      = budgets.filter(b => b.receiver_id || b.receiver_ids?.length)
  const pinnedDimBudgets = [...catBudgets, ...subBudgets, ...impBudgets, ...recBudgets].filter(b => b.pinned)

  const totalBudgeted = budgets.reduce((s, b) => s + b.monthly_limit, 0)
  const totalSpent    = Object.values(budgetSpends).reduce((s, v) => s + v, 0)

  const annualSavingsIfMet = useMemo(() => {
    return budgets.reduce((acc, b) => {
      return acc + Math.max(0, (budgetSpends[b.id] ?? 0) - b.monthly_limit)
    }, 0) * 12
  }, [budgets, budgetSpends])

  const overBudgetCount = budgets.filter(b => (budgetSpends[b.id] ?? 0) > b.monthly_limit).length

  const dateStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Spending pace helper — projects spend to end of the budget's period (current period only)
  const calcProjected = useCallback((b, spent) => {
    const now    = new Date()
    const { startStr, endStr } = getPeriodBounds(b.period ?? 'monthly', currentDate, b.reset_day)
    const start  = new Date(startStr + 'T00:00:00')
    const end    = new Date(endStr   + 'T23:59:59')
    if (now < start || now > end) return null
    const totalDays   = Math.round((end - start) / 86400000) + 1
    const daysElapsed = Math.max(1, Math.round((now - start) / 86400000) + 1)
    return (spent / daysElapsed) * totalDays
  }, [currentDate])

  // FLIP animation: runs when budget spends or sort changes
  useLayoutEffect(() => {
    const promoted = new Set()
    Object.entries(limitsColRefs.current).forEach(([, ref]) => {
      if (ref) animateFlip(ref, limitsSnapRef.current, promoted)
    })
    if (promoted.size > 0) {
      setLimitsPromoted(promoted)
      const t = setTimeout(() => setLimitsPromoted(new Set()), 1500)
      return () => clearTimeout(t)
    }
  }, [budgetSpends, limitsSortBy])

  // Snapshot Limits positions before next paint (so FLIP has old rects)
  useEffect(() => {
    Object.entries(limitsColRefs.current).forEach(([, ref]) => {
      if (ref) snapPositions(ref, limitsSnapRef.current)
    })
  })

  // Sorted budget lists
  function sortBudgets(list, sortBy) {
    return [...list].sort((a, b) => {
      if (sortBy === 'pct') {
        const pa = (budgetSpends[a.id] ?? 0) / (a.monthly_limit || 1)
        const pb = (budgetSpends[b.id] ?? 0) / (b.monthly_limit || 1)
        return pb - pa
      }
      if (sortBy === 'spend') return (budgetSpends[b.id] ?? 0) - (budgetSpends[a.id] ?? 0)
      if (sortBy === 'alpha') {
        const na = a.name || (catMap[a.category_id ?? a.subcategory_id]?.name ?? '')
        const nb = b.name || (catMap[b.category_id ?? b.subcategory_id]?.name ?? '')
        return na.localeCompare(nb)
      }
      return 0
    })
  }

  function openNew(dim = 'category', id = null) {
    setModalDefDim(dim)
    setModalDefId(id)
    setModalDefLimit(0)
    setModalDefName('')
    setModal('new')
  }


  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar currentDate={currentDate}
        onPrev={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} />

      <div id="page-content" className="py-6 px-4 md:px-8 lg:px-16 pb-24 lg:pb-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.budgets')}</h1>
            <p className="text-muted text-sm mt-1">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openNew()}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
              <Plus size={14} /> {t('budgets.addBudget')}
            </button>
          </div>
        </div>

        {/* Top row: stat cards 2×2 (35%) + main budget */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="grid grid-cols-2 gap-3 w-full md:w-[35%] md:shrink-0">
          {[
            {
              label: t('budgets.active'),
              value: budgets.length,
              sub:   [
                `${catBudgets.length} cat`,
                `${subBudgets.length} sub`,
                (impBudgets.length + recBudgets.length) > 0 && `${impBudgets.length + recBudgets.length} legacy`,
              ].filter(Boolean).join(' · '),
              color: undefined,
            },
            {
              label: t('budgets.totalBudgeted'),
              value: fmtK(totalBudgeted),
              sub:   t('budgets.monthlyLimit'),
              color: undefined,
            },
            {
              label: t('budgets.periodSpend'),
              value: fmtK(totalSpent),
              sub:   totalBudgeted > 0 ? t('budgets.pctOfBudget', { n: Math.round((totalSpent / totalBudgeted) * 100) }) : '—',
              color: totalSpent > totalBudgeted ? 'var(--color-alert)' : undefined,
            },
            {
              label: annualSavingsIfMet > 0 ? t('budgets.potentialYr') : t('budgets.onTrack'),
              value: annualSavingsIfMet > 0 ? `+${fmtK(annualSavingsIfMet)}` : '✓',
              sub:   annualSavingsIfMet > 0 ? t('budgets.overLimit', { n: overBudgetCount }) : t('budgets.allOnTrack'),
              color: 'var(--color-progress-bar)',
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="glass-card rounded-2xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-medium text-muted">{label}</span>
              <span className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
              {sub && <span className="text-[11px] leading-tight text-muted">{sub}</span>}
            </div>
          ))}
          </div>

          {loading ? (
            <div className="flex-1 glass-card rounded-2xl p-5 flex items-center justify-center" style={{ minHeight: 160 }}>
              <p className="text-sm text-muted">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="flex-1 min-w-0 glass-card rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">{t('budgets.periodBudgets')}</span>
                {allBudgets.length === 0 && pinnedDimBudgets.length === 0 && (
                  <button onClick={() => openNew('all')}
                    className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                    <Plus size={11} /> Set budget
                  </button>
                )}
              </div>
              {allBudgets.length === 0 && pinnedDimBudgets.length === 0 ? (
                <p className="text-[11px] text-muted text-center py-2">
                  {t('budgets.noPeriod')}
                </p>
              ) : (
                <div className="grid gap-4 grid-cols-1">
                  {/* Pinned dimension budgets (e.g. category, importance) shown as main budgets */}
                  {pinnedDimBudgets.map(b => {
                    const getLabel = () => {
                      if (b.category_ids?.length)    { const cats = b.category_ids.map(id => catMap[id]).filter(Boolean); return { label: b.name || cats.map(c => c.name).join(' · '), color: cats[0]?.color, subtitle: b.name ? cats.map(c => c.name).join(' · ') : null } }
                      if (b.subcategory_ids?.length)  { const cats = b.subcategory_ids.map(id => catMap[id]).filter(Boolean); return { label: b.name || cats.map(c => c.name).join(' · '), color: cats[0]?.color, subtitle: b.name ? cats.map(c => c.name).join(' · ') : null } }
                      if (b.importance_ids?.length)   { const imps = b.importance_ids.map(v => importanceLevels.find(i => i.value === v)).filter(Boolean); return { label: b.name || imps.map(i => i.label).join(' · '), color: imps[0]?.color, subtitle: b.name ? imps.map(i => i.label).join(' · ') : null } }
                      if (b.receiver_ids?.length)     { const recs = b.receiver_ids.map(id => receivers.find(r => r.id === id)).filter(Boolean); return { label: b.name || recs.map(r => r.name).join(' · '), color: undefined, subtitle: b.name ? recs.map(r => r.name).join(' · ') : null } }
                      if (b.category_id)    { const c = catMap[b.category_id];    return { label: b.name || c?.name || '—', color: c?.color, subtitle: null } }
                      if (b.subcategory_id) { const c = catMap[b.subcategory_id]; return { label: b.name || c?.name || '—', color: c?.color, subtitle: null } }
                      if (b.importance)     { const i = importanceLevels.find(x => x.value === b.importance); return { label: b.name || i?.label || '—', color: i?.color, subtitle: null } }
                      if (b.receiver_id)    { const r = receivers.find(x => x.id === b.receiver_id); return { label: b.name || r?.name || '—', color: undefined, subtitle: null } }
                      return { label: '—', color: undefined, subtitle: null }
                    }
                    const { label, color, subtitle } = getLabel()
                    const spent     = budgetSpends[b.id] ?? 0
                    const pct       = b.monthly_limit > 0 ? Math.min((spent / b.monthly_limit) * 100, 100) : 0
                    const over      = spent > b.monthly_limit
                    const projected = calcProjected(b, spent)
                    const PERIOD_LABELS = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
                    const pPct  = getPeriodPct(b.period ?? 'monthly', currentDate, b.reset_day)
                    const slack = pPct != null ? pPct - (b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0) : null
                    let heroText = null, heroColor = 'rgba(255,255,255,0.35)'
                    if (over) {
                      heroText = `${fmt(spent - b.monthly_limit)} over budget`; heroColor = 'var(--color-alert)'
                    } else if (slack !== null) {
                      const abs = Math.abs(slack)
                      if (abs < 1)        { heroText = 'on pace';                          heroColor = 'rgba(255,255,255,0.4)' }
                      else if (slack > 0) { heroText = `${abs.toFixed(1)}% under pace`;   heroColor = 'var(--color-progress-bar)' }
                      else                { heroText = `${abs.toFixed(1)}% over pace`;     heroColor = abs > 10 ? 'var(--color-alert)' : 'var(--color-warning)' }
                    }
                    const infoFilter = (() => {
                      if (b.category_ids?.length)    return { dimension: 'category',    id: b.category_ids[0],    label, color, budget: b }
                      if (b.subcategory_ids?.length) return { dimension: 'subcategory', id: b.subcategory_ids[0], label, color, budget: b }
                      if (b.importance_ids?.length)  return { dimension: 'importance',  id: b.importance_ids[0],  budget: b }
                      if (b.receiver_ids?.length)    return { dimension: 'merchant',    id: b.receiver_ids[0],    label, budget: b }
                      if (b.category_id)    return { dimension: 'category',    id: b.category_id,    label, color, budget: b }
                      if (b.subcategory_id) return { dimension: 'subcategory', id: b.subcategory_id, label, color, budget: b }
                      if (b.importance)     return { dimension: 'importance',  id: b.importance,     budget: b }
                      if (b.receiver_id)    return { dimension: 'merchant',    id: b.receiver_id,    label, budget: b }
                      return { dimension: 'all', id: null, label: 'All spending', budget: b }
                    })()
                    return (
                      <div key={b.id} className="group flex flex-col gap-4 cursor-pointer" onClick={() => setModal(b)}>
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {color && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />}
                              <span className="text-sm font-semibold text-white">{label}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">{PERIOD_LABELS[b.period] ?? 'Monthly'}</span>
                              {b.card_id && cardMap[b.card_id] && (
                                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">
                                  {cardMap[b.card_id].name}
                                  <OwnerBadges ownerIds={cardMap[b.card_id].owner_ids} members={householdMembers} size={12} />
                                </span>
                              )}
                            </div>
                            {subtitle && <span className="text-[11px] text-muted">{subtitle}</span>}
                            {splitLabelText(b) && <span className="text-[11px] text-muted">{splitLabelText(b)}</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={e => { e.stopPropagation(); setInfoFilter(infoFilter) }}
                              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-white/50">
                              <Info size={13} />
                            </button>
                            <button type="button" onClick={e => { e.stopPropagation(); togglePin(b.id, true) }}
                              className="opacity-60 hover:opacity-100 transition-opacity text-white/50" title="Unpin">
                              <PinOff size={13} />
                            </button>
                            <Pencil size={13} className="opacity-0 group-hover:opacity-60 transition-opacity text-white/50" />
                          </div>
                        </div>
                        <div className="flex items-baseline justify-between gap-2 -mb-1">
                          <span className="text-base font-bold tabular-nums" style={{ color: heroColor }}>
                            {heroText ?? `${fmt(b.monthly_limit - spent)} remaining`}
                          </span>
                          {pPct != null && (
                            <span className="text-xs text-white/25 tabular-nums">{pPct.toFixed(0)}% into period</span>
                          )}
                        </div>
                        <div className="relative h-3 w-full rounded-full bg-white/8">
                          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: barColor(pct) }} />
                          {pPct != null && pPct > 0 && (
                            <div className="absolute top-[-3px] bottom-[-3px] w-[2px] -translate-x-1/2 rounded-full"
                              style={{ left: `${Math.min(pPct, 99)}%`, background: 'rgba(255,255,255,0.45)' }} />
                          )}
                        </div>
                        {projected != null && (
                          <span className="text-[11px] tabular-nums -mt-1"
                            style={{ color: projected > b.monthly_limit ? 'var(--color-warning)' : 'rgba(255,255,255,0.2)' }}>
                            projected {fmt(projected)} by period end
                          </span>
                        )}
                        <div className="flex items-baseline gap-2 tabular-nums border-t border-white/[0.04] pt-3 -mt-1">
                          <span className="text-2xl font-bold" style={{ color: over ? 'var(--color-alert)' : 'rgba(255,255,255,0.85)' }}>{fmt(spent)}</span>
                          <span className="text-sm text-muted">/ {fmt(b.monthly_limit)}</span>
                        </div>
                        {pinnedDimBudgets.indexOf(b) < pinnedDimBudgets.length - 1 && (
                          <div className="border-t border-white/[0.06] -mt-1" />
                        )}
                      </div>
                    )
                  })}
                  {allBudgets.map(b => {
                    const spent     = budgetSpends[b.id] ?? 0
                    const pct       = b.monthly_limit > 0 ? Math.min((spent / b.monthly_limit) * 100, 100) : 0
                    const over      = spent > b.monthly_limit
                    const remaining = Math.abs(b.monthly_limit - spent)
                    const projected = calcProjected(b, spent)
                    const PERIOD_LABELS = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
                    const DOW_NAMES     = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
                    const ordinal       = n => `${n}${['st','nd','rd'][((n%100-20)%10)-1]||'th'}`
                    const resetLabel = b.period === 'weekly' && b.reset_day != null
                      ? `Starts ${DOW_NAMES[b.reset_day]}`
                      : b.period === 'monthly' && b.reset_day != null && b.reset_day !== 1
                      ? `Resets ${ordinal(b.reset_day)} of month`
                      : null
                    const pPct  = getPeriodPct(b.period ?? 'monthly', currentDate, b.reset_day)
                    const slack = pPct != null ? pPct - (b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0) : null
                    let heroText = null, heroColor = 'rgba(255,255,255,0.35)'
                    if (over) {
                      heroText = `${fmt(spent - b.monthly_limit)} over budget`; heroColor = 'var(--color-alert)'
                    } else if (slack !== null) {
                      const abs = Math.abs(slack)
                      if (abs < 1)      { heroText = 'on pace';                              heroColor = 'rgba(255,255,255,0.4)' }
                      else if (slack > 0) { heroText = `${abs.toFixed(1)}% under pace`;       heroColor = 'var(--color-progress-bar)' }
                      else                { heroText = `${abs.toFixed(1)}% over pace`;        heroColor = abs > 10 ? 'var(--color-alert)' : 'var(--color-warning)' }
                    }
                    return (
                      <div key={b.id} onClick={() => setModal(b)}
                        className="group flex flex-col gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{b.name || 'Main Budget'}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">{PERIOD_LABELS[b.period] ?? 'Monthly'}</span>
                              {b.card_id && cardMap[b.card_id] && (
                                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">
                                  {cardMap[b.card_id].name}
                                  <OwnerBadges ownerIds={cardMap[b.card_id].owner_ids} members={householdMembers} size={12} />
                                </span>
                              )}
                            </div>
                            {resetLabel && <span className="text-[11px] text-muted">{resetLabel}</span>}
                            {splitLabelText(b) && <span className="text-[11px] text-muted">{splitLabelText(b)}</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={e => { e.stopPropagation(); setInfoFilter({ dimension: 'all', id: null, label: 'All spending', budget: b }) }}
                              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-white/50">
                              <Info size={13} />
                            </button>
                            <Pencil size={13} className="opacity-0 group-hover:opacity-60 transition-opacity text-white/50" />
                          </div>
                        </div>
                        {/* Pacing verdict — primary */}
                        <div className="flex items-baseline justify-between gap-2 -mb-1">
                          <span className="text-base font-bold tabular-nums" style={{ color: heroColor }}>
                            {heroText ?? `${fmt(b.monthly_limit - spent)} remaining`}
                          </span>
                          {pPct != null && (
                            <span className="text-xs text-white/25 tabular-nums">{pPct.toFixed(0)}% into period</span>
                          )}
                        </div>
                        {/* Dual-marker bar */}
                        <div className="relative h-3 w-full rounded-full bg-white/8">
                          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: barColor(pct) }} />
                          {pPct != null && pPct > 0 && (
                            <div className="absolute top-[-3px] bottom-[-3px] w-[2px] -translate-x-1/2 rounded-full"
                              style={{ left: `${Math.min(pPct, 99)}%`, background: 'rgba(255,255,255,0.45)' }} />
                          )}
                        </div>
                        {/* Projected + spent/limit secondary */}
                        {projected != null && (
                          <span className="text-[11px] tabular-nums -mt-1"
                            style={{ color: projected > b.monthly_limit ? 'var(--color-warning)' : 'rgba(255,255,255,0.2)' }}>
                            projected {fmt(projected)} by period end
                          </span>
                        )}
                        <div className="flex items-baseline gap-2 tabular-nums border-t border-white/[0.04] pt-3 -mt-1">
                          <span className="text-2xl font-bold" style={{ color: over ? 'var(--color-alert)' : 'rgba(255,255,255,0.85)' }}>{fmt(spent)}</span>
                          <span className="text-sm text-muted">/ {fmt(b.monthly_limit)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {!loading && (
          <div className="flex flex-col gap-4">

            {/* Limits + Goals — unified section */}
            {(() => {
              const allDimBudgets = [...catBudgets, ...subBudgets, ...impBudgets, ...recBudgets]
              const sortedLimits  = sortBudgets(allDimBudgets, limitsSortBy)

              const getBudgetMeta = b => {
                // Multi-select (new array columns)
                if (b.category_ids?.length) {
                  const cats = b.category_ids.map(id => catMap[id]).filter(Boolean)
                  const sub  = cats.map(c => c.name).join(' · ')
                  return { label: b.name || sub || '—', subtitle: b.name ? sub : null, color: cats[0]?.color, icon: undefined, imp: undefined, info: { dimension: 'category', id: b.category_ids[0], label: b.name || sub, color: cats[0]?.color, budget: b } }
                }
                if (b.subcategory_ids?.length) {
                  const cats = b.subcategory_ids.map(id => catMap[id]).filter(Boolean)
                  const sub  = cats.map(c => c.name).join(' · ')
                  return { label: b.name || sub || '—', subtitle: b.name ? sub : null, color: cats[0]?.color, icon: undefined, imp: undefined, info: { dimension: 'subcategory', id: b.subcategory_ids[0], label: b.name || sub, color: cats[0]?.color, budget: b } }
                }
                if (b.importance_ids?.length) {
                  const imps = b.importance_ids.map(v => importanceLevels.find(i => i.value === v)).filter(Boolean)
                  const sub  = imps.map(i => i.label).join(' · ')
                  return { label: b.name || sub || '—', subtitle: b.name ? sub : null, color: imps[0]?.color, icon: undefined, imp: !b.name && imps.length === 1 ? imps[0] : undefined, info: { dimension: 'importance', id: b.importance_ids[0], budget: b } }
                }
                if (b.receiver_ids?.length) {
                  const recs = b.receiver_ids.map(id => receivers.find(r => r.id === id)).filter(Boolean)
                  const sub  = recs.map(r => r.name).join(' · ')
                  return { label: b.name || sub || 'Merchant', subtitle: b.name ? sub : null, color: undefined, icon: undefined, imp: undefined, info: { dimension: 'merchant', id: b.receiver_ids[0], label: b.name || sub, budget: b } }
                }
                // Legacy single-value
                if (b.category_id)    { const cat = catMap[b.category_id];    return { label: b.name || cat?.name || '—', subtitle: null, color: cat?.color, icon: b.name ? undefined : cat?.icon, imp: undefined, info: { dimension: 'category',    id: b.category_id,    label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon, budget: b } } }
                if (b.subcategory_id) { const cat = catMap[b.subcategory_id]; return { label: b.name || cat?.name || '—', subtitle: null, color: cat?.color, icon: b.name ? undefined : cat?.icon, imp: undefined, info: { dimension: 'subcategory', id: b.subcategory_id, label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon, budget: b } } }
                if (b.importance)     { const imp = importanceLevels.find(i => i.value === b.importance); return { label: b.name, subtitle: null, color: b.name ? imp?.color : undefined, icon: undefined, imp: b.name ? undefined : imp, info: { dimension: 'importance',  id: b.importance, imp, budget: b } } }
                if (b.receiver_id)    { const rec = receivers.find(r => r.id === b.receiver_id);          return { label: b.name || rec?.name || 'Merchant', subtitle: null, color: undefined, icon: undefined, imp: undefined, info: { dimension: 'merchant', id: b.receiver_id, label: rec?.name ?? 'Merchant', budget: b } } }
                return { label: '—', subtitle: null, color: undefined, icon: undefined, imp: undefined, info: null }
              }

              const unpinnedLimits = sortedLimits.filter(b => !b.pinned)

              const totalItems   = sortedLimits.length
              const overCount    = allDimBudgets.filter(b => (budgetSpends[b.id] ?? 0) > b.monthly_limit).length
              const isEmpty      = totalItems === 0

              return (
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-center justify-between"
                    onMouseEnter={() => setShowLimitsSort(true)}
                    onMouseLeave={() => setShowLimitsSort(false)}>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold">{t('nav.budgets')}</h2>
                      {totalItems > 0 && (
                        <span className="text-[11px] text-white/25">
                          {totalItems} budget{totalItems !== 1 ? 's' : ''}
                          {overCount > 0 && <span style={{ color: 'var(--color-alert)' }}> · {overCount} over</span>}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`transition-opacity duration-150 flex items-center gap-2 ${showLimitsSort ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <SortPill value={limitsSortBy} onChange={setLimitsSortBy} options={LIMIT_SORT_OPTS} />
                      </div>
                      <button onClick={() => openNew()}
                        className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                        <Plus size={11} /> Budget
                      </button>
                    </div>
                  </div>

                  {isEmpty && (
                    <p className="text-[11px] text-muted py-3 text-center">{t('budgets.none')}</p>
                  )}

                  {/* Budget grid — only unpinned (pinned ones appear in the Main Budget panel above) */}
                  {unpinnedLimits.length > 0 && (
                    <div
                      ref={el => { limitsColRefs.current.all = el }}
                      className="grid grid-cols-2 gap-3"
                    >
                      {unpinnedLimits.map(b => {
                        const meta  = getBudgetMeta(b)
                        const spent = budgetSpends[b.id] ?? 0
                        const pPct  = getPeriodPct(b.period ?? 'monthly', currentDate, b.reset_day)
                        return (
                          <div key={`b-${b.id}`} data-flip-id={b.id}
                            style={{ borderRadius: 12, boxShadow: limitsPromoted.has(String(b.id)) ? '0 0 10px color-mix(in srgb, var(--color-warning) 30%, transparent)' : undefined }}>
                            <BudgetCard label={meta.label} subtitle={meta.subtitle} color={meta.color} icon={meta.icon} imp={meta.imp}
                              spent={spent} limit={b.monthly_limit} rolloverAmount={b.rollover_amount ?? 0}
                              projectedEnd={calcProjected(b, spent)} periodPct={pPct}
                              period={b.period} cardName={b.card_id ? cardMap[b.card_id]?.name : null}
                              ownerIds={b.card_id ? cardMap[b.card_id]?.owner_ids : null} householdMembers={householdMembers}
                              splitLabel={splitLabelText(b)}
                              pinned={false} onPin={() => togglePin(b.id, false)}
                              onEdit={() => setModal(b)}
                              onInfo={() => meta.info && setInfoFilter(meta.info)}
                              onHistory={() => setHistoryBudget(prev => prev?.id === b.id ? null : b)} />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {historyBudget && (
                    <BudgetHistorySection
                      budget={historyBudget}
                      allExpenses={allExpenses}
                      catMap={catMap}
                      importanceLevels={importanceLevels}
                      currentDate={currentDate}
                      onClose={() => setHistoryBudget(null)}
                    />
                  )}
                </div>
              )
            })()}

          </div>
        )}
      </div>

      {/* Budget Year Heatmap */}
      {!loading && (
        <BudgetHeatmap
          budgets={budgets}
          yearExpenses={yearExpenses}
          catMap={catMap}
          importanceLevels={importanceLevels}
          receivers={receivers}
          currentDate={currentDate}
        />
      )}

      {modal !== null && (
        <AddBudgetModal
          budget={modal === 'new' ? null : modal}
          categories={categories}
          members={householdMembers}
          defaultDimension={modal === 'new' ? modalDefDim : undefined}
          defaultId={modal === 'new' ? modalDefId : undefined}
          defaultLimit={modal === 'new' ? modalDefLimit : undefined}
          defaultName={modal === 'new' ? modalDefName : undefined}
          avgByCategory={avgByCategory}
          avgBySubcategory={avgBySubcategory}
          onClose={() => setModal(null)}
          onSaved={() => {}}
        />
      )}

      {infoFilter && (
        <BudgetTransactionsModal
          filter={infoFilter}
          currentDate={currentDate}
          catMap={catMap}
          onClose={() => setInfoFilter(null)}
        />
      )}

    </div>
  )
}
