import { useMemo } from 'react'
import { useSharedData } from '../context/SharedDataContext'
import { useUIPrefs } from '../context/UIPrefContext'

// Returns the portfolio's current value using cached prices stored in user prefs.
// Prices are only refreshed when the user clicks Refresh on the Portfolio page —
// no polling, no live API calls on mount.
const isUsdTicker = t => !t.includes('.')

export function usePortfolioValue() {
  const { allTransactions } = useSharedData()
  const { prefs }           = useUIPrefs()

  return useMemo(() => {
    const cachedPrices = prefs.portfolio_prices ?? {}
    if (!Object.keys(cachedPrices).length) return null

    const eurUsdRate = prefs.eur_usd_rate?.rate ?? null

    const investTxs = allTransactions.filter(t => t.type === 'invest' && t.ticker)
    if (!investTxs.length) return null

    const qty = {}
    const dir = {}
    const sorted = [...investTxs].sort((a, b) =>
      a.date.localeCompare(b.date) || (a.created_at ?? '').localeCompare(b.created_at ?? '')
    )
    for (const tx of sorted) {
      const sym   = tx.ticker.toUpperCase()
      const q     = Number(tx.quantity ?? 0)
      const d     = tx.direction ?? 'buy'
      qty[sym]    = qty[sym] ?? 0
      if (d === 'sell') qty[sym] = Math.max(0, qty[sym] - q)
      else              qty[sym] += q
    }

    let total = 0, hasAny = false
    for (const [sym, q] of Object.entries(qty)) {
      const rawPrice = cachedPrices[sym]?.price
      if (!(rawPrice > 0) || !(q > 0.0001)) continue
      const price = isUsdTicker(sym) && eurUsdRate ? rawPrice / eurUsdRate : rawPrice
      total += price * q
      hasAny = true
    }
    return hasAny ? total : null
  }, [allTransactions, prefs.portfolio_prices, prefs.eur_usd_rate])
}
