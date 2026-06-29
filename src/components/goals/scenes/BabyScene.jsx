import { useTwinkle } from './useTwinkle'

export default function BabyScene({ fit = 'meet', align = 'Mid' } = {}) {
  const starsRef = useTwinkle()

  return (
    <svg width="100%" height="100%" viewBox="0 0 680 420" preserveAspectRatio={`x${align}YMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nightlightGlowBaby" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8b4ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c8b4ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonNightlightBaby" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8b4ff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c8b4ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="680" height="380" fill="none" />
      <g ref={starsRef}>
        <circle data-star cx="68" cy="32" r="1.2" fill="#e0d4ff" opacity="0.4" />
        <circle data-star cx="132" cy="18" r="1" fill="#e0d4ff" opacity="0.35" />
        <circle data-star cx="580" cy="24" r="1.2" fill="#e0d4ff" opacity="0.4" />
        <circle data-star cx="638" cy="42" r="1" fill="#e0d4ff" opacity="0.35" />
        <circle data-star cx="340" cy="28" r="0.8" fill="#e0d4ff" opacity="0.25" />
        <circle data-star cx="420" cy="14" r="1" fill="#e0d4ff" opacity="0.3" />
      </g>
      <circle cx="560" cy="90" r="70" fill="url(#moonNightlightBaby)" />
      <circle cx="560" cy="90" r="38" fill="#d8c8f5" opacity="0.75" />
      <circle cx="576" cy="84" r="30" fill="#191428" opacity="0.48" />
      <circle cx="548" cy="86" r="3" fill="#a888d8" opacity="0.4" />
      <circle cx="562" cy="82" r="2" fill="#a888d8" opacity="0.3" />
      <rect x="0" y="360" width="680" height="60" fill="#0f0c18" />
      <rect x="0" y="356" width="680" height="6" fill="#161220" opacity="0.8" />
      <rect x="0" y="0" width="2" height="360" fill="#120d20" opacity="0.4" />
      <rect x="678" y="0" width="2" height="360" fill="#120d20" opacity="0.4" />
      <ellipse cx="150" cy="100" rx="55" ry="22" fill="#130e20" opacity="0.7" />
      <ellipse cx="120" cy="108" rx="35" ry="18" fill="#140f22" opacity="0.6" />
      <ellipse cx="178" cy="108" rx="35" ry="18" fill="#140f22" opacity="0.6" />
      <ellipse cx="490" cy="95" rx="55" ry="22" fill="#130e20" opacity="0.7" />
      <ellipse cx="460" cy="103" rx="35" ry="18" fill="#140f22" opacity="0.6" />
      <ellipse cx="518" cy="103" rx="35" ry="18" fill="#140f22" opacity="0.6" />
      <ellipse cx="180" cy="365" rx="70" ry="18" fill="url(#nightlightGlowBaby)" />
      <rect x="145" y="310" width="28" height="38" rx="4" fill="#130e20" />
      <rect x="145" y="310" width="28" height="38" rx="4" fill="none" stroke="#2c2040" strokeWidth="0.7" />
      <circle cx="159" cy="322" r="8" fill="#d8c8f5" opacity="0.55" />
      <circle cx="159" cy="322" r="5" fill="#e0d4ff" opacity="0.6" />
      <rect x="154" y="344" width="4" height="6" rx="1" fill="#0f0c18" />
      <rect x="161" y="344" width="4" height="6" rx="1" fill="#0f0c18" />
      <ellipse cx="340" cy="368" rx="130" ry="10" fill="#000" opacity="0.25" />
      <rect x="224" y="320" width="8" height="50" rx="2" fill="#100d18" />
      <rect x="448" y="320" width="8" height="50" rx="2" fill="#100d18" />
      <rect x="230" y="340" width="8" height="30" rx="2" fill="#100d18" opacity="0.6" />
      <rect x="442" y="340" width="8" height="30" rx="2" fill="#100d18" opacity="0.6" />
      <rect x="215" y="235" width="250" height="90" rx="4" fill="#110e1a" />
      <rect x="215" y="235" width="250" height="90" rx="4" fill="none" stroke="#2c2040" strokeWidth="1" />
      <rect x="240" y="238" width="5" height="84" rx="2" fill="#0f0d16" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="262" y="238" width="5" height="84" rx="2" fill="#0f0d16" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="284" y="238" width="5" height="84" rx="2" fill="#0f0d16" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="306" y="238" width="5" height="84" rx="2" fill="#0f0d16" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="328" y="238" width="5" height="84" rx="2" fill="#0f0d16" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="350" y="238" width="5" height="84" rx="2" fill="#0f0d16" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="372" y="238" width="5" height="84" rx="2" fill="#0f0d16" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="394" y="238" width="5" height="84" rx="2" fill="#0f0d16" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="416" y="238" width="5" height="84" rx="2" fill="#0f0d16" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="213" y="230" width="254" height="10" rx="3" fill="#130f1e" stroke="#2c2040" strokeWidth="0.8" />
      <rect x="213" y="318" width="254" height="10" rx="3" fill="#130f1e" stroke="#2c2040" strokeWidth="0.8" />
      <rect x="225" y="295" width="230" height="28" rx="3" fill="#100d18" stroke="#1e182e" strokeWidth="0.5" />
      <rect x="235" y="300" width="100" height="20" rx="3" fill="#120e1c" stroke="#2c2040" strokeWidth="0.4" opacity="0.8" />
      <ellipse cx="285" cy="305" rx="28" ry="10" fill="#140f20" opacity="0.7" />
      <line x1="340" y1="148" x2="340" y2="180" stroke="#1f1a2c" strokeWidth="1.5" />
      <line x1="280" y1="180" x2="400" y2="180" stroke="#1f1a2c" strokeWidth="1.5" />
      <line x1="295" y1="180" x2="295" y2="212" stroke="#1f1a2c" strokeWidth="0.8" />
      <line x1="325" y1="180" x2="325" y2="218" stroke="#1f1a2c" strokeWidth="0.8" />
      <line x1="340" y1="180" x2="355" y2="222" stroke="#1f1a2c" strokeWidth="0.8" />
      <line x1="370" y1="180" x2="370" y2="215" stroke="#1f1a2c" strokeWidth="0.8" />
      <polygon points="295,212 297,218 303,218 298,222 300,228 295,224 290,228 292,222 287,218 293,218" fill="#241c34" stroke="rgba(200,180,255,0.4)" strokeWidth="0.5" transform="scale(0.7,0.7) translate(128,90)" />
      <circle cx="325" cy="222" r="6" fill="#130e20" stroke="#2c2040" strokeWidth="0.5" />
      <path d="M 325 216 Q 319 222 325 228 Q 331 222 325 216 Z" fill="rgba(200,180,255,0.3)" />
      <circle cx="356" cy="228" r="6" fill="#d8c8f5" opacity="0.25" />
      <circle cx="360" cy="226" r="5" fill="#120d20" opacity="0.6" />
      <polygon points="370,215 372,221 378,221 373,225 375,231 370,227 365,231 367,225 362,221 368,221" fill="#241c34" stroke="rgba(200,180,255,0.4)" strokeWidth="0.5" />
      <rect x="333" y="138" width="14" height="12" rx="2" fill="#100d18" stroke="#1f1a2c" strokeWidth="0.5" />
      <rect x="520" y="240" width="110" height="80" rx="2" fill="#100d18" />
      <rect x="520" y="240" width="110" height="80" rx="2" fill="none" stroke="#1e1a28" strokeWidth="0.6" />
      <rect x="520" y="280" width="110" height="2" fill="#1e1a28" opacity="0.6" />
      <rect x="526" y="245" width="10" height="33" rx="1" fill="#120e1c" stroke="#2c2040" strokeWidth="0.4" />
      <rect x="538" y="248" width="8" height="30" rx="1" fill="#120f1a" stroke="#1e1a28" strokeWidth="0.4" />
      <rect x="548" y="246" width="10" height="32" rx="1" fill="#120e1c" stroke="#2c2040" strokeWidth="0.4" />
      <rect x="560" y="250" width="7" height="28" rx="1" fill="#100d18" stroke="#1e1a28" strokeWidth="0.4" />
      <rect x="569" y="247" width="10" height="31" rx="1" fill="#120e1c" stroke="#2c2040" strokeWidth="0.4" />
      <rect x="526" y="286" width="16" height="14" rx="2" fill="#130e20" stroke="#1f1a2c" strokeWidth="0.4" />
      <circle cx="560" cy="293" r="7" fill="#130e20" stroke="#1f1a2c" strokeWidth="0.4" />
      <rect x="575" y="285" width="18" height="15" rx="2" fill="#100d18" stroke="#1f1a2c" strokeWidth="0.4" />
    </svg>
  )
}
