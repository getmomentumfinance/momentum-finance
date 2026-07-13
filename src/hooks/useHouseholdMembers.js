import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useHouseholdMembers() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    supabase
      .from('household_members')
      .select('*')
      .eq('user_id', userId)
      .order('name')
      .then(({ data }) => { if (data) setMembers(data) })
  }, [userId])

  async function addMember(member) {
    const { data, error } = await supabase
      .from('household_members')
      .insert({ ...member, user_id: userId })
      .select()
      .single()
    if (!error && data) {
      setMembers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      window.dispatchEvent(new CustomEvent('household-member-saved'))
    }
  }

  async function updateMember(id, updates) {
    const { data, error } = await supabase
      .from('household_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setMembers(prev => prev.map(m => m.id === id ? data : m))
      window.dispatchEvent(new CustomEvent('household-member-saved'))
    }
  }

  async function deleteMember(id) {
    const { error } = await supabase.from('household_members').delete().eq('id', id)
    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== id))
      window.dispatchEvent(new CustomEvent('household-member-saved'))
    }
  }

  return { members, addMember, updateMember, deleteMember }
}
