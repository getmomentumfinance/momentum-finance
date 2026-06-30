import { useTwinkle } from './useTwinkle'

export default function ArtScene({ fit = 'meet', align = 'Mid' } = {}) {
  const starsRef = useTwinkle()

  return (
    <svg width="100%" height="100%" viewBox="0 0 680 420" preserveAspectRatio={`x${align}YMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="skylightMoonArt" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8b0ff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c8b0ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampConeArt" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#c8a0ff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#c8a0ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="monitorGlowArt" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a08cff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#a08cff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={starsRef}>
        <circle data-star cx="310" cy="22" r="1" fill="#e0d8ff" opacity="0.5" />
        <circle data-star cx="340" cy="12" r="1.2" fill="#e0d8ff" opacity="0.45" />
        <circle data-star cx="368" cy="20" r="0.8" fill="#e0d8ff" opacity="0.4" />
        <circle data-star cx="325" cy="32" r="0.8" fill="#e0d8ff" opacity="0.35" />
        <circle data-star cx="356" cy="34" r="0.8" fill="#e0d8ff" opacity="0.3" />
        <circle data-star cx="288" cy="10" r="0.8" fill="#e0d8ff" opacity="0.5" />
        <circle data-star cx="316" cy="8" r="1" fill="#e0d8ff" opacity="0.4" />
        <circle data-star cx="358" cy="10" r="0.8" fill="#e0d8ff" opacity="0.5" />
        <circle data-star cx="386" cy="8" r="1" fill="#e0d8ff" opacity="0.4" />
        <circle data-star cx="40" cy="38" r="1.2" fill="#e0d8ff" opacity="0.4" />
        <circle data-star cx="72" cy="28" r="1" fill="#e0d8ff" opacity="0.35" />
        <circle data-star cx="108" cy="42" r="1.2" fill="#e0d8ff" opacity="0.4" />
        <circle data-star cx="144" cy="30" r="1" fill="#e0d8ff" opacity="0.35" />
        <circle data-star cx="178" cy="36" r="0.8" fill="#e0d8ff" opacity="0.3" />
      </g>
      <rect x="0" y="0" width="680" height="370" fill="none" />
      <rect x="0" y="365" width="680" height="55" fill="#0e0c18" />
      <rect x="0" y="362" width="680" height="5" fill="#12101e" opacity="0.8" />
      <rect x="0" y="365" width="680" height="1.5" fill="#14121e" opacity="0.5" />
      <rect x="0" y="378" width="680" height="1.5" fill="#14121e" opacity="0.4" />
      <rect x="0" y="391" width="680" height="1.5" fill="#14121e" opacity="0.35" />
      <line x1="80" y1="362" x2="60" y2="420" stroke="#14121e" strokeWidth="0.7" opacity="0.4" />
      <line x1="200" y1="362" x2="165" y2="420" stroke="#14121e" strokeWidth="0.7" opacity="0.35" />
      <line x1="320" y1="362" x2="290" y2="420" stroke="#14121e" strokeWidth="0.7" opacity="0.4" />
      <line x1="440" y1="362" x2="418" y2="420" stroke="#14121e" strokeWidth="0.7" opacity="0.35" />
      <line x1="560" y1="362" x2="545" y2="420" stroke="#14121e" strokeWidth="0.7" opacity="0.4" />
      <ellipse cx="245" cy="378" rx="12" ry="5" fill="rgba(160,140,255,0.12)" transform="rotate(-15,245,378)" />
      <ellipse cx="262" cy="388" rx="7" ry="3" fill="rgba(160,140,255,0.09)" />
      <ellipse cx="230" cy="392" rx="5" ry="2" fill="rgba(160,140,255,0.1)" transform="rotate(20,230,392)" />
      <circle cx="290" cy="382" r="3" fill="rgba(180,140,255,0.1)" />
      <circle cx="278" cy="396" r="2" fill="rgba(180,140,255,0.08)" />
      <ellipse cx="480" cy="374" rx="8" ry="3" fill="rgba(160,140,255,0.1)" transform="rotate(10,480,374)" />
      <circle cx="460" cy="385" r="2.5" fill="rgba(160,140,255,0.09)" />
      <ellipse cx="195" cy="398" rx="6" ry="2.5" fill="rgba(180,140,255,0.09)" transform="rotate(-8,195,398)" />
      <rect x="270" y="0" width="140" height="52" rx="3" fill="#0e0c18" />
      <rect x="270" y="0" width="140" height="52" rx="3" fill="none" stroke="#1e1c30" strokeWidth="1.2" />
      <rect x="337" y="0" width="6" height="52" fill="#131020" opacity="0.8" />
      <rect x="270" y="24" width="140" height="5" fill="#131020" opacity="0.8" />
      <rect x="273" y="2" width="62" height="20" rx="1" fill="#0c0a18" opacity="0.9" />
      <rect x="345" y="2" width="62" height="20" rx="1" fill="#0c0a18" opacity="0.9" />
      <rect x="273" y="29" width="62" height="20" rx="1" fill="rgba(180,140,255,0.06)" />
      <rect x="345" y="29" width="62" height="20" rx="1" fill="rgba(180,140,255,0.04)" />
      <circle cx="340" cy="40" r="65" fill="url(#skylightMoonArt)" />
      <circle cx="340" cy="38" r="16" fill="#d0c8ff" opacity="0.6" />
      <circle cx="348" cy="35" r="13" fill="#0c0a18" opacity="0.55" />
      <rect x="0" y="0" width="210" height="365" fill="#0e0c18" />
      <rect x="15" y="20" width="185" height="270" rx="2" fill="#0c0a16" />
      <rect x="15" y="20" width="185" height="270" rx="2" fill="none" stroke="#1e1c30" strokeWidth="0.7" />
      <rect x="18" y="23" width="179" height="80" rx="1" fill="#0b0914" />
      <circle cx="165" cy="48" r="16" fill="#c8c0e8" opacity="0.45" />
      <circle cx="172" cy="44" r="13" fill="#0b0914" opacity="0.6" />
      <polygon points="18,103 60,58 102,103" fill="#0f0d18" />
      <polygon points="60,103 108,48 155,103" fill="#120f20" />
      <polygon points="115,103 162,65 197,103" fill="#0f0d18" />
      <rect x="18" y="100" width="179" height="60" rx="0" fill="#0c0a14" />
      <line x1="30" y1="110" x2="80" y2="108" stroke="#120f20" strokeWidth="2.5" opacity="0.5" />
      <line x1="90" y1="112" x2="145" y2="110" stroke="#120f20" strokeWidth="2.5" opacity="0.45" />
      <line x1="155" y1="108" x2="195" y2="112" stroke="#120f20" strokeWidth="2.5" opacity="0.5" />
      <path d="M 45 88 Q 55 82 65 88 Q 55 92 45 88 Z" fill="rgba(160,140,255,0.22)" />
      <path d="M 100 80 Q 112 74 122 80 Q 112 85 100 80 Z" fill="rgba(160,140,255,0.18)" />
      <path d="M 160 92 Q 170 86 180 92 Q 170 96 160 92 Z" fill="rgba(160,140,255,0.2)" />
      <rect x="18" y="160" width="179" height="126" rx="0" fill="#0d0b18" opacity="0.6" />
      <line x1="25" y1="175" x2="90" y2="168" stroke="#19162a" strokeWidth="1" opacity="0.4" />
      <line x1="80" y1="185" x2="160" y2="178" stroke="#19162a" strokeWidth="1" opacity="0.35" />
      <line x1="30" y1="198" x2="100" y2="194" stroke="#19162a" strokeWidth="0.8" opacity="0.3" />
      <line x1="110" y1="192" x2="196" y2="188" stroke="#19162a" strokeWidth="0.8" opacity="0.3" />
      <rect x="55" y="195" width="6" height="50" rx="1" fill="#110e20" opacity="0.5" />
      <polygon points="58,195 38,225 78,225" fill="#110e20" opacity="0.4" />
      <line x1="18" y1="160" x2="197" y2="160" stroke="rgba(160,140,255,0.18)" strokeWidth="1.5" strokeDasharray="4,3" />
      <rect x="18" y="284" width="20" height="5" rx="1" fill="rgba(160,140,255,0.3)" />
      <rect x="42" y="284" width="20" height="5" rx="1" fill="rgba(180,140,255,0.25)" />
      <rect x="66" y="284" width="20" height="5" rx="1" fill="rgba(100,180,255,0.2)" />
      <rect x="90" y="284" width="20" height="5" rx="1" fill="rgba(255,160,80,0.2)" />
      <rect x="460" y="20" width="210" height="200" rx="2" fill="#0f0d18" />
      <rect x="460" y="20" width="210" height="200" rx="2" fill="none" stroke="#1e1c2e" strokeWidth="0.7" />
      <rect x="462" y="22" width="206" height="196" rx="1" fill="#0e0c1a" opacity="0.5" />
      <rect x="470" y="30" width="55" height="42" rx="1" fill="#0c0a16" stroke="#1e1c2e" strokeWidth="0.5" transform="rotate(-3,497,51)" />
      <rect x="472" y="32" width="51" height="38" rx="0.5" fill="#0b0914" transform="rotate(-3,497,51)" />
      <polygon points="480,62 497,44 514,62" fill="#110e20" opacity="0.5" transform="rotate(-3,497,51)" />
      <circle cx="497" cy="32" r="2.5" fill="rgba(160,140,255,0.4)" />
      <rect x="534" y="26" width="48" height="55" rx="1" fill="#0c0a16" stroke="#1e1c2e" strokeWidth="0.5" transform="rotate(4,558,53)" />
      <rect x="536" y="28" width="44" height="51" rx="0.5" fill="#0b0914" transform="rotate(4,558,53)" />
      <circle cx="552" cy="50" r="12" fill="#100d20" opacity="0.5" transform="rotate(4,558,53)" />
      <circle cx="558" cy="47" r="10" fill="#0b0914" opacity="0.6" transform="rotate(4,558,53)" />
      <circle cx="558" cy="29" r="2.5" fill="rgba(180,140,255,0.4)" />
      <rect x="465" y="84" width="70" height="45" rx="1" fill="#0c0a16" stroke="#1e1c2e" strokeWidth="0.5" transform="rotate(2,500,106)" />
      <rect x="467" y="86" width="66" height="41" rx="0.5" fill="#0b0914" transform="rotate(2,500,106)" />
      <rect x="467" y="100" width="66" height="12" rx="0" fill="#0e0c18" opacity="0.5" transform="rotate(2,500,106)" />
      <circle cx="470" cy="86" r="2.5" fill="rgba(160,140,255,0.35)" />
      <rect x="544" y="90" width="44" height="44" rx="1" fill="#0c0a16" stroke="#1e1c2e" strokeWidth="0.5" transform="rotate(-2,566,112)" />
      <rect x="546" y="92" width="40" height="40" rx="0.5" fill="#0b0914" transform="rotate(-2,566,112)" />
      <line x1="550" y1="98" x2="582" y2="128" stroke="#1b1828" strokeWidth="1.5" opacity="0.5" transform="rotate(-2,566,112)" />
      <line x1="558" y1="96" x2="574" y2="130" stroke="#1e1c30" strokeWidth="1" opacity="0.4" transform="rotate(-2,566,112)" />
      <circle cx="545" cy="91" r="2" fill="rgba(180,140,255,0.4)" />
      <rect x="472" y="142" width="36" height="36" rx="1" fill="#0c0a16" stroke="#1e1c2e" strokeWidth="0.5" transform="rotate(5,490,160)" />
      <rect x="474" y="144" width="32" height="32" rx="0.5" fill="#0b0914" transform="rotate(5,490,160)" />
      <circle cx="473" cy="143" r="2" fill="rgba(160,140,255,0.35)" />
      <rect x="518" y="145" width="38" height="32" rx="1" fill="#110e20" stroke="#1d1a2c" strokeWidth="0.4" transform="rotate(-4,537,161)" />
      <line x1="522" y1="155" x2="552" y2="153" stroke="#1d1a2c" strokeWidth="0.8" opacity="0.4" transform="rotate(-4,537,161)" />
      <line x1="522" y1="162" x2="548" y2="160" stroke="#1d1a2c" strokeWidth="0.8" opacity="0.35" transform="rotate(-4,537,161)" />
      <line x1="522" y1="169" x2="545" y2="167" stroke="#1d1a2c" strokeWidth="0.8" opacity="0.3" transform="rotate(-4,537,161)" />
      <rect x="560" y="150" width="32" height="32" rx="1" fill="#12101e" stroke="#1e1c30" strokeWidth="0.4" transform="rotate(3,576,166)" />
      <line x1="564" y1="160" x2="588" y2="158" stroke="#1e1c30" strokeWidth="0.8" opacity="0.4" transform="rotate(3,576,166)" />
      <line x1="564" y1="167" x2="586" y2="165" stroke="#1e1c30" strokeWidth="0.8" opacity="0.35" transform="rotate(3,576,166)" />
      <line x1="497" y1="32" x2="558" y2="29" stroke="#191628" strokeWidth="0.7" opacity="0.35" />
      <line x1="558" y1="29" x2="545" y2="91" stroke="#191628" strokeWidth="0.7" opacity="0.3" />
      <line x1="470" y1="86" x2="473" y2="143" stroke="#191628" strokeWidth="0.7" opacity="0.3" />
      <rect x="200" y="300" width="440" height="65" rx="3" fill="#0f0d18" />
      <rect x="200" y="300" width="440" height="65" rx="3" fill="none" stroke="#1e1c2e" strokeWidth="0.7" />
      <rect x="208" y="362" width="10" height="40" rx="2" fill="#0e0c18" />
      <rect x="622" y="362" width="10" height="40" rx="2" fill="#0e0c18" />
      <rect x="280" y="248" width="140" height="90" rx="3" fill="#0c0a16" />
      <rect x="280" y="248" width="140" height="90" rx="3" fill="none" stroke="#1e1c2e" strokeWidth="0.7" />
      <rect x="284" y="252" width="132" height="82" rx="1" fill="#0a0814" />
      <rect x="284" y="252" width="132" height="82" fill="url(#monitorGlowArt)" opacity="0.5" />
      <rect x="284" y="252" width="132" height="10" rx="1" fill="#0e0c18" />
      <rect x="287" y="255" width="8" height="4" rx="0.5" fill="#1b1828" opacity="0.7" />
      <rect x="298" y="255" width="8" height="4" rx="0.5" fill="#1b1828" opacity="0.7" />
      <rect x="309" y="255" width="8" height="4" rx="0.5" fill="#1b1828" opacity="0.7" />
      <rect x="294" y="265" width="78" height="66" rx="1" fill="#0e0c1a" />
      <polygon points="304,322 318,292 332,322" fill="#16122a" opacity="0.5" />
      <circle cx="348" cy="300" r="8" fill="#16122a" opacity="0.4" />
      <rect x="294" y="318" width="78" height="8" rx="0" fill="#131020" opacity="0.3" />
      <rect x="374" y="265" width="38" height="66" rx="1" fill="#0e0c18" />
      <rect x="377" y="268" width="32" height="4" rx="0.5" fill="#1b1828" opacity="0.4" />
      <rect x="377" y="275" width="32" height="4" rx="0.5" fill="#1b1828" opacity="0.4" />
      <rect x="377" y="282" width="32" height="4" rx="0.5" fill="rgba(160,140,255,0.15)" />
      <rect x="377" y="289" width="32" height="4" rx="0.5" fill="#1b1828" opacity="0.35" />
      <rect x="377" y="296" width="32" height="4" rx="0.5" fill="#1b1828" opacity="0.3" />
      <rect x="344" y="338" width="12" height="12" rx="1" fill="#0e0c18" />
      <rect x="334" y="348" width="32" height="5" rx="1" fill="#0e0c18" />
      <ellipse cx="350" cy="302" rx="80" ry="12" fill="rgba(160,140,255,0.04)" />
      <ellipse cx="218" cy="305" rx="80" ry="55" fill="url(#lampConeArt)" />
      <rect x="218" y="358" width="36" height="5" rx="2" fill="#0f0d18" stroke="#1b1828" strokeWidth="0.5" />
      <rect x="233" y="305" width="6" height="55" rx="2" fill="#0f0d18" />
      <path d="M 236 305 Q 246 278 258 268 Q 270 258 278 260" fill="none" stroke="#0f0d18" strokeWidth="7" strokeLinecap="round" />
      <path d="M 236 305 Q 246 278 258 268 Q 270 258 278 260" fill="none" stroke="#14121e" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 260 248 L 298 248 L 292 262 L 266 262 Z" fill="#131020" />
      <path d="M 260 248 L 298 248 L 292 262 L 266 262 Z" fill="none" stroke="#1e1c2e" strokeWidth="0.6" />
      <ellipse cx="279" cy="262" rx="14" ry="4" fill="rgba(180,140,255,0.28)" />
      <rect x="420" y="296" width="120" height="80" rx="3" fill="#0c0a16" stroke="#1e1c2e" strokeWidth="0.6" />
      <rect x="424" y="300" width="112" height="72" rx="1" fill="#0a0814" />
      <path d="M 435 355 Q 450 325 465 340 Q 480 355 495 330 Q 510 308 525 325" fill="none" stroke="rgba(160,140,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="445" cy="312" r="8" fill="none" stroke="rgba(180,140,255,0.2)" strokeWidth="1" />
      <rect x="544" y="295" width="4" height="52" rx="2" fill="#100e18" stroke="#1b1828" strokeWidth="0.4" transform="rotate(12,546,321)" />
      <circle cx="542" cy="346" r="1.5" fill="rgba(160,140,255,0.3)" transform="rotate(12,546,321)" />
      <rect x="215" y="302" width="3" height="42" rx="1" fill="#100e18" transform="rotate(-15,216,323)" />
      <rect x="225" y="300" width="3" height="45" rx="1" fill="#100e18" transform="rotate(-8,226,322)" />
      <rect x="233" y="298" width="3" height="42" rx="1" fill="#100e18" transform="rotate(5,234,319)" />
      <rect x="215" y="298" width="3" height="6" rx="0.5" fill="rgba(160,140,255,0.25)" transform="rotate(-15,216,323)" />
      <rect x="225" y="296" width="3" height="6" rx="0.5" fill="rgba(180,140,255,0.25)" transform="rotate(-8,226,322)" />
      <rect x="233" y="294" width="3" height="6" rx="0.5" fill="rgba(100,160,255,0.2)" transform="rotate(5,234,319)" />
      <rect x="598" y="294" width="26" height="30" rx="3" fill="#0f0d18" stroke="#1b1828" strokeWidth="0.5" />
      <path d="M 624 302 Q 632 304 632 310 Q 632 316 624 318" fill="none" stroke="#1b1828" strokeWidth="1.5" />
      <ellipse cx="611" cy="294" rx="13" ry="4" fill="#100e18" />
      <path d="M 605 290 Q 602 283 605 277" fill="none" stroke="#1b1828" strokeWidth="0.8" opacity="0.4" />
      <path d="M 614 289 Q 617 282 614 276" fill="none" stroke="#1b1828" strokeWidth="0.8" opacity="0.4" />
    </svg>
  )
}
