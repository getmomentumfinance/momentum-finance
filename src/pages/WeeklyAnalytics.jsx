import { useState, useMemo, useEffect } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, CreditCard } from 'lucide-react'
import Navbar from '../components/dashboard/Navbar'
import { useTransactions } from '../hooks/useTransactions'
import { useSharedData } from '../context/SharedDataContext'
import { useThemeColors } from '../hooks/useThemeColors'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { usePreferences } from '../context/UserPreferencesContext'

const GRID  = 'rgba(255,255,255,0.04)'
const MUTED = 'rgba(255,255,255,0.35)'
const FALLBACK_COLORS = ['#a78bfa','#60a5fa','#4ade80','#f87171','#fb923c','#facc15','#94a3b8']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonday(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
}

function isoDate(d) { return d.toISOString().slice(0, 10) }

function midColor(colorValue) {
  if (!colorValue) return undefined
  const stops = [...colorValue.matchAll(/#[0-9a-fA-F]{6}/gi)].map(m => m[0])
  if (stops.length === 0) return colorValue
  if (stops.length === 1) return stops[0]
  if (stops.length === 2) {
    const parse = s => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)]
    const [r1,g1,b1] = parse(stops[0])
    const [r2,g2,b2] = parse(stops[1])
    return '#' + [Math.round((r1+r2)/2), Math.round((g1+g2)/2), Math.round((b1+b2)/2)]
      .map(v => v.toString(16).padStart(2,'0')).join('')
  }
  return stops[Math.floor(stops.length / 2)]
}

