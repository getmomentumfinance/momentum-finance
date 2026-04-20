import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useSharedData } from '../../context/SharedDataContext'
import { useThemeColors } from '../../hooks/useThemeColors'
import { supabase } from '../../lib/supabase'
import { ReceiverAvatar } from '../shared/ReceiverCombobox'
import { CreditCard } from 'lucide-react'

export default function SubscriptionsTab() {
  const { user }             = useAuth()
  const { fmt }              = usePreferences()
  const { receiverMap }      = useSharedData()
  const colors               = useThemeColors()

  const [allSubs,  setAllSubs]  = useState([])
  const [allBills, setAllBills] = useState([])
  const [usage,    setUsage]    = useState({})

  // ── Fetch data ──────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('subscriptions').select('id,name,amount,receiver_id').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('recurring_bills').select('id,name,amount,frequency,receiver_id').eq('user_id', user.id),
    ]).then(([{ data: subs }, { data: bills }]) => {
      setAllSubs(subs ?? [])
      setAllBills(bills ?? [])
    })
    try {
      setUsage(JSON.parse(localStorage.getItem(`sub-usage-${user.id}`)) ?? {})
    } catch {}
  }, [user?.id])

  // ── Usage rating toggle ─────────────────────────────────────
  function setUsageRating(key, rating) {
    setUsage(prev => {
      const next = { ...prev, [key]: prev[key] === rating ? null : rating }
      localStorage.setItem(`sub-usage-${user.id}`, JSON.stringify(next))
      return next
    })
  }

  // ── Optimizer rows ──────────────────────────────────────────
  const optimizerRows = useMemo(() => {
    const freqMultiplier = f => f === 'quarterly' ? 4 : f === 'yearly' ? 1 : f === 'weekly' ? 52 : 12
    const subRows = allSubs.map(s => {
      const receiver = s.receiver_id ? receiverMap[s.receiver_id] : null
      return { key: `sub-${s.id}`, name: s.name, monthly: s.amount, yearly: s.amount * 12, period: 'Monthly', receiver }
    })
    const billRows = allBills.map(b => {
      const mult    = freqMultiplier(b.frequency)
      const monthly = b.frequency === 'monthly'   ? b.amount
                    : b.frequency === 'quarterly' ? b.amount / 3
                    : b.frequency === 'yearly'    ? b.amount / 12
                    : b.amount
      const receiver = b.receiver_id ? receiverMap[b.receiver_id] : null
      const name     = receiver?.name || b.name
      const comment  = receiver && b.name ? b.name : null
      return { key: `bill-${b.id}`, name, comment, monthly, yearly: b.amount * mult, period: b.frequency ?? 'Monthly', receiver }
    })
    return [...subRows, ...billRows].sort((a, b) => b.yearly - a.yearly)
  }, [allSubs, allBills, receiverMap])

  const yearlyTotal = useMemo(
    () => optimizerRows.reduce((s, r) => s + r.yearly, 0),
    [optimizerRows]
  )

  const cancellableSavings = useMemo(
    () => optimizerRows.filter(r => usage[r.key] != null && usage[r.key] <= 2).reduce((s, r) => s + r.yearly, 0),
    [optimizerRows, usage]
  )

  // ── Empty state ─────────────────────────────────────────────
  if (optimizerRows.length === 0) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center">
        <p className="text-sm text-white/30">No subscriptions or recurring bills yet.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-6 px-1 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <CreditCard size={13} className="text-white/35" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
                Subscription Optimizer
              </p>
            </div>
            <p className="text-xs text-white/35 ml-5">
              Rate your usage · 5 = use daily, 1 = barely use it
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-white/35 mb-0.5">Total yearly</p>
            <p className="text-sm font-bold tabular-nums">{fmt(yearlyTotal)}</p>
          </div>
        </div>

        {/* Rows */}
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {optimizerRows.map(item => {
            const rating      = usage[item.key]
            const ratingColor = rating == null  ? null
                              : rating <= 2     ? colors.expense
                              : rating === 3    ? colors.warning
                              : colors.income

            return (
              <div key={item.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">

                {/* Avatar */}
                {item.receiver
                  ? <ReceiverAvatar receiver={item.receiver} size="md" />
                  : (
                    <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
                      {item.name[0]?.toUpperCase()}
                    </div>
                  )
                }

                {/* Name + period */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{item.name}</p>
                  <p className="text-[10px] text-white/30 capitalize">
                    {item.comment ? `${item.comment} · ` : ''}{item.period}
                  </p>
                </div>

                {/* Amounts */}
                <div className="text-right mr-3 shrink-0">
                  <p className="text-xs font-medium tabular-nums text-white/70">
                    {fmt(item.yearly)}<span className="text-white/30">/yr</span>
                  </p>
                  <p className="text-[10px] text-white/30">{fmt(item.monthly)}/mo</p>
                </div>

                {/* Usage dots */}
                <div className="flex gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setUsageRating(item.key, n)}
                      className="w-3.5 h-3.5 rounded-full transition-all hover:scale-110"
                      style={{ background: rating >= n ? ratingColor : 'rgba(255,255,255,0.12)' }}
                    />
                  ))}
                </div>

                {/* Recommendation chip */}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full shrink-0 w-28 text-center"
                  style={ratingColor ? {
                    background: `color-mix(in srgb, ${ratingColor} 15%, transparent)`,
                    color: ratingColor,
                  } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}
                >
                  {rating == null ? 'Not rated'
                   : rating <= 2  ? 'Consider cancelling'
                   : rating === 3 ? 'Occasional use'
                   : 'Keep it'}
                </span>

              </div>
            )
          })}
        </div>

        {/* Footer — potential savings */}
        {cancellableSavings > 0 && (
          <div
            className="flex items-center justify-between pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs text-white/40">Potential savings if you cancel rated 1–2</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: colors.income }}>
              {fmt(cancellableSavings)}/yr
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
