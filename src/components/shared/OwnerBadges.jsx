export function OwnerBadges({ ownerIds, members, size = 16 }) {
  if (!ownerIds?.length) return null
  const owners = ownerIds.map(id => members.find(m => m.id === id)).filter(Boolean)
  if (!owners.length) return null

  return (
    <div className="flex items-center" style={{ marginLeft: 2 }}>
      {owners.map((m, i) => (
        <div
          key={m.id}
          title={m.name}
          className="rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 border border-black/20"
          style={{ width: size, height: size, background: m.color, marginLeft: i === 0 ? 0 : -6 }}
        >
          {m.name[0]?.toUpperCase()}
        </div>
      ))}
    </div>
  )
}
