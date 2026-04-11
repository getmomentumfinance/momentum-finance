import { ShieldCheck, Coffee, Sparkles } from 'lucide-react'

function CircleProgress({ percentage = 0, color, icon: Icon, label, spent = 0, budget = null }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#1e2035" strokeWidth="7" />
          <circle
            cx="44" cy="44" r={r}
            fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-muted">
          <Icon size={22} />
        </div>
      </div>
      <div className="text-center">
        <p className="font-bold text-sm">€{spent}</p>
        {budget !== null && <p className="text-xs text-muted">/ €{budget}</p>}
        <p className="text-xs text-muted">{spent}.00 spent</p>
      </div>
    </div>
  )
}

export default function NecessityBreakdown() {
  return (
    <div className="glass-card rounded-2xl p-4">
      <h3 className="font-semibold text-base mb-6">Necessity Breakdown</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center gap-1">
          <CircleProgress color="#f472b6" icon={ShieldCheck} label="Needs" spent={0} />
          <span className="text-xs text-muted">Needs</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CircleProgress color="#c084fc" icon={Coffee} label="Wants" spent={0} />
          <span className="text-xs text-muted">Wants</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CircleProgress color="#60a5fa" icon={Sparkles} label="Luxury" spent={0} budget={100} percentage={0} />
          <span className="text-xs text-muted">Luxury</span>
          <span className="text-xs text-muted">€100.00 remaining</span>
          <span className="text-xs text-muted">0%</span>
        </div>
      </div>
    </div>
  )
}
