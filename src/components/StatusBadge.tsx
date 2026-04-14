import React from 'react'
import { Status } from '../types'

const statusConfig: Record<Status, { bg: string; text: string; dot: string; darkBg: string; darkText: string }> = {
  'לא התחיל': { bg: 'bg-gray-100',    text: 'text-gray-700',   dot: 'bg-gray-400',   darkBg: 'bg-gray-700',    darkText: 'text-gray-300'   },
  'בתהליך':   { bg: 'bg-blue-100',    text: 'text-blue-800',   dot: 'bg-blue-500',   darkBg: 'bg-blue-900/50', darkText: 'text-blue-300'   },
  'תקוע':     { bg: 'bg-orange-100',  text: 'text-orange-800', dot: 'bg-orange-500', darkBg: 'bg-orange-900/50', darkText: 'text-orange-300' },
  'הושלם':    { bg: 'bg-green-100',   text: 'text-green-800',  dot: 'bg-green-500',  darkBg: 'bg-green-900/50', darkText: 'text-green-300'  },
}

const allStatuses: Status[] = ['לא התחיל', 'בתהליך', 'תקוע', 'הושלם']

interface Props {
  value: Status
  onChange?: (val: Status) => void
  readonly?: boolean
  darkMode?: boolean
}

export const StatusBadge: React.FC<Props> = ({ value, onChange, readonly, darkMode }) => {
  const cfg = statusConfig[value]
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const badgeClass = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
    darkMode ? `${cfg.darkBg} ${cfg.darkText}` : `${cfg.bg} ${cfg.text}`
  }`

  if (readonly) {
    return (
      <span className={badgeClass}>
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        {value}
      </span>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${badgeClass} cursor-pointer hover:opacity-85 active:opacity-70 transition-opacity touch-manipulation`}
      >
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        {value}
      </button>
      {open && (
        <div
          role="listbox"
          className={`absolute top-full mt-1.5 right-0 z-50 border rounded-xl shadow-xl py-1 min-w-[140px] ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {allStatuses.map(s => {
            const c = statusConfig[s]
            return (
              <button
                key={s}
                role="option"
                aria-selected={s === value}
                onClick={() => { onChange?.(s); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  darkMode
                    ? `hover:bg-gray-700 ${s === value ? 'bg-gray-700 font-semibold' : ''}`
                    : `hover:bg-gray-50 ${s === value ? 'bg-gray-50 font-semibold' : ''}`
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                <span className={darkMode ? c.darkText : c.text}>{s}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
