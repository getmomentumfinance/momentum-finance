import { useState, useEffect } from 'react'
import { PiggyBank, Banknote, Scissors } from 'lucide-react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSharedData } from '../../context/SharedDataContext'
import { TYPES_MAP } from '../../constants/transactionTypes'
import { CategoryPill } from '../shared/CategoryPill'
import { usePreferences } from '../../context/UserPreferencesContext'

function amountColor(type, source) {
  if (type === 'income')   return 'var(--type-income)'
  if (type === 'expense')  return 'var(--type-expense)'
  if (type === 'savings')  return source === 'savings_in' ? 'var(--type-income)' : source === 'savings_out' ? 'var(--type-expense)' : '#9ca3af'
  if (type === 'cash_out') return source === 'cash' ? 'var(--type-income)' : 'var(--type-expense)'
  return '#9ca3af'
}

function amountSign(type, source) {
  if (type === 'income')   return '+'
  if (type === 'expense')  return '−'
  if (type === 'savings')  return source === 'savings_in' ? '+' : source === 'savings_out' ? '−' : ''
  if (type === 'cash_out') return source === 'cash' ? '+' : '−'
  if (type === 'transfer') return '−'
  return ''
}

function ReceiverAvatar({ receiver }) {
  const [src, setSrc] = useState(() => {
    if (!receiver) return null
    if (receiver.logo_url) return receiver.logo_url
    if (receiver.domain)   return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${receiver.domain}&size=64`
    return null
  })
  const [failed, setFailed] = useState(false)

  if (!receiver) return <div className="w-6 h-6 rounded-full bg-white/8 shrink-0" />

  const initials = receiver.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  function handleError() {
    setSrc(null); setFailed(true)
  }

  if (!src || failed) {
    return (
      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
        {initials}
      </div>
    )
  }
  return (
    <img src={src} alt={receiver.name} onError={handleError}
      className="w-6 h-6 rounded-full object-contain bg-white/90 shrink-0 p-0.5" />
  )
}

function TypeAvatar({ type, typeInfo }) {
  const icon =
    type === 'savings'  ? <PiggyBank size={12} strokeWidth={2} /> :
    type === 'cash_out' ? <Banknote  size={12} strokeWidth={2} /> :
    typeInfo?.Icon      ? <typeInfo.Icon size={12} strokeWidth={2} /> : null

  if (!icon) return <div className="w-6 h-6 rounded-full bg-white/8 shrink-0" />
  return (
    <div className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center shrink-0"
      style={{ color: typeInfo?.color ?? '#9ca3af' }}>
      {icon}
    </div>
  )
}

export default function RecentTransactions({ currentDate }) {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const { categoryMap, receiverMap } = useSharedData()
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useCollapsed('RecentTransactions')

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      setLoading(true)
      const year  = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const start = new Date(year, month, 1).toISOString().slice(0, 10)
      const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)

      const { data: txs } = await supabase.from('transactions')
        .select('id, type, description, comment, amount, date, source, category_id, subcategory_id, receiver_id, is_split_parent, split_parent_id')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      const filtered = (txs ?? [])
        .filter(t => (t.type === 'transfer' || t.type === 'savings' || t.type === 'cash_out') ? t.amount > 0 : true)
        .map(t => ({
          ...t,
          category:    categoryMap[t.category_id]    ?? null,
          subcategory: categoryMap[t.subcategory_id] ?? null,
          receiver:    receiverMap[t.receiver_id]    ?? null,
        }))

      // Group split children immediately under their parent
      const byId     = Object.fromEntries(filtered.map(r => [r.id, r]))
      const childMap = {}
      for (const row of filtered) {
        if (row.split_parent_id) {
          childMap[row.split_parent_id] = [...(childMap[row.split_parent_id] ?? []), row]
        }
      }
      const ordered = []
      const added   = new Set()
      for (const row of filtered) {
        if (added.has(row.id)) continue
        if (row.split_parent_id && byId[row.split_parent_id]) continue
        added.add(row.id)
        ordered.push(row)
        if (row.is_split_parent && childMap[row.id]) {
          for (const child of childMap[row.id]) {
            added.add(child.id)
            ordered.push(child)
          }
        }
      }
      setRows(ordered.slice(0, 9))
      setLoading(false)
    }

    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])

  const dateStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <button type="button" onClick={() => setCollapsed(c => !c)} className="font-semibold text-sm hover:text-white/70 transition-colors">{t('rt.title')}</button>
          <p className="text-[11px] text-muted mt-0.5">{dateStr}</p>
        </div>
      </div>

      {!collapsed && (<>
      {/* Header row */}
      <div className="grid px-4 pb-2 border-b border-white/5"
        style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) 90px 52px' }}>
        <span className="text-[10px] text-muted uppercase tracking-widest font-medium">{t('common.receiver')}</span>
        <span className="text-[10px] text-muted uppercase tracking-widest font-medium">{t('common.category')}</span>
        <span className="text-[10px] text-muted uppercase tracking-widest font-medium text-right pr-3">{t('common.amount')}</span>
        <span className="text-[10px] text-muted uppercase tracking-widest font-medium text-right">{t('common.date')}</span>
      </div>

      {loading ? (
        <div className="py-10 text-center text-xs text-muted shrink-0">{t('common.loading')}</div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted shrink-0">{t('rt.noTx')}</div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {rows.slice(0, 9).map(row => {
            const typeInfo = TYPES_MAP[row.type] ?? null
            const showAvatar = row.type === 'expense' || row.type === 'income'
            const isChild  = !!row.split_parent_id
            const isParent = !!row.is_split_parent

            return (
              <div key={row.id}
                className={`grid items-center px-4 py-2.5 hover:bg-white/[0.02] transition-colors ${isChild ? 'bg-white/[0.01]' : ''}`}
                style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) 90px 52px' }}>

                {/* Description */}
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  {isChild && <span className="text-white/20 text-xs shrink-0">↳</span>}
                  {showAvatar
                    ? <ReceiverAvatar receiver={row.receiver} />
                    : <TypeAvatar type={row.type} typeInfo={typeInfo} />
                  }
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm text-white/85">
                      {row.description || <span className="text-white/25 italic">—</span>}
                    </span>
                    {isChild && row.comment && (
                      <span className="truncate text-[10px] text-white/35">{row.comment}</span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="min-w-0 pr-3">
                  {row.category
                    ? <CategoryPill name={row.category.name} color={row.category.color} icon={row.category.icon} />
                    : <span className="text-white/20 text-xs">—</span>}
                </div>

                {/* Amount */}
                <div className="tabular-nums text-sm font-medium text-right whitespace-nowrap px-3"
                  style={{ color: isParent ? 'rgba(255,255,255,0.2)' : amountColor(row.type, row.source) }}>
                  {isParent
                    ? <span className="flex items-center justify-end gap-1"><Scissors size={9} /><span className="line-through">{amountSign(row.type, row.source)}{fmt(row.amount)}</span></span>
                    : <>{amountSign(row.type, row.source)}{fmt(row.amount)}</>
                  }
                </div>

                {/* Date */}
                <div className="text-xs text-white/40 whitespace-nowrap text-right">
                  {new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>

              </div>
            )
          })}
        </div>
      )}
      </>)}
    </div>
  )
}
