import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { TRANSACTION_TYPES, TYPES_MAP } from '../../constants/transactionTypes'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getCalendarData(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  return { daysInMonth, offset }
}

export default function CalendarWidget({ currentDate, onDayClick }) {
  const { user } = useAuth()
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const { daysInMonth, offset } = getCalendarData(year, month)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDate = today.getDate()

  // day → Set of transaction types
  const [dotsByDay, setDotsByDay] = useState({})

  useEffect(() => {
    if (!user?.id) return

    async function load() {
      const start = new Date(year, month, 1).toISOString().slice(0, 10)
      const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)
      const { data } = await supabase
        .from('transactions')
        .select('date, type')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .gte('date', start)
        .lte('date', end)
      if (!data) return
      const map = {}
      data.forEach(t => {
        const day = parseInt(t.date.slice(8, 10), 10)
        if (!map[day]) map[day] = new Set()
        map[day].add(t.type)
      })
      setDotsByDay(map)
    }

    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, year, month])

  const cells = Array(offset).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  return (
    <div className="glass-card p-4 flex flex-col gap-3 h-full">
      <h3 className="font-semibold text-base">
        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </h3>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((d, i) => (
          <span key={i} className="text-xs text-muted py-1">{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 text-center gap-y-1">
        {cells.map((day, i) => {
          const types = day ? [...(dotsByDay[day] ?? [])] : []
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 py-0.5">
              {day && (
                <>
                  <span
                    onClick={() => onDayClick?.(day)}
                    className={`text-xs w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                      isCurrentMonth && day === todayDate
                        ? 'bg-accent text-white font-semibold'
                        : 'text-white hover:bg-input'
                    }`}
                  >
                    {day}
                  </span>
                  <div className="flex gap-[3px] h-[7px] items-center">
                    {types.map(type => (
                      <div
                        key={type}
                        className="w-[5px] h-[5px] rounded-full shrink-0"
                        style={{ background: TYPES_MAP[type]?.color ?? '#9ca3af' }}
                        title={TYPES_MAP[type]?.label ?? type}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-border mt-auto">
        {TRANSACTION_TYPES.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
