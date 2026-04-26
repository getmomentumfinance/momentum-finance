import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useSharedData } from '../../context/SharedDataContext'
import { supabase } from '../../lib/supabase'
import CardCarousel from '../shared/CardCarousel'

function computeBalance(card, allTxs) {
  const delta = allTxs
    .filter(t => t.card_id === card.id && !t.is_split_parent)
    .reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0)
  return Number(card.initial_balance ?? 0) + delta
}

export default function MyCardsWidget({ currentDate = new Date() }) {
  const { user } = useAuth()
  const { fmt } = usePreferences()
  const { cards, allTransactions } = useSharedData()

  const [banks,   setBanks]   = useState([])
  const [loading, setLoading] = useState(true)

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const periodLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user?.id) return
    const start = new Date(year, month, 1).toISOString().slice(0, 10)
    const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)
    setLoading(true)
    supabase.from('banks').select('*').eq('user_id', user.id).order('name')
      .then(({ data }) => { setBanks(data ?? []); setLoading(false) })
  }, [user?.id, year, month])

  const start = new Date(year, month, 1).toISOString().slice(0, 10)
  const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)

  const monthTxs = useMemo(
    () => allTransactions.filter(t => t.date >= start && t.date <= end),
    [allTransactions, start, end]
  )

  const carouselItems = useMemo(() => {
    const bankMap = Object.fromEntries((banks ?? []).map(b => [b.id, b]))

    const perCard = {}
    for (const t of monthTxs) {
      if (t.is_split_parent) continue
      const id = t.card_id ?? '__none__'
      if (!perCard[id]) perCard[id] = { expense: 0, income: 0 }
      if (t.type === 'expense') perCard[id].expense += Number(t.amount)
      if (t.type === 'income')  perCard[id].income  += Number(t.amount)
    }

    return cards
      .filter(card => (perCard[card.id]?.expense ?? 0) > 0 || computeBalance(card, allTransactions) !== 0)
      .map((card, idx) => ({
        id:          card.id,
        card,
        bank:        card.bank_id ? (bankMap[card.bank_id] ?? null) : null,
        exp:         perCard[card.id]?.expense ?? 0,
        inc:         perCard[card.id]?.income  ?? 0,
        balance:     computeBalance(card, allTransactions),
        periodLabel,
        fmt,
        idx,
      }))
  }, [cards, banks, allTransactions, monthTxs, periodLabel, fmt])

  return (
    <div style={{
      maskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
    }}>
      {loading ? (
        <p className="text-xs text-white/25 px-4 py-2">Loading…</p>
      ) : carouselItems.length === 0 ? (
        <p className="text-xs text-white/25 px-4 py-2">No cards yet.</p>
      ) : (
        <CardCarousel items={carouselItems} />
      )}
    </div>
  )
}
