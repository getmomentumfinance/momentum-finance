import { Link } from 'react-router-dom'
import { LayoutGrid, Info, HelpCircle, LogIn, UserPlus } from 'lucide-react'

const NAV_ITEMS = [
  { title: 'Features',     href: '#features',     Icon: LayoutGrid, gradientFrom: '#0f0d0c', gradientTo: '#0f0d0c', scroll: true  },
  { title: 'How It Works', href: '#how-it-works', Icon: Info,        gradientFrom: '#0f0d0c', gradientTo: '#0f0d0c', scroll: true  },
  { title: 'FAQ',          href: '#faq',          Icon: HelpCircle,  gradientFrom: '#0f0d0c', gradientTo: '#0f0d0c', scroll: true  },
  { title: 'Log in',       href: '/login',        Icon: LogIn,       gradientFrom: '#0f0d0c', gradientTo: '#0f0d0c', scroll: false },
  { title: 'Sign up',      href: '/register',     Icon: UserPlus,    gradientFrom: '#0f0d0c', gradientTo: '#0f0d0c', scroll: false },
]

export default function GradientMenu() {
  return (
    <ul className="flex gap-2 items-center">
      {NAV_ITEMS.map(({ title, href, Icon, gradientFrom, gradientTo, scroll }, idx) => {
        const inner = (
          <>
            {/* Pill fill — subtle at rest, full on hover */}
            <span
              className="absolute inset-0 rounded-full transition-opacity duration-500 opacity-30 group-hover:opacity-100"
              style={{ background: `linear-gradient(45deg, ${gradientFrom}, ${gradientTo})` }}
            />
            {/* Glow layer */}
            <span
              className="absolute top-[6px] inset-x-0 h-full rounded-full blur-[14px] -z-10 opacity-0 group-hover:opacity-60 transition-opacity duration-500"
              style={{ background: `linear-gradient(45deg, ${gradientFrom}, ${gradientTo})` }}
            />
            {/* Icon — visible at rest, fades out on hover */}
            <span className="relative z-10 flex items-center justify-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-50">
              <Icon size={16} className="text-white" strokeWidth={2} />
            </span>
            {/* Label — hidden at rest, fades in on hover */}
            <span className="absolute z-10 whitespace-nowrap text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100 pointer-events-none">
              {title}
            </span>
          </>
        )

        const cls = `
          relative flex items-center justify-center overflow-hidden rounded-full cursor-pointer
          w-[36px] h-[36px] hover:w-[140px] hover:h-[40px]
          transition-all duration-500 group
          bg-white/10 hover:bg-transparent
          border border-white/20 hover:border-transparent
        `

        return scroll ? (
          <li key={idx}><a href={href} className={cls}>{inner}</a></li>
        ) : (
          <li key={idx}><Link to={href} className={cls}>{inner}</Link></li>
        )
      })}
    </ul>
  )
}
