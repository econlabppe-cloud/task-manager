import { Task } from './types'

export interface GoogleCalendarEventTask {
  id: string
  title: string
  dueDate: string
  notes: string
  updatedAt?: string
}

export interface GoogleCalendarSyncResult {
  ok: boolean
  events: GoogleCalendarEventTask[]
  syncedAt?: string
  exported?: number
  exportedTasks?: Array<{ taskId: string, eventId: string }>
  error?: string
  message?: string
}

export interface GoogleCalendarAuthStatus {
  ok: boolean
  connected: boolean
  authUrl?: string
}

export async function fetchGoogleCalendarTasks(calendarUrl?: string): Promise<GoogleCalendarSyncResult> {
  const params = new URLSearchParams()
  if (calendarUrl?.trim()) params.set('url', calendarUrl.trim())

  const response = await fetch(`/api/google-calendar-sync${params.toString() ? `?${params}` : ''}`)
  const body = await response.json() as GoogleCalendarSyncResult
  if (!response.ok) return { ...body, ok: false, events: body.events ?? [] }
  return body
}

export async function fetchGoogleCalendarAuthStatus(): Promise<GoogleCalendarAuthStatus> {
  const response = await fetch('/api/google-calendar-auth')
  return response.json() as Promise<GoogleCalendarAuthStatus>
}

export async function syncGoogleCalendarBidirectional(tasks: Task[]): Promise<GoogleCalendarSyncResult> {
  const syncableTasks = tasks
    .filter(task => task.title.trim() && task.dueDate)
    .map(task => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      notes: task.notes,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      externalId: task.externalSource === 'google-calendar' ? task.externalId : undefined,
      updatedAt: task.createdAt,
    }))

  const response = await fetch('/api/google-calendar-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks: syncableTasks }),
  })
  const body = await response.json() as GoogleCalendarSyncResult
  if (!response.ok) return { ...body, ok: false, events: body.events ?? [] }
  return body
}

export function googleEventToTaskDefaults(event: GoogleCalendarEventTask): Partial<Task> {
  return {
    assignee: 'שנינו',
    status: 'לא התחיל',
    priority: 'בינוני',
    dueDate: event.dueDate,
    notes: event.notes ? `יובא מיומן Google:\n${event.notes}` : 'יובא מיומן Google.',
    externalSource: 'google-calendar',
    externalId: event.id,
    externalUpdatedAt: event.updatedAt,
    recurring: 'none',
  }
}
