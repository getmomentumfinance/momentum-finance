import { useState, useEffect, useRef } from 'react'
import { Target, Plus, Pencil, PiggyBank } from 'lucide-react'

function midColor(colorValue) {
  if (!colorValue) return '#a78bfa'
  const stops = [...colorValue.matchAll(/#[0-9a-fA-F]{6}/gi)].map(m => m[0])
  if (!stops.length) return colorValue
  if (stops.length === 1) return stops[0]
  const p = s => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)]
  const [r1,g1,b1] = p(stops[0]), [r2,g2,b2] = p(stops[stops.length-1])
  return '#' + [Math.round((r1+r2)/2), Math.round((g1+g2)/2), Math.round((b1+b2)/2)].map(x => x.toString(16).padStart(2,'0')).join('')
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

export default function SavingsGoals({ totalBalance: totalBalanceProp, showSlider = false }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const c = useCardCustomization('Savings Goals')
  const [goals,          setGoals]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [fetchedBalance, setFetchedBalance] = useState(0)
  const [modalGoal,      setModalGoal]      = useState(undefined)
  const [collapsed, setCollapsed] = useCollapsed('SavingsGoals')

  async function load() {
    if (!user?.id) return
    const [{ data: goals }, { data: txs }, { data: savingsCards }] = await Promise.all([
      supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at'),
      totalBalanceProp !== undefined ? { data: null } :
        supabase.from('transactions')
          .select('amount, source')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .eq('type', 'savings'),
      totalBalanceProp !== undefined ? { data: null } :
        supabase.from('cards').select('initial_balance').eq('user_id', user.id).eq('type', 'savings'),
    ])
    setGoals(goals ?? [])
    if (txs) {
      const txBal = (txs ?? []).reduce((s, t) => {
        if (t.source === 'savings_in'  && t.amount > 0) return s + t.amount
        if (t.source === 'savings_out' && t.amount > 0) return s - t.amount
        return s
      }, 0)
      const initBal = (savingsCards ?? []).reduce((s, c) => s + Number(c.initial_balance ?? 0), 0)
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
                <button type="button" onClick={() => setCollapsed(c => !c)} className="text-sm font-semibold hover:text-white/70 transition-colors">{t('savings.title')}</button>
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
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Target size={28} className="text-white/15" />
                <p className="text-muted text-sm">{t('savings.noGoals')}</p>
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {goals.map(goal => {
                  const allocated = goal.allocated_amount ?? 0
                  const target    = goal.target_amount
                  const pct       = target && target > 0 ? Math.min((allocated / target) * 100, 100) : null
                  const GoalIcon  = goal.icon ? CATEGORY_ICONS.find(i => i.id === goal.icon)?.Icon : null
                  return <GoalCard key={goal.id} goal={goal} pct={pct} GoalIcon={GoalIcon} onEdit={setModalGoal} showSlider={showSlider} />
                })}
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
}

function formatDuration(months) {
  if (months <= 1)  return 'next month'
  if (months < 12)  return `${months} months`
  const yrs = Math.floor(months / 12)
  const mos = months % 12
  if (mos === 0)    return yrs === 1 ? '1 year' : `${yrs} years`
  return `${yrs}y ${mos}mo`
}

function GoalCard({ goal, pct, GoalIcon, onEdit, showSlider }) {
  const { fmt, t } = usePreferences()
  const allocated = goal.allocated_amount ?? 0
  const target    = goal.target_amount
  const isComplete = pct >= 100
  const [displayPct, setDisplayPct] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const remaining   = target && target > 0 ? Math.max(0, target - allocated) : null
  const defaultMonthly = remaining !== null && remaining > 0 ? Math.max(1, Math.ceil(remaining / 12)) : 1
  const [monthly, setMonthly] = useState(() => goal.monthly_transfer ?? defaultMonthly)
  const debounceRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDisplayPct(pct ?? 0)
      if (isComplete) setShowConfetti(true)
    }, 50)
    return () => clearTimeout(t)
  }, [pct, isComplete])

  // Sync if goal reloads
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

  return (
    <div
      className="relative rounded-xl p-4 flex flex-col gap-2.5 group overflow-hidden"
      style={{
        background: `color-mix(in srgb, ${solidColor} 8%, var(--color-dash-card, rgba(255,255,255,0.03)))`,
        border: `1px solid color-mix(in srgb, ${solidColor} 22%, transparent)`,
        cursor: showSlider ? 'default' : 'pointer',
      }}
      onClick={showSlider ? undefined : () => onEdit(goal)}
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
        <Pencil size={11} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-0.5 cursor-pointer" onClick={() => onEdit(goal)} />
      </div>

      <div>
        <span className="text-lg font-bold tabular-nums">{fmt(allocated)}</span>
        {target && <span className="text-xs text-muted ml-1.5">/ {fmt(target)}</span>}
      </div>

      {pct !== null && (
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${displayPct}%`,
                background: isComplete
                  ? `linear-gradient(90deg, ${goal.color ?? '#a78bfa'}, #fff8)`
                  : (goal.color ?? '#a78bfa'),
                transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
          <span className="text-[10px] text-muted">{t('savings.pctOfGoal', { pct: Math.round(pct) })}</span>
        </div>
      )}

      {goal.note && <p className="text-[11px] text-muted truncate">{goal.note}</p>}

      {/* Slider — Savings page only */}
      {showSlider && remaining !== null && remaining > 0 && (
        <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase tracking-widest">Monthly transfer</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: solidColor }}>{fmt(monthly)}</span>
          </div>
          <input
            type="range"
            min={1}
            max={sliderMax}
            step={1}
            value={monthly}
            onChange={e => handleMonthlyChange(Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: 'var(--color-progress-bar)' }}
          />
          <p className="text-[10px]" style={{ color: `color-mix(in srgb, ${solidColor} 60%, rgba(255,255,255,0.35))` }}>
            Reach goal in <span className="font-semibold">{formatDuration(monthsToGoal)}</span>
          </p>
        </div>
      )}

      {/* Widget hint — no slider */}
      {!showSlider && remaining !== null && remaining > 0 && monthly > 0 && (
        <p className="text-[10px] leading-snug" style={{ color: `color-mix(in srgb, ${solidColor} 60%, rgba(255,255,255,0.35))` }}>
          {fmt(monthly)}/mo — {formatDuration(Math.ceil(remaining / monthly))}
        </p>
      )}
    </div>
  )
}

function ConfettiBurst({ color }) {
  const pieces = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    delay: `${Math.random() * 0.4}s`,
    size: 4 + Math.random() * 4,
    hue: Math.random() > 0.5 ? color : '#ffffff88',
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: p.left,
            top: 0,
            width: p.size,
            height: p.size,
            background: p.hue,
            animation: `confettiFall 0.9s ease-out ${p.delay} forwards`,
          }}
        />
      ))}
    </div>
  )
}
