import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, Bell, Zap, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'
import { usePreferences } from '../../context/UserPreferencesContext'
import PaymentModal from './PaymentModal'

const SEVERITY_COLOR = {
  alert:   'var(--color-alert)',
  warning: 'var(--color-warning)',
  info:    'var(--color-accent)',
}

export default function ActionCenter({ currentDate = new Date() }) {
  const { user } = useAuth()
  const { t } = usePreferences()
  const { items, loading } = useNotifications(user?.id, currentDate)
  const [selected,  setSelected]  = useState(null)
  const [dismissed, setDismissed] = useState(new Set())

  useEffect(() => {
    if (!user?.id) return
    try {
      const saved = JSON.parse(localStorage.getItem(`dismissed-notifs-${user.id}`)) ?? []
      setDismissed(new Set(saved))
    } catch {}
  }, [user?.id])

  function stableKey(item) { return `${item.type}-${item.recordId}` }

  function dismiss(e, item) {
    e.stopPropagation()
    setDismissed(prev => {
      const next = new Set([...prev, stableKey(item)])
      if (user?.id) localStorage.setItem(`dismissed-notifs-${user.id}`, JSON.stringify([...next]))
      return next
    })
  }

  const visibleItems = items.filter(i => !dismissed.has(stableKey(i)))

  if (!loading && visibleItems.length === 0) return (
    <div className="h-full rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <Zap size={13} className="text-white/20" />
        </div>
        <span className="font-semibold text-sm text-white/30">{t('ac.title')}</span>
      </div>
      <div className="bg-dash-card px-4 py-3">
        <p className="text-xs text-white/25">{t('ac.allClear')}</p>
      </div>
    </div>
  )

  const alertCount   = visibleItems.filter(i => i.severity === 'alert').length
  const warningCount = visibleItems.filter(i => i.severity === 'warning').length
  const topColor     = alertCount > 0 ? 'var(--color-alert)' : 'var(--color-warning)'

  return (
    <>
      <div className="h-full flex flex-col rounded-2xl overflow-hidden"
        style={{ border: `1px solid color-mix(in srgb, ${topColor} 30%, transparent)` }}>

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0"
          style={{ background: `color-mix(in srgb, ${topColor} 12%, rgba(255,255,255,0.03))` }}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg"
              style={{ background: `color-mix(in srgb, ${topColor} 20%, transparent)` }}>
              <Zap size={13} style={{ color: topColor }} />
            </div>
            <span className="font-semibold text-sm text-white">{t('ac.title')}</span>
          </div>
          {!loading && (
            <div className="flex items-center gap-1.5">
              {alertCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-alert)30', color: 'var(--color-alert)' }}>
                  {t('ac.urgent', { n: alertCount })}
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-warning)25', color: 'var(--color-warning)' }}>
                  {t('ac.soon', { n: warningCount })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-dash-card px-4 py-3 flex flex-col divide-y divide-white/[0.04] flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <p className="text-xs text-muted py-2">{t('common.loading')}</p>
          ) : (
            visibleItems.map((item) => {
              const { id, severity, label, detail, canPay } = item
              const Icon  = severity === 'alert' ? AlertTriangle : severity === 'warning' ? Clock : Bell
              const color = SEVERITY_COLOR[severity]
              const severityLabel = severity === 'alert' ? t('ac.urgentLabel') : severity === 'warning' ? t('ac.soonLabel') : t('ac.infoLabel')
              return (
                <div
                  key={id}
                  onClick={() => setSelected(item)}
                  className="group flex items-center gap-3 py-2.5 cursor-pointer rounded-lg -mx-1 px-1 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: color }} />
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                    <Icon size={12} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">{label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{detail}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                    {canPay ? t('common.pay') : severityLabel}
                  </span>
                  <button
                    onClick={e => dismiss(e, item)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {selected && <PaymentModal item={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
