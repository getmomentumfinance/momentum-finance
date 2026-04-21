import { useState, useRef, useCallback } from 'react'
import { Palette } from 'lucide-react'
import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from './CardCustomizationPopup'

const FALLBACK_GRADIENTS = [
  'linear-gradient(140deg, #7c3aed 0%, #4338ca 100%)',
  'linear-gradient(140deg, #c94878 0%, #4a0d28 100%)',
  'linear-gradient(140deg, #0ea5e9 0%, #1d4ed8 100%)',
  'linear-gradient(140deg, #10b981 0%, #065f46 100%)',
  'linear-gradient(140deg, #fb7185 0%, #f97316 100%)',
  'linear-gradient(140deg, #f59e0b 0%, #92400e 100%)',
  'linear-gradient(140deg, #64748b 0%, #1e293b 100%)',
]

function BankLogo({ bank, size = 22 }) {
  const [src, setSrc] = useState(() => {
    if (bank?.logo_url) return bank.logo_url
    if (bank?.domain)   return `https://logo.clearbit.com/${bank.domain}`
    return null
  })
  const [failed, setFailed] = useState(0)

  if (!bank) return null

  const initials = bank.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  function handleError() {
    if (failed === 0 && bank?.domain) {
      setSrc(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${bank.domain}&size=64`)
      setFailed(1)
    } else {
      setSrc(null); setFailed(2)
    }
  }

  if (!src || failed === 2) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 7, fontWeight: 700, color: '#fff', flexShrink: 0,
      }}>{initials}</div>
    )
  }

  return (
    <img
      src={src} alt={bank.name} onError={handleError}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'contain', background: 'white', flexShrink: 0 }}
    />
  )
}

export default function AnalyticsVisualCard({ card, bank, exp, inc, balance, periodLabel, fmt, idx = 0, interactive = true }) {
  const label = `analytics-card-${card.id}`
  const c = useCardCustomization(label)

  const gradient = c.enableColor && c.selectedColor
    ? c.selectedColor
    : FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]

  // 3D tilt + glare state
  const [tilt,  setTilt]  = useState({ x: 0, y: 0 })
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })
  const cardRef = useRef(null)

  const handleMouseMove = useCallback((e) => {
    if (!interactive) return
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2) // -1 to 1
    const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2) // -1 to 1
    setTilt({ x: dy * -7, y: dx * 7 })
    setGlare({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
      opacity: 0.18,
    })
  }, [interactive])

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
    setGlare({ x: 50, y: 50, opacity: 0 })
  }, [])

  // Merge the card's btnRef with our local cardRef
  const setRefs = useCallback((el) => {
    cardRef.current = el
    if (typeof c.btnRef === 'function') c.btnRef(el)
    else if (c.btnRef) c.btnRef.current = el
  }, [c.btnRef])

  return (
    <>
      <div className="flex flex-col gap-2 group" style={{ perspective: 800 }}>
        {/* Visual credit card */}
        <div
          ref={setRefs}
          className="relative select-none"
          style={{
            width: 260, height: 163, borderRadius: 18, padding: '18px 22px', overflow: 'hidden',
            boxShadow: tilt.x !== 0 || tilt.y !== 0
              ? '0 40px 70px rgba(0,0,0,0.55)'
              : '0 28px 56px rgba(0,0,0,0.4)',
            border: c.showBorder ? '1px solid var(--color-border)' : 'none',
            cursor: interactive ? 'pointer' : 'default',
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: tilt.x === 0 && tilt.y === 0
              ? 'transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s'
              : 'transform 0.08s linear, box-shadow 0.08s',
            willChange: 'transform',
          }}
          onClick={interactive ? c.toggleOpen : undefined}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Gradient layer */}
          <div className="absolute inset-0" style={{ background: gradient, opacity: c.enableColor ? c.opacity / 100 : 1 }} />
          {/* Dark overlay */}
          {c.enableColor && c.darkOverlay > 0 && (
            <div className="absolute inset-0 bg-black" style={{ opacity: c.darkOverlay / 100 }} />
          )}
          {/* Static glare blob */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          {/* Dynamic mouse-follow glare */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none',
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 65%)`,
            transition: 'opacity 0.2s',
          }} />

          {/* Row 1: chip left, bank logo + circles right */}
          <div className="relative z-10" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ width: 34, height: 26, borderRadius: 5, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {bank && <BankLogo bank={bank} size={20} />}
              <div style={{ display: 'flex' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginLeft: -8 }} />
              </div>
            </div>
          </div>

          {/* Main amount — balance if available, else monthly expense */}
          <p className="relative z-10" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.95)', margin: '0 0 14px' }}>
            {balance != null ? fmt(balance, 2) : fmt(exp, 0)}
          </p>

          {/* Name + secondary info */}
          <div className="relative z-10" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Card</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.02em' }}>{card.name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {balance != null ? 'Spent' : inc > 0 ? 'Income' : 'Period'}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                {balance != null ? fmt(exp, 0) : inc > 0 ? fmt(inc, 0) : periodLabel}
              </p>
            </div>
          </div>

          {/* Palette hint — visible on hover, only when interactive */}
          {interactive && (
            <div className="absolute z-10 opacity-0 group-hover:opacity-50 transition-opacity" style={{ bottom: 10, right: 12 }}>
              <Palette size={11} color="#fff" />
            </div>
          )}
        </div>
      </div>

      {c.open && (
        <CardCustomizationPopup
          popupRef={c.popupRef} pos={c.pos}
          enableColor={c.enableColor}     setEnableColor={c.setEnableColor}
          showBorder={c.showBorder}       setShowBorder={c.setShowBorder}
          tab={c.tab}                     setTab={c.setTab}
          selectedColor={c.selectedColor} setSelectedColor={c.setSelectedColor}
          opacity={c.opacity}             setOpacity={c.setOpacity}
          darkOverlay={c.darkOverlay}     setDarkOverlay={c.setDarkOverlay}
          colors={c.colors}
        />
      )}
    </>
  )
}
