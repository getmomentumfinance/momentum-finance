import { TableProperties } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useSharedData } from '../../context/SharedDataContext'

function getPeriodKey(frequency, date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  if (frequency === 'monthly')   return `${y}-${String(m).padStart(2, '0')}`
  if (frequency === 'quarterly') return `${y}-Q${Math.ceil(m / 3)}`
  return `${y}`
}

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
  const { pendingItems, subscriptions, subPayments, recurringBills, billPayments, plannedBills } = useSharedData()

  const ROWS = ROW_KEYS.map(r => ({ ...r, label: t(r.tKey) }))
  const [checked,   setChecked]   = useState({ recurring: true, pending: true, planned: false, subscriptions: false, wishlist: false })
  const [wishlist,  setWishlist]  = useState(0)
  const [collapsed, setCollapsed] = useCollapsed('BalanceProjection')
  const [mode,      setMode]      = useState('thisMonth')

  const toggle = (key) => setChecked(p => ({ ...p, [key]: !p[key] }))

  // Only wishlist still needs its own fetch
  useEffect(() => {
    if (!user?.id) return
    async function loadWishlist() {
      const { data } = await supabase
        .from('wishlist').select('amount').eq('user_id', user.id).eq('status', 'active')
      setWishlist((data ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0))
    }
    loadWishlist()
    window.addEventListener('transaction-saved', loadWishlist)
    return () => window.removeEventListener('transaction-saved', loadWishlist)
  }, [user?.id])

  const amounts = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const pad = n => String(n).padStart(2, '0')
    const monthStart = `${y}-${pad(m + 1)}-01`
    const monthEnd   = `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`

    // Recurring bills
    let recurringTotal = 0
    if (mode === 'thisMonth') {
      for (const b of recurringBills) {
        const dueDate = getBillDueDate(b, currentDate)
        if (dueDate.getFullYear() !== y || dueDate.getMonth() !== m) continue
        const period = getBillPeriodKey(b, currentDate)
        const paid = billPayments.some(p => p.bill_id === b.id && p.period === period)
        if (!paid) recurringTotal += Number(b.amount)
      }
    } else {
      recurringTotal = recurringBills.reduce((sum, b) => sum + Number(b.amount), 0)
    }

    // Pending items
    const pendingFiltered = mode === 'thisMonth'
      ? pendingItems.filter(i => i.pay_before >= monthStart && i.pay_before <= monthEnd)
      : pendingItems
    const pendingTotal = pendingFiltered.reduce((s, i) => s + Number(i.amount), 0)

    // Planned bills
    const plannedFiltered = mode === 'thisMonth'
      ? plannedBills.filter(i => i.pay_before >= monthStart && i.pay_before <= monthEnd)
      : plannedBills
    const plannedTotal = plannedFiltered.reduce((s, i) => s + Number(i.amount), 0)

    // Subscriptions
    let subscriptionsTotal = 0
    if (mode === 'thisMonth') {
      const period = getPeriodKey('monthly', currentDate)
      for (const s of subscriptions) {
        const paid = subPayments.some(p => p.subscription_id === s.id && p.period === period)
        if (!paid) subscriptionsTotal += Number(s.amount)
      }
    } else {
      subscriptionsTotal = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0)
    }

    return { recurring: recurringTotal, pending: pendingTotal, planned: plannedTotal, subscriptions: subscriptionsTotal, wishlist }
  }, [currentDate, mode, pendingItems, subscriptions, subPayments, recurringBills, billPayments, plannedBills, wishlist])

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
