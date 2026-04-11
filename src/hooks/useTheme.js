import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TRANSACTION_TYPES, typeCssVar } from '../constants/transactionTypes'

let _loadedPrefs = null
export function getLoadedPrefs() { return _loadedPrefs }

function applyTheme(prefs) {
  _loadedPrefs = prefs
  if (prefs.accent_color) {
    document.documentElement.style.setProperty('--color-accent', prefs.accent_color)
  }
  if (prefs.button_style) {
    document.documentElement.style.setProperty('--btn-bg', prefs.button_style)
  }
  if (prefs.type_colors) {
    Object.entries(prefs.type_colors).forEach(([type, color]) => {
      document.documentElement.style.setProperty(typeCssVar(type), color)
    })
  }
  if (prefs.progress_bar_color) {
    document.documentElement.style.setProperty('--color-progress-bar', prefs.progress_bar_color)
  }
  if (prefs.alert_color) {
    document.documentElement.style.setProperty('--color-alert', prefs.alert_color)
  }
  if (prefs.warning_color) {
    document.documentElement.style.setProperty('--color-warning', prefs.warning_color)
  }
  if (prefs.line_chart_color) {
    document.documentElement.style.setProperty('--color-line-chart', prefs.line_chart_color)
  }
  if (prefs.bar_chart_color) {
    document.documentElement.style.setProperty('--color-bar-chart', prefs.bar_chart_color)
  }
  window.dispatchEvent(new CustomEvent('theme-updated'))
}

export function useTheme() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('accent_color, button_style, type_colors, progress_bar_color, alert_color, warning_color, line_chart_color, bar_chart_color')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) console.error('[useTheme] failed to load preferences:', error)
      if (data) applyTheme(data)
    }
    load()
  }, [user?.id])
}

function notifyThemeUpdated() {
  window.dispatchEvent(new CustomEvent('theme-updated'))
}

async function upsertPref(userId, patch) {
  await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
}

export async function saveAccentColor(userId, color) {
  document.documentElement.style.setProperty('--color-accent', color)
  const current = getComputedStyle(document.documentElement).getPropertyValue('--btn-bg').trim()
  if (current.includes('var(--color-accent)')) {
    document.documentElement.style.setProperty('--btn-bg', `linear-gradient(to right, ${color}, var(--color-accent-2))`)
  }
  notifyThemeUpdated()
  await upsertPref(userId, { accent_color: color })
}

export async function saveButtonStyle(userId, style) {
  document.documentElement.style.setProperty('--btn-bg', style)
  notifyThemeUpdated()
  await upsertPref(userId, { button_style: style })
}

export async function saveProgressBarColor(userId, color) {
  document.documentElement.style.setProperty('--color-progress-bar', color)
  notifyThemeUpdated()
  await upsertPref(userId, { progress_bar_color: color })
}

export async function saveAlertColor(userId, color) {
  document.documentElement.style.setProperty('--color-alert', color)
  notifyThemeUpdated()
  await upsertPref(userId, { alert_color: color })
}

export async function saveWarningColor(userId, color) {
  document.documentElement.style.setProperty('--color-warning', color)
  notifyThemeUpdated()
  await upsertPref(userId, { warning_color: color })
}

export async function saveLineChartColor(userId, color) {
  document.documentElement.style.setProperty('--color-line-chart', color)
  notifyThemeUpdated()
  await upsertPref(userId, { line_chart_color: color })
}

export async function saveBarChartColor(userId, color) {
  document.documentElement.style.setProperty('--color-bar-chart', color)
  notifyThemeUpdated()
  await upsertPref(userId, { bar_chart_color: color })
}

export async function saveCalendarHeatmapColor(userId, color) {
  // calendar_heatmap_color column does not exist in user_preferences — CSS var only
  document.documentElement.style.setProperty('--color-calendar-heatmap', color)
  notifyThemeUpdated()
}

export async function saveAllTypeColors(userId, typeColors) {
  Object.entries(typeColors).forEach(([type, color]) => {
    document.documentElement.style.setProperty(typeCssVar(type), color)
  })
  notifyThemeUpdated()
  await upsertPref(userId, { type_colors: typeColors })
}

const COLOR_VARS = [
  '--color-accent', '--btn-bg', '--color-progress-bar',
  '--color-alert', '--color-warning', '--color-line-chart',
  '--color-bar-chart', '--color-calendar-heatmap',
]

export async function resetAllColors(userId) {
  const el = document.documentElement
  COLOR_VARS.forEach(v => el.style.removeProperty(v))
  TRANSACTION_TYPES.forEach(({ value }) => el.style.removeProperty(typeCssVar(value)))
  ;['--type-income-earned', '--type-income-not-earned'].forEach(v => el.style.removeProperty(v))
  _loadedPrefs = null
  if (userId) {
    await supabase.from('user_preferences').upsert({
      user_id:           userId,
      accent_color:      null,
      button_style:      null,
      progress_bar_color: null,
      alert_color:       null,
      warning_color:     null,
      line_chart_color:  null,
      bar_chart_color:   null,
      type_colors:       null,
      importance_colors: null,
    }, { onConflict: 'user_id' })
  }
  window.dispatchEvent(new CustomEvent('theme-updated'))
}

export async function saveTypeColor(userId, typeValue, color) {
  document.documentElement.style.setProperty(typeCssVar(typeValue), color)
  notifyThemeUpdated()
  const { data } = await supabase
    .from('user_preferences')
    .select('type_colors')
    .eq('user_id', userId)
    .maybeSingle()
  const merged = { ...(data?.type_colors ?? {}), [typeValue]: color }
  await upsertPref(userId, { type_colors: merged })
}
