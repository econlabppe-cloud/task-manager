import React from 'react'
import { Group } from '../types'

interface Props {
  groups: Group[]
  darkMode?: boolean
  streak?: number
  completedToday?: number
}

export const StatsBar: React.FC<Props> = ({ groups, darkMode, streak = 0, completedToday = 0 }) => {
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
  const textBold = darkMode ? 'text-gray-100' : 'text-gray-800'
  const divider = <div className={`w-px h-5 shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
  const progressBg = darkMode ? 'bg-gray-700' : 'bg-gray-200'

  return (
    <div className={`${barBg} border-b px-4 py-3`}>
      {/* Mobile: progress bar + key counts in a 2-row layout */}
      <div className="flex flex-col gap-2 sm:hidden">
        {/* Progress row */}
        <div className="flex items-center gap-3">
          <div className={`flex-1 ${progressBg} rounded-full h-2.5`}>
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-sm font-bold whitespace-nowrap ${textBold}`}>{pct}%</span>
          <span className={`text-xs ${textMuted} whitespace-nowrap`}>{done}/{total} הושלמו</span>
          {overdue > 0 && (
            <span className="text-xs font-bold text-red-500 whitespace-nowrap">⚠ {overdue} באיחור</span>
          )}
        </div>
        {/* Status counts row */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
            <span className={`text-xs ${textMuted}`}>הושלם</span>
            <span className="text-sm font-bold text-green-600">{done}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className={`text-xs ${textMuted}`}>בתהליך</span>
            <span className="text-sm font-bold text-blue-600">{inProgress}</span>
          </div>
          {stuck > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
              <span className={`text-xs ${textMuted}`}>תקוע</span>
              <span className="text-sm font-bold text-orange-600">{stuck}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
            <span className={`text-xs ${textMuted}`}>לא התחיל</span>
            <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{notStarted}</span>
          </div>
          {completedToday > 0 && (
            <div className="flex items-center gap-1.5 shrink-0" title={`${completedToday} משימות הושלמו היום`}>
              <span className="text-green-500 text-sm font-bold">✓</span>
              <span className={`text-xs ${textMuted}`}>היום</span>
              <span className="text-sm font-bold text-green-600">{completedToday}</span>
            </div>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1 shrink-0" title={`${streak} ימים ברצף`}>
              <span className="text-base leading-none">🔥</span>
              <span className={`text-sm font-bold ${streak >= 7 ? 'text-orange-500' : streak >= 3 ? 'text-amber-500' : textMuted}`}>{streak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: single-row layout */}
      <div className="hidden sm:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className={textMuted}>סה״כ</span>
          <span className={`font-bold text-base ${textBold}`}>{total}</span>
        </div>
        {divider}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <span className={textMuted}>הושלם</span>
          <span className="font-bold text-sm text-green-600">{done}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <span className={textMuted}>בתהליך</span>
          <span className="font-bold text-sm text-blue-600">{inProgress}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
          <span className={textMuted}>תקוע</span>
          <span className={`font-bold text-sm ${stuck > 0 ? 'text-orange-600' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{stuck}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
          <span className={textMuted}>לא התחיל</span>
          <span className={`font-bold text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{notStarted}</span>
        </div>
        {overdue > 0 && (
          <>
            {divider}
            <div className="flex items-center gap-1.5">
              <span className="text-red-500 font-bold">⚠</span>
              <span className={textMuted}>באיחור</span>
              <span className="font-bold text-sm text-red-500">{overdue}</span>
            </div>
          </>
        )}
        {divider}
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className={`${textMuted} whitespace-nowrap`}>התקדמות</span>
          <div className={`flex-1 ${progressBg} rounded-full h-2.5 min-w-[80px]`}>
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'} whitespace-nowrap`}>{pct}%</span>
        </div>

        {completedToday > 0 && (
          <>
            {divider}
            <div className="flex items-center gap-1.5" title={`${completedToday} משימות הושלמו היום`}>
              <span className="text-green-500 font-bold">✓</span>
              <span className={textMuted}>היום</span>
              <span className="font-bold text-sm text-green-600">{completedToday}</span>
            </div>
          </>
        )}

        {streak > 0 && (
          <>
            {divider}
            <div
              className="flex items-center gap-1"
              title={`${streak} ימים ברצף עם לפחות משימה אחת שהושלמה`}
              aria-label={`רצף של ${streak} ימים`}
            >
              <span className="text-lg leading-none">🔥</span>
              <span className={`font-bold text-sm ${streak >= 7 ? 'text-orange-500' : streak >= 3 ? 'text-amber-500' : textMuted}`}>
                {streak}
              </span>
              <span className={`${textMuted} hidden sm:inline`}>ימים ברצף</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
