import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'

function getPeriodKey(frequency, date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  if (frequency === 'monthly')   return `${y}-${String(m).padStart(2, '0')}`
  if (frequency === 'quarterly') return `${y}-Q${Math.ceil(m / 3)}`
  return `${y}`
}

export default function StillToPayCard({ currentDate = new Date() }) {
  const { user } = useAuth()
  const [data, setData] = useState({
    recurring:     { count: 0, total: 0 },
    pending:       { count: 0, total: 0 },
    planned:       { count: 0, total: 0 },
    subscriptions: { count: 0, total: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])

  async function load() {
    setLoading(true)

    const y         = currentDate.getFullYear()
    const m         = currentDate.getMonth()
    const monthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const monthEnd   = `${y}-${String(m + 1).padStart(2, '0')}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`

    // Recurring bills unpaid this period
    const { data: bills } = await supabase
      .from('recurring_bills').select('id, amount, frequency').eq('user_id', user.id)

    let recurringCount = 0, recurringTotal = 0
    if (bills?.length) {
      const { data: payments } = await supabase
        .from('recurring_bill_payments').select('bill_id, period')
        .in('bill_id', bills.map(b => b.id))
      bills.forEach(b => {
        const period = getPeriodKey(b.frequency, currentDate)
        const paid = (payments ?? []).some(p => p.bill_id === b.id && p.period === period)
        if (!paid) { recurringCount++; recurringTotal += Number(b.amount) }
      })
    }

    // Pending items due this month
    const { data: pendingItems } = await supabase
      .from('pending_items').select('amount').eq('user_id', user.id).eq('status', 'pending')
      .gte('pay_before', monthStart).lte('pay_before', monthEnd)
    const pendingCount = (pendingItems ?? []).length
    const pendingTotal = (pendingItems ?? []).reduce((s, i) => s + Number(i.amount), 0)

    // Planned bills due this month
    const { data: plannedItems } = await supabase
      .from('planned_bills').select('amount').eq('user_id', user.id).eq('status', 'pending')
      .gte('pay_before', monthStart).lte('pay_before', monthEnd)
    const plannedCount = (plannedItems ?? []).length
    const plannedTotal = (plannedItems ?? []).reduce((s, i) => s + Number(i.amount), 0)

    // Active subscriptions unpaid this month
    const { data: allSubs } = await supabase
      .from('subscriptions').select('id, amount').eq('user_id', user.id).eq('status', 'active')

    let subsCount = 0, subsTotal = 0
    if (allSubs?.length) {
      const period = getPeriodKey('monthly', currentDate)
      const { data: subPayments } = await supabase
        .from('subscription_payments').select('subscription_id, period')
        .in('subscription_id', allSubs.map(s => s.id))
      allSubs.forEach(s => {
        const paid = (subPayments ?? []).some(p => p.subscription_id === s.id && p.period === period)
        if (!paid) { subsCount++; subsTotal += Number(s.amount) }
      })
    }

    setData({
      recurring:     { count: recurringCount, total: recurringTotal },
      pending:       { count: pendingCount,   total: pendingTotal   },
      planned:       { count: plannedCount,   total: plannedTotal   },
      subscriptions: { count: subsCount,      total: subsTotal      },
    })
    setLoading(false)
  }

  const { fmt, t } = usePreferences()
  const grandTotal = data.recurring.total + data.pending.total + data.planned.total + data.subscriptions.total

  const items = [
    { label: t('stp.recurring'), ...data.recurring     },
    { label: t('stp.pending'),   ...data.pending       },
    { label: t('stp.planned'),   ...data.planned       },
    { label: t('stp.subs'),      ...data.subscriptions },
  ]

  return (
    <div className="glass-card rounded-2xl px-4 py-3 h-full flex flex-col justify-center gap-2">
      {loading ? (
        <span className="text-xs text-muted">{t('common.loading')}</span>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
