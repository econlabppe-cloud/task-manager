import React from 'react'
import { RecurringType } from '../types'

const OPTIONS: { value: RecurringType; label: string; icon: string }[] = [
  { value: 'none',    label: 'חד-פעמי',  icon: '○' },
  { value: 'daily',   label: 'יומי',     icon: '↻' },
  { value: 'weekly',  label: 'שבועי',   icon: '↻' },
  { value: 'monthly', label: 'חודשי',   icon: '↻' },
]

const BADGE: Record<RecurringType, { bg: string; text: string }> = {
  none:    { bg: 'bg-transparent', text: 'text-gray-300' },
  daily:   { bg: 'bg-blue-50',    text: 'text-blue-600' },
  weekly:  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  monthly: { bg: 'bg-violet-50',  text: 'text-violet-600' },
}

interface Props {
  value: RecurringType
  onChange: (val: RecurringType) => void
  darkMode?: boolean
}

export const RecurringBadge: React.FC<Props> = ({ value, onChange, darkMode }) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const c = BADGE[value]

  React.useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const panelBg = darkMode ? 'bg-gray-800 border-gray-700 shadow-xl' : 'bg-white border-gray-200 shadow-lg'
  const itemHover = darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="חזרתיות משימה"
        className={`flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded transition-colors ${c.bg} ${c.text} ${value === 'none' ? 'opacity-30 hover:opacity-60' : 'hover:opacity-80'}`}
      >
        <span>↻</span>
        {value !== 'none' && <span>{OPTIONS.find(o => o.value === value)?.label}</span>}
      </button>

      {open && (
        <div className={`absolute z-50 mt-1 w-32 rounded-lg border p-1 ${panelBg}`} style={{ top: '100%', right: 0 }}>
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center gap-2 text-right px-2 py-1.5 rounded text-xs transition-colors ${itemHover} ${value === opt.value ? 'font-semibold text-indigo-600' : ''}`}
            >
              <span className="text-sm leading-none">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
