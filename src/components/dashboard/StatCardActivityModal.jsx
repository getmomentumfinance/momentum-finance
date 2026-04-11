import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { TYPES_MAP } from '../../constants/transactionTypes'
import { usePreferences } from '../../context/UserPreferencesContext'

const CREDIT_TYPES = new Set(['income'])

const KIND_CONFIG = {
  income:          { title: 'Income',             txType: 'income',   scope: 'month', signedTotal: false },
  expenses:        { title: 'Expenses',            txType: 'expense',  scope: 'month', signedTotal: false },
  investments:     { title: 'Investments',         txType: 'invest',   scope: 'month', signedTotal: false },
  'savings-month': { title: 'Savings This Month',  txType: 'savings',  scope: 'month', signedTotal: false },
  cash:            { title: 'Cash Wallet',         isCash: true,       scope: 'month', signedTotal: true  },
  balance:         { title: 'Total Balance',       scope: 'month',                     signedTotal: true  },
  'total-savings': { title: 'Total Savings',       txType: 'savings',  scope: 'month', signedTotal: false },
}

function isCredit(row) {
  return CREDIT_TYPES.has(row.type) || (row.type === 'savings' && row.source === 'savings_in')
}

function txEffect(row, signed) {
  return signed ? (isCredit(row) ? row.amount : -row.amount) : row.amount
}

export default function StatCardActivityModal({ kind, currentDate, onClose }) {
  const { user } = useAuth()
  const { fmt } = usePreferences()
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  const config     = KIND_CONFIG[kind] ?? {}
  const year       = currentDate.getFullYear()
  const month      = currentDate.getMonth()
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user?.id || !kind) return
    async function load() {
      setLoading(true)

      let txQuery = supabase
        .from('transactions')
        .select('id, type, source, description, amount, date, is_cash, is_deleted, receiver_id')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (config.txType) txQuery = txQuery.eq('type', config.txType)
      if (config.isCash) txQuery = txQuery.eq('is_cash', true)
      if (config.scope === 'month') {
        const start = new Date(year, month, 1).toISOString().slice(0, 10)
        const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)
        txQuery = txQuery.gte('date', start).lte('date', end)
      }

      const [{ data: txs }, { data: receivers }] = await Promise.all([
        txQuery,
        supabase.from('receivers').select('id, name').eq('user_id', user.id),
      ])

      const receiverMap = Object.fromEntries((receivers ?? []).map(r => [r.id, r]))
      const PAIRED = new Set(['transfer', 'savings', 'cash_out'])
      setRows(
        (txs ?? [])
          .filter(t => PAIRED.has(t.type) ? t.amount > 0 : true)
          .map(t => ({ ...t, receiver: receiverMap[t.receiver_id] ?? null }))
      )
      setLoading(false)
    }
    load()
  }, [user?.id, kind, year, month])

  const activeRows = rows.filter(r => !r.is_deleted)

  const footerTotal = activeRows.reduce((s, r) => s + txEffect(r, config.signedTotal), 0)

  // Running total per row: accumulate oldest→newest, keyed by id
  const runningMap = useMemo(() => {
    const signed = config.signedTotal ?? false
    const map = {}
    let acc = 0
    // Reverse so oldest first, accumulate, then map back
    ;[...activeRows].reverse().forEach(r => {
      acc += txEffect(r, signed)
      map[r.id] = acc
    })
    return map
  }, [activeRows, config.signedTotal])

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
            <h2 className="font-semibold text-white">{config.title}</h2>
            {config.scope === 'month' && (
              <p className="text-xs text-muted mt-0.5">{monthLabel}</p>
            )}
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
            <div className="text-center py-12 text-muted text-sm">No activity.</div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {rows.map(row => {
                const typeInfo  = TYPES_MAP[row.type] ?? { label: row.type, color: '#9ca3af' }
                const rowColor = isCredit(row) && row.type !== 'income' ? 'var(--type-income)' : typeInfo.color
                const sign     = isCredit(row) ? '+' : '−'
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
                        {new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span
                          className="inline-flex items-center text-[10px] font-medium px-1.5 py-px rounded-full border text-white"
                          style={{ borderColor: rowColor }}
                        >
                          {typeInfo.label}
                        </span>
                        {deleted && <span className="text-red-400/60">deleted</span>}
                      </p>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`text-sm font-semibold tabular-nums ${deleted ? 'line-through' : ''}`}
                        style={{ color: deleted ? '#9ca3af' : rowColor }}
                      >
                        {sign}{fmt(row.amount)}
                      </span>
                      {running != null && (
                        <span className="text-[10px] tabular-nums text-white/25 mt-0.5">
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
              <span className="text-xs text-muted uppercase tracking-widest">Total</span>
              <span className={`text-sm font-semibold tabular-nums ${footerTotal < 0 ? 'text-red-400' : 'text-white'}`}>
                {footerTotal < 0 ? '−' : ''}{fmt(footerTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
