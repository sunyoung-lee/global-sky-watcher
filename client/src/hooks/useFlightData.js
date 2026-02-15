import { useState, useEffect, useRef } from 'react'

const OPENSKY_URL = 'https://opensky-network.org/api/states/all'
const isDev = location.hostname === 'localhost'
const WS_URL = 'ws://localhost:4000'
const POLL_INTERVAL = 30000
const RECONNECT_DELAY = 3000
const MAX_FLIGHTS = 5000
const RATE_LIMIT_BACKOFF = 90000
const CACHE_KEY = 'gsw_flights'

// OpenSky 인증 (빌드 시 Vite 환경변수 주입)
const OPENSKY_USER = import.meta.env.VITE_OPENSKY_USERNAME || ''
const OPENSKY_PASS = import.meta.env.VITE_OPENSKY_PASSWORD || ''
const AUTH_HEADER = OPENSKY_USER
  ? { 'Authorization': 'Basic ' + btoa(`${OPENSKY_USER}:${OPENSKY_PASS}`) }
  : {}

function parseRaw(data) {
  if (!data?.states) return []
  return data.states
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
}

function sample(arr) {
  if (arr.length <= MAX_FLIGHTS) return arr
  const step = arr.length / MAX_FLIGHTS
  const out = []
  for (let i = 0; i < MAX_FLIGHTS; i++) out.push(arr[Math.floor(i * step)])
  return out
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { flights, ts } = JSON.parse(raw)
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

    async function fetchFlights() {
      if (document.hidden) return
      try {
        const res = await fetch(OPENSKY_URL, { headers: AUTH_HEADER })
        if (res.status === 429) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          setTimeout(() => { if (!cancelled) startPolling() }, RATE_LIMIT_BACKOFF)
          return
        }
        if (!res.ok) throw new Error(`OpenSky: ${res.status}`)
        const data = await res.json()
        const parsed = sample(parseRaw(data))
        setFlights(parsed)
        setConnected(true)
        setError(null)
        errorCountRef.current = 0
        saveCache(parsed)
      } catch (err) {
        errorCountRef.current++
        setError(err.message)
        if (!cached) setConnected(false)
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
      fetchFlights()
      pollingRef.current = setInterval(fetchFlights, interval)
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
