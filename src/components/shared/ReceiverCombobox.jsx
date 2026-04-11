import { useState, useRef, useEffect } from 'react'
import { X, Building2, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// ── Avatar with Clearbit → Google favicon → initials fallback ──
export function ReceiverAvatar({ receiver, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[11px]'
  const [attempt, setAttempt] = useState(0)

  useEffect(() => { setAttempt(0) }, [receiver?.domain, receiver?.logo_url])

  if (!receiver) return null

  const initials = receiver.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sources = [
    receiver.logo_url || null,
    receiver.domain ? `https://logo.clearbit.com/${receiver.domain}` : null,
    receiver.domain ? `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${receiver.domain}&size=64` : null,
  ].filter(Boolean)

  const src = sources[attempt]
  if (!src) {
    return (
      <div className={`${dim} rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0`}>
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={receiver.name}
      className={`${dim} rounded-full object-contain bg-white p-0.5 shrink-0`}
      onError={() => {
        if (attempt < sources.length - 1) setAttempt(a => a + 1)
        else setAttempt(sources.length)
      }}
    />
  )
}

// ── Receiver combobox ──────────────────────────────────────────
// Shared across AddTransactionModal, AddRecurringBillModal, etc.
export function ReceiverCombobox({ receiverId, onReceiverSelect, receivers, onAddReceiver, inputClass }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = receivers.find(r => r.id === receiverId) ?? null

  // When receiver is selected externally, clear the search query
  useEffect(() => {
    if (receiverId) setQuery('')
  }, [receiverId])

  const q = query.trim().toLowerCase()
  const filtered = q.length > 0
    ? receivers.filter(r => r.name.toLowerCase().includes(q)).slice(0, 6)
    : []
  const exactMatch = receivers.find(r => r.name.toLowerCase() === q)
  const showAdd = q.length > 0 && !exactMatch
  const showDropdown = open && (filtered.length > 0 || showAdd)

  function handleSelect(r) {
    onReceiverSelect(r.id)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onReceiverSelect(null)
    setQuery('')
  }

  return (
    <div
      ref={ref}
      className="relative"
      onBlur={e => { if (!ref.current?.contains(e.relatedTarget)) setOpen(false) }}
    >
      {/* Selected receiver badge */}
      {selected && !query ? (
        <div className={`flex items-center gap-2 ${inputClass}`}>
          <ReceiverAvatar receiver={selected} />
          <span className="flex-1 text-sm text-white truncate">{selected.name}</span>
          <button
            type="button"
            tabIndex={-1}
            onClick={handleClear}
            className="text-white/20 hover:text-white/50 transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onReceiverSelect(null); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search receiver…"
          className={inputClass}
        />
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-20 shadow-xl">
          {filtered.map(r => (
            <button
              key={r.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(r)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 transition-colors text-left"
            >
              <ReceiverAvatar receiver={r} />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white">{r.name}</span>
                {r.domain && <span className="text-xs text-muted ml-2">{r.domain}</span>}
              </div>
              <span className="text-[10px] text-white/25 shrink-0">{r.type}</span>
            </button>
          ))}
          {showAdd && onAddReceiver && (
            <div className="border-t border-white/8">
              <p className="px-3 pt-2 pb-1 text-[10px] text-white/30 uppercase tracking-widest">
                Add <span className="text-white/60 normal-case">"{query.trim()}"</span> as
              </p>
              <div className="flex gap-1.5 px-3 pb-2.5">
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onAddReceiver(query.trim(), 'business'); setQuery(''); setOpen(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white"
                >
                  <Building2 size={12} /> Business
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onAddReceiver(query.trim(), 'person'); setQuery(''); setOpen(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white"
                >
                  <UserRound size={12} /> Person
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Hook to add a receiver and refresh list ─────────────────────
export function useAddReceiver(userId, setReceivers) {
  const { user } = useAuth()
  const uid = userId ?? user?.id
  return async function addReceiver(name, type) {
    const { data } = await supabase.from('receivers').insert({
      user_id: uid, name, type,
      domain: null, logo_url: null,
    }).select().single()
    if (data) setReceivers(prev => [...prev, data])
    return data
  }
}
