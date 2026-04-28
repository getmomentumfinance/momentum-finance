import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Plus, Check, Undo2, PackageCheck } from 'lucide-react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSharedData } from '../../context/SharedDataContext'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { ReceiverAvatar } from '../shared/ReceiverCombobox'
import { CategoryPill } from '../shared/CategoryPill'
import { CATEGORY_ICONS } from '../shared/CategoryPill'
import AddPendingModal from './AddPendingModal'
import { usePreferences } from '../../context/UserPreferencesContext'

// ── Days-left progress bar ─────────────────────────────────────
function DaysProgress({ payBefore, createdAt, t }) {
  const now      = new Date()
  const end      = new Date(payBefore + 'T00:00:00')
  const daysLeft = Math.ceil((end - now) / 86400000)

  const start    = createdAt ? new Date(createdAt) : end
  const total    = end - start
  const pct      = daysLeft <= 0 ? 100 : total <= 0 ? 0 : Math.min(100, Math.max(0, ((now - start) / total) * 100))

  const isOverdue = daysLeft < 0
  const isUrgent  = !isOverdue && daysLeft <= 3
  const isWarning = !isOverdue && daysLeft > 3 && daysLeft <= 7
  const color = isOverdue || isUrgent ? 'var(--color-alert)' : isWarning ? 'var(--color-warning)' : 'var(--color-progress-bar)'
  const labelStyle = { color: isOverdue || isUrgent ? 'var(--color-alert)' : isWarning ? 'var(--color-warning)' : 'rgba(255,255,255,0.35)' }

  const label = isOverdue
    ? t('pending.overdue', { days: Math.abs(daysLeft) })
    : daysLeft === 0 ? t('common.dueToday')
    : t('pending.daysLeft', { days: daysLeft })

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={labelStyle}>{label}</span>
        <span className="text-[10px] text-white/25">
          {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden w-[60%]">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Item icon (custom icon > receiver avatar > initials) ────────
function ItemIcon({ item, receiver }) {
  const IconComp = item.icon ? CATEGORY_ICONS.find(i => i.id === item.icon)?.Icon : null
  if (IconComp) {
    return (
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <IconComp size={14} className="text-white/60" />
      </div>
    )
  }
  if (receiver) return <ReceiverAvatar receiver={receiver} size="md" />
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
      {item.name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export default function PendingTransactions({ currentDate = new Date(), hidePaid = false }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const { categoryMap, receiverMap } = useSharedData()
  const c = useCardCustomization('Pending Transactions')

  const [items,          setItems]          = useState([])
  const [showModal,      setShowModal]      = useState(false)
  const [editItem,       setEditItem]       = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [savedFlash,     setSavedFlash]     = useState(null) // { id, amount }
  const [collapsed,      setCollapsed]      = useCollapsed('PendingTransactions')
  const [receiveItem,    setReceiveItem]    = useState(null)
  const [receiveAmount,  setReceiveAmount]  = useState('')
  const receiveInputRef  = useRef(null)
  const [returnItem,     setReturnItem]     = useState(null)
  const [returnType,     setReturnType]     = useState('full')
  const [returnedAmount, setReturnedAmount] = useState('')
  const [returnIsPaid,   setReturnIsPaid]   = useState(false)

  useEffect(() => { if (user?.id) load() }, [user?.id, currentDate])

  async function load() {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10)
    const end   = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().slice(0, 10)
    const cols = 'id, name, amount, pay_before, status, receiver_id, category_id, subcategory_id, card_id, comment, icon, importance, transaction_id, created_at'
    const [{ data: pendingData }, { data: paidData }, { data: returnedData }] = await Promise.all([
      // Pending: always visible regardless of month
      supabase.from('pending_items').select(cols).eq('user_id', user.id).eq('status', 'pending').order('pay_before'),
      // Paid: visible only in the month of pay_before
      supabase.from('pending_items').select(cols).eq('user_id', user.id).eq('status', 'paid').gte('pay_before', start).lte('pay_before', end).order('pay_before'),
      // Returned: fetch all, filter client-side by created_at month
      supabase.from('pending_items').select(cols).eq('user_id', user.id).eq('status', 'returned').order('pay_before'),
    ])
    const returnedThisMonth = (returnedData ?? []).filter(i => {
      const d = new Date(i.created_at)
      return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()
    })
    setItems([...(pendingData ?? []), ...(paidData ?? []), ...returnedThisMonth].sort((a, b) => {
      const aDone = a.status !== 'pending', bDone = b.status !== 'pending'
      if (aDone !== bDone) return aDone ? 1 : -1
      return (a.pay_before ?? '').localeCompare(b.pay_before ?? '')
    }))
  }

  function openReceiveModal(item) {
    setReceiveItem(item)
    setReceiveAmount(String(item.amount))
    setTimeout(() => receiveInputRef.current?.select(), 50)
  }

  async function confirmReceived() {
    if (!receiveItem) return
    const finalAmount = parseFloat(receiveAmount)
    if (isNaN(finalAmount) || finalAmount <= 0) return
    setReceiveItem(null)
    await markPaid(receiveItem, finalAmount)
  }

  async function markPaid(item, customAmount) {
    if (loading) return
    setLoading(true)
    const finalAmount = customAmount ?? item.amount
    const receiver = receiverById(item.receiver_id)
    const desc = receiver ? receiver.name : item.name
    const commentParts = []
    if (receiver && item.name) commentParts.push(item.name)
    if (item.comment) commentParts.push(item.comment)

    const _d = new Date()
    const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`
    const { data: tx } = await supabase.from('transactions').insert({
      user_id:        user.id,
      type:           'expense',
      description:    desc,
      amount:         finalAmount,
      date:           today,
      source:         'pending',
      receiver_id:    item.receiver_id    || null,
      category_id:    item.category_id    || null,
      subcategory_id: item.subcategory_id || null,
      card_id:        item.card_id        || null,
      comment:        commentParts.join(' — ') || null,
      is_cash:        false,
      is_deleted:     false,
      status:         'completed',
    }).select().single()

    await supabase.from('pending_items').update({
      status: 'paid',
      transaction_id: tx?.id ?? null,
    }).eq('id', item.id)

    setLoading(false)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    load()
  }

  async function undoPaid(item) {
    if (loading) return
    setLoading(true)
    if (item.transaction_id) {
      await supabase.from('transactions').update({ is_deleted: true }).eq('id', item.transaction_id)
    }
    await supabase.from('pending_items').update({ status: 'pending', transaction_id: null }).eq('id', item.id)
    setLoading(false)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    load()
  }

  function openReturnModal(item) {
    setReturnItem(item)
    setReturnType('full')
    setReturnedAmount(String(item.amount))
    setReturnIsPaid(false)
  }

  async function undoReturn(item) {
    if (loading) return
    setLoading(true)
    await supabase.from('pending_items').update({ status: 'pending' }).eq('id', item.id)
    setLoading(false)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    load()
  }

  async function confirmReturn() {
    if (!returnItem) return
    const item = returnItem
    setReturnItem(null)
    setLoading(true)

    if (returnType === 'full') {
      await supabase.from('pending_items').update({ status: 'returned' }).eq('id', item.id)
      setSavedFlash({ id: item.id, amount: item.amount })
      setTimeout(() => setSavedFlash(null), 2800)
    } else {
      const remaining = Math.max(0, parseFloat(String(returnedAmount).replace(',', '.')) || 0)

      if (returnIsPaid) {
        const _d    = new Date()
        const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`
        const receiver = receiverById(item.receiver_id)
        const desc     = receiver ? receiver.name : item.name
        const commentParts = []
        if (receiver && item.name) commentParts.push(item.name)
        if (item.comment) commentParts.push(item.comment)
        const { data: tx } = await supabase.from('transactions').insert({
          user_id:        user.id,
          type:           'expense',
          description:    desc,
          amount:         remaining,
          date:           today,
          source:         'pending',
          receiver_id:    item.receiver_id    || null,
          category_id:    item.category_id    || null,
          subcategory_id: item.subcategory_id || null,
          card_id:        item.card_id        || null,
          comment:        commentParts.join(' — ') || null,
          is_cash:        false,
          is_deleted:     false,
          status:         'completed',
        }).select().single()
        await supabase.from('pending_items').update({
          status:         'paid',
          amount:         remaining,
          transaction_id: tx?.id ?? null,
        }).eq('id', item.id)
      } else {
        // Keep pending with adjusted amount
        await supabase.from('pending_items').update({ amount: remaining }).eq('id', item.id)
      }
    }

    setLoading(false)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    load()
  }

  function categoryById(id) { return categoryMap[id] }
  function receiverById(id) { return receiverMap[id] }

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
              >
                <Clock size={14} />
              </button>
              <button type="button" onClick={() => setCollapsed(c => !c)} className="font-semibold text-base hover:text-white/70 transition-colors">{t('pending.title')}</button>
            </div>
            <button
              onClick={() => { setEditItem(null); setShowModal(true) }}
              className="text-muted hover:text-white transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {!collapsed && (<>
          {/* List */}
          {items.filter(item => !hidePaid || item.status === 'pending').length === 0 ? (
            <p className="text-center text-muted text-sm py-6">{t('pending.noItems')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.filter(item => !hidePaid || item.status === 'pending').map(item => {
                const receiver = receiverById(item.receiver_id)
                const cat      = categoryById(item.category_id)
                const sub      = categoryById(item.subcategory_id)
                return (
                  <div key={item.id} className={`flex items-start gap-3 relative transition-opacity ${item.status !== 'pending' ? 'opacity-45' : ''}`}>
                    {/* Saved flash */}
                    {savedFlash?.id === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span
                          className="text-xs font-medium px-3 py-1.5 rounded-full text-white shadow-lg whitespace-nowrap"
                          style={{ background: 'var(--color-accent)', animation: 'savedFlash 2.8s ease-out forwards' }}
                        >
                          {t('pending.returned', { amount: fmt(item.amount) })}
                        </span>
                      </div>
                    )}

                    {/* Check button — filled when paid, outline when pending, disabled when returned */}
                    <button
                      onClick={() => item.status === 'paid' ? undoPaid(item) : openReceiveModal(item)}
                      disabled={loading || item.status === 'returned'}
                      title={item.status === 'paid' ? t('pending.undoPaid') : t('pending.markPaid')}
                      className="mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all disabled:pointer-events-none"
                      style={item.status === 'paid'
                        ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                        : { borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)' }}
                      onMouseEnter={e => { if (item.status !== 'paid') { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-accent) 70%, transparent)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-accent) 12%, transparent)' } }}
                      onMouseLeave={e => { if (item.status !== 'paid') { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-accent) 40%, transparent)'; e.currentTarget.style.background = '' } }}
                    >
                      <Check size={11} className="text-white" />
                    </button>

                    {/* Icon */}
                    <ItemIcon item={item} receiver={receiver} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => { setEditItem(item); setShowModal(true) }}
                        className={`text-sm text-left font-medium leading-tight truncate w-full ${item.status !== 'pending' ? 'line-through text-white/50 cursor-default' : 'text-white hover:text-white/70 transition-colors'}`}
                      >
                        {receiver ? receiver.name : (item.name || '—')}
                      </button>
                      {item.name && receiver && (
                        <p className="text-[10px] text-white/35 truncate leading-tight mt-0.5">{item.name}</p>
                      )}
                      {(cat || sub) && item.status === 'pending' && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {cat && <CategoryPill name={cat.name} color={cat.color} icon={cat.icon} />}
                          {sub && <CategoryPill name={sub.name} color={sub.color} icon={sub.icon} />}
                        </div>
                      )}
                      {item.status === 'pending' && (
                        <DaysProgress payBefore={item.pay_before} createdAt={item.created_at} t={t} />
                      )}
                    </div>

                    {/* Amount + return (hide return button for paid items) */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm text-white font-medium">
                        {fmt(item.amount)}
                      </span>
                      {item.status !== 'paid' && (
                        <button
                          onClick={() => item.status === 'returned' ? undoReturn(item) : openReturnModal(item)}
                          disabled={loading}
                          title={item.status === 'returned' ? t('common.undo') : t('pending.markReturn')}
                          className={`flex items-center gap-1 text-[10px] transition-colors ${item.status === 'returned' ? 'text-white/50 hover:text-white/80' : 'text-white/25 hover:text-white/60'}`}
                        >
                          <Undo2 size={11} /> {item.status === 'returned' ? t('common.undo') : t('pending.return')}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </>)}
        </div>
      </div>

      {/* Customization popup */}
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

      {/* Add / Edit modal */}
      {showModal && (
        <AddPendingModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSaved={load}
        />
      )}

      {/* Return modal */}
      {returnItem && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setReturnItem(null) }}>
          <div className="glass-popup border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
                <Undo2 size={16} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Return Item</p>
                <p className="text-[11px] text-white/40 truncate max-w-[200px]">{returnItem.name}</p>
              </div>
            </div>

            {/* Return type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/50 uppercase tracking-widest">Return type</label>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => { setReturnType('full'); setReturnedAmount(String(returnItem.amount)) }}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${returnType === 'full' ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                  Full return
                </button>
                <button type="button"
                  onClick={() => setReturnType('partial')}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${returnType === 'partial' ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                  Partial return
                </button>
              </div>
            </div>

            {/* Partial: user sets the new remaining amount */}
            {returnType === 'partial' && (<>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-white/50">New amount</label>
                <input
                  autoFocus
                  type="text" inputMode="decimal"
                  value={returnedAmount}
                  onChange={e => setReturnedAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter') confirmReturn(); if (e.key === 'Escape') setReturnItem(null) }}
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-lg font-semibold text-white outline-none focus:border-white/25 transition-colors tabular-nums"
                />
                {(() => {
                  const newAmt = parseFloat(String(returnedAmount).replace(',', '.')) || 0
                  const deducted = returnItem.amount - newAmt
                  if (deducted <= 0) return null
                  return (
                    <p className="text-[11px] text-white/40">
                      {fmt(returnItem.amount)} − {fmt(newAmt)} = <span className="text-white/70 font-medium">{fmt(deducted)} returned</span>
                    </p>
                  )
                })()}
              </div>

              {/* Payment status */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-white/50 uppercase tracking-widest">Payment status</label>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => setReturnIsPaid(false)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${!returnIsPaid ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                    Not paid yet
                  </button>
                  <button type="button"
                    onClick={() => setReturnIsPaid(true)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${returnIsPaid ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                    Already paid
                  </button>
                </div>
                {!returnIsPaid && (
                  <p className="text-[11px] text-white/30">The pending item will stay open with the adjusted amount.</p>
                )}
              </div>
            </>)}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => setReturnItem(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                Cancel
              </button>
              <button
                onClick={confirmReturn}
                disabled={loading || (returnType === 'partial' && (returnedAmount === '' || isNaN(parseFloat(String(returnedAmount).replace(',', '.'))) || parseFloat(String(returnedAmount).replace(',', '.')) < 0))}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
                style={{ background: 'var(--color-accent)' }}>
                Confirm
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Mark as Received popup */}
      {receiveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setReceiveItem(null) }}>
          <div className="glass-popup border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
                <PackageCheck size={16} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t('pending.markReceived')}</p>
                <p className="text-[11px] text-white/40 truncate max-w-[200px]">{receiveItem.name}</p>
              </div>
            </div>

            {/* Amount field */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/50">{t('pending.finalAmount')}</label>
              <div className="relative">
                <input
                  ref={receiveInputRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={receiveAmount}
                  onChange={e => setReceiveAmount(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmReceived(); if (e.key === 'Escape') setReceiveItem(null) }}
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-lg font-semibold text-white outline-none focus:border-white/25 transition-colors tabular-nums"
                />
              </div>
              {parseFloat(receiveAmount) < receiveItem.amount && parseFloat(receiveAmount) >= 0 && (
                <p className="text-[11px]" style={{ color: 'var(--color-progress-bar)' }}>
                  {t('pending.returnDiff', { amount: fmt(receiveItem.amount - parseFloat(receiveAmount)) })} returned
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setReceiveItem(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmReceived}
                disabled={loading || !receiveAmount || parseFloat(receiveAmount) <= 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
                style={{ background: 'var(--color-accent)' }}
              >
                {t('pending.confirm')}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
