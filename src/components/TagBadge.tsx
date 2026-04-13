import React from 'react'
import { Tag } from '../types'

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  rose:    { bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200' },
  sky:     { bg: 'bg-sky-100',     text: 'text-sky-700',     border: 'border-sky-200' },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  violet:  { bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-200' },
  pink:    { bg: 'bg-pink-100',    text: 'text-pink-700',    border: 'border-pink-200' },
  slate:   { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200' },
  teal:    { bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-200' },
}

export const TAG_COLORS = Object.keys(colorMap)

export const TAG_COLOR_LABELS: Record<string, string> = {
  rose: 'אדום', sky: 'כחול', amber: 'כתום', emerald: 'ירוק',
  violet: 'סגול', pink: 'ורוד', slate: 'אפור', teal: 'טורקיז',
}

interface Props {
  tag: Tag
  onRemove?: () => void
  small?: boolean
}

export const TagBadge: React.FC<Props> = ({ tag, onRemove, small }) => {
  const c = colorMap[tag.color] ?? colorMap.slate
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 ${small ? 'py-px text-[10px]' : 'py-0.5 text-xs'} font-medium ${c.bg} ${c.text} ${c.border}`}>
      {tag.label}
      {onRemove && (
        <button onClick={onRemove} className={`ml-0.5 hover:opacity-70 ${c.text} leading-none`}>×</button>
      )}
    </span>
  )
}
