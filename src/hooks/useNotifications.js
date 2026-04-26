import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { usePreferences } from '../context/UserPreferencesContext'
import { useSharedData } from '../context/SharedDataContext'
import { txMatchesBudget } from '../utils/budgetMatch'
import { getPeriodBounds, getPreviousPeriodBounds } from '../utils/budgetPeriod'

function getPeriodKey(frequency, date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  if (frequency === 'monthly')   return `${y}-${String(m).padStart(2, '0')}`
  if (frequency === 'quarterly') return `${y}-Q${Math.ceil(m / 3)}`
  return `${y}`
}

const SEVERITY_ORDER = { alert: 0, warning: 1, info: 2 }

export function useNotifications(userId, currentDate) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const { fmt: fmtAmt } = usePreferences()
  const { pendingItems, plannedBills, recurringBills, billPayments, subscriptions, subPayments } = useSharedData()

  const load = useCallback(async () => {
    if (!userId) return
    const today    = new Date(); today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().slice(0, 10)
    const in3dStr  = new Date(today.getTime() + 3 * 86400000).toISOString().slice(0, 10)

    const year  = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const actions = []

    // 1. Overdue pending items — filter from shared context
    for (const p of pendingItems) {
      if (!p.pay_before || p.pay_before >= todayStr) continue
      const daysAgo = Math.round((today - new Date(p.pay_before + 'T00:00:00')) / 86400000)
      actions.push({
        id: `pending-${p.id}`, type: 'pending', recordId: p.id,
        severity: 'alert', label: p.name,
        detail: `${daysAgo}d overdue · ${fmtAmt(p.amount)}`,
        amount: p.amount, period: null, canPay: true,
      })
    }

    // 2. Planned bills due in ≤3 days — filter from shared context
    for (const p of plannedBills) {
      if (!p.pay_before || p.pay_before < todayStr || p.pay_before > in3dStr) continue
      const daysLeft = Math.round((new Date(p.pay_before + 'T00:00:00') - today) / 86400000)
      actions.push({
        id: `planned-${p.id}`, type: 'planned', recordId: p.id,
        severity: daysLeft === 0 ? 'alert' : 'warning', label: p.name,
        detail: `${daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`} · ${fmtAmt(p.amount)}`,
        amount: p.amount, period: null, canPay: true,
      })
    }

    // 3. Recurring bills due in ≤3 days (unpaid) — from shared context
    for (const b of recurringBills) {
      const period = getPeriodKey(b.frequency, currentDate)
      if (billPayments.some(p => p.bill_id === b.id && p.period === period)) continue
      const lastDay = new Date(year, month + 1, 0).getDate()
      const dueDate = new Date(year, month, Math.min(b.due_day, lastDay))
      const daysLeft = Math.round((dueDate - today) / 86400000)
      if (daysLeft <= 3) {
        const badge = daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue`
                    : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`
        actions.push({
          id: `bill-${b.id}`, type: 'bill', recordId: b.id,
          severity: daysLeft <= 0 ? 'alert' : 'warning', label: b.name,
          detail: `${badge} · ${fmtAmt(b.amount)}`,
          amount: b.amount, period, canPay: true,
        })
      }
    }

    // 4. Subscriptions renewing in ≤7 days (unpaid) — from shared context
    const subPeriod = getPeriodKey('monthly', currentDate)
    for (const s of subscriptions) {
      if (subPayments.some(p => p.subscription_id === s.id && p.period === subPeriod)) continue
      const lastDay = new Date(year, month + 1, 0).getDate()
      const dueDate = new Date(year, month, Math.min(s.billing_day, lastDay))
      const daysLeft = Math.round((dueDate - today) / 86400000)
      if (daysLeft >= 0 && daysLeft <= 7) {
        actions.push({
          id: `sub-${s.id}`, type: 'sub', recordId: s.id,
          severity: 'info', label: s.name,
          detail: `Renewing ${daysLeft === 0 ? 'today' : `in ${daysLeft}d`} · ${fmtAmt(s.amount)}/mo`,
          amount: s.amount, period: subPeriod, canPay: true,
        })
      }
    }

    // 5. Budgets ≥80% used — still needs own fetch (budget-specific data)
    const [{ data: budgets }, { data: yearExpenses }, { data: categories }] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', userId),
      supabase.from('transactions').select('category_id, subcategory_id, receiver_id, card_id, amount, date, importance')
        .eq('user_id', userId).eq('is_deleted', false).eq('type', 'expense')
        .eq('is_split_parent', false)
        .gte('date', `${currentDate.getFullYear()}-01-01`)
        .lte('date', `${currentDate.getFullYear()}-12-31`),
      supabase.from('categories').select('id, name, importance').eq('user_id', userId),
    ])

    const catMap = Object.fromEntries((categories ?? []).map(c => [c.id, c]))

    for (const b of budgets ?? []) {
      if (b.monthly_limit <= 0) continue
      const effectiveLimit = b.monthly_limit + (b.rollover_amount ?? 0)
      const { startStr, endStr } = getPeriodBounds(b.period ?? 'monthly', currentDate, b.reset_day)
      const spent = (yearExpenses ?? [])
        .filter(t =>
          t.date >= startStr && t.date <= endStr &&
          (!b.card_id || t.card_id === b.card_id) &&
          txMatchesBudget(t, b, catMap)
        )
        .reduce((s, t) => s + t.amount, 0)

      const pct = (spent / effectiveLimit) * 100
      if (pct >= 80) {
        const cat = catMap[b.category_id ?? b.subcategory_id]
        actions.push({
          id: `budget-${b.id}-${startStr}`, type: 'budget', recordId: b.id,
          severity: pct >= 100 ? 'alert' : 'warning',
          label: b.name || cat?.name || 'Budget',
          detail: pct >= 100
            ? `Over by ${fmtAmt(spent - effectiveLimit)}`
            : `${Math.round(pct)}% of ${fmtAmt(effectiveLimit)} used`,
          amount: null, period: null, canPay: false,
        })
      }
    }

    // 6. Period budget leftovers
    const periodBudgets = (budgets ?? []).filter(b => b.period && b.period !== 'monthly' || (b.period === 'monthly' && b.card_id))
      .filter(b => b.card_id)

    if (periodBudgets.length) {
      const { data: resolutions } = await supabase
        .from('budget_period_resolutions')
        .select('budget_id, period_key')
        .eq('user_id', userId)
        .in('budget_id', periodBudgets.map(b => b.id))

      const resolvedSet = new Set((resolutions ?? []).map(r => `${r.budget_id}::${r.period_key}`))

      for (const b of periodBudgets) {
        if (b.monthly_limit <= 0) continue
        const { startStr: prevStart, endStr: prevEnd } = getPreviousPeriodBounds(b.period ?? 'monthly', currentDate, b.reset_day)
        const periodKey = `${prevStart}__${prevEnd}`
        if (resolvedSet.has(`${b.id}::${periodKey}`)) continue

        const prevSpent = (yearExpenses ?? [])
          .filter(t =>
            t.date >= prevStart && t.date <= prevEnd &&
            (!b.card_id || t.card_id === b.card_id) &&
            txMatchesBudget(t, b, catMap)
          )
          .reduce((s, t) => s + t.amount, 0)

        const leftover = b.monthly_limit - prevSpent
        if (leftover <= 0) continue

        const cat = catMap[b.category_id ?? b.subcategory_id]
        const budgetName = b.name || cat?.name || 'Budget'
        actions.push({
          id: `rollover-${b.id}-${periodKey}`,
          type: 'rollover',
          recordId: b.id,
          severity: 'info',
          label: `${budgetName} · Period ended`,
          detail: `${fmtAmt(leftover)} leftover — choose what to do`,
          amount: leftover,
          period: periodKey,
          canPay: false,
          budget: b,
          leftover,
          prevPeriodKey: periodKey,
        })
      }
    }

    // 7. Price change alerts
    const { data: priceAlerts } = await supabase
      .from('price_change_alerts').select('*')
      .eq('user_id', userId).eq('resolved', false)

    for (const a of priceAlerts ?? []) {
      const diff = a.actual_amount - a.expected_amount
      const yearlyDiff = Math.abs(diff * 12)
      const sign = diff > 0 ? '+' : '-'
      actions.push({
        id: `price-change-${a.id}`, type: 'price_change', recordId: a.id,
        source: a.source, sourceId: a.record_id,
        severity: 'warning', label: `${a.name} price ${diff > 0 ? 'increased' : 'decreased'}`,
        detail: `${fmtAmt(a.expected_amount)} → ${fmtAmt(a.actual_amount)} (${sign}${fmtAmt(yearlyDiff)}/yr)`,
        expectedAmount: a.expected_amount, actualAmount: a.actual_amount,
        canPay: false,
      })
    }

    actions.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    setItems(actions)
    setLoading(false)
  }, [userId, currentDate, pendingItems, plannedBills, recurringBills, billPayments, subscriptions, subPayments])

  useEffect(() => {
    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [load])

  return { items, loading }
}
