import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, X, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTransactionModal } from '../../context/TransactionModalContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useNavigate } from 'react-router-dom'

const STEP_IDS = ['card', 'category', 'transaction', 'budget']

export default function GetStartedCard() {
  const { user } = useAuth()
  const { t } = usePreferences()
  const { openTransactionModal } = useTransactionModal()
  const navigate = useNavigate()

  const STEPS = [
    { id: 'card',        label: t('getstarted.addCard'),   hint: t('getstarted.addCardHint') },
    { id: 'category',   label: t('getstarted.addCat'),    hint: t('getstarted.addCatHint')  },
    { id: 'transaction', label: t('getstarted.addTx'),     hint: t('getstarted.addTxHint')   },
    { id: 'budget',     label: t('getstarted.addBudget'), hint: t('getstarted.addBudgetHint') },
  ]

  const storageKey = user?.id ? `get-started-dismissed-${user.id}` : null
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(storageKey) } catch { return false }
  })
  const [completed, setCompleted] = useState({ card: false, category: false, transaction: false, budget: false })

  useEffect(() => {
    if (!user?.id || dismissed) return
    async function check() {
      const [{ count: cards }, { count: cats }, { count: txs }, { count: budgets }] = await Promise.all([
        supabase.from('cards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('parent_id', null),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_deleted', false),
        supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setCompleted({
        card:        (cards    ?? 0) > 0,
        category:    (cats     ?? 0) > 0,
        transaction: (txs      ?? 0) > 0,
        budget:      (budgets  ?? 0) > 0,
      })
    }
    check()
    window.addEventListener('transaction-saved', check)
    return () => window.removeEventListener('transaction-saved', check)
  }, [user?.id, dismissed])

  function dismiss() {
    setDismissed(true)
    if (storageKey) localStorage.setItem(storageKey, '1')
  }

  const doneCount = Object.values(completed).filter(Boolean).length
  const allDone   = doneCount === STEP_IDS.length

  // Auto-dismiss after a short delay when all done
  useEffect(() => {
    if (!allDone) return
    const timer = setTimeout(dismiss, 3000)
    return () => clearTimeout(timer)
  }, [allDone])

  if (dismissed) return null

  function handleStepClick(id) {
    if (completed[id]) return
    if (id === 'transaction') { openTransactionModal(); return }
    if (id === 'card')        { navigate('/settings?tab=cards'); return }
    if (id === 'category')    { navigate('/settings?tab=categories'); return }
    if (id === 'budget')      { navigate('/budgets'); return }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden mb-6"
      style={{
        background: 'color-mix(in srgb, var(--color-accent) 6%, var(--color-dash-card))',
        border: '1px solid color-mix(in srgb, var(--color-accent) 18%, transparent)',
      }}>
      {/* Glow */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 70%)' }} />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white text-base">
              {allDone ? t('getstarted.allDone') : t('getstarted.title')}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {allDone
                ? t('getstarted.enjoyApp')
                : t('getstarted.progress', { done: doneCount, total: STEPS.length })}
            </p>
          </div>
          <button onClick={dismiss}
            className="text-white/25 hover:text-white/60 transition-colors p-0.5">
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-white/8 mb-4 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(doneCount / STEPS.length) * 100}%`, background: 'var(--color-accent)' }} />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 gap-2">
          {STEPS.map(({ id, label, hint }) => {
            const done = completed[id]
            return (
              <button
                key={id}
                onClick={() => handleStepClick(id)}
                disabled={done}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group"
                style={{
                  background: done ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: done ? 'default' : 'pointer',
                }}
              >
                {done
                  ? <CheckCircle2 size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  : <Circle size={16} className="text-white/20 shrink-0 group-hover:text-white/40 transition-colors" />
                }
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${done ? 'text-white/30 line-through' : 'text-white/80 group-hover:text-white transition-colors'}`}>
                    {label}
                  </p>
                  {!done && <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{hint}</p>}
                </div>
                {!done && <ChevronRight size={12} className="text-white/20 shrink-0 group-hover:text-white/40 transition-colors" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
