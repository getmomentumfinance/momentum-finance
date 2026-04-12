import { useState, useEffect } from 'react'
import { FileText, Plus, Check } from 'lucide-react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSharedData } from '../../context/SharedDataContext'
import { CategoryPill, CATEGORY_ICONS } from '../shared/CategoryPill'
import { ReceiverAvatar } from '../shared/ReceiverCombobox'
import AddRecurringBillModal from './AddRecurringBillModal'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { usePreferences } from '../../context/UserPreferencesContext'

// ── Helpers ──────────────────────────────────────────────────
function getNextDueDate(nextDueDateStr, frequency) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let d = new Date(nextDueDateStr + 'T00:00:00')
  while (d < today) {
    if (frequency === 'quarterly') d.setMonth(d.getMonth() + 3)
    else d.setFullYear(d.getFullYear() + 1)
  }
  return d
}

function getPeriodKey(bill, date) {
  if ((bill.frequency === 'quarterly' || bill.frequency === 'yearly') && bill.next_due_date) {
    const d = getNextDueDate(bill.next_due_date, bill.frequency)
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
    return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

function getDueDate(bill, date) {
  if ((bill.frequency === 'quarterly' || bill.frequency === 'yearly') && bill.next_due_date) {
    return getNextDueDate(bill.next_due_date, bill.frequency)
  }
  const y = date.getFullYear()
  const m = date.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  return new Date(y, m, Math.min(bill.due_day, lastDay))
}

function DueBadge({ dueDate, isPaid, t }) {
  if (isPaid) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.round((dueDate - today) / 86400000)
  if (days < 0)  return <span className="text-[10px]" style={{ color: 'var(--color-alert)' }}>{t('bills.overdue', { days: Math.abs(days) })}</span>
  if (days === 0) return <span className="text-[10px]" style={{ color: 'var(--color-warning)' }}>{t('common.dueToday')}</span>
  return <span className="text-[10px] text-white/35">{t('bills.dueIn', { days })}</span>
}

// ── Tiny receiver logo ────────────────────────────────────────
// ── Bill icon (custom icon > receiver avatar > initial) ───────
function BillIcon({ iconId, receiver, name }) {
  const entry = iconId ? CATEGORY_ICONS.find(i => i.id === iconId) : null
  if (entry) {
    return (
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <entry.Icon size={14} className="text-white/60" />
      </div>
    )
  }
  if (receiver) return <ReceiverAvatar receiver={receiver} size="md" />
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
      {name?.[0]?.toUpperCase()}
    </div>
  )
}


// ── Main component ────────────────────────────────────────────
export default function RecurringBills({ currentDate }) {
  const c = useCardCustomization('Recurring Bills')
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const { categoryMap: catMap, receiverMap } = useSharedData()
  const [bills,    setBills]    = useState([])
  const [payments, setPayments] = useState([])
  const [showModal,  setShowModal]  = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [toggling,   setToggling]   = useState(new Set())
  const [collapsed, setCollapsed] = useCollapsed('RecurringBills')
  const [filter, setFilter] = useState('month')
  const [expandedId, setExpandedId] = useState(null)
  const [paidAmount, setPaidAmount] = useState('')

  useEffect(() => {
    if (!user?.id) return
    load()
  }, [user?.id, currentDate])

  async function load() {
    setLoading(true)
    const { data: billsData, error: billsError } = await supabase.from('recurring_bills').select('*').eq('user_id', user.id).order('created_at')

    if (billsError) {
      console.error('recurring_bills fetch error:', billsError.message, billsError)
      setLoading(false)
      return
    }

    const bills = (billsData ?? []).sort((a, b) => getDueDate(a, currentDate) - getDueDate(b, currentDate))
    setBills(bills)

    if (bills.length > 0) {
      const { data: paymentsData } = await supabase
        .from('recurring_bill_payments')
        .select('*')
        .in('bill_id', bills.map(b => b.id))
      setPayments(paymentsData ?? [])
    } else {
      setPayments([])
    }
    setLoading(false)
  }

  async function togglePaid(bill, amount = bill.amount) {
    if (toggling.has(bill.id)) return
    setToggling(s => new Set(s).add(bill.id))

    const period   = getPeriodKey(bill, currentDate)
    const existing = payments.find(p => p.bill_id === bill.id && p.period === period)

    if (existing) {
      if (existing.transaction_id) {
        await supabase.from('transactions').update({ is_deleted: true }).eq('id', existing.transaction_id)
      }
      await supabase.from('recurring_bill_payments').delete().eq('id', existing.id)
    } else {
      const receiver = bill.receiver_id ? receiverMap[bill.receiver_id] : null
      const desc = receiver ? receiver.name : bill.name
      const commentParts = []
      if (receiver && bill.name) commentParts.push(bill.name)
      if (bill.comment) commentParts.push(bill.comment)

      const _d = new Date()
      const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`
      const { data: tx } = await supabase
        .from('transactions')
        .insert({
          user_id:        user.id,
          type:           'expense',
          description:    desc,
          amount,
          category_id:    bill.category_id    ?? null,
          subcategory_id: bill.subcategory_id ?? null,
          card_id:        bill.card_id        ?? null,
          receiver_id:    bill.receiver_id    ?? null,
          comment:        commentParts.join(' — ') || null,
          date:           today,
          is_cash:        false,
          status:         'completed',
          is_deleted:     false,
          source:         'recurring',
        })
        .select()
        .single()

      await supabase.from('recurring_bill_payments').insert({
        bill_id:        bill.id,
        period,
        transaction_id: tx?.id ?? null,
      })
    }

    window.dispatchEvent(new CustomEvent('transaction-saved'))
    setToggling(s => { const n = new Set(s); n.delete(bill.id); return n })
    load()
  }

  function handleCheckClick(bill, isPaid) {
    if (isPaid) { togglePaid(bill); return }
    setExpandedId(bill.id)
    setPaidAmount(String(bill.amount))
  }

  async function confirmPaid(bill) {
    const amount = parseFloat(paidAmount) || bill.amount
    setExpandedId(null)
    await togglePaid(bill, amount)
    if (Math.abs(amount - bill.amount) > 0.001) {
      await supabase.from('price_change_alerts').insert({
        user_id: user.id, source: 'bill', record_id: bill.id,
        name: bill.name, expected_amount: bill.amount, actual_amount: amount,
      })
      window.dispatchEvent(new CustomEvent('transaction-saved'))
    }
  }

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            ref={c.btnRef}
            type="button"
            onClick={c.toggleOpen}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            style={{ color: c.customIconColor && c.iconColor ? c.iconColor : undefined }}
          >
            <FileText size={14} />
          </button>
          <button type="button" onClick={() => setCollapsed(c => !c)} className="font-semibold text-base hover:text-white/70 transition-colors">{t('bills.title')}</button>
          <div className="flex items-center gap-0.5 ml-1">
            {['month', 'all'].map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors
                  ${filter === f ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}>
                {f === 'month' ? t('common.thisMonth') : t('common.all')}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-muted hover:text-white transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {!collapsed && (<>
      {/* Content */}
      {loading ? (
        <p className="text-center text-muted text-xs py-4">{t('common.loading')}</p>
      ) : bills.length === 0 ? (
        <p className="text-center text-muted text-sm py-6">{t('bills.noBills')}</p>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {[...bills].filter(bill => {
            if (filter === 'all') return true
            const due = getDueDate(bill, currentDate)
            return due.getFullYear() === currentDate.getFullYear() && due.getMonth() === currentDate.getMonth()
          }).sort((a, b) => {
            const aPaid = payments.some(p => p.bill_id === a.id && p.period === getPeriodKey(a, currentDate))
            const bPaid = payments.some(p => p.bill_id === b.id && p.period === getPeriodKey(b, currentDate))
            if (aPaid !== bPaid) return aPaid ? 1 : -1
            return getDueDate(a, currentDate) - getDueDate(b, currentDate)
          }).map(bill => {
            const period  = getPeriodKey(bill, currentDate)
            const isPaid  = payments.some(p => p.bill_id === bill.id && p.period === period)
            const dueDate = getDueDate(bill, currentDate)
            const cat     = bill.category_id    ? catMap[bill.category_id]    : null
            const sub     = bill.subcategory_id ? catMap[bill.subcategory_id] : null
            const receiver = bill.receiver_id   ? receiverMap[bill.receiver_id] : null

            return (
              <div
                key={bill.id}
                className={`flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 transition-opacity ${isPaid ? 'opacity-45' : ''}`}
              >
                {/* Checkmark */}
                <button
                  onClick={() => handleCheckClick(bill, isPaid)}
                  disabled={toggling.has(bill.id)}
                  className="mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all"
                  style={isPaid
                    ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                    : expandedId === bill.id
                      ? { borderColor: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }
                      : { borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)' }}
                >
                  <Check size={11} className={isPaid ? 'text-white' : 'text-transparent'} />
                </button>

                {/* Icon */}
                <BillIcon iconId={bill.icon} receiver={receiver} name={bill.name} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setEditingBill(bill)}
                    className={`text-sm truncate text-left font-medium leading-tight transition-colors w-full ${isPaid ? 'line-through text-white/50' : 'text-white hover:text-white/70'}`}
                  >
                    {bill.name}
                  </button>
                  {!isPaid && (
                    <>
                      {(cat || sub) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {cat && <CategoryPill name={cat.name} color={cat.color} icon={cat.icon} />}
                          {sub && <CategoryPill name={sub.name} color={sub.color} icon={sub.icon} />}
                        </div>
                      )}
                      <div className="mt-1"><DueBadge dueDate={dueDate} isPaid={isPaid} t={t} /></div>
                    </>
                  )}
                </div>

                {/* Amount */}
                <span className="text-sm font-medium tabular-nums text-white/60 shrink-0">
                  {fmt(bill.amount)}
                </span>
              </div>

              {/* Inline pay expansion */}
              <div style={{
                maxHeight: expandedId === bill.id ? '52px' : '0',
                opacity:   expandedId === bill.id ? 1 : 0,
                overflow:  'hidden',
                transition: 'max-height 0.2s ease, opacity 0.15s ease',
              }}>
                <div className="flex items-center gap-2 pb-2.5 pl-9">
                  <span className="text-xs text-white/40">Paid</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white/40">€</span>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={e => setPaidAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && confirmPaid(bill)}
                      className="w-24 rounded-lg pl-5 pr-2 py-1 text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                      autoFocus={expandedId === bill.id}
                    />
                  </div>
                  <button
                    onClick={() => confirmPaid(bill)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <AddRecurringBillModal
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
      {editingBill && (
        <AddRecurringBillModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
          onSaved={load}
        />
      )}
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
        customIconColor={c.customIconColor} setCustomIconColor={c.setCustomIconColor}
        iconColor={c.iconColor}       setIconColor={c.setIconColor}
        colors={c.colors}
      />
    )}
    </>
  )
}
