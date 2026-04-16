/**
 * Shared budget ↔ transaction matching logic.
 * Handles both new multi-select (category_ids[]) and legacy single-value (category_id).
 */
export function txMatchesBudget(tx, budget, catMap = {}) {
  const imp = () => catMap[tx.category_id]?.importance ?? catMap[tx.subcategory_id]?.importance
  // Multi-select (new)
  if (budget.category_ids?.length)    return budget.category_ids.includes(tx.category_id)
  if (budget.subcategory_ids?.length) return budget.subcategory_ids.includes(tx.subcategory_id)
  if (budget.importance_ids?.length)  return budget.importance_ids.includes(imp())
  if (budget.receiver_ids?.length)    return budget.receiver_ids.includes(tx.receiver_id)
  // Legacy single-value
  if (budget.category_id)    return tx.category_id    === budget.category_id
  if (budget.subcategory_id) return tx.subcategory_id === budget.subcategory_id
  if (budget.importance)     return imp()              === budget.importance
  if (budget.receiver_id)    return tx.receiver_id    === budget.receiver_id
  return true // 'all' budget
}

/** Returns the active dimension key for a budget. */
export function getBudgetDimension(budget) {
  if (budget.category_ids?.length || budget.category_id)       return 'category'
  if (budget.subcategory_ids?.length || budget.subcategory_id) return 'subcategory'
  if (budget.importance_ids?.length || budget.importance)       return 'importance'
  if (budget.receiver_ids?.length || budget.receiver_id)        return 'merchant'
  return 'all'
}

/** Returns all selected IDs for a budget as an array (handles both formats). */
export function getBudgetIds(budget) {
  if (budget.category_ids?.length)    return budget.category_ids
  if (budget.category_id)             return [budget.category_id]
  if (budget.subcategory_ids?.length) return budget.subcategory_ids
  if (budget.subcategory_id)          return [budget.subcategory_id]
  if (budget.importance_ids?.length)  return budget.importance_ids
  if (budget.importance)              return [budget.importance]
  if (budget.receiver_ids?.length)    return budget.receiver_ids
  if (budget.receiver_id)             return [budget.receiver_id]
  return []
}
