import React from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delayMs`
 * milliseconds of silence.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState<T>(value)

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
