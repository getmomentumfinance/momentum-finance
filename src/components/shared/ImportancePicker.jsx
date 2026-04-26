export default function ImportancePicker({ value, onChange, options }) {
  return (
    <div className="flex gap-1.5">
      {options.map(imp => {
        const active = value === imp.value
        return (
          <button
            key={imp.value}
            type="button"
            onClick={() => onChange(active ? '' : imp.value)}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-medium transition-all"
            style={{
              borderColor: active ? imp.color : 'rgba(255,255,255,0.08)',
              background:  active ? `color-mix(in srgb, ${imp.color} 15%, transparent)` : 'rgba(255,255,255,0.02)',
              color:       active ? imp.color : 'rgba(255,255,255,0.35)',
            }}
          >
            <span className="flex gap-0.5">
              {Array.from({ length: imp.dots }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: active ? imp.color : 'rgba(255,255,255,0.2)' }} />
              ))}
            </span>
            {imp.label}
          </button>
        )
      })}
    </div>
  )
}
