import React from 'react'
import { Group, Task } from '../types'

interface Props {
  groups: Group[]
  darkMode?: boolean
}

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

const STATUS_DOT: Record<string, string> = {
  'לא התחיל': 'bg-gray-400',
  'בתהליך':   'bg-blue-500',
  'תקוע':     'bg-orange-500',
  'הושלם':    'bg-green-500',
}

const PRIORITY_BORDER: Record<string, string> = {
  'נמוך':  'border-gray-200',
  'בינוני': 'border-yellow-300',
  'גבוה':   'border-red-400',
}

interface DayCell {
  date: Date
  dateStr: string
  isToday: boolean
  isShabbat: boolean
  tasks: Array<{ task: Task; groupTitle: string; groupColor: string }>
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const CalendarView: React.FC<Props> = ({ groups, darkMode }) => {
  const [weekOffset, setWeekOffset] = React.useState(0)

  const today = React.useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const days: DayCell[] = React.useMemo(() => {
    // Start from Sunday of current week + offset
    const base = new Date(today)
    base.setDate(base.getDate() - base.getDay() + weekOffset * 7)

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(base)
      date.setDate(base.getDate() + i)
      const dateStr = formatDateStr(date)
      const isToday = dateStr === formatDateStr(today)
      const isShabbat = date.getDay() === 6

      const tasks = groups.flatMap(g =>
        g.tasks
          .filter(t => t.dueDate === dateStr)
          .map(t => ({ task: t, groupTitle: g.title, groupColor: g.color }))
      )

      return { date, dateStr, isToday, isShabbat, tasks }
    })
  }, [today, weekOffset, groups])

  const allTasksWithDate = groups.flatMap(g =>
    g.tasks.filter(t => !t.dueDate && t.status !== 'הושלם').map(t => ({ task: t, groupTitle: g.title, groupColor: g.color }))
  )

  const bg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-800'
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400'
  const dayBg = darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-100'
  const todayRing = darkMode ? 'ring-2 ring-indigo-500 bg-indigo-900/20' : 'ring-2 ring-indigo-500 bg-indigo-50/80'
  const shabbatBg = darkMode ? 'bg-amber-900/10' : 'bg-amber-50/50'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${bg}`}>
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className={`font-semibold ${textMain}`}>
            {weekOffset === 0 ? 'השבוע' : weekOffset === 1 ? 'שבוע הבא' : weekOffset === -1 ? 'שבוע שעבר' : `שבוע ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
          </h2>
          <p className={`text-xs ${textMuted}`}>
            {days[0].date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })} –{' '}
            {days[6].date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${darkMode ? 'text-indigo-400 hover:bg-gray-700' : 'text-indigo-600 hover:bg-indigo-50'}`}
            >
              היום
            </button>
          )}
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ date, isToday, isShabbat, tasks }) => (
          <div
            key={date.toISOString()}
            className={`rounded-xl border p-2 min-h-[120px] flex flex-col gap-1 ${
              isToday ? todayRing : isShabbat ? shabbatBg + ' border-amber-200' : dayBg
            }`}
          >
            {/* Day header */}
            <div className="flex flex-col items-center mb-1">
              <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {DAYS_HE[date.getDay()]}
              </span>
              <span className={`text-lg font-bold leading-tight ${
                isToday ? 'text-indigo-600' : isShabbat ? 'text-amber-700' : textMain
              }`}>
                {date.getDate()}
              </span>
            </div>

            {/* Tasks */}
            {tasks.length === 0 ? (
              <div className={`flex-1 flex items-center justify-center text-[10px] ${textMuted}`}>
                {isShabbat ? '🕯️' : '—'}
              </div>
            ) : (
              <div className="space-y-1 flex-1">
                {tasks.slice(0, 4).map(({ task, groupTitle }) => (
                  <div
                    key={task.id}
                    className={`text-[10px] leading-tight px-1.5 py-1 rounded-lg border-r-2 ${PRIORITY_BORDER[task.priority]} ${
                      darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-white text-gray-700 shadow-sm'
                    } ${task.status === 'הושלם' ? 'opacity-50 line-through' : ''}`}
                    title={`${task.title} — ${groupTitle}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[task.status]}`} />
                      <span className="truncate">{task.title}</span>
                    </div>
                    <div className={`text-[9px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{groupTitle}</div>
                  </div>
                ))}
                {tasks.length > 4 && (
                  <div className={`text-[10px] text-center ${textMuted}`}>+{tasks.length - 4} עוד</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No due date tasks */}
      {allTasksWithDate.length > 0 && (
        <div className={`rounded-xl border p-4 ${bg}`}>
          <h3 className={`text-sm font-semibold mb-3 ${textMain}`}>ללא תאריך יעד ({allTasksWithDate.length})</h3>
          <div className="flex flex-wrap gap-2">
            {allTasksWithDate.slice(0, 12).map(({ task, groupTitle }) => (
              <div
                key={task.id}
                className={`text-xs px-2.5 py-1.5 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                {task.title}
                <span className={`mr-1.5 text-[10px] ${textMuted}`}>({groupTitle})</span>
              </div>
            ))}
            {allTasksWithDate.length > 12 && (
              <div className={`text-xs px-2.5 py-1.5 ${textMuted}`}>+{allTasksWithDate.length - 12} עוד</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
