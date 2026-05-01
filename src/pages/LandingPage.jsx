import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Download, TrendingUp, Wallet, PiggyBank, BarChart3, Shield, Zap } from 'lucide-react'
import { gsap } from 'gsap'

const WHITE  = '#ffffff'
const MUTED  = 'rgba(255,255,255,0.35)'
const DIM    = 'rgba(255,255,255,0.15)'
const ACCENT = '#a78bfa'

// ── OS-aware download button ──────────────────────────────────────────
function getOS() {
  const ua = navigator.userAgent
  if (ua.includes('Win'))    return 'windows'
  if (ua.includes('Mac'))    return 'mac'
  if (ua.includes('Linux'))  return 'linux'
  return 'unknown'
}

function useDownloadUrl() {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    fetch('https://api.github.com/repos/getmomentumfinance/momentum-finance/releases/latest')
      .then(r => r.json())
      .then(release => {
        const os = getOS()
        const assets = release.assets ?? []
        let asset
        if (os === 'mac')     asset = assets.find(a => a.name.endsWith('.dmg') && a.name.includes('aarch64')) ?? assets.find(a => a.name.endsWith('.dmg'))
        if (os === 'windows') asset = assets.find(a => a.name.endsWith('.msi')) ?? assets.find(a => a.name.endsWith('.exe'))
        if (os === 'linux')   asset = assets.find(a => a.name.endsWith('.AppImage')) ?? assets.find(a => a.name.endsWith('.deb'))
        if (!asset) asset = assets[0]
        setUrl(asset?.browser_download_url ?? null)
      }).catch(() => {})
  }, [])
  return url ?? 'https://github.com/getmomentumfinance/momentum-finance/releases/latest'
}

