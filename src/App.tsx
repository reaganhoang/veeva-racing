import React, { useState, lazy, Suspense } from 'react'
import Lobby from './components/UI/Lobby'
const GameScene = lazy(() => import('./components/Canvas/GameScene'))
import LeaderboardPage from './components/UI/LeaderboardPage'

type Page = 'lobby' | 'leaderboard' | 'game'

interface PlayerConfig {
  name: string
  colorIndex: number
}

export default function App() {
  const [page, setPage]     = useState<Page>('lobby')
  const [config, setConfig] = useState<PlayerConfig | null>(null)
  const [gameKey, setGameKey] = useState(0)

  if (page === 'leaderboard') {
    return (
      <LeaderboardPage
        onPlay={() => setPage('lobby')}
      />
    )
  }

  if (page === 'game' && config) {
    return (
      <Suspense fallback={<div style={{ background: '#0B192C', width: '100vw', height: '100vh' }} />}>
        <GameScene
          key={gameKey}
          playerName={config.name}
          colorIndex={config.colorIndex}
          onExit={() => {
            setPage('lobby')
            setGameKey(k => k + 1)
          }}
          onViewLeaderboard={() => {
            setPage('leaderboard')
            setGameKey(k => k + 1)
          }}
        />
      </Suspense>
    )
  }

  return (
    <Lobby
      onStartRace={(name, colorIndex) => {
        setConfig({ name, colorIndex })
        setPage('game')
      }}
      onViewLeaderboard={() => setPage('leaderboard')}
    />
  )
}
