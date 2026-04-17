import { useState, useEffect, Fragment } from 'react'
import { CreditCard, Plus, Check, Undo2 } from 'lucide-react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSharedData } from '../../context/SharedDataContext'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { ReceiverAvatar } from '../shared/ReceiverCombobox'
import { CategoryPill, CATEGORY_ICONS } from '../shared/CategoryPill'
import AddSubscriptionModal from './AddSubscriptionModal'
import { usePreferences } from '../../context/UserPreferencesContext'

function getPeriodKey(date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

function getDueDate(billingDay, date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  return new Date(y, m, Math.min(billingDay, lastDay))
}

function DueBadge({ dueDate, isPaid, t }) {
  if (isPaid) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.round((dueDate - today) / 86400000)
  if (days < 0)  return <span className="text-[10px]" style={{ color: 'var(--color-alert)' }}>{t('subs.overdue', { days: Math.abs(days) })}</span>
  if (days === 0) return <span className="text-[10px]" style={{ color: 'var(--color-warning)' }}>{t('common.dueToday')}</span>
  return <span className="text-[10px] text-white/35">{t('subs.dueIn', { days })}</span>
}

function SubIcon({ iconId, receiver, name }) {
  const entry = iconId ? CATEGORY_ICONS.find(i => i.id === iconId) : null
  if (entry) return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <entry.Icon size={14} className="text-white/60" />
    </div>
  )
  if (receiver) return <ReceiverAvatar receiver={receiver} size="md" />
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
      {name?.[0]?.toUpperCase()}
    </div>
  )
}

