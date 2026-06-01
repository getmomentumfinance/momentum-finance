// Computes per-category monthly average spending from history (excludes current month).
// Returns null if fewer than 2 months of data exist.
export function computeBaseline(allTransactions, currentDate) {
  const currentKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const monthly = {}   // { catId: { 'YYYY-MM': total } }
  const months  = new Set()

  for (const tx of allTransactions) {
    if (tx.type !== 'expense' || !tx.category_id || tx.is_split_parent) continue
    const m = tx.date.slice(0, 7)
    if (m === currentKey) continue
    months.add(m)
    if (!monthly[tx.category_id]) monthly[tx.category_id] = {}
    monthly[tx.category_id][m] = (monthly[tx.category_id][m] || 0) + Number(tx.amount)
  }

  if (months.size < 2) return null

  const n      = months.size
  const avgMap = {}
  for (const [catId, byMonth] of Object.entries(monthly)) {
    avgMap[catId] = Object.values(byMonth).reduce((s, v) => s + v, 0) / n
  }

  return { avgMap, monthCount: n }
}

// Current-month totals per category_id (expense only, no split parents).
export function currentMonthTotals(allTransactions, currentDate) {
  const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const map = {}
  for (const tx of allTransactions) {
    if (tx.type !== 'expense' || !tx.category_id || tx.is_split_parent) continue
    if (!tx.date.startsWith(key)) continue
    map[tx.category_id] = (map[tx.category_id] || 0) + Number(tx.amount)
  }
  return map
}
