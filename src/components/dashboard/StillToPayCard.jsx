import { useMemo } from 'react'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useSharedData } from '../../context/SharedDataContext'

function isInTrial(sub, billingDate) {
  if (!sub.is_trial || !sub.trial_ends_at) return false
  return billingDate.toISOString().slice(0, 10) <= sub.trial_ends_at
}

function getNextDueDate(nextDueDateStr, frequency) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let d = new Date(nextDueDateStr + 'T00:00:00')
  while (d < today) {
    if (frequency === 'quarterly') d.setMonth(d.getMonth() + 3)
    else d.setFullYear(d.getFullYear() + 1)
  }
  return d
}

function getBillPeriodKey(bill, date) {
  if ((bill.frequency === 'quarterly' || bill.frequency === 'yearly') && bill.next_due_date) {
    const d = getNextDueDate(bill.next_due_date, bill.frequency)
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
    return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }
  const y = date.getFullYear(), m = date.getMonth() + 1
  return `${y}-${String(m).padStart(2,'0')}`
}

function getBillDueDate(bill, date) {
  if ((bill.frequency === 'quarterly' || bill.frequency === 'yearly') && bill.next_due_date) {
    return getNextDueDate(bill.next_due_date, bill.frequency)
  }
  const y = date.getFullYear(), m = date.getMonth()
  return new Date(y, m, Math.min(bill.due_day ?? 1, new Date(y, m + 1, 0).getDate()))
}

export default function StillToPayCard({ currentDate = new Date() }) {
  const { fmt, t } = usePreferences()
  const { pendingItems, subscriptions, subPayments, recurringBills, billPayments, plannedBills } = useSharedData()

  const data = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const monthEnd = `${y}-${String(m + 1).padStart(2, '0')}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`

    // Recurring bills unpaid and due this month
    let recurringCount = 0, recurringTotal = 0
    for (const b of recurringBills) {
      const dueDate = getBillDueDate(b, currentDate)
      if (dueDate.getFullYear() !== y || dueDate.getMonth() !== m) continue
      const period = getBillPeriodKey(b, currentDate)
      const paid = billPayments.some(p => p.bill_id === b.id && p.period === period)
      if (!paid) { recurringCount++; recurringTotal += Number(b.amount) }
    }

    // Pending items due this month or overdue
    const pendingFiltered = pendingItems.filter(i => !i.pay_before || i.pay_before <= monthEnd)
    const pendingCount = pendingFiltered.length
    const pendingTotal = pendingFiltered.reduce((s, i) => s + Number(i.amount), 0)

    // Planned bills due this month or overdue
    const plannedFiltered = plannedBills.filter(i => !i.pay_before || i.pay_before <= monthEnd)
    const plannedCount = plannedFiltered.length
    const plannedTotal = plannedFiltered.reduce((s, i) => s + Number(i.amount), 0)

    // Active subscriptions unpaid this month (skip free trials)
    const period = `${y}-${String(m + 1).padStart(2, '0')}`
    let subsCount = 0, subsTotal = 0
    for (const s of subscriptions) {
      const billingDate = new Date(y, m, Math.min(s.billing_day, new Date(y, m + 1, 0).getDate()))
      if (isInTrial(s, billingDate)) continue
      const paid = subPayments.some(p => p.subscription_id === s.id && p.period === period)
      if (!paid) { subsCount++; subsTotal += Number(s.amount) }
    }

    return {
      recurring:     { count: recurringCount, total: recurringTotal },
      pending:       { count: pendingCount,   total: pendingTotal   },
      planned:       { count: plannedCount,   total: plannedTotal   },
      subscriptions: { count: subsCount,      total: subsTotal      },
    }
  }, [currentDate, pendingItems, subscriptions, subPayments, recurringBills, billPayments, plannedBills])

  const grandTotal = data.recurring.total + data.pending.total + data.planned.total + data.subscriptions.total

  const items = [
    { label: t('stp.recurring'), ...data.recurring     },
    { label: t('stp.pending'),   ...data.pending       },
    { label: t('stp.planned'),   ...data.planned       },
    { label: t('stp.subs'),      ...data.subscriptions },
  ]

  return (
    <div className="glass-card rounded-2xl px-4 py-3 h-full flex flex-col justify-center gap-2">
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        {items.map(({ label, count, total }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold text-white">{fmt(total)}</span>
            <span className="text-[10px] text-white/35">{count !== 1 ? t('common.items', { count }) : t('common.item', { count })}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.06]">
        <span className="text-[10px] text-muted uppercase tracking-wider">{t('stp.title')}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>{fmt(grandTotal)}</span>
      </div>
    </div>
  )
}
