import { useState, useMemo } from 'react'
import { Plus, RefreshCw, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronRight, Clock, Pencil, Trash2, BarChart2, List } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/dashboard/Navbar'
import { usePreferences } from '../context/UserPreferencesContext'
import { useSharedData } from '../context/SharedDataContext'
import { useUIPrefs } from '../context/UIPrefContext'
import { useTransactionModal } from '../context/TransactionModalContext'
import { fetchLivePrice } from '../lib/yahooFinance'
import { Skeleton, SkeletonRow } from '../components/shared/Skeleton'

const fmtPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
const gc = (n) => n == null ? 'rgba(255,255,255,0.25)' : n >= 0 ? 'var(--type-income)' : 'var(--type-expense)'

function PnlChip({ value, pct, fmt }) {
  if (value == null) return <span className="text-white/20 font-mono text-xs">—</span>
  const color = gc(value)
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md"
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
      {value >= 0 ? '+' : ''}{fmt(value)}
      {pct != null && <span className="opacity-60 text-[10px]">({fmtPct(pct)})</span>}
    </span>
  )
}

function TypeBadge({ direction }) {
  const isBuy = (direction ?? 'buy') === 'buy'
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono tracking-widest shrink-0"
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

function computePortfolio(investTxs, cachedPrices) {
  const grouped = {}
  const closedTrades = []

  const sorted = [...investTxs].sort((a, b) =>
    a.date.localeCompare(b.date) || (a.created_at ?? '').localeCompare(b.created_at ?? '')
  )

  for (const tx of sorted) {
    const sym = tx.ticker.toUpperCase()
    if (!grouped[sym]) grouped[sym] = { qty: 0, cost: 0, txs: [] }
    const g = grouped[sym]
    const qty = Number(tx.quantity ?? 0)
    const ppu = Number(tx.price_per_unit ?? 0)
    const dir = tx.direction ?? 'buy'

    if (dir === 'sell') {
      const avgCostAtSell = g.qty > 0 ? g.cost / g.qty : 0
      const realizedPnl = (ppu - avgCostAtSell) * qty
      g.qty = Math.max(0, g.qty - qty)
      g.cost = Math.max(0, g.cost - avgCostAtSell * qty)
      const enriched = { ...tx, direction: 'sell', realizedPnl, avgCostAtSell }
      closedTrades.push(enriched)
      g.txs.push(enriched)
    } else {
      g.qty += qty
      g.cost += qty * ppu
      g.txs.push({ ...tx, direction: 'buy' })
    }
  }

  const positions = Object.entries(grouped).map(([ticker, g]) => {
    const cached = cachedPrices[ticker]
    const livePrice = cached?.price ?? null
    const avgCost = g.qty > 0.0001 ? g.cost / g.qty : 0
    const currentVal = livePrice != null && g.qty > 0.0001 ? livePrice * g.qty : null
    const unrealizedPnl = currentVal != null ? currentVal - g.cost : null
    const unrealizedPct = unrealizedPnl != null && g.cost > 0 ? (unrealizedPnl / g.cost) * 100 : null
    const totalFees = g.txs.filter(t => t.direction === 'buy').reduce((s, t) => {
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
  const rawTradeLabels = prefs['invest_labels'] ?? [{ name: 'Day Trade', color: '#60a5fa' }, { name: 'Swing Trade', color: '#a78bfa' }, { name: 'Long Term', color: '#34d399' }]
  const tradeLabelMap  = Object.fromEntries(rawTradeLabels.map(l => typeof l === 'string' ? [l, '#a78bfa'] : [l.name, l.color]))
  const tradeLabels    = rawTradeLabels.map(l => typeof l === 'string' ? { name: l, color: '#a78bfa' } : l)
  const { openTransactionModal } = useTransactionModal()

  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [refreshing,   setRefreshing]   = useState(false)
  const [priceError,   setPriceError]   = useState(false)
  const [expanded,     setExpanded]     = useState({})
  const [tab,          setTab]          = useState('positions')
  const [labelFilter,  setLabelFilter]  = useState('')

  const cachedPrices = prefs.portfolio_prices ?? {}

  const investTxs = useMemo(() =>
    allTransactions.filter(tx => tx.type === 'invest' && tx.ticker),
    [allTransactions]
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

  const filteredTrades = useMemo(() =>
    labelFilter ? allTrades.filter(tx => tx.label === labelFilter) : allTrades,
    [allTrades, labelFilter]
  )

  async function deleteTx(id) {
    if (!window.confirm('Delete this trade?')) return
    await supabase.from('transactions').update({ is_deleted: true }).eq('id', id)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
  }

  async function refresh() {
    if (!user?.id) return
    setRefreshing(true); setPriceError(false)
    const tickers = [...new Set(investTxs.map(tx => tx.ticker.toUpperCase()))]
    if (!tickers.length) { setRefreshing(false); return }
    let anyError = false
    const results = await Promise.all(tickers.map(async ticker => {
      const r = await fetchLivePrice(ticker)
      if (!r) { anyError = true; return { ticker, price: null, name: null } }
      return { ticker, price: r.price, name: r.name }
    }))
    setPriceError(anyError)
    const next = { ...cachedPrices }
    const now = new Date().toISOString()
    for (const { ticker, price, name } of results) {
      if (price != null) next[ticker] = { price, name, updatedAt: now }
    }
    setPref('portfolio_prices', next)
    setRefreshing(false)
  }

  const openPositions   = positions.filter(p => p.qty > 0.0001)
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

  return (
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
            <button onClick={() => openTransactionModal({ type: 'invest', direction: 'buy' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm hover:bg-accent/25 transition-colors">
              <Plus size={13} /> Buy
            </button>
            <button onClick={() => openTransactionModal({ type: 'invest', direction: 'sell' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm hover:bg-white/5 transition-colors"
              style={{ color: 'var(--type-expense)', borderColor: 'color-mix(in srgb, var(--type-expense) 30%, transparent)' }}>
              Sell
            </button>
            <button onClick={refresh} disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dash-card border border-border text-sm hover:border-accent transition-colors disabled:opacity-40">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? t('port.refreshing') : t('port.refresh')}
            </button>
          </div>
        </div>

        {priceError && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
            <AlertCircle size={13} />{t('port.priceError')}
          </div>
        )}

        {/* Skeleton */}
        {!loaded && (
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            <div className="flex flex-col gap-2 mt-2">{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
          </div>
        )}

        {/* Empty state */}
        {loaded && investTxs.length === 0 && (
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

        {loaded && investTxs.length > 0 && <>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            <div className="glass-card rounded-2xl px-4 py-3.5 flex flex-col gap-1">
              <span className="text-[10px] text-muted uppercase tracking-widest">Cost Basis</span>
              <span className="text-xl font-bold font-mono tabular-nums">{fmt(totalInvested)}</span>
              <span className="text-[11px] text-muted">{openPositions.length} open position{openPositions.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="glass-card rounded-2xl px-4 py-3.5 flex flex-col gap-1">
              <span className="text-[10px] text-muted uppercase tracking-widest">Market Value</span>
              <span className="text-xl font-bold font-mono tabular-nums">{hasLive ? fmt(totalCurrentVal) : '—'}</span>
              <span className="text-[11px] text-muted">{lastUpdated ? timeAgo(lastUpdated) : 'Refresh prices'}</span>
            </div>
            <div className="glass-card rounded-2xl px-4 py-3.5 flex flex-col gap-1">
              <span className="text-[10px] text-muted uppercase tracking-widest">Unrealized P&L</span>
              {hasLive
                ? <span className="text-xl font-bold font-mono tabular-nums" style={{ color: gc(totalUnrealized) }}>
                    {totalUnrealized >= 0 ? '+' : ''}{fmt(totalUnrealized)}
                  </span>
                : <span className="text-xl font-bold font-mono text-white/20">—</span>}
              {hasLive && totalInvested > 0 && (
                <span className="text-[11px] font-mono" style={{ color: gc(totalUnrealized) }}>
                  {fmtPct((totalUnrealized / totalInvested) * 100)}
                </span>
              )}
            </div>
            <div className="glass-card rounded-2xl px-4 py-3.5 flex flex-col gap-1">
              <span className="text-[10px] text-muted uppercase tracking-widest">Realized P&L</span>
              {closedTrades.length > 0
                ? <span className="text-xl font-bold font-mono tabular-nums" style={{ color: gc(totalRealized) }}>
                    {totalRealized >= 0 ? '+' : ''}{fmt(totalRealized)}
                  </span>
                : <span className="text-xl font-bold font-mono text-white/20">—</span>}
              <span className="text-[11px] text-muted">{closedTrades.length > 0 ? `${closedTrades.length} sell${closedTrades.length !== 1 ? 's' : ''}` : 'No sells yet'}</span>
            </div>
            <div className="glass-card rounded-2xl px-4 py-3.5 flex flex-col gap-1">
              <span className="text-[10px] text-muted uppercase tracking-widest">Win Rate</span>
              <span className="text-xl font-bold font-mono tabular-nums"
                style={{ color: winRate == null ? 'rgba(255,255,255,0.2)' : winRate >= 50 ? 'var(--type-income)' : 'var(--type-expense)' }}>
                {winRate != null ? `${winRate}%` : '—'}
              </span>
              <span className="text-[11px] text-muted">
                {closedTrades.length > 0 ? `${winCount} / ${closedTrades.length} winning` : 'No sells yet'}
              </span>
            </div>
          </div>

          {/* Tab bar + label filter */}
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
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

            {tab === 'log' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button type="button" onClick={() => setLabelFilter('')}
                  className="text-[11px] px-2.5 py-1 rounded-lg border transition-colors"
                  style={{
                    background:   !labelFilter ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color:        !labelFilter ? '#fff' : 'rgba(255,255,255,0.35)',
                    borderColor:  !labelFilter ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  }}>
                  All
                </button>
                {tradeLabels.map(({ name, color }) => (
                  <button key={name} type="button" onClick={() => setLabelFilter(labelFilter === name ? '' : name)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border transition-colors"
                    style={{
                      background:  labelFilter === name ? `color-mix(in srgb, ${color} 18%, transparent)` : 'transparent',
                      color:       labelFilter === name ? color : 'rgba(255,255,255,0.35)',
                      borderColor: labelFilter === name ? `color-mix(in srgb, ${color} 40%, transparent)` : 'rgba(255,255,255,0.08)',
                    }}>
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Positions tab ── */}
          {tab === 'positions' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className={`${thSel} text-left px-5`}>Ticker</th>
                      <th className={`${thSel} text-right px-4`}>Qty</th>
                      <th className={`${thSel} text-right px-4`}>Avg Cost</th>
                      <th className={`${thSel} text-right px-4`}>Live Price</th>
                      <th className={`${thSel} text-right px-4`}>Cost Basis</th>
                      <th className={`${thSel} text-right px-4`}>Market Value</th>
                      <th className={`${thSel} text-right px-4`}>Unrealized P&L</th>
                      <th className={`${thSel} text-right px-4`}>Realized P&L</th>
                      <th className="py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(p => {
                      const isOpen = !!expanded[p.ticker]
                      const alloc  = totalInvested > 0 ? (p.cost / totalInvested) * 100 : 0
                      return (
                        <>
                          <tr key={p.ticker}
                            className="border-b border-white/[0.03] cursor-pointer hover:bg-white/[0.02] transition-colors"
                            onClick={() => setExpanded(e => ({ ...e, [p.ticker]: !e[p.ticker] }))}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-white/30 shrink-0">
                                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold font-mono tracking-wider text-white">{p.ticker}</span>
                                  {p.name && <span className="text-[11px] text-white/40 truncate max-w-[160px]">{p.name}</span>}
                                  <span className="text-[10px] text-muted">{alloc.toFixed(1)}% · {p.transactions.length} trade{p.transactions.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums text-white/80">
                              {p.qty > 0.0001 ? p.qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 }) : <span className="text-white/25 text-xs">Closed</span>}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums text-white/60">
                              {p.avgCost > 0 ? fmt(p.avgCost) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                              {p.livePrice != null
                                ? <span className="text-white">{fmt(p.livePrice)}</span>
                                : <button onClick={e => { e.stopPropagation(); refresh() }} className="text-white/20 hover:text-accent text-xs transition-colors">Refresh</button>}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums text-white/55">
                              {p.qty > 0.0001 ? fmt(p.cost) : <span className="text-white/20">—</span>}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums">
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

                          {/* Lot rows */}
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
                                <td className="pl-11 pr-4 py-2.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <TypeBadge direction={tx.direction} />
                                    <span className="text-xs text-white/40 font-mono">{dateStr}</span>
                                    {tx.label && lc && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                                        style={{ background: `color-mix(in srgb, ${lc} 18%, transparent)`, color: lc }}>
                                        {tx.label}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-xs text-white/50 tabular-nums">
                                  {qty > 0 ? qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 }) : '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-xs text-white/50 tabular-nums">{fmt(ppu)}</td>
                                <td className="px-4 py-2.5" />
                                <td className="px-4 py-2.5 text-right font-mono text-xs text-white/40 tabular-nums">
                                  {isBuy ? fmt(lotCost) : <span className="text-white/20">—</span>}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums">
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
                <span>{positions.length} ticker{positions.length !== 1 ? 's' : ''} · {investTxs.length} trade{investTxs.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-5">
                  <span>Invested <span className="text-white font-mono font-medium ml-1">{fmt(totalInvested)}</span></span>
                  {positions.some(p => p.totalFees > 0.005) && (
                    <span>Fees <span className="text-white/50 font-mono ml-1">{fmt(positions.reduce((s, p) => s + p.totalFees, 0))}</span></span>
                  )}
                  {hasLive && <span>Value <span className="text-white font-mono font-medium ml-1">{fmt(totalCurrentVal)}</span></span>}
                </div>
              </div>
            </div>
          )}

          {/* ── Trade Log tab ── */}
          {tab === 'log' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className={`${thSel} text-left px-5`}>Date</th>
                      <th className={`${thSel} text-center px-3`}>Type</th>
                      <th className={`${thSel} text-left px-4`}>Ticker</th>
                      <th className={`${thSel} text-center px-3`}>Label</th>
                      <th className={`${thSel} text-right px-4`}>Qty</th>
                      <th className={`${thSel} text-right px-4`}>Price</th>
                      <th className={`${thSel} text-right px-4`}>Total</th>
                      <th className={`${thSel} text-right px-5`}>Realized P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.length === 0
                      ? <tr><td colSpan={8} className="text-center text-muted text-xs py-10">No trades match this filter.</td></tr>
                      : filteredTrades.map(tx => {
                          const dir    = tx.direction ?? 'buy'
                          const qty    = Number(tx.quantity ?? 0)
                          const ppu    = Number(tx.price_per_unit ?? 0)
                          const total  = qty * ppu
                          const dateStr = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                          const lc     = tx.label ? (tradeLabelMap[tx.label] ?? 'var(--color-accent)') : null
                          const realPnl = dir === 'sell' ? (closedPnlMap[tx.id] ?? null) : null
                          return (
                            <tr key={tx.id} className="group border-b border-white/[0.03]">
                              <td className="px-5 py-3">
                                <span className="text-xs text-white/45 font-mono">{dateStr}</span>
                              </td>
                              <td className="px-3 py-3 text-center"><TypeBadge direction={dir} /></td>
                              <td className="px-4 py-3">
                                <span className="font-bold font-mono tracking-wider text-white">{tx.ticker?.toUpperCase()}</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {tx.label && lc
                                  ? <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                                      style={{ background: `color-mix(in srgb, ${lc} 18%, transparent)`, color: lc }}>
                                      {tx.label}
                                    </span>
                                  : <span className="text-white/20 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-white/65">
                                {qty > 0 ? qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 }) : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-white/65">
                                {ppu > 0 ? fmt(ppu) : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-white/55">
                                {total > 0 ? fmt(total) : '—'}
                              </td>
                              <td className="px-5 py-3 text-right">
                                {realPnl != null
                                  ? <PnlChip value={realPnl} fmt={fmt} />
                                  : <span className="text-white/20 text-xs">—</span>}
                              </td>
                            </tr>
                          )
                        })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-white/[0.04] text-xs text-muted">
                {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''}{labelFilter ? ` · filtered by ${labelFilter}` : ''}
              </div>
            </div>
          )}

          <p className="text-center text-white/20 text-[10px] mt-4">{t('port.footer')}</p>
        </>}

      </div>
    </div>
  )
}
