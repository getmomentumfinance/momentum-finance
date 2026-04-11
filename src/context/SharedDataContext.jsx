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

  const load = useCallback(async () => {
    if (!user?.id) return
    const [{ data: catData }, { data: recData }, { data: grpData }] = await Promise.all([
      supabase.from('categories').select('id, name, color, icon, importance').eq('user_id', user.id),
      supabase.from('receivers').select('*').eq('user_id', user.id),
      supabase.from('receiver_groups').select('*').eq('user_id', user.id).order('created_at'),
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

    // Build receiver name → color map from group gradients
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
    <SharedDataContext.Provider value={{ categories, receivers, categoryMap, receiverMap, receiverGroups, receiverGroupMap, receiverColorMap }}>
      {children}
    </SharedDataContext.Provider>
  )
}

export function useSharedData() {
  return useContext(SharedDataContext)
}
