import { useState, useMemo } from 'react'
import { Plus, RefreshCw, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronRight, Clock, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/dashboard/Navbar'
import { usePreferences } from '../context/UserPreferencesContext'
import { useSharedData } from '../context/SharedDataContext'
import { useUIPrefs } from '../context/UIPrefContext'
import { useTransactionModal } from '../context/TransactionModalContext'
import { fetchLivePrice } from '../lib/yahooFinance'

const fmtPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

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

function timeAgo(isoStr) {
  if (!isoStr) return null
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Portfolio() {
  const { user }                    = useAuth()
  const { fmt, t }                  = usePreferences()
  const { allTransactions }         = useSharedData()
  const { prefs, setPref }          = useUIPrefs()
  const { openTransactionModal }    = useTransactionModal()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [refreshing,  setRefreshing]  = useState(false)
  const [priceError,  setPriceError]  = useState(false)
  const [expanded,    setExpanded]    = useState({})

  const cachedPrices = prefs.portfolio_prices ?? {}

  // ── Positions derived from SharedDataContext allTransactions ─────────────
  const positions = useMemo(() => {
    const investTxs = allTransactions.filter(t => t.type === 'invest' && t.ticker)
    if (!investTxs.length) return []

    const grouped = {}
    for (const tx of investTxs) {
      const sym = tx.ticker.toUpperCase()
      if (!grouped[sym]) grouped[sym] = { qty: 0, cost: 0, fees: 0, txs: [] }
      const qty  = Number(tx.quantity ?? 0)
      const ppu  = Number(tx.price_per_unit ?? 0)
      const pure = qty * ppu
      const fees = Number(tx.amount) - pure
      grouped[sym].qty  += qty
      grouped[sym].cost += pure > 0 ? pure : Number(tx.amount)
      grouped[sym].fees += fees > 0 ? fees : 0
      grouped[sym].txs.push(tx)
    }

    return Object.entries(grouped).map(([ticker, g]) => {
      const cached     = cachedPrices[ticker]
      const livePrice  = cached?.price ?? null
      const currentVal = livePrice != null && g.qty > 0 ? livePrice * g.qty : null
      const gainLoss   = currentVal != null ? currentVal - g.cost : null
      const gainPct    = gainLoss != null && g.cost > 0 ? (gainLoss / g.cost) * 100 : null
      return {
        ticker,
        name:       cached?.name       ?? null,
        updatedAt:  cached?.updatedAt  ?? null,
        totalCost:  g.cost,
        totalQty:   g.qty,
        totalFees:  g.fees,
        avgBuy:     g.qty > 0 ? g.cost / g.qty : 0,
        livePrice,
        currentVal,
        gainLoss,
        gainPct,
        transactions: g.txs.sort((a, b) => b.date.localeCompare(a.date)),
      }
    })
  }, [allTransactions, cachedPrices])

  // ── Delete a single invest transaction ───────────────────────────────────
  async function deleteTx(id) {
    if (!window.confirm('Delete this investment entry?')) return
    await supabase.from('transactions').update({ is_deleted: true }).eq('id', id)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
  }

  // ── Refresh — fetch live prices and cache them in prefs ───────────────────
  async function refresh() {
    if (!user?.id) return
    setRefreshing(true)
    setPriceError(false)

    const tickers = [...new Set(
      allTransactions.filter(t => t.type === 'invest' && t.ticker).map(t => t.ticker.toUpperCase())
    )]
    if (!tickers.length) { setRefreshing(false); return }

    let anyError = false
    const results = await Promise.all(tickers.map(async ticker => {
      const r = await fetchLivePrice(ticker)
      if (!r) { anyError = true; return { ticker, price: null, name: null } }
      return { ticker, price: r.price, name: r.name }
    }))
    setPriceError(anyError)

    const next = { ...cachedPrices }
    const now  = new Date().toISOString()
    for (const { ticker, price, name } of results) {
      if (price != null) next[ticker] = { price, name, updatedAt: now }
    }
    setPref('portfolio_prices', next)
    setRefreshing(false)
  }

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalInvested   = positions.reduce((s, p) => s + p.totalCost, 0)
  const hasLive         = positions.some(p => p.currentVal != null)
  const totalCurrentVal = positions.filter(p => p.currentVal != null).reduce((s, p) => s + p.currentVal, 0)
  const totalGainLoss   = hasLive ? totalCurrentVal - totalInvested : null
  const totalGainPct    = totalGainLoss != null && totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : null

  const lastUpdated = useMemo(() => {
    const times = Object.values(cachedPrices).map(p => p.updatedAt).filter(Boolean)
    if (!times.length) return null
    return times.reduce((a, b) => a > b ? a : b)
  }, [cachedPrices])

  const hasCachedPrices = Object.keys(cachedPrices).length > 0

  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar
        currentDate={currentDate}
        onPrev={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        onNext={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
      />

      <div id="page-content" className="py-6 px-4 md:px-8 lg:px-16 pb-24 lg:pb-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('port.title')}</h1>
            <p className="text-muted text-sm mt-1">{t('port.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && !refreshing && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <Clock size={11} />
                {timeAgo(lastUpdated)}
              </span>
            )}
            <button
              onClick={() => openTransactionModal({ type: 'invest' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm hover:bg-accent/25 transition-colors"
            >
              <Plus size={13} />
              Add
            </button>
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

        {positions.length === 0 && !hasCachedPrices && (
          <div className="glass-card rounded-2xl flex flex-col items-center justify-center gap-4 py-20 text-center">
            <TrendingUp size={36} className="text-white/15" />
            <div>
              <p className="text-white/50 text-sm">No investments yet.</p>
              <p className="text-white/30 text-xs mt-1">Click <strong className="text-white/50">Add</strong> to log your first investment.</p>
            </div>
            <button
              onClick={() => openTransactionModal({ type: 'invest' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm hover:bg-accent/25 transition-colors"
            >
              <Plus size={13} />
              Add Investment
            </button>
          </div>
        )}

        {positions.length > 0 && <>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label={t('port.totalInvested')} value={fmt(totalInvested)} />
            <StatCard
              label={t('port.currentValue')}
              value={hasLive ? fmt(totalCurrentVal) : '—'}
              sub={!hasLive ? (hasCachedPrices ? undefined : 'Refresh to load prices') : undefined}
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm border-collapse">
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
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {positions.map(p => {
                    const gainColor  = p.gainLoss == null ? '#9ca3af' : p.gainLoss >= 0 ? 'var(--type-income)' : 'var(--type-expense)'
                    const alloc      = totalInvested > 0 ? (p.totalCost / totalInvested) * 100 : 0
                    const isOpen     = !!expanded[p.ticker]
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
                                <span className="font-semibold text-white">{p.ticker}</span>
                                {p.name && <span className="text-[11px] text-white/50 truncate max-w-[200px]">{p.name}</span>}
                                <span className="text-[10px] text-muted">
                                  {alloc.toFixed(1)}% · {p.transactions.length} lot{p.transactions.length !== 1 ? 's' : ''}
                                </span>
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
                              : <button onClick={e => { e.stopPropagation(); refresh() }} className="text-white/20 hover:text-accent text-xs transition-colors">Refresh</button>}
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
                            {p.gainLoss != null ? (p.gainLoss >= 0 ? '+' : '') + fmt(p.gainLoss) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums">
                            {p.gainPct != null ? (
                              <span className="inline-flex items-center gap-1 font-medium" style={{ color: gainColor }}>
                                {p.gainPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {fmtPct(p.gainPct)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3.5" />
                        </tr>

                        {/* Lot rows */}
                        {isOpen && p.transactions.map(tx => {
                          const buyPrice   = Number(tx.price_per_unit ?? 0)
                          const qty        = Number(tx.quantity ?? 0)
                          const lotGainPu  = p.livePrice != null && buyPrice > 0 ? p.livePrice - buyPrice : null
                          const lotGain    = lotGainPu != null ? lotGainPu * qty : null
                          const lotGainPct = lotGainPu != null && buyPrice > 0 ? (lotGainPu / buyPrice) * 100 : null
                          const lotColor   = lotGain == null ? '#9ca3af' : lotGain >= 0 ? 'var(--type-income)' : 'var(--type-expense)'
                          const dateStr    = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          return (
                            <tr key={tx.id} className="group border-b border-white/[0.02] bg-white/[0.015]">
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
                              <td className="px-4 py-2.5 text-right tabular-nums text-xs text-white/50">
                                {fmt(qty * (buyPrice || 0))}
                              </td>
                              <td className="px-4 py-2.5" />
                              <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                                {p.livePrice != null && qty > 0 ? <span className="text-white/60">{fmt(p.livePrice * qty)}</span> : <span className="text-white/20">—</span>}
                              </td>
                              <td className="px-4 py-2.5 text-right tabular-nums text-xs font-medium" style={{ color: lotColor }}>
                                {lotGain != null ? (lotGain >= 0 ? '+' : '') + fmt(lotGain) : '—'}
                              </td>
                              <td className="px-5 py-2.5 text-right tabular-nums text-xs font-medium" style={{ color: lotColor }}>
                                {lotGainPct != null ? fmtPct(lotGainPct) : '—'}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button type="button" onClick={e => { e.stopPropagation(); openTransactionModal(tx) }}
                                    className="text-white/30 hover:text-white/70 transition-colors">
                                    <Pencil size={12} />
                                  </button>
                                  <button type="button" onClick={e => { e.stopPropagation(); deleteTx(tx.id) }}
                                    className="text-white/30 hover:text-red-400 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
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

            {/* Footer */}
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
          </div>

          <p className="text-center text-white/20 text-[10px] mt-4">{t('port.footer')}</p>
        </>}

      </div>
    </div>
  )
}
