import { useTwinkle } from './useTwinkle'

export default function HouseScene({ fit = 'meet' } = {}) {
  const starsRef = useTwinkle()

  return (
    <svg width="100%" height="100%" viewBox="0 0 680 420" preserveAspectRatio={`xMidYMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cfe0f5" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#cfe0f5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="groundGlow" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#ff8fb3" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ff8fb3" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Stars */}
      <g ref={starsRef}>
        <circle data-star cx="60" cy="38" r="1.2" fill="#dce8f7" opacity="0.5" />
        <circle data-star cx="120" cy="22" r="1" fill="#dce8f7" opacity="0.4" />
        <circle data-star cx="198" cy="45" r="1.2" fill="#dce8f7" opacity="0.35" />
        <circle data-star cx="260" cy="18" r="1" fill="#dce8f7" opacity="0.5" />
        <circle data-star cx="310" cy="55" r="0.8" fill="#dce8f7" opacity="0.3" />
        <circle data-star cx="420" cy="28" r="1.2" fill="#dce8f7" opacity="0.45" />
        <circle data-star cx="490" cy="14" r="1" fill="#dce8f7" opacity="0.4" />
        <circle data-star cx="555" cy="42" r="1.2" fill="#dce8f7" opacity="0.35" />
        <circle data-star cx="610" cy="20" r="0.8" fill="#dce8f7" opacity="0.5" />
        <circle data-star cx="648" cy="56" r="1" fill="#dce8f7" opacity="0.3" />
        <circle data-star cx="88" cy="70" r="0.8" fill="#dce8f7" opacity="0.25" />
        <circle data-star cx="152" cy="80" r="1" fill="#dce8f7" opacity="0.2" />
        <circle data-star cx="365" cy="35" r="0.8" fill="#dce8f7" opacity="0.3" />
        <circle data-star cx="572" cy="78" r="1" fill="#dce8f7" opacity="0.2" />
      </g>

      {/* Moon glow halo */}
      <circle cx="108" cy="72" r="52" fill="url(#moonGlow)" />
      {/* Moon */}
      <circle cx="108" cy="72" r="22" fill="#d8e6f7" opacity="0.92" />
      {/* Moon crescent shadow */}
      <circle cx="119" cy="68" r="18" fill="#1c2030" opacity="0.55" />

      {/* Distant hills */}
      <ellipse cx="160" cy="310" rx="180" ry="60" fill="#15131f" opacity="0.7" />
      <ellipse cx="530" cy="320" rx="200" ry="55" fill="#15131f" opacity="0.6" />

      {/* Ground */}
      <rect x="0" y="300" width="680" height="120" fill="#11101c" />
      <ellipse cx="340" cy="305" rx="200" ry="30" fill="url(#groundGlow)" />
      <rect x="0" y="298" width="680" height="4" fill="#1a1628" opacity="0.9" />
      <rect x="0" y="295" width="680" height="3" fill="#211b30" opacity="0.6" />

      {/* House shadow */}
      <ellipse cx="340" cy="308" rx="155" ry="12" fill="#000" opacity="0.25" />

      {/* House base body */}
      <rect x="195" y="200" width="290" height="108" rx="2" fill="#16131f" />
      <rect x="195" y="200" width="290" height="108" rx="2" fill="none" stroke="#332a48" strokeWidth="0.8" />

      {/* Roof */}
      <polygon points="170,202 340,118 340,202" fill="#120f1c" />
      <polygon points="170,202 340,118 340,202" fill="none" stroke="#2a2440" strokeWidth="0.8" />
      <polygon points="510,202 340,118 340,202" fill="#0f0c18" />
      <polygon points="510,202 340,118 340,202" fill="none" stroke="#221c34" strokeWidth="0.8" />
      <rect x="333" y="115" width="14" height="8" rx="1" fill="#201a30" stroke="#332a48" strokeWidth="0.5" />

      {/* Chimney */}
      <rect x="420" y="130" width="22" height="52" rx="1" fill="#13101e" stroke="#2a2440" strokeWidth="0.6" />
      <rect x="417" y="127" width="28" height="7" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.5" />
      <circle cx="431" cy="116" r="3.5" fill="#241f38" opacity="0.6" />
      <circle cx="436" cy="106" r="2.8" fill="#241f38" opacity="0.4" />
      <circle cx="429" cy="97" r="2.2" fill="#241f38" opacity="0.25" />

      {/* Fascia board */}
      <rect x="185" y="199" width="310" height="7" rx="1" fill="#110e1c" stroke="#2a2440" strokeWidth="0.5" />

      {/* Left window */}
      <rect x="220" y="222" width="54" height="42" rx="2" fill="#0e0c1a" />
      <rect x="220" y="222" width="54" height="42" rx="2" fill="none" stroke="#352d4a" strokeWidth="0.7" />
      <rect x="224" y="226" width="22" height="34" rx="1" fill="rgba(255,143,200,0.28)" />
      <rect x="248" y="226" width="22" height="34" rx="1" fill="rgba(255,143,200,0.38)" />
      <rect x="220" y="241" width="54" height="2" fill="#201a30" opacity="0.8" />
      <rect x="245" y="222" width="2" height="42" fill="#201a30" opacity="0.8" />
      <rect x="217" y="264" width="60" height="5" rx="1" fill="#1a1628" stroke="#352d4a" strokeWidth="0.4" />

      {/* Right window */}
      <rect x="406" y="222" width="54" height="42" rx="2" fill="#0e0c1a" />
      <rect x="406" y="222" width="54" height="42" rx="2" fill="none" stroke="#352d4a" strokeWidth="0.7" />
      <rect x="410" y="226" width="22" height="34" rx="1" fill="rgba(255,143,200,0.22)" />
      <rect x="434" y="226" width="22" height="34" rx="1" fill="rgba(255,143,200,0.35)" />
      <rect x="406" y="241" width="54" height="2" fill="#201a30" opacity="0.8" />
      <rect x="431" y="222" width="2" height="42" fill="#201a30" opacity="0.8" />
      <rect x="403" y="264" width="60" height="5" rx="1" fill="#1a1628" stroke="#352d4a" strokeWidth="0.4" />

      {/* Attic window */}
      <rect x="316" y="152" width="48" height="32" rx="2" fill="#0e0c1a" />
      <rect x="316" y="152" width="48" height="32" rx="2" fill="none" stroke="#352d4a" strokeWidth="0.6" />
      <rect x="319" y="155" width="19" height="25" rx="1" fill="rgba(255,143,200,0.45)" />
      <rect x="340" y="155" width="20" height="25" rx="1" fill="rgba(255,143,200,0.3)" />
      <rect x="316" y="167" width="48" height="2" fill="#201a30" opacity="0.7" />
      <rect x="338" y="152" width="2" height="32" fill="#201a30" opacity="0.7" />

      {/* Door */}
      <rect x="304" y="248" width="72" height="60" rx="2" fill="#0e0c1a" />
      <rect x="304" y="248" width="72" height="60" rx="2" fill="none" stroke="#352d4a" strokeWidth="0.7" />
      <path d="M 304 262 Q 340 240 376 262" fill="#130f1e" stroke="#352d4a" strokeWidth="0.7" />
      <rect x="308" y="264" width="30" height="20" rx="1" fill="#120e1e" stroke="#251f38" strokeWidth="0.4" />
      <rect x="342" y="264" width="30" height="20" rx="1" fill="#120e1e" stroke="#251f38" strokeWidth="0.4" />
      <rect x="308" y="287" width="30" height="18" rx="1" fill="#120e1e" stroke="#251f38" strokeWidth="0.4" />
      <rect x="342" y="287" width="30" height="18" rx="1" fill="#120e1e" stroke="#251f38" strokeWidth="0.4" />
      <circle cx="368" cy="278" r="3.5" fill="#352d4a" stroke="#ff9ec4" strokeWidth="0.5" opacity="0.8" />
      <path d="M 304 262 Q 340 240 376 262 L 376 248 L 304 248 Z" fill="rgba(255,143,200,0.18)" />
      <rect x="296" y="308" width="88" height="6" rx="1" fill="#1a1628" stroke="#352d4a" strokeWidth="0.5" />

      {/* Path / walkway */}
      <rect x="320" y="313" width="40" height="8" rx="1" fill="#1a1628" opacity="0.9" />
      <rect x="316" y="320" width="48" height="8" rx="1" fill="#13101e" opacity="0.9" />
      <rect x="312" y="327" width="56" height="8" rx="1" fill="#1a1628" opacity="0.8" />
      <rect x="308" y="334" width="64" height="9" rx="1" fill="#13101e" opacity="0.8" />
      <rect x="304" y="342" width="72" height="9" rx="1" fill="#1a1628" opacity="0.7" />
      <rect x="300" y="350" width="80" height="9" rx="1" fill="#13101e" opacity="0.7" />
      <rect x="296" y="358" width="88" height="10" rx="1" fill="#1a1628" opacity="0.6" />
      <rect x="292" y="367" width="96" height="10" rx="1" fill="#13101e" opacity="0.5" />
      <rect x="288" y="376" width="104" height="10" rx="1" fill="#1a1628" opacity="0.4" />
      <line x1="340" y1="313" x2="340" y2="388" stroke="#120f1c" strokeWidth="1" opacity="0.5" />

      {/* Left fence */}
      <rect x="185" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="197" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="209" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="221" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="233" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="245" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="257" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="269" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="281" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="293" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="183" y="278" width="117" height="3" rx="1" fill="#201a30" stroke="#332a48" strokeWidth="0.3" />
      <rect x="183" y="292" width="117" height="3" rx="1" fill="#201a30" stroke="#332a48" strokeWidth="0.3" />

      {/* Right fence */}
      <rect x="390" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="402" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="414" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="426" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="438" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="450" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="462" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="474" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="486" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="498" y="270" width="5" height="32" rx="1" fill="#1a1628" stroke="#332a48" strokeWidth="0.4" />
      <rect x="388" y="278" width="117" height="3" rx="1" fill="#201a30" stroke="#332a48" strokeWidth="0.3" />
      <rect x="388" y="292" width="117" height="3" rx="1" fill="#201a30" stroke="#332a48" strokeWidth="0.3" />

      {/* Left tree */}
      <rect x="143" y="230" width="10" height="70" rx="2" fill="#13101e" />
      <rect x="141" y="295" width="14" height="8" rx="1" fill="#13101e" />
      <polygon points="148,148 110,230 186,230" fill="#110e1c" />
      <polygon points="148,148 110,230 186,230" fill="none" stroke="#201a30" strokeWidth="0.5" />
      <polygon points="148,168 116,240 180,240" fill="#140f20" />
      <polygon points="148,188 121,246 175,246" fill="#161224" />

      {/* Right tree */}
      <rect x="527" y="240" width="10" height="60" rx="2" fill="#13101e" />
      <rect x="525" y="296" width="14" height="8" rx="1" fill="#13101e" />
      <polygon points="532,158 494,240 570,240" fill="#110e1c" />
      <polygon points="532,158 494,240 570,240" fill="none" stroke="#201a30" strokeWidth="0.5" />
      <polygon points="532,178 500,248 564,248" fill="#140f20" />
      <polygon points="532,198 505,252 559,252" fill="#161224" />

      {/* Bushes */}
      <ellipse cx="208" cy="300" rx="20" ry="12" fill="#110e1c" />
      <ellipse cx="230" cy="303" rx="14" ry="9" fill="#140f20" />
      <ellipse cx="218" cy="296" rx="12" ry="8" fill="#161224" />
      <ellipse cx="472" cy="300" rx="20" ry="12" fill="#110e1c" />
      <ellipse cx="450" cy="303" rx="14" ry="9" fill="#140f20" />
      <ellipse cx="462" cy="296" rx="12" ry="8" fill="#161224" />

      {/* Mailbox */}
      <rect x="276" y="285" width="16" height="12" rx="2" fill="#13101e" stroke="#352d4a" strokeWidth="0.6" />
      <rect x="276" y="282" width="16" height="5" rx="2" fill="#110e1c" stroke="#352d4a" strokeWidth="0.5" />
      <rect x="280" y="289" width="8" height="5" rx="0.5" fill="rgba(255,143,200,0.2)" />
      <rect x="283" y="297" width="3" height="10" rx="1" fill="#13101e" stroke="#352d4a" strokeWidth="0.4" />

      {/* Porch light */}
      <rect x="335" y="243" width="10" height="7" rx="1" fill="#1a1628" stroke="#352d4a" strokeWidth="0.5" />
      <ellipse cx="340" cy="252" rx="5" ry="3" fill="rgba(255,143,200,0.5)" />
      <polygon points="335,252 320,275 360,275 345,252" fill="rgba(255,143,200,0.04)" />

      {/* Key symbol */}
      <g opacity="0.45">
        <circle cx="591" cy="110" r="9" fill="none" stroke="#7ec4ff" strokeWidth="1.5" />
        <circle cx="591" cy="110" r="5" fill="none" stroke="#7ec4ff" strokeWidth="1" />
        <rect x="598" y="108" width="16" height="3" rx="1" fill="#7ec4ff" />
        <rect x="609" y="111" width="3" height="5" rx="0.5" fill="#7ec4ff" />
        <rect x="603" y="111" width="3" height="4" rx="0.5" fill="#7ec4ff" />
      </g>

      {/* Window ground glow */}
      <ellipse cx="247" cy="303" rx="28" ry="6" fill="rgba(255,143,200,0.04)" />
      <ellipse cx="433" cy="303" rx="28" ry="6" fill="rgba(255,143,200,0.04)" />
    </svg>
  )
}
