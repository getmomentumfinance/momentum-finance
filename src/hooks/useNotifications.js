import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { usePreferences } from '../context/UserPreferencesContext'
import { useSharedData } from '../context/SharedDataContext'
import { txMatchesBudget } from '../utils/budgetMatch'
import { getPeriodBounds, getPreviousPeriodBounds } from '../utils/budgetPeriod'

const SEVERITY_ORDER = { alert: 0, warning: 1, info: 2 }

export function useNotifications(userId, currentDate) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const { fmt: fmtAmt } = usePreferences()
  const shared = useSharedData()

  // Use a ref so load() always reads the latest context values
  // without needing them as useCallback deps (which would cause infinite loops)
  const sharedRef = useRef({})
  sharedRef.current = {
    budgets:         shared.budgets,
    allTransactions: shared.allTransactions,
    categories:      shared.categories,
    categoryMap:     shared.categoryMap,
  }

  const load = useCallback(async () => {
    if (!userId) return

    const actions = []

    // 1. Budgets ≥80% used — from shared context
    const { budgets, allTransactions, categoryMap: catMap } = sharedRef.current
    const yearStr = `${currentDate.getFullYear()}-`
    const yearExpenses = (allTransactions ?? []).filter(t =>
      t.type === 'expense' && t.date?.startsWith(yearStr)
    )

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

    // 2. Period budget leftovers
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

    actions.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    setItems(actions)
    setLoading(false)
  }, [userId, currentDate])

  useEffect(() => {
    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [load])

  return { items, loading }
}
