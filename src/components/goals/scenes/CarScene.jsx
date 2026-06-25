import { useTwinkle } from './useTwinkle'

export default function CarScene({ fit = 'meet' } = {}) {
  const starsRef = useTwinkle()
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio={`xMidYMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="160" fill="#0f1520" />
      <circle cx="520" cy="35" r="22" fill="#1a2540" />
      <circle cx="528" cy="29" r="18" fill="#1e2e50" />
      <circle cx="525" cy="32" r="5" fill="#141e38" opacity="0.6" />
      <circle cx="534" cy="24" r="3" fill="#141e38" opacity="0.4" />
      <g ref={starsRef}>
        <circle data-star cx="60" cy="25" r="1.2" fill="#64b4ff" opacity="0.5" />
        <circle data-star cx="120" cy="14" r="1" fill="#ffbe50" opacity="0.4" />
        <circle data-star cx="180" cy="30" r="1.5" fill="#64b4ff" opacity="0.45" />
        <circle data-star cx="240" cy="10" r="1" fill="#64b4ff" opacity="0.4" />
        <circle data-star cx="310" cy="20" r="1.2" fill="#ffbe50" opacity="0.35" />
        <circle data-star cx="380" cy="12" r="1" fill="#64b4ff" opacity="0.5" />
        <circle data-star cx="440" cy="28" r="1" fill="#64b4ff" opacity="0.4" />
        <circle data-star cx="80" cy="50" r="1" fill="#64b4ff" opacity="0.3" />
        <circle data-star cx="280" cy="38" r="1" fill="#ffbe50" opacity="0.4" />
        <circle data-star cx="470" cy="16" r="1.2" fill="#64b4ff" opacity="0.45" />
      </g>
      <path d="M0 130 L600 130 L600 160 L0 160 Z" fill="#141e30" />
      <path d="M0 128 L600 128" stroke="#1e2e44" strokeWidth="2" />
      <rect x="60" y="142" width="50" height="3" rx="1" fill="#2a3a54" opacity="0.7" />
      <rect x="170" y="142" width="50" height="3" rx="1" fill="#2a3a54" opacity="0.7" />
      <rect x="280" y="142" width="50" height="3" rx="1" fill="#2a3a54" opacity="0.7" />
      <rect x="390" y="142" width="50" height="3" rx="1" fill="#2a3a54" opacity="0.7" />
      <rect x="500" y="142" width="50" height="3" rx="1" fill="#2a3a54" opacity="0.7" />
      <ellipse cx="300" cy="128" rx="180" ry="12" fill="#1a2e50" opacity="0.5" />
      <rect x="165" y="98" width="270" height="38" rx="8" fill="#1e3060" />
      <path d="M210 98 Q230 72 290 70 L360 70 Q410 72 430 98 Z" fill="#263870" />
      <path d="M213 97 Q230 76 285 74 L310 74 L305 97 Z" fill="#1a4080" opacity="0.8" />
      <path d="M430 97 L355 74 L380 74 Q420 76 433 97 Z" fill="#1a4080" opacity="0.8" />
      <rect x="308" y="74" width="3" height="23" fill="#0f1a30" />
      <ellipse cx="432" cy="115" rx="25" ry="8" fill="#ffbe50" opacity="0.15" />
      <ellipse cx="432" cy="115" rx="14" ry="5" fill="#ffbe50" opacity="0.25" />
      <rect x="428" y="110" width="14" height="8" rx="3" fill="#ffdc80" />
      <rect x="163" y="110" width="10" height="7" rx="2" fill="#ff4466" opacity="0.9" />
      <ellipse cx="163" cy="113" rx="18" ry="5" fill="#ff4466" opacity="0.12" />
      <circle cx="225" cy="133" r="18" fill="#0a0e18" />
      <circle cx="225" cy="133" r="12" fill="#1a2540" />
      <circle cx="225" cy="133" r="5" fill="#2a3a5e" />
      <circle cx="375" cy="133" r="18" fill="#0a0e18" />
      <circle cx="375" cy="133" r="12" fill="#1a2540" />
      <circle cx="375" cy="133" r="5" fill="#2a3a5e" />
      <circle cx="222" cy="130" r="2" fill="#3a4e70" opacity="0.7" />
      <circle cx="372" cy="130" r="2" fill="#3a4e70" opacity="0.7" />
      <rect x="168" y="133" width="264" height="3" rx="1" fill="#0a0e18" />
      <path d="M442 112 L580 95 L580 130 L442 118 Z" fill="#ffbe50" opacity="0.04" />
    </svg>
  )
}
