import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useBanks() {
  const { user } = useAuth()
  const [banks, setBanks] = useState([])
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    supabase
      .from('banks')
      .select('*')
      .eq('user_id', userId)
      .order('name')
      .then(({ data }) => { if (data) setBanks(data) })
  }, [userId])

  async function addBank(bank) {
    const { data, error } = await supabase
      .from('banks')
      .insert({ ...bank, user_id: userId })
      .select()
      .single()
    if (!error && data) setBanks(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function updateBank(id, updates) {
    const { data, error } = await supabase
      .from('banks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setBanks(prev => prev.map(b => b.id === id ? data : b))
  }

  async function deleteBank(id) {
    const { error } = await supabase.from('banks').delete().eq('id', id)
    if (!error) setBanks(prev => prev.filter(b => b.id !== id))
  }

  return { banks, addBank, updateBank, deleteBank }
}
