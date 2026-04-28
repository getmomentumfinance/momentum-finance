import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Heart, Plus, Undo2, ExternalLink, ShoppingCart, X } from 'lucide-react'
import { useCollapsed } from '../../hooks/useCollapsed'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSharedData } from '../../context/SharedDataContext'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import { useImportance } from '../../hooks/useImportance'
import { useCards } from '../../hooks/useCards'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { CATEGORY_ICONS } from '../shared/CategoryPill'
import AddWishlistModal from './AddWishlistModal'
import { usePreferences } from '../../context/UserPreferencesContext'

// Derive importance key from item: subcategory first, then main cat, then null
function getImportanceKey(item, catMap) {
  if (item.subcategory_id && catMap[item.subcategory_id]?.importance)
    return catMap[item.subcategory_id].importance
  if (item.category_id && catMap[item.category_id]?.importance)
    return catMap[item.category_id].importance
  return null
}

function ImportanceDots({ impKey, importance }) {
  const imp = importance.find(i => i.value === impKey)
  if (!imp) return null
  return (
    <div className="flex gap-[3px] shrink-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: i < imp.dots ? imp.color : imp.color + '30' }}
        />
      ))}
    </div>
  )
}

function ItemIcon({ item }) {
  const IconComp = item.icon ? CATEGORY_ICONS.find(i => i.id === item.icon)?.Icon : null
  if (IconComp) return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <IconComp size={14} className="text-white/60" />
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">
      {item.name[0]?.toUpperCase()}
    </div>
  )
}

