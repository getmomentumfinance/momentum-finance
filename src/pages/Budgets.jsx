import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Pencil, ChevronDown, Sparkles, Trash2, Target, Info, X, History, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/dashboard/Navbar'
import { CategoryPill } from '../components/shared/CategoryPill'
import { ReceiverAvatar } from '../components/shared/ReceiverCombobox'
import { useImportance } from '../hooks/useImportance'
import { useThemeColors } from '../hooks/useThemeColors'
import AddBudgetModal from '../components/budgets/AddBudgetModal'
import { usePreferences } from '../context/UserPreferencesContext'

function toLocalStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getPeriodBounds(period, refDate, resetDay) {
  const y = refDate.getFullYear()
  const m = refDate.getMonth()
  if (period === 'weekly') {
    // resetDay: 0=Mon … 6=Sun; convert to JS getDay() (0=Sun,1=Mon…)
    const startJsDow = ((resetDay ?? 0) + 1) % 7
    const dow  = refDate.getDay()
    const diff = (dow - startJsDow + 7) % 7
    const start = new Date(refDate)
    start.setDate(refDate.getDate() - diff)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { startStr: toLocalStr(start), endStr: toLocalStr(end) }
  }
  if (period === 'quarterly') {
    const q = Math.floor(m / 3)
    return {
      startStr: toLocalStr(new Date(y, q * 3, 1)),
      endStr:   toLocalStr(new Date(y, q * 3 + 3, 0)),
    }
  }
  if (period === 'yearly') {
    return { startStr: `${y}-01-01`, endStr: `${y}-12-31` }
  }
  // monthly — resetDay: 1-28 (day of month the period starts)
  const rd = resetDay ?? 1
  let sy = y, sm = m
  if (refDate.getDate() < rd) { sm--; if (sm < 0) { sm = 11; sy-- } }
  const nextStart = new Date(sy, sm + 1, rd)
  const end = new Date(nextStart.getTime() - 86400000)
  return {
    startStr: toLocalStr(new Date(sy, sm, rd)),
    endStr:   toLocalStr(end),
  }
}

// Returns 0-100 (% through the current period), or null if viewing a past/future period
function getPeriodPct(period, currentDate, resetDay) {
  const { startStr, endStr } = getPeriodBounds(period ?? 'monthly', currentDate, resetDay)
  const start = new Date(startStr + 'T00:00:00')
  const end   = new Date(endStr   + 'T23:59:59')
  const now   = new Date()
  if (now < start || now > end) return null
  const totalDays   = Math.round((end - start) / 86400000) + 1
  const daysElapsed = Math.max(1, Math.round((now - start) / 86400000) + 1)
  return Math.min((daysElapsed / totalDays) * 100, 100)
}

function barColor(pct, strict = false) {
  if (pct >= 100) return 'var(--color-alert)'
  if (pct >= (strict ? 70 : 80)) return 'var(--color-warning)'
  return 'var(--color-progress-bar)'
}

// Returns a plain-text "what to do" hint, or null if no action needed
function getActionHint(spent, limit, periodEnd, strictMode, fmt) {
  if (!periodEnd || !limit) return null
  const now = new Date()
  const end = new Date(periodEnd + 'T23:59:59')
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000))
  if (daysLeft === 0) return null
  if (spent > limit) {
    return daysLeft === 1
      ? 'Last day — avoid any more spending'
      : `Over limit — freeze spending for ${daysLeft} more days`
  }
  const remaining = limit - spent
  const pct = (spent / limit) * 100
  if (pct >= (strictMode ? 60 : 75)) {
    const maxPerDay = remaining / daysLeft
    return `To stay on track: max ${fmt(maxPerDay)}/day`
  }
  return null
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
const GOAL_SORT_OPTS   = [{ value: 'risk', label: 'At-risk first' }, { value: 'spend', label: 'Highest spend' }, { value: 'alpha', label: 'A → Z' }]

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
        .select('id, date, description, amount, category_id, subcategory_id, receiver_id')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .eq('type', 'expense')
        .eq('is_split_parent', false)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })

      if (cardId)                             query = query.eq('card_id',        cardId)
      if (filter.dimension === 'category')    query = query.eq('category_id',    filter.id)
      if (filter.dimension === 'subcategory') query = query.eq('subcategory_id', filter.id)
      if (filter.dimension === 'merchant')    query = query.eq('receiver_id',    filter.id)

      const { data } = await query

      if (filter.dimension === 'importance') {
        setTxs((data ?? []).filter(t => {
          const imp = catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance
          return imp === filter.id
        }))
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
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

// ── Budget card (category / subcategory / importance) ──────────
function BudgetCard({ label, color, icon, imp, spent, limit, rolloverAmount, projectedEnd, periodPct, period, cardName, strictMode, onEdit, onInfo }) {
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
        <div className="min-w-0 flex-1">
          {imp ? <ImpDots imp={imp} /> : <CategoryPill name={label} color={color} icon={icon} />}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
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
          {cardName    && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">{cardName}</span>}
        </div>
      )}

      {/* Dual-marker progress bar: fill = budget %, tick = period % */}
      <div className="relative h-2 w-full rounded-full bg-white/8">
        {rollover > 0 && (
          <div className="absolute inset-y-0 right-0 rounded-r-full"
            style={{ width: `${(rollover / effectiveLimit) * 100}%`, background: 'color-mix(in srgb, var(--color-progress-bar) 22%, transparent)' }} />
        )}
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{ width: `${budgetPct}%`, background: barColor(budgetPct, strictMode) }} />
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
          style={{ color: projectedEnd > effectiveLimit * (strictMode ? 0.88 : 1) ? 'var(--color-warning)' : 'rgba(255,255,255,0.18)' }}>
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