export default function Subscriptions({ currentDate = new Date(), hidePaid = false }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const c = useCardCustomization('Subscriptions')

  const { categoryMap: catMap, receiverMap } = useSharedData()
  const [subs,     setSubs]     = useState([])
  const [payments, setPayments] = useState([])
  const [activeTab,   setActiveTab]   = useState('active')
  const [showModal,   setShowModal]   = useState(false)
  const [editingSub,  setEditingSub]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [toggling,    setToggling]    = useState(new Set())
  const [cancelFlash, setCancelFlash] = useState(null)
  const [collapsed,   setCollapsed]   = useCollapsed('Subscriptions')
  const [expandedId,  setExpandedId]  = useState(null)
  const [paidAmount,  setPaidAmount]  = useState('')

  useEffect(() => {
    if (!user?.id) return
    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])

  async function load() {
    setLoading(true)
    const { data: subsData } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at')
    const allSubs = (subsData ?? []).sort((a, b) => a.billing_day - b.billing_day)
    setSubs(allSubs)

    if (allSubs.length > 0) {
      const { data: paymentsData } = await supabase
        .from('subscription_payments').select('*')
        .in('subscription_id', allSubs.map(s => s.id))
      setPayments(paymentsData ?? [])
    } else {
      setPayments([])
    }
    setLoading(false)
  }

  async function togglePaid(sub, amount = sub.amount) {
    if (toggling.has(sub.id)) return
    setToggling(s => new Set(s).add(sub.id))

    const period   = getPeriodKey(currentDate)
    const existing = payments.find(p => p.subscription_id === sub.id && p.period === period)

    if (existing) {
      if (existing.transaction_id) {
        await supabase.from('transactions').update({ is_deleted: true }).eq('id', existing.transaction_id)
      }
      await supabase.from('subscription_payments').delete().eq('id', existing.id)
    } else {
      const receiver = sub.receiver_id ? receiverMap[sub.receiver_id] : null
      const desc = receiver ? receiver.name : sub.name
      const commentParts = []
      if (receiver && sub.name) commentParts.push(sub.name)
      if (sub.comment) commentParts.push(sub.comment)

      const _d = new Date()
      const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`
      const { data: tx } = await supabase.from('transactions').insert({
        user_id:        user.id,
        type:           'expense',
        description:    desc,
        amount,
        category_id:    sub.category_id    ?? null,
        subcategory_id: sub.subcategory_id ?? null,
        card_id:        sub.card_id        ?? null,
        receiver_id:    sub.receiver_id    ?? null,
        comment:        commentParts.join(' — ') || null,
        date:           today,
        is_cash:        false,
        is_deleted:     false,
        status:         'completed',
        source:         'subscriptions',
      }).select().single()

      await supabase.from('subscription_payments').insert({
        subscription_id: sub.id, period, transaction_id: tx?.id ?? null,
      })
    }

    window.dispatchEvent(new CustomEvent('transaction-saved'))
    setToggling(s => { const n = new Set(s); n.delete(sub.id); return n })
    load()
  }

  function handleCheckClick(sub, isPaid) {
    if (isPaid) { togglePaid(sub); return }
    setExpandedId(sub.id)
    setPaidAmount(String(sub.amount))
  }

  async function confirmPaid(sub) {
    const amount = parseFloat(paidAmount) || sub.amount
    setExpandedId(null)
    await togglePaid(sub, amount)
    if (Math.abs(amount - sub.amount) > 0.001) {
      await supabase.from('price_change_alerts').insert({
        user_id: user.id, source: 'subscription', record_id: sub.id,
        name: sub.name, expected_amount: sub.amount, actual_amount: amount,
      })
      window.dispatchEvent(new CustomEvent('transaction-saved'))
    }
  }

  async function toggleCancel(sub) {
    if (toggling.has(sub.id)) return
    setToggling(s => new Set(s).add(sub.id))
    const cancelling = sub.status === 'active'
    await supabase.from('subscriptions').update({ status: cancelling ? 'cancelled' : 'active' }).eq('id', sub.id)
    if (cancelling) {
      setCancelFlash({ id: sub.id, amount: sub.amount })
      setTimeout(() => setCancelFlash(null), 2800)
    }
    setToggling(s => { const n = new Set(s); n.delete(sub.id); return n })
    load()
  }

  const period        = getPeriodKey(currentDate)
  const activeSubs    = subs.filter(s => s.status === 'active')
  const cancelledSubs = subs.filter(s => s.status === 'cancelled')
  const displayed     = (activeTab === 'active' ? activeSubs : cancelledSubs).filter(sub => {
    if (!hidePaid || activeTab !== 'active') return true
    return !payments.some(p => p.subscription_id === sub.id && p.period === period)
  }).sort((a, b) => {
    const aPaid = payments.some(p => p.subscription_id === a.id && p.period === period)
    const bPaid = payments.some(p => p.subscription_id === b.id && p.period === period)
    if (aPaid !== bPaid) return aPaid ? 1 : -1
    return a.billing_day - b.billing_day
  })

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
              <button ref={c.btnRef} type="button" onClick={c.toggleOpen}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <CreditCard size={14} />
              </button>
              <button type="button" onClick={() => setCollapsed(c => !c)} className="font-semibold text-base hover:text-white/70 transition-colors">{t('subs.title')}</button>
            </div>
            <button onClick={() => { setEditingSub(null); setShowModal(true) }}
              className="text-muted hover:text-white transition-colors">
              <Plus size={16} />
            </button>
          </div>

          {!collapsed && (<>
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {['active', 'cancelled'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  activeTab === tab ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                }`}>
                {tab === 'active' ? t('subs.active') : t('subs.cancelled')}
                {tab === 'cancelled' && cancelledSubs.length > 0 && (
                  <span className="ml-1.5 text-white/30">{cancelledSubs.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <p className="text-center text-muted text-xs py-4">{t('common.loading')}</p>
          ) : displayed.length === 0 ? (
            <p className="text-center text-muted text-sm py-6">{activeTab === 'active' ? t('subs.noActive') : t('subs.noCancelled')}</p>
          ) : (
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {displayed.map(sub => {
                const isPaid   = payments.some(p => p.subscription_id === sub.id && p.period === period)
                const dueDate  = getDueDate(sub.billing_day, currentDate)
                const cat      = sub.category_id    ? catMap[sub.category_id]    : null
                const subCat   = sub.subcategory_id ? catMap[sub.subcategory_id] : null
                const receiver = sub.receiver_id    ? receiverMap[sub.receiver_id] : null
                const isCancelled = sub.status === 'cancelled'

                return (
                  <Fragment key={sub.id}>
                  <div className={`flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 transition-opacity relative ${isCancelled || isPaid ? 'opacity-45' : ''}`}>

                    {/* Cancel flash */}
                    {cancelFlash?.id === sub.id && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span
                          className="text-xs font-medium px-3 py-1.5 rounded-full text-white shadow-lg whitespace-nowrap"
                          style={{ background: 'var(--color-accent)', animation: 'savedFlash 2.8s ease-out forwards' }}
                        >
                          {t('subs.saved', { amount: fmt(sub.amount) })}
                        </span>
                      </div>
                    )}

                    {/* Checkmark — hidden for cancelled */}
                    {!isCancelled && (
                      <button
                        onClick={() => handleCheckClick(sub, isPaid)}
                        disabled={toggling.has(sub.id)}
                        className="mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all"
                        style={isPaid
                          ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                          : expandedId === sub.id
                            ? { borderColor: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }
                            : { borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)' }}
                      >
                        <Check size={11} className={isPaid ? 'text-white' : 'text-transparent'} />
                      </button>
                    )}
                    {isCancelled && <div className="mt-0.5 w-6 h-6 shrink-0" />}

                    {/* Icon */}
                    <SubIcon iconId={sub.icon} receiver={receiver} name={sub.name} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <button type="button" onClick={() => setEditingSub(sub)}
                        className={`text-sm truncate text-left font-medium leading-tight transition-colors w-full ${isCancelled || isPaid ? 'line-through text-white/50' : 'text-white hover:text-white/70'}`}>
                        {sub.name}
                      </button>
                      {!isCancelled && !isPaid && (
                        <>
                          {(cat || subCat) && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {cat    && <CategoryPill name={cat.name}    color={cat.color}    icon={cat.icon} />}
                              {subCat && <CategoryPill name={subCat.name} color={subCat.color} icon={subCat.icon} />}
                            </div>
                          )}
                          <div className="mt-1"><DueBadge dueDate={dueDate} isPaid={isPaid} t={t} /></div>
                        </>
                      )}
                    </div>

                    {/* Amount + cancel */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-medium tabular-nums text-white/60">
                        {fmt(sub.amount)}
                      </span>
                      <button
                        onClick={() => toggleCancel(sub)}
                        disabled={toggling.has(sub.id)}
                        title={isCancelled ? t('subs.reactivate') : t('subs.cancel')}
                        className={`flex items-center gap-1 text-[10px] transition-colors ${isCancelled ? 'text-white/50 hover:text-white/80' : 'text-white/25 hover:text-white/60'}`}
                      >
                        <Undo2 size={11} /> {isCancelled ? t('common.undo') : t('common.cancel')}
                      </button>
                    </div>
                  </div>

                  {/* Inline pay expansion */}
                  <div style={{
                    maxHeight:  expandedId === sub.id ? '52px' : '0',
                    opacity:    expandedId === sub.id ? 1 : 0,
                    overflow:   'hidden',
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
                          onKeyDown={e => e.key === 'Enter' && confirmPaid(sub)}
                          className="w-24 rounded-lg pl-5 pr-2 py-1 text-sm text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                          autoFocus={expandedId === sub.id}
                        />
                      </div>
                      <button
                        onClick={() => confirmPaid(sub)}
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
                  </Fragment>
                )
              })}
            </div>
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
          colors={c.colors}
        />
      )}

      {showModal && (
        <AddSubscriptionModal
          onClose={() => { setShowModal(false) }}
          onSaved={load}
        />
      )}
      {editingSub && (
        <AddSubscriptionModal
          sub={editingSub}
          onClose={() => setEditingSub(null)}
          onSaved={load}
        />
      )}
    </>
  )
}
