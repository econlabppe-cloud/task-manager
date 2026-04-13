import React from 'react'
import { Group } from '../types'
import { askGemini, buildAIPrompt } from '../services/geminiAI'
import { buildFocusPlan } from '../taskIntelligence'

interface Props {
  groups: Group[]
  darkMode?: boolean
}

export const AIFocusSuggest: React.FC<Props> = ({ groups, darkMode }) => {
  const [suggestion, setSuggestion] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)
  const [lastFetch, setLastFetch] = React.useState(0)

  const bg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-800'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500'

  // Local fallback using existing buildFocusPlan
  const localSuggestion = React.useMemo(() => {
    const plan = buildFocusPlan(groups)
    if (plan.items.length === 0) return null
    const top = plan.items[0]
    return `${plan.nudge}\n\nהמשימה הכי כדאי עכשיו: "${top.task.title}" — ${top.reason}. ${top.nextStep}.`
  }, [groups])

  const fetchSuggestion = async () => {
    // Throttle: minimum 30 seconds between requests
    if (Date.now() - lastFetch < 30_000) return
    setLoading(true)
    setError(false)
    setSuggestion(null)

    try {
      const prompt = buildAIPrompt(groups)
      const result = await askGemini(prompt)
      if (result) {
        setSuggestion(result)
      } else {
        // Fell back to local
        setSuggestion(localSuggestion)
        setError(true) // show subtle fallback indicator
      }
    } catch {
      setSuggestion(localSuggestion)
      setError(true)
    } finally {
      setLoading(false)
      setLastFetch(Date.now())
    }
  }

  const hasApiKey = !!import.meta.env.VITE_GEMINI_API_KEY

  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-1.5 ${textMain}`}>
            <span>✨</span>
            <span>מה כדאי לעשות עכשיו?</span>
          </h3>
          <p className={`text-xs mt-0.5 ${textMuted}`}>
            {hasApiKey ? 'ניתוח AI של הלוח שלכם' : 'ניתוח חכם של הלוח שלכם'}
          </p>
        </div>

        <button
          onClick={fetchSuggestion}
          disabled={loading}
          aria-busy={loading}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
            loading
              ? 'border-indigo-200 bg-indigo-50 text-indigo-400 cursor-wait'
              : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300'
          }`}
        >
          {loading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              מנתח...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              הצע לי
            </>
          )}
        </button>
      </div>

      {!suggestion && !loading && (
        <div className={`text-xs rounded-lg px-3 py-3 ${darkMode ? 'bg-gray-700/50' : 'bg-indigo-50/50'}`}>
          <p className={`${textMuted} leading-5`}>
            לחצו על "הצע לי" — אנחנו ננתח את המשימות הפתוחות ונגיד לכם מה הכי כדאי לקדם ברגע זה.
          </p>
        </div>
      )}

      {suggestion && (
        <div
          className={`text-sm leading-6 rounded-lg px-4 py-3 border whitespace-pre-line ${
            darkMode
              ? 'bg-indigo-900/20 border-indigo-800 text-indigo-100'
              : 'bg-indigo-50 border-indigo-100 text-indigo-900'
          }`}
          dir="rtl"
          role="status"
          aria-live="polite"
        >
          {suggestion}
        </div>
      )}

      {error && suggestion && (
        <p className={`text-[11px] mt-2 ${textMuted}`}>
          * ניתוח מקומי (AI לא זמין כרגע)
        </p>
      )}
    </div>
  )
}
