import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Wallet, PiggyBank,
  Receipt, CalendarDays, CreditCard, Check,
  Shield, Zap, Users,
} from 'lucide-react'
import GradientMenu from '../components/ui/gradient-menu'
import blob1 from '../assets/blob_1.png'
import blob2 from '../assets/blob_2.png'
import blob3 from '../assets/blob_3.png'

const BG      = '#08070d'
const GLASS   = 'rgba(12, 9, 22, 0.42)'
const BORDER  = 'rgba(255, 255, 255, 0.09)'

const FEATURES = [
  { Icon: BarChart3,    title: 'Deep Analytics',     desc: 'Click any chart to drill into the transactions behind it — by category, merchant, or importance.' },
  { Icon: Wallet,       title: 'Smart Budgets',       desc: 'Set limits per category. Track rollover, overspend, and weekly or yearly periods in real time.' },
  { Icon: PiggyBank,    title: 'Savings Goals',       desc: 'Plan monthly contributions and track progress toward every goal you care about.' },
  { Icon: CalendarDays, title: 'Bills & Planned',     desc: 'Never miss a payment. Log recurring bills and planned expenses before they land.' },
  { Icon: CreditCard,   title: 'Multiple Accounts',   desc: 'Manage debit, credit, cash and savings — all synced in one unified view.' },
  { Icon: Receipt,      title: 'Transaction History', desc: 'Split bills, tag importance, attach comments and search across everything you\'ve ever logged.' },
]

const STEPS = [
  { n: '01', title: 'Create your account',    desc: 'Sign up in seconds. No credit card. No trial. Every feature is unlocked from day one.' },
  { n: '02', title: 'Log your transactions',  desc: 'Add income, expenses, and transfers. Split bills, set categories, and mark importance.' },
  { n: '03', title: 'Build real clarity',     desc: 'Hit your budgets, reach your savings goals, and finally understand your financial picture.' },
]

const FAQS = [
  { q: 'Is Momentum really free?',        a: 'Yes — completely free, forever. No credit card, no trial, no paywalled features. Everything is always included.' },
  { q: 'Is my financial data secure?',     a: 'Your data is encrypted and stored securely. We never share, sell, or access your financial information.' },
  { q: 'Can I use it on my phone?',        a: 'Momentum works beautifully in any modern browser on desktop or mobile. A dedicated app is on the roadmap.' },
  { q: 'What currencies are supported?',   a: 'Any currency you want — EUR, USD, GBP, and more. Just pick your currency in settings and you\'re good to go.' },
]

const INCLUDED = [
  'Unlimited transactions',        'Multiple accounts & cards',
  'Savings goals with planning',   'Interactive deep analytics',
  'Recurring & planned bills',     'Calendar view',
  'Smart budgeting tools',         'Customizable design themes',
]

// ── Blob helpers ─────────────────────────────────────────────────
function HeroBlob({ src }) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'max(160vw, 160vh)',
      height: 'max(160vw, 160vh)',
      animation: 'blobFloat1 20s ease-in-out infinite',
      pointerEvents: 'none',
      zIndex: 1,
    }}>
      <img src={src} alt="" style={{
        width: '100%', height: '100%',
        objectFit: 'contain',
        mixBlendMode: 'screen',
        filter: 'contrast(1.2) saturate(1.5) brightness(0.9)',
      }} />
    </div>
  )
}

