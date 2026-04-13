import React from 'react'
import { Group, Tag, Task, Status, Assignee, NewTaskDefaults } from '../types'
import { TaskRow } from './TaskRow'
import { AddTaskRow } from './AddTaskRow'

interface Props {
  group: Group
  filterAssignee: Assignee | ''
  filterStatus: Status | ''
  filterTag: string
  searchQuery: string
  allTags: Tag[]
  darkMode?: boolean
  onToggleCollapse: (id: string) => void
  onUpdateTask: (groupId: string, taskId: string, patch: Partial<Task>) => void
  onDeleteTask: (groupId: string, taskId: string) => void
  onAddTask: (groupId: string, title: string, defaults?: NewTaskDefaults) => void
  onDeleteGroup: (id: string) => void
  onRenameGroup: (id: string, title: string) => void
  onReorderTasks: (groupId: string, tasks: Task[]) => void
  onCreateTag?: (tag: Tag) => void
  onTaskComplete?: (taskId: string, originX: number) => void
}

const colorMap: Record<string, { bg: string; text: string; border: string; dot: string; header: string; darkHeader: string; darkText: string }> = {
  purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-400', dot: 'bg-purple-500', header: 'bg-purple-100', darkHeader: 'bg-purple-900/30', darkText: 'text-purple-300' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-400',   dot: 'bg-blue-500',   header: 'bg-blue-100',   darkHeader: 'bg-blue-900/30',   darkText: 'text-blue-300' },
  green:  { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-400',  dot: 'bg-green-500',  header: 'bg-green-100',  darkHeader: 'bg-green-900/30',  darkText: 'text-green-300' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-400', dot: 'bg-orange-500', header: 'bg-orange-100', darkHeader: 'bg-orange-900/30', darkText: 'text-orange-300' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-800',   border: 'border-teal-400',   dot: 'bg-teal-500',   header: 'bg-teal-100',   darkHeader: 'bg-teal-900/30',   darkText: 'text-teal-300' },
  red:    { bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-400',    dot: 'bg-red-500',    header: 'bg-red-100',    darkHeader: 'bg-red-900/30',    darkText: 'text-red-300' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-800',   border: 'border-pink-400',   dot: 'bg-pink-500',   header: 'bg-pink-100',   darkHeader: 'bg-pink-900/30',   darkText: 'text-pink-300' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-400', dot: 'bg-indigo-500', header: 'bg-indigo-100', darkHeader: 'bg-indigo-900/30', darkText: 'text-indigo-300' },
}

const COLUMN_HEADERS = [
  { label: 'שם משימה', className: 'flex-1 min-w-0' },
  { label: 'אחראי',     className: 'w-12 text-center' },
  { label: 'סטטוס',     className: 'w-30 text-center' },
  { label: 'עדיפות',    className: 'w-20 text-center' },
  { label: 'יעד',       className: 'w-26 hidden sm:block' },
  { label: 'תגיות',     className: 'w-20 hidden lg:block' },
  { label: 'חזרה',      className: 'w-16 hidden xl:block' },
  { label: 'הערות',     className: 'w-36 hidden lg:block' },
]

export const BoardGroup: React.FC<Props> = ({
  group, filterAssignee, filterStatus, filterTag, searchQuery, allTags, darkMode,
  onToggleCollapse, onUpdateTask, onDeleteTask, onAddTask, onDeleteGroup, onRenameGroup,
  onReorderTasks, onCreateTag, onTaskComplete,
}) => {
  const colors = colorMap[group.color] ?? colorMap.indigo
  const [editingTitle, setEditingTitle] = React.useState(false)
  const [titleDraft, setTitleDraft] = React.useState(group.title)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [dragOverId, setDragOverId] = React.useState<string | null>(null)
  const dragTaskId = React.useRef<string | null>(null)
  const titleRef = React.useRef<HTMLInputElement>(null)

  const headerBg = darkMode ? colors.darkHeader : colors.header
  const headerText = darkMode ? colors.darkText : colors.text

  const filteredTasks = group.tasks
    .filter(t => {
      if (filterAssignee && t.assignee !== filterAssignee) return false
      if (filterStatus && t.status !== filterStatus) return false
      if (filterTag && !(t.tags ?? []).includes(filterTag)) return false
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.notes?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => a.order - b.order)

  const doneCount = filteredTasks.filter(t => t.status === 'הושלם').length

  const commitTitle = () => {
    setEditingTitle(false)
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== group.title) onRenameGroup(group.id, trimmed)
    else setTitleDraft(group.title)
  }

  // ── Drag & Drop within group ──────────────────────────────────
  const handleDragStart = (taskId: string) => { dragTaskId.current = taskId }
  const handleDragOver = (targetId: string) => { setDragOverId(targetId) }
  const handleDragEnd = () => {
    const fromId = dragTaskId.current
    const toId = dragOverId
    dragTaskId.current = null
    setDragOverId(null)

    if (!fromId || !toId || fromId === toId) return

    const tasks = [...group.tasks].sort((a, b) => a.order - b.order)
    const fromIdx = tasks.findIndex(t => t.id === fromId)
    const toIdx = tasks.findIndex(t => t.id === toId)
    if (fromIdx < 0 || toIdx < 0) return

    const reordered = [...tasks]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    onReorderTasks(group.id, reordered.map((t, i) => ({ ...t, order: i })))
  }

  const bodyBg = darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'

  return (
    <article aria-label={`קבוצת משימות: ${group.title}`} className="mb-5" role="listitem">
      {/* Group Header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg ${headerBg} border-b ${darkMode ? 'border-gray-700' : colors.border}`}>
        <button
          onClick={() => onToggleCollapse(group.id)}
          aria-expanded={!group.collapsed}
          aria-controls={`group-body-${group.id}`}
          aria-label={group.collapsed ? `הרחב קבוצה: ${group.title}` : `כווץ קבוצה: ${group.title}`}
          className={`w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 transition-transform duration-200 ${group.collapsed ? '-rotate-90' : ''}`}
        >
          <svg className={`w-3.5 h-3.5 ${headerText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`w-3 h-3 rounded-full ${colors.dot} shrink-0`} />

        {editingTitle ? (
          <input
            ref={titleRef}
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={e => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(group.title) }
            }}
            autoFocus
            dir="rtl"
            className={`text-sm font-bold ${headerText} bg-white/20 border border-white/40 rounded px-1 focus:outline-none min-w-0 flex-1 max-w-[200px]`}
          />
        ) : (
          <h3
            className={`text-sm font-bold ${headerText} cursor-pointer hover:opacity-70`}
            onDoubleClick={() => { setEditingTitle(true); setTitleDraft(group.title) }}
            title="לחץ פעמיים לשינוי שם"
          >
            {group.title}
          </h3>
        )}

        <span className={`text-xs font-medium ${headerText} opacity-70`}>
          {doneCount}/{filteredTasks.length}
          {(filterAssignee || filterStatus) && group.tasks.length !== filteredTasks.length && (
            <span className="opacity-50"> (מ-{group.tasks.length})</span>
          )}
        </span>

        <div className="flex-1" />

        {confirmDelete ? (
          <div className="flex items-center gap-1 text-xs" role="alertdialog" aria-label={`אישור מחיקת קבוצה ${group.title}`}>
            <span className="text-red-500 font-medium">מחק?</span>
            <button onClick={() => onDeleteGroup(group.id)} aria-label="אשר מחיקה" className="text-red-500 hover:text-red-700 font-semibold px-1">כן</button>
            <button onClick={() => setConfirmDelete(false)} aria-label="בטל מחיקה" className={`px-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>לא</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label={`מחק קבוצה ${group.title}`}
            className={`${headerText} opacity-30 hover:opacity-70 transition-opacity`}
            title="מחק קבוצה"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      {!group.collapsed && (
        <div id={`group-body-${group.id}`} className={`border-x border-b rounded-b-lg ${bodyBg}`}>
          {/* Column headers */}
          <div className={`flex items-center px-1 py-1.5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`w-1 self-stretch border-r-2 ${colors.border} opacity-20`} />
            <div className="w-5 shrink-0" />
            <div className="w-7 shrink-0" />
            {COLUMN_HEADERS.map(col => (
              <div key={col.label} className={`${col.className} px-1`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{col.label}</span>
              </div>
            ))}
            <div className="w-8 shrink-0" />
          </div>

          {filteredTasks.length === 0 ? (
            <div className={`px-4 py-4 text-sm text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {filterAssignee || filterStatus || filterTag || searchQuery ? 'אין משימות תואמות' : 'אין משימות בקבוצה זו'}
            </div>
          ) : (
            filteredTasks.map((task, idx) => (
              <div
                key={task.id}
                className={`transition-all duration-100 ${dragOverId === task.id && dragTaskId.current !== task.id ? 'border-t-2 border-indigo-400' : ''}`}
              >
                <TaskRow
                  task={task}
                  groupColor={group.color}
                  index={idx}
                  allTags={allTags}
                  darkMode={darkMode}
                  onUpdate={(taskId, patch) => onUpdateTask(group.id, taskId, patch)}
                  onDelete={taskId => onDeleteTask(group.id, taskId)}
                  onCreateTag={onCreateTag}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onComplete={onTaskComplete}
                />
              </div>
            ))
          )}

          <AddTaskRow
            groupColor={group.color}
            darkMode={darkMode}
            onAdd={title => onAddTask(group.id, title)}
          />
        </div>
      )}

      {group.collapsed && (
        <button
          className={`w-full flex items-center gap-2 px-4 py-2 border border-t-0 rounded-b-lg cursor-pointer transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
          onClick={() => onToggleCollapse(group.id)}
          aria-label={`הרחב קבוצה ${group.title}: ${filteredTasks.length} משימות, ${doneCount} הושלמו`}
        >
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
            {filteredTasks.length} משימות • {doneCount} הושלמו
          </span>
        </button>
      )}
    </article>
  )
}
