import React from 'react'
import { Assignee, Status, Tag } from '../types'
import { TagBadge } from './TagBadge'

const assignees: Assignee[] = ['יהודה', 'אשתי', 'שנינו', 'ילדים']
const statuses: Status[]    = ['לא התחיל', 'בתהליך', 'תקוע', 'הושלם']

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

  const barBg    = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const inputBase = darkMode
    ? 'border border-gray-600 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
    : 'border border-gray-200 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300'
  const labelCls  = darkMode ? 'text-xs font-medium text-gray-500' : 'text-xs font-medium text-gray-400'
  const divider   = <div className={`w-px h-5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

  const searchField = (
    <div className="relative flex-1 min-w-0">
      <svg
        className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="חיפוש משימה..."
        dir="rtl"
        className={`w-full text-sm py-2 pr-9 pl-8 ${inputBase}`}
        aria-label="חיפוש משימות"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-base leading-none ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          aria-label="נקה חיפוש"
        >×</button>
      )}
    </div>
  )

  const addGroupBtn = (
    <button
      onClick={onAddGroup}
      className="flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-3 py-2 rounded-xl transition-colors touch-manipulation shrink-0"
      aria-label="הוסף קבוצה חדשה"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span>קבוצה</span>
    </button>
  )

  return (
    <div className={`${barBg} border-b`}>

      {/* ══ Mobile layout (< sm) ══════════════════════════════════════ */}
      <div className="sm:hidden px-3 pt-2 pb-2 space-y-1.5">
        {/* Row 1: search + add-group */}
        <div className="flex items-center gap-2">
          {searchField}
          {addGroupBtn}
        </div>

        {/* Row 2: filter selects + tags + clear */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterAssignee}
            onChange={e => onAssigneeChange(e.target.value as Assignee | '')}
            className={`text-sm py-1.5 px-2 max-w-[120px] ${inputBase}`}
            dir="rtl"
            aria-label="סנן לפי אחראי"
          >
            <option value="">כולם</option>
            {assignees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={e => onStatusChange(e.target.value as Status | '')}
            className={`text-sm py-1.5 px-2 max-w-[130px] ${inputBase}`}
            dir="rtl"
            aria-label="סנן לפי סטטוס"
          >
            <option value="">כל סטטוס</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {allTags.length > 0 && allTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => onTagChange(filterTag === tag.id ? '' : tag.id)}
              className={`transition-all touch-manipulation ${filterTag === tag.id ? 'ring-2 ring-indigo-500 ring-offset-1 rounded-full' : 'opacity-50 hover:opacity-100'}`}
              title={`סנן לפי: ${tag.label}`}
              aria-pressed={filterTag === tag.id}
            >
              <TagBadge tag={tag} small />
            </button>
          ))}

          {hasFilter && (
            <button
              onClick={() => { onAssigneeChange(''); onStatusChange(''); onTagChange(''); onSearchChange('') }}
              className={`text-sm font-medium underline touch-manipulation ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
              aria-label="נקה את כל הפילטרים"
            >
              נקה
            </button>
          )}
        </div>
      </div>

      {/* ══ Desktop layout (sm+) ══════════════════════════════════════ */}
      <div className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 flex-wrap">
        {searchField}

        {divider}

        {/* Assignee */}
        <div className="flex items-center gap-1.5">
          <span className={labelCls}>אחראי:</span>
          <select
            value={filterAssignee}
            onChange={e => onAssigneeChange(e.target.value as Assignee | '')}
            className={`text-sm py-2 px-3 ${inputBase}`}
            dir="rtl"
            aria-label="סנן לפי אחראי"
          >
            <option value="">הכל</option>
            {assignees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className={labelCls}>סטטוס:</span>
          <select
            value={filterStatus}
            onChange={e => onStatusChange(e.target.value as Status | '')}
            className={`text-sm py-2 px-3 ${inputBase}`}
            dir="rtl"
            aria-label="סנן לפי סטטוס"
          >
            <option value="">הכל</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <>
            {divider}
            <div className="flex items-center gap-1.5 flex-wrap">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => onTagChange(filterTag === tag.id ? '' : tag.id)}
                  className={`transition-all touch-manipulation ${filterTag === tag.id ? 'ring-2 ring-indigo-500 ring-offset-1 rounded-full' : 'opacity-50 hover:opacity-100'}`}
                  title={`סנן לפי: ${tag.label}`}
                  aria-pressed={filterTag === tag.id}
                >
                  <TagBadge tag={tag} small />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Clear filter */}
        {hasFilter && (
          <button
            onClick={() => { onAssigneeChange(''); onStatusChange(''); onTagChange(''); onSearchChange('') }}
            className={`text-sm font-medium underline touch-manipulation ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
            aria-label="נקה את כל הפילטרים"
          >
            נקה
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={onAddGroup}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-2 rounded-xl transition-colors touch-manipulation"
          aria-label="הוסף קבוצה חדשה"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>קבוצה</span>
        </button>
      </div>

    </div>
  )
}
