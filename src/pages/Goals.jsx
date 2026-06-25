import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Home, Car, Shield, Trash2, Wallet, TrendingUp, TrendingDown, Receipt, Palmtree, Heart, Baby, Sofa, Briefcase, Gift, Palette } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSharedData } from '../context/SharedDataContext'
import { usePreferences } from '../context/UserPreferencesContext'
import { computeHouseGoalSummary, computeSimpleSavingsGoalSummary, monthsLabel } from '../utils/goalCalc'
import { ProgressRing } from '../components/shared/ProgressRing'
import Navbar from '../components/dashboard/Navbar'
import HouseGoalSimulator from '../components/goals/HouseGoalSimulator'
import HouseGoalCard from '../components/goals/HouseGoalCard'
import SimpleGoalCard from '../components/goals/SimpleGoalCard'
import SimpleGoalEditor from '../components/goals/SimpleGoalEditor'
import { SIMPLE_GOAL_TYPES } from '../components/goals/simpleGoalTypes'

const GOAL_TYPES = [
  { value: 'house',     label: 'Buy a house',          Icon: Home,     enabled: true },
  { value: 'car',       label: 'Buy a car',            Icon: Car,      enabled: true },
  { value: 'vacation',  label: 'Save for a trip',      Icon: Palmtree, enabled: true },
  { value: 'fund',      label: 'Build emergency fund', Icon: Shield,   enabled: true },
  { value: 'wedding',   label: 'Plan a wedding',          Icon: Heart,     enabled: true },
  { value: 'baby',      label: 'Save for a baby',         Icon: Baby,      enabled: true },
  { value: 'furniture', label: 'Furnish your home',       Icon: Sofa,      enabled: true },
  { value: 'business',  label: 'Start a business',        Icon: Briefcase, enabled: true },
  { value: 'gift',      label: 'Build a gift fund',       Icon: Gift,      enabled: true },
  { value: 'art',       label: 'Fund a creative project',  Icon: Palette,   enabled: true },
]
const SIMPLE_TYPES = new Set(['car', 'vacation', 'fund', 'wedding', 'baby', 'furniture', 'business', 'gift', 'art'])

function Stat({ label, value, color, Icon }) {
  const bg = color ? `color-mix(in srgb, ${color} 14%, transparent)` : 'rgba(255,255,255,0.04)'
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-w-0" style={{ background: bg }}>
      <Icon size={16} className="shrink-0" style={{ color: color ?? 'rgba(255,255,255,0.4)' }} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] text-white/35 uppercase tracking-wider truncate">{label}</span>
        <span className="text-sm font-bold tabular-nums truncate text-white">{value}</span>
      </div>
    </div>
  )
}

