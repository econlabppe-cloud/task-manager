import React from 'react'

interface Props {
  value: string
  onChange?: (val: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  darkMode?: boolean
}

export const TaskCell: React.FC<Props> = ({ value, onChange, placeholder, className = '', multiline, darkMode }) => {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (editing) {
      setDraft(value)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [editing, value])

  const commit = () => {
    setEditing(false)
    if (draft !== value) onChange?.(draft)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) commit()
    if (e.key === 'Escape') { setDraft(value); setEditing(false) }
  }

  const editBg = darkMode ? 'bg-gray-700 border-indigo-500 text-gray-100' : 'bg-white border-indigo-400 text-gray-800'
  const viewText = darkMode ? 'text-gray-100 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-50'
  const placeholderCls = darkMode ? 'text-gray-600' : 'text-gray-300'

  if (editing) {
    const sharedProps = {
      ref: inputRef as React.RefObject<HTMLInputElement>,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKeyDown,
      className: `w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 ${editBg} ${className}`,
      dir: 'rtl' as const,
    }
    if (multiline) {
      return <textarea {...sharedProps} ref={inputRef as React.RefObject<HTMLTextAreaElement>} rows={2} className={`${sharedProps.className} resize-none`} />
    }
    return <input {...sharedProps} type="text" />
  }

  return (
    <div
      onClick={() => onChange && setEditing(true)}
      className={`text-sm px-1 py-1 rounded cursor-text min-h-[28px] ${onChange ? viewText : ''} ${className}`}
      title={onChange ? 'לחץ לעריכה' : undefined}
    >
      {value || <span className={`text-xs ${placeholderCls}`}>{placeholder}</span>}
    </div>
  )
}
