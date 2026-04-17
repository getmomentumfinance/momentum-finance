import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Wallet, PiggyBank,
  CalendarDays, Receipt, CreditCard, Check,
  TrendingUp, Shield, Zap,
} from 'lucide-react'

// ── Palette ────────────────────────────────────────────────────────
const HERO_BG   = 'radial-gradient(ellipse at 65% 30%, #9e2b5a 0%, #4a0d28 50%, #2d0615 100%)'
const DARK_BG   = '#2d0615'
const PINK      = '#ffb5ba'
const ROSE      = '#e8709a'
const BERRY     = '#6b1f40'
const WHITE     = '#ffffff'
const MUTED_D   = 'rgba(255,181,186,0.5)'   // muted on dark bg
const MUTED_L   = 'rgba(107,31,64,0.48)'    // muted on light bg
const BORDER_L  = 'rgba(107,31,64,0.1)'

// ── Credit / Debit card ────────────────────────────────────────────
function Card({ gradient, chipLight = false, number, name, expiry, style = {} }) {
  return (
    <div style={{
      width: 260, height: 163, borderRadius: 18,
      background: gradient, padding: '18px 22px',
      boxShadow: '0 28px 56px rgba(0,0,0,0.4)',
      position: 'absolute', overflow: 'hidden',
      ...style,
    }}>
      {/* Subtle glare */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 140, height: 140, borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
      }} />
      {/* Row 1: chip + circles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{
          width: 34, height: 26, borderRadius: 5,
          background: chipLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,220,100,0.7)',
          border: '1px solid rgba(255,255,255,0.3)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
        }} />
        <div style={{ display: 'flex' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginLeft: -8 }} />
        </div>
      </div>
      {/* Card number */}
      <p style={{
        fontSize: 12, fontWeight: 600, letterSpacing: '0.18em',
        color: 'rgba(255,255,255,0.85)', margin: '0 0 14px',
        fontFamily: '"Courier New", monospace',
      }}>
        {number}
      </p>
      {/* Name + expiry */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
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
  )
}

// ── Cards showcase ─────────────────────────────────────────────────
function CardsShowcase() {
  return (
    <div style={{ position: 'relative', height: 240, maxWidth: 720, width: '100%', margin: '0 auto' }}>
      {/* Left card — blush, tilted back-left */}
      <Card
        gradient="linear-gradient(140deg, #fce4e8 0%, #f5a8c0 60%, #e87898 100%)"
        chipLight
        number="•••• •••• •••• 3812"
        name="A. Johnson"
        expiry="09/27"
        style={{
          left: '2%', top: 55,
          transform: 'rotate(-14deg) perspective(600px) rotateY(8deg)',
          zIndex: 1, width: 232, height: 146,
          filter: 'brightness(0.88)',
        }}
      />
      {/* Center card — deep berry, front and center */}
      <Card
        gradient="linear-gradient(140deg, #c94878 0%, #8b2550 50%, #4a0d28 100%)"
        number="•••• •••• •••• 5524"
        name="S. Lambert"
        expiry="12/28"
        style={{
          left: '50%', top: 0,
          transform: 'translateX(-50%) rotate(-2deg) perspective(600px) rotateY(-2deg)',
          zIndex: 3,
          boxShadow: '0 32px 72px rgba(74,13,40,0.7)',
        }}
      />
      {/* Right card — mauve/plum, tilted back-right */}
      <Card
        gradient="linear-gradient(140deg, #e0b0d0 0%, #c07aaa 50%, #986798 100%)"
        chipLight
        number="•••• •••• •••• 9073"
        name="M. Williams"
        expiry="03/26"
        style={{
          right: '2%', top: 48,
          transform: 'rotate(12deg) perspective(600px) rotateY(-8deg)',
          zIndex: 2, width: 232, height: 146,
          filter: 'brightness(0.85)',
        }}
      />
    </div>
  )
}

