import { useTwinkle } from './useTwinkle'

export default function BusinessScene({ fit = 'meet', align = 'Mid' } = {}) {
  const starsRef = useTwinkle()

  return (
    <svg width="100%" height="100%" viewBox="0 0 680 420" preserveAspectRatio={`x${align}YMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cityDepthGlowBiz" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="#50dc8c" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#50dc8c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonHaloBBiz" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d4edda" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#d4edda" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rooftopLampBiz" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#50dc8c" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#50dc8c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={starsRef}>
        <circle data-star cx="48" cy="18" r="1.2" fill="#e8f4e8" opacity="0.55" />
        <circle data-star cx="98" cy="8" r="1" fill="#e8f4e8" opacity="0.45" />
        <circle data-star cx="158" cy="30" r="1.2" fill="#e8f4e8" opacity="0.4" />
        <circle data-star cx="220" cy="6" r="0.8" fill="#e8f4e8" opacity="0.52" />
        <circle data-star cx="282" cy="22" r="1" fill="#e8f4e8" opacity="0.38" />
        <circle data-star cx="398" cy="12" r="1.2" fill="#e8f4e8" opacity="0.5" />
        <circle data-star cx="462" cy="4" r="1" fill="#e8f4e8" opacity="0.44" />
        <circle data-star cx="528" cy="20" r="1.2" fill="#e8f4e8" opacity="0.4" />
        <circle data-star cx="592" cy="8" r="0.8" fill="#e8f4e8" opacity="0.54" />
        <circle data-star cx="648" cy="36" r="1" fill="#e8f4e8" opacity="0.34" />
        <circle data-star cx="80" cy="52" r="0.8" fill="#e8f4e8" opacity="0.28" />
        <circle data-star cx="338" cy="16" r="0.8" fill="#e8f4e8" opacity="0.34" />
        <circle data-star cx="570" cy="44" r="0.8" fill="#e8f4e8" opacity="0.25" />
        <circle data-star cx="180" cy="50" r="0.8" fill="#e8f4e8" opacity="0.2" />
        <circle data-star cx="440" cy="36" r="0.8" fill="#e8f4e8" opacity="0.22" />
        <circle data-star cx="562" cy="32" r="1.5" fill="#e8f4e8" opacity="0.25" />
      </g>
      <circle cx="120" cy="68" r="50" fill="url(#moonHaloBBiz)" />
      <circle cx="120" cy="68" r="26" fill="#d4edda" opacity="0.9" />
      <circle cx="133" cy="63" r="21" fill="#0c1a12" opacity="0.54" />
      <ellipse cx="340" cy="185" rx="360" ry="40" fill="rgba(80,220,140,0.06)" />
      <rect x="0" y="155" width="680" height="35" fill="#0a0e0c" opacity="0.3" />
      <rect x="50" y="155" width="8" height="30" fill="#0a140e" opacity="0.7" />
      <rect x="62" y="148" width="10" height="37" fill="#0a140e" opacity="0.7" />
      <rect x="76" y="152" width="7" height="33" fill="#0a140e" opacity="0.65" />
      <rect x="87" y="145" width="12" height="40" fill="#0b1610" opacity="0.7" />
      <rect x="103" y="150" width="8" height="35" fill="#0a140e" opacity="0.65" />
      <rect x="130" y="142" width="14" height="43" fill="#0b1610" opacity="0.7" />
      <rect x="148" y="148" width="10" height="37" fill="#0a140e" opacity="0.65" />
      <rect x="162" y="152" width="8" height="33" fill="#0a140e" opacity="0.6" />
      <rect x="178" y="144" width="14" height="41" fill="#0b1610" opacity="0.7" />
      <rect x="200" y="150" width="10" height="35" fill="#0a140e" opacity="0.65" />
      <rect x="450" y="155" width="8" height="30" fill="#0a140e" opacity="0.65" />
      <rect x="462" y="148" width="10" height="37" fill="#0a140e" opacity="0.7" />
      <rect x="478" y="153" width="7" height="32" fill="#0a140e" opacity="0.6" />
      <rect x="490" y="145" width="12" height="40" fill="#0b1610" opacity="0.7" />
      <rect x="508" y="150" width="8" height="35" fill="#0a140e" opacity="0.65" />
      <rect x="522" y="142" width="14" height="43" fill="#0b1610" opacity="0.7" />
      <rect x="542" y="148" width="10" height="37" fill="#0a140e" opacity="0.65" />
      <rect x="558" y="152" width="8" height="33" fill="#0a140e" opacity="0.6" />
      <rect x="572" y="144" width="14" height="41" fill="#0b1610" opacity="0.7" />
      <rect x="592" y="150" width="10" height="35" fill="#0a140e" opacity="0.65" />
      <rect x="610" y="148" width="8" height="37" fill="#0a140e" opacity="0.6" />
      <rect x="628" y="145" width="14" height="40" fill="#0b1610" opacity="0.7" />
      <rect x="648" y="150" width="10" height="35" fill="#0a140e" opacity="0.65" />
      <rect x="66" y="152" width="3" height="2" fill="rgba(80,220,140,0.25)" />
      <rect x="92" y="150" width="3" height="2" fill="rgba(80,220,140,0.2)" />
      <rect x="135" y="148" width="3" height="2" fill="rgba(80,220,140,0.25)" />
      <rect x="183" y="150" width="3" height="2" fill="rgba(80,220,140,0.2)" />
      <rect x="467" y="153" width="3" height="2" fill="rgba(80,220,140,0.25)" />
      <rect x="495" y="150" width="3" height="2" fill="rgba(80,220,140,0.2)" />
      <rect x="528" y="148" width="3" height="2" fill="rgba(80,220,140,0.25)" />
      <rect x="578" y="150" width="3" height="2" fill="rgba(80,220,140,0.2)" />
      <rect x="0" y="128" width="28" height="62" fill="#0d1a13" />
      <rect x="0" y="128" width="28" height="62" fill="none" stroke="#16201a" strokeWidth="0.4" />
      <rect x="32" y="118" width="36" height="72" fill="#0e1c14" />
      <rect x="32" y="118" width="36" height="72" fill="none" stroke="#16201a" strokeWidth="0.4" />
      <rect x="72" y="132" width="24" height="58" fill="#0d1a13" />
      <rect x="100" y="108" width="44" height="82" fill="#0e1c14" />
      <rect x="100" y="108" width="44" height="82" fill="none" stroke="#16201a" strokeWidth="0.5" />
      <rect x="148" y="122" width="32" height="68" fill="#0d1a13" />
      <rect x="184" y="112" width="40" height="78" fill="#0e1c14" />
      <rect x="184" y="112" width="40" height="78" fill="none" stroke="#16201a" strokeWidth="0.5" />
      <rect x="228" y="128" width="28" height="62" fill="#0d1a13" />
      <rect x="652" y="128" width="28" height="62" fill="#0d1a13" />
      <rect x="612" y="118" width="36" height="72" fill="#0e1c14" />
      <rect x="612" y="118" width="36" height="72" fill="none" stroke="#16201a" strokeWidth="0.4" />
      <rect x="572" y="132" width="36" height="58" fill="#0d1a13" />
      <rect x="536" y="108" width="32" height="82" fill="#0e1c14" />
      <rect x="536" y="108" width="32" height="82" fill="none" stroke="#16201a" strokeWidth="0.5" />
      <rect x="500" y="122" width="32" height="68" fill="#0d1a13" />
      <rect x="456" y="112" width="40" height="78" fill="#0e1c14" />
      <rect x="456" y="112" width="40" height="78" fill="none" stroke="#16201a" strokeWidth="0.5" />
      <rect x="420" y="128" width="32" height="62" fill="#0d1a13" />
      <rect x="38" y="126" width="6" height="5" fill="rgba(80,220,140,0.3)" />
      <rect x="48" y="126" width="6" height="5" fill="rgba(80,220,140,0.22)" />
      <rect x="38" y="136" width="6" height="5" fill="rgba(80,220,140,0.18)" />
      <rect x="48" y="136" width="6" height="5" fill="rgba(80,220,140,0.28)" />
      <rect x="38" y="146" width="6" height="5" fill="rgba(80,220,140,0.22)" />
      <rect x="48" y="146" width="6" height="5" fill="rgba(80,220,140,0.15)" />
      <rect x="108" y="116" width="8" height="6" fill="rgba(80,220,140,0.3)" />
      <rect x="120" y="116" width="8" height="6" fill="rgba(80,220,140,0.2)" />
      <rect x="132" y="116" width="8" height="6" fill="rgba(80,220,140,0.28)" />
      <rect x="108" y="128" width="8" height="6" fill="rgba(80,220,140,0.18)" />
      <rect x="120" y="128" width="8" height="6" fill="rgba(80,220,140,0.32)" />
      <rect x="132" y="128" width="8" height="6" fill="rgba(80,220,140,0.22)" />
      <rect x="190" y="120" width="8" height="6" fill="rgba(80,220,140,0.28)" />
      <rect x="202" y="120" width="8" height="6" fill="rgba(80,220,140,0.2)" />
      <rect x="214" y="120" width="8" height="6" fill="rgba(80,220,140,0.3)" />
      <rect x="190" y="132" width="8" height="6" fill="rgba(80,220,140,0.18)" />
      <rect x="202" y="132" width="8" height="6" fill="rgba(80,220,140,0.25)" />
      <rect x="214" y="132" width="8" height="6" fill="rgba(80,220,140,0.15)" />
      <rect x="620" y="126" width="6" height="5" fill="rgba(80,220,140,0.28)" />
      <rect x="630" y="126" width="6" height="5" fill="rgba(80,220,140,0.2)" />
      <rect x="620" y="136" width="6" height="5" fill="rgba(80,220,140,0.22)" />
      <rect x="630" y="136" width="6" height="5" fill="rgba(80,220,140,0.3)" />
      <rect x="542" y="116" width="8" height="6" fill="rgba(80,220,140,0.28)" />
      <rect x="554" y="116" width="8" height="6" fill="rgba(80,220,140,0.2)" />
      <rect x="542" y="128" width="8" height="6" fill="rgba(80,220,140,0.3)" />
      <rect x="462" y="120" width="8" height="6" fill="rgba(80,220,140,0.25)" />
      <rect x="474" y="120" width="8" height="6" fill="rgba(80,220,140,0.3)" />
      <rect x="462" y="132" width="8" height="6" fill="rgba(80,220,140,0.18)" />
      <rect x="0" y="180" width="680" height="15" fill="url(#cityDepthGlowBiz)" />
      <rect x="0" y="182" width="680" height="110" fill="#0a0e0c" />
      <rect x="0" y="280" width="680" height="140" fill="#0d1611" />
      <rect x="0" y="278" width="680" height="12" rx="0" fill="#0f1c15" />
      <rect x="0" y="278" width="680" height="12" fill="none" stroke="#1e3020" strokeWidth="0.6" />
      <rect x="0" y="290" width="680" height="2" fill="#111e17" opacity="0.5" />
      <rect x="0" y="310" width="680" height="2" fill="#111e17" opacity="0.45" />
      <rect x="0" y="330" width="680" height="2" fill="#111e17" opacity="0.4" />
      <rect x="0" y="350" width="680" height="2" fill="#111e17" opacity="0.35" />
      <line x1="80" y1="290" x2="60" y2="420" stroke="#111e17" strokeWidth="0.7" opacity="0.35" />
      <line x1="200" y1="290" x2="165" y2="420" stroke="#111e17" strokeWidth="0.7" opacity="0.3" />
      <line x1="340" y1="290" x2="300" y2="420" stroke="#111e17" strokeWidth="0.7" opacity="0.35" />
      <line x1="480" y1="290" x2="450" y2="420" stroke="#111e17" strokeWidth="0.7" opacity="0.3" />
      <line x1="600" y1="290" x2="578" y2="420" stroke="#111e17" strokeWidth="0.7" opacity="0.35" />
      <rect x="54" y="280" width="48" height="28" rx="2" fill="#0c140f" stroke="#1a2c22" strokeWidth="0.5" />
      <rect x="58" y="283" width="40" height="8" rx="1" fill="#0e1812" stroke="#1a2c22" strokeWidth="0.3" />
      <rect x="58" y="295" width="8" height="8" rx="1" fill="#0d1611" stroke="#18281f" strokeWidth="0.3" />
      <rect x="70" y="295" width="8" height="8" rx="1" fill="#0d1611" stroke="#18281f" strokeWidth="0.3" />
      <rect x="82" y="295" width="8" height="8" rx="1" fill="#0d1611" stroke="#18281f" strokeWidth="0.3" />
      <circle cx="94" cy="285" r="2" fill="rgba(80,220,140,0.25)" />
      <rect x="578" y="280" width="48" height="28" rx="2" fill="#0c140f" stroke="#1a2c22" strokeWidth="0.5" />
      <rect x="582" y="283" width="40" height="8" rx="1" fill="#0e1812" />
      <circle cx="582" cy="285" r="2" fill="rgba(80,220,140,0.25)" />
      <rect x="118" y="255" width="6" height="68" rx="2" fill="#0c140f" />
      <ellipse cx="121" cy="280" rx="50" ry="40" fill="url(#rooftopLampBiz)" />
      <rect x="110" y="248" width="22" height="10" rx="2" fill="#0e1812" stroke="#1e3020" strokeWidth="0.5" />
      <ellipse cx="121" cy="258" rx="9" ry="4" fill="rgba(80,220,140,0.4)" />
      <circle cx="121" cy="257" r="5" fill="rgba(80,220,140,0.2)" />
      <line x1="488" y1="380" x2="510" y2="298" stroke="#0d1611" strokeWidth="4" strokeLinecap="round" />
      <line x1="488" y1="380" x2="510" y2="298" stroke="#16201a" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="560" y1="380" x2="510" y2="298" stroke="#0d1611" strokeWidth="4" strokeLinecap="round" />
      <line x1="560" y1="380" x2="510" y2="298" stroke="#16201a" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="524" y1="390" x2="510" y2="298" stroke="#0d1611" strokeWidth="4" strokeLinecap="round" />
      <line x1="524" y1="390" x2="510" y2="298" stroke="#16201a" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="494" y1="350" x2="554" y2="350" stroke="#16201a" strokeWidth="2" strokeLinecap="round" />
      <rect x="492" y="262" width="70" height="22" rx="4" fill="#0e1c14" stroke="#2a4030" strokeWidth="0.8" transform="rotate(-18,527,273)" />
      <rect x="499" y="264" width="20" height="18" rx="3" fill="#0d1a13" stroke="#1e3020" strokeWidth="0.5" transform="rotate(-18,509,273)" />
      <rect x="520" y="262" width="16" height="16" rx="2" fill="#0c1811" stroke="#1e3020" strokeWidth="0.5" transform="rotate(-18,528,270)" />
      <rect x="536" y="260" width="24" height="14" rx="2" fill="#0d1a13" stroke="#1e3020" strokeWidth="0.5" transform="rotate(-18,548,267)" />
      <circle cx="489" cy="278" r="6" fill="#0a120d" stroke="#2a4030" strokeWidth="0.7" />
      <circle cx="489" cy="278" r="4" fill="#080e0b" stroke="#1e3020" strokeWidth="0.4" />
      <circle cx="556" cy="256" r="8" fill="#0a120d" stroke="#2a4030" strokeWidth="0.7" />
      <circle cx="556" cy="256" r="5" fill="#080e0b" />
      <ellipse cx="554" cy="254" rx="3" ry="2" fill="rgba(80,220,140,0.2)" />
      <rect x="292" y="318" width="170" height="90" rx="3" fill="#0d1611" />
      <rect x="292" y="318" width="170" height="90" rx="3" fill="none" stroke="#1e3020" strokeWidth="0.7" />
      <rect x="298" y="406" width="8" height="16" rx="2" fill="#0c140f" />
      <rect x="448" y="406" width="8" height="16" rx="2" fill="#0c140f" />
      <rect x="298" y="306" width="148" height="112" rx="2" fill="#0a2013" />
      <rect x="298" y="306" width="148" height="112" rx="2" fill="none" stroke="#1a2c3a" strokeWidth="0.6" />
      <line x1="320" y1="306" x2="320" y2="418" stroke="#1a2c3a" strokeWidth="0.5" opacity="0.5" />
      <line x1="346" y1="306" x2="346" y2="418" stroke="#1a2c3a" strokeWidth="0.5" opacity="0.5" />
      <line x1="372" y1="306" x2="372" y2="418" stroke="#1a2c3a" strokeWidth="0.5" opacity="0.5" />
      <line x1="398" y1="306" x2="398" y2="418" stroke="#1a2c3a" strokeWidth="0.5" opacity="0.5" />
      <line x1="424" y1="306" x2="424" y2="418" stroke="#1a2c3a" strokeWidth="0.5" opacity="0.5" />
      <line x1="298" y1="330" x2="446" y2="330" stroke="#1a2c3a" strokeWidth="0.5" opacity="0.5" />
      <line x1="298" y1="354" x2="446" y2="354" stroke="#1a2c3a" strokeWidth="0.5" opacity="0.5" />
      <line x1="298" y1="378" x2="446" y2="378" stroke="#1a2c3a" strokeWidth="0.5" opacity="0.5" />
      <line x1="298" y1="402" x2="446" y2="402" stroke="#1a2c3a" strokeWidth="0.5" opacity="0.5" />
      <rect x="310" y="316" width="42" height="32" rx="0" fill="none" stroke="rgba(80,220,140,0.35)" strokeWidth="1.2" />
      <line x1="331" y1="316" x2="331" y2="348" stroke="rgba(80,220,140,0.25)" strokeWidth="0.8" />
      <line x1="310" y1="332" x2="352" y2="332" stroke="rgba(80,220,140,0.25)" strokeWidth="0.8" />
      <rect x="364" y="318" width="28" height="50" rx="0" fill="none" stroke="rgba(80,220,140,0.3)" strokeWidth="1" />
      <line x1="364" y1="340" x2="392" y2="340" stroke="rgba(80,220,140,0.2)" strokeWidth="0.7" />
      <line x1="378" y1="318" x2="378" y2="368" stroke="rgba(80,220,140,0.2)" strokeWidth="0.7" />
      <line x1="310" y1="358" x2="352" y2="358" stroke="rgba(80,220,140,0.2)" strokeWidth="0.7" />
      <line x1="310" y1="356" x2="310" y2="360" stroke="rgba(80,220,140,0.2)" strokeWidth="0.7" />
      <line x1="352" y1="356" x2="352" y2="360" stroke="rgba(80,220,140,0.2)" strokeWidth="0.7" />
      <circle cx="416" cy="325" r="2" fill="rgba(80,220,140,0.25)" />
      <circle cx="416" cy="338" r="2" fill="rgba(80,220,140,0.2)" />
      <circle cx="416" cy="351" r="2" fill="rgba(80,220,140,0.25)" />
      <path d="M 446 418 Q 440 410 446 400 Q 452 408 446 418 Z" fill="#0d2819" opacity="0.6" />
      <path d="M 298 418 Q 304 408 298 400 Q 292 410 298 418 Z" fill="#0d2819" opacity="0.5" />
      <ellipse cx="377" cy="306" rx="74" ry="5" fill="#0e2217" stroke="#1a2c3a" strokeWidth="0.5" />
      <ellipse cx="377" cy="302" rx="74" ry="5" fill="#0f2418" stroke="#1a2c3a" strokeWidth="0.4" />
      <ellipse cx="377" cy="298" rx="74" ry="5" fill="#102619" stroke="#1a2c3a" strokeWidth="0.4" />
      <ellipse cx="377" cy="294" rx="72" ry="4" fill="#102619" />
      <line x1="408" y1="388" x2="428" y2="368" stroke="#1a2c22" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="428" y1="368" x2="432" y2="388" stroke="#1a2c22" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="428" cy="368" r="2" fill="rgba(80,220,140,0.3)" />
      <rect x="320" y="272" width="20" height="24" rx="3" fill="#0d1611" stroke="#1e3020" strokeWidth="0.5" />
      <path d="M 340 279 Q 347 281 347 285 Q 347 290 340 292" fill="none" stroke="#1e3020" strokeWidth="1.2" />
      <ellipse cx="330" cy="272" rx="10" ry="3" fill="#0e1812" />
      <ellipse cx="330" cy="272" rx="7" ry="2" fill="rgba(80,220,140,0.15)" />
      <path d="M 326 268 Q 323 261 326 255" fill="none" stroke="#1a2c22" strokeWidth="0.8" opacity="0.4" />
      <path d="M 334 267 Q 337 260 334 254" fill="none" stroke="#1a2c22" strokeWidth="0.8" opacity="0.4" />
      <rect x="220" y="356" width="18" height="28" rx="2" fill="#0a0e0c" />
      <rect x="244" y="356" width="18" height="28" rx="2" fill="#0a0e0c" />
      <ellipse cx="229" cy="384" rx="12" ry="5" fill="#090c0a" />
      <ellipse cx="253" cy="384" rx="12" ry="5" fill="#090c0a" />
      <line x1="400" y1="50" x2="560" y2="32" stroke="#e8f4e8" strokeWidth="0.6" opacity="0.18" />
    </svg>
  )
}
