import React from 'react'
import { Assignee, Status, Tag } from '../types'
import { TagBadge } from './TagBadge'

const assignees: Assignee[] = ['יהודה', 'אשתי', 'שנינו', 'ילדים']
const statuses: Status[] = ['לא התחיל', 'בתהליך', 'תקוע', 'הושלם']

interface Props {
  filterAssignee: Assignee | ''
  filterStatus: Status | ''
  filterTag: string
  searchQuery: string
  allTags: Tag[]
  darkMode?: boolean
  onAssigneeChange: (val: Assignee | '') => void
  onStatusChange: (val: Status | '') => void
  onTagChange: (tagId: string) => void
  onSearchChange: (q: string) => void
  onAddGroup: () => void
}

export const FilterBar: React.FC<Props> = ({
  filterAssignee, filterStatus, filterTag, searchQuery, allTags, darkMode,
  onAssigneeChange, onStatusChange, onTagChange, onSearchChange, onAddGroup,
}) => {
  const hasFilter = filterAssignee !== '' || filterStatus !== '' || filterTag !== '' || searchQuery !== ''

  const barBg = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const selectCls = darkMode
    ? 'text-xs border border-gray-600 rounded px-2 py-1 bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500'
    : 'text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400'
  const labelCls = darkMode ? 'text-xs text-gray-500' : 'text-xs text-gray-400'
  const searchCls = darkMode
    ? 'text-xs border border-gray-600 rounded-lg px-3 py-1 bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36'
    : 'text-xs border border-gray-200 rounded-lg px-3 py-1 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-36'
  const divider = <div className={`w-px h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

  return (
    <div className={`${barBg} border-b px-4 py-2 flex items-center gap-2.5 flex-wrap`}>
      {/* Search */}
      <div className="relative">
        <svg className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="חיפוש..."
          dir="rtl"
          className={`${searchCls} pr-7`}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm leading-none ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>×</button>
        )}
      </div>

      {divider}

      {/* Assignee */}
      <div className="flex items-center gap-1">
        <span className={labelCls}>אחראי:</span>
        <select value={filterAssignee} onChange={e => onAssigneeChange(e.target.value as Assignee | '')} className={selectCls} dir="rtl">
          <option value="">הכל</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1">
        <span className={labelCls}>סטטוס:</span>
        <select value={filterStatus} onChange={e => onStatusChange(e.target.value as Status | '')} className={selectCls} dir="rtl">
          <option value="">הכל</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <>
          {divider}
          <div className="flex items-center gap-1.5 flex-wrap">
            {allTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => onTagChange(filterTag === tag.id ? '' : tag.id)}
                className={`transition-all ${filterTag === tag.id ? 'ring-2 ring-indigo-500 ring-offset-1 rounded-full' : 'opacity-50 hover:opacity-100'}`}
                title={`סנן לפי: ${tag.label}`}
              >
                <TagBadge tag={tag} small />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Clear */}
      {hasFilter && (
        <button
          onClick={() => { onAssigneeChange(''); onStatusChange(''); onTagChange(''); onSearchChange('') }}
          className={`text-xs underline ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
        >
          נקה
        </button>
      )}

      <div className="flex-1" />

      {/* Add group */}
      <button
        onClick={onAddGroup}
        className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-3 py-1.5 rounded-lg transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        קבוצה
      </button>
    </div>
  )
}
