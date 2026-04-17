/**
 * Single source of truth for budget period math and spend calculation.
 * Every widget, page, and hook that shows budget numbers must import from here.
 * Never copy-paste these functions — fix them here and they propagate everywhere.
 */
import { txMatchesBudget } from './budgetMatch'

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns a YYYY-MM-DD string using LOCAL date parts (avoids UTC offset shift). */
export function toLocalStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Returns { startStr, endStr } (YYYY-MM-DD) for the period that contains refDate.
 * resetDay: weekly → 0=Mon…6=Sun; monthly → 1-28 (day of month reset starts).
 */
export function getPeriodBounds(period, refDate, resetDay) {
  const y = refDate.getFullYear()
  const m = refDate.getMonth()

  if (period === 'weekly') {
    const startJsDow = ((resetDay ?? 0) + 1) % 7
    const dow  = refDate.getDay()
    const diff = (dow - startJsDow + 7) % 7
    const start = new Date(refDate)
    start.setDate(refDate.getDate() - diff)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { startStr: toLocalStr(start), endStr: toLocalStr(end) }
  }

  if (period === 'quarterly') {
    const q = Math.floor(m / 3)
    return {
      startStr: toLocalStr(new Date(y, q * 3, 1)),
      endStr:   toLocalStr(new Date(y, q * 3 + 3, 0)),
    }
  }

  if (period === 'yearly') {
    return { startStr: `${y}-01-01`, endStr: `${y}-12-31` }
  }

  // monthly (default)
  const rd = resetDay ?? 1
  let sy = y, sm = m
  if (refDate.getDate() < rd) { sm--; if (sm < 0) { sm = 11; sy-- } }
  const nextStart = new Date(sy, sm + 1, rd)
  const end = new Date(nextStart.getTime() - 86400000)
  return {
    startStr: toLocalStr(new Date(sy, sm, rd)),
    endStr:   toLocalStr(end),
  }
}

/** Returns the previous period bounds (one period before the one containing refDate). */
export function getPreviousPeriodBounds(period, refDate, resetDay) {
  const { startStr } = getPeriodBounds(period, refDate, resetDay)
  const prevDate = new Date(startStr + 'T00:00:00')
  prevDate.setDate(prevDate.getDate() - 1)
  return getPeriodBounds(period, prevDate, resetDay)
}

/**
 * Returns 0-100 (% through the current period), or null if refDate is outside the period.
 * Used for the pacing marker on progress bars.
 */
export function getPeriodPct(period, currentDate, resetDay) {
  const { startStr, endStr } = getPeriodBounds(period ?? 'monthly', currentDate, resetDay)
  const start = new Date(startStr + 'T00:00:00')
  const end   = new Date(endStr   + 'T23:59:59')
  const now   = new Date()
  if (now < start || now > end) return null
  const totalDays   = Math.round((end - start) / 86400000) + 1
  const daysElapsed = Math.max(1, Math.round((now - start) / 86400000) + 1)
  return Math.min((daysElapsed / totalDays) * 100, 100)
}

// ── Spend calculation ─────────────────────────────────────────────────────────

/**
 * Returns the total spend for a single budget in its current period.
 * @param {object} budget  - Budget row from DB (select('*'))
 * @param {Array}  expenses - Pre-fetched expense transactions (must include:
 *                           category_id, subcategory_id, receiver_id, card_id,
 *                           importance, amount, date)
 * @param {Date}   currentDate - The reference date for period calculation
 */
export function calcBudgetSpend(budget, expenses, currentDate) {
  const { startStr, endStr } = getPeriodBounds(budget.period ?? 'monthly', currentDate, budget.reset_day)
  return expenses
    .filter(t =>
      t.date >= startStr && t.date <= endStr &&
      (!budget.card_id || t.card_id === budget.card_id) &&
      txMatchesBudget(t, budget)
    )
    .reduce((s, t) => s + t.amount, 0)
}

/**
 * Returns { spend } keyed by budget id for an array of budgets.
 * Avoids repeated iteration — one pass over expenses per budget.
 */
export function calcAllBudgetSpends(budgets, expenses, currentDate) {
  const result = {}
  for (const b of budgets) {
    result[b.id] = calcBudgetSpend(b, expenses, currentDate)
  }
  return result
}

// ── Budget label / meta derivation ───────────────────────────────────────────

/**
 * Derives display metadata for a budget from its dimension fields.
 * Returns { label, subtitle, color, icon, imp } where:
 *   - label: primary display name
 *   - subtitle: secondary line (e.g. joined category names when budget has a custom name)
 *   - color: CSS color string or undefined
 *   - icon: icon identifier or undefined
 *   - imp: importance object { value, label, color, dots } or null
 */
export function getBudgetMeta(budget, catMap, importanceLevels, receiverMap = {}) {
  const b = budget

  if (b.category_ids?.length) {
    const cats = b.category_ids.map(id => catMap[id]).filter(Boolean)
    const sub  = cats.map(c => c.name).join(' · ')
    return { label: b.name || sub || '—', subtitle: b.name ? sub : null, color: cats[0]?.color, icon: undefined, imp: null }
  }
  if (b.subcategory_ids?.length) {
    const cats = b.subcategory_ids.map(id => catMap[id]).filter(Boolean)
    const sub  = cats.map(c => c.name).join(' · ')
    return { label: b.name || sub || '—', subtitle: b.name ? sub : null, color: cats[0]?.color, icon: undefined, imp: null }
  }
  if (b.importance_ids?.length) {
    const imps = b.importance_ids.map(v => importanceLevels.find(i => i.value === v)).filter(Boolean)
    const sub  = imps.map(i => i.label).join(' · ')
    const imp  = !b.name && imps.length === 1 ? imps[0] : null
    return { label: b.name || sub || '—', subtitle: b.name ? sub : null, color: imps[0]?.color, icon: undefined, imp }
  }
  if (b.receiver_ids?.length) {
    const recs = b.receiver_ids.map(id => receiverMap[id]).filter(Boolean)
    const sub  = recs.map(r => r.name).join(' · ')
    return { label: b.name || sub || '—', subtitle: b.name ? sub : null, color: undefined, icon: undefined, imp: null }
  }

  // Legacy single-value
  if (b.category_id) {
    const cat = catMap[b.category_id]
    return { label: b.name || cat?.name || '—', subtitle: null, color: cat?.color, icon: b.name ? undefined : cat?.icon, imp: null }
  }
  if (b.subcategory_id) {
    const cat = catMap[b.subcategory_id]
    return { label: b.name || cat?.name || '—', subtitle: null, color: cat?.color, icon: b.name ? undefined : cat?.icon, imp: null }
  }
  if (b.importance) {
    const imp = importanceLevels.find(i => i.value === b.importance)
    return { label: b.name || null, subtitle: null, color: b.name ? imp?.color : undefined, icon: undefined, imp: b.name ? null : imp }
  }
  if (b.receiver_id) {
    const rec = receiverMap[b.receiver_id]
    return { label: b.name || rec?.name || '—', subtitle: null, color: undefined, icon: undefined, imp: null }
  }

  // All-spend (no dimension)
  return { label: b.name || 'Total', subtitle: null, color: undefined, icon: undefined, imp: null }
}
