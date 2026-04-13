import { BoardState, Group, RecurringTaskTemplate, Task } from './types'
import { ensureRecurringState, materializeRecurringTasks } from './recurringTasks'
import { seedData } from './seed'

const STORAGE_KEY = 'mandy-home-board-v2'
const CURRENT_VERSION = 3

const DEFAULT_TAGS = [
  { id: 'tag-urgent', label: 'דחוף', color: 'rose' },
  { id: 'tag-weekly', label: 'שבועי', color: 'sky' },
  { id: 'tag-shabbat', label: 'שבת', color: 'violet' },
] as BoardState['tags']

function migrateTask(t: Partial<Task> & { id: string; title: string; createdAt: string }, idx: number): Task {
  return {
    subtasks: [],
    tags: [],
    recurring: 'none',
    order: idx,
    assignee: '',
    status: 'לא התחיל',
    priority: 'בינוני',
    dueDate: '',
    notes: '',
    ...t,
  }
}

function migrateGroup(g: Partial<Group> & { id: string; title: string }, idx: number): Group {
  const tasks = ((g.tasks ?? []) as Array<Partial<Task> & { id: string; title: string; createdAt: string }>).map(migrateTask)

  return {
    color: 'indigo',
    collapsed: false,
    order: idx,
    ...g,
    tasks,
  }
}

function migrateRecurringTask(t: Partial<RecurringTaskTemplate> & { id: string; title: string }): RecurringTaskTemplate {
  return {
    groupId: '',
    assignee: '',
    priority: 'בינוני',
    notes: '',
    cadence: 'weekly',
    daysOfWeek: [0],
    active: true,
    generatedDates: [],
    createdAt: new Date().toISOString(),
    ...t,
  }
}

function migrate(raw: unknown): BoardState {
  const s = raw as Record<string, unknown>
  const groups = ((s.groups ?? []) as Array<Partial<Group> & { id: string; title: string }>).map(migrateGroup)
  const recurringTasks = ((s.recurringTasks ?? []) as Array<Partial<RecurringTaskTemplate> & { id: string; title: string }>).map(migrateRecurringTask)

  return ensureRecurringState({
    version: CURRENT_VERSION,
    groups,
    tags: (s.tags as BoardState['tags']) ?? DEFAULT_TAGS,
    recurringTasks,
    recurringDefaultsAdded: (s.recurringDefaultsAdded as boolean) ?? false,
    filterAssignee: (s.filterAssignee as BoardState['filterAssignee']) ?? '',
    filterStatus: (s.filterStatus as BoardState['filterStatus']) ?? '',
    filterTag: (s.filterTag as string) ?? '',
    viewMode: (s.viewMode as BoardState['viewMode']) ?? 'board',
    darkMode: (s.darkMode as boolean) ?? false,
    searchQuery: (s.searchQuery as string) ?? '',
  })
}

export function loadState(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      return materializeRecurringTasks(migrate(parsed)).state
    }
    // Legacy key
    const legacy = localStorage.getItem('mandy-home-board-v1')
    if (legacy) {
      const parsed = JSON.parse(legacy) as unknown
      return materializeRecurringTasks(migrate(parsed)).state
    }
  } catch {
    // ignore
  }
  return materializeRecurringTasks(migrate({ groups: seedData, tags: DEFAULT_TAGS })).state
}

export function saveState(state: BoardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}
