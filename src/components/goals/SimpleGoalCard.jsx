import { useState } from 'react'
import { ChevronRight, ChevronLeft, Trash2 } from 'lucide-react'
import { monthsLabel } from '../../utils/goalCalc'

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-xl px-3 py-2.5 bg-white/[0.04] border border-white/[0.06]">
      <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold tabular-nums truncate" style={{ color: color ?? '#ede9ff' }}>{value}</p>
    </div>
  )
}

function Milestone({ Icon, status, title, desc, tag, color }) {
  const dotStyle = status === 'done'
    ? { background: `color-mix(in srgb, ${color} 20%, transparent)`, color, borderColor: color }
    : status === 'active'
    ? { background: `color-mix(in srgb, ${color} 15%, transparent)`, color, borderColor: color }
    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' }
  const tagStyle = status === 'future'
    ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
    : { background: `color-mix(in srgb, ${color} 15%, transparent)`, color }
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

export default function SimpleGoalCard({ goal, summary, typeConfig, savingsCardName, fmt, onOpen, onDelete, onPatchConfig }) {
  const [flipped, setFlipped] = useState(false)
  const [exploreContribution, setExploreContribution] = useState(() => summary.monthlyContribution)

  const { Scene, primaryColor, targetStatLabel, subtitleNoun, backTitle, milestones } = typeConfig

  const exploreRemaining = Math.max(0, summary.target - summary.currentSaved)
  const exploreMonths = exploreContribution > 0 ? Math.ceil(exploreRemaining / exploreContribution) : Infinity
  const exploreColor = exploreMonths <= summary.monthsToTarget ? 'var(--color-progress-bar)' : 'var(--color-warning)'
  const hasExploreChange = Math.round(exploreContribution) !== Math.round(summary.monthlyContribution)
  const sliderMax = Math.max(Math.ceil(summary.monthlyContribution * 2), 100)

  const extraStats = goal.type === 'fund'
    ? [
        { label: 'Months covered', value: `${goal.config?.emergency_fund_months ?? 3} months` },
        { label: 'Linked account', value: savingsCardName ?? '—' },
      ]
    : (goal.config?.extra_stats ?? []).slice(0, 2)

  const milestoneList = milestones(summary, fmt, savingsCardName).map(m => ({ ...m, color: primaryColor }))

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
              style={{ background: `color-mix(in srgb, ${primaryColor} 16%, transparent)`, color: primaryColor }}>
              Milestones <ChevronRight size={11} />
            </button>
            <Scene pct={summary.pct} />
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div>
              <p className="text-xl font-bold leading-tight text-white">Ready in {monthsLabel(summary.monthsToTarget)}</p>
              <p className="text-[12px] text-white/40 mt-0.5">
                putting aside <span className="font-medium" style={{ color: primaryColor }}>{fmt(summary.monthlyContribution)}/mo</span> toward your {subtitleNoun}
              </p>
            </div>

            <div>
              <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-white/[0.05]">
                <div style={{ width: `${summary.pct}%`, background: primaryColor }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/30 mt-1.5">
                <span>{fmt(summary.currentSaved)} saved of {fmt(summary.target)}</span>
                <span style={{ color: primaryColor, fontWeight: 500 }}>{Math.round(summary.pct)}%</span>
              </div>
            </div>

            <div className="rounded-xl p-2.5"
              style={{
                background: `color-mix(in srgb, ${primaryColor} 7%, transparent)`,
                border: `0.5px solid color-mix(in srgb, ${primaryColor} 18%, transparent)`,
              }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-white/40">What if I saved more?</span>
                <span className="text-sm font-semibold" style={{ color: primaryColor }}>{fmt(exploreContribution)}/mo</span>
              </div>
              <input type="range" min={0} max={sliderMax} step={Math.max(1, Math.round(sliderMax / 100))}
                value={Math.min(exploreContribution, sliderMax)}
                onChange={e => setExploreContribution(Number(e.target.value))}
                className="w-full cursor-pointer" style={{ accentColor: primaryColor }} />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-white/30">
                  Ready in <span className="font-medium" style={{ color: exploreColor }}>{monthsLabel(exploreMonths)}</span>
                </span>
                {hasExploreChange && (
                  <button onClick={e => { e.stopPropagation(); onPatchConfig(goal.id, { monthly_contribution: exploreContribution }) }}
                    className="text-[11px] font-medium px-2 py-1 rounded-full transition-colors"
                    style={{ background: `color-mix(in srgb, ${primaryColor} 20%, transparent)`, color: primaryColor }}>
                    Set as new monthly savings
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatBox label={targetStatLabel} value={summary.hasTarget ? fmt(summary.target) : '—'} />
              <StatBox label="Saved so far" value={fmt(summary.currentSaved)} color={primaryColor} />
              <StatBox label="Still needed" value={fmt(summary.remaining)} />
              <StatBox label="Monthly savings" value={`${fmt(summary.monthlyContribution)}/mo`} color={primaryColor} />
              {extraStats.map((s, i) => <StatBox key={i} label={s.label} value={s.value || '—'} />)}
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-card-face flip-card-back rounded-2xl border border-white/10 p-4 flex flex-col"
          style={{ background: 'rgba(8,7,16,0.78)', backdropFilter: 'blur(14px)' }}>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-sm font-semibold text-white">{backTitle}</span>
            <button onClick={e => { e.stopPropagation(); setFlipped(false) }}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-colors"
              style={{ background: `color-mix(in srgb, ${primaryColor} 14%, transparent)`, color: primaryColor }}>
              <ChevronLeft size={12} /> Overview
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {milestoneList.map((m, i) => <Milestone key={i} {...m} />)}
          </div>
        </div>

      </div>
    </div>
  )
}
