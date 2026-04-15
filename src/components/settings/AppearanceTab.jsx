import { useState, useEffect, useRef } from 'react'
import { Trash2, RotateCcw, Pencil, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { DESIGNS, CUSTOM_DESIGN_VARS } from '../../constants/designs'
import { useDesign } from '../../hooks/useDesign'
import { useCustomDesign } from '../../hooks/useCustomDesign'
import { saveAccentColor, saveButtonStyle, saveProgressBarColor, saveAlertColor, saveWarningColor, saveLineChartColor, saveBarChartColor, saveCalendarHeatmapColor, saveTypeColor, saveAllTypeColors, getLoadedPrefs, resetAllColors } from '../../hooks/useTheme'
import ColorPickerPopup, { useColorPicker } from '../shared/ColorPickerPopup'
import { useImportance } from '../../hooks/useImportance'
import { useCardPreferences } from '../../context/CardPreferencesContext'
import { useThemes } from '../../hooks/useThemes'
import { useGlassBlur } from '../../hooks/useGlassBlur'
import { TRANSACTION_TYPES, typeCssVar } from '../../constants/transactionTypes'
import { usePalette } from '../../context/PaletteContext'
import PaletteEditorModal from './PaletteEditorModal'
import { showToast } from '../shared/Toast'

const getCssVar = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

function readColors() {
  const p = getLoadedPrefs()
  return {
    accent:          getCssVar('--color-accent')           || p?.accent_color          || '',
    progress:        getCssVar('--color-progress-bar')     || p?.progress_bar_color    || '',
    button:          getCssVar('--btn-bg')                 || p?.button_style          || '',
    alert:           getCssVar('--color-alert')            || p?.alert_color           || '',
    warning:         getCssVar('--color-warning')          || p?.warning_color         || '',
    lineChart:       getCssVar('--color-line-chart')       || p?.line_chart_color      || '',
    barChart:        getCssVar('--color-bar-chart')        || p?.bar_chart_color       || '',
    calendarHeatmap: getCssVar('--color-calendar-heatmap') || p?.calendar_heatmap_color || getCssVar('--type-expense'),
  }
}

function ColorTrigger({ label, description, color, btnRef, onClick, preview }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {preview}
        <button
          ref={btnRef}
          type="button"
          onClick={onClick}
          className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors shrink-0"
          style={{ background: color }}
          title="Choose color"
        />
      </div>
    </div>
  )
}


const STRICTNESS_DEFAULTS = { easy: '#22c55e', medium: '#f59e0b', strict: '#ef4444' }
function getStrictnessColors() {
  try { return { ...STRICTNESS_DEFAULTS, ...JSON.parse(localStorage.getItem('limits-strictnessColors')) } } catch { return STRICTNESS_DEFAULTS }
}

function StrictnessColorRow({ id, label, defaultColor }) {
  const [color, setColor] = useState(() => getStrictnessColors()[id] ?? defaultColor)
  const picker = useColorPicker()

  function handleSelect(c) {
    setColor(c)
    const next = { ...getStrictnessColors(), [id]: c }
    localStorage.setItem('limits-strictnessColors', JSON.stringify(next))
    picker.setOpen(false)
    showToast(`${label} color updated`)
  }

  return (
    <>
      <ColorTrigger
        label={label}
        description=""
        color={color}
        btnRef={picker.btnRef}
        onClick={() => picker.toggle(true)}
        preview={
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
            {label}
          </span>
        }
      />
      {picker.open && (
        <ColorPickerPopup
          popupRef={picker.popupRef}
          pos={picker.pos}
          selected={color}
          onSelect={handleSelect}
        />
      )}
    </>
  )
}

function ImportanceFlagRow({ value, label, color, onUpdateColor }) {
  const picker = useColorPicker()

  function handleSelect(c) {
    onUpdateColor(c)
    picker.setOpen(false)
    showToast(`${label} color updated`)
  }

  return (
    <>
      <ColorTrigger
        label={label}
        description=""
        color={color}
        btnRef={picker.btnRef}
        onClick={() => picker.toggle(true)}
        preview={
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}>
            {label}
          </span>
        }
      />
      {picker.open && (
        <ColorPickerPopup
          popupRef={picker.popupRef}
          pos={picker.pos}
          selected={color}
          onSelect={handleSelect}
        />
      )}
    </>
  )
}

