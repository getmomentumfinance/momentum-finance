import { useTwinkle } from './useTwinkle'

export default function VacationScene({ fit = 'meet', align = 'Mid' } = {}) {
  const starsRef = useTwinkle()

  return (
    <svg width="100%" height="100%" viewBox="0 0 680 420" preserveAspectRatio={`x${align}YMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moonpathVac" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#c8e0ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c8e0ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="torchGlowLVac" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb040" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffb040" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="torchGlowRVac" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb040" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#ffb040" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonHaloVVac" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d4edda" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#d4edda" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="underwaterGlowVac" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#1a4a3a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0a1818" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={starsRef}>
        <circle data-star cx="42" cy="20" r="1.2" fill="#d4f0e8" opacity="0.55" />
        <circle data-star cx="98" cy="10" r="1" fill="#d4f0e8" opacity="0.45" />
        <circle data-star cx="162" cy="34" r="1.2" fill="#d4f0e8" opacity="0.38" />
        <circle data-star cx="225" cy="8" r="0.8" fill="#d4f0e8" opacity="0.52" />
        <circle data-star cx="296" cy="28" r="1" fill="#d4f0e8" opacity="0.38" />
        <circle data-star cx="368" cy="14" r="1.2" fill="#d4f0e8" opacity="0.5" />
        <circle data-star cx="442" cy="6" r="1" fill="#d4f0e8" opacity="0.44" />
        <circle data-star cx="516" cy="24" r="1.2" fill="#d4f0e8" opacity="0.38" />
        <circle data-star cx="584" cy="10" r="0.8" fill="#d4f0e8" opacity="0.55" />
        <circle data-star cx="645" cy="38" r="1" fill="#d4f0e8" opacity="0.34" />
        <circle data-star cx="78" cy="56" r="0.8" fill="#d4f0e8" opacity="0.28" />
        <circle data-star cx="335" cy="22" r="0.8" fill="#d4f0e8" opacity="0.35" />
        <circle data-star cx="570" cy="48" r="0.8" fill="#d4f0e8" opacity="0.25" />
      </g>
      <circle cx="116" cy="72" r="50" fill="url(#moonHaloVVac)" />
      <circle cx="116" cy="72" r="25" fill="#d4edda" opacity="0.88" />
      <circle cx="128" cy="67" r="20" fill="#0a1118" opacity="0.52" />
      <ellipse cx="620" cy="200" rx="80" ry="30" fill="#090e12" opacity="0.8" />
      <ellipse cx="620" cy="195" rx="65" ry="24" fill="#0a0f14" opacity="0.7" />
      <path d="M 618 195 Q 620 170 622 158" stroke="#090e12" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 622 158 Q 600 145 585 152 Q 604 150 614 160 Z" fill="#090e12" />
      <path d="M 622 158 Q 645 142 658 150 Q 638 148 628 158 Z" fill="#090e12" />
      <path d="M 622 158 Q 620 136 625 124 Q 623 142 626 154 Z" fill="#090e12" />
      <ellipse cx="62" cy="210" rx="55" ry="18" fill="#090e12" opacity="0.7" />
      <path d="M 60 210 Q 62 188 64 178" stroke="#090e12" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 64 178 Q 48 167 36 172 Q 52 170 58 178 Z" fill="#090e12" />
      <path d="M 64 178 Q 80 165 90 170 Q 74 168 66 178 Z" fill="#090e12" />
      <rect x="0" y="180" width="680" height="240" fill="#090e12" />
      <ellipse cx="340" cy="260" rx="200" ry="22" fill="url(#moonpathVac)" />
      <ellipse cx="290" cy="295" rx="140" ry="14" fill="url(#moonpathVac)" opacity="0.6" />
      <ellipse cx="310" cy="325" rx="80" ry="8" fill="url(#moonpathVac)" opacity="0.35" />
      <line x1="180" y1="210" x2="240" y2="212" stroke="#1a3028" strokeWidth="1" opacity="0.5" />
      <line x1="420" y1="215" x2="490" y2="213" stroke="#1a3028" strokeWidth="1" opacity="0.5" />
      <line x1="80" y1="228" x2="155" y2="226" stroke="#1a3028" strokeWidth="0.8" opacity="0.4" />
      <line x1="520" y1="224" x2="600" y2="222" stroke="#1a3028" strokeWidth="0.8" opacity="0.4" />
      <line x1="140" y1="244" x2="200" y2="242" stroke="#1a3028" strokeWidth="0.8" opacity="0.35" />
      <line x1="460" y1="240" x2="530" y2="238" stroke="#1a3028" strokeWidth="0.8" opacity="0.35" />
      <line x1="50" y1="260" x2="120" y2="258" stroke="#1a3028" strokeWidth="0.7" opacity="0.3" />
      <line x1="560" y1="256" x2="635" y2="254" stroke="#1a3028" strokeWidth="0.7" opacity="0.3" />
      <rect x="88" y="380" width="504" height="40" fill="url(#underwaterGlowVac)" />
      <ellipse cx="185" cy="398" rx="18" ry="7" fill="#0e1b28" opacity="0.7" />
      <polygon points="185,398 168,392 168,404" fill="#0d1924" opacity="0.6" />
      <circle cx="196" cy="395" r="2" fill="#1a3a2a" opacity="0.7" />
      <ellipse cx="360" cy="405" rx="22" ry="8" fill="#0e1b28" opacity="0.65" />
      <polygon points="360,405 340,398 340,412" fill="#0d1924" opacity="0.55" />
      <circle cx="374" cy="402" r="2.5" fill="#1a3a2a" opacity="0.65" />
      <ellipse cx="500" cy="395" rx="14" ry="5" fill="#0e1b28" opacity="0.6" />
      <polygon points="500,395 516,390 516,400" fill="#0d1924" opacity="0.5" />
      <circle cx="490" cy="393" r="1.5" fill="#1a3a2a" opacity="0.6" />
      <path d="M 140 420 Q 138 408 135 400 Q 142 408 140 420 Z" fill="#0d1720" opacity="0.5" />
      <path d="M 145 420 Q 148 406 152 396 Q 148 408 149 420 Z" fill="#0d1720" opacity="0.45" />
      <path d="M 540 420 Q 538 408 536 400 Q 543 408 540 420 Z" fill="#0d1720" opacity="0.5" />
      <path d="M 547 420 Q 550 406 554 396 Q 550 408 551 420 Z" fill="#0d1720" opacity="0.45" />
      <rect x="148" y="310" width="10" height="110" rx="2" fill="#0c1116" stroke="#161b20" strokeWidth="0.5" />
      <rect x="225" y="318" width="10" height="102" rx="2" fill="#0c1116" stroke="#161b20" strokeWidth="0.5" />
      <rect x="340" y="322" width="10" height="98" rx="2" fill="#0c1116" stroke="#161b20" strokeWidth="0.5" />
      <rect x="450" y="318" width="10" height="102" rx="2" fill="#0c1116" stroke="#161b20" strokeWidth="0.5" />
      <rect x="528" y="310" width="10" height="110" rx="2" fill="#0c1116" stroke="#161b20" strokeWidth="0.5" />
      <rect x="149" y="355" width="6" height="30" rx="1" fill="#11181e" opacity="0.3" />
      <rect x="226" y="355" width="6" height="28" rx="1" fill="#11181e" opacity="0.3" />
      <rect x="341" y="355" width="6" height="28" rx="1" fill="#11181e" opacity="0.3" />
      <rect x="451" y="355" width="6" height="28" rx="1" fill="#11181e" opacity="0.3" />
      <rect x="529" y="355" width="6" height="30" rx="1" fill="#11181e" opacity="0.3" />
      <rect x="128" y="270" width="424" height="50" rx="3" fill="#0e151c" />
      <rect x="128" y="270" width="424" height="50" rx="3" fill="none" stroke="#1a3050" strokeWidth="0.8" />
      <rect x="128" y="280" width="424" height="2" rx="0.5" fill="#11181e" opacity="0.6" />
      <rect x="128" y="290" width="424" height="2" rx="0.5" fill="#11181e" opacity="0.5" />
      <rect x="128" y="300" width="424" height="2" rx="0.5" fill="#11181e" opacity="0.55" />
      <rect x="128" y="310" width="424" height="2" rx="0.5" fill="#11181e" opacity="0.5" />
      <rect x="128" y="318" width="424" height="4" rx="1" fill="#0a0e12" opacity="0.7" />
      <ellipse cx="340" cy="278" rx="90" ry="8" fill="#000" opacity="0.2" />
      <rect x="254" y="162" width="172" height="112" rx="3" fill="#0d141a" />
      <rect x="254" y="162" width="172" height="112" rx="3" fill="none" stroke="#1a3050" strokeWidth="0.8" />
      <polygon points="238,168 340,118 442,168" fill="#0b1116" />
      <polygon points="238,168 340,118 442,168" fill="none" stroke="#182028" strokeWidth="0.7" />
      <line x1="260" y1="165" x2="340" y2="132" stroke="#11181e" strokeWidth="2" opacity="0.5" />
      <line x1="285" y1="163" x2="340" y2="136" stroke="#11181e" strokeWidth="2" opacity="0.45" />
      <line x1="310" y1="160" x2="340" y2="138" stroke="#11181e" strokeWidth="2" opacity="0.4" />
      <line x1="418" y1="165" x2="340" y2="132" stroke="#11181e" strokeWidth="2" opacity="0.5" />
      <line x1="393" y1="163" x2="340" y2="136" stroke="#11181e" strokeWidth="2" opacity="0.45" />
      <line x1="368" y1="160" x2="340" y2="138" stroke="#11181e" strokeWidth="2" opacity="0.4" />
      <rect x="334" y="114" width="12" height="8" rx="1" fill="#141a20" stroke="#2a4050" strokeWidth="0.5" />
      <rect x="264" y="178" width="42" height="36" rx="2" fill="#0a121a" />
      <rect x="264" y="178" width="42" height="36" rx="2" fill="none" stroke="#2a5070" strokeWidth="0.6" />
      <rect x="267" y="181" width="17" height="29" rx="1" fill="rgba(100,180,255,0.32)" />
      <rect x="287" y="181" width="16" height="29" rx="1" fill="rgba(100,180,255,0.22)" />
      <rect x="264" y="196" width="42" height="2" fill="#1a242d" opacity="0.7" />
      <rect x="284" y="178" width="2" height="36" fill="#1a242d" opacity="0.7" />
      <rect x="261" y="214" width="48" height="4" rx="1" fill="#141a20" />
      <rect x="374" y="178" width="42" height="36" rx="2" fill="#0a121a" />
      <rect x="374" y="178" width="42" height="36" rx="2" fill="none" stroke="#2a5070" strokeWidth="0.6" />
      <rect x="377" y="181" width="17" height="29" rx="1" fill="rgba(100,180,255,0.28)" />
      <rect x="397" y="181" width="16" height="29" rx="1" fill="rgba(100,180,255,0.38)" />
      <rect x="374" y="196" width="42" height="2" fill="#1a242d" opacity="0.7" />
      <rect x="394" y="178" width="2" height="36" fill="#1a242d" opacity="0.7" />
      <rect x="371" y="214" width="48" height="4" rx="1" fill="#141a20" />
      <rect x="316" y="220" width="48" height="54" rx="2" fill="#0a121a" />
      <rect x="316" y="220" width="48" height="54" rx="2" fill="none" stroke="#2a5070" strokeWidth="0.6" />
      <path d="M 316 234 Q 340 215 364 234" fill="rgba(100,180,255,0.12)" />
      <rect x="320" y="236" width="19" height="18" rx="1" fill="#0d151d" />
      <rect x="342" y="236" width="19" height="18" rx="1" fill="#0d151d" />
      <rect x="320" y="257" width="19" height="14" rx="1" fill="#0d151d" />
      <rect x="342" y="257" width="19" height="14" rx="1" fill="#0d151d" />
      <circle cx="355" cy="247" r="2.5" fill="#2a5070" stroke="#64b4ff" strokeWidth="0.4" opacity="0.7" />
      <rect x="310" y="272" width="60" height="4" rx="1" fill="#141a20" />
      <rect x="335" y="216" width="10" height="6" rx="1" fill="#141a20" />
      <ellipse cx="340" cy="223" rx="4" ry="3" fill="rgba(100,180,255,0.45)" />
      <rect x="178" y="200" width="6" height="74" rx="2" fill="#0c1014" />
      <ellipse cx="181" cy="190" rx="80" ry="60" fill="url(#torchGlowLVac)" />
      <rect x="174" y="186" width="14" height="16" rx="2" fill="#11181e" stroke="#1a3050" strokeWidth="0.6" />
      <rect x="176" y="184" width="10" height="5" rx="1" fill="#141a20" />
      <path d="M 181 186 Q 177 174 181 165 Q 184 174 185 186 Z" fill="#14212e" opacity="0.7" />
      <path d="M 181 186 Q 179 178 181 172 Q 183 178 183 186 Z" fill="rgba(100,180,255,0.35)" />
      <ellipse cx="181" cy="175" rx="4" ry="8" fill="rgba(255,160,50,0.15)" />
      <rect x="500" y="200" width="6" height="74" rx="2" fill="#0c1014" />
      <ellipse cx="503" cy="190" rx="80" ry="60" fill="url(#torchGlowRVac)" />
      <rect x="496" y="186" width="14" height="16" rx="2" fill="#11181e" stroke="#1a3050" strokeWidth="0.6" />
      <rect x="498" y="184" width="10" height="5" rx="1" fill="#141a20" />
      <path d="M 503 186 Q 499 174 503 165 Q 506 174 507 186 Z" fill="#14212e" opacity="0.7" />
      <path d="M 503 186 Q 501 178 503 172 Q 505 178 505 186 Z" fill="rgba(100,180,255,0.35)" />
      <ellipse cx="503" cy="175" rx="4" ry="8" fill="rgba(255,160,50,0.15)" />
      <rect x="162" y="258" width="52" height="12" rx="3" fill="#0e151c" stroke="#1a3050" strokeWidth="0.6" />
      <rect x="162" y="258" width="52" height="10" rx="3" fill="#10171e" opacity="0.5" />
      <path d="M 162 268 L 156 258 L 204 258 L 214 268 Z" fill="#0e151c" stroke="#1a3050" strokeWidth="0.5" />
      <rect x="166" y="270" width="4" height="5" rx="1" fill="#0c1014" />
      <rect x="206" y="270" width="4" height="5" rx="1" fill="#0c1014" />
      <rect x="170" y="254" width="38" height="6" rx="1" fill="#0d161e" stroke="#1a232c" strokeWidth="0.3" />
      <rect x="210" y="253" width="8" height="10" rx="2" fill="#0d141a" stroke="#1a232c" strokeWidth="0.4" />
      <ellipse cx="214" cy="253" rx="4" ry="2" fill="rgba(100,180,255,0.2)" />
      <line x1="214" y1="252" x2="218" y2="244" stroke="#1a232c" strokeWidth="0.6" />
      <rect x="466" y="258" width="52" height="12" rx="3" fill="#0e151c" stroke="#1a3050" strokeWidth="0.6" />
      <rect x="466" y="258" width="52" height="10" rx="3" fill="#10171e" opacity="0.5" />
      <path d="M 466 268 L 462 258 L 510 258 L 518 268 Z" fill="#0e151c" stroke="#1a3050" strokeWidth="0.5" />
      <rect x="470" y="270" width="4" height="5" rx="1" fill="#0c1014" />
      <rect x="510" y="270" width="4" height="5" rx="1" fill="#0c1014" />
      <rect x="474" y="254" width="38" height="6" rx="1" fill="#0d161e" stroke="#1a232c" strokeWidth="0.3" />
      <rect x="462" y="253" width="8" height="10" rx="2" fill="#0d141a" stroke="#1a232c" strokeWidth="0.4" />
      <ellipse cx="466" cy="253" rx="4" ry="2" fill="rgba(100,180,255,0.2)" />
      <line x1="466" y1="252" x2="462" y2="244" stroke="#1a232c" strokeWidth="0.6" />
      <circle cx="340" cy="263" r="12" fill="#0d1318" stroke="#1a232c" strokeWidth="0.5" />
      <rect x="338" y="268" width="4" height="8" rx="1" fill="#0c1014" />
      <path d="M 340 255 L 334 249 L 346 249 Z" fill="#0d1720" />
      <rect x="339" y="255" width="2" height="7" rx="0.5" fill="#0d1720" />
      <rect x="334" y="262" width="12" height="2" rx="0.5" fill="#111920" />
      <ellipse cx="340" cy="249" rx="6" ry="2" fill="rgba(100,180,255,0.2)" />
      <line x1="128" y1="278" x2="552" y2="278" stroke="#11181e" strokeWidth="1.5" strokeDasharray="4,6" opacity="0.4" />
    </svg>
  )
}