function Blob({ src, size, animation, delay = '0s', style = {} }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, pointerEvents: 'none', ...style }}>
      <img src={src} alt="" style={{
        width: '100%', height: '100%', objectFit: 'contain',
        animation: `${animation} linear infinite`, animationDelay: delay,
        filter: 'brightness(1.05) saturate(1.1)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 50%, transparent 38%, ${BG} 72%)`,
      }} />
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: BG }}>

      {/* ── Keyframe animations ──────────────────────────────────── */}
      <style>{`
        @keyframes blobFloat1 {
          0%   { transform: translateY(0px)   rotate(0deg)  scale(1);    }
          30%  { transform: translateY(-28px) rotate(5deg)  scale(1.04); }
          65%  { transform: translateY(14px)  rotate(-3deg) scale(0.97); }
          100% { transform: translateY(0px)   rotate(0deg)  scale(1);    }
        }
        @keyframes blobFloat2 {
          0%   { transform: translateY(0px)   rotate(0deg)  scale(1);    }
          35%  { transform: translateY(22px)  rotate(-7deg) scale(1.05); }
          70%  { transform: translateY(-18px) rotate(4deg)  scale(0.96); }
          100% { transform: translateY(0px)   rotate(0deg)  scale(1);    }
        }
        @keyframes blobFloat3 {
          0%   { transform: translateY(0px)   rotate(0deg)  scale(1);    }
          40%  { transform: translateY(-20px) rotate(8deg)  scale(1.03); }
          75%  { transform: translateY(12px)  rotate(-5deg) scale(0.98); }
          100% { transform: translateY(0px)   rotate(0deg)  scale(1);    }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-text-1 { animation: fadeSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
        .hero-text-2 { animation: fadeSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s both; }
        .hero-text-3 { animation: fadeSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s both; }
        .hero-text-4 { animation: fadeSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.55s both; }
        .hero-text-5 { animation: fadeSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.7s both; }
        details summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* ── Page-level ambient gradients ─────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {/* Purple glow — top right, where hero blob lives */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%', width: '55%', height: '70%',
          background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.12) 0%, transparent 65%)',
        }} />
        {/* Pink glow — bottom left */}
        <div style={{
          position: 'absolute', bottom: '10%', left: '-5%', width: '40%', height: '50%',
          background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.07) 0%, transparent 65%)',
        }} />
      </div>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-8 md:px-16 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/momentum_transparant.png" alt="Momentum" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-semibold text-sm tracking-tight text-white/90">Momentum Finance</span>
        </div>
        <GradientMenu />
      </nav>

      {/* ════════════════════════════════════════════════════════════
          HERO — full viewport: one blob, one glass card
      ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10" style={{ height: 'calc(100vh - 76px)', overflow: 'hidden' }}>

        {/* ── THE BLOB — fills the entire view ── */}
        <HeroBlob src={blob2} />

        {/* Edge darkening so the blob bleeds cleanly into the dark page */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2,
          background: `radial-gradient(ellipse 90% 90% at 50% 50%, transparent 62%, ${BG} 95%)`,
        }} />

        {/* ── FROSTED GLASS CARD — centred over the blob ── */}
        <div className="absolute inset-0 flex items-center justify-center px-5" style={{ zIndex: 10 }}>
          <div style={{
            width: '100%',
            maxWidth: 540,
            background: GLASS,
            backdropFilter: 'blur(36px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(36px) saturate(1.6)',
            border: `1px solid ${BORDER}`,
            borderRadius: 28,
            padding: 'clamp(32px, 5vw, 52px)',
            boxShadow: '0 8px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}>

            {/* Badge */}
            <div className="hero-text-1 inline-flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #e879f9, #818cf8)', boxShadow: '0 0 6px #e879f980' }} />
              <span className="text-[11px] font-semibold tracking-widest uppercase"
                style={{ color: 'rgba(232,121,249,0.7)' }}>
                Personal Finance · Reinvented
              </span>
            </div>

            {/* Headline */}
            <h1 className="hero-text-2 font-black leading-[1.0] tracking-tight mb-5"
              style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)' }}>
              Your money,{' '}
              <span style={{
                backgroundImage: 'linear-gradient(135deg, #f472b6 0%, #c084fc 55%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                finally
              </span>
              <br />on your side.
            </h1>

            {/* Subtext */}
            <p className="hero-text-3 text-sm leading-relaxed mb-8"
              style={{ color: 'rgba(255,255,255,0.42)', maxWidth: 400 }}>
              Stop wondering where it all went. Track every transaction, beat every budget, and grow toward the goals that actually matter — all in one place. Free, forever.
            </p>

            {/* CTAs */}
            <div className="hero-text-4 flex flex-wrap gap-3 mb-8">
              <Link to="/register"
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #e879f9, #818cf8)',
                  color: '#fff',
                  boxShadow: '0 0 28px rgba(232,121,249,0.28)',
                }}>
                Start for free <ArrowRight size={14} />
              </Link>
              <a href="#features"
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                }}>
                See features
              </a>
            </div>

            {/* Trust pills */}
            <div className="hero-text-5 flex flex-wrap gap-2">
              {[
                { Icon: Shield, text: 'Private by default' },
                { Icon: Zap,    text: 'Always free'        },
                { Icon: Users,  text: 'No limits'          },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Icon size={10} style={{ color: 'rgba(232,121,249,0.55)' }} />
                  <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Bottom fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ zIndex: 3,
          background: `linear-gradient(to bottom, transparent, ${BG})`,
        }} />
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 py-24">

        {/* Ambient blob left */}
        <Blob src={blob3} size={500} animation="blobFloat2 20s" delay="1s"
          style={{ position: 'absolute', left: -180, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }} />

        <div className="relative z-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase mb-4"
                style={{ color: 'rgba(192,132,252,0.6)' }}>
                What's included
              </p>
              <h2 className="font-bold leading-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                Built for people who take<br />their finances seriously.
              </h2>
            </div>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold shrink-0 transition-all hover:opacity-80 self-start md:self-end"
              style={{ border: '1px solid rgba(192,132,252,0.4)', color: 'rgba(192,132,252,0.8)' }}>
              Get started free <ArrowRight size={12} />
            </Link>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <div key={title}
                className="group flex flex-col gap-4 p-6 rounded-2xl transition-all duration-300 hover:border-white/[0.12]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: [
                      'rgba(232,121,249,0.12)',
                      'rgba(192,132,252,0.12)',
                      'rgba(147,197,253,0.12)',
                      'rgba(232,121,249,0.12)',
                      'rgba(192,132,252,0.12)',
                      'rgba(147,197,253,0.12)',
                    ][i],
                  }}>
                  <Icon size={17} style={{
                    color: ['#e879f9','#c084fc','#93c5fd','#e879f9','#c084fc','#93c5fd'][i]
                  }} />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2 text-white/90">{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 py-20">

        {/* Ambient blob right */}
        <Blob src={blob1} size={440} animation="blobFloat1 15s" delay="3s"
          style={{ position: 'absolute', right: -160, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <span className="text-xs font-medium tracking-widest uppercase"
              style={{ color: 'rgba(232,121,249,0.6)' }}>
              How it works
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n}
                className="relative flex flex-col gap-5 p-7 rounded-2xl overflow-hidden group transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Hover top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(90deg, #e879f9, #818cf8, #93c5fd)' }} />
                {/* Number */}
                <span className="font-black leading-none" style={{
                  fontSize: '4.5rem',
                  backgroundImage: 'linear-gradient(135deg, rgba(232,121,249,0.2), rgba(147,197,253,0.2))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {n}
                </span>
                <div>
                  <p className="text-sm font-semibold mb-2.5 text-white/85">{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
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
        <div className="flex items-center gap-4 mb-10">
          <span className="text-xs font-medium tracking-widest uppercase"
            style={{ color: 'rgba(232,121,249,0.6)' }}>
            FAQ
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }) => (
            <details key={q}
              className="group rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <summary className="flex items-center justify-between px-6 py-4.5 cursor-pointer list-none"
                style={{ padding: '18px 24px' }}>
                <span className="text-sm font-medium text-white/75 group-hover:text-white/95 transition-colors">{q}</span>
                <span className="text-white/25 group-open:text-white/50 transition-all ml-4 shrink-0 group-open:rotate-45 text-lg leading-none">+</span>
              </summary>
              <p className="px-6 pb-5 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 py-16 pb-28">
        <div className="relative rounded-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(232,121,249,0.18)' }}>

          {/* Blob inside CTA */}
          <Blob src={blob2} size={480} animation="blobFloat3 20s"
            style={{ position: 'absolute', right: -120, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />

          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(232,121,249,0.08), transparent)' }} />

          <div className="relative z-10 p-10 md:p-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-5"
              style={{ color: 'rgba(232,121,249,0.6)' }}>
              Always free · No limits
            </p>
            <h2 className="font-bold leading-tight mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', maxWidth: 480 }}>
              Everything you need to take control of your finances.
            </h2>
            <p className="text-sm mb-10 max-w-md" style={{ color: 'rgba(255,255,255,0.38)' }}>
              No hidden fees. No paywalled features. No limits. Everything is included from the moment you sign up.
            </p>

            {/* Included grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-10 max-w-sm">
              {INCLUDED.map(item => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(232,121,249,0.12)',
                      border: '1px solid rgba(232,121,249,0.25)',
                    }}>
                    <Check size={9} style={{ color: '#e879f9' }} />
                  </div>
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{item}</span>
                </div>
              ))}
            </div>

            <Link to="/register"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #e879f9, #818cf8)',
                color: '#fff',
                boxShadow: '0 0 40px rgba(232,121,249,0.3)',
              }}>
              Create Free Account <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 md:px-16 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/momentum_transparant.png" alt="" className="w-5 h-5 rounded object-cover opacity-30" />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 Momentum Finance</span>
        </div>
        <div className="flex items-center gap-6">
          {[
            { label: 'Features',     href: '#features'     },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'FAQ',          href: '#faq'          },
          ].map(({ label, href }) => (
            <a key={label} href={href}
              className="text-xs transition-colors hover:text-white/50"
              style={{ color: 'rgba(255,255,255,0.22)' }}>
              {label}
            </a>
          ))}
          <Link to="/login"    className="text-xs transition-colors hover:text-white/50" style={{ color: 'rgba(255,255,255,0.22)' }}>Log in</Link>
          <Link to="/register" className="text-xs transition-colors hover:text-white/50" style={{ color: 'rgba(255,255,255,0.22)' }}>Sign up</Link>
        </div>
      </footer>

    </div>
  )
}
