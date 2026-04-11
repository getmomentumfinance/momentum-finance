import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Pencil, ChevronDown, Sparkles, Trash2, Target, Info, X, History } from 'lucide-react'
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

function barColor(pct) {
  if (pct >= 100) return 'var(--color-alert)'
  if (pct >= 80)  return 'var(--color-warning)'
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
        .select('id, date, description, amount, category_id, subcategory_id')
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
function BudgetCard({ label, color, icon, imp, spent, limit, rolloverAmount, projectedEnd, period, cardName, onEdit, onInfo }) {
  const { fmt } = usePreferences()
  const rollover        = rolloverAmount > 0 ? rolloverAmount : 0
  const effectiveLimit  = limit + rollover
  const pct             = effectiveLimit > 0 ? Math.min((spent / effectiveLimit) * 100, 100) : 0
  const over            = spent > effectiveLimit
  const remaining       = Math.abs(effectiveLimit - spent)
  const projOver        = projectedEnd != null && projectedEnd > effectiveLimit && !over
  const periodBadge     = period && period !== 'monthly'
    ? { weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly' }[period]
    : null

  return (
    <div onClick={onEdit}
      className="group relative flex flex-col gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.05] transition-all cursor-pointer">
      {/* Top: label + actions */}
      <div className="flex items-start justify-between gap-2">
        {imp
          ? <ImpDots imp={imp} />
          : <CategoryPill name={label} color={color} icon={icon} />
        }
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
        <div className="flex items-center gap-1.5 -mt-1">
          {periodBadge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">{periodBadge}</span>
          )}
          {cardName && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">{cardName}</span>
          )}
        </div>
      )}

      {/* Amount */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-2xl font-bold">{fmt(spent)}</span>
          <span className="text-xs text-muted">
            / {fmt(limit)}
            {rollover > 0 && (
              <span className="ml-1" style={{ color: 'var(--color-progress-bar)' }}>+{fmt(rollover)}</span>
            )}
          </span>
        </div>
        <span className="text-[11px] font-medium tabular-nums"
          style={{ color: over ? 'var(--color-alert)' : 'var(--color-progress-bar)' }}>
          {over ? `+${fmt(remaining)} over` : `${fmt(remaining)} left`}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-2 w-full rounded-full bg-white/8 overflow-hidden">
        {/* Rollover segment — subtle tint showing the extra budget */}
        {rollover > 0 && (
          <div className="absolute inset-y-0 right-0 rounded-r-full"
            style={{
              width: `${(rollover / effectiveLimit) * 100}%`,
              background: 'color-mix(in srgb, var(--color-progress-bar) 22%, transparent)',
            }} />
        )}
        {/* Spent segment */}
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: barColor(pct) }} />
      </div>

      {/* Spending pace */}
      {projectedEnd != null && (
        <span className="text-[10px] tabular-nums"
          style={{ color: projOver ? 'var(--color-warning)' : 'rgba(255,255,255,0.2)' }}>
          {projOver
            ? `↗ On pace for ${fmt(projectedEnd)} by period end`
            : `On pace for ${fmt(projectedEnd)} by period end`}
        </span>
      )}
    </div>
  )
}

