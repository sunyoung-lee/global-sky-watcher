const OPENSKY_URL = 'https://opensky-network.org/api/states/all'

async function fetchFlights() {
  const res = await fetch(OPENSKY_URL)
  if (!res.ok) throw new Error(`OpenSky API error: ${res.status}`)

  const data = await res.json()
  if (!data.states) return []

  return data.states
    .filter(s => s[5] != null && s[6] != null) // lat, lng 존재
    .map(s => ({
      icao24: s[0],
      callsign: (s[1] || '').trim(),
      country: s[2],
      lng: s[5],
      lat: s[6],
      altitude: s[7] || 0,     // baro_altitude (meters)
      velocity: s[9] || 0,     // m/s
      heading: s[10] || 0,     // degrees
      onGround: s[8],
    }))
    .filter(f => !f.onGround) // 비행 중인 항공기만
}

module.exports = { fetchFlights }
