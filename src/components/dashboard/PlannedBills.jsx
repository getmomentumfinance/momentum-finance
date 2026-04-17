import { useState, useEffect } from 'react'
import { CalendarDays, Plus, Check, Eye, EyeOff } from 'lucide-react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSharedData } from '../../context/SharedDataContext'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { ReceiverAvatar } from '../shared/ReceiverCombobox'
import { CategoryPill } from '../shared/CategoryPill'
import { CATEGORY_ICONS } from '../shared/CategoryPill'
import AddPlannedBillModal from './AddPlannedBillModal'
import { usePreferences } from '../../context/UserPreferencesContext'

// ── Days-left progress bar ─────────────────────────────────────
function DaysProgress({ payBefore, t }) {
  const now      = new Date()
  const end      = new Date(payBefore + 'T00:00:00')
  const daysLeft = Math.ceil((end - now) / 86400000)

  const isOverdue = daysLeft < 0
  const isUrgent  = !isOverdue && daysLeft <= 3
  const isWarning = !isOverdue && daysLeft > 3 && daysLeft <= 7
  const color = isOverdue || isUrgent ? 'var(--color-alert)' : isWarning ? 'var(--color-warning)' : 'var(--color-progress-bar)'
  const labelStyle = { color: isOverdue || isUrgent ? 'var(--color-alert)' : isWarning ? 'var(--color-warning)' : 'rgba(255,255,255,0.35)' }

  const label = isOverdue
    ? t('planned.overdue', { days: Math.abs(daysLeft) })
    : daysLeft === 0 ? t('common.dueToday')
    : t('pending.daysLeft', { days: daysLeft })

  const REF_DAYS = 30
  const pct = daysLeft <= 0 ? 100 : Math.min(100, Math.max(0, ((REF_DAYS - daysLeft) / REF_DAYS) * 100))

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

// ── Item icon ──────────────────────────────────────────────────
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
      {item.name[0]?.toUpperCase()}
    </div>
  )
}

export default function PlannedBills({ currentDate = new Date() }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const { categoryMap, receiverMap } = useSharedData()
  const c = useCardCustomization('Planned Bills')

  const [items,     setItems]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [collapsed, setCollapsed] = useCollapsed('PlannedBills')
  const [filter, setFilter] = useState('month')
  const [hidePaid, setHidePaid] = useState(() => localStorage.getItem('planned-hide-paid') === 'true')

  useEffect(() => { if (user?.id) load() }, [user?.id, currentDate])

  async function load() {
    const [{ data: activeData }, { data: paidData }] = await Promise.all([
      supabase.from('planned_bills').select('*').eq('user_id', user.id).eq('status', 'pending').order('pay_before'),
      supabase.from('planned_bills').select('*').eq('user_id', user.id).eq('status', 'paid').order('pay_before'),
    ])
    setItems([...(activeData ?? []), ...(paidData ?? [])].sort((a, b) => {
      const aPaid = a.status === 'paid', bPaid = b.status === 'paid'
      if (aPaid !== bPaid) return aPaid ? 1 : -1
      return a.pay_before.localeCompare(b.pay_before)
    }))
  }

  async function markPaid(item) {
    if (loading) return
    setLoading(true)
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
      amount:         item.amount,
      date:           today,
      source:         'planned',
      receiver_id:    item.receiver_id    || null,
      category_id:    item.category_id    || null,
      subcategory_id: item.subcategory_id || null,
      card_id:        item.card_id        || null,
      comment:        commentParts.join(' — ') || null,
      is_cash:        false,
      is_deleted:     false,
      status:         'completed',
    }).select().single()

    await supabase.from('planned_bills').update({
      status: 'paid',
      transaction_id: tx?.id ?? null,
    }).eq('id', item.id)

    window.dispatchEvent(new CustomEvent('transaction-saved'))
    setLoading(false)
    load()
  }

  async function undoPaid(item) {
    if (loading) return
    setLoading(true)
    if (item.transaction_id) {
      await supabase.from('transactions').update({ is_deleted: true }).eq('id', item.transaction_id)
    }
    await supabase.from('planned_bills').update({ status: 'pending', transaction_id: null }).eq('id', item.id)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    setLoading(false)
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
                <CalendarDays size={14} />
              </button>
              <button type="button" onClick={() => setCollapsed(c => !c)} className="font-semibold text-base hover:text-white/70 transition-colors">{t('planned.title')}</button>
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHidePaid(h => { localStorage.setItem('planned-hide-paid', String(!h)); return !h })}
                className="transition-colors"
                title={hidePaid ? 'Show paid' : 'Hide paid'}
                style={{ color: hidePaid ? 'var(--color-accent)' : 'var(--color-muted)' }}
              >
                {hidePaid ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                onClick={() => { setEditItem(null); setShowModal(true) }}
                className="text-muted hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {!collapsed && (<>
          {/* List */}
          {items.filter(item => {
            if (filter !== 'all') {
              const d = new Date(item.pay_before + 'T00:00:00')
              if (d.getFullYear() !== currentDate.getFullYear() || d.getMonth() !== currentDate.getMonth()) return false
            }
            return !hidePaid || item.status !== 'paid'
          }).length === 0 ? (
            <p className="text-center text-muted text-sm py-6">{filter === 'month' ? t('planned.noBillsMonth') : t('planned.noBills')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.filter(item => {
                if (filter === 'all') return true
                const d = new Date(item.pay_before + 'T00:00:00')
                return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()
              }).map(item => {
                const receiver = receiverById(item.receiver_id)
                const cat      = categoryById(item.category_id)
                const sub      = categoryById(item.subcategory_id)
                const isPaid   = item.status === 'paid'
                return (
                  <div key={item.id} className={`flex items-start gap-3 transition-opacity ${isPaid ? 'opacity-45' : ''}`}>

                    {/* Check button */}
                    <button
                      onClick={() => isPaid ? undoPaid(item) : markPaid(item)}
                      disabled={loading}
                      title={isPaid ? t('planned.undoPaid') : t('planned.markPaid')}
                      className="mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all disabled:pointer-events-none"
                      style={isPaid
                        ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                        : { borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)' }}
                      onMouseEnter={e => { if (!isPaid) { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-accent) 70%, transparent)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-accent) 12%, transparent)' } }}
                      onMouseLeave={e => { if (!isPaid) { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-accent) 40%, transparent)'; e.currentTarget.style.background = '' } }}
                    >
                      <Check size={11} className="text-white" />
                    </button>

                    {/* Icon */}
                    <ItemIcon item={item} receiver={receiver} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => { setEditItem(item); setShowModal(true) }}
                        className={`text-sm hover:text-white/70 transition-colors text-left font-medium leading-tight truncate w-full ${isPaid ? 'line-through text-white/50' : 'text-white'}`}
                      >
                        {item.name}
                      </button>
                      {!isPaid && (cat || sub) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {cat && <CategoryPill name={cat.name} color={cat.color} icon={cat.icon} />}
                          {sub && <CategoryPill name={sub.name} color={sub.color} icon={sub.icon} />}
                        </div>
                      )}
                      {!isPaid && <DaysProgress payBefore={item.pay_before} t={t} />}
                    </div>

                    {/* Amount */}
                    <div className="shrink-0">
                      <span className="text-sm text-white font-medium">
                        {fmt(item.amount)}
                      </span>
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
        <AddPlannedBillModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSaved={load}
        />
      )}
    </>
  )
}
