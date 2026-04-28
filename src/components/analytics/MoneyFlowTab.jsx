import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { useSharedData } from '../../context/SharedDataContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useThemeColors } from '../../hooks/useThemeColors'

const CREDIT = new Set(['income'])

const TYPE_GROUPS = {
  checking: c => c.type === 'debit' || c.type === 'credit',
  savings:  c => c.type === 'savings',
  invest:   c => c.type === 'invest',
  cash:     c => c.type === 'cash',
}

function toStr(d) {
  return d.toISOString().slice(0, 10)
}

function buildDates(range, currentDate, firstTxDate) {
  const y = currentDate.getFullYear()
  const m = currentDate.getMonth()
  const result = []

  if (range === 'week') {
    const mon = new Date(currentDate)
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7))
    mon.setHours(0, 0, 0, 0)
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon)
      d.setDate(mon.getDate() + i)
      result.push({ key: toStr(d), label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) })
    }
  } else if (range === 'month') {
    const days = new Date(y, m + 1, 0).getDate()
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const label = (d === 1 || d % 5 === 0 || d === days) ? String(d) : ''
      result.push({ key, label })
    }
  } else if (range === '3m') {
    const start = new Date(y, m - 2, 1)
    const end   = new Date(y, m + 1, 0)
    const cur   = new Date(start)
    while (cur <= end) {
      const label = cur.getDate() === 1
        ? cur.toLocaleDateString('en-US', { month: 'short' })
        : ''
      result.push({ key: toStr(cur), label })
      cur.setDate(cur.getDate() + 1)
    }
  } else if (range === 'year') {
    const start = new Date(y, 0, 1)
    const end   = new Date(y, 11, 31)
    const cur   = new Date(start)
    while (cur <= end) {
      const label = cur.getDate() === 1
        ? cur.toLocaleDateString('en-US', { month: 'short' })
        : ''
      result.push({ key: toStr(cur), label })
      cur.setDate(cur.getDate() + 1)
    }
  } else {
    // all — monthly snapshots
    const from = firstTxDate
      ? new Date(firstTxDate.slice(0, 7) + '-01')
      : new Date(new Date().getFullYear() - 3, 0, 1)
    const now = new Date()
    now.setDate(1)
    const cur = new Date(from)
    while (cur <= now) {
      const last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      result.push({
        key:   toStr(last),
        label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      })
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return result
}

const MUTED = 'rgba(255,255,255,0.35)'
const GRID  = 'rgba(255,255,255,0.04)'

function FlowTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value != null)
  if (!items.length) return null
  return (
    <div style={{
      background: 'var(--color-dash-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10, fontSize: 12, padding: '8px 12px', minWidth: 160,
    }}>
      <p style={{ color: MUTED, marginBottom: 6, fontSize: 11 }}>{label}</p>
      {items.map((p, i) => (
        <p key={i} style={{ color: '#fff', padding: '1px 0' }}>
          <span style={{ color: p.color }}>{p.name}</span>
          {': '}
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

  const LINE_DEFS = [
    { key: 'total',    label: 'Total',       color: colors.accent    ?? '#6ee7b7' },
    { key: 'checking', label: 'Checking',    color: colors.income    ?? '#4ade80' },
    { key: 'savings',  label: 'Savings',     color: '#818cf8' },
    { key: 'invest',   label: 'Investments', color: '#f472b6' },
    { key: 'cash',     label: 'Cash',        color: '#fbbf24' },
  ]

  const [visible, setVisible] = useState({ total: true, checking: false, savings: false, invest: false, cash: false })

  function toggle(key) {
    setVisible(v => ({ ...v, [key]: !v[key] }))
  }

  // Determine which groups actually have cards
  const hasGroup = useMemo(() => ({
    checking: cards.some(TYPE_GROUPS.checking),
    savings:  cards.some(TYPE_GROUPS.savings),
    invest:   cards.some(TYPE_GROUPS.invest),
    cash:     cards.some(TYPE_GROUPS.cash),
  }), [cards])

  const chartData = useMemo(() => {
    if (!cards.length) return []

    const cardById = Object.fromEntries(cards.map(c => [c.id, c]))

    // Sort non-split-child transactions chronologically
    const sorted = [...allTransactions]
      .filter(t => !t.split_parent_id)
      .sort((a, b) => a.date.localeCompare(b.date))

    const firstDate = sorted.length ? sorted[0].date : null
    const dates = buildDates(range, currentDate, firstDate)
    if (!dates.length) return []

    // Running balance per card, seeded with initial_balance
    const bal = {}
    for (const c of cards) bal[c.id] = Number(c.initial_balance ?? 0)

    let ti = 0

    return dates.map(({ key, label }) => {
      // Consume all transactions up to and including this date
      while (ti < sorted.length && sorted[ti].date <= key) {
        const tx = sorted[ti++]
        const card = cardById[tx.card_id]
        if (!card) continue
        const sign = CREDIT.has(tx.type) ? 1 : -1
        if (card.type === 'cash') {
          if (tx.is_cash) bal[card.id] += sign * Number(tx.amount)
        } else {
          if (!tx.is_cash) bal[card.id] += sign * Number(tx.amount)
        }
      }

      let total = 0, checking = 0, savings = 0, invest = 0, cash = 0
      for (const c of cards) {
        const b = bal[c.id]
        total += b
        if      (TYPE_GROUPS.cash(c))     cash     += b
        else if (TYPE_GROUPS.savings(c))  savings  += b
        else if (TYPE_GROUPS.invest(c))   invest   += b
        else                              checking += b
      }

      return { key, label, total, checking, savings, invest, cash }
    })
  }, [cards, allTransactions, range, currentDate])

  if (!cards.length) {
    return (
      <div className="flex items-center justify-center h-48 text-white/30 text-sm">
        No accounts found.
      </div>
    )
  }

  const yDomain = useMemo(() => {
    if (!chartData.length) return ['auto', 'auto']
    let min = Infinity, max = -Infinity
    for (const d of chartData) {
      for (const { key } of LINE_DEFS) {
        if (!visible[key]) continue
        if (d[key] < min) min = d[key]
        if (d[key] > max) max = d[key]
      }
    }
    if (min === Infinity) return ['auto', 'auto']
    const pad = (max - min) * 0.08 || Math.abs(max) * 0.05 || 100
    return [Math.floor((min - pad) / 100) * 100, Math.ceil((max + pad) / 100) * 100]
  }, [chartData, visible])

  // Tick interval for X axis — thin out for dense ranges
  const tickInterval = useMemo(() => {
    const n = chartData.length
    if (n <= 32)  return 0   // show every labelled tick
    if (n <= 95)  return 'preserveStartEnd'
    if (n <= 370) return 'preserveStartEnd'
    return 'preserveStartEnd'
  }, [chartData.length])

  return (
    <div className="flex flex-col gap-6">

      {/* Line toggles */}
      <div className="flex flex-wrap gap-2">
        {LINE_DEFS.filter(l => l.key === 'total' || hasGroup[l.key]).map(({ key, label, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              visible[key]
                ? 'border-transparent'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
            }`}
            style={visible[key] ? { background: `color-mix(in srgb, ${color} 18%, transparent)`, borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, color } : undefined}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: visible[key] ? color : 'rgba(255,255,255,0.2)' }} />
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card rounded-2xl p-4">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-white/30 text-sm">No data for this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                {LINE_DEFS.map(({ key, color }) => (
                  <linearGradient key={key} id={`mf-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fill: MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => fmtK(v)}
                width={72}
                domain={yDomain}
              />
              <Tooltip
                content={<FlowTooltip fmt={fmt} />}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />

              {LINE_DEFS.map(({ key, color }) => visible[key] && (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={LINE_DEFS.find(l => l.key === key)?.label}
                  stroke={color}
                  strokeWidth={key === 'total' ? 2 : 1.5}
                  fill={`url(#mf-grad-${key})`}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: 'var(--color-dash-card)', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary row — current balances */}
      {chartData.length > 0 && (() => {
        const last = chartData[chartData.length - 1]
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LINE_DEFS.filter(l => l.key !== 'total' && hasGroup[l.key]).map(({ key, label, color }) => (
              <div key={key} className="glass-card rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
                <p className="text-lg font-bold tabular-nums">{fmt(last[key])}</p>
              </div>
            ))}
            <div className="glass-card rounded-xl p-4 col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase tracking-widest mb-1 text-white/50">Total</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: LINE_DEFS[0].color }}>{fmt(last.total)}</p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
