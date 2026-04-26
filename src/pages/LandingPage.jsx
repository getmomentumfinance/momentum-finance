import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Wallet, PiggyBank,
  CalendarDays, Receipt, CreditCard, Check,
  TrendingUp, Shield, Zap, Target, Bell, LineChart,
} from 'lucide-react'
import GradientMenu from '../components/ui/gradient-menu'
import homeImg from '../assets/home.png'
// ── Palette ─────────────────────────────────────────────────────────
const HERO_BG   = 'radial-gradient(ellipse at 60% 30%, #2a2b45 0%, #181929 60%, #0f1020 100%)'
const DARK_BG   = '#181929'
const PINK      = '#d4bbf8'   // light lavender accent
const ROSE      = '#a78bfa'   // violet accent
const BERRY     = '#0f1020'   // darker surface
const WHITE     = '#ffffff'
const MUTED_D   = 'rgba(212,187,248,0.55)'
const MUTED_L   = 'rgba(212,187,248,0.45)'
const BORDER_L  = 'rgba(167,139,250,0.15)'

// ── Scroll reveal ─────────────────────────────────────────────────
function ScrollReveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateY(0px)' : 'translateY(36px)',
      transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Big typography moment ──────────────────────────────────────────
function BigTextSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <section ref={ref} style={{ background: '#0a0a0f', padding: 'clamp(80px,12vw,140px) clamp(24px,6vw,72px)', position: 'relative', overflow: 'hidden' }}>
      {/* Animated wave top-right */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 360, height: 260, opacity: 0.55, pointerEvents: 'none' }}>
        <svg viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
            <path key={i}
              d={`M ${360 - i * 12} 0 Q ${280 - i * 8} ${80 + i * 6} ${200 - i * 5} ${130 + i * 4} T ${60 - i * 3} 260`}
              stroke={`rgba(120,80,220,${0.35 - i * 0.025})`}
              strokeWidth="1.2"
              fill="none"
              style={{ animation: `waveMove${i % 3} ${3.5 + i * 0.3}s ease-in-out infinite alternate` }}
            />
          ))}
        </svg>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h2 style={{
          fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.0,
          fontSize: 'clamp(3rem,8vw,6.5rem)', color: '#fff', margin: 0,
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(48px)',
          transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)',
        }}>
          Take control<br />
          <em style={{
            fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif',
            color: PINK, fontWeight: 400,
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1) 0.15s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.15s',
            display: 'inline-block',
          }}>of your money.</em>
        </h2>
        <p style={{
          fontSize: 'clamp(14px,1.6vw,18px)', color: MUTED_D, maxWidth: 480, marginTop: 32,
          lineHeight: 1.7, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
        }}>
          Every euro tracked. Every goal in reach. Built for people who want clarity without complexity.
        </p>
      </div>
    </section>
  )
}

// ── Floating feature cards on scroll ──────────────────────────────
const FEATURE_CARDS = [
  { Icon: BarChart3,    title: 'Deep Analytics',       desc: 'Drill into any chart. See the transactions behind every number.',            rotation: -8,  x: '2%',  y: 60  },
  { Icon: Target,       title: 'Savings Goals',         desc: 'Set a target, plan contributions, and watch your progress grow.',            rotation: 5,   x: '28%', y: 0   },
  { Icon: Bell,         title: 'Bill Reminders',        desc: 'Never miss a payment. Recurring bills tracked and alerted automatically.',   rotation: -4,  x: '55%', y: 80  },
  { Icon: Wallet,       title: 'Smart Budgets',         desc: 'Category budgets with automatic rollover and real-time tracking.',           rotation: 7,   x: '72%', y: 10  },
  { Icon: LineChart,    title: 'Portfolio Tracking',    desc: 'Monitor your investments and net worth alongside daily spending.',            rotation: -6,  x: '18%', y: 200 },
  { Icon: CreditCard,   title: 'Multiple Cards',        desc: 'All your accounts in one view — debit, credit, cash and savings.',          rotation: 4,   x: '62%', y: 230 },
]

function FloatingCardsSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el); return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref} style={{ background: '#0a0a0f', padding: 'clamp(60px,8vw,100px) clamp(24px,6vw,72px)', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: 80 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>Everything you need</p>
        <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#fff', margin: 0 }}>
          One app.<br /><em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: PINK, fontWeight: 400 }}>Every feature.</em>
        </h2>
      </div>

      {/* Cards grid — scattered layout */}
      <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', height: 420 }}>
        {FEATURE_CARDS.map(({ Icon, title, desc, rotation, x, y }, i) => (
          <div key={title} style={{
            position: 'absolute', left: x, top: y,
            width: 'clamp(180px, 22vw, 230px)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: 20,
            padding: '20px 20px 22px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            transform: visible
              ? `rotate(${rotation}deg) translateY(0px)`
              : `rotate(${rotation}deg) translateY(${i % 2 === 0 ? '60px' : '-60px'}) translateX(${i % 3 === 0 ? '-40px' : '40px'})`,
            opacity: visible ? 1 : 0,
            transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms`,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, marginBottom: 14,
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={17} color={ROSE} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>{title}</p>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: MUTED_L, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Credit / Debit card — with 3D tilt + glare ────────────────────
function Card({ gradient, number, name, expiry, width = 260, height = 163 }) {
  const [tilt,  setTilt]  = useState({ x: 0, y: 0 })
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })
  const cardRef = useRef(null)

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)
    const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)
    setTilt({ x: dy * -8, y: dx * 8 })
    setGlare({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
      opacity: 0.2,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
    setGlare({ x: 50, y: 50, opacity: 0 })
  }, [])

  return (
    <div style={{ perspective: 800 }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width, height, borderRadius: 18, padding: '18px 22px',
          background: gradient, overflow: 'hidden', position: 'relative',
          boxShadow: tilt.x !== 0 || tilt.y !== 0
            ? '0 40px 70px rgba(0,0,0,0.55)'
            : '0 28px 56px rgba(0,0,0,0.4)',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: tilt.x === 0 && tilt.y === 0
            ? 'transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s'
            : 'transform 0.08s linear, box-shadow 0.08s',
          willChange: 'transform',
        }}
      >
        {/* Static glare blob */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        {/* Mouse-follow glare */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none',
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 65%)`,
        }} />

        {/* Row 1: chip + circles */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ width: 34, height: 26, borderRadius: 5, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }} />
          <div style={{ display: 'flex' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginLeft: -8 }} />
          </div>
        </div>

        {/* Card number */}
        <p style={{ position: 'relative', zIndex: 1, fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.85)', margin: '0 0 14px', fontFamily: '"Courier New", monospace' }}>
          {number}
        </p>

        {/* Name + expiry */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Card Holder</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.02em' }}>{name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expires</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>{expiry}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Cards showcase ─────────────────────────────────────────────────
function CardsShowcase() {
  return (
    <div style={{ position: 'relative', height: 240, maxWidth: 720, width: '100%', margin: '0 auto' }}>
      {/* Left card */}
      <div style={{ position: 'absolute', left: '2%', top: 55, transform: 'rotate(-14deg)', zIndex: 1, opacity: 0.38 }}>
        <Card
          gradient="linear-gradient(140deg, #d4a5c0 0%, #a77693 60%, #7d5070 100%)"
          number="•••• •••• •••• 3812"
          name="A. Johnson"
          expiry="09/27"
          width={232} height={146}
        />
      </div>
      {/* Center card */}
      <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%) rotate(-2deg)', zIndex: 3 }}>
        <Card
          gradient="linear-gradient(140deg, #7c3aed 0%, #4338ca 100%)"
          number="•••• •••• •••• 5524"
          name="S. Lambert"
          expiry="12/28"
        />
      </div>
      {/* Right card */}
      <div style={{ position: 'absolute', right: '2%', top: 48, transform: 'rotate(12deg)', zIndex: 2, opacity: 0.38 }}>
        <Card
          gradient="linear-gradient(140deg, #0ea5e9 0%, #1d4ed8 100%)"
          number="•••• •••• •••• 9073"
          name="M. Williams"
          expiry="03/26"
          width={232} height={146}
        />
      </div>
    </div>
  )
}

// ── Mini payment receipt mockup ────────────────────────────────────
function PaymentMockup() {
  return (
    <div style={{ maxWidth: 340, width: '100%' }}>
      {/* Card 1: transaction */}
      <div style={{
        background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: `1px solid ${BORDER_L}`, marginBottom: 16,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${ROSE}, ${BERRY})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14 }}>🛒</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: WHITE, margin: 0 }}>Groceries</p>
              <p style={{ fontSize: 11, color: MUTED_D, margin: 0 }}>Today · 14:32</p>
            </div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#f08090' }}>-€42.50</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 10, color: MUTED_D, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: WHITE, margin: 0 }}>Food & Drink</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: MUTED_D, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Budget used</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: WHITE, margin: 0 }}>68%</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: MUTED_D, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Remaining</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6ee7a0', margin: 0 }}>€57.50</p>
          </div>
        </div>
        {/* Budget bar */}
        <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', width: '68%', borderRadius: 99, background: `linear-gradient(90deg, ${ROSE}, ${PINK})` }} />
        </div>
      </div>

      {/* Card 2: salary received */}
      <div style={{
        background: `linear-gradient(135deg, ${BERRY}, #a77693)`,
        borderRadius: 20, padding: 24,
        boxShadow: '0 8px 32px rgba(45,59,110,0.4)',
      }}>
        <p style={{ fontSize: 11, color: MUTED_D, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>You received</p>
        <p style={{ fontSize: 28, fontWeight: 900, color: WHITE, margin: '0 0 4px', letterSpacing: '-0.02em' }}>+€2,800.00</p>
        <p style={{ fontSize: 12, color: MUTED_D, margin: '0 0 16px' }}>Monthly salary · Employer NV</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7adc9a' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Completed · Dec 25, 2024</span>
        </div>
      </div>
    </div>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${BORDER_L}` }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>{q}</span>
        <span style={{ color: ROSE, fontSize: 20, lineHeight: 1, marginLeft: 16 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <p style={{ fontSize: 14, lineHeight: 1.75, color: MUTED_D, margin: '0 0 18px' }}>{a}</p>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = '#181929'
    document.documentElement.style.background = '#181929'

    const style = document.createElement('style')
    style.textContent = `
      @keyframes waveMove0 { from { d: path('M 360 0 Q 280 80 200 130 T 60 260'); } to { d: path('M 360 0 Q 300 100 210 120 T 50 260'); } }
      @keyframes waveMove1 { from { transform: translateY(0px); } to { transform: translateY(8px); } }
      @keyframes waveMove2 { from { transform: translateX(0px); } to { transform: translateX(-6px); } }
      @keyframes heroFloat  { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      @keyframes heroFloat2 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
    `
    document.head.appendChild(style)
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════════════
          NAV — transparent over hero
      ══════════════════════════════════════════════════ */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px clamp(24px, 6vw, 72px)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${BERRY}, ${ROSE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/momentum_transparant.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: WHITE }}>Momentum</span>
        </div>

        <GradientMenu />
      </nav>

      {/* ══════════════════════════════════════════════════
          HERO — dark
      ══════════════════════════════════════════════════ */}
      <section id="hero" style={{ background: HERO_BG, minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(100px,12vw,140px) clamp(24px,6vw,72px) clamp(64px,8vw,96px)', textAlign: 'center', overflow: 'hidden' }}>

        {/* Floating stat chips */}
        {/* Top-left: balance */}
        <div style={{ position: 'absolute', left: 'clamp(24px,7vw,100px)', top: '28%', animation: 'heroFloat 5s ease-in-out infinite', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 18px', textAlign: 'left', pointerEvents: 'none' }}>
          <p style={{ fontSize: 10, color: MUTED_D, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Net worth</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: WHITE, margin: '0 0 2px', letterSpacing: '-0.02em' }}>€48,650</p>
          <p style={{ fontSize: 11, color: '#6ee7a0', margin: 0, fontWeight: 600 }}>↑ 12.4% this month</p>
        </div>

        {/* Top-right: budget */}
        <div style={{ position: 'absolute', right: 'clamp(24px,7vw,100px)', top: '24%', animation: 'heroFloat2 6s ease-in-out infinite 1s', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 18px', textAlign: 'left', pointerEvents: 'none' }}>
          <p style={{ fontSize: 10, color: MUTED_D, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Food budget</p>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.1)', marginBottom: 6, width: 120 }}>
            <div style={{ height: '100%', width: '68%', borderRadius: 99, background: `linear-gradient(90deg, ${ROSE}, ${PINK})` }} />
          </div>
          <p style={{ fontSize: 11, color: MUTED_D, margin: 0 }}>€57.50 remaining</p>
        </div>

        {/* Bottom-left: transaction */}
        <div style={{ position: 'absolute', left: 'clamp(24px,6vw,80px)', bottom: '22%', animation: 'heroFloat 7s ease-in-out infinite 0.5s', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(110,231,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>💰</span>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: WHITE, margin: '0 0 1px' }}>Salary received</p>
            <p style={{ fontSize: 11, color: '#6ee7a0', margin: 0, fontWeight: 600 }}>+€2,800.00</p>
          </div>
        </div>

        {/* Bottom-right: savings */}
        <div style={{ position: 'absolute', right: 'clamp(24px,6vw,80px)', bottom: '26%', animation: 'heroFloat2 5.5s ease-in-out infinite 2s', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '10px 16px', textAlign: 'left', pointerEvents: 'none' }}>
          <p style={{ fontSize: 10, color: MUTED_D, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Savings goal</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: WHITE, margin: '0 0 2px' }}>€3,200 <span style={{ fontSize: 11, color: MUTED_D, fontWeight: 500 }}>/ €5,000</span></p>
          <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.1)', width: 110 }}>
            <div style={{ height: '100%', width: '64%', borderRadius: 99, background: `linear-gradient(90deg, #6ee7a0, ${ROSE})` }} />
          </div>
        </div>

        {/* Hero text */}
        <p style={{ position: 'relative', zIndex: 1, fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED_D, marginBottom: 18 }}>
          All-in-one personal finance
        </p>
        <h1 style={{
          position: 'relative', zIndex: 1,
          fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.03em',
          fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
          color: WHITE, margin: '0 0 20px',
        }}>
          Smart and simple<br />
          <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: PINK }}>personal finance</em>
        </h1>
        <p style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(14px,1.5vw,17px)', lineHeight: 1.75, color: MUTED_D, maxWidth: 440, margin: '0 auto 40px' }}>
          Track every transaction, beat every budget, and grow toward the goals that actually matter — free, forever.
        </p>

        {/* Email CTA */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', borderRadius: 99, overflow: 'hidden',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
          }}>
            <input
              type="email" placeholder="Enter your email"
              style={{
                background: 'none', border: 'none', outline: 'none',
                padding: '12px 22px', fontSize: 13, color: WHITE,
                width: 'clamp(180px, 30vw, 260px)',
              }}
            />
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '12px 22px', fontSize: 13, fontWeight: 700,
              background: `linear-gradient(135deg, ${ROSE}, ${BERRY})`,
              color: WHITE, textDecoration: 'none', borderRadius: 99,
              margin: 3, transition: 'opacity .18s',
              boxShadow: '0 0 16px rgba(167,139,250,0.5)',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Sign up <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      <BigTextSection />

      {/* ══════════════════════════════════════════════════
          SCREENSHOT — cone border glow from button
      ══════════════════════════════════════════════════ */}
      <section style={{ background: DARK_BG, textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', padding: '0 clamp(24px,6vw,72px)' }}>

          {/* Sign up button — the light source */}
          <ScrollReveal style={{ paddingTop: 48, paddingBottom: 52, position: 'relative', zIndex: 4 }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(167,139,250,0.55)',
              color: WHITE, textDecoration: 'none',
              boxShadow: '0 0 12px rgba(167,139,250,0.7), 0 0 40px rgba(167,139,250,0.3), 0 0 80px rgba(167,139,250,0.12)',
            }}>
              Sign up free <ArrowRight size={13} />
            </Link>
          </ScrollReveal>

          {/* SVG cone — border lines only, behind the image */}
          <svg
            viewBox="0 0 800 300"
            preserveAspectRatio="none"
            style={{
              position: 'absolute', top: 0, left: 'clamp(24px,6vw,72px)', right: 'clamp(24px,6vw,72px)',
              width: 'calc(100% - clamp(48px,12vw,144px))',
              height: '100%',
              pointerEvents: 'none', zIndex: 1,
            }}
          >
            <defs>
              <linearGradient id="rayFade" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="rgba(167,139,250,0)"   />
                <stop offset="20%"  stopColor="rgba(190,165,255,0.75)" />
                <stop offset="65%"  stopColor="rgba(167,139,250,0.25)" />
                <stop offset="100%" stopColor="rgba(167,139,250,0)"   />
              </linearGradient>
              <filter id="rayGlow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Left border of cone */}
            <line x1="400" y1="48" x2="0"   y2="300" stroke="url(#rayFade)" strokeWidth="1.2" filter="url(#rayGlow)" />
            {/* Right border of cone */}
            <line x1="400" y1="48" x2="800" y2="300" stroke="url(#rayFade)" strokeWidth="1.2" filter="url(#rayGlow)" />
          </svg>

          {/* Image — on top of the cone so no glow lands on it */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <img
              src={homeImg}
              alt="Momentum dashboard"
              style={{
                width: '100%', display: 'block',
                borderRadius: '14px 14px 0 0',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.07)',
              }}
            />
            {/* Bottom fade */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '52%', zIndex: 3, pointerEvents: 'none',
              background: `linear-gradient(to bottom, transparent, ${DARK_BG})`,
            }} />
          </div>

        </div>
      </section>

      <FloatingCardsSection />

      {/* ══════════════════════════════════════════════════
          CARDS SHOWCASE
      ══════════════════════════════════════════════════ */}
      <section style={{ background: DARK_BG, padding: 'clamp(48px,6vw,72px) clamp(24px,6vw,72px)', textAlign: 'center' }}>
        <ScrollReveal>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>Your cards</p>
          <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.4rem,3vw,2.2rem)', color: WHITE, lineHeight: 1.07, margin: '0 0 48px' }}>
            Every account, beautifully tracked.
          </h2>
          <CardsShowcase />
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════
          WHY MOMENTUM — dark
      ══════════════════════════════════════════════════ */}
      <section style={{ background: DARK_BG, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
        <ScrollReveal>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>
            Why Momentum?
          </p>
          <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,3rem)', color: WHITE, lineHeight: 1.07, margin: '0 0 16px' }}>
            The only finance app<br />you'll ever need
          </h2>
          <p style={{ fontSize: 15, color: MUTED_D, maxWidth: 460, margin: '0 auto 72px' }}>
            Beautifully simple. Surprisingly powerful. Built so you can understand your money at a glance.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 36 }}>
            {[
              { Icon: BarChart3,    label: 'Deep analytics',      desc: 'Click into any chart to see the transactions behind it.' },
              { Icon: Wallet,       label: 'Smart budgets',        desc: 'Set limits per category and track rollover automatically.' },
              { Icon: PiggyBank,    label: 'Savings goals',        desc: 'Plan contributions and watch your goals grow.' },
              { Icon: CalendarDays, label: 'Bills & recurring',    desc: 'Never miss a payment — plan ahead with ease.' },
            ].map(({ Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(201,160,184,0.1)', border: '1px solid rgba(201,160,184,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={22} color={PINK} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: WHITE, margin: '0 0 6px' }}>{label}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: MUTED_D, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES — dark
      ══════════════════════════════════════════════════ */}
      <section id="features" style={{ background: DARK_BG, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
        <ScrollReveal>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'center', justifyContent: 'center' }}>

          {/* Left */}
          <div style={{ flex: '1 1 320px', maxWidth: 420 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>Built for clarity</p>
            <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: WHITE, lineHeight: 1.07, margin: '0 0 16px' }}>
              All your finances<br />in one clear picture
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: MUTED_D, margin: '0 0 36px' }}>
              Every transaction, every budget, every goal — all visible in one place, always up to date.
            </p>

            {[
              { Icon: TrendingUp, title: 'Income & expense tracking', desc: 'Log everything. See exactly where every euro goes, broken down by category and merchant.' },
              { Icon: CreditCard,  title: 'Multiple accounts & cards', desc: 'Connect debit, credit, cash and savings. Switch between accounts in a tap.' },
              { Icon: Receipt,     title: 'Transaction detail',        desc: 'Split transactions, add notes, tag importance, and search your full history.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(143,168,212,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={ROSE} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: WHITE, margin: '0 0 4px' }}>{title}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: MUTED_D, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — payment mockup */}
          <PaymentMockup />
        </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════
          FREE — dark
      ══════════════════════════════════════════════════ */}
      <section style={{ background: DARK_BG, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
        <ScrollReveal>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 300px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>No tiers. No limits.</p>
              <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: WHITE, lineHeight: 1.07, margin: '0 0 16px' }}>
                Everything.<br />
                <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: PINK }}>Always free.</em>
              </h2>
              <p style={{ fontSize: 14, color: MUTED_D, lineHeight: 1.75, margin: '0 0 32px' }}>
                No credit card. No trial. No paywalled features. Momentum is 100% free for everyone, forever.
              </p>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700,
                background: `linear-gradient(135deg, ${PINK}, ${ROSE})`, color: BERRY,
                textDecoration: 'none', transition: 'opacity .18s, transform .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)' }}>
                Get started free <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ flex: '1 1 280px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  'Unlimited transactions', 'Multiple accounts', 'Savings goals', 'Deep analytics',
                  'Recurring bills', 'Calendar view', 'Smart budgets', 'Custom themes',
                  'Split transactions', 'Importance tags', 'CSV export', 'Multi-currency',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(201,160,184,0.12)', border: '1px solid rgba(201,160,184,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={10} color={PINK} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ — dark
      ══════════════════════════════════════════════════ */}
      <section id="faq" style={{ background: DARK_BG, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
        <ScrollReveal>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>FAQ</p>
          <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: WHITE, lineHeight: 1.07, margin: '0 0 48px' }}>
            Common questions.
          </h2>
          <div style={{ borderTop: `1px solid ${BORDER_L}` }}>
            {[
              { q: 'Is Momentum really free?',       a: 'Yes — completely free, forever. No credit card, no trial, no paywalled features. Everything is always included.' },
              { q: 'Is my financial data secure?',   a: 'Your data is encrypted and stored securely with Supabase. We never share or sell your information.' },
              { q: 'Can I use it on my phone?',      a: 'Momentum works in any modern browser on desktop or mobile. A native app is on the roadmap.' },
              { q: 'What currencies are supported?', a: 'Any currency — EUR, USD, GBP, and more. Just pick yours in settings and you\'re good to go.' },
            ].map(faq => <FAQItem key={faq.q} {...faq} />)}
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL CTA — dark
      ══════════════════════════════════════════════════ */}
      <section style={{ background: HERO_BG, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)', textAlign: 'center' }}>
        <ScrollReveal>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED_D, marginBottom: 20 }}>
          Start today
        </p>
        <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(2rem,5vw,3.8rem)', color: WHITE, lineHeight: 1.05, margin: '0 0 20px' }}>
          Start building your<br />
          <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: PINK }}>financial clarity.</em>
        </h2>
        <p style={{ fontSize: 15, color: MUTED_D, margin: '0 0 40px' }}>Free, forever. No credit card required.</p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 99, fontSize: 15, fontWeight: 700,
            background: `linear-gradient(135deg, ${PINK}, ${ROSE})`, color: BERRY,
            textDecoration: 'none', transition: 'opacity .18s, transform .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)' }}>
            Get started free <ArrowRight size={15} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {[{ Icon: Shield, t: 'Private' }, { Icon: Zap, t: 'Always free' }].map(({ Icon, t }) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon size={12} color={MUTED_D} />
                <span style={{ fontSize: 12, color: MUTED_D, fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{
        background: DARK_BG, borderTop: '1px solid rgba(143,168,212,0.12)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '24px clamp(24px, 6vw, 72px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, ${BERRY}, ${ROSE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/momentum_transparant.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: MUTED_D }}>Momentum Finance</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(143,168,212,0.35)', margin: 0 }}>© {new Date().getFullYear()} Momentum Finance · Free forever</p>
      </footer>

    </div>
  )
}
