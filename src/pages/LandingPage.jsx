import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, TrendingUp, TrendingDown,
  Wallet, PiggyBank, BarChart3, CalendarDays,
  Receipt, Star, Zap,
} from 'lucide-react'

const BTN = 'linear-gradient(135deg, #c084fc, #3b82f6)'

// ── Tiny shared helpers ────────────────────────────────────────────

function MiniBar({ label, color, pct, spent, limit, warn }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">{label}</span>
        <span className="text-[11px] tabular-nums" style={{ color: warn ? '#f59e0b' : 'rgba(255,255,255,0.35)' }}>
          {spent} / {limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: warn ? '#f59e0b' : color }} />
      </div>
    </div>
  )
}

function GlassCard({ children, style = {}, className = '' }) {
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

// ── Feature preview panels ─────────────────────────────────────────

function BudgetPreview() {
  return (
    <div className="flex flex-col gap-5 p-6 h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">April Budgets</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full text-amber-400"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
          1 over limit
        </span>
      </div>
      <div className="flex flex-col gap-4">
        <MiniBar label="🛒 Groceries"     color="#c084fc" pct={84} spent="€380" limit="€450" />
        <MiniBar label="🎬 Entertainment" color="#f59e0b" pct={95} spent="€95"  limit="€100" warn />
        <MiniBar label="🚗 Transport"     color="#22c55e" pct={22} spent="€44"  limit="€200" />
        <MiniBar label="🍽️ Dining"        color="#60a5fa" pct={61} spent="€73"  limit="€120" />
      </div>
      <p className="text-[11px] text-white/25 mt-auto">€288 total remaining this month</p>
    </div>
  )
}

function AnalyticsPreview() {
  const bars = [
    { m: 'Oct', v: 55 }, { m: 'Nov', v: 72 }, { m: 'Dec', v: 90 },
    { m: 'Jan', v: 63 }, { m: 'Feb', v: 48 }, { m: 'Mar', v: 81 },
    { m: 'Apr', v: 65, cur: true },
  ]
  return (
    <div className="flex flex-col gap-5 p-6 h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">Monthly Spending</p>
        <span className="text-[11px] text-green-400 flex items-center gap-1">
          <TrendingDown size={11} /> ↓ 8% vs Mar
        </span>
      </div>
      <div className="flex items-end gap-2 h-28">
        {bars.map(b => (
          <div key={b.m} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full rounded-t-sm cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                height: `${b.v}%`,
                background: b.cur ? BTN : 'rgba(192,132,252,0.2)',
              }}
            />
            <span className="text-[9px] text-white/30">{b.m}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6 pt-3 border-t border-white/[0.06]">
        {[
          { l: 'This month', v: '€1,240' },
          { l: 'Avg/month', v: '€1,348' },
          { l: 'Saved', v: '€108', green: true },
        ].map(s => (
          <div key={s.l}>
            <p className="text-[10px] text-white/30">{s.l}</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: s.green ? '#22c55e' : 'inherit' }}>{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function GoalsPreview() {
  const goals = [
    { e: '🏖️', name: 'Summer vacation',  saved: 2100, target: 5000, color: '#c084fc' },
    { e: '💻', name: 'New laptop',        saved: 800,  target: 1200, color: '#60a5fa' },
    { e: '🏠', name: 'Emergency fund',    saved: 4200, target: 6000, color: '#22c55e' },
  ]
  return (
    <div className="flex flex-col gap-5 p-6 h-full">
      <p className="text-sm font-semibold text-white/80">Savings Goals</p>
      <div className="flex flex-col gap-5">
        {goals.map(g => {
          const pct = Math.round((g.saved / g.target) * 100)
          return (
            <div key={g.name} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">{g.e} {g.name}</span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: g.color }}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.color }} />
              </div>
              <span className="text-[10px] text-white/25">
                €{g.saved.toLocaleString()} saved · €{(g.target - g.saved).toLocaleString()} to go
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CalendarPreview() {
  const events = { 3: '#f87171', 8: '#c084fc', 12: '#60a5fa', 15: '#f87171', 19: '#22c55e', 22: '#c084fc', 27: '#f87171', 30: '#c084fc' }
  return (
    <div className="flex flex-col gap-4 p-6 h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">April 2026</p>
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> expense</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> recurring</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[9px] text-white/30 text-center mb-0.5">
        {['M','T','W','T','F','S','S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 2 }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
          <div key={d} className="aspect-square flex flex-col items-center justify-center rounded-lg hover:bg-white/5 transition-colors cursor-default relative">
            <span className="text-[9px] text-white/50">{d}</span>
            {events[d] && (
              <div className="w-1 h-1 rounded-full absolute bottom-0.5" style={{ background: events[d] }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BillsPreview() {
  const bills = [
    { name: 'Netflix',      amount: '€15.99', due: 'Apr 18', color: '#ef4444' },
    { name: 'Spotify',      amount: '€9.99',  due: 'Apr 22', color: '#22c55e' },
    { name: 'KBC Insurance',amount: '€67.50', due: 'May 1',  color: '#60a5fa' },
    { name: 'Phone plan',   amount: '€25.00', due: 'May 5',  color: '#c084fc' },
  ]
  return (
    <div className="flex flex-col gap-4 p-6 h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">Upcoming Bills</p>
        <span className="text-[10px] text-white/30">€118.48 total</span>
      </div>
      <div className="flex flex-col gap-2">
        {bills.map(b => (
          <div key={b.name} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/[0.04]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `${b.color}22`, color: b.color }}>
                {b.name[0]}
              </div>
              <div>
                <p className="text-xs font-medium text-white/80">{b.name}</p>
                <p className="text-[10px] text-white/30">Due {b.due}</p>
              </div>
            </div>
            <span className="text-xs font-semibold tabular-nums">{b.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Data ───────────────────────────────────────────────────────────

const FEATURES = [
  { id: 'budgets',   Icon: Wallet,      label: 'Smart Budgets',   summary: 'Set limits per category. Track overspend. Roll over surplus.', Preview: BudgetPreview   },
  { id: 'analytics', Icon: BarChart3,   label: 'Deep Analytics',  summary: 'Click any bar or slice to see the real transactions behind it.', Preview: AnalyticsPreview },
  { id: 'goals',     Icon: PiggyBank,   label: 'Savings Goals',   summary: 'Plan monthly contributions and visualize your progress over time.', Preview: GoalsPreview   },
  { id: 'calendar',  Icon: CalendarDays,label: 'Calendar View',   summary: 'See every transaction laid out day by day across the month.', Preview: CalendarPreview  },
  { id: 'bills',     Icon: Receipt,     label: 'Bills & Recurring',summary: 'Never miss a payment. Track every subscription and planned expense.', Preview: BillsPreview },
]

const STATS = [
  { value: '€0',  label: 'Always free',          sub: 'no hidden fees ever' },
  { value: '12+', label: 'Built-in features',    sub: 'all in one place' },
  { value: '5',   label: 'Transaction types',    sub: 'expense · income · savings · transfer · investment' },
  { value: '∞',   label: 'Customizable themes',  sub: 'design it your way' },
]

const STEPS = [
  { n: '01', title: 'Create your account',      desc: 'Sign up free in seconds. No credit card, no trial — everything is always included.' },
  { n: '02', title: 'Log your transactions',    desc: 'Add income, expenses, transfers. Split bills, set categories and importance levels.' },
  { n: '03', title: 'Watch your wealth grow',   desc: 'Hit budgets, reach savings goals, and finally understand your full financial picture.' },
]

const TESTIMONIALS = [
  { name: 'Sarah M.',  role: 'Freelancer',        body: 'Finally understand where every euro goes. The analytics are insanely detailed.', color: '#c084fc', initials: 'SM' },
  { name: 'Tom V.',    role: 'Software Engineer',  body: "Budgets are actually fun to manage now. Never thought I'd say that.", color: '#3b82f6', initials: 'TV' },
  { name: 'Lena K.',   role: 'Teacher',            body: 'Set my first savings goal and actually hit it. The tracking made all the difference.', color: '#22c55e', initials: 'LK' },
  { name: 'James F.',  role: 'Designer',           body: 'Caught two forgotten subscriptions in the first week. Basically paid for itself.', color: '#f59e0b', initials: 'JF' },
  { name: 'Mia P.',    role: 'Student',            body: 'The calendar view is beautiful. I check it every morning with my coffee.', color: '#ec4899', initials: 'MP' },
  { name: 'Felix B.',  role: 'Consultant',         body: 'Used to dread month-end. Now I look forward to seeing the numbers.', color: '#f97316', initials: 'FB' },
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

// ── Page ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const { Preview } = FEATURES[activeFeature]

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#09070f' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 65% 55% at 50% 5%, rgba(167,118,147,0.22) 0%, rgba(59,49,86,0.1) 50%, transparent 75%)',
        zIndex: 0,
      }} />

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img src="/momentum_transparant.png" alt="Momentum Finance" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-semibold text-sm tracking-tight text-white/90">Momentum Finance</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm text-white/50 hover:text-white/80 transition-colors px-4 py-2">Log in</Link>
          <Link to="/register" className="text-sm font-semibold px-5 py-2 rounded-full transition-all hover:opacity-90" style={{ background: BTN }}>
            Sign up
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-40">

        <div className="inline-flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-full mb-8 text-white/60"
          style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)' }}>
          <Zap size={10} className="text-purple-400" fill="currentColor" />
          All features, always free
        </div>

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
          Track spending, set budgets, and build savings — all in one beautifully designed app.
        </p>

        <Link
          to="/register"
          className="flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02] mb-3"
          style={{ background: BTN }}
        >
          Get Started Free <ArrowRight size={15} />
        </Link>
        <p className="text-xs text-white/28">No credit card required · Free forever</p>

        {/* Floating cards — desktop only */}
        <div className="hidden md:block">
          <GlassCard className="absolute w-52 text-left" style={{ left: '8%', bottom: '12%' }}>
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
          </GlassCard>

          <GlassCard className="absolute w-44 text-left" style={{ right: '8%', bottom: '18%' }}>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Budget</p>
            <p className="text-3xl font-bold tabular-nums">78%</p>
            <p className="text-[11px] text-white/40 mb-3">On track</p>
            <div className="h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: '78%', background: BTN }} />
            </div>
          </GlassCard>

          <GlassCard className="absolute w-40 text-left" style={{ right: '14%', top: '8%' }}>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5">Savings goals</p>
            <p className="text-xl font-bold">3 active</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={11} className="text-purple-400" />
              <span className="text-[11px] text-white/40">€890 saved</span>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 pb-28">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          {STATS.map(s => (
            <div key={s.label} className="p-6 flex flex-col gap-1" style={{ background: '#09070f' }}>
              <p className="text-2xl md:text-3xl font-bold"
                style={{ background: BTN, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.value}
              </p>
              <p className="text-xs font-medium text-white/70">{s.label}</p>
              <p className="text-[10px] text-white/25 leading-snug">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Interactive feature tabs ─────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 md:px-16 pb-28">
        <p className="text-xs uppercase tracking-widest text-white/30 text-center mb-3">Features</p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">Everything you need</h2>

        <div className="grid md:grid-cols-[280px,1fr] gap-4">
          {/* Tab list */}
          <div className="flex flex-col gap-2">
            {FEATURES.map(({ id, Icon, label, summary }, i) => {
              const active = i === activeFeature
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFeature(i)}
                  className="flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                  style={{
                    background: active ? 'rgba(192,132,252,0.1)' : 'transparent',
                    border: active ? '1px solid rgba(192,132,252,0.25)' : '1px solid transparent',
                  }}
                >
                  <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: active ? 'rgba(192,132,252,0.2)' : 'rgba(255,255,255,0.05)' }}>
                    <Icon size={15} style={{ color: active ? '#c084fc' : 'rgba(255,255,255,0.35)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold transition-colors" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}>{label}</p>
                    <p className="text-xs leading-relaxed mt-0.5 transition-colors" style={{ color: active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)' }}>{summary}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Preview panel */}
          <div className="rounded-2xl min-h-[360px]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Preview />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 pb-28">
        <p className="text-xs uppercase tracking-widest text-white/30 text-center mb-3">How it works</p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">Up and running in minutes</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="flex flex-col gap-4 p-6 rounded-2xl relative overflow-hidden group transition-all hover:border-white/[0.12]"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="absolute top-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: BTN }} />
              <span className="text-5xl font-black" style={{ color: 'rgba(192,132,252,0.12)' }}>{n}</span>
              <div>
                <p className="text-sm font-semibold mb-2">{title}</p>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials (static grid) ───────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 pb-28">
        <p className="text-xs uppercase tracking-widest text-white/30 text-center mb-3">Reviews</p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">People love it</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map(({ name, role, body, color, initials }) => (
            <figure key={name} className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:border-white/10"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={11} fill="#c084fc" style={{ color: '#c084fc' }} />
                ))}
              </div>
              <blockquote className="text-sm text-white/55 leading-relaxed flex-1">"{body}"</blockquote>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: `${color}22`, color }}>
                  {initials}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-white/80">{name}</p>
                  <p className="text-[11px] text-white/30">{role}</p>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </section>

      {/* ── CTA / Pricing ────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 md:px-16 pb-28 text-center">
        <div className="rounded-3xl p-10 md:p-14 relative overflow-hidden"
          style={{ background: 'rgba(192,132,252,0.05)', border: '1px solid rgba(192,132,252,0.15)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 110%, rgba(192,132,252,0.12), transparent)' }} />

          <p className="text-xs uppercase tracking-widest text-white/30 mb-4">Always free</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything included</h2>
          <p className="text-white/40 text-sm mb-10">No hidden fees. No paywalled features. No limits.</p>

          <div className="grid grid-cols-2 gap-2.5 mb-10 text-left max-w-lg mx-auto">
            {INCLUDED.map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)' }}>
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
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/momentum_transparant.png" alt="" className="w-5 h-5 rounded object-cover opacity-40" />
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
