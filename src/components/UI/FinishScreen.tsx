import React, { useEffect, useState } from 'react'
import { Trophy, RotateCcw, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { formatTime } from '../../lib/leaderboard'
import { isSheetConfigured } from '../../lib/googleSheets'

interface Props {
  driverName: string
  lapTimes: number[]
  bestLapMs: number
  totalTimeMs: number
  submitStatus: 'idle' | 'sending' | 'sent' | 'error'
  onPlayAgain: () => void
  onViewLeaderboard: () => void
}

export default function FinishScreen({
  driverName,
  lapTimes,
  bestLapMs,
  totalTimeMs,
  submitStatus,
  onPlayAgain,
  onViewLeaderboard,
}: Props) {
  const [visible, setVisible] = useState(false)

  // Slight delay so the animation feels intentional
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4
                  bg-veeva-navy/95 backdrop-blur-sm transition-opacity duration-500
                  ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Decorative background rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full border border-veeva-orange/10 animate-ping"
             style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[400px] h-[400px] rounded-full border border-veeva-orange/15 animate-ping"
             style={{ animationDuration: '2.5s', animationDelay: '0.4s' }} />
      </div>

      <div className="relative w-full max-w-lg mx-auto flex flex-col gap-5">

        {/* ── Trophy & title ──────────────────────────────────────────────── */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full bg-veeva-orange/20 border-2 border-veeva-orange
                            flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Trophy className="w-10 h-10 text-veeva-orange" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            CONGRATULATIONS!
          </h1>
          <p className="text-veeva-orange font-bold text-lg mt-1">{driverName}</p>
          <p className="text-slate-400 text-sm mt-0.5">Veeva Raceway · 3 Laps Complete</p>
        </div>

        {/* ── Lap time cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {lapTimes.map((t, i) => {
            const isBest = t === bestLapMs
            return (
              <div
                key={i}
                className={`rounded-2xl py-4 px-3 text-center border transition
                  ${isBest
                    ? 'bg-yellow-400/10 border-yellow-400/50 shadow shadow-yellow-400/20'
                    : 'bg-white/5 border-white/10'}`}
              >
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1.5">
                  Lap {i + 1}
                </div>
                <div className={`font-mono font-bold text-xl ${isBest ? 'text-yellow-300' : 'text-white'}`}>
                  {formatTime(t)}
                </div>
                {isBest && (
                  <div className="mt-1.5 text-[10px] font-black text-yellow-400 uppercase tracking-wider">
                    ⭐ Best Lap
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Summary row ─────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Time</div>
            <div className="text-white font-mono font-bold text-xl">{formatTime(totalTimeMs)}</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Best Lap</div>
            <div className="text-yellow-400 font-mono font-bold text-xl">{formatTime(bestLapMs)}</div>
          </div>
        </div>

        {/* ── Google Sheets status ─────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 text-sm min-h-[24px]">
          {submitStatus === 'sending' && (
            <>
              <Loader className="w-4 h-4 text-yellow-400 animate-spin" />
              <span className="text-yellow-400">Saving to Google Sheets…</span>
            </>
          )}
          {submitStatus === 'sent' && (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Lap time recorded in Google Sheets ✓</span>
            </>
          )}
          {submitStatus === 'error' && !isSheetConfigured && (
            <>
              <AlertCircle className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">
                Add <code className="text-slate-400 bg-white/10 px-1 rounded">VITE_APPS_SCRIPT_URL</code> to .env to record scores
              </span>
            </>
          )}
          {submitStatus === 'error' && isSheetConfigured && (
            <>
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400">Sheet save failed — check Apps Script deployment</span>
            </>
          )}
        </div>

        {/* ── Action buttons ──────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            onClick={onViewLeaderboard}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl
                       bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                       text-slate-300 hover:text-white text-sm font-semibold transition"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl
                       bg-veeva-orange hover:bg-orange-500 active:scale-95
                       text-white font-black text-lg transition shadow-lg shadow-orange-500/30"
          >
            <RotateCcw className="w-5 h-5" />
            Race Again
          </button>
        </div>

      </div>
    </div>
  )
}
