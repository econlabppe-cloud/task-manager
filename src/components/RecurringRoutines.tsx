import React from 'react'
import { Assignee, Group, Priority, RecurringTaskInput, RecurringTaskTemplate } from '../types'
import {
  assigneeOptions,
  dayPresetToDays,
  nextRunLabel,
  priorityOptions,
  recurrenceLabel,
  WEEKDAY_LABELS,
} from '../recurringTasks'

type SchedulePreset = 'daily' | 'school' | 'workweek' | 'weekly'

interface Props {
  groups: Group[]
  recurringTasks: RecurringTaskTemplate[]
  onAdd: (input: RecurringTaskInput) => void
  onUpdate: (templateId: string, patch: Partial<RecurringTaskInput>) => void
  onDelete: (templateId: string) => void
  onGenerateWeek: () => number
}

const priorityClass: Record<Priority, string> = {
  'נמוך': 'bg-green-50 text-green-700 border-green-200',
  'בינוני': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'גבוה': 'bg-red-50 text-red-700 border-red-200',
}

export const RecurringRoutines: React.FC<Props> = ({
  groups,
  recurringTasks,
  onAdd,
  onUpdate,
  onDelete,
  onGenerateWeek,
}) => {
  const [title, setTitle] = React.useState('')
  const [groupId, setGroupId] = React.useState(groups[0]?.id ?? '')
  const [assignee, setAssignee] = React.useState<Assignee>('שנינו')
  const [priority, setPriority] = React.useState<Priority>('בינוני')
  const [notes, setNotes] = React.useState('')
  const [schedulePreset, setSchedulePreset] = React.useState<SchedulePreset>('weekly')
  const [weeklyDay, setWeeklyDay] = React.useState(4)
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    if (!groupId && groups[0]) setGroupId(groups[0].id)
  }, [groupId, groups])

  React.useEffect(() => {
    if (!message) return
    const timeoutId = window.setTimeout(() => setMessage(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  const activeCount = recurringTasks.filter(template => template.active).length

  const groupName = (id: string) => groups.find(group => group.id === id)?.title ?? 'קבוצה חסרה'

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle || !groupId) return

    onAdd({
      title: trimmedTitle,
      groupId,
      assignee,
      priority,
      notes: notes.trim(),
      cadence: schedulePreset === 'weekly' ? 'weekly' : 'daily',
      daysOfWeek: dayPresetToDays(schedulePreset, weeklyDay),
      active: true,
    })

    setTitle('')
    setNotes('')
    setSchedulePreset('weekly')
    setWeeklyDay(4)
    setMessage('הרוטינה נוספה. היא תיצור משימות אוטומטית לפי התזמון.')
  }

  const generateWeek = () => {
    const added = onGenerateWeek()
    setMessage(added > 0 ? `נוצרו ${added} משימות לשבוע הקרוב.` : 'השבוע הקרוב כבר מסודר, לא נוצרו כפילויות.')
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">רוטינות ואוטומציות</h2>
          <p className="text-xs text-gray-500 mt-1">
            משימות שחוזרות לבד, כדי שהבית לא יישען על זיכרון או לחץ של הרגע האחרון.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-center border border-emerald-200 bg-emerald-50 text-emerald-700 rounded px-3 py-1.5">
            <div className="text-sm font-bold">{activeCount}</div>
            <div className="text-[11px]">פעילות</div>
          </div>
          <button
            type="button"
            onClick={generateWeek}
            className="rounded bg-gray-900 text-white text-xs font-semibold px-3 py-2 hover:bg-gray-700 transition-colors"
          >
            צור שבוע קדימה
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {message}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 mt-4">
        {recurringTasks.map(template => (
          <article key={template.id} className={`border rounded p-3 ${template.active ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 opacity-70'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 leading-5">{template.title}</h3>
                <div className="text-[11px] text-gray-400 mt-1">
                  {groupName(template.groupId)} · {recurrenceLabel(template)} · הבא: {nextRunLabel(template)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdate(template.id, { active: !template.active })}
                className={`shrink-0 rounded px-2 py-1 text-[11px] font-semibold border ${
                  template.active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                {template.active ? 'פעיל' : 'כבוי'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[11px] px-2 py-1 rounded border bg-white text-gray-600 border-gray-200">
                {template.assignee || 'לא שויך'}
              </span>
              <span className={`text-[11px] px-2 py-1 rounded border ${priorityClass[template.priority]}`}>
                {template.priority}
              </span>
            </div>

            {template.notes && (
              <p className="text-xs text-gray-500 mt-3 leading-5">{template.notes}</p>
            )}

            <button
              type="button"
              onClick={() => onDelete(template.id)}
              className="mt-3 text-[11px] text-gray-400 hover:text-red-600 transition-colors"
            >
              מחק רוטינה
            </button>
          </article>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 border-t border-gray-200 pt-4">
        <div className="text-xs font-bold text-gray-700 mb-3">הוסף רוטינה חדשה</div>
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1.4fr)_150px_130px_130px_160px_100px]">
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="שם הרוטינה..."
            dir="rtl"
            className="rounded border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          />

          <select
            value={groupId}
            onChange={event => setGroupId(event.target.value)}
            className="rounded border border-gray-200 px-2 py-2 text-sm bg-white"
          >
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.title}</option>
            ))}
          </select>

          <select
            value={assignee}
            onChange={event => setAssignee(event.target.value as Assignee)}
            className="rounded border border-gray-200 px-2 py-2 text-sm bg-white"
          >
            {assigneeOptions.map(option => (
              <option key={option || 'none'} value={option}>{option || 'לא שויך'}</option>
            ))}
          </select>

          <select
            value={priority}
            onChange={event => setPriority(event.target.value as Priority)}
            className="rounded border border-gray-200 px-2 py-2 text-sm bg-white"
          >
            {priorityOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <div className="grid grid-cols-[1fr_84px] gap-2">
            <select
              value={schedulePreset}
              onChange={event => setSchedulePreset(event.target.value as SchedulePreset)}
              className="rounded border border-gray-200 px-2 py-2 text-sm bg-white"
            >
              <option value="weekly">פעם בשבוע</option>
              <option value="daily">כל יום</option>
              <option value="school">ימי לימודים א׳-ו׳</option>
              <option value="workweek">א׳-ה׳</option>
            </select>
            <select
              value={weeklyDay}
              onChange={event => setWeeklyDay(Number(event.target.value))}
              disabled={schedulePreset !== 'weekly'}
              className="rounded border border-gray-200 px-2 py-2 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-300"
            >
              {WEEKDAY_LABELS.map((label, index) => (
                <option key={label} value={index}>{label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!title.trim() || !groupId}
            className="rounded bg-cyan-700 text-white text-xs font-semibold px-3 py-2 hover:bg-cyan-800 disabled:bg-gray-300 transition-colors"
          >
            הוסף
          </button>
        </div>

        <input
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="הערה קבועה לרוטינה, למשל רשימת בדיקה קצרה..."
          dir="rtl"
          className="mt-2 w-full rounded border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        />
      </form>
    </section>
  )
}
