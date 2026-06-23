import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, X, Trash2, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSharedData } from '../../context/SharedDataContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { computeCardBalance } from '../../utils/cardBalance'
import { mainCategorySpend, monthlyAverage, computeMortgagePayment, computeHouseTimeline } from '../../utils/goalCalc'

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/25 transition-colors placeholder:text-white/20 tabular-nums'

function monthsLabel(months) {
  if (!Number.isFinite(months)) return '—'
  if (months <= 0) return 'now'
  const years = Math.floor(months / 12)
  const rem   = months % 12
  if (years === 0) return `${months} mo`
  return rem === 0 ? `${years} yr` : `${years} yr ${rem} mo`
}

function StepHeader({ n, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
        style={{ background: 'var(--color-accent)' }}>
        {n}
      </span>
      <h2 className="text-xs font-semibold text-white/80 uppercase tracking-widest">{children}</h2>
    </div>
  )
}

export function CategorySliderRow({ category, plannedAmount, currentMonthSpend, avgSpend, onChange, fmt }) {
  const max   = Math.max(Math.ceil(avgSpend * 2), 50, Math.ceil(plannedAmount))
  const value = Math.min(plannedAmount, max)
  const pct   = max > 0 ? (value / max) * 100 : 0
  const color = category.color || 'var(--color-accent)'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-white/75 flex items-center gap-2 truncate min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          <span className="truncate">{category.name}</span>
        </span>
        <div className="relative w-28 shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 text-xs">€</span>
          <input
            type="number" min={0} value={plannedAmount ? Math.round(plannedAmount) : ''}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-5 pr-2 py-1 text-sm font-semibold tabular-nums text-white outline-none focus:border-white/25 transition-colors"
          />
        </div>
      </div>
      {/* The gradient fill IS the slider — native range sits on top as an invisible drag handle */}
      <div className="relative h-3.5 w-full flex items-center">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
        <input
          type="range" min={0} max={max} step={Math.max(1, Math.round(max / 100))}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="gradient-range absolute inset-0 cursor-pointer"
          style={{ '--thumb-color': color }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/30">
        <span>This month: {fmt(currentMonthSpend)}</span>
        <span>Avg: {fmt(avgSpend)}</span>
      </div>
    </div>
  )
}

const DOWN_PAYMENT_PRESETS = [
  { label: 'Conservative (20%)', value: 20 },
  { label: 'Moderate (15%)',     value: 15 },
  { label: 'Minimal (10%)',      value: 10 },
]

