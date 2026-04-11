import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Scissors, Trash2, ChevronDown, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CategoryPill } from '../shared/CategoryPill'
import { usePreferences } from '../../context/UserPreferencesContext'

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/25'

function CategoryDropdown({ value, onChange, categories, placeholder }) {
  const [open, setOpen] = useState(false)
  const selected = categories.find(c => c.id === value)

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-left transition-colors hover:border-white/20">
        {selected
          ? <CategoryPill name={selected.name} color={selected.color} icon={selected.icon} />
          : <span className="text-white/25 text-sm">{placeholder}</span>}
        <ChevronDown size={12} className="text-white/25 shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl max-h-44 overflow-y-auto scrollbar-thin">
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            className="w-full px-3 py-2 text-xs text-white/30 hover:bg-white/5 text-left">
            None
          </button>
          {categories.map(c => (
            <button key={c.id} type="button"
              onClick={() => { onChange(c.id); setOpen(false) }}
              className={`w-full flex items-center px-3 py-2 hover:bg-white/5 transition-colors ${value === c.id ? 'bg-white/8' : ''}`}>
              <CategoryPill name={c.name} color={c.color} icon={c.icon} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SplitTransactionModal({ transaction, existingChildren = [], allCategories, onClose, onBack }) {
  const { user } = useAuth()
  const { fmt } = usePreferences()
  const topCategories = allCategories.filter(c => !c.parent_id)

  const [splits, setSplits] = useState(() => {
    if (existingChildren.length > 0) {
      return existingChildren.map(c => ({
        key: c.id,
        amount: c.amount.toString(),
        description: c.description ?? '',
        category_id: c.category_id ?? '',
        subcategory_id: c.subcategory_id ?? '',
      }))
    }
    return [
      { key: crypto.randomUUID(), amount: '', description: '', category_id: '', subcategory_id: '' },
      { key: crypto.randomUUID(), amount: '', description: '', category_id: '', subcategory_id: '' },
    ]
  })

  const [saving, setSaving] = useState(false)

  const total = transaction.amount
  const allocated = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0)
  const remaining = total - allocated
  const isValid = splits.length >= 2 &&
    splits.every(sp => sp.amount && parseFloat(sp.amount) > 0) &&
    Math.abs(remaining) < 0.005

  function updateSplit(key, field, value) {
    setSplits(ss => ss.map(s => {
      if (s.key !== key) return s
      if (field === 'category_id') return { ...s, [field]: value, subcategory_id: '' }
      return { ...s, [field]: value }
    }))
  }

  function addSplit() {
    setSplits(ss => [...ss, { key: crypto.randomUUID(), amount: '', description: '', category_id: '', subcategory_id: '' }])
  }

  function removeSplit(key) {
    if (splits.length <= 2) return
    setSplits(ss => ss.filter(s => s.key !== key))
  }

  function distributeEvenly() {
    const each = (total / splits.length).toFixed(2)
    const last = (total - parseFloat(each) * (splits.length - 1)).toFixed(2)
    setSplits(ss => ss.map((s, i) => ({ ...s, amount: i === ss.length - 1 ? last : each })))
  }

  async function handleSave() {
    if (!isValid) return
    setSaving(true)

    if (existingChildren.length > 0) {
      await supabase.from('transactions').delete().in('id', existingChildren.map(c => c.id))
    }

    const children = splits.map(sp => ({
      user_id: user.id,
      type: transaction.type,
      date: transaction.date,
      amount: parseFloat(sp.amount),
      description: transaction.description || null,
      comment: sp.description || null,
      receiver_id: transaction.receiver_id || null,
      card_id: transaction.card_id || null,
      category_id: sp.category_id || null,
      subcategory_id: sp.subcategory_id || null,
      split_parent_id: transaction.id,
      is_deleted: false,
    }))

    await supabase.from('transactions').insert(children)
    await supabase.from('transactions').update({ is_split_parent: true }).eq('id', transaction.id)

    window.dispatchEvent(new CustomEvent('transaction-saved'))
    setSaving(false)
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors mr-0.5">
                <ArrowLeft size={15} />
              </button>
            )}
            <Scissors size={15} className="text-white/40" />
            <h2 className="text-base font-semibold text-white">Split Transaction</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Transaction info */}
        <div className="px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-white/90 truncate">
                {transaction.description || <span className="text-white/30 italic">No description</span>}
              </p>
              <p className="text-xs text-white/35 mt-0.5">
                {new Date(transaction.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <span className="text-lg font-bold tabular-nums shrink-0" style={{ color: 'var(--type-expense)' }}>
              {fmt(total)}
            </span>
          </div>
        </div>

        {/* Splits */}
        <div className="flex flex-col gap-3 px-6 py-4 overflow-y-auto flex-1 scrollbar-thin">
          {splits.map((sp, idx) => {
            const subCats = allCategories.filter(c => c.parent_id === sp.category_id)
            return (
              <div key={sp.key} className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted uppercase tracking-widest">Part {idx + 1}</span>
                  {splits.length > 2 && (
                    <button type="button" onClick={() => removeSplit(sp.key)}
                      className="text-white/25 hover:text-red-400 transition-colors p-0.5">
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                  <input
                    type="text" inputMode="decimal" placeholder="0,00"
                    value={sp.amount}
                    onChange={e => updateSplit(sp.key, 'amount', e.target.value.replace(',', '.'))}
                    className={inp + ' pl-7'}
                  />
                </div>

                <CategoryDropdown
                  value={sp.category_id}
                  onChange={v => updateSplit(sp.key, 'category_id', v)}
                  categories={topCategories}
                  placeholder="Category…"
                />

                {subCats.length > 0 && (
                  <CategoryDropdown
                    value={sp.subcategory_id}
                    onChange={v => updateSplit(sp.key, 'subcategory_id', v)}
                    categories={subCats}
                    placeholder="Subcategory…"
                  />
                )}

                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={sp.description}
                  onChange={e => updateSplit(sp.key, 'description', e.target.value)}
                  className={inp}
                />
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-white/5 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <button type="button" onClick={addSplit}
                className="flex items-center gap-1 text-white/40 hover:text-white transition-colors">
                <Plus size={12} /> Add part
              </button>
              <button type="button" onClick={distributeEvenly}
                className="text-white/40 hover:text-white transition-colors">
                Distribute evenly
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/35">Remaining:</span>
              <span className={`tabular-nums font-medium ${Math.abs(remaining) < 0.005 ? 'text-green-400' : remaining < 0 ? 'text-red-400' : 'text-white/70'}`}>
                {remaining < 0 ? '−' : ''}{fmt(Math.abs(remaining))}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="btn-modal-cancel">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !isValid}
              className="btn-modal-primary">
              {saving ? 'Saving…' : existingChildren.length > 0 ? 'Update Split' : 'Split'}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}
