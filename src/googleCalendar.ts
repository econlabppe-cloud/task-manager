import { Task } from './types'

export interface CalendarTask {
  task: Task
  groupTitle: string
}

function yyyymmdd(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function addOneDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + 1)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function nowStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function googleCalendarUrl({ task, groupTitle }: CalendarTask): string {
  const start = yyyymmdd(task.dueDate)
  const end = addOneDay(task.dueDate)
  const details = [
    `קבוצה: ${groupTitle}`,
    task.assignee ? `אחראי: ${task.assignee}` : '',
    `עדיפות: ${task.priority}`,
    task.notes ? `הערות: ${task.notes}` : '',
    'נוצר מתוך מאנדי בית.',
  ].filter(Boolean).join('\n')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.title,
    dates: `${start}/${end}`,
    details,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function tasksToIcs(tasks: CalendarTask[], calendarName = 'מאנדי בית'): string {
  const stamp = nowStamp()
  const events = tasks
    .filter(({ task }) => task.dueDate)
    .map(({ task, groupTitle }) => {
      const details = [
        `קבוצה: ${groupTitle}`,
        task.assignee ? `אחראי: ${task.assignee}` : '',
        `סטטוס: ${task.status}`,
        `עדיפות: ${task.priority}`,
        task.notes ? `הערות: ${task.notes}` : '',
      ].filter(Boolean).join('\n')

      return [
        'BEGIN:VEVENT',
        `UID:${task.id}@mandy-home`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${yyyymmdd(task.dueDate)}`,
        `DTEND;VALUE=DATE:${addOneDay(task.dueDate)}`,
        `SUMMARY:${escapeIcs(task.title)}`,
        `DESCRIPTION:${escapeIcs(details)}`,
        'END:VEVENT',
      ].join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mandy Home//HE',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(tasks: CalendarTask[], filename: string): void {
  const blob = new Blob(['\uFEFF' + tasksToIcs(tasks)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
