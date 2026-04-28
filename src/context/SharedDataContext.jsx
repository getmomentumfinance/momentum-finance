import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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
  budgets:          [],
  targets:          [],
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
  const [budgets,          setBudgets]          = useState([])
  const [targets,          setTargets]          = useState([])

  const debounceRef  = useRef(null)

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
      { data: budgetsData },
      { data: targetsData },
    ] = await Promise.all([
      supabase.from('categories').select('id, name, color, icon, importance').eq('user_id', user.id),
      supabase.from('receivers').select('id, name, type, domain, logo_url, group_id').eq('user_id', user.id),
      supabase.from('receiver_groups').select('id, name, color, gradient').eq('user_id', user.id).order('created_at'),
      supabase.from('cards').select('id, name, type, initial_balance, is_main, bank_id').eq('user_id', user.id).order('created_at'),
      supabase.from('transactions').select('id, card_id, type, amount, is_cash, split_parent_id, is_split_parent, date, category_id, subcategory_id, receiver_id, importance, is_earned').eq('user_id', user.id).eq('is_deleted', false).eq('is_split_parent', false).gte('date', `${new Date().getFullYear() - 5}-01-01`),
      supabase.from('pending_items').select('id, name, amount, pay_before, receiver_id, category_id').eq('user_id', user.id).eq('status', 'pending'),
      supabase.from('subscriptions').select('id, name, amount, billing_day, status, is_trial, trial_ends_at').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('recurring_bills').select('id, name, amount, frequency, due_day, next_due_date').eq('user_id', user.id),
      supabase.from('planned_bills').select('id, name, amount, pay_before').eq('user_id', user.id).eq('status', 'pending'),
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('targets').select('*').eq('user_id', user.id),
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
    setBudgets(budgetsData ?? [])
    setTargets(targetsData ?? [])
  }, [user?.id])

  useEffect(() => {
    if (user?.id) load()
  }, [user?.id, load])

  useEffect(() => {
    function debouncedLoad() {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(load, 300)
    }
    window.addEventListener('transaction-saved', debouncedLoad)
    window.addEventListener('receiver-group-saved', debouncedLoad)
    return () => {
      window.removeEventListener('transaction-saved', debouncedLoad)
      window.removeEventListener('receiver-group-saved', debouncedLoad)
      clearTimeout(debounceRef.current)
    }
  }, [load])

  return (
    <SharedDataContext.Provider value={{
      categories, receivers, categoryMap, receiverMap,
      receiverGroups, receiverGroupMap, receiverColorMap,
      cards, allTransactions, pendingItems,
      subscriptions, subPayments, recurringBills, billPayments, plannedBills,
      budgets, targets,
    }}>
      {children}
    </SharedDataContext.Provider>
  )
}

export function useSharedData() {
  return useContext(SharedDataContext)
}
