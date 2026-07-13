export function LabelPill({ name, color }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium truncate"
      style={{
        background: `color-mix(in srgb, ${color ?? '#a78bfa'} 18%, transparent)`,
        color: color ?? '#a78bfa',
      }}
    >
      {name}
    </span>
  )
}
