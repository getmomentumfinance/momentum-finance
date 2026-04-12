import { useState, useMemo, useEffect } from 'react'
import Navbar from '../components/dashboard/Navbar'
import { useTransactions } from '../hooks/useTransactions'
import { useSharedData } from '../context/SharedDataContext'
import { useThemeColors } from '../hooks/useThemeColors'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { usePreferences } from '../context/UserPreferencesContext'
import useCountUp from '../hooks/useCountUp'
import FadeIn from '../components/shared/FadeIn'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, PiggyBank, Percent, CreditCard } from 'lucide-react'

function midColor(v) {
  if (!v) return undefined
  const stops = [...v.matchAll(/#[0-9a-fA-F]{6}/gi)].map(m => m[0])
  if (!stops.length) return v
  if (stops.length === 1) return stops[0]
  if (stops.length === 2) {
    const p = s => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)]
    const [r1,g1,b1] = p(stops[0]), [r2,g2,b2] = p(stops[1])
    return '#' + [Math.round((r1+r2)/2), Math.round((g1+g2)/2), Math.round((b1+b2)/2)].map(x => x.toString(16).padStart(2,'0')).join('')
  }
  return stops[Math.floor(stops.length / 2)]
}

function getPeriodBounds(period, refDate, resetDay) {
  const y = refDate.getFullYear()
  const m = refDate.getMonth()
  if (period === 'weekly') {
    const startJsDow = ((resetDay ?? 0) + 1) % 7
    const dow  = refDate.getDay()
    const diff = (dow - startJsDow + 7) % 7
    const start = new Date(refDate)
    start.setDate(refDate.getDate() - diff)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { startStr: start.toISOString().slice(0, 10), endStr: end.toISOString().slice(0, 10) }
  }
  if (period === 'quarterly') {
    const q = Math.floor(m / 3)
    return {
      startStr: new Date(y, q * 3, 1).toISOString().slice(0, 10),
      endStr:   new Date(y, q * 3 + 3, 0).toISOString().slice(0, 10),
    }
  }
  if (period === 'yearly') {
    return { startStr: `${y}-01-01`, endStr: `${y}-12-31` }
  }
  const rd = resetDay ?? 1
  let sy = y, sm = m
  if (refDate.getDate() < rd) { sm--; if (sm < 0) { sm = 11; sy-- } }
  const nextStart = new Date(sy, sm + 1, rd)
  const end = new Date(nextStart.getTime() - 86400000)
  return {
    startStr: new Date(sy, sm, rd).toISOString().slice(0, 10),
    endStr:   end.toISOString().slice(0, 10),
  }
}

function getPeriodKey(frequency, date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  if (frequency === 'monthly')   return `${y}-${String(m).padStart(2, '0')}`
  if (frequency === 'quarterly') return `${y}-Q${Math.ceil(m / 3)}`
  return `${y}`
}

const SEVERITY_ORDER = { alert: 0, warning: 1, info: 2 }

