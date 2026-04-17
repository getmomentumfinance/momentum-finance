import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Wallet, PiggyBank,
  Receipt, CalendarDays, CreditCard, Check,
  Shield, Zap, Users,
} from 'lucide-react'
import GradientMenu from '../components/ui/gradient-menu'
import blob4 from '../assets/blob_4.png'

// ── Warm colour palette (matches blob_1 rose/peach + ref image 2) ─
const BG     = '#0d0a08'
const GLASS  = 'rgba(14, 10, 7, 0.52)'
const BORDER = 'rgba(210, 160, 120, 0.1)'
const A1     = '#d4956b'   // warm amber-rose
const A2     = '#a06840'   // deeper amber

const FEATURE_COLORS = ['#d4956b','#c07850','#e0b088','#d4956b','#c07850','#e0b088']
const FEATURE_BG     = [
  'rgba(212,149,107,0.12)','rgba(192,120,80,0.12)','rgba(224,176,136,0.12)',
  'rgba(212,149,107,0.12)','rgba(192,120,80,0.12)','rgba(224,176,136,0.12)',
]

const FEATURES = [
  { Icon: BarChart3,    title: 'Deep Analytics',     desc: 'Click any chart to drill into the transactions behind it — by category, merchant, or importance.' },
  { Icon: Wallet,       title: 'Smart Budgets',       desc: 'Set limits per category. Track rollover, overspend, and weekly or yearly periods in real time.' },
  { Icon: PiggyBank,    title: 'Savings Goals',       desc: 'Plan monthly contributions and track progress toward every goal you care about.' },
  { Icon: CalendarDays, title: 'Bills & Planned',     desc: 'Never miss a payment. Log recurring bills and planned expenses before they land.' },
  { Icon: CreditCard,   title: 'Multiple Accounts',   desc: 'Manage debit, credit, cash and savings — all synced in one unified view.' },
  { Icon: Receipt,      title: 'Transaction History', desc: 'Split bills, tag importance, attach comments and search across everything you\'ve ever logged.' },
]

const STEPS = [
  { n: '01', title: 'Create your account',   desc: 'Sign up in seconds. No credit card. No trial. Every feature is unlocked from day one.' },
  { n: '02', title: 'Log your transactions', desc: 'Add income, expenses, and transfers. Split bills, set categories, and mark importance.' },
  { n: '03', title: 'Build real clarity',    desc: 'Hit your budgets, reach your savings goals, and finally understand your financial picture.' },
]

const FAQS = [
  { q: 'Is Momentum really free?',       a: 'Yes — completely free, forever. No credit card, no trial, no paywalled features. Everything is always included.' },
  { q: 'Is my financial data secure?',    a: 'Your data is encrypted and stored securely. We never share, sell, or access your financial information.' },
  { q: 'Can I use it on my phone?',       a: 'Momentum works beautifully in any modern browser on desktop or mobile. A dedicated app is on the roadmap.' },
  { q: 'What currencies are supported?',  a: 'Any currency you want — EUR, USD, GBP, and more. Just pick your currency in settings and you\'re good to go.' },
]

const INCLUDED = [
  'Unlimited transactions',       'Multiple accounts & cards',
  'Savings goals with planning',  'Interactive deep analytics',
  'Recurring & planned bills',    'Calendar view',
  'Smart budgeting tools',        'Customizable design themes',
]

