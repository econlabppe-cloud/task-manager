import React from 'react'

interface Props {
  groupColor: string
  darkMode?: boolean
  onAdd: (title: string) => void
}

const colorBorder: Record<string, string> = {
  purple: 'border-purple-400',
  blue:   'border-blue-400',
  green:  'border-green-400',
  orange: 'border-orange-400',
  teal:   'border-teal-400',
  red:    'border-red-400',
  pink:   'border-pink-400',
  indigo: 'border-indigo-400',
}

export const AddTaskRow: React.FC<Props> = ({ groupColor, darkMode, onAdd }) => {
  const [adding, setAdding] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const start = () => {
    setAdding(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commit = () => {
    const t = title.trim()
    if (t) {
      onAdd(t)
      setTitle('')
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setAdding(false)
      setTitle('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') { setAdding(false); setTitle('') }
  }

  const borderClass  = colorBorder[groupColor] ?? 'border-gray-400'
  const borderTop    = darkMode ? 'border-gray-700' : 'border-gray-100'
  const btnTextClass = darkMode
    ? 'text-gray-500 hover:text-indigo-400 hover:bg-gray-700'
    : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
  const inputCls = darkMode
    ? 'flex-1 text-[15px] border border-indigo-500 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-700 text-gray-100 placeholder-gray-500'
    : 'flex-1 text-[15px] border border-indigo-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-800 placeholder-gray-400'

  if (!adding) {
    return (
      <div className="flex">
        <div className={`w-1 self-stretch border-r-2 ${borderClass} opacity-0`} />
        <button
          onClick={start}
          className={`flex items-center gap-2 text-sm px-4 py-3.5 transition-colors w-full touch-manipulation ${btnTextClass}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          הוסף משימה
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center border-t ${borderTop}`}>
      <div className={`w-1 self-stretch border-r-2 ${borderClass}`} />
      <div className="flex-1 flex items-center gap-2 px-3 py-2.5">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder="שם המשימה..."
          dir="rtl"
          className={inputCls}
        />
        <button
          onMouseDown={e => { e.preventDefault(); commit() }}
          className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-2.5 rounded-lg transition-colors touch-manipulation"
        >
          הוסף
        </button>
        <button
          onMouseDown={() => { setAdding(false); setTitle('') }}
          className={`text-sm px-2 py-2.5 transition-colors touch-manipulation ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
        >
          ביטול
        </button>
      </div>
    </div>
  )
}