function TypeColorRow({ typeValue, label, userId }) {
  const cssVar = typeCssVar(typeValue)
  const [color, setColor] = useState(() =>
    getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || '#9ca3af'
  )
  const picker = useColorPicker()

  useEffect(() => {
    const handler = () => {
      const c = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
      if (c) setColor(c)
    }
    window.addEventListener('theme-updated', handler)
    return () => window.removeEventListener('theme-updated', handler)
  }, [cssVar])

  function handleSelect(c) {
    setColor(c)
    saveTypeColor(userId, typeValue, c)
    picker.setOpen(false)
    showToast(`${label} color updated`)
  }

  return (
    <>
      <ColorTrigger
        label={label}
        description=""
        color={color}
        btnRef={picker.btnRef}
        onClick={() => picker.toggle(true)}
        preview={
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}>
            {label}
          </span>
        }
      />
      {picker.open && (
        <ColorPickerPopup
          popupRef={picker.popupRef}
          pos={picker.pos}
          selected={color}
          onSelect={handleSelect}
        />
      )}
    </>
  )
}

function ThemeRow({ theme, onApply, onDelete }) {
  const swatches = [
    theme.appearance?.accentColor,
    theme.appearance?.lineChartColor,
    theme.appearance?.barChartColor,
    theme.appearance?.typeColors?.income,
    theme.appearance?.typeColors?.expense,
    theme.appearance?.typeColors?.savings,
  ].filter(Boolean)

  const date = new Date(theme.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const cardCount = Object.keys(theme.cardPrefs ?? {}).length

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{theme.name}</p>
        <p className="text-[11px] text-muted mt-0.5">
          {date}{cardCount > 0 && ` · ${cardCount} card${cardCount !== 1 ? 's' : ''}`}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {swatches.slice(0, 6).map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
        ))}
      </div>
      <button
        onClick={onApply}
        className="text-xs px-2.5 py-1 rounded-md bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition-colors shrink-0"
      >
        Apply
      </button>
      <button
        onClick={onDelete}
        className="text-white/25 hover:text-red-400 transition-colors shrink-0 p-0.5"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}


