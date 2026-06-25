import { useTwinkle } from './useTwinkle'

export default function WeddingScene({ fit = 'meet' } = {}) {
  const starsRef = useTwinkle()
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio={`xMidYMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wedSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0e18" /><stop offset="100%" stopColor="#2a1a28" />
        </linearGradient>
        <radialGradient id="wedMoon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3a2035" /><stop offset="100%" stopColor="#2a1428" />
        </radialGradient>
      </defs>
      <rect width="600" height="160" fill="url(#wedSky)" />
      <circle cx="300" cy="38" r="26" fill="url(#wedMoon)" />
      <circle cx="308" cy="32" r="20" fill="#2e1a2c" />
      <g ref={starsRef}>
        <circle data-star cx="60" cy="20" r="1.2" fill="#ffa0b4" opacity="0.45" />
        <circle data-star cx="130" cy="12" r="1" fill="#fff" opacity="0.3" />
        <circle data-star cx="200" cy="28" r="1.3" fill="#ffa0b4" opacity="0.4" />
        <circle data-star cx="420" cy="15" r="1" fill="#fff" opacity="0.3" />
        <circle data-star cx="480" cy="26" r="1.2" fill="#ffa0b4" opacity="0.4" />
        <circle data-star cx="550" cy="10" r="1" fill="#fff" opacity="0.25" />
        <circle data-star cx="90" cy="44" r="1" fill="#ffa0b4" opacity="0.3" />
        <circle data-star cx="510" cy="40" r="1" fill="#ffa0b4" opacity="0.3" />
      </g>
      <path d="M20 55 Q100 62 180 55 Q260 48 340 55 Q420 62 500 55 Q550 51 580 55" fill="none" stroke="#5a3040" strokeWidth="1.2" />
      <g fill="#ffdc80" opacity="0.75">
        <ellipse cx="20" cy="57" rx="3" ry="4" /><ellipse cx="60" cy="61" rx="3" ry="4" /><ellipse cx="100" cy="63" rx="3" ry="4" />
        <ellipse cx="140" cy="60" rx="3" ry="4" /><ellipse cx="180" cy="56" rx="3" ry="4" /><ellipse cx="220" cy="53" rx="3" ry="4" />
        <ellipse cx="260" cy="51" rx="3" ry="4" /><ellipse cx="300" cy="53" rx="3" ry="4" /><ellipse cx="340" cy="56" rx="3" ry="4" />
        <ellipse cx="380" cy="61" rx="3" ry="4" /><ellipse cx="420" cy="63" rx="3" ry="4" /><ellipse cx="460" cy="60" rx="3" ry="4" />
        <ellipse cx="500" cy="56" rx="3" ry="4" /><ellipse cx="540" cy="53" rx="3" ry="4" /><ellipse cx="580" cy="56" rx="3" ry="4" />
      </g>
      <g opacity="0.18">
        <ellipse cx="60" cy="66" rx="8" ry="4" fill="#ffdc80" /><ellipse cx="140" cy="64" rx="8" ry="4" fill="#ffdc80" />
        <ellipse cx="220" cy="57" rx="8" ry="4" fill="#ffdc80" /><ellipse cx="300" cy="57" rx="8" ry="4" fill="#ffdc80" />
        <ellipse cx="380" cy="65" rx="8" ry="4" fill="#ffdc80" /><ellipse cx="460" cy="64" rx="8" ry="4" fill="#ffdc80" />
        <ellipse cx="540" cy="57" rx="8" ry="4" fill="#ffdc80" />
      </g>
      <rect x="0" y="132" width="600" height="28" fill="#1a1020" />
      <rect x="220" y="105" width="160" height="8" rx="3" fill="#2e1e2c" />
      <rect x="240" y="113" width="6" height="20" rx="2" fill="#261826" />
      <rect x="354" y="113" width="6" height="20" rx="2" fill="#261826" />
      <rect x="278" y="82" width="44" height="23" rx="3" fill="#3a2038" />
      <rect x="284" y="72" width="32" height="12" rx="3" fill="#422438" />
      <rect x="291" y="65" width="18" height="8" rx="2" fill="#4a2840" />
      <rect x="296" y="58" width="3" height="8" rx="1" fill="#5a3450" />
      <rect x="301" y="59" width="3" height="7" rx="1" fill="#5a3450" />
      <ellipse cx="297" cy="57" rx="2" ry="3" fill="#ffbe50" opacity="0.8" />
      <ellipse cx="302" cy="58" rx="2" ry="3" fill="#ffbe50" opacity="0.8" />
      <path d="M278 88 Q300 84 322 88" fill="none" stroke="#ffa0b4" strokeWidth="1" opacity="0.6" />
      <path d="M284 96 Q300 92 316 96" fill="none" stroke="#ffa0b4" strokeWidth="1" opacity="0.5" />
      <circle cx="170" cy="105" r="14" fill="#2a1828" /><circle cx="162" cy="99" r="6" fill="#3a2035" /><circle cx="178" cy="99" r="6" fill="#3a2035" /><circle cx="170" cy="112" r="6" fill="#3a2035" /><circle cx="162" cy="111" r="5" fill="#3a2035" /><circle cx="178" cy="111" r="5" fill="#3a2035" /><circle cx="170" cy="104" r="5" fill="#ffa0b4" opacity="0.7" />
      <circle cx="430" cy="105" r="14" fill="#2a1828" /><circle cx="422" cy="99" r="6" fill="#3a2035" /><circle cx="438" cy="99" r="6" fill="#3a2035" /><circle cx="430" cy="112" r="6" fill="#3a2035" /><circle cx="422" cy="111" r="5" fill="#3a2035" /><circle cx="438" cy="111" r="5" fill="#3a2035" /><circle cx="430" cy="104" r="5" fill="#ffa0b4" opacity="0.6" />
      <circle cx="88" cy="118" r="10" fill="none" stroke="#c8906a" strokeWidth="2.5" />
      <circle cx="98" cy="118" r="10" fill="none" stroke="#e8b888" strokeWidth="2.5" />
      <polygon points="93,110 98,114 93,122 88,114" fill="#d4eeff" opacity="0.6" />
    </svg>
  )
}
