const STORAGE_KEY = 'veeva-racing-leaderboard-v1'

export interface LeaderboardEntry {
  id: string
  driverName: string
  bestLapMs: number
  totalTimeMs: number
  lapTimes: number[]
  raceDate: string     // ISO string
}

export function formatTime(ms: number): string {
  if (!ms || ms <= 0) return '--:--.---'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis  = ms % 1000
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export function saveRaceResult(
  entry: Omit<LeaderboardEntry, 'id' | 'raceDate'>
): LeaderboardEntry {
  const all = getRawLeaderboard()
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    raceDate: new Date().toISOString(),
  }
  all.push(newEntry)
  // Sort by best lap ascending, keep top 500
  all.sort((a, b) => a.bestLapMs - b.bestLapMs)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 500)))
  return newEntry
}

export function getRawLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
  } catch {
    return []
  }
}

/** Returns top entries globally, sorted by best lap */
export function getGlobalLeaderboard(limit = 20): LeaderboardEntry[] {
  return getRawLeaderboard().slice(0, limit)
}

/** Returns entries filtered by driver name (case-insensitive substring match) */
export function getLeaderboardByDriver(name: string, limit = 20): LeaderboardEntry[] {
  const lc = name.toLowerCase().trim()
  if (!lc) return getGlobalLeaderboard(limit)
  return getRawLeaderboard()
    .filter(e => e.driverName.toLowerCase().includes(lc))
    .slice(0, limit)
}

export function clearLeaderboard(): void {
  localStorage.removeItem(STORAGE_KEY)
}
