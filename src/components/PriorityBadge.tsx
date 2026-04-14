import React from 'react'
import { Priority } from '../types'

const priorityConfig: Record<Priority, {
  bg: string; text: string; border: string
  darkBg: string; darkText: string; darkBorder: string
  icon: string
}> = {
  'נמוך':   { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300',  darkBg: 'bg-green-900/40',  darkText: 'text-green-300',  darkBorder: 'border-green-700',  icon: '▽' },
  'בינוני': { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-300',  darkBg: 'bg-amber-900/40',  darkText: 'text-amber-300',  darkBorder: 'border-amber-700',  icon: '◇' },
  'גבוה':   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300',    darkBg: 'bg-red-900/40',    darkText: 'text-red-300',    darkBorder: 'border-red-700',    icon: '△' },
}

const allPriorities: Priority[] = ['נמוך', 'בינוני', 'גבוה']

interface Props {
  value: Priority
  onChange?: (val: Priority) => void
  readonly?: boolean
  darkMode?: boolean
}

export const PriorityBadge: React.FC<Props> = ({ value, onChange, readonly, darkMode }) => {
  const cfg = priorityConfig[value]
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

  const badgeClass = `inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${
    darkMode ? `${cfg.darkBg} ${cfg.darkText} ${cfg.darkBorder}` : `${cfg.bg} ${cfg.text} ${cfg.border}`
  }`

  if (readonly) {
    return (
      <span className={badgeClass}>
        <span className="text-[10px]">{cfg.icon}</span>
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
        <span className="text-[10px]">{cfg.icon}</span>
        {value}
      </button>
      {open && (
        <div
          role="listbox"
          className={`absolute top-full mt-1.5 right-0 z-50 border rounded-xl shadow-xl py-1 min-w-[120px] ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {allPriorities.map(p => {
            const c = priorityConfig[p]
            return (
              <button
                key={p}
                role="option"
                aria-selected={p === value}
                onClick={() => { onChange?.(p); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  darkMode
                    ? `hover:bg-gray-700 ${p === value ? 'bg-gray-700 font-semibold' : ''}`
                    : `hover:bg-gray-50 ${p === value ? 'bg-gray-50 font-semibold' : ''}`
                }`}
              >
                <span className={`text-sm ${darkMode ? c.darkText : c.text}`}>{c.icon}</span>
                <span className={darkMode ? c.darkText : c.text}>{p}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
