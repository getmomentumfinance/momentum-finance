import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { Wallet, Banknote, LineChart as LineChartIcon, PiggyBank, TrendingUp, CreditCard } from 'lucide-react'
import { useSharedData } from '../../context/SharedDataContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useThemeColors } from '../../hooks/useThemeColors'

const CREDIT       = new Set(['income'])
const DEBIT_CREDIT = new Set(['debit', 'credit'])
const CARD_PALETTE = ['#38bdf8','#fb923c','#a3e635','#e879f9','#2dd4bf','#f87171','#facc15','#a78bfa']
const MUTED        = 'rgba(255,255,255,0.35)'
const GRID         = 'rgba(255,255,255,0.04)'

// ── Exact same formulas as Dashboard.jsx ────────────────────────────────────
function computeCurrentValues(cards, allTxs, currentDate) {
  const nonSplit = allTxs.filter(t => !t.split_parent_id)

  // debit + credit running balance
  let debitCredit = 0
  for (const card of cards) {
    if (!DEBIT_CREDIT.has(card.type)) continue
    const delta = nonSplit
      .filter(t => t.card_id === card.id && !t.is_cash)
      .reduce((s, t) => s + (CREDIT.has(t.type) ? t.amount : -t.amount), 0)
    debitCredit += Number(card.initial_balance) + delta
  }

  // cash
  const cashInitial = cards.filter(c => c.type === 'cash').reduce((s, c) => s + Number(c.initial_balance), 0)
  const cashDelta   = nonSplit.filter(t => t.is_cash).reduce((s, t) => s + (CREDIT.has(t.type) ? t.amount : -t.amount), 0)
  const cash        = cashInitial + cashDelta
  const total       = debitCredit + cash

  // savings — global savings_in / savings_out (matches dashboard exactly)
  const savingsInitial = cards.filter(c => c.type === 'savings').reduce((s, c) => s + Number(c.initial_balance), 0)
  const savIn          = nonSplit.filter(t => t.source === 'savings_in'  && t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const savOut         = nonSplit.filter(t => t.source === 'savings_out' && t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const savings        = savingsInitial + savIn - savOut

  // invest card balance (cost basis — not live market value)
  let invest = 0
  for (const card of cards) {
    if (card.type !== 'invest') continue
    const delta = nonSplit
      .filter(t => t.card_id === card.id && !t.is_cash)
      .reduce((s, t) => s + (CREDIT.has(t.type) ? t.amount : -t.amount), 0)
    invest += Number(card.initial_balance) + delta
  }

  // income this month (same as dashboard stat card)
  const y = currentDate.getFullYear(), m = currentDate.getMonth()
  const monthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const monthEnd   = new Date(y, m + 1, 0).toISOString().slice(0, 10)
  const income = nonSplit
    .filter(t => t.type === 'income' && t.date >= monthStart && t.date <= monthEnd)
    .reduce((s, t) => s + t.amount, 0)

  // per-card current balances
  const perCard = {}
  for (const card of cards) {
    if (card.type === 'cash') {
      perCard[card.id] = Number(card.initial_balance) + cashDelta
    } else if (card.type === 'savings') {
      const si = nonSplit.filter(t => t.card_id === card.id && t.source === 'savings_in').reduce((s,t)=>s+t.amount,0)
      const so = nonSplit.filter(t => t.card_id === card.id && t.source === 'savings_out').reduce((s,t)=>s+t.amount,0)
      perCard[card.id] = Number(card.initial_balance) + si - so
    } else {
      const delta = nonSplit
        .filter(t => t.card_id === card.id && !t.is_cash)
        .reduce((s, t) => s + (CREDIT.has(t.type) ? t.amount : -t.amount), 0)
      perCard[card.id] = Number(card.initial_balance) + delta
    }
  }

  return { total, cash, savings, invest, income, perCard }
}

// ── Date generation ──────────────────────────────────────────────────────────
function toStr(d) { return d.toISOString().slice(0, 10) }

function buildDates(range, currentDate, firstTxDate) {
  const y = currentDate.getFullYear(), m = currentDate.getMonth()
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
    const now  = new Date(); now.setDate(1)
    const cur  = new Date(from)
    while (cur <= now) {
      const last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      res.push({ key: toStr(last), label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) })
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return res
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function FlowTooltip({ active, payload, label, fmt }) {
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

// ── Main component ───────────────────────────────────────────────────────────
export default function MoneyFlowTab({ range, currentDate }) {
  const { cards, allTransactions } = useSharedData()
  const { fmt, fmtK }   = usePreferences()
  const colors          = useThemeColors()

  // Current values computed with exact same formulas as the dashboard stat cards
  const current = useMemo(
    () => computeCurrentValues(cards, allTransactions, currentDate),
    [cards, allTransactions, currentDate]
  )

  const METRICS = useMemo(() => [
    { key: 'total',   label: 'Total Balance', Icon: Wallet,        color: colors.accent ?? '#a78bfa' },
    { key: 'cash',    label: 'Cash',          Icon: Banknote,      color: '#fbbf24' },
    { key: 'invest',  label: 'Investments',   Icon: LineChartIcon, color: '#f472b6' },
    { key: 'savings', label: 'Savings',       Icon: PiggyBank,     color: '#818cf8' },
    { key: 'income',  label: 'Income',        Icon: TrendingUp,    color: colors.income ?? '#4ade80' },
  ], [colors.accent, colors.income])

  const cardDefs = useMemo(() =>
    cards.map((c, i) => ({
      key: `card_${c.id}`, label: c.name, Icon: CreditCard,
      color: CARD_PALETTE[i % CARD_PALETTE.length], card: c,
    }))
  , [cards])

  const allDefs = useMemo(() => [...METRICS, ...cardDefs], [METRICS, cardDefs])

  const [selected, setSelected] = useState(new Set(['total']))
  function toggle(key) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key); if (next.size === 0) next.add('total') }
      else next.add(key)
      return next
    })
  }

  // ── Chart data — running balances using exact dashboard formulas ────────────
  const chartData = useMemo(() => {
    if (!cards.length) return []

    const cardById  = Object.fromEntries(cards.map(c => [c.id, c]))
    const nonSplit  = allTransactions.filter(t => !t.split_parent_id)
    const sorted    = [...nonSplit].sort((a, b) => a.date.localeCompare(b.date))
    const firstDate = sorted.length ? sorted[0].date : null
    const dates     = buildDates(range, currentDate, firstDate)
    if (!dates.length) return []

    const rangeStart = dates[0].key

    // Seed accumulators from initial balances
    let debitCredit = cards.filter(c => DEBIT_CREDIT.has(c.type)).reduce((s, c) => s + Number(c.initial_balance), 0)
    let cash        = cards.filter(c => c.type === 'cash').reduce((s, c) => s + Number(c.initial_balance), 0)
    let savings     = cards.filter(c => c.type === 'savings').reduce((s, c) => s + Number(c.initial_balance), 0)
    let invest      = cards.filter(c => c.type === 'invest').reduce((s, c) => s + Number(c.initial_balance), 0)
    let income      = 0  // resets at range start

    // Per-card
    const bal = Object.fromEntries(cards.map(c => [c.id, Number(c.initial_balance ?? 0)]))

    let ti = 0
    return dates.map(({ key, label }) => {
      while (ti < sorted.length && sorted[ti].date <= key) {
        const tx   = sorted[ti++]
        const card = cardById[tx.card_id]
        const sign = CREDIT.has(tx.type) ? 1 : -1

        if (tx.is_cash) {
          // Affects cash aggregate and cash card(s)
          cash += sign * Number(tx.amount)
          if (card?.type === 'cash') bal[card.id] += sign * Number(tx.amount)

        } else if (tx.source === 'savings_in' && tx.amount > 0) {
          // Savings_in — global aggregate + per-card
          savings += Number(tx.amount)
          if (card?.type === 'savings') bal[card.id] += Number(tx.amount)

        } else if (tx.source === 'savings_out' && tx.amount > 0) {
          // Savings_out — global aggregate + per-card
          savings -= Number(tx.amount)
          if (card?.type === 'savings') bal[card.id] -= Number(tx.amount)

        } else if (card) {
          // Regular transaction on a specific card
          if (DEBIT_CREDIT.has(card.type)) {
            debitCredit    += sign * Number(tx.amount)
            bal[card.id]   += sign * Number(tx.amount)
          } else if (card.type === 'invest') {
            invest         += sign * Number(tx.amount)
            bal[card.id]   += sign * Number(tx.amount)
          }
        }

        // Income cumulative — only count from range start
        if (tx.type === 'income' && !tx.is_cash && tx.date >= rangeStart) {
          income += Number(tx.amount)
        }
      }

      const snap = {
        key, label,
        total:   debitCredit + cash,
        cash,
        savings,
        invest,
        income,
      }
      for (const c of cards) snap[`card_${c.id}`] = bal[c.id]
      return snap
    })
  }, [cards, allTransactions, range, currentDate])

  // ── Y-axis domain ────────────────────────────────────────────────────────
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

  // ── Current value for a filter chip key ──────────────────────────────────
  function chipValue(key) {
    if (key === 'total')   return current.total
    if (key === 'cash')    return current.cash
    if (key === 'savings') return current.savings
    if (key === 'invest')  return current.invest
    if (key === 'income')  return current.income
    const id = key.replace('card_', '')
    return current.perCard[id] ?? 0
  }

  if (!cards.length) return (
    <div className="flex items-center justify-center h-48 text-white/30 text-sm">No accounts found.</div>
  )

  return (
    <div className="flex flex-col gap-5">

      {/* ── Summary metric chips ── */}
      <div className="flex flex-col gap-2">
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
                <span className="opacity-60 font-normal tabular-nums">{fmtK(chipValue(key))}</span>
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
                  <span className="opacity-60 font-normal tabular-nums">{fmtK(chipValue(key))}</span>
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
