import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { fetchLivePrice, fetchHistoricalPrice } from '../lib/yahooFinance'

/**
 * Returns the live current value of the user's portfolio.
 * - Sums tracked invest transactions (qty × live price)
 * - Adds per-ticker initial balances from user_metadata
 * - Refreshes every 60s and on 'transaction-saved'
 */
export function usePortfolioValue(user) {
  const [currentValue, setCurrentValue] = useState(null)
  const abortRef = useRef(null)

  const compute = useCallback(async () => {
    if (!user?.id) return

    // Cancel any in-flight fetch
    if (abortRef.current) abortRef.current.cancelled = true
    const token = { cancelled: false }
    abortRef.current = token

    // Normalise balance format: old = number, new = { amount, date }
    const rawBalances = user?.user_metadata?.portfolio_ticker_balances ?? {}
    const tickerBalances = Object.fromEntries(
      Object.entries(rawBalances).map(([t, v]) => [
        t,
        typeof v === 'object' && v !== null ? v : { amount: Number(v), date: null },
      ])
    )

    const { data: txs } = await supabase
      .from('transactions')
      .select('ticker, quantity, price_per_unit, amount')
      .eq('user_id', user.id)
      .eq('type', 'invest')
      .eq('is_deleted', false)
      .not('ticker', 'is', null)

    if (token.cancelled) return

    // Group quantities by ticker
    const grouped = {}
    ;(txs ?? []).forEach(t => {
      const ticker = t.ticker.toUpperCase()
      if (!grouped[ticker]) grouped[ticker] = 0
      grouped[ticker] += Number(t.quantity ?? 0)
    })

    // Combine with tickers that only have an initial balance
    const allTickers = new Set([...Object.keys(grouped), ...Object.keys(tickerBalances)])

    if (allTickers.size === 0) { setCurrentValue(0); return }

    // Fetch live prices + historical prices (for initial balance qty conversion) in parallel
    const [prices, historicalResults] = await Promise.all([
      Promise.all(
        [...allTickers].map(ticker => fetchLivePrice(ticker).then(r => ({ ticker, price: r?.price ?? null })))
      ),
      Promise.all(
        Object.entries(tickerBalances)
          .filter(([, b]) => b.date && b.amount > 0)
          .map(([ticker, b]) =>
            fetchHistoricalPrice(ticker, b.date)
              .then(p => ({ ticker, histPrice: p }))
              .catch(() => ({ ticker, histPrice: null }))
          )
      ),
    ])
    if (token.cancelled) return

    const priceMap = Object.fromEntries(prices.map(p => [p.ticker, p.price]))
    const histPriceMap = Object.fromEntries(historicalResults.map(r => [r.ticker, r.histPrice]))

    // Compute initial qty for each ticker with a balance (qty = amount / historicalPrice)
    const initialQtyMap = {}
    for (const [ticker, b] of Object.entries(tickerBalances)) {
      if (b.amount > 0) {
        const hp = histPriceMap[ticker]
        initialQtyMap[ticker] = hp && hp > 0 ? b.amount / hp : 0
      }
    }

    let total = 0
    let hasAnyLive = false
    allTickers.forEach(ticker => {
      const livePrice  = priceMap[ticker]
      const txQty      = grouped[ticker] ?? 0
      const initQty    = initialQtyMap[ticker] ?? 0
      const totalQty   = txQty + initQty
      const initBal    = tickerBalances[ticker]?.amount ?? 0
      if (livePrice != null) {
        total += livePrice * totalQty
        hasAnyLive = true
      } else {
        // No live price: fall back to cost basis for tracked qty + static initial balance
        const trackedCost = (txs ?? [])
          .filter(t => t.ticker?.toUpperCase() === ticker)
          .reduce((s, t) => s + Number(t.amount), 0)
        total += trackedCost + initBal
      }
    })

    setCurrentValue(hasAnyLive || allTickers.size > 0 ? total : null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, JSON.stringify(user?.user_metadata?.portfolio_ticker_balances)])

  useEffect(() => {
    compute()
    const interval = setInterval(compute, 60_000)
    window.addEventListener('transaction-saved', compute)
    return () => {
      clearInterval(interval)
      window.removeEventListener('transaction-saved', compute)
      if (abortRef.current) abortRef.current.cancelled = true
    }
  }, [compute])

  return currentValue
}
