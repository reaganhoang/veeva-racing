import React from 'react'
import { TOTAL_LAPS } from '../../lib/gameConstants'
import { formatTime } from '../../lib/leaderboard'

interface Props {
  speed: number          // km/h
  currentLap: number     // 1-based (0 = not started)
  lapTimes: number[]     // ms per completed lap
  bestLap: number        // ms, 0 = none
  totalElapsed: number   // ms since race start
  position: number       // race position (1-based)
  totalPlayers: number
  nextCheckpoint: number // 0-3
  countdown: number      // 3,2,1,0 = GO, -1 = race running
  currentItem?: string | null
  isTeleporting?: boolean
}

function Speedometer({ speed }: { speed: number }) {
  const maxSpeed = 140
  const pct = Math.min(speed / maxSpeed, 1)
  const angle = -140 + pct * 280
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Arc background */}
        <path d="M 18 88 A 50 50 0 1 1 102 88" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
        {/* Arc fill */}
        <path
          d="M 18 88 A 50 50 0 1 1 102 88"
          fill="none"
          stroke="#FF5F00"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${pct * 220} 220`}
        />
        {/* Needle */}
        <line
          x1="60" y1="60"
          x2={60 + 38 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={60 + 38 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="white" strokeWidth="2.5" strokeLinecap="round"
        />
        <circle cx="60" cy="60" r="4" fill="white" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
        <span className="text-white font-black text-xl leading-none">
          {Math.round(speed)}
        </span>
        <span className="text-slate-400 text-[10px]">km/h</span>
      </div>
    </div>
  )
}

export default function HUD({
  speed,
  currentLap,
  lapTimes,
  bestLap,
  totalElapsed,
  position,
  totalPlayers,
  nextCheckpoint,
  countdown,
  currentItem,
  isTeleporting,
}: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">

      {/* Countdown overlay */}
      {countdown >= 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-white font-black text-center"
            style={{
              fontSize: countdown === 0 ? '7rem' : '10rem',
              textShadow: '0 0 40px rgba(255,95,0,0.9), 0 4px 20px rgba(0,0,0,0.8)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-6">
        {/* Lap counter */}
        <div className="bg-black/60 backdrop-blur rounded-xl px-5 py-2 text-center border border-white/10">
          <div className="text-veeva-orange font-black text-2xl leading-none">
            {Math.max(1, currentLap)} / {TOTAL_LAPS}
          </div>
          <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Lap</div>
        </div>

        {/* Race timer */}
        <div className="bg-black/60 backdrop-blur rounded-xl px-5 py-2 text-center border border-white/10 min-w-[120px]">
          <div className="text-white font-mono text-lg leading-none">{formatTime(totalElapsed)}</div>
          <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Time</div>
        </div>

        {/* Position */}
        <div className="bg-black/60 backdrop-blur rounded-xl px-5 py-2 text-center border border-white/10">
          <div className="text-white font-black text-2xl leading-none">
            <span className="text-veeva-orange">{position}</span>
            <span className="text-sm text-slate-400">/{totalPlayers}</span>
          </div>
          <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Pos</div>
        </div>
      </div>

      {/* Lap times (top-right) */}
      <div className="absolute top-4 right-4 space-y-1">
        {lapTimes.map((t, i) => (
          <div key={i} className="flex justify-end items-center gap-2 bg-black/50 backdrop-blur rounded-lg px-3 py-1">
            <span className="text-slate-400 text-xs">L{i + 1}</span>
            <span className="text-white font-mono text-sm">{formatTime(t)}</span>
            {t === bestLap && <span className="text-yellow-400 text-xs font-bold">BEST</span>}
          </div>
        ))}
        {bestLap > 0 && lapTimes.length < TOTAL_LAPS && (
          <div className="flex justify-end items-center gap-2 bg-black/40 backdrop-blur rounded-lg px-3 py-1">
            <span className="text-slate-500 text-xs">Best</span>
            <span className="text-yellow-400 font-mono text-sm">{formatTime(bestLap)}</span>
          </div>
        )}
      </div>

      {/* Checkpoint mini-progress (center bottom) */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-1.5 rounded-full transition-colors
              ${i < nextCheckpoint ? 'bg-veeva-orange' : 'bg-white/20'}`}
          />
        ))}
      </div>

      {/* Current item display */}
      {currentItem && (
        <div className="absolute bottom-44 left-1/2 -translate-x-1/2">
          <div className="bg-black/70 backdrop-blur border border-veeva-orange/50 rounded-2xl px-5 py-3 text-center min-w-[140px]">
            <div className="text-3xl mb-1">
              {currentItem === 'boost' ? '🍊' : currentItem === 'turbo' ? '⚡' : '🚀'}
            </div>
            <div className="text-veeva-orange font-black text-sm uppercase tracking-wider">
              {currentItem === 'boost' ? 'Data Boost' : currentItem === 'turbo' ? 'Turbo Charge' : 'Rocket Launch'}
            </div>
            <div className="text-slate-400 text-xs mt-0.5">Press E to use</div>
          </div>
        </div>
      )}

      {/* Teleport flash */}
      {isTeleporting && (
        <>
          {/* Full-screen purple overlay */}
          <div className="absolute inset-0 bg-purple-700/25 pointer-events-none" />
          {/* WARPED! text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="text-white font-black text-8xl tracking-widest select-none"
              style={{ textShadow: '0 0 60px rgba(150,0,255,1), 0 0 25px rgba(200,100,255,0.9), 0 4px 16px rgba(0,0,0,0.8)' }}
            >
              WARPED!
            </div>
          </div>
        </>
      )}

      {/* Speedometer (bottom-left) */}
      <div className="absolute bottom-4 left-4">
        <Speedometer speed={speed} />
      </div>

      {/* Controls hint (bottom-right) */}
      <div className="absolute bottom-4 right-4 text-slate-600 text-xs text-right space-y-0.5">
        <div>WASD / Arrows – Drive</div>
        <div>Space – Drift</div>
        <div>E – Use Item</div>
        <div>R – Reset</div>
      </div>

      {/* Wrong way indicator (when regressing checkpoints) */}
    </div>
  )
}
