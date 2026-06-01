import { useState, useMemo } from 'react'
import {
  Plus, RefreshCw, TrendingUp, TrendingDown, AlertCircle,
  ChevronDown, ChevronRight, Clock, Pencil, Trash2,
  BarChart2, List, Info, Eye, EyeOff, SlidersHorizontal,
  Search, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/dashboard/Navbar'
import { usePreferences } from '../context/UserPreferencesContext'
import { useSharedData } from '../context/SharedDataContext'
import { useUIPrefs } from '../context/UIPrefContext'
import { useTransactionModal } from '../context/TransactionModalContext'
import { useCards } from '../hooks/useCards'
import { fetchLivePrice } from '../lib/yahooFinance'
import { Skeleton, SkeletonRow } from '../components/shared/Skeleton'
import QuickSellModal    from '../components/portfolio/QuickSellModal'
import QuickBuyModal     from '../components/portfolio/QuickBuyModal'
import TradeDetailModal  from '../components/portfolio/TradeDetailModal'

const fmtPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
const gc     = (n) => n == null ? 'rgba(255,255,255,0.25)' : n >= 0 ? 'var(--type-income)' : 'var(--type-expense)'

function TickerMarquee({ positions, fmt }) {
  const items = positions.filter(p => p.livePrice != null)
  if (!items.length) return null
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden mb-5"
      style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <div className="animate-ticker flex gap-8 w-max">
        {doubled.map((p, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0 select-none">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-xs font-bold tracking-wider" style={{ color: p.color }}>{p.ticker}</span>
            <span className="text-xs tabular-nums text-white/70">{fmt(p.livePrice)}</span>
            {p.unrealizedPct != null && (
              <span className="text-xs tabular-nums font-medium" style={{ color: gc(p.unrealizedPct) }}>
                {fmtPct(p.unrealizedPct)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function fmtDays(d) {
  if (d == null) return '—'
  if (d === 0) return '< 1d'
  if (d < 7) return `${d}d`
  const w = Math.floor(d / 7), r = d % 7
  if (d < 30) return r > 0 ? `${w}w ${r}d` : `${w}w`
  return `~${Math.floor(d / 30)}mo`
}

function computeAvgHoldDays(sells, allTxs, label) {
  const days = sells.map(sell => {
    const ticker = sell.ticker?.toUpperCase()
    const buys = allTxs.filter(tx =>
      tx.ticker?.toUpperCase() === ticker &&
      (label === null || tx.label === label) &&
      (tx.direction ?? 'buy') === 'buy' &&
      tx.date <= sell.date
    )
    if (!buys.length) return null
    const first = buys.reduce((a, b) => a.date <= b.date ? a : b)
    return Math.round((new Date(sell.date + 'T00:00:00') - new Date(first.date + 'T00:00:00')) / 86400000)
  }).filter(d => d != null && d >= 0)
  return days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null
}

function PnlChip({ value, pct, fmt }) {
  if (value == null) return <span className="text-white/20 text-xs">—</span>
  const color = gc(value)
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md"
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
      {value >= 0 ? '+' : ''}{fmt(value)}
      {pct != null && <span className="opacity-60 text-[10px]">({fmtPct(pct)})</span>}
    </span>
  )
}

function InfoTip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info size={10} className="text-white/25 hover:text-white/50 cursor-help transition-colors ml-1" />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[var(--color-dash-card)] border border-white/15 rounded-xl px-3 py-2.5 text-[11px] text-white/55 leading-relaxed shadow-xl z-50 pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/10" />
        </span>
      )}
    </span>
  )
}

function TypeBadge({ direction }) {
  const isBuy = (direction ?? 'buy') === 'buy'
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest shrink-0"
      style={{
        background: isBuy
          ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
          : 'color-mix(in srgb, var(--type-expense) 18%, transparent)',
        color: isBuy ? 'var(--color-accent)' : 'var(--type-expense)',
      }}>
      {isBuy ? 'BUY' : 'SELL'}
    </span>
  )
}

function timeAgo(isoStr) {
  if (!isoStr) return null
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function SortTh({ label, col, sort, onSort, className = '', align = 'right' }) {
  const active = sort.col === col
  return (
    <th
      className={`text-[10px] uppercase tracking-widest text-muted font-medium py-3 cursor-pointer select-none group/th transition-colors hover:text-white/60 ${className}`}
      onClick={() => onSort(col)}>
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end w-full' : ''}`}>
        {label}
        {active
          ? sort.dir === 'asc'
            ? <ArrowUp size={9} className="opacity-60" />
            : <ArrowDown size={9} className="opacity-60" />
          : <ArrowUpDown size={9} className="opacity-20 group-hover/th:opacity-40 transition-opacity" />}
      </span>
    </th>
  )
}

function computePortfolio(investTxs, cachedPrices) {
  const grouped = {}
  const closedTrades = []

  const sorted = [...investTxs].sort((a, b) =>
    a.date.localeCompare(b.date) || (a.created_at ?? '').localeCompare(b.created_at ?? '')
  )

  for (const tx of sorted) {
    const sym = tx.ticker.toUpperCase()
    if (!grouped[sym]) grouped[sym] = { qty: 0, cost: 0, txs: [] }
    const g   = grouped[sym]
    const qty = Number(tx.quantity ?? 0)
    const ppu = Number(tx.price_per_unit ?? 0)
    const dir = tx.direction ?? 'buy'

    if (dir === 'sell') {
      const avgCostAtSell = g.qty > 0 ? g.cost / g.qty : 0
      const realizedPnl   = (ppu - avgCostAtSell) * qty
      g.qty  = Math.max(0, g.qty - qty)
      g.cost = Math.max(0, g.cost - avgCostAtSell * qty)
      const enriched = { ...tx, direction: 'sell', realizedPnl, avgCostAtSell }
      closedTrades.push(enriched)
      g.txs.push(enriched)
    } else {
      g.qty  += qty
      g.cost += qty * ppu
      g.txs.push({ ...tx, direction: 'buy' })
    }
  }

  const positions = Object.entries(grouped).map(([ticker, g]) => {
    const cached       = cachedPrices[ticker]
    const livePrice    = cached?.price ?? null
    const avgCost      = g.qty > 0.0001 ? g.cost / g.qty : 0
    const currentVal   = livePrice != null && g.qty > 0.0001 ? livePrice * g.qty : null
    const unrealizedPnl = currentVal != null ? currentVal - g.cost : null
    const unrealizedPct = unrealizedPnl != null && g.cost > 0 ? (unrealizedPnl / g.cost) * 100 : null
    const totalFees    = g.txs.filter(t => t.direction === 'buy').reduce((s, t) => {
      const pure = Number(t.quantity ?? 0) * Number(t.price_per_unit ?? 0)
      return s + Math.max(Number(t.amount) - pure, 0)
    }, 0)
    const realizedPnl = g.txs.filter(t => t.direction === 'sell').reduce((s, t) => s + (t.realizedPnl ?? 0), 0)

    return {
      ticker,
      name: cached?.name ?? null,
      updatedAt: cached?.updatedAt ?? null,
      qty: g.qty,
      cost: g.cost,
      avgCost,
      totalFees,
      livePrice,
      currentVal,
      unrealizedPnl,
      unrealizedPct,
      realizedPnl,
      transactions: g.txs.sort((a, b) => b.date.localeCompare(a.date)),
    }
  }).filter(p => p.qty > 0.0001 || p.transactions.length > 0)

  return { positions, closedTrades }
}

export default function Portfolio() {
  const { user }                    = useAuth()
  const { fmt, t }                  = usePreferences()
  const { allTransactions, loaded } = useSharedData()
  const { prefs, setPref }          = useUIPrefs()
  const { cards }                   = useCards()
  const rawTradeLabels = prefs['invest_labels'] ?? [{ name: 'Day Trade', color: '#60a5fa' }, { name: 'Swing Trade', color: '#a78bfa' }, { name: 'Long Term', color: '#34d399' }]
  const tradeLabelMap  = Object.fromEntries(rawTradeLabels.map(l => typeof l === 'string' ? [l, '#a78bfa'] : [l.name, l.color]))
  const tradeLabels    = rawTradeLabels.map(l => typeof l === 'string' ? { name: l, color: '#a78bfa' } : l)
  const { openTransactionModal } = useTransactionModal()

  const [currentDate,     setCurrentDate]     = useState(new Date())
  const [refreshing,      setRefreshing]      = useState(false)
  const [failedTickers,   setFailedTickers]   = useState([])
  const [expanded,        setExpanded]        = useState({})
  const [tab,             setTab]             = useState('positions')
  const [labelTab,        setLabelTab]        = useState('all')
  const [showTabSettings, setShowTabSettings] = useState(false)
  const [sellTarget,      setSellTarget]      = useState(null)
  const [showBuyModal,    setShowBuyModal]    = useState(false)
  const [detailTrade,     setDetailTrade]     = useState(null)
  const [posSort,         setPosSort]         = useState({ col: null, dir: 'asc' })
  const [logSort,         setLogSort]         = useState({ col: 'date', dir: 'desc' })
  const [tradeSearch,     setTradeSearch]     = useState('')
  const [showClosed,      setShowClosed]      = useState(false)
  const [portfolioView,   setPortfolioView]   = useState('overview')

  const hiddenTabs = new Set(prefs.hidden_label_tabs ?? [])
  function toggleTabVisibility(name) {
    const next = new Set(hiddenTabs)
    if (next.has(name)) next.delete(name); else next.add(name)
    if (labelTab === name) { setLabelTab('all'); setExpanded({}) }
    setPref('hidden_label_tabs', [...next])
  }

  function handlePosSort(col) {
    setPosSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }
  function handleLogSort(col) {
    setLogSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const cachedPrices = prefs.portfolio_prices ?? {}

  const allInvestTxs = useMemo(() =>
    allTransactions.filter(tx => tx.type === 'invest' && tx.ticker),
    [allTransactions]
  )

  const investTxs = useMemo(() =>
    labelTab === 'all' ? allInvestTxs : allInvestTxs.filter(tx => tx.label === labelTab),
    [allInvestTxs, labelTab]
  )

  const { positions, closedTrades } = useMemo(() =>
    computePortfolio(investTxs, cachedPrices),
    [investTxs, cachedPrices]
  )

  const closedPnlMap = useMemo(() =>
    Object.fromEntries(closedTrades.map(t => [t.id, t.realizedPnl])),
    [closedTrades]
  )

  const allTrades = useMemo(() =>
    [...investTxs].sort((a, b) => b.date.localeCompare(a.date) || (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [investTxs]
  )

  const openPositions = positions.filter(p => p.qty > 0.0001)

  const sortedOpenPositions = useMemo(() => {
    if (!posSort.col) return openPositions
    return [...openPositions].sort((a, b) => {
      const d = posSort.dir === 'asc' ? 1 : -1
      switch (posSort.col) {
        case 'ticker':        return a.ticker.localeCompare(b.ticker) * d
        case 'qty':           return (a.qty - b.qty) * d
        case 'avgCost':       return (a.avgCost - b.avgCost) * d
        case 'livePrice':     return ((a.livePrice ?? -Infinity) - (b.livePrice ?? -Infinity)) * d
        case 'cost':          return (a.cost - b.cost) * d
        case 'currentVal':    return ((a.currentVal ?? -Infinity) - (b.currentVal ?? -Infinity)) * d
        case 'unrealizedPnl': return ((a.unrealizedPnl ?? -Infinity) - (b.unrealizedPnl ?? -Infinity)) * d
        case 'realizedPnl':   return (a.realizedPnl - b.realizedPnl) * d
        default: return 0
      }
    })
  }, [openPositions, posSort])

  const closedPositions = useMemo(() =>
    positions
      .filter(p => p.qty <= 0.0001 && p.transactions.length > 0)
      .map(p => {
        const buys  = p.transactions.filter(t => (t.direction ?? 'buy') === 'buy')
        const sells = p.transactions.filter(t => t.direction === 'sell')
        const entryDate = buys.length  ? buys.reduce((a, b) => a.date <= b.date ? a : b).date  : null
        const exitDate  = sells.length ? sells.reduce((a, b) => a.date >= b.date ? a : b).date : null
        const holdingDays = entryDate && exitDate
          ? Math.round((new Date(exitDate + 'T00:00:00') - new Date(entryDate + 'T00:00:00')) / 86400000)
          : null
        return { ...p, entryDate, exitDate, holdingDays }
      }),
    [positions]
  )

  const filteredTrades = useMemo(() => {
    let trades = allTrades
    if (tradeSearch.trim()) {
      const q = tradeSearch.trim().toLowerCase()
      trades = trades.filter(tx => tx.ticker?.toLowerCase().includes(q))
    }
    if (!logSort.col) return trades
    return [...trades].sort((a, b) => {
      const d    = logSort.dir === 'asc' ? 1 : -1
      const totA = Number(a.quantity ?? 0) * Number(a.price_per_unit ?? 0)
      const totB = Number(b.quantity ?? 0) * Number(b.price_per_unit ?? 0)
      switch (logSort.col) {
        case 'date':   return (a.date.localeCompare(b.date) || (a.created_at ?? '').localeCompare(b.created_at ?? '')) * d
        case 'ticker': return (a.ticker ?? '').localeCompare(b.ticker ?? '') * d
        case 'qty':    return (Number(a.quantity ?? 0) - Number(b.quantity ?? 0)) * d
        case 'price':  return (Number(a.price_per_unit ?? 0) - Number(b.price_per_unit ?? 0)) * d
        case 'total':  return (totA - totB) * d
        case 'pnl': {
          const ap = (a.direction ?? 'buy') === 'sell' ? (closedPnlMap[a.id] ?? -Infinity) : -Infinity
          const bp = (b.direction ?? 'buy') === 'sell' ? (closedPnlMap[b.id] ?? -Infinity) : -Infinity
          return (ap - bp) * d
        }
        default: return 0
      }
    })
  }, [allTrades, tradeSearch, logSort, closedPnlMap])

  async function deleteTx(id) {
    if (!window.confirm('Delete this trade?')) return
    await supabase.from('transactions').update({ is_deleted: true }).eq('id', id)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
  }

  async function refresh() {
    if (!user?.id) return
    setRefreshing(true); setFailedTickers([])
    const tickers = [...new Set(allInvestTxs.map(tx => tx.ticker.toUpperCase()))]
    if (!tickers.length) { setRefreshing(false); return }
    const results = await Promise.all(tickers.map(async ticker => {
      const r = await fetchLivePrice(ticker)
      return { ticker, price: r?.price ?? null, name: r?.name ?? null }
    }))
    setFailedTickers(results.filter(r => r.price == null).map(r => r.ticker))
    const next = { ...cachedPrices }
    const now  = new Date().toISOString()
    for (const { ticker, price, name } of results) {
      if (price != null) next[ticker] = { price, name, updatedAt: now }
    }
    setPref('portfolio_prices', next)
    setRefreshing(false)
  }

  const totalInvested   = openPositions.reduce((s, p) => s + p.cost, 0)
  const hasLive         = openPositions.some(p => p.currentVal != null)
  const totalCurrentVal = openPositions.filter(p => p.currentVal != null).reduce((s, p) => s + p.currentVal, 0)
  const totalUnrealized = openPositions.filter(p => p.unrealizedPnl != null).reduce((s, p) => s + p.unrealizedPnl, 0)
  const totalRealized   = positions.reduce((s, p) => s + p.realizedPnl, 0)
  const winCount        = closedTrades.filter(t => (t.realizedPnl ?? 0) > 0).length
  const winRate         = closedTrades.length > 0 ? Math.round((winCount / closedTrades.length) * 100) : null

  const lastUpdated = useMemo(() => {
    const times = Object.values(cachedPrices).map(p => p.updatedAt).filter(Boolean)
    return times.length ? times.reduce((a, b) => a > b ? a : b) : null
  }, [cachedPrices])

  const thSel = 'text-[10px] uppercase tracking-widest text-muted font-medium py-3'
  const customTickerColors = prefs.ticker_colors ?? {}
  const tickerColorMap = useMemo(() =>
    Object.fromEntries(openPositions.map((p, i) => [
      p.ticker,
      customTickerColors[p.ticker] ?? `hsl(${(i * 67) % 360}, 60%, 58%)`,
    ])),
    [openPositions, customTickerColors]
  )

  return (
    <>
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar
        currentDate={currentDate}
        onPrev={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
      />

      <div id="page-content" className="py-6 px-4 md:px-8 lg:px-16 pb-24 lg:pb-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{t('port.title')}</h1>
            <p className="text-muted text-sm mt-1">{t('port.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lastUpdated && !refreshing && (
              <span className="flex items-center gap-1 text-xs text-muted"><Clock size={11} />{timeAgo(lastUpdated)}</span>
            )}
            <button onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm hover:bg-accent/25 transition-colors">
              <Plus size={13} /> Buy
            </button>
            <button onClick={() => openTransactionModal({ type: 'transfer' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors">
              Fund broker
            </button>
            <button onClick={refresh} disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dash-card border border-border text-sm hover:border-accent transition-colors disabled:opacity-40">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? t('port.refreshing') : t('port.refresh')}
            </button>
          </div>
        </div>

        {failedTickers.length > 0 && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
            <AlertCircle size={13} />
            Could not fetch prices for: <span className="font-mono font-semibold">{failedTickers.join(', ')}</span>
            <span className="opacity-60 ml-1">— check the ticker symbol matches Yahoo Finance format (e.g. VWCE.AS)</span>
          </div>
        )}

        {!loaded && (
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            <div className="flex flex-col gap-2 mt-2">{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
          </div>
        )}

        {loaded && allInvestTxs.length === 0 && (
          <div className="glass-card rounded-2xl flex flex-col items-center justify-center gap-4 py-20 text-center">
            <TrendingUp size={36} className="text-white/15" />
            <div>
              <p className="text-white/50 text-sm">No trades logged yet.</p>
              <p className="text-white/30 text-xs mt-1">Click <strong className="text-white/50">Buy</strong> to log your first trade.</p>
            </div>
            <button onClick={() => openTransactionModal({ type: 'invest' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm hover:bg-accent/25 transition-colors">
              <Plus size={13} /> Log Trade
            </button>
          </div>
        )}

        {loaded && allInvestTxs.length > 0 && <>

          {/* Ticker marquee */}
          <TickerMarquee
            positions={openPositions.map(p => ({ ...p, color: tickerColorMap[p.ticker] }))}
            fmt={fmt}
          />

          {/* Label subtabs */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
              <button type="button" onClick={() => { setLabelTab('all'); setExpanded({}) }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: labelTab === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color:      labelTab === 'all' ? '#fff' : 'rgba(255,255,255,0.4)',
                }}>
                All
              </button>
              {tradeLabels.filter(({ name }) => !hiddenTabs.has(name)).map(({ name, color }) => (
                <button key={name} type="button" onClick={() => { setLabelTab(name); setExpanded({}) }}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background:  labelTab === name ? `color-mix(in srgb, ${color} 18%, transparent)` : 'transparent',
                    color:       labelTab === name ? color : 'rgba(255,255,255,0.4)',
                  }}>
                  {name}
                </button>
              ))}
            </div>
            <div className="relative">
              <button type="button" onClick={() => setShowTabSettings(v => !v)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/8"
                style={{ color: showTabSettings ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }}
                title="Show / hide subtabs">
                <SlidersHorizontal size={13} />
              </button>
              {showTabSettings && (
                <div className="absolute top-full left-0 mt-1 glass-popup border border-white/10 rounded-xl overflow-hidden shadow-xl z-20 min-w-[160px]"
                  onMouseLeave={() => setShowTabSettings(false)}>
                  <p className="text-[10px] text-muted uppercase tracking-widest px-3 pt-2.5 pb-1">Subtab visibility</p>
                  {tradeLabels.map(({ name, color }) => {
                    const hidden = hiddenTabs.has(name)
                    return (
                      <button key={name} type="button" onClick={() => toggleTabVisibility(name)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                        <span className="flex-1 text-left text-xs" style={{ color: hidden ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)' }}>
                          {name}
                        </span>
                        {hidden ? <EyeOff size={12} className="text-white/25 shrink-0" /> : <Eye size={12} className="text-white/50 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Portfolio hero — always visible */}
          {(() => {
            const heroTotal = openPositions.reduce((s, p) => s + (p.currentVal ?? p.cost), 0)
            return (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-5">
                {/* Left: value + allocation */}
                <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 lg:col-span-2">
                  <div>
                    <span className="text-[10px] text-muted uppercase tracking-widest">Portfolio value</span>
                    <p className="text-3xl font-bold tabular-nums mt-1">
                      {hasLive ? fmt(totalCurrentVal) : fmt(totalInvested)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {hasLive && totalUnrealized !== 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md"
                          style={{ background: `color-mix(in srgb, ${gc(totalUnrealized)} 16%, transparent)`, color: gc(totalUnrealized) }}>
                          {totalUnrealized >= 0 ? '+' : ''}{fmt(totalUnrealized)}
                          <span className="opacity-60 text-[10px]">({fmtPct((totalUnrealized / totalInvested) * 100)})</span>
                        </span>
                      )}
                      {!hasLive && <span className="text-xs text-white/30">Refresh for live value</span>}
                    </div>
                  </div>
                  {openPositions.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] text-muted uppercase tracking-widest">Where your money is invested</span>
                      <div className="flex rounded-full overflow-hidden h-2.5 gap-px">
                        {openPositions.map(p => {
                          const pct = heroTotal > 0 ? ((p.currentVal ?? p.cost) / heroTotal) * 100 : 0
                          return <div key={p.ticker} style={{ width: `${pct}%`, background: tickerColorMap[p.ticker], minWidth: pct > 1 ? 4 : 0 }} />
                        })}
                      </div>
                      <div className="flex flex-col gap-2">
                        {openPositions.map(p => {
                          const color = tickerColorMap[p.ticker]
                          const val   = p.currentVal ?? p.cost
                          const pct   = heroTotal > 0 ? (val / heroTotal * 100).toFixed(0) : 0
                          return (
                            <div key={p.ticker} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                <span className="text-sm font-medium" style={{ color }}>{p.ticker}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
                                  {pct}%
                                </span>
                              </div>
                              <span className="text-sm tabular-nums text-white/70">{fmt(val)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: positions overview table */}
                <div className="glass-card rounded-2xl overflow-hidden lg:col-span-3">
                  <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
                    <span className="text-[10px] text-muted uppercase tracking-widest">Positions</span>
                    <span className="text-[10px] text-muted">{positions.length} total</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {[...openPositions, ...closedPositions].map(p => {
                      const color  = tickerColorMap[p.ticker] ?? 'rgba(255,255,255,0.3)'
                      const isOpen = p.qty > 0.0001
                      const pnl    = isOpen ? p.unrealizedPnl : p.realizedPnl
                      const pnlPct = isOpen ? p.unrealizedPct : (p.realizedPnl != null && p.cost > 0 ? (p.realizedPnl / p.cost) * 100 : null)
                      const value  = isOpen ? (p.currentVal ?? p.cost) : null
                      return (
                        <div key={p.ticker} className="flex items-center gap-3 px-4 py-3"
                          style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}>
                            {p.ticker.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold" style={{ color }}>{p.ticker}</span>
                              {!isOpen && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/35 uppercase tracking-wider">Closed</span>}
                            </div>
                            {p.name && <p className="text-[10px] text-white/35 truncate">{p.name}</p>}
                          </div>
                          <div className="hidden sm:flex items-center gap-5 shrink-0 text-right">
                            {value != null && <span className="text-sm font-semibold tabular-nums text-white">{fmt(value)}</span>}
                            {isOpen && p.livePrice != null && <span className="text-xs tabular-nums text-white/50">{fmt(p.livePrice)}</span>}
                          </div>
                          <div className="shrink-0">
                            {pnl != null ? <PnlChip value={pnl} pct={pnlPct} fmt={fmt} /> : <span className="text-white/20 text-xs">—</span>}
                          </div>
                        </div>
                      )
                    })}
                    {positions.length === 0 && <p className="text-center text-muted text-xs py-8">No positions yet.</p>}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── removed stats+summary grid (hero covers this) ── */}
          {false && (() => {
            const isAll         = labelTab === 'all'
            const labelTrades   = isAll ? allInvestTxs : allInvestTxs.filter(tx => tx.label === labelTab)
            const labelSells    = isAll ? closedTrades  : closedTrades.filter(t => t.label === labelTab)
            const hasSummary    = labelTrades.length > 0
            const labelWins     = labelSells.filter(t => (t.realizedPnl ?? 0) > 0).length
            const labelWinRate  = labelSells.length > 0 ? Math.round((labelWins / labelSells.length) * 100) : null
            const labelRealized = labelSells.reduce((s, t) => s + (t.realizedPnl ?? 0), 0)
            const avgPnl        = labelSells.length > 0 ? labelRealized / labelSells.length : null
            const best          = labelSells.length > 0 ? Math.max(...labelSells.map(t => t.realizedPnl ?? 0)) : null
            const worst         = labelSells.length > 0 ? Math.min(...labelSells.map(t => t.realizedPnl ?? 0)) : null
            const avgHold       = computeAvgHoldDays(labelSells, allInvestTxs, isAll ? null : labelTab)
            const lc            = isAll ? 'var(--color-accent)' : (tradeLabels.find(l => l.name === labelTab)?.color ?? 'var(--color-accent)')
            const gc2           = n => n >= 0 ? 'var(--type-income)' : 'var(--type-expense)'

            const statCards = <>
              <div className="glass-card rounded-xl px-3.5 py-3 flex flex-col gap-0.5">
                <span className="text-[10px] text-muted uppercase tracking-widest">Cost Basis</span>
                <span className="text-lg font-bold tabular-nums">{fmt(totalInvested)}</span>
                <span className="text-[10px] text-muted">{openPositions.length} open position{openPositions.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="glass-card rounded-xl px-3.5 py-3 flex flex-col gap-0.5">
                <span className="text-[10px] text-muted uppercase tracking-widest">Market Value</span>
                <span className="text-lg font-bold tabular-nums">{hasLive ? fmt(totalCurrentVal) : '—'}</span>
                <span className="text-[10px] text-muted">{lastUpdated ? timeAgo(lastUpdated) : 'Refresh prices'}</span>
              </div>
              <div className="glass-card rounded-xl px-3.5 py-3 flex flex-col gap-0.5"
                style={hasLive && totalUnrealized !== 0 ? { background: `color-mix(in srgb, ${gc(totalUnrealized)} 9%, var(--color-dash-card, rgba(255,255,255,0.03)))` } : {}}>
                <span className="text-[10px] text-muted uppercase tracking-widest flex items-center">
                  Unrealized P&L
                  <InfoTip text="Profit or loss on positions you still hold. Calculated as (current price − avg cost) × quantity. Updates when you refresh live prices." />
                </span>
                {hasLive
                  ? <span className="text-lg font-bold tabular-nums" style={{ color: gc(totalUnrealized) }}>
                      {totalUnrealized >= 0 ? '+' : ''}{fmt(totalUnrealized)}
                    </span>
                  : <span className="text-lg font-bold text-white/20">—</span>}
                {hasLive && totalInvested > 0 && (
                  <span className="text-[10px]" style={{ color: gc(totalUnrealized) }}>
                    {fmtPct((totalUnrealized / totalInvested) * 100)}
                  </span>
                )}
              </div>
              <div className="glass-card rounded-xl px-3.5 py-3 flex flex-col gap-0.5"
                style={closedTrades.length > 0 ? { background: `color-mix(in srgb, ${gc(totalRealized)} 9%, var(--color-dash-card, rgba(255,255,255,0.03)))` } : {}}>
                <span className="text-[10px] text-muted uppercase tracking-widest flex items-center">
                  Realized P&L
                  <InfoTip text="Profit or loss you've locked in by selling. Calculated as (sell price − avg cost at time of sale) × quantity sold. This is money actually made or lost." />
                </span>
                {closedTrades.length > 0
                  ? <span className="text-lg font-bold tabular-nums" style={{ color: gc(totalRealized) }}>
                      {totalRealized >= 0 ? '+' : ''}{fmt(totalRealized)}
                    </span>
                  : <span className="text-lg font-bold text-white/20">—</span>}
                <span className="text-[10px] text-muted">{closedTrades.length > 0 ? `${closedTrades.length} sell${closedTrades.length !== 1 ? 's' : ''}` : 'No sells yet'}</span>
              </div>
              <div className={`glass-card rounded-xl px-3.5 py-3 flex flex-col gap-0.5 ${hasSummary ? 'col-span-2' : ''}`}
                style={winRate != null ? { background: `color-mix(in srgb, ${winRate >= 50 ? 'var(--type-income)' : 'var(--type-expense)'} 9%, var(--color-dash-card, rgba(255,255,255,0.03)))` } : {}}>
                <span className="text-[10px] text-muted uppercase tracking-widest">Win Rate</span>
                <span className="text-lg font-bold tabular-nums"
                  style={{ color: winRate == null ? 'rgba(255,255,255,0.2)' : winRate >= 50 ? 'var(--type-income)' : 'var(--type-expense)' }}>
                  {winRate != null ? `${winRate}%` : '—'}
                </span>
                <span className="text-[10px] text-muted">
                  {closedTrades.length > 0 ? `${winCount} / ${closedTrades.length} winning` : 'No sells yet'}
                </span>
              </div>
            </>

            if (!hasSummary) return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">{statCards}</div>
            )

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4 items-stretch">
                {/* Left 50%: summary */}
                <div className="rounded-xl border flex flex-col gap-2.5 overflow-hidden"
                  style={{ borderColor: `color-mix(in srgb, ${lc} 22%, transparent)` }}>
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 pt-3.5 pb-0">
                    {!isAll && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `color-mix(in srgb, ${lc} 18%, transparent)`, color: lc }}>
                        {labelTab}
                      </span>
                    )}
                    <span className="text-[10px] text-muted uppercase tracking-widest">
                      {isAll ? 'Portfolio summary' : 'Strategy summary'}
                    </span>
                  </div>
                  {/* Stats as mini tiles matching the right-side cards */}
                  <div className="grid grid-cols-2 gap-2.5 px-2.5 pb-2.5 flex-1">
                    {[
                      { label: 'Trades',        value: labelTrades.length },
                      { label: 'Closed',        value: labelSells.length },
                      { label: 'Win rate',      value: labelWinRate != null ? `${labelWinRate}%` : '—',
                        color: labelWinRate != null ? gc2(labelWinRate - 50) : undefined,
                        bg: labelWinRate != null ? `color-mix(in srgb, ${gc2(labelWinRate - 50)} 9%, var(--color-dash-card, rgba(255,255,255,0.03)))` : undefined },
                      { label: 'Realized P&L',  value: labelSells.length > 0 ? `${labelRealized >= 0 ? '+' : ''}${fmt(labelRealized)}` : '—',
                        color: labelSells.length > 0 ? gc2(labelRealized) : undefined,
                        bg: labelSells.length > 0 ? `color-mix(in srgb, ${gc2(labelRealized)} 9%, var(--color-dash-card, rgba(255,255,255,0.03)))` : undefined },
                      { label: 'Avg per trade', value: avgPnl != null ? `${avgPnl >= 0 ? '+' : ''}${fmt(avgPnl)}` : '—',
                        color: avgPnl != null ? gc2(avgPnl) : undefined },
                      { label: 'Avg hold',      value: fmtDays(avgHold) },
                      ...(best != null ? [
                        { label: 'Best',  value: `${best >= 0 ? '+' : ''}${fmt(best)}`,      color: gc2(best),      bg: `color-mix(in srgb, ${gc2(best)} 9%, var(--color-dash-card, rgba(255,255,255,0.03)))` },
                        { label: 'Worst', value: `${(worst ?? 0) >= 0 ? '+' : ''}${fmt(worst ?? 0)}`, color: gc2(worst ?? 0), bg: `color-mix(in srgb, ${gc2(worst ?? 0)} 9%, var(--color-dash-card, rgba(255,255,255,0.03)))` },
                      ] : []),
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className="glass-card rounded-xl px-3.5 py-3 flex flex-col gap-0.5" style={bg ? { background: bg } : {}}>
                        <span className="text-[10px] text-muted uppercase tracking-widest whitespace-nowrap">{label}</span>
                        <span className="text-lg font-bold tabular-nums" style={color ? { color } : {}}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right 50%: stat cards in 2-col grid */}
                <div className="grid grid-cols-2 gap-2.5">{statCards}</div>
              </div>
            )
          })()}


          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit mb-3">
            {[
              { id: 'positions', label: 'Positions', Icon: BarChart2 },
              { id: 'log',       label: 'Trade Log', Icon: List },
            ].map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: tab === id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color:      tab === id ? '#fff' : 'rgba(255,255,255,0.4)',
                }}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {/* ── Positions tab ── */}
          {tab === 'positions' && (
            <>
            {/* Rich empty state */}
            {openPositions.length === 0 && (() => {
              const avgHold = closedPositions.length > 0
                ? Math.round(closedPositions.reduce((s, p) => s + (p.holdingDays ?? 0), 0) / closedPositions.filter(p => p.holdingDays != null).length)
                : null
              return (
                <div className="glass-card rounded-2xl px-6 py-10 flex flex-col items-center gap-6 text-center mb-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-1">
                      <BarChart2 size={20} className="text-white/20" />
                    </div>
                    <p className="text-sm font-medium text-white/60">No open positions</p>
                    <p className="text-xs text-white/25">
                      {closedTrades.length > 0 ? 'All your trades are currently closed.' : 'Buy something to open your first position.'}
                    </p>
                  </div>

                  {closedTrades.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
                      {[
                        { label: 'Total trades',  value: allTrades.length },
                        { label: 'Realized P&L',  value: `${totalRealized >= 0 ? '+' : ''}${fmt(totalRealized)}`,
                          color: gc(totalRealized) },
                        { label: 'Win rate',      value: winRate != null ? `${winRate}%` : '—',
                          color: winRate != null ? (winRate >= 50 ? 'var(--type-income)' : 'var(--type-expense)') : undefined },
                        { label: 'Avg hold',      value: fmtDays(avgHold) },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                          <span className="text-[10px] text-muted uppercase tracking-widest">{label}</span>
                          <span className="text-base font-bold tabular-nums" style={color ? { color } : {}}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setTab('log')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/25 transition-colors">
                    <List size={13} /> View Trade Log
                  </button>
                </div>
              )
            })()}

            {/* Table (only when there are open positions) */}
            {openPositions.length > 0 && <div className="glass-card rounded-2xl overflow-hidden">

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-white/[0.04]">
                {openPositions.map(p => {
                  const isOpen = !!expanded[p.ticker]
                  return (
                    <div key={p.ticker}>
                      <div
                        className="flex items-center justify-between px-4 py-3.5 cursor-pointer active:bg-white/[0.02]"
                        onClick={() => setExpanded(e => ({ ...e, [p.ticker]: !e[p.ticker] }))}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-white/30 shrink-0">
                            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold tracking-wider text-white">{p.ticker}</span>
                            {p.name && <span className="text-[11px] text-white/40 ml-2 truncate">{p.name}</span>}
                            <div className="text-[10px] text-muted mt-0.5">
                              {p.qty.toLocaleString('nl-BE', { maximumFractionDigits: 4 })} shares · {fmt(p.cost)}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 ml-3">
                          <PnlChip value={p.unrealizedPnl} pct={p.unrealizedPct} fmt={fmt} />
                        </div>
                      </div>
                      {isOpen && p.transactions.map(tx => {
                        const isBuy  = tx.direction === 'buy'
                        const qty    = Number(tx.quantity ?? 0)
                        const ppu    = Number(tx.price_per_unit ?? 0)
                        const dateStr = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                        const lc     = tx.label ? (tradeLabelMap[tx.label] ?? 'var(--color-accent)') : null
                        return (
                          <div key={tx.id} className="flex items-center justify-between px-4 py-2.5 bg-white/[0.015] border-t border-white/[0.03]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <TypeBadge direction={tx.direction} />
                              <span className="text-[10px] text-white/40">{dateStr}</span>
                              {tx.label && lc && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                                  style={{ background: `color-mix(in srgb, ${lc} 18%, transparent)`, color: lc }}>
                                  {tx.label}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/45 tabular-nums">
                              {qty.toLocaleString('nl-BE', { maximumFractionDigits: 4 })} @ {fmt(ppu)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <SortTh label="Ticker"         col="ticker"       sort={posSort} onSort={handlePosSort} className="text-left px-5" align="left" />
                      <SortTh label="Qty"            col="qty"          sort={posSort} onSort={handlePosSort} className="px-4" />
                      <SortTh label="Avg Cost"       col="avgCost"      sort={posSort} onSort={handlePosSort} className="px-4" />
                      <SortTh label="Live Price"     col="livePrice"    sort={posSort} onSort={handlePosSort} className="px-4" />
                      <SortTh label="Cost Basis"     col="cost"         sort={posSort} onSort={handlePosSort} className="px-4" />
                      <SortTh label="Market Value"   col="currentVal"   sort={posSort} onSort={handlePosSort} className="px-4" />
                      <SortTh label="Unrealized P&L" col="unrealizedPnl" sort={posSort} onSort={handlePosSort} className="px-4" />
                      <SortTh label="Realized P&L"  col="realizedPnl"  sort={posSort} onSort={handlePosSort} className="px-4" />
                      <th className="py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOpenPositions.map(p => {
                      const isOpen    = !!expanded[p.ticker]
                      const alloc     = totalInvested > 0 ? (p.cost / totalInvested) * 100 : 0
                      const tickerCol = tickerColorMap[p.ticker]
                      return (
                        <>
                          <tr key={p.ticker}
                            className="group/row border-b border-white/[0.03] cursor-pointer hover:bg-white/[0.02] transition-colors"
                            onClick={() => setExpanded(e => ({ ...e, [p.ticker]: !e[p.ticker] }))}>
                            <td className="px-5 py-3.5" style={{ boxShadow: `inset 3px 0 0 ${tickerCol}` }}>
                              <div className="flex items-center gap-2">
                                <span className="shrink-0" style={{ color: tickerCol, opacity: 0.7 }}>
                                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold tracking-wider" style={{ color: tickerCol }}>{p.ticker}</span>
                                  {p.name && <span className="text-[11px] text-white/40 truncate max-w-[160px]">{p.name}</span>}
                                  <span className="text-[10px] text-muted">{alloc.toFixed(1)}% · {p.transactions.length} trade{p.transactions.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-white/80">
                              {p.qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 })}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-white/60">
                              {p.avgCost > 0 ? fmt(p.avgCost) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums">
                              {p.livePrice != null
                                ? <span className="text-white">{fmt(p.livePrice)}</span>
                                : <button onClick={e => { e.stopPropagation(); refresh() }} className="text-white/20 hover:text-accent text-xs transition-colors">Refresh</button>}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-white/55">{fmt(p.cost)}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums">
                              {p.currentVal != null ? <span className="text-white font-semibold">{fmt(p.currentVal)}</span> : <span className="text-white/20">—</span>}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <PnlChip value={p.unrealizedPnl} pct={p.unrealizedPct} fmt={fmt} />
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {p.realizedPnl !== 0
                                ? <PnlChip value={p.realizedPnl} fmt={fmt} />
                                : <span className="text-white/20 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3.5" />
                          </tr>

                          {isOpen && p.transactions.map(tx => {
                            const isBuy    = tx.direction === 'buy'
                            const qty      = Number(tx.quantity ?? 0)
                            const ppu      = Number(tx.price_per_unit ?? 0)
                            const lotCost  = qty * ppu
                            const lotVal   = p.livePrice != null && isBuy && p.qty > 0.0001 ? p.livePrice * qty : null
                            const lotUnPnl = lotVal != null ? lotVal - lotCost : null
                            const lotUnPct = lotUnPnl != null && lotCost > 0 ? (lotUnPnl / lotCost) * 100 : null
                            const dateStr  = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                            const lc       = tx.label ? (tradeLabelMap[tx.label] ?? 'var(--color-accent)') : null
                            return (
                              <tr key={tx.id} className="group border-b border-white/[0.02] bg-white/[0.012]">
                                <td className="pl-11 pr-4 py-2.5" style={{ boxShadow: `inset 3px 0 0 color-mix(in srgb, ${tickerCol} 40%, transparent)` }}>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <TypeBadge direction={tx.direction} />
                                    <span className="text-xs text-white/40">{dateStr}</span>
                                    {tx.label && lc && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                                        style={{ background: `color-mix(in srgb, ${lc} 18%, transparent)`, color: lc }}>
                                        {tx.label}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-right text-xs text-white/50 tabular-nums">
                                  {qty > 0 ? qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 }) : '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right text-xs text-white/50 tabular-nums">{fmt(ppu)}</td>
                                <td className="px-4 py-2.5" />
                                <td className="px-4 py-2.5 text-right text-xs text-white/40 tabular-nums">
                                  {isBuy ? fmt(lotCost) : <span className="text-white/20">—</span>}
                                </td>
                                <td className="px-4 py-2.5 text-right text-xs tabular-nums">
                                  {lotVal != null ? <span className="text-white/55">{fmt(lotVal)}</span> : <span className="text-white/20">—</span>}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {isBuy ? <PnlChip value={lotUnPnl} pct={lotUnPct} fmt={fmt} /> : <span className="text-white/20 text-xs">—</span>}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {!isBuy ? <PnlChip value={tx.realizedPnl ?? null} fmt={fmt} /> : <span className="text-white/20 text-xs">—</span>}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isBuy && (
                                      <button type="button"
                                        onClick={e => { e.stopPropagation(); setSellTarget({ position: p, lot: tx }) }}
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors"
                                        style={{
                                          color: 'var(--type-expense)',
                                          background: 'color-mix(in srgb, var(--type-expense) 12%, transparent)',
                                          border: '1px solid color-mix(in srgb, var(--type-expense) 25%, transparent)',
                                        }}>
                                        SELL
                                      </button>
                                    )}
                                    <button type="button" onClick={e => { e.stopPropagation(); openTransactionModal(tx) }}
                                      className="text-white/30 hover:text-white/70 transition-colors"><Pencil size={11} /></button>
                                    <button type="button" onClick={e => { e.stopPropagation(); deleteTx(tx.id) }}
                                      className="text-white/30 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] text-xs text-muted">
                <span>{openPositions.length} open position{openPositions.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-5">
                  <span>Invested <span className="text-white font-medium ml-1">{fmt(totalInvested)}</span></span>
                  {positions.some(p => p.totalFees > 0.005) && (
                    <span>Fees <span className="text-white/50 ml-1">{fmt(positions.reduce((s, p) => s + p.totalFees, 0))}</span></span>
                  )}
                  {hasLive && <span>Value <span className="text-white font-medium ml-1">{fmt(totalCurrentVal)}</span></span>}
                </div>
              </div>
            </div>}

            {/* Closed positions */}
            {closedPositions.length > 0 && (
              <div className="glass-card rounded-2xl overflow-hidden mt-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                  onClick={() => setShowClosed(v => !v)}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/55">Closed Positions</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/35 tabular-nums">{closedPositions.length}</span>
                  </div>
                  {showClosed ? <ChevronDown size={14} className="text-white/30" /> : <ChevronRight size={14} className="text-white/30" />}
                </button>

                {showClosed && (
                  <>
                  {/* Mobile */}
                  <div className="sm:hidden border-t border-white/[0.04] divide-y divide-white/[0.03]">
                    {closedPositions.map(p => (
                      <div key={p.ticker} className="px-4 py-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold tracking-wider text-white/70">{p.ticker}</span>
                          <PnlChip value={p.realizedPnl} fmt={fmt} />
                        </div>
                        <div className="text-[10px] text-white/30">
                          {p.transactions.length} trade{p.transactions.length !== 1 ? 's' : ''}
                          {p.holdingDays != null && <> · {fmtDays(p.holdingDays)} held</>}
                          {p.exitDate && <> · Closed {new Date(p.exitDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop */}
                  <div className="hidden sm:block border-t border-white/[0.04] overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.04]">
                          <th className={`${thSel} text-left px-5`}>Ticker</th>
                          <th className={`${thSel} text-right px-4`}>Trades</th>
                          <th className={`${thSel} text-right px-4`}>Entry</th>
                          <th className={`${thSel} text-right px-4`}>Exit</th>
                          <th className={`${thSel} text-right px-4`}>Held</th>
                          <th className={`${thSel} text-right px-5`}>Realized P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedPositions.map(p => {
                          const entryStr = p.entryDate ? new Date(p.entryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'
                          const exitStr  = p.exitDate  ? new Date(p.exitDate  + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'
                          return (
                            <tr key={p.ticker} className="border-b border-white/[0.03] last:border-0">
                              <td className="px-5 py-3">
                                <span className="font-bold tracking-wider text-white/70">{p.ticker}</span>
                                {p.name && <span className="text-[11px] text-white/35 ml-2">{p.name}</span>}
                              </td>
                              <td className="px-4 py-3 text-right text-xs text-white/40 tabular-nums">{p.transactions.length}</td>
                              <td className="px-4 py-3 text-right text-xs text-white/40">{entryStr}</td>
                              <td className="px-4 py-3 text-right text-xs text-white/40">{exitStr}</td>
                              <td className="px-4 py-3 text-right text-xs text-white/40 tabular-nums">{fmtDays(p.holdingDays)}</td>
                              <td className="px-5 py-3 text-right">
                                <PnlChip value={p.realizedPnl} fmt={fmt} />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </div>
            )}
            </>
          )}

          {/* ── Trade Log tab ── */}
          {tab === 'log' && (
            <div className="glass-card rounded-2xl overflow-hidden">

              {/* Search bar */}
              <div className="px-4 pt-3.5 pb-2 border-b border-white/[0.04]">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search ticker…"
                    value={tradeSearch}
                    onChange={e => setTradeSearch(e.target.value)}
                    className="w-full sm:w-56 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white/80 placeholder-white/25 outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-white/[0.03]">
                {filteredTrades.length === 0 && (
                  <p className="text-center text-muted text-xs py-10">
                    {tradeSearch ? 'No trades match that ticker.' : 'No trades for this label yet.'}
                  </p>
                )}
                {filteredTrades.map(tx => {
                  const dir     = tx.direction ?? 'buy'
                  const qty     = Number(tx.quantity ?? 0)
                  const ppu     = Number(tx.price_per_unit ?? 0)
                  const total   = qty * ppu
                  const realPnl = dir === 'sell' ? (closedPnlMap[tx.id] ?? null) : null
                  const dateStr = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                  const lc      = tx.label ? (tradeLabelMap[tx.label] ?? 'var(--color-accent)') : null
                  return (
                    <div key={tx.id}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-white/[0.02]"
                      onClick={() => setDetailTrade(tx)}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <TypeBadge direction={dir} />
                          <span className="font-bold tracking-wider text-white">{tx.ticker?.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/35 flex-wrap">
                          <span>{dateStr}</span>
                          {tx.label && lc && (
                            <><span>·</span>
                            <span style={{ color: lc }}>{tx.label}</span></>
                          )}
                          <span>·</span>
                          <span>{qty.toLocaleString('nl-BE', { maximumFractionDigits: 4 })} @ {fmt(ppu)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        {realPnl != null
                          ? <PnlChip value={realPnl} fmt={fmt} />
                          : <span className="text-xs text-white/40 tabular-nums">{fmt(total)}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <SortTh label="Date"        col="date"   sort={logSort} onSort={handleLogSort} className="text-left px-5" align="left" />
                      <th className={`${thSel} text-center px-3`}>Type</th>
                      <SortTh label="Ticker"      col="ticker" sort={logSort} onSort={handleLogSort} className="text-left px-4" align="left" />
                      <th className={`${thSel} text-center px-3`}>Label</th>
                      <SortTh label="Qty"         col="qty"    sort={logSort} onSort={handleLogSort} className="px-4" />
                      <SortTh label="Price"       col="price"  sort={logSort} onSort={handleLogSort} className="px-4" />
                      <SortTh label="Total"       col="total"  sort={logSort} onSort={handleLogSort} className="px-4" />
                      <SortTh label="Realized P&L" col="pnl"  sort={logSort} onSort={handleLogSort} className="px-5" />
                      <th className="py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.length === 0
                      ? <tr><td colSpan={9} className="text-center text-muted text-xs py-10">
                          {tradeSearch ? 'No trades match that ticker.' : 'No trades for this label yet.'}
                        </td></tr>
                      : filteredTrades.map(tx => {
                          const dir     = tx.direction ?? 'buy'
                          const qty     = Number(tx.quantity ?? 0)
                          const ppu     = Number(tx.price_per_unit ?? 0)
                          const total   = qty * ppu
                          const dateStr = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                          const lc      = tx.label ? (tradeLabelMap[tx.label] ?? 'var(--color-accent)') : null
                          const realPnl = dir === 'sell' ? (closedPnlMap[tx.id] ?? null) : null
                          return (
                            <tr key={tx.id}
                              className="group border-b border-white/[0.03] cursor-pointer hover:bg-white/[0.02] transition-colors"
                              onClick={() => setDetailTrade(tx)}>
                              <td className="px-5 py-3">
                                <span className="text-xs text-white/45">{dateStr}</span>
                              </td>
                              <td className="px-3 py-3 text-center"><TypeBadge direction={dir} /></td>
                              <td className="px-4 py-3">
                                <span className="font-bold tracking-wider text-white">{tx.ticker?.toUpperCase()}</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {tx.label && lc
                                  ? <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                                      style={{ background: `color-mix(in srgb, ${lc} 18%, transparent)`, color: lc }}>
                                      {tx.label}
                                    </span>
                                  : <span className="text-white/20 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-xs text-white/65">
                                {qty > 0 ? qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 }) : '—'}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-xs text-white/65">
                                {ppu > 0 ? fmt(ppu) : '—'}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-xs text-white/55">
                                {total > 0 ? fmt(total) : '—'}
                              </td>
                              <td className="px-5 py-3 text-right">
                                {realPnl != null
                                  ? <PnlChip value={realPnl} fmt={fmt} />
                                  : <span className="text-white/20 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button type="button" onClick={e => { e.stopPropagation(); openTransactionModal(tx) }}
                                    className="text-white/30 hover:text-white/70 transition-colors"><Pencil size={12} /></button>
                                  <button type="button" onClick={e => { e.stopPropagation(); deleteTx(tx.id) }}
                                    className="text-white/30 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 border-t border-white/[0.04] text-xs text-muted">
                {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''}
                {tradeSearch && ` matching "${tradeSearch}"`}
                {!tradeSearch && labelTab !== 'all' && ` · ${labelTab}`}
              </div>
            </div>
          )}

          <p className="text-center text-white/20 text-[10px] mt-4">{t('port.footer')}</p>

        </>}

      </div>
    </div>

    {showBuyModal && (
      <QuickBuyModal onClose={() => setShowBuyModal(false)} />
    )}
    {detailTrade && (() => {
      const pos      = positions.find(p => p.ticker === detailTrade.ticker?.toUpperCase())
      const livePrice = pos?.livePrice ?? null
      const realPnl  = closedPnlMap[detailTrade.id] ?? null
      const card     = cards.find(c => c.id === detailTrade.card_id)
      const lc       = detailTrade.label ? (tradeLabelMap[detailTrade.label] ?? 'var(--color-accent)') : null
      return (
        <TradeDetailModal
          tx={detailTrade}
          realizedPnl={realPnl}
          livePrice={livePrice}
          cardName={card?.name ?? null}
          labelColor={lc}
          onClose={() => setDetailTrade(null)}
        />
      )
    })()}
    {sellTarget && (
      <QuickSellModal
        position={sellTarget.position}
        lot={sellTarget.lot}
        onClose={() => setSellTarget(null)}
      />
    )}
    </>
  )
}
