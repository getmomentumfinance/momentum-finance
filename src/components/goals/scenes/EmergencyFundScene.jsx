import { useTwinkle } from './useTwinkle'

export default function EmergencyFundScene({ pct = 0 }) {
  const starsRef = useTwinkle()
  // Shield fill rises from the bottom of its silhouette in proportion to pct.
  const fillHeight = (Math.min(100, Math.max(0, pct)) / 100) * 60
  const fillY = 132 - fillHeight

  return (
    <svg width="100%" height="100%" viewBox="0 0 600 165" preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="efSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1f2a" />
          <stop offset="100%" stopColor="#152a38" />
        </linearGradient>
        <linearGradient id="efRainGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a5a" stopOpacity="0" />
          <stop offset="100%" stopColor="#2a7a8a" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id="efPuddleG" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#2a8888" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1a5060" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id="efShieldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#64e8c8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#64e8c8" stopOpacity="0" />
        </radialGradient>
        <clipPath id="efShieldClip">
          <path d="M300 72 L326 82 L326 104 Q326 122 300 132 Q274 122 274 104 L274 82 Z" />
        </clipPath>
      </defs>

      <rect width="600" height="165" fill="url(#efSkyGrad)" />

      <g ref={starsRef}>
        <circle data-star cx="50" cy="18" r="1" fill="#64e8c8" opacity="0.3" />
        <circle data-star cx="130" cy="10" r="1.2" fill="#fff" opacity="0.2" />
        <circle data-star cx="490" cy="14" r="1" fill="#64e8c8" opacity="0.25" />
        <circle data-star cx="555" cy="28" r="1.2" fill="#fff" opacity="0.2" />
        <circle data-star cx="310" cy="8" r="1" fill="#64e8c8" opacity="0.2" />
      </g>

      <ellipse cx="120" cy="62" rx="90" ry="34" fill="#1a3a4a" />
      <ellipse cx="80" cy="70" rx="60" ry="28" fill="#1e4050" />
      <ellipse cx="155" cy="58" rx="55" ry="26" fill="#1e4050" />
      <ellipse cx="110" cy="52" rx="40" ry="22" fill="#224455" />

      <ellipse cx="460" cy="55" rx="100" ry="36" fill="#1a3a4a" />
      <ellipse cx="420" cy="64" rx="65" ry="28" fill="#1e4050" />
      <ellipse cx="500" cy="50" rx="60" ry="26" fill="#1e4050" />
      <ellipse cx="460" cy="44" rx="44" ry="22" fill="#224455" />

      <ellipse cx="300" cy="72" rx="70" ry="24" fill="#1a3848" />
      <ellipse cx="268" cy="78" rx="48" ry="20" fill="#1e4050" />
      <ellipse cx="332" cy="68" rx="44" ry="20" fill="#1e4050" />

      <g opacity="0.35" stroke="#64e8c8" strokeWidth="0.8" strokeLinecap="round">
        <line x1="68" y1="92" x2="62" y2="114" />
        <line x1="82" y1="96" x2="76" y2="118" />
        <line x1="96" y1="90" x2="90" y2="112" />
        <line x1="110" y1="94" x2="104" y2="116" />
        <line x1="124" y1="88" x2="118" y2="110" />
        <line x1="138" y1="92" x2="132" y2="114" />
        <line x1="152" y1="86" x2="146" y2="108" />
        <line x1="75" y1="108" x2="69" y2="130" />
        <line x1="103" y1="110" x2="97" y2="132" />
        <line x1="131" y1="106" x2="125" y2="128" />
      </g>

      <g opacity="0.3" stroke="#64e8c8" strokeWidth="0.8" strokeLinecap="round">
        <line x1="390" y1="88" x2="384" y2="110" />
        <line x1="408" y1="92" x2="402" y2="114" />
        <line x1="424" y1="86" x2="418" y2="108" />
        <line x1="440" y1="90" x2="434" y2="112" />
        <line x1="456" y1="84" x2="450" y2="106" />
        <line x1="472" y1="88" x2="466" y2="110" />
        <line x1="488" y1="82" x2="482" y2="104" />
        <line x1="504" y1="86" x2="498" y2="108" />
        <line x1="416" y1="106" x2="410" y2="128" />
        <line x1="464" y1="102" x2="458" y2="124" />
      </g>

      <g opacity="0.25" stroke="#64e8c8" strokeWidth="0.7" strokeLinecap="round">
        <line x1="268" y1="92" x2="263" y2="112" />
        <line x1="282" y1="96" x2="277" y2="116" />
        <line x1="296" y1="90" x2="291" y2="110" />
        <line x1="310" y1="94" x2="305" y2="114" />
        <line x1="324" y1="88" x2="319" y2="108" />
      </g>

      <rect x="0" y="138" width="600" height="27" fill="#0e2230" />
      <path d="M0 136 Q150 132 300 136 Q450 140 600 136 L600 140 L0 140 Z" fill="#122838" />

      <ellipse cx="100" cy="142" rx="38" ry="6" fill="url(#efPuddleG)" />
      <ellipse cx="300" cy="145" rx="28" ry="5" fill="url(#efPuddleG)" />
      <ellipse cx="490" cy="141" rx="34" ry="5" fill="url(#efPuddleG)" />

      <ellipse cx="100" cy="142" rx="22" ry="3" fill="none" stroke="#2a8888" strokeWidth="0.7" opacity="0.4" />
      <ellipse cx="100" cy="142" rx="12" ry="2" fill="none" stroke="#2a8888" strokeWidth="0.6" opacity="0.3" />
      <ellipse cx="490" cy="141" rx="20" ry="3" fill="none" stroke="#2a8888" strokeWidth="0.7" opacity="0.35" />

      <rect x="174" y="78" width="2.5" height="58" fill="#1a3a4a" />
      <path d="M175 136 Q175 148 165 148" fill="none" stroke="#1a3a4a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M130 80 Q175 58 220 80 Q197 70 175 70 Q153 70 130 80 Z" fill="#2a6878" />
      <path d="M130 80 Q152 74 175 74 Q198 74 220 80" fill="none" stroke="#64e8c8" strokeWidth="1" opacity="0.4" />
      <line x1="175" y1="70" x2="130" y2="80" stroke="#1e5060" strokeWidth="0.8" opacity="0.5" />
      <line x1="175" y1="70" x2="152" y2="75" stroke="#1e5060" strokeWidth="0.8" opacity="0.5" />
      <line x1="175" y1="70" x2="198" y2="75" stroke="#1e5060" strokeWidth="0.8" opacity="0.5" />
      <line x1="175" y1="70" x2="220" y2="80" stroke="#1e5060" strokeWidth="0.8" opacity="0.5" />

      <rect x="424" y="75" width="2.5" height="61" fill="#1a3a4a" />
      <path d="M425 136 Q425 148 415 148" fill="none" stroke="#1a3a4a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M380 77 Q425 55 470 77 Q447 67 425 67 Q403 67 380 77 Z" fill="#1e4e62" />
      <path d="M380 77 Q402 71 425 71 Q448 71 470 77" fill="none" stroke="#64e8c8" strokeWidth="1" opacity="0.35" />
      <line x1="425" y1="67" x2="380" y2="77" stroke="#1a4055" strokeWidth="0.8" opacity="0.5" />
      <line x1="425" y1="67" x2="402" y2="72" stroke="#1a4055" strokeWidth="0.8" opacity="0.5" />
      <line x1="425" y1="67" x2="448" y2="72" stroke="#1a4055" strokeWidth="0.8" opacity="0.5" />
      <line x1="425" y1="67" x2="470" y2="77" stroke="#1a4055" strokeWidth="0.8" opacity="0.5" />

      <ellipse cx="300" cy="105" rx="42" ry="42" fill="url(#efShieldGlow)" />

      <path d="M300 72 L326 82 L326 104 Q326 122 300 132 Q274 122 274 104 L274 82 Z"
        fill="#1a3a4a" stroke="#64e8c8" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="274" y={fillY} width="52" height={fillHeight} fill="#2a7a6a" opacity="0.55" clipPath="url(#efShieldClip)" />
      <polyline points="289,102 298,111 313,94" fill="none" stroke="#64e8c8" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

      <rect width="600" height="165" fill="url(#efRainGrad)" />
    </svg>
  )
}
