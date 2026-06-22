/**
 * Shared card balance calculation.
 * Never copy-paste this — fix it here and it propagates everywhere.
 */
const CREDIT_TYPES = new Set(['income'])

export function computeCardBalance(card, transactions) {
  const delta = transactions
    .filter(t => t.card_id === card.id)
    .reduce((sum, t) => sum + (CREDIT_TYPES.has(t.type) ? t.amount : -t.amount), 0)
  return Number(card.initial_balance) + delta
}