export default function Summary() {
  const { user }                     = useAuth()
  const { fmt, fmtK, t }             = usePreferences()
  const { transactions }             = useTransactions()
  const { categoryMap, receiverMap } = useSharedData()
  const colors                       = useThemeColors()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [budgets,     setBudgets]     = useState([])
  const [yearExpenses, setYearExpenses] = useState([])
  const [categories,  setCategories]  = useState([])
  const [toPay,       setToPay]       = useState([])
  const [allSubs,     setAllSubs]     = useState([])
  const [allBills,    setAllBills]    = useState([])
  const [usage,       setUsage]       = useState({})

  // Fetch year expenses + categories + budgets (same query as Budgets.jsx)
  useEffect(() => {
    if (!user?.id) return
    const year  = currentDate.getFullYear()
    const start = `${year}-01-01`
    const end   = `${year}-12-31`
    Promise.all([
      supabase.from('transactions')
        .select('amount, category_id, subcategory_id, card_id, date')
        .eq('user_id', user.id).eq('is_deleted', false).eq('type', 'expense')
        .eq('is_split_parent', false).gte('date', start).lte('date', end),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('budgets').select('*').eq('user_id', user.id),
    ]).then(([{ data: txs }, { data: cats }, { data: bgets }]) => {
      setYearExpenses(txs  ?? [])
      setCategories(cats   ?? [])
      setBudgets(bgets     ?? [])
    })
  }, [user?.id, currentDate])

  useEffect(() => {
    if (!user?.id) return
    const today    = new Date(); today.setHours(0, 0, 0, 0)
    const y = today.getFullYear()
    const m = today.getMonth()
    const monthEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10)

    Promise.all([
      supabase.from('pending_items').select('id,name,amount,pay_before').eq('user_id', user.id).eq('status', 'pending'),
      supabase.from('planned_bills').select('id,name,amount,pay_before').eq('user_id', user.id).eq('status', 'pending').lte('pay_before', monthEnd),
      supabase.from('recurring_bills').select('id,name,amount,due_day,frequency,next_due_date').eq('user_id', user.id),
      supabase.from('subscriptions').select('id,name,amount,billing_day').eq('user_id', user.id).eq('status', 'active'),
    ]).then(async ([{ data: pending }, { data: planned }, { data: bills }, { data: subs }]) => {
      const items = []

      for (const p of pending ?? []) {
        const daysLeft = Math.round((new Date(p.pay_before + 'T00:00:00') - today) / 86400000)
        items.push({ id: `pending-${p.id}`, label: p.name, amount: p.amount,
          detail: daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `Due ${new Date(p.pay_before + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          severity: daysLeft <= 0 ? 'alert' : 'warning' })
      }
      for (const p of planned ?? []) {
        const daysLeft = Math.round((new Date(p.pay_before + 'T00:00:00') - today) / 86400000)
        items.push({ id: `planned-${p.id}`, label: p.name, amount: p.amount,
          detail: daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `Due ${new Date(p.pay_before + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          severity: daysLeft <= 0 ? 'alert' : 'warning' })
      }
      if (bills?.length) {
        const { data: billPayments } = await supabase.from('recurring_bill_payments').select('bill_id,period').in('bill_id', bills.map(b => b.id))
        for (const b of bills) {
          let dueDate
          let period
          if ((b.frequency === 'quarterly' || b.frequency === 'yearly') && b.next_due_date) {
            dueDate = new Date(b.next_due_date + 'T00:00:00')
            while (dueDate < today) {
              if (b.frequency === 'quarterly') dueDate.setMonth(dueDate.getMonth() + 3)
              else dueDate.setFullYear(dueDate.getFullYear() + 1)
            }
            // Period key matches RecurringBills.jsx: date string of the resolved due date
            period = dueDate.toISOString().slice(0, 10)
          } else {
            const lastDay = new Date(y, m + 1, 0).getDate()
            dueDate = new Date(y, m, Math.min(b.due_day, lastDay))
            period = getPeriodKey(b.frequency, today)
          }
          if ((billPayments ?? []).some(p => p.bill_id === b.id && p.period === period)) continue
          const daysLeft = Math.round((dueDate - today) / 86400000)
          items.push({ id: `bill-${b.id}`, label: b.name, amount: b.amount,
            detail: daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            severity: daysLeft <= 0 ? 'alert' : 'warning' })
        }
      }
      if (subs?.length) {
        const monthPeriod = getPeriodKey('monthly', today)
        const { data: subPayments } = await supabase.from('subscription_payments').select('subscription_id,period').in('subscription_id', subs.map(s => s.id))
        for (const s of subs) {
          if ((subPayments ?? []).some(p => p.subscription_id === s.id && p.period === monthPeriod)) continue
          const lastDay = new Date(y, m + 1, 0).getDate()
          const dueDate = new Date(y, m, Math.min(s.billing_day, lastDay))
          const daysLeft = Math.round((dueDate - today) / 86400000)
          items.push({ id: `sub-${s.id}`, label: s.name, amount: s.amount,
            detail: daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            severity: daysLeft < 0 ? 'alert' : daysLeft <= 3 ? 'warning' : 'info' })
        }
      }

      items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      setToPay(items)
    })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('subscriptions').select('id,name,amount').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('recurring_bills').select('id,name,amount,frequency').eq('user_id', user.id),
    ]).then(([{ data: subs }, { data: bills }]) => {
      setAllSubs(subs ?? [])
      setAllBills(bills ?? [])
    })
    try {
      setUsage(JSON.parse(localStorage.getItem(`sub-usage-${user.id}`)) ?? {})
    } catch {}
  }, [user?.id])

  function setUsageRating(key, rating) {
    setUsage(prev => {
      const next = { ...prev, [key]: prev[key] === rating ? null : rating }
      localStorage.setItem(`sub-usage-${user.id}`, JSON.stringify(next))
      return next
    })
  }

  const y = currentDate.getFullYear()
  const m = currentDate.getMonth()

  const monthTxs = useMemo(() => {
    const start = new Date(y, m, 1).toISOString().slice(0, 10)
    const end   = new Date(y, m + 1, 0).toISOString().slice(0, 10)
    return transactions.filter(t => t.date >= start && t.date <= end && !t.is_split_parent)
  }, [transactions, y, m])

  const expenses = useMemo(() => monthTxs.filter(t => t.type === 'expense'), [monthTxs])
  const income   = useMemo(() => monthTxs.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount), 0), [monthTxs])
  const expense  = useMemo(() => expenses.reduce((s,t) => s + Number(t.amount), 0), [expenses])
  const savings  = useMemo(() => {
    let net = 0
    monthTxs.filter(t => t.type === 'savings').forEach(t => {
      const a = Number(t.amount)
      if (a > 0) net += t.source === 'savings_out' ? -a : a
    })
    return net
  }, [monthTxs])

  const net         = income - expense
  const savingsRate = income > 0 ? (net / income) * 100 : null
  const rateColor   = savingsRate === null ? 'rgba(255,255,255,0.35)'
    : savingsRate >= 20 ? colors.income
    : savingsRate > 0   ? colors.warning
    : colors.expense

  // Donut data
  const categoryData = useMemo(() => {
    const map = {}
    expenses.filter(t => t.category_id).forEach(t => {
      const name  = categoryMap[t.category_id]?.name ?? 'Other'
      const color = midColor(categoryMap[t.category_id]?.color)
      if (!map[name]) map[name] = { name, value: 0, color }
      map[name].value += Number(t.amount)
    })
    const sorted = Object.values(map).sort((a,b) => b.value - a.value)
    if (sorted.length <= 6) return sorted
    const top5  = sorted.slice(0, 5)
    const other = sorted.slice(5).reduce((s, c) => s + c.value, 0)
    return [...top5, { name: 'Other', value: other, color: '#6b7280' }]
  }, [expenses, categoryMap])

  // Budget rows
  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const budgetRows = useMemo(() => {
    return budgets
      .filter(b => b.monthly_limit > 0)
      .map(b => {
        const { startStr, endStr } = getPeriodBounds(b.period ?? 'monthly', currentDate, b.reset_day)
        const spent = yearExpenses
          .filter(t =>
            t.date >= startStr && t.date <= endStr &&
            (!b.card_id || t.card_id === b.card_id) &&
            (b.category_id    ? t.category_id    === b.category_id
           : b.subcategory_id ? t.subcategory_id === b.subcategory_id
           : b.importance     ? (catMap[t.category_id]?.importance ?? catMap[t.subcategory_id]?.importance) === b.importance
                              : true)
          )
          .reduce((s, t) => s + Number(t.amount), 0)
        const name  = b.name || (b.category_id ? (catMap[b.category_id]?.name ?? 'Budget') : b.subcategory_id ? (catMap[b.subcategory_id]?.name ?? 'Budget') : 'Total')
        const color = b.category_id ? midColor(catMap[b.category_id]?.color) : b.subcategory_id ? midColor(catMap[b.subcategory_id]?.color) : colors.expense
        const pct   = Math.min((spent / b.monthly_limit) * 100, 100)
        return { name, spent, limit: b.monthly_limit, pct, color, over: spent > b.monthly_limit }
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6)
  }, [budgets, yearExpenses, catMap, colors.expense, currentDate])

  // Spending heatmap — days in current month
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const heatmapData = useMemo(() => {
    const map = {}
    expenses.forEach(t => {
      const d = parseInt(t.date.slice(8, 10), 10)
      map[d] = (map[d] ?? 0) + Number(t.amount)
    })
    const max = Math.max(...Object.values(map), 0)
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const val = map[day] ?? 0
      return { day, val, intensity: max > 0 ? val / max : 0 }
    })
  }, [expenses, daysInMonth])

  const optimizerRows = useMemo(() => {
    const freqMultiplier = f => f === 'quarterly' ? 4 : f === 'yearly' ? 1 : f === 'weekly' ? 52 : 12
    const subRows  = allSubs.map(s => ({
      key: `sub-${s.id}`, name: s.name, monthly: s.amount,
      yearly: s.amount * 12, period: 'Monthly',
    }))
    const billRows = allBills.map(b => {
      const mult = freqMultiplier(b.frequency)
      const monthly = b.frequency === 'monthly' ? b.amount
                    : b.frequency === 'quarterly' ? b.amount / 3
                    : b.frequency === 'yearly'    ? b.amount / 12
                    : b.amount
      return { key: `bill-${b.id}`, name: b.name, monthly, yearly: b.amount * mult, period: b.frequency ?? 'Monthly' }
    })
    return [...subRows, ...billRows].sort((a, b) => b.yearly - a.yearly)
  }, [allSubs, allBills])

  const yearlyTotal        = useMemo(() => optimizerRows.reduce((s, r) => s + r.yearly, 0), [optimizerRows])
  const cancellableSavings = useMemo(() =>
    optimizerRows.filter(r => usage[r.key] != null && usage[r.key] <= 2).reduce((s, r) => s + r.yearly, 0),
    [optimizerRows, usage])

  const monthLabel  = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const alertCount  = toPay.filter(i => i.severity === 'alert').length

  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar
        currentDate={currentDate}
        onPrev={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
      />

      <div id="page-content" className="py-6 flex flex-col items-center">
        <div className="w-full max-w-5xl px-6 flex flex-col gap-5">

          {/* ── Section label ── */}
          <p className="text-xs text-white/30 uppercase tracking-widest">{monthLabel}</p>

          {/* ── Top: Net flow hero + Donut ── */}
          <FadeIn>
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>

              {/* Net flow hero */}
              <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
                <p className="text-xs text-white/35 uppercase tracking-widest">{t('sum.netFlow')}</p>
                <NetValue value={net} fmt={fmt} colors={colors} />
                {/* income / expense split bar */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex rounded-full overflow-hidden h-1.5">
                    {(() => {
                      const total = income + expense
                      const incPct = total > 0 ? (income / total) * 100 : 50
                      const expPct = 100 - incPct
                      return <>
                        <AnimBar pct={incPct} color={colors.income} />
                        <AnimBar pct={expPct} color={colors.expense} />
                      </>
                    })()}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-white/50">↑ {fmt(income)}</span>
                    <span className="text-xs text-white/50">↓ {fmt(expense)}</span>
                  </div>
                </div>
              </div>

              {/* Spending donut */}
              <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
                <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.length > 0 ? categoryData : [{ name: 'No data', value: 1, color: 'rgba(255,255,255,0.08)' }]}
                        cx="50%" cy="50%"
                        innerRadius={42} outerRadius={58}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {(categoryData.length > 0 ? categoryData : [{ color: 'rgba(255,255,255,0.08)' }]).map((c, i) => (
                          <Cell key={i} fill={c.color || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [fmt(v)]}
                        contentStyle={{ background: 'var(--color-dash-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 11 }}
                        itemStyle={{ color: 'rgba(255,255,255,0.75)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-white/35 leading-none">{t('sum.spent')}</span>
                    <span className="text-sm font-bold tabular-nums leading-snug">{fmtK(expense)}</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1">{t('sum.byCategory')}</p>
                  {categoryData.length === 0
                    ? <p className="text-xs text-white/30">{t('common.noData')}</p>
                    : categoryData.map(c => (
                        <div key={c.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color || '#94a3b8' }} />
                          <span className="text-xs text-white/60 flex-1 truncate">{c.name}</span>
                          <span className="text-[11px] tabular-nums text-white/40 shrink-0">{fmtK(c.value)}</span>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          </FadeIn>

          {/* ── Middle: 4 KPI tiles ── */}
          <FadeIn delay={80}>
            <div className="grid grid-cols-4 gap-4">
              <KpiTile label={t('sum.income')}   value={income}   fmt={fmt} color={colors.income}  Icon={TrendingUp}   />
              <KpiTile label={t('sum.expenses')} value={expense}  fmt={fmt} color={colors.expense} Icon={TrendingDown} />
              <KpiTile label={t('sum.savings')}  value={savings}  fmt={fmt} color={colors.income}  Icon={PiggyBank}    />
              <RateTile rate={savingsRate} color={rateColor} label={t('sum.savingsRate')} />
            </div>
          </FadeIn>

          {/* ── Bottom: Budgets + To Pay + Heatmap ── */}
          <FadeIn delay={160}>
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>

              {/* Budgets */}
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">{t('sum.budgets')}</p>
                {budgetRows.length === 0
                  ? <p className="text-xs text-white/30">{t('sum.noBudgets')}</p>
                  : budgetRows.map(b => (
                      <div key={b.name} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/75 flex-1 truncate">{b.name}</span>
                          <span className="text-[11px] tabular-nums shrink-0"
                            style={{ color: b.over ? colors.expense : 'rgba(255,255,255,0.35)' }}>
                            {fmtK(b.spent)} / {fmtK(b.limit)}
                          </span>
                        </div>
                        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                          <AnimBar pct={b.pct} color={b.over ? colors.expense : (b.color || colors.accent)} />
                        </div>
                        {b.over && (
                          <span className="text-[10px] self-end" style={{ color: colors.expense }}>
                            +{fmtK(b.spent - b.limit)} {t('sum.more')}
                          </span>
                        )}
                      </div>
                    ))
                }
              </div>

              {/* Right column: To Pay + Heatmap */}
              <div className="flex flex-col gap-4">

                {/* To Pay */}
                <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">{t('sum.toPay')}</p>
                    {alertCount > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `color-mix(in srgb, ${colors.expense} 18%, transparent)`, color: colors.expense }}>
                        {t('ac.urgent', { n: alertCount })}
                      </span>
                    )}
                  </div>
                  {toPay.length === 0
                    ? <p className="text-xs text-white/30">{t('sum.allPaid')}</p>
                    : toPay.slice(0, 5).map(a => {
                        const c = a.severity === 'alert' ? colors.expense : a.severity === 'warning' ? colors.warning : 'rgba(255,255,255,0.2)'
                        return (
                          <div key={a.id} className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/75 truncate leading-none">{a.label}</p>
                              <p className="text-[10px] mt-0.5" style={{ color: c }}>{a.detail}</p>
                            </div>
                            <span className="text-xs tabular-nums text-white/45 shrink-0">{fmtK(a.amount)}</span>
                          </div>
                        )
                      })
                  }
                </div>

                {/* Spending heatmap */}
                <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">{t('sum.dailySpend')}</p>
                  <div className="flex flex-wrap gap-1">
                    {heatmapData.map(({ day, val, intensity }) => (
                      <div
                        key={day}
                        title={val > 0 ? `${day} — ${fmt(val)}` : `${day}`}
                        className="rounded-sm"
                        style={{
                          width: 18, height: 18,
                          background: intensity > 0
                            ? `color-mix(in srgb, ${colors.expense} ${Math.round(15 + intensity * 75)}%, rgba(255,255,255,0.05))`
                            : 'rgba(255,255,255,0.05)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-white/25">
                    <span>1</span>
                    <span>{t('sum.less')}</span>
                    <div className="flex gap-0.5 items-center">
                      {[0.1, 0.3, 0.5, 0.75, 1].map(i => (
                        <div key={i} className="w-2.5 h-2.5 rounded-sm"
                          style={{ background: `color-mix(in srgb, ${colors.expense} ${Math.round(15 + i * 75)}%, rgba(255,255,255,0.05))` }} />
                      ))}
                    </div>
                    <span>{t('sum.more')}</span>
                    <span>{daysInMonth}</span>
                  </div>
                </div>

              </div>
            </div>
          </FadeIn>

          {/* ── Subscription Optimizer ── */}
          {optimizerRows.length > 0 && (
            <FadeIn delay={240}>
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <CreditCard size={13} className="text-white/35" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Subscription Optimizer</p>
                    </div>
                    <p className="text-xs text-white/35 ml-5">Rate your usage · 5 = use daily, 1 = barely use it</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-white/35 mb-0.5">Total yearly</p>
                    <p className="text-sm font-bold tabular-nums">{fmt(yearlyTotal)}</p>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-white/[0.04]">
                  {optimizerRows.map(item => {
                    const rating = usage[item.key]
                    const ratingColor = rating == null ? null
                      : rating <= 2 ? colors.expense
                      : rating === 3 ? colors.warning
                      : colors.income
                    return (
                      <div key={item.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
                          {item.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 truncate">{item.name}</p>
                          <p className="text-[10px] text-white/30 capitalize">{item.period}</p>
                        </div>
                        <div className="text-right mr-3 shrink-0">
                          <p className="text-xs font-medium tabular-nums text-white/70">{fmt(item.yearly)}<span className="text-white/30">/yr</span></p>
                          <p className="text-[10px] text-white/30">{fmt(item.monthly)}/mo</p>
                        </div>
                        {/* Usage dots */}
                        <div className="flex gap-1 shrink-0">
                          {[1,2,3,4,5].map(n => (
                            <button
                              key={n}
                              onClick={() => setUsageRating(item.key, n)}
                              className="w-3.5 h-3.5 rounded-full transition-all hover:scale-110"
                              style={{ background: rating >= n ? ratingColor : 'rgba(255,255,255,0.12)' }}
                            />
                          ))}
                        </div>
                        {/* Recommendation chip */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 w-28 text-center"
                          style={ratingColor ? {
                            background: `color-mix(in srgb, ${ratingColor} 15%, transparent)`,
                            color: ratingColor,
                          } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}>
                          {rating == null  ? 'Not rated'
                          : rating <= 2    ? 'Consider cancelling'
                          : rating === 3   ? 'Occasional use'
                          : 'Keep it'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {cancellableSavings > 0 && (
                  <div className="mt-4 pt-4 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs text-white/40">Potential savings if you cancel rated 1–2</p>
                    <p className="text-sm font-bold tabular-nums" style={{ color: colors.income }}>
                      {fmt(cancellableSavings)}/yr
                    </p>
                  </div>
                )}
              </div>
            </FadeIn>
          )}

        </div>
      </div>
    </div>
  )
}

function NetValue({ value, fmt, colors }) {
  const animated = useCountUp(value)
  const color    = value >= 0 ? colors.income : colors.expense
  return (
    <p className="text-4xl font-bold tabular-nums leading-none my-3" style={{ color }}>
      {value >= 0 ? '+' : ''}{fmt(animated)}
    </p>
  )
}

function KpiTile({ label, value, fmt, color, Icon }) {
  const animated = useCountUp(value)
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/35 uppercase tracking-widest">{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <p className="text-xl font-bold tabular-nums leading-none" style={{ color }}>{fmt(animated)}</p>
    </div>
  )
}

function RateTile({ rate, color, label }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/35 uppercase tracking-widest">{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
          <Percent size={13} style={{ color }} />
        </div>
      </div>
      <p className="text-xl font-bold tabular-nums leading-none" style={{ color }}>
        {rate !== null ? `${rate.toFixed(0)}%` : '—'}
      </p>
      {rate !== null && (
        <div className="h-1 bg-white/8 rounded-full overflow-hidden">
          <AnimBar pct={Math.min(rate, 100)} color={color} />
        </div>
      )}
    </div>
  )
}

function AnimBar({ pct, color }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => { const t = setTimeout(() => setDisplay(pct), 60); return () => clearTimeout(t) }, [pct])
  return (
    <div className="h-full rounded-full"
      style={{ width: `${display}%`, background: color, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
  )
}
