import './StatusBar.css'

export default function StatusBar({ connected, flightCount }) {
  const loading = connected && flightCount === 0

  return (
    <div className="status-bar">
      <span className={`status-dot ${connected ? 'live' : 'off'} ${loading ? 'pulse' : ''}`} />
      <span className="status-text">
        {loading ? 'LOADING' : connected ? 'LIVE' : 'OFFLINE'}
      </span>
      <span className="status-count">
        {flightCount.toLocaleString()} flights
      </span>
    </div>
  )
}
