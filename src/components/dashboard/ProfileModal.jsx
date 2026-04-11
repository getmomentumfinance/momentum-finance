import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Camera, LogOut, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function ProfileModal({ onClose }) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '')
  const [avatarUrl, setAvatarUrl]     = useState(user?.user_metadata?.avatar_url ?? null)
  const [uploading, setUploading]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const fileRef     = useRef(null)
  const savedName   = useRef(displayName)

  // Auto-save display name
  useEffect(() => {
    if (displayName === savedName.current) return
    const timer = setTimeout(async () => {
      setSaving(true)
      await supabase.auth.updateUser({ data: { full_name: displayName } })
      savedName.current = displayName
      setSaving(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [displayName])

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
      setAvatarUrl(data.publicUrl + '?t=' + Date.now()) // bust cache
    }
    setUploading(false)
  }

  const initials = (displayName || user?.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="glass relative w-80 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white transition-colors">
          <X size={16} />
        </button>

        <h2 className="text-white font-semibold text-base">Profile</h2>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden group cursor-pointer"
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-xl font-bold">{initials}</div>
            }
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <span className="text-white text-xs">uploading…</span>
                : <Camera size={18} className="text-white" />
              }
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <span className="text-xs text-muted">Click photo to change</span>
        </div>

        {/* Display name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted uppercase tracking-widest">Display Name</label>
          <div className="relative">
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors"
              placeholder="Your name"
            />
            {saving && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">saving…</span>
            )}
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted uppercase tracking-widest">Email</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
            <Mail size={13} className="text-muted shrink-0" />
            <span className="text-sm text-muted truncate">{user?.email}</span>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors pt-3 border-t border-white/10"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>,
    document.body
  )
}
