import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/25 transition-colors placeholder:text-white/20 text-center tabular-nums text-lg font-semibold'

// Budget slices based on income and rent
function calcBudget(income, rent) {
  if (!income || income <= 0) return null

  const rentPct    = rent / income
  const savings    = Math.round(income * 0.20)           // always 20%
  const remaining  = income - rent - savings
  const needs      = Math.max(0, Math.round(remaining * 0.55))  // groceries, transport, bills
  const wants      = Math.max(0, remaining - needs)             // dining, fun, shopping

  const slices = [
    { label: 'Rent',     amount: rent,    pct: rent    / income, color: '#a78bfa' },
    { label: 'Savings',  amount: savings, pct: savings / income, color: '#22c55e' },
    { label: 'Needs',    amount: needs,   pct: needs   / income, color: '#3b82f6' },
    { label: 'Wants',    amount: wants,   pct: wants   / income, color: '#f59e0b' },
  ]

  // Rent health
  let rentStatus, rentColor
  if (rentPct < 0.25)      { rentStatus = 'Well within budget';         rentColor = '#22c55e' }
  else if (rentPct < 0.30) { rentStatus = 'Healthy range';              rentColor = '#22c55e' }
  else if (rentPct < 0.40) { rentStatus = 'A little high — watch spend'; rentColor = '#f59e0b' }
  else                     { rentStatus = 'High — limits flexibility';   rentColor = '#ef4444' }

  // Tips
  const tips = []
  if (savings >= income * 0.20) tips.push({ icon: '💰', text: `Save ${Math.round(savings / income * 100)}% of income — you're on track for financial independence.` })
  else tips.push({ icon: '⚠️', text: 'Try to save at least 20% of your income each month.' })
  tips.push({ icon: '🛒', text: `Budget ~€${needs} for essentials like groceries, transport and utilities.` })
  tips.push({ icon: '🎉', text: `Keep wants (dining, fun, shopping) to ~€${wants}/mo to stay on plan.` })
  if (rentPct > 0.35) tips.push({ icon: '🏠', text: 'Your rent is above 35% of income. Consider ways to increase income or reduce fixed costs.' })
  if (remaining > 0 && wants > 0) tips.push({ icon: '📈', text: `If you invest your savings at a 7% annual return, you'd have €${Math.round(savings * 12 * 10 * 1.967).toLocaleString()} after 10 years.` })

  return { slices, rentStatus, rentColor, rentPct, savings, needs, wants, remaining, tips }
}

export default function FinancialSituationTab() {
  const { user } = useAuth()
  const { fmt }  = usePreferences()

  const [income, setIncome] = useState('')
  const [rent,   setRent]   = useState('')
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      try {
        const { data } = await supabase
          .from('user_preferences').select('financial_situation')
          .eq('user_id', user.id).maybeSingle()
        if (data?.financial_situation) {
          setIncome(data.financial_situation.income ?? '')
          setRent(data.financial_situation.rent   ?? '')
          return
        }
      } catch {}
      try {
        const local = JSON.parse(localStorage.getItem(`fin-situation-${user.id}`))
        if (local) { setIncome(local.income ?? ''); setRent(local.rent ?? '') }
      } catch {}
    }
    load()
  }, [user?.id])

  async function save() {
    const payload = { income, rent }
    localStorage.setItem(`fin-situation-${user.id}`, JSON.stringify(payload))
    await supabase.from('user_preferences')
      .upsert({ user_id: user.id, financial_situation: payload }, { onConflict: 'user_id' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const budget = useMemo(() => calcBudget(Number(income), Number(rent)), [income, rent])

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-8 py-2">

      {/* Inputs */}
      <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/40 text-center uppercase tracking-widest">Monthly net income</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg font-semibold">€</span>
            <input type="number" min="0" value={income} onChange={e => setIncome(e.target.value)}
              placeholder="0" className={inp} style={{ paddingLeft: '2rem' }} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/40 text-center uppercase tracking-widest">Monthly rent / mortgage</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg font-semibold">€</span>
            <input type="number" min="0" value={rent} onChange={e => setRent(e.target.value)}
              placeholder="0" className={inp} style={{ paddingLeft: '2rem' }} />
          </div>
        </div>

        <button onClick={save}
          className="self-center px-6 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: saved ? '#22c55e22' : 'rgba(255,255,255,0.07)',
            color: saved ? '#22c55e' : 'rgba(255,255,255,0.6)',
            border: `1px solid ${saved ? '#22c55e44' : 'rgba(255,255,255,0.1)'}`,
          }}>
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      {/* Recommendation */}
      {budget && (
        <>
          {/* Rent status badge */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-white/35">Rent is <strong style={{ color: budget.rentColor }}>{Math.round(budget.rentPct * 100)}%</strong> of income</span>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: `${budget.rentColor}18`, color: budget.rentColor }}>
              {budget.rentStatus}
            </span>
          </div>

          {/* Visual bar */}
          <div className="flex flex-col gap-3">
            <div className="flex h-5 w-full rounded-xl overflow-hidden gap-px">
              {budget.slices.map(s => s.amount > 0 && (
                <div key={s.label} style={{ flex: s.amount, background: s.color }} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {budget.slices.map(s => (
                <div key={s.label} className="flex items-center gap-2.5 glass-card rounded-xl px-3 py-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-white/35 uppercase tracking-wider">{s.label}</span>
                    <span className="text-sm font-bold tabular-nums text-white">{fmt(s.amount)}</span>
                    <span className="text-[10px] text-white/25">{Math.round(s.pct * 100)}% of income</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="flex flex-col gap-2">
            {budget.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 glass-card rounded-xl px-4 py-3">
                <span className="text-base shrink-0 leading-tight">{tip.icon}</span>
                <p className="text-xs text-white/55 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {!budget && income === '' && (
        <p className="text-center text-sm text-white/20">Enter your income to get a recommendation</p>
      )}
    </div>
  )
}
