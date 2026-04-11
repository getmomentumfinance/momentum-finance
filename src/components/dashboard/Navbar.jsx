import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, PieChart, PiggyBank, Target, BarChart2, LineChart, Gauge, ChevronLeft, ChevronRight, Calendar, Settings, Download } from 'lucide-react'
import logoImg from '../../assets/momentum_icon-iOS-ClearDark-1024x1024@1x copy.png'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import ProfileModal from './ProfileModal'
import NotificationBell from './NotificationBell'
import { exportPageAsPng } from '../../lib/exportPage'

export default function Navbar({ currentDate, onPrev, onNext }) {
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const { user } = useAuth()
  const { t } = usePreferences()

  const navItems = [
    { icon: Home,      label: t('nav.home'),         path: '/dashboard' },
    { icon: Gauge,     label: t('nav.summary'),      path: '/summary'   },
    { icon: PieChart,  label: t('nav.analytics'),    path: '/analytics' },
    { icon: PiggyBank, label: t('nav.savings'),      path: '/savings' },
    { icon: Target,    label: t('nav.budgets'),      path: '/budgets' },
    { icon: BarChart2, label: t('nav.transactions'), path: '/transactions' },
    { icon: LineChart, label: t('nav.portfolio'),    path: '/portfolio' },
  ]
  const { pathname } = useLocation()
  const [showProfile, setShowProfile] = useState(false)
  const [exporting, setExporting] = useState(false)

  const pageName = navItems.find(n => n.path === pathname)?.label?.toLowerCase() ?? 'page'

  async function handleExport() {
    setExporting(true)
    try {
      await exportPageAsPng(pageName)
    } finally {
      setExporting(false)
    }
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const initials  = (user?.user_metadata?.full_name || user?.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      <nav className="sticky top-0 z-50 drag-region">
        {/* Blur layer: extends 2rem below the nav and fades out via mask */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            bottom: '-2rem',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'var(--color-nav-blur)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
          }}
        />

        {/* Nav content sits above the blur layer */}
        <div className="relative flex items-center justify-between py-3 no-drag" style={{ paddingLeft: '80px', paddingRight: '24px' }}>

          {/* Left: logo + navigation icons */}
          <div className="flex items-center gap-1">
            <img src={logoImg} alt="Momentum Finance" className="w-6 h-6 rounded-md object-cover mr-2 opacity-80" />
            {navItems.map(({ icon: Icon, label, path }) => {
              const active = pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  title={label}
                  className={`group relative flex items-center gap-1.5 px-2 py-2 transition-colors rounded-lg
                    ${active ? 'text-accent' : 'text-muted hover:text-white'}`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-200
                    ${active ? 'max-w-[7rem]' : 'max-w-0 group-hover:max-w-[7rem]'}`}>
                    {label}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: 'var(--color-accent)' }} />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right: month nav + utility icons */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={onPrev} className="text-muted hover:text-white transition-colors p-1">
                <ChevronLeft size={15} />
              </button>
              <span className="font-medium w-32 text-center">{monthLabel}</span>
              <button onClick={onNext} className="text-muted hover:text-white transition-colors p-1">
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleExport}
                disabled={exporting}
                title={t('nav.exportPng')}
                className="p-2 transition-colors text-muted hover:text-white disabled:opacity-40"
              >
                <Download size={15} />
              </button>
              <Link to="/calendar"
                className={`p-2 transition-colors ${pathname === '/calendar' ? 'text-accent' : 'text-muted hover:text-white'}`}>
                <Calendar size={18} />
              </Link>
              <NotificationBell currentDate={currentDate} />
              <Link to="/settings"
                className={`p-2 transition-colors ${pathname === '/settings' ? 'text-accent' : 'text-muted hover:text-white'}`}>
                <Settings size={18} />
              </Link>
              <button
                onClick={() => setShowProfile(true)}
                className="w-7 h-7 rounded-full overflow-hidden hover:ring-2 hover:ring-white/30 transition-all"
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold">{initials}</div>
                }
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
