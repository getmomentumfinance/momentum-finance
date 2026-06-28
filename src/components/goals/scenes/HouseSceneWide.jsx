import { useTwinkle } from './useTwinkle'

export default function HouseSceneWide() {
  const starsRef = useTwinkle()

  return (
    <svg width="100%" height="100%" viewBox="0 0 1600 170" preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      {/* Ground — spans the full wide canvas so there's no seam at the letterbox edges */}
      <path d="M0 156 Q150 150 300 154 Q420 157 530 155 L530 170 L0 170 Z" fill="#1e1830" />
      <path d="M1070 150 Q1200 145 1320 152 Q1450 158 1600 153 L1600 170 L1070 170 Z" fill="#1e1830" />

      {/* Far-left/right extra scenery */}
      <ellipse cx="150" cy="158" rx="60" ry="11" fill="#1c1828" />
      <ellipse cx="150" cy="151" rx="11" ry="23" fill="#262040" />
      <ellipse cx="134" cy="146" rx="8" ry="18" fill="#2a2442" />
      <ellipse cx="166" cy="144" rx="9" ry="20" fill="#2a2442" />
      <path d="M260 158 Q272 140 284 158" fill="#201c34" />
      <path d="M1240 156 Q1255 132 1270 156" fill="#201c34" />
      <ellipse cx="1420" cy="156" rx="50" ry="10" fill="#1c1828" />
      <ellipse cx="1420" cy="149" rx="10" ry="20" fill="#262040" />
      <ellipse cx="1406" cy="145" rx="7" ry="16" fill="#2a2442" />

      <g transform="translate(500,0)">
        <circle cx="480" cy="38" r="28" fill="#2a2240" />
        <circle cx="500" cy="32" r="22" fill="#322a50" />
        <ellipse cx="80" cy="148" rx="55" ry="12" fill="#1e1a30" />
        <ellipse cx="80" cy="142" rx="10" ry="22" fill="#2a2440" />
        <ellipse cx="65" cy="138" rx="8" ry="18" fill="#2e2846" />
        <ellipse cx="95" cy="136" rx="9" ry="20" fill="#2e2846" />
        <ellipse cx="530" cy="150" rx="40" ry="9" fill="#1e1a30" />
        <ellipse cx="530" cy="145" rx="8" ry="16" fill="#2a2440" />
        <ellipse cx="518" cy="142" rx="6" ry="13" fill="#2e2846" />
        <ellipse cx="542" cy="140" rx="7" ry="15" fill="#2e2846" />
        <path d="M30 155 Q80 148 140 152 Q200 156 260 152 Q320 148 380 152 Q440 156 500 150 Q540 147 570 150 L570 170 L30 170 Z" fill="#1e1830" />
        <rect x="232" y="95" width="136" height="68" rx="3" fill="#2d2550" />
        <polygon points="230,97 368,97 340,65 260,65" fill="#3d3470" />
        <polygon points="260,65 340,65 300,44" fill="#4e43a0" />
        <rect x="256" y="120" width="28" height="43" rx="3" fill="#1a1530" />
        <rect x="257" y="121" width="26" height="41" rx="2" fill="var(--color-accent-2)" opacity="0.18" />
        <rect x="295" y="110" width="22" height="22" rx="2" fill="#1a1530" />
        <rect x="296" y="111" width="20" height="20" rx="1" fill="var(--color-accent-2)" opacity="0.15" />
        <line x1="307" y1="111" x2="307" y2="131" stroke="var(--color-accent-2)" strokeWidth="0.8" opacity="0.4" />
        <line x1="296" y1="121" x2="316" y2="121" stroke="var(--color-accent-2)" strokeWidth="0.8" opacity="0.4" />
        <rect x="326" y="110" width="22" height="22" rx="2" fill="#1a1530" />
        <rect x="327" y="111" width="20" height="20" rx="1" fill="var(--color-accent-2)" opacity="0.15" />
        <line x1="337" y1="111" x2="337" y2="131" stroke="var(--color-accent-2)" strokeWidth="0.8" opacity="0.4" />
        <line x1="327" y1="121" x2="347" y2="121" stroke="var(--color-accent-2)" strokeWidth="0.8" opacity="0.4" />
        <rect x="299" y="93" width="2" height="10" fill="var(--color-accent)" opacity="0.7" />
        <rect x="296" y="90" width="8" height="3" rx="1" fill="var(--color-accent)" opacity="0.7" />
        <path d="M180 155 Q195 130 210 155" fill="#252040" />
        <path d="M173 155 Q192 122 211 155" fill="none" stroke="#2e2848" strokeWidth="1.5" />
        <rect x="188" y="148" width="8" height="7" rx="1" fill="#2a2240" />
        <path d="M385 155 Q400 128 415 155" fill="#252040" />
        <path d="M378 155 Q397 120 416 155" fill="none" stroke="#2e2848" strokeWidth="1.5" />
        <rect x="393" y="147" width="8" height="8" rx="1" fill="#2a2240" />
      </g>

      <g ref={starsRef}>
        <circle data-star cx="960" cy="50" r="1.5" fill="var(--color-accent-2)" opacity="0.5" />
        <circle data-star cx="990" cy="22" r="1"   fill="var(--color-accent-2)" opacity="0.4" />
        <circle data-star cx="640" cy="30" r="1.5" fill="var(--color-accent-2)" opacity="0.5" />
        <circle data-star cx="660" cy="48" r="1"   fill="var(--color-accent-2)" opacity="0.35" />
        <circle data-star cx="560" cy="50" r="1"   fill="var(--color-accent-2)" opacity="0.4" />
        <circle data-star cx="920" cy="35" r="1"   fill="var(--color-accent)" opacity="0.5" />
        <circle data-star cx="1060" cy="28" r="1.5" fill="var(--color-accent)" opacity="0.4" />
        <circle data-star cx="700" cy="18" r="1"   fill="var(--color-accent-2)" opacity="0.45" />
        <circle data-star cx="870" cy="24" r="1.2" fill="var(--color-accent-2)" opacity="0.5" />
        <circle data-star cx="610" cy="55" r="1"   fill="var(--color-accent)" opacity="0.4" />
        <circle data-star cx="1040" cy="55" r="1"   fill="var(--color-accent-2)" opacity="0.4" />
        <circle data-star cx="810" cy="30" r="1"   fill="var(--color-accent-2)" opacity="0.45" />
        <circle data-star cx="80"  cy="32" r="1.3" fill="var(--color-accent-2)" opacity="0.4" />
        <circle data-star cx="220" cy="20" r="1"   fill="var(--color-accent)" opacity="0.4" />
        <circle data-star cx="340" cy="42" r="1.2" fill="var(--color-accent-2)" opacity="0.45" />
        <circle data-star cx="40"  cy="60" r="1"   fill="var(--color-accent-2)" opacity="0.35" />
        <circle data-star cx="1200" cy="24" r="1.2" fill="var(--color-accent-2)" opacity="0.45" />
        <circle data-star cx="1320" cy="44" r="1"   fill="var(--color-accent)" opacity="0.4" />
        <circle data-star cx="1460" cy="20" r="1.3" fill="var(--color-accent-2)" opacity="0.45" />
        <circle data-star cx="1540" cy="58" r="1"   fill="var(--color-accent-2)" opacity="0.35" />
        <circle data-star cx="1180" cy="60" r="1"   fill="var(--color-accent)" opacity="0.4" />
      </g>
    </svg>
  )
}
