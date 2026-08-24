import React, { useState } from 'react'
import { Zap, ChevronRight, User, Trophy } from 'lucide-react'
import { CAR_COLORS } from '../../lib/constants'

interface Props {
  onStartRace: (name: string, colorIndex: number) => void
  onViewLeaderboard: () => void
}

export default function Lobby({ onStartRace, onViewLeaderboard }: Props) {
  const [name, setName]             = useState('')
  const [colorIndex, setColorIndex] = useState(0)

  const canStart = name.trim().length >= 2

  function handleStart() {
    if (!canStart) return
    onStartRace(name.trim(), colorIndex)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleStart()
  }

  return (
    <div className="min-h-screen bg-veeva-navy flex items-center justify-center p-4">
      {/* Animated background stripes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 opacity-5"
            style={{
              left: `${i * 12.5}%`,
              width: '6%',
              background: '#FF5F00',
              transform: 'skewX(-15deg)',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-veeva-orange shadow-lg shadow-orange-500/40 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
            VEEVA <span className="text-veeva-orange">RACING</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Pleasanton HQ Circuit · 3 Laps · Single Player</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-5">
          {/* Driver Name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5" /> Driver Name
            </label>
            <input
              type="text"
              maxLength={24}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
              placeholder="Your name…"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500
                         focus:outline-none focus:border-veeva-orange focus:ring-1 focus:ring-veeva-orange transition"
            />
          </div>

          {/* Car Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Car Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {CAR_COLORS.map((color, i) => (
                <button
                  key={color}
                  onClick={() => setColorIndex(i)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                    ${colorIndex === i ? 'border-white scale-110 shadow-md' : 'border-transparent'}`}
                  style={{ background: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full bg-veeva-orange hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            Start Race <ChevronRight className="w-5 h-5" />
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onViewLeaderboard}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                       text-slate-300 hover:text-white font-semibold py-3 rounded-xl transition-all
                       active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <Trophy className="w-4 h-4 text-veeva-orange" /> View Leaderboard
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5 space-y-0.5">
          <span className="block">WASD / Arrow Keys — Drive &nbsp;·&nbsp; Space — Drift &nbsp;·&nbsp; R — Reset</span>
          <span className="block">Lap times posted to Google Sheet</span>
        </p>
      </div>
    </div>
  )
}
