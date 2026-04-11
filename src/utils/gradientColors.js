/** Parse hex color stops out of a CSS gradient string */
function parseStops(css) {
  return [...css.matchAll(/#[0-9a-fA-F]{6}/gi)].map(m => m[0].toLowerCase())
}

/** Linear interpolation between two hex colors at t ∈ [0, 1] */
function lerpHex(hex1, hex2, t) {
  const parse = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]
  const [r1,g1,b1] = parse(hex1)
  const [r2,g2,b2] = parse(hex2)
  const rh = Math.round(r1 + (r2-r1)*t).toString(16).padStart(2,'0')
  const gh = Math.round(g1 + (g2-g1)*t).toString(16).padStart(2,'0')
  const bh = Math.round(b1 + (b2-b1)*t).toString(16).padStart(2,'0')
  return `#${rh}${gh}${bh}`
}

/**
 * Extract n evenly-spaced hex colors from a CSS gradient string.
 * n=1 → first stop, n=2 → first + last, etc.
 */
export function extractNColors(gradientCss, n) {
  if (!gradientCss || n <= 0) return []
  const stops = parseStops(gradientCss)
  if (stops.length === 0) return []
  if (n === 1) return [stops[0]]

  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)                     // 0 … 1
    const pos = t * (stops.length - 1)         // position in stop array
    const lo  = Math.min(Math.floor(pos), stops.length - 2)
    const frac = pos - lo
    return lerpHex(stops[lo], stops[lo + 1], frac)
  })
}
