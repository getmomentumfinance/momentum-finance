import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Wallet, PiggyBank,
  Receipt, CalendarDays, CreditCard, Check,
  Shield, Zap, Users, Plus, Minus,
} from 'lucide-react'

// ── Palette ────────────────────────────────────────────────────────
const OUTER       = '#e0cad4'               // outer page bg
const CARD        = '#ffffff'               // floating card bg
const CARD_TINTED = '#fdf5f8'               // subtle pink-tinted card bg
const BLACK       = '#0f0d0c'
const ROSE        = '#d4608e'               // soft pink rose
const ROSE_LIGHT  = 'rgba(212,96,142,0.1)'
const MUTED       = 'rgba(15,13,12,0.42)'
const BORDER      = 'rgba(15,13,12,0.07)'

const FEATURES = [
  { Icon: BarChart3,    title: 'Deep Analytics',     desc: 'Click any chart to drill into transactions by category, merchant, or importance.' },
  { Icon: Wallet,       title: 'Smart Budgets',       desc: 'Set limits per category. Track rollover, overspend, and any period.' },
  { Icon: PiggyBank,    title: 'Savings Goals',       desc: 'Plan monthly contributions and track progress toward every goal.' },
  { Icon: CalendarDays, title: 'Bills & Planned',     desc: 'Never miss a payment. Log recurring bills before they land.' },
  { Icon: CreditCard,   title: 'Multiple Accounts',   desc: 'Manage debit, credit, cash and savings in one unified view.' },
  { Icon: Receipt,      title: 'Transaction History', desc: 'Split bills, tag importance, attach comments, and search everything.' },
]

const STEPS = [
  { n: '01', title: 'Create your account',   desc: 'Sign up in seconds — no credit card, no trial. Every feature is unlocked from day one.' },
  { n: '02', title: 'Log your transactions', desc: 'Add income, expenses, and transfers. Split bills, set categories, and mark importance.' },
  { n: '03', title: 'Build real clarity',    desc: 'Beat every budget, reach your goals, and finally understand your full financial picture.' },
]

const FAQS = [
  { q: 'Is Momentum really free?',       a: 'Yes — completely free, forever. No credit card, no trial, no paywalled features.' },
  { q: 'Is my financial data secure?',   a: 'Your data is encrypted and stored securely. We never share or sell your information.' },
  { q: 'Can I use it on my phone?',      a: 'Momentum works in any modern browser on desktop or mobile.' },
  { q: 'What currencies are supported?', a: 'Any currency — EUR, USD, GBP, and more. Just pick yours in settings.' },
]

const INCLUDED = [
  'Unlimited transactions',      'Multiple accounts & cards',
  'Savings goals with planning', 'Interactive deep analytics',
  'Recurring & planned bills',   'Calendar view',
  'Smart budgeting tools',       'Customizable themes',
]

// ── FAQ accordion ──────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: BLACK, letterSpacing: '-0.01em' }}>{q}</span>
        <span style={{ color: ROSE, flexShrink: 0, marginLeft: 16 }}>
          {open ? <Minus size={15} /> : <Plus size={15} />}
        </span>
      </button>
      {open && <p style={{ fontSize: 14, lineHeight: 1.75, color: MUTED, paddingBottom: 20, margin: 0 }}>{a}</p>}
    </div>
  )
}

