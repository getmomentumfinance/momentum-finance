import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowDown, TrendingUp, TrendingDown, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useUIPrefs } from '../../context/UIPrefContext'
import { useCards } from '../../hooks/useCards'
import { useSharedData } from '../../context/SharedDataContext'
import { showToast } from '../shared/Toast'

const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/25'
const sel = 'w-full appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-sm text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer'

// position = aggregated position (for ticker, name, livePrice)
// lot      = the specific buy transaction being sold (for exact cost basis)
export default function QuickSellModal({ position, lot, onClose }) {
  const { user }       = useAuth()
  const { fmt }        = usePreferences()
  const { prefs }      = useUIPrefs()
  const { cards }      = useCards()
  const { balanceTxs } = useSharedData()
  const rawLabels      = prefs['invest_labels'] ?? [{ name: 'Day Trade', color: '#60a5fa' }, { name: 'Swing Trade', color: '#a78bfa' }, { name: 'Long Term', color: '#34d399' }]
  const tradeLabels    = rawLabels.map(l => typeof l === 'string' ? { name: l, color: '#a78bfa' } : l)
  const tradingCards   = cards.filter(c => c.type === 'trading')

  const lotQty      = Number(lot.quantity ?? 0)
  const lotBuyPrice = Number(lot.price_per_unit ?? 0)
  const lotDate     = new Date(lot.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const [sellQty,   setSellQty]   = useState(String(lotQty))
  const [sellPrice, setSellPrice] = useState('')
  const [fee,       setFee]       = useState('')
  const [label,     setLabel]     = useState(lot.label ?? '')
  const [cardId,    setCardId]    = useState(lot.card_id ?? tradingCards[0]?.id ?? '')
  const [date,      setDate]      = useState(new Date().toISOString().slice(0, 10))
  const [saving,    setSaving]    = useState(false)

  const selectedCard  = cards.find(c => c.id === cardId)
  const CREDIT        = new Set(['income'])
  const brokerBalance = selectedCard ? (() => {
    const delta = balanceTxs
      .filter(t => t.card_id === cardId && !t.is_cash)
      .reduce((s, t) => {
        if (t.type === 'invest') return s + ((t.direction ?? 'buy') === 'sell' ? t.amount : -t.amount)
        return s + (CREDIT.has(t.type) ? t.amount : -t.amount)
      }, 0)
    return Number(selectedCard.initial_balance ?? 0) + delta
  })() : null

  const qty      = parseFloat(sellQty)                      || 0
  const price    = parseFloat(sellPrice.replace(',', '.'))  || 0
  const feeAmt   = parseFloat(fee)                          || 0
  const proceeds    = qty * price - feeAmt
  const costOfSold  = qty * lotBuyPrice          // exact lot buy price, not avg
  const realizedPnl = price > 0 ? proceeds - costOfSold : null
  const realizedPct = realizedPnl != null && costOfSold > 0 ? (realizedPnl / costOfSold) * 100 : null

  const fmtPct = n => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
  const gc     = n => n >= 0 ? 'var(--type-income)' : 'var(--type-expense)'

  async function handleSell() {
    if (!(qty > 0) || !(price > 0)) return
    setSaving(true)
    const { error } = await supabase.from('transactions').insert({
      user_id:        user.id,
      type:           'invest',
      direction:      'sell',
      ticker:         position.ticker,
      description:    position.ticker,
      quantity:       qty,
      price_per_unit: price,
      amount:         proceeds,
      card_id:        cardId || null,
      label:          label  || null,
      date,
      is_cash:        false,
      is_split_parent: false,
      category_id:    null,
      subcategory_id: null,
      receiver_id:    null,
      status:         'completed',
    })
    if (error) { console.error('sell error:', error.message); setSaving(false); return }
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    showToast('Sell logged')
    onClose()
  }

  return createPortal(
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">Sell {position.ticker}</h2>
            {position.name && <p className="text-[11px] text-muted mt-0.5">{position.name}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-4 p-5 scrollbar-thin">

          {/* Lot being sold */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[10px] text-muted uppercase tracking-widest">Lot being sold</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Bought</span>
              <span className="text-white/70">{lotDate}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Quantity</span>
              <span className="text-white/70 tabular-nums">{lotQty.toLocaleString('nl-BE', { maximumFractionDigits: 6 })} shares</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Buy price</span>
              <span className="text-white/70 tabular-nums font-medium">{fmt(lotBuyPrice)} / share</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-white/[0.05] pt-2 mt-0.5">
              <span className="text-muted">Total cost</span>
              <span className="text-white/60 tabular-nums">{fmt(lotQty * lotBuyPrice)}</span>
            </div>
            {position.livePrice != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Current price</span>
                <span className="tabular-nums" style={{ color: position.livePrice >= lotBuyPrice ? 'var(--type-income)' : 'var(--type-expense)' }}>
                  {fmt(position.livePrice)} / share
                </span>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <ArrowDown size={13} className="text-white/30" />
            </div>
          </div>

          {/* Sell inputs */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-widest">Qty to sell</label>
                <input value={sellQty} onChange={e => setSellQty(e.target.value.replace(/[^0-9.,]/g, ''))}
                  type="text" inputMode="decimal" placeholder="0" className={inp} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-widest">Sell price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                  <input value={sellPrice} onChange={e => setSellPrice(e.target.value.replace(/[^0-9.,]/g, ''))}
                    type="text" inputMode="decimal" placeholder="0,00" className={inp + ' pl-8'} autoFocus />
                </div>
              </div>
            </div>

            {/* Live P&L preview */}
            {price > 0 && qty > 0 && (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                style={{
                  background:  `color-mix(in srgb, ${gc(realizedPnl ?? 0)} 6%, transparent)`,
                  borderColor: `color-mix(in srgb, ${gc(realizedPnl ?? 0)} 20%, transparent)`,
                }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted uppercase tracking-widest">Realized P&L</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: gc(realizedPnl ?? 0) }}>
                    {realizedPnl != null ? `${realizedPnl >= 0 ? '+' : ''}${fmt(realizedPnl)}` : '—'}
                    {realizedPct != null && <span className="text-xs opacity-70 ml-1.5">({fmtPct(realizedPct)})</span>}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-muted uppercase tracking-widest">Proceeds</span>
                  <span className="text-sm tabular-nums text-white/70">{fmt(proceeds)}</span>
                </div>
                {realizedPnl != null && (realizedPnl >= 0
                  ? <TrendingUp size={18} style={{ color: gc(1) }} className="opacity-40 shrink-0" />
                  : <TrendingDown size={18} style={{ color: gc(-1) }} className="opacity-40 shrink-0" />)}
              </div>
            )}

            {/* Fee */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted uppercase tracking-widest flex items-center gap-2">
                Fee <span className="normal-case font-normal text-white/25">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
                <input value={fee} onChange={e => setFee(e.target.value.replace(/[^0-9.,]/g, ''))}
                  type="text" inputMode="decimal" placeholder="0,00" className={inp + ' pl-8'} />
              </div>
            </div>

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

            {/* Broker — proceeds destination */}
            {tradingCards.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-widest">Proceeds go to</label>
                {tradingCards.length === 1 ? (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                        <Building2 size={11} className="text-accent" />
                      </div>
                      <span className="text-sm text-white">{selectedCard?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {brokerBalance != null && proceeds > 0 && (
                        <span className="text-muted tabular-nums">{fmt(brokerBalance)} →</span>
                      )}
                      {brokerBalance != null && proceeds > 0 && (
                        <span className="tabular-nums font-medium" style={{ color: 'var(--type-income)' }}>
                          {fmt(brokerBalance + proceeds)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <select value={cardId} onChange={e => setCardId(e.target.value)} className={sel}>
                      <option value="">No account</option>
                      {tradingCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {selectedCard && brokerBalance != null && proceeds > 0 && (
                      <div className="flex items-center justify-between px-3 py-1 text-xs">
                        <span className="text-muted">Balance after sell</span>
                        <span className="tabular-nums font-medium" style={{ color: 'var(--type-income)' }}>
                          {fmt(brokerBalance)} → {fmt(brokerBalance + proceeds)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted uppercase tracking-widest">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-modal-cancel">Cancel</button>
            <button type="button" onClick={handleSell}
              disabled={saving || !(qty > 0) || !(price > 0)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                background: 'color-mix(in srgb, var(--type-expense) 15%, transparent)',
                color:       'var(--type-expense)',
                border:      '1px solid color-mix(in srgb, var(--type-expense) 35%, transparent)',
              }}>
              {saving ? 'Saving…' : `Sell ${qty > 0 ? qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 }) : ''} ${position.ticker}`}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
