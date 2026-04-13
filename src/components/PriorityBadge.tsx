import React from 'react'
import { Priority } from '../types'

const priorityConfig: Record<Priority, { bg: string; text: string; border: string }> = {
  'נמוך':  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300' },
  'בינוני': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  'גבוה':  { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300' },
}

const allPriorities: Priority[] = ['נמוך', 'בינוני', 'גבוה']

interface Props {
  value: Priority
  onChange?: (val: Priority) => void
  readonly?: boolean
}

export const PriorityBadge: React.FC<Props> = ({ value, onChange, readonly }) => {
  const cfg = priorityConfig[value]
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (readonly) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
        {value}
      </span>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${cfg.bg} ${cfg.text} ${cfg.border}`}
      >
        {value}
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[100px]">
          {allPriorities.map(p => {
            const c = priorityConfig[p]
            return (
              <button
                key={p}
                onClick={() => { onChange?.(p); setOpen(false) }}
                className={`w-full flex items-center px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${p === value ? 'font-semibold' : ''}`}
              >
                <span className={`${c.text}`}>{p}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
