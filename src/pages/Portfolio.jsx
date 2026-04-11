import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/dashboard/Navbar'
import { usePreferences } from '../context/UserPreferencesContext'

const fmtPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

import { fetchLivePrice, fetchHistoricalPrice } from '../lib/yahooFinance'

function StatCard({ label, value, sub, positive }) {
  const color = positive === true ? 'var(--type-income)' : positive === false ? 'var(--type-expense)' : 'white'
  return (
    <div className="glass-card rounded-2xl px-5 py-4 flex flex-col gap-1">
      <span className="text-[10px] text-muted uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  )
}

export default function Portfolio() {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [positions,   setPositions]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [priceError,  setPriceError]  = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [expanded,    setExpanded]    = useState({})

  const load = useCallback(async (silent = false) => {
    if (!user?.id) return
    if (!silent) setLoading(true)

    const { data: txs } = await supabase
      .from('transactions')
      .select('id, ticker, quantity, amount, price_per_unit, date')
      .eq('user_id', user.id)
      .eq('type', 'invest')
      .eq('is_deleted', false)
      .not('ticker', 'is', null)

    const rawBalances = user?.user_metadata?.portfolio_ticker_balances ?? {}
    // Normalise: support both old format (number) and new format ({ amount, date })
    const tickerBalances = Object.fromEntries(
      Object.entries(rawBalances).map(([sym, val]) =>
        [sym, typeof val === 'object' ? val : { amount: val, date: null }]
      )
    )

    if (!txs?.length) {
      // Build positions for tickers that have an initial balance but no transactions
      const initialOnlyPositions = await Promise.all(
        Object.entries(tickerBalances)
          .filter(([, b]) => b.amount > 0)
          .map(async ([ticker, b]) => {
            const liveResult = await fetchLivePrice(ticker)
            const livePrice = liveResult?.price ?? null
            let qty = 0
            if (livePrice && b.date) {
              const hist = await fetchHistoricalPrice(ticker, b.date)
              if (hist?.price) qty = b.amount / hist.price
            }
            const currentVal = livePrice && qty > 0 ? livePrice * qty : b.amount
            return {
              ticker, resolvedTicker: liveResult?.resolvedTicker ?? ticker, name: liveResult?.name ?? null,
              totalCost: b.amount, totalFees: 0, totalQty: qty,
              avgBuy: qty > 0 ? b.amount / qty : 0,
              livePrice, currentVal,
              gainLoss: livePrice && qty > 0 ? currentVal - b.amount : null,
              gainPct:  livePrice && qty > 0 ? ((currentVal - b.amount) / b.amount) * 100 : null,
              initialBalance: b.amount, initialDate: b.date, transactions: [],
            }
          })
      )
      setPositions(initialOnlyPositions)
      setLoading(false)
      setRefreshing(false)
      return
    }

    // Group by ticker
    const grouped = {}
    txs.forEach(t => {
      const ticker = t.ticker.toUpperCase()
      if (!grouped[ticker]) grouped[ticker] = { ticker, totalCost: 0, totalQty: 0, totalFees: 0, transactions: [] }
      const qty  = Number(t.quantity ?? 0)
      const ppu  = Number(t.price_per_unit ?? 0)
      const pure = qty * ppu  // cost without fees
      const fees = Number(t.amount) - pure
      grouped[ticker].totalCost += pure > 0 ? pure : Number(t.amount) // fall back to amount if no ppu stored
      grouped[ticker].totalQty  += qty
      grouped[ticker].totalFees += fees > 0 ? fees : 0
      grouped[ticker].transactions.push(t)
    })

    // Fetch live prices (with auto exchange suffix resolution)
    const tickers = Object.keys(grouped)
    let anyError = false
    const prices = await Promise.all(tickers.map(async t => {
      const result = await fetchLivePrice(t)
      if (!result) { anyError = true; return { ticker: t, price: null, resolvedTicker: t, name: null } }
      return { ticker: t, price: result.price, resolvedTicker: result.resolvedTicker, name: result.name }
    }))
    setPriceError(anyError)

    const priceMap    = Object.fromEntries(prices.map(p => [p.ticker, p.price]))
    const resolvedMap = Object.fromEntries(prices.map(p => [p.ticker, p.resolvedTicker]))
    const nameMap     = Object.fromEntries(prices.map(p => [p.ticker, p.name]))

    // For tickers with an initial balance + a date, compute live initial value
    const initialQtyMap = {}
    await Promise.all(tickers.map(async ticker => {
      const b = tickerBalances[ticker]
      if (!b || !b.amount || !b.date) return
      const hist = await fetchHistoricalPrice(ticker, b.date)
      if (hist?.price && hist.price > 0) initialQtyMap[ticker] = b.amount / hist.price
    }))

    const built = tickers.map(ticker => {
      const g              = grouped[ticker]
      const b              = tickerBalances[ticker]
      const initialAmount  = b?.amount ?? 0
      const initialQty     = initialQtyMap[ticker] ?? 0
      const livePrice      = priceMap[ticker]
      const txQty          = g.totalQty
      const totalQty       = txQty + initialQty
      const avgBuy         = totalQty > 0 ? (g.totalCost + initialAmount) / totalQty : 0
      const trackedVal     = livePrice != null ? livePrice * totalQty : null
      const currentVal     = trackedVal ?? (initialAmount > 0 ? initialAmount : null)
      const totalCost      = g.totalCost + initialAmount
      const gainLoss       = currentVal != null ? currentVal - totalCost : null
      const gainPct        = gainLoss != null && totalCost > 0 ? (gainLoss / totalCost) * 100 : null
      const resolvedTicker = resolvedMap[ticker] ?? ticker
      const name           = nameMap[ticker] ?? null
      return { ticker, resolvedTicker, name, totalCost, totalFees: g.totalFees, totalQty, avgBuy, livePrice, currentVal, gainLoss, gainPct, initialBalance: initialAmount, initialDate: b?.date ?? null, transactions: g.transactions }
    })

    // Also add tickers that have an initial balance but zero transactions
    const trackedSymbols = new Set(tickers)
    for (const [ticker, b] of Object.entries(tickerBalances)) {
      if (!trackedSymbols.has(ticker) && b.amount > 0) {
        const livePrice = priceMap[ticker] ?? null
        const initialQty = initialQtyMap[ticker] ?? 0
        const currentVal = livePrice && initialQty > 0 ? livePrice * initialQty : b.amount
        built.push({
          ticker, resolvedTicker: resolvedMap[ticker] ?? ticker, name: nameMap[ticker] ?? null,
          totalCost: b.amount, totalFees: 0, totalQty: initialQty,
          avgBuy: initialQty > 0 ? b.amount / initialQty : 0,
          livePrice, currentVal,
          gainLoss: livePrice && initialQty > 0 ? currentVal - b.amount : null,
          gainPct:  livePrice && initialQty > 0 ? ((currentVal - b.amount) / b.amount) * 100 : null,
          initialBalance: b.amount, initialDate: b.date ?? null, transactions: [],
        })
      }
    }

    setPositions(built)
    setLastUpdated(new Date())
    setLoading(false)
    setRefreshing(false)
  }, [user?.id])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 60_000)
    window.addEventListener('transaction-saved', load)
    return () => {
      clearInterval(interval)
      window.removeEventListener('transaction-saved', load)
    }
  }, [load])

  async function refresh() {
    setRefreshing(true)
    await load(true)
  }

  const totalInvested    = positions.reduce((s, p) => s + p.totalCost, 0)
  const totalCurrentVal  = positions.filter(p => p.currentVal != null).reduce((s, p) => s + p.currentVal, 0)
  const hasLive          = positions.some(p => p.currentVal != null)
  const totalGainLoss    = hasLive ? totalCurrentVal - totalInvested : null
  const totalGainPct     = totalGainLoss != null && totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : null

  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar
        currentDate={currentDate}
        onPrev={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
      />

      <div id="page-content" className="py-6 px-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('port.title')}</h1>
            <p className="text-muted text-sm mt-1">{t('port.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && !refreshing && (
              <span className="text-xs text-muted">
                {t('port.updated', { time: lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) })}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dash-card border border-border text-sm hover:border-accent transition-colors disabled:opacity-40"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? t('port.refreshing') : t('port.refresh')}
            </button>
          </div>
        </div>

        {priceError && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
            <AlertCircle size={13} />
            {t('port.priceError')}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label={t('port.totalInvested')} value={fmt(totalInvested)} />
          <StatCard
            label={t('port.currentValue')}
            value={hasLive ? fmt(totalCurrentVal) : '—'}
            sub={!hasLive ? t('port.noPrices') : undefined}
          />
          <StatCard
            label={t('port.totalGainLoss')}
            value={totalGainLoss != null ? fmt(totalGainLoss) : '—'}
            positive={totalGainLoss != null ? totalGainLoss >= 0 : undefined}
          />
          <StatCard
            label={t('port.return')}
            value={totalGainPct != null ? fmtPct(totalGainPct) : '—'}
            positive={totalGainPct != null ? totalGainPct >= 0 : undefined}
          />
        </div>

        {/* Positions table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.04] text-[11px] uppercase tracking-widest text-muted">
                <th className="text-left px-5 py-3 font-medium">{t('port.ticker')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('port.quantity')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('port.avgBuy')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('port.currentPrice')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('port.costBasis')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('port.fees')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('port.currentValue')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('port.gainLoss')}</th>
                <th className="text-right px-5 py-3 font-medium">{t('port.return')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-16 text-muted text-xs">{t('common.loading')}</td></tr>
              ) : positions.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-muted text-xs">{t('port.noTx')}</td></tr>
              ) : positions.map(p => {
                const gain = p.gainLoss
                const gainColor = gain == null ? '#9ca3af' : gain >= 0 ? 'var(--type-income)' : 'var(--type-expense)'
                const alloc = totalInvested > 0 ? (p.totalCost / totalInvested) * 100 : 0
                const isOpen = !!expanded[p.ticker]
                const hasMultiple = p.transactions.length > 1
                return (
                  <>
                    <tr
                      key={p.ticker}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setExpanded(e => ({ ...e, [p.ticker]: !e[p.ticker] }))}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-2">
                          <span className="text-white/30 mt-1 shrink-0">
                            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{p.ticker}</span>
                              {p.resolvedTicker !== p.ticker && (
                                <span className="text-[10px] text-white/25">{p.resolvedTicker}</span>
                              )}
                            </div>
                            {p.name && <span className="text-[11px] text-white/50 truncate max-w-[200px]">{p.name}</span>}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted">{t('port.lots', { alloc: alloc.toFixed(1), n: p.transactions.length })}</span>
                              {p.initialBalance > 0 && <span className="text-[10px] text-white/30">{t('port.initialBalance', { amount: fmt(p.initialBalance) })}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-white/80">
                        {p.totalQty > 0 ? p.totalQty.toLocaleString('nl-BE', { maximumFractionDigits: 6 }) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-white/80">
                        {p.avgBuy > 0 ? fmt(p.avgBuy) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {p.livePrice != null
                          ? <span className="text-white">{fmt(p.livePrice)}</span>
                          : <span className="text-white/25">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-white/70">{fmt(p.totalCost)}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-white/40 text-xs">
                        {p.totalFees > 0.005 ? fmt(p.totalFees) : <span className="text-white/20">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {p.currentVal != null
                          ? <span className="text-white font-medium">{fmt(p.currentVal)}</span>
                          : <span className="text-white/25">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-medium" style={{ color: gainColor }}>
                        {gain != null ? (gain >= 0 ? '+' : '') + fmt(gain) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        {p.gainPct != null ? (
                          <span className="inline-flex items-center gap-1 font-medium" style={{ color: gainColor }}>
                            {p.gainPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {fmtPct(p.gainPct)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>

                    {isOpen && p.transactions.map(t => {
                      const buyPrice  = Number(t.price_per_unit ?? 0)
                      const qty       = Number(t.quantity ?? 0)
                      const lotGainPu = p.livePrice != null && buyPrice > 0 ? p.livePrice - buyPrice : null
                      const lotGain   = lotGainPu != null ? lotGainPu * qty : null
                      const lotGainPct = lotGainPu != null && buyPrice > 0 ? (lotGainPu / buyPrice) * 100 : null
                      const lotColor  = lotGain == null ? '#9ca3af' : lotGain >= 0 ? 'var(--type-income)' : 'var(--type-expense)'
                      const dateStr   = new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      return (
                        <tr key={t.id} className="border-b border-white/[0.02] bg-white/[0.015]">
                          <td className="pl-12 pr-4 py-2.5">
                            <span className="text-xs text-white/40">{dateStr}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-xs text-white/50">
                            {qty > 0 ? qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 }) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-xs text-white/50">
                            {buyPrice > 0 ? fmt(buyPrice) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                            {p.livePrice != null ? <span className="text-white/60">{fmt(p.livePrice)}</span> : <span className="text-white/20">—</span>}
                          </td>
                          <td className="px-4 py-2.5" />
                          <td className="px-4 py-2.5" />
                          <td className="px-4 py-2.5" />
                          <td className="px-4 py-2.5" />
                          <td className="px-5 py-2.5" />
                        </tr>
                      )
                    })}
                  </>
                )
              })}
            </tbody>
          </table>

          {/* Footer */}
          {positions.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-white/[0.015] text-sm">
              <span className="text-muted text-xs">{t('port.positions', { n: positions.length })}</span>
              <div className="flex items-center gap-6">
                <span className="text-muted text-xs">{t('port.totalInv')} <span className="text-white font-medium ml-1">{fmt(totalInvested)}</span></span>
                {positions.some(p => p.totalFees > 0.005) && (
                  <span className="text-muted text-xs">{t('port.totalFees')} <span className="text-white/50 font-medium ml-1">{fmt(positions.reduce((s, p) => s + p.totalFees, 0))}</span></span>
                )}
                {hasLive && (
                  <span className="text-muted text-xs">{t('port.currentValue')} <span className="text-white font-medium ml-1">{fmt(totalCurrentVal)}</span></span>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/20 text-[10px] mt-4">
          {t('port.footer')}
        </p>
      </div>
    </div>
  )
}
