import { useTwinkle } from './useTwinkle'

export default function FurnitureScene({ fit = 'meet' } = {}) {
  const starsRef = useTwinkle()
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio={`xMidYMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="furnSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1410" /><stop offset="100%" stopColor="#221a14" />
        </linearGradient>
      </defs>
      <rect width="600" height="160" fill="url(#furnSky)" />
      <rect x="200" y="0" width="200" height="160" fill="#221a10" opacity="0.3" />
      <g ref={starsRef}>
        <circle data-star cx="40" cy="15" r="1" fill="#ffb464" opacity="0.3" />
        <circle data-star cx="100" cy="8" r="1.2" fill="#fff" opacity="0.2" />
        <circle data-star cx="520" cy="12" r="1" fill="#ffb464" opacity="0.3" />
        <circle data-star cx="560" cy="25" r="1.2" fill="#fff" opacity="0.2" />
        <circle data-star cx="80" cy="35" r="1" fill="#ffb464" opacity="0.2" />
        <circle data-star cx="490" cy="30" r="1" fill="#ffb464" opacity="0.2" />
      </g>
      <rect x="0" y="128" width="600" height="32" fill="#1a1208" />
      <line x1="0" y1="134" x2="600" y2="134" stroke="#201808" strokeWidth="1.5" />
      <line x1="0" y1="140" x2="600" y2="140" stroke="#201808" strokeWidth="1.5" />
      <line x1="0" y1="146" x2="600" y2="146" stroke="#201808" strokeWidth="1.5" />
      <rect x="0" y="0" width="600" height="128" fill="#1a1410" />
      <rect x="0" y="124" width="600" height="4" fill="#221a14" />
      <rect x="230" y="20" width="140" height="100" rx="4" fill="#1e1a28" />
      <rect x="234" y="24" width="132" height="92" rx="2" fill="#161220" />
      <path d="M230 20 Q215 60 218 120 L230 120 Z" fill="#2a2018" opacity="0.9" />
      <path d="M370 20 Q385 60 382 120 L370 120 Z" fill="#2a2018" opacity="0.9" />
      <circle cx="240" cy="20" r="3" fill="#3a2c1c" /><circle cx="255" cy="20" r="3" fill="#3a2c1c" /><circle cx="270" cy="20" r="3" fill="#3a2c1c" /><circle cx="285" cy="20" r="3" fill="#3a2c1c" /><circle cx="300" cy="20" r="3" fill="#3a2c1c" /><circle cx="315" cy="20" r="3" fill="#3a2c1c" /><circle cx="330" cy="20" r="3" fill="#3a2c1c" /><circle cx="345" cy="20" r="3" fill="#3a2c1c" /><circle cx="360" cy="20" r="3" fill="#3a2c1c" />
      <line x1="300" y1="24" x2="300" y2="116" stroke="#1a1628" strokeWidth="2" />
      <line x1="234" y1="70" x2="366" y2="70" stroke="#1a1628" strokeWidth="2" />
      <circle cx="268" cy="48" r="16" fill="#252030" />
      <circle cx="273" cy="44" r="12" fill="#2c2840" />
      <rect x="140" y="98" width="220" height="32" rx="5" fill="#2e2016" />
      <rect x="140" y="88" width="220" height="14" rx="4" fill="#382818" />
      <rect x="140" y="88" width="14" height="42" rx="3" fill="#322014" />
      <rect x="346" y="88" width="14" height="42" rx="3" fill="#322014" />
      <rect x="158" y="100" width="58" height="24" rx="3" fill="#3a2a1a" />
      <rect x="221" y="100" width="58" height="24" rx="3" fill="#3a2a1a" />
      <rect x="284" y="100" width="58" height="24" rx="3" fill="#3a2a1a" />
      <rect x="150" y="128" width="8" height="8" rx="1" fill="#2a1c10" /><rect x="338" y="128" width="8" height="8" rx="1" fill="#2a1c10" />
      <rect x="196" y="122" width="108" height="6" rx="2" fill="#261c10" />
      <rect x="206" y="128" width="6" height="8" rx="1" fill="#221808" /><rect x="288" y="128" width="6" height="8" rx="1" fill="#221808" />
      <rect x="234" y="114" width="6" height="10" rx="1" fill="#3a2c1c" />
      <ellipse cx="237" cy="113" rx="4" ry="2" fill="#ffb464" opacity="0.6" />
      <ellipse cx="237" cy="120" rx="8" ry="2" fill="#ffb464" opacity="0.1" />
      <rect x="248" y="117" width="18" height="5" rx="1" fill="#2e2418" />
      <rect x="78" y="108" width="5" height="20" rx="1" fill="#2a1c10" />
      <ellipse cx="80" cy="108" rx="20" ry="22" fill="#1e2818" />
      <ellipse cx="70" cy="100" rx="13" ry="16" fill="#243020" />
      <ellipse cx="90" cy="98" rx="14" ry="17" fill="#243020" />
      <ellipse cx="80" cy="92" rx="11" ry="14" fill="#2a3820" />
      <rect x="518" y="80" width="4" height="48" fill="#2a1c10" />
      <path d="M504 82 L536 82 L528 62 L512 62 Z" fill="#382818" />
      <ellipse cx="520" cy="82" rx="16" ry="4" fill="#ffb464" opacity="0.15" />
      <ellipse cx="520" cy="100" rx="26" ry="10" fill="#ffb464" opacity="0.08" />
      <rect x="510" y="126" width="20" height="4" rx="2" fill="#2a1c10" />
    </svg>
  )
}
