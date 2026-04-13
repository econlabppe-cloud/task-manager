import React from 'react'
import { Group } from '../types'

interface Props {
  groups: Group[]
  darkMode?: boolean
}

export const StatsBar: React.FC<Props> = ({ groups, darkMode }) => {
  const allTasks = groups.flatMap(g => g.tasks)
  const total = allTasks.length
  const done = allTasks.filter(t => t.status === 'הושלם').length
  const inProgress = allTasks.filter(t => t.status === 'בתהליך').length
  const stuck = allTasks.filter(t => t.status === 'תקוע').length
  const notStarted = allTasks.filter(t => t.status === 'לא התחיל').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = allTasks.filter(t => {
    if (!t.dueDate || t.status === 'הושלם') return false
    return new Date(t.dueDate) < today
  }).length

  const barBg = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-500'
  const textBold = darkMode ? 'text-gray-200' : 'text-gray-800'
  const divider = <div className={`w-px h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
  const progressBg = darkMode ? 'bg-gray-700' : 'bg-gray-100'

  return (
    <div className={`${barBg} border-b px-4 py-2`}>
      <div className="flex items-center gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <span className={textMuted}>סה״כ</span>
          <span className={`font-bold text-sm ${textBold}`}>{total}</span>
        </div>
        {divider}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className={textMuted}>הושלם</span>
          <span className="font-bold text-green-600">{done}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className={textMuted}>בתהליך</span>
          <span className="font-bold text-blue-600">{inProgress}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className={textMuted}>תקוע</span>
          <span className={`font-bold ${stuck > 0 ? 'text-orange-600' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{stuck}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span className={textMuted}>לא התחיל</span>
          <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{notStarted}</span>
        </div>
        {overdue > 0 && (
          <>
            {divider}
            <div className="flex items-center gap-1.5">
              <span className="text-red-500 font-bold">⚠</span>
              <span className={textMuted}>באיחור</span>
              <span className="font-bold text-red-500">{overdue}</span>
            </div>
          </>
        )}
        {divider}
        <div className="flex items-center gap-2 flex-1 min-w-[120px]">
          <span className={`${textMuted} whitespace-nowrap`}>התקדמות</span>
          <div className={`flex-1 ${progressBg} rounded-full h-2 min-w-[60px]`}>
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-nowrap`}>{pct}%</span>
        </div>
      </div>
    </div>
  )
}
