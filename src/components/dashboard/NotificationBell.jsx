import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bell, AlertTriangle, Clock, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'
import { useNotificationsContext } from '../../context/NotificationsContext'
import PaymentModal from './PaymentModal'
import BudgetRolloverModal from '../budgets/BudgetRolloverModal'

const SEVERITY_COLOR = {
  alert:   'var(--color-alert)',
  warning: 'var(--color-warning)',
  info:    'var(--color-accent)',
}
const SEVERITY_LABEL = { alert: 'Urgent', warning: 'Soon', info: 'Info' }

export default function NotificationBell({ currentDate = new Date() }) {
  const { user } = useAuth()
  const ctx = useNotificationsContext()
  const ownHook = useNotifications(ctx ? null : user?.id, ctx ? new Date(0) : currentDate)
  const { items } = ctx ?? ownHook
  const navigate  = useNavigate()
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState(null)
  const [pos,      setPos]      = useState({ top: 0, right: 0 })
  const [dismissed, setDismissed] = useState(new Set())
  const bellRef  = useRef(null)
  const popupRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    try {
      const saved = JSON.parse(localStorage.getItem(`dismissed-notifs-${user.id}`)) ?? []
      setDismissed(new Set(saved))
    } catch {}
  }, [user?.id])

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (
        bellRef.current  && !bellRef.current.contains(e.target) &&
        popupRef.current && !popupRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleToggle() {
    if (!open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen(o => !o)
  }

  function stableKey(item) { return item.id }

  function dismiss(e, item) {
    e.stopPropagation()
    setDismissed(prev => {
      const next = new Set([...prev, stableKey(item)])
      if (user?.id) localStorage.setItem(`dismissed-notifs-${user.id}`, JSON.stringify([...next]))
      return next
    })
  }

  const visibleItems = items.filter(i => !dismissed.has(stableKey(i)))
  const alertCount   = visibleItems.filter(i => i.severity === 'alert').length
  const warningCount = visibleItems.filter(i => i.severity === 'warning').length
  const totalBadge   = alertCount + warningCount

  const bellColor = totalBadge > 0 ? 'var(--color-accent)' : undefined

  return (
    <>
      <div ref={bellRef}>
        <button
          onClick={handleToggle}
          className={`p-2 transition-colors relative ${!bellColor && !open ? 'text-muted hover:text-white' : ''}`}
          style={bellColor ? { color: bellColor } : open ? { color: 'white' } : undefined}
        >
          <Bell size={15} />
          {totalBadge > 0 && (
            <span
              className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] rounded-full
                text-[9px] font-bold flex items-center justify-center text-white px-0.5 leading-none"
              style={{ background: 'var(--color-accent)' }}
            >
              {totalBadge > 9 ? '9+' : totalBadge}
            </span>
          )}
        </button>
      </div>

      {open && createPortal(
        <div
          ref={popupRef}
          className="fixed w-80 rounded-xl overflow-hidden shadow-2xl"
          style={{
            top: pos.top,
            right: pos.right,
            zIndex: 9999,
            background: 'color-mix(in srgb, var(--color-dash-card) 78%, transparent)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(var(--card-blur, 14px))',
            WebkitBackdropFilter: 'blur(var(--card-blur, 14px))',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-2">
              <Bell size={12} className="text-white/40" />
              <span className="font-semibold text-sm">Notifications</span>
            </div>
            <div className="flex gap-1.5">
              {alertCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-alert)30', color: 'var(--color-alert)' }}>
                  {alertCount} urgent
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-warning)25', color: 'var(--color-warning)' }}>
                  {warningCount} soon
                </span>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/[0.04]">
            {visibleItems.length === 0 ? (
              <p className="px-4 py-5 text-xs text-white/35 text-center">No pending notifications</p>
            ) : visibleItems.map((item) => {
              const { id, severity, label, detail, canPay } = item
              const Icon  = severity === 'alert' ? AlertTriangle : severity === 'warning' ? Clock : Bell
              const color = SEVERITY_COLOR[severity]
              return (
                <div
                  key={id}
                  onClick={() => {
                    setOpen(false)
                    if (item.type === 'budget') { navigate('/budgets'); return }
                    setSelected(item)
                  }}
                  className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                    <Icon size={11} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">{label}</p>
                    <p className="text-xs text-white/40">{detail}</p>
                  </div>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                    {item.type === 'rollover' ? 'Resolve' : canPay ? 'Pay' : SEVERITY_LABEL[severity]}
                  </span>
                  <button
                    onClick={e => dismiss(e, item)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>,
        document.body
      )}

      {selected && selected.canPay && (
        <PaymentModal item={selected} onClose={() => setSelected(null)} />
      )}
      {selected && selected.type === 'rollover' && (
        <BudgetRolloverModal
          item={selected}
          onClose={() => setSelected(null)}
          onResolved={() => setSelected(null)}
        />
      )}
    </>
  )
}
