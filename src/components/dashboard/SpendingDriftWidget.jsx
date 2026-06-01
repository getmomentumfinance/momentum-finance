import { useMemo } from 'react'
import { useSharedData } from '../../context/SharedDataContext'
import { usePreferences } from '../../context/UserPreferencesContext'
import { computeBaseline, currentMonthTotals } from '../../utils/spendingBaseline'

const THRESHOLD = 0.25   // 25% deviation required to show
const MIN_AVG   = 15     // ignore categories with avg < €15 (noise)
const MAX_ROWS  = 5

export default function SpendingDriftWidget({ currentDate }) {
  const { allTransactions, categories, categoryMap } = useSharedData()
  const { fmt } = usePreferences()

  const drift = useMemo(() => {
    const baseline = computeBaseline(allTransactions, currentDate)
    if (!baseline) return null

    const { avgMap, monthCount } = baseline
    const current = currentMonthTotals(allTransactions, currentDate)

    const rows = []
    for (const [catId, avg] of Object.entries(avgMap)) {
      if (avg < MIN_AVG) continue
      const cur = current[catId] ?? 0
      const pct = (cur - avg) / avg
      if (Math.abs(pct) < THRESHOLD) continue
      const cat = categoryMap[catId]
      if (!cat) continue
      rows.push({ name: cat.name, color: cat.color, cur, avg, pct })
    }

    rows.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    return { rows: rows.slice(0, MAX_ROWS), monthCount }
  }, [allTransactions, currentDate, categoryMap])

  if (!drift || drift.rows.length === 0) return null

  return (
    <div className="glass-card rounded-2xl px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Spending drift</span>
        <span className="text-[10px] text-muted">{drift.monthCount}-month avg</span>
      </div>

      <div className="flex flex-col gap-0.5">
        {drift.rows.map(({ name, color, cur, avg, pct }) => {
          const above = pct > 0
          const pctColor = above ? '#f59e0b' : '#38bdf8'
          return (
            <div key={name} className="flex items-center gap-2.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color || 'rgba(255,255,255,0.3)' }} />
              <span className="flex-1 text-sm text-white/80 truncate min-w-0">{name}</span>
              <span className="text-sm tabular-nums text-white/70 shrink-0">{fmt(cur, 0)}</span>
              <span className="text-[11px] font-semibold tabular-nums shrink-0 w-16 text-right" style={{ color: pctColor }}>
                {above ? '↗' : '↘'} {Math.abs(pct * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-white/25 tabular-nums shrink-0 w-20 text-right">
                avg {fmt(avg, 0)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
