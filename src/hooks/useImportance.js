import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_IMPORTANCE } from '../constants/importance'

export function useImportance() {
  const { user } = useAuth()
  const [colorOverrides, setColorOverrides] = useState({})

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_preferences')
      .select('importance_colors')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.importance_colors) setColorOverrides(data.importance_colors)
      })
  }, [user?.id])

  const importance = DEFAULT_IMPORTANCE.map(imp => ({
    ...imp,
    color: colorOverrides[imp.value] ?? imp.color,
  }))

  async function updateColor(value, color) {
    const next = { ...colorOverrides, [value]: color }
    setColorOverrides(next)
    await supabase.from('user_preferences').upsert(
      { user_id: user.id, importance_colors: next, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  async function resetColors() {
    setColorOverrides({})
    await supabase.from('user_preferences').upsert(
      { user_id: user.id, importance_colors: {}, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  async function setAllColors(colors) {
    setColorOverrides(colors)
    await supabase.from('user_preferences').upsert(
      { user_id: user.id, importance_colors: colors, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  return { importance, updateColor, resetColors, setAllColors }
}
