import { useState, useEffect, useRef } from 'react'

export default function useCountUp(target, duration = 700) {
  const [value, setValue]   = useState(target)
  const prevTarget          = useRef(target)
  const rafRef              = useRef(null)

  useEffect(() => {
    const start    = prevTarget.current
    const diff     = target - start
    if (diff === 0) return

    const startTime = performance.now()

    function tick(now) {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(start + diff * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        prevTarget.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}
