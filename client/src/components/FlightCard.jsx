import './FlightCard.css'

const CATEGORY_NAMES = {
  1: 'No ADS-B', 2: 'Light', 3: 'Small', 4: 'Large',
  5: 'High Vortex', 6: 'Heavy', 7: 'High Perf', 8: 'Rotorcraft',
  9: 'Glider', 10: 'Airship', 11: 'Parachute', 12: 'Ultralight',
  14: 'UAV', 15: 'Space',
}

function headingToDir(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function vertRateInfo(rate) {
  if (rate == null) return { label: '—', className: '' }
  if (rate > 0.5) return { label: `▲ ${rate.toFixed(1)} m/s`, className: 'climbing' }
  if (rate < -0.5) return { label: `▼ ${Math.abs(rate).toFixed(1)} m/s`, className: 'descending' }
  return { label: '— Cruising', className: 'cruising' }
}

export default function FlightCard({ flight, onClose }) {
  const altKm = (flight.altitude / 1000).toFixed(1)
  const speedKmh = (flight.velocity * 3.6).toFixed(0)
  const vr = vertRateInfo(flight.vertRate)
  const categoryName = CATEGORY_NAMES[flight.category]

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
          <span className="flight-card-value">{flight.heading.toFixed(0)}° {headingToDir(flight.heading)}</span>
        </div>
        <div className="flight-card-item">
          <span className="flight-card-label">Vert Rate</span>
          <span className={`flight-card-value flight-card-vr ${vr.className}`}>{vr.label}</span>
        </div>
        <div className="flight-card-item">
          <span className="flight-card-label">ICAO</span>
          <span className="flight-card-value">{flight.icao24}</span>
        </div>
        {flight.squawk && (
          <div className="flight-card-item">
            <span className="flight-card-label">Squawk</span>
            <span className="flight-card-value">{flight.squawk}</span>
          </div>
        )}
        {categoryName && (
          <div className="flight-card-item">
            <span className="flight-card-label">Type</span>
            <span className="flight-card-value">{categoryName}</span>
          </div>
        )}
      </div>
      <div className="flight-card-divider" />
      <div className="flight-card-coords">
        {flight.lat.toFixed(2)}°, {flight.lng.toFixed(2)}°
      </div>
    </div>
  )
}