export default function AppearanceTab() {
  const { user } = useAuth()
  const { importance, updateColor, resetColors, setAllColors } = useImportance()
  const { prefsMap, updatePrefs, batchUpdatePrefs, resetAllPrefs } = useCardPreferences()
  const { themes, saveTheme, deleteTheme } = useThemes(user?.id)
  const { activeId: activeDesignId, setDesign } = useDesign(user?.id)
  const { enabled: glassBlur, toggle: setGlassBlur } = useGlassBlur(user?.id)
  const { vars: customVars, updateVar: updateCustomVar, resetToDefaults: resetCustomDesign } = useCustomDesign(user?.id)
  const { palettes, activePaletteId, addPalette, deletePalette, updatePalette, resetDefault, setActivePalette } = usePalette()
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [themeName,     setThemeName]     = useState('')
  const [editingPalette,  setEditingPalette]  = useState(null) // palette object being edited
  const [pendingEditId,   setPendingEditId]   = useState(null) // id of newly-created palette to auto-open

  // Auto-open editor after a new palette is added (runs once palettes state reflects the new entry)
  useEffect(() => {
    if (!pendingEditId) return
    const p = palettes.find(x => x.id === pendingEditId)
    if (p) { setEditingPalette(p); setPendingEditId(null) }
  }, [pendingEditId, palettes])

  const [accentColor,          setAccentColor]          = useState(() => readColors().accent)
  const [progressColor,        setProgressColor]        = useState(() => readColors().progress)
  const [buttonStyle,          setButtonStyle]          = useState(() => readColors().button)
  const [alertColor,           setAlertColor]           = useState(() => readColors().alert)
  const [warningColor,         setWarningColor]         = useState(() => readColors().warning)
  const [lineChartColor,       setLineChartColor]       = useState(() => readColors().lineChart)
  const [barChartColor,        setBarChartColor]        = useState(() => readColors().barChart)
  const [calendarHeatmapColor, setCalendarHeatmapColor] = useState(() => readColors().calendarHeatmap)

  useEffect(() => {
    function sync() {
      setAccentColor(getCssVar('--color-accent'))
      setProgressColor(getCssVar('--color-progress-bar'))
      setButtonStyle(getCssVar('--btn-bg'))
      setAlertColor(getCssVar('--color-alert'))
      setWarningColor(getCssVar('--color-warning'))
      setLineChartColor(getCssVar('--color-line-chart'))
      setBarChartColor(getCssVar('--color-bar-chart'))
      setCalendarHeatmapColor(getCssVar('--color-calendar-heatmap') || getCssVar('--type-expense'))
    }
    sync() // read current CSS vars immediately in case applyTheme already fired before this listener attached
    window.addEventListener('theme-updated', sync)
    return () => window.removeEventListener('theme-updated', sync)
  }, [])

  function collectCurrentTheme() {
    const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim()
    const typeColors = {}
    TRANSACTION_TYPES.forEach(({ value }) => { typeColors[value] = css(typeCssVar(value)) })
    const importanceColors = {}
    importance.forEach(({ value, color }) => { importanceColors[value] = color })
    return {
      appearance: {
        accentColor:          css('--color-accent'),
        buttonStyle:          css('--btn-bg'),
        progressBarColor:     css('--color-progress-bar'),
        alertColor:           css('--color-alert'),
        warningColor:         css('--color-warning'),
        lineChartColor:       css('--color-line-chart'),
        barChartColor:        css('--color-bar-chart'),
        calendarHeatmapColor: css('--color-calendar-heatmap') || css('--type-expense'),
        typeColors,
        importanceColors,
      },
      cardPrefs: { ...prefsMap },
    }
  }

  function handleSaveTheme() {
    if (!themeName.trim()) return
    saveTheme(themeName.trim(), collectCurrentTheme())
    setThemeName('')
    setShowSaveInput(false)
    showToast(`Theme "${themeName.trim()}" saved`)
  }

  async function handleApplyTheme(theme) {
    const { appearance: a, cardPrefs } = theme
    const uid = user?.id

    // Update card prefs synchronously first so any mounted cards (or cards that mount
    // while the async appearance saves run) read the correct prefsMap immediately.
    if (cardPrefs && Object.keys(cardPrefs).length > 0) {
      batchUpdatePrefs(cardPrefs)
      window.dispatchEvent(new CustomEvent('card-prefs-reset', { detail: cardPrefs }))
    }

    // Run all appearance saves in parallel
    await Promise.all([
      a.accentColor          && saveAccentColor(uid, a.accentColor),
      a.buttonStyle          && saveButtonStyle(uid, a.buttonStyle),
      a.progressBarColor     && saveProgressBarColor(uid, a.progressBarColor),
      a.alertColor           && saveAlertColor(uid, a.alertColor),
      a.warningColor         && saveWarningColor(uid, a.warningColor),
      a.lineChartColor       && saveLineChartColor(uid, a.lineChartColor),
      a.barChartColor        && saveBarChartColor(uid, a.barChartColor),
      a.calendarHeatmapColor && saveCalendarHeatmapColor(uid, a.calendarHeatmapColor),
      a.typeColors           && saveAllTypeColors(uid, a.typeColors),
      a.importanceColors     && setAllColors(a.importanceColors),
    ].filter(Boolean))
    showToast(`Theme "${theme.name}" applied`)
  }

  const accent   = useColorPicker()
  const progress = useColorPicker()
  const button   = useColorPicker()
  const alert    = useColorPicker()
  const warning   = useColorPicker()
  const lineChart = useColorPicker()
  const barChart        = useColorPicker()
  const calendarHeatmap = useColorPicker()

  function handleAccent(c) {
    setAccentColor(c); saveAccentColor(user?.id, c); accent.setOpen(false)
    showToast('Accent color updated')
  }
  function handleProgress(c) {
    setProgressColor(c); saveProgressBarColor(user?.id, c); progress.setOpen(false)
    showToast('Progress bar color updated')
  }
  function handleButton(c) {
    setButtonStyle(c); saveButtonStyle(user?.id, c); button.setOpen(false)
    showToast('Button color updated')
  }
  function handleAlert(c) {
    setAlertColor(c); saveAlertColor(user?.id, c); alert.setOpen(false)
    showToast('Alert color updated')
  }
  function handleWarning(c) {
    setWarningColor(c); saveWarningColor(user?.id, c); warning.setOpen(false)
    showToast('Warning color updated')
  }
  function handleLineChart(c) {
    setLineChartColor(c); saveLineChartColor(user?.id, c); lineChart.setOpen(false)
    showToast('Line chart color updated')
  }
  function handleBarChart(c) {
    setBarChartColor(c); saveBarChartColor(user?.id, c); barChart.setOpen(false)
    showToast('Bar chart color updated')
  }
  function handleCalendarHeatmap(c) {
    setCalendarHeatmapColor(c); saveCalendarHeatmapColor(user?.id, c); calendarHeatmap.setOpen(false)
    showToast('Calendar color updated')
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin"><div className="flex flex-col gap-8">


      {/* Designs + Themes */}
      <div className="pb-8 border-b border-white/10 flex flex-col gap-6">

        {/* Two-column row: Designs | Saved Themes */}
        <div className="grid grid-cols-2 gap-6 items-start">

          {/* Designs */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-medium text-white">Design</h3>
              <p className="text-xs text-muted mt-0.5">Full visual style — background, surfaces &amp; animation.</p>
            </div>
            <div className="flex justify-evenly">
              {DESIGNS.map(design => {
                const active = activeDesignId === design.id
                const previewBg = design.id === 'custom'
                  ? `linear-gradient(135deg, ${customVars.bgFrom.hex} 0%, ${customVars.bgTo.hex} 100%)`
                  : design.previewBg
                return (
                  <button
                    key={design.id}
                    onClick={async () => {
                      setDesign(design.id)
                      await resetAllColors(user?.id)
                      await resetAllPrefs()
                      await resetColors()
                      showToast(`Design "${design.name}" applied`)
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div
                      className={`w-10 h-10 rounded-full transition-all ${active ? 'scale-110' : 'group-hover:scale-105'}`}
                      style={{
                        background: previewBg,
                        boxShadow: active ? `0 0 0 2px var(--color-accent)` : '0 0 0 1.5px rgba(255,255,255,0.12)',
                      }}
                    />
                    <span className={`text-[10px] leading-tight transition-colors ${active ? 'text-accent' : 'text-muted group-hover:text-white'}`}>
                      {design.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Saved Themes */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Saved Themes</h3>
                <p className="text-xs text-muted mt-0.5">Snapshot all appearance &amp; card colors to apply later.</p>
              </div>
              {!showSaveInput && (
                <button
                  onClick={() => setShowSaveInput(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 hover:text-white transition-colors shrink-0"
                >
                  Save current
                </button>
              )}
            </div>

            {showSaveInput && (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={themeName}
                  onChange={e => setThemeName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTheme()
                    if (e.key === 'Escape') { setShowSaveInput(false); setThemeName('') }
                  }}
                  placeholder="Theme name…"
                  className="flex-1 bg-[var(--color-dash-card)] border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:border-white/30 outline-none"
                />
                <button
                  onClick={handleSaveTheme}
                  disabled={!themeName.trim()}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/15 text-white disabled:opacity-40 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowSaveInput(false); setThemeName('') }}
                  className="px-2 py-1.5 text-sm text-white/40 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {themes.length === 0 ? (
              <p className="text-xs text-muted italic">No saved themes yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {themes.map(theme => (
                  <ThemeRow
                    key={theme.id}
                    theme={theme}
                    onApply={() => handleApplyTheme(theme)}
                    onDelete={() => { deleteTheme(theme.id); showToast(`Theme "${theme.name}" deleted`) }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>{/* end grid */}

        {/* Glass blur toggle */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h3 className="text-sm font-medium text-white">Glass blur</h3>
            <p className="text-xs text-muted mt-0.5">Frosted glass effect on cards and popups.</p>
          </div>
          <button
            type="button"
            onClick={() => setGlassBlur(!glassBlur)}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${glassBlur ? 'bg-accent' : 'bg-white/15'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${glassBlur ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Custom design editor — full width, only when active */}
        {activeDesignId === 'custom' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Custom design</h3>
                <p className="text-xs text-muted mt-0.5">Set the color for each UI layer.</p>
              </div>
              <button onClick={resetCustomDesign} className="text-xs text-muted hover:text-white transition-colors">
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {CUSTOM_DESIGN_VARS.map(({ key, label, hasOpacity }) => {
                const v = customVars[key]
                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted">{label}</span>
                    <div className="flex items-center gap-2">
                      <label className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20 cursor-pointer hover:border-white/40 transition-colors shrink-0">
                        <input
                          type="color"
                          value={v.hex}
                          onChange={e => updateCustomVar(key, { hex: e.target.value })}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div className="w-full h-full" style={{ background: v.hex }} />
                      </label>
                      {hasOpacity && (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <input
                            type="range"
                            min="0" max="100"
                            value={Math.round(v.opacity * 100)}
                            onChange={e => updateCustomVar(key, { opacity: Number(e.target.value) / 100 })}
                            className="flex-1 h-1 accent-white/60 min-w-0"
                          />
                          <span className="text-[10px] text-muted w-7 text-right shrink-0">
                            {Math.round(v.opacity * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* Color Palettes */}
      <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">Color Palettes</h3>
            <p className="text-xs text-muted mt-0.5">Defines the swatches shown in every color picker. Switching palettes never changes colors already applied to components — only picking a new color does.</p>
          </div>
          <button
            onClick={() => {
              const name = `Palette ${palettes.length}`
              const id   = addPalette(name)
              // addPalette returns the new id; open editor on next tick after state settles
              setTimeout(() => {
                setPendingEditId(id)
              }, 0)
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 hover:text-white transition-colors shrink-0"
          >
            + New palette
          </button>
        </div>

        <div className="grid grid-cols-6 gap-3">
          {palettes.map(palette => {
            const isActive = palette.id === activePaletteId
            const previewColors = palette.solids.slice(0, 36)
            return (
              <div key={palette.id}
                onClick={() => { setActivePalette(palette.id); if (palette.id !== activePaletteId) showToast(`"${palette.name}" palette active`) }}
                className={`flex flex-col gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${isActive ? 'bg-white/[0.07] border-white/20' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/12'}`}>

                {/* Color preview grid */}
                <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
                  {previewColors.map((c, i) => (
                    <div key={i} className="rounded-sm aspect-square" style={{ background: c }} />
                  ))}
                  {previewColors.length === 0 && (
                    <div className="col-span-6 h-10 rounded-md bg-white/5 flex items-center justify-center">
                      <span className="text-[9px] text-white/20 italic">Empty</span>
                    </div>
                  )}
                </div>

                {/* Name row */}
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs truncate min-w-0 ${isActive ? 'text-white font-medium' : 'text-white/50'}`}>
                    {palette.name}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button type="button" onClick={e => { e.stopPropagation(); setEditingPalette(palette) }}
                      className="p-1 rounded hover:bg-white/10 text-white/25 hover:text-white transition-colors"
                      title="Edit">
                      <Pencil size={10} />
                    </button>
                    {palette.id === 'default' ? (
                      <button type="button" onClick={e => { e.stopPropagation(); resetDefault(); showToast('Default palette restored') }}
                        className="p-1 rounded hover:bg-white/10 text-white/25 hover:text-white/60 transition-colors"
                        title="Reset to defaults">
                        <RotateCcw size={10} />
                      </button>
                    ) : (
                      <button type="button" onClick={e => { e.stopPropagation(); deletePalette(palette.id); showToast(`"${palette.name}" palette deleted`) }}
                        className="p-1 rounded hover:bg-red-500/15 text-white/25 hover:text-red-400 transition-colors"
                        title="Delete">
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>

                {isActive && (
                  <div className="text-[9px] text-white/35 uppercase tracking-widest -mt-1">Active</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Palette editor modal */}
      {editingPalette && (
        <PaletteEditorModal
          palette={editingPalette}
          onSave={updated => { updatePalette(updated.id, updated); setEditingPalette(null) }}
          onClose={() => setEditingPalette(null)}
        />
      )}

      {/* Accent color */}
      <div className="pt-0 flex flex-col gap-4">
        <ColorTrigger
          label="Accent color"
          description="Used for highlights, focus rings, and interactive elements."
          color={accentColor}
          btnRef={accent.btnRef}
          onClick={() => accent.toggle(true)}
        />
        {accent.open && (
          <ColorPickerPopup
            popupRef={accent.popupRef}
            pos={accent.pos}
            selected={accentColor}
            showGradients
            onSelect={handleAccent}
          />
        )}
      </div>

      {/* Progress bar color */}
      <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
        <ColorTrigger
          label="Progress bar color"
          description="Color for due-date progress bars on pending items."
          color={progressColor}
          btnRef={progress.btnRef}
          onClick={() => progress.toggle(true)}
          preview={
            <div className="flex flex-col gap-1 w-28">
              <div className="flex items-center justify-between text-[10px] text-white/40">
                <span>10d left</span><span>Mar 28</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full w-[55%] transition-colors duration-300"
                  style={{ background: progressColor }} />
              </div>
            </div>
          }
        />
        {progress.open && (
          <ColorPickerPopup
            popupRef={progress.popupRef}
            pos={progress.pos}
            selected={progressColor}
            showGradients
            onSelect={handleProgress}
          />
        )}
      </div>

      {/* Alert color */}
      <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
        <ColorTrigger
          label="Alert color"
          description="Used for overdue and urgent states (≤3 days left)."
          color={alertColor}
          btnRef={alert.btnRef}
          onClick={() => alert.toggle(true)}
          preview={
            <span className="text-xs font-medium" style={{ color: alertColor }}>2d overdue</span>
          }
        />
        {alert.open && (
          <ColorPickerPopup
            popupRef={alert.popupRef}
            pos={alert.pos}
            selected={alertColor}
            showGradients
            onSelect={handleAlert}
          />
        )}
      </div>

      {/* Warning color */}
      <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
        <ColorTrigger
          label="Warning color"
          description="Used for items due today or within 7 days."
          color={warningColor}
          btnRef={warning.btnRef}
          onClick={() => warning.toggle(true)}
          preview={
            <span className="text-xs font-medium" style={{ color: warningColor }}>Due in 5d</span>
          }
        />
        {warning.open && (
          <ColorPickerPopup
            popupRef={warning.popupRef}
            pos={warning.pos}
            selected={warningColor}
            showGradients
            onSelect={handleWarning}
          />
        )}
      </div>

      {/* Line chart color */}
      <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
        <ColorTrigger
          label="Chart colors"
          description="Color used for charts, e.g. savings flow line and activity heatmap."
          color={lineChartColor}
          btnRef={lineChart.btnRef}
          onClick={lineChart.toggle}
          preview={
            <svg width="60" height="24" viewBox="0 0 60 24">
              <polyline points="0,20 10,14 20,16 30,6 40,10 50,4 60,8" fill="none" stroke={lineChartColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        {lineChart.open && (
          <ColorPickerPopup
            popupRef={lineChart.popupRef}
            pos={lineChart.pos}
            selected={lineChartColor}
            onSelect={handleLineChart}
          />
        )}
      </div>

      {/* Bar chart color */}
      <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
        <ColorTrigger
          label="Bar chart color"
          description="Color used for positive bars in bar charts, e.g. net flow deposits."
          color={barChartColor}
          btnRef={barChart.btnRef}
          onClick={() => barChart.toggle(true)}
          preview={
            <div className="flex items-end gap-0.5 h-6">
              {[60, 40, 75, 50, 85].map((h, i) => (
                <div key={i} className="w-2.5 rounded-t-sm" style={{ height: `${h}%`, background: barChartColor }} />
              ))}
            </div>
          }
        />
        {barChart.open && (
          <ColorPickerPopup
            popupRef={barChart.popupRef}
            pos={barChart.pos}
            selected={barChartColor}
            showGradients
            onSelect={handleBarChart}
          />
        )}
      </div>

      {/* Calendar heatmap color */}
      <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
        <ColorTrigger
          label="Calendar heatmap color"
          description="Tint applied to spending-heavy days in the big calendar."
          color={calendarHeatmapColor}
          btnRef={calendarHeatmap.btnRef}
          onClick={() => calendarHeatmap.toggle(true)}
          preview={
            <div className="flex items-end gap-0.5 h-6">
              {[20, 45, 70, 35, 90].map((pct, i) => (
                <div
                  key={i}
                  className="w-4 rounded-sm"
                  style={{
                    height: '100%',
                    background: `color-mix(in srgb, ${calendarHeatmapColor} ${pct}%, rgba(255,255,255,0.04))`,
                  }}
                />
              ))}
            </div>
          }
        />
        {calendarHeatmap.open && (
          <ColorPickerPopup
            popupRef={calendarHeatmap.popupRef}
            pos={calendarHeatmap.pos}
            selected={calendarHeatmapColor}
            onSelect={handleCalendarHeatmap}
          />
        )}
      </div>


      {/* Button style */}
      <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
        <ColorTrigger
          label="Button style"
          description="Background applied to primary action buttons."
          color={buttonStyle}
          btnRef={button.btnRef}
          onClick={() => button.toggle(true)}
          preview={
            <div
              className="h-7 w-20 rounded-lg text-[11px] font-medium text-white flex items-center justify-center"
              style={{ background: buttonStyle }}
            >
              Preview
            </div>
          }
        />
        {button.open && (
          <ColorPickerPopup
            popupRef={button.popupRef}
            pos={button.pos}
            selected={buttonStyle}
            showGradients
            onSelect={handleButton}
          />
        )}
      </div>


      {/* Importance flags + Transaction type colors + Income type colors + Limit strictness — side by side */}
      <div className="pt-8 border-t border-white/10 grid grid-cols-4 gap-8">

        {/* Importance flags */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Importance flags</h3>
              <p className="text-xs text-muted mt-0.5">Colors for importance levels on categories.</p>
            </div>
            <button onClick={resetColors} className="text-xs text-muted hover:text-white transition-colors">Reset</button>
          </div>
          <div className="flex flex-col gap-4">
            {importance.map(({ value, label, color }) => (
              <ImportanceFlagRow
                key={value}
                value={value}
                label={label}
                color={color}
                onUpdateColor={c => updateColor(value, c)}
              />
            ))}
          </div>
        </div>

        {/* Transaction type colors */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-medium text-white">Transaction type colors</h3>
            <p className="text-xs text-muted mt-0.5">Used in the transaction table, modal, and calendar.</p>
          </div>
          <div className="flex flex-col gap-4">
            {TRANSACTION_TYPES.map(({ value, label }) => (
              <TypeColorRow key={value} typeValue={value} label={label} userId={user?.id} />
            ))}
          </div>
        </div>

        {/* Income type colors */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-medium text-white">Income type colors</h3>
            <p className="text-xs text-muted mt-0.5">Used in the income sources donut chart on Analytics.</p>
          </div>
          <div className="flex flex-col gap-4">
            <TypeColorRow typeValue="income-earned"     label="Earned"     userId={user?.id} />
            <TypeColorRow typeValue="income-not-earned" label="Not earned" userId={user?.id} />
          </div>
        </div>

        {/* Limit strictness colors */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-medium text-white">Limit strictness</h3>
            <p className="text-xs text-muted mt-0.5">Colors for the strictness indicator when setting a limit.</p>
          </div>
          <div className="flex flex-col gap-4">
            <StrictnessColorRow id="easy"   label="Easy"   defaultColor={STRICTNESS_DEFAULTS.easy}   />
            <StrictnessColorRow id="medium" label="Medium" defaultColor={STRICTNESS_DEFAULTS.medium} />
            <StrictnessColorRow id="strict" label="Strict" defaultColor={STRICTNESS_DEFAULTS.strict} />
          </div>
        </div>

      </div>

    </div></div>
  )
}
