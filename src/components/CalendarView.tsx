import React from 'react'
import { Group, Task } from '../types'
import { downloadIcs, googleCalendarUrl } from '../googleCalendar'

interface Props {
  groups: Group[]
  darkMode?: boolean
  onUpdateTask?: (groupId: string, taskId: string, patch: Partial<Task>) => void
  googleAuthUrl?: string
  calendarSyncing?: boolean
  onCalendarSync?: () => void
}

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

const STATUS_DOT: Record<string, string> = {
  'לא התחיל': 'bg-gray-400',
  'בתהליך': 'bg-blue-500',
  'תקוע': 'bg-orange-500',
  'הושלם': 'bg-green-500',
}

const PRIORITY_BORDER: Record<string, string> = {
  'נמוך': 'border-gray-200',
  'בינוני': 'border-yellow-300',
  'גבוה': 'border-red-400',
}

interface CalendarTask {
  task: Task
  groupId: string
  groupTitle: string
  groupColor: string
}

interface DayCell {
  date: Date
  dateStr: string
  isToday: boolean
  isShabbat: boolean
  tasks: CalendarTask[]
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function weekTitle(offset: number): string {
  if (offset === 0) return 'השבוע'
  if (offset === 1) return 'שבוע הבא'
  if (offset === -1) return 'שבוע שעבר'
  return `שבוע ${offset > 0 ? '+' : ''}${offset}`
}

export const CalendarView: React.FC<Props> = ({ groups, darkMode, onUpdateTask, googleAuthUrl, calendarSyncing, onCalendarSync }) => {
  const [weekOffset, setWeekOffset] = React.useState(0)

  const today = React.useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const days: DayCell[] = React.useMemo(() => {
    const base = new Date(today)
    base.setDate(base.getDate() - base.getDay() + weekOffset * 7)

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base)
      date.setDate(base.getDate() + index)
      const dateStr = formatDateStr(date)

      const tasks = groups.flatMap(group =>
        group.tasks
          .filter(task => task.dueDate === dateStr)
          .sort((a, b) => a.order - b.order)
          .map(task => ({
            task,
            groupId: group.id,
            groupTitle: group.title,
            groupColor: group.color,
          }))
      )

      return {
        date,
        dateStr,
        tasks,
        isToday: dateStr === formatDateStr(today),
        isShabbat: date.getDay() === 6,
      }
    })
  }, [today, weekOffset, groups])

  const weekTasks = days.flatMap(day => day.tasks)
  const openWeekTasks = weekTasks.filter(({ task }) => task.status !== 'הושלם')
  const noDueTasks = groups.flatMap(group =>
    group.tasks
      .filter(task => !task.dueDate && task.status !== 'הושלם')
      .map(task => ({ task, groupId: group.id, groupTitle: group.title, groupColor: group.color }))
  )

  const bg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-800'
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400'
  const dayBg = darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-100'
  const todayRing = darkMode ? 'ring-2 ring-cyan-500 bg-cyan-900/20' : 'ring-2 ring-cyan-500 bg-cyan-50/80'
  const shabbatBg = darkMode ? 'bg-amber-900/10 border-amber-800/60' : 'bg-amber-50/60 border-amber-200'

  const exportWeek = () => {
    downloadIcs(
      weekTasks.map(({ task, groupTitle }) => ({ task, groupTitle })),
      `mandy-week-${days[0].dateStr}.ics`
    )
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${bg}`}>
        <button
          onClick={() => setWeekOffset(offset => offset - 1)}
          className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="text-center min-w-0">
          <h2 className={`font-semibold ${textMain}`}>{weekTitle(weekOffset)}</h2>
          <p className={`text-xs ${textMuted}`}>
            {days[0].date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })} -{' '}
            {days[6].date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={googleAuthUrl || undefined}
            className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
              googleAuthUrl
                ? darkMode
                  ? 'bg-sky-800 border-sky-700 text-sky-100 hover:bg-sky-700'
                  : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                : darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-500 pointer-events-none'
                  : 'bg-gray-100 border-gray-200 text-gray-400 pointer-events-none'
            }`}
          >
            חבר יומן
          </a>
          <button
            type="button"
            onClick={onCalendarSync}
            disabled={calendarSyncing}
            className="text-xs font-semibold px-3 py-1.5 rounded border transition-colors bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800 disabled:bg-gray-300 disabled:border-gray-300"
          >
            {calendarSyncing ? 'מסנכרן...' : 'סנכרן יומן'}
          </button>
          <button
            type="button"
            onClick={exportWeek}
            disabled={weekTasks.length === 0}
            className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:text-gray-500'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:text-gray-300'
            }`}
          >
            ייצוא ליומן
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${darkMode ? 'text-cyan-400 hover:bg-gray-700' : 'text-cyan-700 hover:bg-cyan-50'}`}
            >
              היום
            </button>
          )}
          <button
            onClick={() => setWeekOffset(offset => offset + 1)}
            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`rounded-xl border p-3 ${bg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className={`text-sm font-bold ${textMain}`}>לוח שבועי</h3>
            <p className={`text-xs mt-1 ${textMuted}`}>
              {openWeekTasks.length} פתוחות השבוע מתוך {weekTasks.length} משימות עם תאריך.
            </p>
          </div>
          <div className={`text-xs rounded border px-3 py-2 ${darkMode ? 'border-cyan-800 bg-cyan-900/20 text-cyan-300' : 'border-cyan-200 bg-cyan-50 text-cyan-800'}`}>
            Google Calendar: כפתור "Google" פותח יצירת אירוע, ו"ייצוא ליומן" מוריד קובץ ICS.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map(day => (
          <div
            key={day.dateStr}
            className={`rounded-xl border p-2 min-h-[220px] flex flex-col gap-2 ${
              day.isToday ? todayRing : day.isShabbat ? shabbatBg : dayBg
            }`}
          >
            <div className="flex md:flex-col items-center justify-between md:justify-start gap-1 border-b border-black/5 pb-2">
              <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {DAYS_HE[day.date.getDay()]}
              </span>
              <span className={`text-xl font-bold leading-tight ${day.isToday ? 'text-cyan-700' : day.isShabbat ? 'text-amber-700' : textMain}`}>
                {day.date.getDate()}
              </span>
              <span className={`text-[11px] ${textMuted}`}>{day.tasks.length} משימות</span>
            </div>

            {day.tasks.length === 0 ? (
              <div className={`flex-1 flex items-center justify-center text-xs ${textMuted}`}>
                {day.isShabbat ? 'שבת שקטה' : 'פנוי'}
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {day.tasks.map(item => (
                  <article
                    key={item.task.id}
                    className={`text-xs leading-tight px-2 py-2 rounded border-r-2 ${PRIORITY_BORDER[item.task.priority]} ${
                      darkMode ? 'bg-gray-800/80 text-gray-200 border-gray-700' : 'bg-white text-gray-700 shadow-sm border-gray-100'
                    } ${item.task.status === 'הושלם' ? 'opacity-55' : ''}`}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOT[item.task.status]}`} />
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold ${item.task.status === 'הושלם' ? 'line-through' : ''}`}>
                          {item.task.title}
                        </div>
                        <div className={`text-[11px] mt-1 ${textMuted}`}>
                          {item.groupTitle} · {item.task.assignee || 'לא שויך'} · {item.task.priority}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      <button
                        type="button"
                        onClick={() => onUpdateTask?.(item.groupId, item.task.id, { status: item.task.status === 'הושלם' ? 'לא התחיל' : 'הושלם' })}
                        className={`rounded px-2 py-1 text-[11px] font-semibold ${
                          item.task.status === 'הושלם'
                            ? darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {item.task.status === 'הושלם' ? 'פתח מחדש' : 'הושלם'}
                      </button>
                      <a
                        href={googleCalendarUrl({ task: item.task, groupTitle: item.groupTitle })}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded px-2 py-1 text-[11px] font-semibold ${darkMode ? 'bg-gray-700 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}
                      >
                        Google
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {noDueTasks.length > 0 && (
        <div className={`rounded-xl border p-4 ${bg}`}>
          <h3 className={`text-sm font-semibold mb-3 ${textMain}`}>ללא תאריך יעד ({noDueTasks.length})</h3>
          <div className="flex flex-wrap gap-2">
            {noDueTasks.slice(0, 14).map(({ task, groupTitle }) => (
              <div
                key={task.id}
                className={`text-xs px-2.5 py-1.5 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                {task.title}
                <span className={`mr-1.5 text-[10px] ${textMuted}`}>({groupTitle})</span>
              </div>
            ))}
            {noDueTasks.length > 14 && (
              <div className={`text-xs px-2.5 py-1.5 ${textMuted}`}>+{noDueTasks.length - 14} עוד</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
