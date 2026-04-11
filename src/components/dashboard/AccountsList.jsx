import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCashLabel } from '../../hooks/useCashLabel'
import CardActivityModal from './CardActivityModal'
import { usePreferences } from '../../context/UserPreferencesContext'
import { SkeletonRow } from '../shared/Skeleton'

const CREDIT_TYPES = new Set(['income'])

function computeBalance(card, transactions) {
  const delta = transactions
    .filter(t => t.card_id === card.id && !t.is_cash && !t.split_parent_id)
    .reduce((sum, t) => sum + (CREDIT_TYPES.has(t.type) ? t.amount : -t.amount), 0)
  return Number(card.initial_balance) + delta
}

function computeCashBalance(cards, transactions) {
  const initial = cards
    .filter(c => c.type === 'cash')
    .reduce((s, c) => s + Number(c.initial_balance), 0)
  const txTotal = transactions
    .filter(t => t.is_cash)
    .reduce((sum, t) => sum + (CREDIT_TYPES.has(t.type) ? t.amount : -t.amount), 0)
  return initial + txTotal
}

export default function AccountsList({ currentDate }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const { label: cashLabel } = useCashLabel()
  const [cards,        setCards]        = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeCard,   setActiveCard]   = useState(undefined) // null = cash wallet, card obj = card

  useEffect(() => {
    if (!user?.id) return

    async function load() {
      const [{ data: c }, { data: t }] = await Promise.all([
        supabase.from('cards').select('id, name, type, initial_balance, is_main').eq('user_id', user.id).order('type').order('name'),
        supabase.from('transactions').select('card_id, type, amount, is_cash, split_parent_id').eq('user_id', user.id).eq('is_deleted', false),
      ])
      if (c) setCards(c)
      if (t) setTransactions(t)
      setLoading(false)
    }

    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id])

  if (loading) {
    return (
      <div className="glass-card p-4 h-full flex flex-col gap-1">
        {[1,2,3].map(i => <SkeletonRow key={i} />)}
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="glass-card p-4 h-full flex items-center justify-center">
        <span className="text-xs text-muted">{t('accounts.noCards')}</span>
      </div>
    )
  }

  const cashBalance  = computeCashBalance(cards, transactions)
  const nonCashCards = cards.filter(c => c.type !== 'cash')

  return (
    <>
      <div className="glass-card p-4 flex flex-col gap-2 h-full">
        {/* Cash wallet */}
        <div
          className="flex flex-col py-2 border-b border-border cursor-pointer hover:bg-white/[0.03] rounded-lg px-1 -mx-1 transition-colors"
          onClick={() => setActiveCard(null)}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted uppercase tracking-widest font-medium">{cashLabel}</span>
            <span className="text-[9px] text-white/25 uppercase tracking-widest">· {t('common.wallet')}</span>
          </div>
          <span className={`text-sm font-semibold mt-0.5 ${cashBalance < 0 ? 'text-[var(--color-alert)]' : 'text-white'}`}>
            {fmt(cashBalance)}
          </span>
        </div>

        {nonCashCards.map(card => {
          const balance = computeBalance(card, transactions)
          return (
            <div
              key={card.id}
              className="flex flex-col py-2 border-b border-border last:border-0 cursor-pointer hover:bg-white/[0.03] rounded-lg px-1 -mx-1 transition-colors"
              onClick={() => setActiveCard(card)}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted uppercase tracking-widest font-medium">{card.name}</span>
                {card.is_main && (
                  <span className="text-[9px] text-white/25 uppercase tracking-widest">· main</span>
                )}
              </div>
              <span className={`text-sm font-semibold mt-0.5 ${balance < 0 ? 'text-[var(--color-alert)]' : 'text-white'}`}>
                {fmt(balance)}
              </span>
            </div>
          )
        })}
      </div>

      {activeCard !== undefined && currentDate && (
        <CardActivityModal
          card={activeCard}
          currentDate={currentDate}
          onClose={() => setActiveCard(undefined)}
        />
      )}
    </>
  )
}
