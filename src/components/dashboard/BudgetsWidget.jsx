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
import { calcAllBudgetSpends } from '../../utils/budgetPeriod'

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
        .select('category_id, subcategory_id, receiver_id, card_id, amount, date, importance')
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

  const budgetSpends = useMemo(
    () => calcAllBudgetSpends(budgets, yearExpenses, currentDate),
    [budgets, yearExpenses, currentDate]
  )

  const targetSpends = useMemo(
    () => calcAllBudgetSpends(targets, yearExpenses, currentDate),
    [targets, yearExpenses, currentDate]
  )

  const allRows = useMemo(() => {
    const now         = new Date()
    const year        = currentDate.getFullYear()
    const month       = currentDate.getMonth()
    const isCurrentMo = now.getFullYear() === year && now.getMonth() === month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysElapsed = isCurrentMo ? now.getDate() : daysInMonth
    const pace = spent => isCurrentMo && daysElapsed > 0 ? (spent / daysElapsed) * daysInMonth : null

    const getRowMeta = b => {
      if (b.category_ids?.length) {
        const cats = b.category_ids.map(id => catMap[id]).filter(Boolean)
        const sub  = cats.map(c => c.name).join(' · ')
        return { label: b.name || sub || '—', color: cats[0]?.color, icon: undefined, imp: null }
      }
      if (b.subcategory_ids?.length) {
        const cats = b.subcategory_ids.map(id => catMap[id]).filter(Boolean)
        const sub  = cats.map(c => c.name).join(' · ')
        return { label: b.name || sub || '—', color: cats[0]?.color, icon: undefined, imp: null }
      }
      if (b.importance_ids?.length) {
        const imps = b.importance_ids.map(v => importanceLevels.find(i => i.value === v)).filter(Boolean)
        const sub  = imps.map(i => i.label).join(' · ')
        const imp  = !b.name && imps.length === 1 ? imps[0] : null
        return { label: b.name || sub || '—', color: imps[0]?.color, icon: undefined, imp }
      }
      if (b.receiver_ids?.length) {
        const recs = b.receiver_ids.map(id => receiverMap[id]).filter(Boolean)
        return { label: b.name || recs.map(r => r.name).join(' · ') || '—', color: undefined, icon: undefined, imp: null }
      }
      if (b.category_id)    { const cat = catMap[b.category_id];    return { label: b.name || cat?.name || '—', color: cat?.color, icon: b.name ? undefined : cat?.icon, imp: null } }
      if (b.subcategory_id) { const cat = catMap[b.subcategory_id]; return { label: b.name || cat?.name || '—', color: cat?.color, icon: b.name ? undefined : cat?.icon, imp: null } }
      if (b.importance)     { const imp = importanceLevels.find(i => i.value === b.importance); return { label: b.name || null, color: null, icon: null, imp: b.name ? null : imp } }
      if (b.receiver_id)    { const r = receiverMap[b.receiver_id];  return { label: b.name || r?.name || '—', color: undefined, icon: undefined, imp: null } }
      return { label: b.name || 'Total', color: null, icon: null, imp: null }
    }

    const budgetRows = budgets.map(b => {
      const spent = budgetSpends[b.id] ?? 0
      const { label, color, icon, imp } = getRowMeta(b)
      return { key: b.id, label, color, icon, imp, spent, limit: b.monthly_limit, rolloverAmount: b.rollover_amount ?? 0, period: b.period, projectedEnd: pace(spent) }
    })

    const targetRows = targets.map(tgt => {
      const spent = targetSpends[tgt.id] ?? 0
      const { label, color, icon, imp } = getRowMeta(tgt)
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
