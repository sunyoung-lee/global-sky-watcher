import { useState, useEffect } from 'react'
import './StatusBar.css'

function formatAgo(ts) {
  if (!ts) return ''
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  return `${Math.floor(sec / 60)}m ago`
}

export default function StatusBar({ connected, flightCount, lastUpdated }) {
  const loading = connected && flightCount === 0
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!lastUpdated) return
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [lastUpdated])

  return (
    <div className="status-bar">
      <span className={`status-dot ${connected ? 'live' : 'off'} ${loading ? 'pulse' : ''}`} />
      <span className="status-text">
        {loading ? 'LOADING' : connected ? 'LIVE' : 'OFFLINE'}
      </span>
      <span className="status-count">
        {flightCount.toLocaleString()} flights
      </span>
      {lastUpdated && !loading && (
        <span className="status-ago">{formatAgo(lastUpdated)}</span>
      )}
    </div>
  )
}