export default function Wishlist({ currentDate = new Date() }) {
  const { user } = useAuth()
  const { categoryMap: catMap } = useSharedData()
  const { cards } = useCards()
  const c = useCardCustomization('Wishlist')
  const { importance } = useImportance()

  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [toggling,   setToggling]   = useState(new Set())
  const [skipFlash,  setSkipFlash]  = useState(null)
  const [showAll,    setShowAll]    = useState(false)
  const [collapsed, setCollapsed] = useCollapsed('Wishlist')
  const [buyItem,   setBuyItem]   = useState(null)
  const [buyCardId, setBuyCardId] = useState(null)
  const [buyIsCash, setBuyIsCash] = useState(false)

  const availableCards = (cards ?? []).filter(c => c.type !== 'savings' && c.type !== 'cash')

  useEffect(() => { if (user?.id) load() }, [user?.id])

  async function load() {
    setLoading(true)
    const { data: wishData } = await supabase.from('wishlist').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
    setItems(wishData ?? [])
    setLoading(false)
  }

  async function toggleCancel(item) {
    if (toggling.has(item.id)) return
    setToggling(s => new Set(s).add(item.id))
    const cancelling = item.status === 'active'
    await supabase.from('wishlist').update({ status: cancelling ? 'cancelled' : 'active' }).eq('id', item.id)
    if (cancelling && item.amount) {
      setSkipFlash({ id: item.id, amount: item.amount })
      setTimeout(() => setSkipFlash(null), 2800)
    }
    setToggling(s => { const n = new Set(s); n.delete(item.id); return n })
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    load()
  }

  function openBuyPopup(item) {
    setBuyItem(item)
    setBuyCardId(null)
    setBuyIsCash(false)
  }

  async function confirmBuy() {
    if (!buyItem) return
    const item = buyItem
    setBuyItem(null)

    if (!item.amount) {
      setEditItem(item)
      setShowModal(true)
      return
    }

    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'bought' } : i))
    const _d = new Date()
    const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`
    const { data: tx } = await supabase.from('transactions').insert({
      user_id:         user.id,
      type:            'expense',
      date:            today,
      amount:          item.amount,
      description:     item.description || item.name,
      category_id:     item.category_id    || null,
      subcategory_id:  item.subcategory_id || null,
      receiver_id:     item.receiver_id    || null,
      card_id:         buyIsCash ? null : (buyCardId || null),
      is_cash:         buyIsCash,
      is_deleted:      false,
      is_split_parent: false,
      status:          'completed',
    }).select('id').single()
    await supabase.from('wishlist').update({ status: 'bought', transaction_id: tx?.id ?? null, bought_at: today }).eq('id', item.id)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    load()
  }

  async function handleUndoBought(item) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'active', transaction_id: null } : i))
    if (item.transaction_id) {
      await supabase.from('transactions').update({ is_deleted: true }).eq('id', item.transaction_id)
    }
    await supabase.from('wishlist').update({ status: 'active', transaction_id: null, bought_at: null }).eq('id', item.id)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
  }

  // Sort by importance desc (necessary=4 first, no importance last)
  const impOrder = { necessary: 4, needs: 3, wants: 2, luxury: 1 }
  const sorted = (list) => [...list].sort((a, b) => {
    const ka = impOrder[getImportanceKey(a, catMap)] ?? 0
    const kb = impOrder[getImportanceKey(b, catMap)] ?? 0
    return kb - ka
  })

  const activeItems    = sorted(items.filter(i => i.status === 'active'))
  const cancelledItems = items.filter(i => i.status === 'cancelled')
  const boughtItems    = items.filter(i => {
    if (i.status !== 'bought') return false
    if (!i.bought_at) return true
    const d = new Date(i.bought_at + 'T00:00:00')
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()
  })
  const { fmt, t } = usePreferences()
  const visibleActive  = showAll ? activeItems : activeItems.slice(0, 5)
  const total          = activeItems.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  return (
    <>
      <div className="glass-card rounded-2xl p-4 relative overflow-hidden" style={{ border: c.borderStyle }}>
        {c.bgGradient && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: c.bgGradient, opacity: c.opacity / 100 }} />
        )}
        {c.enableColor && c.darkOverlay > 0 && (
          <div className="absolute inset-0 pointer-events-none bg-black" style={{ opacity: c.darkOverlay / 100 }} />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button ref={c.btnRef} type="button" onClick={c.toggleOpen}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Heart size={14} />
              </button>
              <button type="button" onClick={() => setCollapsed(c => !c)} className="font-semibold text-base hover:text-white/70 transition-colors">{t('wish.title')}</button>
            </div>
            <button onClick={() => { setEditItem(null); setShowModal(true) }}
              className="text-muted hover:text-white transition-colors">
              <Plus size={16} />
            </button>
          </div>

          {!collapsed && (<>
          {loading ? (
            <p className="text-center text-muted text-xs py-4">{t('common.loading')}</p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted text-sm py-4">{t('wish.empty')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleActive.map(item => {
                const impKey = getImportanceKey(item, catMap)
                return (
                  <div key={item.id} className="flex items-center gap-3 relative">
                    {skipFlash?.id === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span
                          className="text-xs font-medium px-3 py-1.5 rounded-full text-white shadow-lg whitespace-nowrap"
                          style={{ background: 'var(--color-accent)', animation: 'savedFlash 2.8s ease-out forwards' }}
                        >
                          {t('wish.saved', { amount: fmt(item.amount) })}
                        </span>
                      </div>
                    )}

                    <ItemIcon item={item} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setEditItem(item); setShowModal(true) }}
                          className="text-sm font-medium text-white hover:text-white/70 transition-colors text-left truncate leading-tight"
                        >
                          {item.name}
                        </button>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer"
                            className="text-white/25 hover:text-white/60 transition-colors shrink-0"
                            onClick={e => e.stopPropagation()}>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      {impKey && <ImportanceDots impKey={impKey} importance={importance} />}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {item.amount
                        ? <span className="text-sm font-medium text-white">{fmt(item.amount)}</span>
                        : <span className="text-xs text-white/25">—</span>
                      }
                      <div className="flex items-center gap-2">
                        <button onClick={() => openBuyPopup(item)}
                          className="flex items-center gap-1 text-[10px] text-white/25 transition-colors"
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = ''}>
                          <ShoppingCart size={11} />
                        </button>
                        <button onClick={() => toggleCancel(item)} disabled={toggling.has(item.id)}
                          className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/60 transition-colors">
                          <Undo2 size={11} /> {t('wish.skip')}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {activeItems.length > 5 && (
                <button onClick={() => setShowAll(v => !v)}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors text-center py-0.5">
                  {showAll ? t('wish.showLess') : t('wish.more', { count: activeItems.length - 5 })}
                </button>
              )}

              {boughtItems.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                  {boughtItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3" style={{ opacity: 0.45 }}>
                      <ItemIcon item={item} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white/50 line-through truncate block leading-tight">{item.name}</span>
                        {getImportanceKey(item, catMap) && (
                          <ImportanceDots impKey={getImportanceKey(item, catMap)} importance={importance} />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {item.amount ? <span className="text-sm text-white/50">{fmt(item.amount)}</span> : <span className="text-xs text-white/25">—</span>}
                        <button onClick={() => handleUndoBought(item)}
                          className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 transition-colors">
                          <Undo2 size={11} /> {t('common.undo')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cancelledItems.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                  {cancelledItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3" style={{ opacity: 0.45 }}>
                      <ItemIcon item={item} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-white/50 line-through truncate leading-tight">{item.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 shrink-0">Skipped</span>
                        </div>
                        {getImportanceKey(item, catMap) && (
                          <ImportanceDots impKey={getImportanceKey(item, catMap)} importance={importance} />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {item.amount ? <span className="text-sm text-white/50">{fmt(item.amount)}</span> : <span className="text-xs text-white/25">—</span>}
                        <button onClick={() => toggleCancel(item)} disabled={toggling.has(item.id)}
                          className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 transition-colors">
                          <Undo2 size={11} /> {t('common.undo')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeItems.length > 0 && (
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/10 text-sm">
              <span className="text-muted">{t('wish.total')}</span>
              <span style={{ color: 'var(--color-accent)' }}>{fmt(total)}</span>
            </div>
          )}
          </>)}
        </div>
      </div>

      {c.open && (
        <CardCustomizationPopup
          popupRef={c.popupRef} pos={c.pos}
          enableColor={c.enableColor}   setEnableColor={c.setEnableColor}
          showBorder={c.showBorder}     setShowBorder={c.setShowBorder}
          tab={c.tab}                   setTab={c.setTab}
          selectedColor={c.selectedColor}   setSelectedColor={c.setSelectedColor}
          opacity={c.opacity}           setOpacity={c.setOpacity}
          darkOverlay={c.darkOverlay}   setDarkOverlay={c.setDarkOverlay}
          colors={c.colors}
        />
      )}

      {showModal && (
        <AddWishlistModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSaved={load}
        />
      )}

      {/* Buy popup */}
      {buyItem && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setBuyItem(null) }}>
          <div className="glass-popup border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
                  <ShoppingCart size={16} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Mark as bought</p>
                  <p className="text-[11px] text-white/40 truncate max-w-[180px]">{buyItem.name}</p>
                </div>
              </div>
              <button onClick={() => setBuyItem(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Amount */}
            {buyItem.amount && (
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-sm text-white/50">Amount</span>
                <span className="text-sm font-semibold text-white">{fmt(buyItem.amount)}</span>
              </div>
            )}

            {/* Pay with */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/50 uppercase tracking-widest">Pay with</label>
              <div className="flex gap-2 flex-wrap">
                {availableCards.map(card => (
                  <button key={card.id} type="button"
                    onClick={() => { setBuyCardId(card.id); setBuyIsCash(false) }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-sm transition-all min-w-[80px] ${!buyIsCash && buyCardId === card.id ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                    {card.name}
                  </button>
                ))}
                <button type="button"
                  onClick={() => { setBuyIsCash(true); setBuyCardId(null) }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-sm transition-all min-w-[80px] ${buyIsCash ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                  Cash
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => setBuyItem(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                Cancel
              </button>
              <button onClick={confirmBuy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: 'var(--color-accent)' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
