export type Status = 'לא התחיל' | 'בתהליך' | 'תקוע' | 'הושלם'
export type Priority = 'נמוך' | 'בינוני' | 'גבוה'
export type Assignee = 'יהודה' | 'אשתי' | 'שנינו' | 'ילדים' | ''
export type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly'
export type RecurrenceCadence = 'daily' | 'weekly'
export type ViewMode = 'board' | 'calendar' | 'analytics'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Tag {
  id: string
  label: string
  color: string // 'rose' | 'sky' | 'amber' | 'emerald' | 'violet' | 'pink' | 'slate'
}

export interface Task {
  id: string
  title: string
  assignee: Assignee
  status: Status
  priority: Priority
  dueDate: string
  notes: string
  createdAt: string
  // v2 additions
  subtasks: Subtask[]
  tags: string[]           // tag IDs
  recurring: RecurringType
  recurringTemplateId?: string
  recurringInstanceDate?: string
  externalSource?: 'google-calendar' | 'whatsapp' | 'api'
  externalId?: string
  externalUpdatedAt?: string
  order: number
}

export type NewTaskDefaults = Partial<Omit<Task, 'id' | 'title' | 'createdAt' | 'subtasks' | 'tags' | 'order'>>

export interface RecurringTaskTemplate {
  id: string
  title: string
  groupId: string
  assignee: Assignee
  priority: Priority
  notes: string
  cadence: RecurrenceCadence
  daysOfWeek: number[]
  active: boolean
  generatedDates: string[]
  createdAt: string
}

export type RecurringTaskInput = Omit<RecurringTaskTemplate, 'id' | 'generatedDates' | 'createdAt'>

export interface Group {
  id: string
  title: string
  color: string
  collapsed: boolean
  tasks: Task[]
  order: number
}

export interface BoardState {
  version: number
  groups: Group[]
  tags: Tag[]
  recurringTasks: RecurringTaskTemplate[]
  recurringDefaultsAdded: boolean
  filterAssignee: Assignee | ''
  filterStatus: Status | ''
  filterTag: string
  viewMode: ViewMode
  darkMode: boolean
  searchQuery: string
}
