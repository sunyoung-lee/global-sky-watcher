const OPENSKY_FLIGHTS_URL = 'https://opensky-network.org/api/flights/aircraft'

export const config = { runtime: 'edge' }

export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
    'Content-Type': 'application/json',
  }

  const { searchParams } = new URL(request.url)
  const icao24 = searchParams.get('icao24')
  if (!icao24) {
    return new Response(JSON.stringify({ error: 'icao24 required' }), { status: 400, headers: corsHeaders })
  }

  const now = Math.floor(Date.now() / 1000)
  const begin = now - 86400

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'GlobalSkyWatcher/1.0',
    }

    const user = process.env.OPENSKY_USERNAME
    const pass = process.env.OPENSKY_PASSWORD
    if (user && pass) {
      headers['Authorization'] = 'Basic ' + btoa(`${user}:${pass}`)
    }

    const url = `${OPENSKY_FLIGHTS_URL}?icao24=${icao24}&begin=${begin}&end=${now}`
    const response = await fetch(url, { signal: controller.signal, headers })
    clearTimeout(timeout)

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `OpenSky returned ${response.status}` }),
        { status: response.status, headers: corsHeaders }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { headers: corsHeaders })
  } catch (err) {
    const isTimeout = err.name === 'AbortError'
    const status = isTimeout ? 504 : 502
    const message = isTimeout ? 'OpenSky response timeout' : (err.message || 'Failed to fetch')
    return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders })
  }
}
