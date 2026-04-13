import React from 'react'
import { BoardState, Group } from '../types'
import { MAX_TITLE_LENGTH } from '../constants'

interface Props {
  state: BoardState
  onImport: (state: BoardState) => void
  darkMode?: boolean
}

function tasksToCSV(groups: Group[]): string {
  const rows = [
    ['קבוצה', 'משימה', 'אחראי', 'סטטוס', 'עדיפות', 'תאריך יעד', 'הערות', 'תת-משימות'].join(','),
  ]
  for (const group of groups) {
    for (const task of group.tasks) {
      const subtasks = (task.subtasks ?? []).map(s => `${s.title}(${s.done ? '✓' : '○'})`).join('; ')
      rows.push([
        `"${group.title}"`,
        `"${task.title}"`,
        `"${task.assignee}"`,
        `"${task.status}"`,
        `"${task.priority}"`,
        `"${task.dueDate}"`,
        `"${task.notes?.replace(/"/g, '""')}"`,
        `"${subtasks}"`,
      ].join(','))
    }
  }
  return rows.join('\n')
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const ExportImport: React.FC<Props> = ({ state, onImport, darkMode }) => {
  const [importing, setImporting] = React.useState(false)
  const [importError, setImportError] = React.useState('')
  const [importSuccess, setImportSuccess] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const exportJSON = () => {
    const content = JSON.stringify(state, null, 2)
    downloadFile(content, `mandy-beit-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
  }

  const exportCSV = () => {
    const content = '\uFEFF' + tasksToCSV(state.groups) // UTF-8 BOM for Excel
    downloadFile(content, `mandy-beit-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError('')
    setImportSuccess(false)
    setImporting(true)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const raw = evt.target?.result
        if (typeof raw !== 'string') throw new Error('שגיאה בקריאת הקובץ')

        const parsed = JSON.parse(raw) as BoardState

        // Basic structural validation
        if (!parsed || typeof parsed !== 'object') throw new Error('קובץ לא תקני — JSON לא תקין')
        if (!Array.isArray(parsed.groups)) throw new Error('קובץ לא תקני — חסר שדה groups')
        for (const group of parsed.groups) {
          if (typeof group.id !== 'string' || !group.id) throw new Error('קובץ לא תקני — קבוצה ללא מזהה')
          if (typeof group.title !== 'string') throw new Error('קובץ לא תקני — כותרת קבוצה חסרה')
          if (!Array.isArray(group.tasks)) throw new Error('קובץ לא תקני — tasks אינו מערך')
          for (const task of group.tasks) {
            if (typeof task.id !== 'string' || !task.id) throw new Error('קובץ לא תקני — משימה ללא מזהה')
            if (typeof task.title !== 'string') throw new Error('קובץ לא תקני — כותרת משימה חסרה')
            if (task.title.length > MAX_TITLE_LENGTH) throw new Error(`כותרת משימה ארוכה מדי (מקסימום ${MAX_TITLE_LENGTH} תווים)`)
          }
        }

        onImport(parsed)
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'שגיאה בייבוא הקובץ')
      } finally {
        setImporting(false)
        if (fileRef.current) fileRef.current.value = ''
      }
    }
    reader.onerror = () => {
      setImportError('שגיאה בקריאת הקובץ')
      setImporting(false)
    }
    reader.readAsText(file, 'utf-8')
  }

  const bg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-800'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const btnBase = `text-xs font-medium px-3 py-2 rounded-lg border transition-colors flex items-center gap-1.5`
  const btnLight = darkMode
    ? `${btnBase} bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600`
    : `${btnBase} bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100`

  const taskCount = state.groups.reduce((sum, g) => sum + g.tasks.length, 0)

  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <h3 className={`text-sm font-bold mb-1 ${textMain}`}>גיבוי וייצוא</h3>
      <p className={`text-xs mb-4 ${textMuted}`}>{taskCount} משימות • {state.groups.length} קבוצות</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={exportJSON} className={btnLight}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          JSON גיבוי
        </button>

        <button onClick={exportCSV} className={btnLight}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          ייצוא CSV (Excel)
        </button>

        <label className={`${btnLight} cursor-pointer`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {importing ? 'מייבא...' : 'ייבוא JSON'}
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            disabled={importing}
          />
        </label>
      </div>

      {importError && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          ❌ {importError}
        </div>
      )}
      {importSuccess && (
        <div className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          ✅ הנתונים יובאו בהצלחה
        </div>
      )}

      <p className={`text-[11px] mt-3 ${textMuted}`}>
        גיבוי JSON שומר את כל הנתונים כולל תגיות ורוטינות. CSV מתאים לפתיחה ב-Excel.
      </p>
    </div>
  )
}
