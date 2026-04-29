import { useMemo } from 'react'
import { useSharedData } from '../context/SharedDataContext'
import { useUIPrefs } from '../context/UIPrefContext'

// Returns the portfolio's current value using cached prices stored in user prefs.
// Prices are only refreshed when the user clicks Refresh on the Portfolio page —
// no polling, no live API calls on mount.
export function usePortfolioValue() {
  const { allTransactions } = useSharedData()
  const { prefs }           = useUIPrefs()

  return useMemo(() => {
    const cachedPrices = prefs.portfolio_prices ?? {}
    if (!Object.keys(cachedPrices).length) return null

    const investTxs = allTransactions.filter(t => t.type === 'invest' && t.ticker)
    if (!investTxs.length) return null

    const qty = {}
    for (const tx of investTxs) {
      const sym = tx.ticker.toUpperCase()
      qty[sym] = (qty[sym] ?? 0) + Number(tx.quantity ?? 0)
    }

    let total = 0, hasAny = false
    for (const [sym, q] of Object.entries(qty)) {
      const p = cachedPrices[sym]?.price
      if (p > 0 && q > 0) { total += p * q; hasAny = true }
    }
    return hasAny ? total : null
  }, [allTransactions, prefs.portfolio_prices])
}
