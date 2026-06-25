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
    mortgage_rate_pct:     rawConfig?.mortgage_rate_pct ?? 3.5,
    mortgage_years:        rawConfig?.mortgage_years ?? 25,
    housing_category_id:   rawConfig?.housing_category_id ?? null,
    monthly_savings_override: rawConfig?.monthly_savings_override ?? null,
  }

  const mainCategories = categories.filter(c => !c.parent_id)
  const plannedFor = id => config.category_plan[id] ?? monthlyAverage(allTransactions, id)

  // Amount for a "housing source" — either a real category or a manually-added
  // planned expense (e.g. a future rent you don't pay yet, with no transaction history).
  function housingAmountFor(id) {
    if (!id) return 0
    const extra = config.extra_expenses.find(e => e.id === id)
    return extra ? (Number(extra.amount) || 0) : plannedFor(id)
  }

  const extraExpensesTotal = config.extra_expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const totalPlanned       = mainCategories.reduce((s, c) => s + plannedFor(c.id), 0) + extraExpensesTotal

  const combinedIncome = config.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  // `monthlySavings` stays an honest income-minus-spending number always (so the
  // Spending step's own breakdown never lies about what your categories add up to).
  // `effectiveMonthlySavings` is what timelines are actually computed from — it's the
  // same number unless the user has explicitly pinned a different target via the
  // goal card's "Set as new monthly savings" action (monthly_savings_override).
  const monthlySavings = combinedIncome - totalPlanned
  const hasSavingsOverride   = config.monthly_savings_override != null
  const effectiveMonthlySavings = hasSavingsOverride ? config.monthly_savings_override : monthlySavings

  const savingsCard  = cards.find(c => c.id === config.savings_card_id) ?? null
  const currentSaved = savingsCard ? computeCardBalance(savingsCard, allTransactions) : 0
  const emergencyTarget = config.emergency_fund_months * totalPlanned

  const loanAmount        = config.house_price > 0 ? Math.min(config.loan_amount, config.house_price) : config.loan_amount
  const downPaymentAmount = Math.max(0, config.house_price - loanAmount)
  const closingCosts      = config.house_price * (config.closing_cost_pct / 100)
  const downPaymentTarget = downPaymentAmount + closingCosts

  const timeline = computeHouseTimeline({ monthlySavings: effectiveMonthlySavings, currentSaved, emergencyTarget, downPaymentTarget })

  const mortgagePayment = computeMortgagePayment(loanAmount, config.mortgage_rate_pct, config.mortgage_years)
  const housingCategoryAmount  = housingAmountFor(config.housing_category_id)
  const remainingAfterMortgage = combinedIncome - mortgagePayment - (totalPlanned - housingCategoryAmount)

  return {
    combinedIncome, totalPlanned, monthlySavings, effectiveMonthlySavings, hasSavingsOverride,
    currentSaved, emergencyTarget,
    loanAmount, downPaymentAmount, closingCosts, downPaymentTarget,
    timeline, mortgagePayment, remainingAfterMortgage,
    hasIncome: combinedIncome > 0,
    hasPrice:  config.house_price > 0,
  }
}

/**
 * Single-target savings goals (car, vacation, emergency fund) — much simpler
 * than the house goal: one target amount, one directly-set monthly
 * contribution (not derived from income/spending — each of these is its own
 * separate "envelope"), one optional linked card for the real current balance.
 */
export function computeSimpleSavingsGoalSummary(type, rawConfig, { categories, cards, allTransactions }) {
  const config = {
    target_amount:          rawConfig?.target_amount ?? 0,
    emergency_fund_months:  rawConfig?.emergency_fund_months ?? 3,
    monthly_contribution:   rawConfig?.monthly_contribution ?? 0,
    savings_card_id:        rawConfig?.savings_card_id ?? null,
    manual_saved_amount:    rawConfig?.manual_saved_amount ?? 0,
  }

  let target
  if (type === 'fund') {
    const mainCategories = categories.filter(c => !c.parent_id)
    const totalPlanned = mainCategories.reduce((s, c) => s + monthlyAverage(allTransactions, c.id), 0)
    target = config.emergency_fund_months * totalPlanned
  } else if (type === 'gift') {
    // Recurring annual pot — the "target" is derived from the monthly top-up,
    // not the other way around (there's no fixed end date to save toward).
    target = config.monthly_contribution * 12
  } else {
    target = config.target_amount
  }

  const savingsCard  = cards.find(c => c.id === config.savings_card_id) ?? null
  const currentSaved = savingsCard ? computeCardBalance(savingsCard, allTransactions) : config.manual_saved_amount

  const monthlyContribution = config.monthly_contribution
  const remaining = Math.max(0, target - currentSaved)
  const monthsToTarget = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : Infinity
  const pct = target > 0 ? Math.min(100, (currentSaved / target) * 100) : 0

  return {
    target, currentSaved, monthlyContribution, remaining, monthsToTarget, pct,
    hasTarget: target > 0,
    hasContribution: monthlyContribution > 0,
  }
}
