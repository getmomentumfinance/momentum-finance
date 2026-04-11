import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, Building2, UserRound, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSharedData } from '../../context/SharedDataContext'
import { SOLIDS, GRADIENTS } from '../../constants/gradients'
import { extractNColors } from '../../utils/gradientColors'
import { useImportance } from '../../hooks/useImportance'
import { CATEGORY_ICONS, CategoryPill } from '../shared/CategoryPill'

function ImportancePicker({ value, onChange, importance }) {
  return (
    <div className="flex gap-1.5">
      {importance.map(({ value: v, label, color }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v === value ? null : v)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border
            ${value === v ? 'text-white border-transparent' : 'text-muted border-white/10 hover:border-white/30'}`}
          style={value === v ? { background: color } : {}}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ImportanceBadge({ value, importance }) {
  const imp = importance.find(i => i.value === value)
  if (!imp) return <span className="text-[10px] text-white/20 px-1.5">—</span>
  return (
    <span className="flex items-center gap-[3px]" title={imp.label}>
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: i < imp.dots ? imp.color : imp.color + '30' }}
        />
      ))}
    </span>
  )
}

// ── Color picker ───────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SOLIDS.map(c => (
        <button
          key={c}
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => onChange(c)}
          className={`w-5 h-5 rounded-full transition-transform hover:scale-110
            ${value === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--color-dash-card)]' : ''}`}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}

// ── Gradient picker ──────────────────────────────────────────
function GradientPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => onChange(null)}
        className={`w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center transition-transform hover:scale-110
          ${!value ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--color-dash-card)]' : ''}`}
        title="No gradient"
      >
        <span className="text-white/40 text-[8px] leading-none">✕</span>
      </button>
      {GRADIENTS.map(g => (
        <button
          key={g.name}
          type="button"
          title={g.name}
          onMouseDown={e => e.preventDefault()}
          onClick={() => onChange(g.value)}
          className={`w-5 h-5 rounded-full transition-transform hover:scale-110
            ${value === g.value ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--color-dash-card)]' : ''}`}
          style={{ background: g.value }}
        />
      ))}
    </div>
  )
}

// ── Group picker (receiver edit form) ────────────────────────
function GroupPicker({ value, groups, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => onChange(null)}
        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors
          ${!value ? 'text-white bg-white/15 border-white/30' : 'text-muted border-white/10 hover:border-white/25'}`}
      >
        None
      </button>
      {groups.map(g => (
        <button
          key={g.id}
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => onChange(g.id)}
          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors
            ${value === g.id ? 'bg-white/10 border-white/25 text-white' : 'text-muted border-white/10 hover:border-white/25'}`}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.gradient || g.color }} />
          {g.name}
        </button>
      ))}
    </div>
  )
}

// ── Icon picker ─────────────────────────────────────────────────
function IconPicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = q
    ? CATEGORY_ICONS.filter(({ id, group }) => id.includes(q) || group.toLowerCase().includes(q))
    : CATEGORY_ICONS

  return (
    <div className="flex flex-col gap-1.5">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onMouseDown={e => e.stopPropagation()}
        placeholder="Search icons…"
        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-colors"
      />
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto scrollbar-thin pr-1">
        {!query && (
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => onChange(null)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white/30 transition-colors hover:bg-white/10
              ${!value ? 'bg-white/15 text-white' : ''}`}
          >
            —
          </button>
        )}
        {filtered.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => onChange(id)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10
              ${value === id ? 'bg-white/20 text-white' : 'text-white/40'}`}
            title={id}
          >
            <Icon size={15} strokeWidth={1.75} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-white/25 py-2 px-1">No icons found</p>
        )}
      </div>
    </div>
  )
}