// ── Edit Target Modal ──────────────────────────────────────────
function EditTargetModal({ target, catMap, importanceLevels, onClose, onSave, onDelete }) {
  const { fmt, fmtK, t } = usePreferences()
  const colors = useThemeColors()
  const tgtPeriod   = target.period ?? 'monthly'
  const periodLabel = { weekly: '/wk', monthly: '/mo', quarterly: '/qtr', yearly: '/yr' }[tgtPeriod] ?? '/mo'
  const annualMult  = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 }[tgtPeriod] ?? 12
  const baseline   = target.avg_baseline
  const sliderMax  = Math.ceil(baseline * 1.3)
  const [spend, setSpend]           = useState(target.target_monthly_spend)
  const [saving, setSaving]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const reduction   = Math.max(0, baseline - spend)
  const annualSaving = reduction * annualMult

  let labelEl
  if (target.category_id || target.subcategory_id) {
    const cat = catMap[target.category_id ?? target.subcategory_id]
    labelEl = <CategoryPill name={cat?.name ?? '—'} color={cat?.color} icon={cat?.icon} />
  } else {
    const imp = importanceLevels.find(i => i.value === target.importance)
    labelEl = imp ? <ImpDots imp={imp} /> : null
  }

  async function handleSave() {
    setSaving(true)
    await onSave(target.id, { target_monthly_spend: spend, reduction_amount: reduction })
    setSaving(false)
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-2xl w-full max-w-md flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <Target size={14} className="text-white/40" />
            <h2 className="text-sm font-semibold">{t('budgets.editTarget')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          <div>{labelEl}</div>

          <div className="flex justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[10px] text-muted uppercase tracking-widest">
                {t('budgets.baseline')}
                <span className="group relative">
                  <Info size={9} className="text-white/25 cursor-help normal-case" />
                  <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 w-44 rounded-lg bg-black/80 px-2.5 py-2 text-[10px] text-white/70 leading-snug opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal normal-case">
                    Your actual average monthly spending — what you've historically been spending.
                  </span>
                </span>
              </span>
              <span className="text-sm tabular-nums text-white/50">{fmt(baseline)}{periodLabel}</span>
            </div>
            <div className="flex flex-col gap-0.5 items-end">
              <span className="flex items-center gap-1 text-[10px] text-muted uppercase tracking-widest">
                {t('budgets.newTarget')}
                <span className="group relative">
                  <Info size={9} className="text-white/25 cursor-help normal-case" />
                  <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 w-44 rounded-lg bg-black/80 px-2.5 py-2 text-[10px] text-white/70 leading-snug opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal normal-case">
                    The maximum you want to spend per month — drag the slider to adjust your goal.
                  </span>
                </span>
              </span>
              <span className="text-sm tabular-nums font-semibold" style={{ color: 'var(--color-progress-bar)' }}>
                {fmt(spend)}{periodLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <input type="range" min={0} max={sliderMax} step={1}
              value={spend}
              onChange={e => setSpend(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: 'var(--color-progress-bar)' }}
            />
            <div className="flex justify-between text-[10px] text-white/20">
              <span>{fmt(0)}</span><span>{fmt(sliderMax)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">{t('budgets.monthlySaving')}</span>
              <span className="tabular-nums" style={{ color: reduction > 0 ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.2)' }}>
                {reduction > 0 ? `+${fmt(reduction)}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('budgets.annualSaving')}</span>
              <span className="tabular-nums font-semibold" style={{ color: reduction > 0 ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.2)' }}>
                {reduction > 0 ? `+${fmtK(annualSaving)}` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          {onDelete && (
            <button
              onClick={() => { if (confirmDelete) { onDelete(target.id); onClose() } else setConfirmDelete(true) }}
              onBlur={() => setConfirmDelete(false)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all text-xs font-medium ${
                confirmDelete
                  ? 'border-red-500/50 bg-red-500/15 text-red-400'
                  : 'border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40'
              }`}>
              <Trash2 size={13} />
              {confirmDelete ? t('common.confirm') : t('common.delete')}
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-muted hover:text-white hover:border-white/20 transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/15 text-sm font-medium text-white hover:bg-white/12 transition-colors disabled:opacity-40">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Target History Modal ───────────────────────────────────────
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

function TargetHistoryModal({ target, allExpenses, catMap, importanceLevels, currentDate, onClose }) {
  const { fmt, fmtK, t } = usePreferences()
  const colors = useThemeColors()
  const tgt       = target.target_monthly_spend
  const tgtPeriod = target.period ?? 'monthly'
  const periodLabel = { weekly: '/wk', monthly: '/mo', quarterly: '/qtr', yearly: '/yr' }[tgtPeriod] ?? '/mo'

  const periodSpends = useMemo(() => {
    const filtered = allExpenses.filter(t => {
      if (target.category_id)    return t.category_id    === target.category_id
      if (target.subcategory_id) return t.subcategory_id === target.subcategory_id
      if (target.receiver_id)    return t.receiver_id    === target.receiver_id
      if (target.importance) {
        const imp = catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance
        return imp === target.importance
      }
      return false
    })
    const byPeriod = {}
    for (const tx of filtered) {
      const key = tgtPeriod === 'weekly'
        ? getPeriodBounds('weekly', new Date(tx.date + 'T12:00:00'), target.reset_day).startStr
        : tx.date.slice(0, 7)
      byPeriod[key] = (byPeriod[key] ?? 0) + tx.amount
    }
    return byPeriod
  }, [target, allExpenses, catMap, tgtPeriod])

  // All periods from creation to now, grouped by year
  const yearGroups = useMemo(() => {
    const created = new Date(target.created_at)
    const byYear  = {}

    if (tgtPeriod === 'monthly') {
      const startYear  = created.getFullYear()
      const startMonth = created.getMonth()
      const endYear    = currentDate.getFullYear()
      const endMonth   = currentDate.getMonth()
      const count      = (endYear - startYear) * 12 + (endMonth - startMonth) + 1
      for (let i = 0; i < count; i++) {
        const d    = new Date(startYear, startMonth + i, 1)
        const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const year = d.getFullYear()
        if (!byYear[year]) byYear[year] = []
        byYear[year].push({ key, label: d.toLocaleDateString('en-US', { month: 'short' }), spend: periodSpends[key] ?? null, isCurrent: i === count - 1 })
      }
      return Object.entries(byYear).sort(([a], [b]) => a - b).map(([year, months]) => {
        const first = months[0]
        const last  = months.at(-1)
        const isFullYear = first.key.endsWith('-01') && (last.isCurrent ? false : last.key.endsWith('-12'))
        const rangeLabel = isFullYear ? t('budgets.fullYear')
          : `${new Date(first.key + '-01').toLocaleDateString('en-US', { month: 'short' })} – ${new Date(last.key + '-01').toLocaleDateString('en-US', { month: 'short' })}`
        return { year: Number(year), months, rangeLabel }
      })
    }

    // weekly: iterate week-start dates
    const { startStr: firstWk } = getPeriodBounds('weekly', created, target.reset_day)
    const { startStr: currWk }  = getPeriodBounds('weekly', currentDate, target.reset_day)
    let d = new Date(firstWk + 'T12:00:00')
    const endD = new Date(currWk + 'T12:00:00')
    let idx = 0
    while (d <= endD) {
      const key  = toLocalStr(d)
      const year = d.getFullYear()
      if (!byYear[year]) byYear[year] = []
      byYear[year].push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, spend: periodSpends[key] ?? null, isCurrent: key === currWk })
      d = new Date(d.getTime() + 7 * 86400000)
      idx++
    }
    return Object.entries(byYear).sort(([a], [b]) => a - b).map(([year, months]) => {
      const first = months[0]; const last = months.at(-1)
      const rangeLabel = `${first.label} – ${last.label}`
      return { year: Number(year), months, rangeLabel }
    })
  }, [target, periodSpends, currentDate, tgtPeriod])

  // Overall stats (all periods with data)
  const allWithData  = yearGroups.flatMap(g => g.months).filter(m => m.spend !== null)
  const totalMet     = allWithData.filter(m => m.spend <= tgt).length
  const totalOver    = allWithData.filter(m => m.spend >  tgt).length
  const totalSaved   = allWithData.reduce((s, m) => s + Math.max(0, target.avg_baseline - m.spend), 0)

  const created     = new Date(target.created_at)
  const startLabel  = created.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  let labelEl
  if (target.category_id || target.subcategory_id) {
    const cat = catMap[target.category_id ?? target.subcategory_id]
    labelEl = <CategoryPill name={cat?.name ?? '—'} color={cat?.color} icon={cat?.icon} />
  } else {
    const imp = importanceLevels.find(i => i.value === target.importance)
    labelEl = imp ? <ImpDots imp={imp} /> : null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <History size={14} className="text-white/40" />
            <div>
              <h2 className="text-sm font-semibold">{t('budgets.targetHistory')}</h2>
              <p className="text-[11px] text-white/30">{t('budgets.startedLabel', { date: startLabel, amount: fmt(tgt) })}{periodLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Label + overall stats */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.05] shrink-0">
          {labelEl}
          <div className="flex items-center gap-4 text-[11px] tabular-nums text-white/40">
            <span><span style={{ color: colors.income }}>{totalMet}</span> {t('budgets.onTarget')}</span>
            <span><span style={{ color: colors.expense }}>{totalOver}</span> {t('common.over')}</span>
            <span className="font-medium" style={{ color: totalSaved > 0 ? 'var(--color-progress-bar)' : undefined }}>
              {totalSaved > 0 ? t('budgets.savedTotal', { amount: fmt(totalSaved) }) : t('budgets.baselineAmt', { amount: fmt(target.avg_baseline) }) + periodLabel}
            </span>
          </div>
        </div>

        {/* Year charts — scrollable */}
        <div className="flex flex-col gap-6 px-6 py-5 overflow-y-auto flex-1 scrollbar-thin">
          {yearGroups.length === 0 ? (
            <p className="text-sm text-white/25 text-center py-8">{t('budgets.noHistory')}</p>
          ) : yearGroups.map(({ year, months, rangeLabel }) => (
            <YearChart
              key={year}
              yearLabel={`${year} · ${rangeLabel}`}
              months={months}
              tgt={tgt}
              colors={colors}
              uid={`${target.id}-${year}`}
            />
          ))}
        </div>

      </div>
    </div>,
    document.body
  )
}

// ── Target card ────────────────────────────────────────────────
function TargetRow({ target, allExpenses, catMap, importanceLevels, receivers, currentDate, onDelete, onInfo, onEdit, onHistory, compact = false }) {
  const { fmt, t } = usePreferences()
  const colors = useThemeColors()
  const tgtPeriod = target.period ?? 'monthly'

  const periodSpends = useMemo(() => {
    const filtered = allExpenses.filter(t => {
      if (target.category_id)    return t.category_id    === target.category_id
      if (target.subcategory_id) return t.subcategory_id === target.subcategory_id
      if (target.receiver_id)    return t.receiver_id    === target.receiver_id
      if (target.importance) {
        const imp = catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance
        return imp === target.importance
      }
      return false
    })
    const byPeriod = {}
    for (const t of filtered) {
      let key
      if (tgtPeriod === 'weekly') {
        key = getPeriodBounds('weekly', new Date(t.date + 'T12:00:00'), target.reset_day).startStr
      } else if (tgtPeriod === 'quarterly') {
        const d = new Date(t.date + 'T12:00:00')
        key = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`
      } else if (tgtPeriod === 'yearly') {
        key = t.date.slice(0, 4)
      } else {
        key = t.date.slice(0, 7)
      }
      byPeriod[key] = (byPeriod[key] ?? 0) + t.amount
    }
    return byPeriod
  }, [target, allExpenses, catMap, tgtPeriod])

  // Periods from creation to current period
  const chartPeriods = useMemo(() => {
    const created = new Date(target.created_at)
    if (tgtPeriod === 'monthly') {
      const startYear  = created.getFullYear()
      const startMonth = created.getMonth()
      const endYear    = currentDate.getFullYear()
      const endMonth   = currentDate.getMonth()
      const count      = (endYear - startYear) * 12 + (endMonth - startMonth) + 1
      const result = []
      for (let i = 0; i < count; i++) {
        const d   = new Date(startYear, startMonth + i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        result.push({ key, label: d.toLocaleDateString('en-US', { month: 'short' }), spend: periodSpends[key] ?? null, isCurrent: i === count - 1 })
      }
      return result
    }
    if (tgtPeriod === 'quarterly') {
      let y = created.getFullYear(), q = Math.ceil((created.getMonth() + 1) / 3)
      const endY = currentDate.getFullYear(), endQ = Math.ceil((currentDate.getMonth() + 1) / 3)
      const result = []
      while (y < endY || (y === endY && q <= endQ)) {
        const key = `${y}-Q${q}`
        result.push({ key, label: `Q${q}'${String(y).slice(2)}`, spend: periodSpends[key] ?? null, isCurrent: y === endY && q === endQ })
        q++; if (q > 4) { q = 1; y++ }
      }
      return result
    }
    if (tgtPeriod === 'yearly') {
      const result = []
      for (let y = created.getFullYear(); y <= currentDate.getFullYear(); y++) {
        const key = `${y}`
        result.push({ key, label: `${y}`, spend: periodSpends[key] ?? null, isCurrent: y === currentDate.getFullYear() })
      }
      return result
    }
    // weekly
    const { startStr: firstWk } = getPeriodBounds('weekly', created, target.reset_day)
    const { startStr: currWk }  = getPeriodBounds('weekly', currentDate, target.reset_day)
    const result = []
    let d = new Date(firstWk + 'T12:00:00')
    const endD = new Date(currWk + 'T12:00:00')
    while (d <= endD) {
      const key = toLocalStr(d)
      result.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, spend: periodSpends[key] ?? null, isCurrent: key === currWk })
      d = new Date(d.getTime() + 7 * 86400000)
    }
    return result
  }, [target, periodSpends, currentDate, tgtPeriod])

  const periodEntries = Object.entries(periodSpends)
  const periodsMet    = periodEntries.filter(([, s]) => s <= target.target_monthly_spend).length
  const periodsOver   = periodEntries.filter(([, s]) => s >  target.target_monthly_spend).length
  const totalPeriods  = periodEntries.length
  const hitRate       = totalPeriods > 0 ? Math.round((periodsMet / totalPeriods) * 100) : null

  // Streak: consecutive periods on target ending at current
  const streak = useMemo(() => {
    let s = 0
    for (let i = chartPeriods.length - 1; i >= 0; i--) {
      const { spend } = chartPeriods[i]
      if (spend === null) break
      if (spend > target.target_monthly_spend) break
      s++
    }
    return s
  }, [chartPeriods, target.target_monthly_spend])

  // Year-by-year history (only past calendar years)
  const yearlyHistory = useMemo(() => {
    const currentYear = currentDate.getFullYear()
    const byYear = {}
    for (const m of chartPeriods) {
      const year = Number(m.key.slice(0, 4))
      if (year === currentYear) continue
      if (m.spend === null) continue
      if (!byYear[year]) byYear[year] = []
      byYear[year].push(m.spend)
    }
    return Object.entries(byYear)
      .sort(([a], [b]) => a - b)
      .map(([year, spends]) => ({
        year,
        avg:  spends.reduce((s, v) => s + v, 0) / spends.length,
        met:  spends.filter(s => s <= target.target_monthly_spend).length,
        over: spends.filter(s => s >  target.target_monthly_spend).length,
      }))
  }, [chartPeriods, currentDate, target.target_monthly_spend])

  const { startStr: periodStart } = getPeriodBounds(tgtPeriod, currentDate, target.reset_day)
  const currentPeriodKey   = tgtPeriod === 'weekly'    ? periodStart
    : tgtPeriod === 'quarterly' ? `${currentDate.getFullYear()}-Q${Math.ceil((currentDate.getMonth() + 1) / 3)}`
    : tgtPeriod === 'yearly'    ? `${currentDate.getFullYear()}`
    : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const currentPeriodSpend = periodSpends[currentPeriodKey] ?? 0
  const periodLabel = { weekly: '/wk', monthly: '/mo', quarterly: '/qtr', yearly: '/yr' }[tgtPeriod] ?? '/mo'
  const isOver = currentPeriodSpend > target.target_monthly_spend
  const pct    = target.target_monthly_spend > 0
    ? Math.min((currentPeriodSpend / target.target_monthly_spend) * 100, 100)
    : 0

  // Build label
  let labelEl
  if (target.category_id || target.subcategory_id) {
    const cat = catMap[target.category_id ?? target.subcategory_id]
    labelEl = <CategoryPill name={cat?.name ?? '—'} color={cat?.color} icon={cat?.icon} />
  } else if (target.receiver_id) {
    const rec = receivers?.find(r => r.id === target.receiver_id)
    labelEl = rec
      ? <span className="flex items-center gap-1.5"><ReceiverAvatar receiver={rec} /><span className="text-xs">{rec.name}</span></span>
      : <span className="text-xs text-muted">Merchant</span>
  } else {
    const imp = importanceLevels.find(i => i.value === target.importance)
    labelEl = imp ? <ImpDots imp={imp} /> : <span className="text-xs text-muted">—</span>
  }

  // SVG chart
  const SVG_W = 400, SVG_H = 80
  const PAD   = { t: 8, r: 4, b: 20, l: 4 }
  const iW    = SVG_W - PAD.l - PAD.r
  const iH    = SVG_H - PAD.t - PAD.b

  const chartMax = Math.max(...chartPeriods.map(m => m.spend ?? 0), target.target_monthly_spend) * 1.15
  const xOf = i => PAD.l + (chartPeriods.length > 1 ? (i / (chartPeriods.length - 1)) * iW : iW / 2)
  const yOf = v => PAD.t + (1 - Math.min(v, chartMax) / chartMax) * iH
  const targetY = yOf(target.target_monthly_spend)

  const pts = chartPeriods.map((m, i) => ({ ...m, x: xOf(i), y: m.spend !== null ? yOf(m.spend) : null }))
  const vis = pts.filter(p => p.y !== null)

  const linePath = vis.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = vis.length > 1
    ? `${vis.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} L${vis.at(-1).x.toFixed(1)},${(PAD.t + iH).toFixed(1)} L${vis[0].x.toFixed(1)},${(PAD.t + iH).toFixed(1)} Z`
    : ''

  const gradId = `tgt-${target.id}`

  return (
    <div className="group flex flex-col gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.05] transition-all">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">{labelEl}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!compact && hitRate !== null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] tabular-nums text-white/40">
              {t('tw.hitRate', { n: hitRate })}
            </span>
          )}
          {!compact && (
            <button type="button" onClick={e => { e.stopPropagation(); onHistory() }}
              className="p-1 rounded-lg hover:bg-white/8 transition-colors text-white/25 hover:text-white">
              <History size={11} />
            </button>
          )}
          <button type="button" onClick={e => { e.stopPropagation(); onEdit() }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/8 text-white/20 hover:text-white">
            <Pencil size={11} />
          </button>
          <button type="button" onClick={e => { e.stopPropagation(); onInfo() }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/8 text-white/20 hover:text-white">
            <Info size={11} />
          </button>
          <button onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/8 text-white/20 hover:text-red-400">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Type chip + period badge */}
      <div className="flex items-center gap-1.5 -mt-1 flex-wrap">
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
          style={{ background: 'color-mix(in srgb, var(--color-progress-bar) 12%, transparent)', color: 'color-mix(in srgb, var(--color-progress-bar) 65%, transparent)' }}
          title="Voluntary target — track how much you save vs your spending baseline">
          Goal
        </span>
        {tgtPeriod !== 'monthly' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">
            {{ weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly' }[tgtPeriod]}
          </span>
        )}
        {!compact && hitRate !== null && (
          <span className="text-[10px] tabular-nums text-white/25">{t('tw.hitRate', { n: hitRate })}</span>
        )}
      </div>

      {/* SVG line chart — hidden in compact mode */}
      {!compact && (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-progress-bar)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-progress-bar)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

        {/* Target line */}
        <line x1={PAD.l} y1={targetY} x2={SVG_W - PAD.r} y2={targetY}
          stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4 3" />

        {/* Spending line */}
        {linePath && (
          <path d={linePath} fill="none"
            stroke="var(--color-progress-bar)" strokeWidth="1.5"
            strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Dots */}
        {pts.map(p => p.y !== null && (
          <circle key={p.key} cx={p.x} cy={p.y}
            r={p.isCurrent ? 3.5 : 2.5}
            fill={(p.spend ?? 0) > target.target_monthly_spend ? 'var(--color-alert)' : 'var(--color-progress-bar)'}
            opacity={p.isCurrent ? 1 : 0.55}
          />
        ))}

        {/* Month labels — thin out when many months */}
        {pts.map((p, i) => {
          const every = Math.ceil(pts.length / 7)
          const show  = p.isCurrent || i === 0 || i % every === 0
          if (!show) return null
          return (
          <text key={`${p.key}-l`} x={p.x} y={SVG_H - 4} textAnchor="middle"
            fontSize="7" fill={p.isCurrent ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}>
            {p.label}
          </text>
          )
        })}
      </svg>
      )}

      {/* Bottom: current period spend vs target */}
      <div className={`flex items-end justify-between gap-6 pt-4 ${!compact ? 'border-t border-white/[0.05]' : ''}`}>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <span className="text-2xl font-bold">{fmt(currentPeriodSpend)}</span>
            <span className="text-xs text-muted">/ {fmt(target.target_monthly_spend)}{periodLabel}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: isOver ? 'var(--color-alert)' : 'var(--color-progress-bar)' }} />
          </div>
          <span className="text-[11px] tabular-nums"
            style={{ color: isOver ? 'var(--color-alert)' : 'var(--color-progress-bar)' }}>
            {isOver
              ? `+${fmt(currentPeriodSpend - target.target_monthly_spend)} over`
              : `${fmt(target.target_monthly_spend - currentPeriodSpend)} left`}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 text-[10px] text-muted shrink-0">
          {(() => {
            const saved = Math.max(0, target.avg_baseline - currentPeriodSpend)
            return (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[9px] uppercase tracking-widest text-white/20">
                  {tgtPeriod === 'weekly' ? 'SAVED THIS WEEK' : t('budgets.savedThisMonth')}
                </span>
                <span className="tabular-nums font-semibold text-sm"
                  style={{ color: saved > 0 ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.2)' }}>
                  {saved > 0 ? `+${fmt(saved)}` : fmt(0)}
                </span>
              </div>
            )
          })()}
          <span>{t('budgets.baselineAmt', { amount: fmt(target.avg_baseline) })}{periodLabel}</span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <span style={{ color: colors.income }}>{periodsMet}✓</span>
            <span className="text-white/15">/</span>
            <span style={{ color: colors.expense }}>{periodsOver}✗</span>
            {streak > 0 && <span className="text-white/25">· {t('budgets.streakN', { n: streak })}</span>}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── What-If Simulator ─────────────────────────────────────────
function WhatIfSimulator({
  categories, importanceLevels,
  avgByCategory, avgBySubcategory, avgByImportance, avgByReceiver,
  receivers,
  allExpenses, catMap,
  existingTargets, onAddTarget,
}) {
  const { fmt, fmtK, t } = usePreferences()
  const colors = useThemeColors()
  const [dimension,  setDimension]  = useState('category')
  const [selectedId, setSelectedId] = useState('')
  const [reduction,  setReduction]  = useState(0)
  const [saving,     setSaving]     = useState(false)
  const [period,     setPeriod]     = useState('monthly')
  const [resetDay,   setResetDay]   = useState(0) // 0=Mon…6=Sun

  const topCategories = categories.filter(c => !c.parent_id)
  const subcategories = categories.filter(c =>  c.parent_id)

  // Weekly averages (recomputed when resetDay changes)
  const weeklyAvgs = useMemo(() => {
    const dims = { category: {}, subcategory: {}, importance: {}, merchant: {} }
    for (const tx of allExpenses) {
      const { startStr: wk } = getPeriodBounds('weekly', new Date(tx.date + 'T12:00:00'), resetDay)
      const imp = catMap[tx.category_id]?.importance ?? catMap[tx.subcategory_id]?.importance
      for (const [dim, key] of [['category', tx.category_id], ['subcategory', tx.subcategory_id], ['importance', imp], ['merchant', tx.receiver_id]]) {
        if (!key) continue
        if (!dims[dim][key]) dims[dim][key] = { total: 0, weeks: new Set() }
        dims[dim][key].total += tx.amount
        dims[dim][key].weeks.add(wk)
      }
    }
    return Object.fromEntries(
      Object.entries(dims).map(([dim, obj]) => [
        dim,
        Object.fromEntries(Object.entries(obj).map(([id, { total, weeks }]) => [id, total / weeks.size]))
      ])
    )
  }, [allExpenses, catMap, resetDay])

  const periodMonths = { weekly: 1 / 4.33, monthly: 1, quarterly: 3, yearly: 12 }[period] ?? 1
  const annualMult   = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 }[period] ?? 12
  const periodLabel  = { weekly: '/wk', monthly: '/mo', quarterly: '/qtr', yearly: '/yr' }[period] ?? '/mo'

  const currentSpend = useMemo(() => {
    if (!selectedId) return 0
    let base
    if (period === 'weekly') {
      const avgs = { category: weeklyAvgs.category, subcategory: weeklyAvgs.subcategory, importance: weeklyAvgs.importance, merchant: weeklyAvgs.merchant }
      if (dimension === 'category')    base = avgs.category[selectedId]    ?? 0
      else if (dimension === 'subcategory') base = avgs.subcategory[selectedId] ?? 0
      else if (dimension === 'importance')  base = avgs.importance[selectedId]  ?? 0
      else if (dimension === 'merchant')    base = avgs.merchant[selectedId]    ?? 0
      else base = 0
      return base
    }
    const monthlyAvgs = { category: avgByCategory, subcategory: avgBySubcategory, importance: avgByImportance, merchant: avgByReceiver }
    if (dimension === 'category')    base = monthlyAvgs.category[selectedId]    ?? 0
    else if (dimension === 'subcategory') base = monthlyAvgs.subcategory[selectedId] ?? 0
    else if (dimension === 'importance')  base = monthlyAvgs.importance[selectedId]  ?? 0
    else if (dimension === 'merchant')    base = monthlyAvgs.merchant[selectedId]    ?? 0
    else base = 0
    return base * periodMonths
  }, [dimension, selectedId, period, periodMonths, weeklyAvgs, avgByCategory, avgBySubcategory, avgByImportance, avgByReceiver])

  // Count distinct periods with data for this selection
  const periodCount = useMemo(() => {
    if (!selectedId) return 0
    const filtered = allExpenses.filter(t => {
      if (dimension === 'category')    return t.category_id    === selectedId
      if (dimension === 'subcategory') return t.subcategory_id === selectedId
      if (dimension === 'merchant')    return t.receiver_id    === selectedId
      if (dimension === 'importance') {
        const imp = catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance
        return imp === selectedId
      }
      return false
    })
    if (period === 'weekly') {
      return new Set(filtered.map(t => getPeriodBounds('weekly', new Date(t.date + 'T12:00:00'), resetDay).startStr)).size
    }
    return new Set(filtered.map(t => t.date.slice(0, 7))).size
  }, [dimension, selectedId, allExpenses, catMap, period, resetDay])

  const sliderMax    = Math.max(Math.ceil(currentSpend), 10)
  const reductionNum = Math.min(Math.max(Number(reduction) || 0, 0), currentSpend)
  const targetSpend  = currentSpend - reductionNum
  const annualSaving = reductionNum * annualMult
  const hasResult    = selectedId && reductionNum > 0

  // Smooth animated display value
  const [displayReduction, setDisplayReduction] = useState(0)
  const animFrameRef = useRef(null)
  const animFromRef  = useRef(0)
  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    const from = animFromRef.current
    const to   = reductionNum
    const t0   = performance.now()
    const step = (now) => {
      const p    = Math.min((now - t0) / 240, 1)
      const ease = 1 - Math.pow(1 - p, 2)
      const val  = from + (to - from) * ease
      animFromRef.current = val
      setDisplayReduction(val)
      if (p < 1) animFrameRef.current = requestAnimationFrame(step)
    }
    animFrameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [reductionNum])

  const dispAnnual = displayReduction * annualMult

  // Difficulty of this reduction
  const reductionPct = currentSpend > 0 ? (reductionNum / currentSpend) * 100 : 0
  const difficulty = !hasResult ? null
    : reductionPct < 15 ? { label: 'Easy', color: 'var(--color-progress-bar)', tip: 'Small adjustment — easy to maintain' }
    : reductionPct < 30 ? { label: 'Medium', color: 'var(--color-warning)', tip: 'Moderate change to your habits' }
    : { label: 'Aggressive', color: 'var(--color-alert)', tip: 'Significant lifestyle shift needed' }

  // Est. transactions to skip per period
  const avgTxSize = useMemo(() => {
    if (!selectedId) return null
    const txs = allExpenses.filter(t => {
      if (dimension === 'category')    return t.category_id    === selectedId
      if (dimension === 'subcategory') return t.subcategory_id === selectedId
      if (dimension === 'merchant')    return t.receiver_id    === selectedId
      if (dimension === 'importance') {
        const imp = catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance
        return imp === selectedId
      }
      return false
    })
    return txs.length > 0 ? txs.reduce((s, t) => s + t.amount, 0) / txs.length : null
  }, [dimension, selectedId, allExpenses, catMap])

  const selectedName = useMemo(() => {
    if (!selectedId) return ''
    if (dimension === 'importance') return importanceLevels.find(i => i.value === selectedId)?.label ?? ''
    if (dimension === 'merchant')   return receivers.find(r => r.id === selectedId)?.name ?? ''
    return categories.find(c => c.id === selectedId)?.name ?? ''
  }, [dimension, selectedId, categories, importanceLevels, receivers])

  // Check if target already exists for this selection
  const existingTarget = useMemo(() => {
    if (!selectedId) return null
    return existingTargets.find(t =>
      (dimension === 'category'    && t.category_id    === selectedId) ||
      (dimension === 'subcategory' && t.subcategory_id === selectedId) ||
      (dimension === 'importance'  && t.importance     === selectedId)
    ) ?? null
  }, [dimension, selectedId, existingTargets])

  async function handleAddTarget() {
    if (!hasResult) return
    setSaving(true)
    await onAddTarget({
      dimension,
      selectedId,
      target_monthly_spend: targetSpend,
      reduction_amount:     reductionNum,
      avg_baseline:         currentSpend,
      period,
      reset_day: period === 'weekly' ? resetDay : null,
    })
    setSaving(false)
  }

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} className="text-white/40" />
        <h2 className="text-sm font-semibold">{t('budgets.whatIfTitle')}</h2>
      </div>
      <p className="text-[11px] text-muted mb-5">{t('budgets.whatIfDesc')}</p>

      <div className="flex gap-6">

        {/* Left: controls */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Dimension tabs */}
          <div className="flex bg-white/5 rounded-xl p-0.5">
            {[['category', t('budgets.dimCategory')], ['subcategory', t('budgets.dimSubcategory')], ['importance', t('budgets.dimImportance')], ['merchant', 'Merchant']].map(([v, l]) => (
              <button key={v} type="button"
                onClick={() => { setDimension(v); setSelectedId(''); setReduction(0) }}
                className="flex-1 py-1.5 text-xs rounded-lg transition-all font-medium"
                style={dimension === v
                  ? { background: `color-mix(in srgb, ${colors.accent} 18%, transparent)`, color: colors.accent }
                  : { color: 'rgba(255,255,255,0.4)' }
                }>
                {l}
              </button>
            ))}
          </div>

          {/* Period toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] text-muted uppercase tracking-widest shrink-0">Period</span>
            <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
              {[['monthly', 'Monthly'], ['weekly', 'Weekly'], ['quarterly', 'Quarterly'], ['yearly', 'Yearly']].map(([v, l]) => (
                <button key={v} type="button"
                  onClick={() => { setPeriod(v); setReduction(0) }}
                  className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors"
                  style={period === v
                    ? { background: `color-mix(in srgb, ${colors.accent} 18%, transparent)`, color: colors.accent }
                    : { color: 'rgba(255,255,255,0.4)' }
                  }>
                  {l}
                </button>
              ))}
            </div>
            {period === 'weekly' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted shrink-0">Starts</span>
                <select
                  value={resetDay}
                  onChange={e => { setResetDay(Number(e.target.value)); setReduction(0) }}
                  className="bg-white/5 border border-white/10 rounded-lg text-[10px] text-white/70 px-2 py-0.5 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Picker — min-h locks to importance-grid height so layout doesn't shift */}
          <div className="min-h-[76px]">
            {dimension === 'category' || dimension === 'subcategory' ? (
              <SimSelect
                value={selectedId}
                onChange={v => { setSelectedId(v); setReduction(0) }}
                options={(dimension === 'category' ? topCategories : subcategories).map(c => ({ value: c.id, label: c.name, color: c.color, icon: c.icon }))}
                placeholder={t('budgets.selectDim', { dim: dimension })}
              />
            ) : dimension === 'merchant' ? (
              <MerchantSimSelect
                value={selectedId}
                onChange={v => { setSelectedId(v); setReduction(0) }}
                receivers={receivers.filter(r => avgByReceiver[r.id] != null)}
                placeholder="Select merchant…"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {importanceLevels.map(imp => (
                  <button key={imp.value} type="button" onClick={() => { setSelectedId(imp.value); setReduction(0) }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left"
                    style={{
                      borderColor: selectedId === imp.value ? imp.color : 'rgba(255,255,255,0.08)',
                      background:  selectedId === imp.value ? `color-mix(in srgb, ${imp.color} 12%, transparent)` : 'rgba(255,255,255,0.03)',
                    }}>
                    <span className="flex gap-[3px]">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: i < imp.dots ? imp.color : imp.color + '30' }} />
                      ))}
                    </span>
                    <span className="text-xs text-white/60">{imp.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reduction slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted uppercase tracking-widest">{t('budgets.reduceBy')}</label>
              <span className="text-sm font-semibold tabular-nums" style={{ color: reductionNum > 0 ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.3)' }}>
                {reductionNum > 0 ? `${fmt(reductionNum)}${periodLabel}` : `${fmt(0)}${periodLabel}`}
              </span>
            </div>
            <input
              type="range" min={0} max={sliderMax}
              step={Math.max(1, Math.floor(sliderMax / 100))}
              value={reduction}
              disabled={!selectedId}
              onChange={e => setReduction(Number(e.target.value))}
              className="w-full disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              style={{ accentColor: 'var(--color-progress-bar)' }}
            />
            <div className="flex justify-between text-[10px] text-white/20">
              <span>{fmt(0)}</span>
              <span>{fmt(sliderMax)}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-white/8 self-stretch" />

        {/* Right: results */}
        <div className="flex flex-col gap-3 flex-1">

          {/* Headline savings numbers */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-0.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <span className="text-[10px] text-muted uppercase tracking-widest">
                {period === 'weekly' ? 'Per week' : 'Per month'}
              </span>
              <span className="text-lg font-bold tabular-nums transition-colors"
                style={{ color: hasResult ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.12)' }}>
                {hasResult ? `+${fmt(displayReduction)}` : '—'}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-0.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
              style={hasResult && annualSaving > 0 ? { boxShadow: `0 0 ${Math.min(annualSaving / 60, 18)}px color-mix(in srgb, var(--color-progress-bar) 25%, transparent)` } : {}}>
              <span className="flex items-center gap-1 text-[10px] text-muted uppercase tracking-widest">
                Per year
                <span className="group relative normal-case">
                  <Info size={9} className="text-white/25 cursor-help" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 rounded-lg bg-black/80 px-2.5 py-2 text-[10px] text-white/70 leading-snug opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal">
                    {period === 'weekly' ? 'Weekly saving × 52 weeks' : 'Monthly saving × 12 months'}
                  </span>
                </span>
              </span>
              <span className="text-lg font-bold tabular-nums transition-colors"
                style={{ color: hasResult ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.12)' }}>
                {hasResult ? `+${fmtK(dispAnnual)}` : '—'}
              </span>
            </div>
          </div>

          {/* Timeline */}
          {hasResult && (
            <div className="flex gap-1.5">
              {[
                { label: '3 mo', val: reductionNum * (period === 'weekly' ? 13 : 3) },
                { label: '6 mo', val: reductionNum * (period === 'weekly' ? 26 : 6) },
                { label: '1 yr', val: annualSaving },
              ].map(({ label, val }) => (
                <div key={label} className="flex-1 flex flex-col gap-0.5 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-white/[0.04] text-center">
                  <span className="text-[9px] text-white/25 uppercase tracking-widest">{label}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--color-progress-bar)' }}>+{fmtK(val)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Difficulty + context */}
          {hasResult && (
            <div className="flex items-start gap-2.5 py-2.5 px-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                {difficulty && (
                  <span className="text-[10px] font-semibold" style={{ color: difficulty.color }}>{difficulty.label} — {difficulty.tip}</span>
                )}
                <span className="text-[10px] text-white/30">
                  ~{Math.round(reductionPct)}% reduction from {fmt(currentSpend)}{periodLabel} baseline
                  {avgTxSize && avgTxSize > 0 && reductionNum > 0
                    ? ` · ~${Math.round(reductionNum / avgTxSize)} fewer purchase${Math.round(reductionNum / avgTxSize) === 1 ? '' : 's'}${period === 'weekly' ? '/wk' : '/mo'}`
                    : ''}
                </span>
              </div>
            </div>
          )}

          {/* Baseline vs target bars */}
          <div className="flex flex-col gap-2.5 mt-0.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted">{t('budgets.avgBaseline')}</span>
                <span className="tabular-nums text-white/50">{selectedId ? fmt(currentSpend) : '—'}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: selectedId ? '100%' : '0%', background: 'var(--color-alert)', opacity: 0.45 }} />
              </div>
              <span className="text-[10px] text-white/20">
                {selectedId && periodCount > 0 ? (period === 'weekly' ? `Avg. over ${periodCount} weeks` : t('budgets.avgOverN', { n: periodCount })) : ''}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted">{t('budgets.target')}</span>
                <span className="tabular-nums transition-colors"
                  style={{ color: hasResult ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.2)' }}>
                  {hasResult ? `${fmt(targetSpend)}${periodLabel}` : '—'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: hasResult && currentSpend > 0 ? `${(targetSpend / currentSpend) * 100}%` : '0%', background: 'var(--color-progress-bar)' }} />
              </div>
            </div>
          </div>

          {/* CTA */}
          <button onClick={handleAddTarget} disabled={!hasResult || saving}
            className="mt-2 btn-primary flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold w-full disabled:opacity-30"
            style={hasResult && !existingTarget && annualSaving > 200 ? { boxShadow: `0 0 16px color-mix(in srgb, var(--color-progress-bar) 35%, transparent)` } : undefined}>
            <Target size={14} />
            {saving
              ? t('common.saving')
              : existingTarget
              ? t('budgets.updateTarget')
              : hasResult
              ? `Lock in — save ${fmtK(annualSaving)}/yr`
              : t('budgets.setTarget')
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function SimSelect({ value, onChange, options, placeholder }) {
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

  const selected = options.find(o => o.value === value)
  const q        = search.trim().toLowerCase()
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q)) : options

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left transition-colors hover:border-white/20">
        {selected
          ? <CategoryPill name={selected.label} color={selected.color} icon={selected.icon} />
          : <span className="text-white/25">{placeholder}</span>}
        <ChevronDown size={13} className="text-white/25 shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
          </div>
          <div className="max-h-44 overflow-y-auto scrollbar-thin">
            {filtered.length === 0
              ? <p className="text-xs text-white/30 px-3 py-3">No results</p>
              : filtered.map(opt => (
                  <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={`w-full flex items-center px-3 py-2 hover:bg-white/5 transition-colors ${value === opt.value ? 'bg-white/8' : ''}`}>
                    <CategoryPill name={opt.label} color={opt.color} icon={opt.icon} />
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

function MerchantSimSelect({ value, onChange, receivers, placeholder }) {
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

  const selected = receivers.find(r => r.id === value)
  const q        = search.trim().toLowerCase()
  const filtered = q ? receivers.filter(r => r.name.toLowerCase().includes(q)) : receivers

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-left transition-colors hover:border-white/20">
        {selected ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <ReceiverAvatar receiver={selected} />
            <span className="text-sm text-white truncate">{selected.name}</span>
            {selected.domain && <span className="text-xs text-white/30 truncate">{selected.domain}</span>}
          </div>
        ) : (
          <span className="text-white/25">{placeholder}</span>
        )}
        <ChevronDown size={13} className="text-white/25 shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
          </div>
          <div className="max-h-44 overflow-y-auto scrollbar-thin">
            {filtered.length === 0
              ? <p className="text-xs text-white/30 px-3 py-3">No results</p>
              : filtered.map(r => (
                  <button key={r.id} type="button" onClick={() => { onChange(r.id); setOpen(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 transition-colors text-left ${value === r.id ? 'bg-white/8' : ''}`}>
                    <ReceiverAvatar receiver={r} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white">{r.name}</span>
                      {r.domain && <span className="text-xs text-muted ml-2">{r.domain}</span>}
                    </div>
                    {r.type && <span className="text-[10px] text-white/25 shrink-0">{r.type}</span>}
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Budgets() {
  const { user } = useAuth()
  const { fmt, fmtK, t } = usePreferences()
  const { importance: importanceLevels } = useImportance()

  const [currentDate,   setCurrentDate]   = useState(new Date())
  const [budgets,       setBudgets]       = useState([])
  const [categories,    setCategories]    = useState([])
  const [yearExpenses,  setYearExpenses]  = useState([])
  const [allExpenses,   setAllExpenses]   = useState([])
  const [receivers,     setReceivers]     = useState([])
  const [cards,         setCards]         = useState([])
  const [targets,       setTargets]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modal,         setModal]         = useState(null)
  const [modalDefDim,   setModalDefDim]   = useState('category')
  const [modalDefId,    setModalDefId]    = useState(null)
  const [infoFilter,    setInfoFilter]    = useState(null)
  const [editTarget,    setEditTarget]    = useState(null)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [showSimulator, setShowSimulator] = useState(false)
  const [strictMode, setStrictMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('limits-strictMode')) ?? false } catch { return false }
  })
  const [limitsSortBy, setLimitsSortBy] = useState('pct')   // 'pct'|'spend'|'alpha'
  const [goalsSortBy,  setGoalsSortBy]  = useState('risk')  // 'risk'|'spend'|'alpha'
  const [showLimitsSort, setShowLimitsSort] = useState(false)
  const [showGoalsSort,  setShowGoalsSort]  = useState(false)

  // FLIP animation refs for Limits columns
  const limitsSnapRef     = useRef({})
  const limitsColRefs     = useRef({ cat: null, sub: null, imp: null, rec: null })
  const [limitsPromoted,  setLimitsPromoted]  = useState(new Set())
  // FLIP animation refs for Goals columns
  const goalsSnapRef      = useRef({})
  const goalsColRefs      = useRef({ cat: null, sub: null, imp: null, rec: null })
  const [goalsPromoted,   setGoalsPromoted]   = useState(new Set())

  async function loadBudgets() {
    if (!user?.id) return
    const { data } = await supabase.from('budgets').select('*').eq('user_id', user.id)
    setBudgets(data ?? [])
  }

  async function loadTargets() {
    if (!user?.id) return
    const { data, error } = await supabase.from('targets').select('*').eq('user_id', user.id)
    if (!error) setTargets(data ?? [])
  }

  // Year-scoped data (re-fetches when currentDate's year changes)
  useEffect(() => {
    if (!user?.id) return
    async function load() {
      setLoading(true)
      const year  = currentDate.getFullYear()
      const start = `${year}-01-01`
      const end   = `${year}-12-31`

      const [{ data: txs }, { data: cats }, { data: bgets }, { data: cds }] = await Promise.all([
        supabase.from('transactions')
          .select('amount, category_id, subcategory_id, receiver_id, card_id, date')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .eq('type', 'expense')
          .eq('is_split_parent', false)
          .gte('date', start)
          .lte('date', end),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('cards').select('id, name').eq('user_id', user.id).order('created_at'),
      ])

      setYearExpenses(txs  ?? [])
      setCategories(cats   ?? [])
      setBudgets(bgets     ?? [])
      setCards(cds         ?? [])
      setLoading(false)
    }

    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])

  // All-time data for simulator averages + targets (only re-fetches when user changes)
  useEffect(() => {
    if (!user?.id) return
    async function loadAllTime() {
      const [{ data: allTxs }, { data: tgts, error: tgtsErr }, { data: recData }] = await Promise.all([
        supabase.from('transactions')
          .select('amount, category_id, subcategory_id, receiver_id, date')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .eq('type', 'expense')
          .eq('is_split_parent', false),
        supabase.from('targets').select('*').eq('user_id', user.id),
        supabase.from('receivers').select('id, name, domain, type, logo_url').eq('user_id', user.id),
      ])
      setAllExpenses(allTxs ?? [])
      setReceivers(recData ?? [])
      if (!tgtsErr) setTargets(tgts ?? [])
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

  // Per-budget spending: respects period and optional card filter
  const budgetSpends = useMemo(() => {
    const result = {}
    for (const b of budgets) {
      const { startStr, endStr } = getPeriodBounds(b.period ?? 'monthly', currentDate, b.reset_day)
      result[b.id] = yearExpenses
        .filter(t =>
          t.date >= startStr && t.date <= endStr &&
          (!b.card_id || t.card_id === b.card_id) &&
          (b.category_id    ? t.category_id    === b.category_id
         : b.subcategory_id ? t.subcategory_id === b.subcategory_id
         : b.importance     ? (catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance) === b.importance
         : b.receiver_id   ? t.receiver_id    === b.receiver_id
                            : true)
        )
        .reduce((s, t) => s + t.amount, 0)
    }
    return result
  }, [budgets, yearExpenses, catMap, currentDate])

  const targetSpends = useMemo(() => {
    const result = {}
    for (const tgt of targets) {
      const { startStr, endStr } = getPeriodBounds(tgt.period ?? 'monthly', currentDate, tgt.reset_day)
      result[tgt.id] = yearExpenses
        .filter(t =>
          t.date >= startStr && t.date <= endStr &&
          (tgt.category_id    ? t.category_id    === tgt.category_id
         : tgt.subcategory_id ? t.subcategory_id === tgt.subcategory_id
         : tgt.importance     ? (catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance) === tgt.importance
         : tgt.receiver_id   ? t.receiver_id    === tgt.receiver_id
                              : false)
        )
        .reduce((s, t) => s + t.amount, 0)
    }
    return result
  }, [targets, yearExpenses, catMap, currentDate])

  // All-time average monthly spend per dimension (for simulator)
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
  const avgByImportance  = useMemo(() => {
    return buildAvgMap(t => catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance ?? null)
  }, [allExpenses, catMap])
  const avgByReceiver    = useMemo(() => buildAvgMap(t => t.receiver_id),    [allExpenses])

  // Summary stats
  const allBudgets  = budgets.filter(b => !b.category_id && !b.subcategory_id && !b.importance && !b.receiver_id)
  const catBudgets  = budgets.filter(b => b.category_id)
  const subBudgets  = budgets.filter(b => b.subcategory_id)
  const impBudgets  = budgets.filter(b => b.importance)
  const recBudgets  = budgets.filter(b => b.receiver_id)

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

  useLayoutEffect(() => {
    const promoted = new Set()
    Object.entries(goalsColRefs.current).forEach(([, ref]) => {
      if (ref) animateFlip(ref, goalsSnapRef.current, promoted)
    })
    if (promoted.size > 0) {
      setGoalsPromoted(promoted)
      const t = setTimeout(() => setGoalsPromoted(new Set()), 1500)
      return () => clearTimeout(t)
    }
  }, [targets, goalsSortBy])

  useEffect(() => {
    Object.entries(goalsColRefs.current).forEach(([, ref]) => {
      if (ref) snapPositions(ref, goalsSnapRef.current)
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
  function sortTargetsList(list, sortBy) {
    return [...list].sort((a, b) => {
      const { startStr: sa } = getPeriodBounds(a.period ?? 'monthly', currentDate, a.reset_day)
      const { startStr: sb } = getPeriodBounds(b.period ?? 'monthly', currentDate, b.reset_day)
      const getPct = (tgt, startStr) => {
        const txs = allExpenses.filter(tx => {
          if (tx.date < startStr) return false
          if (tgt.category_id) return tx.category_id === tgt.category_id
          if (tgt.subcategory_id) return tx.subcategory_id === tgt.subcategory_id
          if (tgt.receiver_id) return tx.receiver_id === tgt.receiver_id
          if (tgt.importance) { const i = catMap[tx.category_id]?.importance ?? catMap[tx.subcategory_id]?.importance; return i === tgt.importance }
          return false
        })
        const spend = txs.reduce((s, t) => s + t.amount, 0)
        return tgt.target_monthly_spend > 0 ? spend / tgt.target_monthly_spend : 0
      }
      if (sortBy === 'risk')  return getPct(b, sb) - getPct(a, sa)
      if (sortBy === 'spend') {
        const txA = allExpenses.filter(tx => tx.date >= sa && (a.category_id ? tx.category_id === a.category_id : a.subcategory_id ? tx.subcategory_id === a.subcategory_id : a.receiver_id ? tx.receiver_id === a.receiver_id : (catMap[tx.category_id]?.importance ?? catMap[tx.subcategory_id]?.importance) === a.importance)).reduce((s, t) => s + t.amount, 0)
        const txB = allExpenses.filter(tx => tx.date >= sb && (b.category_id ? tx.category_id === b.category_id : b.subcategory_id ? tx.subcategory_id === b.subcategory_id : b.receiver_id ? tx.receiver_id === b.receiver_id : (catMap[tx.category_id]?.importance ?? catMap[tx.subcategory_id]?.importance) === b.importance)).reduce((s, t) => s + t.amount, 0)
        return txB - txA
      }
      const nameA = a.category_id || a.subcategory_id ? catMap[a.category_id ?? a.subcategory_id]?.name ?? '' : importanceLevels.find(i => i.value === a.importance)?.label ?? ''
      const nameB = b.category_id || b.subcategory_id ? catMap[b.category_id ?? b.subcategory_id]?.name ?? '' : importanceLevels.find(i => i.value === b.importance)?.label ?? ''
      return nameA.localeCompare(nameB)
    })
  }

  function openNew(dim = 'category', id = null) {
    setModalDefDim(dim)
    setModalDefId(id)
    setModal('new')
  }

  async function handleAddTarget({ dimension, selectedId, target_monthly_spend, reduction_amount, avg_baseline, period, reset_day }) {
    const existing = targets.find(t =>
      (dimension === 'category'    && t.category_id    === selectedId) ||
      (dimension === 'subcategory' && t.subcategory_id === selectedId) ||
      (dimension === 'importance'  && t.importance     === selectedId) ||
      (dimension === 'merchant'    && t.receiver_id    === selectedId)
    )
    if (existing) {
      const { error } = await supabase.from('targets')
        .update({ target_monthly_spend, reduction_amount, avg_baseline, period: period ?? 'monthly', reset_day: reset_day ?? null })
        .eq('id', existing.id)
      if (error) { console.error('targets update error:', error); return }
    } else {
      const insertRow = {
        user_id:              user.id,
        target_monthly_spend,
        reduction_amount,
        avg_baseline,
        period:         period ?? 'monthly',
        reset_day:      reset_day ?? null,
        category_id:    dimension === 'category'    ? selectedId : null,
        subcategory_id: dimension === 'subcategory' ? selectedId : null,
        importance:     dimension === 'importance'  ? selectedId : null,
      }
      if (dimension === 'merchant') insertRow.receiver_id = selectedId
      const { error } = await supabase.from('targets').insert(insertRow)
      if (error) { console.error('targets insert error:', error); return }
    }
    await loadTargets()
    window.dispatchEvent(new CustomEvent('targets-updated'))
  }

  async function handleDeleteTarget(id) {
    await supabase.from('targets').delete().eq('id', id)
    setTargets(prev => prev.filter(x => x.id !== id))
    window.dispatchEvent(new CustomEvent('targets-updated'))
  }

  async function handleUpdateTarget(id, fields) {
    await supabase.from('targets').update(fields).eq('id', id)
    setTargets(ts => ts.map(tgt => tgt.id === id ? { ...tgt, ...fields } : tgt))
  }

  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar currentDate={currentDate}
        onPrev={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} />

      <div id="page-content" className="py-6 px-4 md:px-16 pb-24 md:pb-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.budgets')}</h1>
            <p className="text-muted text-sm mt-1">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const next = !strictMode; setStrictMode(next); localStorage.setItem('limits-strictMode', JSON.stringify(next)) }}
              title={strictMode ? 'Strict Mode ON — warnings at 70%, projections tighter' : 'Strict Mode OFF — click to enable earlier warnings'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={strictMode
                ? { background: 'color-mix(in srgb, var(--color-warning) 16%, transparent)', color: 'var(--color-warning)', border: '1px solid color-mix(in srgb, var(--color-warning) 32%, transparent)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.08)' }
              }>
              <Zap size={12} fill={strictMode ? 'currentColor' : 'none'} />
              Strict
            </button>
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
                `${impBudgets.length} imp`,
                recBudgets.length > 0 && `${recBudgets.length} mer`,
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
                {allBudgets.length === 0 && (
                  <button onClick={() => openNew('all')}
                    className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                    <Plus size={11} /> Set budget
                  </button>
                )}
              </div>
              {allBudgets.length === 0 ? (
                <p className="text-[11px] text-muted text-center py-2">
                  {t('budgets.noPeriod')}
                </p>
              ) : (
                <div className="grid gap-4 grid-cols-1">
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
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">{cardMap[b.card_id].name}</span>
                              )}
                            </div>
                            {resetLabel && <span className="text-[11px] text-muted">{resetLabel}</span>}
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
                if (b.category_id)    { const cat = catMap[b.category_id];    return { label: b.name || cat?.name || '—', color: cat?.color, icon: b.name ? undefined : cat?.icon, imp: undefined, info: { dimension: 'category',    id: b.category_id,    label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon, budget: b } } }
                if (b.subcategory_id) { const cat = catMap[b.subcategory_id]; return { label: b.name || cat?.name || '—', color: cat?.color, icon: b.name ? undefined : cat?.icon, imp: undefined, info: { dimension: 'subcategory', id: b.subcategory_id, label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon, budget: b } } }
                if (b.importance)     { const imp = importanceLevels.find(i => i.value === b.importance); return { label: b.name, color: b.name ? imp?.color : undefined, icon: undefined, imp: b.name ? undefined : imp, info: { dimension: 'importance',  id: b.importance, imp, budget: b } } }
                if (b.receiver_id)    { const rec = receivers.find(r => r.id === b.receiver_id);          return { label: b.name || rec?.name || 'Merchant', color: undefined, icon: undefined, imp: undefined, info: { dimension: 'merchant', id: b.receiver_id, label: rec?.name ?? 'Merchant', budget: b } } }
                return { label: '—', color: undefined, icon: undefined, imp: undefined, info: null }
              }

              // Goals for dims that don't already have a budget limit
              const dimKeyOf   = item => item.category_id ?? item.subcategory_id ?? item.importance ?? item.receiver_id ?? null
              const limitDims  = new Set(sortedLimits.map(b => dimKeyOf(b)).filter(k => k !== null))
              const allTargets = [...targets.filter(t => t.category_id), ...targets.filter(t => t.subcategory_id), ...targets.filter(t => t.importance && !t.category_id && !t.subcategory_id), ...targets.filter(t => t.receiver_id)]
              const uncoveredGoals = allTargets.filter(tgt => {
                const k = dimKeyOf(tgt)
                return k === null || !limitDims.has(k)
              })

              const totalItems   = sortedLimits.length + uncoveredGoals.length
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
                      {strictMode && (
                        <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-warning)' }}>
                          <Zap size={10} fill="currentColor" /> Strict
                        </span>
                      )}
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

                  {/* Unified budget grid */}
                  {!isEmpty && (
                    <div
                      ref={el => { limitsColRefs.current.all = el }}
                      className="grid grid-cols-2 gap-3"
                    >
                      {sortedLimits.map(b => {
                        const meta  = getBudgetMeta(b)
                        const spent = budgetSpends[b.id] ?? 0
                        const pPct  = getPeriodPct(b.period ?? 'monthly', currentDate, b.reset_day)
                        return (
                          <div key={`b-${b.id}`} data-flip-id={b.id}
                            style={{ borderRadius: 12, boxShadow: limitsPromoted.has(String(b.id)) ? '0 0 10px color-mix(in srgb, var(--color-warning) 30%, transparent)' : undefined }}>
                            <BudgetCard label={meta.label} color={meta.color} icon={meta.icon} imp={meta.imp}
                              spent={spent} limit={b.monthly_limit} rolloverAmount={b.rollover_amount ?? 0}
                              projectedEnd={calcProjected(b, spent)} periodPct={pPct}
                              period={b.period} cardName={b.card_id ? cardMap[b.card_id]?.name : null}
                              strictMode={strictMode}
                              onEdit={() => setModal(b)}
                              onInfo={() => meta.info && setInfoFilter(meta.info)} />
                          </div>
                        )
                      })}
                      {uncoveredGoals.map(tgt => {
                        const meta  = getBudgetMeta(tgt)
                        const spent = targetSpends[tgt.id] ?? 0
                        const pPct  = getPeriodPct(tgt.period ?? 'monthly', currentDate, tgt.reset_day)
                        const dim   = tgt.category_id ? 'category' : tgt.subcategory_id ? 'subcategory' : tgt.receiver_id ? 'merchant' : 'importance'
                        const id    = tgt.category_id ?? tgt.subcategory_id ?? tgt.receiver_id ?? tgt.importance
                        const cat   = catMap[id]
                        const imp   = importanceLevels.find(i => i.value === id)
                        const rec   = receivers.find(r => r.id === tgt.receiver_id)
                        return (
                          <div key={`t-${tgt.id}`} data-flip-id={`t-${tgt.id}`}
                            style={{ borderRadius: 12, boxShadow: goalsPromoted.has(String(tgt.id)) ? '0 0 10px color-mix(in srgb, var(--color-warning) 30%, transparent)' : undefined }}>
                            <BudgetCard label={meta.label} color={meta.color} icon={meta.icon} imp={meta.imp}
                              spent={spent} limit={tgt.target_monthly_spend} rolloverAmount={0}
                              projectedEnd={calcProjected({ period: tgt.period, reset_day: tgt.reset_day }, spent)} periodPct={pPct}
                              period={tgt.period} cardName={null}
                              strictMode={strictMode}
                              onEdit={() => setEditTarget(tgt)}
                              onInfo={() => setInfoFilter(
                                dim === 'importance' ? { dimension: 'importance', id, imp }
                                : dim === 'merchant'  ? { dimension: 'merchant', id, label: rec?.name ?? 'Merchant' }
                                : { dimension: dim, id, label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon }
                              )} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

          </div>
        )}
      </div>

      {showSimulator && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSimulator(false) }}>
          <div className="relative w-full max-w-3xl">
            <button onClick={() => setShowSimulator(false)}
              className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors text-sm">
              ×
            </button>
            <WhatIfSimulator
              categories={categories}
              importanceLevels={importanceLevels}
              avgByCategory={avgByCategory}
              avgBySubcategory={avgBySubcategory}
              avgByImportance={avgByImportance}
              avgByReceiver={avgByReceiver}
              receivers={receivers}
              allExpenses={allExpenses}
              catMap={catMap}
              existingTargets={targets}
              onAddTarget={async (args) => { await handleAddTarget(args); setShowSimulator(false) }}
            />
          </div>
        </div>,
        document.body
      )}

      {modal !== null && (
        <AddBudgetModal
          budget={modal === 'new' ? null : modal}
          categories={categories}
          defaultDimension={modal === 'new' ? modalDefDim : undefined}
          defaultId={modal === 'new' ? modalDefId : undefined}
          avgByCategory={avgByCategory}
          avgBySubcategory={avgBySubcategory}
          avgByImportance={avgByImportance}
          avgByReceiver={avgByReceiver}
          strictMode={strictMode}
          onClose={() => setModal(null)}
          onSaved={loadBudgets}
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

      {editTarget && (
        <EditTargetModal
          target={editTarget}
          catMap={catMap}
          importanceLevels={importanceLevels}
          onClose={() => setEditTarget(null)}
          onSave={handleUpdateTarget}
          onDelete={handleDeleteTarget}
        />
      )}

      {historyTarget && (
        <TargetHistoryModal
          target={historyTarget}
          allExpenses={allExpenses}
          catMap={catMap}
          importanceLevels={importanceLevels}
          currentDate={currentDate}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  )
}
