export function ConfettiBurst({ color }) {
  const pieces = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    delay: `${Math.random() * 0.4}s`,
    size: 4 + Math.random() * 4,
    hue: Math.random() > 0.5 ? color : '#ffffff88',
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute rounded-sm"
          style={{
            left: p.left, top: 0,
            width: p.size, height: p.size,
            background: p.hue,
            animation: `confettiFall 0.9s ease-out ${p.delay} forwards`,
          }} />
      ))}
    </div>
  )
}
