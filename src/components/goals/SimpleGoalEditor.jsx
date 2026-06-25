import { useState, useEffect, useRef } from 'react'
import { Trash2, Check, PartyPopper, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSharedData } from '../../context/SharedDataContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { computeSimpleSavingsGoalSummary, monthsLabel } from '../../utils/goalCalc'
import { ConfettiBurst } from '../shared/ConfettiBurst'
import { SIMPLE_GOAL_TYPES } from './simpleGoalTypes'

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition-colors placeholder:text-white/20 tabular-nums'

export default function SimpleGoalEditor({ goal, onSaved, onDelete, onBack }) {
  const { fmt } = usePreferences()
  const { categories, cards, allTransactions } = useSharedData()
  const typeConfig = SIMPLE_GOAL_TYPES[goal.type]

  const [name, setName] = useState(goal.name)
  const [config, setConfig] = useState(() => ({
    target_amount:         goal.config?.target_amount ?? 0,
    emergency_fund_months: goal.config?.emergency_fund_months ?? 3,
    monthly_contribution:  goal.config?.monthly_contribution ?? 0,
    savings_card_id:       goal.config?.savings_card_id ?? null,
    manual_saved_amount:   goal.config?.manual_saved_amount ?? 0,
    extra_stats:           goal.config?.extra_stats ?? typeConfig.extraStatLabels.map(label => ({ label, amount: 0, frequency: 'once' })),
  }))
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [justStarted, setJustStarted] = useState(false)

  const summary = computeSimpleSavingsGoalSummary(goal.type, config, { categories, cards, allTransactions })
  const savingsCard = cards.find(c => c.id === config.savings_card_id) ?? null
  const subtitle = typeConfig.subtitle
    ? typeConfig.subtitle(fmt, summary.monthlyContribution)
    : `putting aside ${fmt(summary.monthlyContribution)}/mo toward your ${typeConfig.subtitleNoun}`

  function patchConfig(patch) { setConfig(c => ({ ...c, ...patch })) }
  function updateExtraStat(i, patch) {
    setConfig(c => ({ ...c, extra_stats: c.extra_stats.map((s, idx) => idx === i ? { ...s, ...patch } : s) }))
  }

  const nameRef = useRef(name); nameRef.current = name
  const configRef = useRef(config); configRef.current = config
  const goalRef = useRef(goal); goalRef.current = goal
  const isMountedRef = useRef(true)
  useEffect(() => () => { isMountedRef.current = false }, [])

  async function save(nextStatus) {
    if (isMountedRef.current) setSaving(true)
    const g = goalRef.current
    const status = nextStatus ?? g.status
    const wasDraft = g.status === 'draft'
    const payload = {
      name: nameRef.current,
      config: configRef.current,
      status,
      started_at: status === 'active' && !g.started_at ? new Date().toISOString() : g.started_at,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('goals').update(payload).eq('id', g.id).select().single()
    if (isMountedRef.current) setSaving(false)
    if (error) { console.error('goals update error:', error); return }
    onSaved(data)
    if (isMountedRef.current) {
      if (status === 'active' && wasDraft) {
        setJustStarted(true)
        setTimeout(() => { if (isMountedRef.current) setJustStarted(false) }, 2800)
      } else {
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 1800)
      }
    }
  }

  const isFirstRun = useRef(true)
  const saveTimer = useRef(null)
  const hasPendingSave = useRef(false)
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return }
    hasPendingSave.current = true
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { hasPendingSave.current = false; save() }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [name, config])

  useEffect(() => {
    return () => {
      if (hasPendingSave.current) {
        clearTimeout(saveTimer.current)
        save()
      }
    }
  }, [])

  return (
    <>
      {/* Breadcrumb header */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors shrink-0">
            <ChevronLeft size={14} /> All goals
          </button>
          <ChevronRight size={11} className="text-white/25 shrink-0" />
          <input value={name} onChange={e => setName(e.target.value)}
            className="bg-transparent text-white/50 outline-none border-b border-transparent focus:border-white/20 transition-colors min-w-0" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{
              background: goal.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
              color:      goal.status === 'active' ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.4)',
            }}>
            {goal.status === 'active' ? 'Active' : 'Draft'}
          </span>
          <button onClick={() => onDelete(goal.id)}
            className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Hero banner — illustration with the summary overlaid at the bottom */}
      <div className="relative h-60 overflow-hidden border-b border-white/[0.06]">
        {justStarted && <ConfettiBurst color={typeConfig.primaryColor} />}
        <typeConfig.Scene fit="slice" />
        <div className="absolute inset-x-0 bottom-0 px-9 pb-6 flex items-end justify-between gap-8"
          style={{ background: 'linear-gradient(to top, rgba(13,10,24,0.92) 0%, rgba(13,10,24,0.6) 60%, transparent 100%)' }}>
          {typeConfig.recurring ? (
            <>
              <div>
                <span className="text-[34px] font-semibold text-white leading-tight tracking-tight">Fills up every year</span>
                <p className="text-[13px] text-white/50 mt-0.5">{subtitle}</p>
              </div>
              <div className="w-[340px] shrink-0">
                <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-white/10 mb-1.5">
                  <div style={{ width: `${summary.pct}%`, background: typeConfig.primaryColor }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/45">
                  <span>{fmt(summary.currentSaved)} saved of {fmt(summary.target)} annual</span>
                  <span style={{ color: typeConfig.primaryColor, fontWeight: 500 }}>{Math.round(summary.pct)}%</span>
                </div>
              </div>
            </>
          ) : !summary.hasTarget ? (
            <p className="text-sm text-white/50">Set a target amount below to see your timeline.</p>
          ) : !summary.hasContribution ? (
            <p className="text-sm" style={{ color: 'var(--color-alert)' }}>
              Set a monthly contribution below to see your timeline.
            </p>
          ) : summary.monthsToTarget <= 0 ? (
            <span className="text-3xl font-bold text-white flex items-center gap-2">
              You're ready now <PartyPopper size={26} style={{ color: typeConfig.primaryColor }} />
            </span>
          ) : (
            <>
              <div>
                <span className="text-[34px] font-semibold text-white leading-tight tracking-tight">Ready in {monthsLabel(summary.monthsToTarget)}</span>
                <p className="text-[13px] text-white/50 mt-0.5">{subtitle}</p>
              </div>
              <div className="w-[340px] shrink-0">
                <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-white/10 mb-1.5">
                  <div style={{ width: `${summary.pct}%`, background: typeConfig.primaryColor }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/45">
                  <span>{fmt(summary.currentSaved)} saved of {fmt(summary.target)}</span>
                  <span style={{ color: typeConfig.primaryColor, fontWeight: 500 }}>{Math.round(summary.pct)}%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative w-full flex flex-col gap-5 mt-5">

      {/* Inputs, two columns on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <div className="flex flex-col gap-5">

      {/* Target */}
      {!typeConfig.recurring && (
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-white/80 uppercase tracking-widest">{typeConfig.targetStatLabel}</h2>
          {goal.type === 'fund' ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted w-40 shrink-0">Months of expenses</span>
              <input type="range" min={1} max={12} step={1} value={config.emergency_fund_months}
                onChange={e => patchConfig({ emergency_fund_months: Number(e.target.value) })}
                className="flex-1 cursor-pointer" style={{ accentColor: typeConfig.primaryColor }} />
              <span className="text-sm tabular-nums text-white w-10 text-right">{config.emergency_fund_months}</span>
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
              <input type="number" min="0" value={config.target_amount || ''} placeholder="e.g. 10000"
                onChange={e => patchConfig({ target_amount: Number(e.target.value) })}
                className={inputCls} style={{ paddingLeft: '1.5rem' }} />
            </div>
          )}
        </div>
      )}

      {/* Monthly contribution + savings */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-xs font-semibold text-white/80 uppercase tracking-widest">{typeConfig.recurring ? 'Monthly top-up' : 'Monthly contribution'}</h2>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
          <input type="number" min="0" value={config.monthly_contribution || ''} placeholder="e.g. 250"
            onChange={e => patchConfig({ monthly_contribution: Number(e.target.value) })}
            className={inputCls} style={{ paddingLeft: '1.5rem' }} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-40 shrink-0">Linked savings card</span>
          <select value={config.savings_card_id ?? ''} onChange={e => patchConfig({ savings_card_id: e.target.value || null })}
            className={inputCls}>
            <option value="">None</option>
            {cards.filter(c => c.type === 'savings').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {!savingsCard && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted w-40 shrink-0">Already saved</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
              <input type="number" min="0" value={config.manual_saved_amount || ''} placeholder="0"
                onChange={e => patchConfig({ manual_saved_amount: Number(e.target.value) })}
                className={inputCls} style={{ paddingLeft: '1.5rem' }} />
            </div>
          </div>
        )}
      </div>

      </div>
      <div className="flex flex-col gap-5">

      {/* Extra stats */}
      {config.extra_stats.length > 0 && (
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-white/80 uppercase tracking-widest">Extra details</h2>
          {config.extra_stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-muted w-32 shrink-0 truncate">{s.label}</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
                <input type="number" min="0" value={s.amount || ''} placeholder="0"
                  onChange={e => updateExtraStat(i, { amount: Number(e.target.value) })}
                  className={inputCls} style={{ paddingLeft: '1.5rem' }} />
              </div>
              <div className="flex rounded-xl border border-white/10 overflow-hidden shrink-0">
                {['once', 'monthly'].map(freq => (
                  <button key={freq} type="button" onClick={() => updateExtraStat(i, { frequency: freq })}
                    className="px-2.5 py-2 text-xs font-medium transition-colors"
                    style={{
                      background: s.frequency === freq ? `color-mix(in srgb, ${typeConfig.primaryColor} 20%, transparent)` : 'transparent',
                      color:      s.frequency === freq ? typeConfig.primaryColor : 'rgba(255,255,255,0.35)',
                    }}>
                    {freq === 'once' ? 'Once' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <span className="text-xs flex items-center gap-1 text-white/30">
          {saving
            ? 'Saving…'
            : savedFlash
            ? <span className="flex items-center gap-1" style={{ color: 'var(--color-progress-bar)' }}><Check size={13} /> Saved</span>
            : 'Changes save automatically'}
        </span>
        {goal.status === 'draft' && (
          <button onClick={() => save('active')} disabled={saving}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
            Start this goal
          </button>
        )}
      </div>

      </div>
    </>
  )
}
