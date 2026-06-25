import { useEffect, useRef } from 'react'

/** Ref for a <g> wrapping [data-star] circles — animates their opacity with a gentle, staggered twinkle. */
export function useTwinkle() {
  const ref = useRef(null)
  useEffect(() => {
    const stars = ref.current?.querySelectorAll('[data-star]') ?? []
    const timers = []
    stars.forEach(star => {
      const base = parseFloat(star.getAttribute('opacity')) || 0.4
      function twinkle() {
        const peak = Math.min(0.9, base * 2.2)
        const low  = base * 0.15
        const duration = 1800 + Math.random() * 2200
        const anim = star.animate(
          [{ opacity: base }, { opacity: peak }, { opacity: low }, { opacity: base }],
          { duration, easing: 'ease-in-out' }
        )
        anim.onfinish = () => { timers.push(setTimeout(twinkle, Math.random() * 2000)) }
      }
      timers.push(setTimeout(twinkle, Math.random() * 3000))
    })
    return () => timers.forEach(clearTimeout)
  }, [])
  return ref
}
