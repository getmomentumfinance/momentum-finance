import { useState, useRef, useEffect } from 'react'
import { Search, X, Receipt } from 'lucide-react'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useSharedData } from '../../context/SharedDataContext'

export default function LinkedExpenseSearch({ value, onChange, initialParentId = null }) {
  const { fmt } = usePreferences()
  const { allTransactions, categoryMap, receiverMap } = useSharedData()
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState('')
  const ref  = useRef(null)
  const inputRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  const linked = value ? allTransactions.find(t => t.id === value) : null

  const expenses = allTransactions
    .filter(t => t.type === 'expense' && !t.is_split_parent)
    .sort((a, b) => b.date.localeCompare(a.date))

  const q = query.trim().toLowerCase()

  let filtered
  if (q) {
    filtered = expenses.filter(t => {
      const desc = (t.description ?? '').toLowerCase()
      const rec  = receiverMap[t.receiver_id]?.name?.toLowerCase() ?? ''
      const cat  = categoryMap[t.category_id]?.name?.toLowerCase() ?? ''
      return desc.includes(q) || rec.includes(q) || cat.includes(q)
    })
  } else if (initialParentId) {
    // Show children of the split parent first, then all other expenses
    const children = expenses.filter(t => t.split_parent_id === initialParentId)
    const rest     = expenses.filter(t => t.split_parent_id !== initialParentId)
    filtered = [...children, ...rest]
  } else {
    filtered = expenses
  }

  const results = filtered.slice(0, 20)

  function select(tx) {
    onChange(tx.id)
    setOpen(false)
    setQuery('')
  }

  function clear(e) {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors"
        style={{
          background: 'rgba(255,255,255,0.04)',
          borderColor: open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
        }}>
        <Receipt size={14} className="text-white/30 shrink-0" />
        {linked ? (
          <span className="flex-1 truncate text-white/80">
            {linked.description || receiverMap[linked.receiver_id]?.name || 'Expense'}
            <span className="text-white/35 ml-2">{new Date(linked.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {fmt(linked.amount)}</span>
          </span>
        ) : (
          <span className="flex-1 text-white/30">Search expense…</span>
        )}
        {linked && (
          <button type="button" onClick={clear} className="text-white/25 hover:text-white/60 transition-colors shrink-0">
            <X size={13} />
          </button>
        )}
      </button>

      {/* Popup */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-popup border border-white/15 rounded-xl shadow-xl flex flex-col overflow-hidden max-h-72">
          <div className="relative px-3 py-2 border-b border-white/[0.06]">
            <Search size={12} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by description, category…"
              className="w-full bg-transparent pl-6 text-xs text-white/80 placeholder-white/25 outline-none"
            />
          </div>
          <div className="overflow-y-auto">
            {results.length === 0 && (
              <p className="text-center text-xs text-white/30 py-6">No expenses found</p>
            )}
            {!q && initialParentId && filtered.some(t => t.split_parent_id === initialParentId) && (
              <div className="px-3 py-1.5 text-[10px] text-muted uppercase tracking-widest border-b border-white/[0.04] bg-white/[0.02]">
                Split children
              </div>
            )}
            {results.map((tx, idx) => {
              const rec = receiverMap[tx.receiver_id]?.name
              const cat = categoryMap[tx.category_id]
              const isFirstNonChild = !q && initialParentId && idx > 0 && tx.split_parent_id !== initialParentId && results[idx - 1]?.split_parent_id === initialParentId
              return (
                <>
                {isFirstNonChild && (
                  <div className="px-3 py-1.5 text-[10px] text-muted uppercase tracking-widest border-y border-white/[0.04] bg-white/[0.02]">
                    Other expenses
                  </div>
                )}
                <button
                  key={tx.id}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => select(tx)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-white/[0.04] last:border-0">
                  {cat && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{tx.description || rec || 'Expense'}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      {cat && <span> · {cat.name}</span>}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-white/55 shrink-0">{fmt(tx.amount)}</span>
                </button>
                </>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
