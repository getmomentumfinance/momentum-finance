/**
 * Pure calculation helpers for goal simulators. No React, no Supabase —
 * easy to reuse across goal types and to reason about by hand.
 */
import { computeCardBalance } from './cardBalance'

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

/** Formats a month count as "X mo" / "X yr" / "X yr Y mo". */
export function monthsLabel(months) {
  if (!Number.isFinite(months)) return '—'
  if (months <= 0) return 'now'
  const years = Math.floor(months / 12)
  const rem   = months % 12
  if (years === 0) return `${months} mo`
  return rem === 0 ? `${years} yr` : `${years} yr ${rem} mo`
}

/**
 * The same headline numbers the house simulator shows, computed from a raw
 * goal.config (which may be sparse/partial — e.g. a fresh draft) plus live
 * shared data. Used by both the simulator and the goal list card so they
 * never disagree with each other.
 */
export function computeHouseGoalSummary(rawConfig, { categories, cards, allTransactions }) {
  const config = {
    incomes:               rawConfig?.incomes ?? [],
    category_plan:         rawConfig?.category_plan ?? {},
    extra_expenses:        rawConfig?.extra_expenses ?? [],
    emergency_fund_months: rawConfig?.emergency_fund_months ?? 3,
    savings_card_id:       rawConfig?.savings_card_id ?? null,
    house_price:           rawConfig?.house_price ?? 0,
    loan_amount:           rawConfig?.loan_amount ?? 0,
    closing_cost_pct:      rawConfig?.closing_cost_pct ?? 3,
  }

  const mainCategories = categories.filter(c => !c.parent_id)
  const plannedFor = id => config.category_plan[id] ?? monthlyAverage(allTransactions, id)

  const extraExpensesTotal = config.extra_expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const totalPlanned       = mainCategories.reduce((s, c) => s + plannedFor(c.id), 0) + extraExpensesTotal

  const combinedIncome = config.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const monthlySavings = combinedIncome - totalPlanned

  const savingsCard  = cards.find(c => c.id === config.savings_card_id) ?? null
  const currentSaved = savingsCard ? computeCardBalance(savingsCard, allTransactions) : 0
  const emergencyTarget = config.emergency_fund_months * totalPlanned

  const loanAmount        = config.house_price > 0 ? Math.min(config.loan_amount, config.house_price) : config.loan_amount
  const downPaymentAmount = Math.max(0, config.house_price - loanAmount)
  const closingCosts      = config.house_price * (config.closing_cost_pct / 100)
  const downPaymentTarget = downPaymentAmount + closingCosts

  const timeline = computeHouseTimeline({ monthlySavings, currentSaved, emergencyTarget, downPaymentTarget })

  return {
    combinedIncome, totalPlanned, monthlySavings,
    currentSaved, emergencyTarget,
    loanAmount, downPaymentAmount, closingCosts, downPaymentTarget,
    timeline,
    hasIncome: combinedIncome > 0,
    hasPrice:  config.house_price > 0,
  }
}
