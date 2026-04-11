import { Link } from 'react-router-dom'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import logoImg from '../assets/momentum_icon-iOS-ClearDark-1024x1024@1x copy.png'

const BG  = 'linear-gradient(135deg, #3b3156, #1e2a4a)'
const BTN = 'linear-gradient(to right, #c084fc, #3b82f6)'

// Renders a cropped portion of a screenshot
function Crop({ src, alt, xPos = '50%', yPos = '50%', height = 220, className = '', style = {} }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-xl ${className}`}
      style={{ height, border: '1px solid rgba(255,255,255,0.08)', ...style }}
    >
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${xPos} ${yPos}`, display: 'block' }}
      />
    </div>
  )
}

const SHOTS = [
  {
    label: 'Dashboard overview',
    desc:  'All your accounts, balances, and key numbers at a glance.',
    src:   '/screenshot_dashboard.png',
    xPos:  '55%',
    yPos:  '12%',
    height: 200,
    span:  'md:col-span-2',
  },
  {
    label: 'Analytics & deep dive',
    desc:  'Click any bar to see the exact transactions behind it.',
    src:   '/screenshot_analytics.png',
    xPos:  '60%',
    yPos:  '90%',
    height: 200,
    span:  '',
  },
  {
    label: 'Goals, bills & wishlist',
    desc:  'Track every commitment — recurring bills, savings goals, and future purchases.',
    src:   '/screenshot_dashboard_2.png',
    xPos:  '50%',
    yPos:  '88%',
    height: 200,
    span:  '',
  },
  {
    label: 'Calendar view',
    desc:  'See your spending laid out day by day across the month.',
    src:   '/screenshot_calendar_month.png',
    xPos:  '50%',
    yPos:  '32%',
    height: 200,
    span:  'md:col-span-2',
  },
]

const INCLUDED = [
  'Unlimited transactions',
  'Smart budgeting tools',
  'Savings goals with planning',
  'Interactive analytics',
  'Multiple accounts & cards',
  'Recurring & planned bills',
  'Calendar & insights view',
  'Beautiful customizable design',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: BG }}>

      {/* Subtle top glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(192,132,252,0.13) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-14 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="Momentum Finance" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-bold text-base tracking-tight">Momentum Finance</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5">
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: BTN }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-14 pt-16 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium text-white/60"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)' }}
        >
          <Sparkles size={11} className="text-white/40" />
          Personal finance, beautifully done
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Take control of{' '}
          <span style={{
            background: 'linear-gradient(135deg, #e0bbe4, #c084fc, #93b5c6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            your finances
          </span>
        </h1>

        <p className="text-base md:text-lg text-white/50 leading-relaxed mb-10 max-w-xl mx-auto">
          Track spending, manage budgets, set savings goals, and understand your money — all in one beautiful app.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: BTN }}
          >
            Get Started Free <ArrowRight size={15} />
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white/65 hover:text-white transition-all hover:bg-white/8"
            style={{ border: '1px solid rgba(255,255,255,0.13)' }}
          >
            Log in to your account
          </Link>
        </div>
      </section>

      {/* ── Screenshot mosaic ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-14 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SHOTS.map(({ label, desc, src, xPos, yPos, height, span }) => (
            <div
              key={label}
              className={`flex flex-col gap-3 ${span}`}
            >
              <Crop
                src={src}
                alt={label}
                xPos={xPos}
                yPos={yPos}
                height={height}
                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.35)' }}
              />
              <div className="px-1">
                <p className="text-sm font-semibold mb-1">{label}</p>
                <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── What's included ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-14 pb-28">
        <div
          className="rounded-3xl p-10 md:p-14"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-white/35 mb-3">Always free</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything included</h2>
            <p className="text-white/40 text-sm">No hidden fees. No paywalled features. Just your finances, sorted.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {INCLUDED.map(item => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)' }}
                >
                  <Check size={10} style={{ color: '#e0bbe4' }} />
                </div>
                <span className="text-sm text-white/60">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: BTN }}
            >
              Create Free Account <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 md:px-14 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Momentum Finance" className="w-5 h-5 rounded object-cover opacity-45" />
          <span className="text-xs text-white/28">© 2026 Momentum Finance</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-xs text-white/28 hover:text-white/55 transition-colors">Log in</Link>
          <Link to="/register" className="text-xs text-white/28 hover:text-white/55 transition-colors">Sign up</Link>
        </div>
      </footer>
    </div>
  )
}
