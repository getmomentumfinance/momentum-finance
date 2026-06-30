import { useTwinkle } from './useTwinkle'

export default function CarScene({ fit = 'meet', align = 'Mid' } = {}) {
  const starsRef = useTwinkle()

  return (
    <svg width="100%" height="100%" viewBox="0 0 680 420" preserveAspectRatio={`x${align}YMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="beam1Car" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#ffe8b8" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffbe50" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonHaloCar" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d4edda" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#d4edda" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="roadGlow2Car" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#ffbe50" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#ffbe50" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={starsRef}>
        <circle data-star cx="48" cy="22" r="1.2" fill="#e8f4e8" opacity="0.55" />
        <circle data-star cx="102" cy="12" r="1" fill="#e8f4e8" opacity="0.45" />
        <circle data-star cx="165" cy="38" r="1.2" fill="#e8f4e8" opacity="0.38" />
        <circle data-star cx="228" cy="10" r="0.8" fill="#e8f4e8" opacity="0.5" />
        <circle data-star cx="298" cy="30" r="1" fill="#e8f4e8" opacity="0.35" />
        <circle data-star cx="375" cy="16" r="1.2" fill="#e8f4e8" opacity="0.48" />
        <circle data-star cx="448" cy="8" r="1" fill="#e8f4e8" opacity="0.42" />
        <circle data-star cx="522" cy="28" r="1.2" fill="#e8f4e8" opacity="0.38" />
        <circle data-star cx="590" cy="14" r="0.8" fill="#e8f4e8" opacity="0.52" />
        <circle data-star cx="648" cy="42" r="1" fill="#e8f4e8" opacity="0.32" />
        <circle data-star cx="82" cy="58" r="0.8" fill="#e8f4e8" opacity="0.28" />
        <circle data-star cx="340" cy="24" r="0.8" fill="#e8f4e8" opacity="0.32" />
        <circle data-star cx="575" cy="52" r="1" fill="#e8f4e8" opacity="0.22" />
      </g>
      <circle cx="580" cy="72" r="50" fill="url(#moonHaloCar)" />
      <circle cx="580" cy="72" r="24" fill="#d4edda" opacity="0.9" />
      <circle cx="593" cy="67" r="19" fill="#16120c" opacity="0.54" />
      <polygon points="0,260 60,185 130,230 200,165 280,215 360,148 440,200 510,158 580,195 640,160 680,180 680,310 0,310" fill="#120f0a" />
      <polygon points="0,290 40,235 110,270 180,218 260,252 340,195 420,238 490,200 560,230 620,205 680,220 680,310 0,310" fill="#16120c" />
      <polygon points="0,310 30,268 80,295 145,255 210,285 290,248 360,272 430,250 500,268 560,252 620,260 680,248 680,310" fill="#1a160e" />
      <polygon points="200,165 212,178 190,182" fill="#3a2c10" opacity="0.6" />
      <polygon points="360,148 373,163 350,166" fill="#3a2c10" opacity="0.6" />
      <polygon points="510,158 522,172 500,175" fill="#3a2c10" opacity="0.55" />
      <polygon points="640,160 652,173 630,176" fill="#3a2c10" opacity="0.5" />
      <rect x="0" y="210" width="38" height="210" fill="#15110b" />
      <rect x="0" y="210" width="38" height="210" fill="none" stroke="#201c16" strokeWidth="0.5" />
      <line x1="12" y1="230" x2="22" y2="258" stroke="#1a150d" strokeWidth="1" opacity="0.5" />
      <line x1="8" y1="270" x2="28" y2="295" stroke="#1a150d" strokeWidth="1" opacity="0.4" />
      <line x1="18" y1="310" x2="6" y2="340" stroke="#1a150d" strokeWidth="0.8" opacity="0.35" />
      <rect x="0" y="310" width="680" height="110" fill="#18140d" />
      <rect x="38" y="308" width="642" height="8" fill="#1e1911" opacity="0.9" />
      <path d="M 580 308 Q 520 308 460 316 Q 380 326 310 330" fill="none" stroke="#1c170f" strokeWidth="28" />
      <path d="M 580 308 Q 520 308 460 316 Q 380 326 310 330" fill="none" stroke="#1e1911" strokeWidth="24" />
      <path d="M 310 330 Q 250 336 200 350 Q 150 362 100 380" fill="none" stroke="#1e1911" strokeWidth="55" />
      <rect x="38" y="310" width="642" height="110" fill="#18140d" />
      <rect x="38" y="308" width="642" height="3" fill="#16120c" />
      <ellipse cx="250" cy="350" rx="220" ry="30" fill="url(#roadGlow2Car)" />
      <rect x="500" y="318" width="35" height="2" rx="1" fill="#3a2c10" opacity="0.6" />
      <rect x="558" y="316" width="38" height="2" rx="1" fill="#3a2c10" opacity="0.6" />
      <rect x="620" y="314" width="42" height="2.5" rx="1" fill="#3a2c10" opacity="0.6" />
      <rect x="440" y="321" width="32" height="2" rx="1" fill="#3a2c10" opacity="0.5" />
      <rect x="380" y="325" width="28" height="2.5" rx="1" fill="#3a2c10" opacity="0.5" />
      <rect x="630" y="308" width="50" height="4" fill="#282116" stroke="#4a3a14" strokeWidth="0.5" />
      <rect x="636" y="298" width="4" height="14" rx="1" fill="#282116" stroke="#4a3a14" strokeWidth="0.4" />
      <rect x="650" y="298" width="4" height="14" rx="1" fill="#282116" stroke="#4a3a14" strokeWidth="0.4" />
      <rect x="664" y="298" width="4" height="14" rx="1" fill="#282116" stroke="#4a3a14" strokeWidth="0.4" />
      <rect x="678" y="298" width="4" height="14" rx="1" fill="#282116" stroke="#4a3a14" strokeWidth="0.4" />
      <rect x="638" y="300" width="5" height="3" rx="0.5" fill="rgba(255,190,80,0.35)" />
      <rect x="652" y="300" width="5" height="3" rx="0.5" fill="rgba(255,190,80,0.28)" />
      <rect x="666" y="300" width="5" height="3" rx="0.5" fill="rgba(255,190,80,0.35)" />
      <rect x="38" y="305" width="80" height="4" fill="#282116" stroke="#4a3a14" strokeWidth="0.5" />
      <rect x="40" y="295" width="4" height="14" rx="1" fill="#282116" stroke="#4a3a14" strokeWidth="0.4" />
      <rect x="54" y="295" width="4" height="14" rx="1" fill="#282116" stroke="#4a3a14" strokeWidth="0.4" />
      <rect x="68" y="295" width="4" height="14" rx="1" fill="#282116" stroke="#4a3a14" strokeWidth="0.4" />
      <rect x="82" y="295" width="4" height="14" rx="1" fill="#282116" stroke="#4a3a14" strokeWidth="0.4" />
      <rect x="96" y="295" width="4" height="14" rx="1" fill="#282116" stroke="#4a3a14" strokeWidth="0.4" />
      <rect x="42" y="297" width="5" height="3" rx="0.5" fill="rgba(255,190,80,0.3)" />
      <rect x="56" y="297" width="5" height="3" rx="0.5" fill="rgba(255,190,80,0.22)" />
      <rect x="70" y="297" width="5" height="3" rx="0.5" fill="rgba(255,190,80,0.3)" />
      <rect x="84" y="297" width="5" height="3" rx="0.5" fill="rgba(255,190,80,0.22)" />
      <polygon points="118,296 -10,340 -10,360 118,316" fill="url(#beam1Car)" opacity="0.7" />
      <polygon points="118,296 -10,370 -10,390 118,326" fill="url(#beam1Car)" opacity="0.4" />
      <ellipse cx="240" cy="375" rx="145" ry="10" fill="#000" opacity="0.35" />
      <circle cx="148" cy="360" r="28" fill="#0c0b08" />
      <circle cx="148" cy="360" r="28" fill="none" stroke="#2a2318" strokeWidth="1.5" />
      <circle cx="148" cy="360" r="20" fill="#100e0a" />
      <circle cx="148" cy="360" r="12" fill="#201c14" stroke="#4a3a14" strokeWidth="1" />
      <circle cx="148" cy="360" r="5" fill="#3a2c10" />
      <line x1="148" y1="340" x2="148" y2="350" stroke="#4a3a14" strokeWidth="2" />
      <line x1="148" y1="370" x2="148" y2="380" stroke="#4a3a14" strokeWidth="2" />
      <line x1="128" y1="360" x2="138" y2="360" stroke="#4a3a14" strokeWidth="2" />
      <line x1="158" y1="360" x2="168" y2="360" stroke="#4a3a14" strokeWidth="2" />
      <line x1="134" y1="346" x2="141" y2="353" stroke="#4a3a14" strokeWidth="1.5" />
      <line x1="155" y1="367" x2="162" y2="374" stroke="#4a3a14" strokeWidth="1.5" />
      <line x1="134" y1="374" x2="141" y2="367" stroke="#4a3a14" strokeWidth="1.5" />
      <line x1="155" y1="353" x2="162" y2="346" stroke="#4a3a14" strokeWidth="1.5" />
      <circle cx="148" cy="360" r="20" fill="none" stroke="rgba(255,190,80,0.1)" strokeWidth="1" />
      <circle cx="340" cy="360" r="28" fill="#0c0b08" />
      <circle cx="340" cy="360" r="28" fill="none" stroke="#2a2318" strokeWidth="1.5" />
      <circle cx="340" cy="360" r="20" fill="#100e0a" />
      <circle cx="340" cy="360" r="12" fill="#201c14" stroke="#4a3a14" strokeWidth="1" />
      <circle cx="340" cy="360" r="5" fill="#3a2c10" />
      <line x1="340" y1="340" x2="340" y2="350" stroke="#4a3a14" strokeWidth="2" />
      <line x1="340" y1="370" x2="340" y2="380" stroke="#4a3a14" strokeWidth="2" />
      <line x1="320" y1="360" x2="330" y2="360" stroke="#4a3a14" strokeWidth="2" />
      <line x1="350" y1="360" x2="360" y2="360" stroke="#4a3a14" strokeWidth="2" />
      <line x1="326" y1="346" x2="333" y2="353" stroke="#4a3a14" strokeWidth="1.5" />
      <line x1="347" y1="367" x2="354" y2="374" stroke="#4a3a14" strokeWidth="1.5" />
      <line x1="326" y1="374" x2="333" y2="367" stroke="#4a3a14" strokeWidth="1.5" />
      <line x1="347" y1="353" x2="354" y2="346" stroke="#4a3a14" strokeWidth="1.5" />
      <circle cx="340" cy="360" r="20" fill="none" stroke="rgba(255,190,80,0.1)" strokeWidth="1" />
      <rect x="106" y="340" width="258" height="18" rx="3" fill="#0e0c09" />
      <rect x="106" y="347" width="258" height="2" rx="1" fill="rgba(255,190,80,0.18)" />
      <rect x="96" y="298" width="278" height="50" rx="5" fill="#1a150d" />
      <rect x="96" y="298" width="278" height="50" rx="5" fill="none" stroke="#3a2c10" strokeWidth="0.8" />
      <path d="M 168 298 Q 188 248 230 238 L 340 238 Q 368 244 385 298 Z" fill="#1e180f" />
      <path d="M 168 298 Q 188 248 230 238 L 340 238 Q 368 244 385 298 Z" fill="none" stroke="#3a2c10" strokeWidth="0.7" />
      <path d="M 174 296 Q 192 252 232 242 L 278 242 L 278 296 Z" fill="#1a140a" />
      <path d="M 174 296 Q 192 252 232 242 L 278 242 L 278 296 Z" fill="none" stroke="#3a2c14" strokeWidth="0.6" />
      <path d="M 180 294 Q 196 256 234 246 L 274 246 L 274 294 Z" fill="rgba(255,190,80,0.06)" />
      <line x1="186" y1="291" x2="245" y2="270" stroke="#3a2c10" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 375 296 Q 358 252 334 242 L 282 242 L 282 296 Z" fill="#1a140a" />
      <path d="M 375 296 Q 358 252 334 242 L 282 242 L 282 296 Z" fill="none" stroke="#3a2c14" strokeWidth="0.6" />
      <path d="M 369 294 Q 354 256 332 246 L 286 246 L 286 294 Z" fill="rgba(255,190,80,0.04)" />
      <line x1="278" y1="238" x2="278" y2="350" stroke="#3a2c10" strokeWidth="0.8" />
      <line x1="282" y1="238" x2="282" y2="350" stroke="#3a2c10" strokeWidth="0.8" />
      <path d="M 96 310 L 74 308 L 74 318 L 96 322 Z" fill="#18140e" stroke="#2c251a" strokeWidth="0.5" />
      <rect x="195" y="314" width="32" height="5" rx="2" fill="#282116" stroke="#4a3a14" strokeWidth="0.5" />
      <rect x="96" y="305" width="26" height="14" rx="2" fill="#1a140a" />
      <rect x="96" y="305" width="26" height="14" rx="2" fill="none" stroke="#4a3a14" strokeWidth="0.5" />
      <rect x="99" y="308" width="20" height="8" rx="1" fill="rgba(255,190,80,0.7)" />
      <circle cx="109" cy="312" r="4" fill="none" stroke="rgba(255,190,80,0.4)" strokeWidth="0.8" />
      <ellipse cx="109" cy="312" rx="7" ry="5" fill="rgba(255,190,80,0.18)" />
      <rect x="96" y="320" width="26" height="3" rx="1" fill="rgba(255,190,80,0.4)" />
      <rect x="348" y="305" width="26" height="10" rx="2" fill="#1a140a" />
      <rect x="351" y="307" width="20" height="6" rx="1" fill="rgba(255,190,80,0.28)" />
      <rect x="348" y="316" width="26" height="2" rx="1" fill="rgba(255,190,80,0.2)" />
      <rect x="96" y="334" width="40" height="14" rx="2" fill="#120f0a" stroke="#2c2518" strokeWidth="0.5" />
      <rect x="100" y="336" width="32" height="2" rx="0.5" fill="#282116" opacity="0.6" />
      <rect x="100" y="340" width="32" height="2" rx="0.5" fill="#282116" opacity="0.6" />
      <rect x="100" y="344" width="32" height="2" rx="0.5" fill="#282116" opacity="0.6" />
      <rect x="148" y="288" width="60" height="10" rx="2" fill="#16120c" stroke="#2c2518" strokeWidth="0.5" />
      <rect x="162" y="290" width="32" height="6" rx="1" fill="#120f0a" opacity="0.7" />
      <line x1="280" y1="238" x2="284" y2="222" stroke="#2c251a" strokeWidth="1" strokeLinecap="round" />
      <polygon points="500,270 490,295 510,295" fill="#120f09" opacity="0.8" />
      <polygon points="500,278 493,295 507,295" fill="#14100a" opacity="0.7" />
      <polygon points="522,262 512,290 532,290" fill="#120f09" opacity="0.8" />
      <polygon points="522,270 515,290 529,290" fill="#14100a" opacity="0.7" />
      <polygon points="545,268 535,293 555,293" fill="#120f09" opacity="0.75" />
      <polygon points="565,272 557,293 573,293" fill="#120f09" opacity="0.7" />
      <polygon points="468,275 460,296 476,296" fill="#120f09" opacity="0.7" />
      <rect x="497" y="295" width="6" height="16" rx="1" fill="#120f09" opacity="0.6" />
      <rect x="519" y="290" width="6" height="16" rx="1" fill="#120f09" opacity="0.6" />
      <rect x="542" y="293" width="6" height="16" rx="1" fill="#120f09" opacity="0.55" />
    </svg>
  )
}
