import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CategoryPill } from '../shared/CategoryPill'
import { ReceiverAvatar } from '../shared/ReceiverCombobox'
import { useImportance } from '../../hooks/useImportance'
import { usePreferences } from '../../context/UserPreferencesContext'

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/25'

function getStrictnessColors() {
  const defaults = { easy: '#22c55e', medium: '#f59e0b', strict: '#ef4444' }
  try { return { ...defaults, ...JSON.parse(localStorage.getItem('limits-strictnessColors')) } } catch { return defaults }
}

const PERIODS = [['weekly', 'Weekly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['yearly', 'Yearly']]
const PERIOD_MULTIPLIER = { weekly: 1 / 4.33, monthly: 1, quarterly: 3, yearly: 12 }
const PERIOD_SHORT = { weekly: '/wk', monthly: '/mo', quarterly: '/qtr', yearly: '/yr' }
const PERIOD_LABEL = { weekly: 'week', monthly: 'month', quarterly: 'quarter', yearly: 'year' }

const DIMENSIONS = [
  ['all',         'All'],
  ['category',    'Category'],
  ['subcategory', 'Subcategory'],
  ['importance',  'Importance'],
  ['merchant',    'Merchant'],
]

function DropdownSelect({ value, onChange, options, placeholder = 'Select…' }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref       = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!open) { setSearch(''); return }
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0)
  }, [open])

  const q        = search.trim().toLowerCase()
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q)) : options
  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left transition-colors hover:border-white/20">
        {selected
          ? <CategoryPill name={selected.label} color={selected.color} icon={selected.icon} />
          : <span className="text-white/25">{placeholder}</span>}
        <ChevronDown size={13} className="text-white/25 shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
          </div>
          <div className="max-h-44 overflow-y-auto scrollbar-thin">
            {filtered.length === 0
              ? <p className="text-xs text-white/30 px-3 py-3">No results</p>
              : filtered.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={`w-full flex items-center px-3 py-2 hover:bg-white/5 transition-colors ${value === opt.value ? 'bg-white/8' : ''}`}>
                    <CategoryPill name={opt.label} color={opt.color} icon={opt.icon} />
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default function AddBudgetModal({
  budget = null,
  categories,
  defaultDimension,
  defaultId,
  avgByCategory = {},
  avgBySubcategory = {},
  avgByImportance = {},
  avgByReceiver = {},
  onClose,
  onSaved,
}) {
  const isEdit = !!budget
  const { user } = useAuth()
  const { fmt, fmtK } = usePreferences()
  const { importance: importanceLevels } = useImportance()

  const [name,             setName]             = useState(budget?.name ?? '')
  const [dimension,        setDimension]        = useState(
    budget?.receiver_id    ? 'merchant'    :
    budget?.importance     ? 'importance'  :
    budget?.subcategory_id ? 'subcategory' :
    budget?.category_id    ? 'category'    :
    defaultDimension       ? defaultDimension :
    'category'
  )
  const [categoryId,       setCategoryId]       = useState(budget?.category_id    ?? (defaultDimension === 'category'    ? defaultId : '') ?? '')
  const [subcategoryId,    setSubcategoryId]    = useState(budget?.subcategory_id ?? (defaultDimension === 'subcategory' ? defaultId : '') ?? '')
  const [importance,       setImportance]       = useState(budget?.importance     ?? (defaultDimension === 'importance'  ? defaultId : '') ?? '')
  const [receiverId,       setReceiverId]       = useState(budget?.receiver_id    ?? (defaultDimension === 'merchant'    ? defaultId : '') ?? '')
  const [limit,            setLimit]            = useState(budget?.monthly_limit  ?? 0)
  const [period,           setPeriod]           = useState(budget?.period         ?? 'monthly')
  const [resetDay,         setResetDay]         = useState(budget?.reset_day      ?? null)
  const [rolloverBehavior, setRolloverBehavior] = useState(budget?.rollover_behavior ?? 'expire')
  const [cardId,           setCardId]           = useState(budget?.card_id        ?? '')
  const [cards,            setCards]            = useState([])
  const [receivers,        setReceivers]        = useState([])
  const [cardOpen,         setCardOpen]         = useState(false)
  const [cardSearch,       setCardSearch]       = useState('')
  const [recOpen,          setRecOpen]          = useState(false)
  const [recSearch,        setRecSearch]        = useState('')
  const [saving,           setSaving]           = useState(false)
  const [deleting,         setDeleting]         = useState(false)
  const [confirmDelete,    setConfirmDelete]    = useState(false)
  const [saveError,        setSaveError]        = useState('')
  const cardRef    = useRef(null)
  const cardSrchRef = useRef(null)
  const recRef     = useRef(null)
  const recSrchRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('cards').select('id, name').eq('user_id', user.id).order('created_at'),
      supabase.from('receivers').select('id, name, domain, logo_url').eq('user_id', user.id).order('name'),
    ]).then(([{ data: cds }, { data: recs }]) => {
      setCards(cds ?? [])
      setReceivers(recs ?? [])
    })
  }, [user?.id])

  useEffect(() => {
    if (!cardOpen) { setCardSearch(''); return }
    const h = e => { if (!cardRef.current?.contains(e.target)) setCardOpen(false) }
    document.addEventListener('mousedown', h)
    setTimeout(() => cardSrchRef.current?.focus(), 0)
    return () => document.removeEventListener('mousedown', h)
  }, [cardOpen])

  useEffect(() => {
    if (!recOpen) { setRecSearch(''); return }
    const h = e => { if (!recRef.current?.contains(e.target)) setRecOpen(false) }
    document.addEventListener('mousedown', h)
    setTimeout(() => recSrchRef.current?.focus(), 0)
    return () => document.removeEventListener('mousedown', h)
  }, [recOpen])

  const topCategories   = categories.filter(c => !c.parent_id)
  const subcategories   = categories.filter(c =>  c.parent_id)
  const categoryOptions = topCategories.map(c => ({ value: c.id, label: c.name, color: c.color, icon: c.icon }))
  const subcategoryOpts = subcategories.map(c  => ({ value: c.id, label: c.name, color: c.color, icon: c.icon }))

  const selId      = dimension === 'category' ? categoryId : dimension === 'subcategory' ? subcategoryId : dimension === 'importance' ? importance : receiverId
  const avgMaps    = { category: avgByCategory, subcategory: avgBySubcategory, importance: avgByImportance, merchant: avgByReceiver }
  const avgMonthly = (selId && dimension !== 'all' && avgMaps[dimension]?.[selId]) || null

  const periodMult  = PERIOD_MULTIPLIER[period] ?? 1
  const periodShort = PERIOD_SHORT[period] ?? '/mo'
  const avgPeriod   = avgMonthly ? avgMonthly * periodMult : null

  const limitVal   = typeof limit === 'number' ? limit : parseFloat(limit) || 0
  const sliderMax  = avgPeriod ? Math.ceil(avgPeriod * 1.3) : Math.max(500, Math.ceil(limitVal * 2) || 500)
  const sliderStep = Math.max(1, Math.round(sliderMax / 100))
  const sliderPct  = sliderMax > 0 ? Math.min((limitVal / sliderMax) * 100, 100) : 0

  const savingPeriod  = avgPeriod ? Math.max(0, avgPeriod - limitVal) : 0
  const savingMonthly = savingPeriod / periodMult
  const savingAnnual  = savingMonthly * 12

  const suggestedVal    = avgPeriod ? Math.round(avgPeriod * 0.80) : null
  const aggressiveVal   = avgPeriod ? Math.round(avgPeriod * 0.65) : null
  const aggressiveColor = getStrictnessColors().medium

  const isValid = limitVal > 0 && (
    dimension === 'all'                                ||
    (dimension === 'category'    && categoryId)        ||
    (dimension === 'subcategory' && subcategoryId)     ||
    (dimension === 'importance'  && importance)        ||
    (dimension === 'merchant'    && receiverId)
  )

  const ctaLabel = saving ? 'Saving…'
    : isEdit ? 'Update Budget'
    : isValid ? `Set ${fmt(limitVal)}${periodShort} budget`
    : 'Create Budget'

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    setSaveError('')
    const payload = {
      name:              name.trim() || null,
      monthly_limit:     limitVal,
      category_id:       dimension === 'category'    ? categoryId    : null,
      subcategory_id:    dimension === 'subcategory' ? subcategoryId : null,
      importance:        dimension === 'importance'  ? importance    : null,
      receiver_id:       dimension === 'merchant'    ? receiverId    : null,
      period,
      reset_day:         (period === 'weekly' || period === 'monthly') ? (resetDay ?? null) : null,
      card_id:           cardId || null,
      rollover_behavior: rolloverBehavior,
    }
    const { error } = isEdit
      ? await supabase.from('budgets').update(payload).eq('id', budget.id)
      : await supabase.from('budgets').insert({ ...payload, user_id: user.id })
    if (error) {
      console.error(error)
      setSaveError(error.message ?? 'Failed to save')
      setSaving(false)
      return
    }
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    setSaving(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await supabase.from('budgets').delete().eq('id', budget.id)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    setDeleting(false)
    onSaved()
    onClose()
  }

  const selectedCard = cards.find(c => c.id === cardId)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col shadow-2xl max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Edit Budget' : 'New Budget'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col overflow-y-auto scrollbar-thin flex-1">

          {/* ── Row 1: config columns ── */}
          <div className="flex border-b border-white/[0.06]">

            {/* Column 1: name + budget by + picker */}
            <div className="flex flex-col gap-4 flex-1 min-w-0 p-6 border-r border-white/[0.06]">

              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest">Name <span className="normal-case text-white/25">(optional)</span></label>
                <input value={name} onChange={e => setName(e.target.value)} type="text"
                  placeholder="e.g. Groceries, Rent…" className={inp} />
              </div>

              {/* Budget by */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest">Budget by</label>
                <div className="flex flex-wrap gap-1.5">
                  {DIMENSIONS.map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setDimension(v)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium border ${
                        dimension === v
                          ? 'bg-white/10 text-white border-white/20'
                          : 'text-white/40 hover:text-white/60 border-white/[0.07] bg-white/[0.03]'
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Picker */}
              {dimension !== 'all' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted uppercase tracking-widest">
                    {dimension === 'importance' ? 'Importance level' : dimension === 'subcategory' ? 'Subcategory' : dimension === 'merchant' ? 'Merchant' : 'Category'}
                  </label>
                  {dimension === 'category' && (
                    <DropdownSelect value={categoryId} onChange={setCategoryId} options={categoryOptions} placeholder="Select category…" />
                  )}
                  {dimension === 'subcategory' && (
                    <DropdownSelect value={subcategoryId} onChange={setSubcategoryId} options={subcategoryOpts} placeholder="Select subcategory…" />
                  )}
                  {dimension === 'merchant' && (
                    <div ref={recRef} className="relative">
                      <button type="button" onClick={() => setRecOpen(v => !v)}
                        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-left hover:border-white/20">
                        {receiverId && receivers.find(r => r.id === receiverId) ? (
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ReceiverAvatar receiver={receivers.find(r => r.id === receiverId)} />
                            <span className="text-sm text-white truncate">{receivers.find(r => r.id === receiverId)?.name}</span>
                          </div>
                        ) : (
                          <span className="text-white/25">Select merchant…</span>
                        )}
                        <ChevronDown size={13} className="text-white/25 shrink-0 ml-2" />
                      </button>
                      {recOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
                          <div className="px-3 py-2 border-b border-white/[0.06]">
                            <input ref={recSrchRef} value={recSearch} onChange={e => setRecSearch(e.target.value)}
                              placeholder="Search…"
                              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
                          </div>
                          <div className="max-h-44 overflow-y-auto scrollbar-thin">
                            {receivers.length === 0
                              ? <p className="text-xs text-white/30 px-3 py-3">No merchants yet</p>
                              : (() => {
                                  const q = recSearch.trim().toLowerCase()
                                  const filtered = q ? receivers.filter(r => r.name.toLowerCase().includes(q)) : receivers
                                  return filtered.length === 0
                                    ? <p className="text-xs text-white/30 px-3 py-3">No results</p>
                                    : filtered.map(r => (
                                        <button key={r.id} type="button"
                                          onClick={() => { setReceiverId(r.id); setRecOpen(false) }}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 text-left ${receiverId === r.id ? 'bg-white/8' : ''}`}>
                                          <ReceiverAvatar receiver={r} />
                                          <span className="text-sm text-white">{r.name}</span>
                                          {r.domain && <span className="text-xs text-muted ml-auto">{r.domain}</span>}
                                        </button>
                                      ))
                                })()
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {dimension === 'importance' && (
                    <div className="grid grid-cols-2 gap-2">
                      {importanceLevels.map(imp => (
                        <button key={imp.value} type="button" onClick={() => setImportance(imp.value)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left"
                          style={{
                            borderColor: importance === imp.value ? imp.color : 'rgba(255,255,255,0.08)',
                            background:  importance === imp.value ? `color-mix(in srgb, ${imp.color} 12%, transparent)` : 'rgba(255,255,255,0.03)',
                          }}>
                          <span className="flex gap-[3px] shrink-0">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <span key={i} className="w-1.5 h-1.5 rounded-full"
                                style={{ background: i < imp.dots ? imp.color : imp.color + '30' }} />
                            ))}
                          </span>
                          <span className="text-xs text-white/70">{imp.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: period settings */}
            <div className="flex flex-col gap-4 w-[46%] shrink-0 p-6">

              {/* Period */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest">Period</label>
                <div className="grid grid-cols-2 gap-1 bg-white/5 rounded-xl p-0.5">
                  {PERIODS.map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setPeriod(v)}
                      className={`py-1.5 text-xs rounded-lg transition-colors font-medium ${period === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start */}
              {period === 'weekly' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted uppercase tracking-widest">Week starts on</label>
                  <div className="grid grid-cols-7 gap-1">
                    {[['Mo',0],['Tu',1],['We',2],['Th',3],['Fr',4],['Sa',5],['Su',6]].map(([l, v]) => (
                      <button key={v} type="button" onClick={() => setResetDay(v)}
                        className={`py-1.5 text-[10px] rounded-lg transition-colors font-medium ${(resetDay ?? 0) === v ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {period === 'monthly' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted uppercase tracking-widest">Resets on day</label>
                  <input type="number" min="1" max="28" step="1"
                    value={resetDay ?? 1}
                    onChange={e => setResetDay(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
                    className={inp} placeholder="1" />
                </div>
              )}

              {/* At period end */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted uppercase tracking-widest">At period end</label>
                <div className="grid grid-cols-2 gap-1 bg-white/5 rounded-xl p-0.5">
                  {[['expire', 'Expire'], ['accumulate', 'Roll over']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setRolloverBehavior(v)}
                      className={`py-1.5 text-xs rounded-lg transition-colors font-medium ${rolloverBehavior === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card — optional */}
              {cards.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted uppercase tracking-widest">Card <span className="normal-case text-white/25">(optional)</span></label>
                  <div ref={cardRef} className="relative">
                    <button type="button" onClick={() => setCardOpen(v => !v)}
                      className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-left hover:border-white/20">
                      <span className={selectedCard ? 'text-white/80' : 'text-white/25'}>{selectedCard?.name ?? 'Any card'}</span>
                      <ChevronDown size={13} className="text-white/25 shrink-0 ml-2" />
                    </button>
                    {cardOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
                        <div className="px-3 py-2 border-b border-white/[0.06]">
                          <input ref={cardSrchRef} value={cardSearch} onChange={e => setCardSearch(e.target.value)}
                            placeholder="Search…"
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
                        </div>
                        <div className="max-h-44 overflow-y-auto scrollbar-thin">
                          {!cardSearch.trim() && (
                            <button type="button" onClick={() => { setCardId(''); setCardOpen(false) }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 ${!cardId ? 'text-white/80 bg-white/[0.08]' : 'text-white/40'}`}>
                              Any card
                            </button>
                          )}
                          {(() => {
                            const q = cardSearch.trim().toLowerCase()
                            const filtered = q ? cards.filter(c => c.name.toLowerCase().includes(q)) : cards
                            return filtered.length === 0
                              ? <p className="text-xs text-white/30 px-3 py-3">No results</p>
                              : filtered.map(c => (
                                  <button key={c.id} type="button"
                                    onClick={() => { setCardId(c.id); setCardOpen(false) }}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 ${cardId === c.id ? 'text-white/80 bg-white/[0.08]' : 'text-white/40'}`}>
                                    {c.name}
                                  </button>
                                ))
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Row 2: slider — full width ── */}
          <div className="p-6 flex flex-col gap-4">

            {/* Baseline avg vs new target */}
            <div className="flex items-end justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Baseline avg</span>
                <span className="text-2xl font-bold tabular-nums text-white/30">
                  {avgPeriod ? fmt(avgPeriod) : '—'}
                  {avgPeriod && <span className="text-sm font-normal text-white/20 ml-1">{periodShort}</span>}
                </span>
              </div>
              {limitVal > 0 && (
                <div className="flex flex-col gap-0.5 items-end">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Your budget</span>
                  <span className="text-2xl font-bold tabular-nums text-white/90">
                    {fmt(limitVal)}
                    <span className="text-sm font-normal text-white/30 ml-1">{periodShort}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Slider */}
            <div className="relative" style={{ padding: '10px 0' }}>
              <div className="relative h-3 w-full rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{ width: `${sliderPct}%`, background: 'var(--color-progress-bar)' }} />
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg pointer-events-none ring-2 ring-black/10"
                style={{ left: `calc(${sliderPct}% - 12px)` }} />
              <input
                type="range" min={0} max={sliderMax} step={sliderStep}
                value={limitVal}
                onChange={e => setLimit(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ appearance: 'none', WebkitAppearance: 'none' }}
              />
            </div>

            {/* Min / max labels */}
            <div className="flex items-center justify-between text-[11px] text-white/20 tabular-nums -mt-2">
              <span>{fmt(0)}</span>
              <span>{fmt(sliderMax)}</span>
            </div>

            {/* Suggestion chips */}
            {avgPeriod && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-white/25 uppercase tracking-wide">Suggested</span>
                {suggestedVal != null && (
                  <button type="button" onClick={() => setLimit(suggestedVal)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium"
                    style={{
                      borderColor: limitVal === suggestedVal ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.12)',
                      background:  limitVal === suggestedVal ? 'color-mix(in srgb, var(--color-progress-bar) 12%, transparent)' : 'rgba(255,255,255,0.04)',
                      color:       limitVal === suggestedVal ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.55)',
                    }}>
                    {fmt(suggestedVal)} <span className="opacity-60">−20%</span>
                  </button>
                )}
                {aggressiveVal != null && aggressiveVal !== suggestedVal && (
                  <button type="button" onClick={() => setLimit(aggressiveVal)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium"
                    style={{
                      borderColor: limitVal === aggressiveVal ? aggressiveColor : 'rgba(255,255,255,0.12)',
                      background:  limitVal === aggressiveVal ? `color-mix(in srgb, ${aggressiveColor} 12%, transparent)` : 'rgba(255,255,255,0.04)',
                      color:       limitVal === aggressiveVal ? aggressiveColor : 'rgba(255,255,255,0.45)',
                    }}>
                    {fmt(aggressiveVal)} <span className="opacity-60">Aggressive</span>
                  </button>
                )}
              </div>
            )}

            {/* Savings breakdown */}
            {savingPeriod > 0 && (
              <div className="flex items-stretch gap-3 pt-1">
                <div className="flex-1 flex flex-col gap-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-[10px] uppercase tracking-widest text-muted">Per {PERIOD_LABEL[period]}</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: 'var(--color-progress-bar)' }}>+{fmt(savingPeriod)}</span>
                  <span className="text-[10px] text-white/30">vs your average</span>
                </div>
                <div className="flex-1 flex flex-col gap-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-[10px] uppercase tracking-widest text-muted">Per month</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: 'var(--color-progress-bar)' }}>+{fmt(savingMonthly)}</span>
                  <span className="text-[10px] text-white/30">normalised saving</span>
                </div>
                <div className="flex-1 flex flex-col gap-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-[10px] uppercase tracking-widest text-muted">Annual</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: 'var(--color-progress-bar)' }}>+{fmtK(savingAnnual)}</span>
                  <span className="text-[10px] text-white/30">kept per year</span>
                </div>
              </div>
            )}

            {saveError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{saveError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
          {isEdit && (
            <button type="button" onClick={handleDelete} onBlur={() => setConfirmDelete(false)}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all disabled:opacity-40 text-xs font-medium ${
                confirmDelete
                  ? 'border-red-500/50 bg-red-500/15 text-red-400'
                  : 'border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40'
              }`}>
              <Trash2 size={13} />
              {confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-modal-cancel">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || !isValid} className="btn-modal-primary">
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
