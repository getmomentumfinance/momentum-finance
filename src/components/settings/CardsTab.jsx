import { useState, useEffect } from 'react'
import { usePreferences } from '../../context/UserPreferencesContext'
import {
  CreditCard, PiggyBank, Ticket, Banknote, Plus, Pencil, Trash2, Wallet,
} from 'lucide-react'
import { CATEGORY_ICONS, ICONS_MAP } from '../shared/CategoryPill'
import { useCards } from '../../hooks/useCards'
import { SkeletonCard } from '../shared/Skeleton'
import { useBanks } from '../../hooks/useBanks'
import { useHouseholdMembers } from '../../hooks/useHouseholdMembers'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { computeCardBalance } from '../../utils/cardBalance'
import { OwnerBadges } from '../shared/OwnerBadges'
import ColorPickerPopup, { useColorPicker } from '../shared/ColorPickerPopup'

const MEMBER_PALETTE = ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#f87171']

function resolveIcon(id) { return ICONS_MAP[id] ?? CreditCard }

const CARD_TYPES = [
  { value: 'debit',   label: 'Debit',        Icon: CreditCard,  canBeMain: true  },
  { value: 'credit',  label: 'Credit',       Icon: Banknote,    canBeMain: true  },
  { value: 'savings', label: 'Savings',      Icon: PiggyBank,   canBeMain: true  },
  { value: 'voucher', label: 'Voucher',      Icon: Ticket,      canBeMain: false },
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
function CardForm({ type, banks, members, initial, onSave, onCancel }) {
  const isCash = type === 'cash'
  const isSavings = type === 'savings'
  const [name,       setName]       = useState(initial?.name            ?? '')
  const [bankId,     setBankId]     = useState(initial?.bank_id         ?? '')
  const [icon,       setIcon]       = useState(initial?.icon            ?? 'credit-card')
  const [balance,    setBalance]    = useState(initial?.initial_balance ?? '')
  const [cardNumber, setCardNumber] = useState(initial?.card_number     ?? '')
  const [isBuffer,   setIsBuffer]   = useState(initial?.is_buffer       ?? false)
  const [ownerIds,   setOwnerIds]   = useState(initial?.owner_ids       ?? [])

  function toggleOwner(id) {
    setOwnerIds(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id])
  }

  function handleSubmit(e) {
    e?.preventDefault()
    const resolvedName = isCash ? 'Cash Wallet' : name.trim()
    if (!resolvedName) return
    onSave({ name: resolvedName, bank_id: bankId || null, icon, initial_balance: parseFloat(balance) || 0, card_number: cardNumber.trim() || null, owner_ids: ownerIds, ...(isSavings && { is_buffer: isBuffer }) })
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

      {!isCash && (
        <input
          value={cardNumber}
          onChange={e => {
            const s = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
            if (s.startsWith('BE')) {
              setCardNumber(s.slice(0, 16).replace(/(.{4})/g, '$1 ').trim())
            } else if (s.startsWith('DE')) {
              setCardNumber(s.slice(0, 22).replace(/(.{4})/g, '$1 ').trim())
            } else if (s.length > 16) {
              // Belgian credit card 5-4-4-4 (17 digits)
              const t = s.slice(0, 17)
              setCardNumber([t.slice(0,5), t.slice(5,9), t.slice(9,13), t.slice(13,17)].filter(Boolean).join(' '))
            } else {
              setCardNumber(s.replace(/(.{4})/g, '$1 ').trim())
            }
          }}
          placeholder="BE/DE IBAN or card number"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-white/30 font-mono placeholder:font-sans placeholder:text-white/25"
        />
      )}

      <IconPicker value={icon} onChange={setIcon} />

      {members.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted uppercase tracking-widest">Owner</label>
          <div className="flex flex-wrap gap-1.5">
            {members.map(m => {
              const active = ownerIds.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleOwner(m.id)}
                  className="px-2.5 py-1 rounded-full border text-xs font-medium transition-all"
                  style={{
                    borderColor: active ? m.color : 'rgba(255,255,255,0.08)',
                    background:  active ? `color-mix(in srgb, ${m.color} 15%, transparent)` : 'rgba(255,255,255,0.02)',
                    color:       active ? m.color : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {m.name}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-white/30">Select both for a joint account.</p>
        </div>
      )}

      {isSavings && (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => setIsBuffer(v => !v)}
            className="w-8 h-4 rounded-full relative transition-colors flex-shrink-0"
            style={{ background: isBuffer ? 'var(--color-progress-bar)' : 'rgba(255,255,255,0.12)' }}
          >
            <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all"
              style={{ left: isBuffer ? '18px' : '2px' }} />
          </div>
          <div>
            <p className="text-sm text-white/80">Buffer account</p>
            <p className="text-[11px] text-white/35 leading-tight">Transfers in/out won't count toward savings stats</p>
          </div>
        </label>
      )}

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
function CardRow({ card, banks, members, canBeMain, balance, onUpdate, onDelete, onSetMain }) {
  const [editing, setEditing] = useState(false)
  const { fmt } = usePreferences()
  const CardIcon = resolveIcon(card.icon)
  const bank     = banks.find(b => b.id === card.bank_id)

  if (editing) {
    return (
      <CardForm
        type={card.type}
        banks={banks}
        members={members}
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
          <OwnerBadges ownerIds={card.owner_ids} members={members} size={14} />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {bank && <BankAvatar bank={bank} size={14} />}
          {bank && <span className="text-xs text-muted">{bank.name} ·</span>}
          <span className="text-xs text-muted">{fmt(Number(balance ?? card.initial_balance))}</span>
          {card.card_number && (
            <span className="text-xs text-muted/60 font-mono">· {card.card_number.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()}</span>
          )}
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
function CardTypeSection({ type, label, Icon, cards, banks, members, canBeMain, singleOnly, balanceMap, onAdd, onUpdate, onDelete, onSetMain }) {
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
          members={members}
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
          members={members}
          onSave={data => { onAdd({ ...data, type }); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}

// ── Cash section (piggybank style) ────────────────────────────
function CashSection({ cards, banks, members, balanceMap, onAdd, onUpdate, onDelete }) {
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
          members={members}
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
          members={members}
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

// ── Household member row ───────────────────────────────────────
function MemberRow({ member, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(member.name)
  const picker = useColorPicker()

  function handleSave() {
    if (!name.trim()) return
    onUpdate(member.id, { name: name.trim() })
    setEditing(false)
  }

  function handleColor(c) {
    onUpdate(member.id, { color: c })
    picker.setOpen(false)
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 group">
      <button
        ref={picker.btnRef}
        type="button"
        onClick={() => picker.toggle()}
        className="w-6 h-6 rounded-full border border-white/20 shrink-0 hover:border-white/50 transition-colors"
        style={{ background: member.color }}
      />
      {picker.open && (
        <ColorPickerPopup popupRef={picker.popupRef} pos={picker.pos} selected={member.color} onSelect={handleColor} />
      )}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            onBlur={handleSave}
            autoFocus
            className="w-full bg-transparent text-sm text-white outline-none border-b border-white/20"
          />
        ) : (
          <span className="text-sm text-white">{member.name}</span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
          <Pencil size={12} />
        </button>
        <button onClick={() => onDelete(member.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Add household member form ───────────────────────────────────
function AddMemberForm({ nextColor, onSave, onCancel }) {
  const [name, setName] = useState('')

  function handleKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') onCancel()
  }
  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), color: nextColor })
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Name"
        autoFocus
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-white transition-colors px-3 py-1.5">Cancel</button>
        <button type="button" onClick={handleSave} className="text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 transition-colors">Add</button>
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────
export default function CardsTab() {
  const { user } = useAuth()
  const { cards, loading: cardsLoading, addCard, updateCard, deleteCard, setMainCard } = useCards()
  const { banks, addBank, updateBank, deleteBank } = useBanks()
  const { members, addMember, updateMember, deleteMember } = useHouseholdMembers()
  const [addingBank,      setAddingBank]      = useState(false)
  const [addingMember,    setAddingMember]    = useState(false)
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

  const balanceMap = Object.fromEntries(cards.map(c => [c.id, computeCardBalance(c, transactions)]))

  return (
    <div className="grid grid-cols-3 gap-8 h-full">

      {/* Col 1 — all card types */}
      <div className="flex flex-col gap-8 overflow-y-auto pr-1">
        {cardsLoading ? (
          <div className="flex flex-col gap-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : CARD_TYPES.map(({ value, label, Icon, canBeMain, singleOnly }, i) => (
          <div key={value}>
            <CardTypeSection
              type={value} label={label} Icon={Icon}
              cards={cards} banks={banks} members={members}
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

      {/* Col 3 — people */}
      <div className="flex flex-col gap-8 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
          <div className="mb-1">
            <h3 className="text-sm font-medium text-white">People</h3>
            <p className="text-xs text-muted mt-0.5">Add household members to tag accounts as theirs, yours, or joint.</p>
          </div>
          <div className="flex items-center justify-end mb-1">
            <button
              onClick={() => setAddingMember(true)}
              className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {addingMember && (
            <AddMemberForm
              nextColor={MEMBER_PALETTE[members.length % MEMBER_PALETTE.length]}
              onSave={data => { addMember(data); setAddingMember(false) }}
              onCancel={() => setAddingMember(false)}
            />
          )}

          {members.map(member => (
            <MemberRow key={member.id} member={member} onUpdate={updateMember} onDelete={deleteMember} />
          ))}

          {members.length === 0 && !addingMember && (
            <p className="text-xs text-muted/50">No people added yet.</p>
          )}
        </div>
      </div>

    </div>
  )
}
