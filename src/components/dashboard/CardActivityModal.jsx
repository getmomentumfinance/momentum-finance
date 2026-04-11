import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { TYPES_MAP } from '../../constants/transactionTypes'
import { usePreferences } from '../../context/UserPreferencesContext'

const CREDIT_TYPES = new Set(['income'])

function effect(row) {
  return CREDIT_TYPES.has(row.type) ? row.amount : -row.amount
}

// card = null means Cash Wallet
export default function CardActivityModal({ card, currentDate, onClose }) {
  const { user } = useAuth()
  const { fmt } = usePreferences()
  const [rows,        setRows]        = useState([])
  const [baseBalance, setBaseBalance] = useState(0)
  const [loading,     setLoading]     = useState(true)

  const isCash     = card === null
  const title      = isCash ? 'Cash Wallet' : card.name
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      setLoading(true)
      const year  = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const start = new Date(year, month, 1).toISOString().slice(0, 10)
      const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)

      // Current month transactions (all, including deleted)
      let txQuery = supabase
        .from('transactions')
        .select('id, type, description, amount, date, created_at, is_cash, is_deleted, receiver_id')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      // All non-deleted transactions BEFORE this month (for base balance)
      let prevQuery = supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .lt('date', start)

      if (isCash) {
        txQuery  = txQuery.eq('is_cash', true)
        prevQuery = prevQuery.eq('is_cash', true)
      } else {
        txQuery  = txQuery.eq('card_id', card.id).eq('is_cash', false).is('split_parent_id', null)
        prevQuery = prevQuery.eq('card_id', card.id).eq('is_cash', false).is('split_parent_id', null)
      }

      const [{ data: txs }, { data: prevTxs }, { data: receivers }] = await Promise.all([
        txQuery,
        prevQuery,
        supabase.from('receivers').select('id, name').eq('user_id', user.id),
      ])

      // Base = initial_balance (cards only) + all previous transactions
      const initialBal = isCash ? 0 : Number(card.initial_balance ?? 0)
      const prevSum    = (prevTxs ?? []).reduce((s, t) => s + effect(t), 0)
      setBaseBalance(initialBal + prevSum)

      const receiverMap = Object.fromEntries((receivers ?? []).map(r => [r.id, r]))
      setRows((txs ?? []).map(t => ({ ...t, receiver: receiverMap[t.receiver_id] ?? null })))
      setLoading(false)
    }
    load()
  }, [user?.id, card, currentDate, isCash])

  const activeRows = rows.filter(r => !r.is_deleted)
  const monthlyNet = activeRows.reduce((s, r) => s + effect(r), 0)

  // Running balance per row: base + cumulative from oldest→newest
  const runningMap = useMemo(() => {
    const map = {}
    let acc = baseBalance
    ;[...activeRows].reverse().forEach(r => {
      acc += effect(r)
      map[r.id] = acc
    })
    return map
  }, [activeRows, baseBalance])

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg glass-popup rounded-2xl flex flex-col max-h-[80vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="font-semibold text-white">{title}</h2>
            <p className="text-xs text-muted mt-0.5">{monthLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">No activity this month.</div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {rows.map(row => {
                const typeInfo = TYPES_MAP[row.type] ?? { label: row.type, color: '#9ca3af' }
                const sign     = (row.type === 'income' || row.amount < 0) ? '+' : '−'
                const deleted  = !!row.is_deleted
                const running  = !deleted ? runningMap[row.id] : null

                return (
                  <div
                    key={row.id}
                    className={`flex items-center gap-3 px-4 py-3 ${deleted ? 'opacity-40' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-white/90 truncate ${deleted ? 'line-through' : ''}`}>
                        {row.description || <span className="text-white/30 italic">No description</span>}
                      </p>
                      <p className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
                        {new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <span
                          className="inline-flex items-center text-[10px] font-medium px-1.5 py-px rounded-full border text-white"
                          style={{ borderColor: typeInfo.color }}
                        >
                          {typeInfo.label}
                        </span>
                        {deleted && <span className="text-red-400/60">deleted</span>}
                      </p>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`text-sm font-semibold tabular-nums ${deleted ? 'line-through' : ''}`}
                        style={{ color: deleted ? '#9ca3af' : typeInfo.color }}
                      >
                        {sign}{fmt(row.amount)}
                      </span>
                      {running != null && (
                        <span className={`text-[10px] tabular-nums mt-0.5 ${running < 0 ? 'text-red-400/40' : 'text-white/25'}`}>
                          {fmt(running)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="shrink-0 border-t border-white/5 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted">
              {activeRows.length} transaction{activeRows.length !== 1 ? 's' : ''}
              {rows.length > activeRows.length && (
                <span className="ml-1 text-red-400/60">· {rows.length - activeRows.length} deleted</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted uppercase tracking-widest">Net</span>
              <span className={`text-sm font-semibold tabular-nums ${monthlyNet < 0 ? 'text-red-400' : 'text-white'}`}>
                {monthlyNet >= 0 ? '+' : ''}{fmt(monthlyNet)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
