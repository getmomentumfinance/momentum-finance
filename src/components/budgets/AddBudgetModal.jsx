import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CategoryPill } from '../shared/CategoryPill'
import { useImportance } from '../../hooks/useImportance'

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/25'

const PERIODS = [['weekly', 'Weekly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['yearly', 'Yearly']]
const LIMIT_LABELS = { weekly: 'Weekly limit', monthly: 'Monthly limit', quarterly: 'Quarterly limit', yearly: 'Yearly limit' }

function DropdownSelect({ value, onChange, options, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

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
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl max-h-52 overflow-y-auto scrollbar-thin">
          {options.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center px-3 py-2 hover:bg-white/5 transition-colors ${value === opt.value ? 'bg-white/8' : ''}`}>
              <CategoryPill name={opt.label} color={opt.color} icon={opt.icon} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AddBudgetModal({ budget = null, categories, onClose, onSaved }) {
  const isEdit = !!budget
  const { user } = useAuth()
  const { importance: importanceLevels } = useImportance()

  const initType = (budget?.card_id || (budget?.period && budget.period !== 'monthly')) ? 'period' : 'simple'

  const [name,          setName]          = useState(budget?.name ?? '')
  const [budgetType,    setBudgetType]    = useState(initType)
  const [dimension,     setDimension]     = useState(
    budget?.importance     ? 'importance' :
    budget?.subcategory_id ? 'subcategory' :
    budget?.category_id    ? 'category'    : (initType === 'period' ? 'all' : 'category')
  )
  const [categoryId,    setCategoryId]    = useState(budget?.category_id    ?? '')
  const [subcategoryId, setSubcategoryId] = useState(budget?.subcategory_id ?? '')
  const [importance,    setImportance]    = useState(budget?.importance     ?? '')
  const [limit,         setLimit]         = useState(budget?.monthly_limit  ?? '')
  const [period,        setPeriod]        = useState(budget?.period         ?? 'monthly')
  const [resetDay,      setResetDay]      = useState(budget?.reset_day      ?? null)
  const [rolloverBehavior, setRolloverBehavior] = useState(budget?.rollover_behavior ?? 'expire')
  const [cardId,        setCardId]        = useState(budget?.card_id        ?? '')
  const [cards,         setCards]         = useState([])
  const [cardOpen,      setCardOpen]      = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [saveError,     setSaveError]     = useState('')
  const cardRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('cards').select('id, name').eq('user_id', user.id).order('created_at')
      .then(({ data }) => setCards(data ?? []))
  }, [user?.id])

  useEffect(() => {
    if (!cardOpen) return
    const h = e => { if (!cardRef.current?.contains(e.target)) setCardOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [cardOpen])

  const topCategories   = categories.filter(c => !c.parent_id)
  const subcategories   = categories.filter(c =>  c.parent_id)
  const categoryOptions = topCategories.map(c => ({ value: c.id, label: c.name, color: c.color, icon: c.icon }))
  const subcategoryOpts = subcategories.map(c  => ({ value: c.id, label: c.name, color: c.color, icon: c.icon }))

  const isValid = limit && !isNaN(parseFloat(limit)) && parseFloat(limit) > 0 &&
    (budgetType !== 'period' || !!cardId) &&
    (
      dimension === 'all'                                ||
      (dimension === 'category'    && categoryId)        ||
      (dimension === 'subcategory' && subcategoryId)     ||
      (dimension === 'importance'  && importance)
    )

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    setSaveError('')
    const payload = {
      name:           name.trim() || null,
      monthly_limit:  parseFloat(limit),
      category_id:    dimension === 'category'    ? categoryId    : null,
      subcategory_id: dimension === 'subcategory' ? subcategoryId : null,
      importance:     dimension === 'importance'  ? importance    : null,
      period:         budgetType === 'period' ? period : 'monthly',
      reset_day:      budgetType === 'period' ? (resetDay ?? null) : null,
      card_id:           budgetType === 'period' ? (cardId || null) : null,
      rollover_behavior: budgetType === 'period' ? rolloverBehavior : null,
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
    setSaving(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!window.confirm('Delete this budget?')) return
    setDeleting(true)
    await supabase.from('budgets').delete().eq('id', budget.id)
    setDeleting(false)
    onSaved()
    onClose()
  }

  const selectedCard = cards.find(c => c.id === cardId)
  const limitLabel = budgetType === 'period' ? (LIMIT_LABELS[period] ?? 'Limit') : 'Monthly limit'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-2xl w-full max-w-md flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Edit Budget' : 'New Budget'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">

          {/* Name (optional) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Name <span className="normal-case text-white/25">(optional)</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              type="text"
              placeholder="e.g. Groceries, Rent…"
              className={inp}
            />
          </div>

          {/* Budget type */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Budget type</label>
            <div className="flex bg-white/5 rounded-xl p-0.5">
              {[['simple', 'Simple'], ['period', 'By period']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setBudgetType(v)}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium ${budgetType === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">Budget by</label>
            <div className="flex bg-white/5 rounded-xl p-0.5">
              {(budgetType === 'period'
                ? [['all', 'All'], ['category', 'Category'], ['subcategory', 'Subcategory'], ['importance', 'Importance']]
                : [['category', 'Category'], ['subcategory', 'Subcategory'], ['importance', 'Importance']]
              ).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setDimension(v)}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium ${dimension === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Picker (hidden when dimension is 'all') */}
          {dimension !== 'all' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">
              {dimension === 'importance' ? 'Importance level' : dimension === 'subcategory' ? 'Subcategory' : 'Category'}
            </label>
            {dimension === 'category' && (
              <DropdownSelect value={categoryId} onChange={setCategoryId}
                options={categoryOptions} placeholder="Select category…" />
            )}
            {dimension === 'subcategory' && (
              <DropdownSelect value={subcategoryId} onChange={setSubcategoryId}
                options={subcategoryOpts} placeholder="Select subcategory…" />
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

          {/* Period (period mode only) */}
          {budgetType === 'period' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest">Period</label>
              <div className="flex bg-white/5 rounded-xl p-0.5">
                {PERIODS.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setPeriod(v)}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium ${period === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset day (period mode, weekly or monthly only) */}
          {budgetType === 'period' && period === 'weekly' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest">Week starts on</label>
              <div className="flex bg-white/5 rounded-xl p-0.5">
                {[['Mon',0],['Tue',1],['Wed',2],['Thu',3],['Fri',4],['Sat',5],['Sun',6]].map(([l, v]) => (
                  <button key={v} type="button" onClick={() => setResetDay(v)}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium ${(resetDay ?? 0) === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
          {budgetType === 'period' && period === 'monthly' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest">Resets on day</label>
              <div className="relative">
                <input
                  type="number" min="1" max="28" step="1"
                  value={resetDay ?? 1}
                  onChange={e => {
                    const v = Math.min(28, Math.max(1, parseInt(e.target.value) || 1))
                    setResetDay(v)
                  }}
                  className={inp}
                  placeholder="1"
                />
              </div>
            </div>
          )}

          {/* Rollover behavior (period mode only) */}
          {budgetType === 'period' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest">At period end</label>
              <div className="flex bg-white/5 rounded-xl p-0.5">
                {[['expire', 'Expire'], ['accumulate', 'Accumulate']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setRolloverBehavior(v)}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium ${rolloverBehavior === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/25 leading-relaxed">
                {rolloverBehavior === 'accumulate'
                  ? 'Leftover budget carries over to the next period.'
                  : 'Unused budget expires at the end of each period.'}
              </p>
            </div>
          )}

          {/* Source card (period mode only — required) */}
          {budgetType === 'period' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted uppercase tracking-widest">Source card <span className="normal-case text-red-400/60">*</span></label>
              {cards.length === 0 ? (
                <p className="text-xs text-white/30 italic px-1">No cards found — add a card first.</p>
              ) : (
                <div ref={cardRef} className="relative">
                  <button type="button" onClick={() => setCardOpen(v => !v)}
                    className={`w-full flex items-center justify-between bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-left transition-colors hover:border-white/20 ${!cardId ? 'border-red-500/20' : 'border-white/10'}`}>
                    {selectedCard
                      ? <span className="text-white/80">{selectedCard.name}</span>
                      : <span className="text-white/25">Select card…</span>}
                    <ChevronDown size={13} className="text-white/25 shrink-0 ml-2" />
                  </button>
                  {cardOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
                      {cards.map(c => (
                        <button key={c.id} type="button"
                          onClick={() => { setCardId(c.id); setCardOpen(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${cardId === c.id ? 'text-white/80 bg-white/[0.08]' : 'text-white/40'}`}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Limit */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest">{limitLabel}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
              <input value={limit} onChange={e => setLimit(e.target.value)}
                type="number" step="0.01" min="0" placeholder="0,00"
                className={inp + ' pl-8'} />
            </div>
          </div>

          {saveError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{saveError}</p>
          )}

          <div className="flex gap-3 pt-1">
            {isEdit && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="p-2.5 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-40">
                <Trash2 size={15} />
              </button>
            )}
            <button type="button" onClick={onClose}
              className="btn-modal-cancel">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !isValid}
              className="btn-modal-primary">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Set Budget'}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
