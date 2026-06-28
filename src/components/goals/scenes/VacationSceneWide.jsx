import { useTwinkle } from './useTwinkle'

export default function VacationSceneWide() {
  const starsRef = useTwinkle()
  return (
    <svg width="100%" height="100%" viewBox="0 0 1600 160" preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vacSkyGradW" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1828" />
          <stop offset="100%" stopColor="#0e2a3a" />
        </linearGradient>
        <linearGradient id="vacSeaGradW" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e3050" />
          <stop offset="100%" stopColor="#0a2038" />
        </linearGradient>
      </defs>
      <rect width="1600" height="160" fill="url(#vacSkyGradW)" />
      <g ref={starsRef}>
        <circle data-star cx="40" cy="18" r="1.2" fill="#64b4ff" opacity="0.5" />
        <circle data-star cx="100" cy="10" r="1" fill="#fff" opacity="0.35" />
        <circle data-star cx="160" cy="25" r="1.5" fill="#64b4ff" opacity="0.45" />
        <circle data-star cx="220" cy="8" r="1" fill="#fff" opacity="0.3" />
        <circle data-star cx="340" cy="18" r="1.2" fill="#64b4ff" opacity="0.4" />
        <circle data-star cx="70" cy="42" r="1" fill="#64b4ff" opacity="0.3" />
        <circle data-star cx="270" cy="32" r="1" fill="#64b4ff" opacity="0.35" />
        <circle data-star cx="950" cy="14" r="1.2" fill="#64b4ff" opacity="0.4" />
        <circle data-star cx="1020" cy="28" r="1" fill="#fff" opacity="0.3" />
        <circle data-star cx="1120" cy="10" r="1.5" fill="#64b4ff" opacity="0.45" />
        <circle data-star cx="1250" cy="22" r="1" fill="#fff" opacity="0.3" />
        <circle data-star cx="1340" cy="12" r="1.2" fill="#64b4ff" opacity="0.4" />
        <circle data-star cx="1450" cy="30" r="1" fill="#64b4ff" opacity="0.35" />
        <circle data-star cx="1540" cy="16" r="1" fill="#fff" opacity="0.3" />
      </g>
      <circle cx="980" cy="38" r="20" fill="#0e2030" />
      <circle cx="986" cy="33" r="16" fill="#122840" />
      <rect x="0" y="108" width="1600" height="52" fill="url(#vacSeaGradW)" />
      <path d="M0 110 Q50 106 100 110 Q150 114 200 110 Q250 106 300 110 Q350 114 400 110 Q450 106 500 110 Q550 114 600 110 Q650 106 700 110 Q750 114 800 110 Q850 106 900 110 Q950 114 1000 110 Q1050 106 1100 110 Q1150 114 1200 110 Q1250 106 1300 110 Q1350 114 1400 110 Q1450 106 1500 110 Q1550 114 1600 110 L1600 115 Q1550 119 1500 115 Q1450 111 1400 115 Q1350 119 1300 115 Q1250 111 1200 115 Q1150 119 1100 115 Q1050 111 1000 115 Q950 119 900 115 Q850 111 800 115 Q750 119 700 115 Q650 111 600 115 Q550 119 500 115 Q450 111 400 115 Q350 119 300 115 Q250 111 200 115 Q150 119 100 115 Q50 111 0 115 Z" fill="#0e3050" opacity="0.6" />
      <path d="M0 120 Q60 116 120 120 Q180 124 240 120 Q300 116 360 120 Q420 124 480 120 Q540 116 600 120 Q660 124 720 120 Q780 116 840 120 Q900 124 960 120 Q1020 116 1080 120 Q1140 124 1200 120 Q1260 116 1320 120 Q1380 124 1440 120 Q1500 116 1560 120 Q1590 122 1600 120 L1600 124 Q1560 128 1500 124 Q1440 120 1380 124 Q1320 128 1260 124 Q1200 120 1140 124 Q1080 128 1020 124 Q960 120 900 124 Q840 128 780 124 Q720 120 660 124 Q600 128 540 124 Q480 120 420 124 Q360 128 300 124 Q240 120 180 124 Q120 128 60 124 Q30 122 0 124 Z" fill="#0a2840" opacity="0.5" />

      <g transform="translate(500,0)">
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
      </g>
    </svg>
  )
}
