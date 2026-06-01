import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Building2, ChevronDown, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useUIPrefs } from '../../context/UIPrefContext'
import { useCards } from '../../hooks/useCards'
import { useSharedData } from '../../context/SharedDataContext'
import { showToast } from '../shared/Toast'

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/25'
const sel = 'w-full appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-sm text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer'

// Simple ticker combobox
function TickerInput({ value, onChange, tickers, onAddTicker, user }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const q = value.trim().toUpperCase()
  const filtered = q
    ? tickers.filter(t => t.symbol.includes(q) || (t.name ?? '').toUpperCase().includes(q)).slice(0, 8)
    : tickers.slice(0, 8)
  const exactMatch = tickers.some(t => t.symbol === q)
  const showAdd = q.length > 0 && !exactMatch

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="AAPL, BTC-USD, VWCE.AS…"
        className={inp + ' uppercase'}
        autoComplete="off"
        autoFocus
      />
      {open && (filtered.length > 0 || showAdd) && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-popup border border-white/15 rounded-xl overflow-hidden z-30 shadow-xl max-h-52 overflow-y-auto">
          {filtered.map(t => (
            <button key={t.id} type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(t.symbol); setOpen(false) }}
              className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center justify-between gap-3">
              <span className="text-sm text-white font-mono">{t.symbol}</span>
              {t.name && <span className="text-xs text-white/35 truncate">{t.name}</span>}
            </button>
          ))}
          {showAdd && (
            <button type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onAddTicker(q); setOpen(false) }}
              className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-2 border-t border-white/[0.06]">
              <Plus size={11} className="text-white/40 shrink-0" />
              <span className="text-xs text-white/40">Add <span className="font-mono text-white/60">{q}</span> to list</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuickBuyModal({ onClose, defaultCardId = '' }) {
  const { user }    = useAuth()
  const { fmt }     = usePreferences()
  const { prefs }   = useUIPrefs()
  const { cards }   = useCards()
  const { balanceTxs } = useSharedData()

  const rawLabels   = prefs['invest_labels'] ?? [{ name: 'Day Trade', color: '#60a5fa' }, { name: 'Swing Trade', color: '#a78bfa' }, { name: 'Long Term', color: '#34d399' }]
  const tradeLabels = rawLabels.map(l => typeof l === 'string' ? { name: l, color: '#a78bfa' } : l)
  const tradingCards = cards.filter(c => c.type === 'trading')

  const [cardId,       setCardId]       = useState(defaultCardId || tradingCards[0]?.id || '')
  const [ticker,       setTicker]       = useState('')
  const [quantity,     setQuantity]     = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [fee,          setFee]          = useState('')
  const [label,        setLabel]        = useState('')
  const [stopLoss,     setStopLoss]     = useState('')
  const [targetPrice,  setTargetPrice]  = useState('')
  const [date,         setDate]         = useState(new Date().toISOString().slice(0, 10))
  const [tickers,      setTickers]      = useState([])
  const [saving,       setSaving]       = useState(false)
  const [showOptional, setShowOptional] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('tickers').select('id, symbol, name').eq('user_id', user.id).order('symbol')
      .then(({ data }) => { if (data) setTickers(data) })
  }, [user?.id])

  async function handleAddTicker(symbol) {
    const { data } = await supabase.from('tickers').insert({ user_id: user.id, symbol }).select().single()
    if (data) setTickers(prev => [...prev, data].sort((a, b) => a.symbol.localeCompare(b.symbol)))
  }

  // Broker balance
  const selectedCard = cards.find(c => c.id === cardId)
  const brokerBalance = selectedCard ? (() => {
    const CREDIT = new Set(['income'])
    const delta = balanceTxs
      .filter(t => t.card_id === cardId && !t.is_cash)
      .reduce((s, t) => {
        if (t.type === 'invest') return s + ((t.direction ?? 'buy') === 'sell' ? t.amount : -t.amount)
        return s + (CREDIT.has(t.type) ? t.amount : -t.amount)
      }, 0)
    return Number(selectedCard.initial_balance ?? 0) + delta
  })() : null

  const qty      = parseFloat(quantity.replace(',', '.'))      || 0
  const ppu      = parseFloat(pricePerUnit.replace(',', '.'))  || 0
  const feeAmt   = parseFloat(fee.replace(',', '.'))           || 0
  const totalCost = qty * ppu + feeAmt
  const remaining = brokerBalance != null && totalCost > 0 ? brokerBalance - totalCost : null
  const canAfford = remaining == null || remaining >= 0

  async function handleBuy() {
    if (!(qty > 0) || !(ppu > 0) || !ticker.trim()) return
    setSaving(true)
    const sym = ticker.trim().toUpperCase()
    const { error } = await supabase.from('transactions').insert({
      user_id:        user.id,
      type:           'invest',
      direction:      'buy',
      ticker:         sym,
      description:    sym,
      quantity:       qty,
      price_per_unit: ppu,
      amount:         totalCost,
      card_id:        cardId || null,
      label:          label  || null,
      stop_loss:      parseFloat(stopLoss.replace(',', '.'))    || null,
      target_price:   parseFloat(targetPrice.replace(',', '.')) || null,
      date,
      is_cash:        false,
      is_split_parent: false,
      category_id:    null,
      subcategory_id: null,
      receiver_id:    null,
      status:         'completed',
    })
    if (error) { console.error('buy error:', error.message); setSaving(false); return }
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    showToast('Buy logged')
    onClose()
  }

  return createPortal(
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl flex flex-col">

        {/* Broker header */}
        <div className="px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Buy</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          {tradingCards.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-muted">
              <Building2 size={13} />
              No broker account — add a Trading card in settings to track balance
            </div>
          ) : tradingCards.length === 1 ? (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                  <Building2 size={12} className="text-accent" />
                </div>
                <span className="text-sm font-medium text-white">{selectedCard?.name ?? tradingCards[0].name}</span>
              </div>
              {brokerBalance != null && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted uppercase tracking-widest">Available</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: brokerBalance >= 0 ? 'var(--type-income)' : 'var(--type-expense)' }}>
                    {fmt(brokerBalance)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <select value={cardId} onChange={e => setCardId(e.target.value)} className={sel}>
                <option value="">No account</option>
                {tradingCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {selectedCard && brokerBalance != null && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs">
                  <span className="text-muted">Available in {selectedCard.name}</span>
                  <span className="font-semibold tabular-nums" style={{ color: brokerBalance >= 0 ? 'var(--type-income)' : 'var(--type-expense)' }}>
                    {fmt(brokerBalance)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex flex-col gap-4 p-5 scrollbar-thin">

          {/* Ticker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted uppercase tracking-widest">Ticker</label>
            <TickerInput value={ticker} onChange={setTicker} tickers={tickers} onAddTicker={handleAddTicker} user={user} />
          </div>

          {/* Qty + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted uppercase tracking-widest">Quantity</label>
              <input value={quantity} onChange={e => setQuantity(e.target.value.replace(/[^0-9.,]/g, ''))}
                type="text" inputMode="decimal" placeholder="0" className={inp} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted uppercase tracking-widest">Price per share</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                <input value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value.replace(/[^0-9.,]/g, ''))}
                  type="text" inputMode="decimal" placeholder="0,00" className={inp + ' pl-8'} />
              </div>
            </div>
          </div>

          {/* Cost preview */}
          {qty > 0 && ppu > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
              style={{
                background: canAfford ? 'rgba(255,255,255,0.03)' : 'color-mix(in srgb, var(--type-expense) 6%, transparent)',
                borderColor: canAfford ? 'rgba(255,255,255,0.08)' : 'color-mix(in srgb, var(--type-expense) 25%, transparent)',
              }}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted uppercase tracking-widest">Total cost</span>
                <span className="text-sm font-semibold tabular-nums text-white">{fmt(totalCost)}</span>
              </div>
              {remaining != null && (
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-muted uppercase tracking-widest">After purchase</span>
                  <span className="text-sm tabular-nums font-medium"
                    style={{ color: canAfford ? 'rgba(255,255,255,0.5)' : 'var(--type-expense)' }}>
                    {fmt(remaining)}
                    {!canAfford && <span className="text-[10px] ml-1 opacity-70">insufficient</span>}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Label chips */}
          {tradeLabels.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted uppercase tracking-widest flex items-center gap-2">
                Label <span className="normal-case font-normal text-white/25">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tradeLabels.map(({ name, color }) => (
                  <button key={name} type="button" onClick={() => setLabel(label === name ? '' : name)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: label === name ? `color-mix(in srgb, ${color} 18%, transparent)` : 'rgba(255,255,255,0.05)',
                      color:      label === name ? color : 'rgba(255,255,255,0.45)',
                      border:     `1px solid ${label === name ? `color-mix(in srgb, ${color} 40%, transparent)` : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional fields toggle */}
          <button type="button" onClick={() => setShowOptional(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-muted hover:text-white/60 transition-colors w-fit">
            <ChevronDown size={12} className={`transition-transform ${showOptional ? 'rotate-180' : ''}`} />
            {showOptional ? 'Hide' : 'Show'} date & fee
          </button>

          {showOptional && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted uppercase tracking-widest">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted uppercase tracking-widest">Fee</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                    <input value={fee} onChange={e => setFee(e.target.value.replace(/[^0-9.,]/g, ''))}
                      type="text" inputMode="decimal" placeholder="0,00" className={inp + ' pl-8'} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted uppercase tracking-widest">Stop Loss</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                    <input value={stopLoss} onChange={e => setStopLoss(e.target.value.replace(/[^0-9.,]/g, ''))}
                      type="text" inputMode="decimal" placeholder="0,00" className={inp + ' pl-8'} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted uppercase tracking-widest">Target</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                    <input value={targetPrice} onChange={e => setTargetPrice(e.target.value.replace(/[^0-9.,]/g, ''))}
                      type="text" inputMode="decimal" placeholder="0,00" className={inp + ' pl-8'} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-modal-cancel">Cancel</button>
            <button type="button" onClick={handleBuy}
              disabled={saving || !(qty > 0) || !(ppu > 0) || !ticker.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                color: 'var(--color-accent)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)',
              }}>
              {saving ? 'Saving…' : ticker.trim()
                ? `Buy ${qty > 0 ? qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 }) + ' ' : ''}${ticker.trim().toUpperCase()}${selectedCard ? ` · ${selectedCard.name}` : ''}`
                : 'Buy'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
