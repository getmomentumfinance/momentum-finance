import { useState, useEffect, useMemo } from 'react'
import { Wallet2 } from 'lucide-react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useImportance } from '../../hooks/useImportance'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { CategoryPill } from '../shared/CategoryPill'
import { usePreferences } from '../../context/UserPreferencesContext'

// ── Period helpers (kept in sync with Budgets page) ────────────────
function toLocalStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getPeriodBounds(period, refDate, resetDay) {
  const y = refDate.getFullYear()
  const m = refDate.getMonth()
  if (period === 'weekly') {
    const startJsDow = ((resetDay ?? 0) + 1) % 7
    const diff = (refDate.getDay() - startJsDow + 7) % 7
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
  // monthly with custom reset day
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

// ── Helpers ────────────────────────────────────────────────────────
function barColor(pct) {
  if (pct >= 100) return 'var(--color-alert)'
  if (pct >= 80)  return 'var(--color-warning)'
  return 'var(--color-progress-bar)'
}

function ImpDots({ imp }) {
  return (
    <span className="flex items-center gap-1">
      <span className="flex gap-[2px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="w-1 h-1 rounded-full"
            style={{ background: i < imp.dots ? imp.color : imp.color + '30' }} />
        ))}
      </span>
      <span className="text-[10px] font-medium" style={{ color: imp.color }}>{imp.label}</span>
    </span>
  )
}

function BudgetRow({ label, color, icon, imp, spent, limit, rolloverAmount, period, projectedEnd }) {
  const { fmt, t } = usePreferences()
  const rollover       = rolloverAmount > 0 ? rolloverAmount : 0
  const effectiveLimit = limit + rollover
  const pct            = effectiveLimit > 0 ? Math.min((spent / effectiveLimit) * 100, 100) : 0
  const over           = spent > effectiveLimit
  const [displayPct, setDisplayPct] = useState(0)
  useEffect(() => { const id = setTimeout(() => setDisplayPct(pct), 50); return () => clearTimeout(id) }, [pct])
  const remaining = Math.abs(effectiveLimit - spent)

  const periodBadge = period && period !== 'monthly'
    ? { weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly' }[period]
    : null

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
          {imp
            ? <ImpDots imp={imp} />
            : <CategoryPill name={label} color={color} icon={icon} />
          }
          {periodBadge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/35">{periodBadge}</span>
          )}
        </div>
        <div className="flex items-baseline gap-1 tabular-nums shrink-0">
          <span className="text-sm font-bold" style={{ color: over ? 'var(--color-alert)' : 'rgba(255,255,255,0.9)' }}>
            {fmt(spent)}
          </span>
          <span className="text-[10px] text-white/30">
            / {fmt(limit)}{rollover > 0 && <span style={{ color: 'var(--color-progress-bar)' }}> +{fmt(rollover)}</span>}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full"
          style={{ width: `${displayPct}%`, background: barColor(pct) }} />
      </div>
      <span className="text-[10px] tabular-nums" style={{ color: over ? 'var(--color-alert)' : 'rgba(255,255,255,0.25)' }}>
        {over ? `+${fmt(remaining)} ${t('common.over')} budget` : `${fmt(remaining)} ${t('common.remaining')}`}
      </span>
    </div>
  )
}

