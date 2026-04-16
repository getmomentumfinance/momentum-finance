import { Link } from 'react-router-dom'
import { ArrowRight, Check, TrendingUp, TrendingDown } from 'lucide-react'

const BTN = 'linear-gradient(to right, #c084fc, #3b82f6)'

// ── Marquee ────────────────────────────────────────────────────────
function Marquee({ children, reverse = false, pauseOnHover = false }) {
  return (
    <div className={`overflow-hidden ${pauseOnHover ? 'marquee-pause' : ''}`}>
      <div
        className="marquee-track flex w-max"
        style={{ animation: `${reverse ? 'marquee-reverse' : 'marquee'} 30s linear infinite` }}
      >
        {children}
        {children}
      </div>
    </div>
  )
}

const REVIEWS = [
  { name: 'Sarah M.',  handle: '@sarah_m',  body: 'Finally understand where every euro goes. The analytics are insanely detailed.', color: '#c084fc' },
  { name: 'Tom V.',   handle: '@tomv',      body: "Budgets are actually fun to manage now. Never thought I'd say that.", color: '#3b82f6' },
  { name: 'Lena K.',  handle: '@lena.k',   body: 'Set my first savings goal and actually hit it. The tracking made all the difference.', color: '#22c55e' },
  { name: 'James F.', handle: '@jamesf',   body: 'Caught two forgotten subscriptions in the first week. Already paid for itself.', color: '#f59e0b' },
  { name: 'Mia P.',   handle: '@mia_p',    body: 'The calendar view is beautiful. I check it every morning with my coffee.', color: '#ec4899' },
  { name: 'Kai D.',   handle: '@kai_dev',  body: 'Dark mode, custom themes, everything feels polished. Love the attention to detail.', color: '#06b6d4' },
  { name: 'Anna R.',  handle: '@anna.r',   body: 'Split bills across categories — game changer. My partner and I finally agree on spending.', color: '#8b5cf6' },
  { name: 'Felix B.', handle: '@felixb',   body: 'Used to dread month end. Now I actually look forward to seeing the numbers.', color: '#f97316' },
]

const firstRow  = REVIEWS.slice(0, REVIEWS.length / 2)
const secondRow = REVIEWS.slice(REVIEWS.length / 2)

function ReviewCard({ name, handle, body, color }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
  return (
    <figure
      className="relative mx-2 flex h-full w-64 shrink-0 flex-col gap-3 cursor-default overflow-hidden rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}>
          {initials}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-white/80">{name}</span>
          <span className="text-[11px] text-white/30">{handle}</span>
        </div>
      </div>
      <blockquote className="text-xs text-white/50 leading-relaxed">{body}</blockquote>
    </figure>
  )
}

const FEATURES = [
  { title: 'Expense Tracking',   desc: 'Log every transaction, split bills, and categorize your spending automatically.' },
  { title: 'Budgets & Targets',  desc: 'Set spending limits per category and get alerted before you overspend.' },
  { title: 'Savings Goals',      desc: 'Plan monthly contributions and watch your goals fill up over time.' },
  { title: 'Deep Analytics',     desc: 'Interactive charts — click any bar to see the transactions behind it.' },
  { title: 'Calendar View',      desc: 'See your finances laid out day by day, week by week.' },
  { title: 'Recurring Bills',    desc: 'Never be surprised by a charge. Track every subscription and planned expense.' },
]

const INCLUDED = [
  'Unlimited transactions',
  'Multiple accounts & cards',
  'Savings goals with planning',
  'Interactive analytics',
  'Recurring & planned bills',
  'Calendar & insights view',
  'Smart budgeting tools',
  'Beautiful customizable design',
]

