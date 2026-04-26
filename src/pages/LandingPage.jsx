import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Wallet, PiggyBank, CalendarDays, Shield, Zap, Download } from 'lucide-react'
import GradientMenu from '../components/ui/gradient-menu'

const ROSE    = '#a78bfa'
const PINK    = '#d4bbf8'
const BERRY   = '#0f1020'
const WHITE   = '#ffffff'
const MUTED   = 'rgba(212,187,248,0.5)'
const BORDER  = 'rgba(167,139,250,0.15)'

// ── OS-aware download button ──────────────────────────────────────────
function getOS() {
  const ua = navigator.userAgent
  if (ua.includes('Win'))    return 'windows'
  if (ua.includes('Mac'))    return 'mac'
  if (ua.includes('Linux'))  return 'linux'
  return 'unknown'
}

function DownloadButton() {
  const [url,     setUrl]     = useState(null)
  const [label,   setLabel]   = useState('Download app')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const os = getOS()
    const labels = { mac: 'Download for Mac', windows: 'Download for Windows', linux: 'Download for Linux', unknown: 'Download app' }
    setLabel(labels[os] ?? 'Download app')

    fetch('https://api.github.com/repos/getmomentumfinance/momentum-finance/releases/latest')
      .then(r => r.json())
      .then(release => {
        const assets = release.assets ?? []
        let asset
        if (os === 'mac')     asset = assets.find(a => a.name.endsWith('.dmg') && a.name.includes('aarch64'))
                                   ?? assets.find(a => a.name.endsWith('.dmg'))
        if (os === 'windows') asset = assets.find(a => a.name.endsWith('.msi'))
                                   ?? assets.find(a => a.name.endsWith('.exe'))
        if (os === 'linux')   asset = assets.find(a => a.name.endsWith('.AppImage'))
                                   ?? assets.find(a => a.name.endsWith('.deb'))
        if (!asset)           asset = assets[0]
        setUrl(asset?.browser_download_url ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const FALLBACK = 'https://github.com/getmomentumfinance/momentum-finance/releases/latest'

  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(167,139,250,0.25)',
    color: WHITE, textDecoration: 'none',
    transition: 'border-color .18s, background .18s',
    opacity: loading ? 0.5 : 1,
  }

  return (
    <a
      href={url ?? FALLBACK}
      style={btnStyle}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(167,139,250,0.12)'; e.currentTarget.style.borderColor='rgba(167,139,250,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(167,139,250,0.25)' }}
    >
      <Download size={14} /> {loading ? 'Loading…' : label}
    </a>
  )
}

// ── 3D tilt card ─────────────────────────────────────────────────────
function TiltCard({ gradient, number, name, expiry, width = 260, height = 163, style: extraStyle = {} }) {
  const [tilt,  setTilt]  = useState({ x: 0, y: 0 })
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })
  const ref = useRef(null)

  const onMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect(); if (!rect) return
    const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)
    const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)
    setTilt({ x: dy * -8, y: dx * 8 })
    setGlare({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100, opacity: 0.18 })
  }, [])
  const onLeave = useCallback(() => { setTilt({ x: 0, y: 0 }); setGlare({ x: 50, y: 50, opacity: 0 }) }, [])

  return (
    <div style={{ perspective: 800, ...extraStyle }}>
      <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{
        width, height, borderRadius: 18, padding: '18px 22px',
        background: gradient, overflow: 'hidden', position: 'relative',
        boxShadow: tilt.x !== 0 ? '0 40px 70px rgba(0,0,0,0.55)' : '0 24px 48px rgba(0,0,0,0.45)',
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 ? 'transform 0.5s cubic-bezier(0.23,1,0.32,1)' : 'transform 0.08s linear',
        willChange: 'transform',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none', background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 65%)` }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ width: 32, height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.3)' }} />
          <div style={{ display: 'flex' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginLeft: -7 }} />
          </div>
        </div>
        <p style={{ position: 'relative', zIndex: 1, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.8)', margin: '0 0 12px', fontFamily: 'monospace' }}>{number}</p>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Card Holder</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }}>{name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expires</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }}>{expiry}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = '#181929'
    document.documentElement.style.background = '#181929'
    const style = document.createElement('style')
    style.textContent = `
      @keyframes float1 { 0%,100% { transform: rotate(-14deg) translateY(0); } 50% { transform: rotate(-14deg) translateY(-8px); } }
      @keyframes float2 { 0%,100% { transform: rotate(-2deg) translateY(0); }  50% { transform: rotate(-2deg) translateY(-12px); } }
      @keyframes float3 { 0%,100% { transform: rotate(12deg) translateY(0); }  50% { transform: rotate(12deg) translateY(-6px); } }
      @keyframes chipFloat1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      @keyframes chipFloat2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
    `
    document.head.appendChild(style)
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 55% 35%, #2a2b45 0%, #181929 55%, #0f1020 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit',
    }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px clamp(24px,5vw,64px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${BERRY}, ${ROSE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/momentum_transparant.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: WHITE }}>Momentum</span>
        </div>
        <GradientMenu />
      </nav>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 clamp(24px,5vw,64px)', gap: 'clamp(32px,4vw,64px)', overflow: 'hidden' }}>

        {/* Left — text + CTA */}
        <div style={{ flex: '1 1 360px', maxWidth: 520, zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, marginBottom: 20 }}>
            All-in-one personal finance
          </p>
          <h1 style={{
            fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.03em',
            fontSize: 'clamp(2.4rem,5.5vw,4.2rem)',
            color: WHITE, margin: '0 0 20px',
          }}>
            Smart and simple<br />
            <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: PINK }}>personal finance</em>
          </h1>
          <p style={{ fontSize: 'clamp(13px,1.4vw,16px)', lineHeight: 1.7, color: MUTED, maxWidth: 400, margin: '0 0 36px' }}>
            Track every transaction, beat every budget, and grow toward the goals that actually matter — free, forever.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700,
              background: `linear-gradient(135deg, ${PINK}, ${ROSE})`, color: BERRY,
              textDecoration: 'none', transition: 'opacity .18s, transform .15s',
              boxShadow: '0 0 24px rgba(167,139,250,0.4)',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1)' }}>
              Use in browser <ArrowRight size={14} />
            </Link>
            <DownloadButton />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginTop: 4 }}>
              {[{ Icon: Shield, t: 'Private' }, { Icon: Zap, t: 'Always free' }].map(({ Icon, t }) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={12} color={MUTED} />
                  <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32 }}>
            {[
              { Icon: BarChart3, label: 'Analytics' },
              { Icon: Wallet,    label: 'Budgets' },
              { Icon: PiggyBank, label: 'Savings' },
              { Icon: CalendarDays, label: 'Bills' },
            ].map(({ Icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: 'rgba(167,139,250,0.08)', border: `1px solid ${BORDER}`,
                color: 'rgba(212,187,248,0.7)',
              }}>
                <Icon size={12} color={ROSE} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right — cards stack */}
        <div style={{ flex: '1 1 340px', position: 'relative', height: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 280, height: 180 }}>
            <TiltCard
              gradient="linear-gradient(140deg, #d4a5c0 0%, #a77693 60%, #7d5070 100%)"
              number="•••• •••• •••• 3812" name="A. Johnson" expiry="09/27"
              width={220} height={138}
              style={{ position: 'absolute', left: '-8%', top: 40, animation: 'float1 5s ease-in-out infinite', zIndex: 1 }}
            />
            <TiltCard
              gradient="linear-gradient(140deg, #7c3aed 0%, #4338ca 100%)"
              number="•••• •••• •••• 5524" name="S. Lambert" expiry="12/28"
              width={260} height={163}
              style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', animation: 'float2 6s ease-in-out infinite', zIndex: 3 }}
            />
            <TiltCard
              gradient="linear-gradient(140deg, #0ea5e9 0%, #1d4ed8 100%)"
              number="•••• •••• •••• 9073" name="M. Williams" expiry="03/26"
              width={220} height={138}
              style={{ position: 'absolute', right: '-8%', top: 36, animation: 'float3 7s ease-in-out infinite 0.5s', zIndex: 2 }}
            />
          </div>
        </div>
      </div>

      {/* ── Footer strip ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '14px clamp(24px,5vw,64px)', flexShrink: 0, borderTop: '1px solid rgba(167,139,250,0.07)' }}>
        <span style={{ fontSize: 11, color: 'rgba(212,187,248,0.25)' }}>© {new Date().getFullYear()} Momentum Finance</span>
        <span style={{ fontSize: 11, color: 'rgba(212,187,248,0.25)' }}>·</span>
        <span style={{ fontSize: 11, color: 'rgba(212,187,248,0.25)' }}>Free forever</span>
        <span style={{ fontSize: 11, color: 'rgba(212,187,248,0.25)' }}>·</span>
        <span style={{ fontSize: 11, color: 'rgba(212,187,248,0.25)' }}>Private & secure</span>
      </div>
    </div>
  )
}
