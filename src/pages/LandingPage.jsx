import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, TrendingUp, TrendingDown,
  Wallet, PiggyBank, BarChart3, CalendarDays,
  Receipt, Zap, CreditCard, Scissors,
  SlidersHorizontal, ChevronRight,
} from 'lucide-react'
import GradientMenu from '../components/ui/gradient-menu'

const BTN    = 'linear-gradient(135deg, #c084fc, #3b82f6)'
const PURPLE = '#c084fc'

// ── Central app mockup ─────────────────────────────────────────────

function AppMockup() {
  return (
    <div className="w-full rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>

      {/* Titlebar */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <img src="/momentum_transparant.png" alt="" className="w-5 h-5 rounded object-cover opacity-70" />
          <span className="text-xs font-semibold text-white/60">Momentum Finance</span>
        </div>
        <span className="text-[10px] text-white/30 tabular-nums">April 2026</span>
      </div>

      {/* Net worth + sparkline */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Net Worth</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold tabular-nums">€12,480</span>
          <span className="text-xs text-green-400 flex items-center gap-0.5">
            <TrendingUp size={10} /> +8.2%
          </span>
        </div>
        <div className="flex gap-0.5 items-end h-7">
          {[35,50,42,65,55,78,68,83,72,88,80,94].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm"
              style={{ height: `${h}%`, background: i === 11 ? PURPLE : 'rgba(192,132,252,0.2)' }} />
          ))}
        </div>
      </div>

      <div className="mx-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Budget rows */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Budgets this month</p>
        {[
          { label: '🛒 Groceries', pct: 84, color: PURPLE,    spent: '€380', limit: '€450' },
          { label: '🚗 Transport', pct: 22, color: '#22c55e', spent: '€44',  limit: '€200' },
          { label: '🍽️ Dining',    pct: 61, color: '#60a5fa', spent: '€73',  limit: '€120' },
        ].map(b => (
          <div key={b.label} className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-white/55">{b.label}</span>
              <span className="text-[10px] tabular-nums text-white/30">{b.spent} / {b.limit}</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Social proof strip */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex -space-x-1.5 shrink-0">
            {[PURPLE,'#60a5fa','#22c55e','#f59e0b'].map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0"
                style={{ background: `${c}33`, color: c, border: '1.5px solid #09070f' }}>
                {['A','B','C','D'][i]}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-white/40">90% of users stay on budget every month</span>
        </div>
      </div>
    </div>
  )
}

// ── Small float cards ──────────────────────────────────────────────

function GlassCard({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Feature data ───────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: Wallet,
    title: 'Smart Budgets',
    desc: 'Set limits per category, track overspend in real time, and roll over unused amounts.',
    highlight: true,
  },
  {
    Icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Click any chart bar or slice to drill into the transactions behind it.',
  },
  {
    Icon: PiggyBank,
    title: 'Savings Goals',
    desc: 'Plan monthly contributions and track your progress toward every goal.',
  },
  {
    Icon: CalendarDays,
    title: 'Calendar View',
    desc: 'See every transaction laid out day by day across the full month.',
  },
  {
    Icon: Receipt,
    title: 'Bills & Recurring',
    desc: 'Never miss a payment. Track every subscription and planned expense.',
  },
  {
    Icon: CreditCard,
    title: 'Multiple Accounts',
    desc: 'Manage debit cards, credit accounts, and cash — all in one place.',
  },
  {
    Icon: Scissors,
    title: 'Split Transactions',
    desc: 'Split any expense across multiple categories or importance levels.',
  },
  {
    Icon: SlidersHorizontal,
    title: 'Custom Design',
    desc: 'Pick themes, colors, and layouts. Make it yours with full customization.',
  },
]

const STEPS = [
  { n: '01', title: 'Create your account',   desc: 'Sign up free in seconds. No credit card, no trial — everything is always included.' },
  { n: '02', title: 'Log your transactions', desc: 'Add income, expenses, and transfers. Split bills, set categories and importance levels.' },
  { n: '03', title: 'Build real clarity',    desc: 'Hit budgets, reach savings goals, and finally understand your financial picture.' },
]

const INCLUDED = [
  'Unlimited transactions', 'Multiple accounts & cards',
  'Savings goals with planning', 'Interactive analytics',
  'Recurring & planned bills', 'Calendar & insights view',
  'Smart budgeting tools', 'Beautiful customizable design',
]

// ── Page ───────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#09070f' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(167,118,147,0.25) 0%, rgba(59,49,86,0.12) 50%, transparent 75%)',
        zIndex: 0,
      }} />

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-5 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/momentum_transparant.png" alt="Momentum Finance" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-semibold text-sm tracking-tight text-white/90">Momentum Finance</span>
        </div>

        {/* Gradient pill menu */}
        <GradientMenu />
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-8">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-[11px] px-3.5 py-1.5 rounded-full mb-8 text-white/55"
          style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)' }}>
          <Zap size={10} style={{ color: PURPLE }} fill={PURPLE} />
          Track smarter with Momentum Finance
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-5 max-w-2xl">
          Track Spending &{' '}
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #e0bbe4 10%, #c084fc 50%, #93b5c6 90%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Build Wealth
          </span>
        </h1>

        <p className="text-base md:text-lg text-white/40 mb-9 max-w-md leading-relaxed">
          See exactly where your money goes, set budgets that stick, and reach your savings goals — all in one place.
        </p>

        {/* CTA */}
        <Link to="/register"
          className="flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02] mb-2"
          style={{ background: BTN }}>
          Get Started Free <ArrowRight size={15} />
        </Link>
        <p className="text-xs text-white/25 mb-16">No credit card required · Free forever</p>

        {/* ── Mockup zone ──────────────────────────────────────── */}
        <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center" style={{ minHeight: 420 }}>

          {/* Left float — Net worth */}
          <div className="hidden lg:block absolute left-0 top-8 w-52 z-10">
            <GlassCard>
              <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Net worth</p>
              <p className="text-2xl font-bold tabular-nums mb-1">€4,280</p>
              <div className="flex items-center gap-1 text-green-400 mb-3">
                <TrendingUp size={12} />
                <span className="text-xs font-medium">+12% this month</span>
              </div>
              <div className="flex gap-0.5 items-end h-7">
                {[40,55,45,70,60,85,75].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm"
                    style={{ height: `${h}%`, background: i === 6 ? PURPLE : 'rgba(192,132,252,0.2)' }} />
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Left bottom float — Savings */}
          <div className="hidden lg:block absolute left-4 bottom-0 w-44 z-10">
            <GlassCard>
              <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Savings goals</p>
              <p className="text-xl font-bold mb-1">3 active</p>
              <div className="flex items-center gap-1">
                <TrendingUp size={11} style={{ color: PURPLE }} />
                <span className="text-[11px] text-white/40">€890 saved</span>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {[42, 67, 31].map((p, i) => (
                  <div key={i} className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full" style={{ width: `${p}%`, background: PURPLE, opacity: 1 - i * 0.2 }} />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Central mockup */}
          <div className="w-full max-w-sm z-20">
            <AppMockup />
          </div>

          {/* Right float — Budget */}
          <div className="hidden lg:block absolute right-0 top-8 w-44 z-10">
            <GlassCard>
              <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2">This month</p>
              <p className="text-3xl font-bold tabular-nums">78%</p>
              <p className="text-[11px] text-white/40 mb-3">Budgets on track</p>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: '78%', background: BTN }} />
              </div>
            </GlassCard>
          </div>

          {/* Right bottom float — Alert */}
          <div className="hidden lg:block absolute right-4 bottom-0 w-48 z-10">
            <GlassCard>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <span className="text-xs">⚠️</span>
                </div>
                <p className="text-xs font-medium text-white/70">Budget alert</p>
              </div>
              <p className="text-xs text-white/45 leading-relaxed">Entertainment is at 95% — €5 remaining</p>
              <button className="mt-3 text-[10px] flex items-center gap-1 font-medium" style={{ color: PURPLE }}>
                View budget <ChevronRight size={10} />
              </button>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-8 md:px-16 pt-24 pb-24">

        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-[10px] px-3 py-1 rounded-full mb-5 text-white/40 uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need,<br />all in one place
          </h2>
          <p className="text-white/35 text-sm max-w-md mx-auto leading-relaxed">
            Designed for people who want full clarity over their financial life, without the spreadsheet headache.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(({ Icon, title, desc, highlight }) => (
            <div key={title}
              className="flex flex-col gap-4 p-5 rounded-2xl group transition-all hover:border-white/[0.12] cursor-default"
              style={{
                background: highlight ? 'rgba(192,132,252,0.12)' : 'rgba(255,255,255,0.025)',
                border: highlight
                  ? '1px solid rgba(192,132,252,0.25)'
                  : '1px solid rgba(255,255,255,0.06)',
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: highlight ? 'rgba(192,132,252,0.25)' : 'rgba(255,255,255,0.07)',
                }}>
                <Icon size={17} style={{ color: highlight ? PURPLE : 'rgba(255,255,255,0.5)' }} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <p className="text-sm font-semibold" style={{ color: highlight ? '#fff' : 'rgba(255,255,255,0.8)' }}>
                  {title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: highlight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)' }}>
                  {desc}
                </p>
              </div>
              <button className="flex items-center gap-1 text-[11px] font-medium mt-auto transition-colors"
                style={{ color: highlight ? PURPLE : 'rgba(255,255,255,0.25)' }}>
                Learn more <ChevronRight size={10} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 pb-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-[10px] px-3 py-1 rounded-full mb-5 text-white/40 uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            How It Works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Up and running in minutes</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="flex flex-col gap-4 p-6 rounded-2xl relative overflow-hidden group transition-all hover:border-white/[0.12]"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="absolute top-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: BTN }} />
              <span className="text-5xl font-black" style={{ color: 'rgba(192,132,252,0.12)' }}>{n}</span>
              <div>
                <p className="text-sm font-semibold mb-2">{title}</p>
                <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 md:px-16 pb-28 text-center">
        <div className="rounded-3xl p-10 md:p-14 relative overflow-hidden"
          style={{ background: 'rgba(192,132,252,0.05)', border: '1px solid rgba(192,132,252,0.15)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 110%, rgba(192,132,252,0.12), transparent)' }} />

          <p className="text-xs uppercase tracking-widest text-white/30 mb-4">Always free</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything included</h2>
          <p className="text-white/35 text-sm mb-10">No hidden fees. No paywalled features. No limits.</p>

          <div className="grid grid-cols-2 gap-2.5 mb-10 text-left max-w-lg mx-auto">
            {INCLUDED.map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)' }}>
                  <Check size={9} style={{ color: '#e0bbe4' }} />
                </div>
                <span className="text-xs text-white/50">{item}</span>
              </div>
            ))}
          </div>

          <Link to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: BTN }}>
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
          {['Features', 'How It Works', 'FAQ'].map(l => (
            <a key={l} href="#" className="text-xs text-white/25 hover:text-white/55 transition-colors">{l}</a>
          ))}
          <Link to="/login" className="text-xs text-white/25 hover:text-white/55 transition-colors">Log in</Link>
          <Link to="/register" className="text-xs text-white/25 hover:text-white/55 transition-colors">Sign up</Link>
        </div>
      </footer>

    </div>
  )
}
