export const DEFAULT_DESIGN_ID = 'cosmos'

// CSS vars and animation styles live in index.css under html[data-design="..."] blocks.
// Edit colors there. Only UI metadata needed here.

export const DESIGNS = [
  {
    id: 'cosmos',
    name: 'Cosmos',
    description: 'Default dark space',
    previewBg: 'linear-gradient(135deg, #3b3156 0%, #1e2a4a 100%)',
    animPreviewClass: '',
  },
  {
    id: 'stars',
    name: 'Stars',
    description: 'Black sky, twinkling stars',
    previewBg: '#02020a',
    animPreviewClass: 'design-stars-preview',
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Clean light mode',
    previewBg: 'linear-gradient(160deg, #efefed 0%, #e4e4e2 100%)',
    animPreviewClass: '',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Dark forest, warm rose',
    previewBg: 'linear-gradient(135deg, #141d1a 0%, #1e2b27 100%)',
    animPreviewClass: '',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Dark mode, warm pink tones',
    previewBg: 'linear-gradient(135deg, #1e0f14 0%, #2a1520 100%)',
    animPreviewClass: '',
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Dark mode, cool blue tones',
    previewBg: 'linear-gradient(135deg, #0e1520 0%, #152030 100%)',
    animPreviewClass: '',
  },
]

// Component vars for the Custom design editor
export const CUSTOM_DESIGN_VARS = [
  { key: 'bgFrom',   label: 'Background start', hasOpacity: false },
  { key: 'bgTo',     label: 'Background end',   hasOpacity: false },
  { key: 'dashCard', label: 'Cards',             hasOpacity: true  },
  { key: 'navBlur',  label: 'Nav',               hasOpacity: true  },
  { key: 'surface',  label: 'Surface',           hasOpacity: true  },
  { key: 'muted',    label: 'Muted text',        hasOpacity: false },
  { key: 'border',   label: 'Borders',           hasOpacity: true  },
  { key: 'input',    label: 'Inputs',            hasOpacity: true  },
]

export const CUSTOM_DESIGN_DEFAULTS = {
  bgFrom:   { hex: '#3b3156', opacity: 1    },
  bgTo:     { hex: '#1e2a4a', opacity: 1    },
  dashCard: { hex: '#1f2333', opacity: 0.85 },
  navBlur:  { hex: '#1e1e2d', opacity: 0.60 },
  surface:  { hex: '#252636', opacity: 0.55 },
  muted:    { hex: '#9ca3af', opacity: 1    },
  border:   { hex: '#ffffff', opacity: 0.10 },
  input:    { hex: '#14151e', opacity: 0.70 },
}
