import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { Wallet, Banknote, LineChart as LineChartIcon, PiggyBank, TrendingUp, CreditCard } from 'lucide-react'
import { useSharedData } from '../../context/SharedDataContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useThemeColors } from '../../hooks/useThemeColors'

// How each card type contributes to balance metrics
const BALANCE_TYPES = new Set(['debit', 'credit'])
const CARD_PALETTE  = ['#38bdf8','#fb923c','#a3e635','#e879f9','#2dd4bf','#f87171','#facc15','#a78bfa']

function toStr(d) { return d.toISOString().slice(0, 10) }

function buildDates(range, currentDate, firstTxDate) {
  const y = currentDate.getFullYear()
  const m = currentDate.getMonth()
  const res = []

  if (range === 'week') {
    const mon = new Date(currentDate)
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7))
    mon.setHours(0, 0, 0, 0)
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon); d.setDate(mon.getDate() + i)
      res.push({ key: toStr(d), label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) })
    }
  } else if (range === 'month') {
    const days = new Date(y, m + 1, 0).getDate()
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      res.push({ key, label: (d === 1 || d % 5 === 0 || d === days) ? String(d) : '' })
    }
  } else if (range === '3m') {
    const start = new Date(y, m - 2, 1), end = new Date(y, m + 1, 0), cur = new Date(start)
    while (cur <= end) {
      res.push({ key: toStr(cur), label: cur.getDate() === 1 ? cur.toLocaleDateString('en-US', { month: 'short' }) : '' })
      cur.setDate(cur.getDate() + 1)
    }
  } else if (range === 'year') {
    const start = new Date(y, 0, 1), end = new Date(y, 11, 31), cur = new Date(start)
    while (cur <= end) {
      res.push({ key: toStr(cur), label: cur.getDate() === 1 ? cur.toLocaleDateString('en-US', { month: 'short' }) : '' })
      cur.setDate(cur.getDate() + 1)
    }
  } else {
    const from = firstTxDate ? new Date(firstTxDate.slice(0, 7) + '-01') : new Date(new Date().getFullYear() - 3, 0, 1)
    const now = new Date(); now.setDate(1)
    const cur = new Date(from)
    while (cur <= now) {
      const last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      res.push({ key: toStr(last), label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) })
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return res
}

const MUTED = 'rgba(255,255,255,0.35)'
const GRID  = 'rgba(255,255,255,0.04)'

