import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export function showToast(message) {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message } }))
}

export default function Toast() {
  const [items, setItems] = useState([])
  const timerRefs = useRef({})

  useEffect(() => {
    function handler(e) {
      const id = Date.now()
      setItems(prev => [...prev, { id, message: e.detail.message }])
      timerRefs.current[id] = setTimeout(() => {
        setItems(prev => prev.filter(t => t.id !== id))
        delete timerRefs.current[id]
      }, 2800)
    }
    window.addEventListener('show-toast', handler)
    return () => {
      window.removeEventListener('show-toast', handler)
      Object.values(timerRefs.current).forEach(clearTimeout)
    }
  }, [])

  if (!items.length) return null

  return createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {items.map(t => (
        <div
          key={t.id}
          className="animate-toast-in px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-dash-card) 85%, transparent)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body
  )
}
