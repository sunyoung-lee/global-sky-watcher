import { useState, useEffect } from 'react'

const PROXY_URL = '/api/route'
const DIRECT_URL = 'https://opensky-network.org/api/flights/aircraft'
const routeCache = new Map()

export default function useFlightRoute(icao24) {
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!icao24) {
      setRoute(null)
      return
    }

    if (routeCache.has(icao24)) {
      setRoute(routeCache.get(icao24))
      return
    }

    let cancelled = false
    setLoading(true)

    const now = Math.floor(Date.now() / 1000)
    const begin = now - 86400

    async function fetchRoute() {
      // 1차: 프록시 경유, 2차: 직접 호출 폴백
      let data
      try {
        const res = await fetch(`${PROXY_URL}?icao24=${icao24}`)
        if (!res.ok) throw new Error(`${res.status}`)
        data = await res.json()
      } catch {
        try {
          const res = await fetch(`${DIRECT_URL}?icao24=${icao24}&begin=${begin}&end=${now}`)
          if (!res.ok) throw new Error(`${res.status}`)
          data = await res.json()
        } catch {
          return null
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        const latest = data[data.length - 1]
        return {
          departure: latest.estDepartureAirport || null,
          arrival: latest.estArrivalAirport || null,
        }
      }
      return null
    }

    fetchRoute().then(info => {
      if (cancelled) return
      routeCache.set(icao24, info)
      setRoute(info)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [icao24])

  return { route, loading }
}
