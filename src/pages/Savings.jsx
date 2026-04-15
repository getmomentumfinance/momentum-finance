import { useState, useEffect, useMemo } from 'react'
import {
  PiggyBank, Trophy, Flame, Percent, AlertTriangle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ReferenceLine, Customized,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/dashboard/Navbar'
import { useCardCustomization } from '../hooks/useCardCustomization'
import { useThemeColors } from '../hooks/useThemeColors'
import CardCustomizationPopup from '../components/shared/CardCustomizationPopup'
import SavingsGoals from '../components/dashboard/SavingsGoals'
import { usePreferences } from '../context/UserPreferencesContext'

// ── Colour tokens ─────────────────────────────────────────────
const COLORS = {
  grid: 'rgba(255,255,255,0.04)',
  axis: 'rgba(255,255,255,0.25)',
}
const C_IN  = 'var(--type-income)'
const C_OUT = 'var(--type-expense)'

// ── Helpers ───────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: { background: 'var(--color-dash-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12 },
  itemStyle:    { color: '#fff' },
  labelStyle:   { color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  cursor:       { stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 },
}

// ── Monthly heatmap (calendar grid) ──────────────────────────
function MonthlyHeatmap({ deposits, withdrawals, currentDate, color, t }) {
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthKey    = `${year}-${String(month + 1).padStart(2, '0')}`
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow    = new Date(year, month, 1).getDay()

  const dayMap = useMemo(() => {
    const m = {}
    deposits.forEach(t => {
      if (t.date.startsWith(monthKey)) {
        const d = t.date.slice(8, 10)
        m[d] = (m[d] || 0) + t.amount
      }
    })
    withdrawals.forEach(t => {
      if (t.date.startsWith(monthKey)) {
        const d = t.date.slice(8, 10)
        m[d] = (m[d] || 0) - t.amount
      }
    })
    return m
  }, [deposits, withdrawals, monthKey])

  const maxNet = Math.max(...Object.values(dayMap).filter(v => v > 0), 0)

  const today          = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDay       = today.getDate()

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col" style={{ alignSelf: 'stretch' }}>
      <h2 className="text-sm font-semibold mb-0.5">{t('sav.activity')}</h2>
      <p className="text-[11px] text-muted mb-4">
        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
          <div key={i} className="text-center text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const d   = String(day).padStart(2, '0')
          const net = dayMap[d] || 0
          const intensity = maxNet > 0 && net > 0 ? 0.2 + (net / maxNet) * 0.8 : 0
          const isToday   = isCurrentMonth && day === todayDay
          return (
            <div
              key={i}
              title={net !== 0 ? `${monthKey}-${d}: ${net > 0 ? '+' : ''}€${Math.abs(net).toFixed(2)}` : `${monthKey}-${d}`}
              className="flex items-center justify-center rounded-md"
              style={{
                aspectRatio: '1',
                background: intensity > 0
                  ? `color-mix(in srgb, ${color} ${Math.round(intensity * 100)}%, transparent)`
                  : 'rgba(255,255,255,0.04)',
                outline: isToday ? '1.5px solid rgba(255,255,255,0.35)' : 'none',
                outlineOffset: '-1px',
              }}
            >
              <span style={{ fontSize: 9, color: intensity > 0.5 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.35)' }}>{day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Charts ────────────────────────────────────────────────────
function SavingsLineChart({ data }) {
  const { fmt, fmtK, t } = usePreferences()
  const tc = useThemeColors()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 24, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: COLORS.axis, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={fmtK} tick={{ fill: COLORS.axis, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
        <Tooltip formatter={(v) => [fmt(v), t('sav.savedTooltip')]} {...tooltipStyle} />
        <Area type="monotone" dataKey="amount" stroke={tc.lineChart} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: tc.lineChart, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function BarGradientDef({ width, stops }) {
  return (
    <defs>
      <linearGradient id="barChartGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2="0">
        {stops.map((color, i) => (
          <stop key={i} offset={`${(i / (stops.length - 1)) * 100}%`} stopColor={color} />
        ))}
      </linearGradient>
    </defs>
  )
}

function NetFlowChart({ data, view }) {
  const { fmt, fmtK, t } = usePreferences()
  const tc = useThemeColors()
  const isBarGradient = tc.barChart.includes('gradient')
  const barStops = isBarGradient
    ? [...tc.barChart.matchAll(/#[0-9a-fA-F]{6}/g)].map(m => m[0])
    : null
  const barFill = isBarGradient ? 'url(#barChartGrad)' : tc.barChart

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barCategoryGap="20%" barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        {isBarGradient && <Customized component={(props) => <BarGradientDef width={props.width} stops={barStops} />} />}
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: COLORS.axis, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={fmtK} tick={{ fill: COLORS.axis, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.10)" />
        {view === 'year' ? (
          <Tooltip
            formatter={(v, name) => [fmt(Math.abs(v)), name === 'deposits' ? t('sav.deposited') : t('sav.withdrawn')]}
            {...tooltipStyle}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
        ) : (
          <Tooltip
            formatter={(v) => [fmt(Math.abs(v)), v >= 0 ? t('sav.netDeposit') : t('sav.netWithdrawal')]}
            {...tooltipStyle}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
        )}
        {view === 'year' ? (
          <>
            <Bar dataKey="deposits"    fill={barFill} radius={[3, 3, 0, 0]} fillOpacity={1} />
            <Bar dataKey="withdrawals" fill={barFill} radius={[3, 3, 0, 0]} fillOpacity={0.45} />
          </>
        ) : (
          <Bar dataKey="net" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={barFill} fillOpacity={(d.net ?? 0) >= 0 ? 1 : 0.45} />)}
          </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

function ViewToggle({ value, onChange, t }) {
  return (
    <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
      {['month', 'year'].map(v => (
        <button key={v} onClick={() => onChange(v)} className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
          style={{ background: value === v ? 'rgba(255,255,255,0.12)' : 'transparent', color: value === v ? '#fff' : 'rgba(255,255,255,0.35)' }}>
          {v === 'month' ? t('sav.viewMonth') : t('sav.viewYear')}
        </button>
      ))}
    </div>
  )
}

// ── Mini stat tile ────────────────────────────────────────────
function MiniStat({ label, value, sub, icon: Icon, color }) {
  const c = useCardCustomization(label)
  const border = c.showBorder ? '1px solid rgba(255,255,255,0.2)' : 'none'

  return (
    <>
      <div className="glass-card relative rounded-2xl p-4 flex flex-col gap-1.5 overflow-hidden flex-1" style={{ border }}>
        {c.bgGradient && (
          <div className="absolute inset-0" style={{ background: c.bgGradient, opacity: c.enableColor ? c.opacity / 100 : 1 }} />
        )}
        {c.enableColor && c.darkOverlay > 0 && (
          <div className="absolute inset-0 bg-black" style={{ opacity: c.darkOverlay / 100 }} />
        )}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-medium">{label}</span>
          {Icon && (
            <button
              ref={c.btnRef}
              type="button"
              onClick={e => { e.stopPropagation(); c.toggleOpen() }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              style={{ color: c.customIconColor && c.iconColor ? c.iconColor : 'rgba(255,255,255,0.4)' }}
            >
              <Icon size={13} />
            </button>
          )}
        </div>
        <span className="relative z-10 text-2xl font-bold" style={{ color: c.enableColor ? '#fff' : (color || '#fff') }}>{value}</span>
        {sub && <span className="relative z-10 text-[11px] leading-tight">{sub}</span>}
      </div>
      {c.open && (
        <CardCustomizationPopup
          popupRef={c.popupRef} pos={c.pos}
          enableColor={c.enableColor}         setEnableColor={c.setEnableColor}
          showBorder={c.showBorder}           setShowBorder={c.setShowBorder}
          tab={c.tab}                         setTab={c.setTab}
          selectedColor={c.selectedColor}         setSelectedColor={c.setSelectedColor}
          opacity={c.opacity}                 setOpacity={c.setOpacity}
          darkOverlay={c.darkOverlay}         setDarkOverlay={c.setDarkOverlay}
          customIconColor={c.customIconColor} setCustomIconColor={c.setCustomIconColor}
          iconColor={c.iconColor}             setIconColor={c.setIconColor}
          colors={c.colors}
        />
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Savings() {
  const { user } = useAuth()
  const { fmt, fmtK, t } = usePreferences()
  const tc = useThemeColors()
  const [currentDate,   setCurrentDate]   = useState(new Date())
  const [allTxs,        setAllTxs]        = useState([])
  const [savingsCards,  setSavingsCards]  = useState([])
  const [monthIncome,   setMonthIncome]   = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [savingsView,   setSavingsView]   = useState('month')
  const [flowView,      setFlowView]      = useState('month')
  const [target,        setTarget]        = useState(() => Number(localStorage.getItem('savings_monthly_target') || 0))
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput,   setTargetInput]   = useState('')
  useEffect(() => {
    if (!user?.id) return
    async function load() {
      setLoading(true)
      const yr  = currentDate.getFullYear()
      const mo  = currentDate.getMonth()
      const start = new Date(yr, mo, 1).toISOString().slice(0, 10)
      const end   = new Date(yr, mo + 1, 0).toISOString().slice(0, 10)

      const [{ data: txs }, { data: cards }, { data: cardTxs }, { data: incomeTxs }] = await Promise.all([
        supabase.from('transactions')
          .select('amount, date, source, description')
          .eq('user_id', user.id)
          .eq('type', 'savings')
          .eq('is_deleted', false)
          .order('date', { ascending: true }),
        supabase.from('cards')
          .select('id, name, initial_balance')
          .eq('user_id', user.id)
          .eq('type', 'savings'),
        supabase.from('transactions')
          .select('card_id, type, amount')
          .eq('user_id', user.id)
          .eq('is_deleted', false),
        supabase.from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'income')
          .eq('is_deleted', false)
          .gte('date', start)
          .lte('date', end),
      ])

      if (txs)       setAllTxs(txs)
      if (incomeTxs) setMonthIncome(incomeTxs.reduce((s, t) => s + t.amount, 0))

      if (cards && cardTxs) {
        const CREDIT = new Set(['income'])
        setSavingsCards(cards.map(card => {
          const delta = cardTxs
            .filter(t => t.card_id === card.id)
            .reduce((s, t) => s + (CREDIT.has(t.type) ? t.amount : -t.amount), 0)
          return { ...card, balance: Number(card.initial_balance) + delta }
        }))
      }
      setLoading(false)
    }

    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const deposits    = allTxs.filter(t => t.source === 'savings_in'  && t.amount > 0)
  const withdrawals = allTxs.filter(t => t.source === 'savings_out' && t.amount > 0)

  // ── Chart data ────────────────────────────────────────────
  const savingsChartData = (() => {
    if (savingsView === 'month') {
      const days   = new Date(year, month + 1, 0).getDate()
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
      let running  = 0
      return Array.from({ length: days }, (_, i) => {
        const day = String(i + 1).padStart(2, '0')
        running += deposits.filter(t => t.date === `${prefix}-${day}`).reduce((s, t) => s + t.amount, 0)
        running -= withdrawals.filter(t => t.date === `${prefix}-${day}`).reduce((s, t) => s + t.amount, 0)
        return { label: String(i + 1), amount: running }
      })
    }
    let running = 0
    return Array.from({ length: 12 }, (_, i) => {
      const key   = `${year}-${String(i + 1).padStart(2, '0')}`
      const label = new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' })
      running += deposits.filter(t => t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0)
      running -= withdrawals.filter(t => t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0)
      return { label, amount: running }
    })
  })()

  const flowChartData = (() => {
    if (flowView === 'month') {
      const days   = new Date(year, month + 1, 0).getDate()
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
      return Array.from({ length: days }, (_, i) => {
        const day  = String(i + 1).padStart(2, '0')
        const inA  = deposits.filter(t => t.date === `${prefix}-${day}`).reduce((s, t) => s + t.amount, 0)
        const outA = withdrawals.filter(t => t.date === `${prefix}-${day}`).reduce((s, t) => s + t.amount, 0)
        return { label: String(i + 1), net: inA - outA }
      })
    }
    return Array.from({ length: 12 }, (_, i) => {
      const key   = `${year}-${String(i + 1).padStart(2, '0')}`
      const label = new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' })
      const inA   = deposits.filter(t => t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0)
      const outA  = withdrawals.filter(t => t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0)
      return { label, deposits: inA, withdrawals: -outA }
    })
  })()

  // ── Derived stats ─────────────────────────────────────────
  const monthKey      = `${year}-${String(month + 1).padStart(2, '0')}`
  const totalIn       = deposits.reduce((s, t) => s + t.amount, 0)
  const totalOut      = withdrawals.reduce((s, t) => s + t.amount, 0)
  const totalBalance  = totalIn - totalOut
  const thisMonthIn   = deposits.filter(t => t.date.startsWith(monthKey)).reduce((s, t) => s + t.amount, 0)
  const thisMonthOut  = withdrawals.filter(t => t.date.startsWith(monthKey)).reduce((s, t) => s + t.amount, 0)
  const netThisMonth  = thisMonthIn - thisMonthOut
  const dipsCount     = withdrawals.filter(t => t.date.startsWith(monthKey)).length

  // Streak: consecutive months with positive net savings going back from current
  const streak = (() => {
    let count = 0
    for (let i = 0; i < 36; i++) {
      const d   = new Date(year, month - i, 1)
      const k   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const inA = deposits.filter(t => t.date.startsWith(k)).reduce((s, t) => s + t.amount, 0)
      const outA = withdrawals.filter(t => t.date.startsWith(k)).reduce((s, t) => s + t.amount, 0)
      if (inA - outA > 0) count++
      else break
    }
    return count
  })()

  const savingsRate = monthIncome > 0 ? (netThisMonth / monthIncome) * 100 : null

  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const k    = `${year}-${String(i + 1).padStart(2, '0')}`
    const inA  = deposits.filter(t => t.date.startsWith(k)).reduce((s, t) => s + t.amount, 0)
    const outA = withdrawals.filter(t => t.date.startsWith(k)).reduce((s, t) => s + t.amount, 0)
    return inA - outA
  })
  const bestIdx   = monthlyTotals.indexOf(Math.max(...monthlyTotals, 0))
  const bestMonth = Math.max(...monthlyTotals) > 0
    ? { amount: monthlyTotals[bestIdx], label: new Date(year, bestIdx, 1).toLocaleDateString('en-US', { month: 'short' }) }
    : null

  const targetPct = target > 0 ? Math.min((thisMonthIn / target) * 100, 100) : 0

  // Recent savings (last 6)
  const recent = [...allTxs]
    .filter(t => t.amount > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function saveTarget(val) {
    const n = parseFloat(val) || 0
    setTarget(n)
    localStorage.setItem('savings_monthly_target', String(n))
    setEditingTarget(false)
  }

  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar
        currentDate={currentDate}
        onPrev={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
      />

      <div id="page-content" className="py-6 px-4 md:px-16 pb-24 md:pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('sav.title')}</h1>
          <p className="text-muted text-sm mt-1">{monthLabel}</p>
        </div>

        {/* Top section: 5-col grid on desktop, stacked on mobile */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-start">

          {/* Hero balance card */}
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
            <span className="text-[10px] text-muted uppercase tracking-widest font-medium">{t('sav.totalBalance')}</span>
            <span className="text-3xl font-bold">{loading ? '—' : fmt(totalBalance)}</span>
            <div className="flex flex-col gap-2 mt-auto">
              {loading ? (
                <span className="text-xs text-muted">{t('common.loading')}</span>
              ) : savingsCards.length === 0 ? (
                <span className="text-xs text-muted">{t('sav.noData')}</span>
              ) : savingsCards.map(card => {
                const pct = totalBalance > 0 ? (card.balance / totalBalance) * 100 : 0
                return (
                  <div key={card.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted truncate pr-2">{card.name}</span>
                      <span className="text-[11px] font-semibold tabular-nums">{fmt(card.balance)}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--color-progress-bar)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Col 2: This Month + Streak stacked */}
          <div className="flex flex-col gap-3">
            <MiniStat
              label={t('sav.thisMonth')}
              icon={PiggyBank}
              value={fmt(netThisMonth)}
              sub={thisMonthOut > 0 ? `${fmt(thisMonthIn)} in · ${fmt(thisMonthOut)} out` : `${fmt(thisMonthIn)} ${t('sav.deposited').toLowerCase()}`}
              color={netThisMonth >= 0 ? C_IN : C_OUT}
            />
            <MiniStat
              label={t('sav.streakLabel')}
              icon={Flame}
              value={`${streak} mo`}
              sub={streak === 0 ? t('sav.streakStart') : streak === 1 ? t('sav.streak1') : t('sav.streakN', { n: streak })}
              color={streak > 0 ? C_IN : undefined}
            />
          </div>

          {/* Col 3: Savings Rate + Best Month stacked */}
          <div className="flex flex-col gap-3">
            <MiniStat
              label={t('sav.savingsRate')}
              icon={Percent}
              value={savingsRate !== null ? `${savingsRate.toFixed(1)}%` : '—'}
              sub={savingsRate === null ? t('sav.noIncome') : savingsRate >= 20 ? t('sav.goalMet') : t('sav.goalTarget')}
              color={savingsRate !== null && savingsRate >= 20 ? C_IN : savingsRate !== null && savingsRate < 0 ? C_OUT : undefined}
            />
            <MiniStat
              label={t('sav.bestMonth')}
              icon={Trophy}
              value={bestMonth ? fmt(bestMonth.amount) : '—'}
              sub={bestMonth?.label ?? t('sav.noDataYet')}
              color={C_IN}
            />
          </div>

          {/* Col 4: Withdrawals alert */}
          {(() => {
            const monthWithdrawals = withdrawals
              .filter(t => t.date.startsWith(monthKey))
              .sort((a, b) => b.date.localeCompare(a.date))

            const cleanStreak = streak


            const ALERT = 'var(--color-alert)'
            return (
              <div className="glass-card rounded-2xl p-5 flex flex-col" style={dipsCount > 0 ? { border: '1px solid color-mix(in srgb, var(--color-alert) 25%, transparent)' } : {}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={13} style={{ color: dipsCount > 0 ? ALERT : 'rgba(255,255,255,0.25)' }} />
                    <h2 className="text-sm font-semibold">{t('sav.withdrawalsTitle')}</h2>
                  </div>
                  {dipsCount > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-alert) 15%, transparent)', color: ALERT }}>
                      {fmt(thisMonthOut)} total
                    </span>
                  )}
                </div>

                <p className="text-2xl font-bold mb-3" style={{ color: dipsCount === 0 ? C_IN : ALERT }}>
                  {dipsCount}×
                </p>
                <div className="flex flex-col gap-1.5">
                  {dipsCount > 0 && monthWithdrawals.map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                      <span className="text-[11px] text-muted">{t.date}</span>
                      <span className="text-[11px] font-semibold tabular-nums" style={{ color: ALERT }}>−{fmt(t.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-[11px] text-muted">{t('sav.cleanStreak')}</span>
                    <span className="text-[11px] font-semibold" style={{ color: cleanStreak > 0 ? C_IN : undefined }}>{cleanStreak} mo</span>
                  </div>
                </div>
              </div>
            )
          })()}

        {/* Col 5 row 1: Monthly target */}
        {(() => {
          const today       = new Date()
          const daysInMonth = new Date(year, month + 1, 0).getDate()
          const dayOfMonth  = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
            ? today.getDate() : daysInMonth
          const daysLeft    = daysInMonth - dayOfMonth
          const remaining   = target > 0 ? Math.max(target - thisMonthIn, 0) : 0
          const dailyNeeded = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0
          const onTrack     = target > 0 && dayOfMonth > 0 && (thisMonthIn / dayOfMonth) >= (target / daysInMonth)
          return (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold">{t('sav.monthlyTarget')}</h2>
                  <p className="text-[11px] text-muted mt-0.5">
                    {target > 0 ? t('sav.targetOf', { amount: fmt(thisMonthIn), target: fmt(target) }) : t('sav.noTargetSet')}
                  </p>
                </div>
                <button
                  onClick={() => { setTargetInput(target > 0 ? String(target) : ''); setEditingTarget(v => !v) }}
                  className="text-[11px] text-muted hover:text-white transition-colors px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  {target > 0 ? t('sav.editTarget') : t('sav.setTarget')}
                </button>
              </div>
              {editingTarget && (
                <div className="flex gap-2 mb-3">
                  <input
                    autoFocus
                    type="number"
                    value={targetInput}
                    onChange={e => setTargetInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveTarget(targetInput)}
                    placeholder="e.g. 500"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-white/25"
                  />
                  <button onClick={() => saveTarget(targetInput)} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs hover:bg-white/15 transition-colors">{t('common.save')}</button>
                  <button onClick={() => setEditingTarget(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-white transition-colors">{t('common.cancel')}</button>
                </div>
              )}
              {target > 0 ? (
                <>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${targetPct}%`, background: targetPct >= 100 ? C_IN : 'var(--color-progress-bar)' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted">{t('sav.progressLabel')}</span>
                      <span className="text-[11px] font-semibold">{targetPct.toFixed(0)}%{targetPct >= 100 ? ' 🎉' : ''}</span>
                    </div>
                    {targetPct < 100 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted">{t('sav.daysLeft')}</span>
                          <span className="text-[11px] font-semibold">{daysLeft}d</span>
                        </div>
                        {dailyNeeded > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted">{t('sav.neededPerDay')}</span>
                            <span className="text-[11px] font-semibold">{fmt(dailyNeeded)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[11px] text-muted">{t('sav.onTrack')}</span>
                          <span className="text-[11px] font-semibold" style={{ color: onTrack ? C_IN : C_OUT }}>
                            {onTrack ? t('sav.onTrackYes') : t('sav.onTrackNo')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-muted">{t('sav.setTargetPrompt')}</p>
              )}
            </div>
          )
        })()}

        {/* Row 2: savings flow (span 4) */}
        <div className="glass-card rounded-2xl pt-5 px-5 pb-1 flex flex-col" style={{ gridColumn: '1 / span 4', alignSelf: 'stretch' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold">{t('sav.flowTitle')}</h2>
              <p className="text-[11px] text-muted mt-0.5">{t('sav.flowSub')}</p>
            </div>
            <ViewToggle value={savingsView} onChange={setSavingsView} t={t} />
          </div>
          {loading
            ? <div className="flex-1 flex items-center justify-center text-xs text-muted">{t('common.loading')}</div>
            : deposits.length === 0
            ? <div className="flex-1 flex items-center justify-center text-xs text-muted">{t('sav.noDataYetPeriod')}</div>
            : <div className="flex-1 min-h-0" style={{ minHeight: 140 }}><SavingsLineChart data={savingsChartData} /></div>}
        </div>

        {/* Col 5 row 2: Recent activity */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col" style={{ alignSelf: 'stretch' }}>
          <div className="px-5 pt-4 pb-3 border-b border-white/5">
            <h2 className="text-sm font-semibold">{t('sav.recentActivity')}</h2>
          </div>
          {loading ? (
            <div className="px-5 py-4 text-xs text-muted">{t('common.loading')}</div>
          ) : recent.length === 0 ? (
            <div className="px-5 py-4 text-xs text-muted">{t('sav.noTxYet')}</div>
          ) : (
            <div className="overflow-y-auto">
              {recent.map((tx, i) => {
                const isIn  = tx.source === 'savings_in'
                const color = isIn ? C_IN : C_OUT
                const sign  = isIn ? '+' : '−'
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                      <PiggyBank size={13} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate leading-tight">
                        {tx.description || (isIn ? t('sav.deposit') : t('sav.withdrawal'))}
                      </p>
                      <p className="text-[10px] text-muted">{tx.date}</p>
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums flex-shrink-0" style={{ color }}>
                      {sign}{fmt(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Row 3: Monthly heatmap (col 1) + Net flow (cols 2–5) */}
        <MonthlyHeatmap
          deposits={deposits}
          withdrawals={withdrawals}
          currentDate={currentDate}
          color={tc.lineChart}
          t={t}
        />

        <div className="glass-card rounded-2xl p-5 flex flex-col" style={{ gridColumn: '2 / span 4', alignSelf: 'stretch' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">{t('sav.netFlowTitle')}</h2>
              <p className="text-[11px] text-muted mt-0.5">{t('sav.netFlowSub')}</p>
            </div>
            <ViewToggle value={flowView} onChange={setFlowView} t={t} />
          </div>
          {loading
            ? <div className="flex-1 flex items-center justify-center text-xs text-muted">{t('common.loading')}</div>
            : allTxs.length === 0
            ? <div className="flex-1 flex items-center justify-center text-xs text-muted">{t('sav.noDataYetPeriod')}</div>
            : <div className="flex-1 min-h-0" style={{ minHeight: 140 }}><NetFlowChart data={flowChartData} view={flowView} /></div>}
        </div>

        </div>{/* end 5-col grid */}

        {/* Savings Goals */}
        <SavingsGoals totalBalance={totalBalance} showSlider />

      </div>
    </div>
  )
}
