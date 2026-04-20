import { useRef, useState, useEffect } from 'react'

export default function FadeIn({ children, delay = 0, className = '' }) {
  const [visible, setVisible] = useState(false)
  const rafRef = useRef(null)

  useEffect(() => {
    // Double rAF ensures the initial opacity:0 state is painted before we trigger the transition
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setVisible(true))
    })
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