// Minimal floating stat card
function FloatCard({ children, style = {}, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#09070f' }}>

      {/* Large ambient glow behind hero */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 65% 55% at 50% 5%, rgba(167,118,147,0.22) 0%, rgba(59,49,86,0.1) 50%, transparent 75%)',
        zIndex: 0,
      }} />

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img src={'/momentum_transparant.png'} alt="Momentum Finance" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-semibold text-sm tracking-tight text-white/90">Momentum Finance</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm text-white/50 hover:text-white/80 transition-colors px-4 py-2">
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold px-5 py-2 rounded-full transition-all hover:opacity-90"
            style={{ background: BTN }}
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-40">

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6 max-w-2xl">
          Your finances,{' '}
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #e0bbe4 10%, #c084fc 50%, #93b5c6 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            finally clear
          </span>
        </h1>

        <p className="text-base md:text-lg text-white/45 mb-10 max-w-md leading-relaxed">
          Track spending, manage budgets, and build savings — all in one beautifully designed app.
        </p>

        <Link
          to="/register"
          className="flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02] mb-3"
          style={{ background: BTN }}
        >
          Get Started Free <ArrowRight size={15} />
        </Link>
        <p className="text-xs text-white/28">No credit card required</p>

        {/* Floating cards — desktop only */}
        <div className="hidden md:block">

          {/* Left card */}
          <FloatCard
            className="absolute w-52 text-left"
            style={{ left: '8%', bottom: '12%' }}
          >
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Net worth</p>
            <p className="text-2xl font-bold tabular-nums mb-1">€4,280</p>
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp size={12} />
              <span className="text-xs font-medium">+12% this month</span>
            </div>
            <div className="mt-3 flex gap-1 items-end h-8">
              {[40,55,45,70,60,85,75].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 6 ? '#c084fc' : 'rgba(192,132,252,0.25)' }} />
              ))}
            </div>
          </FloatCard>

          {/* Right card */}
          <FloatCard
            className="absolute w-44 text-left"
            style={{ right: '8%', bottom: '18%' }}
          >
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Budget</p>
            <p className="text-3xl font-bold tabular-nums">78%</p>
            <p className="text-[11px] text-white/40 mb-3">On track</p>
            <div className="h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: '78%', background: BTN }} />
            </div>
          </FloatCard>

          {/* Top right small card */}
          <FloatCard
            className="absolute w-40 text-left"
            style={{ right: '14%', top: '8%' }}
          >
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5">Savings goals</p>
            <p className="text-xl font-bold">3 active</p>
            <div className="flex items-center gap-1 mt-1 text-white/40">
              <TrendingUp size={11} className="text-purple-400" />
              <span className="text-[11px]">€890 saved</span>
            </div>
          </FloatCard>

        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 pb-28">
        <p className="text-xs uppercase tracking-widest text-white/30 text-center mb-12">Everything you need</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '1.5rem', overflow: 'hidden' }}>
          {FEATURES.map(({ title, desc }) => (
            <div
              key={title}
              className="p-6 flex flex-col gap-2"
              style={{ background: '#09070f' }}
            >
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials marquee ── */}
      <section className="relative z-10 pb-28 overflow-hidden">
        <p className="text-xs uppercase tracking-widest text-white/30 text-center mb-12">What people are saying</p>
        <div className="flex flex-col gap-3">
          <Marquee pauseOnHover>
            {firstRow.map(r => <ReviewCard key={r.handle} {...r} />)}
          </Marquee>
          <Marquee reverse pauseOnHover>
            {secondRow.map(r => <ReviewCard key={r.handle} {...r} />)}
          </Marquee>
        </div>
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32"
          style={{ background: 'linear-gradient(to right, #09070f, transparent)' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32"
          style={{ background: 'linear-gradient(to left, #09070f, transparent)' }} />
      </section>

      {/* ── Included / CTA ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 md:px-16 pb-28 text-center">
        <p className="text-xs uppercase tracking-widest text-white/30 mb-4">Always free</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything included</h2>
        <p className="text-white/40 text-sm mb-10">No hidden fees. No paywalled features.</p>

        <div className="grid grid-cols-2 gap-2.5 mb-10 text-left max-w-lg mx-auto">
          {INCLUDED.map(item => (
            <div key={item} className="flex items-center gap-2.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)' }}
              >
                <Check size={9} style={{ color: '#e0bbe4' }} />
              </div>
              <span className="text-xs text-white/55">{item}</span>
            </div>
          ))}
        </div>

        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{ background: BTN }}
        >
          Create Free Account <ArrowRight size={15} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={'/momentum_transparant.png'} alt="" className="w-5 h-5 rounded object-cover opacity-40" />
          <span className="text-xs text-white/25">© 2026 Momentum Finance</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-xs text-white/25 hover:text-white/55 transition-colors">Log in</Link>
          <Link to="/register" className="text-xs text-white/25 hover:text-white/55 transition-colors">Sign up</Link>
        </div>
      </footer>
    </div>
  )
}
