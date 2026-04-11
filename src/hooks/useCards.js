import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useCards() {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
      .then(({ data }) => { if (data) setCards(data) })
  }, [userId])

  async function addCard(card) {
    const { data, error } = await supabase
      .from('cards')
      .insert({ ...card, user_id: userId })
      .select()
      .single()
    if (!error && data) setCards(prev => [...prev, data])
  }

  async function updateCard(id, updates) {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setCards(prev => prev.map(c => c.id === id ? data : c))
  }

  async function deleteCard(id) {
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (!error) setCards(prev => prev.filter(c => c.id !== id))
  }

  async function setMainCard(id, type) {
    await supabase.from('cards').update({ is_main: false }).eq('user_id', userId).eq('type', type)
    const { data, error } = await supabase
      .from('cards')
      .update({ is_main: true })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setCards(prev => prev.map(c => c.type === type ? { ...c, is_main: c.id === id } : c))
    }
  }

  return { cards, addCard, updateCard, deleteCard, setMainCard }
}
