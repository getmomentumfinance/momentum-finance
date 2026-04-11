import { toPng } from 'html-to-image'

/**
 * Temporarily resolves color-mix() in inline styles so canvas renderers can
 * handle them. CSS variables set via JS on :root (e.g. --color-calendar-heatmap)
 * are available to the probe because it lives in the live document.
 * Returns a function that reverts all changes.
 */
function resolveColorMixes(root) {
  const reverts = []
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none'
  document.body.appendChild(probe)

  root.querySelectorAll('[style]').forEach(el => {
    for (const prop of ['background', 'backgroundColor']) {
      const val = el.style[prop]
      if (!val || !val.includes('color-mix')) continue
      probe.style.background = 'none'
      probe.style[prop] = val
      const resolved = getComputedStyle(probe).backgroundColor
      if (resolved && !resolved.includes('color-mix')) {
        reverts.push({ el, prop, original: val })
        el.style[prop] = resolved
      }
    }
  })

  document.body.removeChild(probe)
  return () => reverts.forEach(({ el, prop, original }) => { el.style[prop] = original })
}

/**
 * Captures the element with id="page-content" and downloads it as a PNG.
 * @param {string} filename  Base filename (date appended automatically)
 */
export async function exportPageAsPng(filename = 'page') {
  const el = document.getElementById('page-content')
  if (!el) return

  const revert = resolveColorMixes(el)

  try {
    const dataUrl = await toPng(el, {
      cacheBust: true,
      backgroundColor: '#0f0f1a',
      pixelRatio: 2,
      width: el.offsetWidth,
      height: el.offsetHeight,
    })

    const link = document.createElement('a')
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    revert()
  }
}
