import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Wallet, PiggyBank,
  CalendarDays, Receipt, CreditCard, Check,
  TrendingUp, Shield, Zap, Target, Bell, LineChart,
} from 'lucide-react'
import GradientMenu from '../components/ui/gradient-menu'

// ── Palette ──────────────────────────────────────────────────────────
const PINK     = '#d4bbf8'
const ROSE     = '#a78bfa'
const BERRY    = '#0f1020'
const WHITE    = '#ffffff'
const MUTED_D  = 'rgba(212,187,248,0.55)'
const MUTED_L  = 'rgba(212,187,248,0.45)'
const BORDER_L = 'rgba(167,139,250,0.15)'
const CARD_BG  = 'rgba(8,6,20,0.85)'

// ── Scroll reveal ─────────────────────────────────────────────────────
function ScrollReveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(36px)',
      transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────
function StatCard({ value, label, delay = 0, wide = false }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      background: CARD_BG,
      border: '1px solid rgba(167,139,250,0.12)',
      borderRadius: 24,
      padding: wide ? '32px 40px' : '32px 36px',
      minWidth: wide ? 260 : 180,
      flex: wide ? '0 0 auto' : '1 1 160px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(40px)',
      transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      <p style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)', fontWeight: 900, color: ROSE, margin: '0 0 8px', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 13, color: MUTED_D, margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────
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

