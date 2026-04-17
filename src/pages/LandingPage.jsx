import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, TrendingUp,
  Wallet, PiggyBank, BarChart3, CalendarDays,
  Receipt, CreditCard, Check,
} from 'lucide-react'
import GradientMenu from '../components/ui/gradient-menu'

const BG     = '#100d08'
const ACCENT = '#c49a6c'
const ACCENT2 = '#7a5030'

// ── App mockup ─────────────────────────────────────────────────────
function AppMockup() {
  return (
    <div className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,248,235,0.04)',
        border: '1px solid rgba(255,248,235,0.1)',
        backdropFilter: 'blur(20px)',
      }}>
      {/* Titlebar */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,248,235,0.06)' }}>
        <div className="flex items-center gap-2">
          <img src="/momentum_transparant.png" alt="" className="w-5 h-5 rounded object-cover opacity-70" />
          <span className="text-xs font-semibold text-white/60">Momentum Finance</span>
        </div>
        <span className="text-[10px] text-white/30 tabular-nums">April 2026</span>
      </div>
      {/* Net worth */}
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
              style={{ height: `${h}%`, background: i === 11 ? ACCENT : 'rgba(196,154,108,0.2)' }} />
          ))}
        </div>
      </div>
      <div className="mx-4 border-t" style={{ borderColor: 'rgba(255,248,235,0.06)' }} />
      {/* Budget rows */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Budgets this month</p>
        {[
          { label: '🛒 Groceries', pct: 84, color: ACCENT,    spent: '€380', limit: '€450' },
          { label: '🚗 Transport', pct: 22, color: '#22c55e', spent: '€44',  limit: '€200' },
          { label: '🍽️ Dining',    pct: 61, color: '#60a5fa', spent: '€73',  limit: '€120' },
        ].map(b => (
          <div key={b.label} className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-white/55">{b.label}</span>
              <span className="text-[10px] tabular-nums text-white/30">{b.spent} / {b.limit}</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: 'rgba(255,248,235,0.07)' }}>
              <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
            </div>
          </div>
        ))}
      </div>
      {/* Social proof */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid rgba(255,248,235,0.06)' }}>
          <div className="flex -space-x-1.5 shrink-0">
            {[ACCENT,'#60a5fa','#22c55e','#f59e0b'].map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0"
                style={{ background: `${c}33`, color: c, border: `1.5px solid ${BG}` }}>
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

// ── Feature data ───────────────────────────────────────────────────
const FEATURES = [
  { Icon: Wallet,       title: 'Smart Budgets',     desc: 'Set limits per category, track overspend in real time.' },
  { Icon: BarChart3,    title: 'Deep Analytics',    desc: 'Click any chart to drill into the transactions behind it.' },
  { Icon: PiggyBank,    title: 'Savings Goals',     desc: 'Plan contributions and track progress toward every goal.' },
  { Icon: CalendarDays, title: 'Calendar View',     desc: 'See every transaction laid out day by day.' },
  { Icon: Receipt,      title: 'Bills & Recurring', desc: 'Never miss a payment. Track every subscription.' },
  { Icon: CreditCard,   title: 'Multiple Accounts', desc: 'Manage debit, credit, and cash — all in one.' },
]

const INCLUDED = [
  'Unlimited transactions', 'Multiple accounts & cards',
  'Savings goals with planning', 'Interactive analytics',
  'Recurring & planned bills', 'Calendar & insights view',
  'Smart budgeting tools', 'Customizable design',
]

// ── Page ───────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: BG }}>

      {/* Ambient warm glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(196,154,108,0.13) 0%, transparent 65%)',
        zIndex: 0,
      }} />

      {/* ── Navbar ────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-8 md:px-16 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/momentum_transparant.png" alt="Momentum Finance" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-semibold text-sm tracking-tight text-white/90">Momentum Finance</span>
        </div>
        <GradientMenu />
      </nav>

      {/* ── Hero (full viewport) ───────────────────────────────────── */}
      <section className="relative z-10 flex flex-col px-8 md:px-16 max-w-7xl mx-auto"
        style={{ minHeight: 'calc(100vh - 76px)' }}>

        {/* Top row: tagline left + CTA right */}
        <div className="flex items-start justify-between pt-4 pb-10">
          <div className="max-w-[260px]">
            <p className="text-sm font-semibold text-white/85 mb-1.5">Track Finances With Momentum</p>
            <p className="text-[10px] text-white/35 leading-relaxed uppercase tracking-wider">
              Personal finance tools that push the boundaries of the ordinary.
            </p>
          </div>
          <Link to="/register"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-white/20"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}>
            GET STARTED <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* Center: app mockup + numbered steps */}
        <div className="flex-1 relative flex items-center justify-center">

          {/* Central app mockup */}
          <div className="w-full max-w-[340px] z-10">
            <AppMockup />
          </div>

          {/* Numbered steps — right edge */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex-col gap-3 hidden md:flex">
            {['01', '02', '03'].map((n, i) => (
              <div key={n}
                className="flex items-center justify-center rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  width: 52, height: 30,
                  background: i === 0
                    ? 'rgba(196,154,108,0.22)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${i === 0
                    ? 'rgba(196,154,108,0.45)'
                    : 'rgba(255,255,255,0.09)'}`,
                  color: i === 0 ? ACCENT : 'rgba(255,255,255,0.28)',
                }}>
                {n}
              </div>
            ))}
          </div>
        </div>

        {/* Massive headline */}
        <div className="pb-5">
          <h1
            className="font-black leading-none tracking-tighter uppercase text-white"
            style={{ fontSize: 'clamp(2.8rem, 9.5vw, 8.5rem)' }}>
            BUILD YOUR<br />WEALTH
          </h1>
        </div>

        {/* Feature strip */}
        <div className="pb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              Icon: BarChart3,
              title: 'Track & Budget',
              desc: 'Set smart budgets and track every expense in real time — across any account.',
              href: '/register',
            },
            {
              Icon: PiggyBank,
              title: 'Reach Your Goals',
              desc: 'Set savings goals, plan monthly contributions, and watch your net worth grow.',
              href: '/register',
            },
          ].map(({ Icon, title, desc, href }) => (
            <Link key={title} to={href}
              className="flex items-center gap-4 p-5 rounded-2xl group transition-all hover:border-white/[0.14]"
              style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid rgba(255,248,235,0.08)' }}>
              <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(196,154,108,0.1)', border: '1px solid rgba(196,154,108,0.2)' }}>
                <Icon size={22} style={{ color: ACCENT }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1">{title}</p>
                <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
              </div>
              <ArrowUpRight size={18} className="text-white/20 shrink-0 ml-2 group-hover:text-white/40 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features section ──────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 py-20">
        <div className="flex flex-col md:flex-row gap-16 items-start">

          {/* Left: statement text */}
          <div className="md:w-72 shrink-0">
            <h2 className="text-3xl md:text-4xl font-bold leading-snug mb-5">
              From Zero To<br />Financial Clarity<br />In Just One Step
              <ArrowUpRight size={24} className="inline ml-2" style={{ color: ACCENT }} />
            </h2>
            <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed mb-7">
              We believe every financial goal is unique and deserves an individual approach.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all hover:opacity-75"
              style={{ border: `1px solid rgba(196,154,108,0.45)`, color: ACCENT }}>
              TRY IT FREE
            </Link>
          </div>

          {/* Right: horizontal scrollable feature cards */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-5">
              <p className="text-xs text-white/40 uppercase tracking-widest whitespace-nowrap">What's Included</p>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {FEATURES.map(({ Icon, title, desc }) => (
                <div key={title} className="shrink-0 w-44 p-4 rounded-2xl transition-all hover:border-white/[0.12]"
                  style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid rgba(255,248,235,0.07)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(196,154,108,0.12)' }}>
                    <Icon size={15} style={{ color: ACCENT }} />
                  </div>
                  <p className="text-xs font-semibold mb-1.5 text-white/90">{title}</p>
                  <p className="text-[10px] text-white/30 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <div className="inline-flex items-center text-[10px] px-3 py-1 rounded-full text-white/40 uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            How It Works
          </div>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: '01', title: 'Create your account',   desc: 'Sign up free in seconds. No credit card, no trial — everything is always included.' },
            { n: '02', title: 'Log your transactions', desc: 'Add income, expenses, and transfers. Split bills, set categories and importance levels.' },
            { n: '03', title: 'Build real clarity',    desc: 'Hit budgets, reach savings goals, and finally understand your financial picture.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex flex-col gap-4 p-6 rounded-2xl group transition-all relative overflow-hidden"
              style={{ background: 'rgba(255,248,235,0.03)', border: '1px solid rgba(255,248,235,0.07)' }}>
              <div className="absolute top-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})` }} />
              <span className="text-5xl font-black" style={{ color: 'rgba(196,154,108,0.1)' }}>{n}</span>
              <div>
                <p className="text-sm font-semibold mb-2 text-white/85">{title}</p>
                <p className="text-xs text-white/32 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 max-w-3xl mx-auto px-8 md:px-16 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <div className="inline-flex items-center text-[10px] px-3 py-1 rounded-full text-white/40 uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            FAQ
          </div>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        {[
          { q: 'Is Momentum Finance really free?',  a: 'Yes — completely free. No credit card, no trial, no paywalled features. Everything is always included.' },
          { q: 'Is my financial data secure?',       a: 'Your data is encrypted and stored securely via Supabase. We never share or sell your financial data.' },
          { q: 'Can I use it on mobile?',            a: 'Momentum works great in any modern browser on desktop or mobile. A dedicated app is on the roadmap.' },
          { q: 'What currencies are supported?',     a: 'Any currency you want — just type the symbol. The app doesn\'t enforce a specific currency.' },
        ].map(({ q, a }) => (
          <details key={q} className="mb-3 group rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,248,235,0.04)', border: '1px solid rgba(255,248,235,0.08)' }}>
            <summary className="px-5 py-4 cursor-pointer text-sm font-medium text-white/75 flex items-center justify-between list-none hover:text-white transition-colors">
              {q}
              <ArrowRight size={14} className="text-white/25 group-open:rotate-90 transition-transform shrink-0 ml-4" />
            </summary>
            <p className="px-5 pb-4 text-xs text-white/38 leading-relaxed">{a}</p>
          </details>
        ))}
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 md:px-16 pb-28 text-center">
        <div className="rounded-3xl p-10 md:p-14 relative overflow-hidden"
          style={{ background: 'rgba(196,154,108,0.06)', border: '1px solid rgba(196,154,108,0.18)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 110%, rgba(196,154,108,0.1), transparent)' }} />
          <p className="text-xs uppercase tracking-widest text-white/28 mb-4">Always free</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything included</h2>
          <p className="text-white/35 text-sm mb-10">No hidden fees. No paywalled features. No limits.</p>
          <div className="grid grid-cols-2 gap-2.5 mb-10 text-left max-w-lg mx-auto">
            {INCLUDED.map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(196,154,108,0.15)', border: '1px solid rgba(196,154,108,0.3)' }}>
                  <Check size={9} style={{ color: ACCENT }} />
                </div>
                <span className="text-xs text-white/48">{item}</span>
              </div>
            ))}
          </div>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, color: BG }}>
            Create Free Account <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/momentum_transparant.png" alt="" className="w-5 h-5 rounded object-cover opacity-35" />
          <span className="text-xs text-white/22">© 2026 Momentum Finance</span>
        </div>
        <div className="flex items-center gap-6">
          {['Features', 'How It Works', 'FAQ'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
              className="text-xs text-white/22 hover:text-white/50 transition-colors">{l}</a>
          ))}
          <Link to="/login"   className="text-xs text-white/22 hover:text-white/50 transition-colors">Log in</Link>
          <Link to="/register" className="text-xs text-white/22 hover:text-white/50 transition-colors">Sign up</Link>
        </div>
      </footer>

    </div>
  )
}
