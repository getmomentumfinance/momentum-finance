import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSharedData } from '../context/SharedDataContext'
import { useTransactionModal } from '../context/TransactionModalContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/dashboard/Navbar'
import { CategoryPill } from '../components/shared/CategoryPill'
import { TYPES_MAP } from '../constants/transactionTypes'
import { PiggyBank, Banknote, RefreshCw } from 'lucide-react'
import { usePreferences } from '../context/UserPreferencesContext'

function ReceiverAvatar({ receiver }) {
  const [src, setSrc] = useState(() => {
    if (!receiver) return null
    if (receiver.logo_url) return receiver.logo_url
    if (receiver.domain)   return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${receiver.domain}&size=64`
    return null
  })
  const [failed, setFailed] = useState(false)

  if (!receiver) return <div className="w-7 h-7 rounded-full bg-white/8 shrink-0" />

  const initials = receiver.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  if (!src || failed) {
    return (
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
        {initials}
      </div>
    )
  }
  return (
    <img src={src} alt={receiver.name} onError={() => { setSrc(null); setFailed(true) }}
      className="w-7 h-7 rounded-full object-contain bg-white/90 shrink-0 p-0.5" />
  )
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getCalendarMeta(year, month) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset      = firstDay === 0 ? 6 : firstDay - 1
  return { daysInMonth, offset }
}

function getWeekStart(date) {
  const dow = date.getDay()
  const s   = new Date(date)
  s.setDate(date.getDate() - ((dow + 6) % 7))
  s.setHours(0, 0, 0, 0)
  return s
}

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// fmtShort is defined per-component using usePreferences

function dayNet(txs) {
  return txs.reduce((s, t) => {
    if (t.type === 'income')  return s + t.amount
    if (t.type === 'expense') return s - t.amount
    return s
  }, 0)
}

export default function CalendarPage() {
  const { user }                     = useAuth()
  const { fmt, symbol, locale }      = usePreferences()
  const fmtShort = n => `${n < 0 ? '−' : ''}${symbol}${Math.abs(n).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const { categoryMap, receiverMap } = useSharedData()
  const { openTransactionModal }     = useTransactionModal()

  const [view,            setView]            = useState('month')
  const [currentDate,     setCurrentDate]     = useState(new Date())
  const [txsByDay,        setTxsByDay]        = useState({})   // keyed by day int (month view)
  const [txsByDate,       setTxsByDate]       = useState({})   // keyed by 'YYYY-MM-DD'
  const [selectedDateStr, setSelectedDateStr] = useState(null)
  const [subReceiverIds,  setSubReceiverIds]  = useState(new Set())
  const [periodBudgets,   setPeriodBudgets]   = useState([])
  const [budgetSpent,     setBudgetSpent]     = useState(null)
  const [cardMap,         setCardMap]         = useState({})

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const { daysInMonth, offset } = getCalendarMeta(year, month)

  const todayObj   = new Date(); todayObj.setHours(0, 0, 0, 0)
  const todayDate  = new Date().getDate()
  const isCurrentMonth = todayObj.getFullYear() === year && todayObj.getMonth() === month

  const wStart    = getWeekStart(currentDate)
  const wEnd      = new Date(wStart); wEnd.setDate(wStart.getDate() + 6); wEnd.setHours(23, 59, 59, 999)
  const wStartStr = toLocalDateStr(wStart)
  const isCurrentWeek = todayObj >= wStart && todayObj <= wEnd

  const isCurrentPeriod = view === 'month' ? isCurrentMonth : isCurrentWeek

  useEffect(() => {
    if (!user?.id) return
    supabase.from('cards').select('id, name').eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setCardMap(Object.fromEntries(data.map(c => [c.id, c])))
      })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    async function loadBudgets() {
      const { data } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .is('category_id', null)
        .is('subcategory_id', null)
        .is('importance', null)
      setPeriodBudgets(data ?? [])
    }
    loadBudgets()
  }, [user?.id])

  // Load the budget's actual period spending using the same period bounds as Budgets.jsx
  useEffect(() => {
    if (!user?.id || periodBudgets.length === 0) { setBudgetSpent(null); return }
    const targetPeriod = view === 'week' ? 'weekly' : 'monthly'
    const budget = periodBudgets.find(b => b.period === targetPeriod && b.monthly_limit > 0)
    if (!budget) { setBudgetSpent(null); return }

    const { startStr, endStr } = getPeriodBounds(budget.period, currentDate, budget.reset_day)

    async function loadSpent() {
      let q = supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .eq('type', 'expense')
        .eq('is_split_parent', false)
        .gte('date', startStr)
        .lte('date', endStr)
      if (budget.card_id) q = q.eq('card_id', budget.card_id)
      const { data } = await q
      setBudgetSpent((data ?? []).reduce((s, t) => s + t.amount, 0))
    }
    loadSpent()
    window.addEventListener('transaction-saved', loadSpent)
    return () => window.removeEventListener('transaction-saved', loadSpent)
  }, [user?.id, periodBudgets, view, currentDate])

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      let start, end
      if (view === 'week') {
        start = wStartStr
        end   = toLocalDateStr(new Date(wStart.getFullYear(), wStart.getMonth(), wStart.getDate() + 6))
      } else {
        start = new Date(year, month, 1).toISOString().slice(0, 10)
        end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)
      }

      const [{ data }, { data: subs }] = await Promise.all([
        supabase
          .from('transactions')
          .select('id, type, description, comment, amount, date, source, category_id, subcategory_id, receiver_id, card_id, is_split_parent, split_parent_id')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('subscriptions')
          .select('receiver_id')
          .eq('user_id', user.id)
          .eq('status', 'active'),
      ])

      setSubReceiverIds(new Set((subs ?? []).map(s => s.receiver_id).filter(Boolean)))
      if (!data) return

      const filtered = data
        .filter(t => !t.split_parent_id)
        .filter(t => (t.type === 'transfer' || t.type === 'savings' || t.type === 'cash_out') ? t.amount > 0 : true)
        .map(t => ({
          ...t,
          category: categoryMap[t.category_id] ?? null,
          receiver: receiverMap[t.receiver_id]  ?? null,
        }))

      const dayMap = {}
      const dateMap = {}
      for (const t of filtered) {
        const day = parseInt(t.date.slice(8, 10), 10)
        if (!dayMap[day])    dayMap[day]    = []
        if (!dateMap[t.date]) dateMap[t.date] = []
        dayMap[day].push(t)
        dateMap[t.date].push(t)
      }
      setTxsByDay(dayMap)
      setTxsByDate(dateMap)
    }

    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, year, month, view, wStartStr, categoryMap, receiverMap])

  function prevPeriod() {
    setSelectedDateStr(null)
    if (view === 'week') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))
    else                 setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextPeriod() {
    setSelectedDateStr(null)
    if (view === 'week') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))
    else                 setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  function jumpToToday() { setCurrentDate(new Date()) }

  function switchView(v) {
    setView(v)
    setSelectedDateStr(null)
  }

  // Summary stats
  const allTxs         = Object.values(view === 'week' ? txsByDate : txsByDay).flat()
  const periodIncome   = allTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const periodExpenses = allTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const periodNet      = periodIncome - periodExpenses

  // Month grid helpers
  const cells    = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  const numWeeks = Math.ceil(cells.length / 7)

  const maxDayExpense = Math.max(
    ...Object.values(view === 'week' ? txsByDate : txsByDay).map(txs =>
      txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    ),
    1
  )

  const cellsWithTotals = []
  for (let w = 0; w < numWeeks; w++) {
    const weekDays    = cells.slice(w * 7, w * 7 + 7)
    cellsWithTotals.push(...weekDays)
    const weekTxs     = weekDays.filter(Boolean).flatMap(d => txsByDay[d] ?? [])
    const weekIncome  = weekTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const weekExpense = weekTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const weekNet     = weekIncome - weekExpense
    cellsWithTotals.push({ __weekTotal: true, weekIncome, weekExpense, weekNet, wk: w })
  }

  const selectedTxs = selectedDateStr ? (txsByDate[selectedDateStr] ?? []) : []

  function handleDayClick(dateStr) {
    setSelectedDateStr(prev => prev === dateStr ? null : dateStr)
  }
  function handleAddOnDay(dateStr) {
    openTransactionModal({ date: dateStr })
  }

  // Shared cell renderer (used by both month and week views)
  function renderDayCell(dateStr, day, txs, isToday, isSelected) {
    const net        = dayNet(txs)
    const incomeAmt  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenseAmt = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const hasRecurring = txs.some(t => t.receiver_id && subReceiverIds.has(t.receiver_id))
    const heatPct    = expenseAmt > 0 ? Math.round(Math.min(expenseAmt / maxDayExpense, 1) * 28) : 0

    return (
      <div
        key={dateStr}
        onClick={() => handleDayClick(dateStr)}
        className="relative flex flex-col rounded-xl border cursor-pointer transition-all group overflow-hidden"
        style={{
          background: isSelected
            ? 'rgba(255,255,255,0.06)'
            : heatPct > 0
              ? `color-mix(in srgb, var(--color-calendar-heatmap, var(--type-expense)) ${heatPct}%, rgba(255,255,255,0.02))`
              : txs.length > 0
                ? 'rgba(255,255,255,0.025)'
                : 'rgba(255,255,255,0.01)',
          border: isSelected
            ? '1px solid rgba(255,255,255,0.18)'
            : isToday
              ? '1px solid var(--color-accent)'
              : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
          <div className="flex items-center gap-1">
            <span
              className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full shrink-0"
              style={isToday
                ? { background: 'var(--color-accent)', color: '#fff' }
                : { color: 'rgba(255,255,255,0.55)' }}
            >
              {day}
            </span>
            {hasRecurring && (
              <RefreshCw size={8} className="shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
            )}
          </div>
          {txs.length > 0 && (
            <span className="text-[10px] font-medium tabular-nums"
              style={{ color: net >= 0 ? 'var(--type-income)' : 'var(--type-expense)' }}>
              {net >= 0 ? '+' : '−'}{fmtShort(Math.abs(net))}
            </span>
          )}
        </div>

        {/* Transaction body */}
        <div className="flex flex-col gap-0.5 px-1.5 pb-1.5 flex-1">
          {txs.length <= 3 ? (
            txs.map(t => {
              const typeInfo = TYPES_MAP[t.type]
              const label    = t.description || t.receiver?.name || typeInfo?.label || '—'
              return (
                <div key={t.id}
                  className="flex items-center gap-1 px-1.5 py-[3px] rounded-md"
                  style={{ background: `color-mix(in srgb, ${typeInfo?.color ?? '#9ca3af'} 10%, transparent)` }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: typeInfo?.color ?? '#9ca3af' }} />
                  <span className="truncate text-[10px] text-white/65 flex-1">{label}</span>
                  <span className="text-[10px] tabular-nums shrink-0 ml-auto"
                    style={{ color: typeInfo?.color ?? '#9ca3af' }}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '−' : ''}{fmtShort(t.amount)}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="flex-1 flex flex-col justify-center gap-1.5 px-0.5">
              {Object.entries(
                txs.reduce((acc, t) => {
                  const color = t.category?.color ?? TYPES_MAP[t.type]?.color ?? '#9ca3af'
                  acc[color] = (acc[color] ?? 0) + 1
                  return acc
                }, {})
              ).map(([color, count]) => (
                <div key={color} className="flex items-center gap-[3px] flex-wrap">
                  {Array.from({ length: Math.min(count, 12) }).map((_, di) => (
                    <span key={di} className="w-[6px] h-[6px] rounded-full shrink-0"
                      style={{ background: color, opacity: 0.8 }} />
                  ))}
                  {count > 12 && <span className="text-[9px] text-white/30 leading-none">+{count - 12}</span>}
                </div>
              ))}
              <span className="text-[9px] text-white/25 leading-none">{txs.length} transactions</span>
            </div>
          )}
        </div>

        {/* Income / expense bar at bottom */}
        {(incomeAmt > 0 || expenseAmt > 0) && (
          <div className="h-[3px] flex rounded-b-xl overflow-hidden">
            {incomeAmt  > 0 && <div style={{ flex: incomeAmt,  background: 'var(--type-income)',  opacity: 0.5 }} />}
            {expenseAmt > 0 && <div style={{ flex: expenseAmt, background: 'var(--type-expense)', opacity: 0.5 }} />}
          </div>
        )}
      </div>
    )
  }

  const barColor = pct => {
    if (pct >= 100) return 'var(--color-alert, #ef4444)'
    if (pct >= 80)  return 'var(--color-warning, #f59e0b)'
    return 'var(--color-progress-bar, var(--color-accent))'
  }

  const matchingBudget = periodBudgets.find(b =>
    b.period === (view === 'week' ? 'weekly' : 'monthly') && b.monthly_limit > 0
  )
  const budgetPct = (matchingBudget && budgetSpent !== null)
    ? Math.min((budgetSpent / matchingBudget.monthly_limit) * 100, 100)
    : 0

  const periodLabel = view === 'week'
    ? (() => {
        const f = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${f(wStart)} – ${f(wEnd)}, ${wEnd.getFullYear()}`
      })()
    : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-dash-bg text-white">
      <Navbar currentDate={currentDate} onPrev={prevPeriod} onNext={nextPeriod} />

      <div id="page-content" className="px-16 py-4 flex-1 flex flex-col overflow-hidden">

        {/* Page header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">Calendar</h1>
              <p className="text-muted text-sm mt-0.5">{periodLabel}</p>
            </div>
            {!isCurrentPeriod && (
              <button
                onClick={jumpToToday}
                className="text-[11px] text-muted hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Today
              </button>
            )}
            {/* View toggle */}
            <div className="flex gap-0.5 bg-white/[0.06] rounded-lg p-0.5">
              {['month', 'week'].map(v => (
                <button key={v} onClick={() => switchView(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                    view === v ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'
                  }`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Period summary pills */}
          <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-6">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-muted uppercase tracking-widest">Income</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--type-income)' }}>+{fmt(periodIncome)}</span>
            </div>
            <div className="w-px h-7 bg-white/10" />
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-muted uppercase tracking-widest">Expenses</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--type-expense)' }}>−{fmt(periodExpenses)}</span>
            </div>
            <div className="w-px h-7 bg-white/10" />
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-muted uppercase tracking-widest">Net</span>
              <span className="text-sm font-semibold tabular-nums"
                style={{ color: periodNet >= 0 ? 'var(--type-income)' : 'var(--type-expense)' }}>
                {periodNet >= 0 ? '+' : '−'}{fmt(Math.abs(periodNet))}
              </span>
            </div>
          </div>
        </div>

        {/* Calendar + detail panel */}
        <div className="flex gap-4 flex-1 overflow-hidden">

          {/* Main view */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

            {/* Period budget bar */}
            {matchingBudget && budgetSpent !== null && (
              <div className="shrink-0 mb-3 glass-card rounded-xl px-4 py-2.5 flex items-center gap-3">
                <span className="text-[11px] text-white/40 shrink-0 uppercase tracking-widest">Budget</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${budgetPct}%`, background: barColor(budgetPct) }} />
                </div>
                <span className="text-xs tabular-nums shrink-0">
                  <span style={{ color: barColor(budgetPct) }}>{fmt(budgetSpent)}</span>
                  <span className="text-white/30"> / {fmt(matchingBudget.monthly_limit)}</span>
                </span>
                {budgetSpent > matchingBudget.monthly_limit && (
                  <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-md"
                    style={{ background: 'color-mix(in srgb, var(--color-alert, #ef4444) 15%, transparent)', color: 'var(--color-alert, #ef4444)' }}>
                    Over by {fmt(budgetSpent - matchingBudget.monthly_limit)}
                  </span>
                )}
              </div>
            )}

            {view === 'week' && (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1.5 shrink-0">
                  {DAYS.map(d => (
                    <div key={d} className="text-[11px] text-muted uppercase tracking-widest text-center py-1.5 font-medium">{d}</div>
                  ))}
                </div>

                {/* 7 day cells filling the full height */}
                <div className="flex-1 grid grid-cols-7 gap-[6px]">
                  {Array.from({ length: 7 }, (_, i) => {
                    const dayDate = new Date(wStart)
                    dayDate.setDate(wStart.getDate() + i)
                    const dateStr  = toLocalDateStr(dayDate)
                    const txs      = txsByDate[dateStr] ?? []
                    const isToday  = dayDate.getTime() === todayObj.getTime()
                    const isSel    = selectedDateStr === dateStr
                    return renderDayCell(dateStr, dayDate.getDate(), txs, isToday, isSel)
                  })}
                </div>
              </>
            )}

            {view === 'month' && (
              <>
                {/* Day-of-week headers — 8th column for week totals */}
                <div className="grid mb-1.5 shrink-0" style={{ gridTemplateColumns: 'repeat(7, 1fr) 64px' }}>
                  {DAYS.map(d => (
                    <div key={d} className="text-[11px] text-muted uppercase tracking-widest text-center py-1.5 font-medium">{d}</div>
                  ))}
                  <div className="text-[11px] text-muted uppercase tracking-widest text-center py-1.5 font-medium">Week</div>
                </div>

                {/* Cells — 8 columns, week totals in col 8 */}
                <div
                  className="flex-1 min-h-0"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr) 64px',
                    gridTemplateRows: `repeat(${numWeeks}, 1fr)`,
                    gap: '6px',
                  }}
                >
                  {cellsWithTotals.map((cell, i) => {

                    /* Week-total cell */
                    if (cell?.__weekTotal) {
                      const { weekIncome, weekExpense, weekNet, wk } = cell
                      const hasActivity = weekIncome > 0 || weekExpense > 0
                      return (
                        <div key={`wt-${wk}`}
                          className="flex flex-col items-center justify-center rounded-xl gap-0.5 px-1 py-2"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          {weekIncome > 0 && (
                            <span className="text-[9px] tabular-nums leading-tight" style={{ color: 'var(--type-income)' }}>
                              +{fmtShort(weekIncome)}
                            </span>
                          )}
                          {weekExpense > 0 && (
                            <span className="text-[9px] tabular-nums leading-tight" style={{ color: 'var(--type-expense)' }}>
                              −{fmtShort(weekExpense)}
                            </span>
                          )}
                          {hasActivity && <div className="w-6 h-px bg-white/10 my-0.5" />}
                          {hasActivity && (
                            <span className="text-[9px] font-semibold tabular-nums leading-tight"
                              style={{ color: weekNet >= 0 ? 'var(--type-income)' : 'var(--type-expense)' }}>
                              {weekNet >= 0 ? '+' : '−'}{fmtShort(Math.abs(weekNet))}
                            </span>
                          )}
                        </div>
                      )
                    }

                    /* Empty filler */
                    const day = cell
                    if (!day) return <div key={i} />

                    /* Day cell */
                    const m       = String(month + 1).padStart(2, '0')
                    const d       = String(day).padStart(2, '0')
                    const dateStr = `${year}-${m}-${d}`
                    const txs     = txsByDay[day] ?? []
                    const isToday = isCurrentMonth && day === todayDate
                    const isSel   = selectedDateStr === dateStr
                    return renderDayCell(dateStr, day, txs, isToday, isSel)
                  })}
                </div>
              </>
            )}
          </div>

          {/* Detail panel */}
          {selectedDateStr && (
            <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: '300px' }}>
              <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full">

                {/* Panel header */}
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric',
                      })}
                    </h3>
                    <p className="text-[11px] text-muted mt-0.5">
                      {selectedTxs.length === 0
                        ? 'No transactions'
                        : `${selectedTxs.length} transaction${selectedTxs.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAddOnDay(selectedDateStr)}
                      className="text-[11px] text-muted hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => setSelectedDateStr(null)}
                      className="text-sm leading-none text-muted hover:text-white border border-white/10 hover:border-white/20 w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {selectedTxs.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-xs text-white/25">No transactions this day</p>
                  </div>
                ) : (
                  <>
                    {/* Day totals */}
                    {(() => {
                      const inc = selectedTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
                      const exp = selectedTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                      const net = inc - exp
                      return (inc > 0 || exp > 0) ? (
                        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04]">
                          {inc > 0 && (
                            <span className="text-[11px] tabular-nums" style={{ color: 'var(--type-income)' }}>+{fmt(inc)}</span>
                          )}
                          {exp > 0 && (
                            <span className="text-[11px] tabular-nums" style={{ color: 'var(--type-expense)' }}>−{fmt(exp)}</span>
                          )}
                          {inc > 0 && exp > 0 && (
                            <>
                              <span className="text-white/20 text-[10px]">·</span>
                              <span className="text-[11px] tabular-nums text-white/50">
                                net {net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}
                              </span>
                            </>
                          )}
                        </div>
                      ) : null
                    })()}

                    {/* Transaction list */}
                    <div className="divide-y divide-white/[0.04] flex-1 overflow-y-auto scrollbar-thin">
                      {selectedTxs.map(t => {
                        const typeInfo    = TYPES_MAP[t.type]
                        const sign        = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : ''
                        const isRecurring = t.receiver_id && subReceiverIds.has(t.receiver_id)
                        const card        = t.card_id ? cardMap[t.card_id] : null

                        // For transfers parse "From X to Y" out of the description
                        let transferFrom = null, transferTo = null
                        if (t.type === 'transfer' && t.description) {
                          const m = t.description.match(/^From (.+) to (.+)$/)
                          if (m) { transferFrom = m[1]; transferTo = m[2] }
                        }

                        return (
                          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                            {t.type === 'transfer' || t.type === 'invest' ? (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: `color-mix(in srgb, ${typeInfo?.color ?? '#9ca3af'} 15%, transparent)` }}>
                                {typeInfo?.Icon && <typeInfo.Icon size={12} style={{ color: typeInfo.color }} />}
                              </div>
                            ) : t.type === 'savings' ? (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: `color-mix(in srgb, ${typeInfo?.color ?? '#9ca3af'} 15%, transparent)` }}>
                                <PiggyBank size={12} style={{ color: typeInfo?.color }} />
                              </div>
                            ) : t.type === 'cash_out' ? (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: `color-mix(in srgb, ${typeInfo?.color ?? '#9ca3af'} 15%, transparent)` }}>
                                <Banknote size={12} style={{ color: typeInfo?.color }} />
                              </div>
                            ) : (
                              <ReceiverAvatar receiver={t.receiver} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm text-white/85 truncate">
                                  {t.type === 'transfer' && transferFrom
                                    ? <><span>{transferFrom}</span><span className="mx-1.5 text-white/30">→</span><span>{transferTo}</span></>
                                    : t.description || <span className="text-white/30 italic">—</span>
                                  }
                                </p>
                                {isRecurring && (
                                  <RefreshCw size={10} className="shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                )}
                              </div>
                              {t.comment && (
                                <p className="text-[10px] text-white/35 truncate mt-0.5">{t.comment}</p>
                              )}
                              {t.category && (
                                <div className="mt-1">
                                  <CategoryPill name={t.category.name} color={t.category.color} icon={t.category.icon} />
                                </div>
                              )}
                              {/* Card chip */}
                              {card && (
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.06]">
                                  <span className="text-[9px] text-white/35 uppercase tracking-widest leading-none">card</span>
                                  <span className="text-[10px] text-white/55 leading-none">{card.name}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium tabular-nums shrink-0"
                              style={{ color: typeInfo?.color ?? '#9ca3af' }}>
                              {sign}{fmt(t.amount)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
