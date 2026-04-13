import React from 'react'
import { Tag } from '../types'
import { TagBadge, TAG_COLORS, TAG_COLOR_LABELS } from './TagBadge'

interface Props {
  allTags: Tag[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onCreateTag?: (tag: Tag) => void
  darkMode?: boolean
}

function genId() { return 'tag-' + Math.random().toString(36).slice(2, 9) }

export const TagPicker: React.FC<Props> = ({ allTags, selectedIds, onChange, onCreateTag, darkMode }) => {
  const [open, setOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [newLabel, setNewLabel] = React.useState('')
  const [newColor, setNewColor] = React.useState('sky')
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])
  }

  const createTag = () => {
    const label = newLabel.trim()
    if (!label || !onCreateTag) return
    const tag: Tag = { id: genId(), label, color: newColor }
    onCreateTag(tag)
    onChange([...selectedIds, tag.id])
    setNewLabel('')
    setCreating(false)
  }

  const selected = allTags.filter(t => selectedIds.includes(t.id))

  const panelBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const itemHover = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
  const labelText = darkMode ? 'text-gray-300' : 'text-gray-700'
  const inputCls = darkMode
    ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500'
    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1 flex-wrap">
        {selected.map(t => (
          <TagBadge key={t.id} tag={t} onRemove={() => toggle(t.id)} small />
        ))}
        <button
          onClick={() => setOpen(o => !o)}
          className={`text-[10px] px-1.5 py-0.5 rounded border border-dashed transition-colors ${darkMode ? 'border-gray-600 text-gray-400 hover:border-gray-400' : 'border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500'}`}
        >
          + תגית
        </button>
      </div>

      {open && (
        <div className={`absolute z-50 mt-1 w-48 rounded-lg shadow-lg border p-1.5 ${panelBg}`} style={{ top: '100%', right: 0 }}>
          <div className={`text-[11px] font-semibold px-1.5 py-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            תגיות
          </div>
          {allTags.length === 0 && !creating && (
            <div className={`text-[11px] px-1.5 py-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>אין תגיות עדיין</div>
          )}
          {allTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => toggle(tag.id)}
              className={`w-full flex items-center gap-2 px-1.5 py-1 rounded text-right transition-colors ${itemHover}`}
            >
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${selectedIds.includes(tag.id) ? 'ring-2 ring-indigo-400' : ''}`}
                style={{ backgroundColor: tag.color === 'rose' ? '#fda4af' : tag.color === 'sky' ? '#7dd3fc' : tag.color === 'amber' ? '#fcd34d' : tag.color === 'emerald' ? '#6ee7b7' : tag.color === 'violet' ? '#c4b5fd' : tag.color === 'pink' ? '#f9a8d4' : tag.color === 'teal' ? '#5eead4' : '#94a3b8' }} />
              <span className={`text-[11px] flex-1 text-right ${labelText}`}>{tag.label}</span>
              {selectedIds.includes(tag.id) && <span className="text-indigo-500 text-xs">✓</span>}
            </button>
          ))}

          {onCreateTag && (
            creating ? (
              <div className="mt-1 px-1 space-y-1">
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createTag(); if (e.key === 'Escape') setCreating(false) }}
                  placeholder="שם תגית..."
                  autoFocus
                  dir="rtl"
                  className={`w-full text-[11px] border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300 ${inputCls}`}
                />
                <div className="flex gap-1 flex-wrap">
                  {TAG_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      title={TAG_COLOR_LABELS[c]}
                      className={`w-4 h-4 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                      style={{ backgroundColor: c === 'rose' ? '#fda4af' : c === 'sky' ? '#7dd3fc' : c === 'amber' ? '#fcd34d' : c === 'emerald' ? '#6ee7b7' : c === 'violet' ? '#c4b5fd' : c === 'pink' ? '#f9a8d4' : c === 'teal' ? '#5eead4' : '#94a3b8' }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={createTag} className="flex-1 text-[11px] bg-indigo-600 text-white rounded py-0.5 hover:bg-indigo-700">
                    צור
                  </button>
                  <button onClick={() => setCreating(false)} className="flex-1 text-[11px] text-gray-500 rounded py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700">
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className={`w-full text-right text-[11px] px-1.5 py-1 rounded mt-0.5 transition-colors ${itemHover} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                + תגית חדשה
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
