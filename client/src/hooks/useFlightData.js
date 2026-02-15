import { useState, useEffect, useRef } from 'react'

const OPENSKY_URL = 'https://opensky-network.org/api/states/all'
const isDev = location.hostname === 'localhost'
const WS_URL = 'ws://localhost:4000'
const POLL_INTERVAL = 60000
const RECONNECT_DELAY = 3000
const MAX_FLIGHTS = 5000
const RATE_LIMIT_BACKOFF = 90000
const CACHE_KEY = 'gsw_flights'

function parseFlights(data) {
  if (!data?.states) return []
  const all = data.states
    .filter(s => s[5] != null && s[6] != null && !s[8])
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
  if (all.length <= MAX_FLIGHTS) return all
  const step = all.length / MAX_FLIGHTS
  const sampled = []
  for (let i = 0; i < MAX_FLIGHTS; i++) {
    sampled.push(all[Math.floor(i * step)])
  }
  return sampled
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { flights, ts } = JSON.parse(raw)
    // 캐시 유효: 10분 이내
    if (Date.now() - ts < 600000 && flights?.length) return flights
  } catch { /* ignore */ }
  return null
}

function saveCache(flights) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ flights, ts: Date.now() }))
  } catch { /* ignore */ }
}

export default function useFlightData() {
  const cached = loadCache()
  const [flights, setFlights] = useState(cached || [])
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(!!cached)
  const wsRef = useRef(null)
  const pollingRef = useRef(null)
  const errorCountRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function fetchOpenSky() {
      if (document.hidden) return
      try {
        const res = await fetch(OPENSKY_URL)
        if (res.status === 429) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          const delay = flights.length > 0 ? RATE_LIMIT_BACKOFF : 15000
          setTimeout(() => { if (!cancelled) startPolling() }, delay)
          return
        }
        if (!res.ok) throw new Error(`OpenSky: ${res.status}`)
        const data = await res.json()
        const parsed = parseFlights(data)
        setFlights(parsed)
        setConnected(true)
        setError(null)
        errorCountRef.current = 0
        saveCache(parsed)
      } catch (err) {
        errorCountRef.current++
        setError(err.message)
        if (flights.length === 0) setConnected(false)
        if (errorCountRef.current >= 3) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          const backoff = Math.min(POLL_INTERVAL * (errorCountRef.current - 1), RATE_LIMIT_BACKOFF)
          setTimeout(() => { if (!cancelled) startPolling() }, backoff)
        }
      }
    }

    function startPolling(interval = POLL_INTERVAL) {
      if (pollingRef.current) return
      fetchOpenSky()
      pollingRef.current = setInterval(fetchOpenSky, interval)
    }

    function handleVisibility() {
      if (document.hidden) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      } else if (!isDev || !wsRef.current || wsRef.current.readyState !== 1) {
        startPolling()
      }
    }

    function connectWS() {
      if (cancelled) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setError(null)
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          setFlights(JSON.parse(event.data))
        } catch { /* ignore */ }
      }

      ws.onclose = () => {
        setConnected(false)
        if (!cancelled) {
          startPolling()
          setTimeout(connectWS, RECONNECT_DELAY)
        }
      }

      ws.onerror = () => ws.close()
    }

    document.addEventListener('visibilitychange', handleVisibility)

    if (isDev) {
      connectWS()
    } else {
      startPolling()
    }

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      wsRef.current?.close()
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  return { flights, error, connected }
}
