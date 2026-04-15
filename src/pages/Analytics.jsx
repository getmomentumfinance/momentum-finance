import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar, Cell,
  PieChart, Pie,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ReferenceLine,
} from 'recharts'
import Navbar from '../components/dashboard/Navbar'
import { useTransactions } from '../hooks/useTransactions'
import { useSharedData } from '../context/SharedDataContext'
import { useThemeColors } from '../hooks/useThemeColors'
import { useImportance } from '../hooks/useImportance'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { TRANSACTION_TYPES } from '../constants/transactionTypes'
import { DEFAULT_IMPORTANCE } from '../constants/importance'
import { ChevronDown, TrendingUp, TrendingDown, PiggyBank, Tag, ShoppingBag, Zap, SlidersHorizontal, X } from 'lucide-react'
import { CategoryPill } from '../components/shared/CategoryPill'
import { usePreferences } from '../context/UserPreferencesContext'
import { useIsMobile } from '../hooks/useIsMobile'

const GRID  = 'rgba(255,255,255,0.04)'
const MUTED = 'rgba(255,255,255,0.35)'

const tooltipStyle = {
  contentStyle: { background: 'var(--color-dash-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12 },
  itemStyle:    { color: '#fff' },
  labelStyle:   { color: MUTED, marginBottom: 4 },
  cursor:       false,
}

// Tooltip that hides series with value === 0
function FilteredTooltip({ active, payload, label, valueFormatter, nameFormatter }) {
  const { fmt } = usePreferences()
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value != null && Number(p.value) !== 0)
  if (!items.length) return null
  const vfmt = valueFormatter ?? (v => fmt(v))
  const nfmt = nameFormatter ?? (n => n)
  return (
    <div style={{ background: 'var(--color-dash-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12, padding: '8px 12px' }}>
      {label != null && <p style={{ color: MUTED, marginBottom: 4, fontSize: 11 }}>{label}</p>}
      {items.map((p, i) => (
        <p key={i} style={{ color: '#fff', padding: '1px 0' }}>
          <span style={{ color: p.color }}>{nfmt(p.name)}</span>{': '}{vfmt(p.value)}
        </p>
      ))}
    </div>
  )
}

function toLocalStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getPeriodBounds(period, refDate, resetDay) {
  const y = refDate.getFullYear(), m = refDate.getMonth()
  if (period === 'weekly') {
    const startJsDow = ((resetDay ?? 0) + 1) % 7
    const diff = (refDate.getDay() - startJsDow + 7) % 7
    const start = new Date(refDate); start.setDate(refDate.getDate() - diff); start.setHours(0,0,0,0)
    const end = new Date(start); end.setDate(start.getDate() + 6)
    return { startStr: toLocalStr(start), endStr: toLocalStr(end) }
  }
  const rd = resetDay ?? 1
  let sy = y, sm = m
  if (refDate.getDate() < rd) { sm--; if (sm < 0) { sm = 11; sy-- } }
  const end = new Date(new Date(sy, sm + 1, rd).getTime() - 86400000)
  return { startStr: toLocalStr(new Date(sy, sm, rd)), endStr: toLocalStr(end) }
}

const RANGE_IDS = ['week', 'month', '3m', 'year', 'all', 'compare', 'tree']
const RANGE_KEYS = { week: 'an.rangeWeek', month: 'an.rangeMonth', '3m': 'an.range3m', year: 'an.rangeYear', all: 'an.rangeAll', compare: 'an.rangeCompare', tree: 'an.rangeTree' }

const DOW_LABELS      = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FALLBACK_COLORS = ['#a78bfa','#60a5fa','#4ade80','#f87171','#fb923c','#facc15','#94a3b8']

// Extract the middle color stop from a gradient, or return hex as-is
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


// ISO week number (weeks start Monday, week 1 contains first Thursday)
function isoWeek(date) {
  const d = new Date(date); d.setHours(0,0,0,0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const w1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7)
}

// Stable string hash → consistent palette index per merchant name
function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Generate N maximally-distinct colors using golden angle rotation, seeded from a base color
function paletteFromColor(baseColor, n = 24) {
  const hex = (midColor(baseColor) || '#6366f1').match(/^#[0-9a-fA-F]{6}$/)
    ? (midColor(baseColor) || '#6366f1')
    : '#6366f1'
  const r = parseInt(hex.slice(1,3), 16) / 255
  const g = parseInt(hex.slice(3,5), 16) / 255
  const b = parseInt(hex.slice(5,7), 16) / 255
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min
  let startHue = 0
  if (d !== 0) {
    if (max === r)      startHue = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) startHue = ((b - r) / d + 2) / 6
    else                startHue = ((r - g) / d + 4) / 6
  }
  const GOLDEN_ANGLE = 137.508
  return Array.from({ length: n }, (_, i) => {
    const hue = Math.round((startHue * 360 + i * GOLDEN_ANGLE) % 360)
    return `hsl(${hue},65%,62%)`
  })
}

// Build time-series data for multi-line charts (top N by total expense)
function buildLineData(txs, range, currentDate, getKey, getColor, limit = 10) {
  const totals = {}, colorOf = {}
  txs.forEach(t => {
    const k = getKey(t)
    if (!k) return
    totals[k] = (totals[k] || 0) + Number(t.amount)
    if (!colorOf[k]) colorOf[k] = getColor(t)
  })
  const topKeys = Object.entries(totals).sort(([,a],[,b]) => b - a).slice(0, limit).map(([k]) => k)

  if (range === 'week') {
    const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const byDow = {}
    txs.forEach(t => {
      const k = getKey(t)
      if (!k || !topKeys.includes(k)) return
      const dow = (new Date(t.date + 'T12:00:00').getDay() + 6) % 7
      if (!byDow[dow]) byDow[dow] = {}
      byDow[dow][k] = (byDow[dow][k] || 0) + Number(t.amount)
    })
    return {
      data:   Array.from({ length: 7 }, (_, i) => ({ label: DOW_SHORT[i], ...Object.fromEntries(topKeys.map(k => [k, byDow[i]?.[k] || 0])) })),
      series: topKeys.map((k, i) => ({ name: k, color: colorOf[k] || FALLBACK_COLORS[i % FALLBACK_COLORS.length] })),
    }
  }

  if (range === 'month') {
    const days = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const byDay = {}
    txs.forEach(t => {
      const k = getKey(t)
      if (!k || !topKeys.includes(k)) return
      const day = parseInt(t.date.slice(8, 10))
      if (!byDay[day]) byDay[day] = {}
      byDay[day][k] = (byDay[day][k] || 0) + Number(t.amount)
    })
    return {
      data:   Array.from({ length: days }, (_, i) => ({ label: String(i + 1), ...Object.fromEntries(topKeys.map(k => [k, byDay[i + 1]?.[k] || 0])) })),
      series: topKeys.map((k, i) => ({ name: k, color: colorOf[k] || FALLBACK_COLORS[i % FALLBACK_COLORS.length] })),
    }
  }

  const byMonth = {}
  txs.forEach(t => {
    const k = getKey(t)
    if (!k || !topKeys.includes(k)) return
    const mk = t.date.slice(0, 7)
    if (!byMonth[mk]) byMonth[mk] = {}
    byMonth[mk][k] = (byMonth[mk][k] || 0) + Number(t.amount)
  })
  return {
    data:   Object.entries(byMonth).sort(([a],[b]) => a.localeCompare(b)).map(([mk, v]) => ({
      label: new Date(mk + '-15').toLocaleDateString('en-US', { month: 'short', ...(range === 'all' ? { year: '2-digit' } : {}) }),
      ...Object.fromEntries(topKeys.map(k => [k, v[k] || 0])),
    })),
    series: topKeys.map((k, i) => ({ name: k, color: colorOf[k] || FALLBACK_COLORS[i % FALLBACK_COLORS.length] })),
  }
}

// ── Reusable donut panel ───────────────────────────────────────────
function DonutPanel({ title, subtitle, data }) {
  const { fmt, fmtK, t } = usePreferences()
  const resolvedSubtitle = subtitle ?? t('an.expOnly')
  const [active, setActive] = useState(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-[11px] text-muted mt-0.5">{resolvedSubtitle}</p>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted py-2">{t('an.noDataShort')}</p>
      ) : (
        <>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius="50%" outerRadius="76%"
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, i) => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                      opacity={active === null || active === i ? 1 : 0.3}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [fmt(v), name]} {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend — scrollable when > 10 items, no visible scrollbar */}
          <div
            className={`flex flex-col gap-2 ${data.length > 5 ? 'overflow-y-auto max-h-[120px] [&::-webkit-scrollbar]:hidden' : ''}`}
            style={data.length > 5 ? { scrollbarWidth: 'none' } : undefined}
          >
            {data.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center gap-2.5 cursor-default"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: d.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                />
                <span className="text-xs text-white/60 flex-1 truncate">{d.name}</span>
                <span className="text-xs text-white/40 tabular-nums">{((d.value / total) * 100).toFixed(0)}%</span>
                <span className="text-xs text-white/70 tabular-nums">{fmtK(d.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


// ── Reusable multi-line panel ──────────────────────────────────────
function ComparisonCard({ title, rows, colors }) {
  const { fmt, fmtK, t } = usePreferences()
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-[11px] text-white/30">{t('an.currPrevChange')}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted py-2">{t('an.noDataShort')}</p>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {rows.map(({ name, color, value, prev, pct }) => (
            <div key={name} className="flex items-center gap-3 py-2.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-sm text-white/80 flex-1 truncate min-w-0">{name}</span>
              <span className="text-sm tabular-nums text-white/70 shrink-0">{fmt(value, 0)}</span>
              <span className="text-[11px] tabular-nums text-white/30 shrink-0 w-20 text-right">
                {prev > 0 ? fmt(prev, 0) : '—'}
              </span>
              {pct !== null ? (
                <span className="text-[11px] font-semibold tabular-nums shrink-0 w-14 text-right"
                  style={{ color: pct > 0 ? colors.expense : colors.income }}>
                  {pct > 0 ? '↗' : '↘'} {Math.abs(pct).toFixed(0)}%
                </span>
              ) : (
                <span className="text-[11px] text-white/20 shrink-0 w-14 text-right">{t('an.newBadge')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Per-week amounts card (tabbed, controlled dim) ────────────────
const WEEK_BREAK_DIM_IDS = ['category', 'subcategory', 'importance', 'type']
const WEEK_BREAK_DIM_KEYS = { category: 'an.dimCategory', subcategory: 'an.dimSubcategory', importance: 'an.dimImportance', type: 'an.dimType' }
function WeekBreakPanel({ dims, weekLabels, dim, onDimChange }) {
  const { fmtK, t } = usePreferences()
  const rows = dims[dim] ?? []
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          {WEEK_BREAK_DIM_IDS.map(id => (
            <button key={id} onClick={() => onDimChange(id)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                dim === id ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/60'
              }`}>
              {t(WEEK_BREAK_DIM_KEYS[id])}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-white/30 ml-3 whitespace-nowrap">{weekLabels.join(' · ')}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted py-2">{t('an.noDataShort')}</p>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {rows.map(({ name, color, weeks }) => (
            <div key={name} className="flex items-center gap-3 py-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-sm text-white/80 flex-1 truncate min-w-0">{name}</span>
              {weeks.map((v, i) => (
                <span key={i} className="text-xs tabular-nums text-white/50 shrink-0 w-14 text-right">
                  {v > 0 ? fmtK(v) : '—'}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Single-dimension week card (4-column layout) ──────────────────
function WeekBreakCard({ title, rows, weekLabels }) {
  const { fmtK, t } = usePreferences()
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
      <span className="text-sm font-semibold">{title}</span>
      {rows.length === 0 ? (
        <p className="text-xs text-muted py-1">{t('an.noDataShort')}</p>
      ) : (
        <div className="flex flex-col">
          {/* Column headers */}
          <div className="flex items-center gap-2 pb-1">
            <div className="w-1.5 shrink-0" />
            <div className="flex-1" />
            {weekLabels.map((label, i) => (
              <span key={i} className="text-[10px] text-white/30 shrink-0 w-11 text-right">{label}</span>
            ))}
            <span className="text-[10px] text-white/30 shrink-0 w-10 text-right">{t('an.trend')}</span>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {rows.map(({ name, color, weeks }) => {
              const nonZeroWeeks = weeks.filter(v => v > 0).length
              const n = weeks.length
              const xMean = (n - 1) / 2
              const yMean = weeks.reduce((a, b) => a + b, 0) / n
              const num = weeks.reduce((sum, y, i) => sum + (i - xMean) * (y - yMean), 0)
              const den = weeks.reduce((sum, _, i) => sum + (i - xMean) ** 2, 0)
              const delta = nonZeroWeeks < 2 || den === 0 ? null : Math.round((num / den) * (n - 1))
              const trendLabel = delta === null || delta === 0 ? '—' : delta > 0 ? `+${fmtK(delta)}` : `-${fmtK(Math.abs(delta))}`
              const trendColor = delta === null || delta === 0 ? 'rgba(255,255,255,0.2)' : delta > 0 ? 'var(--color-alert)' : 'var(--type-income)'
              return (
                <div key={name} className="flex items-center gap-2 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs text-white/80 flex-1 truncate min-w-0">{name}</span>
                  {weeks.map((v, i) => (
                    <span key={i} className="text-[11px] tabular-nums text-white/50 shrink-0 w-11 text-right">
                      {v > 0 ? fmtK(v) : '—'}
                    </span>
                  ))}
                  <span className="text-[11px] tabular-nums shrink-0 w-10 text-right" style={{ color: trendColor }}>
                    {trendLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function MonthPicker({ value, onChange }) {
  const year  = value.getFullYear()
  const month = value.getMonth()
  const currYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currYear - 5 + i)
  const selectCls = 'appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer'
  return (
    <div className="flex items-center gap-1">
      <select value={month} onChange={e => onChange(new Date(year, Number(e.target.value), 1))} className={selectCls}>
        {MONTH_SHORT.map((m, i) => <option key={i} value={i} className="bg-[var(--color-dash-card)]">{m}</option>)}
      </select>
      <select value={year} onChange={e => onChange(new Date(Number(e.target.value), month, 1))} className={selectCls}>
        {years.map(y => <option key={y} value={y} className="bg-[var(--color-dash-card)]">{y}</option>)}
      </select>
    </div>
  )
}

// Custom shape for stacked bars — 2px top gap + rounded top corners
function StackedBarShape({ x, y, width, height, fill }) {
  const gap = 2
  const r   = 3
  const h   = Math.max(0, height - gap)
  if (h <= 0) return null
  const yy = y + gap
  const ar = Math.min(r, width / 2, h / 2)
  const d = ar > 0
    ? `M ${x + ar} ${yy} H ${x + width - ar} A ${ar} ${ar} 0 0 1 ${x + width} ${yy + ar} V ${yy + h} H ${x} V ${yy + ar} A ${ar} ${ar} 0 0 1 ${x + ar} ${yy} Z`
    : `M ${x} ${yy} H ${x + width} V ${yy + h} H ${x} Z`
  return <path d={d} fill={fill} />
}

function LinePanel({ title, subtitle, data, series, xInterval = 0, chartHeight = 170 }) {
  const { fmtK, t } = usePreferences()
  const [chartType, setChartType] = useState(() => localStorage.getItem('analytics-chartType') ?? 'bar')
  function handleChartType(ct) { setChartType(ct); localStorage.setItem('analytics-chartType', ct) }
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col flex-1">
      <div className="flex items-start justify-between mb-0.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 shrink-0">
          {['bar', 'line'].map(ct => (
            <button key={ct} onClick={() => handleChartType(ct)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors capitalize ${
                chartType === ct ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/60'
              }`}>
              {ct}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted mb-3">{subtitle}</p>
      {series.length === 0 ? (
        <p className="text-sm text-muted">{t('an.noDataShort')}</p>
      ) : (
        <>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={data} barCategoryGap="20%" maxBarSize={28}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={xInterval} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<FilteredTooltip />} cursor={false} />
                  {series.map(s => (
                    <Bar key={s.name} dataKey={s.name} stackId="a" fill={s.color} shape={<StackedBarShape />} />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={xInterval} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<FilteredTooltip />} cursor={false} />
                  {series.map(s => (
                    <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {series.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-[11px] text-white/50 truncate max-w-[100px]">{s.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
export default function Analytics() {
  const { fmt, fmtK, t } = usePreferences()
  const isMobile = useIsMobile()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [range, setRange] = useState('month')
  const [compareDate, setCompareDate] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth() - 1, 1)
  })
  const [compareSubMode, setCompareSubMode] = useState('months') // 'months' | 'weeks'
  const [weekBreakdownDim, setWeekBreakdownDim] = useState('category') // 'category'|'subcategory'|'importance'|'type'

  const { transactions } = useTransactions()
  const { categoryMap, receiverMap, receiverColorMap } = useSharedData()
  const colors = useThemeColors()
  const { user } = useAuth()
  const { importance: importanceWithColors } = useImportance()
  const importanceColors = useMemo(
    () => Object.fromEntries(importanceWithColors.map(i => [i.value, i.color])),
    [importanceWithColors] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const merchantPalette = useMemo(() => paletteFromColor(colors.barChart, 12), [colors.barChart])
  const getMerchantColor = name => receiverColorMap[name] ?? merchantPalette[hashStr(name || '') % merchantPalette.length]

  const [budgets, setBudgets] = useState([])
  const [targets, setTargets] = useState([])
  useEffect(() => {
    if (!user?.id) return
    function loadBudgets() {
      supabase.from('budgets').select('id, name, monthly_limit, period, reset_day, category_id, subcategory_id, importance, card_id')
        .eq('user_id', user.id).then(({ data }) => { if (data) setBudgets(data) })
      supabase.from('targets').select('*')
        .eq('user_id', user.id).then(({ data }) => { if (data) setTargets(data) })
    }
    loadBudgets()
    window.addEventListener('transaction-saved', loadBudgets)
    return () => window.removeEventListener('transaction-saved', loadBudgets)
  }, [user?.id])

  // Fetch category importance directly, falling back to parent category if subcategory has none
  const [catImportance, setCatImportance] = useState({})
  useEffect(() => {
    if (!user?.id) return
    function loadCatImportance() {
      supabase
        .from('categories')
        .select('id, importance')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (!data) return
          setCatImportance(Object.fromEntries(data.map(c => [c.id, c.importance])))
        })
    }
    loadCatImportance()
    window.addEventListener('transaction-saved', loadCatImportance)
    return () => window.removeEventListener('transaction-saved', loadCatImportance)
  }, [user?.id])

  const [periodPerfTab, setPeriodPerfTab] = useState('limits')

  // ── Budget & target performance for this period ───────────────
  const periodBudgetStats = useMemo(() => {
    const periodMap = { week: 'weekly', month: 'monthly', '3m': 'quarterly', year: 'yearly' }
    const matchPeriod = periodMap[range]
    if (!matchPeriod) return []
    return budgets
      .filter(b => (b.period ?? 'monthly') === matchPeriod)
      .map(b => {
        const { startStr, endStr } = getPeriodBounds(matchPeriod, currentDate, b.reset_day)
        const spent = transactions
          .filter(t =>
            !t.is_split_parent && t.type === 'expense' &&
            t.date >= startStr && t.date <= endStr &&
            (!b.card_id || t.card_id === b.card_id) &&
            (b.category_id    ? t.category_id    === b.category_id
           : b.subcategory_id ? t.subcategory_id === b.subcategory_id
           : b.importance     ? (catImportance[t.category_id] ?? catImportance[t.subcategory_id]) === b.importance
                              : true)
          )
          .reduce((s, t) => s + Number(t.amount), 0)
        const pct = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0
        return { id: b.id, name: b.name, category_id: b.category_id, subcategory_id: b.subcategory_id, importance: b.importance, limit: b.monthly_limit, spent, pct, isOver: spent > b.monthly_limit }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [range, budgets, transactions, currentDate, catImportance])

  const periodTargetStats = useMemo(() => {
    const periodMap = { week: 'weekly', month: 'monthly', '3m': 'quarterly', year: 'yearly' }
    const matchPeriod = periodMap[range]
    if (!matchPeriod) return []
    return targets
      .filter(tgt => (tgt.period ?? 'monthly') === matchPeriod)
      .map(tgt => {
        const { startStr, endStr } = getPeriodBounds(matchPeriod, currentDate, tgt.reset_day)
        const spent = transactions
          .filter(t =>
            !t.is_split_parent && t.type === 'expense' &&
            t.date >= startStr && t.date <= endStr &&
            (tgt.category_id    ? t.category_id    === tgt.category_id
           : tgt.subcategory_id ? t.subcategory_id === tgt.subcategory_id
           : tgt.receiver_id   ? t.receiver_id    === tgt.receiver_id
           : tgt.importance    ? (catImportance[t.category_id] ?? catImportance[t.subcategory_id]) === tgt.importance
                               : false)
          )
          .reduce((s, t) => s + Number(t.amount), 0)
        const pct = tgt.target_monthly_spend > 0 ? (spent / tgt.target_monthly_spend) * 100 : 0
        return { id: tgt.id, category_id: tgt.category_id, subcategory_id: tgt.subcategory_id, importance: tgt.importance, receiver_id: tgt.receiver_id, target: tgt.target_monthly_spend, spent, pct, isOver: spent > tgt.target_monthly_spend }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [range, targets, transactions, currentDate, catImportance])

  // ── Goal sparklines: 6-month per-target history ───────────────
  const goalSparklines = useMemo(() => {
    const result = {}
    for (const tgt of targets) {
      const pts = []
      for (let mo = 5; mo >= 0; mo--) {
        const d       = new Date(currentDate.getFullYear(), currentDate.getMonth() - mo, 1)
        const start   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
        const endD    = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        const end     = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`
        const label   = d.toLocaleDateString('en-US', { month: 'short' })
        const spend   = transactions
          .filter(t =>
            !t.is_split_parent && t.type === 'expense' &&
            t.date >= start && t.date <= end &&
            (tgt.category_id    ? t.category_id    === tgt.category_id
           : tgt.subcategory_id ? t.subcategory_id === tgt.subcategory_id
           : tgt.receiver_id   ? t.receiver_id    === tgt.receiver_id
           : tgt.importance    ? (catImportance[t.category_id] ?? catImportance[t.subcategory_id]) === tgt.importance
                               : false)
          )
          .reduce((s, t) => s + Number(t.amount), 0)
        pts.push({ label, spend, isCurrent: mo === 0 })
      }
      result[tgt.id] = pts
    }
    return result
  }, [targets, transactions, currentDate, catImportance])

  // ── Filter by period ─────────────────────────────────────────
  const filtered = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    if (range === 'week') {
      const mon = new Date(currentDate)
      mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7))
      const pad = n => String(n).padStart(2, '0')
      const monStr = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      const sunStr = `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`
      return transactions.filter(t => t.date >= monStr && t.date <= sunStr)
    }
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      if (range === 'month' || range === 'compare') return d.getFullYear() === y && d.getMonth() === m
      if (range === '3m') {
        const start = new Date(y, m - 2, 1)
        const end   = new Date(y, m + 1, 0)
        return d >= start && d <= end
      }
      if (range === 'year') return d.getFullYear() === y
      return true
    })
  }, [transactions, range, currentDate])

  const expenses = useMemo(() => filtered.filter(t => t.type === 'expense' && !t.is_split_parent), [filtered])

  // ── Per-type totals (split parents excluded to avoid double-counting) ──
  const typeTotals = useMemo(() => {
    const map = {}
    filtered.filter(t => !t.is_split_parent).forEach(t => {
      const amt = Number(t.amount)
      // transfer and cash_out are stored as paired +/- rows — skip the negative counterpart
      if ((t.type === 'transfer' || t.type === 'cash_out') && amt < 0) return
      // savings negative rows are counterparts; savings_out is subtracted to get net savings
      if (t.type === 'savings') {
        if (amt <= 0) return
        map['savings'] = (map['savings'] || 0) + (t.source === 'savings_out' ? -amt : amt)
        return
      }
      map[t.type] = (map[t.type] || 0) + amt
    })
    return map
  }, [filtered])

  // ── Period chart data ─────────────────────────────────────────
  const periodData = useMemo(() => {
    if (range === 'week') {
      const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const byDow = {}
      filtered.forEach(t => {
        if (t.is_split_parent) return
        const dow = (new Date(t.date + 'T00:00:00').getDay() + 6) % 7
        if (!byDow[dow]) byDow[dow] = { income: 0, expense: 0 }
        if (t.type === 'income')  byDow[dow].income  += Number(t.amount)
        if (t.type === 'expense') byDow[dow].expense += Number(t.amount)
      })
      return Array.from({ length: 7 }, (_, i) => ({
        label:   DOW_SHORT[i],
        income:  byDow[i]?.income  || 0,
        expense: byDow[i]?.expense || 0,
      }))
    }
    if (range === 'month') {
      // Daily for the selected month
      const y = currentDate.getFullYear()
      const m = currentDate.getMonth()
      const days = new Date(y, m + 1, 0).getDate()
      const byDay = {}
      filtered.forEach(t => {
        if (t.is_split_parent) return
        const day = parseInt(t.date.slice(8, 10))
        if (!byDay[day]) byDay[day] = { income: 0, expense: 0 }
        if (t.type === 'income')  byDay[day].income  += Number(t.amount)
        if (t.type === 'expense') byDay[day].expense += Number(t.amount)
      })
      return Array.from({ length: days }, (_, i) => ({
        label:   String(i + 1),
        income:  byDay[i + 1]?.income  || 0,
        expense: byDay[i + 1]?.expense || 0,
      }))
    }

    // Monthly for 3m / year / all
    const byMonth = {}
    filtered.forEach(t => {
      if (t.is_split_parent) return
      const mk = t.date.slice(0, 7)
      if (!byMonth[mk]) byMonth[mk] = { income: 0, expense: 0 }
      if (t.type === 'income')  byMonth[mk].income  += Number(t.amount)
      if (t.type === 'expense') byMonth[mk].expense += Number(t.amount)
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mk, v]) => ({
        label:   new Date(mk + '-15').toLocaleDateString('en-US', { month: 'short', ...(range === 'all' ? { year: '2-digit' } : {}) }),
        income:  v.income,
        expense: v.expense,
      }))
  }, [filtered, range, currentDate])

  // ── By Category (categorized expenses only) ───────────────────
  const categoryData = useMemo(() => {
    const map = {}
    expenses.filter(t => t.category_id).forEach(t => {
      const name  = categoryMap[t.category_id]?.name ?? 'Unknown'
      const color = midColor(categoryMap[t.category_id]?.color)
      if (!map[name]) map[name] = { name, value: 0, color }
      map[name].value += Number(t.amount)
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [expenses, categoryMap])

  // ── By Subcategory (categorized expenses only) ────────────────
  const subcategoryData = useMemo(() => {
    const map = {}
    expenses.filter(t => t.subcategory_id).forEach(t => {
      const name  = categoryMap[t.subcategory_id]?.name ?? 'Unknown'
      const color = midColor(categoryMap[t.subcategory_id]?.color)
      if (!map[name]) map[name] = { name, value: 0, color }
      map[name].value += Number(t.amount)
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [expenses, categoryMap])

  // ── Category & subcategory line chart data ────────────────────
  const categoryLineData = useMemo(() => buildLineData(
    expenses, range, currentDate,
    t => t.category_id    ? (categoryMap[t.category_id]?.name    ?? 'Unknown') : null,
    t => midColor(categoryMap[t.category_id]?.color),
  ), [expenses, categoryMap, range, currentDate])

  const subcategoryLineData = useMemo(() => buildLineData(
    expenses, range, currentDate,
    t => t.subcategory_id ? (categoryMap[t.subcategory_id]?.name ?? 'Unknown') : null,
    t => midColor(categoryMap[t.subcategory_id]?.color),
  ), [expenses, categoryMap, range, currentDate])

  // ── By Importance — derived from subcategory (fall back to category) ──
  const importanceData = useMemo(() => {
    const map = {}
    expenses.forEach(t => {
      // Importance lives on the subcategory; fall back to parent category
      const imp = catImportance[t.subcategory_id] ?? catImportance[t.category_id]
      if (!imp) return
      const def = DEFAULT_IMPORTANCE.find(d => d.value === imp)
      if (!def) return
      const color = importanceColors[imp] ?? def.color
      if (!map[imp]) map[imp] = { name: def.label, value: 0, color }
      map[imp].value += Number(t.amount)
    })
    return DEFAULT_IMPORTANCE.filter(d => map[d.value]).map(d => map[d.value])
  }, [expenses, catImportance, importanceColors])

  // ── Top receivers ─────────────────────────────────────────────
  const receiverData = useMemo(() => {
    const map = {}
    expenses.forEach(t => {
      const id   = t.receiver_id
      const name = id ? (receiverMap[id]?.name ?? 'Unknown') : 'Other'
      if (!map[name]) map[name] = { name, value: 0 }
      map[name].value += Number(t.amount)
    })
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [expenses, receiverMap])

  // ── Insights ─────────────────────────────────────────────────
  const insights = useMemo(() => {
    const list = []
    const income   = typeTotals['income']  || 0
    const expTotal = typeTotals['expense'] || 0

    // Savings rate
    if (income > 0) {
      const netFlow     = income - expTotal
      const savingsRate = (netFlow / income) * 100
      if (savingsRate >= 20)
        list.push({ title: 'Savings rate', text: `You're saving ${savingsRate.toFixed(0)}% of your income this period. Great work!`, color: colors.income, Icon: PiggyBank })
      else if (savingsRate > 0)
        list.push({ title: 'Savings rate', text: `You're saving ${savingsRate.toFixed(0)}% of income. Aim for 20% or more.`, color: colors.warning, Icon: PiggyBank })
      else
        list.push({ title: 'Overspending', text: `You spent ${fmt(expTotal - income)} more than you earned this period. Review your expenses.`, color: colors.expense, Icon: TrendingDown })
    }

    // Top category
    if (categoryData.length) {
      const top = categoryData[0]
      const pct = expTotal > 0 ? ((top.value / expTotal) * 100).toFixed(0) : null
      list.push({
        title: 'Top category',
        text: `${top.name} accounts for ${pct ? `${pct}% of expenses` : fmt(top.value)} this period.`,
        color: top.color || colors.expense,
        Icon: Tag,
      })
    }

    // Top merchant (skip "Other")
    const topMerchant = receiverData.find(r => r.name !== 'Other')
    if (topMerchant) {
      const pct = expTotal > 0 ? ((topMerchant.value / expTotal) * 100).toFixed(0) : null
      list.push({
        title: 'Top merchant',
        text: `${topMerchant.name} is your top merchant — ${pct ? `${pct}% of expenses` : fmt(topMerchant.value)} this period.`,
        color: colors.accent,
        Icon: ShoppingBag,
      })
    }

    return list
  }, [categoryData, typeTotals, receiverData, colors])

  // ── Daily breakdown by type ───────────────────────────────────
  const TYPE_KEYS   = ['income', 'expense', 'savings_in', 'savings_out', 'transfer', 'invest', 'cash_out']
  const TYPE_LABELS = {
    income: t('an.income'), expense: t('an.expenses').replace(/s$/, ''),
    savings_in: t('sav.deposit'), savings_out: t('sav.withdrawal'),
    transfer: t('type.transfer'), invest: t('type.invest'), cash_out: t('type.cash_out'),
  }

  // Resolve canonical key per transaction.
  // transfer/savings/cash_out are stored as paired positive+negative rows — skip negatives.
  // savings splits into savings_in / savings_out via the source field.
  const typeKey = tx => {
    const amt = Number(tx.amount)
    if (tx.type === 'savings') {
      if (amt <= 0) return null
      return tx.source === 'savings_out' ? 'savings_out' : 'savings_in'
    }
    if ((tx.type === 'transfer' || tx.type === 'cash_out') && amt < 0) return null
    return tx.type
  }

  const dailyByTypeData = useMemo(() => {
    const accumulate = (map, key, subKey, amount) => {
      if (!map[key]) map[key] = {}
      map[key][subKey] = (map[key][subKey] || 0) + Math.abs(Number(amount))
    }
    if (range === 'week') {
      const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const byDow = {}
      filtered.forEach(t => {
        if (t.is_split_parent) return
        const k = typeKey(t)
        if (!k) return
        const dow = (new Date(t.date + 'T00:00:00').getDay() + 6) % 7
        accumulate(byDow, dow, k, t.amount)
      })
      return Array.from({ length: 7 }, (_, i) => {
        const d = byDow[i] || {}
        const entry = { label: DOW_SHORT[i] }
        TYPE_KEYS.forEach(k => { entry[k] = d[k] || 0 })
        return entry
      })
    }
    if (range === 'month') {
      const y = currentDate.getFullYear()
      const m = currentDate.getMonth()
      const days = new Date(y, m + 1, 0).getDate()
      const byDay = {}
      filtered.forEach(t => {
        if (t.is_split_parent) return
        const k = typeKey(t)
        if (!k) return
        accumulate(byDay, parseInt(t.date.slice(8, 10)), k, t.amount)
      })
      return Array.from({ length: days }, (_, i) => {
        const d = byDay[i + 1] || {}
        const entry = { label: String(i + 1) }
        TYPE_KEYS.forEach(k => { entry[k] = d[k] || 0 })
        return entry
      })
    }
    const byMonth = {}
    filtered.forEach(t => {
      if (t.is_split_parent) return
      const k = typeKey(t)
      if (!k) return
      accumulate(byMonth, t.date.slice(0, 7), k, t.amount)
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mk, d]) => {
        const label = new Date(mk + '-15').toLocaleDateString('en-US', { month: 'short', ...(range === 'all' ? { year: '2-digit' } : {}) })
        const entry = { label }
        TYPE_KEYS.forEach(k => { entry[k] = d[k] || 0 })
        return entry
      })
  }, [filtered, range, currentDate])


  // ── Projected spend ───────────────────────────────────────────
  const projectedSpend = useMemo(() => {
    if (range !== 'month') return null
    const today = new Date()
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    if (today.getFullYear() !== y || today.getMonth() !== m) return null
    const dayOfMonth = today.getDate()
    if (dayOfMonth < 3) return null
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const soFar = expenses.reduce((s, t) => s + Number(t.amount), 0)
    const dailyAvg = soFar / dayOfMonth
    const projected = dailyAvg * daysInMonth
    return { projected, dailyAvg, dayOfMonth, daysInMonth, soFar }
  }, [range, currentDate, expenses])

  // ── Deep Dive ─────────────────────────────────────────────────
  const [ddDimension,    setDdDimension]    = useState('category') // 'category' | 'subcategory' | 'importance' | 'receiver'
  const [ddFilter,       setDdFilter]       = useState(null)
  const [ddChartType,    setDdChartType]    = useState('bar')
  const [ddClickedLabel, setDdClickedLabel] = useState(null)

  const ddCategories = useMemo(() => {
    const seen = new Map()
    expenses.forEach(t => { if (t.category_id) seen.set(t.category_id, categoryMap[t.category_id]?.name ?? 'Unknown') })
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [expenses, categoryMap])

  const ddAllSubcategories = useMemo(() => {
    const seen = new Map()
    expenses.forEach(t => { if (t.subcategory_id) seen.set(t.subcategory_id, categoryMap[t.subcategory_id]?.name ?? 'Unknown') })
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [expenses, categoryMap])

  const ddReceivers = useMemo(() => {
    const seen = new Map()
    expenses.forEach(t => { if (t.receiver_id) seen.set(t.receiver_id, receiverMap[t.receiver_id]?.name ?? 'Unknown') })
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [expenses, receiverMap])

  const ddOptions = useMemo(() => {
    if (ddDimension === 'category')    return ddCategories
    if (ddDimension === 'subcategory') return ddAllSubcategories
    if (ddDimension === 'receiver')    return ddReceivers
    return DEFAULT_IMPORTANCE.map(d => ({ id: d.value, name: d.label }))
  }, [ddDimension, ddCategories, ddAllSubcategories, ddReceivers])

  const ddFiltered = useMemo(() => expenses.filter(t => {
    if (!ddFilter) return true
    if (ddDimension === 'category')    return t.category_id    === ddFilter
    if (ddDimension === 'subcategory') return t.subcategory_id === ddFilter
    if (ddDimension === 'receiver')    return t.receiver_id    === ddFilter
    if (ddDimension === 'importance') {
      const imp = catImportance[t.subcategory_id] ?? catImportance[t.category_id]
      return imp === ddFilter
    }
    return true
  }), [expenses, ddDimension, ddFilter, catImportance])

  const ddTotal   = useMemo(() => ddFiltered.reduce((s, t) => s + Number(t.amount), 0), [ddFiltered])
  const ddAvg     = ddFiltered.length ? ddTotal / ddFiltered.length : 0
  const ddHighest = useMemo(() => {
    if (!ddFiltered.length) return null
    const t = ddFiltered.reduce((mx, t) => Number(t.amount) > Number(mx.amount) ? t : mx, ddFiltered[0])
    return { amount: Number(t.amount), name: receiverMap[t.receiver_id]?.name ?? null }
  }, [ddFiltered, receiverMap])

  const ddMostFrequent = useMemo(() => {
    const freq = {}
    ddFiltered.forEach(t => {
      const name = t.receiver_id ? (receiverMap[t.receiver_id]?.name ?? null) : null
      if (name) freq[name] = (freq[name] || 0) + 1
    })
    const top = Object.entries(freq).sort(([,a],[,b]) => b - a)[0]
    return top ? { name: top[0], count: top[1] } : null
  }, [ddFiltered, receiverMap])

  const ddChartData = useMemo(() => {
    // Grouping logic per dimension + whether a filter is selected (drill down)
    let getKey, getColor
    if (ddDimension === 'category') {
      if (ddFilter) {
        // drill into subcategories of selected category
        getKey   = t => t.subcategory_id ? (categoryMap[t.subcategory_id]?.name ?? 'Other') : null
        getColor = t => midColor(categoryMap[t.subcategory_id]?.color)
      } else {
        getKey   = t => t.category_id ? (categoryMap[t.category_id]?.name ?? 'Other') : null
        getColor = t => midColor(categoryMap[t.category_id]?.color)
      }
    } else if (ddDimension === 'subcategory') {
      getKey   = t => t.subcategory_id ? (categoryMap[t.subcategory_id]?.name ?? 'Other') : null
      getColor = t => midColor(categoryMap[t.subcategory_id]?.color)
    } else if (ddDimension === 'receiver') {
      if (ddFilter) {
        // drill into categories for selected receiver
        getKey   = t => t.category_id ? (categoryMap[t.category_id]?.name ?? 'Other') : 'Uncategorized'
        getColor = t => midColor(categoryMap[t.category_id]?.color)
      } else {
        getKey   = t => t.receiver_id ? (receiverMap[t.receiver_id]?.name ?? 'Unknown') : null
        getColor = t => t.receiver_id ? getMerchantColor(receiverMap[t.receiver_id]?.name ?? 'Unknown') : null
      }
    } else {
      // importance
      if (ddFilter) {
        // drill into categories for selected importance
        getKey   = t => t.category_id ? (categoryMap[t.category_id]?.name ?? 'Other') : null
        getColor = t => midColor(categoryMap[t.category_id]?.color)
      } else {
        getKey   = t => { const imp = catImportance[t.subcategory_id] ?? catImportance[t.category_id]; return imp ? (DEFAULT_IMPORTANCE.find(d => d.value === imp)?.label ?? imp) : null }
        getColor = t => { const imp = catImportance[t.subcategory_id] ?? catImportance[t.category_id]; return imp ? (importanceColors[imp] ?? DEFAULT_IMPORTANCE.find(d => d.value === imp)?.color) : null }
      }
    }

    // Collect ordered groups (by total desc)
    const totals = {}, colorOf = {}
    ddFiltered.forEach(t => {
      const k = getKey(t)
      if (!k) return
      totals[k] = (totals[k] || 0) + Number(t.amount)
      if (!colorOf[k]) colorOf[k] = getColor(t)
    })
    const series = Object.entries(totals)
      .sort(([,a],[,b]) => b - a)
      .map(([name], i) => ({ name, color: colorOf[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }))

    const toLabel = mk => new Date(mk + '-15').toLocaleDateString('en-US', { month: 'short', ...(range === 'all' ? { year: '2-digit' } : {}) })

    if (range === 'week') {
      const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const byDow = {}
      ddFiltered.forEach(t => {
        const k = getKey(t)
        if (!k) return
        const dow = (new Date(t.date + 'T12:00:00').getDay() + 6) % 7
        if (!byDow[dow]) byDow[dow] = {}
        byDow[dow][k] = (byDow[dow][k] || 0) + Number(t.amount)
      })
      return {
        data:   Array.from({ length: 7 }, (_, i) => ({ label: DOW_SHORT[i], ...Object.fromEntries(series.map(s => [s.name, byDow[i]?.[s.name] || 0])) })),
        series,
      }
    }
    if (range === 'month') {
      const days = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
      const byDay = {}
      ddFiltered.forEach(t => {
        const k = getKey(t)
        if (!k) return
        const d = parseInt(t.date.slice(8, 10))
        if (!byDay[d]) byDay[d] = {}
        byDay[d][k] = (byDay[d][k] || 0) + Number(t.amount)
      })
      return {
        data:   Array.from({ length: days }, (_, i) => ({ label: String(i + 1), ...Object.fromEntries(series.map(s => [s.name, byDay[i+1]?.[s.name] || 0])) })),
        series,
      }
    }

    const byMonth = {}
    ddFiltered.forEach(t => {
      const k = getKey(t)
      if (!k) return
      const mk = t.date.slice(0, 7)
      if (!byMonth[mk]) byMonth[mk] = {}
      byMonth[mk][k] = (byMonth[mk][k] || 0) + Number(t.amount)
    })
    return {
      data:   Object.entries(byMonth).sort(([a],[b]) => a.localeCompare(b)).map(([mk, v]) => ({ label: toLabel(mk), ...Object.fromEntries(series.map(s => [s.name, v[s.name] || 0])) })),
      series,
    }
  }, [ddFiltered, ddDimension, ddFilter, categoryMap, catImportance, importanceColors, range, currentDate, receiverMap])

  const ddColor = useMemo(() => {
    if (!ddFilter) return colors.expense
    if (ddDimension === 'category' || ddDimension === 'subcategory')
      return midColor(categoryMap[ddFilter]?.color) || colors.expense
    if (ddDimension === 'receiver')
      return getMerchantColor(receiverMap[ddFilter]?.name ?? '') || colors.expense
    return importanceColors[ddFilter] ?? DEFAULT_IMPORTANCE.find(d => d.value === ddFilter)?.color ?? colors.expense
  }, [ddFilter, ddDimension, categoryMap, importanceColors, receiverMap, colors.expense])

  const ddBarTransactions = useMemo(() => {
    if (!ddClickedLabel) return []
    const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return ddFiltered.filter(t => {
      if (range === 'week') {
        const dow = (new Date(t.date + 'T12:00:00').getDay() + 6) % 7
        return DOW_SHORT[dow] === ddClickedLabel
      }
      if (range === 'month') {
        return String(parseInt(t.date.slice(8, 10))) === ddClickedLabel
      }
      const mk = t.date.slice(0, 7)
      const label = new Date(mk + '-15').toLocaleDateString('en-US', { month: 'short', ...(range === 'all' ? { year: '2-digit' } : {}) })
      return label === ddClickedLabel
    }).sort((a, b) => Number(b.amount) - Number(a.amount))
  }, [ddClickedLabel, ddFiltered, range])

  // ── Previous period expenses (for MoM comparison) ──────────────
  const prevPeriodExpenses = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    return transactions.filter(t => {
      if (t.type !== 'expense' || t.is_split_parent) return false
      const d = new Date(t.date + 'T00:00:00')
      if (range === 'compare') {
        return d.getFullYear() === compareDate.getFullYear() && d.getMonth() === compareDate.getMonth()
      }
      if (range === 'month') {
        const py = m === 0 ? y - 1 : y
        const pm = m === 0 ? 11 : m - 1
        return d.getFullYear() === py && d.getMonth() === pm
      }
      if (range === '3m') {
        const start = new Date(y, m - 5, 1)
        const end   = new Date(y, m - 2, 0)
        return d >= start && d <= end
      }
      if (range === 'year') return d.getFullYear() === y - 1
      return false
    })
  }, [transactions, range, currentDate, compareDate])

  const categoryComparison = useMemo(() => {
    const prevMap = {}
    prevPeriodExpenses.forEach(t => {
      if (!t.category_id) return
      const name = categoryMap[t.category_id]?.name ?? 'Unknown'
      prevMap[name] = (prevMap[name] || 0) + Number(t.amount)
    })
    return categoryData
      .map(c => ({
        ...c,
        prev: prevMap[c.name] ?? 0,
        pct: (prevMap[c.name] ?? 0) > 0 ? ((c.value - prevMap[c.name]) / prevMap[c.name]) * 100 : null,
      }))
      .slice(0, 8)
  }, [categoryData, prevPeriodExpenses, categoryMap])

  const subcategoryComparison = useMemo(() => {
    const prevMap = {}
    prevPeriodExpenses.forEach(t => {
      if (!t.subcategory_id) return
      const name = categoryMap[t.subcategory_id]?.name ?? 'Unknown'
      prevMap[name] = (prevMap[name] || 0) + Number(t.amount)
    })
    return subcategoryData
      .map(c => ({
        ...c,
        prev: prevMap[c.name] ?? 0,
        pct: (prevMap[c.name] ?? 0) > 0 ? ((c.value - prevMap[c.name]) / prevMap[c.name]) * 100 : null,
      }))
      .slice(0, 8)
  }, [subcategoryData, prevPeriodExpenses, categoryMap])

  const importanceComparison = useMemo(() => {
    const prevMap = {}
    prevPeriodExpenses.forEach(t => {
      const imp = catImportance[t.subcategory_id] ?? catImportance[t.category_id]
      if (!imp) return
      const def = DEFAULT_IMPORTANCE.find(d => d.value === imp)
      if (!def) return
      prevMap[def.label] = (prevMap[def.label] || 0) + Number(t.amount)
    })
    return importanceData
      .map(c => ({
        ...c,
        prev: prevMap[c.name] ?? 0,
        pct: (prevMap[c.name] ?? 0) > 0 ? ((c.value - prevMap[c.name]) / prevMap[c.name]) * 100 : null,
      }))
  }, [importanceData, prevPeriodExpenses, catImportance])

  const receiverComparison = useMemo(() => {
    const prevMap = {}
    prevPeriodExpenses.forEach(t => {
      if (!t.receiver_id) return
      const name = receiverMap[t.receiver_id]?.name ?? 'Unknown'
      prevMap[name] = (prevMap[name] || 0) + Number(t.amount)
    })
    const curr = {}
    expenses.forEach(t => {
      if (!t.receiver_id) return
      const name = receiverMap[t.receiver_id]?.name ?? 'Unknown'
      if (!curr[name]) curr[name] = { value: 0 }
      curr[name].value += Number(t.amount)
    })
    return Object.entries(curr)
      .map(([name, { value }]) => ({
        name,
        value,
        color: getMerchantColor(name),
        prev: prevMap[name] ?? 0,
        pct: (prevMap[name] ?? 0) > 0 ? ((value - prevMap[name]) / prevMap[name]) * 100 : null,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [expenses, prevPeriodExpenses, receiverMap])

  // ── Cumulative spending curve (current vs previous month) ───────
  const cumulativeData = useMemo(() => {
    if (range !== 'month' && range !== 'compare') return []
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const days = new Date(y, m + 1, 0).getDate()
    const byDay = {}
    expenses.forEach(t => { const d = parseInt(t.date.slice(8, 10)); byDay[d] = (byDay[d] || 0) + Number(t.amount) })
    const prevByDay = {}
    prevPeriodExpenses.forEach(t => { const d = parseInt(t.date.slice(8, 10)); prevByDay[d] = (prevByDay[d] || 0) + Number(t.amount) })
    let cumCurr = 0, cumPrev = 0
    return Array.from({ length: days }, (_, i) => {
      const d = i + 1
      cumCurr += byDay[d] || 0
      cumPrev += prevByDay[d] || 0
      return { label: String(d), current: cumCurr, previous: cumPrev }
    })
  }, [expenses, prevPeriodExpenses, range, currentDate])

  // ── Month-over-month by category ────────────────────────────────
  const momData = useMemo(() => {
    if (range === 'all') return []
    const curr = {}, prev = {}
    expenses.filter(t => t.category_id).forEach(t => {
      const name = categoryMap[t.category_id]?.name ?? 'Unknown'
      curr[name] = { total: (curr[name]?.total || 0) + Number(t.amount), color: midColor(categoryMap[t.category_id]?.color) }
    })
    prevPeriodExpenses.filter(t => t.category_id).forEach(t => {
      const name = categoryMap[t.category_id]?.name ?? 'Unknown'
      prev[name] = (prev[name] || 0) + Number(t.amount)
    })
    const allNames = new Set([...Object.keys(curr), ...Object.keys(prev)])
    return [...allNames]
      .map(name => {
        const c = curr[name]?.total || 0
        const p = prev[name] || 0
        const change = p > 0 ? ((c - p) / p) * 100 : null
        return { name, current: c, prev: p, change, color: curr[name]?.color || FALLBACK_COLORS[0] }
      })
      .filter(d => d.current > 0 || d.prev > 0)
      .sort((a, b) => b.current - a.current)
      .slice(0, 10)
  }, [expenses, prevPeriodExpenses, categoryMap, range])

  // ── Previous period income (for Compare view) ────────────────────
  const prevPeriodIncome = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    return transactions.filter(t => {
      if (t.type !== 'income' || t.is_split_parent) return false
      const d = new Date(t.date + 'T00:00:00')
      if (range === 'compare') {
        return d.getFullYear() === compareDate.getFullYear() && d.getMonth() === compareDate.getMonth()
      }
      if (range === 'month') {
        const py = m === 0 ? y - 1 : y
        const pm = m === 0 ? 11 : m - 1
        return d.getFullYear() === py && d.getMonth() === pm
      }
      if (range === '3m') {
        const start = new Date(y, m - 5, 1)
        const end   = new Date(y, m - 2, 0)
        return d >= start && d <= end
      }
      if (range === 'year') return d.getFullYear() === y - 1
      return false
    })
  }, [transactions, range, currentDate, compareDate])

  // ── Weekly breakdown for Compare > Weeks of Month, Month sidebar, and Week daily ──
  const weeklyData = useMemo(() => {
    if (range === 'week') {
      const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const wStart = new Date(currentDate)
      wStart.setDate(wStart.getDate() - ((wStart.getDay() + 6) % 7))
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(wStart); d.setDate(wStart.getDate() + i)
        const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        const txs = transactions.filter(t => !t.is_split_parent && t.date === s)
        const exp = txs.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
        const inc = txs.filter(t => t.type === 'income') .reduce((a, t) => a + Number(t.amount), 0)
        return { label: DOW[i], dates: s, expenses: exp, income: inc, net: inc - exp }
      })
    }
    if (range !== 'compare' && range !== 'month') return []
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const monthStart = new Date(y, m, 1)
    const monthEnd   = new Date(y, m + 1, 0)
    const weeks = []
    const cursor = new Date(monthStart)
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7)) // back to Monday
    let num = 1
    while (cursor <= monthEnd) {
      const wEnd = new Date(cursor); wEnd.setDate(wEnd.getDate() + 6)
      const cStart = cursor < monthStart ? new Date(monthStart) : new Date(cursor)
      const cEnd   = wEnd   > monthEnd  ? new Date(monthEnd)   : new Date(wEnd)
      const s = cStart.toISOString().slice(0, 10)
      const e = cEnd.toISOString().slice(0, 10)
      const txs = transactions.filter(t => !t.is_split_parent && t.date >= s && t.date <= e)
      const exp = txs.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0)
      const inc = txs.filter(t => t.type === 'income') .reduce((a, t) => a + Number(t.amount), 0)
      const ms  = cStart.toLocaleDateString('en-US', { month: 'short' })
      weeks.push({
        label:  `W${num}`,
        dates:  cStart.getDate() === cEnd.getDate() ? `${cStart.getDate()} ${ms}` : `${cStart.getDate()}–${cEnd.getDate()} ${ms}`,
        expenses: exp, income: inc, net: inc - exp,
      })
      cursor.setDate(cursor.getDate() + 7)
      num++
    }
    return weeks
  }, [transactions, range, currentDate])

  // ── Weekly breakdown chart (weeks × dimension, for Compare > Weeks) ──
  const weeklyBreakdownData = useMemo(() => {
    if (range !== 'compare') return { data: [], series: [] }
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const monthStart = new Date(y, m, 1)
    const monthEnd   = new Date(y, m + 1, 0)
    const s0 = monthStart.toISOString().slice(0, 10)
    const e0 = monthEnd.toISOString().slice(0, 10)
    const rawWeeks = []
    const cursor = new Date(monthStart)
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
    while (cursor <= monthEnd) {
      const wEnd = new Date(cursor); wEnd.setDate(wEnd.getDate() + 6)
      const cStart = cursor < monthStart ? new Date(monthStart) : new Date(cursor)
      const cEnd   = wEnd > monthEnd    ? new Date(monthEnd)   : new Date(wEnd)
      const days = Math.round((cEnd - cStart) / 86400000) + 1
      rawWeeks.push({ label: `W${isoWeek(cStart)}`, s: cStart.toISOString().slice(0,10), e: cEnd.toISOString().slice(0,10), days })
      cursor.setDate(cursor.getDate() + 7)
    }
    const keptWeeks = rawWeeks.filter(w => w.days >= 4)
    const weekBounds = keptWeeks.map((w, i) => ({
      label: w.label,
      s: i === 0 ? s0 : w.s,
      e: i === keptWeeks.length - 1 ? e0 : w.e,
    }))
    const isType = weekBreakdownDim === 'type'
    const pool = isType
      ? transactions.filter(t => !t.is_split_parent)
      : transactions.filter(t => t.type === 'expense' && !t.is_split_parent)
    let getKey, getColor
    if (weekBreakdownDim === 'category') {
      getKey   = t => t.category_id    ? (categoryMap[t.category_id]?.name    ?? 'Unknown') : null
      getColor = t => midColor(categoryMap[t.category_id]?.color)
    } else if (weekBreakdownDim === 'subcategory') {
      getKey   = t => t.subcategory_id ? (categoryMap[t.subcategory_id]?.name ?? 'Unknown') : null
      getColor = t => midColor(categoryMap[t.subcategory_id]?.color)
    } else if (weekBreakdownDim === 'importance') {
      getKey   = t => { const i = catImportance[t.subcategory_id] ?? catImportance[t.category_id]; return i ? (DEFAULT_IMPORTANCE.find(d => d.value === i)?.label ?? i) : null }
      getColor = t => { const i = catImportance[t.subcategory_id] ?? catImportance[t.category_id]; return i ? (importanceColors[i] ?? DEFAULT_IMPORTANCE.find(d => d.value === i)?.color ?? FALLBACK_COLORS[0]) : null }
    } else {
      getKey   = t => { const k = typeKey(t); return k ? (TYPE_LABELS[k] ?? k) : null }
      getColor = t => { const k = typeKey(t); const b = k === 'cash_out' ? 'cash-out' : k?.replace('_in','').replace('_out',''); return b ? `var(--type-${b.replace(/_/g,'-')})` : FALLBACK_COLORS[0] }
    }
    const totals = {}, colorOf = {}
    pool.forEach(t => {
      const k = getKey(t); if (!k) return
      totals[k] = (totals[k] || 0) + Math.abs(Number(t.amount))
      if (!colorOf[k]) colorOf[k] = getColor(t)
    })
    const series = Object.entries(totals).sort(([,a],[,b]) => b - a)
      .map(([name], i) => ({ name, color: colorOf[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }))
    const data = weekBounds.map(({ label, s, e }) => {
      const wTxs = pool.filter(t => t.date >= s && t.date <= e)
      const byKey = {}
      wTxs.forEach(t => { const k = getKey(t); if (k) byKey[k] = (byKey[k] || 0) + Math.abs(Number(t.amount)) })
      return { label, ...Object.fromEntries(series.map(({ name }) => [name, byKey[name] || 0])) }
    })
    return { data, series }
  }, [transactions, range, currentDate, weekBreakdownDim, categoryMap, catImportance, importanceColors])

  // ── All-dimension weekly amounts (for WeekBreakCards) ────────────
  const weeklyAllDimsBreakdown = useMemo(() => {
    if (range !== 'compare') return { weekLabels: [], dims: { category: [], subcategory: [], importance: [], type: [] } }
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const monthStart = new Date(y, m, 1)
    const monthEnd   = new Date(y, m + 1, 0)
    const s0 = monthStart.toISOString().slice(0, 10)
    const e0 = monthEnd.toISOString().slice(0, 10)
    const rawWeeks = []
    const cursor = new Date(monthStart)
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
    while (cursor <= monthEnd) {
      const wEnd = new Date(cursor); wEnd.setDate(wEnd.getDate() + 6)
      const cStart = cursor < monthStart ? new Date(monthStart) : new Date(cursor)
      const cEnd   = wEnd > monthEnd    ? new Date(monthEnd)   : new Date(wEnd)
      const days = Math.round((cEnd - cStart) / 86400000) + 1
      rawWeeks.push({ label: `W${isoWeek(cStart)}`, s: cStart.toISOString().slice(0,10), e: cEnd.toISOString().slice(0,10), days })
      cursor.setDate(cursor.getDate() + 7)
    }
    const keptWeeks = rawWeeks.filter(w => w.days >= 4)
    const weekBounds = keptWeeks.map((w, i) => ({
      label: w.label,
      s: i === 0 ? s0 : w.s,
      e: i === keptWeeks.length - 1 ? e0 : w.e,
    }))
    const expTxs = transactions.filter(t => t.type === 'expense' && !t.is_split_parent && t.date >= s0 && t.date <= e0)
    const allTxs = transactions.filter(t => !t.is_split_parent && t.date >= s0 && t.date <= e0)

    const buildRows = (pool, getKey, getColor) => {
      const totals = {}, colorOf = {}, weekAmts = {}
      pool.forEach(t => {
        const k = getKey(t); if (!k) return
        totals[k] = (totals[k] || 0) + Math.abs(Number(t.amount))
        if (!colorOf[k]) colorOf[k] = getColor(t)
      })
      weekBounds.forEach(({ s, e }, wi) => {
        pool.filter(t => t.date >= s && t.date <= e).forEach(t => {
          const k = getKey(t); if (!k) return
          if (!weekAmts[k]) weekAmts[k] = Array(weekBounds.length).fill(0)
          weekAmts[k][wi] += Math.abs(Number(t.amount))
        })
      })
      return Object.entries(totals).sort(([,a],[,b]) => b - a)
        .map(([name], i) => ({
          name,
          color: colorOf[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
          weeks: weekAmts[name] || Array(weekBounds.length).fill(0),
        }))
    }

    return {
      weekLabels: weekBounds.map(w => w.label),
      dims: {
        category:    buildRows(expTxs,
          t => t.category_id    ? (categoryMap[t.category_id]?.name    ?? 'Unknown') : null,
          t => midColor(categoryMap[t.category_id]?.color)),
        subcategory: buildRows(expTxs,
          t => t.subcategory_id ? (categoryMap[t.subcategory_id]?.name ?? 'Unknown') : null,
          t => midColor(categoryMap[t.subcategory_id]?.color)),
        importance:  buildRows(expTxs,
          t => { const i = catImportance[t.subcategory_id] ?? catImportance[t.category_id]; return i ? (DEFAULT_IMPORTANCE.find(d => d.value === i)?.label ?? i) : null },
          t => { const i = catImportance[t.subcategory_id] ?? catImportance[t.category_id]; return i ? (importanceColors[i] ?? DEFAULT_IMPORTANCE.find(d => d.value === i)?.color ?? FALLBACK_COLORS[0]) : null }),
        type:        buildRows(allTxs,
          t => { const k = typeKey(t); return k ? (TYPE_LABELS[k] ?? k) : null },
          t => { const k = typeKey(t); const b = k === 'cash_out' ? 'cash-out' : k?.replace('_in','').replace('_out',''); return b ? `var(--type-${b.replace(/_/g,'-')})` : FALLBACK_COLORS[0] }),
      },
    }
  }, [transactions, range, currentDate, categoryMap, catImportance, importanceColors])

  // ── Daily bar data for the compare month ─────────────────────────
  const weekDailyData = useMemo(() => {
    if (range !== 'compare') return []
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const days = new Date(y, m + 1, 0).getDate()
    const byDay = {}
    filtered.forEach(t => {
      if (t.is_split_parent) return
      const d = parseInt(t.date.slice(8, 10))
      if (!byDay[d]) byDay[d] = { income: 0, expense: 0 }
      if (t.type === 'income')  byDay[d].income  += Number(t.amount)
      if (t.type === 'expense') byDay[d].expense += Number(t.amount)
    })
    return Array.from({ length: days }, (_, i) => ({
      label:   String(i + 1),
      income:  byDay[i + 1]?.income  || 0,
      expense: byDay[i + 1]?.expense || 0,
    }))
  }, [filtered, range, currentDate])

  // ── Daily per-dimension line data (linked to WeekBreakPanel tab) ──
  const weekDailyDimData = useMemo(() => {
    if (range !== 'compare') return { data: [], series: [] }
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const days = new Date(y, m + 1, 0).getDate()
    const isType = weekBreakdownDim === 'type'
    const pool = filtered.filter(t => !t.is_split_parent && (isType || t.type === 'expense'))
    const getKey = t => {
      if (weekBreakdownDim === 'category')    return t.category_id    ? (categoryMap[t.category_id]?.name    ?? 'Unknown') : null
      if (weekBreakdownDim === 'subcategory') return t.subcategory_id ? (categoryMap[t.subcategory_id]?.name ?? 'Unknown') : null
      if (weekBreakdownDim === 'importance')  { const i = catImportance[t.subcategory_id] ?? catImportance[t.category_id]; return i ? (DEFAULT_IMPORTANCE.find(d => d.value === i)?.label ?? i) : null }
      const k = typeKey(t); return k ? (TYPE_LABELS[k] ?? k) : null
    }
    const byDay = {}
    pool.forEach(t => {
      const d = parseInt(t.date.slice(8, 10))
      const k = getKey(t); if (!k) return
      if (!byDay[d]) byDay[d] = {}
      byDay[d][k] = (byDay[d][k] || 0) + Math.abs(Number(t.amount))
    })
    const series = (weeklyAllDimsBreakdown.dims[weekBreakdownDim] ?? []).slice(0, 8)
    const data = Array.from({ length: days }, (_, i) => {
      const entry = { label: String(i + 1) }
      series.forEach(s => { entry[s.name] = byDay[i + 1]?.[s.name] || 0 })
      return entry
    })
    return { data, series }
  }, [filtered, range, currentDate, weekBreakdownDim, weeklyAllDimsBreakdown, categoryMap, catImportance])

  // ── Type donut for weeks view ─────────────────────────────────────
  const weekTypeDonutData = useMemo(() => {
    if (range !== 'compare') return []
    const map = {}
    filtered.filter(t => !t.is_split_parent).forEach(t => {
      const k = typeKey(t); if (!k) return
      const label = TYPE_LABELS[k] ?? k
      const base  = k === 'cash_out' ? 'cash-out' : k.replace('_in','').replace('_out','')
      const color = `var(--type-${base.replace(/_/g,'-')})`
      if (!map[label]) map[label] = { name: label, value: 0, color }
      map[label].value += Math.abs(Number(t.amount))
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [filtered, range])

  // ── Savings rate over time (last 12 months) ─────────────────────
  const savingsRateData = useMemo(() => {
    const byMonth = {}
    transactions.forEach(t => {
      if (t.is_split_parent) return
      const mk = t.date.slice(0, 7)
      if (!byMonth[mk]) byMonth[mk] = { income: 0, expense: 0 }
      if (t.type === 'income')  byMonth[mk].income  += Number(t.amount)
      if (t.type === 'expense') byMonth[mk].expense += Number(t.amount)
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([mk, v]) => ({
        label: new Date(mk + '-15').toLocaleDateString('en-US', { month: 'short' }),
        rate: v.income > 0 ? Math.max(-100, ((v.income - v.expense) / v.income) * 100) : 0,
      }))
  }, [transactions])

  // ── Income sources donut ─────────────────────────────────────────
  const incomeSourceData = useMemo(() => {
    const earned    = { name: 'Earned',     value: 0, color: colors.incomeEarned    }
    const notEarned = { name: 'Not earned', value: 0, color: colors.incomeNotEarned }
    filtered.filter(t => t.type === 'income' && !t.is_split_parent).forEach(t => {
      if (t.is_earned) earned.value += Number(t.amount)
      else notEarned.value += Number(t.amount)
    })
    return [earned, notEarned].filter(d => d.value > 0).sort((a, b) => b.value - a.value)
  }, [filtered, colors.incomeEarned, colors.incomeNotEarned])

  // ── Top merchants ────────────────────────────────────────────────
  const topMerchantsData = useMemo(() => {
    const map = {}
    expenses.forEach(t => {
      if (!t.receiver_id) return
      const name = receiverMap[t.receiver_id]?.name ?? 'Unknown'
      if (!map[name]) map[name] = { name, total: 0, count: 0 }
      map[name].total += Number(t.amount)
      map[name].count++
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8).map(m => ({ ...m, avg: m.total / m.count }))
  }, [expenses, receiverMap])

  // ── New merchants this period ────────────────────────────────────
  const newMerchantsData = useMemo(() => {
    if (!filtered.length) return []
    const periodStart = filtered.slice().sort((a, b) => a.date.localeCompare(b.date))[0].date
    const historical = new Set(
      transactions
        .filter(t => t.date < periodStart && t.receiver_id && t.type === 'expense' && !t.is_split_parent)
        .map(t => t.receiver_id)
    )
    const map = {}
    expenses.forEach(t => {
      if (!t.receiver_id || historical.has(t.receiver_id)) return
      const name = receiverMap[t.receiver_id]?.name ?? 'Unknown'
      if (!map[name]) map[name] = { name, total: 0, count: 0 }
      map[name].total += Number(t.amount)
      map[name].count++
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [expenses, transactions, receiverMap, filtered])

  // ── Spending trend (all-time monthly, for habit tracking) ────────
  const [habitDimension, setHabitDimension] = useState('total')
  const [habitChartType, setHabitChartType] = useState(() => localStorage.getItem('analytics-habitChartType') ?? 'bar')
  function handleHabitChartType(t) { setHabitChartType(t); localStorage.setItem('analytics-habitChartType', t) }

  // ── Appearance settings ───────────────────────────────────────
  const [showDonuts,        setShowDonuts]        = useState(() => (localStorage.getItem('an-showDonuts')        ?? 'true') === 'true')
  const [showDeepDive,      setShowDeepDive]      = useState(() => (localStorage.getItem('an-showDeepDive')      ?? 'true') === 'true')
  const [showProjected,     setShowProjected]     = useState(() => (localStorage.getItem('an-showProjected')     ?? 'true') === 'true')
  const [showInsights,      setShowInsights]      = useState(() => (localStorage.getItem('an-showInsights')      ?? 'true') === 'true')
  const [showWeekSummary,   setShowWeekSummary]   = useState(() => (localStorage.getItem('an-showWeekSummary')   ?? 'true') === 'true')
  const [showSpendingHabit, setShowSpendingHabit] = useState(() => (localStorage.getItem('an-showSpendingHabit') ?? 'true') === 'true')
  const [appearanceOpen,    setAppearanceOpen]    = useState(false)
  const appearanceRef = useRef(null)
  useEffect(() => {
    if (!appearanceOpen) return
    function handler(e) { if (appearanceRef.current && !appearanceRef.current.contains(e.target)) setAppearanceOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [appearanceOpen])
  function toggleAppearance(key, val, setter) { setter(val); localStorage.setItem(key, String(val)) }

  const allExpenses = useMemo(
    () => transactions.filter(t => t.type === 'expense' && !t.is_split_parent),
    [transactions]
  )

  const spendingTrendData = useMemo(() => {
    const byMonth = {}
    allExpenses.forEach(t => {
      const mk = t.date.slice(0, 7)
      byMonth[mk] = (byMonth[mk] || 0) + Number(t.amount)
    })
    const sorted = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-18)
      .map(([mk, total]) => ({
        label: new Date(mk + '-15').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        total,
      }))
    const avg = sorted.length ? sorted.reduce((s, d) => s + d.total, 0) / sorted.length : 0
    const mid = Math.floor(sorted.length / 2)
    const firstHalf  = sorted.slice(0, mid)
    const secondHalf = sorted.slice(mid)
    const firstAvg  = firstHalf.length  ? firstHalf.reduce((s, d)  => s + d.total, 0) / firstHalf.length  : 0
    const secondAvg = secondHalf.length ? secondHalf.reduce((s, d) => s + d.total, 0) / secondHalf.length : 0
    const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : null
    return { data: sorted, avg, trendPct }
  }, [allExpenses])

  const habitLineData = useMemo(() => {
    if (habitDimension === 'total') return { data: [], series: [] }
    if (habitDimension === 'category')
      return buildLineData(allExpenses, 'all', currentDate,
        t => t.category_id    ? (categoryMap[t.category_id]?.name    ?? 'Unknown') : null,
        t => midColor(categoryMap[t.category_id]?.color))
    if (habitDimension === 'subcategory')
      return buildLineData(allExpenses, 'all', currentDate,
        t => t.subcategory_id ? (categoryMap[t.subcategory_id]?.name ?? 'Unknown') : null,
        t => midColor(categoryMap[t.subcategory_id]?.color))
    // receiver
    return buildLineData(allExpenses, 'all', currentDate,
      t => t.receiver_id ? (receiverMap[t.receiver_id]?.name ?? 'Unknown') : null,
      t => t.receiver_id ? getMerchantColor(receiverMap[t.receiver_id]?.name ?? 'Unknown') : null)
  }, [habitDimension, allExpenses, categoryMap, receiverMap, receiverColorMap, currentDate, merchantPalette])

  // ── Deep dive: spending by weekday for filtered set ──────────────
  const ddDowData = useMemo(() => {
    const byDow = [0, 0, 0, 0, 0, 0, 0]
    ddFiltered.forEach(t => { byDow[new Date(t.date + 'T00:00:00').getDay()] += Number(t.amount) })
    return [1, 2, 3, 4, 5, 6, 0].map(i => ({ label: DOW_LABELS[i], value: byDow[i] }))
  }, [ddFiltered])

  // ── Tree flow data (category > subcategory > importance) ──────────
  const treeFlowData = useMemo(() => {
    if (range !== 'tree') return []
    const catGroups = {}
    filtered.filter(t => !t.is_split_parent && t.type === 'expense').forEach(t => {
      const catId = t.category_id
      if (!catId) return
      if (!catGroups[catId]) catGroups[catId] = { total: 0, subs: {} }
      catGroups[catId].total += Number(t.amount)
      const subId = t.subcategory_id
      if (subId) {
        catGroups[catId].subs[subId] = (catGroups[catId].subs[subId] ?? 0) + Number(t.amount)
      }
    })
    return Object.entries(catGroups)
      .map(([catId, data]) => {
        const cat = categoryMap[catId] ?? {}
        const subcategories = Object.entries(data.subs)
          .map(([subId, amount]) => {
            const sub = categoryMap[subId] ?? {}
            const impVal = catImportance[subId] ?? catImportance[catId]
            const impObj = DEFAULT_IMPORTANCE.find(d => d.value === impVal)
            return {
              id: subId,
              name: sub.name ?? 'Unknown',
              color: midColor(sub.color) ?? midColor(cat.color) ?? FALLBACK_COLORS[0],
              amount,
              importance: impObj ?? null,
            }
          })
          .sort((a, b) => b.amount - a.amount)
        const impVal = catImportance[catId]
        const impObj = DEFAULT_IMPORTANCE.find(d => d.value === impVal)
        return {
          id: catId,
          name: cat.name ?? 'Unknown',
          color: midColor(cat.color) ?? FALLBACK_COLORS[0],
          total: data.total,
          subcategories,
          importance: impObj ?? null,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [filtered, categoryMap, catImportance, range])

  const prevMonthDate = range === 'compare' ? compareDate : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
  const periodLabel = range === 'compare'
    ? `${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} vs ${prevMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : range === 'week'
    ? (() => {
        const mon = new Date(currentDate)
        mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7))
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
        const opts = { month: 'short', day: 'numeric' }
        return `${mon.toLocaleDateString('en-US', opts)} – ${sun.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
      })()
    : range === 'month'
    ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : range === '3m'   ? 'Last 3 Months'
    : range === 'year' ? String(currentDate.getFullYear())
    : 'All Time'

  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar
        currentDate={currentDate}
        onPrev={() => {
          if (range === 'week') setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
          else setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
        }}
        onNext={() => {
          if (range === 'week') setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
          else setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
        }}
      />

      <div id="page-content" className="py-6 px-4 md:px-16 pb-24 md:pb-6">

        {/* Title + range tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t('an.title')}</h1>
            <p className="text-muted text-sm mt-1">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="overflow-x-auto scrollbar-none flex-1 min-w-0">
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-max">
                {RANGE_IDS.map(id => (
                  <button
                    key={id}
                    onClick={() => setRange(id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      range === id ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {t(RANGE_KEYS[id])}
                  </button>
                ))}
              </div>
            </div>

            {/* Appearance button + popover */}
            <div className="relative shrink-0" ref={appearanceRef}>
              <button
                type="button"
                onClick={() => setAppearanceOpen(v => !v)}
                className={`p-2 rounded-xl border transition-colors ${appearanceOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'}`}
              >
                <SlidersHorizontal size={14} />
              </button>
              {appearanceOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 glass-popup border border-white/10 rounded-2xl p-4 w-52 shadow-xl flex flex-col gap-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted font-medium">Appearance</p>
                  {[
                    { label: 'Donut charts',      key: 'an-showDonuts',        val: showDonuts,        set: setShowDonuts        },
                    { label: 'Deep dive',          key: 'an-showDeepDive',      val: showDeepDive,      set: setShowDeepDive      },
                    { label: 'Projected spend',    key: 'an-showProjected',     val: showProjected,     set: setShowProjected     },
                    { label: 'Financial insights', key: 'an-showInsights',      val: showInsights,      set: setShowInsights      },
                    { label: 'Week summary',       key: 'an-showWeekSummary',   val: showWeekSummary,   set: setShowWeekSummary   },
                    { label: 'Spending habit',     key: 'an-showSpendingHabit', val: showSpendingHabit, set: setShowSpendingHabit },
                  ].map(({ label, key, val, set }) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-white/60">{label}</span>
                      <button
                        type="button"
                        onClick={() => toggleAppearance(key, !val, set)}
                        className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${val ? '' : 'bg-white/10'}`}
                        style={val ? { background: 'var(--color-accent)' } : undefined}
                      >
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${val ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Compare view ── */}
        {range === 'compare' && (() => {
          const currExp  = typeTotals['expense'] || 0
          const prevExp  = prevPeriodExpenses.reduce((s, t) => s + Number(t.amount), 0)
          const currInc  = typeTotals['income']  || 0
          const prevInc  = prevPeriodIncome.reduce((s, t) => s + Number(t.amount), 0)
          const expDiff  = currExp - prevExp
          const incDiff  = currInc - prevInc
          const expPct   = prevExp  > 0 ? ((expDiff / prevExp) * 100) : null
          const incPct   = prevInc  > 0 ? ((incDiff / prevInc) * 100) : null
          const sameYear  = currentDate.getFullYear() === prevMonthDate.getFullYear()
          const currLabel = currentDate.toLocaleDateString('en-US', sameYear ? { month: 'long' } : { month: 'long', year: 'numeric' })
          const prevLabel = prevMonthDate.toLocaleDateString('en-US', sameYear ? { month: 'long' } : { month: 'long', year: 'numeric' })
          const maxVal = momData.reduce((mx, d) => Math.max(mx, d.current, d.prev), 0)
          return (
            <div className="flex flex-col gap-5">

              {/* Compare sub-mode toggle */}
              <div className="flex items-center gap-2">
                {[['months', t('an.monthVsMonth')], ['weeks', t('an.weeksOfMonth')]].map(([id, label]) => (
                  <button key={id} onClick={() => setCompareSubMode(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      compareSubMode === id ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Weeks of Month view */}
              {compareSubMode === 'weeks' && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-muted">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · {t('an.weekByWeek')}
                  </p>

                  {/* Per-week amounts: 4-column grid, one card per dimension */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {WEEK_BREAK_DIM_IDS.map(dim => (
                      <WeekBreakCard
                        key={dim}
                        title={t(WEEK_BREAK_DIM_KEYS[dim])}
                        rows={weeklyAllDimsBreakdown.dims[dim] ?? []}
                        weekLabels={weeklyAllDimsBreakdown.weekLabels}
                      />
                    ))}
                  </div>

                  {/* Weekly stacked breakdown with dimension toggle */}
                  <div className="glass-card rounded-2xl p-5 flex flex-col" style={{ height: 300 }}>
                    <div className="flex items-start justify-between mb-0.5">
                      <h2 className="text-sm font-semibold">{t('an.weekBreakdown')}</h2>
                      <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 shrink-0">
                        {WEEK_BREAK_DIM_IDS.map(id => (
                          <button key={id} onClick={() => setWeekBreakdownDim(id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                              weekBreakdownDim === id ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/60'
                            }`}>
                            {t(WEEK_BREAK_DIM_KEYS[id])}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted mb-3">
                      {weekBreakdownDim === 'type' ? t('an.allTypes') : t('an.expOnly')} · {t('an.stackedByWeek')}
                    </p>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyBreakdownData.data} barCategoryGap="30%">
                          <CartesianGrid vertical={false} stroke={GRID} />
                          <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                          <Tooltip content={<FilteredTooltip valueFormatter={fmtK} />} cursor={false} />
                          {weeklyBreakdownData.series.map(s => (
                            <Bar key={s.name} dataKey={s.name} stackId="a" fill={s.color} shape={<StackedBarShape />} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {weeklyBreakdownData.series.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        {weeklyBreakdownData.series.map(s => (
                          <div key={s.name} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                            <span className="text-[11px] text-white/50 truncate max-w-[120px]">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Week summary table */}
                  <div className="glass-card rounded-2xl p-5">
                    <h2 className="text-sm font-semibold mb-4">{t('an.weekSummary')}</h2>
                    <div className="flex flex-col gap-0">
                      <div className="grid grid-cols-5 gap-2 pb-2 border-b border-white/[0.06] mb-2">
                        {[t('an.week'), t('an.dates'), t('an.expenses'), t('an.income'), t('an.net')].map(h => (
                          <span key={h} className="text-[10px] text-muted uppercase tracking-wider">{h}</span>
                        ))}
                      </div>
                      {weeklyData.map(w => (
                        <div key={w.label} className="grid grid-cols-5 gap-2 py-2 border-b border-white/[0.04] last:border-0">
                          <span className="text-xs font-semibold text-white">{w.label}</span>
                          <span className="text-xs text-white/50">{w.dates}</span>
                          <span className="text-xs tabular-nums" style={{ color: colors.expense }}>{w.expenses > 0 ? fmt(w.expenses) : '—'}</span>
                          <span className="text-xs tabular-nums" style={{ color: colors.income  }}>{w.income   > 0 ? fmt(w.income)   : '—'}</span>
                          <span className="text-xs tabular-nums font-medium" style={{ color: w.net >= 0 ? colors.income : colors.expense }}>
                            {w.net !== 0 ? (w.net > 0 ? '+' : '') + fmt(w.net) : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Month vs Month view */}
              {compareSubMode === 'months' && <>

              {/* Month pickers */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{t('an.monthA')}</span>
                  <MonthPicker value={currentDate} onChange={d => setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1))} />
                </div>
                <span className="text-white/20 text-sm select-none">vs</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{t('an.monthB')}</span>
                  <MonthPicker value={compareDate} onChange={setCompareDate} />
                </div>
              </div>

              {/* Summary header */}
              <div className="glass-card rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-4">{t('an.periodSummary')}</h2>
                <div className="grid grid-cols-2 gap-6">
                  {/* Expenses comparison */}
                  <div>
                    <p className="text-[11px] text-muted uppercase tracking-widest mb-3">{t('an.expenses')}</p>
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-[11px] text-muted mb-1">{currLabel}</p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: colors.expense }}>{fmt(currExp)}</p>
                      </div>
                      <div className="mb-1 text-white/20 text-lg">vs</div>
                      <div>
                        <p className="text-[11px] text-muted mb-1">{prevLabel}</p>
                        <p className="text-2xl font-bold tabular-nums text-white/50">{fmt(prevExp)}</p>
                      </div>
                      {expPct !== null && (
                        <div className="mb-1 ml-2">
                          <span className="text-sm font-semibold px-2.5 py-1 rounded-full tabular-nums"
                            style={{ background: (expDiff >= 0 ? colors.expense : colors.income) + '22', color: expDiff >= 0 ? colors.expense : colors.income }}>
                            {expDiff >= 0 ? '+' : ''}{expPct.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Income comparison */}
                  <div>
                    <p className="text-[11px] text-muted uppercase tracking-widest mb-3">{t('an.income')}</p>
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-[11px] text-muted mb-1">{currLabel}</p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: colors.income }}>{fmt(currInc)}</p>
                      </div>
                      <div className="mb-1 text-white/20 text-lg">vs</div>
                      <div>
                        <p className="text-[11px] text-muted mb-1">{prevLabel}</p>
                        <p className="text-2xl font-bold tabular-nums text-white/50">{fmt(prevInc)}</p>
                      </div>
                      {incPct !== null && (
                        <div className="mb-1 ml-2">
                          <span className="text-sm font-semibold px-2.5 py-1 rounded-full tabular-nums"
                            style={{ background: (incDiff >= 0 ? colors.income : colors.expense) + '22', color: incDiff >= 0 ? colors.income : colors.expense }}>
                            {incDiff >= 0 ? '+' : ''}{incPct.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cumulative spending */}
              <div className="glass-card rounded-2xl p-5 flex flex-col" style={{ height: 260 }}>
                <h2 className="text-sm font-semibold mb-0.5">Cumulative Spending</h2>
                <p className="text-[11px] text-muted mb-4">{currLabel} vs {prevLabel}</p>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData}>
                      <defs>
                        <linearGradient id="cumCurrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={colors.expense} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={colors.expense} stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="cumPrevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={MUTED} stopOpacity={0.1} />
                          <stop offset="95%" stopColor={MUTED} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                      <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip content={<FilteredTooltip nameFormatter={n => n === 'current' ? currLabel : prevLabel} />} cursor={false} />
                      <Area type="monotone" dataKey="previous" stroke="rgba(255,255,255,0.25)" fill="url(#cumPrevGrad)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
                      <Area type="monotone" dataKey="current"  stroke={colors.expense} fill="url(#cumCurrGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category comparison — horizontal paired bars */}
              {momData.length > 0 && (
                <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">
                  <div>
                    <h2 className="text-sm font-semibold">{t('an.spendByCategory')}</h2>
                    <p className="text-[11px] text-muted mt-0.5">{currLabel} vs {prevLabel}</p>
                  </div>
                  <div className="flex flex-col gap-5">
                    {momData.map(d => {
                      const diffAmt   = d.current - d.prev
                      const isUp      = diffAmt > 0
                      const diffColor = isUp ? colors.expense : colors.income
                      return (
                        <div key={d.name} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                              <span className="text-xs font-semibold text-white">{d.name}</span>
                            </div>
                            {d.prev > 0 && (
                              <span className="text-xs font-semibold tabular-nums" style={{ color: diffColor }}>
                                {isUp ? '↑' : '↓'} {fmtK(Math.abs(diffAmt))}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-muted w-7 shrink-0">{t('an.now')}</span>
                            <div className="flex-1 h-5 bg-white/[0.06] rounded overflow-hidden">
                              <div className="h-full rounded" style={{ width: `${maxVal > 0 ? (d.current / maxVal) * 100 : 0}%`, background: d.color }} />
                            </div>
                            <span className="text-xs tabular-nums text-white/70 w-16 text-right shrink-0">{fmt(d.current, 0)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-muted w-7 shrink-0">{t('an.prev')}</span>
                            <div className="flex-1 h-5 bg-white/[0.06] rounded overflow-hidden">
                              <div className="h-full rounded" style={{ width: `${maxVal > 0 ? (d.prev / maxVal) * 100 : 0}%`, background: 'rgba(255,255,255,0.22)' }} />
                            </div>
                            <span className="text-xs tabular-nums text-white/40 w-16 text-right shrink-0">{fmt(d.prev, 0)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Savings rate (full width) */}
              <div className="glass-card rounded-2xl p-5 flex flex-col" style={{ height: 220 }}>
                <h2 className="text-sm font-semibold mb-0.5">{t('an.savingsRate')}</h2>
                <p className="text-[11px] text-muted mb-3">{t('an.savingsRateDesc')}</p>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={savingsRateData}>
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<FilteredTooltip valueFormatter={v => `${Number(v).toFixed(1)}%`} nameFormatter={() => 'Savings rate'} />} cursor={false} />
                      <ReferenceLine y={20} stroke={colors.income} strokeDasharray="4 3" strokeWidth={1.5} />
                      <Line type="monotone" dataKey="rate" stroke={colors.lineChart} strokeWidth={2} dot={{ fill: colors.lineChart, r: 3 }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3-col comparison row: Categories / Subcategories / Importance vs Prior Period */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ComparisonCard title={t('an.catVsPrior')}  rows={categoryComparison}   colors={colors} />
                <ComparisonCard title={t('an.subVsPrior')} rows={subcategoryComparison} colors={colors} />
                <ComparisonCard title={t('an.impVsPrior')} rows={importanceComparison}  colors={colors} />
              </div>

              </>}

            </div>
          )
        })()}

        {/* ── Tree flow view ── */}
        {range === 'tree' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted">
              {periodLabel} · Expenses by category → subcategory → importance
            </p>
            {treeFlowData.length === 0 ? (
              <p className="text-sm text-muted py-4">{t('an.noDataShort')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {treeFlowData.map((cat, ci) => {
                  const totalAll = treeFlowData.reduce((s, c) => s + c.total, 0)
                  const catPct   = totalAll > 0 ? (cat.total / totalAll) * 100 : 0
                  return (
                    <div key={cat.id} className="glass-card rounded-2xl overflow-hidden">
                      {/* Category header */}
                      <div className="flex items-center gap-3 px-4 py-3"
                        style={{ borderLeft: `3px solid ${cat.color}` }}>
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                        <span className="text-sm font-semibold flex-1">{cat.name}</span>
                        {cat.importance && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `color-mix(in srgb, ${cat.importance.color} 15%, transparent)`, color: cat.importance.color }}>
                            {cat.importance.label}
                          </span>
                        )}
                        <span className="text-[11px] text-white/40 tabular-nums">{catPct.toFixed(0)}%</span>
                        <span className="text-sm font-bold tabular-nums" style={{ color: cat.color }}>{fmt(cat.total)}</span>
                      </div>
                      {/* Progress bar for category */}
                      <div className="h-0.5 mx-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ width: `${catPct}%`, background: cat.color, opacity: 0.6 }} />
                      </div>
                      {/* Subcategories */}
                      {cat.subcategories.length > 0 && (
                        <div className="flex flex-col divide-y divide-white/[0.04] px-4 pb-2 pt-1">
                          {cat.subcategories.map(sub => {
                            const subPct = cat.total > 0 ? (sub.amount / cat.total) * 100 : 0
                            return (
                              <div key={sub.id} className="flex items-center gap-3 py-2">
                                <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: sub.color, opacity: 0.5 }} />
                                <span className="text-xs text-white/70 flex-1 truncate pl-2">{sub.name}</span>
                                {sub.importance && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                                    style={{ background: `color-mix(in srgb, ${sub.importance.color} 12%, transparent)`, color: sub.importance.color }}>
                                    {sub.importance.label}
                                  </span>
                                )}
                                <div className="w-20 h-1 rounded-full shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${subPct}%`, background: sub.color }} />
                                </div>
                                <span className="text-xs tabular-nums text-white/60 shrink-0 w-16 text-right">{fmtK(sub.amount)}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Normal two-column layout ── */}
        {range !== 'compare' && range !== 'tree' && (
        <div className="flex flex-col gap-5">

        {/* ── Donut row — week and month only ── */}
        {showDonuts && (range === 'week' || range === 'month') && <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <DonutPanel title={t('an.byCategory')}    data={categoryData}    />
          <DonutPanel title={t('an.bySubcategory')} data={subcategoryData} />
          <DonutPanel title={t('an.byImportance')}  data={importanceData}  />
          <DonutPanel title={t('an.incomeSource')}  subtitle={t('an.incomeOnly')} data={incomeSourceData} />
        </div>}

            {/* Daily/Monthly breakdown + per-type stats side by side */}
            <div className="flex flex-col md:flex-row gap-3 md:items-stretch" style={{ minHeight: 0 }}>

              {/* Line chart */}
              <div className="glass-card rounded-2xl p-5 flex flex-col flex-1" style={{ minHeight: 260 }}>
              <h2 className="text-sm font-semibold mb-0.5">{range === 'month' || range === 'week' ? t('an.dailyBreakdown') : t('an.monthlyBreakdown')}</h2>
              <p className="text-[11px] text-muted mb-4">{periodLabel} · {t('an.incomeVsExp')}</p>
              <div className="flex-1 min-h-0">
                {periodData.length === 0
                  ? <div className="h-full flex items-center"><p className="text-sm text-muted">{t('an.noDataShort')}</p></div>
                  : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={periodData}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={colors.income}  stopOpacity={0.2} />
                          <stop offset="95%" stopColor={colors.income}  stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={colors.expense} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={colors.expense} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip content={<FilteredTooltip nameFormatter={n => n === 'income' ? 'Income' : 'Expenses'} />} cursor={false} />
                      <Area type="monotone" dataKey="income"  stroke={colors.income}  fill="url(#incomeGrad)"  strokeWidth={1.5} dot={false} />
                      <Area type="monotone" dataKey="expense" stroke={colors.expense} fill="url(#expenseGrad)" strokeWidth={2}   dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              </div>

              {/* Per-type stat cards */}
              <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:w-72 md:shrink-0">
                {TRANSACTION_TYPES.map(({ value: type, label, color }) => {
                  const total = typeTotals[type] || 0
                  return (
                    <div key={type} className="glass-card rounded-2xl px-3 py-2 flex flex-col gap-0.5">
                      <p className="text-[11px] text-muted">{label}</p>
                      <p className="text-base font-bold tabular-nums leading-tight" style={{ color }}>{fmt(total, 0)}</p>
                    </div>
                  )
                })}
              </div>

            </div>



            {/* ── Budget & Target performance panel ── */}
            {(range === 'week' || range === 'month') && (periodBudgetStats.length > 0 || periodTargetStats.length > 0) && (() => {
              const effectiveTab = periodBudgetStats.length === 0 ? 'goals' : periodTargetStats.length === 0 ? 'limits' : periodPerfTab
              const items = effectiveTab === 'limits' ? periodBudgetStats : periodTargetStats
              return (
                <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold">Period Performance</h2>
                      <p className="text-[11px] text-muted mt-0.5">{periodLabel}</p>
                    </div>
                    {periodBudgetStats.length > 0 && periodTargetStats.length > 0 && (
                      <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
                        {[['limits', 'Budgets'], ['goals', 'Targets']].map(([v, l]) => (
                          <button key={v} onClick={() => setPeriodPerfTab(v)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                              effectiveTab === v ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'
                            }`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {effectiveTab === 'limits' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items.map(item => {
                        let label = '', color = FALLBACK_COLORS[0]
                        if (item.category_id || item.subcategory_id) {
                          const cat = categoryMap[item.category_id ?? item.subcategory_id]
                          label = cat?.name ?? '—'
                          color = midColor(cat?.color) ?? FALLBACK_COLORS[0]
                        } else if (item.importance) {
                          const imp = importanceWithColors.find(i => i.value === item.importance)
                          label = imp?.label ?? item.importance
                          color = imp?.color ?? FALLBACK_COLORS[0]
                        } else {
                          label = item.name ?? 'Limit'
                          color = colors.accent ?? FALLBACK_COLORS[0]
                        }
                        const pctClamped = Math.min(item.pct, 100)
                        const barColor   = item.isOver ? 'var(--color-alert)' : item.pct >= 80 ? 'var(--color-warning)' : 'var(--color-progress-bar)'
                        return (
                          <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                <span className="text-xs font-medium text-white/80 truncate">{label}</span>
                              </div>
                              <span className="text-[10px] font-semibold tabular-nums shrink-0 px-1.5 py-0.5 rounded-full"
                                style={{ background: `color-mix(in srgb, ${barColor} 15%, transparent)`, color: barColor }}>
                                {Math.round(item.pct)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pctClamped}%`, background: barColor }} />
                            </div>
                            <div className="flex items-center justify-between text-[10px] tabular-nums">
                              <span style={{ color: item.isOver ? 'var(--color-alert)' : 'rgba(255,255,255,0.35)' }}>
                                {item.isOver ? `+${fmt(item.spent - item.limit)} over` : `${fmt(item.limit - item.spent)} left`}
                              </span>
                              <span className="text-white/30">{fmt(item.spent)} / {fmt(item.limit)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {effectiveTab === 'goals' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items.map(item => {
                        let label = '', color = FALLBACK_COLORS[0]
                        if (item.category_id || item.subcategory_id) {
                          const cat = categoryMap[item.category_id ?? item.subcategory_id]
                          label = cat?.name ?? '—'; color = midColor(cat?.color) ?? FALLBACK_COLORS[0]
                        } else if (item.receiver_id) {
                          label = receiverMap[item.receiver_id]?.name ?? 'Merchant'; color = colors.accent ?? FALLBACK_COLORS[0]
                        } else if (item.importance) {
                          const imp = importanceWithColors.find(i => i.value === item.importance)
                          label = imp?.label ?? item.importance; color = imp?.color ?? FALLBACK_COLORS[0]
                        } else { label = 'Goal'; color = colors.accent ?? FALLBACK_COLORS[0] }
                        const barColor = item.isOver ? 'var(--color-alert)' : item.pct >= 80 ? 'var(--color-warning)' : 'var(--color-progress-bar)'
                        const pts = goalSparklines[item.id] ?? []
                        const chartMax = Math.max(...pts.map(p => p.spend), item.target) * 1.15 || 1
                        const W = 220, H = 44, PL = 2, PR = 2, PT = 4, PB = 12
                        const iW = W - PL - PR, iH = H - PT - PB
                        const xOf = i => PL + (pts.length > 1 ? (i / (pts.length - 1)) * iW : iW / 2)
                        const yOf = v => PT + (1 - Math.min(v, chartMax) / chartMax) * iH
                        const tY = yOf(item.target)
                        const linePts = pts.map((p, i) => ({ x: xOf(i), y: yOf(p.spend), ...p }))
                        const linePath = linePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        const areaPath = linePts.length > 1
                          ? `${linePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} L${linePts.at(-1).x.toFixed(1)},${(PT + iH).toFixed(1)} L${linePts[0].x.toFixed(1)},${(PT + iH).toFixed(1)} Z`
                          : ''
                        const gradId = `ag-${item.id}`
                        return (
                          <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                <span className="text-xs font-medium text-white/80 truncate">{label}</span>
                              </div>
                              <span className="text-[10px] font-semibold tabular-nums shrink-0 px-1.5 py-0.5 rounded-full"
                                style={{ background: `color-mix(in srgb, ${barColor} 15%, transparent)`, color: barColor }}>
                                {Math.round(item.pct)}%
                              </span>
                            </div>
                            {pts.length > 0 && (
                              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 44 }}>
                                <defs>
                                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--color-progress-bar)" stopOpacity="0.18" />
                                    <stop offset="100%" stopColor="var(--color-progress-bar)" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
                                <line x1={PL} y1={tY} x2={W - PR} y2={tY} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 2" />
                                {linePath && <path d={linePath} fill="none" stroke="var(--color-progress-bar)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />}
                                {linePts.map((p, i) => (
                                  <circle key={i} cx={p.x} cy={p.y} r={p.isCurrent ? 3 : 2}
                                    fill={p.spend > item.target ? 'var(--color-alert)' : 'var(--color-progress-bar)'}
                                    opacity={p.isCurrent ? 1 : 0.5} />
                                ))}
                                {linePts.map((p, i) => (i === 0 || p.isCurrent) && (
                                  <text key={`l-${i}`} x={p.x} y={H - 2} textAnchor="middle" fontSize="7" fill={p.isCurrent ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}>{p.label}</text>
                                ))}
                              </svg>
                            )}
                            <div className="flex items-center justify-between text-[10px] tabular-nums">
                              <span style={{ color: item.isOver ? 'var(--color-alert)' : 'rgba(255,255,255,0.35)' }}>
                                {item.isOver ? `+${fmt(item.spent - item.target)} over` : `${fmt(item.target - item.spent)} left`}
                              </span>
                              <span className="text-white/30">{fmt(item.spent)} / {fmt(item.target)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Projected spend + Financial Insights side by side */}
            {(showProjected || showInsights) && <div className="flex gap-5 items-stretch">
              {showProjected && projectedSpend && (
                <div className="flex-1 glass-card rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold">{t('an.projectedSpend')}</h2>
                    <span className="text-[11px] text-white/30">{t('an.dayOf', { day: projectedSpend.dayOfMonth, total: projectedSpend.daysInMonth })}</span>
                  </div>
                  <div className="flex items-end gap-8 mb-4">
                    <div>
                      <p className="text-[11px] text-white/40 mb-1">{t('an.spentSoFar')}</p>
                      <p className="text-xl font-bold tabular-nums" style={{ color: colors.expense }}>{fmt(projectedSpend.soFar)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/40 mb-1">{t('an.projTotal')}</p>
                      <p className="text-xl font-bold tabular-nums text-white/60">{fmt(projectedSpend.projected)}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[11px] text-white/40 mb-1">{t('an.dailyAvg')}</p>
                      <p className="text-sm font-semibold tabular-nums text-white/60">{fmt(projectedSpend.dailyAvg)}/day</p>
                    </div>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden gap-px mt-auto">
                    <div style={{ width: `${(projectedSpend.dayOfMonth / projectedSpend.daysInMonth) * 100}%`, background: 'var(--color-progress-bar)' }} className="rounded-l-full" />
                    <div style={{ flex: 1, background: 'var(--color-progress-bar)', opacity: 0.2 }} className="rounded-r-full" />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-white/25">{t('an.today')}</span>
                    <span className="text-[10px] text-white/25">{t('an.monthEnd')}</span>
                  </div>
                </div>
              )}
              {showInsights && insights.length > 0 && (
                <div className="flex-1 glass-card rounded-2xl p-5 flex flex-col gap-3 justify-center">
                  {insights.map((ins, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: ins.color + '22' }}>
                        <ins.Icon size={14} style={{ color: ins.color }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{ins.title}</p>
                        <p className="text-[11px] text-muted mt-0.5 leading-snug">{ins.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>}

        {/* ── Deep Dive — full width ── */}
            {showDeepDive && <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">

              {/* Header */}
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="text-sm font-semibold">{t('an.deepDive')}</h2>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">

                  {/* Dimension toggle — scrollable on mobile */}
                  <div className="overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-max">
                      {[
                        { id: 'category',    label: t('an.dimCategory')    },
                        { id: 'subcategory', label: t('an.dimSubcategory') },
                        { id: 'importance',  label: t('an.dimImportance')  },
                        { id: 'receiver',    label: 'Merchant'              },
                      ].map(d => (
                        <button
                          key={d.id}
                          onClick={() => { setDdDimension(d.id); setDdFilter(null); setDdClickedLabel(null) }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                            ddDimension === d.id ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart type + filter on one row */}
                  <div className="flex items-center gap-2">
                    {/* Chart type toggle */}
                    <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 shrink-0">
                      {['bar', 'line'].map(ct => (
                        <button key={ct} onClick={() => setDdChartType(ct)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors capitalize ${
                            ddChartType === ct ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/60'
                          }`}>
                          {ct}
                        </button>
                      ))}
                    </div>

                    {/* Filter select for active dimension */}
                    <div className="relative flex-1 md:flex-none">
                      <select
                        value={ddFilter ?? ''}
                        onChange={e => { setDdFilter(e.target.value || null); setDdClickedLabel(null) }}
                        className="w-full appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer"
                      >
                        <option value="">{ddDimension === 'category' ? t('an.allCats') : ddDimension === 'subcategory' ? t('an.allSubs') : ddDimension === 'receiver' ? 'All Merchants' : t('an.allImportance')}</option>
                        {ddOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Content */}
              <div className={isMobile ? 'flex flex-col gap-4' : 'flex gap-0'} style={isMobile ? undefined : { height: 380 }}>

                {/* Left panel — ranked breakdown OR transaction list when bar clicked */}
                <div className={isMobile ? 'flex flex-col gap-4' : 'flex flex-col shrink-0 pr-6 gap-4 overflow-hidden transition-all duration-200'} style={isMobile ? undefined : { width: ddClickedLabel ? 320 : 208 }}>

                  {ddClickedLabel ? (
                    <>
                      {/* Transaction list for clicked bar */}
                      <div className="flex items-start justify-between gap-2 shrink-0">
                        <div>
                          <p className="text-[10px] text-muted uppercase tracking-widest">{ddClickedLabel}</p>
                          <p className="text-2xl font-bold tabular-nums leading-tight mt-0.5" style={{ color: ddColor }}>
                            {fmt(ddBarTransactions.reduce((s, t) => s + Number(t.amount), 0))}
                          </p>
                          <p className="text-[10px] text-muted mt-0.5">{ddBarTransactions.length} transaction{ddBarTransactions.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => setDdClickedLabel(null)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors shrink-0 mt-0.5">
                          <X size={12} />
                        </button>
                      </div>
                      <div className="h-px bg-white/[0.07] shrink-0" />
                      <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto scrollbar-thin">
                        {ddBarTransactions.length === 0
                          ? <p className="text-xs text-muted py-4 text-center">No transactions</p>
                          : ddBarTransactions.map(tx => {
                            const cat = categoryMap[tx.subcategory_id] ?? categoryMap[tx.category_id]
                            const rec = receiverMap[tx.receiver_id]
                            return (
                              <div key={tx.id} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-white/[0.03]">
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs truncate text-white/80">{tx.description || rec?.name || '—'}</span>
                                  {cat && <span className="text-[10px] text-white/35 truncate">{cat.name}</span>}
                                </div>
                                <span className="text-xs tabular-nums font-semibold shrink-0" style={{ color: colors.expense }}>−{fmt(tx.amount)}</span>
                              </div>
                            )
                          })
                        }
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Total */}
                      <div>
                        <p className="text-[11px] text-muted uppercase tracking-widest mb-1">{t('an.totalSpent')}</p>
                        <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: ddColor }}>{fmt(ddTotal)}</p>
                        <div className="flex gap-4 mt-2">
                          <div>
                            <p className="text-[10px] text-muted">Avg TX</p>
                            <p className="text-sm font-semibold tabular-nums">{fmt(ddAvg, 0)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted">Count</p>
                            <p className="text-sm font-semibold tabular-nums">{ddFiltered.length}</p>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-white/[0.07]" />

                      {/* Ranked list */}
                      <div className="flex flex-col gap-2.5 flex-1 overflow-hidden">
                        {(() => {
                          const totalsMap = {}
                          ddFiltered.forEach(tx => {
                            let key, color
                            if (ddDimension === 'category') {
                              key   = tx.category_id ? (categoryMap[tx.category_id]?.name ?? 'Other') : null
                              color = midColor(categoryMap[tx.category_id]?.color)
                            } else if (ddDimension === 'subcategory') {
                              key   = tx.subcategory_id ? (categoryMap[tx.subcategory_id]?.name ?? 'Other') : null
                              color = midColor(categoryMap[tx.subcategory_id]?.color)
                            } else if (ddDimension === 'receiver') {
                              key   = tx.receiver_id ? (receiverMap[tx.receiver_id]?.name ?? 'Unknown') : null
                              color = tx.receiver_id ? getMerchantColor(receiverMap[tx.receiver_id]?.name ?? '') : null
                            } else {
                              const imp = catImportance[tx.subcategory_id] ?? catImportance[tx.category_id]
                              key   = imp ? (DEFAULT_IMPORTANCE.find(d => d.value === imp)?.label ?? imp) : null
                              color = imp ? (importanceColors[imp] ?? DEFAULT_IMPORTANCE.find(d => d.value === imp)?.color) : null
                            }
                            if (!key) return
                            if (!totalsMap[key]) totalsMap[key] = { value: 0, color }
                            totalsMap[key].value += Number(tx.amount)
                          })
                          const ranked = Object.entries(totalsMap).sort(([,a],[,b]) => b.value - a.value).slice(0, 7)
                          const maxVal = ranked[0]?.[1].value || 1
                          return ranked.map(([name, { value, color }]) => (
                            <div key={name} className="flex flex-col gap-0.5">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color ?? ddColor }} />
                                  <span className="text-[11px] truncate text-white/80">{name}</span>
                                </div>
                                <span className="text-[11px] font-semibold tabular-nums shrink-0">{fmtK(value)}</span>
                              </div>
                              <div className="h-0.5 w-full rounded-full bg-white/[0.06]">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / maxVal) * 100}%`, background: color ?? ddColor }} />
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    </>
                  )}

                </div>

                {/* Vertical separator — desktop only */}
                {!isMobile && <div className="w-px bg-white/[0.07] shrink-0 self-stretch" />}

                {/* Chart + legend */}
                <div className={isMobile ? 'flex flex-col gap-3' : 'flex-1 min-w-0 min-h-0 flex flex-col gap-3 pl-6'}>
                  <div className={isMobile ? '' : 'flex-1 min-h-0'} style={{ height: isMobile ? 220 : undefined }}>
                    {ddFiltered.length === 0
                      ? <div className="h-full flex items-center"><p className="text-sm text-muted">{t('an.noDataFilters')}</p></div>
                      : (
                      <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                        {ddChartType === 'line' ? (
                          <LineChart data={ddChartData.data} margin={{ top: 12, right: 0, bottom: 0, left: 0 }} style={{ cursor: 'pointer' }}
                            onClick={data => { if (data?.activeLabel != null) setDdClickedLabel(l => l === data.activeLabel ? null : data.activeLabel) }}>
                            <CartesianGrid vertical={false} stroke={GRID} />
                            <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={range === 'month' ? 4 : 0} />
                            <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                            <Tooltip content={<FilteredTooltip />} cursor={false} />
                            {ddChartData.series.map(s => (
                              <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={false}
                                strokeOpacity={ddClickedLabel && ddChartData.data.find(d => d.label === ddClickedLabel) ? 0.35 : 1} />
                            ))}
                            {ddClickedLabel && <ReferenceLine x={ddClickedLabel} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="3 3" />}
                          </LineChart>
                        ) : (
                          <BarChart data={ddChartData.data} barCategoryGap="30%" margin={{ top: 12, right: 0, bottom: 0, left: 0 }} style={{ cursor: 'pointer' }}
                            onClick={data => { if (data?.activeLabel != null) setDdClickedLabel(l => l === data.activeLabel ? null : data.activeLabel) }}>
                            <CartesianGrid vertical={false} stroke={GRID} />
                            <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={range === 'month' ? 4 : 0} />
                            <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                            <Tooltip content={<FilteredTooltip />} cursor={false} />
                            {ddChartData.series.map((s, i) => (
                              <Bar key={s.name} dataKey={s.name} stackId="stack" fill={s.color} maxBarSize={28}
                                shape={<StackedBarShape />}
                                radius={i === ddChartData.series.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                            ))}
                            {ddClickedLabel && <ReferenceLine x={ddClickedLabel} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="3 3" />}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    )}
                  </div>
                  {/* Legend — fixed height so chart never jumps */}
                  <div className="h-5 flex items-center gap-x-4 overflow-hidden shrink-0">
                    {ddChartData.series.length > 1 && ddChartData.series.map(s => (
                      <div key={s.name} className="flex items-center gap-1.5 shrink-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-[11px] text-white/50 whitespace-nowrap">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>}

        {/* ── BOTTOM: secondary sidebar + spending habit ── */}
        <div className="flex flex-col md:flex-row gap-5 items-stretch">

          {/* Bottom left sidebar */}
          <div className="w-full md:w-80 md:shrink-0 flex flex-col gap-4">



            {/* Week summary — month view only */}
            {showWeekSummary && (range === 'month' || range === 'week') && weeklyData.length > 0 && (() => {
              const totalExp = weeklyData.reduce((s, w) => s + w.expenses, 0)
              const totalInc = weeklyData.reduce((s, w) => s + w.income, 0)
              const totalNet = totalInc - totalExp
              const avgExp   = weeklyData.length > 0 ? totalExp / weeklyData.length : 0
              return (
                <div className="glass-card rounded-2xl p-5 flex-1 flex flex-col">
                  <h2 className="text-sm font-semibold mb-4">{t('an.weekSummary')}</h2>
                  <div className="flex flex-col gap-0 flex-1">
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-2 pb-2 border-b border-white/[0.06] mb-2">
                      {[t('an.week'), t('an.expenses'), 'vs prev', t('an.net')].map(h => (
                        <span key={h} className="text-[10px] text-muted uppercase tracking-wider">{h}</span>
                      ))}
                    </div>
                    {/* Rows */}
                    {weeklyData.map((w, i) => {
                      const prev = weeklyData[i - 1]
                      const delta = prev && prev.expenses > 0 ? ((w.expenses - prev.expenses) / prev.expenses) * 100 : null
                      return (
                        <div key={w.label} className="grid grid-cols-4 gap-2 py-2 border-b border-white/[0.04] last:border-0">
                          <span className="text-xs font-semibold text-white">{w.label}</span>
                          <span className="text-xs tabular-nums" style={{ color: colors.expense }}>{w.expenses > 0 ? fmt(w.expenses) : '—'}</span>
                          <span className="text-xs tabular-nums font-medium" style={{ color: delta === null ? 'transparent' : delta > 0 ? colors.expense : colors.income }}>
                            {delta !== null ? `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(0)}%` : '—'}
                          </span>
                          <span className="text-xs tabular-nums font-medium" style={{ color: w.net >= 0 ? colors.income : colors.expense }}>
                            {w.net !== 0 ? (w.net > 0 ? '+' : '') + fmt(w.net) : '—'}
                          </span>
                        </div>
                      )
                    })}
                    {/* Totals pinned to bottom */}
                    <div className="mt-auto pt-3 border-t border-white/[0.08] grid grid-cols-4 gap-2">
                      <span className="text-[10px] text-muted uppercase tracking-wider">Total</span>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: colors.expense }}>{fmt(totalExp)}</span>
                      <span className="text-[10px] text-muted tabular-nums">avg {fmt(avgExp, 0)}/wk</span>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: totalNet >= 0 ? colors.income : colors.expense }}>
                        {totalNet > 0 ? '+' : ''}{fmt(totalNet)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}


          </div>

          {/* Bottom right column */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Spending Habit — monthly trend (all time, up to 18 months) */}
            {showSpendingHabit && <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">{t('an.spendingHabit')}</h2>
                  <p className="text-[11px] text-muted mt-0.5">Monthly · all time · up to 18 months</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {habitDimension === 'total' && spendingTrendData.trendPct !== null && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums"
                      style={{
                        background: (spendingTrendData.trendPct >= 0 ? colors.expense : colors.income) + '22',
                        color: spendingTrendData.trendPct >= 0 ? colors.expense : colors.income,
                      }}>
                      {spendingTrendData.trendPct >= 0 ? '↑' : '↓'} {Math.abs(spendingTrendData.trendPct).toFixed(0)}%
                    </span>
                  )}
                  {/* Chart type toggle — only for non-total dimensions */}
                  {habitDimension !== 'total' && (
                    <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
                      {['bar', 'line'].map(t => (
                        <button key={t} onClick={() => handleHabitChartType(t)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors capitalize ${
                            habitChartType === t ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/60'
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Dimension toggle */}
                  <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-1">
                    {[
                      { id: 'total',       label: 'Total'      },
                      { id: 'category',    label: 'Category'   },
                      { id: 'subcategory', label: 'Sub'        },
                      { id: 'receiver',    label: 'Merchant'   },
                    ].map(d => (
                      <button key={d.id}
                        onClick={() => setHabitDimension(d.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          habitDimension === d.id ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {spendingTrendData.data.length === 0
                ? <p className="text-sm text-muted">No expense data</p>
                : habitDimension === 'total' ? (
                <>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spendingTrendData.data} barCategoryGap="20%" margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} stroke={GRID} />
                        <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={spendingTrendData.data.length > 12 ? 2 : 1} />
                        <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                        <Tooltip content={<FilteredTooltip nameFormatter={() => 'Spent'} />} cursor={false} />
                        <ReferenceLine y={spendingTrendData.avg} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" strokeWidth={1} />
                        <Bar dataKey="total" radius={[3, 3, 0, 0]} maxBarSize={32}>
                          {spendingTrendData.data.map((d, i) => (
                            <Cell key={i} fill={d.total > spendingTrendData.avg ? colors.expense : colors.income} opacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: colors.expense }} />
                      <span className="text-[11px] text-muted">Above avg</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: colors.income }} />
                      <span className="text-[11px] text-muted">Below avg ({fmtK(spendingTrendData.avg)}/mo)</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ height: 280 }}>
                    {habitLineData.series.length === 0
                      ? <div className="h-full flex items-center"><p className="text-sm text-muted">{t('an.noDataShort')}</p></div>
                      : (
                      <ResponsiveContainer width="100%" height="100%">
                        {habitChartType === 'bar' ? (
                          <BarChart data={habitLineData.data} barCategoryGap="20%" maxBarSize={28}>
                            <CartesianGrid vertical={false} stroke={GRID} />
                            <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={habitLineData.data.length > 12 ? 2 : 1} />
                            <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                            <Tooltip content={<FilteredTooltip />} cursor={false} />
                            {habitLineData.series.map((s, i) => (
                              <Bar key={s.name} dataKey={s.name} stackId="a"
                                fill={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                                shape={<StackedBarShape />} />
                            ))}
                          </BarChart>
                        ) : (
                          <LineChart data={habitLineData.data}>
                            <CartesianGrid vertical={false} stroke={GRID} />
                            <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={habitLineData.data.length > 12 ? 2 : 1} />
                            <YAxis tickFormatter={fmtK} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                            <Tooltip content={<FilteredTooltip />} cursor={false} />
                            {habitLineData.series.map((s, i) => (
                              <Line key={s.name} type="monotone" dataKey={s.name}
                                stroke={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                                strokeWidth={2} dot={false} />
                            ))}
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {habitLineData.series.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }} />
                        <span className="text-[11px] text-white/50 truncate max-w-[120px]">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>}

          </div>

        </div>
        </div>
        )}

      </div>
    </div>
  )
}
