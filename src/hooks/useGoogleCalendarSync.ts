import React from 'react'
import { fetchGoogleCalendarTasks, googleEventToTaskDefaults, syncGoogleCalendarBidirectional } from '../googleCalendarSync'
import type { BoardState, Task } from '../types'
import { GOOGLE_CALENDAR_GROUP_TITLE } from '../constants'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/**
 * Returns a stable `syncGoogleCalendar` function.
 * The function imports/exports Google Calendar events into board state and
 * returns the number of newly added tasks.
 */
export function useGoogleCalendarSync(
  setState: React.Dispatch<React.SetStateAction<BoardState>>,
): (calendarUrl?: string) => Promise<number> {
  const syncGoogleCalendar = React.useCallback(
    async (calendarUrl?: string): Promise<number> => {
      const currentState = await new Promise<BoardState>(resolve => {
        setState(s => { resolve(s); return s })
      })

      const result = calendarUrl?.trim()
        ? await fetchGoogleCalendarTasks(calendarUrl)
        : await syncGoogleCalendarBidirectional(currentState.groups.flatMap(g => g.tasks))

      if (!result.ok) throw new Error(result.error ?? 'google_calendar_sync_failed')

      let addedCount = 0

      setState(current => {
        const exportedIds = new Map((result.exportedTasks ?? []).map(item => [item.taskId, item.eventId]))
        const importedById = new Map(result.events.map(event => [event.id, event]))

        const existingExternalIds = new Set(
          current.groups.flatMap(group =>
            group.tasks
              .filter(task => task.externalSource === 'google-calendar' && task.externalId)
              .map(task => task.externalId as string),
          ),
        )

        const fallbackTitleDates = new Set(
          current.groups.flatMap(group =>
            group.tasks.map(task => `${task.title}|${task.dueDate}`),
          ),
        )

        const importedEvents = result.events.filter(
          event =>
            !existingExternalIds.has(event.id) &&
            !fallbackTitleDates.has(`${event.title}|${event.dueDate}`),
        )
        addedCount = importedEvents.length

        const groupsWithExportIds = current.groups.map(group => ({
          ...group,
          tasks: group.tasks.map(task => {
            if (exportedIds.has(task.id)) {
              return {
                ...task,
                externalSource: 'google-calendar' as const,
                externalId: exportedIds.get(task.id),
                externalUpdatedAt: result.syncedAt,
              }
            }
            if (
              task.externalSource === 'google-calendar' &&
              task.externalId &&
              importedById.has(task.externalId)
            ) {
              const updated = importedById.get(task.externalId)!
              return {
                ...task,
                title: updated.title ?? task.title,
                dueDate: updated.dueDate ?? task.dueDate,
                ...(updated.startTime !== undefined
                  ? { startTime: updated.startTime }
                  : {}),
                notes: googleEventToTaskDefaults(updated).notes ?? task.notes,
                externalUpdatedAt: updated.updatedAt ?? task.externalUpdatedAt,
              }
            }
            return task
          }),
        }))

        const baseState = { ...current, groups: groupsWithExportIds }
        if (importedEvents.length === 0) return baseState

        const existingGroup = groupsWithExportIds.find(
          group => group.title === GOOGLE_CALENDAR_GROUP_TITLE,
        )
        const targetGroup = existingGroup ?? {
          id: `group-google-calendar-${genId()}`,
          title: GOOGLE_CALENDAR_GROUP_TITLE,
          color: 'teal',
          collapsed: false,
          order: groupsWithExportIds.length,
          tasks: [],
        }

        const newTasks: Task[] = importedEvents.map((event, index) => ({
          id: `task-google-${event.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 36)}-${genId()}`,
          title: event.title,
          ...googleEventToTaskDefaults(event),
          subtasks: [],
          tags: ['tag-weekly'],
          order: targetGroup.tasks.length + index,
          createdAt: result.syncedAt ?? new Date().toISOString(),
        } as Task))

        if (existingGroup) {
          return {
            ...baseState,
            groups: groupsWithExportIds.map(group =>
              group.id === existingGroup.id
                ? { ...group, tasks: [...group.tasks, ...newTasks] }
                : group,
            ),
          }
        }

        return {
          ...baseState,
          groups: [...groupsWithExportIds, { ...targetGroup, tasks: newTasks }],
        }
      })

      return addedCount
    },
    [setState],
  )

  return syncGoogleCalendar
}
