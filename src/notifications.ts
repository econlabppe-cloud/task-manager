import { Group, Task } from './types'

export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    void Notification.requestPermission()
  }
}

function getDaysUntil(dueDate: string): number | null {
  if (!dueDate) return null
  const [y, m, d] = dueDate.split('-').map(Number)
  if (!y || !m || !d) return null
  const due = new Date(y, m - 1, d)
  due.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

function notify(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.ico', lang: 'he' })
  } catch {
    // ignore
  }
}

export function checkDueTasks(groups: Group[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const allTasks: Array<{ task: Task; groupTitle: string }> = groups.flatMap(g =>
    g.tasks.filter(t => t.status !== 'הושלם').map(t => ({ task: t, groupTitle: g.title }))
  )

  const overdue = allTasks.filter(({ task }) => {
    const d = getDaysUntil(task.dueDate)
    return d !== null && d < 0
  })

  const dueToday = allTasks.filter(({ task }) => getDaysUntil(task.dueDate) === 0)
  const dueTomorrow = allTasks.filter(({ task }) => getDaysUntil(task.dueDate) === 1)
  const stuck = allTasks.filter(({ task }) => task.status === 'תקוע')

  if (overdue.length > 0) {
    notify(
      `⚠️ ${overdue.length} משימות באיחור`,
      overdue.slice(0, 3).map(({ task }) => task.title).join(' • ')
    )
  }

  if (dueToday.length > 0) {
    notify(
      `📋 ${dueToday.length} משימות להיום`,
      dueToday.slice(0, 3).map(({ task }) => task.title).join(' • ')
    )
  }

  if (dueTomorrow.length > 0 && overdue.length === 0 && dueToday.length === 0) {
    notify(
      `📅 ${dueTomorrow.length} משימות למחר`,
      dueTomorrow.slice(0, 2).map(({ task }) => task.title).join(' • ')
    )
  }

  if (stuck.length > 0 && overdue.length === 0 && dueToday.length === 0) {
    notify(
      `🚧 ${stuck.length} משימות תקועות`,
      stuck.slice(0, 2).map(({ task, groupTitle }) => `${task.title} (${groupTitle})`).join(' • ')
    )
  }
}
