import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Users } from 'lucide-react'
import GradientMenu from '../components/ui/gradient-menu'

const GRAD   = 'linear-gradient(145deg, #fae8f0 0%, #e8cdd8 40%, #d4b4c4 100%)'
const BLACK  = '#0f0d0c'
const ROSE   = '#c4557a'
const MUTED  = 'rgba(15,13,12,0.42)'
const BORDER = 'rgba(15,13,12,0.1)'

export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = '#e8cdd8'
    document.documentElement.style.background = '#e8cdd8'
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  return (
    <div style={{
      background: GRAD,
      minHeight: '100vh', height: '100vh',
      display: 'flex', flexDirection: 'column',
      overflowX: 'hidden',
    }}>

      {/* ── Nav ────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '22px clamp(24px, 6vw, 72px)',
        flexShrink: 0,
      }}>
        <GradientMenu />
      </nav>

      {/* ── Hero — centered, single screen ─────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '0 clamp(24px, 6vw, 80px) 48px',
      }}>

        {/* Logo mark */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%', background: BLACK,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', marginBottom: 28,
        }}>
          <img src="/momentum_transparant.png" alt="Momentum" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        </div>

        {/* Headline */}
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

        {/* Subtext */}
        <p style={{
          fontSize: 'clamp(14px, 1.5vw, 17px)', lineHeight: 1.75,
          color: MUTED, maxWidth: 460, margin: '0 0 40px',
        }}>
          Stop wondering where it all went. Track every transaction, beat every budget, and grow toward the goals that actually matter — free, forever.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700,
            background: BLACK, color: '#fff',
            textDecoration: 'none',
            transition: 'opacity .18s, transform .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity='.85'; e.currentTarget.style.transform='scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1';   e.currentTarget.style.transform='scale(1)' }}>
            Start for free <ArrowRight size={14} />
          </Link>
          <a href="#features" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 99, fontSize: 14, fontWeight: 600,
            background: 'rgba(255,255,255,0.4)', border: `1px solid rgba(255,255,255,0.6)`,
            color: MUTED, textDecoration: 'none',
            transition: 'background .18s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}>
            See features
          </a>
        </div>

        {/* Trust pills */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          {[
            { Icon: Shield, text: 'Private by default' },
            { Icon: Zap,    text: 'Always free'        },
            { Icon: Users,  text: 'No limits'          },
          ].map(({ Icon, text }) => (
            <div key={text} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 99,
              background: 'rgba(255,255,255,0.35)', border: `1px solid rgba(255,255,255,0.55)`,
            }}>
              <Icon size={10} style={{ color: ROSE }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: MUTED }}>{text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
