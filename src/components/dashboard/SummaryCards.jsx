import { useCardCustomization } from '../../hooks/useCardCustomization'
import CardCustomizationPopup from '../shared/CardCustomizationPopup'
import { usePreferences } from '../../context/UserPreferencesContext'
import useCountUp from '../../hooks/useCountUp'

export function StatCard({ label, icon: Icon, value = 0, gradient = false, onCardClick }) {
  const { fmt } = usePreferences()
  const c            = useCardCustomization(label)
  const animatedValue = useCountUp(value)

  // Background for the card
  let bgGradient = c.bgGradient
  if (!c.enableColor && gradient)
    bgGradient = 'linear-gradient(135deg,rgba(80,50,120,0.8),rgba(30,42,74,0.9))'

  const border = c.showBorder ? '1px solid var(--color-border)' : 'none'

  return (
    <>
      <div
        className={`relative flex flex-col justify-between p-4 rounded-2xl h-full overflow-hidden ${onCardClick ? 'cursor-pointer' : ''}`}
        style={{ border, background: c.enableColor ? undefined : 'var(--color-stat-card, transparent)', backdropFilter: 'blur(var(--card-blur, 14px))', WebkitBackdropFilter: 'blur(var(--card-blur, 14px))' }}
        onClick={onCardClick}
      >
        {bgGradient && (
          <div className="absolute inset-0"
            style={{ background: bgGradient, opacity: c.enableColor ? c.opacity / 100 : 1 }} />
        )}
        {c.enableColor && c.darkOverlay > 0 && (
          <div className="absolute inset-0 bg-black" style={{ opacity: c.darkOverlay / 100 }} />
        )}

        <div className="relative z-10 flex items-start justify-between">
          <span className="text-[10px] text-muted uppercase tracking-widest font-medium">{label}</span>
          <button
            ref={c.btnRef}
            type="button"
            onClick={e => { e.stopPropagation(); c.toggleOpen() }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            style={{ color: c.customIconColor && c.iconColor ? c.iconColor : undefined }}
          >
            <Icon size={14} />
          </button>
        </div>
        <span className="relative z-10 text-lg md:text-2xl font-bold">{fmt(animatedValue)}</span>
      </div>

      {c.open && (
        <CardCustomizationPopup
          popupRef={c.popupRef} pos={c.pos}
          enableColor={c.enableColor}   setEnableColor={c.setEnableColor}
          showBorder={c.showBorder}     setShowBorder={c.setShowBorder}
          tab={c.tab}                   setTab={c.setTab}
          selectedColor={c.selectedColor}   setSelectedColor={c.setSelectedColor}
          opacity={c.opacity}           setOpacity={c.setOpacity}
          darkOverlay={c.darkOverlay}   setDarkOverlay={c.setDarkOverlay}
          customIconColor={c.customIconColor} setCustomIconColor={c.setCustomIconColor}
          iconColor={c.iconColor}       setIconColor={c.setIconColor}
          colors={c.colors}
        />
      )}
    </>
  )
}