export default function BudgetsWidget({ currentDate = new Date() }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const { importance: importanceLevels } = useImportance()
  const c = useCardCustomization('Budgets Widget')

  const [budgets,    setBudgets]    = useState([])
  const [targets,    setTargets]    = useState([])
  const [yearExpenses, setYearExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [receivers,  setReceivers]  = useState([])
  const [collapsed, setCollapsed]   = useCollapsed('BudgetsWidget')

  useEffect(() => {
    if (!user?.id) return
    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])

  async function load() {
    // Fetch full year so period bounds (weekly/quarterly/yearly) are covered
    const year  = currentDate.getFullYear()
    const start = `${year}-01-01`
    const end   = `${year}-12-31`

    const [{ data: bData }, { data: tgtData }, { data: txData }, { data: catData }, { data: recData }] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('targets').select('*').eq('user_id', user.id),
      supabase.from('transactions')
        .select('category_id, subcategory_id, receiver_id, card_id, amount, date')
        .eq('user_id', user.id).eq('is_deleted', false).eq('type', 'expense')
        .eq('is_split_parent', false).gte('date', start).lte('date', end),
      supabase.from('categories').select('id, name, color, icon, importance').eq('user_id', user.id),
      supabase.from('receivers').select('id, name').eq('user_id', user.id),
    ])

    setBudgets(bData ?? [])
    setTargets(tgtData ?? [])
    setYearExpenses(txData ?? [])
    setCategories(catData ?? [])
    setReceivers(recData ?? [])
  }

  const catMap      = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const receiverMap = useMemo(() => Object.fromEntries(receivers.map(r => [r.id, r])), [receivers])

  // Per-budget spending — matches Budgets page logic exactly
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

  const allRows = useMemo(() => {
    const now         = new Date()
    const year        = currentDate.getFullYear()
    const month       = currentDate.getMonth()
    const isCurrentMo = now.getFullYear() === year && now.getMonth() === month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysElapsed = isCurrentMo ? now.getDate() : daysInMonth
    const pace = spent => isCurrentMo && daysElapsed > 0 ? (spent / daysElapsed) * daysInMonth : null

    const budgetRows = budgets.map(b => {
      const spent = budgetSpends[b.id] ?? 0
      if (b.category_id) {
        const cat = catMap[b.category_id]
        return { key: b.id, label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon, imp: null, spent, limit: b.monthly_limit, rolloverAmount: b.rollover_amount ?? 0, period: b.period, projectedEnd: pace(spent) }
      }
      if (b.subcategory_id) {
        const cat = catMap[b.subcategory_id]
        return { key: b.id, label: cat?.name ?? '—', color: cat?.color, icon: cat?.icon, imp: null, spent, limit: b.monthly_limit, rolloverAmount: b.rollover_amount ?? 0, period: b.period, projectedEnd: pace(spent) }
      }
      if (b.importance) {
        const imp = importanceLevels.find(i => i.value === b.importance) ?? null
        return { key: b.id, label: null, color: null, icon: null, imp, spent, limit: b.monthly_limit, rolloverAmount: b.rollover_amount ?? 0, period: b.period, projectedEnd: pace(spent) }
      }
      if (b.receiver_id) {
        const r = receiverMap[b.receiver_id]
        return { key: b.id, label: r?.name ?? '—', color: undefined, icon: undefined, imp: null, spent, limit: b.monthly_limit, rolloverAmount: b.rollover_amount ?? 0, period: b.period, projectedEnd: pace(spent) }
      }
      return null
    }).filter(Boolean)

    const targetRows = targets.map(tgt => {
      const spent = targetSpends[tgt.id] ?? 0
      let label = '—', color = null, icon = null, imp = null
      if (tgt.category_id) {
        const cat = catMap[tgt.category_id]
        label = cat?.name ?? '—'; color = cat?.color; icon = cat?.icon
      } else if (tgt.subcategory_id) {
        const cat = catMap[tgt.subcategory_id]
        label = cat?.name ?? '—'; color = cat?.color; icon = cat?.icon
      } else if (tgt.importance) {
        imp = importanceLevels.find(i => i.value === tgt.importance) ?? null
      } else if (tgt.receiver_id) {
        label = receiverMap[tgt.receiver_id]?.name ?? '—'
      }
      return { key: `tgt-${tgt.id}`, label, color, icon, imp, spent, limit: tgt.target_monthly_spend, rolloverAmount: 0, period: tgt.period, projectedEnd: pace(spent) }
    })

    return [...budgetRows, ...targetRows].sort((a, b) => {
      const pctA = a.limit > 0 ? a.spent / a.limit : 0
      const pctB = b.limit > 0 ? b.spent / b.limit : 0
      return pctB - pctA
    })
  }, [budgets, targets, budgetSpends, targetSpends, catMap, receiverMap, importanceLevels, currentDate])

  const overCount = allRows.filter(r => r.spent > (r.limit + (r.rolloverAmount ?? 0))).length

  return (
    <>
      <div className="glass-card rounded-2xl p-4 relative overflow-hidden" style={{ border: c.borderStyle }}>
        {c.bgGradient && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: c.bgGradient, opacity: c.opacity / 100 }} />
        )}
        {c.enableColor && c.darkOverlay > 0 && (
          <div className="absolute inset-0 pointer-events-none bg-black" style={{ opacity: c.darkOverlay / 100 }} />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                ref={c.btnRef}
                type="button"
                onClick={c.toggleOpen}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Wallet2 size={14} />
              </button>
              <button type="button" onClick={() => setCollapsed(c => !c)} className="font-semibold text-base hover:text-white/70 transition-colors">{t('bw.title')}</button>
              {overCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--color-alert)22', color: 'var(--color-alert)' }}>
                  {t('bw.over', { count: overCount })}
                </span>
              )}
            </div>
          </div>

          {!collapsed && (<>
          {allRows.length === 0 ? (
            <p className="text-center text-muted text-sm py-6">{t('bw.noBudgets')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {allRows.map(r => <BudgetRow key={r.key} {...r} />)}
            </div>
          )}
          </>)}
        </div>
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
