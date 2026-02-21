import useFlightRoute from '../hooks/useFlightRoute'
import './FlightCard.css'

// 국가명 → ISO 3166-1 alpha-2
const COUNTRY_CODES = {
  'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Argentina': 'AR',
  'Australia': 'AU', 'Austria': 'AT', 'Bahrain': 'BH', 'Bangladesh': 'BD',
  'Belgium': 'BE', 'Brazil': 'BR', 'Canada': 'CA', 'Chile': 'CL',
  'China': 'CN', 'Colombia': 'CO', 'Croatia': 'HR', 'Czech Republic': 'CZ',
  'Czechia': 'CZ', 'Denmark': 'DK', 'Egypt': 'EG', 'Estonia': 'EE',
  'Ethiopia': 'ET', 'Finland': 'FI', 'France': 'FR', 'Germany': 'DE',
  'Greece': 'GR', 'Hong Kong': 'HK', 'Hungary': 'HU', 'Iceland': 'IS',
  'India': 'IN', 'Indonesia': 'ID', 'Iran, Islamic Republic of': 'IR',
  'Iraq': 'IQ', 'Ireland': 'IE', 'Israel': 'IL', 'Italy': 'IT',
  'Japan': 'JP', 'Jordan': 'JO', 'Kazakhstan': 'KZ', 'Kenya': 'KE',
  'Kuwait': 'KW', 'Latvia': 'LV', 'Lithuania': 'LT', 'Luxembourg': 'LU',
  'Malaysia': 'MY', 'Mexico': 'MX', 'Morocco': 'MA', 'Netherlands': 'NL',
  'New Zealand': 'NZ', 'Nigeria': 'NG', 'Norway': 'NO', 'Oman': 'OM',
  'Pakistan': 'PK', 'Panama': 'PA', 'Peru': 'PE', 'Philippines': 'PH',
  'Poland': 'PL', 'Portugal': 'PT', 'Qatar': 'QA', 'Romania': 'RO',
  'Republic of Korea': 'KR', 'Republic of Moldova': 'MD',
  'Russian Federation': 'RU', 'Saudi Arabia': 'SA', 'Serbia': 'RS',
  'Singapore': 'SG', 'Slovakia': 'SK', 'Slovenia': 'SI', 'South Africa': 'ZA',
  'Spain': 'ES', 'Sri Lanka': 'LK', 'Sweden': 'SE', 'Switzerland': 'CH',
  'Taiwan': 'TW', 'Thailand': 'TH', 'Turkey': 'TR', 'Türkiye': 'TR',
  'Ukraine': 'UA', 'United Arab Emirates': 'AE', 'United Kingdom': 'GB',
  'United States': 'US', 'Uzbekistan': 'UZ', 'Vietnam': 'VN',
}

function countryFlag(country) {
  const code = COUNTRY_CODES[country]
  if (!code) return ''
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

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
  const { route, loading: routeLoading } = useFlightRoute(flight.icao24)

  return (
    <div className="flight-card">
      <button className="flight-card-close" onClick={onClose}>×</button>
      <div className="flight-card-callsign">
        {flight.callsign || 'N/A'}
      </div>
      <div className="flight-card-country">
        {countryFlag(flight.country) && <span className="flight-card-flag">{countryFlag(flight.country)}</span>}
        {flight.country}
      </div>

      <div className="flight-card-route">
        {routeLoading ? (
          <span className="flight-card-route-loading">Loading route…</span>
        ) : route ? (
          <>
            <span className="flight-card-route-apt">{route.departure || '???'}</span>
            <span className="flight-card-route-arrow">→</span>
            <span className="flight-card-route-apt">{route.arrival || '???'}</span>
          </>
        ) : (
          <span className="flight-card-route-loading">No route data</span>
        )}
      </div>

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
