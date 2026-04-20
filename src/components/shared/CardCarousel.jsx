import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AnalyticsVisualCard from './AnalyticsVisualCard'

export default function CardCarousel({ items }) {
  const [active, setActive] = useState(() => Math.floor(items.length / 2))

  if (items.length === 0) return null

  if (items.length === 1) {
    return (
      <div className="flex justify-start">
        <AnalyticsVisualCard {...items[0]} interactive />
      </div>
    )
  }

  const n    = items.length
  const prev = () => setActive(i => (i - 1 + n) % n)
  const next = () => setActive(i => (i + 1) % n)

  return (
    <div className="flex flex-col gap-3">
      {/* Carousel stage */}
      <div className="relative" style={{ height: 210, overflow: 'hidden' }}>
        {items.map((item, i) => {
          // Shortest-path offset for looping (wraps around)
          let offset = i - active
          if (offset >  n / 2) offset -= n
          if (offset < -n / 2) offset += n

          const abs      = Math.abs(offset)
          const visible  = abs <= 2
          const scale    = abs === 0 ? 1.05 : abs === 1 ? 0.82 : 0.68
          const tx       = offset * 265
          const opacity  = abs === 0 ? 1 : abs === 1 ? 0.5 : 0
          const zIndex   = 20 - abs * 5
          const isCenter = abs === 0

          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${tx}px), -50%) scale(${scale})`,
                transition: 'transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s',
                opacity: visible ? opacity : 0,
                zIndex,
                pointerEvents: visible ? 'auto' : 'none',
                cursor: isCenter ? 'default' : 'pointer',
              }}
              onClick={isCenter ? undefined : () => setActive(i)}
            >
              <AnalyticsVisualCard {...item} interactive={isCenter} />
            </div>
          )
        })}

        {/* Arrow buttons — always shown when looping */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
        >
          <ChevronLeft size={16} className="text-white/70" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
        >
          <ChevronRight size={16} className="text-white/70" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center items-center gap-1.5">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setActive(i)}
            className="rounded-full transition-all duration-300"
            style={{
              height: 5,
              width: i === active ? 18 : 5,
              background: i === active ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
