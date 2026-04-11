import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .then(({ data }) => { if (data) setTransactions(data) })
  }, [userId])

  async function addTransaction(tx) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...tx, user_id: userId })
      .select()
      .single()
    if (!error && data) setTransactions(prev => [data, ...prev])
    return { data, error }
  }

  async function updateTransaction(id, updates) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setTransactions(prev => prev.map(t => t.id === id ? data : t))
    return { data, error }
  }

  async function deleteTransaction(id) {
    const { error } = await supabase.from('transactions').update({ is_deleted: true }).eq('id', id)
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  return { transactions, addTransaction, updateTransaction, deleteTransaction }
}
