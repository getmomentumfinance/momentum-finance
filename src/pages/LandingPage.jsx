import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Wallet, PiggyBank,
  Receipt, CalendarDays, CreditCard, Check,
  Shield, Zap, Users, Plus, Minus,
} from 'lucide-react'

// ── Palette ────────────────────────────────────────────────────────
const BG        = '#e0cad4'                 // soft mauve-pink
const BLACK     = '#0f0d0c'
const BLUSH     = '#c4305e'                 // deep rose — pops on mauve bg
const BLUSH_MID = '#8c1f44'                 // dark wine — readable on mauve bg
const MUTED     = 'rgba(15,13,12,0.44)'
const BORDER    = 'rgba(15,13,12,0.09)'
const CARD_BG   = 'rgba(255,255,255,0.5)'

const FEATURES = [
  { Icon: BarChart3,    title: 'Deep Analytics',     desc: 'Click any chart to drill into transactions by category, merchant, or importance.' },
  { Icon: Wallet,       title: 'Smart Budgets',       desc: 'Set limits per category. Track rollover, overspend, and weekly or yearly periods.' },
  { Icon: PiggyBank,    title: 'Savings Goals',       desc: 'Plan monthly contributions and track progress toward every goal.' },
  { Icon: CalendarDays, title: 'Bills & Planned',     desc: 'Never miss a payment. Log recurring bills and planned expenses before they land.' },
  { Icon: CreditCard,   title: 'Multiple Accounts',   desc: 'Manage debit, credit, cash and savings — all in one unified view.' },
  { Icon: Receipt,      title: 'Transaction History', desc: 'Split bills, tag importance, attach comments, and search everything.' },
]

const STEPS = [
  { n: '01', title: 'Create your account',   desc: 'Sign up in seconds. No credit card. No trial. Every feature unlocked from day one.' },
  { n: '02', title: 'Log your transactions', desc: 'Add income, expenses, and transfers. Split bills, set categories, mark importance.' },
  { n: '03', title: 'Build real clarity',    desc: 'Beat budgets, reach savings goals, and finally understand your financial picture.' },
]

const FAQS = [
  { q: 'Is Momentum really free?',       a: 'Yes — completely free, forever. No credit card, no trial, no paywalled features. Everything is always included.' },
  { q: 'Is my financial data secure?',   a: 'Your data is encrypted and stored securely. We never share, sell, or access your financial information.' },
  { q: 'Can I use it on my phone?',      a: 'Momentum works beautifully in any modern browser on desktop or mobile. A dedicated app is on the roadmap.' },
  { q: 'What currencies are supported?', a: 'Any currency you want — EUR, USD, GBP, and more. Just pick yours in settings.' },
]

const INCLUDED = [
  'Unlimited transactions',      'Multiple accounts & cards',
  'Savings goals with planning', 'Interactive deep analytics',
  'Recurring & planned bills',   'Calendar view',
  'Smart budgeting tools',       'Customizable design themes',
]

