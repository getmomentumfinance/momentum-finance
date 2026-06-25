import { useTwinkle } from './useTwinkle'

export default function ArtScene({ fit = 'meet' } = {}) {
  const starsRef = useTwinkle()
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio={`xMidYMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="artSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10101e" /><stop offset="100%" stopColor="#161628" />
        </linearGradient>
        <radialGradient id="deskGlow" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#2a1e50" stopOpacity="0.4" /><stop offset="100%" stopColor="#10101e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="160" fill="url(#artSky)" />
      <rect width="600" height="160" fill="url(#deskGlow)" />
      <g ref={starsRef}>
        <circle data-star cx="45" cy="16" r="1.2" fill="#a08cff" opacity="0.4" />
        <circle data-star cx="115" cy="8" r="1" fill="#fff" opacity="0.25" />
        <circle data-star cx="190" cy="24" r="1.3" fill="#a08cff" opacity="0.35" />
        <circle data-star cx="400" cy="12" r="1" fill="#fff" opacity="0.2" />
        <circle data-star cx="500" cy="20" r="1.2" fill="#a08cff" opacity="0.4" />
        <circle data-star cx="558" cy="10" r="1" fill="#fff" opacity="0.2" />
        <circle data-star cx="330" cy="30" r="1" fill="#a08cff" opacity="0.3" />
        <circle data-star cx="72" cy="40" r="1" fill="#a08cff" opacity="0.2" />
      </g>
      <rect x="0" y="130" width="600" height="30" fill="#0c0c18" />
      <rect x="80" y="108" width="440" height="24" rx="3" fill="#18162a" />
      <rect x="100" y="130" width="8" height="20" rx="2" fill="#141228" />
      <rect x="490" y="130" width="8" height="20" rx="2" fill="#141228" />
      <rect x="256" y="44" width="88" height="66" rx="2" fill="#1e1c32" />
      <rect x="260" y="48" width="80" height="58" rx="1" fill="#1a183a" />
      <ellipse cx="285" cy="68" rx="14" ry="18" fill="#a08cff" opacity="0.35" />
      <ellipse cx="310" cy="72" rx="12" ry="16" fill="#ffa0b4" opacity="0.3" />
      <ellipse cx="298" cy="60" rx="10" ry="12" fill="#64b4ff" opacity="0.3" />
      <path d="M268 92 Q285 82 300 88 Q315 78 332 90" fill="none" stroke="#ffd250" strokeWidth="1.5" opacity="0.4" />
      <line x1="258" y1="110" x2="240" y2="150" stroke="#1e1c32" strokeWidth="3" strokeLinecap="round" />
      <line x1="342" y1="110" x2="360" y2="150" stroke="#1e1c32" strokeWidth="3" strokeLinecap="round" />
      <line x1="270" y1="110" x2="300" y2="150" stroke="#1e1c32" strokeWidth="2" strokeLinecap="round" />
      <rect x="430" y="68" width="3" height="42" fill="#1e1c32" />
      <path d="M433 68 Q450 60 455 75" fill="none" stroke="#1e1c32" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="458" cy="77" rx="12" ry="7" fill="#2a2848" />
      <ellipse cx="458" cy="84" rx="16" ry="8" fill="#a08cff" opacity="0.12" />
      <ellipse cx="180" cy="112" rx="28" ry="18" fill="#1e1c32" />
      <circle cx="162" cy="108" r="5" fill="#a08cff" opacity="0.6" />
      <circle cx="175" cy="103" r="5" fill="#ffa0b4" opacity="0.6" />
      <circle cx="190" cy="103" r="5" fill="#ffd250" opacity="0.6" />
      <circle cx="200" cy="110" r="5" fill="#50dc8c" opacity="0.55" />
      <circle cx="194" cy="120" r="5" fill="#64b4ff" opacity="0.55" />
      <circle cx="168" cy="120" r="4" fill="#ffb464" opacity="0.5" />
      <rect x="126" y="95" width="3" height="22" rx="1" fill="#2a2848" transform="rotate(-15,127,106)" />
      <rect x="134" y="93" width="3" height="22" rx="1" fill="#2a2848" transform="rotate(-8,135,104)" />
      <rect x="142" y="92" width="3" height="22" rx="1" fill="#2a2848" />
      <ellipse cx="124" cy="93" rx="3" ry="2" fill="#a08cff" opacity="0.5" transform="rotate(-15,124,93)" />
      <ellipse cx="133" cy="92" rx="3" ry="2" fill="#ffa0b4" opacity="0.5" transform="rotate(-8,133,92)" />
      <ellipse cx="142" cy="91" rx="3" ry="2" fill="#ffd250" opacity="0.5" />
      <rect x="360" y="104" width="60" height="6" rx="2" fill="#1e1c32" />
      <rect x="362" y="84" width="56" height="22" rx="2" fill="#221e36" />
      <line x1="390" y1="86" x2="390" y2="104" stroke="#2a2848" strokeWidth="1" />
      <path d="M367 90 Q375 88 380 92" fill="none" stroke="#a08cff" strokeWidth="1" opacity="0.5" />
      <path d="M367 95 Q376 93 382 97" fill="none" stroke="#a08cff" strokeWidth="1" opacity="0.4" />
      <ellipse cx="200" cy="109" rx="4" ry="2" fill="#a08cff" opacity="0.2" />
      <ellipse cx="215" cy="111" rx="3" ry="2" fill="#ffa0b4" opacity="0.2" />
      <ellipse cx="230" cy="110" rx="3" ry="1.5" fill="#ffd250" opacity="0.2" />
    </svg>
  )
}