// ── Floating feature cards ────────────────────────────────────────────
const FEATURE_CARDS = [
  { Icon: BarChart3,  title: 'Deep Analytics',    desc: 'Drill into any chart. See the transactions behind every number.',          rotation: -8, x: '2%',  y: 60  },
  { Icon: Target,     title: 'Savings Goals',      desc: 'Set a target, plan contributions, and watch your progress grow.',          rotation: 5,  x: '28%', y: 0   },
  { Icon: Bell,       title: 'Bill Reminders',     desc: 'Never miss a payment. Recurring bills tracked and alerted automatically.', rotation: -4, x: '55%', y: 80  },
  { Icon: Wallet,     title: 'Smart Budgets',      desc: 'Category budgets with automatic rollover and real-time tracking.',         rotation: 7,  x: '72%', y: 10  },
  { Icon: LineChart,  title: 'Portfolio Tracking', desc: 'Monitor your investments and net worth alongside daily spending.',          rotation: -6, x: '18%', y: 200 },
  { Icon: CreditCard, title: 'Multiple Cards',     desc: 'All your accounts in one view — debit, credit, cash and savings.',        rotation: 4,  x: '62%', y: 230 },
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
    <section ref={ref} style={{ padding: 'clamp(60px,8vw,100px) clamp(24px,6vw,72px)', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: 80 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>Everything you need</p>
        <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,3rem)', color: WHITE, margin: 0 }}>
          One app. <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: PINK, fontWeight: 400 }}>Every feature.</em>
        </h2>
      </div>
      <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', height: 420 }}>
        {FEATURE_CARDS.map(({ Icon, title, desc, rotation, x, y }, i) => (
          <div key={title} style={{
            position: 'absolute', left: x, top: y,
            width: 'clamp(180px,22vw,230px)',
            background: CARD_BG,
            border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: 20, padding: '20px 20px 22px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            transform: visible
              ? `rotate(${rotation}deg) translateY(0px)`
              : `rotate(${rotation}deg) translateY(${i % 2 === 0 ? '60px' : '-60px'}) translateX(${i % 3 === 0 ? '-40px' : '40px'})`,
            opacity: visible ? 1 : 0,
            transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms`,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, marginBottom: 14, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={17} color={ROSE} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: WHITE, margin: '0 0 6px' }}>{title}</p>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: MUTED_L, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = '#07050f'
    document.documentElement.style.background = '#07050f'

    const style = document.createElement('style')
    style.textContent = `
      @keyframes blobPulse {
        0%,100% { transform: scale(1) translate(0,0); opacity: 0.9; }
        33%  { transform: scale(1.08) translate(3%, -4%); opacity: 1; }
        66%  { transform: scale(0.94) translate(-2%, 3%); opacity: 0.85; }
      }
      @keyframes blobDrift {
        0%,100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(-5%, 4%) scale(1.06); }
      }
      @keyframes heroFloat  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      @keyframes heroFloat2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
      @keyframes arcSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `
    document.head.appendChild(style)
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div style={{ background: '#07050f', overflowX: 'hidden', color: WHITE }}>

      {/* ══ NAV ══════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px clamp(24px,5vw,64px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${BERRY}, ${ROSE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/momentum_transparant.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: WHITE }}>Momentum</span>
        </div>
        <GradientMenu />
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        padding: 'clamp(120px,14vw,160px) clamp(24px,5vw,64px) 0',
      }}>

        {/* Background gradient blob */}
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '80vw', height: '90vh', borderRadius: '50%',
          background: 'radial-gradient(ellipse at 40% 45%, rgba(120,60,220,0.95) 0%, rgba(80,30,160,0.7) 35%, rgba(40,10,80,0.3) 65%, transparent 80%)',
          filter: 'blur(0px)',
          animation: 'blobPulse 12s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
        {/* Secondary smaller blob — right side */}
        <div style={{
          position: 'absolute', top: '10%', right: '-15%',
          width: '45vw', height: '55vh', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(90,40,180,0.45) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'blobDrift 16s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Decorative arc rings */}
        <svg style={{ position: 'absolute', top: '8%', right: '8%', width: 320, height: 320, opacity: 0.18, pointerEvents: 'none', zIndex: 0, animation: 'arcSpin 40s linear infinite' }} viewBox="0 0 320 320" fill="none">
          <circle cx="160" cy="160" r="140" stroke="rgba(167,139,250,1)" strokeWidth="0.8" strokeDasharray="6 14" />
          <circle cx="160" cy="160" r="100" stroke="rgba(167,139,250,1)" strokeWidth="0.6" strokeDasharray="4 20" />
        </svg>
        <svg style={{ position: 'absolute', bottom: '18%', left: '38%', width: 200, height: 200, opacity: 0.12, pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="90" stroke="rgba(212,187,248,1)" strokeWidth="0.7" strokeDasharray="3 12" />
        </svg>

        {/* ── Hero content ─────────────────── */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap', flex: 1 }}>

          {/* Left — big headline */}
          <div style={{ flex: '1 1 520px', maxWidth: 680 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: MUTED_D, letterSpacing: '0.06em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: ROSE, fontSize: 18, fontWeight: 700 }}>{'}'}</span>
              All-in-one personal finance
            </p>
            <h1 style={{
              fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em',
              fontSize: 'clamp(3.5rem,9vw,7.5rem)',
              color: WHITE, margin: 0,
            }}>
              Momentum<br />
              <span style={{ color: WHITE }}>is your</span><br />
              <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', fontWeight: 400, color: PINK }}>Financial</em><br />
              <span style={{ color: WHITE }}>Dashboard.</span>
            </h1>
          </div>

          {/* Right — description + CTA */}
          <div style={{ flex: '0 1 280px', paddingTop: 'clamp(40px,8vw,100px)', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: MUTED_D, margin: 0 }}>
              Track every transaction, beat every budget, and grow toward the goals that actually matter — free, forever.
            </p>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 99, fontSize: 13, fontWeight: 700,
              background: '#0d0a1a', border: '1px solid rgba(167,139,250,0.25)',
              color: WHITE, textDecoration: 'none', alignSelf: 'flex-start',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              boxShadow: '0 0 0 1px rgba(167,139,250,0.1)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(167,139,250,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(167,139,250,0.1)' }}
            >
              Get started free <ArrowRight size={13} />
            </Link>
            {/* Social proof avatars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>
                {['#a78bfa','#7c3aed','#4338ca','#6d28d9'].map((c, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${c}, #0f1020)`, border: '2px solid #07050f', marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: MUTED_D }}>Trusted by thousands</span>
            </div>
          </div>
        </div>

        {/* ── Stat cards row ──────────────── */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 64, paddingBottom: 0, alignItems: 'flex-end' }}>
          <StatCard value="100%" label="Free, forever. No paywalls." wide delay={0} />
          <StatCard value="∞"    label="Transactions tracked" delay={100} />
          <StatCard value="8+"   label="Account types supported" delay={200} />
          <StatCard value="0€"   label="Cost, ever" delay={300} />
        </div>
      </section>

      {/* ══ DIVIDER ══════════════════════════════════════════════════ */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.2), transparent)', margin: '0 clamp(24px,5vw,64px)' }} />

      {/* ══ FLOATING FEATURES ════════════════════════════════════════ */}
      <FloatingCardsSection />

      {/* ══ FEATURES DETAIL ══════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
        <ScrollReveal>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'center', justifyContent: 'center' }}>
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
                { Icon: CreditCard, title: 'Multiple accounts & cards',  desc: 'Connect debit, credit, cash and savings. Switch between accounts in a tap.' },
                { Icon: Receipt,    title: 'Transaction detail',         desc: 'Split transactions, add notes, tag importance, and search your full history.' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: 'rgba(143,168,212,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={ROSE} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: WHITE, margin: '0 0 4px' }}>{title}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: MUTED_D, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Payment mockup */}
            <div style={{ flex: '1 1 280px', maxWidth: 340 }}>
              <div style={{ background: CARD_BG, borderRadius: 20, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: `1px solid ${BORDER_L}`, marginBottom: 16 }}>
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
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ height: '100%', width: '68%', borderRadius: 99, background: `linear-gradient(90deg, ${ROSE}, ${PINK})` }} />
                </div>
                <p style={{ fontSize: 11, color: MUTED_D, margin: '8px 0 0' }}>68% of food budget used · €57.50 remaining</p>
              </div>
              <div style={{ background: `linear-gradient(135deg, #2d1b69, #7c3aed)`, borderRadius: 20, padding: 24, boxShadow: '0 8px 32px rgba(45,59,110,0.5)' }}>
                <p style={{ fontSize: 11, color: MUTED_D, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>You received</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: WHITE, margin: '0 0 4px', letterSpacing: '-0.02em' }}>+€2,800.00</p>
                <p style={{ fontSize: 12, color: MUTED_D, margin: '0 0 16px' }}>Monthly salary · Employer NV</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7adc9a' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Completed · Dec 25, 2024</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══ FREE SECTION ═════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
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
                    'Unlimited transactions','Multiple accounts','Savings goals','Deep analytics',
                    'Recurring bills','Calendar view','Smart budgets','Custom themes',
                    'Split transactions','Importance tags','CSV export','Multi-currency',
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* ══ FAQ ══════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
        <ScrollReveal>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>FAQ</p>
            <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: WHITE, lineHeight: 1.07, margin: '0 0 48px' }}>Common questions.</h2>
            <div style={{ borderTop: `1px solid ${BORDER_L}` }}>
              {[
                { q: 'Is Momentum really free?',       a: 'Yes — completely free, forever. No credit card, no trial, no paywalled features. Everything is always included.' },
                { q: 'Is my financial data secure?',   a: 'Your data is encrypted and stored securely with Supabase. We never share or sell your information.' },
                { q: 'Can I use it on my phone?',      a: 'Momentum works in any modern browser on desktop or mobile. A native app is on the roadmap.' },
                { q: 'What currencies are supported?', a: "Any currency — EUR, USD, GBP, and more. Just pick yours in settings and you're good to go." },
              ].map(faq => <FAQItem key={faq.q} {...faq} />)}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Blob behind CTA */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '60vw', height: '40vh', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(100,40,200,0.35) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <ScrollReveal style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED_D, marginBottom: 20 }}>Start today</p>
          <h2 style={{ fontWeight: 900, letterSpacing: '-0.04em', fontSize: 'clamp(2rem,6vw,4.5rem)', color: WHITE, lineHeight: 1.0, margin: '0 0 20px' }}>
            Start building your<br />
            <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: PINK, fontWeight: 400 }}>financial clarity.</em>
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

      {/* ══ FOOTER ═══════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: '1px solid rgba(167,139,250,0.1)',
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
