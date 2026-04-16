import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { TrendingUp, AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react'

const EMPTY = {
  monthly_income: '', employment_type: 'employed',
  rent: '', loan_repayments: '', subscriptions: '', insurance: '',
  groceries: '', transport: '', dining: '', other_variable: '',
  monthly_savings: '', monthly_investments: '',
  total_savings: '', total_investments: '',
}

const EMPLOYMENT_OPTIONS = [
  ['employed',     'Employed'],
  ['self_employed','Self-employed'],
  ['freelance',    'Freelance'],
  ['student',      'Student'],
  ['retired',      'Retired'],
  ['other',        'Other'],
]

// ── Health calculation ─────────────────────────────────────────────
function calcHealth(v) {
  const income      = Number(v.monthly_income)    || 0
  if (!income) return null
  const rent        = Number(v.rent)              || 0
  const loan        = Number(v.loan_repayments)   || 0
  const subs        = Number(v.subscriptions)     || 0
  const insurance   = Number(v.insurance)         || 0
  const groceries   = Number(v.groceries)         || 0
  const transport   = Number(v.transport)         || 0
  const dining      = Number(v.dining)            || 0
  const otherVar    = Number(v.other_variable)    || 0
  const savings     = Number(v.monthly_savings)   || 0
  const investments = Number(v.monthly_investments) || 0
  const totSavings  = Number(v.total_savings)     || 0
  const totInv      = Number(v.total_investments) || 0

  const fixed    = rent + loan + subs + insurance
  const variable = groceries + transport + dining + otherVar
  const totalExp = fixed + variable
  const totalOut = totalExp + savings + investments
  const cashFlow = income - totalOut
  const savingsRate   = (savings + investments) / income
  const expenseRatio  = totalExp / income
  const emergencyMos  = totalExp > 0 ? totSavings / totalExp : 0

  // Score 0–100
  let score = 0
  if (savingsRate >= 0.20) score += 30
  else if (savingsRate >= 0.15) score += 22
  else if (savingsRate >= 0.10) score += 15
  else if (savingsRate >= 0.05) score += 8
  if (emergencyMos >= 6) score += 25
  else if (emergencyMos >= 3) score += 18
  else if (emergencyMos >= 1) score += 8
  if (expenseRatio < 0.50) score += 25
  else if (expenseRatio < 0.60) score += 20
  else if (expenseRatio < 0.70) score += 14
  else if (expenseRatio < 0.80) score += 8
  else if (expenseRatio < 0.90) score += 3
  if (investments / income >= 0.10) score += 20
  else if (investments / income >= 0.05) score += 13
  else if (investments > 0) score += 6

  // Advice
  const advice = []
  if (savingsRate < 0.20) {
    const gap = Math.max(0, Math.round(income * 0.20 - savings - investments))
    advice.push({ kind: 'warning', title: 'Boost your savings rate', body: `You're saving ${Math.round(savingsRate * 100)}% of income. Aim for 20% — that's €${gap} more per month.`, gain: gap })
  }
  if (emergencyMos < 3) {
    const need = Math.max(0, Math.round(totalExp * 3 - totSavings))
    advice.push({ kind: 'alert', title: 'Build an emergency fund', body: `You have ${emergencyMos.toFixed(1)} months of expenses saved. Target 3 months — you need €${need} more.`, gain: 0 })
  }
  if (dining > income * 0.12) {
    const cut = Math.round(dining * 0.25)
    advice.push({ kind: 'info', title: 'Trim dining & leisure', body: `Dining is ${Math.round(dining / income * 100)}% of income. Cutting 25% frees up €${cut}/mo (€${cut * 12}/yr).`, gain: cut })
  }
  if (!investments) {
    advice.push({ kind: 'info', title: 'Start investing', body: 'Even €50/month in a low-cost index fund compounds meaningfully over time.', gain: 0 })
  }
  if (loan > income * 0.35) {
    advice.push({ kind: 'alert', title: 'High debt burden', body: `Loan repayments are ${Math.round(loan / income * 100)}% of income. Recommended maximum is 35%.`, gain: 0 })
  }
  if (advice.length === 0) {
    advice.push({ kind: 'success', title: 'Looking great!', body: 'Your savings rate, expense ratio, and emergency fund all look healthy. Keep it up.', gain: 0 })
  }

  // Optimized scenario: apply the monthly gains from advice
  const extraPerMonth = advice.reduce((s, a) => s + a.gain, 0)
  const curMonthly    = savings + investments
  const optMonthly    = curMonthly + extraPerMonth
  const startWealth   = totSavings + totInv

  const projection = Array.from({ length: 25 }, (_, i) => ({
    label: i === 0 ? 'Now' : `M${i}`,
    current:   Math.round(startWealth + curMonthly * i),
    optimized: Math.round(startWealth + optMonthly * i),
  }))

  return {
    score, savingsRate, expenseRatio, cashFlow, emergencyMos,
    fixed, variable, savings, investments, income, totalExp,
    advice, projection, curMonthly, optMonthly, extraPerMonth,
  }
}

function scoreColor(s) {
  if (s >= 75) return '#22c55e'
  if (s >= 50) return '#f59e0b'
  return '#ef4444'
}

const ADVICE_ICON = { alert: AlertTriangle, warning: Lightbulb, info: Info, success: CheckCircle }
const ADVICE_COLOR = { alert: '#ef4444', warning: '#f59e0b', info: '#93b5c6', success: '#22c55e' }

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/20'
const sel = `${inp} appearance-none`

function Field({ label, value, onChange, placeholder = '0' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-white/40">{label}</label>
      <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className={inp} />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{title}</p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────
export default function FinancialSituationTab() {
  const { user }    = useAuth()
  const { fmt }     = usePreferences()
  const [vals, setVals] = useState(EMPTY)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('financial_situation')
          .eq('user_id', user.id)
          .maybeSingle()
        if (data?.financial_situation) setVals({ ...EMPTY, ...data.financial_situation })
      } catch {}
      // fallback: localStorage
      try {
        const local = JSON.parse(localStorage.getItem(`fin-situation-${user.id}`))
        if (local) setVals({ ...EMPTY, ...local })
      } catch {}
    }
    load()
  }, [user?.id])

  function set(key) { return val => setVals(prev => ({ ...prev, [key]: val })) }

  async function save() {
    localStorage.setItem(`fin-situation-${user.id}`, JSON.stringify(vals))
    await supabase.from('user_preferences')
      .upsert({ user_id: user.id, financial_situation: vals }, { onConflict: 'user_id' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const health = useMemo(() => calcHealth(vals), [vals])

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full lg:overflow-hidden">

      {/* ── Left: Form ── */}
      <div className="lg:w-[420px] lg:shrink-0 flex flex-col gap-5 lg:overflow-y-auto scrollbar-thin pr-1">

        <Section title="Income & Job">
          <Field label="Monthly net income (€)" value={vals.monthly_income} onChange={set('monthly_income')} />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-white/40">Employment type</label>
            <select value={vals.employment_type} onChange={e => set('employment_type')(e.target.value)} className={sel}>
              {EMPLOYMENT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </Section>

        <Section title="Fixed Expenses">
          <Field label="Rent / mortgage (€)"  value={vals.rent}            onChange={set('rent')} />
          <Field label="Loan repayments (€)"  value={vals.loan_repayments} onChange={set('loan_repayments')} />
          <Field label="Subscriptions (€)"    value={vals.subscriptions}   onChange={set('subscriptions')} />
          <Field label="Insurance (€)"        value={vals.insurance}       onChange={set('insurance')} />
        </Section>

        <Section title="Variable Expenses">
          <Field label="Groceries (€)"         value={vals.groceries}     onChange={set('groceries')} />
          <Field label="Transport (€)"         value={vals.transport}     onChange={set('transport')} />
          <Field label="Dining out / leisure (€)" value={vals.dining}    onChange={set('dining')} />
          <Field label="Other variable (€)"    value={vals.other_variable} onChange={set('other_variable')} />
        </Section>

        <Section title="Savings & Assets">
          <Field label="Monthly savings (€)"       value={vals.monthly_savings}    onChange={set('monthly_savings')} />
          <Field label="Monthly investments (€)"   value={vals.monthly_investments} onChange={set('monthly_investments')} />
          <Field label="Total savings balance (€)" value={vals.total_savings}       onChange={set('total_savings')} />
          <Field label="Total investments value (€)" value={vals.total_investments} onChange={set('total_investments')} />
        </Section>

        <button onClick={save}
          className="self-start px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: saved ? '#22c55e22' : 'rgba(255,255,255,0.08)', color: saved ? '#22c55e' : 'white', border: `1px solid ${saved ? '#22c55e44' : 'rgba(255,255,255,0.1)'}` }}>
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      {/* ── Right: Financial Health ── */}
      <div className="flex-1 flex flex-col gap-4 lg:overflow-y-auto scrollbar-thin min-w-0">
        {!health ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-white/30">Enter your monthly income to see your financial health.</p>
          </div>
        ) : (<>

          {/* Score + Cash flow row */}
          <div className="flex gap-3">
            {/* Score */}
            <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-1 w-28 shrink-0">
              <span className="text-[10px] text-white/35 uppercase tracking-wider">Score</span>
              <span className="text-4xl font-bold tabular-nums" style={{ color: scoreColor(health.score) }}>{health.score}</span>
              <span className="text-[10px] text-white/30">/100</span>
            </div>

            {/* Cash flow breakdown */}
            <div className="glass-card rounded-2xl p-4 flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                { label: 'Income',        val: health.income,    color: '#22c55e' },
                { label: 'Fixed costs',   val: health.fixed,     color: 'var(--color-alert)' },
                { label: 'Variable',      val: health.variable,  color: 'var(--color-warning)' },
                { label: 'Saving/invest', val: health.savings + health.investments, color: '#3b82f6' },
                { label: 'Cash left',     val: health.cashFlow,  color: health.cashFlow >= 0 ? '#22c55e' : '#ef4444' },
                { label: 'Savings rate',  val: null, label2: `${Math.round(health.savingsRate * 100)}%`, color: health.savingsRate >= 0.20 ? '#22c55e' : '#f59e0b' },
              ].map(({ label, val, label2, color }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-white/40">{label}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color }}>
                    {label2 ?? fmt(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Advice cards */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Advice</p>
            {health.advice.map((a, i) => {
              const Icon = ADVICE_ICON[a.kind]
              const color = ADVICE_COLOR[a.kind]
              return (
                <div key={i} className="glass-card rounded-xl p-3 flex items-start gap-3"
                  style={{ borderLeft: `3px solid ${color}40` }}>
                  <Icon size={14} style={{ color }} className="shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/80">{a.title}</p>
                    <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">{a.body}</p>
                  </div>
                  {a.gain > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: '#22c55e18', color: '#22c55e' }}>
                      +{fmt(a.gain)}/mo
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Projection chart */}
          {health.curMonthly > 0 && (
            <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-white/30">24-month wealth projection</p>
                {health.extraPerMonth > 0 && (
                  <span className="text-[10px] text-white/40">
                    Optimized: <span style={{ color: '#22c55e' }}>+{fmt(health.extraPerMonth)}/mo</span>
                  </span>
                )}
              </div>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={health.projection} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradOpt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCur" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#93b5c6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#93b5c6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false}
                      interval={5} />
                    <YAxis tickFormatter={v => `€${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                      tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }}
                      formatter={(val, name) => [fmt(val), name === 'optimized' ? 'Optimized' : 'Current']}
                      labelFormatter={l => l}
                    />
                    {health.extraPerMonth > 0 && (
                      <Area type="monotone" dataKey="optimized" stroke="#22c55e" strokeWidth={1.5}
                        fill="url(#gradOpt)" dot={false} />
                    )}
                    <Area type="monotone" dataKey="current" stroke="#93b5c6" strokeWidth={1.5}
                      fill="url(#gradCur)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded" style={{ background: '#93b5c6' }} />
                  <span className="text-[10px] text-white/35">Current path</span>
                </div>
                {health.extraPerMonth > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded" style={{ background: '#22c55e' }} />
                    <span className="text-[10px] text-white/35">Optimized path</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </>)}
      </div>
    </div>
  )
}
