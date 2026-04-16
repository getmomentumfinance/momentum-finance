import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, TrendingUp, ShoppingCart, Sparkles, Home, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'

function calcBudget(income, rent) {
  if (!income || income <= 0) return null

  const rentPct   = rent / income
  const savings   = Math.round(income * 0.20)
  const remaining = income - rent - savings
  const needs     = Math.max(0, Math.round(remaining * 0.55))
  const wants     = Math.max(0, remaining - needs)

  const slices = [
    { label: 'Rent',    amount: rent,    pct: rent    / income, color: '#a78bfa' },
    { label: 'Savings', amount: savings, pct: savings / income, color: '#22c55e' },
    { label: 'Needs',   amount: needs,   pct: needs   / income, color: '#3b82f6' },
    { label: 'Wants',   amount: wants,   pct: wants   / income, color: '#f59e0b' },
  ]

  let rentStatus, rentColor
  if (rentPct < 0.25)      { rentStatus = 'Well within budget';          rentColor = '#22c55e' }
  else if (rentPct < 0.30) { rentStatus = 'Healthy range';               rentColor = '#22c55e' }
  else if (rentPct < 0.40) { rentStatus = 'A little high';               rentColor = '#f59e0b' }
  else                     { rentStatus = 'High — limits flexibility';    rentColor = '#ef4444' }

  const insights = []
  if (savings >= income * 0.20)
    insights.push({ Icon: CheckCircle2, color: '#22c55e', text: `You're saving ${Math.round(savings / income * 100)}% — on track for financial independence.` })
  else
    insights.push({ Icon: AlertTriangle, color: '#f59e0b', text: 'Try to save at least 20% of your income each month.' })

  insights.push({ Icon: ShoppingCart, color: '#3b82f6', text: `Budget ~€${needs}/mo for groceries, transport and utilities.` })
  insights.push({ Icon: Sparkles,     color: '#f59e0b', text: `Keep discretionary spending (dining, fun, shopping) under €${wants}/mo.` })

  if (rentPct > 0.35)
    insights.push({ Icon: Home, color: '#ef4444', text: 'Rent is above 35% of income. Consider ways to grow income or cut fixed costs.' })

  if (remaining > 0 && wants > 0)
    insights.push({ Icon: TrendingUp, color: '#a78bfa', text: `Investing your €${savings}/mo savings at 7%/yr could grow to €${Math.round(savings * 12 * 10 * 1.967).toLocaleString()} in 10 years.` })

  return { slices, rentStatus, rentColor, rentPct, savings, needs, wants, remaining, insights }
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/25 transition-colors placeholder:text-white/20 tabular-nums text-lg font-semibold'

export default function FinancialSituationTab() {
  const { user }  = useAuth()
  const { fmt }   = usePreferences()
  const navigate  = useNavigate()

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
          setRent(data.financial_situation.rent ?? '')
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
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-2">

      {/* ── Inputs ── */}
      <div className="glass-card rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/35 uppercase tracking-widest">Monthly net income</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-semibold">€</span>
              <input type="number" min="0" value={income} onChange={e => setIncome(e.target.value)}
                placeholder="0" className={inputCls} style={{ paddingLeft: '1.75rem' }} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/35 uppercase tracking-widest">Monthly rent / mortgage</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-semibold">€</span>
              <input type="number" min="0" value={rent} onChange={e => setRent(e.target.value)}
                placeholder="0" className={inputCls} style={{ paddingLeft: '1.75rem' }} />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={save}
            className="px-5 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: saved ? '#22c55e18' : 'rgba(255,255,255,0.06)',
              color:      saved ? '#22c55e'   : 'rgba(255,255,255,0.45)',
              border:     `1px solid ${saved ? '#22c55e33' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {!budget && (
        <p className="text-center text-sm text-white/20 py-4">Enter your income to see a breakdown</p>
      )}

      {budget && (
        <>
          {/* ── Breakdown bar + rent badge ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs text-white/40">
                Rent · <strong style={{ color: budget.rentColor }}>{Math.round(budget.rentPct * 100)}% of income</strong>
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: `${budget.rentColor}18`, color: budget.rentColor }}>
                {budget.rentStatus}
              </span>
            </div>

            {/* Segmented bar */}
            <div className="flex h-8 w-full rounded-2xl overflow-hidden gap-px">
              {budget.slices.map(s => s.amount > 0 && (
                <div key={s.label} style={{ flex: s.amount, background: s.color }} />
              ))}
            </div>

            {/* Slice legend — horizontal */}
            <div className="grid grid-cols-4 gap-2">
              {budget.slices.map(s => (
                <div key={s.label} className="flex flex-col gap-1 px-3 py-2.5 glass-card rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[10px] text-white/35 uppercase tracking-wider truncate">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-white">{fmt(s.amount)}</span>
                  <span className="text-[10px] text-white/25">{Math.round(s.pct * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Insights ── */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-white/25 uppercase tracking-widest px-0.5">Insights</p>
            {budget.insights.map(({ Icon, color, text }, i) => (
              <div key={i} className="flex items-start gap-3 glass-card rounded-xl px-4 py-3">
                <Icon size={14} className="shrink-0 mt-0.5" style={{ color }} />
                <p className="text-xs text-white/55 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* ── Budget CTAs ── */}
          {(budget.needs > 0 || budget.wants > 0) && (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] text-white/25 uppercase tracking-widest px-0.5">Create suggested budgets</p>
              <div className="grid grid-cols-2 gap-3">
                {budget.needs > 0 && (
                  <button
                    onClick={() => navigate(`/budgets?new=1&name=Essentials&limit=${budget.needs}&dim=all`)}
                    className="group flex flex-col gap-2 rounded-2xl px-5 py-4 text-left transition-all"
                    style={{ background: '#3b82f612', border: '1px solid #3b82f625' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#3b82f620'}
                    onMouseLeave={e => e.currentTarget.style.background = '#3b82f612'}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: '#3b82f6' }}>Essentials</span>
                      <ArrowRight size={13} style={{ color: '#3b82f6' }} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <span className="text-2xl font-bold tabular-nums text-white">{fmt(budget.needs)}</span>
                    <span className="text-[10px] text-white/30">groceries · transport · bills</span>
                  </button>
                )}
                {budget.wants > 0 && (
                  <button
                    onClick={() => navigate(`/budgets?new=1&name=Wants&limit=${budget.wants}&dim=all`)}
                    className="group flex flex-col gap-2 rounded-2xl px-5 py-4 text-left transition-all"
                    style={{ background: '#f59e0b12', border: '1px solid #f59e0b25' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f59e0b20'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f59e0b12'}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Discretionary</span>
                      <ArrowRight size={13} style={{ color: '#f59e0b' }} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <span className="text-2xl font-bold tabular-nums text-white">{fmt(budget.wants)}</span>
                    <span className="text-[10px] text-white/30">dining · fun · shopping</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
