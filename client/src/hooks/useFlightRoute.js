import { useState, useEffect } from 'react'

const PROXY_URL = '/api/route'
const DIRECT_URL = 'https://opensky-network.org/api/flights/aircraft'
const routeCache = new Map()
const FETCH_TIMEOUT = 8000

export default function useFlightRoute(icao24) {
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!icao24) {
      setRoute(null)
      setLoading(false)
      return
    }

    if (routeCache.has(icao24)) {
      setRoute(routeCache.get(icao24))
      setLoading(false)
      return
    }

    let cancelled = false
    const controller = new AbortController()
    setLoading(true)

    const now = Math.floor(Date.now() / 1000)
    const begin = now - 86400
    const signal = controller.signal

    async function fetchRoute() {
      let data
      try {
        const res = await fetch(`${PROXY_URL}?icao24=${icao24}`, { signal })
        if (!res.ok) throw new Error(`${res.status}`)
        data = await res.json()
      } catch {
        if (signal.aborted) return null
        try {
          const res = await fetch(`${DIRECT_URL}?icao24=${icao24}&begin=${begin}&end=${now}`, { signal })
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

    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    fetchRoute()
      .then(info => {
        if (cancelled) return
        routeCache.set(icao24, info)
        setRoute(info)
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout)
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timeout)
    }
  }, [icao24])

  return { route, loading }
}
