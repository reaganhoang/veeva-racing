import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Trophy, Search, RefreshCw, Loader, Zap, ChevronRight, Clock, ChevronLeft } from 'lucide-react'
import { fetchSheetLeaderboard, isSheetConfigured, type SheetEntry } from '../../lib/googleSheets'
import { getRawLeaderboard, formatTime, type LeaderboardEntry } from '../../lib/leaderboard'

interface Props {
  onPlay: () => void
}

type Entry = { rank: number; driverName: string; totalTimeMs: number; totalTime: string; source: 'sheet' | 'local' }

const MEDAL_COLOR = ['#FFD700', '#C0C0C0', '#CD7F32']
const MEDAL_LABEL = ['🥇', '🥈', '🥉']
const REFRESH_INTERVAL = 30_000
const PAGE_SIZE = 25

function toEntry(e: SheetEntry | LeaderboardEntry, i: number): Entry {
  if ('totalTime' in e) {
    return { rank: i + 1, driverName: e.driverName, totalTimeMs: e.totalTimeMs, totalTime: e.totalTime, source: 'sheet' }
  }
  return { rank: i + 1, driverName: e.driverName, totalTimeMs: e.totalTimeMs, totalTime: formatTime(e.totalTimeMs), source: 'local' }
}

export default function LeaderboardPage({ onPlay }: Props) {
  const [entries, setEntries]   = useState<Entry[]>([])
  const [filtered, setFiltered] = useState<Entry[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [source, setSource]     = useState<'sheet' | 'local'>('sheet')
  const [page, setPage]         = useState(1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isSheetConfigured) {
        const data = await fetchSheetLeaderboard()
        if (data.length > 0) {
          const mapped = data.map((e, i) => toEntry(e, i))
          setEntries(mapped)
          setSource('sheet')
          setLastUpdated(new Date())
          return
        }
      }
      const local = getRawLeaderboard()
      local.sort((a, b) => a.totalTimeMs - b.totalTimeMs)
      setEntries(local.map((e, i) => toEntry(e, i)))
      setSource('local')
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, REFRESH_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [load])

  useEffect(() => {
    const q = search.toLowerCase().trim()
    setFiltered(q ? entries.filter(e => e.driverName.toLowerCase().includes(q)) : entries)
    setPage(1)
  }, [search, entries])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageStart  = (page - 1) * PAGE_SIZE
  const paginated  = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  const top3 = filtered.slice(0, 3)

  function goToPage(p: number) {
    const next = Math.max(1, Math.min(p, totalPages))
    setPage(next)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      ref={scrollRef}
      className="min-h-screen bg-veeva-navy overflow-y-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Animated background stripes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="absolute top-0 bottom-0 opacity-5"
            style={{ left: `${i * 12.5}%`, width: '6%', background: '#FF5F00', transform: 'skewX(-15deg)' }} />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-veeva-orange flex items-center justify-center shadow-lg shadow-orange-500/40">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none"
                style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                VEEVA <span className="text-veeva-orange">RACING</span>
              </h1>
              <p className="text-slate-500 text-xs">Global Leaderboard · Pleasanton HQ Circuit</p>
            </div>
          </div>
          <button
            onClick={onPlay}
            className="flex items-center gap-2 bg-veeva-orange hover:bg-orange-500 text-white font-bold
                       px-5 py-2.5 rounded-xl transition active:scale-95 text-sm shadow-lg shadow-orange-500/30"
          >
            Race Now <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Podium (top 3) — only on page 1, no search active ──────────── */}
        {!loading && top3.length > 0 && page === 1 && !search && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[top3[1], top3[0], top3[2]].map((e, podiumPos) => {
              if (!e) return <div key={podiumPos} />
              const actualRank = e.rank - 1
              const heights   = ['h-28', 'h-36', 'h-20']
              const glows     = [
                'shadow-slate-400/20',
                'shadow-yellow-400/30 border-yellow-400/40',
                'shadow-orange-900/20',
              ]
              return (
                <div key={e.driverName + e.totalTimeMs}
                  className={`flex flex-col items-center justify-end ${heights[podiumPos]}
                              bg-white/5 border border-white/10 ${glows[podiumPos]} rounded-2xl pb-4 pt-3 px-2
                              shadow-lg relative overflow-hidden`}
                >
                  <div className="absolute top-2 right-2 text-2xl leading-none opacity-30">
                    {MEDAL_LABEL[actualRank]}
                  </div>
                  <div className="text-3xl mb-1">{MEDAL_LABEL[actualRank]}</div>
                  <div className="font-black text-white text-sm text-center leading-tight truncate w-full px-1">
                    {e.driverName}
                  </div>
                  <div className="font-mono text-xs mt-1"
                    style={{ color: MEDAL_COLOR[actualRank] }}>
                    {e.totalTime}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Search + Refresh ─────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search driver name…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5
                         text-white text-sm placeholder-slate-600 focus:outline-none
                         focus:border-veeva-orange transition"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white
                       transition disabled:opacity-40"
            title="Refresh"
          >
            {loading
              ? <Loader className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
          </button>
        </div>

        {/* ── Full table ───────────────────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4">
          {loading && entries.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-8 h-8 text-slate-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Trophy className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">{search ? `No results for "${search}"` : 'No race records yet. Be the first!'}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">#</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-3">Driver</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Total Time</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((e, i) => (
                  <tr key={`${e.driverName}-${e.totalTimeMs}-${i}`}
                    className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-bold text-slate-400 text-sm">
                      {e.rank <= 3 ? MEDAL_LABEL[e.rank - 1] : e.rank}
                    </td>
                    <td className="px-2 py-3">
                      <span className={`font-semibold text-sm ${e.rank <= 3 ? 'text-white' : 'text-slate-300'}`}>
                        {e.driverName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">
                      {e.totalTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10
                         rounded-xl text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-slate-600 text-sm select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition
                        ${page === p
                          ? 'bg-veeva-orange text-white shadow-md shadow-orange-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                        }`}
                    >
                      {p}
                    </button>
                  )
                )
              }
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10
                         rounded-xl text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-600">
          <span>
            {source === 'sheet' ? '📊 Live from Google Sheets' : '💾 Local data (VITE_APPS_SCRIPT_URL not set)'}
          </span>
          {lastUpdated && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {lastUpdated.toLocaleTimeString()}
              {' · '}auto-refreshes every 30s
            </span>
          )}
        </div>

        {/* ── Play button (bottom) ─────────────────────────────────────────── */}
        <button
          onClick={onPlay}
          className="w-full bg-veeva-orange hover:bg-orange-500 text-white font-black py-4
                     rounded-2xl transition active:scale-95 flex items-center justify-center gap-2
                     text-lg shadow-lg shadow-orange-500/30"
          style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}
        >
          <Zap className="w-6 h-6" />
          RACE NOW
        </button>
      </div>
    </div>
  )
}
