import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { extractNColors } from '../utils/gradientColors'

const SharedDataContext = createContext({
  categories:       [],
  receivers:        [],
  categoryMap:      {},
  receiverMap:      {},
  receiverGroups:   [],
  receiverGroupMap: {},
  receiverColorMap: {},
  cards:            [],
  allTransactions:  [],
  pendingItems:     [],
  subscriptions:    [],
  subPayments:      [],
  recurringBills:   [],
  billPayments:     [],
  plannedBills:     [],
})

export function SharedDataProvider({ children }) {
  const { user } = useAuth()
  const [categories,       setCategories]       = useState([])
  const [receivers,        setReceivers]        = useState([])
  const [categoryMap,      setCategoryMap]      = useState({})
  const [receiverMap,      setReceiverMap]      = useState({})
  const [receiverGroups,   setReceiverGroups]   = useState([])
  const [receiverGroupMap, setReceiverGroupMap] = useState({})
  const [receiverColorMap, setReceiverColorMap] = useState({})
  const [cards,            setCards]            = useState([])
  const [allTransactions,  setAllTransactions]  = useState([])
  const [pendingItems,     setPendingItems]     = useState([])
  const [subscriptions,    setSubscriptions]    = useState([])
  const [subPayments,      setSubPayments]      = useState([])
  const [recurringBills,   setRecurringBills]   = useState([])
  const [billPayments,     setBillPayments]     = useState([])
  const [plannedBills,     setPlannedBills]     = useState([])

  const load = useCallback(async () => {
    if (!user?.id) return

    // First batch — all independent queries in parallel
    const [
      { data: catData },
      { data: recData },
      { data: grpData },
      { data: cardsData },
      { data: txData },
      { data: pendingData },
      { data: subsData },
      { data: billsData },
      { data: plannedData },
    ] = await Promise.all([
      supabase.from('categories').select('id, name, color, icon, importance').eq('user_id', user.id),
      supabase.from('receivers').select('*').eq('user_id', user.id),
      supabase.from('receiver_groups').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('cards').select('id, name, type, initial_balance, is_main, bank_id').eq('user_id', user.id).order('created_at'),
      supabase.from('transactions').select('card_id, type, amount, is_cash, split_parent_id, is_split_parent, date').eq('user_id', user.id).eq('is_deleted', false),
      supabase.from('pending_items').select('id, name, amount, pay_before, receiver_id, category_id').eq('user_id', user.id).eq('status', 'pending'),
      supabase.from('subscriptions').select('id, name, amount, billing_day, status').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('recurring_bills').select('id, name, amount, frequency, due_day, next_due_date').eq('user_id', user.id),
      supabase.from('planned_bills').select('id, name, amount, pay_before').eq('user_id', user.id).eq('status', 'pending'),
    ])

    // Second batch — payment tables that depend on IDs from above
    const [{ data: subPmtsData }, { data: billPmtsData }] = await Promise.all([
      subsData?.length
        ? supabase.from('subscription_payments').select('subscription_id, period').in('subscription_id', subsData.map(s => s.id))
        : Promise.resolve({ data: [] }),
      billsData?.length
        ? supabase.from('recurring_bill_payments').select('bill_id, period').in('bill_id', billsData.map(b => b.id))
        : Promise.resolve({ data: [] }),
    ])

    const cats = catData ?? []
    const recs = recData ?? []
    const grps = grpData ?? []

    setCategories(cats)
    setReceivers(recs)
    setCategoryMap(Object.fromEntries(cats.map(c => [c.id, c])))
    setReceiverMap(Object.fromEntries(recs.map(r => [r.id, r])))
    setReceiverGroups(grps)
    setReceiverGroupMap(Object.fromEntries(grps.map(g => [g.id, g])))

    const colorMap = {}
    grps.forEach(g => {
      const members = recs
        .filter(r => r.group_id === g.id)
        .sort((a, b) => a.name.localeCompare(b.name))
      if (members.length === 0) return
      if (g.gradient) {
        const extracted = extractNColors(g.gradient, members.length)
        members.forEach((r, i) => { colorMap[r.name] = extracted[i] || g.color })
      } else {
        members.forEach(r => { colorMap[r.name] = g.color })
      }
    })
    setReceiverColorMap(colorMap)

    setCards(cardsData ?? [])
    setAllTransactions(txData ?? [])
    setPendingItems(pendingData ?? [])
    setSubscriptions(subsData ?? [])
    setSubPayments(subPmtsData ?? [])
    setRecurringBills(billsData ?? [])
    setBillPayments(billPmtsData ?? [])
    setPlannedBills(plannedData ?? [])
  }, [user?.id])

  useEffect(() => {
    if (user?.id) load()
  }, [user?.id, load])

  useEffect(() => {
    window.addEventListener('transaction-saved', load)
    window.addEventListener('receiver-group-saved', load)
    return () => {
      window.removeEventListener('transaction-saved', load)
      window.removeEventListener('receiver-group-saved', load)
    }
  }, [load])

  return (
    <SharedDataContext.Provider value={{
      categories, receivers, categoryMap, receiverMap,
      receiverGroups, receiverGroupMap, receiverColorMap,
      cards, allTransactions, pendingItems,
      subscriptions, subPayments, recurringBills, billPayments, plannedBills,
    }}>
      {children}
    </SharedDataContext.Provider>
  )
}

export function useSharedData() {
  return useContext(SharedDataContext)
}
