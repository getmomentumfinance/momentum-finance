import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, RotateCcw, ArrowRight, Minus, CheckCircle, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'

const PERIOD_LABEL = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }

export default function BudgetRolloverModal({ item, onClose, onResolved }) {
  const { budget, leftover, prevPeriodKey } = item
  const { user } = useAuth()
  const { fmt } = usePreferences()

  const defaultAction = budget.rollover_behavior === 'accumulate' ? 'rollover' : 'transfer'
  const [action,         setAction]         = useState(defaultAction)
  const [transferCardId, setTransferCardId] = useState(budget.card_id ?? '')
  const [cards,          setCards]          = useState([])
  const [cardOpen,       setCardOpen]       = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [done,           setDone]           = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('cards').select('id, name').eq('user_id', user.id).order('created_at')
      .then(({ data }) => setCards(data ?? []))
  }, [user?.id])

  const selectedCard = cards.find(c => c.id === transferCardId)
  const budgetName   = item.label?.replace(' · Period ended', '') ?? budget.name ?? 'Budget'
  const periodLabel  = PERIOD_LABEL[budget.period] ?? budget.period

  async function handleResolve() {
    setSaving(true)
    try {
      await supabase.from('budget_period_resolutions').insert({
        user_id:        user.id,
        budget_id:      budget.id,
        period_key:     prevPeriodKey,
        action,
        leftover_amount: leftover,
      })

      if (action === 'rollover') {
        await supabase.from('budgets')
          .update({ rollover_amount: leftover })
          .eq('id', budget.id)
      } else if (action === 'transfer') {
        // create an income transaction on the source card
        await supabase.from('transactions').insert({
          user_id:     user.id,
          type:        'income',
          description: `Budget rollover — ${budgetName}`,
          amount:      leftover,
          date:        new Date().toISOString().slice(0, 10),
          card_id:     transferCardId || budget.card_id,
          is_cash:     false,
        })
        // clear any existing rollover amount
        await supabase.from('budgets')
          .update({ rollover_amount: 0 })
          .eq('id', budget.id)
      }
      // 'keep': just record the resolution, no money movement

      window.dispatchEvent(new Event('transaction-saved'))
      setDone(true)
      setTimeout(() => { onResolved?.(); onClose() }, 1300)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 relative w-[360px]"
        style={{
          background: 'color-mix(in srgb, var(--color-dash-card) 78%, transparent)',
          backdropFilter: 'blur(var(--card-blur, 14px))',
          WebkitBackdropFilter: 'blur(var(--card-blur, 14px))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
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
            <p className="font-semibold text-base">Resolved!</p>
            <p className="text-xs text-white/40 mt-1">Budget updated</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">{periodLabel} budget · Period ended</p>
            <h3 className="font-bold text-xl mb-1 pr-6 leading-tight">{budgetName}</h3>
            <p className="text-xs text-white/40 mb-5">Choose what to do with the leftover amount</p>

            {/* Leftover amount */}
            <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs text-white/50">Leftover</span>
              <span className="font-bold text-2xl tabular-nums" style={{ color: 'var(--color-progress-bar)' }}>
                {fmt(leftover)}
              </span>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2 mb-5">
              {/* Roll over */}
              <button
                type="button"
                onClick={() => setAction('rollover')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  border: `1px solid ${action === 'rollover' ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)'}`,
                  background: action === 'rollover' ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: action === 'rollover' ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)' : 'rgba(255,255,255,0.05)' }}>
                  <RotateCcw size={13} style={{ color: action === 'rollover' ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">Roll over to next period</p>
                  <p className="text-[11px] text-white/40">{fmt(leftover)} added to next {periodLabel?.toLowerCase()} budget</p>
                </div>
              </button>

              {/* Transfer to card */}
              <button
                type="button"
                onClick={() => setAction('transfer')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  border: `1px solid ${action === 'transfer' ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)'}`,
                  background: action === 'transfer' ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: action === 'transfer' ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)' : 'rgba(255,255,255,0.05)' }}>
                  <ArrowRight size={13} style={{ color: action === 'transfer' ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">Transfer to card</p>
                  <p className="text-[11px] text-white/40">Add {fmt(leftover)} as income to source card</p>
                </div>
              </button>

              {/* Keep as is */}
              <button
                type="button"
                onClick={() => setAction('keep')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  border: `1px solid ${action === 'keep' ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)'}`,
                  background: action === 'keep' ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: action === 'keep' ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)' : 'rgba(255,255,255,0.05)' }}>
                  <Minus size={13} style={{ color: action === 'keep' ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">Keep as is</p>
                  <p className="text-[11px] text-white/40">Dismiss without moving or carrying over the amount</p>
                </div>
              </button>
            </div>

            {/* Card selector when transfer selected */}
            {action === 'transfer' && cards.length > 0 && (
              <div className="mb-5 relative">
                <button type="button" onClick={() => setCardOpen(v => !v)}
                  className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left hover:border-white/20 transition-colors">
                  {selectedCard
                    ? <span className="text-white/80">{selectedCard.name}</span>
                    : <span className="text-white/30">Select card…</span>}
                  <ChevronDown size={13} className="text-white/25 shrink-0 ml-2" />
                </button>
                {cardOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
                    {cards.map(c => (
                      <button key={c.id} type="button"
                        onClick={() => { setTransferCardId(c.id); setCardOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${transferCardId === c.id ? 'text-white/80 bg-white/[0.08]' : 'text-white/40'}`}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/60 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Later
              </button>
              <button
                onClick={handleResolve}
                disabled={saving || (action === 'transfer' && !transferCardId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                style={{ background: 'var(--color-progress-bar)', color: 'white', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
