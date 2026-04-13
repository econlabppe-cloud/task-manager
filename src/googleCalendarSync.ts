import { Task } from './types'

export interface GoogleCalendarEventTask {
  id: string
  title: string
  dueDate: string
  notes: string
}

export interface GoogleCalendarSyncResult {
  ok: boolean
  events: GoogleCalendarEventTask[]
  syncedAt?: string
  error?: string
  message?: string
}

export async function fetchGoogleCalendarTasks(calendarUrl?: string): Promise<GoogleCalendarSyncResult> {
  const params = new URLSearchParams()
  if (calendarUrl?.trim()) params.set('url', calendarUrl.trim())

  const response = await fetch(`/api/google-calendar-sync${params.toString() ? `?${params}` : ''}`)
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
    recurring: 'none',
  }
}
