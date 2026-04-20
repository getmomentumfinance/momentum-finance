import { useState, useEffect, useMemo } from 'react'
import { CreditCard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { supabase } from '../../lib/supabase'
import CardCarousel from '../shared/CardCarousel'

export default function MyCardsWidget({ currentDate = new Date() }) {
  const { user } = useAuth()
  const { fmt } = usePreferences()

  const [cards, setCards]   = useState([])
  const [banks, setBanks]   = useState([])
  const [txs, setTxs]       = useState([])
  const [loading, setLoading] = useState(true)

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const periodLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user?.id) return
    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])

  async function load() {
    setLoading(true)

    const [{ data: cardsData }, { data: banksData }] = await Promise.all([
      supabase.from('cards').select('id, name, bank_id').eq('user_id', user.id).order('created_at'),
      supabase.from('banks').select('*').eq('user_id', user.id).order('name'),
    ])

    const start = new Date(year, month, 1).toISOString().slice(0, 10)
    const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)

    const { data: txsData } = await supabase
      .from('transactions')
      .select('card_id, type, amount, is_split_parent')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .gte('date', start)
      .lte('date', end)

    setCards(cardsData ?? [])
    setBanks(banksData ?? [])
    setTxs(txsData ?? [])
    setLoading(false)
  }

  const carouselItems = useMemo(() => {
    const bankMap = Object.fromEntries((banks ?? []).map(b => [b.id, b]))

    const perCard = {}
    for (const t of txs) {
      if (t.is_split_parent) continue
      const id = t.card_id ?? '__none__'
      if (!perCard[id]) perCard[id] = { expense: 0, income: 0 }
      if (t.type === 'expense') perCard[id].expense += Number(t.amount)
      if (t.type === 'income')  perCard[id].income  += Number(t.amount)
    }

    return cards
      .filter(card => (perCard[card.id]?.expense ?? 0) > 0)
      .map((card, idx) => ({
        id:          card.id,
        card,
        bank:        card.bank_id ? (bankMap[card.bank_id] ?? null) : null,
        exp:         perCard[card.id]?.expense ?? 0,
        inc:         perCard[card.id]?.income  ?? 0,
        periodLabel,
        fmt,
        idx,
      }))
  }, [cards, banks, txs, periodLabel, fmt])

  return (
    <div
      className="h-full rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <CreditCard size={13} className="text-white/40" />
        </div>
        <span className="font-semibold text-sm text-white/70">My Cards</span>
        <span className="ml-auto text-xs text-white/30">{periodLabel}</span>
      </div>

      {/* Content */}
      <div className="bg-dash-card px-4 py-4">
        {loading ? (
          <p className="text-xs text-white/25 py-2">Loading…</p>
        ) : carouselItems.length === 0 ? (
          <p className="text-xs text-white/25 py-2">No card spending this month.</p>
        ) : (
          <CardCarousel items={carouselItems} />
        )}
      </div>
    </div>
  )
}
