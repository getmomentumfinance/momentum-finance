import { Skeleton } from './Skeleton'

function NavSkeleton() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 border-b border-white/[0.05]"
      style={{ background: 'var(--color-dash-card)' }}>
      {/* Nav icons left */}
      <div className="flex items-center gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-5 h-5 rounded-lg" />
        ))}
      </div>
      {/* Month nav center */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-5 h-5 rounded" />
      </div>
      {/* Icons right */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
    </nav>
  )
}

function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-24">
      <div className="flex items-start justify-between">
        <Skeleton className="h-2.5 w-20 rounded" />
        <Skeleton className="w-6 h-6 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-28 rounded" />
    </div>
  )
}

function WidgetSkeleton({ rows = 4, tall = false }) {
  return (
    <div className={`glass-card rounded-2xl p-4 flex flex-col gap-3 ${tall ? 'h-64' : 'h-48'}`}>
      <div className="flex items-center justify-between mb-1">
        <Skeleton className="h-3.5 w-28 rounded" />
        <Skeleton className="w-5 h-5 rounded-lg" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-2.5 rounded" style={{ width: `${55 + (i % 3) * 15}%` }} />
            <Skeleton className="h-2 w-1/3 rounded" />
          </div>
          <Skeleton className="h-2.5 w-12 rounded" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 h-48">
      <div className="flex items-center justify-between mb-1">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-36 rounded" />
          <Skeleton className="h-2.5 w-24 rounded" />
        </div>
        <Skeleton className="w-16 h-7 rounded-xl" />
      </div>
      {/* Fake chart bars */}
      <div className="flex-1 flex items-end gap-1.5 px-1">
        {[65, 40, 80, 55, 90, 45, 70, 35, 85, 60, 75, 50].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <NavSkeleton />

      <div className="py-6 px-4 md:px-16 flex flex-col gap-5">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48 rounded-xl" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Main content — two columns */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-5">
            <WidgetSkeleton rows={4} tall />
            <WidgetSkeleton rows={3} />
          </div>
          <div className="flex flex-col gap-5">
            <ChartSkeleton />
            <WidgetSkeleton rows={4} tall />
          </div>
        </div>

      </div>
    </div>
  )
}
