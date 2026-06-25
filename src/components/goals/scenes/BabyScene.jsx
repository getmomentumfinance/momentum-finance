import { useTwinkle } from './useTwinkle'

export default function BabyScene({ fit = 'meet' } = {}) {
  const starsRef = useTwinkle()
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio={`xMidYMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="babySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14101e" /><stop offset="100%" stopColor="#1e1630" />
        </linearGradient>
      </defs>
      <rect width="600" height="160" fill="url(#babySky)" />
      <circle cx="490" cy="35" r="30" fill="#221840" opacity="0.8" />
      <circle cx="496" cy="30" r="22" fill="#2a1e48" />
      <circle cx="501" cy="26" r="6" fill="#1e1638" opacity="0.5" />
      <g ref={starsRef}>
        <circle data-star cx="50" cy="20" r="1.2" fill="#c8b4ff" opacity="0.4" />
        <circle data-star cx="110" cy="10" r="1" fill="#fff" opacity="0.25" />
        <circle data-star cx="180" cy="30" r="1.3" fill="#c8b4ff" opacity="0.4" />
        <circle data-star cx="260" cy="14" r="1" fill="#fff" opacity="0.25" />
        <circle data-star cx="330" cy="24" r="1.2" fill="#c8b4ff" opacity="0.35" />
        <circle data-star cx="390" cy="8" r="1" fill="#fff" opacity="0.2" />
        <circle data-star cx="560" cy="22" r="1.2" fill="#c8b4ff" opacity="0.35" />
        <circle data-star cx="80" cy="48" r="1" fill="#c8b4ff" opacity="0.25" />
        <circle data-star cx="430" cy="50" r="1" fill="#c8b4ff" opacity="0.25" />
      </g>
      <ellipse cx="120" cy="58" rx="70" ry="22" fill="#1e1838" opacity="0.9" />
      <ellipse cx="90" cy="64" rx="45" ry="18" fill="#221e40" />
      <ellipse cx="148" cy="54" rx="42" ry="18" fill="#221e40" />
      <ellipse cx="420" cy="52" rx="65" ry="20" fill="#1e1838" opacity="0.9" />
      <ellipse cx="392" cy="58" rx="42" ry="16" fill="#221e40" />
      <ellipse cx="448" cy="48" rx="40" ry="16" fill="#221e40" />
      <rect x="0" y="128" width="600" height="32" fill="#14101e" />
      <ellipse cx="300" cy="132" rx="160" ry="10" fill="#1e1838" />
      <ellipse cx="300" cy="132" rx="120" ry="7" fill="#231d42" opacity="0.6" />
      <rect x="220" y="80" width="160" height="52" rx="4" fill="#1e1838" />
      <rect x="228" y="72" width="4" height="60" rx="2" fill="#2a2248" />
      <rect x="368" y="72" width="4" height="60" rx="2" fill="#2a2248" />
      <rect x="220" y="72" width="160" height="8" rx="3" fill="#2e2650" />
      <rect x="244" y="80" width="3" height="50" rx="1" fill="#261e44" opacity="0.8" />
      <rect x="262" y="80" width="3" height="50" rx="1" fill="#261e44" opacity="0.8" />
      <rect x="280" y="80" width="3" height="50" rx="1" fill="#261e44" opacity="0.8" />
      <rect x="314" y="80" width="3" height="50" rx="1" fill="#261e44" opacity="0.8" />
      <rect x="332" y="80" width="3" height="50" rx="1" fill="#261e44" opacity="0.8" />
      <rect x="350" y="80" width="3" height="50" rx="1" fill="#261e44" opacity="0.8" />
      <rect x="228" y="112" width="144" height="18" rx="3" fill="#2a2248" />
      <rect x="235" y="107" width="38" height="14" rx="4" fill="#c8b4ff" opacity="0.25" />
      <rect x="298" y="68" width="2" height="16" fill="#3a2e5a" />
      <rect x="280" y="82" width="38" height="1.5" rx="1" fill="#3a2e5a" />
      <line x1="284" y1="83" x2="280" y2="94" stroke="#3a2e5a" strokeWidth="1" />
      <line x1="299" y1="83" x2="299" y2="95" stroke="#3a2e5a" strokeWidth="1" />
      <line x1="314" y1="83" x2="318" y2="94" stroke="#3a2e5a" strokeWidth="1" />
      <path d="M276 96 Q280 90 284 96 Q280 100 276 96Z" fill="#c8b4ff" opacity="0.6" />
      <circle cx="318" cy="98" r="4" fill="#ffa0b4" opacity="0.5" />
      <rect x="138" y="95" width="4" height="30" fill="#1e1838" />
      <path d="M126 96 L154 96 L148 76 L132 76 Z" fill="#2a2248" />
      <ellipse cx="140" cy="96" rx="14" ry="4" fill="#c8b4ff" opacity="0.15" />
      <ellipse cx="140" cy="110" rx="22" ry="8" fill="#c8b4ff" opacity="0.08" />
      <rect x="398" y="110" width="50" height="32" rx="3" fill="#1e1838" />
      <rect x="398" y="108" width="50" height="8" rx="3" fill="#2a2248" />
      <rect x="420" y="108" width="6" height="4" rx="1" fill="#c8b4ff" opacity="0.4" />
      <circle cx="414" cy="126" r="5" fill="#ffa0b4" opacity="0.4" />
      <rect x="425" y="121" width="10" height="10" rx="2" fill="#c8b4ff" opacity="0.3" />
    </svg>
  )
}
