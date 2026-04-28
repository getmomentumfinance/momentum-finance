import { useMemo } from 'react'
import { TrendingDown, TrendingUp, PiggyBank, Lightbulb } from 'lucide-react'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useImportance } from '../../hooks/useImportance'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import { useSharedData } from '../../context/SharedDataContext'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { toLocalStr, calcBudgetSpend } from '../../utils/budgetPeriod'

const fmtPct = n => `${Math.abs(n).toFixed(0)}%`

function midColor(v) {
  if (!v) return undefined
  const stops = [...v.matchAll(/#[0-9a-fA-F]{6}/gi)].map(m => m[0])
  if (!stops.length) return v
  if (stops.length === 1) return stops[0]
  if (stops.length === 2) {
    const p = s => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)]
    const [r1,g1,b1] = p(stops[0]), [r2,g2,b2] = p(stops[1])
    return '#' + [Math.round((r1+r2)/2), Math.round((g1+g2)/2), Math.round((b1+b2)/2)].map(x => x.toString(16).padStart(2,'0')).join('')
  }
  return stops[Math.floor(stops.length / 2)]
}

export default function FinancialInsights({ currentDate = new Date() }) {
  const { fmt, fmtK, t } = usePreferences()
  const { importance: importanceLevels } = useImportance()
  const c = useCardCustomization('Financial Insights')
  const { allTransactions, subscriptions, budgets, categoryMap, receiverMap } = useSharedData()

  const data = useMemo(() => {
    const year  = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const thisStart = toLocalStr(new Date(year, month,     1))
    const thisEnd   = toLocalStr(new Date(year, month + 1, 0))
    const lastStart = toLocalStr(new Date(year, month - 1, 1))
    const lastEnd   = toLocalStr(new Date(year, month,     0))
    const yearStr   = `${year}-`

    const thisTxs    = allTransactions.filter(t => t.date >= thisStart && t.date <= thisEnd)
    const lastTxs    = allTransactions.filter(t => t.date >= lastStart && t.date <= lastEnd)
    const allExpenses = allTransactions.filter(t => t.type === 'expense' && t.date?.startsWith(yearStr))

    const sum = (rows, type) => rows.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0)

    const thisIncome   = sum(thisTxs, 'income')
    const thisExpenses = sum(thisTxs, 'expense')
    const lastExpenses = sum(lastTxs, 'expense')

    const hasSavingsTx = thisTxs.some(t => t.type === 'savings')
    const earnedIncome = thisTxs
      .filter(t => t.type === 'income' && t.is_earned)
      .reduce((s, t) => s + t.amount, 0)

    const savingsRate  = (thisIncome > 0 && hasSavingsTx) ? Math.max(0, ((thisIncome - thisExpenses) / thisIncome) * 100) : null
    const vsLastMonth  = lastExpenses >= 50 ? ((thisExpenses - lastExpenses) / lastExpenses) * 100 : null
    const totalSubCost = subscriptions.reduce((s, sub) => s + Number(sub.amount), 0)

    const catMap = categoryMap
    const recMap = receiverMap

    const getBudgetMeta = b => {
      if (b.category_ids?.length) {
        const cats = b.category_ids.map(id => catMap[id]).filter(Boolean)
        return { name: b.name || cats.map(c => c.name).join(' · ') || 'Budget', color: midColor(cats[0]?.color) ?? 'var(--color-progress-bar)' }
      }
      if (b.subcategory_ids?.length) {
        const cats = b.subcategory_ids.map(id => catMap[id]).filter(Boolean)
        return { name: b.name || cats.map(c => c.name).join(' · ') || 'Budget', color: midColor(cats[0]?.color) ?? 'var(--color-progress-bar)' }
      }
      if (b.importance_ids?.length) {
        const imps = b.importance_ids.map(v => importanceLevels.find(i => i.value === v)).filter(Boolean)
        return { name: b.name || imps.map(i => i.label).join(' · ') || 'Budget', color: imps[0]?.color ?? 'var(--color-progress-bar)' }
      }
      if (b.receiver_ids?.length) {
        const recs = b.receiver_ids.map(id => recMap[id]).filter(Boolean)
        return { name: b.name || recs.map(r => r.name).join(' · ') || 'Budget', color: 'var(--color-progress-bar)' }
      }
      if (b.category_id)    return { name: b.name || catMap[b.category_id]?.name    || 'Budget', color: midColor(catMap[b.category_id]?.color)    ?? 'var(--color-progress-bar)' }
      if (b.subcategory_id) return { name: b.name || catMap[b.subcategory_id]?.name || 'Budget', color: midColor(catMap[b.subcategory_id]?.color) ?? 'var(--color-progress-bar)' }
      if (b.importance)     { const imp = importanceLevels.find(i => i.value === b.importance); return { name: b.name || imp?.label || 'Budget', color: imp?.color ?? 'var(--color-progress-bar)' } }
      if (b.receiver_id)    return { name: b.name || recMap[b.receiver_id]?.name || 'Budget', color: 'var(--color-progress-bar)' }
      return { name: b.name || 'Total', color: 'var(--color-progress-bar)' }
    }

    const budgetRows = budgets
      .filter(b => b.monthly_limit > 0)
      .map(b => {
        const spent = calcBudgetSpend(b, allExpenses, currentDate)
        const { name, color } = getBudgetMeta(b)
        const periodLabel = { weekly: 'wk', monthly: 'mo', quarterly: 'qtr', yearly: 'yr' }[b.period ?? 'monthly'] ?? 'mo'
        const pct  = Math.min((spent / b.monthly_limit) * 100, 100)
        const over = spent > b.monthly_limit
        return { name, spent, limit: b.monthly_limit, pct, color, over, periodLabel }
      })
      .sort((a, b) => b.pct - a.pct)

    const overBudgetCount = budgetRows.filter(b => b.over).length

    return { savingsRate, vsLastMonth, totalSubCost, overBudgetCount, thisIncome, thisExpenses, budgetRows, earnedIncome }
  }, [allTransactions, subscriptions, budgets, categoryMap, receiverMap, currentDate, importanceLevels])

  if (!data) return null

  const { savingsRate, vsLastMonth, totalSubCost, overBudgetCount, thisIncome, budgetRows, earnedIncome } = data

  const srColor = savingsRate === null  ? 'rgba(255,255,255,0.3)'
                : savingsRate >= 20     ? 'var(--color-progress-bar)'
                : savingsRate >= 10     ? 'var(--color-warning)'
                :                         'var(--color-alert)'

  const vlColor = vsLastMonth === null ? 'rgba(255,255,255,0.3)'
                : vsLastMonth <= 0     ? 'var(--color-progress-bar)'
                :                        'var(--color-alert)'

  const vlLabel = vsLastMonth === null ? '—'
                : vsLastMonth <= 0     ? `↘ ${fmtPct(-vsLastMonth)}`
                :                        `↗ ${fmtPct(vsLastMonth)}`

  const insights = []

  if (savingsRate !== null && savingsRate < 10 && thisIncome > 0) {
    insights.push({
      Icon: PiggyBank,
      color: 'var(--color-alert)',
      title: t('fi.lowSavings.title'),
      desc: t('fi.lowSavings.desc', { n: savingsRate.toFixed(0) }),
      badge: t('fi.lowSavings.badge'),
    })
  }
  if (vsLastMonth !== null && vsLastMonth > 20) {
    insights.push({
      Icon: TrendingUp,
      color: 'var(--color-alert)',
      title: t('fi.spike.title'),
      desc: t('fi.spike.desc', { n: fmtPct(vsLastMonth) }),
    })
  }
  if (vsLastMonth !== null && vsLastMonth < -10) {
    insights.push({
      Icon: TrendingDown,
      color: 'var(--color-progress-bar)',
      title: t('fi.down.title'),
      desc: t('fi.down.desc', { n: fmtPct(-vsLastMonth) }),
    })
  }
  if (totalSubCost > 0 && earnedIncome > 0 && (totalSubCost / earnedIncome) > 0.1) {
    insights.push({
      Icon: Lightbulb,
      color: 'var(--color-warning)',
      title: t('fi.subHigh.title'),
      desc: t('fi.subHigh.desc', { amount: fmt(totalSubCost), n: ((totalSubCost / earnedIncome) * 100).toFixed(0) }),
      badge: t('fi.subHigh.badge'),
    })
  } else if (totalSubCost > 0) {
    insights.push({
      Icon: Lightbulb,
      color: 'rgba(255,255,255,0.35)',
      title: t('fi.sub.title'),
      desc: t('fi.sub.desc', { amount: fmt(totalSubCost) }),
    })
  }

  const metrics = [
    { label: t('fi.savingsRate'), value: savingsRate === null ? '—' : `${savingsRate.toFixed(0)}%`, color: srColor },
    { label: t('fi.vsLast'),      value: vlLabel, color: vlColor },
    { label: t('fi.overBudget'),  value: String(overBudgetCount), color: overBudgetCount > 0 ? 'var(--color-alert)' : 'var(--color-progress-bar)' },
  ]

  const visibleBudgets = budgetRows.slice(0, 6)

  return (
    <>
    <div className="glass-card rounded-2xl p-4 mb-0 h-full overflow-hidden flex flex-col gap-3 relative" style={{ border: c.borderStyle }}>
      {c.bgGradient && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: c.bgGradient, opacity: c.opacity / 100 }} />
      )}
      {c.enableColor && c.darkOverlay > 0 && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl bg-black" style={{ opacity: c.darkOverlay / 100 }} />
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 shrink-0">
        <button
          ref={c.btnRef}
          type="button"
          onClick={c.toggleOpen}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Lightbulb size={14} className="text-white/60" />
        </button>
        <span className="font-semibold text-base">{t('fi.title')}</span>
      </div>

      {/* Metrics + Insights row */}
      <div className="relative z-10 flex gap-4 items-start shrink-0">
        <div className="grid grid-cols-3 gap-2 shrink-0" style={{ width: '340px' }}>
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-xl py-3 px-2 bg-white/[0.04] border border-white/[0.05]">
              <span className="text-[10px] text-white/40 uppercase tracking-wider text-center leading-tight">{label}</span>
              <span className="font-bold text-lg tabular-nums" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        {insights.length > 0 && <div className="w-px self-stretch bg-white/[0.06] shrink-0" />}

        {insights.length > 0 && (
          <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(insights.length, 3)}, 1fr)` }}>
            {insights.map(({ Icon, color, title, desc, badge }) => (
              <div key={title} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-white/90">{title}</p>
                    {badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget bars by period */}
      {visibleBudgets.length > 0 && (
        <>
          <div className="h-px bg-white/[0.06] shrink-0" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 min-h-0 overflow-hidden">
            {visibleBudgets.map(b => (
              <div key={b.name} className="flex items-center gap-2 min-w-0">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                  {b.periodLabel}
                </span>
                <span className="text-xs text-white/60 truncate shrink-0" style={{ maxWidth: '80px' }}>{b.name}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden min-w-0">
                  <div className="h-full rounded-full"
                    style={{ width: `${b.pct}%`, background: b.over ? 'var(--color-alert)' : b.color }} />
                </div>
                <span className="text-[10px] tabular-nums shrink-0 ml-0.5"
                  style={{ color: b.over ? 'var(--color-alert)' : 'rgba(255,255,255,0.35)' }}>
                  {fmtK(b.spent)}<span className="text-white/20"> /{fmtK(b.limit)}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>

    {c.open && (
      <CardCustomizationPopup
        popupRef={c.popupRef} pos={c.pos}
        enableColor={c.enableColor}   setEnableColor={c.setEnableColor}
        showBorder={c.showBorder}     setShowBorder={c.setShowBorder}
        tab={c.tab}                   setTab={c.setTab}
        selectedColor={c.selectedColor}   setSelectedColor={c.setSelectedColor}
        opacity={c.opacity}           setOpacity={c.setOpacity}
        darkOverlay={c.darkOverlay}   setDarkOverlay={c.setDarkOverlay}
        colors={c.colors}
      />
    )}
    </>
  )
}