function FilteredTooltip({ active, payload, label }) {
  const { fmt } = usePreferences()
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value != null && Number(p.value) !== 0)
  if (!items.length) return null
  return (
    <div style={{ background: 'var(--color-dash-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12, padding: '8px 12px' }}>
      {label != null && <p style={{ color: MUTED, marginBottom: 4, fontSize: 11 }}>{label}</p>}
      {items.map((p, i) => (
        <p key={i} style={{ color: '#fff', padding: '1px 0' }}>
          <span style={{ color: p.color }}>{p.name}</span>{': '}{fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

function DeltaBadge({ current, prev }) {
  if (!prev && prev !== 0) return null
  const diff = current - prev
  const pctDiff = prev !== 0 ? Math.abs((diff / prev) * 100) : null
  const isUp = diff > 0, isDown = diff < 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
      isUp ? 'bg-red-500/15 text-red-400' : isDown ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-white/40'
    }`}>
      {isUp ? <TrendingUp size={10} /> : isDown ? <TrendingDown size={10} /> : <Minus size={10} />}
      {pctDiff != null ? `${pctDiff.toFixed(0)}%` : '—'}
    </span>
  )
}

function BudgetBar({ pct, color, height = 1.5 }) {
  const bg = pct >= 100 ? 'var(--color-alert)' : pct >= 80 ? 'var(--color-warning)' : (color || 'var(--color-progress-bar)')
  return (
    <div className={`h-${height === 1.5 ? '1.5' : '2'} bg-white/10 rounded-full overflow-hidden`} style={{ height }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: bg }} />
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function WeeklyAnalytics() {
  const { user } = useAuth()
  const { fmt, fmtK } = usePreferences()
  const { transactions } = useTransactions()
  const { categoryMap } = useSharedData()
  const colors = useThemeColors()

  // ── Week state ─────────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 6); return d
  }, [weekStart])

  const prevWeekStart = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7); return d
  }, [weekStart])
  const prevWeekEnd = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() - 1); return d
  }, [weekStart])

  const weekStartStr = isoDate(weekStart)
  const weekEndStr   = isoDate(weekEnd)
  const prevStartStr = isoDate(prevWeekStart)
  const prevEndStr   = isoDate(prevWeekEnd)
  const today        = isoDate(new Date())
  const isCurrentWeek = weekStartStr <= today && weekEndStr >= today

  const navigateWeek = (dir) => {
    setWeekStart(p => { const d = new Date(p); d.setDate(d.getDate() + dir * 7); return d })
  }

  // ── Remote data ────────────────────────────────────────────────
  const [budgets, setBudgets] = useState([])
  const [cardMap, setCardMap] = useState({})

  useEffect(() => {
    if (!user?.id) return
    supabase.from('budgets')
      .select('id, monthly_limit, period, category_id, subcategory_id, importance, card_id')
      .eq('user_id', user.id)
      .then(({ data }) => { if (data) setBudgets(data) })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('cards').select('id, name').eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setCardMap(Object.fromEntries(data.map(c => [c.id, c])))
      })
  }, [user?.id])

  // ── Transaction filters ────────────────────────────────────────
  const weekTxs     = useMemo(() => transactions.filter(t => t.date >= weekStartStr && t.date <= weekEndStr && !t.is_split_parent), [transactions, weekStartStr, weekEndStr])
  const prevWeekTxs = useMemo(() => transactions.filter(t => t.date >= prevStartStr && t.date <= prevEndStr && !t.is_split_parent), [transactions, prevStartStr, prevEndStr])

  const weekExpenses = useMemo(() => weekTxs.filter(t => t.type === 'expense'), [weekTxs])
  const weekIncome   = useMemo(() => weekTxs.filter(t => t.type === 'income'),  [weekTxs])
  const prevExpenses = useMemo(() => prevWeekTxs.filter(t => t.type === 'expense'), [prevWeekTxs])
  const prevIncome   = useMemo(() => prevWeekTxs.filter(t => t.type === 'income'),  [prevWeekTxs])

  const totalExpenses    = useMemo(() => weekExpenses.reduce((s, t) => s + Number(t.amount), 0), [weekExpenses])
  const totalIncome      = useMemo(() => weekIncome.reduce((s, t) => s + Number(t.amount), 0),   [weekIncome])
  const prevTotalExpenses = useMemo(() => prevExpenses.reduce((s, t) => s + Number(t.amount), 0), [prevExpenses])
  const prevTotalIncome   = useMemo(() => prevIncome.reduce((s, t) => s + Number(t.amount), 0),   [prevIncome])

  // ── Budget summary ─────────────────────────────────────────────
  const budgetSummary = useMemo(() => {
    const global = budgets.filter(b => !b.category_id && !b.subcategory_id && !b.importance && b.monthly_limit > 0)
    const monthly = global.find(b => (b.period ?? 'monthly') === 'monthly')
    const weekly  = global.find(b => b.period === 'weekly')

    // Count Mon–Sun weeks in the month of weekStart
    const y = weekStart.getFullYear(), m = weekStart.getMonth()
    let cnt = 0, ws = getMonday(new Date(y, m, 1))
    while (ws <= new Date(y, m + 1, 0)) { cnt++; ws = new Date(ws); ws.setDate(ws.getDate() + 7) }

    const weekLimit = weekly?.monthly_limit ?? (monthly ? monthly.monthly_limit / (cnt || 1) : null)
    const pctUsed   = weekLimit ? (totalExpenses / weekLimit) * 100 : null

    const catBudgets = budgets.filter(b => b.category_id && b.monthly_limit > 0 && (b.period ?? 'monthly') === 'monthly')
    const catItems = catBudgets.map(b => {
      const alloc  = b.monthly_limit / (cnt || 1)
      const spent  = weekExpenses.filter(t => t.category_id === b.category_id).reduce((s, t) => s + Number(t.amount), 0)
      return {
        id:    b.id,
        name:  categoryMap[b.category_id]?.name ?? 'Unknown',
        color: midColor(categoryMap[b.category_id]?.color),
        alloc, spent,
        pct:   alloc ? (spent / alloc) * 100 : 0,
      }
    }).sort((a, b) => b.pct - a.pct)

    return { weekLimit, pctUsed, catItems }
  }, [budgets, weekStart, totalExpenses, weekExpenses, categoryMap])

  // ── Day breakdown ──────────────────────────────────────────────
  const dayData = useMemo(() => DOW.map((label, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i)
    const ds = isoDate(d)
    const dayTxs = weekTxs.filter(t => t.date === ds)
    return {
      label, date: ds,
      expense:  dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      income:   dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
      savings:  dayTxs.filter(t => t.type === 'savings_out').reduce((s, t) => s + Number(t.amount), 0),
      count:    dayTxs.filter(t => t.type === 'expense').length,
      isToday:  ds === today,
      isFuture: ds > today,
    }
  }), [weekTxs, weekStart, today])

  // ── Category breakdown ─────────────────────────────────────────
  const categoryData = useMemo(() => {
    const totals = {}
    weekExpenses.forEach(t => {
      if (!t.category_id) return
      totals[t.category_id] = (totals[t.category_id] || 0) + Number(t.amount)
    })
    return Object.entries(totals)
      .sort(([,a],[,b]) => b - a)
      .map(([id, amount], i) => ({
        id, amount,
        name:  categoryMap[id]?.name  ?? 'Other',
        color: midColor(categoryMap[id]?.color) || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        pct:   totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
  }, [weekExpenses, categoryMap, totalExpenses])

  // ── Subcategory breakdown ──────────────────────────────────────
  const subcategoryData = useMemo(() => {
    const totals = {}
    weekExpenses.forEach(t => {
      const id = t.subcategory_id || t.category_id
      if (!id) return
      totals[id] = (totals[id] || 0) + Number(t.amount)
    })
    return Object.entries(totals)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 10)
      .map(([id, amount], i) => ({
        id, amount,
        name:  categoryMap[id]?.name  ?? 'Other',
        color: midColor(categoryMap[id]?.color) || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        pct:   totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
  }, [weekExpenses, categoryMap, totalExpenses])

  // ── Card breakdown ─────────────────────────────────────────────
  const cardData = useMemo(() => {
    const totals = {}
    weekExpenses.forEach(t => {
      if (!t.card_id) return
      totals[t.card_id] = (totals[t.card_id] || 0) + Number(t.amount)
    })
    return Object.entries(totals)
      .sort(([,a],[,b]) => b - a)
      .map(([id, amount], i) => ({
        id, amount,
        name: cardMap[id]?.name ?? 'Unknown card',
        pct:  totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        color: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }))
  }, [weekExpenses, cardMap, totalExpenses])

  // ── Top transactions ───────────────────────────────────────────
  const topTransactions = useMemo(() =>
    [...weekExpenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 12),
    [weekExpenses]
  )

  // ── Week-over-week by category ─────────────────────────────────
  const wowData = useMemo(() => {
    const curr = {}, prev = {}
    weekExpenses.forEach(t => { if (t.category_id) curr[t.category_id] = (curr[t.category_id] || 0) + Number(t.amount) })
    prevExpenses.forEach(t => { if (t.category_id) prev[t.category_id] = (prev[t.category_id] || 0) + Number(t.amount) })
    const ids = new Set([...Object.keys(curr), ...Object.keys(prev)])
    return [...ids]
      .map(id => ({
        name:    categoryMap[id]?.name ?? 'Other',
        color:   midColor(categoryMap[id]?.color) || FALLBACK_COLORS[0],
        current: curr[id] || 0,
        prev:    prev[id] || 0,
      }))
      .sort((a, b) => b.current - a.current)
      .slice(0, 8)
  }, [weekExpenses, prevExpenses, categoryMap])

  // ── Historical day-of-week pattern (last 12 weeks) ─────────────
  const dowPattern = useMemo(() => {
    const cutoff = new Date(weekStart); cutoff.setDate(cutoff.getDate() - 84)
    const cutoffStr = isoDate(cutoff)
    const sums = Array(7).fill(0), counts = Array(7).fill(0)
    transactions.filter(t => t.type === 'expense' && !t.is_split_parent && t.date >= cutoffStr && t.date < weekStartStr)
      .forEach(t => {
        const dow = (new Date(t.date + 'T12:00:00').getDay() + 6) % 7
        sums[dow] += Number(t.amount)
        counts[dow]++
      })
    return DOW.map((label, i) => ({
      label,
      avg: counts[i] > 0 ? sums[i] / counts[i] : 0,
      thisWeek: dayData[i]?.expense ?? 0,
    }))
  }, [transactions, weekStart, weekStartStr, dayData])

  // ── Receiver breakdown ─────────────────────────────────────────
  const receiverData = useMemo(() => {
    const totals = {}
    weekExpenses.forEach(t => {
      const k = t.receiver || t.description || '—'
      if (!k || k === '—') return
      totals[k] = (totals[k] || 0) + Number(t.amount)
    })
    return Object.entries(totals)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 8)
      .map(([name, amount]) => ({
        name, amount,
        pct: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
  }, [weekExpenses, totalExpenses])

  // ── Week label ─────────────────────────────────────────────────
  const weekLabel = useMemo(() => {
    const s = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const e = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${s} – ${e}`
  }, [weekStart, weekEnd])

  const net = totalIncome - totalExpenses

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Navbar currentDate={weekStart} onPrev={() => navigateWeek(-1)} onNext={() => navigateWeek(1)} />

      <div id="page-content" className="px-4 md:px-6 pb-24 md:pb-12 space-y-5 max-w-screen-xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-bold">Weekly Analytics</h1>
            <p className="text-sm text-white/40 mt-0.5">{weekLabel}</p>
          </div>
          {!isCurrentWeek && (
            <button onClick={() => setWeekStart(getMonday(new Date()))}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              Jump to this week
            </button>
          )}
        </div>

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-2">
            <p className="text-[10px] text-white/35 uppercase tracking-widest">Expenses</p>
            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: colors.expense }}>{fmt(totalExpenses, 0)}</p>
            <div className="flex items-center gap-2 mt-auto">
              <DeltaBadge current={totalExpenses} prev={prevTotalExpenses} />
              <span className="text-[10px] text-white/25">vs last week</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex flex-col gap-2">
            <p className="text-[10px] text-white/35 uppercase tracking-widest">Income</p>
            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: colors.income }}>{fmt(totalIncome, 0)}</p>
            <div className="flex items-center gap-2 mt-auto">
              <DeltaBadge current={totalIncome} prev={prevTotalIncome} />
              <span className="text-[10px] text-white/25">vs last week</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex flex-col gap-2">
            <p className="text-[10px] text-white/35 uppercase tracking-widest">Net</p>
            <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: net >= 0 ? colors.income : colors.expense }}>
              {net >= 0 ? '+' : '−'}{fmt(Math.abs(net), 0)}
            </p>
            <p className="text-[10px] text-white/25 mt-auto">{weekTxs.length} transaction{weekTxs.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="glass-card rounded-2xl p-4 flex flex-col gap-2">
            <p className="text-[10px] text-white/35 uppercase tracking-widest">Budget</p>
            {budgetSummary.weekLimit ? (
              <>
                <p className="text-2xl font-bold tabular-nums leading-none" style={{
                  color: (budgetSummary.pctUsed ?? 0) >= 100 ? colors.expense
                       : (budgetSummary.pctUsed ?? 0) >= 80  ? colors.cashOut
                       : colors.income,
                }}>
                  {Math.round(budgetSummary.pctUsed ?? 0)}%
                </p>
                <BudgetBar pct={budgetSummary.pctUsed ?? 0} height={4} />
                <p className="text-[10px] text-white/25 mt-auto">
                  {fmt(Math.max(0, budgetSummary.weekLimit - totalExpenses), 0)} left of {fmt(budgetSummary.weekLimit, 0)}
                </p>
              </>
            ) : (
              <p className="text-sm text-white/25 mt-1">No budget set</p>
            )}
          </div>
        </div>

        {/* ── Day breakdown ── */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Day-by-Day Breakdown</h2>
            <div className="flex items-center gap-4 text-[11px] text-white/35">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: colors.expense }} />Expenses
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: colors.income }} />Income
              </span>
            </div>
          </div>

          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData} barCategoryGap="25%" maxBarSize={30}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<FilteredTooltip />} cursor={false} />
                <Bar dataKey="expense" name="Expenses" radius={[3, 3, 0, 0]}>
                  {dayData.map((d, i) => (
                    <Cell key={i} fill={colors.expense} opacity={d.isFuture ? 0.15 : d.isToday ? 1 : 0.85} />
                  ))}
                </Bar>
                <Bar dataKey="income" name="Income" radius={[3, 3, 0, 0]}>
                  {dayData.map((d, i) => (
                    <Cell key={i} fill={colors.income} opacity={d.isFuture ? 0.15 : d.isToday ? 1 : 0.85} />
                  ))}
                </Bar>
                {budgetSummary.weekLimit && (
                  <ReferenceLine y={budgetSummary.weekLimit / 7}
                    stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value: 'Daily limit', position: 'insideTopRight', fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Day stat tiles */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {dayData.map(d => (
              <div key={d.label} className={`rounded-xl p-2 text-center ${
                d.isToday ? 'bg-white/[0.10] ring-1 ring-white/10' : 'bg-white/[0.03]'
              } ${d.isFuture ? 'opacity-30' : ''}`}>
                <p className={`text-[9px] uppercase tracking-wider mb-1.5 ${d.isToday ? 'text-white/60' : 'text-white/25'}`}>{d.label}</p>
                <p className="text-[11px] font-semibold tabular-nums leading-none" style={{ color: d.expense > 0 ? colors.expense : 'rgba(255,255,255,0.12)' }}>
                  {d.expense > 0 ? fmtK(d.expense) : '—'}
                </p>
                {d.income > 0 && (
                  <p className="text-[10px] tabular-nums mt-0.5 leading-none" style={{ color: colors.income }}>
                    +{fmtK(d.income)}
                  </p>
                )}
                {d.count > 0 && (
                  <p className="text-[9px] text-white/20 mt-1">{d.count} tx</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Category breakdown + Budget progress ── */}
        <div className="flex flex-col md:flex-row gap-5 md:items-start">

          {/* Category donut + list */}
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 flex-1">
            <h2 className="text-sm font-semibold">Spending by Category</h2>
            {categoryData.length === 0 ? (
              <p className="text-sm text-white/30 py-4">No expenses this week</p>
            ) : (
              <div className="flex gap-6 items-start">
                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="amount" cx="50%" cy="50%"
                        innerRadius="52%" outerRadius="78%" stroke="none">
                        {categoryData.map((d, i) => (
                          <Cell key={d.id} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => [fmt(v), '']}
                        contentStyle={{ background: 'var(--color-dash-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12 }}
                        itemStyle={{ color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  {categoryData.slice(0, 9).map((d, i) => (
                    <div key={d.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-[11px] text-white/60 flex-1 truncate">{d.name}</span>
                      <span className="text-[11px] font-semibold tabular-nums text-white/80">{fmt(d.amount, 0)}</span>
                      <span className="text-[10px] text-white/25 w-7 text-right shrink-0">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Budget progress panel */}
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-5 md:w-72 md:shrink-0">
            <h2 className="text-sm font-semibold">Budget Progress</h2>

            {budgetSummary.weekLimit ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/45">Weekly total</span>
                  <span className="text-[11px] font-semibold tabular-nums text-white/70">
                    {fmt(totalExpenses, 0)} / {fmt(budgetSummary.weekLimit, 0)}
                  </span>
                </div>
                <BudgetBar pct={(totalExpenses / budgetSummary.weekLimit) * 100} height={6} />
                <p className="text-[10px] text-white/25">
                  {Math.round((budgetSummary.pctUsed ?? 0))}% used · {fmt(Math.max(0, budgetSummary.weekLimit - totalExpenses), 0)} left
                </p>
              </div>
            ) : (
              <p className="text-xs text-white/25">No global budget — set one in the Budgets page.</p>
            )}

            {budgetSummary.catItems.length > 0 && (
              <>
                <div className="h-px bg-white/[0.07]" />
                <div className="flex flex-col gap-4">
                  {budgetSummary.catItems.map(b => (
                    <div key={b.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.color || 'rgba(255,255,255,0.3)' }} />
                          <span className="text-[11px] text-white/55 truncate">{b.name}</span>
                        </div>
                        <span className={`text-[10px] font-medium ${
                          b.pct >= 100 ? 'text-red-400' : b.pct >= 80 ? 'text-amber-400' : 'text-white/35'
                        }`}>{Math.round(b.pct)}%</span>
                      </div>
                      <BudgetBar pct={b.pct} color={b.color} height={4} />
                      <p className="text-[9px] text-white/20 tabular-nums">
                        {fmt(b.spent, 0)} / {fmt(b.alloc, 0)} weekly
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Subcategory breakdown ── */}
        {subcategoryData.length > 0 && (
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Subcategory Breakdown</h2>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subcategoryData} layout="vertical" barCategoryGap="20%" maxBarSize={18}>
                  <CartesianGrid horizontal={false} stroke={GRID} />
                  <XAxis type="number" tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={v => [fmt(v), '']}
                    contentStyle={{ background: 'var(--color-dash-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12 }}
                    itemStyle={{ color: '#fff' }} cursor={false} />
                  <Bar dataKey="amount" name="Spent" radius={[0, 3, 3, 0]}>
                    {subcategoryData.map((d, i) => (
                      <Cell key={d.id} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Top expenses ── */}
        {topTransactions.length > 0 && (
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Top Expenses This Week</h2>
            <div className="flex flex-col divide-y divide-white/[0.05]">
              {topTransactions.map((t, i) => {
                const cat  = categoryMap[t.category_id]
                const cat2 = categoryMap[t.subcategory_id]
                const card = t.card_id ? cardMap[t.card_id] : null
                const catColor = midColor(cat?.color)
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="text-[10px] text-white/20 w-5 tabular-nums text-right shrink-0">{i + 1}</span>

                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-white/80 truncate leading-snug">{t.description || '—'}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-white/25">{t.date}</span>
                        {cat && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md leading-none"
                            style={{ background: (catColor || '#6366f1') + '22', color: catColor || '#a78bfa' }}>
                            {cat.name}
                          </span>
                        )}
                        {cat2 && cat2.id !== cat?.id && (
                          <span className="text-[10px] text-white/30">{cat2.name}</span>
                        )}
                        {card && (
                          <span className="text-[10px] text-white/25 flex items-center gap-1">
                            <CreditCard size={9} />
                            {card.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[13px] font-bold tabular-nums shrink-0" style={{ color: colors.expense }}>
                      {fmt(t.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Card spending ── */}
        {cardData.length > 0 && (
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Spending by Card</h2>
            <div className="flex flex-col gap-2.5">
              {cardData.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white/[0.07] flex items-center justify-center shrink-0">
                    <CreditCard size={11} className="text-white/40" />
                  </div>
                  <span className="text-[12px] text-white/60 w-36 truncate shrink-0">{c.name}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${c.pct}%`, background: c.color }} />
                  </div>
                  <span className="text-[12px] font-semibold tabular-nums text-white/70 w-20 text-right shrink-0">{fmt(c.amount, 0)}</span>
                  <span className="text-[10px] text-white/25 w-7 text-right shrink-0">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Week-over-week by category ── */}
        {wowData.length > 0 && (
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold">Week-over-Week</h2>
              <p className="text-[11px] text-white/35 mt-0.5">Current week vs previous week by category</p>
            </div>
            <div className="flex flex-col gap-4">
              {wowData.map(d => {
                const maxVal = Math.max(d.current, d.prev, 0.01)
                const diff   = d.current - d.prev
                return (
                  <div key={d.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-[11px] text-white/60">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {diff !== 0 && (
                          <span className={`text-[10px] font-medium tabular-nums ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {diff > 0 ? '↑' : '↓'} {fmt(Math.abs(diff), 0)}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold tabular-nums text-white/70 w-16 text-right">{fmt(d.current, 0)}</span>
                      </div>
                    </div>
                    {/* This week bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-white/25 w-16 shrink-0">This week</span>
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(d.current / maxVal) * 100}%`, background: d.color }} />
                      </div>
                    </div>
                    {/* Previous week bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-white/25 w-16 shrink-0">Last week</span>
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(d.prev / maxVal) * 100}%`, background: d.color, opacity: 0.3 }} />
                      </div>
                      <span className="text-[9px] text-white/25 tabular-nums">{fmt(d.prev, 0)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Historical day-of-week pattern ── */}
        {dowPattern.some(d => d.avg > 0) && (
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold">Day-of-Week Pattern</h2>
              <p className="text-[11px] text-white/35 mt-0.5">Average daily spend (last 12 weeks) vs this week</p>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dowPattern} barCategoryGap="22%" maxBarSize={28}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<FilteredTooltip />} cursor={false} />
                  <Bar dataKey="avg" name="12-wk avg" fill={colors.barChart} radius={[3, 3, 0, 0]} opacity={0.45} />
                  <Bar dataKey="thisWeek" name="This week" fill={colors.expense} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-white/35">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full opacity-45" style={{ background: colors.barChart }} />12-wk avg
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: colors.expense }} />This week
              </span>
            </div>
          </div>
        )}

        {/* ── Top receivers / merchants ── */}
        {receiverData.length > 0 && (
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Top Merchants</h2>
            <div className="flex flex-col gap-2.5">
              {receiverData.map((r, i) => (
                <div key={r.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 text-[10px] font-bold text-white/30">
                    {i + 1}
                  </div>
                  <span className="text-[12px] text-white/65 flex-1 truncate">{r.name}</span>
                  <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }} />
                  </div>
                  <span className="text-[12px] font-semibold tabular-nums text-white/70 w-16 text-right shrink-0">{fmt(r.amount, 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