function FlowTooltip({ active, payload, label, fmt, filterDefs }) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value != null)
  if (!items.length) return null
  return (
    <div style={{ background: 'var(--color-dash-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12, padding: '8px 12px', minWidth: 170 }}>
      <p style={{ color: MUTED, marginBottom: 6, fontSize: 11 }}>{label}</p>
      {items.map((p, i) => (
        <p key={i} style={{ color: '#fff', padding: '1px 0' }}>
          <span style={{ color: p.color }}>{p.name}</span>{': '}
          <span className="tabular-nums">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function MoneyFlowTab({ range, currentDate }) {
  const { cards, allTransactions } = useSharedData()
  const { fmt, fmtK } = usePreferences()
  const colors = useThemeColors()

  // ── Summary metric definitions (matching homepage stat cards) ──
  const METRICS = useMemo(() => [
    { key: 'total',   label: 'Total Balance', Icon: Wallet,         color: colors.accent  ?? '#a78bfa' },
    { key: 'cash',    label: 'Cash',          Icon: Banknote,       color: '#fbbf24' },
    { key: 'invest',  label: 'Investments',   Icon: LineChartIcon,  color: '#f472b6' },
    { key: 'savings', label: 'Savings',       Icon: PiggyBank,      color: '#818cf8' },
    { key: 'income',  label: 'Income',        Icon: TrendingUp,     color: colors.income  ?? '#4ade80' },
  ], [colors.accent, colors.income])

  // ── Per-card definitions (user cards) ──
  const cardDefs = useMemo(() =>
    cards.map((c, i) => ({
      key:   `card_${c.id}`,
      label: c.name,
      Icon:  CreditCard,
      color: CARD_PALETTE[i % CARD_PALETTE.length],
      card:  c,
    }))
  , [cards])

  const allDefs = useMemo(() => [...METRICS, ...cardDefs], [METRICS, cardDefs])

  // ── Selection state — default: Total Balance only ──
  const [selected, setSelected] = useState(new Set(['total']))
  function toggle(key) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key); if (next.size === 0) next.add('total') }
      else next.add(key)
      return next
    })
  }

  // ── Chart data ──
  const chartData = useMemo(() => {
    if (!cards.length) return []

    const cardById = Object.fromEntries(cards.map(c => [c.id, c]))

    // Sorted, non-split-child transactions
    const sorted = [...allTransactions]
      .filter(t => !t.split_parent_id)
      .sort((a, b) => a.date.localeCompare(b.date))

    const firstDate = sorted.length ? sorted[0].date : null
    const dates = buildDates(range, currentDate, firstDate)
    if (!dates.length) return []

    // Running per-card balance, seeded with initial_balance
    const bal     = Object.fromEntries(cards.map(c => [c.id, Number(c.initial_balance ?? 0)]))
    let   income  = 0   // cumulative income
    let   ti      = 0   // transaction pointer

    return dates.map(({ key, label }) => {
      // Advance transactions up to this date
      while (ti < sorted.length && sorted[ti].date <= key) {
        const tx   = sorted[ti++]
        const card = cardById[tx.card_id]
        if (!card) continue

        if (card.type === 'cash') {
          // Cash cards: only is_cash transactions, income = +, else -
          if (tx.is_cash) {
            bal[card.id] += tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount)
          }
        } else if (card.type === 'savings') {
          // Savings cards: track via savings_in / savings_out source
          if (tx.source === 'savings_in')  bal[card.id] += Number(tx.amount)
          if (tx.source === 'savings_out') bal[card.id] -= Number(tx.amount)
        } else {
          // Debit, credit, invest: non-cash, non-split-child
          if (!tx.is_cash) {
            bal[card.id] += tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount)
          }
        }

        // Track cumulative income regardless of card type
        if (tx.type === 'income' && !tx.is_cash) income += Number(tx.amount)
      }

      // Build snapshot
      let total = 0, cashSum = 0, investSum = 0, savingsSum = 0
      for (const c of cards) {
        const b = bal[c.id]
        if      (c.type === 'cash')    cashSum    += b
        else if (c.type === 'invest')  investSum  += b
        else if (c.type === 'savings') savingsSum += b
        else                           total      += b   // debit + credit
      }
      total += cashSum   // Total Balance = debit+credit+cash (mirrors dashboard)

      const snap = { key, label, total, cash: cashSum, invest: investSum, savings: savingsSum, income }
      for (const c of cards) snap[`card_${c.id}`] = bal[c.id]
      return snap
    })
  }, [cards, allTransactions, range, currentDate])

  // Y-axis domain from visible lines
  const yDomain = useMemo(() => {
    if (!chartData.length) return ['auto', 'auto']
    let lo = Infinity, hi = -Infinity
    for (const d of chartData) {
      for (const key of selected) {
        const v = d[key]
        if (v == null) continue
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
    }
    if (lo === Infinity) return ['auto', 'auto']
    const pad = Math.max((hi - lo) * 0.08, Math.abs(hi) * 0.04, 50)
    return [Math.floor((lo - pad) / 100) * 100, Math.ceil((hi + pad) / 100) * 100]
  }, [chartData, selected])

  // Current values (last data point)
  const last = chartData[chartData.length - 1]

  // Group metrics by whether they have non-zero data
  const hasMetric = useMemo(() => {
    const h = {}
    for (const { key } of METRICS) h[key] = true  // always show summary metrics
    for (const { key } of cardDefs) h[key] = cards.some(c => `card_${c.id}` === key)
    return h
  }, [METRICS, cardDefs, cards])

  if (!cards.length) return (
    <div className="flex items-center justify-center h-48 text-white/30 text-sm">No accounts found.</div>
  )

  return (
    <div className="flex flex-col gap-5">

      {/* ── Filter chips — Summary metrics ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {METRICS.map(({ key, label, Icon, color }) => {
            const on = selected.has(key)
            return (
              <button key={key} type="button" onClick={() => toggle(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  on ? 'border-transparent' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                }`}
                style={on ? { background: `color-mix(in srgb, ${color} 15%, transparent)`, borderColor: `color-mix(in srgb, ${color} 40%, transparent)`, color } : undefined}
              >
                <Icon size={12} />
                {label}
                {last && <span className="opacity-60 font-normal tabular-nums">{fmtK(last[key] ?? 0)}</span>}
              </button>
            )
          })}
        </div>

        {/* Per-card chips */}
        {cardDefs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cardDefs.map(({ key, label, Icon, color }) => {
              const on = selected.has(key)
              return (
                <button key={key} type="button" onClick={() => toggle(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                    on ? 'border-transparent' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                  }`}
                  style={on ? { background: `color-mix(in srgb, ${color} 15%, transparent)`, borderColor: `color-mix(in srgb, ${color} 40%, transparent)`, color } : undefined}
                >
                  <Icon size={12} />
                  {label}
                  {last && <span className="opacity-60 font-normal tabular-nums">{fmtK(last[key] ?? 0)}</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Chart ── */}
      <div className="glass-card rounded-2xl p-4">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-white/30 text-sm">No data for this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                {allDefs.map(({ key, color }) => (
                  <linearGradient key={key} id={`mf-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={72} domain={yDomain} />
              <Tooltip content={<FlowTooltip fmt={fmt} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              {allDefs.map(({ key, label, color }) => selected.has(key) && (
                <Area key={key} type="monotone" dataKey={key} name={label}
                  stroke={color} strokeWidth={key === 'total' ? 2 : 1.5}
                  fill={`url(#mf-${key})`} dot={false}
                  activeDot={{ r: 4, fill: color, stroke: 'var(--color-dash-card)', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}
