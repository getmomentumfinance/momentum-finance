import { useTwinkle } from './useTwinkle'

export default function GiftScene({ fit = 'meet' } = {}) {
  const starsRef = useTwinkle()
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio={`xMidYMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="giftSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16120e" /><stop offset="100%" stopColor="#1e1810" />
        </linearGradient>
      </defs>
      <rect width="600" height="160" fill="url(#giftSky)" />
      <g ref={starsRef}>
        <circle data-star cx="55" cy="15" r="1.2" fill="#ffd250" opacity="0.4" />
        <circle data-star cx="120" cy="8" r="1" fill="#fff" opacity="0.25" />
        <circle data-star cx="490" cy="12" r="1.2" fill="#ffd250" opacity="0.35" />
        <circle data-star cx="555" cy="22" r="1" fill="#fff" opacity="0.2" />
        <circle data-star cx="200" cy="25" r="1" fill="#ffd250" opacity="0.3" />
        <circle data-star cx="380" cy="18" r="1" fill="#ffd250" opacity="0.3" />
        <circle data-star cx="80" cy="40" r="1" fill="#ffd250" opacity="0.2" />
        <circle data-star cx="520" cy="38" r="1" fill="#ffd250" opacity="0.2" />
      </g>
      <rect x="0" y="128" width="600" height="32" fill="#120e08" />
      <rect x="238" y="70" width="124" height="90" rx="4" fill="#1a1410" />
      <rect x="230" y="62" width="140" height="16" rx="3" fill="#221810" />
      <rect x="220" y="58" width="160" height="8" rx="3" fill="#2a2014" />
      <rect x="244" y="56" width="4" height="8" rx="1" fill="#3a2c18" /><rect x="352" y="56" width="4" height="8" rx="1" fill="#3a2c18" />
      <ellipse cx="246" cy="55" rx="3" ry="4" fill="#ffd250" opacity="0.7" /><ellipse cx="354" cy="55" rx="3" ry="4" fill="#ffd250" opacity="0.7" />
      <rect x="288" y="50" width="24" height="10" rx="2" fill="#2a2010" />
      <ellipse cx="300" cy="118" rx="40" ry="10" fill="#1a1008" />
      <path d="M278 122 Q285 90 292 100 Q296 80 300 88 Q304 78 308 96 Q314 86 320 110 Q310 95 300 105 Q290 95 278 122Z" fill="#ff6020" opacity="0.7" />
      <path d="M284 118 Q290 96 296 104 Q300 90 304 100 Q310 92 316 114 Q307 100 300 108 Q293 100 284 118Z" fill="#ffa020" opacity="0.8" />
      <path d="M290 116 Q295 100 300 106 Q305 98 310 114 Q304 104 300 110 Q296 104 290 116Z" fill="#ffd250" opacity="0.7" />
      <ellipse cx="300" cy="115" rx="50" ry="18" fill="#ff6020" opacity="0.12" />
      <rect x="90" y="105" width="48" height="35" rx="3" fill="#1e1810" />
      <rect x="94" y="99" width="40" height="10" rx="2" fill="#2a2014" />
      <rect x="112" y="99" width="4" height="41" rx="1" fill="#ffd250" opacity="0.4" />
      <rect x="90" y="117" width="48" height="4" fill="#ffd250" opacity="0.35" />
      <path d="M112 99 Q104 90 108 96 Q112 92 114 99" fill="#ffa0b4" opacity="0.6" />
      <path d="M116 99 Q122 90 120 96 Q116 92 114 99" fill="#ffa0b4" opacity="0.6" />
      <circle cx="114" cy="99" r="3" fill="#ff8090" opacity="0.7" />
      <rect x="150" y="112" width="38" height="28" rx="3" fill="#1e2018" />
      <rect x="154" y="107" width="30" height="9" rx="2" fill="#283020" />
      <rect x="167" y="107" width="4" height="33" rx="1" fill="#50dc8c" opacity="0.4" />
      <rect x="150" y="122" width="38" height="3" fill="#50dc8c" opacity="0.3" />
      <path d="M167 107 Q160 99 163 104 Q167 100 169 107" fill="#c8b4ff" opacity="0.6" />
      <path d="M171 107 Q177 99 175 104 Q171 100 169 107" fill="#c8b4ff" opacity="0.6" />
      <rect x="412" y="108" width="44" height="32" rx="3" fill="#1a1e1a" />
      <rect x="416" y="102" width="36" height="10" rx="2" fill="#222818" />
      <rect x="432" y="102" width="4" height="38" rx="1" fill="#64b4ff" opacity="0.4" />
      <rect x="412" y="120" width="44" height="3" fill="#64b4ff" opacity="0.3" />
      <path d="M432 102 Q425 94 428 99 Q432 95 434 102" fill="#ffb464" opacity="0.6" />
      <path d="M436 102 Q442 94 440 99 Q436 95 434 102" fill="#ffb464" opacity="0.6" />
      <rect x="468" y="100" width="52" height="40" rx="3" fill="#201618" />
      <rect x="472" y="93" width="44" height="11" rx="2" fill="#2a1e20" />
      <rect x="492" y="93" width="4" height="47" rx="1" fill="#ffa0b4" opacity="0.4" />
      <rect x="468" y="115" width="52" height="3" fill="#ffa0b4" opacity="0.3" />
      <path d="M492 93 Q484 83 488 90 Q492 85 494 93" fill="#ffd250" opacity="0.65" />
      <path d="M496 93 Q503 83 500 90 Q496 85 494 93" fill="#ffd250" opacity="0.65" />
      <circle cx="494" cy="93" r="3.5" fill="#ffb800" opacity="0.7" />
    </svg>
  )
}
