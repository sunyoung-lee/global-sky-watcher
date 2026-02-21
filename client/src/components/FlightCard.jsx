import './FlightCard.css'

export default function FlightCard({ flight, onClose }) {
  const altKm = (flight.altitude / 1000).toFixed(1)
  const speedKmh = (flight.velocity * 3.6).toFixed(0)

  return (
    <div className="flight-card">
      <button className="flight-card-close" onClick={onClose}>×</button>
      <div className="flight-card-callsign">
        {flight.callsign || 'N/A'}
      </div>
      <div className="flight-card-country">{flight.country}</div>
      <div className="flight-card-grid">
        <div className="flight-card-item">
          <span className="flight-card-label">Altitude</span>
          <span className="flight-card-value">{altKm} km</span>
        </div>
        <div className="flight-card-item">
          <span className="flight-card-label">Speed</span>
          <span className="flight-card-value">{speedKmh} km/h</span>
        </div>
        <div className="flight-card-item">
          <span className="flight-card-label">Heading</span>
          <span className="flight-card-value">{flight.heading.toFixed(0)}°</span>
        </div>
        <div className="flight-card-item">
          <span className="flight-card-label">ICAO</span>
          <span className="flight-card-value">{flight.icao24}</span>
        </div>
      </div>
      <div className="flight-card-divider" />
      <div className="flight-card-coords">
        {flight.lat.toFixed(2)}°, {flight.lng.toFixed(2)}°
      </div>
    </div>
  )
}
