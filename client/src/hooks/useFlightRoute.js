import { useState, useEffect } from 'react'

const OPENSKY_FLIGHTS_URL = 'https://opensky-network.org/api/flights/aircraft'
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

    setLoading(true)
    const now = Math.floor(Date.now() / 1000)
    const begin = now - 86400

    fetch(`${OPENSKY_FLIGHTS_URL}?icao24=${icao24}&begin=${begin}&end=${now}`)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      })
      .then(data => {
        if (data && data.length > 0) {
          const latest = data[data.length - 1]
          const info = {
            departure: latest.estDepartureAirport || null,
            arrival: latest.estArrivalAirport || null,
          }
          routeCache.set(icao24, info)
          setRoute(info)
        } else {
          routeCache.set(icao24, null)
          setRoute(null)
        }
      })
      .catch(() => {
        setRoute(null)
      })
      .finally(() => setLoading(false))
  }, [icao24])

  return { route, loading }
}
