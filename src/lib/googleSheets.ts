// ── Config ────────────────────────────────────────────────────────────────────
export const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1TM2Q1KlDLV34SY7ANg_gi-97ZrNZLQjvgwF0HVyJFOg/edit?usp=sharing'

// Set VITE_APPS_SCRIPT_URL in your .env after deploying the Google Apps Script
const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SheetEntry {
  rank: number
  timestamp: string
  driverName: string
  totalTime: string    // formatted, e.g. "1:23.456"
  totalTimeMs: number
}

// ── Submit race result ────────────────────────────────────────────────────────
// Uses no-cors so it always fires (fire-and-forget).
// The Apps Script is deployed as "Anyone, even anonymous" so it receives the POST.
export const isSheetConfigured = !!SCRIPT_URL

export interface SubmitPayload {
  driverName: string
  totalTimeMs: number
  bestLapMs: number    // kept for local leaderboard; not stored in Google Sheet
  lapTimes: number[]   // kept for local leaderboard; not stored in Google Sheet
}

export async function submitToGoogleSheet(payload: SubmitPayload): Promise<void> {
  if (!SCRIPT_URL) throw new Error('VITE_APPS_SCRIPT_URL not set in .env')

  const params = new URLSearchParams({
    action:      'submit',
    driverName:  payload.driverName,
    totalTimeMs: String(payload.totalTimeMs),
    timestamp:   new Date().toISOString(),
  })

  const url = `${SCRIPT_URL}?${params}`
  console.log('[Veeva Racing] Submitting lap time →', url)

  // no-cors: Apps Script receives the GET request fine; we just can't read the
  // opaque response. For a write-only operation this is the reliable approach —
  // regular CORS fetch is blocked by Google's 302 redirect chain.
  await fetch(url, { mode: 'no-cors', cache: 'no-store' })
  console.log('[Veeva Racing] Request sent successfully')
}

// ── Fetch leaderboard ────────────────────────────────────────────────────────
// The Apps Script handles GET?action=leaderboard and returns JSON.
// Falls back to [] if the URL isn't configured or the request fails.
export async function fetchSheetLeaderboard(driverName?: string): Promise<SheetEntry[]> {
  if (!SCRIPT_URL) return []

  try {
    const params = new URLSearchParams({ action: 'leaderboard', t: Date.now().toString() })
    if (driverName) params.set('driver', driverName)

    const res = await fetch(`${SCRIPT_URL}?${params}`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = (await res.json()) as SheetEntry[]
    return data.sort((a, b) => a.totalTimeMs - b.totalTimeMs)
  } catch {
    return []
  }
}

// ── Open the sheet in a new tab ───────────────────────────────────────────────
export function openGoogleSheet() {
  window.open(SHEET_URL, '_blank', 'noopener,noreferrer')
}
