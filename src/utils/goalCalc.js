/**
 * Pure calculation helpers for goal simulators. No React, no Supabase —
 * easy to reuse across goal types and to reason about by hand.
 */

/** Sum of expense amounts for a main category, optionally scoped to one 'YYYY-MM' month. */
export function mainCategorySpend(transactions, categoryId, monthKey = null) {
  return transactions
    .filter(t =>
      t.type === 'expense' &&
      t.category_id === categoryId &&
      (!monthKey || t.date.slice(0, 7) === monthKey)
    )
    .reduce((s, t) => s + Number(t.amount), 0)
}

/** Average monthly spend for a main category (sum / distinct months it appears in). */
export function monthlyAverage(transactions, categoryId) {
  const months = new Set()
  let total = 0
  for (const t of transactions) {
    if (t.type !== 'expense' || t.category_id !== categoryId) continue
    total += Number(t.amount)
    months.add(t.date.slice(0, 7))
  }
  return months.size > 0 ? total / months.size : 0
}

/** Standard amortization formula. Returns the fixed monthly payment. */
export function computeMortgagePayment(loanAmount, annualRatePct, years) {
  if (loanAmount <= 0 || years <= 0) return 0
  const n = years * 12
  const r = (annualRatePct / 100) / 12
  if (r === 0) return loanAmount / n
  return loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
}

/**
 * Sequential savings timeline: build the emergency fund first, then save for
 * the down payment + closing costs. Returns months for each leg and the total.
 */
export function computeHouseTimeline({ monthlySavings, currentSaved, emergencyTarget, downPaymentTarget }) {
  if (monthlySavings <= 0) {
    return { monthsToEmergencyFund: Infinity, monthsToDownPayment: Infinity, totalMonths: Infinity }
  }
  const emergencyGap = Math.max(0, emergencyTarget - currentSaved)
  const monthsToEmergencyFund = Math.ceil(emergencyGap / monthlySavings)
  const monthsToDownPayment   = Math.ceil(downPaymentTarget / monthlySavings)
  return {
    monthsToEmergencyFund,
    monthsToDownPayment,
    totalMonths: monthsToEmergencyFund + monthsToDownPayment,
  }
}