// ── Ambient blob for sections below the hero ─────────────────────
function AmbientBlob({ style = {} }) {
  return (
    <div style={{ position: 'absolute', pointerEvents: 'none', ...style }}>
      <img src={blob4} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain',
          mixBlendMode: 'screen',
          filter: 'contrast(1.1) saturate(1.3) brightness(0.75)',
          animation: 'blobDrift 18s ease-in-out infinite',
        }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, transparent 30%, #0d0a08 68%)',
      }} />
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: BG }}>

      {/* ── Global keyframes ─────────────────────────────────────── */}
      <style>{`
        @keyframes blobFloat {
          0%,100% { transform: translate(0,0)      rotate(0deg)  scale(1);    }
          28%     { transform: translate(-18px,22px) rotate(-6deg) scale(1.03); }
          58%     { transform: translate(12px,-16px) rotate(4deg)  scale(0.97); }
        }
        @keyframes blobDrift {
          0%,100% { transform: translateY(0px)   rotate(0deg)  scale(1);    }
          40%     { transform: translateY(-22px) rotate(5deg)  scale(1.03); }
          70%     { transform: translateY(14px)  rotate(-3deg) scale(0.97); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .fu1 { animation: fadeUp .75s cubic-bezier(.22,1,.36,1) .05s both; }
        .fu2 { animation: fadeUp .75s cubic-bezier(.22,1,.36,1) .2s  both; }
        .fu3 { animation: fadeUp .75s cubic-bezier(.22,1,.36,1) .35s both; }
        .fu4 { animation: fadeUp .75s cubic-bezier(.22,1,.36,1) .5s  both; }
        .fu5 { animation: fadeUp .75s cubic-bezier(.22,1,.36,1) .65s both; }
        details summary::-webkit-details-marker { display:none; }
      `}</style>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-8 md:px-16 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/momentum_transparant.png" alt="Momentum" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-semibold text-sm tracking-tight" style={{ color: 'rgba(255,240,225,0.88)' }}>
            Momentum Finance
          </span>
        </div>
        <GradientMenu />
      </nav>

      {/* ════════════════════════════════════════════════════════════
          HERO — one big blob, one centred glass card
      ════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', height: 'calc(100vh - 76px)', overflow: 'hidden', zIndex: 10 }}>

        {/* Warm radial glow baked into the bg — mirrors image 2 */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background:
            `radial-gradient(ellipse 70% 60% at 22% 80%, rgba(200,110,55,0.18) 0%, transparent 62%),
             radial-gradient(ellipse 50% 40% at 50% 50%, rgba(180,90,45,0.07) 0%, transparent 55%)`,
        }} />

        {/* ── BLOB — lower-left, behind the card ── */}
        <div style={{
          position: 'absolute',
          bottom: '-18%', left: '-12%',
          width: 720, height: 720,
          zIndex: 2,
          animation: 'blobFloat 22s ease-in-out infinite',
          pointerEvents: 'none',
        }}>
          <img src={blob4} alt="" style={{
            width: '100%', height: '100%', objectFit: 'contain',
            mixBlendMode: 'screen',
            filter: 'contrast(1.18) saturate(1.45) brightness(0.92)',
          }} />
          {/* Fade blob edges — strongest towards top-right where card sits */}
          <div style={{
            position: 'absolute', inset: 0,
            background:
              `radial-gradient(ellipse 78% 78% at 28% 68%, transparent 42%, ${BG} 78%)`,
          }} />
        </div>

        {/* ── GLASS CARD — centred ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 20px',
        }}>
          <div style={{
            width: '100%', maxWidth: 560,
            background: GLASS,
            backdropFilter: 'blur(40px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
            border: `1px solid ${BORDER}`,
            borderRadius: 28,
            padding: 'clamp(32px, 5vw, 54px)',
            boxShadow: `0 12px 72px rgba(0,0,0,0.55), inset 0 1px 0 rgba(220,170,120,0.08)`,
          }}>

            {/* Badge */}
            <div className="fu1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: `linear-gradient(135deg, ${A1}, ${A2})`,
                boxShadow: `0 0 8px ${A1}90`,
              }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: `${A1}b0` }}>
                Personal Finance · Reinvented
              </span>
            </div>

            {/* Headline */}
            <h1 className="fu2" style={{
              fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.02em', marginBottom: 20,
              fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
              color: 'rgba(255,240,225,0.95)',
            }}>
              Your money,{' '}
              <span style={{
                backgroundImage: `linear-gradient(135deg, #eec89a 0%, ${A1} 45%, ${A2} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                finally
              </span>
              <br />on your side.
            </h1>

            {/* Subtext */}
            <p className="fu3" style={{
              fontSize: 14, lineHeight: 1.75, marginBottom: 32,
              color: 'rgba(255,235,215,0.4)', maxWidth: 420,
            }}>
              Stop wondering where it all went. Track every transaction, beat every budget, and grow toward the goals that actually matter — all in one place. Free, forever.
            </p>

            {/* CTAs */}
            <div className="fu4" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 26px', borderRadius: 99, fontSize: 14, fontWeight: 600,
                background: `linear-gradient(135deg, ${A1}, ${A2})`,
                color: '#1a0f08',
                boxShadow: `0 0 28px ${A1}45`,
                textDecoration: 'none', transition: 'opacity .2s, transform .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = 'scale(1)' }}>
                Start for free <ArrowRight size={14} />
              </Link>
              <a href="#features" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 26px', borderRadius: 99, fontSize: 14, fontWeight: 600,
                background: 'rgba(255,235,210,0.06)',
                border: '1px solid rgba(255,235,210,0.1)',
                color: 'rgba(255,235,210,0.55)',
                textDecoration: 'none', transition: 'background .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,235,210,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,235,210,0.06)'}>
                See features
              </a>
            </div>

            {/* Trust pills */}
            <div className="fu5" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { Icon: Shield, text: 'Private by default' },
                { Icon: Zap,    text: 'Always free'        },
                { Icon: Users,  text: 'No limits'          },
              ].map(({ Icon, text }) => (
                <div key={text} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 99,
                  background: 'rgba(255,235,210,0.05)',
                  border: '1px solid rgba(255,235,210,0.07)',
                }}>
                  <Icon size={10} style={{ color: `${A1}88` }} />
                  <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,235,210,0.33)' }}>{text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Bottom fade into page */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: `linear-gradient(to bottom, transparent, ${BG})`,
          pointerEvents: 'none', zIndex: 15,
        }} />
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════ */}
      <section id="features" style={{ position: 'relative', zIndex: 10, overflow: 'hidden' }}
        className="max-w-7xl mx-auto px-8 md:px-16 py-24">

        <AmbientBlob style={{ width: 460, height: 460, left: -180, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: `${A1}99`, marginBottom: 14 }}>
                What's included
              </p>
              <h2 className="font-bold leading-tight" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', color: 'rgba(255,240,225,0.92)' }}>
                Built for people who take<br />their finances seriously.
              </h2>
            </div>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
              padding: '10px 20px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              border: `1px solid ${A1}60`, color: `${A1}cc`,
              textDecoration: 'none', transition: 'opacity .2s',
            }}
              className="self-start md:self-end"
              onMouseEnter={e => e.currentTarget.style.opacity='.7'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              Get started free <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <div key={title} style={{
                display: 'flex', flexDirection: 'column', gap: 16,
                padding: 24, borderRadius: 18,
                background: 'rgba(255,235,210,0.03)',
                border: '1px solid rgba(255,235,210,0.06)',
                transition: 'border-color .25s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(212,149,107,0.16)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,235,210,0.06)'}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: FEATURE_BG[i], flexShrink: 0,
                }}>
                  <Icon size={17} style={{ color: FEATURE_COLORS[i] }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'rgba(255,240,225,0.88)' }}>{title}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(255,235,210,0.35)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 10, overflow: 'hidden' }}
        className="max-w-7xl mx-auto px-8 md:px-16 py-20">

        <AmbientBlob style={{ width: 400, height: 400, right: -150, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: `${A1}99`, whiteSpace: 'nowrap' }}>
              How it works
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,235,210,0.07)' }} />
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} style={{
                position: 'relative', display: 'flex', flexDirection: 'column', gap: 20,
                padding: 28, borderRadius: 20, overflow: 'hidden',
                background: 'rgba(255,235,210,0.03)',
                border: '1px solid rgba(255,235,210,0.06)',
                transition: 'border-color .25s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(212,149,107,0.15)'; e.currentTarget.querySelector('.step-line').style.opacity='1' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,235,210,0.06)'; e.currentTarget.querySelector('.step-line').style.opacity='0' }}>
                <div className="step-line" style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: `linear-gradient(90deg, ${A1}, ${A2})`,
                  opacity: 0, transition: 'opacity .3s',
                }} />
                <span style={{
                  fontSize: '4.5rem', fontWeight: 900, lineHeight: 1,
                  backgroundImage: `linear-gradient(135deg, ${A1}2a, ${A2}2a)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {n}
                </span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'rgba(255,240,225,0.85)' }}>{title}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(255,235,210,0.35)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════════════ */}
      <section id="faq" className="relative z-10 max-w-3xl mx-auto px-8 md:px-16 py-16">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: `${A1}99` }}>
            FAQ
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,235,210,0.07)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map(({ q, a }) => (
            <details key={q} style={{
              borderRadius: 18, overflow: 'hidden',
              background: 'rgba(255,235,210,0.03)',
              border: '1px solid rgba(255,235,210,0.07)',
            }}>
              <summary style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 24px', cursor: 'pointer', listStyle: 'none',
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,240,225,0.72)' }}>{q}</span>
                <span style={{ color: 'rgba(255,235,210,0.25)', marginLeft: 16, flexShrink: 0, fontSize: 20, lineHeight: 1 }}>+</span>
              </summary>
              <p style={{ padding: '0 24px 18px', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,235,210,0.38)' }}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 py-16 pb-28">
        <div style={{
          position: 'relative', borderRadius: 28, overflow: 'hidden',
          background: 'rgba(255,235,210,0.03)',
          border: `1px solid ${A1}28`,
        }}>
          <AmbientBlob style={{ width: 440, height: 440, right: -140, top: '50%', transform: 'translateY(-50%)', opacity: 0.38 }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 55% 75% at 85% 50%, ${A1}10, transparent)`,
          }} />
          <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(40px,5vw,64px)' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: `${A1}90`, marginBottom: 20 }}>
              Always free · No limits
            </p>
            <h2 style={{ fontWeight: 700, lineHeight: 1.2, marginBottom: 14, fontSize: 'clamp(1.8rem,4vw,2.8rem)', maxWidth: 460, color: 'rgba(255,240,225,0.92)' }}>
              Everything you need to take control of your finances.
            </h2>
            <p style={{ fontSize: 14, marginBottom: 36, maxWidth: 420, color: 'rgba(255,235,210,0.38)', lineHeight: 1.7 }}>
              No hidden fees. No paywalled features. No limits. Everything is included from the moment you sign up.
            </p>
            <div className="grid grid-cols-2 gap-2.5 mb-10 max-w-sm">
              {INCLUDED.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${A1}1a`, border: `1px solid ${A1}38`,
                  }}>
                    <Check size={9} style={{ color: A1 }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,235,210,0.45)' }}>{item}</span>
                </div>
              ))}
            </div>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 32px', borderRadius: 99, fontSize: 14, fontWeight: 600,
              background: `linear-gradient(135deg, ${A1}, ${A2})`,
              color: '#1a0f08', textDecoration: 'none',
              boxShadow: `0 0 40px ${A1}40`,
              transition: 'opacity .2s, transform .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)'    }}>
              Create Free Account <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/momentum_transparant.png" alt="" className="w-5 h-5 rounded object-cover" style={{ opacity: 0.28 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,235,210,0.2)' }}>© 2026 Momentum Finance</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {[['Features','#features'],['How It Works','#how-it-works'],['FAQ','#faq']].map(([l,h]) => (
            <a key={l} href={h} style={{ fontSize: 12, color: 'rgba(255,235,210,0.22)', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color='rgba(255,235,210,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,235,210,0.22)'}>{l}</a>
          ))}
          <Link to="/login"    style={{ fontSize: 12, color: 'rgba(255,235,210,0.22)', textDecoration: 'none' }}>Log in</Link>
          <Link to="/register" style={{ fontSize: 12, color: 'rgba(255,235,210,0.22)', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </footer>

    </div>
  )
}