// ── Shared card wrapper ────────────────────────────────────────────
function Card({ children, tinted = false, style = {} }) {
  return (
    <div style={{
      background: tinted ? CARD_TINTED : CARD,
      borderRadius: 28,
      boxShadow: '0 2px 24px rgba(180,120,150,0.1), 0 1px 4px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      marginBottom: 16,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = OUTER
    document.documentElement.style.background = OUTER
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  return (
    <div style={{ background: OUTER, minHeight: '100vh', padding: 'clamp(16px, 3vw, 40px)', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        {/* ══════════════════════════════════════════════════
            HERO CARD
        ══════════════════════════════════════════════════ */}
        <Card tinted style={{ marginBottom: 16 }}>

          {/* Nav */}
          <nav style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 32px',
            borderBottom: `1px solid ${BORDER}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: BLACK,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                <img src="/momentum_transparant.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', color: BLACK }}>Momentum</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {['#features', '#how-it-works', '#faq'].map((href, i) => (
                <a key={href} href={href} style={{
                  fontSize: 13, fontWeight: 500, color: MUTED,
                  textDecoration: 'none', padding: '6px 12px', borderRadius: 99,
                  transition: 'color .18s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = BLACK}
                  onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                  {['Features', 'How It Works', 'FAQ'][i]}
                </a>
              ))}
              <Link to="/login" style={{
                fontSize: 13, fontWeight: 500, color: MUTED,
                textDecoration: 'none', padding: '6px 12px', borderRadius: 99,
                transition: 'color .18s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = BLACK}
                onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                Log in
              </Link>
            </div>

            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700,
              background: ROSE, color: '#fff',
              textDecoration: 'none', transition: 'opacity .18s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Start Today <ArrowRight size={13} />
            </Link>
          </nav>

          {/* Hero content — centered */}
          <div style={{ padding: 'clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px)', textAlign: 'center' }}>

            {/* Label pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32,
              padding: '5px 14px', borderRadius: 99,
              background: ROSE_LIGHT, border: `1px solid rgba(212,96,142,0.2)`,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: ROSE }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ROSE }}>
                Personal Finance · Reinvented
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em',
              fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
              margin: '0 0 20px', color: BLACK,
            }}>
              Your money,{' '}
              <em style={{ fontStyle: 'italic', fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, color: ROSE }}>
                finally
              </em>
              <br />on your side.
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(14px, 1.5vw, 17px)', lineHeight: 1.7,
              color: MUTED, maxWidth: 480, margin: '0 auto 40px',
            }}>
              Stop wondering where it all went. Track every transaction, beat every budget, and grow toward the goals that actually matter — free, forever.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700,
                background: ROSE, color: '#fff',
                textDecoration: 'none', transition: 'opacity .18s, transform .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)' }}>
                Get started free <ArrowRight size={14} />
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: ROSE, opacity: 0.5 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>Always free · No card needed</span>
              </div>
            </div>

            {/* Trust row */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 40 }}>
              {[
                { Icon: Shield, text: 'Private by default' },
                { Icon: Zap,    text: 'Always free'        },
                { Icon: Users,  text: 'No limits'          },
              ].map(({ Icon, text }) => (
                <div key={text} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 99,
                  background: 'rgba(15,13,12,0.04)', border: `1px solid ${BORDER}`,
                }}>
                  <Icon size={10} style={{ color: ROSE }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: MUTED }}>{text}</span>
                </div>
              ))}
            </div>

          </div>
        </Card>

        {/* ══════════════════════════════════════════════════
            HOW IT WORKS CARD
        ══════════════════════════════════════════════════ */}
        <Card id="how-it-works" style={{ marginBottom: 16 }}>
          <div style={{ padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px)' }}>

            {/* Label */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
              padding: '5px 12px', borderRadius: 99,
              background: 'rgba(15,13,12,0.04)', border: `1px solid ${BORDER}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '0.06em' }}>How It Works</span>
            </div>

            <h2 style={{
              fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,3rem)',
              color: BLACK, lineHeight: 1.07, margin: '0 0 12px',
            }}>
              We didn't reinvent the wheel.
              <br />Just personal{' '}
              <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', fontWeight: 700, color: ROSE }}>
                finance.
              </em>
            </h2>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, maxWidth: 480, margin: '0 0 48px' }}>
              Three simple steps to a complete picture of your money.
            </p>

            {/* Step indicators */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
              {STEPS.map(({ n }, i) => (
                <>
                  <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: i === 1 ? ROSE : MUTED }}>Step ({i + 1})</span>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: i === 1 ? ROSE : 'rgba(15,13,12,0.15)',
                      boxShadow: i === 1 ? `0 0 0 3px ${ROSE_LIGHT}` : 'none',
                    }} />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div key={`line-${i}`} style={{
                      flex: 1, height: 1.5, borderRadius: 99, margin: '16px 8px 0',
                      background: i === 0 ? `linear-gradient(to right, rgba(15,13,12,0.12), ${ROSE})` : 'rgba(15,13,12,0.12)',
                    }} />
                  )}
                </>
              ))}
            </div>

            {/* Step cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STEPS.map(({ n, title, desc }, i) => (
                <div key={n} style={{
                  padding: 24, borderRadius: 20,
                  background: i === 1 ? ROSE_LIGHT : 'rgba(15,13,12,0.03)',
                  border: `1px solid ${i === 1 ? 'rgba(212,96,142,0.2)' : BORDER}`,
                }}>
                  <div style={{
                    fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 900,
                    letterSpacing: '-0.04em', color: i === 1 ? ROSE : 'rgba(15,13,12,0.15)',
                    lineHeight: 1, marginBottom: 16,
                  }}>{n}</div>
                  <h3 style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: BLACK, margin: '0 0 8px' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: MUTED, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════
            FEATURES CARD
        ══════════════════════════════════════════════════ */}
        <Card id="features" style={{ marginBottom: 16 }}>
          <div style={{ padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
              padding: '5px 12px', borderRadius: 99,
              background: 'rgba(15,13,12,0.04)', border: `1px solid ${BORDER}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '0.06em' }}>What's Included</span>
            </div>
            <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,3rem)', color: BLACK, lineHeight: 1.07, margin: '0 0 48px' }}>
              Everything you need.<br />Nothing you don't.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ Icon, title, desc }) => (
                <div key={title} style={{
                  padding: 24, borderRadius: 18,
                  background: 'rgba(15,13,12,0.02)', border: `1px solid ${BORDER}`,
                  transition: 'border-color .2s, transform .2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(212,96,142,0.3)'; e.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform='translateY(0)' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, marginBottom: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ROSE_LIGHT,
                  }}>
                    <Icon size={18} style={{ color: ROSE }} />
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 14, color: BLACK, margin: '0 0 6px', letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: MUTED, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Included list */}
            <div style={{ marginTop: 48, paddingTop: 40, borderTop: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ROSE, marginBottom: 20 }}>
                No tiers. No limits. Always free.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {INCLUDED.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={13} style={{ color: ROSE, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: BLACK }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════
            FAQ CARD
        ══════════════════════════════════════════════════ */}
        <Card id="faq" style={{ marginBottom: 16 }}>
          <div style={{ padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px)', maxWidth: 680 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
              padding: '5px 12px', borderRadius: 99,
              background: 'rgba(15,13,12,0.04)', border: `1px solid ${BORDER}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '0.06em' }}>FAQ</span>
            </div>
            <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,3rem)', color: BLACK, lineHeight: 1.07, margin: '0 0 40px' }}>
              Common questions.
            </h2>
            <div style={{ borderTop: `1px solid ${BORDER}` }}>
              {FAQS.map(faq => <FAQItem key={faq.q} {...faq} />)}
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════
            CTA CARD
        ══════════════════════════════════════════════════ */}
        <Card style={{
          background: BLACK, marginBottom: 16,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 28,
          padding: 'clamp(40px, 6vw, 64px) clamp(24px, 5vw, 64px)',
        }}>
          <div>
            <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: '#fff', lineHeight: 1.07, margin: '0 0 10px' }}>
              Start building your{' '}
              <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', fontWeight: 700, color: ROSE }}>
                financial clarity.
              </em>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Free, forever. No credit card required.</p>
          </div>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '15px 30px', borderRadius: 99, fontSize: 14, fontWeight: 700,
            background: ROSE, color: '#fff',
            textDecoration: 'none', flexShrink: 0,
            transition: 'opacity .18s, transform .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity='.85'; e.currentTarget.style.transform='scale(1.03)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)' }}>
            Get started free <ArrowRight size={15} />
          </Link>
        </Card>

        {/* ── Footer ──────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '20px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: BLACK, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src="/momentum_transparant.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(15,13,12,0.45)' }}>Momentum Finance</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.3)', margin: 0 }}>
            © {new Date().getFullYear()} Momentum Finance · Free forever
          </p>
        </div>

      </div>
    </div>
  )
}
