import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ChevronDown, BarChart3, Wallet,
  PiggyBank, CalendarDays, Check, Shield, Zap,
} from 'lucide-react'
import GradientMenu from '../components/ui/gradient-menu'

const GRAD  = '#ffb5ba'
const BLACK = '#6b1f40'
const ROSE  = '#986798'
const MUTED = 'rgba(107,31,64,0.55)'
const GLASS = 'rgba(255,255,255,0.3)'
const GLASS_BORDER = 'rgba(255,255,255,0.55)'

// ── Fake donut chart ───────────────────────────────────────────────
function FakeDonut({ pct = 68, color = '#c97aaa', size = 72 }) {
  const sw = 6, r = (size - sw) / 2, circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize="11" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  )
}

// ── Mock dashboard preview ─────────────────────────────────────────
function AppPreview() {
  const bars = [45, 62, 38, 80, 55, 72, 90]
  const txns = [
    { name: 'Groceries', cat: 'Food', amt: '-€42.50', color: '#c97aaa' },
    { name: 'Salary',    cat: 'Income', amt: '+€2,800', color: '#7acc8a' },
    { name: 'Netflix',   cat: 'Subscriptions', amt: '-€15.99', color: '#c97aaa' },
    { name: 'Gym',       cat: 'Health', amt: '-€29.00', color: '#c97aaa' },
  ]
  return (
    <div style={{
      background: 'rgba(14,10,18,0.82)',
      backdropFilter: 'blur(24px)',
      borderRadius: 24,
      padding: 24,
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
      maxWidth: 380, width: '100%',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Net worth</p>
          <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>€12,450</p>
          <p style={{ fontSize: 11, color: '#7acc8a', margin: '4px 0 0' }}>↑ €340 this month</p>
        </div>
        <FakeDonut pct={68} color="#c97aaa" size={68} />
      </div>

      {/* Mini bar chart */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Monthly spending</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 44 }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: 4,
              background: i === bars.length - 1 ? '#c97aaa' : 'rgba(255,255,255,0.12)',
              transition: 'height .3s',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <span key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', flex: 1, textAlign: 'center' }}>{d}</span>
          ))}
        </div>
      </div>

      {/* Budget bars */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Budgets</p>
        {[
          { label: 'Food', pct: 74, color: '#c97aaa' },
          { label: 'Transport', pct: 32, color: '#7ab8cc' },
          { label: 'Fun', pct: 91, color: '#e09060' },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 11, color, fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent</p>
        {txns.map(({ name, cat, amt, color }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>{name}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{cat}</p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{amt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = '#ffb5ba'
    document.documentElement.style.background = '#ffb5ba'
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  return (
    <div style={{ background: GRAD, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px clamp(24px, 6vw, 72px)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        {/* Logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: BLACK,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <img src="/momentum_transparant.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', color: BLACK }}>Momentum</span>
        </div>

        <GradientMenu />
      </nav>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section style={{
        minHeight: 'calc(100vh - 76px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '40px clamp(24px, 6vw, 80px) 60px',
        position: 'relative',
      }}>
        <h1 style={{
          fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.035em',
          fontSize: 'clamp(3rem, 8vw, 6.5rem)',
          margin: '0 0 22px', color: BLACK,
        }}>
          Your money,{' '}
          <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', fontWeight: 700, color: ROSE }}>
            finally
          </em>
          <br />on your side.
        </h1>

        <p style={{
          fontSize: 'clamp(14px, 1.5vw, 17px)', lineHeight: 1.75,
          color: MUTED, maxWidth: 460, margin: '0 0 40px',
        }}>
          Stop wondering where it all went. Track every transaction, beat every budget, and grow toward the goals that actually matter — free, forever.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56 }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700,
            background: BLACK, color: '#fff', textDecoration: 'none',
            transition: 'opacity .18s, transform .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity='.85'; e.currentTarget.style.transform='scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)' }}>
            Start for free <ArrowRight size={14} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: BLACK, opacity: 0.35 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>No credit card · Free forever</span>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLACK }}>Scroll</span>
          <ChevronDown size={16} color={BLACK} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS ROW
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: '0 clamp(24px, 6vw, 80px) 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}>
          {[
            { num: '100%', label: 'Free forever', sub: 'No trials. No tiers.' },
            { num: '∞',    label: 'Transactions', sub: 'Log as many as you need.' },
            { num: '0',    label: 'Data sold',    sub: 'Your finances stay yours.' },
          ].map(({ num, label, sub }) => (
            <div key={label} style={{
              padding: 'clamp(20px, 3vw, 36px)',
              background: GLASS,
              border: `1px solid ${GLASS_BORDER}`,
              borderRadius: 20,
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: BLACK, margin: '0 0 6px', lineHeight: 1 }}>{num}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: BLACK, margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          APP PREVIEW + FEATURES
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: '0 clamp(24px, 6vw, 80px) 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'center' }}>

          {/* Mock app */}
          <AppPreview />

          {/* Feature list */}
          <div style={{ flex: '1 1 300px', maxWidth: 420 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLACK, opacity: 0.5, marginBottom: 16 }}>
              What you get
            </p>
            <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: BLACK, lineHeight: 1.05, margin: '0 0 32px' }}>
              Everything in one<br />
              <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: 'rgba(255,255,255,0.85)' }}>clear picture.</em>
            </h2>

            {[
              { Icon: BarChart3,    title: 'Deep analytics',   desc: 'Click any chart to drill into the transactions behind it — by category, merchant, or importance.' },
              { Icon: Wallet,       title: 'Smart budgets',    desc: 'Set limits, track rollover, and get alerted before you overspend.' },
              { Icon: PiggyBank,    title: 'Savings goals',    desc: 'Plan monthly contributions and watch your goals grow in real time.' },
              { Icon: CalendarDays, title: 'Bills & planned',  desc: 'Never miss a recurring payment. Plan future expenses before they land.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: GLASS, border: `1px solid ${GLASS_BORDER}`,
                  backdropFilter: 'blur(8px)',
                }}>
                  <Icon size={18} color={BLACK} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: BLACK, margin: '0 0 4px' }}>{title}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: MUTED, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          INCLUDED CHECKLIST
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: '0 clamp(24px, 6vw, 80px) 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          background: GLASS, border: `1px solid ${GLASS_BORDER}`,
          borderRadius: 24, backdropFilter: 'blur(12px)',
          padding: 'clamp(32px, 5vw, 56px)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24, marginBottom: 36 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLACK, opacity: 0.5, margin: '0 0 10px' }}>No tiers. No limits.</p>
              <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: BLACK, lineHeight: 1.05, margin: 0 }}>
                Everything. Always free.
              </h2>
            </div>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 99, fontSize: 13, fontWeight: 700,
              background: BLACK, color: '#fff', textDecoration: 'none', flexShrink: 0,
              transition: 'opacity .18s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Get started free <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              'Unlimited transactions', 'Multiple accounts & cards',
              'Savings goals',          'Deep analytics',
              'Recurring bills',        'Calendar view',
              'Smart budgets',          'Custom design themes',
              'Split transactions',     'Importance tagging',
              'CSV export',             'Multi-currency',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: BLACK,
                }}>
                  <Check size={10} color="#fff" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: BLACK }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: '0 clamp(24px, 6vw, 80px) 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          background: BLACK, borderRadius: 24,
          padding: 'clamp(40px, 6vw, 72px)',
          textAlign: 'center',
        }}>
          <h2 style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: 'clamp(2rem,5vw,3.5rem)', color: '#fff', lineHeight: 1.05, margin: '0 0 16px' }}>
            Start building your{' '}
            <em style={{ fontStyle: 'italic', fontFamily: 'Georgia,"Times New Roman",serif', color: '#c97aaa' }}>
              financial clarity.
            </em>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', margin: '0 0 36px' }}>Free, forever. No credit card required.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 99, fontSize: 15, fontWeight: 700,
              background: 'linear-gradient(135deg, #986798, #e7d2ac)', color: BLACK,
              textDecoration: 'none', transition: 'opacity .18s, transform .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)' }}>
              Get started free <ArrowRight size={15} />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {[
                { Icon: Shield, text: 'Private' },
                { Icon: Zap,    text: 'Free forever' },
              ].map(({ Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={12} color="rgba(255,255,255,0.35)" />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '24px clamp(24px, 6vw, 80px) 32px',
        maxWidth: 1100, margin: '0 auto',
        borderTop: '1px solid rgba(15,13,12,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: BLACK, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/momentum_transparant.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: MUTED }}>Momentum Finance</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.3)', margin: 0 }}>© {new Date().getFullYear()} Momentum Finance · Free forever</p>
      </footer>

    </div>
  )
}
