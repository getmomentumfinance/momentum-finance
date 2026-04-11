// ─────────────────────────────────────────────────────────────
//  Color palette — single source of truth for JS + CSS
//  CSS variables are generated from these values in index.css
// ─────────────────────────────────────────────────────────────

export function hexToHue(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0)
         : max === g ? (b - r) / d + 2
                     : (r - g) / d + 4
  return (h / 6) * 360
}

export function avgHue(gradientValue) {
  const hexes = [...gradientValue.matchAll(/#[0-9a-fA-F]{6}/g)].map(m => m[0])
  if (!hexes.length) return 0
  const rads = hexes.map(h => hexToHue(h) * Math.PI / 180)
  const sin  = rads.reduce((s, r) => s + Math.sin(r), 0) / rads.length
  const cos  = rads.reduce((s, r) => s + Math.cos(r), 0) / rads.length
  const deg  = Math.atan2(sin, cos) * 180 / Math.PI
  return deg < 0 ? deg + 360 : deg
}

export const GRADIENTS = [
  { name: 'Cotton',              value: 'linear-gradient(135deg,#e0bbe4,#bae1ff)' },
  { name: 'Mauve',               value: 'linear-gradient(135deg,#a77693,#174871)' },
  { name: 'Spectrum',            value: 'linear-gradient(135deg,#ded1c6,#a77693,#174871)' },
  { name: 'Hazy',                value: 'linear-gradient(135deg,#563734,#cbb6c1)' },
  { name: 'Blossom',             value: 'linear-gradient(135deg,#986798,#e7d2ac)' },
  { name: 'Mint',                value: 'linear-gradient(135deg,#8c9f96,#5b5c5e)' },
  { name: 'Blush',               value: 'linear-gradient(135deg,#f6c4ed,#e1dae6)' },
  { name: 'Silver',              value: 'linear-gradient(135deg,#6d90b9,#bbc7dc)' },
  { name: 'Slate',               value: 'linear-gradient(135deg,#a4c6b8,#5e435d)' },
  { name: 'Teal Blush',          value: 'linear-gradient(135deg,#a4c6b8,#f6c4ed)' },
  { name: 'Flamingo',            value: 'linear-gradient(135deg,#dc5863,#e790d2,#b19bad)' },
  { name: 'Forest',              value: 'linear-gradient(315deg,#7abb75,#253e19)' },
  { name: 'Metal',               value: 'linear-gradient(315deg,#141e30,#35577d)' },
  { name: 'Spring',              value: 'linear-gradient(315deg,#36574e,#e1b270)' },
  { name: 'Pastel',              value: 'linear-gradient(315deg,#6d90b9,#93b5c6,#e4dbdc,#ffe3e3)'},
  { name: 'Sunrise',             value: 'linear-gradient(315deg,#e1b270,#e0bbe4)' },
  { name: 'Spacy',               value: 'linear-gradient(315deg,#1E1E2D,#1F2333)' },
  { name: 'Dream',               value: 'radial-gradient( circle farthest-corner at 6.3% 21.8%,  #696eff 0%, #f8acff 90% )' },
  { name: 'Twilight',            value: 'linear-gradient(315deg,#432371,#faae7b)' },
  { name: 'Violet Breeze',       value: 'radial-gradient( circle farthest-corner at 6.3% 21.8%,  #d8bdbe 0%, #bd90e3 90% )' },
  { name: 'Powder Bloom',        value: 'linear-gradient(315deg,#caefd7,#f6c4ed,#bae1ff)' },
  { name: 'Peach',               value: 'linear-gradient(315deg,#e1b270,#cc575f)' },
  { name: 'Bubble',              value: 'linear-gradient(315deg,#bae1ff,#696eff,#e0bbe4)' },
  { name: 'Lavender ',           value: 'radial-gradient( circle farthest-corner at 6.3% 21.8%,  #96d4ca 0%, #5e435d 90% )' },
  { name: 'Apricot',             value: 'linear-gradient(315deg,#faae7b, #a86d5c)' },





].sort((a, b) => avgHue(a.value) - avgHue(b.value))

// All unique stop colors derived from GRADIENTS, sorted by hue
export const SOLIDS = [...new Set(
  GRADIENTS.flatMap(g =>
    [...g.value.matchAll(/#[0-9a-fA-F]{6}/gi)].map(m => m[0].toLowerCase())
  )
)].sort((a, b) => hexToHue(a) - hexToHue(b))
