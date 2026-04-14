import React from 'react'
import { Tag, Task } from '../types'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { AssigneePicker } from './AssigneePicker'
import { TaskCell } from './TaskCell'
import { SubtaskList } from './SubtaskList'
import { TagBadge } from './TagBadge'
import { TagPicker } from './TagPicker'
import { RecurringBadge } from './RecurringBadge'

const REACTION_EMOJIS = ['⭐', '🙏', '👏', '💪', '❤️']

interface Props {
  task: Task
  groupColor: string
  index: number
  allTags: Tag[]
  darkMode?: boolean
  onUpdate: (id: string, patch: Partial<Task>) => void
  onDelete: (id: string) => void
  onCreateTag?: (tag: Tag) => void
  onDragStart?: (taskId: string) => void
  onDragOver?: (taskId: string) => void
  onDragEnd?: () => void
  onComplete?: (taskId: string, originX: number) => void
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

/** Format YYYY-MM-DD → "15 ינו" */
function fmtDate(s: string): string {
  return new Date(s + 'T12:00:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

export const TaskRow: React.FC<Props> = ({
  task, groupColor, index, allTags, darkMode,
  onUpdate, onDelete, onCreateTag,
  onDragStart, onDragOver, onDragEnd, onComplete,
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [showReactions, setShowReactions] = React.useState(false)
  const [justDone, setJustDone] = React.useState(false)
  const mobileCheckRef = React.useRef<HTMLButtonElement>(null)
  const borderClass = colorBorder[groupColor] ?? 'border-gray-400'

  const rowBg = darkMode
    ? index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/60'
    : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
  const hoverBg = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-indigo-50/20'
  const textMain  = darkMode ? 'text-gray-100' : 'text-gray-800'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const borderRow = darkMode ? 'border-gray-700' : 'border-gray-100'

  const isOverdue = task.dueDate && task.status !== 'הושלם'
    ? new Date(task.dueDate) < new Date(new Date().toDateString())
    : false

  const subtasksDone  = task.subtasks?.filter(s => s.done).length ?? 0
  const subtasksTotal = task.subtasks?.length ?? 0

  // ── Drag ─────────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    setDragging(true)
    onDragStart?.(task.id)
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver?.(task.id)
  }
  const handleDragEnd = () => { setDragging(false); onDragEnd?.() }

  // ── Check / complete ──────────────────────────────────────────────────────
  const handleCheck = (ref?: React.RefObject<HTMLButtonElement | null>) => {
    const completing = task.status !== 'הושלם'
    onUpdate(task.id, {
      status: completing ? 'הושלם' : 'לא התחיל',
      completedAt: completing ? new Date().toISOString() : undefined,
    })
    if (completing) {
      setJustDone(true)
      setTimeout(() => setJustDone(false), 600)
      const rect = ref?.current?.getBoundingClientRect()
      onComplete?.(task.id, (rect && rect.width > 0) ? rect.left + rect.width / 2 : window.innerWidth / 2)
    }
  }

  // ── Shared checkbox visual ────────────────────────────────────────────────
  const CheckIcon = ({ size }: { size: 'sm' | 'lg' }) => (
    <span
      className={`flex items-center justify-center rounded border-2 transition-all
        ${size === 'lg' ? 'w-6 h-6' : 'w-[18px] h-[18px]'}
        ${justDone ? 'task-done-flash' : ''}
        ${task.status === 'הושלם'
          ? 'bg-green-500 border-green-500'
          : darkMode ? 'border-gray-500 hover:border-green-400' : 'border-gray-300 hover:border-green-400'
        }`}
    >
      {task.status === 'הושלם' && (
        <svg className={size === 'lg' ? 'w-3.5 h-3.5 text-white' : 'w-2.5 h-2.5 text-white'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE CARD  (below sm — hidden on desktop)
  // ════════════════════════════════════════════════════════════════════════════
  const mobileCard = (
    <div className={`sm:hidden flex items-start border-t transition-colors ${borderRow} ${rowBg} ${dragging ? 'opacity-40' : ''}`}>
      {/* Color stripe */}
      <div className={`w-1.5 self-stretch border-r-2 ${borderClass} shrink-0`} />

      {/* Touch-target checkbox (44px) */}
      <button
        ref={mobileCheckRef}
        onClick={() => handleCheck(mobileCheckRef)}
        className="w-11 flex items-start justify-center pt-3.5 shrink-0 touch-manipulation"
        aria-label={task.status === 'הושלם' ? 'סמן כלא הושלם' : 'סמן כהושלם'}
      >
        <CheckIcon size="lg" />
      </button>

      {/* Content area */}
      <div className={`flex-1 min-w-0 py-3 pr-1 ${task.status === 'הושלם' ? 'opacity-55' : ''}`}>
        {/* Title */}
        <TaskCell
          value={task.title}
          onChange={val => onUpdate(task.id, { title: val })}
          placeholder="שם המשימה..."
          className={`!text-[15px] font-medium leading-snug ${task.status === 'הושלם' ? 'line-through' : ''} ${textMain}`}
          darkMode={darkMode}
        />

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {task.dueDate && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${isOverdue ? 'text-red-500' : textMuted}`}>
              {isOverdue && '⚠ '}
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {fmtDate(task.dueDate)}
            </span>
          )}
          <AssigneePicker value={task.assignee} onChange={val => onUpdate(task.id, { assignee: val })} darkMode={darkMode} />
          <StatusBadge value={task.status} onChange={val => onUpdate(task.id, { status: val })} />
          {task.priority !== 'בינוני' && (
            <PriorityBadge value={task.priority} onChange={val => onUpdate(task.id, { priority: val })} />
          )}
          {(task.tags ?? []).slice(0, 2).map(tagId => {
            const tag = allTags.find(t => t.id === tagId)
            return tag ? <TagBadge key={tagId} tag={tag} small /> : null
          })}
        </div>

        {/* Subtasks */}
        {subtasksTotal > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className={`mt-2 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span>תת-משימות {subtasksDone}/{subtasksTotal}</span>
            <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        {expanded && (
          <SubtaskList subtasks={task.subtasks ?? []} onChange={subs => onUpdate(task.id, { subtasks: subs })} darkMode={darkMode} />
        )}

        {/* Reactions (always visible on mobile) */}
        {Object.entries(task.reactions ?? {}).filter(([, c]) => c > 0).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(task.reactions ?? {}).filter(([, c]) => c > 0).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => {
                  const curr = task.reactions ?? {}
                  onUpdate(task.id, { reactions: { ...curr, [emoji]: Math.max(0, (curr[emoji] ?? 0) - 1) } })
                }}
                className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200"
              >
                {emoji}<span className="text-amber-700 font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className={`w-10 pt-4 flex justify-center transition-colors touch-manipulation shrink-0 ${darkMode ? 'text-gray-600 active:text-red-400' : 'text-gray-300 active:text-red-500'}`}
        aria-label={`מחק: ${task.title}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // DESKTOP ROW  (sm+ — hidden on mobile)
  // ════════════════════════════════════════════════════════════════════════════
  const desktopRow = (
    <div className={`hidden sm:flex items-start min-h-[44px] border-t group transition-colors ${borderRow} ${rowBg} ${hoverBg} ${dragging ? 'opacity-40' : ''}`}>
      {/* Color indicator */}
      <div className={`w-1 self-stretch border-r-2 ${borderClass} shrink-0`} />

      {/* Drag handle */}
      <div className="w-5 self-center flex justify-center opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing shrink-0">
        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>

      {/* Checkbox */}
      <div className="w-8 flex justify-center items-center self-center shrink-0">
        <button
          onClick={() => handleCheck()}
          className="flex items-center justify-center"
          aria-label={task.status === 'הושלם' ? 'סמן כלא הושלם' : 'סמן כהושלם'}
        >
          <CheckIcon size="sm" />
        </button>
      </div>

      {/* Title + subtasks + tags */}
      <div className={`flex-1 min-w-0 px-1 py-2.5 ${task.status === 'הושלם' ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-1.5 flex-wrap">
          <div className="flex-1 min-w-0">
            <TaskCell
              value={task.title}
              onChange={val => onUpdate(task.id, { title: val })}
              placeholder="שם המשימה..."
              className={`text-sm font-medium ${task.status === 'הושלם' ? 'line-through' : ''} ${textMain}`}
              darkMode={darkMode}
            />
          </div>

          {subtasksTotal > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full border transition-colors shrink-0 ${
                darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-100'
              }`}
            >
              <span>{subtasksDone}/{subtasksTotal}</span>
              <svg className={`w-2.5 h-2.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          <div className="flex flex-wrap gap-0.5 items-center shrink-0">
            {(task.tags ?? []).map(tagId => {
              const tag = allTags.find(t => t.id === tagId)
              return tag ? <TagBadge key={tagId} tag={tag} small /> : null
            })}
          </div>

          {task.recurring && task.recurring !== 'none' && (
            <span className={`text-[10px] px-1 rounded ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>↻</span>
          )}
        </div>

        {expanded && (
          <SubtaskList subtasks={task.subtasks ?? []} onChange={subs => onUpdate(task.id, { subtasks: subs })} darkMode={darkMode} />
        )}

        {!expanded && subtasksTotal === 0 && (
          <button
            onClick={() => setExpanded(true)}
            className={`text-[10px] opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity ${textMuted}`}
          >
            + תת-משימות
          </button>
        )}
      </div>

      {/* Assignee */}
      <div className="w-12 flex justify-center items-center self-center px-0.5 shrink-0">
        <AssigneePicker value={task.assignee} onChange={val => onUpdate(task.id, { assignee: val })} darkMode={darkMode} />
      </div>

      {/* Status */}
      <div className="w-[116px] flex justify-center items-center self-center px-0.5 shrink-0">
        <StatusBadge value={task.status} onChange={val => onUpdate(task.id, { status: val })} />
      </div>

      {/* Priority */}
      <div className="w-20 flex justify-center items-center self-center px-0.5 shrink-0">
        <PriorityBadge value={task.priority} onChange={val => onUpdate(task.id, { priority: val })} />
      </div>

      {/* Due date */}
      <div className="w-28 items-center self-center px-0.5 shrink-0 hidden sm:block">
        <input
          type="date"
          value={task.dueDate}
          onChange={e => onUpdate(task.id, { dueDate: e.target.value })}
          className={`text-xs border-0 bg-transparent focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border focus:border-indigo-300 focus:rounded px-1 py-1 w-full cursor-pointer ${
            isOverdue ? 'text-red-500 font-semibold' : textMuted
          }`}
        />
      </div>

      {/* Tags picker */}
      <div className="w-20 self-center px-0.5 shrink-0 hidden lg:block">
        <TagPicker
          allTags={allTags}
          selectedIds={task.tags ?? []}
          onChange={ids => onUpdate(task.id, { tags: ids })}
          onCreateTag={onCreateTag}
          darkMode={darkMode}
        />
      </div>

      {/* Recurring */}
      <div className="w-16 self-center px-0.5 shrink-0 hidden xl:block">
        <RecurringBadge value={task.recurring ?? 'none'} onChange={val => onUpdate(task.id, { recurring: val })} darkMode={darkMode} />
      </div>

      {/* Notes */}
      <div className="w-36 self-center px-1 hidden lg:block">
        <TaskCell
          value={task.notes}
          onChange={val => onUpdate(task.id, { notes: val })}
          placeholder="הערה..."
          className={`text-xs ${textMuted}`}
          darkMode={darkMode}
        />
      </div>

      {/* Reactions */}
      <div className="flex items-center self-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity relative">
        {Object.entries(task.reactions ?? {}).filter(([, c]) => c > 0).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => {
              const curr = task.reactions ?? {}
              onUpdate(task.id, { reactions: { ...curr, [emoji]: Math.max(0, (curr[emoji] ?? 0) - 1) } })
            }}
            title={`${count} × ${emoji}`}
            className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 mr-0.5"
          >
            <span>{emoji}</span><span className="text-amber-700 font-medium">{count}</span>
          </button>
        ))}
        <div className="relative">
          <button
            onClick={() => setShowReactions(r => !r)}
            aria-label="הוסף תגובה"
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-colors ${
              darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-100'
            }`}
          >+</button>
          {showReactions && (
            <div
              className={`absolute bottom-full mb-1 left-0 flex gap-1 p-1.5 rounded-xl border shadow-lg z-20 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
              onMouseLeave={() => setShowReactions(false)}
            >
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    const curr = task.reactions ?? {}
                    onUpdate(task.id, { reactions: { ...curr, [emoji]: (curr[emoji] ?? 0) + 1 } })
                    setShowReactions(false)
                  }}
                  className="text-lg hover:scale-125 transition-transform px-0.5"
                  aria-label={`תגיב ${emoji}`}
                >{emoji}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete */}
      <div className="w-8 flex justify-center items-center self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onDelete(task.id)}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          aria-label={`מחק: ${task.title}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {mobileCard}
      {desktopRow}
    </div>
  )
}
