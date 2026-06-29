export function HorizontalTimeline({ milestones, color, doneColor = color }) {
  return (
    <div className="flex w-full items-start">
      {milestones.map((m, i) => {
        const c = m.status === 'done' ? doneColor : color
        const dotStyle = m.status === 'done'
          ? { background: `color-mix(in srgb, ${c} 20%, transparent)`, color: c, borderColor: c }
          : m.status === 'active'
          ? { background: `color-mix(in srgb, ${c} 15%, transparent)`, color: c, borderColor: c }
          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' }
        const tagStyle = m.status === 'future'
          ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
          : { background: `color-mix(in srgb, ${c} 15%, transparent)`, color: c }
        const lineColor = m.status === 'done' ? `color-mix(in srgb, ${doneColor} 40%, transparent)` : 'rgba(255,255,255,0.08)'
        return (
          <div key={i} className={`flex flex-col items-center gap-2.5 ${i < milestones.length - 1 ? 'flex-1' : 'shrink-0'}`}>
            <div className="flex items-center w-full">
              {i > 0 && <div className="flex-1 h-px" style={{ background: lineColor }} />}
              <div className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0" style={dotStyle}>
                <m.Icon size={14} />
              </div>
              {i < milestones.length - 1 && <div className="flex-1 h-px" style={{ background: lineColor }} />}
            </div>
            <div className="flex flex-col items-center gap-1 px-2 text-center max-w-[180px]">
              <p className="text-sm font-medium" style={{ color: m.status === 'future' ? 'rgba(255,255,255,0.4)' : '#fff' }}>{m.title}</p>
              <p className="text-xs text-white/40 leading-snug">{m.desc}</p>
              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5" style={tagStyle}>{m.tag}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
