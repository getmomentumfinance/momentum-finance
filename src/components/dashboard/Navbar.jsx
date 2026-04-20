import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, PieChart, PiggyBank, Target, BarChart2, LineChart, Gauge, ChevronLeft, ChevronRight, Calendar, Settings, Download, MoreHorizontal } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import ProfileModal from './ProfileModal'
import NotificationBell from './NotificationBell'
import { exportPageAsPng } from '../../lib/exportPage'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function Navbar({ currentDate, onPrev, onNext }) {
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const { user } = useAuth()
  const { t } = usePreferences()

  const navItems = [
    { icon: Home,      label: t('nav.home'),         path: '/dashboard' },
    { icon: PieChart,  label: t('nav.analytics'),    path: '/analytics' },
    { icon: PiggyBank, label: t('nav.savings'),      path: '/savings' },
    { icon: Target,    label: t('nav.budgets'),      path: '/budgets' },
    { icon: BarChart2, label: t('nav.transactions'), path: '/transactions' },
    { icon: LineChart, label: t('nav.portfolio'),    path: '/portfolio' },
  ]
  const { pathname } = useLocation()
  const [showProfile, setShowProfile] = useState(false)
  const [exporting, setExporting]     = useState(false)
  const [moreOpen, setMoreOpen]       = useState(false)
  const [bottomNavVisible, setBottomNavVisible] = useState(true)
  const isMobile                      = useIsMobile()
  const lastScrollY                   = useRef(0)
  const ticking                       = useRef(false)

  useEffect(() => {
    if (!isMobile) return
    lastScrollY.current = window.scrollY

    function onScroll() {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const current = window.scrollY
        const delta   = current - lastScrollY.current
        if (delta > 8)       setBottomNavVisible(false) // scrolling down → hide
        else if (delta < -8) setBottomNavVisible(true)  // scrolling up   → show
        lastScrollY.current = current
        ticking.current = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobile])

  // On mobile show 4 primary tabs + "more" overflow
  const primaryNav = navItems.slice(0, 4)
  const overflowNav = navItems.slice(4)

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
      {/* ── Desktop navbar ── */}
      {!isMobile && <nav className="sticky top-0 z-50 drag-region">
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
        <div className="relative flex items-center justify-between py-3 no-drag" style={{ paddingLeft: '80px', paddingRight: '24px' }}>
          <div className="flex items-center gap-1">
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
      </nav>}

      {/* ── Mobile top bar ── */}
      {isMobile && <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'var(--color-nav-blur)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* App name / current page */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10"
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold">{initials}</div>
            }
          </button>
          <div className="flex items-center gap-1.5 bg-white/[0.06] rounded-lg px-2.5 py-1">
            <button onClick={onPrev} className="text-white/40 active:text-white transition-colors">
              <ChevronLeft size={13} />
            </button>
            <span className="text-xs font-medium text-white/80 w-24 text-center">{monthLabel}</span>
            <button onClick={onNext} className="text-white/40 active:text-white transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <NotificationBell currentDate={currentDate} />
          <Link to="/settings"
            className={`p-2 transition-colors ${pathname === '/settings' ? 'text-accent' : 'text-white/40'}`}>
            <Settings size={17} />
          </Link>
        </div>
      </div>}

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && <nav className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'var(--color-nav-blur)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          transform: bottomNavVisible ? 'translateY(0)' : 'translateY(100%)',
        }}>
        <div className="flex items-center justify-around px-1 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
          {primaryNav.map(({ icon: Icon, label, path }) => {
            const active = pathname === path
            return (
              <Link key={path} to={path}
                className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors min-w-0 flex-1 ${active ? 'text-accent' : 'text-white/40'}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[9px] font-medium truncate">{label}</span>
              </Link>
            )
          })}

          {/* More menu */}
          <div className="relative flex-1">
            <button
              onClick={() => setMoreOpen(v => !v)}
              className={`w-full flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors ${overflowNav.some(n => n.path === pathname) || pathname === '/calendar' ? 'text-accent' : 'text-white/40'}`}>
              <MoreHorizontal size={22} strokeWidth={1.8} />
              <span className="text-[9px] font-medium">More</span>
            </button>
            {moreOpen && (
              <div className="absolute bottom-full right-0 mb-2 glass-popup border border-white/10 rounded-2xl p-2 shadow-xl min-w-[160px]"
                onClick={() => setMoreOpen(false)}>
                {overflowNav.map(({ icon: Icon, label, path }) => {
                  const active = pathname === path
                  return (
                    <Link key={path} to={path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${active ? 'text-accent bg-white/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                      <Icon size={16} />
                      <span className="text-sm font-medium">{label}</span>
                    </Link>
                  )
                })}
                <div className="border-t border-white/[0.06] mt-1 pt-1">
                  <Link to="/calendar"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${pathname === '/calendar' ? 'text-accent bg-white/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                    <Calendar size={16} />
                    <span className="text-sm font-medium">Calendar</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>}

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
