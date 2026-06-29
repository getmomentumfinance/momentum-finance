import { useTwinkle } from './useTwinkle'

export default function EmergencyFundScene({ pct = 0, fit = 'meet', align = 'Mid' } = {}) {
  const starsRef = useTwinkle()
  // Shield fill rises from the bottom of its silhouette in proportion to pct.
  const fillHeight = (Math.min(100, Math.max(0, pct)) / 100) * 168
  const fillY = 316 - fillHeight

  return (
    <svg width="100%" height="100%" viewBox="0 0 680 420" preserveAspectRatio={`x${align}YMid ${fit}`}
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="shieldGlowFund" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#64e8c8" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#64e8c8" stopOpacity="0" />
        </radialGradient>
        <clipPath id="shieldClipFund">
          <path d="M 340 148 L 415 178 L 415 240 Q 415 286 340 316 Q 265 286 265 240 L 265 178 Z" />
        </clipPath>
      </defs>
      <g ref={starsRef}>
        <circle data-star cx="60" cy="22" r="1" fill="#e8f4e8" opacity="0.25" />
        <circle data-star cx="150" cy="14" r="0.8" fill="#e8f4e8" opacity="0.2" />
        <circle data-star cx="580" cy="18" r="1" fill="#e8f4e8" opacity="0.25" />
        <circle data-star cx="640" cy="40" r="0.8" fill="#e8f4e8" opacity="0.2" />
      </g>
      <ellipse cx="170" cy="65" rx="130" ry="55" fill="#0e1816" opacity="0.9" />
      <ellipse cx="280" cy="50" rx="120" ry="50" fill="#0f1a17" opacity="0.85" />
      <ellipse cx="400" cy="70" rx="150" ry="58" fill="#0e1816" opacity="0.9" />
      <ellipse cx="530" cy="55" rx="130" ry="52" fill="#0f1a17" opacity="0.85" />
      <ellipse cx="640" cy="75" rx="100" ry="45" fill="#0e1816" opacity="0.8" />
      <ellipse cx="60" cy="80" rx="90" ry="40" fill="#0e1816" opacity="0.8" />
      <ellipse cx="200" cy="90" rx="110" ry="42" fill="#111e1b" opacity="0.7" />
      <ellipse cx="460" cy="95" rx="140" ry="45" fill="#111e1b" opacity="0.7" />
      <g fill="#1a2e20" opacity="0.5">
        <rect x="55" y="130" width="1.5" height="10" rx="0.5" />
        <rect x="80" y="155" width="1.5" height="10" rx="0.5" />
        <rect x="105" y="120" width="1.5" height="10" rx="0.5" />
        <rect x="130" y="160" width="1.5" height="10" rx="0.5" />
        <rect x="155" y="135" width="1.5" height="10" rx="0.5" />
        <rect x="185" y="165" width="1.5" height="10" rx="0.5" />
        <rect x="210" y="125" width="1.5" height="10" rx="0.5" />
        <rect x="240" y="150" width="1.5" height="10" rx="0.5" />
        <rect x="440" y="140" width="1.5" height="10" rx="0.5" />
        <rect x="465" y="160" width="1.5" height="10" rx="0.5" />
        <rect x="492" y="128" width="1.5" height="10" rx="0.5" />
        <rect x="518" y="155" width="1.5" height="10" rx="0.5" />
        <rect x="545" y="138" width="1.5" height="10" rx="0.5" />
        <rect x="570" y="168" width="1.5" height="10" rx="0.5" />
        <rect x="600" y="130" width="1.5" height="10" rx="0.5" />
        <rect x="628" y="158" width="1.5" height="10" rx="0.5" />
      </g>
      <g fill="#1a2e20" opacity="0.35">
        <rect x="68" y="185" width="1.5" height="10" rx="0.5" />
        <rect x="92" y="210" width="1.5" height="10" rx="0.5" />
        <rect x="118" y="195" width="1.5" height="10" rx="0.5" />
        <rect x="142" y="220" width="1.5" height="10" rx="0.5" />
        <rect x="168" y="200" width="1.5" height="10" rx="0.5" />
        <rect x="198" y="215" width="1.5" height="10" rx="0.5" />
        <rect x="450" y="190" width="1.5" height="10" rx="0.5" />
        <rect x="478" y="212" width="1.5" height="10" rx="0.5" />
        <rect x="504" y="195" width="1.5" height="10" rx="0.5" />
        <rect x="532" y="218" width="1.5" height="10" rx="0.5" />
        <rect x="558" y="200" width="1.5" height="10" rx="0.5" />
        <rect x="585" y="215" width="1.5" height="10" rx="0.5" />
        <rect x="612" y="188" width="1.5" height="10" rx="0.5" />
        <rect x="638" y="210" width="1.5" height="10" rx="0.5" />
      </g>
      <rect x="0" y="330" width="680" height="90" fill="#0a0f0e" />
      <rect x="0" y="328" width="680" height="5" fill="#111a18" opacity="0.9" />
      <ellipse cx="160" cy="345" rx="55" ry="8" fill="#0d1a17" opacity="0.7" />
      <ellipse cx="520" cy="348" rx="60" ry="7" fill="#0d1a17" opacity="0.7" />
      <ellipse cx="340" cy="360" rx="40" ry="6" fill="#0d1a17" opacity="0.5" />
      <ellipse cx="160" cy="345" rx="55" ry="8" fill="none" stroke="rgba(100,232,200,0.08)" strokeWidth="1" />
      <ellipse cx="160" cy="345" rx="42" ry="6" fill="none" stroke="rgba(100,232,200,0.06)" strokeWidth="0.7" />
      <ellipse cx="520" cy="348" rx="60" ry="7" fill="none" stroke="rgba(100,232,200,0.08)" strokeWidth="1" />
      <ellipse cx="340" cy="240" rx="140" ry="130" fill="url(#shieldGlowFund)" />
      <path d="M 340 130 L 430 165 L 430 240 Q 430 295 340 330 Q 250 295 250 240 L 250 165 Z" fill="#0d1a17" />
      <path d="M 340 130 L 430 165 L 430 240 Q 430 295 340 330 Q 250 295 250 240 L 250 165 Z" fill="none" stroke="rgba(100,232,200,0.5)" strokeWidth="2" />
      <path d="M 340 148 L 415 178 L 415 240 Q 415 286 340 316 Q 265 286 265 240 L 265 178 Z" fill="#0e1d19" />
      <rect x="265" y={fillY} width="150" height={fillHeight} fill="rgba(100,232,200,0.4)" clipPath="url(#shieldClipFund)" />
      <path d="M 340 148 L 415 178 L 415 240 Q 415 286 340 316 Q 265 286 265 240 L 265 178 Z" fill="none" stroke="rgba(100,232,200,0.2)" strokeWidth="1" />
      <path d="M 308 238 L 328 260 L 372 210" fill="none" stroke="rgba(100,232,200,0.65)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="340" cy="170" r="3" fill="rgba(100,232,200,0.3)" />
      <line x1="295" y1="130" x2="303" y2="148" stroke="rgba(100,232,200,0.2)" strokeWidth="1" strokeLinecap="round" />
      <line x1="320" y1="122" x2="325" y2="142" stroke="rgba(100,232,200,0.15)" strokeWidth="1" strokeLinecap="round" />
      <line x1="360" y1="118" x2="358" y2="140" stroke="rgba(100,232,200,0.2)" strokeWidth="1" strokeLinecap="round" />
      <line x1="385" y1="126" x2="380" y2="148" stroke="rgba(100,232,200,0.15)" strokeWidth="1" strokeLinecap="round" />
      <rect x="60" y="200" width="80" height="140" rx="1" fill="#0c1614" opacity="0.8" />
      <rect x="75" y="215" width="16" height="14" rx="1" fill="rgba(100,232,200,0.22)" />
      <rect x="100" y="215" width="16" height="14" rx="1" fill="rgba(100,232,200,0.15)" />
      <rect x="75" y="240" width="16" height="14" rx="1" fill="rgba(100,232,200,0.1)" />
      <rect x="100" y="240" width="16" height="14" rx="1" fill="rgba(100,232,200,0.25)" />
      <rect x="540" y="210" width="90" height="130" rx="1" fill="#0c1614" opacity="0.8" />
      <rect x="555" y="225" width="16" height="14" rx="1" fill="rgba(100,232,200,0.18)" />
      <rect x="580" y="225" width="16" height="14" rx="1" fill="rgba(100,232,200,0.28)" />
      <rect x="555" y="248" width="16" height="14" rx="1" fill="rgba(100,232,200,0.22)" />
      <rect x="580" y="248" width="16" height="14" rx="1" fill="rgba(100,232,200,0.1)" />
    </svg>
  )
}
