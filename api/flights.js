const OPENSKY_URL = 'https://opensky-network.org/api/states/all'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'GlobalSkyWatcher/1.0',
    }

    // OpenSky 인증 (Vercel 환경변수)
    const user = process.env.OPENSKY_USERNAME
    const pass = process.env.OPENSKY_PASSWORD
    if (user && pass) {
      headers['Authorization'] = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
    }

    const response = await fetch(OPENSKY_URL, {
      signal: controller.signal,
      headers,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return res.status(response.status).json({
        error: `OpenSky returned ${response.status}`,
      })
    }

    const data = await response.json()
    if (!data.states) return res.json([])

    const flights = data.states
      .filter(s => s[5] != null && s[6] != null && !s[8])
      .filter(s => (s[1] || '').trim().length > 0)
      .map(s => ({
        icao24: s[0],
        callsign: (s[1] || '').trim(),
        country: s[2],
        lng: s[5],
        lat: s[6],
        altitude: s[7] || 0,
        velocity: s[9] || 0,
        heading: s[10] || 0,
      }))

    res.json(flights)
  } catch (err) {
    res.status(502).json({ error: err.message || 'Failed to fetch flight data' })
  }
}
