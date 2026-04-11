import { TableProperties } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
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

const ROW_KEYS = [
  { tKey: 'proj.recurring', key: 'recurring' },
  { tKey: 'proj.pending',   key: 'pending' },
  { tKey: 'proj.planned',   key: 'planned' },
  { tKey: 'proj.subs',      key: 'subscriptions' },
  { tKey: 'proj.wishlist',  key: 'wishlist' },
]

export default function BalanceProjection({ currentDate = new Date() }) {
  const { user } = useAuth()
  const c = useCardCustomization('Balance Projection')

  const { fmt, t } = usePreferences()
  const ROWS = ROW_KEYS.map(r => ({ ...r, label: t(r.tKey) }))
  const [checked, setChecked] = useState({ recurring: true, pending: true, planned: false, subscriptions: false, wishlist: false })
  const [amounts, setAmounts] = useState({ recurring: 0, pending: 0, planned: 0, subscriptions: 0, wishlist: 0 })
  const [collapsed, setCollapsed] = useCollapsed('BalanceProjection')
  const [mode, setMode] = useState('thisMonth')

  const toggle = (key) => setChecked(p => ({ ...p, [key]: !p[key] }))

  useEffect(() => {
    if (!user?.id) return
    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate, mode])

  async function load() {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const monthStart = new Date(y, m, 1).toISOString().slice(0, 10)
    const monthEnd   = new Date(y, m + 1, 0).toISOString().slice(0, 10)

    // ── Recurring bills ───────────────────────────────────────────
    const { data: bills } = await supabase
      .from('recurring_bills').select('id, amount, frequency, due_day, next_due_date').eq('user_id', user.id)

    function getBillDueDate(b, refDate) {
      if ((b.frequency === 'quarterly' || b.frequency === 'yearly') && b.next_due_date) {
        const today = new Date(); today.setHours(0,0,0,0)
        let d = new Date(b.next_due_date + 'T00:00:00')
        while (d < today) {
          if (b.frequency === 'quarterly') d.setMonth(d.getMonth() + 3)
          else d.setFullYear(d.getFullYear() + 1)
        }
        return d
      }
      const lastDay = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate()
      return new Date(refDate.getFullYear(), refDate.getMonth(), Math.min(b.due_day || 1, lastDay))
    }

    function getBillPeriodKey(b, refDate) {
      if ((b.frequency === 'quarterly' || b.frequency === 'yearly') && b.next_due_date) {
        const d = getBillDueDate(b, refDate)
        const dy = d.getFullYear(), dm = d.getMonth() + 1, dd = d.getDate()
        return `${dy}-${String(dm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`
      }
      return `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`
    }

    let recurringTotal = 0
    if (bills?.length) {
      if (mode === 'thisMonth') {
        const { data: payments } = await supabase
          .from('recurring_bill_payments')
          .select('bill_id, period')
          .in('bill_id', bills.map(b => b.id))
        recurringTotal = bills.reduce((sum, b) => {
          const dueDate = getBillDueDate(b, currentDate)
          // Only include if the due date falls within the current month
          if (dueDate.getFullYear() !== y || dueDate.getMonth() !== m) return sum
          const period = getBillPeriodKey(b, currentDate)
          const paid = (payments ?? []).some(p => p.bill_id === b.id && p.period === period)
          return paid ? sum : sum + Number(b.amount)
        }, 0)
      } else {
        recurringTotal = bills.reduce((sum, b) => sum + Number(b.amount), 0)
      }
    }

    // ── Pending items: status = 'pending' ─────────────────────────
    let pendingQuery = supabase.from('pending_items').select('amount').eq('user_id', user.id).eq('status', 'pending')
    if (mode === 'thisMonth') pendingQuery = pendingQuery.gte('pay_before', monthStart).lte('pay_before', monthEnd)
    const { data: pendingItems } = await pendingQuery
    const pendingTotal = (pendingItems ?? []).reduce((s, i) => s + Number(i.amount), 0)

    // ── Planned bills: status = 'pending' ─────────────────────────
    let plannedQuery = supabase.from('planned_bills').select('amount').eq('user_id', user.id).eq('status', 'pending')
    if (mode === 'thisMonth') plannedQuery = plannedQuery.gte('pay_before', monthStart).lte('pay_before', monthEnd)
    const { data: plannedItems } = await plannedQuery
    const plannedTotal = (plannedItems ?? []).reduce((s, i) => s + Number(i.amount), 0)

    // ── Subscriptions ─────────────────────────────────────────────
    const { data: allSubs } = await supabase
      .from('subscriptions').select('id, amount').eq('user_id', user.id).eq('status', 'active')

    let subscriptionsTotal = 0
    if (allSubs?.length) {
      if (mode === 'thisMonth') {
        const period = getPeriodKey('monthly', currentDate)
        const { data: subPayments } = await supabase
          .from('subscription_payments').select('subscription_id, period')
          .in('subscription_id', allSubs.map(s => s.id))
        subscriptionsTotal = allSubs.reduce((sum, s) => {
          const paid = (subPayments ?? []).some(p => p.subscription_id === s.id && p.period === period)
          return paid ? sum : sum + Number(s.amount)
        }, 0)
      } else {
        subscriptionsTotal = allSubs.reduce((sum, s) => sum + Number(s.amount), 0)
      }
    }

    // ── Wishlist: active items with an amount ──────────────────────
    const { data: wishlistItems } = await supabase
      .from('wishlist').select('amount').eq('user_id', user.id).eq('status', 'active')
    const wishlistTotal = (wishlistItems ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0)

    setAmounts(prev => ({ ...prev, recurring: recurringTotal, pending: pendingTotal, planned: plannedTotal, subscriptions: subscriptionsTotal, wishlist: wishlistTotal }))
  }

  const total = ROWS.reduce((sum, { key }) => checked[key] ? sum + amounts[key] : sum, 0)

  return (
    <>
      <div className="glass-card rounded-2xl p-4 relative overflow-hidden" style={{ border: c.borderStyle }}>
        {c.bgGradient && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: c.bgGradient, opacity: c.opacity / 100 }} />
        )}
        {c.enableColor && c.darkOverlay > 0 && (
          <div className="absolute inset-0 pointer-events-none bg-black" style={{ opacity: c.darkOverlay / 100 }} />
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <button
              ref={c.btnRef}
              type="button"
              onClick={c.toggleOpen}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <TableProperties size={14} />
            </button>
            <button type="button" onClick={() => setCollapsed(c => !c)} className="font-semibold text-base hover:text-white/70 transition-colors">{t('proj.title')}</button>
            <div className="ml-auto flex items-center rounded-lg overflow-hidden text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {['thisMonth', 'allTime'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="px-2.5 py-1 transition-colors"
                  style={mode === m
                    ? { background: 'var(--color-accent)', color: 'white' }
                    : { color: 'rgba(255,255,255,0.4)' }}
                >
                  {m === 'thisMonth' ? t('common.thisMonth') : t('common.allTime')}
                </button>
              ))}
            </div>
          </div>

          {!collapsed && (<>
          <div className="flex flex-col gap-0.5 text-sm">
            {ROWS.map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
                    style={checked[key]
                      ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                      : { borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)' }}
                  >
                    {checked[key] && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className={checked[key] ? 'text-white' : 'text-muted'}>{label}</span>
                </div>
                <span className={amounts[key] > 0 ? 'text-white' : 'text-muted'}>
                  {fmt(amounts[key])}
                </span>
              </div>
            ))}

            <div className="flex justify-between items-center py-2.5 border-t border-white/10 mt-2 font-semibold">
              <span>{t('common.total')}</span>
              <span style={{ color: 'var(--color-accent)' }}>{fmt(total)}</span>
            </div>
          </div>
          </>)}
        </div>
      </div>

      {c.open && (
        <CardCustomizationPopup
          popupRef={c.popupRef} pos={c.pos}
          enableColor={c.enableColor}   setEnableColor={c.setEnableColor}
          showBorder={c.showBorder}     setShowBorder={c.setShowBorder}
          tab={c.tab}                   setTab={c.setTab}
          selectedColor={c.selectedColor}   setSelectedColor={c.setSelectedColor}
          opacity={c.opacity}           setOpacity={c.setOpacity}
          darkOverlay={c.darkOverlay}   setDarkOverlay={c.setDarkOverlay}
          colors={c.colors}
        />
      )}
    </>
  )
}