function GoalCard({ goal, onOpen, onDelete, onSetSavings, onPatchConfig }) {
  const meta = GOAL_TYPES.find(g => g.value === goal.type) ?? GOAL_TYPES[0]
  const { fmt } = usePreferences()
  const { categories, cards, allTransactions } = useSharedData()

  const isActive = goal.status === 'active'
  const isSimpleType = SIMPLE_TYPES.has(goal.type)

  const summary = goal.type === 'house'
    ? computeHouseGoalSummary(goal.config, { categories, cards, allTransactions })
    : isSimpleType
    ? computeSimpleSavingsGoalSummary(goal.type, goal.config, { categories, cards, allTransactions })
    : null
  const hasTimeline = goal.type === 'house'
    ? summary?.hasIncome && summary?.hasPrice && summary.effectiveMonthlySavings > 0
    : isSimpleType
    ? summary?.hasTarget && summary?.hasContribution
    : false
  const housePrice  = goal.config?.house_price ?? 0
  const fundPct     = goal.type === 'house'
    ? (summary?.emergencyTarget > 0 ? Math.min(100, (summary.currentSaved / summary.emergencyTarget) * 100) : 0)
    : (summary?.pct ?? 0)
  const savingsPositive   = summary?.hasIncome ? summary.monthlySavings >= 0 : true
  const remainingPositive = summary?.hasPrice  ? summary.remainingAfterMortgage >= 0 : true

  if (goal.type === 'house' && isActive && hasTimeline) {
    const savingsCardName = cards.find(c => c.id === goal.config?.savings_card_id)?.name ?? null
    return (
      <HouseGoalCard goal={goal} summary={summary} savingsCardName={savingsCardName} fmt={fmt}
        onOpen={onOpen} onDelete={onDelete} onSetSavings={onSetSavings} />
    )
  }

  if (isSimpleType && isActive && hasTimeline) {
    const savingsCardName = cards.find(c => c.id === goal.config?.savings_card_id)?.name ?? null
    return (
      <SimpleGoalCard goal={goal} summary={summary} typeConfig={SIMPLE_GOAL_TYPES[goal.type]} savingsCardName={savingsCardName} fmt={fmt}
        onOpen={onOpen} onDelete={onDelete} onPatchConfig={onPatchConfig} />
    )
  }

  return (
    <div onClick={() => onOpen(goal)}
      className="group relative w-full glass-card rounded-2xl p-5 flex gap-5 cursor-pointer hover:border-white/15 transition-colors overflow-hidden">

      {summary && (
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'var(--color-accent-2)', opacity: 0.1, filter: 'blur(50px)' }} />
      )}

      {summary && (
        <div className="relative z-10 shrink-0 hidden sm:flex items-center justify-center">
          <ProgressRing pct={fundPct} color="var(--color-accent-2)" size={88} strokeWidth={7} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold tabular-nums text-white">{Math.round(fundPct)}%</span>
            <span className="text-[8px] text-white/30 uppercase tracking-wider">fund</span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-4">

      {/* Identity + status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.06] shrink-0">
            <meta.Icon size={17} className="text-white/60" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white truncate">{goal.name}</span>
            <span className="text-[11px] text-white/30">{meta.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium px-2 py-1 rounded-full"
            style={{
              background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
              color:      isActive ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.4)',
            }}>
            {isActive ? 'Active' : 'Draft'}
          </span>
          <button onClick={e => { e.stopPropagation(); onDelete(goal.id) }}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-white/40">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Timeline headline — the punchline, so it leads */}
      {goal.type === 'house' && hasTimeline ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-2xl font-bold text-white">Ready in {monthsLabel(summary.timeline.totalMonths)}</span>
            <span className="text-[11px] text-white/30">
              Emergency fund · {monthsLabel(summary.timeline.monthsToEmergencyFund)} &nbsp;·&nbsp; Down payment · {monthsLabel(summary.timeline.monthsToDownPayment)}
            </span>
          </div>
          <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-white/[0.05]">
            <div style={{ width: `${(summary.timeline.monthsToEmergencyFund / summary.timeline.totalMonths) * 100}%`, background: 'var(--color-accent-2)' }} />
            <div style={{ width: `${(summary.timeline.monthsToDownPayment / summary.timeline.totalMonths) * 100}%`, background: 'var(--color-accent)' }} />
          </div>
        </div>
      ) : isSimpleType && hasTimeline ? (
        <div className="flex flex-col gap-2">
          <span className="text-2xl font-bold text-white">Ready in {monthsLabel(summary.monthsToTarget)}</span>
          <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-white/[0.05]">
            <div style={{ width: `${summary.pct}%`, background: 'var(--color-accent-2)' }} />
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-white/30">
          {goal.type === 'house'
            ? 'Add income and a house price to see your timeline.'
            : 'Set a target amount and monthly contribution to see your timeline.'}
        </p>
      )}

      {/* Stat strip */}
      {goal.type === 'house' && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
          <Stat label="House price" Icon={Home} value={housePrice ? fmt(housePrice) : '—'} />
          <Stat label="Down payment" Icon={Wallet} color="var(--color-accent)"
            value={summary.hasPrice ? fmt(summary.downPaymentAmount) : '—'} />
          <Stat label="Emergency fund" Icon={Shield} color="var(--color-accent-2)"
            value={`${fmt(summary.currentSaved)} / ${fmt(summary.emergencyTarget)}`} />
          <Stat label="Monthly savings" Icon={savingsPositive ? TrendingUp : TrendingDown}
            color={summary.hasIncome ? (savingsPositive ? 'var(--color-progress-bar)' : 'var(--color-alert)') : undefined}
            value={summary.hasIncome ? `${fmt(summary.monthlySavings)}/mo` : '—'} />
          <Stat label="Mortgage payment" Icon={Receipt}
            value={summary.hasPrice ? `${fmt(summary.mortgagePayment)}/mo` : '—'} />
          <Stat label="Left for living + saving" Icon={remainingPositive ? TrendingUp : TrendingDown}
            color={summary.hasPrice ? (remainingPositive ? 'var(--color-progress-bar)' : 'var(--color-alert)') : undefined}
            value={summary.hasPrice ? `${fmt(summary.remainingAfterMortgage)}/mo` : '—'} />
        </div>
      )}
      {isSimpleType && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
          <Stat label="Target" Icon={Wallet} value={summary.hasTarget ? fmt(summary.target) : '—'} />
          <Stat label="Saved so far" Icon={TrendingUp} color="var(--color-accent-2)" value={fmt(summary.currentSaved)} />
          <Stat label="Monthly savings" Icon={summary.monthlyContribution >= 0 ? TrendingUp : TrendingDown}
            color="var(--color-accent-2)" value={summary.hasContribution ? `${fmt(summary.monthlyContribution)}/mo` : '—'} />
        </div>
      )}

      </div>
    </div>
  )
}

