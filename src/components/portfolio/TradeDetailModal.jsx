import { createPortal } from 'react-dom'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { usePreferences } from '../../context/UserPreferencesContext'

const fmtPct = n => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
const gc     = n => n >= 0 ? 'var(--type-income)' : 'var(--type-expense)'

function Row({ label, value, color, mono = true }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs font-medium ${mono ? 'tabular-nums' : ''}`} style={color ? { color } : {}}>
        {value}
      </span>
    </div>
  )
}

export default function TradeDetailModal({ tx, realizedPnl, livePrice, cardName, labelColor, onClose }) {
  const { fmt } = usePreferences()

  const dir      = tx.direction ?? 'buy'
  const isSell   = dir === 'sell'
  const qty      = Number(tx.quantity ?? 0)
  const ppu      = Number(tx.price_per_unit ?? 0)
  const total    = qty * ppu
  const feeAmt   = isSell ? total - Number(tx.amount) : Number(tx.amount) - total
  const fee      = Math.max(0, feeAmt)
  const proceeds = isSell ? Number(tx.amount) : null
  const dateStr  = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Unrealized P&L for buys (if live price available)
  const currentVal    = livePrice != null ? livePrice * qty : null
  const unrealizedPnl = currentVal != null ? currentVal - total : null
  const unrealizedPct = unrealizedPnl != null && total > 0 ? (unrealizedPnl / total) * 100 : null

  // Realized P&L for sells
  const realPct = realizedPnl != null && total > 0 ? (realizedPnl / total) * 100 : null

  return createPortal(
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-wider text-white">{tx.ticker?.toUpperCase()}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-widest`}
              style={{
                background: isSell
                  ? 'color-mix(in srgb, var(--type-expense) 18%, transparent)'
                  : 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                color: isSell ? 'var(--type-expense)' : 'var(--color-accent)',
              }}>
              {isSell ? 'SELL' : 'BUY'}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-1">

          {/* Core details */}
          <div className="flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-1 mb-3">
            <Row label="Date"           value={dateStr} mono={false} />
            <Row label="Quantity"       value={`${qty.toLocaleString('nl-BE', { maximumFractionDigits: 6 })} shares`} />
            <Row label={isSell ? 'Sell price' : 'Buy price'} value={`${fmt(ppu)} / share`} />
            <Row label={isSell ? 'Gross proceeds' : 'Total cost'} value={fmt(total)} />
            <Row label="Fee" value={fee > 0.005 ? fmt(fee) : '—'} color="rgba(255,255,255,0.4)" />
            {proceeds != null && fee > 0.005 && (
              <Row label="Net proceeds" value={fmt(proceeds)} color="var(--type-income)" />
            )}
            {tx.label && (
              <Row label="Label" value={tx.label} color={labelColor} mono={false} />
            )}
            {cardName && (
              <Row label="Account" value={cardName} mono={false} />
            )}
          </div>

          {/* P&L section */}
          {isSell && realizedPnl != null && (
            <div className="flex items-center justify-between px-3 py-3 rounded-xl border"
              style={{
                background:  `color-mix(in srgb, ${gc(realizedPnl)} 6%, transparent)`,
                borderColor: `color-mix(in srgb, ${gc(realizedPnl)} 20%, transparent)`,
              }}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted uppercase tracking-widest">Realized P&L</span>
                <span className="text-base font-bold tabular-nums" style={{ color: gc(realizedPnl) }}>
                  {realizedPnl >= 0 ? '+' : ''}{fmt(realizedPnl)}
                </span>
                {realPct != null && (
                  <span className="text-xs tabular-nums" style={{ color: gc(realizedPnl) }}>{fmtPct(realPct)}</span>
                )}
              </div>
              {realizedPnl >= 0
                ? <TrendingUp size={22} style={{ color: gc(1) }} className="opacity-30" />
                : <TrendingDown size={22} style={{ color: gc(-1) }} className="opacity-30" />}
            </div>
          )}

          {!isSell && livePrice != null && unrealizedPnl != null && (
            <div className="flex items-center justify-between px-3 py-3 rounded-xl border"
              style={{
                background:  `color-mix(in srgb, ${gc(unrealizedPnl)} 6%, transparent)`,
                borderColor: `color-mix(in srgb, ${gc(unrealizedPnl)} 20%, transparent)`,
              }}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted uppercase tracking-widest">Unrealized P&L</span>
                <span className="text-base font-bold tabular-nums" style={{ color: gc(unrealizedPnl) }}>
                  {unrealizedPnl >= 0 ? '+' : ''}{fmt(unrealizedPnl)}
                </span>
                {unrealizedPct != null && (
                  <span className="text-xs tabular-nums" style={{ color: gc(unrealizedPnl) }}>{fmtPct(unrealizedPct)}</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] text-muted">Current price</span>
                <span className="text-sm tabular-nums text-white/60">{fmt(livePrice)}</span>
                <span className="text-xs tabular-nums text-white/40">{fmt(currentVal)} total</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  )
}