// ── FAQ accordion ──────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: BLACK, letterSpacing: '-0.01em' }}>{q}</span>
        <span style={{ color: BLUSH_MID, flexShrink: 0, marginLeft: 16 }}>
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      {open && (
        <p style={{ fontSize: 14, lineHeight: 1.75, color: MUTED, paddingBottom: 22, margin: 0 }}>{a}</p>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────
export default function LandingPage() {
  // Override the global body gradient while on this page
  useEffect(() => {
    document.body.style.background = BG
    document.documentElement.style.background = BG
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  return (
    <div style={{ background: BG, color: BLACK, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav style={{
        position: 'relative', zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px clamp(24px, 6vw, 80px)',
        maxWidth: 1280, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/momentum_transparant.png" alt="Momentum" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: BLACK }}>Momentum Finance</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { label: 'Features',    href: '#features',    scroll: true },
            { label: 'How It Works',href: '#how-it-works',scroll: true },
            { label: 'FAQ',         href: '#faq',         scroll: true },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{
              fontSize: 13, fontWeight: 500, color: MUTED,
              textDecoration: 'none', padding: '7px 14px', borderRadius: 99,
              transition: 'color .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = BLACK}
              onMouseLeave={e => e.currentTarget.style.color = MUTED}>
              {label}
            </a>
          ))}
          <Link to="/login" style={{
            fontSize: 13, fontWeight: 500, color: MUTED,
            textDecoration: 'none', padding: '7px 14px', borderRadius: 99,
            transition: 'color .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = BLACK}
            onMouseLeave={e => e.currentTarget.style.color = MUTED}>
            Log in
          </Link>
          <Link to="/register" style={{
            fontSize: 13, fontWeight: 700, color: BLACK,
            textDecoration: 'none', padding: '9px 20px', borderRadius: 99,
            background: BLUSH, marginLeft: 4,
            transition: 'opacity .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: 'calc(100vh - 76px)',
        display: 'flex', alignItems: 'center',
        padding: '80px clamp(24px, 6vw, 80px)',
        maxWidth: 1280, margin: '0 auto',
      }}>
        <div style={{ maxWidth: 800 }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 36,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(240,175,197,0.15)',
            border: `1px solid rgba(240,175,197,0.4)`,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: BLUSH }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLUSH_MID }}>
              Personal Finance · Reinvented
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.035em',
            fontSize: 'clamp(3.4rem, 9vw, 7.5rem)',
            margin: '0 0 28px', color: BLACK,
          }}>
            Your money,{' '}
            <span style={{ color: BLUSH }}>finally</span>
            <br />on your side.
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: 'clamp(14px, 1.6vw, 18px)', lineHeight: 1.75,
            color: MUTED, maxWidth: 500, margin: '0 0 44px',
          }}>
            Stop wondering where it all went. Track every transaction, beat every budget, and grow toward the goals that actually matter — free, forever.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 44 }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 30px', borderRadius: 99, fontSize: 14, fontWeight: 700,
              background: BLACK, color: BG,
              textDecoration: 'none', letterSpacing: '-0.01em',
              transition: 'opacity .2s, transform .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity='.85'; e.currentTarget.style.transform='scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)' }}>
              Start for free <ArrowRight size={15} />
            </Link>
            <a href="#features" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 30px', borderRadius: 99, fontSize: 14, fontWeight: 600,
              background: 'transparent', border: `1.5px solid ${BORDER}`,
              color: MUTED, textDecoration: 'none',
              transition: 'border-color .2s, color .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(15,13,12,0.22)'; e.currentTarget.style.color=BLACK }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=MUTED }}>
              See features
            </a>
          </div>

          {/* Trust pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { Icon: Shield, text: 'Private by default' },
              { Icon: Zap,    text: 'Always free'        },
              { Icon: Users,  text: 'No limits'          },
            ].map(({ Icon, text }) => (
              <div key={text} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 13px', borderRadius: 99,
                background: 'rgba(15,13,12,0.04)', border: `1px solid ${BORDER}`,
              }}>
                <Icon size={10} style={{ color: BLUSH_MID }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: MUTED }}>{text}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '100px clamp(24px, 6vw, 80px)', maxWidth: 1280, margin: '0 auto' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUSH_MID, marginBottom: 16 }}>
          What's included
        </p>
        <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(2rem,5vw,3.5rem)', color: BLACK, lineHeight: 1.05, margin: '0 0 56px' }}>
          Built for people who take<br />their finances seriously.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} style={{
              padding: 28, borderRadius: 20,
              background: CARD_BG, border: `1px solid ${BORDER}`,
              transition: 'border-color .25s, transform .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(240,175,197,0.55)'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform='translateY(0)' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(240,175,197,0.18)',
              }}>
                <Icon size={20} style={{ color: BLUSH_MID }} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: BLACK, margin: '0 0 8px' }}>{title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: MUTED, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — black section for pink/black contrast
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: BLACK, padding: '100px clamp(24px, 6vw, 80px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUSH, marginBottom: 16 }}>
            How it works
          </p>
          <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(2rem,5vw,3.5rem)', color: BG, lineHeight: 1.05, margin: '0 0 72px' }}>
            Three steps to clarity.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n}>
                <div style={{ fontSize: 'clamp(3.5rem,7vw,5.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: BLUSH, lineHeight: 1, marginBottom: 24 }}>
                  {n}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', color: BG, margin: '0 0 12px' }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.42)', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          INCLUDED
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '100px clamp(24px, 6vw, 80px)', maxWidth: 1280, margin: '0 auto' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUSH_MID, marginBottom: 16 }}>
          No tiers. No limits.
        </p>
        <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(2rem,5vw,3.5rem)', color: BLACK, lineHeight: 1.05, margin: '0 0 48px' }}>
          Everything. Always free.
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {INCLUDED.map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', borderRadius: 12,
              background: CARD_BG, border: `1px solid ${BORDER}`,
            }}>
              <Check size={14} style={{ color: BLUSH_MID, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: BLACK }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '80px clamp(24px, 6vw, 80px) 100px', maxWidth: 760, margin: '0 auto' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUSH_MID, marginBottom: 16 }}>
          FAQ
        </p>
        <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(2rem,5vw,3.5rem)', color: BLACK, lineHeight: 1.05, margin: '0 0 48px' }}>
          Common questions.
        </h2>
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          {FAQS.map(faq => <FAQItem key={faq.q} {...faq} />)}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA BANNER — black with blush button
      ══════════════════════════════════════════════════════ */}
      <section style={{
        margin: '0 clamp(20px, 4vw, 60px) 80px',
        borderRadius: 28, background: BLACK,
        padding: '80px clamp(32px, 6vw, 80px)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 32,
      }}>
        <div>
          <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(2rem,5vw,3.2rem)', color: BG, lineHeight: 1.05, margin: '0 0 14px' }}>
            Start building your<br /><span style={{ color: BLUSH }}>financial clarity.</span>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', margin: 0 }}>Free, forever. No credit card required.</p>
        </div>
        <Link to="/register" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '17px 34px', borderRadius: 99, fontSize: 15, fontWeight: 700,
          background: BLUSH, color: BLACK,
          textDecoration: 'none', letterSpacing: '-0.01em', flexShrink: 0,
          transition: 'opacity .2s, transform .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity='.85'; e.currentTarget.style.transform='scale(1.03)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)' }}>
          Get started free <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer style={{
        padding: '40px clamp(24px, 6vw, 80px)',
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        borderTop: `1px solid ${BORDER}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/momentum_transparant.png" alt="" style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>Momentum Finance</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.3)', margin: 0 }}>
          © {new Date().getFullYear()} Momentum Finance · Free forever
        </p>
      </footer>

    </div>
  )
}
