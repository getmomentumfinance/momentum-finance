import { useMemo, useState, useRef } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { Wallet, Banknote, LineChart as LineChartIcon, PiggyBank, TrendingUp, CreditCard, TrendingDown } from 'lucide-react'
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
  let debitCredit = 0
  for (const card of cards) {
    if (!DEBIT_CREDIT.has(card.type)) continue
    const delta = allTxs
      .filter(t => t.card_id === card.id && !t.is_cash)
      .reduce((s, t) => s + (CREDIT.has(t.type) ? t.amount : -t.amount), 0)
    debitCredit += Number(card.initial_balance) + delta
  }
  const cashInitial = cards.filter(c => c.type === 'cash').reduce((s, c) => s + Number(c.initial_balance), 0)
  const cashDelta   = allTxs.filter(t => t.is_cash).reduce((s, t) => s + (CREDIT.has(t.type) ? t.amount : -t.amount), 0)
  const cash        = cashInitial + cashDelta
  const total       = debitCredit + cash

  const savingsInitial = cards.filter(c => c.type === 'savings').reduce((s, c) => s + Number(c.initial_balance), 0)
  const savIn          = allTxs.filter(t => t.source === 'savings_in'  && t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const savOut         = allTxs.filter(t => t.source === 'savings_out' && t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const savings        = savingsInitial + savIn - savOut

  let invest = 0
  for (const card of cards) {
    if (card.type !== 'invest') continue
    const delta = allTxs
      .filter(t => t.card_id === card.id && !t.is_cash)
      .reduce((s, t) => s + (CREDIT.has(t.type) ? t.amount : -t.amount), 0)
    invest += Number(card.initial_balance) + delta
  }

  const y = currentDate.getFullYear(), m = currentDate.getMonth()
  const monthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const monthEnd   = new Date(y, m + 1, 0).toISOString().slice(0, 10)
  const income = allTxs
    .filter(t => t.type === 'income' && t.date >= monthStart && t.date <= monthEnd)
    .reduce((s, t) => s + t.amount, 0)

  const perCard = {}
  for (const card of cards) {
    if (card.type === 'cash') {
      perCard[card.id] = Number(card.initial_balance) + cashDelta
    } else if (card.type === 'savings') {
      const si = allTxs.filter(t => t.card_id === card.id && t.source === 'savings_in').reduce((s,t)=>s+t.amount,0)
      const so = allTxs.filter(t => t.card_id === card.id && t.source === 'savings_out').reduce((s,t)=>s+t.amount,0)
      perCard[card.id] = Number(card.initial_balance) + si - so
    } else {
      const delta = allTxs
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
      res.push({ key: toStr(d), label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), fullLabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) })
    }
  } else if (range === 'month') {
    const days = new Date(y, m + 1, 0).getDate()
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const date = new Date(y, m, d)
      res.push({ key, label: (d === 1 || d % 5 === 0 || d === days) ? String(d) : '', fullLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })
    }
  } else if (range === '3m') {
    const start = new Date(y, m - 2, 1), end = new Date(y, m + 1, 0), cur = new Date(start)
    while (cur <= end) {
      res.push({ key: toStr(cur), label: cur.getDate() === 1 ? cur.toLocaleDateString('en-US', { month: 'short' }) : '', fullLabel: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })
      cur.setDate(cur.getDate() + 1)
    }
  } else if (range === 'year') {
    const start = new Date(y, 0, 1), end = new Date(y, 11, 31), cur = new Date(start)
    while (cur <= end) {
      res.push({ key: toStr(cur), label: cur.getDate() === 1 ? cur.toLocaleDateString('en-US', { month: 'short' }) : '', fullLabel: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })
      cur.setDate(cur.getDate() + 1)
    }
  } else {
    const from = firstTxDate ? new Date(firstTxDate.slice(0, 7) + '-01') : new Date(new Date().getFullYear() - 3, 0, 1)
    const now  = new Date(); now.setDate(1)
    const cur  = new Date(from)
    while (cur <= now) {
      const last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      const lbl  = cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      res.push({ key: toStr(last), label: lbl, fullLabel: cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) })
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return res
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function FlowTooltip({ active, payload, label, fmt, chartData, activeKeys }) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value != null && activeKeys.has(p.dataKey))
  if (!items.length) return null

  // Find this data point and the previous one for delta
  const cur     = payload[0]?.payload
  const curIdx  = chartData.findIndex(d => d.key === cur?.key)
  const prev    = curIdx > 0 ? chartData[curIdx - 1] : null

  return (
    <div style={{ background: 'var(--color-dash-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12, padding: '10px 14px', minWidth: 190 }}>
      <p style={{ color: MUTED, marginBottom: 8, fontSize: 11 }}>{cur?.fullLabel ?? label}</p>
      {items.map((p, i) => {
        const delta    = prev != null ? p.value - prev[p.dataKey] : null
        const positive = delta >= 0
        return (
          <div key={i} style={{ marginBottom: i < items.length - 1 ? 6 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ color: p.color, fontWeight: 500 }}>{p.name}</span>
              <span style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.value)}</span>
            </div>
            {delta !== null && Math.abs(delta) > 0.01 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 1 }}>
                <span style={{ fontSize: 10, color: positive ? 'var(--type-income, #4ade80)' : 'var(--type-expense, #f87171)', fontVariantNumeric: 'tabular-nums' }}>
                  {positive ? '▲' : '▼'} {fmt(Math.abs(delta))}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function MoneyFlowTab({ range, currentDate }) {
  const { cards, allTransactions } = useSharedData()
  const { fmt, fmtK }   = usePreferences()
  const colors          = useThemeColors()
  const colorInputRefs  = useRef({})

  const current = useMemo(
    () => computeCurrentValues(cards, allTransactions, currentDate),
    [cards, allTransactions, currentDate]
  )

  const DEFAULT_COLORS = useMemo(() => ({
    total:   colors.accent ?? '#a78bfa',
    cash:    '#fbbf24',
    invest:  '#f472b6',
    savings: '#818cf8',
    income:  colors.income ?? '#4ade80',
  }), [colors.accent, colors.income])

  const [customColors, setCustomColors] = useState({})
  function setColor(key, hex) { setCustomColors(prev => ({ ...prev, [key]: hex })) }
  function getColor(key, defaultColor) { return customColors[key] ?? defaultColor }

  const METRICS = useMemo(() => [
    { key: 'total',   label: 'Total Balance', Icon: Wallet,        color: DEFAULT_COLORS.total   },
    { key: 'cash',    label: 'Cash',          Icon: Banknote,      color: DEFAULT_COLORS.cash    },
    { key: 'invest',  label: 'Investments',   Icon: LineChartIcon, color: DEFAULT_COLORS.invest  },
    { key: 'savings', label: 'Savings',       Icon: PiggyBank,     color: DEFAULT_COLORS.savings },
    { key: 'income',  label: 'Income',        Icon: TrendingUp,    color: DEFAULT_COLORS.income  },
  ], [DEFAULT_COLORS])

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

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!cards.length) return []
    const cardById = Object.fromEntries(cards.map(c => [c.id, c]))
    const sorted   = [...allTransactions].sort((a, b) => a.date.localeCompare(b.date))
    const firstDate = sorted.length ? sorted[0].date : null
    const dates     = buildDates(range, currentDate, firstDate)
    if (!dates.length) return []

    const rangeStart = dates[0].key
    let debitCredit = cards.filter(c => DEBIT_CREDIT.has(c.type)).reduce((s, c) => s + Number(c.initial_balance), 0)
    let cash        = cards.filter(c => c.type === 'cash').reduce((s, c) => s + Number(c.initial_balance), 0)
    let savings     = cards.filter(c => c.type === 'savings').reduce((s, c) => s + Number(c.initial_balance), 0)
    let invest      = cards.filter(c => c.type === 'invest').reduce((s, c) => s + Number(c.initial_balance), 0)
    let income      = 0
    const bal = Object.fromEntries(cards.map(c => [c.id, Number(c.initial_balance ?? 0)]))
    let ti = 0

    return dates.map(({ key, label, fullLabel }) => {
      while (ti < sorted.length && sorted[ti].date <= key) {
        const tx   = sorted[ti++]
        const card = cardById[tx.card_id]
        const sign = CREDIT.has(tx.type) ? 1 : -1
        if (tx.is_cash) {
          cash += sign * Number(tx.amount)
          if (card?.type === 'cash') bal[card.id] += sign * Number(tx.amount)
        } else if (tx.source === 'savings_in' && tx.amount > 0) {
          savings += Number(tx.amount)
          if (card?.type === 'savings') bal[card.id] += Number(tx.amount)
        } else if (tx.source === 'savings_out' && tx.amount > 0) {
          savings -= Number(tx.amount)
          if (card?.type === 'savings') bal[card.id] -= Number(tx.amount)
        } else if (card) {
          if (DEBIT_CREDIT.has(card.type)) { debitCredit += sign * Number(tx.amount); bal[card.id] += sign * Number(tx.amount) }
          else if (card.type === 'invest')  { invest      += sign * Number(tx.amount); bal[card.id] += sign * Number(tx.amount) }
        }
        if (tx.type === 'income' && !tx.is_cash && tx.date >= rangeStart) income += Number(tx.amount)
      }
      const snap = { key, label, fullLabel, total: debitCredit + cash, cash, savings, invest, income }
      for (const c of cards) snap[`card_${c.id}`] = bal[c.id]
      return snap
    })
  }, [cards, allTransactions, range, currentDate])

  // ── Stats per selected line (over the chart range) ──────────────────────────
  const lineStats = useMemo(() => {
    if (!chartData.length) return {}
    const stats = {}
    for (const key of selected) {
      let lo = Infinity, hi = -Infinity
      for (const d of chartData) {
        const v = d[key]
        if (v == null) continue
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
      const start = chartData[0][key] ?? 0
      const end   = chartData[chartData.length - 1][key] ?? 0
      const net   = end - start
      const pct   = start !== 0 ? (net / Math.abs(start)) * 100 : null
      stats[key]  = { start, end, net, pct, hi: hi === Infinity ? 0 : hi, lo: lo === Infinity ? 0 : lo }
    }
    return stats
  }, [chartData, selected])

  // ── Y-axis domain ────────────────────────────────────────────────────────────
  const yDomain = useMemo(() => {
    if (!chartData.length) return ['auto', 'auto']
    let lo = Infinity, hi = -Infinity
    for (const d of chartData) {
      for (const key of selected) {
        const v = d[key]; if (v == null) continue
        if (v < lo) lo = v; if (v > hi) hi = v
      }
    }
    if (lo === Infinity) return ['auto', 'auto']
    const pad = Math.max((hi - lo) * 0.08, Math.abs(hi) * 0.04, 50)
    return [Math.floor((lo - pad) / 100) * 100, Math.ceil((hi + pad) / 100) * 100]
  }, [chartData, selected])

  function chipValue(key) {
    if (key === 'total')   return current.total
    if (key === 'cash')    return current.cash
    if (key === 'savings') return current.savings
    if (key === 'invest')  return current.invest
    if (key === 'income')  return current.income
    return current.perCard[key.replace('card_', '')] ?? 0
  }

  if (!cards.length) return (
    <div className="flex items-center justify-center h-48 text-white/30 text-sm">No accounts found.</div>
  )

  function renderChips(defs) {
    return defs.map(({ key, label, Icon, color: defaultColor }) => {
      const on    = selected.has(key)
      const color = getColor(key, defaultColor)
      return (
        <div key={key} className="flex items-center">
          <button type="button" onClick={() => toggle(key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
              on ? 'border-transparent' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
            }`}
            style={on ? { background: `color-mix(in srgb, ${color} 15%, transparent)`, borderColor: `color-mix(in srgb, ${color} 40%, transparent)`, color } : undefined}
          >
            <Icon size={12} />
            {label}
            <span className="opacity-60 font-normal tabular-nums">{fmtK(chipValue(key))}</span>
            {on && (
              <span
                className="w-3 h-3 rounded-full border border-white/30 shrink-0 cursor-pointer hover:scale-110 transition-transform"
                style={{ background: color }}
                onClick={e => { e.stopPropagation(); colorInputRefs.current[key]?.click() }}
              />
            )}
          </button>
          <input
            type="color"
            className="sr-only"
            ref={el => { colorInputRefs.current[key] = el }}
            value={color}
            onChange={e => setColor(key, e.target.value)}
          />
        </div>
      )
    })
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Filter chips ── */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">{renderChips(METRICS)}</div>
        {cardDefs.length > 0 && <div className="flex flex-wrap gap-2">{renderChips(cardDefs)}</div>}
      </div>

      {/* ── Chart ── */}
      <div className="glass-card rounded-2xl p-4">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-white/30 text-sm">No data for this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height={460}>
            <AreaChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
              <defs>
                {allDefs.map(({ key, color: defaultColor }) => {
                  const color = getColor(key, defaultColor)
                  return (
                    <linearGradient key={key} id={`mf-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  )
                })}
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={72} domain={yDomain} />
              <Tooltip
                content={<FlowTooltip fmt={fmt} chartData={chartData} activeKeys={selected} />}
                cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              {allDefs.map(({ key, label, color: defaultColor }) => {
                if (!selected.has(key)) return null
                const color = getColor(key, defaultColor)
                return (
                  <Area key={key} type="monotone" dataKey={key} name={label}
                    stroke={color} strokeWidth={key === 'total' ? 2.5 : 1.5}
                    fill={`url(#mf-${key})`} dot={false}
                    activeDot={{ r: 4, fill: color, stroke: 'var(--color-dash-card)', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Stats row — one card per selected line ── */}
      {selected.size > 0 && chartData.length > 1 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(selected.size, 4)}, 1fr)` }}>
          {[...selected].map(key => {
            const def   = allDefs.find(d => d.key === key)
            if (!def) return null
            const color = getColor(key, def.color)
            const s     = lineStats[key]
            if (!s) return null
            const up    = s.net >= 0
            return (
              <div key={key} className="glass-card rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color }}>{def.label}</span>
                  <span className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {s.pct != null ? `${Math.abs(s.pct).toFixed(1)}%` : '—'}
                  </span>
                </div>
                <p className="text-xl font-bold tabular-nums">{fmt(chipValue(key))}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
                  <span className="text-[10px] text-white/35">Period start</span>
                  <span className="text-[10px] text-white/60 tabular-nums text-right">{fmtK(s.start)}</span>
                  <span className="text-[10px] text-white/35">Net change</span>
                  <span className={`text-[10px] tabular-nums text-right font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>{up ? '+' : ''}{fmtK(s.net)}</span>
                  <span className="text-[10px] text-white/35">High</span>
                  <span className="text-[10px] text-white/60 tabular-nums text-right">{fmtK(s.hi)}</span>
                  <span className="text-[10px] text-white/35">Low</span>
                  <span className="text-[10px] text-white/60 tabular-nums text-right">{fmtK(s.lo)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
