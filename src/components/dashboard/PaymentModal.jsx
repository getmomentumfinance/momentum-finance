import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePreferences } from '../../context/UserPreferencesContext'

export default function PaymentModal({ item, onClose }) {
  const { fmt, t } = usePreferences()
  const [date,    setDate]    = useState(() => { const _d = new Date(); return `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}` })
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)

  async function handlePay() {
    setSaving(true)
    try {
      if (item.type === 'pending') {
        await supabase.from('pending_items').update({ status: 'paid' }).eq('id', item.recordId)
      } else if (item.type === 'planned') {
        await supabase.from('planned_bills').update({ status: 'paid' }).eq('id', item.recordId)
      } else if (item.type === 'bill') {
        await supabase.from('recurring_bill_payments').insert({ bill_id: item.recordId, period: item.period })
      } else if (item.type === 'sub') {
        await supabase.from('subscription_payments').insert({ subscription_id: item.recordId, period: item.period })
      }
      window.dispatchEvent(new Event('transaction-saved'))
      setDone(true)
      setTimeout(onClose, 1200)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const isBudget = item.type === 'budget'

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 relative"
        style={{
          background: 'color-mix(in srgb, var(--color-dash-card) 78%, transparent)',
          backdropFilter: 'blur(var(--card-blur, 14px))',
          WebkitBackdropFilter: 'blur(var(--card-blur, 14px))',
          width: '340px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors">
          <X size={14} />
        </button>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--color-progress-bar)' }} />
            <p className="font-semibold text-base">{t('pay.markedPaid')}</p>
            <p className="text-xs text-white/40 mt-1">{t('pay.notifRefresh')}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">
              {item.type === 'pending' ? t('pay.overduePayment')
               : item.type === 'planned' ? t('pay.plannedBill')
               : item.type === 'bill'    ? t('pay.recurringBill')
               : item.type === 'sub'     ? t('pay.subscription')
               : t('pay.budgetAlert')}
            </p>
            <h3 className="font-bold text-xl mb-1 pr-6 leading-tight">{item.label}</h3>
            <p className="text-xs text-white/40 mb-5">{item.detail}</p>

            {/* Amount */}
            {item.amount != null && (
              <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs text-white/50">{t('pay.amountDue')}</span>
                <span className="font-bold text-2xl tabular-nums">{fmt(item.amount)}</span>
              </div>
            )}

            {/* Date picker (not shown for budgets) */}
            {!isBudget && (
              <div className="mb-5">
                <label className="text-xs text-white/50 block mb-1.5">{t('pay.paymentDate')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/60 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {isBudget ? t('common.close') : t('common.cancel')}
              </button>
              {!isBudget && (
                <button
                  onClick={handlePay}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                  style={{ background: 'var(--color-progress-bar)', color: 'white', opacity: saving ? 0.7 : 1 }}
                >
                  <CreditCard size={13} />
                  {saving ? t('pay.savingBtn') : t('pay.markPaid')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
