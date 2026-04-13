import React from 'react'
import { Status } from '../types'

const statusConfig: Record<Status, { bg: string; text: string; dot: string }> = {
  'לא התחיל': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  'בתהליך':   { bg: 'bg-blue-100',  text: 'text-blue-700',  dot: 'bg-blue-500' },
  'תקוע':     { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  'הושלם':    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
}

const allStatuses: Status[] = ['לא התחיל', 'בתהליך', 'תקוע', 'הושלם']

interface Props {
  value: Status
  onChange?: (val: Status) => void
  readonly?: boolean
}

export const StatusBadge: React.FC<Props> = ({ value, onChange, readonly }) => {
  const cfg = statusConfig[value]
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
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {value}
      </span>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${cfg.bg} ${cfg.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {value}
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]">
          {allStatuses.map(s => {
            const c = statusConfig[s]
            return (
              <button
                key={s}
                onClick={() => { onChange?.(s); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${s === value ? 'font-semibold' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                <span className={c.text}>{s}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
