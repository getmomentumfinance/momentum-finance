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

function BudgetRow({ label, color, icon, imp, spent, limit, projectedEnd }) {
  const { fmt, t } = usePreferences()
  const pct       = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const over      = spent > limit
  const [displayPct, setDisplayPct] = useState(0)
  useEffect(() => { const t = setTimeout(() => setDisplayPct(pct), 50); return () => clearTimeout(t) }, [pct])
  const remaining = Math.abs(limit - spent)
  const projOver  = projectedEnd != null && projectedEnd > limit && !over

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {imp
            ? <ImpDots imp={imp} />
            : <CategoryPill name={label} color={color} icon={icon} />
          }
        </div>
        <div className="flex items-baseline gap-1 tabular-nums shrink-0">
          <span className="text-sm font-bold" style={{ color: over ? 'var(--color-alert)' : 'rgba(255,255,255,0.9)' }}>
            {fmt(spent)}
          </span>
          <span className="text-[10px] text-white/30">/ {fmt(limit)}</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full"
          style={{
            width: `${displayPct}%`,
            background: barColor(pct),
            transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: pct < 50 && pct > 0
              ? `0 0 6px 1px color-mix(in srgb, var(--color-progress-bar) 60%, transparent)`
              : undefined,
            animation: pct < 50 && pct > 0 ? 'underBudgetPulse 2s ease-in-out infinite' : undefined,
          }} />
      </div>
      <span className="text-[10px] tabular-nums" style={{ color: over ? 'var(--color-alert)' : 'rgba(255,255,255,0.25)' }}>
        {over ? `+${fmt(remaining)} ${t('common.over')} budget` : `${fmt(remaining)} ${t('common.remaining')}`}
      </span>
      {projectedEnd != null && (
        <span className="text-[10px] tabular-nums" style={{ color: projOver ? 'var(--color-warning)' : 'rgba(255,255,255,0.18)' }}>
          {projOver
            ? t('bw.onPaceOver', { amount: fmt(projectedEnd) })
            : t('bw.onPace', { amount: fmt(projectedEnd) })}
        </span>
      )}
    </div>
  )
}

export default function BudgetsWidget({ currentDate = new Date() }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const { importance: importanceLevels } = useImportance()
  const c = useCardCustomization('Budgets Widget')

  const [budgets,    setBudgets]    = useState([])
  const [expenses,   setExpenses]   = useState([])
  const [categories, setCategories] = useState([])
  const [collapsed, setCollapsed] = useCollapsed('BudgetsWidget')

  useEffect(() => {
    if (!user?.id) return
    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])

  async function load() {
    const year  = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const start = new Date(year, month, 1).toISOString().slice(0, 10)
    const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)

    const [{ data: bData }, { data: txData }, { data: catData }] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('category_id, subcategory_id, amount')
        .eq('user_id', user.id).eq('is_deleted', false).eq('type', 'expense')
        .eq('is_split_parent', false).gte('date', start).lte('date', end),
      supabase.from('categories').select('id, name, color, icon, importance').eq('user_id', user.id),
    ])

    setBudgets(bData ?? [])
    setExpenses(txData ?? [])
    setCategories(catData ?? [])
  }

  const catMap = useMemo(() =>
    Object.fromEntries((categories).map(c => [c.id, c])), [categories])

  const spendingByCategory = useMemo(() => {
    const map = {}
    for (const t of expenses) {
      if (t.category_id) map[t.category_id] = (map[t.category_id] ?? 0) + t.amount
    }
    return map
  }, [expenses])

  const spendingBySubcategory = useMemo(() => {
    const map = {}
    for (const t of expenses) {
      if (t.subcategory_id) map[t.subcategory_id] = (map[t.subcategory_id] ?? 0) + t.amount
    }
    return map
  }, [expenses])

  const spendingByImportance = useMemo(() => {
    const map = {}
    for (const t of expenses) {
      const imp = catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance ?? null
      if (imp != null) map[imp] = (map[imp] ?? 0) + t.amount
    }
    return map
  }, [expenses, catMap])

  const columns = useMemo(() => {
    const now          = new Date()
    const year         = currentDate.getFullYear()
    const month        = currentDate.getMonth()
    const isCurrentMo  = now.getFullYear() === year && now.getMonth() === month
    const daysInMonth  = new Date(year, month + 1, 0).getDate()
    const daysElapsed  = isCurrentMo ? now.getDate() : daysInMonth
    const pace = spent => isCurrentMo && daysElapsed > 0 ? (spent / daysElapsed) * daysInMonth : null

    const cat = budgets.filter(b => b.category_id).map(b => {
      const c = catMap[b.category_id]
      const spent = spendingByCategory[b.category_id] ?? 0
      return { key: b.id, label: c?.name ?? '—', color: c?.color, icon: c?.icon, imp: null, spent, limit: b.monthly_limit, projectedEnd: pace(spent) }
    })
    const sub = budgets.filter(b => b.subcategory_id).map(b => {
      const c = catMap[b.subcategory_id]
      const spent = spendingBySubcategory[b.subcategory_id] ?? 0
      return { key: b.id, label: c?.name ?? '—', color: c?.color, icon: c?.icon, imp: null, spent, limit: b.monthly_limit, projectedEnd: pace(spent) }
    })
    const imp = budgets.filter(b => b.importance).map(b => {
      const i = importanceLevels.find(i => i.value === b.importance) ?? null
      const spent = spendingByImportance[b.importance] ?? 0
      return { key: b.id, label: null, color: null, icon: null, imp: i, spent, limit: b.monthly_limit, projectedEnd: pace(spent) }
    })
    return [
      { labelKey: 'common.category',    rows: cat },
      { labelKey: 'common.subcategory', rows: sub },
      { labelKey: 'common.importance',  rows: imp },
    ]
  }, [budgets, catMap, spendingByCategory, spendingBySubcategory, spendingByImportance, importanceLevels, currentDate])

  const allRows = columns.flatMap(c => c.rows)

  const overCount = allRows.filter(r => r.spent > r.limit).length

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
            <div className="grid grid-cols-3 gap-4">
              {columns.map(col => (
                <div key={col.labelKey} className="flex flex-col gap-2">
                  <span className="text-[10px] text-muted uppercase tracking-widest font-medium">{t(col.labelKey)}</span>
                  <div className="flex flex-col gap-2">
                    {col.rows.length === 0
                      ? <p className="text-[11px] text-white/20 italic">{t('bw.none')}</p>
                      : col.rows.map(r => <BudgetRow key={r.key} {...r} />)
                    }
                  </div>
                </div>
              ))}
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
