import { useTwinkle } from './useTwinkle'

export default function BusinessScene({ fit = 'meet' } = {}) {
  const starsRef = useTwinkle()
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio={`xMidYMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bizSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1a14" /><stop offset="100%" stopColor="#141e18" />
        </linearGradient>
        <radialGradient id="cityGlow" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="#1a4030" stopOpacity="0.6" /><stop offset="100%" stopColor="#0e1a14" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="160" fill="url(#bizSky)" />
      <rect width="600" height="160" fill="url(#cityGlow)" />
      <g ref={starsRef}>
        <circle data-star cx="45" cy="18" r="1.2" fill="#50dc8c" opacity="0.35" />
        <circle data-star cx="110" cy="8" r="1" fill="#fff" opacity="0.2" />
        <circle data-star cx="200" cy="22" r="1.3" fill="#50dc8c" opacity="0.3" />
        <circle data-star cx="400" cy="14" r="1" fill="#fff" opacity="0.2" />
        <circle data-star cx="500" cy="20" r="1.2" fill="#50dc8c" opacity="0.35" />
        <circle data-star cx="555" cy="10" r="1" fill="#fff" opacity="0.2" />
        <circle data-star cx="330" cy="30" r="1" fill="#50dc8c" opacity="0.25" />
        <circle data-star cx="70" cy="40" r="1" fill="#50dc8c" opacity="0.2" />
      </g>
      <rect x="0" y="100" width="600" height="60" fill="#0a1410" />
      <rect x="30" y="78" width="30" height="52" fill="#0e1a14" />
      <rect x="35" y="72" width="20" height="8" fill="#0e1a14" />
      <rect x="80" y="60" width="45" height="70" fill="#0e1a14" />
      <rect x="88" y="52" width="30" height="10" fill="#0e1a14" />
      <rect x="140" y="82" width="35" height="48" fill="#0e1a14" />
      <rect x="190" y="70" width="25" height="60" fill="#0e1a14" />
      <rect x="430" y="65" width="50" height="65" fill="#0e1a14" />
      <rect x="438" y="56" width="34" height="12" fill="#0e1a14" />
      <rect x="495" y="75" width="40" height="55" fill="#0e1a14" />
      <rect x="548" y="82" width="35" height="48" fill="#0e1a14" />
      <g fill="#50dc8c" opacity="0.35">
        <rect x="37" y="80" width="5" height="5" rx="1" /><rect x="47" y="80" width="5" height="5" rx="1" />
        <rect x="37" y="90" width="5" height="5" rx="1" />
        <rect x="84" y="64" width="6" height="5" rx="1" /><rect x="94" y="64" width="6" height="5" rx="1" /><rect x="104" y="64" width="6" height="5" rx="1" />
        <rect x="84" y="74" width="6" height="5" rx="1" /><rect x="104" y="74" width="6" height="5" rx="1" />
        <rect x="84" y="84" width="6" height="5" rx="1" /><rect x="94" y="84" width="6" height="5" rx="1" />
        <rect x="435" y="68" width="7" height="6" rx="1" /><rect x="447" y="68" width="7" height="6" rx="1" /><rect x="459" y="68" width="7" height="6" rx="1" />
        <rect x="435" y="80" width="7" height="6" rx="1" /><rect x="459" y="80" width="7" height="6" rx="1" />
        <rect x="447" y="92" width="7" height="6" rx="1" />
        <rect x="500" y="80" width="6" height="5" rx="1" /><rect x="510" y="80" width="6" height="5" rx="1" />
        <rect x="500" y="90" width="6" height="5" rx="1" /><rect x="520" y="90" width="6" height="5" rx="1" />
      </g>
      <rect x="248" y="50" width="104" height="110" fill="#142018" />
      <rect x="256" y="42" width="88" height="12" rx="2" fill="#1a2820" />
      <rect x="272" y="34" width="56" height="12" rx="2" fill="#1e3020" />
      <g fill="#50dc8c" opacity="0.55">
        <rect x="258" y="56" width="10" height="9" rx="1" /><rect x="274" y="56" width="10" height="9" rx="1" /><rect x="290" y="56" width="10" height="9" rx="1" /><rect x="306" y="56" width="10" height="9" rx="1" /><rect x="322" y="56" width="10" height="9" rx="1" />
        <rect x="258" y="70" width="10" height="9" rx="1" /><rect x="274" y="70" width="10" height="9" rx="1" /><rect x="306" y="70" width="10" height="9" rx="1" /><rect x="322" y="70" width="10" height="9" rx="1" />
        <rect x="258" y="84" width="10" height="9" rx="1" /><rect x="290" y="84" width="10" height="9" rx="1" /><rect x="322" y="84" width="10" height="9" rx="1" />
        <rect x="274" y="98" width="10" height="9" rx="1" /><rect x="306" y="98" width="10" height="9" rx="1" />
      </g>
      <rect x="286" y="128" width="28" height="32" rx="2" fill="#0e1a14" />
      <rect x="264" y="38" width="72" height="8" rx="2" fill="#50dc8c" opacity="0.2" />
      <ellipse cx="300" cy="42" rx="36" ry="6" fill="#50dc8c" opacity="0.08" />
      <ellipse cx="300" cy="155" rx="80" ry="10" fill="#50dc8c" opacity="0.08" />
      <rect x="299" y="28" width="2" height="8" fill="#1e3020" />
      <circle cx="300" cy="27" r="3" fill="#50dc8c" opacity="0.6" />
    </svg>
  )
}
