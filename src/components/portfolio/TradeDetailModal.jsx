import { createPortal } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { X, TrendingUp, TrendingDown, ImagePlus, Trash2, MessageSquare, Send, Pencil, Check } from 'lucide-react'
import { usePreferences } from '../../context/UserPreferencesContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const BUCKET = 'trade-images'

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

function ImageThumb({ path, onClick }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    supabase.storage.from(BUCKET).createSignedUrl(path, 300).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl)
    })
  }, [path])
  return url
    ? <img src={url} alt="" className="w-full h-full object-cover cursor-pointer" onClick={onClick} />
    : <div className="w-full h-full bg-white/[0.04] animate-pulse" />
}

export default function TradeDetailModal({ tx, realizedPnl, livePrice, cardName, labelColor, onClose }) {
  const { fmt } = usePreferences()
  const { user } = useAuth()

  const dir      = tx.direction ?? 'buy'
  const isSell   = dir === 'sell'
  const qty      = Number(tx.quantity ?? 0)
  const ppu      = Number(tx.price_per_unit ?? 0)
  const total    = qty * ppu
  const feeAmt   = isSell ? total - Number(tx.amount) : Number(tx.amount) - total
  const fee      = Math.max(0, feeAmt)
  const proceeds = isSell ? Number(tx.amount) : null
  const dateStr  = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const currentVal    = livePrice != null ? livePrice * qty : null
  const unrealizedPnl = currentVal != null ? currentVal - total : null
  const unrealizedPct = unrealizedPnl != null && total > 0 ? (unrealizedPnl / total) * 100 : null
  const realPct       = realizedPnl != null && total > 0 ? (realizedPnl / total) * 100 : null

  // ── Images ──────────────────────────────────────────────────────────────────
  const [images,    setImages]    = useState([])
  const [uploading, setUploading] = useState(false)
  const [imgError,  setImgError]  = useState(null)
  const fileRef = useRef(null)

  // ── Comments ─────────────────────────────────────────────────────────────────
  const [comments,      setComments]      = useState([])
  const [newComment,    setNewComment]    = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [editingId,     setEditingId]     = useState(null)
  const [editingText,   setEditingText]   = useState('')

  useEffect(() => {
    loadImages()
    loadComments()
  }, [tx.id])

  async function loadImages() {
    const { data } = await supabase
      .from('trade_images')
      .select('*')
      .eq('transaction_id', tx.id)
      .order('created_at', { ascending: true })
    if (data) setImages(data)
  }

  async function loadComments() {
    const { data } = await supabase
      .from('trade_comments')
      .select('*')
      .eq('transaction_id', tx.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  async function uploadImages(files) {
    if (!user?.id) return
    setUploading(true)
    setImgError(null)
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setImgError(`"${file.name}" exceeds the 5 MB limit`)
        continue
      }
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/${tx.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file)
      if (upErr) { setImgError(upErr.message); continue }
      await supabase.from('trade_images').insert({
        user_id: user.id,
        transaction_id: tx.id,
        storage_path: path,
        file_name: file.name,
      })
    }
    await loadImages()
    setUploading(false)
  }

  async function deleteImage(img) {
    await supabase.storage.from(BUCKET).remove([img.storage_path])
    await supabase.from('trade_images').delete().eq('id', img.id)
    setImages(prev => prev.filter(i => i.id !== img.id))
  }

  async function openImage(img) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(img.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function addComment() {
    if (!newComment.trim() || !user?.id) return
    setSavingComment(true)
    await supabase.from('trade_comments').insert({
      user_id: user.id,
      transaction_id: tx.id,
      content: newComment.trim(),
    })
    setNewComment('')
    await loadComments()
    setSavingComment(false)
  }

  async function saveEdit(id) {
    if (!editingText.trim()) return
    await supabase.from('trade_comments')
      .update({ content: editingText.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
    setEditingId(null)
    await loadComments()
  }

  async function deleteComment(id) {
    await supabase.from('trade_comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-popup border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-wider text-white">{tx.ticker?.toUpperCase()}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-widest"
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

        <div className="px-5 pb-5 flex flex-col gap-3 overflow-y-auto">

          {/* Core details */}
          <div className="flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-1">
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
            {tx.stop_loss != null && (
              <Row label="Stop Loss" value={fmt(tx.stop_loss)} color="var(--type-expense)" />
            )}
            {tx.target_price != null && (
              <Row label="Target" value={fmt(tx.target_price)} color="var(--type-income)" />
            )}
          </div>

          {/* P&L */}
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

          {/* ── Images ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                <ImagePlus size={11} /> Images {images.length > 0 && `· ${images.length}`}
              </span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-[10px] px-2 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-colors disabled:opacity-40">
                {uploading ? 'Uploading…' : '+ Add'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { if (e.target.files?.length) uploadImages([...e.target.files]); e.target.value = '' }}
              />
            </div>

            {imgError && (
              <p className="text-[10px] text-red-400 px-1">{imgError}</p>
            )}

            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map(img => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                    <ImageThumb path={img.storage_path} onClick={() => openImage(img)} />
                    <button
                      type="button"
                      onClick={() => deleteImage(img)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-white/10 text-white/20 hover:border-white/20 hover:text-white/35 transition-colors">
                <ImagePlus size={18} />
                <span className="text-[10px]">Click to upload · 5 MB max per image</span>
              </button>
            )}
          </div>

          {/* ── Comments / Notes ── */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted flex items-center gap-1.5">
              <MessageSquare size={11} /> Notes {comments.length > 0 && `· ${comments.length}`}
            </span>

            {comments.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {comments.map(c => (
                  <div key={c.id} className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 group">
                    {editingId === c.id ? (
                      <div className="flex gap-2 items-start">
                        <textarea
                          className="flex-1 bg-transparent text-xs text-white/80 resize-none outline-none leading-relaxed"
                          rows={2}
                          value={editingText}
                          autoFocus
                          onChange={e => setEditingText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(c.id) }
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                        <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                          <button type="button" onClick={() => saveEdit(c.id)}
                            className="text-accent hover:opacity-70 transition-opacity">
                            <Check size={12} />
                          </button>
                          <button type="button" onClick={() => setEditingId(null)}
                            className="text-white/30 hover:text-white/60 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-white/75 leading-relaxed flex-1 whitespace-pre-wrap">{c.content}</p>
                        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button"
                            onClick={() => { setEditingId(c.id); setEditingText(c.content) }}
                            className="text-white/30 hover:text-white/60 transition-colors">
                            <Pencil size={10} />
                          </button>
                          <button type="button"
                            onClick={() => deleteComment(c.id)}
                            className="text-white/30 hover:text-red-400 transition-colors">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-white/25 mt-1.5">
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {c.updated_at > c.created_at && ' · edited'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <textarea
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/80 placeholder-white/25 resize-none outline-none focus:border-white/20 transition-colors leading-relaxed"
                rows={2}
                placeholder="Add a note…"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() }
                }}
              />
              <button
                type="button"
                onClick={addComment}
                disabled={!newComment.trim() || savingComment}
                className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-colors disabled:opacity-30 shrink-0 mb-px">
                <Send size={13} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
