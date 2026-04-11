export function Skeleton({ className = '', style = {} }) {
  return <div className={`skeleton ${className}`} style={style} />
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.03]">
      <Skeleton className="h-3 w-1/3 rounded" />
      <Skeleton className="h-6 w-2/3 rounded" />
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Skeleton className="w-7 h-7 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-2.5 w-1/3 rounded" />
      </div>
      <Skeleton className="h-3 w-12 rounded" />
    </div>
  )
}
