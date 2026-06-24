import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Home, Car, Shield, Trash2, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSharedData } from '../context/SharedDataContext'
import { usePreferences } from '../context/UserPreferencesContext'
import { computeHouseGoalSummary, monthsLabel } from '../utils/goalCalc'
import Navbar from '../components/dashboard/Navbar'
import HouseGoalSimulator from '../components/goals/HouseGoalSimulator'

const GOAL_TYPES = [
  { value: 'house', label: 'Buy a house',          Icon: Home,   enabled: true  },
  { value: 'car',   label: 'Buy a car',            Icon: Car,    enabled: false },
  { value: 'fund',  label: 'Build emergency fund', Icon: Shield, enabled: false },
]

function GoalCard({ goal, onOpen, onDelete }) {
  const meta = GOAL_TYPES.find(g => g.value === goal.type) ?? GOAL_TYPES[0]
  const { fmt } = usePreferences()
  const { categories, cards, allTransactions } = useSharedData()

  const isActive = goal.status === 'active'
  const summary = goal.type === 'house'
    ? computeHouseGoalSummary(goal.config, { categories, cards, allTransactions })
    : null
  const hasTimeline = isActive && summary?.hasIncome && summary?.hasPrice && summary.monthlySavings > 0

  return (
    <div onClick={() => onOpen(goal)}
      className="group glass-card rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06] shrink-0">
            <meta.Icon size={16} className="text-white/60" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white truncate">{goal.name}</span>
            <span className="text-[11px] text-white/30">{meta.label}</span>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(goal.id) }}
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-white/40 shrink-0">
          <Trash2 size={13} />
        </button>
      </div>

      {hasTimeline ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-white">Ready in {monthsLabel(summary.timeline.totalMonths)}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--color-progress-bar)' }}>
              Active
            </span>
          </div>
          <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-white/[0.05]">
            <div style={{ width: `${(summary.timeline.monthsToEmergencyFund / summary.timeline.totalMonths) * 100}%`, background: 'var(--color-accent-2)' }} />
            <div style={{ width: `${(summary.timeline.monthsToDownPayment / summary.timeline.totalMonths) * 100}%`, background: 'var(--color-accent)' }} />
          </div>
          <span className="text-[11px] text-white/30">saving {fmt(summary.monthlySavings)}/mo</span>
        </div>
      ) : (
        <span className="text-[11px] font-medium px-2 py-1 rounded-full self-start"
          style={{
            background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
            color:      isActive ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.4)',
          }}>
          {isActive ? 'Active' : 'Draft'}
        </span>
      )}
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

  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar currentDate={currentDate} onPrev={() => {}} onNext={() => {}} />

      <div id="page-content" className="py-6 px-4 md:px-8 lg:px-16 pb-24 lg:pb-6 flex flex-col gap-6">

        {activeGoal ? (
          <>
            <button onClick={() => setActiveGoal(null)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors self-start">
              <ChevronLeft size={14} /> All goals
            </button>
            {activeGoal.type === 'house' && (
              <HouseGoalSimulator goal={activeGoal} onSaved={handleSaved} onDelete={deleteGoal} />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map(g => <GoalCard key={g.id} goal={g} onOpen={setActiveGoal} onDelete={deleteGoal} />)}
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
