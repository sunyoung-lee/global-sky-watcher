const OPENSKY_URL = 'https://opensky-network.org/api/states/all'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=5')

  try {
    const response = await fetch(OPENSKY_URL)
    if (!response.ok) throw new Error(`OpenSky: ${response.status}`)

    const data = await response.json()
    if (!data.states) return res.json([])

    const flights = data.states
      .filter(s => s[5] != null && s[6] != null)
      .map(s => ({
        icao24: s[0],
        callsign: (s[1] || '').trim(),
        country: s[2],
        lng: s[5],
        lat: s[6],
        altitude: s[7] || 0,
        velocity: s[9] || 0,
        heading: s[10] || 0,
        onGround: s[8],
      }))
      .filter(f => !f.onGround)

    res.json(flights)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
