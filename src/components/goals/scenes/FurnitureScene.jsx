import { useTwinkle } from './useTwinkle'

export default function FurnitureScene({ fit = 'meet', align = 'Mid' } = {}) {
  const starsRef = useTwinkle()

  return (
    <svg width="100%" height="100%" viewBox="0 0 680 420" preserveAspectRatio={`x${align}YMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lampGlowFurn" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffd080" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffd080" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="windowGlowFFurn" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb464" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffb464" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={starsRef}>
        <circle data-star cx="76" cy="30" r="1" fill="#e8f4e8" opacity="0.4" />
        <circle data-star cx="132" cy="16" r="1.2" fill="#e8f4e8" opacity="0.35" />
        <circle data-star cx="198" cy="42" r="0.8" fill="#e8f4e8" opacity="0.3" />
        <circle data-star cx="75" cy="80" r="1" fill="#e8f4e8" opacity="0.4" />
        <circle data-star cx="98" cy="92" r="0.8" fill="#e8f4e8" opacity="0.35" />
        <circle data-star cx="128" cy="76" r="1" fill="#e8f4e8" opacity="0.4" />
        <circle data-star cx="155" cy="88" r="0.8" fill="#e8f4e8" opacity="0.3" />
      </g>
      <rect x="0" y="0" width="680" height="380" fill="none" />
      <rect x="0" y="360" width="680" height="60" fill="#100e0c" />
      <rect x="0" y="357" width="680" height="5" fill="#181511" opacity="0.8" />
      <rect x="0" y="352" width="680" height="8" rx="0" fill="#16120e" opacity="0.7" />
      <rect x="52" y="60" width="130" height="170" rx="3" fill="#140f0a" />
      <rect x="52" y="60" width="130" height="170" rx="3" fill="none" stroke="#3a2614" strokeWidth="1" />
      <rect x="55" y="63" width="60" height="80" rx="1" fill="rgba(255,180,100,0.1)" />
      <rect x="55" y="63" width="60" height="80" rx="1" fill="none" stroke="#3a2414" strokeWidth="0.5" />
      <rect x="119" y="63" width="60" height="80" rx="1" fill="rgba(255,180,100,0.07)" />
      <rect x="119" y="63" width="60" height="80" rx="1" fill="none" stroke="#3a2414" strokeWidth="0.5" />
      <rect x="55" y="147" width="60" height="80" rx="1" fill="rgba(255,180,100,0.06)" />
      <rect x="55" y="147" width="60" height="80" rx="1" fill="none" stroke="#3a2414" strokeWidth="0.5" />
      <rect x="119" y="147" width="60" height="80" rx="1" fill="rgba(255,180,100,0.09)" />
      <rect x="119" y="147" width="60" height="80" rx="1" fill="none" stroke="#3a2414" strokeWidth="0.5" />
      <circle cx="148" cy="115" r="12" fill="#d4edda" opacity="0.6" />
      <circle cx="154" cy="112" r="9" fill="#140f0a" opacity="0.55" />
      <ellipse cx="117" cy="360" rx="60" ry="10" fill="url(#windowGlowFFurn)" />
      <path d="M 52 60 Q 62 130 58 240" fill="none" stroke="#201912" strokeWidth="14" strokeLinecap="round" />
      <path d="M 182 60 Q 172 130 176 240" fill="none" stroke="#201912" strokeWidth="14" strokeLinecap="round" />
      <rect x="490" y="80" width="150" height="280" rx="2" fill="#16120d" />
      <rect x="490" y="80" width="150" height="280" rx="2" fill="none" stroke="#2c231a" strokeWidth="0.8" />
      <rect x="490" y="150" width="150" height="5" fill="#1e1811" stroke="#2c231a" strokeWidth="0.4" />
      <rect x="490" y="220" width="150" height="5" fill="#1e1811" stroke="#2c231a" strokeWidth="0.4" />
      <rect x="490" y="290" width="150" height="5" fill="#1e1811" stroke="#2c231a" strokeWidth="0.4" />
      <rect x="498" y="90" width="12" height="58" rx="1" fill="#1c150e" stroke="#3a2414" strokeWidth="0.4" />
      <rect x="512" y="94" width="10" height="54" rx="1" fill="#1e1710" stroke="#2a221a" strokeWidth="0.4" />
      <rect x="524" y="90" width="13" height="58" rx="1" fill="#1a140d" stroke="#3a2414" strokeWidth="0.4" />
      <rect x="539" y="96" width="9" height="52" rx="1" fill="#1c150e" stroke="#2a221a" strokeWidth="0.4" />
      <rect x="550" y="92" width="11" height="56" rx="1" fill="#1e1710" stroke="#3a2414" strokeWidth="0.4" />
      <rect x="563" y="90" width="12" height="58" rx="1" fill="#1a140d" stroke="#2a221a" strokeWidth="0.4" />
      <rect x="577" y="95" width="10" height="53" rx="1" fill="#1c150e" stroke="#3a2414" strokeWidth="0.4" />
      <rect x="589" y="92" width="12" height="56" rx="1" fill="#1e1710" stroke="#2a221a" strokeWidth="0.4" />
      <rect x="603" y="90" width="10" height="58" rx="1" fill="#1a140d" stroke="#3a2414" strokeWidth="0.4" />
      <rect x="615" y="93" width="13" height="55" rx="1" fill="#1c150e" stroke="#2a221a" strokeWidth="0.4" />
      <rect x="498" y="158" width="10" height="60" rx="1" fill="#1e1710" />
      <rect x="510" y="162" width="13" height="56" rx="1" fill="#1c150e" />
      <rect x="525" y="158" width="9" height="60" rx="1" fill="#1e1710" />
      <rect x="536" y="161" width="12" height="57" rx="1" fill="#1a140d" />
      <rect x="550" y="158" width="10" height="60" rx="1" fill="#1c150e" />
      <rect x="562" y="162" width="13" height="56" rx="1" fill="#1e1710" />
      <rect x="577" y="158" width="9" height="60" rx="1" fill="#1a140d" />
      <rect x="588" y="161" width="11" height="57" rx="1" fill="#1c150e" />
      <rect x="601" y="158" width="14" height="60" rx="1" fill="#1e1710" />
      <rect x="617" y="162" width="9" height="56" rx="1" fill="#1a140d" />
      <rect x="498" y="298" width="18" height="30" rx="2" fill="#1c150e" stroke="#3a2414" strokeWidth="0.4" />
      <circle cx="530" cy="313" r="11" fill="#20170e" stroke="#28211a" strokeWidth="0.5" />
      <rect x="545" y="296" width="15" height="32" rx="2" fill="#1a140d" stroke="#2a221a" strokeWidth="0.4" />
      <rect x="563" y="300" width="14" height="28" rx="2" fill="#1c150e" stroke="#3a2414" strokeWidth="0.4" />
      <ellipse cx="598" cy="313" rx="18" ry="12" fill="#1a140d" stroke="#2c231a" strokeWidth="0.4" />
      <ellipse cx="320" cy="355" rx="220" ry="18" fill="#18130e" opacity="0.9" />
      <ellipse cx="320" cy="355" rx="220" ry="18" fill="none" stroke="#3a2414" strokeWidth="0.7" />
      <ellipse cx="320" cy="355" rx="180" ry="14" fill="none" stroke="#2a2118" strokeWidth="0.5" />
      <ellipse cx="300" cy="368" rx="155" ry="9" fill="#000" opacity="0.3" />
      <rect x="162" y="340" width="10" height="22" rx="2" fill="#14100c" />
      <rect x="415" y="340" width="10" height="22" rx="2" fill="#14100c" />
      <rect x="185" y="342" width="8" height="20" rx="2" fill="#14100c" opacity="0.5" />
      <rect x="392" y="342" width="8" height="20" rx="2" fill="#14100c" opacity="0.5" />
      <rect x="155" y="268" width="275" height="78" rx="6" fill="#1e170f" />
      <rect x="155" y="268" width="275" height="78" rx="6" fill="none" stroke="#3a2414" strokeWidth="0.8" />
      <rect x="163" y="238" width="120" height="50" rx="5" fill="#1e1811" />
      <rect x="163" y="238" width="120" height="50" rx="5" fill="none" stroke="#3a2414" strokeWidth="0.6" />
      <rect x="295" y="238" width="120" height="50" rx="5" fill="#1e1811" />
      <rect x="295" y="238" width="120" height="50" rx="5" fill="none" stroke="#3a2414" strokeWidth="0.6" />
      <rect x="163" y="284" width="120" height="55" rx="4" fill="#1c1610" />
      <rect x="163" y="284" width="120" height="55" rx="4" fill="none" stroke="#2c231a" strokeWidth="0.5" />
      <rect x="295" y="284" width="120" height="55" rx="4" fill="#1c1610" />
      <rect x="295" y="284" width="120" height="55" rx="4" fill="none" stroke="#2c231a" strokeWidth="0.5" />
      <rect x="148" y="254" width="20" height="90" rx="4" fill="#1e1811" stroke="#3a2414" strokeWidth="0.6" />
      <rect x="420" y="254" width="20" height="90" rx="4" fill="#1e1811" stroke="#3a2414" strokeWidth="0.6" />
      <rect x="208" y="260" width="40" height="40" rx="4" fill="#1c150e" stroke="#2c231a" strokeWidth="0.5" />
      <line x1="208" y1="280" x2="248" y2="280" stroke="#2a2118" strokeWidth="0.5" opacity="0.5" />
      <line x1="228" y1="260" x2="228" y2="300" stroke="#2a2118" strokeWidth="0.5" opacity="0.5" />
      <rect x="440" y="165" width="6" height="195" rx="2" fill="#14100c" />
      <ellipse cx="443" cy="360" rx="22" ry="6" fill="#16120d" stroke="#2c231a" strokeWidth="0.5" />
      <path d="M 418 185 L 470 185 L 460 165 L 426 165 Z" fill="#1e1811" />
      <path d="M 418 185 L 470 185 L 460 165 L 426 165 Z" fill="none" stroke="#3a2414" strokeWidth="0.6" />
      <ellipse cx="443" cy="195" rx="90" ry="60" fill="url(#lampGlowFurn)" />
      <ellipse cx="443" cy="183" rx="18" ry="5" fill="rgba(255,180,100,0.25)" />
      <rect x="215" y="335" width="170" height="28" rx="3" fill="#16120d" stroke="#2c231a" strokeWidth="0.6" />
      <rect x="220" y="360" width="6" height="18" rx="1" fill="#14100c" />
      <rect x="376" y="360" width="6" height="18" rx="1" fill="#14100c" />
      <circle cx="270" cy="332" r="8" fill="#1c150e" stroke="#2c231a" strokeWidth="0.4" />
      <rect x="300" y="326" width="30" height="9" rx="1" fill="#18130d" stroke="#2c231a" strokeWidth="0.4" />
      <rect x="300" y="328" width="30" height="1" fill="#2c231a" opacity="0.4" />
    </svg>
  )
}
