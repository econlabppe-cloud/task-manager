import React from 'react'
import { Group, NewTaskDefaults, Priority } from '../types'
import { formatDateLabel, parseSmartTask } from '../taskIntelligence'

type CaptureSource = 'typing' | 'voice'

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternativeLike
}

interface SpeechRecognitionEventLike {
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface Props {
  groups: Group[]
  onAddTask: (groupId: string, title: string, defaults?: NewTaskDefaults) => void
}

const priorityClass: Record<Priority, string> = {
  'נמוך': 'bg-green-50 text-green-700 border-green-200',
  'בינוני': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'גבוה': 'bg-red-50 text-red-700 border-red-200',
}

export const SmartCapture: React.FC<Props> = ({ groups, onAddTask }) => {
  const [text, setText] = React.useState('')
  const [listening, setListening] = React.useState(false)
  const [source, setSource] = React.useState<CaptureSource>('typing')
  const [message, setMessage] = React.useState('')
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null)
  const baseTextRef = React.useRef('')

  const recognitionConstructor = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return window.SpeechRecognition ?? window.webkitSpeechRecognition
  }, [])

  const draft = React.useMemo(() => parseSmartTask(text, groups), [groups, text])
  const canAdd = text.trim().length > 0 && draft.groupId.length > 0

  React.useEffect(() => {
    if (!message) return
    const timeoutId = window.setTimeout(() => setMessage(''), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  React.useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  const startListening = () => {
    if (!recognitionConstructor || listening) return

    const recognition = new recognitionConstructor()
    recognition.lang = 'he-IL'
    recognition.continuous = false
    recognition.interimResults = true
    baseTextRef.current = text.trim()

    recognition.onresult = event => {
      let transcript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? ''
      }

      const nextText = [baseTextRef.current, transcript.trim()].filter(Boolean).join(' ')
      setText(nextText)
      setSource('voice')
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      setMessage('לא הצלחתי לקלוט את ההקלטה. אפשר לכתוב את זה בשורה אחת.')
    }

    recognitionRef.current = recognition
    setListening(true)
    setMessage('')
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const submit = () => {
    if (!canAdd) return

    const originalText = text.trim()
    const notes = source === 'voice' ? `נקלט מהקלטה: ${originalText}` : ''

    onAddTask(draft.groupId, draft.title, {
      assignee: draft.assignee,
      priority: draft.priority,
      dueDate: draft.dueDate,
      notes,
      status: 'לא התחיל',
    })

    setText('')
    setSource('typing')
    setMessage(`נוספה משימה ל${draft.groupTitle}`)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">איסוף מהיר</h2>
          <p className="text-xs text-gray-500 mt-1">
            אפשר להגיד או לכתוב: "מחר לקנות חלב, ליהודה, דחוף"
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            disabled={!recognitionConstructor}
            className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold border transition-colors ${
              listening
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 disabled:bg-gray-50 disabled:text-gray-300 disabled:border-gray-200'
            }`}
            title={recognitionConstructor ? 'הקלטת משימה' : 'הדפדפן לא תומך בזיהוי דיבור'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5v3m0 0h3m-3 0H9m7-12V7a4 4 0 00-8 0v2.5a4 4 0 008 0zM5 10a7 7 0 0014 0" />
            </svg>
            {listening ? 'עצור הקלטה' : 'הקלט משימה'}
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canAdd}
            className="px-3 py-2 rounded text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 transition-colors"
          >
            הוסף חכם
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] mt-4">
        <textarea
          value={text}
          onChange={event => {
            setText(event.target.value)
            setSource('typing')
          }}
          onKeyDown={handleKeyDown}
          placeholder="לדוגמה: ביום חמישי לתקן את הברז, יהודה, עדיפות גבוהה"
          dir="rtl"
          className="w-full min-h-[88px] rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:bg-white resize-none"
        />

        <div className="border border-gray-200 rounded p-3 bg-gray-50 min-h-[88px]">
          <div className="text-xs font-semibold text-gray-500 mb-2">פענוח לפני הוספה</div>
          {text.trim() ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800 line-clamp-2">{draft.title}</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] px-2 py-1 rounded border bg-white text-gray-600 border-gray-200">
                  {draft.groupTitle || 'אין קבוצה'}
                </span>
                <span className="text-[11px] px-2 py-1 rounded border bg-white text-gray-600 border-gray-200">
                  {draft.assignee || 'לא שויך'}
                </span>
                <span className={`text-[11px] px-2 py-1 rounded border ${priorityClass[draft.priority]}`}>
                  {draft.priority}
                </span>
                <span className="text-[11px] px-2 py-1 rounded border bg-white text-gray-600 border-gray-200">
                  {formatDateLabel(draft.dueDate)}
                </span>
              </div>
              {draft.reasons.length > 0 && (
                <div className="text-[11px] text-gray-400">
                  {draft.reasons.join(' · ')}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 leading-5">
              הכלל כאן פשוט: להוציא מהראש מהר, ואז לתת ללוח לסדר את זה.
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="mt-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {message}
        </div>
      )}
    </section>
  )
}