// ── Mini payment receipt mockup ────────────────────────────────────
function PaymentMockup() {
  return (
    <div style={{ maxWidth: 340, width: '100%' }}>
      {/* Card 1: transaction */}
      <div style={{
        background: WHITE, borderRadius: 20, padding: 24,
        boxShadow: '0 8px 32px rgba(107,31,64,0.12)',
        border: `1px solid ${BORDER_L}`, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${ROSE}, ${BERRY})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14 }}>🛒</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: BERRY, margin: 0 }}>Groceries</p>
              <p style={{ fontSize: 11, color: MUTED_L, margin: 0 }}>Today · 14:32</p>
            </div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#e05070' }}>-€42.50</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 10, color: MUTED_L, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: BERRY, margin: 0 }}>Food & Drink</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: MUTED_L, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Budget used</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: BERRY, margin: 0 }}>68%</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: MUTED_L, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Remaining</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#4caf80', margin: 0 }}>€57.50</p>
          </div>
        </div>
        {/* Budget bar */}
        <div style={{ height: 5, borderRadius: 99, background: BORDER_L }}>
          <div style={{ height: '100%', width: '68%', borderRadius: 99, background: `linear-gradient(90deg, ${ROSE}, ${BERRY})` }} />
        </div>
      </div>

      {/* Card 2: salary received */}
      <div style={{
        background: `linear-gradient(135deg, ${BERRY}, #8b2550)`,
        borderRadius: 20, padding: 24,
        boxShadow: '0 8px 32px rgba(107,31,64,0.3)',
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
        <span style={{ fontSize: 15, fontWeight: 700, color: BERRY }}>{q}</span>
        <span style={{ color: ROSE, fontSize: 20, lineHeight: 1, marginLeft: 16 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <p style={{ fontSize: 14, lineHeight: 1.75, color: MUTED_L, margin: '0 0 18px' }}>{a}</p>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = DARK_BG
    document.documentElement.style.background = DARK_BG
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════════════
          NAV — light
      ══════════════════════════════════════════════════ */}
      <nav style={{
        background: WHITE, borderBottom: `1px solid ${BORDER_L}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(24px, 6vw, 72px)', height: 60,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${BERRY}, ${ROSE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/momentum_transparant.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: BERRY }}>Momentum</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[['Overview', '#hero'], ['Features', '#features'], ['FAQ', '#faq']].map(([label, href]) => (
            <a key={label} href={href} style={{
              fontSize: 13, fontWeight: 500, color: MUTED_L,
              textDecoration: 'none', padding: '6px 14px', borderRadius: 99,
              transition: 'color .18s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = BERRY}
              onMouseLeave={e => e.currentTarget.style.color = MUTED_L}>
              {label}
            </a>
          ))}
        </div>

        <Link to="/register" style={{
          fontSize: 13, fontWeight: 700, color: BERRY,
          textDecoration: 'none', padding: '8px 20px', borderRadius: 99,
          border: `1.5px solid ${BERRY}`, transition: 'background .18s, color .18s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = BERRY; e.currentTarget.style.color = WHITE }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = BERRY }}>
          Get Started
        </Link>
      </nav>

      {/* ══════════════════════════════════════════════════
          HERO — dark
      ══════════════════════════════════════════════════ */}
      <section id="hero" style={{ background: HERO_BG, padding: 'clamp(64px,10vw,100px) clamp(24px,6vw,72px) 0', textAlign: 'center' }}>

        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED_D, marginBottom: 18 }}>
          All-in-one personal finance
        </p>
        <h1 style={{
          fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.03em',
          fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
          color: WHITE, margin: '0 0 20px',
        }}>
          Smart and simple<br />
          <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: PINK }}>personal finance</em>
        </h1>
        <p style={{ fontSize: 'clamp(14px,1.5vw,17px)', lineHeight: 1.75, color: MUTED_D, maxWidth: 440, margin: '0 auto 40px' }}>
          Track every transaction, beat every budget, and grow toward the goals that actually matter — free, forever.
        </p>

        {/* Email CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(48px,8vw,80px)' }}>
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
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Sign up <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Cards */}
        <CardsShowcase />
      </section>

      {/* ══════════════════════════════════════════════════
          WHY MOMENTUM — dark
      ══════════════════════════════════════════════════ */}
      <section style={{ background: DARK_BG, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
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
                  background: 'rgba(255,181,186,0.1)', border: '1px solid rgba(255,181,186,0.2)',
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
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES — light
      ══════════════════════════════════════════════════ */}
      <section id="features" style={{ background: WHITE, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'center', justifyContent: 'center' }}>

          {/* Left */}
          <div style={{ flex: '1 1 320px', maxWidth: 420 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>Built for clarity</p>
            <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: BERRY, lineHeight: 1.07, margin: '0 0 16px' }}>
              All your finances<br />in one clear picture
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: MUTED_L, margin: '0 0 36px' }}>
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
                  background: 'rgba(232,112,154,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={ROSE} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: BERRY, margin: '0 0 4px' }}>{title}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: MUTED_L, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — payment mockup */}
          <PaymentMockup />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FREE — dark
      ══════════════════════════════════════════════════ */}
      <section style={{ background: DARK_BG, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
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
                      background: 'rgba(255,181,186,0.12)', border: '1px solid rgba(255,181,186,0.25)',
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
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ — light
      ══════════════════════════════════════════════════ */}
      <section id="faq" style={{ background: WHITE, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE, marginBottom: 16 }}>FAQ</p>
          <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: BERRY, lineHeight: 1.07, margin: '0 0 48px' }}>
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
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL CTA — dark
      ══════════════════════════════════════════════════ */}
      <section style={{ background: HERO_BG, padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,72px)', textAlign: 'center' }}>
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
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{
        background: DARK_BG, borderTop: '1px solid rgba(255,181,186,0.1)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '24px clamp(24px, 6vw, 72px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, ${BERRY}, ${ROSE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/momentum_transparant.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: MUTED_D }}>Momentum Finance</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,181,186,0.28)', margin: 0 }}>© {new Date().getFullYear()} Momentum Finance · Free forever</p>
      </footer>

    </div>
  )
}
