import { useState, useEffect, useMemo } from 'react'
import { Wallet2, GripHorizontal } from 'lucide-react'
import { useImportance } from '../../hooks/useImportance'
import { useSharedData } from '../../context/SharedDataContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useUIPrefs } from '../../context/UIPrefContext'
import { calcAllBudgetSpends } from '../../utils/budgetPeriod'
import {
  DndContext, DragOverlay,
  closestCenter,
  PointerSensor, KeyboardSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  rectSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Donut chart ────────────────────────────────────────────────────
function DonutChart({ pct, color, size = 72 }) {
  const strokeW = 6
  const r       = (size - strokeW) / 2
  const circ    = 2 * Math.PI * r
  const [offset, setOffset] = useState(circ)

  useEffect(() => {
    const id = setTimeout(() => setOffset(circ * (1 - Math.min(pct / 100, 1))), 80)
    return () => clearTimeout(id)
  }, [pct, circ])

  return (
    <svg width={size} height={size} className="shrink-0" style={{ overflow: 'visible' }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeW}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

function ringColor(pct, customColor) {
  if (pct >= 100) return 'var(--color-alert)'
  if (pct >= 80)  return 'var(--color-warning)'
  return customColor || 'var(--color-accent)'
}

// ── Single budget card ─────────────────────────────────────────────
function BudgetCard({ label, color, impColor, spent, limit, rolloverAmount, period }) {
  const { fmt, t } = usePreferences()
  const rollover       = rolloverAmount > 0 ? rolloverAmount : 0
  const effectiveLimit = limit + rollover
  const pct            = effectiveLimit > 0 ? Math.min((spent / effectiveLimit) * 100, 100) : 0
  const over           = spent > effectiveLimit
  const remaining      = Math.abs(effectiveLimit - spent)
  const ring           = ringColor(pct, impColor || color)

  const periodBadge = period && period !== 'monthly'
    ? { weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly' }[period] ?? null
    : null

  return (
    <div className="glass-card rounded-2xl p-3 relative overflow-hidden">
      <div className="flex flex-col items-center gap-2">
        {/* Donut */}
        <div className="relative">
          <DonutChart pct={pct} color={ring} size={60} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold tabular-nums leading-none" style={{ color: ring }}>
              {Math.round(pct)}%
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="w-full text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <p className="text-[11px] font-semibold text-white truncate leading-tight">{label}</p>
            {periodBadge && (
              <span className="text-[8px] px-1 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                {periodBadge}
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/40 tabular-nums">
            {fmt(spent)}
            <span className="text-white/22"> / {fmt(limit)}</span>
          </p>
          {rollover > 0 && (
            <p className="text-[9px] tabular-nums" style={{ color: 'var(--color-accent)' }}>
              +{fmt(rollover)} rollover
            </p>
          )}
          <p className="text-[9px] mt-0.5 tabular-nums"
            style={{ color: over ? 'var(--color-alert)' : 'rgba(255,255,255,0.22)' }}>
            {over
              ? `+${fmt(remaining)} ${t('common.over')}`
              : `${fmt(remaining)} ${t('common.remaining')}`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Sortable wrapper for each budget card ──────────────────────────
function SortableBudgetCard({ id, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      className="relative group"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-40 hover:!opacity-80 cursor-grab active:cursor-grabbing touch-none transition-opacity p-1 rounded"
        style={{ color: 'var(--color-muted)' }}
      >
        <GripHorizontal size={14} />
      </div>
      <BudgetCard {...props} />
    </div>
  )
}

// ── Main widget ────────────────────────────────────────────────────
export default function BudgetsWidget({ currentDate = new Date() }) {
  const { t }                            = usePreferences()
  const { importance: importanceLevels } = useImportance()
  const { setPref, loaded: prefsLoaded } = useUIPrefs()
  const { budgets, targets, allTransactions, categoryMap, receiverMap } = useSharedData()

  const [cardOrder,    setCardOrder]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('budgets-card-order') ?? 'null') } catch { return null }
  })

  // Re-sync card order when Supabase prefs are loaded
  useEffect(() => {
    if (!prefsLoaded) return
    try { setCardOrder(JSON.parse(localStorage.getItem('budgets-card-order') ?? 'null')) } catch {}
  }, [prefsLoaded])
  const [activeId, setActiveId] = useState(null)

  const yearExpenses = useMemo(() => {
    const yearStr = `${currentDate.getFullYear()}-`
    return allTransactions.filter(t => t.type === 'expense' && t.date?.startsWith(yearStr))
  }, [allTransactions, currentDate])

  const catMap = categoryMap

  const budgetSpends = useMemo(() => calcAllBudgetSpends(budgets, yearExpenses, currentDate), [budgets, yearExpenses, currentDate])
  const targetSpends = useMemo(() => calcAllBudgetSpends(targets, yearExpenses, currentDate), [targets, yearExpenses, currentDate])

  const allRows = useMemo(() => {
    function getRowMeta(b) {
      if (b.category_ids?.length) {
        const cats = b.category_ids.map(id => catMap[id]).filter(Boolean)
        return { label: b.name || cats.map(c => c.name).join(' · ') || '—', color: cats[0]?.color, impColor: null }
      }
      if (b.subcategory_ids?.length) {
        const cats = b.subcategory_ids.map(id => catMap[id]).filter(Boolean)
        return { label: b.name || cats.map(c => c.name).join(' · ') || '—', color: cats[0]?.color, impColor: null }
      }
      if (b.importance_ids?.length) {
        const imps = b.importance_ids.map(v => importanceLevels.find(i => i.value === v)).filter(Boolean)
        return { label: b.name || imps.map(i => i.label).join(' · ') || '—', color: null, impColor: imps[0]?.color }
      }
      if (b.receiver_ids?.length) {
        const recs = b.receiver_ids.map(id => receiverMap[id]).filter(Boolean)
        return { label: b.name || recs.map(r => r.name).join(' · ') || '—', color: null, impColor: null }
      }
      if (b.category_id)    { const c = catMap[b.category_id];    return { label: b.name || c?.name || '—', color: c?.color, impColor: null } }
      if (b.subcategory_id) { const c = catMap[b.subcategory_id]; return { label: b.name || c?.name || '—', color: c?.color, impColor: null } }
      if (b.importance) {
        const imp = importanceLevels.find(i => i.value === b.importance)
        return { label: b.name || imp?.label || '—', color: null, impColor: b.name ? null : imp?.color }
      }
      if (b.receiver_id) { const r = receiverMap[b.receiver_id]; return { label: b.name || r?.name || '—', color: null, impColor: null } }
      return { label: b.name || t('bw.total'), color: null, impColor: null }
    }

    const budgetRows = budgets.map(b => ({
      key: b.id, ...getRowMeta(b),
      spent: budgetSpends[b.id] ?? 0,
      limit: b.monthly_limit,
      rolloverAmount: b.rollover_amount ?? 0,
      period: b.period,
    }))
    const targetRows = targets.map(tgt => ({
      key: `tgt-${tgt.id}`, ...getRowMeta(tgt),
      spent: targetSpends[tgt.id] ?? 0,
      limit: tgt.target_monthly_spend,
      rolloverAmount: 0,
      period: tgt.period,
    }))
    return [...budgetRows, ...targetRows]
  }, [budgets, targets, budgetSpends, targetSpends, catMap, receiverMap, importanceLevels, t])

  // Apply saved order
  const sortedRows = useMemo(() => {
    if (!cardOrder) return allRows
    return [...allRows].sort((a, b) => {
      const ai = cardOrder.indexOf(String(a.key))
      const bi = cardOrder.indexOf(String(b.key))
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [allRows, cardOrder])

  const overCount = allRows.filter(r => r.spent > r.limit + (r.rolloverAmount ?? 0)).length

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const ids  = sortedRows.map(r => String(r.key))
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    setCardOrder(next)
    setPref('budgets-card-order', JSON.stringify(next))
  }

  if (allRows.length === 0) return (
    <div className="glass-card rounded-2xl p-5 text-center">
      <p className="text-muted text-sm">{t('bw.noBudgets')}</p>
    </div>
  )

  const itemIds = sortedRows.map(r => String(r.key))

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <Wallet2 size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {t('bw.title')}
        </span>
        {overCount > 0 && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--color-alert)22', color: 'var(--color-alert)' }}>
            {overCount} {t('bw.over', { count: overCount })}
          </span>
        )}
      </div>

      {/* Budget cards with internal drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3">
            {sortedRows.map(r => (
              <SortableBudgetCard key={r.key} id={String(r.key)} {...r} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId && (
            <div className="rounded-2xl h-28 w-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', opacity: 0.7 }} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
