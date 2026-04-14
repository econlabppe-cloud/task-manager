// ── App-wide constants ──────────────────────────────────────────────────────
// Centralising every magic number / string that was scattered across files.

/** localStorage key for board state */
export const STORAGE_KEY = 'mandy-home-board-v2'

/** localStorage key for legacy v1 data */
export const STORAGE_KEY_LEGACY = 'mandy-home-board-v1'

/** Current board-state schema version */
export const CURRENT_VERSION = 3

/** localStorage key that tracks processed bridge capture IDs */
export const PROCESSED_CAPTURE_KEY = 'mandy-processed-captures-v1'

/** Maximum number of processed-capture IDs to keep in localStorage */
export const MAX_PROCESSED_CAPTURES = 250

/** Maximum number of generated-dates to keep per recurring template */
export const MAX_RECURRING_GENERATED_DATES = 180

/** Bridge polling interval in milliseconds */
export const BRIDGE_POLL_INTERVAL_MS = 5_000

/** How many future days to look ahead when generating recurring tasks */
export const RECURRING_DAYS_AHEAD = 7

/** Maximum allowed characters for a task title */
export const MAX_TITLE_LENGTH = 500

/** Maximum allowed characters for task notes */
export const MAX_NOTES_LENGTH = 5_000

/** Maximum allowed characters for a group title */
export const MAX_GROUP_TITLE_LENGTH = 100

/** Maximum allowed characters for a capture text */
export const MAX_CAPTURE_TEXT_LENGTH = 2_000

/** How often (ms) to auto-sync Google Calendar when connected — 5 minutes */
export const GOOGLE_SYNC_INTERVAL_MS = 5 * 60 * 1000

/** localStorage key for Google Calendar auto-sync state */
export const GOOGLE_SYNC_PREFS_KEY = 'mandy-google-sync-v1'

/** Fixed group title used for Google-Calendar-imported events */
export const GOOGLE_CALENDAR_GROUP_TITLE = 'יומן גוגל'

/** Available group-color palette */
export const GROUP_COLORS = [
  'purple', 'blue', 'green', 'orange', 'teal', 'red', 'pink', 'indigo',
] as const