export default function Goals() {
  const { user } = useAuth()
  const [currentDate] = useState(new Date())
  const [goals,      setGoals]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeGoal, setActiveGoal] = useState(null)
  const [picking,    setPicking]    = useState(false)

  async function load() {
    if (!user?.id) return
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (!error) setGoals(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  async function createGoal(type) {
    const meta = GOAL_TYPES.find(g => g.value === type)
    const { data, error } = await supabase.from('goals').insert({
      user_id: user.id, type, name: meta?.label ?? 'New goal', status: 'draft', config: {},
    }).select().single()
    if (error) { console.error('goals insert error:', error); return }
    setGoals(prev => [data, ...prev])
    setActiveGoal(data)
    setPicking(false)
  }

  async function deleteGoal(id) {
    if (!window.confirm('Delete this goal?')) return
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
    setActiveGoal(prev => (prev?.id === id ? null : prev))
  }

  function handleSaved(updated) {
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))
    setActiveGoal(updated)
  }

  // Lets a goal card commit (or clear) a pinned monthly-savings target without
  // opening the full simulator — used by the "Set as new monthly savings" button.
  async function setSavingsOverride(goalId, value) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const config = { ...goal.config, monthly_savings_override: value }
    const { data, error } = await supabase.from('goals')
      .update({ config, updated_at: new Date().toISOString() }).eq('id', goalId).select().single()
    if (error) { console.error('goals update error:', error); return }
    setGoals(prev => prev.map(g => g.id === goalId ? data : g))
  }

  // Generic version of the above for the simple savings goal types (car,
  // vacation, fund) — their "Set as new monthly savings" patches a plain
  // monthly_contribution field rather than an override of a derived value.
  async function patchGoalConfig(goalId, patch) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const config = { ...goal.config, ...patch }
    const { data, error } = await supabase.from('goals')
      .update({ config, updated_at: new Date().toISOString() }).eq('id', goalId).select().single()
    if (error) { console.error('goals update error:', error); return }
    setGoals(prev => prev.map(g => g.id === goalId ? data : g))
  }

  return (
    <div className={`min-h-screen text-white ${activeGoal ? '' : 'bg-dash-bg'}`}
      style={activeGoal ? { background: 'rgba(8,7,16,0.78)' } : undefined}>
      <Navbar currentDate={currentDate} onPrev={() => {}} onNext={() => {}} />

      <div id="page-content" className="py-6 px-4 md:px-8 lg:px-16 pb-24 lg:pb-6 flex flex-col gap-6">

        {activeGoal ? (
          <>
            {activeGoal.type === 'house' && (
              <HouseGoalSimulator goal={activeGoal} onSaved={handleSaved} onDelete={deleteGoal} onBack={() => setActiveGoal(null)} />
            )}
            {SIMPLE_TYPES.has(activeGoal.type) && (
              <SimpleGoalEditor goal={activeGoal} onSaved={handleSaved} onDelete={deleteGoal} onBack={() => setActiveGoal(null)} />
            )}
          </>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold">Goals</h1>
                <p className="text-muted text-sm mt-1">Plan and track your big financial milestones</p>
              </div>
              <button onClick={() => setPicking(true)}
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
                <Plus size={14} /> New Goal
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-muted text-center py-8">Loading…</p>
            ) : goals.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-muted">No goals yet. Start by planning your first big milestone.</p>
                <button onClick={() => setPicking(true)}
                  className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
                  <Plus size={14} /> New Goal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {goals.map(g => <GoalCard key={g.id} goal={g} onOpen={setActiveGoal} onDelete={deleteGoal} onSetSavings={setSavingsOverride} onPatchConfig={patchGoalConfig} />)}
              </div>
            )}
          </>
        )}

      </div>

      {picking && createPortal(
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setPicking(false) }}>
          <div className="glass-popup border border-white/10 rounded-2xl p-5 w-full max-w-sm flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-white">Choose a goal type</h2>
            {GOAL_TYPES.map(({ value, label, Icon, enabled }) => (
              <button key={value} disabled={!enabled} onClick={() => createGoal(value)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-left">
                <Icon size={16} className="text-white/60" />
                <span className="text-sm text-white/80">{label}</span>
                {!enabled && <span className="ml-auto text-[10px] text-white/25">Coming soon</span>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
