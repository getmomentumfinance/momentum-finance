import { useState, useEffect, useMemo, useRef } from 'react'
import { Target, ChevronDown } from 'lucide-react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useImportance } from '../../hooks/useImportance'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { CategoryPill } from '../shared/CategoryPill'
import { ReceiverAvatar } from '../shared/ReceiverCombobox'
import { usePreferences } from '../../context/UserPreferencesContext'
import { toLocalStr, getPeriodBounds } from '../../utils/budgetPeriod'

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

// ── Compact goal card matching the full Goals section style ────
function GoalCard({ target, allExpenses, catMap, importanceLevels, receivers, currentDate, promoted }) {
  const { fmt, t } = usePreferences()
  const tgtPeriod = target.period ?? 'monthly'

  const periodSpends = useMemo(() => {
    const filtered = allExpenses.filter(tx => {
      if (target.category_id)    return tx.category_id    === target.category_id
      if (target.subcategory_id) return tx.subcategory_id === target.subcategory_id
      if (target.receiver_id)    return tx.receiver_id    === target.receiver_id
      if (target.importance) return tx.importance === target.importance
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

  // Chart periods (creation → now)
  const chartPeriods = useMemo(() => {
    const created = new Date(target.created_at)
    if (tgtPeriod === 'monthly') {
      const sy = created.getFullYear(), sm = created.getMonth()
      const ey = currentDate.getFullYear(), em = currentDate.getMonth()
      const count = (ey - sy) * 12 + (em - sm) + 1
      return Array.from({ length: count }, (_, i) => {
        const d   = new Date(sy, sm + i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return { key, label: d.toLocaleDateString('en-US', { month: 'short' }), spend: periodSpends[key] ?? null, isCurrent: i === count - 1 }
      })
    }
    const { startStr: firstWk } = getPeriodBounds('weekly', created, target.reset_day)
    const { startStr: currWk }  = getPeriodBounds('weekly', currentDate, target.reset_day)
    const result = []
    let d = new Date(firstWk + 'T12:00:00')
    const endD = new Date(currWk + 'T12:00:00')
    while (d <= endD) {
      const key = toLocalStr(d)
      result.push({ key, label: `${d.getMonth()+1}/${d.getDate()}`, spend: periodSpends[key] ?? null, isCurrent: key === currWk })
      d = new Date(d.getTime() + 7 * 86400000)
    }
    return result
  }, [target, periodSpends, currentDate, tgtPeriod])

  const { startStr: periodStart } = getPeriodBounds(tgtPeriod, currentDate, target.reset_day)
  const currentPeriodKey   = tgtPeriod === 'weekly'
    ? periodStart
    : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const currentSpend = periodSpends[currentPeriodKey] ?? 0
  const targetVal    = target.target_monthly_spend
  const pct          = targetVal > 0 ? Math.min((currentSpend / targetVal) * 100, 100) : 0
  const isOver       = currentSpend > targetVal
  const periodLabel  = tgtPeriod === 'weekly' ? '/wk' : '/mo'

  const periodEntries = Object.entries(periodSpends)
  const periodsMet    = periodEntries.filter(([, s]) => s <= targetVal).length
  const periodsOver   = periodEntries.filter(([, s]) => s >  targetVal).length
  const hitRate       = periodEntries.length > 0 ? Math.round((periodsMet / periodEntries.length) * 100) : null

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

  // SVG chart (compact version)
  const SVG_W = 400, SVG_H = 60
  const PAD   = { t: 6, r: 4, b: 14, l: 4 }
  const iW = SVG_W - PAD.l - PAD.r
  const iH = SVG_H - PAD.t - PAD.b

  const chartMax = Math.max(...chartPeriods.map(m => m.spend ?? 0), targetVal) * 1.15 || 1
  const xOf = i => PAD.l + (chartPeriods.length > 1 ? (i / (chartPeriods.length - 1)) * iW : iW / 2)
  const yOf = v => PAD.t + (1 - Math.min(v, chartMax) / chartMax) * iH
  const targetY = yOf(targetVal)

  const pts     = chartPeriods.map((m, i) => ({ ...m, x: xOf(i), y: m.spend !== null ? yOf(m.spend) : null }))
  const vis     = pts.filter(p => p.y !== null)
  const linePath = vis.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = vis.length > 1
    ? `${vis.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} L${vis.at(-1).x.toFixed(1)},${(PAD.t + iH).toFixed(1)} L${vis[0].x.toFixed(1)},${(PAD.t + iH).toFixed(1)} Z`
    : ''
  const gradId = `tw-${target.id}`

  return (
    <div
      data-goal-id={target.id}
      className="flex flex-col gap-3 p-3 rounded-xl bg-white/[0.03] border transition-all duration-500"
      style={{
        borderColor: promoted
          ? 'color-mix(in srgb, var(--color-warning) 50%, transparent)'
          : isOver
          ? 'color-mix(in srgb, var(--color-alert) 20%, transparent)'
          : 'rgba(255,255,255,0.05)',
        boxShadow: promoted
          ? '0 0 10px color-mix(in srgb, var(--color-warning) 20%, transparent)'
          : 'none',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">{labelEl}</div>
        {hitRate !== null && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] tabular-nums text-white/35 shrink-0">
            {t('tw.hitRate', { n: hitRate })}
          </span>
        )}
      </div>

      {/* Compact chart */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: 48 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-progress-bar)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-progress-bar)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        <line x1={PAD.l} y1={targetY} x2={SVG_W - PAD.r} y2={targetY}
          stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeDasharray="3 2" />
        {linePath && (
          <path d={linePath} fill="none"
            stroke="var(--color-progress-bar)" strokeWidth="1.5"
            strokeLinejoin="round" strokeLinecap="round" />
        )}
        {pts.map(p => p.y !== null && (
          <circle key={p.key} cx={p.x} cy={p.y}
            r={p.isCurrent ? 3 : 2}
            fill={(p.spend ?? 0) > targetVal ? 'var(--color-alert)' : 'var(--color-progress-bar)'}
            opacity={p.isCurrent ? 1 : 0.45} />
        ))}
        {pts.map((p, i) => {
          const every = Math.ceil(pts.length / 6)
          if (!p.isCurrent && i !== 0 && i % every !== 0) return null
          return (
            <text key={`${p.key}-l`} x={p.x} y={SVG_H - 2} textAnchor="middle"
              fontSize="6" fill={p.isCurrent ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)'}>
              {p.label}
            </text>
          )
        })}
      </svg>

      {/* Bottom stats */}
      <div className="flex items-end justify-between gap-2 border-t border-white/[0.04] pt-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-base font-bold">{fmt(currentSpend)}</span>
            <span className="text-[10px] text-white/30">/ {fmt(targetVal)}{periodLabel}</span>
          </div>
          <div className="h-1.5 w-28 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: isOver ? 'var(--color-alert)' : pct >= 80 ? 'var(--color-warning)' : 'var(--color-progress-bar)' }} />
          </div>
          <span className="text-[10px] tabular-nums"
            style={{ color: isOver ? 'var(--color-alert)' : 'var(--color-progress-bar)' }}>
            {isOver
              ? t('tw.overTarget', { amount: fmt(currentSpend - targetVal) })
              : t('tw.remaining', { amount: fmt(targetVal - currentSpend) })}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-[10px] text-white/25 shrink-0">
          <span className="tabular-nums">
            <span style={{ color: 'var(--color-progress-bar)' }}>{periodsMet}✓</span>
            {' / '}
            <span style={{ color: 'var(--color-alert)' }}>{periodsOver}✗</span>
          </span>
          {target.avg_baseline > 0 && (
            <span>baseline {fmt(target.avg_baseline)}{periodLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sort dropdown ──────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'risk',  label: 'At-risk first' },
  { value: 'spend', label: 'Highest spend'  },
  { value: 'alpha', label: 'A → Z'          },
]

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const current = SORT_OPTIONS.find(o => o.value === value)
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/60 transition-colors px-1.5 py-0.5 rounded-md hover:bg-white/5">
        {current?.label}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 glass-popup border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[130px]">
          {SORT_OPTIONS.map(opt => (
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

export default function TargetsWidget({ currentDate = new Date() }) {
  const { user } = useAuth()
  const { t } = usePreferences()
  const { importance: importanceLevels } = useImportance()
  const c = useCardCustomization('Targets Widget')

  const [targets,     setTargets]     = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [categories,  setCategories]  = useState([])
  const [receivers,   setReceivers]   = useState([])
  const [collapsed,   setCollapsed]   = useCollapsed('TargetsWidget')
  const [sortBy,      setSortBy]      = useState('risk')
  const [showSort,    setShowSort]    = useState(false)

  // FLIP animation state
  const containerRef  = useRef(null)
  const snapRef = useRef({})

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
      supabase.from('transactions').select('category_id, subcategory_id, receiver_id, amount, date, importance')
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

  // Compute sort key per target
  const sortData = useMemo(() => {
    const result = {}
    for (const tgt of targets) {
      const period = tgt.period ?? 'monthly'
      const { startStr } = getPeriodBounds(period, currentDate, tgt.reset_day)
      const currentPeriodKey = period === 'weekly'
        ? startStr
        : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

      const txs = allExpenses.filter(tx => {
        if (tx.date < startStr) return false
        if (tgt.category_id)    return tx.category_id    === tgt.category_id
        if (tgt.subcategory_id) return tx.subcategory_id === tgt.subcategory_id
        if (tgt.receiver_id)    return tx.receiver_id    === tgt.receiver_id
        if (tgt.importance) return tx.importance === tgt.importance
        return false
      })
      const currentSpend = txs.reduce((s, tx) => s + tx.amount, 0)
      const pct = tgt.target_monthly_spend > 0 ? currentSpend / tgt.target_monthly_spend : 0

      // Label for alpha sort
      let label = ''
      if (tgt.category_id || tgt.subcategory_id) {
        label = catMap[tgt.category_id ?? tgt.subcategory_id]?.name ?? ''
      } else if (tgt.receiver_id) {
        label = receivers.find(r => r.id === tgt.receiver_id)?.name ?? ''
      } else {
        label = importanceLevels.find(i => i.value === tgt.importance)?.label ?? ''
      }

      result[tgt.id] = { pct, spend: currentSpend, label }
    }
    return result
  }, [targets, allExpenses, catMap, currentDate, receivers, importanceLevels])

  const sortedTargets = useMemo(() => {
    return [...targets].sort((a, b) => {
      const da = sortData[a.id] ?? { pct: 0, spend: 0, label: '' }
      const db = sortData[b.id] ?? { pct: 0, spend: 0, label: '' }
      if (sortBy === 'risk')  return db.pct   - da.pct
      if (sortBy === 'spend') return db.spend - da.spend
      if (sortBy === 'alpha') return da.label.localeCompare(db.label)
      return 0
    })
  }, [targets, sortData, sortBy])


  const overCount = useMemo(() =>
    targets.filter(tgt => (sortData[tgt.id]?.pct ?? 0) > 1).length,
    [targets, sortData]
  )

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
          <div
            className="flex items-center justify-between mb-4"
            onMouseEnter={() => setShowSort(true)}
            onMouseLeave={() => setShowSort(false)}>
            <div className="flex items-center gap-2">
              <button
                ref={c.btnRef}
                type="button"
                onClick={c.toggleOpen}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Target size={14} />
              </button>
              <button type="button" onClick={() => setCollapsed(v => !v)}
                className="font-semibold text-base hover:text-white/70 transition-colors">
                {t('tw.title')}
              </button>
              {overCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--color-alert)22', color: 'var(--color-alert)' }}>
                  {t('tw.over', { count: overCount })}
                </span>
              )}
            </div>
            {/* Sort toggle — reveals on hover */}
            <div className={`transition-opacity duration-150 ${showSort && !collapsed && targets.length > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {!collapsed && (
            targets.length === 0 ? (
              <p className="text-center text-muted text-sm py-6">{t('tw.noTargets')}</p>
            ) : (
              <div ref={containerRef} className="grid grid-cols-2 gap-3">
                {sortedTargets.map(tgt => (
                  <GoalCard
                    key={tgt.id}
                    target={tgt}
                    allExpenses={allExpenses}
                    catMap={catMap}
                    importanceLevels={importanceLevels}
                    receivers={receivers}
                    currentDate={currentDate}
                    promoted={false}
                  />
                ))}
              </div>
            )
          )}
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
