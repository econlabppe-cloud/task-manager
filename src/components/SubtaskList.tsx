import React from 'react'
import { Subtask } from '../types'

interface Props {
  subtasks: Subtask[]
  onChange: (subtasks: Subtask[]) => void
  darkMode?: boolean
}

function genId() {
  return 'st-' + Math.random().toString(36).slice(2, 9)
}

export const SubtaskList: React.FC<Props> = ({ subtasks, onChange, darkMode }) => {
  const [adding, setAdding] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 0)
  }, [adding])

  const toggle = (id: string) => {
    onChange(subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s))
  }

  const remove = (id: string) => {
    onChange(subtasks.filter(s => s.id !== id))
  }

  const addSubtask = () => {
    const trimmed = draft.trim()
    if (!trimmed) { setAdding(false); return }
    onChange([...subtasks, { id: genId(), title: trimmed, done: false }])
    setDraft('')
    // keep input open for more subtasks
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const doneCount = subtasks.filter(s => s.done).length
  const total = subtasks.length

  const textBase = darkMode ? 'text-gray-300' : 'text-gray-600'
  const mutedBase = darkMode ? 'text-gray-500' : 'text-gray-400'
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400'

  return (
    <div className="mt-1 space-y-0.5">
      {subtasks.map(s => (
        <div key={s.id} className="flex items-center gap-1.5 group/sub">
          <button
            onClick={() => toggle(s.id)}
            className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
              s.done ? 'bg-green-500 border-green-500' : darkMode ? 'border-gray-500 hover:border-green-400' : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {s.done && (
              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <span className={`text-[11px] flex-1 ${s.done ? `line-through ${mutedBase}` : textBase}`}>
            {s.title}
          </span>
          <button
            onClick={() => remove(s.id)}
            className={`opacity-0 group-hover/sub:opacity-100 w-3 h-3 flex items-center justify-center ${mutedBase} hover:text-red-400 transition-opacity`}
          >
            ×
          </button>
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-3.5 h-3.5 rounded border border-dashed border-gray-300 flex-shrink-0" />
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addSubtask() }
              if (e.key === 'Escape') { setAdding(false); setDraft('') }
            }}
            onBlur={() => { addSubtask(); setAdding(false) }}
            placeholder="תת-משימה..."
            dir="rtl"
            className={`text-[11px] flex-1 border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300 ${inputBg}`}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className={`flex items-center gap-1 text-[11px] ${mutedBase} hover:text-indigo-500 transition-colors mt-0.5`}
        >
          <span className="text-base leading-none">+</span>
          <span>הוסף תת-משימה</span>
          {total > 0 && (
            <span className="mr-1 opacity-60">({doneCount}/{total})</span>
          )}
        </button>
      )}
    </div>
  )
}
