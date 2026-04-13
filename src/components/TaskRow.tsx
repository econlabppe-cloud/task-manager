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

export const TaskRow: React.FC<Props> = ({
  task, groupColor, index, allTags, darkMode,
  onUpdate, onDelete, onCreateTag,
  onDragStart, onDragOver, onDragEnd,
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const borderClass = colorBorder[groupColor] ?? 'border-gray-400'

  const rowBg = darkMode
    ? index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/60'
    : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'

  const hoverBg = darkMode ? 'hover:bg-gray-700/60' : 'hover:bg-indigo-50/30'
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-800'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const borderRow = darkMode ? 'border-gray-700' : 'border-gray-100'

  const isOverdue = task.dueDate && task.status !== 'הושלם'
    ? new Date(task.dueDate) < new Date(new Date().toDateString())
    : false

  const subtasksDone = task.subtasks?.filter(s => s.done).length ?? 0
  const subtasksTotal = task.subtasks?.length ?? 0

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

  const handleDragEnd = () => {
    setDragging(false)
    onDragEnd?.()
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      className={`border-t group transition-colors ${borderRow} ${rowBg} ${hoverBg} ${dragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start min-h-[38px]">
        {/* Color indicator */}
        <div className={`w-1 self-stretch border-r-2 ${borderClass} shrink-0`} />

        {/* Drag handle */}
        <div className="w-5 self-center flex justify-center opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing shrink-0">
          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>

        {/* Checkbox */}
        <div className="w-7 flex justify-center items-center self-center shrink-0">
          <button
            onClick={() => onUpdate(task.id, { status: task.status === 'הושלם' ? 'לא התחיל' : 'הושלם' })}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              task.status === 'הושלם'
                ? 'bg-green-500 border-green-500'
                : darkMode ? 'border-gray-500 hover:border-green-400' : 'border-gray-300 hover:border-green-400'
            }`}
            title={task.status === 'הושלם' ? 'סמן כלא הושלם' : 'סמן כהושלם'}
          >
            {task.status === 'הושלם' && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Title + subtasks expand + tags */}
        <div className={`flex-1 min-w-0 px-1 py-2 ${task.status === 'הושלם' ? 'opacity-60' : ''}`}>
          <div className="flex items-start gap-1.5 flex-wrap">
            <div className="flex-1 min-w-0">
              <TaskCell
                value={task.title}
                onChange={val => onUpdate(task.id, { title: val })}
                placeholder="שם המשימה..."
                className={`${task.status === 'הושלם' ? 'line-through' : ''} ${textMain}`}
                darkMode={darkMode}
              />
            </div>

            {/* Subtasks progress */}
            {subtasksTotal > 0 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors shrink-0 ${
                  darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <span>{subtasksDone}/{subtasksTotal}</span>
                <svg className={`w-2.5 h-2.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-0.5 items-center shrink-0">
              {(task.tags ?? []).map(tagId => {
                const tag = allTags.find(t => t.id === tagId)
                return tag ? <TagBadge key={tagId} tag={tag} small /> : null
              })}
            </div>

            {/* Recurring indicator */}
            {task.recurring && task.recurring !== 'none' && (
              <span className={`text-[10px] px-1 rounded ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>↻</span>
            )}
          </div>

          {/* Expanded subtasks */}
          {expanded && (
            <SubtaskList
              subtasks={task.subtasks ?? []}
              onChange={subs => onUpdate(task.id, { subtasks: subs })}
              darkMode={darkMode}
            />
          )}

          {/* Expand subtasks button when empty */}
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
          <AssigneePicker
            value={task.assignee}
            onChange={val => onUpdate(task.id, { assignee: val })}
            darkMode={darkMode}
          />
        </div>

        {/* Status */}
        <div className="w-30 flex justify-center items-center self-center px-0.5 shrink-0">
          <StatusBadge
            value={task.status}
            onChange={val => onUpdate(task.id, { status: val })}
          />
        </div>

        {/* Priority */}
        <div className="w-20 flex justify-center items-center self-center px-0.5 shrink-0">
          <PriorityBadge
            value={task.priority}
            onChange={val => onUpdate(task.id, { priority: val })}
          />
        </div>

        {/* Due date */}
        <div className="w-26 items-center self-center px-0.5 shrink-0 hidden sm:block">
          <input
            type="date"
            value={task.dueDate}
            onChange={e => onUpdate(task.id, { dueDate: e.target.value })}
            className={`text-xs border-0 bg-transparent focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border focus:border-indigo-300 focus:rounded px-1 py-1 w-full cursor-pointer ${
              isOverdue ? 'text-red-500 font-medium' : textMuted
            }`}
          />
        </div>

        {/* Tags picker (inline compact) */}
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
          <RecurringBadge
            value={task.recurring ?? 'none'}
            onChange={val => onUpdate(task.id, { recurring: val })}
            darkMode={darkMode}
          />
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

        {/* Delete */}
        <div className="w-8 flex justify-center items-center self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onDelete(task.id)}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="מחק משימה"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
