import { useTwinkle } from './useTwinkle'

export default function GiftScene({ fit = 'meet', align = 'Mid' } = {}) {
  const starsRef = useTwinkle()

  return (
    <svg width="100%" height="100%" viewBox="0 0 680 420" preserveAspectRatio={`x${align}YMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="fireGlowGift" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#ff9030" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ff9030" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="floorGlowGGift" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="#ffd250" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffd250" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={starsRef}>
        <circle data-star cx="55" cy="28" r="1.2" fill="#e8f4e8" opacity="0.4" />
        <circle data-star cx="122" cy="14" r="1" fill="#e8f4e8" opacity="0.35" />
        <circle data-star cx="570" cy="22" r="1.2" fill="#e8f4e8" opacity="0.4" />
        <circle data-star cx="635" cy="38" r="1" fill="#e8f4e8" opacity="0.35" />
        <circle data-star cx="340" cy="30" r="0.8" fill="#e8f4e8" opacity="0.25" />
      </g>
      <circle cx="580" cy="75" r="44" fill="#19160e" opacity="0" />
      <circle cx="580" cy="75" r="22" fill="#d4edda" opacity="0.78" />
      <circle cx="592" cy="70" r="18" fill="#1a170f" opacity="0.5" />
      <rect x="0" y="360" width="680" height="60" fill="#100f0c" />
      <rect x="0" y="357" width="680" height="5" fill="#181611" opacity="0.8" />
      <path d="M 50 85 Q 170 98 340 90 Q 510 82 630 95" fill="none" stroke="#1e1d18" strokeWidth="1" />
      <circle cx="85" cy="90" r="3.5" fill="rgba(255,210,80,0.5)" />
      <circle cx="135" cy="94" r="3.5" fill="rgba(255,200,80,0.45)" />
      <circle cx="185" cy="96" r="3.5" fill="rgba(255,150,150,0.4)" />
      <circle cx="235" cy="93" r="3.5" fill="rgba(255,210,80,0.5)" />
      <circle cx="285" cy="91" r="3.5" fill="rgba(255,200,80,0.45)" />
      <circle cx="340" cy="90" r="3.5" fill="rgba(255,150,150,0.4)" />
      <circle cx="395" cy="88" r="3.5" fill="rgba(255,210,80,0.5)" />
      <circle cx="445" cy="90" r="3.5" fill="rgba(255,200,80,0.45)" />
      <circle cx="495" cy="87" r="3.5" fill="rgba(255,150,150,0.4)" />
      <circle cx="545" cy="91" r="3.5" fill="rgba(255,210,80,0.5)" />
      <circle cx="595" cy="94" r="3.5" fill="rgba(255,200,80,0.45)" />
      <circle cx="85" cy="93" r="6" fill="rgba(255,210,80,0.07)" />
      <circle cx="235" cy="96" r="6" fill="rgba(255,210,80,0.07)" />
      <circle cx="395" cy="91" r="6" fill="rgba(255,210,80,0.07)" />
      <circle cx="545" cy="94" r="6" fill="rgba(255,210,80,0.07)" />
      <ellipse cx="340" cy="362" rx="160" ry="20" fill="url(#floorGlowGGift)" />
      <ellipse cx="340" cy="340" rx="120" ry="80" fill="url(#fireGlowGift)" />
      <rect x="218" y="175" width="244" height="18" rx="2" fill="#18150e" stroke="#3a2c10" strokeWidth="0.8" />
      <rect x="218" y="193" width="18" height="165" rx="2" fill="#16140d" stroke="#2a261a" strokeWidth="0.6" />
      <rect x="444" y="193" width="18" height="165" rx="2" fill="#16140d" stroke="#2a261a" strokeWidth="0.6" />
      <rect x="236" y="193" width="208" height="165" rx="1" fill="#14120c" />
      <rect x="236" y="193" width="208" height="165" rx="1" fill="none" stroke="#221e14" strokeWidth="0.6" />
      <rect x="255" y="212" width="170" height="138" rx="2" fill="#0e0d09" />
      <rect x="255" y="212" width="170" height="138" rx="2" fill="none" stroke="#1c1910" strokeWidth="0.5" />
      <path d="M 255 260 Q 255 212 340 212 Q 425 212 425 260" fill="#0e0d09" />
      <rect x="278" y="326" width="50" height="10" rx="2" fill="#14120c" transform="rotate(-8,303,331)" />
      <rect x="310" y="320" width="60" height="10" rx="2" fill="#16140d" transform="rotate(5,340,325)" />
      <rect x="345" y="326" width="50" height="10" rx="2" fill="#14120c" transform="rotate(-4,370,331)" />
      <path d="M 295 325 Q 300 295 310 280 Q 315 310 320 325 Z" fill="#2e2816" opacity="0.7" />
      <path d="M 315 325 Q 322 285 335 265 Q 340 295 345 325 Z" fill="#4a3614" opacity="0.8" />
      <path d="M 340 325 Q 348 288 358 272 Q 363 302 368 325 Z" fill="#2e2816" opacity="0.7" />
      <path d="M 308 325 Q 313 300 320 288 Q 324 308 328 325 Z" fill="rgba(255,210,80,0.15)" opacity="0.9" />
      <path d="M 328 325 Q 336 292 342 278 Q 346 305 350 325 Z" fill="rgba(255,210,80,0.2)" opacity="0.9" />
      <ellipse cx="340" cy="332" rx="50" ry="6" fill="rgba(255,210,80,0.08)" />
      <rect x="232" y="162" width="8" height="14" rx="1" fill="#18150d" stroke="#2a2414" strokeWidth="0.4" />
      <rect x="234" y="159" width="4" height="4" rx="0.5" fill="rgba(255,210,80,0.3)" />
      <rect x="248" y="165" width="8" height="11" rx="1" fill="#18150d" stroke="#2a2414" strokeWidth="0.4" />
      <rect x="250" y="163" width="4" height="3" rx="0.5" fill="rgba(255,210,80,0.25)" />
      <circle cx="340" cy="165" r="14" fill="#1c180e" stroke="#3a2c10" strokeWidth="0.7" />
      <circle cx="340" cy="165" r="10" fill="#18150c" stroke="#2a2518" strokeWidth="0.4" />
      <line x1="340" y1="165" x2="340" y2="157" stroke="#4a3a14" strokeWidth="1.2" />
      <line x1="340" y1="165" x2="346" y2="169" stroke="#4a3a14" strokeWidth="1" />
      <path d="M 420 175 Q 416 162 420 158 Q 428 155 432 158 Q 436 162 432 175 Z" fill="#18150d" stroke="#2c271a" strokeWidth="0.5" />
      <rect x="445" y="165" width="8" height="11" rx="1" fill="#18150d" stroke="#2a2414" strokeWidth="0.4" />
      <rect x="447" y="163" width="4" height="3" rx="0.5" fill="rgba(255,210,80,0.25)" />
      <rect x="457" y="162" width="8" height="14" rx="1" fill="#18150d" stroke="#2a2414" strokeWidth="0.4" />
      <rect x="459" y="159" width="4" height="4" rx="0.5" fill="rgba(255,210,80,0.3)" />
      <path d="M 268 193 Q 265 220 270 235 Q 278 248 265 260 Q 252 260 250 248 Q 248 235 258 228 Q 255 215 258 193 Z" fill="#1c180d" stroke="#2c271a" strokeWidth="0.6" />
      <rect x="258" y="218" width="10" height="3" rx="1" fill="#3a2a10" opacity="0.5" />
      <ellipse cx="257" cy="260" rx="14" ry="8" fill="#1c180d" stroke="#2c271a" strokeWidth="0.5" />
      <rect x="256" y="188" width="22" height="8" rx="2" fill="#1e1b11" stroke="#3a2c10" strokeWidth="0.4" />
      <path d="M 428 193 Q 425 220 430 235 Q 438 248 425 260 Q 412 260 410 248 Q 408 235 418 228 Q 415 215 418 193 Z" fill="#1c180d" stroke="#2c271a" strokeWidth="0.6" />
      <rect x="418" y="218" width="10" height="3" rx="1" fill="#3a2a10" opacity="0.5" />
      <ellipse cx="417" cy="260" rx="14" ry="8" fill="#1c180d" stroke="#2c271a" strokeWidth="0.5" />
      <rect x="416" y="188" width="22" height="8" rx="2" fill="#1e1b11" stroke="#3a2c10" strokeWidth="0.4" />
      <rect x="120" y="290" width="80" height="70" rx="3" fill="#1c180e" stroke="#3a2c10" strokeWidth="0.7" />
      <rect x="155" y="290" width="10" height="70" rx="1" fill="#3a2a10" opacity="0.6" />
      <rect x="120" y="320" width="80" height="10" rx="1" fill="#3a2a10" opacity="0.6" />
      <ellipse cx="160" cy="290" rx="14" ry="7" fill="#3a2a10" opacity="0.6" />
      <circle cx="160" cy="287" r="5" fill="rgba(255,210,80,0.2)" />
      <rect x="133" y="258" width="54" height="34" rx="2" fill="#1e1a0f" stroke="#3a2c10" strokeWidth="0.6" />
      <rect x="157" y="258" width="6" height="34" rx="1" fill="#2e2818" opacity="0.5" />
      <rect x="133" y="271" width="54" height="6" rx="1" fill="#2e2818" opacity="0.5" />
      <circle cx="160" cy="258" r="4" fill="rgba(255,210,80,0.15)" />
      <rect x="460" y="300" width="68" height="60" rx="3" fill="#1c180e" stroke="#3a2c10" strokeWidth="0.7" />
      <rect x="491" y="300" width="8" height="60" rx="1" fill="#3a2a10" opacity="0.5" />
      <rect x="460" y="325" width="68" height="8" rx="1" fill="#3a2a10" opacity="0.5" />
      <circle cx="495" cy="299" r="6" fill="rgba(255,210,80,0.18)" />
      <rect x="536" y="280" width="50" height="80" rx="2" fill="#1e1a0f" stroke="#3a2c10" strokeWidth="0.6" />
      <rect x="558" y="280" width="6" height="80" rx="1" fill="#2e2818" opacity="0.5" />
      <rect x="536" y="315" width="50" height="6" rx="1" fill="#2e2818" opacity="0.5" />
      <ellipse cx="561" cy="280" rx="12" ry="5" fill="#3a2a10" opacity="0.5" />
      <circle cx="561" cy="276" r="4" fill="rgba(255,210,80,0.15)" />
      <rect x="195" y="335" width="38" height="30" rx="2" fill="#1c180e" stroke="#3a2c10" strokeWidth="0.5" />
      <rect x="211" y="335" width="6" height="30" rx="1" fill="#2e2818" opacity="0.4" />
      <rect x="195" y="347" width="38" height="5" rx="1" fill="#2e2818" opacity="0.4" />
    </svg>
  )
}
