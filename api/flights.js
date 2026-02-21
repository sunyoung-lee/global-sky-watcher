const OPENSKY_URL = 'https://opensky-network.org/api/states/all'

export const config = { runtime: 'edge' }

export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
    'Content-Type': 'application/json',
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'GlobalSkyWatcher/1.0',
    }

    const user = process.env.OPENSKY_USERNAME
    const pass = process.env.OPENSKY_PASSWORD
    if (user && pass) {
      headers['Authorization'] = 'Basic ' + btoa(`${user}:${pass}`)
    }

    const response = await fetch(OPENSKY_URL, {
      signal: controller.signal,
      headers,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `OpenSky returned ${response.status}` }),
        { status: response.status, headers: corsHeaders }
      )
    }

    const data = await response.json()
    if (!data.states) return new Response('[]', { headers: corsHeaders })

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

    return new Response(JSON.stringify(flights), { headers: corsHeaders })
  } catch (err) {
    const isTimeout = err.name === 'AbortError'
    const status = isTimeout ? 504 : 502
    const message = isTimeout ? 'OpenSky response timeout' : (err.message || 'Failed to fetch')
    return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders })
  }
}
