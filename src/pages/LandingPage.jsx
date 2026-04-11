import { Link } from 'react-router-dom'
import { TrendingDown, Target, PiggyBank, BarChart2, ArrowRight, Check, Sparkles, CalendarDays, Receipt } from 'lucide-react'
import logoImg from '../assets/momentum_icon-iOS-ClearDark-1024x1024@1x copy.png'

const BG = 'linear-gradient(135deg, #3b3156, #1e2a4a)'
const BTN = 'linear-gradient(to right, #c084fc, #3b82f6)'

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

function AppFrame({ src, alt, tilt = 'none' }) {
  const transform =
    tilt === 'left'  ? 'perspective(1200px) rotateY(6deg) rotateX(2deg)'  :
    tilt === 'right' ? 'perspective(1200px) rotateY(-6deg) rotateX(2deg)' : 'none'

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{
        transform,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2.5" style={{ background: 'rgba(15,12,24,0.9)' }}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>
      <img src={src} alt={alt} className="w-full block" style={{ display: 'block' }} />
    </div>
  )
}

function FeatureSection({ eyebrow, title, desc, bullets, imgSrc, imgAlt, reverse = false }) {
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-16`}>
      <div className="flex-1 max-w-md">
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#c084fc' }}>{eyebrow}</p>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-snug">{title}</h2>
        <p className="text-white/55 leading-relaxed mb-6 text-sm">{desc}</p>
        {bullets && (
          <ul className="flex flex-col gap-2">
            {bullets.map(b => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-white/65">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#c084fc' }} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex-1 w-full">
        <AppFrame src={imgSrc} alt={imgAlt} tilt={reverse ? 'right' : 'left'} />
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen relative text-white overflow-x-hidden" style={{ background: BG }}>

      {/* Subtle radial glow behind hero */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(192,132,252,0.12) 0%, transparent 70%)',
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
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-14 pt-16 pb-24 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium text-white/65"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <Sparkles size={11} className="text-white/40" />
          Personal finance, beautifully done
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl mx-auto">
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

        <p className="text-base md:text-lg text-white/55 leading-relaxed mb-10 max-w-xl mx-auto">
          Track spending, manage budgets, set savings goals, and understand your money — all in one beautiful app.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: BTN }}
          >
            Get Started Free <ArrowRight size={15} />
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all hover:bg-white/8"
            style={{ border: '1px solid rgba(255,255,255,0.14)' }}
          >
            Log in to your account
          </Link>
        </div>

        {/* Main dashboard screenshot */}
        <div className="max-w-5xl mx-auto">
          <AppFrame src="/screenshot_dashboard.png" alt="Momentum Finance Dashboard" />
        </div>
      </section>

      {/* ── Feature sections ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-14 pb-28 flex flex-col gap-28">

        <FeatureSection
          eyebrow="Analytics"
          title="Understand exactly where your money goes"
          desc="Drill into your spending by category, subcategory, merchant or importance. Click any bar in the chart to see the exact transactions behind it."
          bullets={[
            'Bar and line charts across any time range',
            'Click-to-drill transaction breakdown',
            'Projected month-end spend',
            'Top category & merchant insights',
          ]}
          imgSrc="/screenshot_analytics.png"
          imgAlt="Analytics deep dive"
        />

        <FeatureSection
          eyebrow="Bills, Goals & Wishlist"
          title="Stay on top of every commitment"
          desc="Track recurring bills, planned expenses, subscriptions and wishlist items — all in one place. Never be surprised by a charge again."
          bullets={[
            'Recurring & planned bill tracking',
            'Savings goals with monthly planning',
            'Wishlist to plan future purchases',
            'Balance projection for the month',
          ]}
          imgSrc="/screenshot_dashboard_2.png"
          imgAlt="Bills, goals and wishlist"
          reverse
        />

        <FeatureSection
          eyebrow="Calendar"
          title="See your finances as a timeline"
          desc="The calendar view puts your transactions in context. See exactly what you spent on any day, week or month at a glance."
          bullets={[
            'Month and week views',
            'Daily income and expense summary',
            'Per-day transaction list',
            'Color-coded by type',
          ]}
          imgSrc="/screenshot_calendar_month.png"
          imgAlt="Calendar view"
        />

      </section>

      {/* ── What's included ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-14 pb-28">
        <div
          className="rounded-3xl p-10 md:p-14"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Always free</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything included</h2>
            <p className="text-white/45 text-sm">No hidden fees. No paywalled features. Just your finances, sorted.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {INCLUDED.map(item => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(192,132,252,0.18)', border: '1px solid rgba(192,132,252,0.35)' }}
                >
                  <Check size={10} style={{ color: '#e0bbe4' }} />
                </div>
                <span className="text-sm text-white/65">{item}</span>
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
          <img src={logoImg} alt="Momentum Finance" className="w-5 h-5 rounded object-cover opacity-50" />
          <span className="text-xs text-white/30">© 2026 Momentum Finance</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">Log in</Link>
          <Link to="/register" className="text-xs text-white/30 hover:text-white/60 transition-colors">Sign up</Link>
        </div>
      </footer>
    </div>
  )
}
