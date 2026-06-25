import { useTwinkle } from './useTwinkle'

export default function VacationScene() {
  const starsRef = useTwinkle()
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vacSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1828" />
          <stop offset="100%" stopColor="#0e2a3a" />
        </linearGradient>
        <linearGradient id="vacSeaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e3050" />
          <stop offset="100%" stopColor="#0a2038" />
        </linearGradient>
      </defs>
      <rect width="600" height="160" fill="url(#vacSkyGrad)" />
      <g ref={starsRef}>
        <circle data-star cx="40" cy="18" r="1.2" fill="#64b4ff" opacity="0.5" />
        <circle data-star cx="100" cy="10" r="1" fill="#fff" opacity="0.35" />
        <circle data-star cx="160" cy="25" r="1.5" fill="#64b4ff" opacity="0.45" />
        <circle data-star cx="220" cy="8" r="1" fill="#fff" opacity="0.3" />
        <circle data-star cx="340" cy="18" r="1.2" fill="#64b4ff" opacity="0.4" />
        <circle data-star cx="420" cy="10" r="1" fill="#fff" opacity="0.35" />
        <circle data-star cx="480" cy="22" r="1.5" fill="#64b4ff" opacity="0.5" />
        <circle data-star cx="560" cy="12" r="1" fill="#fff" opacity="0.3" />
        <circle data-star cx="70" cy="42" r="1" fill="#64b4ff" opacity="0.3" />
        <circle data-star cx="270" cy="32" r="1" fill="#64b4ff" opacity="0.35" />
        <circle data-star cx="520" cy="38" r="1" fill="#fff" opacity="0.3" />
      </g>
      <circle cx="480" cy="38" r="20" fill="#0e2030" />
      <circle cx="486" cy="33" r="16" fill="#122840" />
      <rect x="0" y="108" width="600" height="52" fill="url(#vacSeaGrad)" />
      <path d="M0 110 Q50 106 100 110 Q150 114 200 110 Q250 106 300 110 Q350 114 400 110 Q450 106 500 110 Q550 114 600 110 L600 115 Q550 119 500 115 Q450 111 400 115 Q350 119 300 115 Q250 111 200 115 Q150 119 100 115 Q50 111 0 115 Z" fill="#0e3050" opacity="0.6" />
      <path d="M0 120 Q60 116 120 120 Q180 124 240 120 Q300 116 360 120 Q420 124 480 120 Q540 116 600 120 L600 124 Q540 128 480 124 Q420 120 360 124 Q300 128 240 124 Q180 120 120 124 Q60 128 0 124 Z" fill="#0a2840" opacity="0.5" />
      <ellipse cx="480" cy="130" rx="35" ry="6" fill="#1a4060" opacity="0.4" />
      <ellipse cx="480" cy="140" rx="20" ry="3" fill="#1a4060" opacity="0.3" />
      <ellipse cx="440" cy="108" rx="60" ry="10" fill="#0a2030" />
      <ellipse cx="430" cy="102" rx="12" ry="18" fill="#0e2a20" />
      <ellipse cx="440" cy="98" rx="9" ry="14" fill="#122e24" />
      <ellipse cx="452" cy="103" rx="10" ry="15" fill="#0e2a20" />
      <ellipse cx="300" cy="108" rx="120" ry="8" fill="#1a2e1a" opacity="0.5" />
      <rect x="118" y="90" width="2" height="22" fill="#1a3050" />
      <path d="M100 91 Q119 80 138 91 Z" fill="#64b4ff" opacity="0.7" />
      <path d="M109 91 Q119 85 129 91 Z" fill="#4a90d0" opacity="0.5" />
      <rect x="106" y="110" width="26" height="4" rx="2" fill="#1e3860" />
      <rect x="106" y="107" width="10" height="5" rx="2" fill="#263d66" />
      <rect x="462" y="87" width="2" height="22" fill="#1a3050" />
      <path d="M444 88 Q463 77 482 88 Z" fill="#e06db8" opacity="0.65" />
      <path d="M453 88 Q463 82 473 88 Z" fill="#b84d98" opacity="0.5" />
      <rect x="450" y="107" width="26" height="4" rx="2" fill="#1e3860" />
      <rect x="466" y="104" width="10" height="5" rx="2" fill="#263d66" />
      <path d="M80 55 Q200 40 320 48" stroke="#64b4ff" strokeWidth="0.8" strokeDasharray="4 4" fill="none" opacity="0.3" />
      <g transform="translate(316,44) rotate(-8)">
        <rect x="-8" y="-3" width="16" height="5" rx="2" fill="#2a5080" />
        <path d="M-2 -3 L-8 -8 L0 -3 Z" fill="#2a5080" />
        <path d="M-2 2 L-8 7 L0 2 Z" fill="#2a5080" />
        <rect x="4" y="-1" width="5" height="2" rx="1" fill="#2a5080" />
      </g>
    </svg>
  )
}
