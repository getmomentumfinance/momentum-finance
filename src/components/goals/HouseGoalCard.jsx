import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Check, Shield, Landmark, Home, Key, Trash2 } from 'lucide-react'
import { computeHouseTimeline, monthsLabel } from '../../utils/goalCalc'

function monthsBetween(start, end) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
}

function NightScene() {
  const starsRef = useRef(null)

  useEffect(() => {
    const stars = starsRef.current?.querySelectorAll('[data-star]') ?? []
    const timers = []
    stars.forEach(star => {
      const base = 0.35 + Math.random() * 0.25
      star.style.opacity = base
      function twinkle() {
        const peak = 0.75 + Math.random() * 0.25
        const low  = 0.1 + Math.random() * 0.2
        const duration = 1800 + Math.random() * 2200
        const anim = star.animate(
          [{ opacity: base }, { opacity: peak }, { opacity: low }, { opacity: base }],
          { duration, easing: 'ease-in-out' }
        )
        anim.onfinish = () => { timers.push(setTimeout(twinkle, Math.random() * 2000)) }
      }
      timers.push(setTimeout(twinkle, Math.random() * 3000))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <svg width="100%" height="100%" viewBox="0 0 600 170" preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
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
      <g ref={starsRef}>
        <circle data-star cx="460" cy="50" r="1.5" fill="var(--color-accent-2)" />
        <circle data-star cx="490" cy="22" r="1"   fill="var(--color-accent-2)" />
        <circle data-star cx="140" cy="30" r="1.5" fill="var(--color-accent-2)" />
        <circle data-star cx="160" cy="48" r="1"   fill="var(--color-accent-2)" />
        <circle data-star cx="60"  cy="50" r="1"   fill="var(--color-accent-2)" />
        <circle data-star cx="420" cy="35" r="1"   fill="var(--color-accent)" />
        <circle data-star cx="560" cy="28" r="1.5" fill="var(--color-accent)" />
        <circle data-star cx="200" cy="18" r="1"   fill="var(--color-accent-2)" />
        <circle data-star cx="370" cy="24" r="1.2" fill="var(--color-accent-2)" />
        <circle data-star cx="110" cy="55" r="1"   fill="var(--color-accent)" />
        <circle data-star cx="540" cy="55" r="1"   fill="var(--color-accent-2)" />
        <circle data-star cx="310" cy="30" r="1"   fill="var(--color-accent-2)" />
      </g>
    </svg>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-xl px-3 py-2.5 bg-white/[0.04] border border-white/[0.06]">
      <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold tabular-nums truncate" style={{ color: color ?? '#ede9ff' }}>{value}</p>
    </div>
  )
}

function Milestone({ Icon, status, title, desc, tag }) {
  const dotStyle = status === 'done'
    ? { background: 'color-mix(in srgb, var(--color-accent-2) 20%, transparent)', color: 'var(--color-accent-2)', borderColor: 'var(--color-accent-2)' }
    : status === 'active'
    ? { background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' }
  const tagStyle = status === 'done'
    ? { background: 'color-mix(in srgb, var(--color-accent-2) 15%, transparent)', color: 'var(--color-accent-2)' }
    : status === 'active'
    ? { background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }
    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
  return (
    <div className="flex gap-3 items-start pb-4 last:pb-0">
      <div className="flex flex-col items-center shrink-0 w-7">
        <div className="w-7 h-7 rounded-full flex items-center justify-center border shrink-0" style={dotStyle}>
          <Icon size={13} />
        </div>
        <div className="w-px flex-1 mt-1 bg-white/[0.07]" style={{ minHeight: 18 }} />
      </div>
      <div className="pt-0.5">
        <p className="text-sm font-medium" style={{ color: status === 'future' ? 'rgba(255,255,255,0.4)' : '#fff' }}>{title}</p>
        <p className="text-xs text-white/40 mt-0.5">{desc}</p>
        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1.5" style={tagStyle}>{tag}</span>
      </div>
    </div>
  )
}

export default function HouseGoalCard({ goal, summary, savingsCardName, fmt, onOpen, onDelete }) {
  const [flipped, setFlipped] = useState(false)
  const [exploreSavings, setExploreSavings] = useState(() => summary.monthlySavings)

  const exploreTimeline = useMemo(() => computeHouseTimeline({
    monthlySavings: exploreSavings,
    currentSaved: summary.currentSaved,
    emergencyTarget: summary.emergencyTarget,
    downPaymentTarget: summary.downPaymentTarget,
  }), [exploreSavings, summary.currentSaved, summary.emergencyTarget, summary.downPaymentTarget])

  const leftover = summary.combinedIncome - exploreSavings
  const leftoverColor = leftover >= 0 ? 'var(--color-progress-bar)' : 'var(--color-alert)'
  const readyColor = exploreTimeline.totalMonths <= summary.timeline.totalMonths ? 'var(--color-progress-bar)' : 'var(--color-warning)'

  const sliderMax = Math.max(Math.ceil(summary.monthlySavings * 2), 200)
  const housePrice = goal.config?.house_price ?? 0

  // Milestone marks (months from goal start), all derived from the real timeline.
  const efMark = summary.timeline.monthsToEmergencyFund
  const dpMark = summary.timeline.totalMonths
  const monthsSinceStart = goal.started_at ? Math.max(0, monthsBetween(new Date(goal.started_at), new Date())) : 0
  const efDone = summary.emergencyTarget > 0 && summary.currentSaved >= summary.emergencyTarget
  const marks = [0, efMark, efMark, dpMark, dpMark]
  const firstNotDoneIdx = marks.findIndex((m, i) => i > 0 && (i === 1 ? !efDone : monthsSinceStart < m))
  function statusFor(idx) {
    if (idx === 0) return 'done'
    if (idx === 1) return efDone ? 'done' : (idx === firstNotDoneIdx ? 'active' : 'future')
    if (monthsSinceStart >= marks[idx]) return 'done'
    return idx === firstNotDoneIdx ? 'active' : 'future'
  }
  function tagFor(idx, prefix = 'In') {
    const status = statusFor(idx)
    if (status === 'done') return 'Done'
    const remaining = Math.max(0, marks[idx] - monthsSinceStart)
    return `${prefix} ${monthsLabel(remaining)}`
  }

  const milestones = [
    {
      Icon: Check, status: statusFor(0),
      title: 'Started saving',
      desc: savingsCardName ? `Savings card linked · ${savingsCardName}` : 'Building your savings habit',
      tag: 'Done',
    },
    {
      Icon: Shield, status: statusFor(1),
      title: 'Emergency fund complete',
      desc: `${fmt(summary.emergencyTarget)} target · ${fmt(summary.currentSaved)} saved so far`,
      tag: tagFor(1),
    },
    {
      Icon: Landmark, status: statusFor(2),
      title: 'Mortgage pre-approval',
      desc: `${fmt(summary.loanAmount)} loan · ${goal.config?.mortgage_rate_pct ?? 0}% rate · ${goal.config?.mortgage_years ?? 0} yr term`,
      tag: tagFor(2, '~'),
    },
    {
      Icon: Home, status: statusFor(3),
      title: 'Down payment ready',
      desc: `${fmt(summary.downPaymentAmount)} cash · ${fmt(summary.closingCosts)} closing costs covered`,
      tag: tagFor(3),
    },
    {
      Icon: Key, status: statusFor(4),
      title: 'Move in',
      desc: `${fmt(summary.mortgagePayment)}/mo mortgage · ${fmt(Math.max(0, summary.remainingAfterMortgage))} left to live on`,
      tag: tagFor(4),
    },
  ]

  return (
    <div className="flip-card-outer w-full">
      <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>

        {/* FRONT */}
        <div className="group flip-card-face rounded-2xl cursor-pointer hover:border-white/15 border border-white/10 transition-colors overflow-hidden"
          style={{ background: 'rgba(8,7,16,0.78)', backdropFilter: 'blur(14px)' }}
          onClick={() => onOpen(goal)}>
          <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
            <span className="text-sm font-semibold text-white truncate">{goal.name}</span>
            <button onClick={e => { e.stopPropagation(); onDelete(goal.id) }}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-white/40 shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="relative h-48 sm:h-52">
            <span className="absolute top-2.5 right-2.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-progress-bar)' }}>
              Active
            </span>
            <button onClick={e => { e.stopPropagation(); setFlipped(true) }}
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full transition-colors"
              style={{ background: 'color-mix(in srgb, var(--color-accent-2) 14%, transparent)', color: 'var(--color-accent-2)' }}>
              Milestones <ChevronRight size={11} />
            </button>
            <NightScene />
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div>
              <p className="text-xl font-bold leading-tight" style={{ color: readyColor }}>Ready in {monthsLabel(exploreTimeline.totalMonths)}</p>
              <p className="text-[12px] text-white/40 mt-0.5">
                putting aside <span className="font-medium" style={{ color: 'var(--color-accent-2)' }}>{fmt(exploreSavings)}/mo</span> toward your home
              </p>
            </div>

            <div>
              <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-white/[0.05]">
                {Number.isFinite(exploreTimeline.totalMonths) && (
                  <>
                    <div style={{ width: `${(exploreTimeline.monthsToEmergencyFund / Math.max(1, exploreTimeline.totalMonths)) * 100}%`, background: 'var(--color-accent-2)' }} />
                    <div style={{ width: `${(exploreTimeline.monthsToDownPayment / Math.max(1, exploreTimeline.totalMonths)) * 100}%`, background: 'var(--color-accent)' }} />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/30 mt-1.5 flex-wrap gap-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-accent-2)' }} />
                  Emergency fund · {monthsLabel(exploreTimeline.monthsToEmergencyFund)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-accent)' }} />
                  Down payment · {monthsLabel(exploreTimeline.monthsToDownPayment)}
                </span>
              </div>
            </div>

            <div className="rounded-xl p-2.5"
              style={{
                background: 'color-mix(in srgb, var(--color-accent-2) 7%, transparent)',
                border: '0.5px solid color-mix(in srgb, var(--color-accent-2) 18%, transparent)',
              }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-white/40">What if I saved more?</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-accent-2)' }}>{fmt(exploreSavings)}/mo</span>
              </div>
              <input type="range" min={0} max={sliderMax} step={Math.max(1, Math.round(sliderMax / 100))}
                value={Math.min(exploreSavings, sliderMax)}
                onChange={e => setExploreSavings(Number(e.target.value))}
                className="w-full cursor-pointer" style={{ accentColor: 'var(--color-accent-2)' }} />
              <div className="flex items-center justify-between text-[11px] mt-1.5 text-white/30">
                <span>Ready in <span className="font-medium" style={{ color: readyColor }}>{monthsLabel(exploreTimeline.totalMonths)}</span></span>
                <span>Left for living <span className="font-medium" style={{ color: leftoverColor }}>{fmt(Math.max(0, leftover))}</span></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatBox label="House price" value={housePrice ? fmt(housePrice) : '—'} />
              <StatBox label="Down payment" value={fmt(summary.downPaymentAmount)} color="var(--color-accent)" />
              <StatBox label="Emergency fund" value={`${fmt(summary.currentSaved)} / ${fmt(summary.emergencyTarget)}`} />
              <StatBox label="Monthly savings" value={`${fmt(exploreSavings)}/mo`} color="var(--color-accent-2)" />
              <StatBox label="Mortgage" value={fmt(summary.mortgagePayment)} />
              <StatBox label="Left for living" value={fmt(Math.max(0, leftover))} color={leftoverColor} />
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-card-face flip-card-back rounded-2xl border border-white/10 p-4 flex flex-col"
          style={{ background: 'rgba(8,7,16,0.78)', backdropFilter: 'blur(14px)' }}>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-sm font-semibold text-white">Road to your home</span>
            <button onClick={e => { e.stopPropagation(); setFlipped(false) }}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-colors"
              style={{ background: 'color-mix(in srgb, var(--color-accent-2) 14%, transparent)', color: 'var(--color-accent-2)' }}>
              <ChevronLeft size={12} /> Overview
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {milestones.map((m, i) => <Milestone key={i} {...m} />)}
          </div>
        </div>

      </div>
    </div>
  )
}
