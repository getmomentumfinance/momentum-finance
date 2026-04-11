import { useState, useEffect } from 'react'
import { usePreferences } from '../../context/UserPreferencesContext'
import {
  CreditCard, PiggyBank, Ticket, Banknote, Plus, Pencil, Trash2, TrendingUp, Wallet, X,
} from 'lucide-react'
import { CATEGORY_ICONS, ICONS_MAP } from '../shared/CategoryPill'
import { useCards } from '../../hooks/useCards'
import { useBanks } from '../../hooks/useBanks'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function resolveIcon(id) { return ICONS_MAP[id] ?? CreditCard }

const CARD_TYPES = [
  { value: 'debit',   label: 'Debit',        Icon: CreditCard,  canBeMain: true  },
  { value: 'credit',  label: 'Credit',       Icon: Banknote,    canBeMain: true  },
  { value: 'savings', label: 'Savings',      Icon: PiggyBank,   canBeMain: true  },
  { value: 'voucher', label: 'Voucher',      Icon: Ticket,      canBeMain: false },
  { value: 'trading', label: 'Trading',      Icon: TrendingUp,  canBeMain: false },
  { value: 'cash',    label: 'Cash Wallet',  Icon: Wallet,      canBeMain: false, singleOnly: true },
]

// ── Bank avatar ───────────────────────────────────────────────
function BankAvatar({ bank, size = 24 }) {
  const [src, setSrc] = useState(() => {
    if (bank?.logo_url) return bank.logo_url
    if (bank?.domain)   return `https://logo.clearbit.com/${bank.domain}`
    return null
  })
  const [failed, setFailed] = useState(0)

  if (!bank) return null

  const initials = bank.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const style    = { width: size, height: size, borderRadius: '50%', flexShrink: 0 }

  function handleError() {
    if (failed === 0 && bank?.domain) {
      setSrc(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${bank.domain}&size=64`)
      setFailed(1)
    } else {
      setSrc(null); setFailed(2)
    }
  }

  if (!src || failed === 2) {
    return (
      <div
        style={{ ...style, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        className="text-[9px] font-bold text-white"
      >{initials}</div>
    )
  }

  return <img src={src} alt={bank.name} onError={handleError} style={{ ...style, objectFit: 'contain', background: 'white' }} />
}

// ── Icon picker ───────────────────────────────────────────────
function IconPicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = q
    ? CATEGORY_ICONS.filter(({ id, group }) => id.includes(q) || group.toLowerCase().includes(q))
    : CATEGORY_ICONS
  const selected = CATEGORY_ICONS.find(i => i.id === value)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          {selected ? <selected.Icon size={14} className="text-white/70" /> : <span className="text-white/20 text-xs">—</span>}
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search icons…"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/25"
        />
      </div>
      <div className="max-h-28 overflow-y-auto scrollbar-thin grid grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-1 bg-white/[0.02] rounded-xl p-2 border border-white/8">
        {filtered.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={id}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
              ${value === id ? 'bg-white/20 text-white' : 'text-white/30 hover:bg-white/10 hover:text-white'}`}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Card add / edit form ──────────────────────────────────────
function CardForm({ type, banks, initial, onSave, onCancel }) {
  const isCash = type === 'cash'
  const [name,    setName]    = useState(initial?.name            ?? '')
  const [bankId,  setBankId]  = useState(initial?.bank_id         ?? '')
  const [icon,    setIcon]    = useState(initial?.icon            ?? 'credit-card')
  const [balance, setBalance] = useState(initial?.initial_balance ?? '')

  function handleSubmit(e) {
    e?.preventDefault()
    const resolvedName = isCash ? 'Cash Wallet' : name.trim()
    if (!resolvedName) return
    onSave({ name: resolvedName, bank_id: bankId || null, icon, initial_balance: parseFloat(balance) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="flex gap-2">
        {!isCash && (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Card name"
            autoFocus
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
          />
        )}
        <input
          value={balance}
          onChange={e => setBalance(e.target.value)}
          placeholder="Initial balance"
          type="number"
          step="0.01"
          autoFocus={isCash}
          className="w-36 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
        />
      </div>

      {type !== 'cash' && (
        <select
          value={bankId}
          onChange={e => setBankId(e.target.value)}
          className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-sm text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer"
        >
          <option value="">No bank</option>
          {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}

      <IconPicker value={icon} onChange={setIcon} />

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-white transition-colors px-3 py-1.5">
          Cancel
        </button>
        <button type="submit" className="text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 transition-colors">
          Save
        </button>
      </div>
    </form>
  )
}

// ── Single card row ───────────────────────────────────────────
function CardRow({ card, banks, canBeMain, balance, onUpdate, onDelete, onSetMain }) {
  const [editing, setEditing] = useState(false)
  const { fmt } = usePreferences()
  const CardIcon = resolveIcon(card.icon)
  const bank     = banks.find(b => b.id === card.bank_id)

  if (editing) {
    return (
      <CardForm
        type={card.type}
        banks={banks}
        initial={card}
        onSave={updates => { onUpdate(card.id, updates); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 group">
      <CardIcon size={15} className="text-white/50 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white">{card.name}</span>
          {card.is_main && canBeMain && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">main</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {bank && <BankAvatar bank={bank} size={14} />}
          {bank && <span className="text-xs text-muted">{bank.name} ·</span>}
          <span className="text-xs text-muted">{fmt(Number(balance ?? card.initial_balance))}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canBeMain && !card.is_main && (
          <button
            onClick={() => onSetMain(card.id, card.type)}
            className="text-[10px] text-muted hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            Set main
          </button>
        )}
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
          <Pencil size={12} />
        </button>
        <button onClick={() => onDelete(card.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Card type section ─────────────────────────────────────────
function CardTypeSection({ type, label, Icon, cards, banks, canBeMain, singleOnly, balanceMap, onAdd, onUpdate, onDelete, onSetMain }) {
  const [adding, setAdding] = useState(false)
  const typeCards = cards.filter(c => c.type === type)
  const canAdd = !singleOnly || typeCards.length === 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-xs text-muted uppercase tracking-widest">
          <Icon size={12} /> {label}
        </div>
        {canAdd && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors">
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {typeCards.map(card => (
        <CardRow
          key={card.id}
          card={card}
          banks={banks}
          canBeMain={canBeMain}
          balance={balanceMap?.[card.id]}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onSetMain={onSetMain}
        />
      ))}

      {typeCards.length === 0 && !adding && !singleOnly && (
        <p className="text-xs text-muted/50 px-3 py-1.5">No {label.toLowerCase()} cards yet.</p>
      )}

      {adding && (
        <CardForm
          type={type}
          banks={banks}
          onSave={data => { onAdd({ ...data, type }); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}

// ── Cash section (piggybank style) ────────────────────────────
function CashSection({ cards, banks, balanceMap, onAdd, onUpdate, onDelete }) {
  const [adding, setAdding] = useState(false)
  const cashCards = cards.filter(c => c.type === 'cash')

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-xs text-muted uppercase tracking-widest">
          <PiggyBank size={12} /> Cash
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors">
          <Plus size={12} /> Add
        </button>
      </div>

      {cashCards.map(card => (
        <CardRow
          key={card.id}
          card={card}
          banks={banks}
          canBeMain={false}
          balance={balanceMap?.[card.id]}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onSetMain={() => {}}
        />
      ))}

      {cashCards.length === 0 && !adding && (
        <p className="text-xs text-muted/50 px-3 py-1.5">No cash balances yet.</p>
      )}

      {adding && (
        <CardForm
          type="cash"
          banks={[]}
          onSave={data => { onAdd({ ...data, type: 'cash' }); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}

// ── Bank row ──────────────────────────────────────────────────
function BankRow({ bank, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [name,   setName]   = useState(bank.name)
  const [domain, setDomain] = useState(bank.domain ?? '')

  function handleSave() {
    if (!name.trim()) return
    onUpdate(bank.id, { name: name.trim(), domain: domain.trim() || null })
    setEditing(false)
  }

  if (editing) {
    return (
      <div
        className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10"
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) handleSave() }}
      >
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-sm text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer"
        />
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="domain.com"
          className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-sm text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 group">
      <BankAvatar bank={bank} size={28} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">{bank.name}</div>
        {bank.domain && <div className="text-xs text-muted">{bank.domain}</div>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
          <Pencil size={12} />
        </button>
        <button onClick={() => onDelete(bank.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Add bank form ─────────────────────────────────────────────
function AddBankForm({ onSave, onCancel }) {
  const [name,   setName]   = useState('')
  const [domain, setDomain] = useState('')

  function handleKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') onCancel()
  }
  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), domain: domain.trim() || null })
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Bank name"
        autoFocus
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
      />
      <input
        value={domain}
        onChange={e => setDomain(e.target.value)}
        onKeyDown={handleKey}
        placeholder="domain.com (for logo)"
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-white transition-colors px-3 py-1.5">Cancel</button>
        <button type="button" onClick={handleSave} className="text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 transition-colors">Add</button>
      </div>
    </div>
  )
}

// ── Tickers section ───────────────────────────────────────────
function TickersSection({ userId }) {
  const { user } = useAuth()
  const { fmt } = usePreferences()
  const [tickers,   setTickers]   = useState([])
  const [balances,  setBalances]  = useState(() => user?.user_metadata?.portfolio_ticker_balances ?? {})
  const [adding,    setAdding]    = useState(false)
  const [newSymbol, setNewSymbol] = useState('')
  const [newName,   setNewName]   = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [newDate,   setNewDate]   = useState(() => new Date().toISOString().slice(0, 10))
  const [editId,    setEditId]    = useState(null)
  const [editForm,  setEditForm]  = useState({ symbol: '', name: '', balance: '', date: '' })
  const [addDupe,   setAddDupe]   = useState(false)

  useEffect(() => {
    supabase.from('tickers').select('*').eq('user_id', userId).order('symbol')
      .then(({ data }) => { if (data) setTickers(data) })
  }, [userId])

  async function saveBalances(updated) {
    setBalances(updated)
    await supabase.auth.updateUser({ data: { portfolio_ticker_balances: updated } })
  }

  async function addTicker() {
    const sym = newSymbol.trim().toUpperCase()
    if (!sym) return
    if (tickers.some(t => t.symbol === sym)) { setAddDupe(true); return }
    const { data } = await supabase.from('tickers').insert({ user_id: userId, symbol: sym, name: newName.trim() || null }).select().single()
    if (data) {
      setTickers(prev => [...prev, data].sort((a, b) => a.symbol.localeCompare(b.symbol)))
      const parsed = parseFloat(newBalance)
      if (!isNaN(parsed) && parsed > 0) {
        await saveBalances({ ...balances, [sym]: { amount: parsed, date: newDate } })
      }
      setNewSymbol(''); setNewName(''); setNewBalance(''); setNewDate(new Date().toISOString().slice(0, 10)); setAdding(false); setAddDupe(false)
    }
  }

  async function saveTicker(id) {
    const sym = editForm.symbol.trim().toUpperCase()
    if (!sym) { setEditId(null); return }
    const ticker = tickers.find(t => t.id === id)
    await supabase.from('tickers').update({ symbol: sym, name: editForm.name.trim() || null }).eq('id', id)
    setTickers(prev => prev.map(t => t.id === id ? { ...t, symbol: sym, name: editForm.name.trim() || null } : t))
    // Update balance: remove old symbol key, set new symbol key
    const updated = { ...balances }
    if (ticker && ticker.symbol !== sym) delete updated[ticker.symbol]
    const parsed = parseFloat(editForm.balance)
    if (!isNaN(parsed) && parsed > 0) updated[sym] = { amount: parsed, date: editForm.date || new Date().toISOString().slice(0, 10) }
    else delete updated[sym]
    await saveBalances(updated)
    setEditId(null)
  }

  async function deleteTicker(id) {
    const ticker = tickers.find(t => t.id === id)
    await supabase.from('tickers').delete().eq('id', id)
    setTickers(prev => prev.filter(t => t.id !== id))
    if (ticker) {
      const updated = { ...balances }
      delete updated[ticker.symbol]
      await saveBalances(updated)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {tickers.map(t => {
        const bal = balances[t.symbol]
        return (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 group">
            {editId === t.id ? (
              <div className="flex-1 flex flex-col gap-1.5" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) saveTicker(t.id) }}>
                <div className="flex items-center gap-2">
                  <input autoFocus value={editForm.symbol}
                    onChange={e => setEditForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                    onKeyDown={e => { if (e.key === 'Escape') setEditId(null) }}
                    className="bg-transparent text-sm text-white font-mono uppercase outline-none border-b border-white/20 w-20" placeholder="AAPL" />
                  <input value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Escape') setEditId(null) }}
                    className="flex-1 bg-transparent text-sm text-white/60 outline-none border-b border-white/10" placeholder="Name (optional)" />
                  <input value={editForm.balance} type="number" step="0.01" min="0"
                    onChange={e => setEditForm(f => ({ ...f, balance: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Escape') setEditId(null) }}
                    className="w-24 bg-transparent text-sm text-white/60 outline-none border-b border-white/10 text-right" placeholder="Balance" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30">Balance date</span>
                  <input type="date" value={editForm.date}
                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                    className="bg-transparent text-xs text-white/50 outline-none border-b border-white/10" />
                  <button type="button" onClick={() => saveTicker(t.id)} className="ml-auto text-xs text-white/50 hover:text-white px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors">Save</button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-sm text-white font-mono w-20 shrink-0">{t.symbol}</span>
                <span className="flex-1 text-xs text-muted truncate">{t.name ?? ''}</span>
                {bal && <span className="text-xs text-white/50 shrink-0">{fmt(typeof bal === 'object' ? bal.amount : bal)}</span>}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => {
                    const balObj = typeof bal === 'object' ? bal : (bal ? { amount: bal, date: '' } : null)
                    setEditId(t.id)
                    setEditForm({ symbol: t.symbol, name: t.name ?? '', balance: balObj ? String(balObj.amount) : '', date: balObj?.date || new Date().toISOString().slice(0, 10) })
                  }} className="text-white/30 hover:text-white p-1.5 transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => deleteTicker(t.id)} className="text-white/30 hover:text-red-400 p-1.5 transition-colors"><Trash2 size={13} /></button>
                </div>
              </>
            )}
          </div>
        )
      })}
      {adding && (
        <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <input autoFocus value={newSymbol}
              onChange={e => { setNewSymbol(e.target.value.toUpperCase()); setAddDupe(false) }}
              onKeyDown={e => { if (e.key === 'Enter') addTicker(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="AAPL"
              className="flex-1 bg-transparent text-sm text-white font-mono uppercase outline-none placeholder:text-white/20" />
            <button onClick={() => setAdding(false)} className="text-muted hover:text-white shrink-0"><X size={14} /></button>
          </div>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTicker(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Company name (optional)"
            className="bg-transparent text-xs text-muted outline-none border-b border-white/10 placeholder:text-white/20" />
          <input value={newBalance} type="number" step="0.01" min="0"
            onChange={e => setNewBalance(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTicker(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Initial balance (optional, e.g. 5000)"
            className="bg-transparent text-xs text-muted outline-none border-b border-white/10 placeholder:text-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30">Balance date</span>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="bg-transparent text-xs text-muted outline-none border-b border-white/10" />
          </div>
          {addDupe && <p className="text-xs text-amber-400">Already in your list.</p>}
        </div>
      )}
      <button
        onClick={() => { setAdding(true); setNewSymbol(''); setNewName(''); setNewBalance(''); setAddDupe(false) }}
        className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors mt-1 w-fit"
      >
        <Plus size={12} /> Add ticker
      </button>
    </div>
  )
}

const CREDIT_TYPES = new Set(['income'])
function computeBalance(card, transactions) {
  const delta = transactions
    .filter(t => t.card_id === card.id && !t.split_parent_id)
    .reduce((sum, t) => sum + (CREDIT_TYPES.has(t.type) ? t.amount : -t.amount), 0)
  return Number(card.initial_balance) + delta
}

// ── Main tab ──────────────────────────────────────────────────
export default function CardsTab() {
  const { user } = useAuth()
  const { cards, addCard, updateCard, deleteCard, setMainCard } = useCards()
  const { banks, addBank, updateBank, deleteBank } = useBanks()
  const [addingBank,      setAddingBank]      = useState(false)
  const [transactions,    setTransactions]    = useState([])

  useEffect(() => {
    if (!user?.id) return
    function loadTxs() {
      supabase.from('transactions').select('card_id, type, amount, split_parent_id').eq('user_id', user.id).eq('is_deleted', false)
        .then(({ data }) => { if (data) setTransactions(data) })
    }
    loadTxs()
    window.addEventListener('transaction-saved', loadTxs)
    return () => window.removeEventListener('transaction-saved', loadTxs)
  }, [user?.id])

  const balanceMap = Object.fromEntries(cards.map(c => [c.id, computeBalance(c, transactions)]))

  return (
    <div className="grid grid-cols-3 gap-8 h-full">

      {/* Col 1 — all card types */}
      <div className="flex flex-col gap-8 overflow-y-auto pr-1">
        {CARD_TYPES.map(({ value, label, Icon, canBeMain, singleOnly }, i) => (
          <div key={value}>
            <CardTypeSection
              type={value} label={label} Icon={Icon}
              cards={cards} banks={banks}
              canBeMain={canBeMain} singleOnly={singleOnly}
              balanceMap={balanceMap}
              onAdd={addCard} onUpdate={updateCard} onDelete={deleteCard} onSetMain={setMainCard}
            />
            {i < CARD_TYPES.length - 1 && <div className="border-t border-white/5 mt-6" />}
          </div>
        ))}
      </div>

      {/* Col 2 — banks */}
      <div className="flex flex-col gap-8 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-white">Banks</h3>
            <button
              onClick={() => setAddingBank(true)}
              className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {addingBank && (
            <AddBankForm
              onSave={data => { addBank(data); setAddingBank(false) }}
              onCancel={() => setAddingBank(false)}
            />
          )}

          {banks.map(bank => (
            <BankRow key={bank.id} bank={bank} onUpdate={updateBank} onDelete={deleteBank} />
          ))}

          {banks.length === 0 && !addingBank && (
            <p className="text-xs text-muted/50">No banks added yet.</p>
          )}
        </div>
      </div>

      {/* Col 3 — tickers */}
      <div className="flex flex-col gap-8 overflow-y-auto pr-1">

        {/* Tickers */}
        <div className="flex flex-col gap-2">
          <div className="mb-1">
            <h3 className="text-sm font-medium text-white">Tickers</h3>
            <p className="text-xs text-muted mt-0.5">Saved tickers for quick selection. Set an initial balance to include pre-tracked holdings in your portfolio.</p>
          </div>
          <TickersSection userId={user.id} />
        </div>

      </div>

    </div>
  )
}