// ── Edit Target Modal ──────────────────────────────────────────
function EditTargetModal({ target, catMap, importanceLevels, onClose, onSave }) {
  const { fmt, fmtK, t } = usePreferences()
  const colors = useThemeColors()
  const baseline   = target.avg_baseline
  const sliderMax  = Math.ceil(baseline * 1.3)
  const [spend, setSpend] = useState(target.target_monthly_spend)
  const [saving, setSaving] = useState(false)

  const reduction   = Math.max(0, baseline - spend)
  const annualSaving = reduction * 12

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
              <span className="text-sm tabular-nums text-white/50">{fmt(baseline)}/mo</span>
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
                {fmt(spend)}/mo
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
  const tgt    = target.target_monthly_spend

  const monthlySpends = useMemo(() => {
    const filtered = allExpenses.filter(t => {
      if (target.category_id)    return t.category_id    === target.category_id
      if (target.subcategory_id) return t.subcategory_id === target.subcategory_id
      if (target.importance) {
        const imp = catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance
        return imp === target.importance
      }
      return false
    })
    const byMonth = {}
    for (const t of filtered) {
      const m = t.date.slice(0, 7)
      byMonth[m] = (byMonth[m] ?? 0) + t.amount
    }
    return byMonth
  }, [target, allExpenses, catMap])

  // All months from creation to now, grouped by year
  const yearGroups = useMemo(() => {
    const created    = new Date(target.created_at)
    const startYear  = created.getFullYear()
    const startMonth = created.getMonth()
    const endYear    = currentDate.getFullYear()
    const endMonth   = currentDate.getMonth()
    const count      = (endYear - startYear) * 12 + (endMonth - startMonth) + 1

    const byYear = {}
    for (let i = 0; i < count; i++) {
      const d    = new Date(startYear, startMonth + i, 1)
      const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const year = d.getFullYear()
      if (!byYear[year]) byYear[year] = []
      byYear[year].push({
        key,
        label:     d.toLocaleDateString('en-US', { month: 'short' }),
        spend:     monthlySpends[key] ?? null,
        isCurrent: i === count - 1,
      })
    }

    return Object.entries(byYear).sort(([a], [b]) => a - b).map(([year, months]) => {
      const first = months[0]
      const last  = months.at(-1)
      const isFullYear = first.key.endsWith('-01') && (last.isCurrent ? false : last.key.endsWith('-12'))
      const rangeLabel = isFullYear ? t('budgets.fullYear')
        : `${new Date(first.key + '-01').toLocaleDateString('en-US', { month: 'short' })} – ${new Date(last.key + '-01').toLocaleDateString('en-US', { month: 'short' })}`
      return { year: Number(year), months, rangeLabel }
    })
  }, [target.created_at, monthlySpends, currentDate])

  // Overall stats (all months with data)
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
              <p className="text-[11px] text-white/30">{t('budgets.startedLabel', { date: startLabel, amount: fmt(tgt) })}</p>
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
              {totalSaved > 0 ? t('budgets.savedTotal', { amount: fmt(totalSaved) }) : t('budgets.baselineAmt', { amount: fmt(target.avg_baseline) })}
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
function TargetRow({ target, allExpenses, catMap, importanceLevels, receivers, currentDate, onDelete, onInfo, onEdit, onHistory }) {
  const { fmt, t } = usePreferences()
  const colors = useThemeColors()
  const monthlySpends = useMemo(() => {
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
    const byMonth = {}
    for (const t of filtered) {
      const m = t.date.slice(0, 7)
      byMonth[m] = (byMonth[m] ?? 0) + t.amount
    }
    return byMonth
  }, [target, allExpenses, catMap])

  // Months from creation to current month
  const chartMonths = useMemo(() => {
    const created   = new Date(target.created_at)
    const startYear  = created.getFullYear()
    const startMonth = created.getMonth()
    const endYear    = currentDate.getFullYear()
    const endMonth   = currentDate.getMonth()
    const count      = (endYear - startYear) * 12 + (endMonth - startMonth) + 1
    const result = []
    for (let i = 0; i < count; i++) {
      const d   = new Date(startYear, startMonth + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      result.push({
        key,
        label:     d.toLocaleDateString('en-US', { month: 'short' }),
        spend:     monthlySpends[key] ?? null,
        isCurrent: i === count - 1,
      })
    }
    return result
  }, [target.created_at, monthlySpends, currentDate])

  const months      = Object.entries(monthlySpends)
  const monthsMet   = months.filter(([, s]) => s <= target.target_monthly_spend).length
  const monthsOver  = months.filter(([, s]) => s >  target.target_monthly_spend).length
  const totalMonths = months.length
  const hitRate     = totalMonths > 0 ? Math.round((monthsMet / totalMonths) * 100) : null

  // Streak: consecutive months on target ending at current
  const streak = useMemo(() => {
    let s = 0
    for (let i = chartMonths.length - 1; i >= 0; i--) {
      const { spend } = chartMonths[i]
      if (spend === null) break
      if (spend > target.target_monthly_spend) break
      s++
    }
    return s
  }, [chartMonths, target.target_monthly_spend])

  // Year-by-year history (only past calendar years)
  const yearlyHistory = useMemo(() => {
    const currentYear = currentDate.getFullYear()
    const byYear = {}
    for (const m of chartMonths) {
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
  }, [chartMonths, currentDate, target.target_monthly_spend])

  const currentMonthKey   = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const currentMonthSpend = monthlySpends[currentMonthKey] ?? 0
  const isOver = currentMonthSpend > target.target_monthly_spend
  const pct    = target.target_monthly_spend > 0
    ? Math.min((currentMonthSpend / target.target_monthly_spend) * 100, 100)
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

  const chartMax = Math.max(...chartMonths.map(m => m.spend ?? 0), target.target_monthly_spend) * 1.15
  const xOf = i => PAD.l + (chartMonths.length > 1 ? (i / (chartMonths.length - 1)) * iW : iW / 2)
  const yOf = v => PAD.t + (1 - Math.min(v, chartMax) / chartMax) * iH
  const targetY = yOf(target.target_monthly_spend)

  const pts = chartMonths.map((m, i) => ({ ...m, x: xOf(i), y: m.spend !== null ? yOf(m.spend) : null }))
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
          {hitRate !== null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] tabular-nums text-white/40">
              {t('tw.hitRate', { n: hitRate })}
            </span>
          )}
          <button type="button" onClick={e => { e.stopPropagation(); onHistory() }}
            className="p-1 rounded-lg hover:bg-white/8 transition-colors text-white/25 hover:text-white">
            <History size={11} />
          </button>
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

      {/* SVG line chart */}
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

      {/* Bottom: current month left, stats right */}
      <div className="flex items-end justify-between gap-6 border-t border-white/[0.05] pt-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <span className="text-2xl font-bold">{fmt(currentMonthSpend)}</span>
            <span className="text-xs text-muted">/ {fmt(target.target_monthly_spend)}</span>
          </div>
          <div className="h-2 w-36 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: isOver ? 'var(--color-alert)' : 'var(--color-progress-bar)' }} />
          </div>
          <span className="text-[11px] tabular-nums"
            style={{ color: isOver ? 'var(--color-alert)' : 'var(--color-progress-bar)' }}>
            {isOver
              ? `+${fmt(currentMonthSpend - target.target_monthly_spend)} over`
              : `${fmt(target.target_monthly_spend - currentMonthSpend)} left`}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 text-[10px] text-muted shrink-0">
          {(() => {
            const saved = Math.max(0, target.avg_baseline - currentMonthSpend)
            return (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[9px] uppercase tracking-widest text-white/20">{t('budgets.savedThisMonth')}</span>
                <span className="tabular-nums font-semibold text-sm"
                  style={{ color: saved > 0 ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.2)' }}>
                  {saved > 0 ? `+${fmt(saved)}` : fmt(0)}
                </span>
              </div>
            )
          })()}
          <span>{t('budgets.baselineAmt', { amount: fmt(target.avg_baseline) })}</span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <span style={{ color: colors.income }}>{monthsMet}✓</span>
            <span className="text-white/15">/</span>
            <span style={{ color: colors.expense }}>{monthsOver}✗</span>
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

  const topCategories = categories.filter(c => !c.parent_id)
  const subcategories = categories.filter(c =>  c.parent_id)

  const currentSpend = useMemo(() => {
    if (!selectedId) return 0
    if (dimension === 'category')    return avgByCategory[selectedId]    ?? 0
    if (dimension === 'subcategory') return avgBySubcategory[selectedId] ?? 0
    if (dimension === 'importance')  return avgByImportance[selectedId]  ?? 0
    if (dimension === 'merchant')    return avgByReceiver[selectedId]    ?? 0
    return 0
  }, [dimension, selectedId, avgByCategory, avgBySubcategory, avgByImportance, avgByReceiver])

  // Count distinct months with data for this selection
  const monthCount = useMemo(() => {
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
    return new Set(filtered.map(t => t.date.slice(0, 7))).size
  }, [dimension, selectedId, allExpenses, catMap])

  const sliderMax    = Math.max(Math.ceil(currentSpend), 10)
  const reductionNum = Math.min(Math.max(Number(reduction) || 0, 0), currentSpend)
  const targetSpend  = currentSpend - reductionNum
  const annualSaving = reductionNum * 12
  const hasResult    = selectedId && reductionNum > 0

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
                {reductionNum > 0 ? `${fmt(reductionNum)}/mo` : `${fmt(0)}/mo`}
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

        {/* Right: results — always rendered so height stays fixed */}
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted uppercase tracking-widest">{t('budgets.monthlySaving')}</span>
              <span className="text-base font-bold tabular-nums transition-colors"
                style={{ color: hasResult ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.12)' }}>
                {hasResult ? `+${fmt(reductionNum)}` : '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted uppercase tracking-widest">{t('budgets.annualSaving')}</span>
              <span className="text-2xl font-bold tabular-nums transition-colors"
                style={{ color: hasResult ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.12)' }}>
                {hasResult ? `+${fmtK(annualSaving)}` : '—'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-muted">
                  {t('budgets.avgBaseline')}
                  <span className="group relative">
                    <Info size={10} className="text-white/25 cursor-help" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 rounded-lg bg-black/80 px-2.5 py-2 text-[10px] text-white/70 leading-snug opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal">
                      Your actual average monthly spending here, calculated over all recorded months.
                    </span>
                  </span>
                </span>
                <span className="tabular-nums text-white/60">{hasResult ? fmt(currentSpend) : '—'}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: hasResult ? '100%' : '0%', background: 'var(--color-alert)', opacity: 0.5 }} />
              </div>
              <span className="text-[10px] text-white/20 min-h-[14px]">
                {hasResult && monthCount > 0 ? t('budgets.avgOverN', { n: monthCount }) : ''}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-muted">
                  {t('budgets.target')}
                  <span className="group relative">
                    <Info size={10} className="text-white/25 cursor-help" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 rounded-lg bg-black/80 px-2.5 py-2 text-[10px] text-white/70 leading-snug opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal">
                      Your spending goal — the maximum you want to spend per month in this area.
                    </span>
                  </span>
                </span>
                <span className="tabular-nums transition-colors"
                  style={{ color: hasResult ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.2)' }}>
                  {hasResult ? `${fmt(targetSpend)}/mo` : '—'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width:      hasResult ? `${(targetSpend / currentSpend) * 100}%` : '0%',
                    background: 'var(--color-progress-bar)',
                  }} />
              </div>
            </div>
          </div>

          {/* Add / update target */}
          <button onClick={handleAddTarget} disabled={!hasResult || saving}
            className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all disabled:opacity-30"
            style={{
              borderColor: existingTarget ? 'rgba(255,255,255,0.15)' : 'var(--color-progress-bar)',
              color:       existingTarget ? 'rgba(255,255,255,0.5)' : 'var(--color-progress-bar)',
              background:  existingTarget ? 'transparent' : 'color-mix(in srgb, var(--color-progress-bar) 10%, transparent)',
            }}>
            <Target size={12} />
            {saving ? t('common.saving') : existingTarget ? t('budgets.updateTarget') : t('budgets.setTarget')}
          </button>
        </div>
      </div>
    </div>
  )
}

function SimSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const selected = options.find(o => o.value === value)

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
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl max-h-48 overflow-y-auto scrollbar-thin">
          {options.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center px-3 py-2 hover:bg-white/5 transition-colors ${value === opt.value ? 'bg-white/8' : ''}`}>
              <CategoryPill name={opt.label} color={opt.color} icon={opt.icon} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MerchantSimSelect({ value, onChange, receivers, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const selected = receivers.find(r => r.id === value)

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
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl max-h-48 overflow-y-auto scrollbar-thin">
          {receivers.map(r => (
            <button key={r.id} type="button"
              onClick={() => { onChange(r.id); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 transition-colors text-left ${value === r.id ? 'bg-white/8' : ''}`}>
              <ReceiverAvatar receiver={r} />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white">{r.name}</span>
                {r.domain && <span className="text-xs text-muted ml-2">{r.domain}</span>}
              </div>
              {r.type && <span className="text-[10px] text-white/25 shrink-0">{r.type}</span>}
            </button>
          ))}
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
  const [infoFilter,    setInfoFilter]    = useState(null)
  const [editTarget,    setEditTarget]    = useState(null)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [showSimulator, setShowSimulator] = useState(false)

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
          .select('amount, category_id, subcategory_id, card_id, date')
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
                            : true)
        )
        .reduce((s, t) => s + t.amount, 0)
    }
    return result
  }, [budgets, yearExpenses, catMap, currentDate])

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
  const allBudgets  = budgets.filter(b => !b.category_id && !b.subcategory_id && !b.importance)
  const catBudgets  = budgets.filter(b => b.category_id)
  const subBudgets  = budgets.filter(b => b.subcategory_id)
  const impBudgets  = budgets.filter(b => b.importance)

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

  function openNew(dim = 'category') {
    setModalDefDim(dim)
    setModal('new')
  }

  async function handleAddTarget({ dimension, selectedId, target_monthly_spend, reduction_amount, avg_baseline }) {
    const existing = targets.find(t =>
      (dimension === 'category'    && t.category_id    === selectedId) ||
      (dimension === 'subcategory' && t.subcategory_id === selectedId) ||
      (dimension === 'importance'  && t.importance     === selectedId) ||
      (dimension === 'merchant'    && t.receiver_id    === selectedId)
    )
    if (existing) {
      const { error } = await supabase.from('targets')
        .update({ target_monthly_spend, reduction_amount, avg_baseline })
        .eq('id', existing.id)
      if (error) { console.error('targets update error:', error); return }
    } else {
      const insertRow = {
        user_id:              user.id,
        target_monthly_spend,
        reduction_amount,
        avg_baseline,
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

      <div id="page-content" className="py-6 px-16 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.budgets')}</h1>
            <p className="text-muted text-sm mt-1">{dateStr}</p>
          </div>
          <button onClick={() => openNew()}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            <Plus size={14} /> {t('budgets.addBudget')}
          </button>
        </div>

        {/* Top: 2×2 stat grid */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: t('budgets.active'),
              value: budgets.length,
              sub:   `${catBudgets.length} cat · ${subBudgets.length} sub · ${impBudgets.length} imp`,
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
          <div className="text-center py-16 text-muted text-sm">{t('common.loading')}</div>
        ) : (
            <div className="flex flex-col gap-4">

            {/* Main period budgets — hero section */}
            <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">{t('budgets.periodBudgets')}</span>
                <button onClick={() => openNew('all')}
                  className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                  <Plus size={11} /> Add
                </button>
              </div>
              {allBudgets.length === 0 ? (
                <p className="text-[11px] text-muted text-center py-2">
                  {t('budgets.noPeriod')}
                </p>
              ) : (
                <div className={`grid gap-4 ${allBudgets.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
                    return (
                      <div key={b.id} onClick={() => setModal(b)}
                        className="group flex flex-col gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{PERIOD_LABELS[b.period] ?? 'Budget'}</span>
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
                        <div className="flex items-baseline gap-2 tabular-nums">
                          <span className="text-3xl font-bold">{fmt(spent)}</span>
                          <span className="text-sm text-muted">/ {fmt(b.monthly_limit)}</span>
                          <span className="ml-auto text-sm font-medium tabular-nums"
                            style={{ color: over ? 'var(--color-alert)' : 'var(--color-progress-bar)' }}>
                            {over ? `+${fmt(remaining)} over` : `${fmt(remaining)} left`}
                          </span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-white/8 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: barColor(pct) }} />
                        </div>
                        {projected != null && (
                          <span className="text-[11px] tabular-nums -mt-1"
                            style={{ color: projected > b.monthly_limit ? 'var(--color-alert)' : 'var(--color-progress-bar)' }}>
                            Projected {fmt(projected)} by period end
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Budgets — 3 columns side by side */}
            <div className="glass-card rounded-2xl p-5">

              <div className="grid grid-cols-3 divide-x divide-white/[0.05]">

                {/* By Category */}
                <div className="pr-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/80">{t('budgets.byCategory')}</span>
                      {catBudgets.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/40 tabular-nums">{catBudgets.length}</span>}
                    </div>
                    <button onClick={() => openNew('category')}
                      className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  {catBudgets.length === 0
                    ? <p className="text-[11px] text-muted py-3 text-center">{t('budgets.none')}</p>
                    : catBudgets.map(b => {
                        const cat   = catMap[b.category_id]
                        const spent = budgetSpends[b.id] ?? 0
                        return <BudgetCard key={b.id} label={b.name || cat?.name || '—'} color={cat?.color} icon={b.name ? undefined : cat?.icon}
                          spent={spent} limit={b.monthly_limit} rolloverAmount={b.rollover_amount ?? 0} projectedEnd={calcProjected(b, spent)}
                          period={b.period} cardName={b.card_id ? cardMap[b.card_id]?.name : null}
                          onEdit={() => setModal(b)}
                          onInfo={() => setInfoFilter({ dimension: 'category', id: b.category_id, label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon, budget: b })} />
                      })
                  }
                </div>

                {/* By Subcategory */}
                <div className="px-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/80">{t('budgets.bySub')}</span>
                      {subBudgets.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/40 tabular-nums">{subBudgets.length}</span>}
                    </div>
                    <button onClick={() => openNew('subcategory')}
                      className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  {subBudgets.length === 0
                    ? <p className="text-[11px] text-muted py-3 text-center">{t('budgets.none')}</p>
                    : subBudgets.map(b => {
                        const cat   = catMap[b.subcategory_id]
                        const spent = budgetSpends[b.id] ?? 0
                        return <BudgetCard key={b.id} label={b.name || cat?.name || '—'} color={cat?.color} icon={b.name ? undefined : cat?.icon}
                          spent={spent} limit={b.monthly_limit} rolloverAmount={b.rollover_amount ?? 0} projectedEnd={calcProjected(b, spent)}
                          period={b.period} cardName={b.card_id ? cardMap[b.card_id]?.name : null}
                          onEdit={() => setModal(b)}
                          onInfo={() => setInfoFilter({ dimension: 'subcategory', id: b.subcategory_id, label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon, budget: b })} />
                      })
                  }
                </div>

                {/* By Importance */}
                <div className="pl-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/80">{t('budgets.byImportance')}</span>
                      {impBudgets.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/40 tabular-nums">{impBudgets.length}</span>}
                    </div>
                    <button onClick={() => openNew('importance')}
                      className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  {impBudgets.length === 0
                    ? <p className="text-[11px] text-muted py-3 text-center">{t('budgets.none')}</p>
                    : impBudgets.map(b => {
                        const imp   = importanceLevels.find(i => i.value === b.importance)
                        if (!imp) return null
                        const spent = budgetSpends[b.id] ?? 0
                        return <BudgetCard key={b.id} imp={b.name ? undefined : imp} label={b.name} color={b.name ? imp?.color : undefined}
                          spent={spent} limit={b.monthly_limit} rolloverAmount={b.rollover_amount ?? 0} projectedEnd={calcProjected(b, spent)}
                          period={b.period} cardName={b.card_id ? cardMap[b.card_id]?.name : null}
                          onEdit={() => setModal(b)}
                          onInfo={() => setInfoFilter({ dimension: 'importance', id: b.importance, imp, budget: b })} />
                      })
                  }
                </div>

              </div>
            </div>

            {/* Targets */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{t('budgets.targets')}</h2>
                  {targets.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/40 tabular-nums">{targets.length}</span>
                  )}
                </div>
                <button onClick={() => setShowSimulator(true)}
                  className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                  <Plus size={11} /> {t('budgets.addTarget')}
                </button>
              </div>

              {targets.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Target size={28} className="text-white/15" />
                  <p className="text-muted text-sm text-center">{t('budgets.noTargets')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {targets.map(tgt => {
                    const dim = tgt.category_id ? 'category' : tgt.subcategory_id ? 'subcategory' : tgt.receiver_id ? 'merchant' : 'importance'
                    const id  = tgt.category_id ?? tgt.subcategory_id ?? tgt.receiver_id ?? tgt.importance
                    const cat = catMap[id]
                    const imp = importanceLevels.find(i => i.value === id)
                    const rec = receivers.find(r => r.id === tgt.receiver_id)
                    return (
                      <TargetRow
                        key={tgt.id}
                        target={tgt}
                        allExpenses={allExpenses}
                        catMap={catMap}
                        importanceLevels={importanceLevels}
                        receivers={receivers}
                        currentDate={currentDate}
                        onDelete={() => handleDeleteTarget(tgt.id)}
                        onEdit={() => setEditTarget(tgt)}
                        onHistory={() => setHistoryTarget(tgt)}
                        onInfo={() => setInfoFilter(
                          dim === 'importance'
                            ? { dimension: 'importance', id, imp }
                            : dim === 'merchant'
                            ? { dimension: 'merchant', id, label: rec?.name ?? 'Merchant' }
                            : { dimension: dim, id, label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon }
                        )}
                      />
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(var(--card-blur, 4px))' }}
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
        </div>
      )}

      {modal !== null && (
        <AddBudgetModal
          budget={modal === 'new' ? null : modal}
          categories={categories}
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