// ── Receiver avatar ─────────────────────────────────────────────
function ReceiverAvatar({ name, domain, logoUrl }) {
  const [attempt, setAttempt] = useState(0)
  const prevDomain = useRef(domain)

  useEffect(() => {
    if (domain !== prevDomain.current) {
      setAttempt(0)
      prevDomain.current = domain
    }
  }, [domain])

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const sources = [
    logoUrl || null,
    domain ? `https://logo.clearbit.com/${domain}` : null,
    domain ? `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256` : null,
  ].filter(Boolean)
  const src = sources[attempt]

  if (!src) {
    return (
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
        {initials}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      className="w-7 h-7 rounded-full object-contain bg-white p-0.5 shrink-0"
      onError={() => {
        if (attempt < sources.length - 1) setAttempt(a => a + 1)
        else setAttempt(sources.length)
      }}
    />
  )
}

// ══════════════════════════════════════════════════════════════
//  CATEGORIES SECTION
// ══════════════════════════════════════════════════════════════
function CategoriesSection({ userId, importance }) {
  const [cats, setCats] = useState([])
  const [expanded, setExpanded] = useState({})
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editGradient, setEditGradient] = useState(null)
  const [editIcon, setEditIcon] = useState(null)
  const [editImportance, setEditImportance] = useState(null)
  const [addForm, setAddForm] = useState(null)
  const [addName, setAddName] = useState('')
  const [addColor, setAddColor] = useState(SOLIDS[0])
  const [addIcon, setAddIcon] = useState(null)
  const [addImportance, setAddImportance] = useState(null)
  const [addDupe, setAddDupe] = useState(false)

  useEffect(() => { load() }, [userId])

  async function load() {
    const { data } = await supabase.from('categories').select('*').eq('user_id', userId).order('created_at')
    setCats(data ?? [])
  }

  async function fetchFresh() {
    const { data } = await supabase.from('categories').select('*').eq('user_id', userId).order('created_at')
    return data ?? []
  }

  async function recolorSubs(parentId, gradientCss, freshCats) {
    const subs = freshCats.filter(c => c.parent_id === parentId)
    if (!gradientCss || subs.length === 0) return
    const colors = extractNColors(gradientCss, subs.length)
    await Promise.all(subs.map((sub, i) =>
      supabase.from('categories').update({ color: colors[i] }).eq('id', sub.id)
    ))
  }

  function startEdit(cat) {
    setEditId(cat.id); setEditName(cat.name); setEditColor(cat.color)
    setEditGradient(cat.gradient ?? null); setEditIcon(cat.icon ?? null); setEditImportance(cat.importance ?? null)
  }

  async function commitEdit(id) {
    if (!editName.trim()) { cancelEdit(); return }
    await supabase.from('categories').update({
      name: editName.trim(), color: editColor, gradient: editGradient ?? null, icon: editIcon, importance: editImportance,
    }).eq('id', id)
    setEditId(null); load()
  }

  function cancelEdit() {
    setEditId(null); setEditName(''); setEditColor(''); setEditGradient(null); setEditIcon(null); setEditImportance(null)
  }

  async function changeColor(id, color) {
    setEditColor(color); setEditGradient(null)
    await supabase.from('categories').update({ color, gradient: null }).eq('id', id)
    load()
  }

  async function changeGradient(id, gradientCss) {
    setEditGradient(gradientCss)
    if (gradientCss) {
      setEditColor(gradientCss)
      await supabase.from('categories').update({ color: gradientCss, gradient: gradientCss }).eq('id', id)
    } else {
      const fallback = SOLIDS[0]
      setEditColor(fallback)
      await supabase.from('categories').update({ color: fallback, gradient: null }).eq('id', id)
    }
    const fresh = await fetchFresh()
    setCats(fresh)
    if (gradientCss) { await recolorSubs(id, gradientCss, fresh); setCats(await fetchFresh()) }
  }

  async function changeImportance(id, importance) {
    setEditImportance(importance)
    await supabase.from('categories').update({ importance }).eq('id', id)
    load()
  }

  async function addCategory() {
    if (!addName.trim()) return
    const parentId = addForm?.parentId ?? null
    const nameNorm = addName.trim().toLowerCase()
    if (cats.some(c => c.parent_id === parentId && c.name.toLowerCase() === nameNorm)) { setAddDupe(true); return }
    const isGradient = addColor?.includes('gradient')
    const { error } = await supabase.from('categories').insert({
      user_id: userId, name: addName.trim(), color: addColor, gradient: isGradient ? addColor : null, icon: addIcon, importance: addImportance, parent_id: parentId,
    })
    if (error) { console.error(error.message); return }
    setAddForm(null); setAddName(''); setAddColor(GRADIENTS[0].value); setAddIcon(null); setAddImportance(null); setAddDupe(false)
    if (parentId) {
      const fresh = await fetchFresh()
      const parent = fresh.find(c => c.id === parentId)
      if (parent?.gradient) await recolorSubs(parentId, parent.gradient, fresh)
    }
    load()
  }

  async function deleteCategory(id) {
    const cat = cats.find(c => c.id === id)
    await supabase.from('categories').delete().eq('id', id)
    if (cat?.parent_id) {
      const fresh = await fetchFresh()
      const parent = fresh.find(c => c.id === cat.parent_id)
      if (parent?.gradient) await recolorSubs(cat.parent_id, parent.gradient, fresh)
    }
    load()
  }

  const tops  = cats.filter(c => !c.parent_id)
  const subsOf = pid => cats.filter(c => c.parent_id === pid)

  return (
    <div className="flex flex-col gap-2">
      {tops.map(cat => {
        const subs = subsOf(cat.id)
        const isOpen = expanded[cat.id]
        return (
          <div key={cat.id}>
            <CategoryRow
              cat={cat} isEditing={editId === cat.id}
              editName={editName} onEditName={setEditName}
              editColor={editColor} editGradient={editGradient} onGradientChange={g => changeGradient(cat.id, g)}
              editIcon={editIcon} onEditIcon={setEditIcon}
              editImportance={editImportance} importance={importance}
              onStartEdit={startEdit} onSave={() => commitEdit(cat.id)} onCancel={cancelEdit}
              onColorChange={c => changeColor(cat.id, c)}
              onImportanceChange={v => changeImportance(cat.id, v)}
              onDelete={() => deleteCategory(cat.id)}
              isMain
              extra={
                <>
                  <button type="button" onClick={() => setExpanded(e => ({ ...e, [cat.id]: !e[cat.id] }))} className="text-muted hover:text-white transition-colors shrink-0">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {subs.length > 0 && !isOpen && <span className="text-xs text-muted ml-auto mr-1">{subs.length} sub</span>}
                  {editId !== cat.id && (
                    <button onClick={() => { setAddForm({ parentId: cat.id }); setAddName(''); setAddColor(SOLIDS[0]); setExpanded(e => ({ ...e, [cat.id]: true })) }}
                      className="text-xs text-muted hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                      + sub
                    </button>
                  )}
                </>
              }
            />
            {isOpen && (
              <div className="ml-8 mt-1 flex flex-col gap-1">
                {subs.map(sub => (
                  <CategoryRow key={sub.id} cat={sub} isEditing={editId === sub.id}
                    editName={editName} onEditName={setEditName} editColor={editColor}
                    editIcon={editIcon} onEditIcon={setEditIcon}
                    editImportance={editImportance} importance={importance}
                    onStartEdit={startEdit} onSave={() => commitEdit(sub.id)} onCancel={cancelEdit}
                    onColorChange={c => changeColor(sub.id, c)}
                    onImportanceChange={v => changeImportance(sub.id, v)}
                    onDelete={() => deleteCategory(sub.id)} small
                  />
                ))}
                {addForm?.parentId === cat.id && (
                  <AddCategoryForm
                    name={addName} onName={setAddName} color={addColor} onColor={setAddColor}
                    icon={addIcon} onIcon={setAddIcon} importance={addImportance} onImportance={setAddImportance}
                    importanceOptions={importance} onSave={addCategory} onCancel={() => setAddForm(null)}
                    placeholder="Subcategory name" dupe={addDupe} onClearDupe={() => setAddDupe(false)}
                    isMain={false}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
      {addForm?.parentId === null && (
        <AddCategoryForm
          name={addName} onName={setAddName} color={addColor} onColor={setAddColor}
          icon={addIcon} onIcon={setAddIcon} importance={addImportance} onImportance={setAddImportance}
          importanceOptions={importance} onSave={addCategory} onCancel={() => setAddForm(null)}
          placeholder="Category name" dupe={addDupe} onClearDupe={() => setAddDupe(false)}
          isMain
        />
      )}
      <button onClick={() => { setAddForm({ parentId: null }); setAddName(''); setAddColor(GRADIENTS[0].value) }}
        className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mt-1 w-fit">
        <Plus size={14} /> Add category
      </button>
    </div>
  )
}

function CategoryRow({ cat, isEditing, editName, onEditName, editColor, editGradient, onGradientChange, editIcon, onEditIcon, editImportance, importance, onStartEdit, onSave, onCancel, onColorChange, onImportanceChange, onDelete, extra, isMain }) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 group">
        {isEditing ? (
          <>
            <input autoFocus value={editName} onChange={e => onEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
              className="flex-1 bg-transparent text-sm text-white outline-none" />
            <CategoryPill name={editName || '…'} color={editColor} icon={editIcon} />
          </>
        ) : (
          <>
            {extra}
            <CategoryPill name={cat.name} color={cat.color} icon={cat.icon} />
            <div className="flex-1" />
            <ImportanceBadge value={cat.importance} importance={importance} />
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onStartEdit(cat)} className="text-muted hover:text-white p-0.5"><Pencil size={12} /></button>
              <button onClick={onDelete} className="text-muted hover:text-red-400 p-0.5"><Trash2 size={12} /></button>
            </div>
          </>
        )}
      </div>
      {isEditing && (
        <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 -mt-1">
          {isMain && (
            <>
              <p className="text-[10px] text-muted uppercase tracking-widest">Gradient</p>
              <GradientPicker value={editGradient} onChange={onGradientChange} />
            </>
          )}
          <IconPicker value={editIcon} onChange={onEditIcon} />
          <ImportancePicker value={editImportance} onChange={onImportanceChange} importance={importance} />
          <div className="flex items-center gap-2 pt-1 border-t border-white/8">
            <button type="button" onClick={onSave} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors">Save</button>
            <button type="button" onClick={onCancel} className="px-3 py-1 rounded-lg text-xs text-muted hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}

function AddCategoryForm({ name, onName, color, onColor, icon, onIcon, importance, onImportance, importanceOptions, onSave, onCancel, placeholder, dupe, onClearDupe, isMain }) {
  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2">
        <CategoryPill name={name || placeholder} color={color} icon={icon} />
        <input autoFocus value={name}
          onChange={e => { onName(e.target.value); if (dupe) onClearDupe() }}
          onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
          placeholder="Name — press Enter to add"
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20" />
        <button onClick={onCancel} className="text-muted hover:text-white shrink-0"><X size={14} /></button>
      </div>
      {dupe && <p className="text-xs text-amber-400">Already in your list.</p>}
      {isMain && <GradientPicker value={color} onChange={onColor} />}
      <IconPicker value={icon} onChange={onIcon} />
      <ImportancePicker value={importance} onChange={onImportance} importance={importanceOptions} />
    </div>
  )
}

// ── Receiver row ──────────────────────────────────────────────
function ReceiverRow({ r, colorDot, type, editId, editForm, setEditForm, editNameRef, saveEdit, setEditId, myGroups, startEditReceiver, deleteReceiver }) {
  const isBusiness = type === 'business'
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 group/r">
      {editId === r.id ? (
        <div
          className="flex-1 flex flex-col gap-2"
          onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) saveEdit(r.id) }}
        >
          <div className="flex items-center gap-2">
            <ReceiverAvatar name={editForm.name || r.name} domain={editForm.domain} logoUrl={editForm.logo_url} />
            <input
              ref={editNameRef}
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditId(null) }}
              className="flex-1 bg-transparent text-sm text-white outline-none border-b border-white/20"
              placeholder="Name"
            />
          </div>
          {myGroups.length > 0 && (
            <div className="ml-9">
              <p className="text-[10px] text-muted uppercase tracking-widest mb-1">Group</p>
              <GroupPicker value={editForm.group_id} groups={myGroups} onChange={gId => setEditForm(f => ({ ...f, group_id: gId }))} />
            </div>
          )}
          {isBusiness && (
            <div className="flex flex-col gap-1.5 ml-9">
              <input
                value={editForm.domain}
                onChange={e => setEditForm(f => ({ ...f, domain: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                className="bg-transparent text-xs text-muted outline-none border-b border-white/10 w-48"
                placeholder="Domain (e.g. colruyt.be)"
              />
              <input
                value={editForm.logo_url}
                onChange={e => setEditForm(f => ({ ...f, logo_url: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                className="bg-transparent text-xs text-muted outline-none border-b border-white/10 w-64"
                placeholder="Custom logo URL (optional)"
              />
              {editForm.logo_url && (
                <button type="button" onClick={() => setEditForm(f => ({ ...f, logo_url: '' }))} className="text-xs text-red-400 hover:text-red-300 w-fit">
                  Clear custom logo
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {colorDot && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colorDot }} />}
          <ReceiverAvatar name={r.name} domain={r.domain} logoUrl={r.logo_url} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{r.name}</p>
            {r.domain && <p className="text-[11px] text-muted truncate">{r.domain}</p>}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover/r:opacity-100 transition-opacity">
            <button onClick={() => startEditReceiver(r)} className="text-white/30 hover:text-white p-1.5 transition-colors"><Pencil size={13} /></button>
            <button onClick={() => deleteReceiver(r.id)} className="text-white/30 hover:text-red-400 p-1.5 transition-colors"><Trash2 size={13} /></button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Add receiver inline form ───────────────────────────────────
function AddReceiverInline({ groupId, onCancel, type, addForm, setAddForm, addDupe, setAddDupe, domainPreview, domainTimer, setDomainPreview, addReceiver }) {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2">
        <ReceiverAvatar name={addForm.name || '?'} domain={domainPreview} logoUrl={null} />
        <input
          autoFocus
          value={addForm.name}
          onChange={e => { setAddForm(f => ({ ...f, name: e.target.value })); setAddDupe(false) }}
          onKeyDown={e => { if (e.key === 'Enter') addReceiver(groupId); if (e.key === 'Escape') onCancel() }}
          placeholder="Name — press Enter to add"
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
        />
        <button onClick={onCancel} className="text-muted hover:text-white shrink-0"><X size={14} /></button>
      </div>
      {type === 'business' && (
        <div className="ml-9">
          <input
            value={addForm.domain}
            onChange={e => {
              setAddForm(f => ({ ...f, domain: e.target.value }))
              clearTimeout(domainTimer.current)
              domainTimer.current = setTimeout(() => setDomainPreview(e.target.value.trim()), 400)
            }}
            onKeyDown={e => { if (e.key === 'Enter') addReceiver(groupId); if (e.key === 'Escape') onCancel() }}
            placeholder="Domain for logo (e.g. colruyt.be)"
            className="bg-transparent text-xs text-muted outline-none border-b border-white/10 w-56 placeholder:text-white/20"
          />
        </div>
      )}
      {addDupe && <p className="text-xs text-amber-400">Already in your list.</p>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  RECEIVER TYPE SECTION (Businesses or People with group hierarchy)
// ══════════════════════════════════════════════════════════════
function ReceiverTypeSection({ userId, type, label, description, icon: Icon, allReceivers, groups, onReload, dispatchEvent }) {
  const { receiverColorMap } = useSharedData()

  // Receivers + groups for this type only
  const myGroups  = groups.filter(g =>
    g.type === type ||
    (g.type == null && allReceivers.some(r => r.group_id === g.id && r.type === type))
  )
  const receivers = allReceivers.filter(r => r.type === type)
  const grouped   = receivers.filter(r => r.group_id)
  const ungrouped = receivers.filter(r => !r.group_id)

  // UI state
  const [expandedGroups, setExpandedGroups] = useState({})

  // Receiver edit
  const [editId,   setEditId]   = useState(null)
  const [editForm, setEditForm] = useState({ name: '', domain: '', logo_url: '', group_id: null })

  // Receiver add form — groupId | 'ungrouped' | null (hidden)
  const [addInGroup, setAddInGroup] = useState(null)
  const [addForm,    setAddForm]    = useState({ name: '', domain: '' })
  const [addDupe,    setAddDupe]    = useState(false)
  const [domainPreview, setDomainPreview] = useState('')
  const domainTimer  = useRef(null)
  const editNameRef  = useRef(null)

  // Group edit
  const [editGroupId,       setEditGroupId]       = useState(null)
  const [editGroupName,     setEditGroupName]     = useState('')
  const [editGroupColor,    setEditGroupColor]    = useState('')
  const [editGroupGradient, setEditGroupGradient] = useState(null)

  // Group add form
  const [addingGroup,      setAddingGroup]      = useState(false)
  const [addGroupName,     setAddGroupName]     = useState('')
  const [addGroupColor,    setAddGroupColor]    = useState(SOLIDS[0])
  const [addGroupGradient, setAddGroupGradient] = useState(null)

  // ── Receiver CRUD ─────────────────────────────────────────────
  async function addReceiver(groupId) {
    if (!addForm.name.trim()) return
    const nameNorm = addForm.name.trim().toLowerCase()
    if (allReceivers.some(r => r.name.toLowerCase() === nameNorm)) { setAddDupe(true); return }
    await supabase.from('receivers').insert({
      user_id: userId, name: addForm.name.trim(), type,
      domain: type === 'business' ? (addForm.domain.trim() || null) : null,
      logo_url: null,
      group_id: groupId && groupId !== 'ungrouped' ? groupId : null,
    })
    setAddInGroup(null); setAddForm({ name: '', domain: '' }); setDomainPreview(''); setAddDupe(false)
    onReload(); dispatchEvent()
  }

  async function saveEdit(id) {
    if (!editForm.name.trim()) return
    await supabase.from('receivers').update({
      name: editForm.name.trim(), domain: editForm.domain || null,
      logo_url: editForm.logo_url || null, group_id: editForm.group_id || null,
    }).eq('id', id)
    setEditId(null)
    onReload(); dispatchEvent()
  }

  async function deleteReceiver(id) {
    await supabase.from('receivers').delete().eq('id', id)
    onReload(); dispatchEvent()
  }

  function startEditReceiver(r) {
    setEditId(r.id)
    setEditForm({ name: r.name, domain: r.domain ?? '', logo_url: r.logo_url ?? '', group_id: r.group_id ?? null })
    setTimeout(() => editNameRef.current?.focus(), 0)
  }

  // ── Group CRUD ────────────────────────────────────────────────
  async function addGroup() {
    if (!addGroupName.trim()) return
    await supabase.from('receiver_groups').insert({
      user_id: userId, name: addGroupName.trim(),
      color: addGroupGradient || addGroupColor, gradient: addGroupGradient || null,
      type,
    })
    setAddingGroup(false); setAddGroupName(''); setAddGroupColor(SOLIDS[0]); setAddGroupGradient(null)
    onReload(); dispatchEvent()
  }

  function startEditGroup(g) {
    setEditGroupId(g.id); setEditGroupName(g.name); setEditGroupColor(g.color); setEditGroupGradient(g.gradient ?? null)
  }

  function cancelEditGroup() {
    setEditGroupId(null); setEditGroupName(''); setEditGroupColor(''); setEditGroupGradient(null)
  }

  async function commitEditGroup(id) {
    if (!editGroupName.trim()) { cancelEditGroup(); return }
    await supabase.from('receiver_groups').update({
      name: editGroupName.trim(), color: editGroupColor, gradient: editGroupGradient || null,
    }).eq('id', id)
    cancelEditGroup(); onReload(); dispatchEvent()
  }

  async function changeGroupGradient(id, gradientCss) {
    setEditGroupGradient(gradientCss)
    if (gradientCss) {
      setEditGroupColor(gradientCss)
      await supabase.from('receiver_groups').update({ color: gradientCss, gradient: gradientCss }).eq('id', id)
    } else {
      setEditGroupColor(SOLIDS[0])
      await supabase.from('receiver_groups').update({ color: SOLIDS[0], gradient: null }).eq('id', id)
    }
    onReload(); dispatchEvent()
  }

  async function changeGroupColor(id, color) {
    setEditGroupColor(color); setEditGroupGradient(null)
    await supabase.from('receiver_groups').update({ color, gradient: null }).eq('id', id)
    onReload(); dispatchEvent()
  }

  async function deleteGroup(id) {
    await supabase.from('receiver_groups').delete().eq('id', id)
    onReload(); dispatchEvent()
  }


  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="shrink-0">
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 scrollbar-thin flex flex-col gap-2">

        {/* Groups */}
        {myGroups.map(g => {
          const members = receivers.filter(r => r.group_id === g.id).sort((a, b) => a.name.localeCompare(b.name))
          const isOpen  = expandedGroups[g.id]
          const bg      = g.gradient || g.color

          return (
            <div key={g.id}>
              {/* Group header */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 group">
                {editGroupId === g.id ? (
                  <>
                    <div className="w-5 h-5 rounded-full shrink-0" style={{ background: editGroupGradient || editGroupColor }} />
                    <input
                      autoFocus
                      value={editGroupName}
                      onChange={e => setEditGroupName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEditGroup(g.id); if (e.key === 'Escape') cancelEditGroup() }}
                      className="flex-1 bg-transparent text-sm text-white outline-none"
                    />
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setExpandedGroups(e => ({ ...e, [g.id]: !e[g.id] }))}
                      className="text-muted hover:text-white transition-colors shrink-0">
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <div className="w-5 h-5 rounded-full shrink-0" style={{ background: bg }} />
                    <span className="flex-1 text-sm text-white truncate">{g.name}</span>
                    {members.length > 0 && !isOpen && <span className="text-xs text-muted mr-1">{members.length}</span>}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editGroupId !== g.id && (
                        <button
                          onClick={() => { setAddInGroup(g.id); setAddForm({ name: '', domain: '' }); setExpandedGroups(e => ({ ...e, [g.id]: true })) }}
                          className="text-xs text-muted hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                        >+ add</button>
                      )}
                      <button onClick={() => startEditGroup(g)} className="text-muted hover:text-white p-0.5"><Pencil size={12} /></button>
                      <button onClick={() => deleteGroup(g.id)} className="text-muted hover:text-red-400 p-0.5"><Trash2 size={12} /></button>
                    </div>
                  </>
                )}
              </div>

              {/* Group edit pickers */}
              {editGroupId === g.id && (
                <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 -mt-1">
                  <p className="text-[10px] text-muted uppercase tracking-widest">Gradient</p>
                  <GradientPicker value={editGroupGradient} onChange={grad => changeGroupGradient(g.id, grad)} />
                  <p className="text-[10px] text-muted uppercase tracking-widest mt-1">Solid color</p>
                  <ColorPicker value={editGroupGradient ? null : editGroupColor} onChange={c => changeGroupColor(g.id, c)} />
                  <div className="flex items-center gap-2 pt-1 border-t border-white/8">
                    <button type="button" onClick={() => commitEditGroup(g.id)} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors">Save</button>
                    <button type="button" onClick={cancelEditGroup} className="px-3 py-1 rounded-lg text-xs text-muted hover:text-white transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              {/* Members */}
              {isOpen && (
                <div className="ml-8 mt-1 flex flex-col gap-1">
                  {members.map(r => (
                    <ReceiverRow key={r.id} r={r} colorDot={receiverColorMap[r.name] || bg}
                      type={type} editId={editId} editForm={editForm} setEditForm={setEditForm}
                      editNameRef={editNameRef} saveEdit={saveEdit} setEditId={setEditId}
                      myGroups={myGroups} startEditReceiver={startEditReceiver} deleteReceiver={deleteReceiver}
                    />
                  ))}
                  {addInGroup === g.id && (
                    <AddReceiverInline
                      groupId={g.id}
                      onCancel={() => { setAddInGroup(null); setAddForm({ name: '', domain: '' }); setAddDupe(false) }}
                      type={type} addForm={addForm} setAddForm={setAddForm} addDupe={addDupe} setAddDupe={setAddDupe}
                      domainPreview={domainPreview} domainTimer={domainTimer} setDomainPreview={setDomainPreview}
                      addReceiver={addReceiver}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Ungrouped receivers */}
        {(ungrouped.length > 0 || addInGroup === 'ungrouped') && (
          <div className={myGroups.length > 0 ? 'mt-1' : ''}>
            {myGroups.length > 0 && ungrouped.length > 0 && (
              <p className="text-[10px] text-muted uppercase tracking-widest px-1 mb-1.5">Ungrouped</p>
            )}
            <div className="flex flex-col gap-1">
              {ungrouped.map(r => (
                <ReceiverRow key={r.id} r={r} colorDot={null}
                  type={type} editId={editId} editForm={editForm} setEditForm={setEditForm}
                  editNameRef={editNameRef} saveEdit={saveEdit} setEditId={setEditId}
                  myGroups={myGroups} startEditReceiver={startEditReceiver} deleteReceiver={deleteReceiver}
                />
              ))}
              {addInGroup === 'ungrouped' && (
                <AddReceiverInline
                  groupId={null}
                  onCancel={() => { setAddInGroup(null); setAddForm({ name: '', domain: '' }); setAddDupe(false) }}
                  type={type} addForm={addForm} setAddForm={setAddForm} addDupe={addDupe}
                  domainPreview={domainPreview} domainTimer={domainTimer} setDomainPreview={setDomainPreview}
                  addReceiver={addReceiver}
                />
              )}
            </div>
          </div>
        )}

        {/* Add group form */}
        {addingGroup && (
          <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] text-muted uppercase tracking-widest">Gradient</p>
            <GradientPicker value={addGroupGradient} onChange={setAddGroupGradient} />
            <p className="text-[10px] text-muted uppercase tracking-widest mt-1">Solid color</p>
            <ColorPicker value={addGroupGradient ? null : addGroupColor} onChange={setAddGroupColor} />
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full shrink-0" style={{ background: addGroupGradient || addGroupColor }} />
              <input
                autoFocus
                value={addGroupName}
                onChange={e => setAddGroupName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addGroup(); if (e.key === 'Escape') setAddingGroup(false) }}
                placeholder="Group name — press Enter to add"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
              />
              <button onClick={() => setAddingGroup(false)} className="text-muted hover:text-white shrink-0"><X size={14} /></button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-0.5 mt-1">
          <button
            onClick={() => { setAddingGroup(true); setAddGroupName(''); setAddGroupColor(SOLIDS[0]); setAddGroupGradient(null) }}
            className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors w-fit"
          >
            <Plus size={14} /> Add group
          </button>
          <button
            onClick={() => { setAddInGroup('ungrouped'); setAddForm({ name: '', domain: '' }); setAddDupe(false) }}
            className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors w-fit"
          >
            <Plus size={14} /> Add {type === 'business' ? 'business' : 'person'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  RECEIVERS SECTION (loads shared state, renders both types)
// ══════════════════════════════════════════════════════════════
function ReceiversSection({ userId }) {
  const [receivers, setReceivers] = useState([])
  const [groups,    setGroups]    = useState([])

  const loadAll = useCallback(async () => {
    const [{ data: recs }, { data: grps }] = await Promise.all([
      supabase.from('receivers').select('*').eq('user_id', userId).order('name'),
      supabase.from('receiver_groups').select('*').eq('user_id', userId).order('created_at'),
    ])
    setReceivers(recs ?? [])
    setGroups(grps ?? [])
  }, [userId])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    window.addEventListener('receiver-group-saved', loadAll)
    return () => window.removeEventListener('receiver-group-saved', loadAll)
  }, [loadAll])

  function dispatchEvent() {
    window.dispatchEvent(new CustomEvent('receiver-group-saved'))
  }

  return (
    <>
      <div className="flex flex-col gap-3 min-h-0">
        <ReceiverTypeSection
          userId={userId} type="business" label="Businesses"
          description="Companies and shops you pay."
          icon={Building2}
          allReceivers={receivers} groups={groups}
          onReload={loadAll} dispatchEvent={dispatchEvent}
        />
      </div>
      <div className="flex flex-col gap-3 min-h-0">
        <ReceiverTypeSection
          userId={userId} type="person" label="People"
          description="Individuals you send money to or receive from."
          icon={UserRound}
          allReceivers={receivers} groups={groups}
          onReload={loadAll} dispatchEvent={dispatchEvent}
        />
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN TAB EXPORT
// ══════════════════════════════════════════════════════════════
export default function CategoriesTab() {
  const { user } = useAuth()
  const { importance } = useImportance()

  if (!user) return null

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-3 gap-8 flex-1 min-h-0">
        <div className="flex flex-col gap-3 min-h-0">
          <div className="shrink-0">
            <h3 className="text-sm font-medium text-white">Categories</h3>
            <p className="text-xs text-muted mt-0.5">Organise your transactions with main categories and subcategories.</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 scrollbar-thin">
            <CategoriesSection userId={user.id} importance={importance} />
          </div>
        </div>

        <ReceiversSection userId={user.id} />
      </div>
    </div>
  )
}
