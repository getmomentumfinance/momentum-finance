export function Milestone({ Icon, status, title, desc, tag, color, doneColor = color }) {
  const c = status === 'done' ? doneColor : color
  const dotStyle = status === 'done'
    ? { background: `color-mix(in srgb, ${c} 20%, transparent)`, color: c, borderColor: c }
    : status === 'active'
    ? { background: `color-mix(in srgb, ${c} 15%, transparent)`, color: c, borderColor: c }
    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' }
  const tagStyle = status === 'future'
    ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
    : { background: `color-mix(in srgb, ${c} 15%, transparent)`, color: c }
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
