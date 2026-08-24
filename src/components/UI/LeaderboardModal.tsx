import React, { useState, useEffect, useCallback } from 'react'
import { Trophy, Search, RefreshCw, ExternalLink, Loader } from 'lucide-react'
import { formatTime, getRawLeaderboard, type LeaderboardEntry } from '../../lib/leaderboard'
import { fetchSheetLeaderboard, openGoogleSheet, SHEET_URL, type SheetEntry } from '../../lib/googleSheets'

interface Props {
  driverName: string
  bestLapMs: number
  totalTimeMs: number
  lapTimes: number[]
  submitStatus: 'idle' | 'sending' | 'sent' | 'error'
  onPlayAgain: () => void
}

const MEDAL = ['🥇', '🥈', '🥉']

type TabEntry = { driverName: string; totalTimeMs: number; source: 'sheet' | 'local' }

function toTabEntry(e: SheetEntry | LeaderboardEntry): TabEntry {
  return {
    driverName:  e.driverName,
    totalTimeMs: e.totalTimeMs,
    source:      'lapTimes' in e && Array.isArray((e as LeaderboardEntry).lapTimes) && typeof (e as LeaderboardEntry).raceDate === 'string'
      ? 'local'
      : 'sheet',
  }
}

export default function LeaderboardModal({
  driverName,
  bestLapMs,
  totalTimeMs,
  lapTimes,
  submitStatus,
  onPlayAgain,
}: Props) {
  const [search, setSearch]   = useState('')
  const [entries, setEntries] = useState<TabEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [source, setSource]   = useState<'sheet' | 'local'>('sheet')

  const scriptConfigured = !!import.meta.env.VITE_APPS_SCRIPT_URL

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      if (scriptConfigured) {
        const data = await fetchSheetLeaderboard(q || undefined)
        if (data.length > 0) {
          setEntries(data.map(e => ({ ...toTabEntry(e), source: 'sheet' })))
          setSource('sheet')
          return
        }
      }
      // Fallback: localStorage
      const local = getRawLeaderboard()
      const filtered = q
        ? local.filter(e => e.driverName.toLowerCase().includes(q.toLowerCase()))
        : local
      setEntries(filtered.slice(0, 20).map(e => ({ ...toTabEntry(e), source: 'local' })))
      setSource('local')
    } finally {
      setLoading(false)
    }
  }, [scriptConfigured])

  useEffect(() => { load('') }, [load])

  const handleSearch = (val: string) => {
    setSearch(val)
    load(val)
  }

  const statusMap = {
    idle:    { text: '',                          cls: '' },
    sending: { text: '⏳ Saving to Google Sheet…', cls: 'text-yellow-400' },
    sent:    { text: '✓ Saved to Google Sheet',   cls: 'text-green-400' },
    error:   { text: '⚠ Sheet save failed — see .env', cls: 'text-orange-400' },
  }

  return (
    <div className="fixed inset-0 bg-veeva-navy/95 backdrop-blur flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden my-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-veeva-orange to-orange-400 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-white flex-shrink-0" />
            <div>
              <h2 className="text-white font-black text-2xl">Race Complete!</h2>
              <p className="text-orange-100 text-sm">{driverName}</p>
            </div>
          </div>
          <button
            onClick={openGoogleSheet}
            title="Open Google Sheet"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold
                       px-3 py-1.5 rounded-lg transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Sheet
          </button>
        </div>

        {/* ── Your Result ────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {lapTimes.map((t, i) => (
              <div key={i} className="text-center bg-white/5 rounded-xl py-3">
                <div className="text-slate-400 text-xs mb-1">Lap {i + 1}</div>
                <div className="text-white font-mono font-bold">{formatTime(t)}</div>
                {t === bestLapMs && (
                  <div className="text-yellow-400 text-[10px] font-bold mt-0.5">⭐ BEST</div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total</span>
            <span className="text-white font-mono font-semibold">{formatTime(totalTimeMs)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-400">Best Lap</span>
            <span className="text-yellow-400 font-mono font-semibold">{formatTime(bestLapMs)}</span>
          </div>

          {/* Submit status */}
          {submitStatus !== 'idle' && (
            <p className={`text-xs mt-2 ${statusMap[submitStatus].cls}`}>
              {statusMap[submitStatus].text}
            </p>
          )}
          {!scriptConfigured && (
            <p className="text-xs mt-2 text-slate-600">
              Add <code className="text-slate-400">VITE_APPS_SCRIPT_URL</code> to enable Google Sheets sync
            </p>
          )}
        </div>

        {/* ── Leaderboard ────────────────────────────────────────────────── */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by driver name…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2
                           text-white text-sm placeholder-slate-600 focus:outline-none
                           focus:border-veeva-orange transition"
              />
            </div>
            <button
              onClick={() => load(search)}
              disabled={loading}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition disabled:opacity-40"
              title="Refresh"
            >
              {loading
                ? <Loader className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Table */}
          <div className="max-h-52 overflow-y-auto">
            {loading && entries.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-center text-slate-600 text-sm py-6">
                {search ? `No results for "${search}"` : 'No race records yet.'}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left pb-2 pl-1">#</th>
                    <th className="text-left pb-2">Driver</th>
                    <th className="text-right pb-2 pr-1">Total Time</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const isMe = e.driverName === driverName && e.totalTimeMs === totalTimeMs
                    return (
                      <tr key={i} className={`border-t border-white/5 ${isMe ? 'bg-veeva-orange/10' : ''}`}>
                        <td className="py-2 pl-1 font-bold text-slate-400">
                          {MEDAL[i] ?? `${i + 1}`}
                        </td>
                        <td className={`py-2 font-medium ${isMe ? 'text-veeva-orange' : 'text-white'}`}>
                          {e.driverName}
                          {isMe && <span className="text-xs ml-1 text-orange-300">(you)</span>}
                        </td>
                        <td className="py-2 pr-1 text-right font-mono text-slate-300">
                          {formatTime(e.totalTimeMs)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-slate-600 text-xs mt-2">
            {source === 'sheet' ? '📊 Live from Google Sheet' : '💾 Local data (set VITE_APPS_SCRIPT_URL for shared leaderboard)'}
          </p>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 pb-5 pt-1 flex gap-3">
          <button
            onClick={openGoogleSheet}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300
                       hover:text-white rounded-xl transition text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Full Leaderboard
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-veeva-orange hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition active:scale-95"
          >
            Race Again
          </button>
        </div>
      </div>
    </div>
  )
}