export default function HouseGoalSimulator({ goal, onSaved, onDelete }) {
  const { user } = useAuth()
  const { fmt }  = usePreferences()
  const { categories, cards, allTransactions } = useSharedData()

  const [name, setName] = useState(goal.name)
  const [config, setConfig] = useState(() => ({
    incomes:              goal.config?.incomes ?? [{ label: 'Income', amount: 0 }],
    category_plan:        goal.config?.category_plan ?? {},
    housing_category_id:  goal.config?.housing_category_id ?? null,
    savings_card_id:      goal.config?.savings_card_id ?? null,
    emergency_fund_months: goal.config?.emergency_fund_months ?? 3,
    house_price:          goal.config?.house_price ?? 0,
    down_payment_pct:     goal.config?.down_payment_pct ?? 20,
    loan_amount_override: goal.config?.loan_amount_override ?? null,
    closing_cost_pct:     goal.config?.closing_cost_pct ?? 3,
    mortgage_rate_pct:    goal.config?.mortgage_rate_pct ?? 3.5,
    mortgage_years:       goal.config?.mortgage_years ?? 25,
  }))
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const mainCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories])

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const avgByCategory = useMemo(() => {
    const m = {}
    mainCategories.forEach(c => { m[c.id] = monthlyAverage(allTransactions, c.id) })
    return m
  }, [mainCategories, allTransactions])

  const currentByCategory = useMemo(() => {
    const m = {}
    mainCategories.forEach(c => { m[c.id] = mainCategorySpend(allTransactions, c.id, currentMonthKey) })
    return m
  }, [mainCategories, allTransactions, currentMonthKey])

  function plannedFor(categoryId) {
    return config.category_plan[categoryId] ?? avgByCategory[categoryId] ?? 0
  }

  const totalPlanned = useMemo(() =>
    mainCategories.reduce((s, c) => s + plannedFor(c.id), 0)
  , [mainCategories, config.category_plan, avgByCategory])

  // Auto-guess the housing category and the main savings card once, the first time data is available.
  useEffect(() => {
    if (config.housing_category_id || mainCategories.length === 0) return
    const guess = mainCategories.find(c => /rent|housing|mortgage/i.test(c.name))
    if (guess) setConfig(c => ({ ...c, housing_category_id: guess.id }))
  }, [mainCategories])

  useEffect(() => {
    if (config.savings_card_id || cards.length === 0) return
    const main = cards.find(c => c.type === 'savings' && c.is_main) ?? cards.find(c => c.type === 'savings')
    if (main) setConfig(c => ({ ...c, savings_card_id: main.id }))
  }, [cards])

  const combinedIncome = config.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const monthlySavings = combinedIncome - totalPlanned

  const savingsCard  = cards.find(c => c.id === config.savings_card_id) ?? null
  const currentSaved = savingsCard ? computeCardBalance(savingsCard, allTransactions) : 0
  const emergencyTarget = config.emergency_fund_months * totalPlanned

  const downPaymentAmount = config.house_price * (config.down_payment_pct / 100)
  const closingCosts      = config.house_price * (config.closing_cost_pct / 100)
  const downPaymentTarget = downPaymentAmount + closingCosts

  const timeline = computeHouseTimeline({ monthlySavings, currentSaved, emergencyTarget, downPaymentTarget })

  const autoLoanAmount = Math.max(0, config.house_price - downPaymentAmount)
  const loanAmount      = config.loan_amount_override ?? autoLoanAmount
  const mortgagePayment = computeMortgagePayment(loanAmount, config.mortgage_rate_pct, config.mortgage_years)

  const housingCategoryAmount = config.housing_category_id ? plannedFor(config.housing_category_id) : 0
  const remainingAfterMortgage = combinedIncome - mortgagePayment - (totalPlanned - housingCategoryAmount)

  const hasIncome = combinedIncome > 0
  const hasPrice  = config.house_price > 0

  function patchConfig(patch) { setConfig(c => ({ ...c, ...patch })) }

  function updateIncome(i, patch) {
    setConfig(c => ({ ...c, incomes: c.incomes.map((inc, idx) => idx === i ? { ...inc, ...patch } : inc) }))
  }
  function addIncome() {
    setConfig(c => ({ ...c, incomes: [...c.incomes, { label: 'Income', amount: 0 }] }))
  }
  function removeIncome(i) {
    setConfig(c => ({ ...c, incomes: c.incomes.filter((_, idx) => idx !== i) }))
  }

  async function save(nextStatus) {
    setSaving(true)
    const status = nextStatus ?? goal.status
    const payload = {
      name,
      config,
      status,
      started_at: status === 'active' && !goal.started_at ? new Date().toISOString() : goal.started_at,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('goals').update(payload).eq('id', goal.id).select().single()
    setSaving(false)
    if (error) { console.error('goals update error:', error); return }
    onSaved(data)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  // Autosave: debounce any edit to name/config so a reload never loses input,
  // without writing to the DB on every keystroke. Skips the very first render
  // (the mount sets local state from `goal`, which is already saved).
  const isFirstRun = useRef(true)
  const saveTimer  = useRef(null)
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return }
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { save() }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [name, config])

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <input value={name} onChange={e => setName(e.target.value)}
          className="bg-transparent text-2xl font-bold text-white outline-none border-b border-transparent focus:border-white/20 transition-colors" />
        <button onClick={() => onDelete(goal.id)}
          className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Hero summary */}
      <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
        {!hasIncome || !hasPrice ? (
          <p className="text-sm text-muted">Add your income (step 1) and a target house price (step 4) to see your timeline.</p>
        ) : monthlySavings <= 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-alert)' }}>
            You're not saving anything at this rate — lower planned spending in step 2 to see a timeline.
          </p>
        ) : timeline.totalMonths <= 0 ? (
          <span className="text-3xl font-bold text-white">You're ready now 🎉</span>
        ) : (
          <>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold text-white">Ready in {monthsLabel(timeline.totalMonths)}</span>
              <span className="text-sm text-muted">saving {fmt(monthlySavings)}/mo</span>
            </div>
            <div className="flex w-full h-3 rounded-full overflow-hidden bg-white/[0.05]">
              <div style={{ width: `${(timeline.monthsToEmergencyFund / timeline.totalMonths) * 100}%`, background: 'var(--color-accent-2)' }} />
              <div style={{ width: `${(timeline.monthsToDownPayment / timeline.totalMonths) * 100}%`, background: 'var(--color-accent)' }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/40 flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-accent-2)' }} />
                Emergency fund · {monthsLabel(timeline.monthsToEmergencyFund)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-accent)' }} />
                Down payment · {monthsLabel(timeline.monthsToDownPayment)}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <div className="flex flex-col gap-5">

      {/* Step 1 — Income */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
        <StepHeader n={1}>Income</StepHeader>
        <div className="flex flex-col gap-2.5">
          {config.incomes.map((inc, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={inc.label} onChange={e => updateIncome(i, { label: e.target.value })}
                placeholder="Label" className={inputCls + ' flex-1'} />
              <div className="relative w-32 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
                <input type="number" min="0" value={inc.amount || ''}
                  onChange={e => updateIncome(i, { amount: Number(e.target.value) })}
                  className={inputCls} style={{ paddingLeft: '1.5rem' }} />
              </div>
              {config.incomes.length > 1 && (
                <button onClick={() => removeIncome(i)} className="p-1.5 text-white/25 hover:text-white/60 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addIncome} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors self-start">
            <Plus size={12} /> Add income
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className="text-xs text-muted">Combined net</span>
          <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--color-progress-bar)' }}>{fmt(combinedIncome)}</span>
        </div>
      </div>

      {/* Step 2 — Spending (breakdown + sliders merged) */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">
        <StepHeader n={2}>Spending</StepHeader>
        {mainCategories.length === 0 ? (
          <p className="text-[11px] text-muted py-2">No categories yet — add some in Settings.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {mainCategories.map(c => (
              <CategorySliderRow
                key={c.id}
                category={c}
                plannedAmount={plannedFor(c.id)}
                currentMonthSpend={currentByCategory[c.id] ?? 0}
                avgSpend={avgByCategory[c.id] ?? 0}
                fmt={fmt}
                onChange={v => patchConfig({ category_plan: { ...config.category_plan, [c.id]: v } })}
              />
            ))}
          </div>
        )}
        <div className="flex flex-col gap-1.5 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Total accounted for</span>
            <span className="font-semibold tabular-nums text-white">{fmt(totalPlanned)} / month</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Monthly savings</span>
            <span className="text-xl font-bold tabular-nums" style={{ color: monthlySavings >= 0 ? 'var(--color-progress-bar)' : 'var(--color-alert)' }}>
              {monthlySavings >= 0 ? '+' : ''}{fmt(monthlySavings)}/mo
            </span>
          </div>
        </div>
      </div>

      </div>
      <div className="flex flex-col gap-5">

      {/* Step 3 — Emergency fund */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
        <StepHeader n={3}>Emergency fund</StepHeader>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-40 shrink-0">Linked savings card</span>
          <select value={config.savings_card_id ?? ''} onChange={e => patchConfig({ savings_card_id: e.target.value || null })}
            className={inputCls}>
            <option value="">None</option>
            {cards.filter(c => c.type === 'savings').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-40 shrink-0">Months of expenses</span>
          <input type="range" min={1} max={12} step={1} value={config.emergency_fund_months}
            onChange={e => patchConfig({ emergency_fund_months: Number(e.target.value) })}
            className="flex-1 cursor-pointer" style={{ accentColor: 'var(--color-accent)' }} />
          <span className="text-sm tabular-nums text-white w-10 text-right">{config.emergency_fund_months}</span>
        </div>
        <div className="relative h-3 w-full rounded-full bg-white/8">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{
            width: `${emergencyTarget > 0 ? Math.min((currentSaved / emergencyTarget) * 100, 100) : 0}%`,
            background: 'var(--color-progress-bar)',
          }} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">{fmt(currentSaved)} saved of {fmt(emergencyTarget)} target</span>
          <span className="text-white/50">ETA: {monthsLabel(timeline.monthsToEmergencyFund)}</span>
        </div>
      </div>

      {/* Step 4 — Down payment */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
        <StepHeader n={4}>Down payment & closing costs</StepHeader>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-40 shrink-0">House price</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
            <input type="number" min="0" value={config.house_price || ''} placeholder="e.g. 250000"
              onChange={e => patchConfig({ house_price: Number(e.target.value) })}
              className={inputCls} style={{ paddingLeft: '1.5rem' }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DOWN_PAYMENT_PRESETS.map(p => (
            <button key={p.value} onClick={() => patchConfig({ down_payment_pct: p.value })}
              className="px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
              style={{
                borderColor: config.down_payment_pct === p.value ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.08)',
                color:       config.down_payment_pct === p.value ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.5)',
              }}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-40 shrink-0">Or custom %</span>
          <div className="relative w-28">
            <input type="number" min="0" max="100" step="0.5" value={config.down_payment_pct || ''}
              onChange={e => patchConfig({ down_payment_pct: Number(e.target.value) })}
              className={inputCls} style={{ paddingRight: '1.5rem' }} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">%</span>
          </div>
          {!DOWN_PAYMENT_PRESETS.some(p => p.value === config.down_payment_pct) && (
            <span className="text-[11px] text-white/25">custom value</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-40 shrink-0">Closing costs (% of price)</span>
          <input type="number" min="0" step="0.5" value={config.closing_cost_pct || ''}
            onChange={e => patchConfig({ closing_cost_pct: Number(e.target.value) })}
            className={inputCls + ' w-24'} />
          <span className="text-[11px] text-white/25">notary + registration, editable estimate</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Down payment + closing costs</span>
            <span className="text-white font-semibold tabular-nums">{fmt(downPaymentTarget)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">ETA (after emergency fund)</span>
            <span className="text-white/50">{monthsLabel(timeline.monthsToDownPayment)}</span>
          </div>
        </div>
      </div>

      {/* Step 5 — Mortgage */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
        <StepHeader n={5}>Mortgage estimate</StepHeader>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-40 shrink-0">Loan amount</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
            <input type="number" min="0" value={loanAmount ? Math.round(loanAmount) : ''}
              onChange={e => patchConfig({ loan_amount_override: Number(e.target.value) })}
              className={inputCls} style={{ paddingLeft: '1.5rem' }} />
          </div>
          {config.loan_amount_override != null && (
            <button onClick={() => patchConfig({ loan_amount_override: null })}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors shrink-0">
              Reset to auto
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted shrink-0">Rate %</span>
            <input type="number" min="0" step="0.1" value={config.mortgage_rate_pct || ''}
              onChange={e => patchConfig({ mortgage_rate_pct: Number(e.target.value) })}
              className={inputCls} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted shrink-0">Years</span>
            <input type="number" min="1" step="1" value={config.mortgage_years || ''}
              onChange={e => patchConfig({ mortgage_years: Number(e.target.value) })}
              className={inputCls} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-40 shrink-0">Replaces current</span>
          <select value={config.housing_category_id ?? ''} onChange={e => patchConfig({ housing_category_id: e.target.value || null })}
            className={inputCls}>
            <option value="">None</option>
            {mainCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted">Monthly repayment</span>
            <span className="text-lg font-bold tabular-nums text-white">{fmt(mortgagePayment)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted">Remaining for living + saving</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: remainingAfterMortgage >= 0 ? 'var(--color-progress-bar)' : 'var(--color-alert)' }}>
              {fmt(remainingAfterMortgage)}
            </span>
          </div>
        </div>
      </div>

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
  )
}
