import { useState, useEffect, useRef } from 'react'
import { Target, Plus, Pencil, PiggyBank, Check, X } from 'lucide-react'

function midColor(colorValue) {
  if (!colorValue) return '#a78bfa'
  const stops = [...colorValue.matchAll(/#[0-9a-fA-F]{6}/gi)].map(m => m[0])
  if (!stops.length) return colorValue
  if (stops.length === 1) return stops[0]
  const p = s => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)]
  const [r1,g1,b1] = p(stops[0]), [r2,g2,b2] = p(stops[stops.length-1])
  return '#' + [Math.round((r1+r2)/2), Math.round((g1+g2)/2), Math.round((b1+b2)/2)].map(x => x.toString(16).padStart(2,'0')).join('')
}

function ProgressRing({ pct, color, size = 80, strokeWidth = 5 }) {
  const r    = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  const cx = size / 2
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${offset}`}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  )
}

import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CATEGORY_ICONS } from '../shared/CategoryPill'
import AddSavingsGoalModal from './AddSavingsGoalModal'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { usePreferences } from '../../context/UserPreferencesContext'
import { SkeletonCard } from '../shared/Skeleton'
import { ConfettiBurst } from '../shared/ConfettiBurst'

export default function SavingsGoals({ totalBalance: totalBalanceProp, showSlider = false }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const c = useCardCustomization('Savings Goals')
  const [goals,          setGoals]          = useState([])
  const [allocations,    setAllocations]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [fetchedBalance, setFetchedBalance] = useState(0)
  const [modalGoal,      setModalGoal]      = useState(undefined)
  const [collapsed, setCollapsed] = useCollapsed('SavingsGoals')

  async function load() {
    if (!user?.id) return
    const [{ data: goalsData }, { data: txs }, { data: savingsCards }, { data: allocsData }] = await Promise.all([
      supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at'),
      totalBalanceProp !== undefined ? { data: null } :
        supabase.from('transactions')
          .select('amount, source')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .in('source', ['savings_in', 'savings_out']),
      totalBalanceProp !== undefined ? { data: null } :
        supabase.from('cards').select('initial_balance').eq('user_id', user.id).eq('type', 'savings'),
      supabase.from('savings_allocations')
        .select('id, goal_id, amount, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ])
    setGoals(goalsData ?? [])
    setAllocations(allocsData ?? [])
    if (txs) {
      const txBal = (txs ?? []).reduce((s, tx) => {
        if (tx.source === 'savings_in'  && tx.amount > 0) return s + tx.amount
        if (tx.source === 'savings_out' && tx.amount > 0) return s - tx.amount
        return s
      }, 0)
      const initBal = (savingsCards ?? []).reduce((s, card) => s + Number(card.initial_balance ?? 0), 0)
      setFetchedBalance(Math.max(txBal + initBal, 0))
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    window.addEventListener('savings-goal-updated', load)
    return () => window.removeEventListener('savings-goal-updated', load)
  }, [user?.id])

  const totalBalance   = totalBalanceProp ?? fetchedBalance
  const totalAllocated = goals.reduce((s, g) => s + (g.allocated_amount ?? 0), 0)
  const unallocated    = Math.max(totalBalance - totalAllocated, 0)

  const goalCards = goals.map(goal => {
    const allocated  = goal.allocated_amount ?? 0
    const target     = goal.target_amount
    const pct        = target && target > 0 ? Math.min((allocated / target) * 100, 100) : null
    const GoalIcon   = goal.icon ? CATEGORY_ICONS.find(i => i.id === goal.icon)?.Icon : null
    const goalAllocs = allocations.filter(a => a.goal_id === goal.id)
    return (
      <GoalCard
        key={goal.id}
        goal={goal} pct={pct} GoalIcon={GoalIcon}
        onEdit={setModalGoal} showSlider={showSlider}
        unallocated={unallocated} onReload={load}
        allocations={goalAllocs}
      />
    )
  })

  const modals = (
    <>
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
      {modalGoal !== undefined && (
        <AddSavingsGoalModal
          goal={modalGoal}
          available={unallocated}
          onClose={() => setModalGoal(undefined)}
          onSaved={load}
        />
      )}
    </>
  )

  // ── Savings page: full expanded view ──────────────────────────
  if (showSlider) {
    const goalItems = goals.filter(g => (g.type ?? 'goal') === 'goal')
    const fundItems = goals.filter(g => g.type === 'fund')

    function renderGrid(items) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(goal => {
            const allocated  = goal.allocated_amount ?? 0
            const target     = goal.target_amount
            const pct        = target && target > 0 ? Math.min((allocated / target) * 100, 100) : null
            const GoalIcon   = goal.icon ? CATEGORY_ICONS.find(i => i.id === goal.icon)?.Icon : null
            const goalAllocs = allocations.filter(a => a.goal_id === goal.id)
            return (
              <GoalCard
                key={goal.id}
                goal={goal} pct={pct} GoalIcon={GoalIcon}
                onEdit={setModalGoal} showSlider={showSlider}
                unallocated={unallocated} onReload={load}
                allocations={goalAllocs}
              />
            )
          })}
        </div>
      )
    }

    return (
      <>
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold">{t('savings.title')}</h2>
            <p className="text-[11px] text-muted mt-0.5">
              {t('savings.distributed', { allocated: fmt(totalAllocated), balance: fmt(totalBalance ?? 0) })}
            </p>
          </div>
          <button
            onClick={() => setModalGoal(null)}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          >
            <Plus size={12} /> Add
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ minHeight: '220px' }}>
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : goals.length === 0 ? (
          <div className="glass-card rounded-2xl flex flex-col items-center py-12 gap-2">
            <Target size={28} className="text-white/15" />
            <p className="text-muted text-sm">{t('savings.noGoals')}</p>
          </div>
        ) : (
          <div className="content-reveal flex flex-col gap-8">
            {goalItems.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Target size={13} className="text-muted" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">Goals</h3>
                  <span className="text-[10px] text-white/20 font-medium">{goalItems.length}</span>
                </div>
                {renderGrid(goalItems)}
              </div>
            )}
            {fundItems.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <PiggyBank size={13} className="text-muted" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">Funds</h3>
                  <span className="text-[10px] text-white/20 font-medium">{fundItems.length}</span>
                </div>
                {renderGrid(fundItems)}
              </div>
            )}
          </div>
        )}
        {modals}
      </>
    )
  }

  // ── Dashboard: compact widget ─────────────────────────────────
  return (
    <>
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden" style={{ border: c.borderStyle }}>
        {c.bgGradient && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: c.bgGradient, opacity: c.opacity / 100 }} />
        )}
        {c.enableColor && c.darkOverlay > 0 && (
          <div className="absolute inset-0 pointer-events-none bg-black" style={{ opacity: c.darkOverlay / 100 }} />
        )}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <button
                ref={c.btnRef}
                type="button"
                onClick={c.toggleOpen}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <PiggyBank size={14} />
              </button>
              <div>
                <button type="button" onClick={() => setCollapsed(v => !v)} className="text-sm font-semibold hover:text-white/70 transition-colors">{t('savings.title')}</button>
                <p className="text-[11px] text-muted mt-0.5">
                  {t('savings.distributed', { allocated: fmt(totalAllocated), balance: fmt(totalBalance ?? 0) })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setModalGoal(null)}
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Plus size={12} /> {t('savings.addGoal')}
            </button>
          </div>

          {!collapsed && (<>
            {loading ? (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', minHeight: '220px' }}>
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Target size={28} className="text-white/15" />
                <p className="text-muted text-sm">{t('savings.noGoals')}</p>
              </div>
            ) : (
              <div className="content-reveal grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {goalCards}
              </div>
            )}
          </>)}
        </div>
      </div>
      {modals}
    </>
  )
}

function formatDuration(months) {
  if (months <= 1)  return 'next month'
  if (months < 12)  return `${months} months`
  const yrs = Math.floor(months / 12)
  const mos = months % 12
  if (mos === 0)    return yrs === 1 ? '1 year' : `${yrs} years`
  return `${yrs}y ${mos}mo`
}

function GoalCard({ goal, pct, GoalIcon, onEdit, showSlider, unallocated, onReload, allocations = [] }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const allocated  = goal.allocated_amount ?? 0
  const target     = goal.target_amount
  const isComplete = pct !== null && pct >= 100
  const [displayPct,    setDisplayPct]    = useState(0)
  const [showConfetti,  setShowConfetti]  = useState(false)
  const [depositing,    setDepositing]    = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [saving,        setSaving]        = useState(false)
  const depositInputRef = useRef(null)

  useEffect(() => { if (depositing) setTimeout(() => depositInputRef.current?.focus(), 50) }, [depositing])

  async function handleDeposit(e) {
    e.stopPropagation()
    const amt = parseFloat(depositAmount)
    if (isNaN(amt) || amt <= 0) return
    const maxDeposit = unallocated ?? 0
    const capped = Math.min(amt, maxDeposit)
    setSaving(true)
    await Promise.all([
      supabase.from('savings_goals').update({ allocated_amount: allocated + capped }).eq('id', goal.id),
      supabase.from('savings_allocations').insert({ user_id: user.id, goal_id: goal.id, amount: capped }),
    ])
    setSaving(false)
    setDepositing(false)
    setDepositAmount('')
    window.dispatchEvent(new CustomEvent('savings-goal-updated'))
    onReload?.()
  }

  function cancelDeposit(e) { e.stopPropagation(); setDepositing(false); setDepositAmount('') }

  const remaining      = target && target > 0 ? Math.max(0, target - allocated) : null
  const defaultMonthly = remaining !== null && remaining > 0 ? Math.max(1, Math.ceil(remaining / 12)) : 1
  const [monthly, setMonthly] = useState(() => goal.monthly_transfer ?? defaultMonthly)
  const debounceRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayPct(pct ?? 0)
      if (isComplete) setShowConfetti(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [pct, isComplete])

  useEffect(() => {
    setMonthly(goal.monthly_transfer ?? defaultMonthly)
  }, [goal.id, goal.monthly_transfer])

  function handleMonthlyChange(val) {
    setMonthly(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      await supabase.from('savings_goals').update({ monthly_transfer: val }).eq('id', goal.id)
      window.dispatchEvent(new CustomEvent('savings-goal-updated'))
    }, 600)
  }

  const monthsToGoal = remaining && monthly > 0 ? Math.ceil(remaining / monthly) : null
  const sliderMax    = remaining !== null ? Math.ceil(remaining) : 1000
  const solidColor   = midColor(goal.color ?? '#a78bfa')

  const depositForm = depositing && (
    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]" onClick={e => e.stopPropagation()}>
      <div className="relative flex-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-white/30 pointer-events-none">€</span>
        <input
          ref={depositInputRef}
          type="number" step="0.01" min="0" max={unallocated}
          value={depositAmount}
          onChange={e => setDepositAmount(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleDeposit(e); if (e.key === 'Escape') cancelDeposit(e) }}
          placeholder="0,00"
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white outline-none focus:border-white/30"
        />
      </div>
      <button type="button" onClick={handleDeposit} disabled={saving || !depositAmount}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
        style={{ background: `color-mix(in srgb, ${solidColor} 25%, transparent)`, color: solidColor }}>
        <Check size={12} />
      </button>
      <button type="button" onClick={cancelDeposit}
        className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors text-white/40">
        <X size={12} />
      </button>
    </div>
  )

  // ── Full card (Savings page) ──────────────────────────────────
  if (showSlider) {
    return (
      <div className="rounded-2xl flex flex-col gap-4 p-5 relative overflow-hidden"
        style={{
          background: `color-mix(in srgb, ${solidColor} 6%, var(--color-dash-card, rgba(255,255,255,0.03)))`,
          border: `1px solid color-mix(in srgb, ${solidColor} 20%, rgba(255,255,255,0.07))`,
        }}>
        {showConfetti && <ConfettiBurst color={goal.color ?? '#a78bfa'} />}

        {/* Top row: icon + name + buttons */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {GoalIcon
              ? <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in srgb, ${solidColor} 15%, rgba(255,255,255,0.05))` }}>
                  <GoalIcon size={15} style={{ color: solidColor }} />
                </div>
              : <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: solidColor }} />
            }
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{goal.name}</p>
              {goal.note && <p className="text-[10px] text-muted mt-0.5 truncate">{goal.note}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {!isComplete && (
              <button type="button"
                onClick={e => { e.stopPropagation(); setDepositing(v => !v); setDepositAmount('') }}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                style={{ background: `color-mix(in srgb, ${solidColor} 15%, rgba(255,255,255,0.05))`, color: solidColor }}
                title="Add money">
                <Plus size={12} />
              </button>
            )}
            <button type="button" onClick={() => onEdit(goal)}
              className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors text-white/30 hover:text-white/60">
              <Pencil size={11} />
            </button>
          </div>
        </div>

        {/* Progress area */}
        {pct !== null ? (
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <ProgressRing pct={displayPct} color={solidColor} size={76} strokeWidth={5} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-sm font-bold tabular-nums">{Math.round(displayPct)}%</span>
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums leading-none">{fmt(allocated)}</p>
              <p className="text-xs text-muted mt-1">of {fmt(target)}</p>
              {isComplete && <p className="text-[10px] font-semibold mt-1.5" style={{ color: solidColor }}>Goal reached!</p>}
              {!isComplete && monthsToGoal && (
                <p className="text-[10px] mt-1.5" style={{ color: `color-mix(in srgb, ${solidColor} 70%, rgba(255,255,255,0.4))` }}>
                  {formatDuration(monthsToGoal)} to go
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-2xl font-bold tabular-nums leading-none">{fmt(allocated)}</p>
            <p className="text-xs text-muted mt-1">allocated</p>
          </div>
        )}

        {/* Monthly transfer slider */}
        {remaining !== null && remaining > 0 && (
          <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted uppercase tracking-widest">Monthly</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: solidColor }}>{fmt(monthly)}/mo</span>
            </div>
            <input
              type="range" min={1} max={sliderMax} step={1} value={monthly}
              onChange={e => handleMonthlyChange(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: 'var(--color-progress-bar)' }}
            />
          </div>
        )}

        {/* Recent deposits */}
        {allocations.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.06]">
            <span className="text-[9px] uppercase tracking-widest text-muted">Recent deposits</span>
            {allocations.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center justify-between">
                <span className="text-[10px] text-muted">
                  {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: solidColor }}>
                  +{fmt(a.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {depositForm}
      </div>
    )
  }

  // ── Compact card (Dashboard widget) ──────────────────────────
  return (
    <div
      className="relative rounded-xl p-4 flex flex-col gap-2.5 group overflow-hidden"
      style={{
        background: `color-mix(in srgb, ${solidColor} 8%, var(--color-dash-card, rgba(255,255,255,0.03)))`,
        border: `1px solid color-mix(in srgb, ${solidColor} 22%, transparent)`,
        cursor: 'pointer',
      }}
      onClick={() => onEdit(goal)}
    >
      {showConfetti && <ConfettiBurst color={goal.color ?? '#a78bfa'} />}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {GoalIcon
            ? <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-white/10">
                <GoalIcon size={13} className="text-white/60" />
              </div>
            : <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: goal.color ?? '#a78bfa' }} />
          }
          <span className="text-sm font-medium truncate">{goal.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isComplete && (
            <button type="button"
              onClick={e => { e.stopPropagation(); setDepositing(v => !v); setDepositAmount('') }}
              className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
              style={{ background: `color-mix(in srgb, ${solidColor} 20%, transparent)`, color: solidColor }}
              title="Add money">
              <Plus size={11} />
            </button>
          )}
          <Pencil size={11} className="text-white/20 group-hover:text-white/50 transition-colors cursor-pointer mt-0.5"
            onClick={e => { e.stopPropagation(); onEdit(goal) }} />
        </div>
      </div>

      <div>
        <span className="text-lg font-bold tabular-nums">{fmt(allocated)}</span>
        {target && <span className="text-xs text-muted ml-1.5">/ {fmt(target)}</span>}
      </div>

      {pct !== null && (
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full"
              style={{
                width: `${displayPct}%`,
                background: isComplete ? `linear-gradient(90deg, ${goal.color ?? '#a78bfa'}, #fff8)` : (goal.color ?? '#a78bfa'),
                transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
              }} />
          </div>
          <span className="text-[10px] text-muted">{t('savings.pctOfGoal', { pct: Math.round(pct) })}</span>
        </div>
      )}

      {goal.note && <p className="text-[11px] text-muted truncate">{goal.note}</p>}

      {remaining !== null && remaining > 0 && monthly > 0 && (
        <p className="text-[10px] leading-snug" style={{ color: `color-mix(in srgb, ${solidColor} 60%, rgba(255,255,255,0.35))` }}>
          {fmt(monthly)}/mo — {formatDuration(Math.ceil(remaining / monthly))}
        </p>
      )}

      {depositForm}
    </div>
  )
}

