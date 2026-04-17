import { Link } from 'react-router-dom'

const NAV_ITEMS = [
  { title: 'Features',     href: '#features',     gradientFrom: '#56CCF2', gradientTo: '#2F80ED', scroll: true  },
  { title: 'How It Works', href: '#how-it-works', gradientFrom: '#FF9966', gradientTo: '#FF5E62', scroll: true  },
  { title: 'FAQ',          href: '#faq',          gradientFrom: '#80FF72', gradientTo: '#7EE8FA', scroll: true  },
  { title: 'Log in',       href: '/login',        gradientFrom: '#a955ff', gradientTo: '#ea51ff', scroll: false },
  { title: 'Sign up',      href: '/register',     gradientFrom: '#ffa9c6', gradientTo: '#f434e2', scroll: false },
]

export default function GradientMenu() {
  return (
    <ul className="flex gap-3 items-center">
      {NAV_ITEMS.map(({ title, href, gradientFrom, gradientTo, scroll }, idx) => {
        const inner = (
          <>
            {/* Pill fill — dim at rest, full on hover */}
            <span
              className="absolute inset-0 rounded-full transition-opacity duration-500 opacity-40 group-hover:opacity-100"
              style={{ background: `linear-gradient(45deg, ${gradientFrom}, ${gradientTo})` }}
            />
            {/* Glow layer */}
            <span
              className="absolute top-[6px] inset-x-0 h-full rounded-full blur-[12px] -z-10 opacity-0 group-hover:opacity-50 transition-opacity duration-500"
              style={{ background: `linear-gradient(45deg, ${gradientFrom}, ${gradientTo})` }}
            />
            {/* Label */}
            <span className="relative z-10 whitespace-nowrap text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 pointer-events-none">
              {title}
            </span>
          </>
        )

        const cls = `
          relative h-[10px] w-[36px] hover:h-[40px] hover:w-[140px]
          rounded-full flex items-center justify-center overflow-hidden
          transition-all duration-500 group cursor-pointer
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
