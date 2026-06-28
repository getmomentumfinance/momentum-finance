import { useMemo } from 'react'

// Resolves any valid CSS color (hex, rgb(), or a var() reference like the
// theme's --color-accent) to concrete 0-1 RGB channels via a throwaway
// element, since SVG filter primitives need literal numbers, not CSS.
function resolveColor01(cssColor) {
  const el = document.createElement('div')
  el.style.color = cssColor
  document.body.appendChild(el)
  const rgb = getComputedStyle(el).color
  document.body.removeChild(el)
  const match = rgb.match(/[\d.]+/g) || [0, 0, 0]
  return [Number(match[0]) / 255, Number(match[1]) / 255, Number(match[2]) / 255]
}

// Maps an illustration's luminance to a two-stop gradient (shadow -> highlight),
// so a full-color scene reads as a black background with the goal's accent
// color picking out whatever was already bright in the original artwork.
export default function DuotoneFilter({ id, shadow = '#060606', highlight }) {
  const [sr, sg, sb] = useMemo(() => resolveColor01(shadow), [shadow])
  const [hr, hg, hb] = useMemo(() => resolveColor01(highlight), [highlight])
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id={id}>
          <feColorMatrix type="matrix" values="
            0.33 0.33 0.33 0 0
            0.33 0.33 0.33 0 0
            0.33 0.33 0.33 0 0
            0    0    0    1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={`${sr} ${hr}`} />
            <feFuncG type="table" tableValues={`${sg} ${hg}`} />
            <feFuncB type="table" tableValues={`${sb} ${hb}`} />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  )
}
