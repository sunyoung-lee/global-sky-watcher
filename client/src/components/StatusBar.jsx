import './StatusBar.css'

export default function StatusBar({ connected, flightCount }) {
  return (
    <div className="status-bar">
      <span className={`status-dot ${connected ? 'live' : 'off'}`} />
      <span className="status-text">
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
      <span className="status-count">
        {flightCount.toLocaleString()} flights
      </span>
    </div>
  )
}
