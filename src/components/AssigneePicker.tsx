import React from 'react'
import { Assignee } from '../types'

const assignees: Assignee[] = ['יהודה', 'אשתי', 'שנינו', 'ילדים', '']

const avatarColors: Record<string, string> = {
  'יהודה': 'bg-indigo-500',
  'אשתי': 'bg-pink-500',
  'שנינו': 'bg-purple-500',
  'ילדים': 'bg-amber-500',
}

export function getInitial(name: Assignee): string {
  if (!name) return '?'
  return name[0]
}

interface Props {
  value: Assignee
  onChange?: (val: Assignee) => void
  readonly?: boolean
  darkMode?: boolean
}

export const AssigneePicker: React.FC<Props> = ({ value, onChange, readonly, darkMode }) => {
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

  const avatar = (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${value ? avatarColors[value] : 'bg-gray-300'}`}>
      {value ? getInitial(value) : '—'}
    </div>
  )

  if (readonly) return avatar

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="hover:opacity-80 transition-opacity" title={value || 'לא שויך'}>
        {avatar}
      </button>
      {open && (
        <div className={`absolute top-full mt-1 right-0 z-50 border rounded-lg shadow-lg py-1 min-w-[120px] ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {assignees.map(a => (
            <button
              key={a || 'none'}
              onClick={() => { onChange?.(a); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                darkMode
                  ? `hover:bg-gray-700 ${a === value ? 'font-semibold bg-gray-700' : ''}`
                  : `hover:bg-gray-50 ${a === value ? 'font-semibold bg-gray-50' : ''}`
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${a ? avatarColors[a] : 'bg-gray-300'}`}>
                {a ? a[0] : '—'}
              </div>
              <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>{a || 'לא שויך'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
