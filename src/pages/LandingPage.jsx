import { Link } from 'react-router-dom'
import { TrendingDown, Target, PiggyBank, BarChart2, ArrowRight, Check, Sparkles } from 'lucide-react'
import logoImg from '../assets/momentum_icon-iOS-ClearDark-1024x1024@1x copy.png'

const MAUVE = 'linear-gradient(135deg, #3b3156, #1e2a4a)'

const FEATURES = [
  {
    icon: TrendingDown,
    title: 'Expense Tracking',
    desc: 'Log every transaction, split bills across categories, and never lose track of where your money goes.',
    color: '#c084fc',
  },
  {
    icon: Target,
    title: 'Budgets & Targets',
    desc: 'Set spending limits per category, track how you\'re doing mid-month, and stay ahead of overspending.',
    color: '#60a5fa',
  },
  {
    icon: PiggyBank,
    title: 'Savings Goals',
    desc: 'Create goals for anything — a trip, a car, an emergency fund. Plan monthly contributions and watch progress grow.',
    color: '#4ade80',
  },
  {
    icon: BarChart2,
    title: 'Deep Analytics',
    desc: 'Understand your spending patterns with interactive charts. Click any bar to see the exact transactions behind it.',
    color: '#fb923c',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Add your accounts',
    desc: 'Set up your checking, savings, and investment accounts in under a minute.',
  },
  {
    n: '02',
    title: 'Track your transactions',
    desc: 'Log income and expenses, split payments, and categorize everything your way.',
  },
  {
    n: '03',
    title: 'Reach your goals',
    desc: 'Follow your budget, build your savings, and watch your net worth grow month by month.',
  },
]

const INCLUDED = [
  'Unlimited transactions',
  'Smart budgeting tools',
  'Savings goals with planning',
  'Interactive analytics',
  'Multiple accounts & cards',
  'Recurring bills tracker',
  'Calendar & insights view',
  'Beautiful customizable design',
]

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-fit hidden md:block">
      {/* Main card */}
      <div
        className="rounded-2xl p-5 w-72 shadow-2xl"
        style={{ background: 'rgba(20,22,40,0.82)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Overview</p>
            <p className="text-sm font-semibold text-white">April 2026</p>
          </div>
          <div className="flex gap-1">
            {['#c084fc','#60a5fa','#4ade80'].map(c => (
              <div key={c} className="w-2 h-2 rounded-full" style={{ background: c, opacity: 0.7 }} />
            ))}
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Balance', val: '€4,280', color: '#c084fc' },
            { label: 'Spent', val: '€1,340', color: '#60a5fa' },
            { label: 'Savings', val: '€890', color: '#4ade80' },
            { label: 'Budget left', val: '€460', color: '#fb923c' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-[9px] text-white/35 mb-1">{s.label}</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2.5">Spending by category</p>
          {[
            { label: 'Food',      pct: 72, color: '#c084fc' },
            { label: 'Transport', pct: 45, color: '#60a5fa' },
            { label: 'Shopping',  pct: 88, color: '#fb923c' },
            { label: 'Health',    pct: 30, color: '#4ade80' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2 mb-2">
              <span className="text-[9px] text-white/35 w-14 shrink-0">{b.label}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${b.pct}%`, background: b.color }} />
              </div>
              <span className="text-[9px] text-white/30 w-6 text-right">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating savings goal card */}
      <div
        className="absolute -bottom-5 -right-10 rounded-xl p-3.5 w-48 shadow-xl"
        style={{ background: 'rgba(20,22,40,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(167,118,147,0.3)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,118,147,0.2)' }}>
            <PiggyBank size={10} style={{ color: '#a77693' }} />
          </div>
          <p className="text-[10px] font-semibold text-white">Emergency Fund</p>
        </div>
        <div className="h-1.5 w-full rounded-full mb-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full w-3/5" style={{ background: 'linear-gradient(90deg, #a77693, #60a5fa)' }} />
        </div>
        <div className="flex justify-between">
          <p className="text-[9px] text-white/35">60% complete</p>
          <p className="text-[9px] text-white/35">€2,400 / €4,000</p>
        </div>
      </div>

      {/* Floating recent tx card */}
      <div
        className="absolute -top-4 -left-10 rounded-xl p-3 w-44 shadow-xl"
        style={{ background: 'rgba(20,22,40,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(96,165,250,0.25)' }}
      >
        <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2">Recent</p>
        {[
          { name: 'Grocery store', amt: '-€42', color: '#fb923c' },
          { name: 'Salary',        amt: '+€2,400', color: '#4ade80' },
          { name: 'Netflix',       amt: '-€13', color: '#c084fc' },
        ].map(tx => (
          <div key={tx.name} className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-white/50 truncate">{tx.name}</span>
            <span className="text-[9px] font-semibold tabular-nums ml-1" style={{ color: tx.color }}>{tx.amt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen relative text-white overflow-x-hidden" style={{ background: MAUVE }}>

      {/* Dark depth overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.45) 100%)', zIndex: 0 }} />

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="Momentum Finance" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-bold text-base tracking-tight">Momentum Finance</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold px-4 py-1.5 rounded-xl transition-all hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-32 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium text-white/70"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Sparkles size={11} className="text-white/50" />
            Personal finance, beautifully done
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
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

          <p className="text-lg text-white/60 leading-relaxed mb-10">
            Track spending, manage budgets, set savings goals, and understand your money — all in one beautiful app built for how you actually live.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(to right, #c084fc, #3b82f6)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Get Started Free <ArrowRight size={15} />
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Log in to your account
            </Link>
          </div>

          <p className="text-xs text-white/35 mt-4">Free to use · No credit card required</p>
        </div>

        {/* Dashboard mockup */}
        <div className="flex-1 flex justify-center items-center">
          <DashboardMockup />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pb-28">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Everything you need</p>
          <h2 className="text-3xl md:text-4xl font-bold">Your finances, finally under control</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pb-28">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Simple to start</p>
          <h2 className="text-3xl md:text-4xl font-bold">Up and running in minutes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
            style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(167,118,147,0.4), rgba(255,255,255,0.1))' }} />

          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="flex flex-col items-center text-center gap-4 relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(167,118,147,0.3), rgba(23,72,113,0.3))',
                  border: '1px solid rgba(167,118,147,0.3)',
                }}
              >
                {n}
              </div>
              <div>
                <p className="font-semibold mb-1.5">{title}</p>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── What's included ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 pb-28">
        <div
          className="rounded-3xl p-10 md:p-14"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Always free</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything included</h2>
            <p className="text-white/50 text-sm">No hidden fees. No paywalled features. Just your finances, sorted.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {INCLUDED.map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(167,118,147,0.25)', border: '1px solid rgba(167,118,147,0.4)' }}>
                  <Check size={10} style={{ color: '#e0bbe4' }} />
                </div>
                <span className="text-sm text-white/70">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(to right, #c084fc, #3b82f6)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Create Free Account <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Momentum Finance" className="w-5 h-5 rounded object-cover opacity-60" />
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
