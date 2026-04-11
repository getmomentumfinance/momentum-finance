import { useState, useEffect, useMemo } from 'react'
import { Target } from 'lucide-react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useImportance } from '../../hooks/useImportance'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { CategoryPill } from '../shared/CategoryPill'
import { ReceiverAvatar } from '../shared/ReceiverCombobox'
import { usePreferences } from '../../context/UserPreferencesContext'

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

function TargetRow({ target, allExpenses, catMap, importanceLevels, receivers, currentDate }) {
  const { fmt, t } = usePreferences()
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

  const monthlySpends = useMemo(() => {
    const filtered = allExpenses.filter(tx => {
      if (target.category_id)    return tx.category_id    === target.category_id
      if (target.subcategory_id) return tx.subcategory_id === target.subcategory_id
      if (target.receiver_id)    return tx.receiver_id    === target.receiver_id
      if (target.importance) {
        const imp = catMap[tx.category_id]?.importance ?? catMap[tx.subcategory_id]?.importance
        return imp === target.importance
      }
      return false
    })
    const byMonth = {}
    for (const tx of filtered) {
      const m = tx.date.slice(0, 7)
      byMonth[m] = (byMonth[m] ?? 0) + tx.amount
    }
    return byMonth
  }, [target, allExpenses, catMap])

  const currentSpend = monthlySpends[currentMonthKey] ?? 0
  const targetVal    = target.target_monthly_spend
  const baseline     = target.avg_baseline ?? targetVal
  const reduction    = baseline - targetVal
  const pct          = targetVal > 0 ? Math.min((currentSpend / targetVal) * 100, 100) : 0
  const isOver       = currentSpend > targetVal

  // Streak: consecutive months on target
  const months = Object.keys(monthlySpends).sort()
  let streak = 0
  for (let i = months.length - 1; i >= 0; i--) {
    if (monthlySpends[months[i]] > targetVal) break
    streak++
  }

  // Hit rate
  const totalMonths = months.length
  const metMonths   = months.filter(m => monthlySpends[m] <= targetVal).length
  const hitRate     = totalMonths > 0 ? Math.round((metMonths / totalMonths) * 100) : null

  // Label
  let labelEl
  if (target.category_id || target.subcategory_id) {
    const cat = catMap[target.category_id ?? target.subcategory_id]
    labelEl = <CategoryPill name={cat?.name ?? '—'} color={cat?.color} icon={cat?.icon} />
  } else if (target.receiver_id) {
    const rec = receivers?.find(r => r.id === target.receiver_id)
    labelEl = rec
      ? <span className="flex items-center gap-1.5"><ReceiverAvatar receiver={rec} /><span className="text-xs truncate">{rec.name}</span></span>
      : <span className="text-[10px] text-muted">Merchant</span>
  } else {
    const imp = importanceLevels.find(i => i.value === target.importance)
    labelEl = imp ? <ImpDots imp={imp} /> : <span className="text-[10px] text-muted">—</span>
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">{labelEl}</div>
        <div className="flex items-baseline gap-1 tabular-nums shrink-0">
          <span className="text-sm font-bold" style={{ color: isOver ? 'var(--color-alert)' : 'rgba(255,255,255,0.9)' }}>
            {fmt(currentSpend)}
          </span>
          <span className="text-[10px] text-white/30">/ {fmt(targetVal)}</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: isOver ? 'var(--color-alert)' : pct >= 80 ? 'var(--color-warning)' : 'var(--color-progress-bar)' }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] tabular-nums" style={{ color: isOver ? 'var(--color-alert)' : 'rgba(255,255,255,0.25)' }}>
          {isOver ? t('tw.overTarget', { amount: fmt(currentSpend - targetVal) }) : t('tw.remaining', { amount: fmt(targetVal - currentSpend) })}
        </span>
        <div className="flex items-center gap-2.5">
          {reduction > 0 && (
            <span className="text-[10px] text-white/30">↓{fmt(reduction)}/mo goal</span>
          )}
          {streak > 1 && (
            <span className="text-[10px] text-white/35">{t('tw.streak', { n: streak })}</span>
          )}
          {hitRate !== null && (
            <span className="text-[10px] text-white/35">{t('tw.hitRate', { n: hitRate })}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TargetsWidget({ currentDate = new Date() }) {
  const { user } = useAuth()
  const { t } = usePreferences()
  const { importance: importanceLevels } = useImportance()
  const c = useCardCustomization('Targets Widget')

  const [targets,     setTargets]     = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [categories,  setCategories]  = useState([])
  const [receivers,   setReceivers]   = useState([])
  const [collapsed, setCollapsed] = useCollapsed('TargetsWidget')

  useEffect(() => {
    if (!user?.id) return
    load()
    window.addEventListener('transaction-saved', load)
    window.addEventListener('targets-updated', load)
    return () => {
      window.removeEventListener('transaction-saved', load)
      window.removeEventListener('targets-updated', load)
    }
  }, [user?.id, currentDate])

  async function load() {
    const [{ data: tData }, { data: txData }, { data: catData }, { data: recData }] = await Promise.all([
      supabase.from('targets').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('category_id, subcategory_id, receiver_id, amount, date')
        .eq('user_id', user.id).eq('is_deleted', false).eq('type', 'expense')
        .eq('is_split_parent', false),
      supabase.from('categories').select('id, name, color, icon, importance').eq('user_id', user.id),
      supabase.from('receivers').select('id, name, domain, logo_url').eq('user_id', user.id),
    ])

    setTargets(tData ?? [])
    setAllExpenses(txData ?? [])
    setCategories(catData ?? [])
    setReceivers(recData ?? [])
  }

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const overCount = targets.filter(tgt => {
    const filtered = allExpenses.filter(tx => {
      if (tgt.category_id)    return tx.category_id    === tgt.category_id
      if (tgt.subcategory_id) return tx.subcategory_id === tgt.subcategory_id
      if (tgt.receiver_id)    return tx.receiver_id    === tgt.receiver_id
      if (tgt.importance) {
        const imp = catMap[tx.category_id]?.importance ?? catMap[tx.subcategory_id]?.importance
        return imp === tgt.importance
      }
      return false
    })
    const spent = filtered.filter(tx => tx.date.slice(0, 7) === currentMonthKey).reduce((s, tx) => s + tx.amount, 0)
    return spent > tgt.target_monthly_spend
  }).length

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
                <Target size={14} />
              </button>
              <button type="button" onClick={() => setCollapsed(c => !c)} className="font-semibold text-base hover:text-white/70 transition-colors">{t('tw.title')}</button>
              {overCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--color-alert)22', color: 'var(--color-alert)' }}>
                  {t('tw.over', { count: overCount })}
                </span>
              )}
            </div>
          </div>

          {!collapsed && (<>
          {targets.length === 0 ? (
            <p className="text-center text-muted text-sm py-6">{t('tw.noTargets')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {targets.map(t => (
                <TargetRow
                  key={t.id}
                  target={t}
                  allExpenses={allExpenses}
                  catMap={catMap}
                  importanceLevels={importanceLevels}
                  receivers={receivers}
                  currentDate={currentDate}
                />
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