// ── Floating finance node ─────────────────────────────────────────────
function Node({ label, value, icon: Icon, style: s }) {
  const ref = useRef(null)
  return (
    <div ref={ref} style={{
      position: 'absolute', display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 99,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      ...s,
    }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={11} color={ACCENT} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 9, color: DIM, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: WHITE }}>{value}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const downloadUrl = useDownloadUrl()

  // Refs
  const badgeRef   = useRef(null)
  const titleRef   = useRef(null)
  const subRef     = useRef(null)
  const ctaRef     = useRef(null)
  const trustRef   = useRef(null)
  const nodesRef   = useRef(null)
  const navRef     = useRef(null)
  const primaryBtn = useRef(null)
  const dlBtn      = useRef(null)

  // Background colour
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#060608'
    document.documentElement.style.background = '#060608'
    return () => { document.body.style.background = prev; document.documentElement.style.background = '' }
  }, [])

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Nodes float up
      if (nodesRef.current) {
        gsap.from(nodesRef.current.children, {
          y: 40, opacity: 0, scale: 0.85, duration: 1,
          ease: 'power3.out', stagger: 0.12, delay: 0.3,
        })
        // Continuous gentle float per node
        Array.from(nodesRef.current.children).forEach((el, i) => {
          gsap.to(el, {
            y: `+=${6 + i * 2}`, duration: 2.5 + i * 0.4,
            ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.3,
          })
        })
      }

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.from(navRef.current,   { y: -50, opacity: 0, duration: 0.7 })
        .from(badgeRef.current, { y: 30, opacity: 0, scale: 0.9, duration: 0.55 }, '-=0.35')
        .from(titleRef.current, { y: 70, opacity: 0, scale: 0.95, duration: 0.9 }, '-=0.4')
        .from(subRef.current,   { y: 30, opacity: 0, duration: 0.6 }, '-=0.55')
        .from(ctaRef.current,   { y: 24, opacity: 0, duration: 0.55 }, '-=0.4')
        .from(trustRef.current, { opacity: 0, duration: 0.5 }, '-=0.2')
    })
    return () => ctx.revert()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#060608', color: WHITE,
      fontFamily: 'inherit', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Ambient orb ───────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: '-15%', right: '-10%', width: '65vw', height: '75vh',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, rgba(109,40,217,0.08) 45%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-10%', width: '50vw', height: '60vh',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 65%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav ref={navRef} style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '22px clamp(24px,5vw,72px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1a1b2e,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/momentum_transparant.png" alt="" style={{ width: 18, objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>Momentum</span>
        </div>

        {/* Pill nav */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 6px', borderRadius: 99,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}>
          {['Features', 'Pricing', 'About'].map(item => (
            <span key={item} style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500,
              color: MUTED, cursor: 'default',
            }}
              onMouseEnter={e => gsap.to(e.currentTarget, { color: WHITE, duration: 0.15 })}
              onMouseLeave={e => gsap.to(e.currentTarget, { color: MUTED, duration: 0.2 })}
            >{item}</span>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/login" style={{
            fontSize: 13, fontWeight: 500, color: MUTED, textDecoration: 'none',
          }}
            onMouseEnter={e => gsap.to(e.currentTarget, { color: WHITE, duration: 0.15 })}
            onMouseLeave={e => gsap.to(e.currentTarget, { color: MUTED, duration: 0.2 })}
          >Sign in</Link>
          <Link to="/register" style={{
            padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: WHITE, textDecoration: 'none',
          }}
            onMouseEnter={e => gsap.to(e.currentTarget, { background: 'rgba(255,255,255,0.14)', duration: 0.2 })}
            onMouseLeave={e => gsap.to(e.currentTarget, { background: 'rgba(255,255,255,0.08)', duration: 0.2 })}
          >Create account</Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <main style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '40px clamp(24px,8vw,120px) 60px',
      }}>

        {/* Floating nodes */}
        <div ref={nodesRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Node label="Balance"   value="€2.431,50"  icon={Wallet}    style={{ top: '12%', left: '6%' }} />
          <Node label="Savings"   value="+€500,00"   icon={PiggyBank} style={{ top: '20%', right: '8%' }} />
          <Node label="Monthly"   value="€892,94"    icon={BarChart3} style={{ bottom: '28%', left: '4%' }} />
          <Node label="Budgets"   value="3 on track" icon={TrendingUp} style={{ bottom: '22%', right: '6%' }} />
        </div>

        {/* Badge */}
        <div ref={badgeRef} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 99, marginBottom: 32,
          background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
          fontSize: 12, fontWeight: 500, color: 'rgba(167,139,250,0.8)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
          All-in-one personal finance &nbsp;→
        </div>

        {/* Title */}
        <h1 ref={titleRef} style={{
          fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.0,
          fontSize: 'clamp(3rem,7.5vw,6.5rem)',
          margin: '0 0 24px', maxWidth: 860,
        }}>
          Track every euro.{' '}
          <span style={{ color: 'rgba(255,255,255,0.28)', fontStyle: 'italic', fontFamily: 'Georgia,serif' }}>
            Beat every budget.
          </span>
        </h1>

        {/* Subtitle */}
        <p ref={subRef} style={{
          fontSize: 'clamp(14px,1.6vw,18px)', lineHeight: 1.7,
          color: MUTED, maxWidth: 480, margin: '0 0 40px',
        }}>
          Your finances, beautifully organised. Free forever, private by design.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link ref={primaryBtn} to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700,
            background: WHITE, color: '#060608', textDecoration: 'none',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
          }}
            onMouseEnter={() => gsap.to(primaryBtn.current, { scale: 1.05, y: -2, boxShadow: '0 8px 32px rgba(255,255,255,0.15)', duration: 0.2, ease: 'power2.out' })}
            onMouseLeave={() => gsap.to(primaryBtn.current, { scale: 1, y: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.1)', duration: 0.5, ease: 'elastic.out(1,0.4)' })}
          >
            Open app <ArrowUpRight size={14} />
          </Link>
          <a ref={dlBtn} href={downloadUrl} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 600,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: WHITE, textDecoration: 'none',
          }}
            onMouseEnter={() => gsap.to(dlBtn.current, { scale: 1.04, y: -2, background: 'rgba(255,255,255,0.1)', duration: 0.2 })}
            onMouseLeave={() => gsap.to(dlBtn.current, { scale: 1, y: 0, background: 'rgba(255,255,255,0.06)', duration: 0.4, ease: 'elastic.out(1,0.4)' })}
          >
            <Download size={13} /> Download
          </a>
        </div>

        {/* Trust line */}
        <div ref={trustRef} style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 32 }}>
          {[{ Icon: Shield, label: 'Private' }, { Icon: Zap, label: 'Always free' }].map(({ Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon size={11} color={DIM} />
              <span style={{ fontSize: 11, color: DIM, fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer strip ─────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
        padding: '16px clamp(24px,5vw,72px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {['© 2026 Momentum', 'Free forever', 'Private & secure'].map((t, i) => (
          <>
            {i > 0 && <span key={`dot-${i}`} style={{ fontSize: 10, color: 'rgba(255,255,255,0.1)' }}>·</span>}
            <span key={t} style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{t}</span>
          </>
        ))}
      </footer>
    </div>
  )
}
