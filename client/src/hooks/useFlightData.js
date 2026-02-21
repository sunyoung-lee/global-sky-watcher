import { useState, useEffect, useRef } from 'react'

const OPENSKY_URL = 'https://opensky-network.org/api/states/all'
const isDev = location.hostname === 'localhost'
const WS_URL = 'ws://localhost:4000'
const API_PROXY = '/api/flights'
const POLL_INTERVAL = 30000
const RECONNECT_DELAY = 3000
const MAX_FLIGHTS = 5000
const RATE_LIMIT_BACKOFF = 90000
const CACHE_KEY = 'gsw_flights'

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

    async function fetchDirect() {
      // OpenSky 직접 호출 (Auth 헤더 없이 — simple CORS request)
      const res = await fetch(OPENSKY_URL)
      if (res.status === 429) return 'rate-limited'
      if (!res.ok) throw new Error(`OpenSky: ${res.status}`)
      const data = await res.json()
      return sample(parseRaw(data))
    }

    async function fetchProxy() {
      const res = await fetch(API_PROXY)
      if (res.status === 429) return 'rate-limited'
      if (!res.ok) throw new Error(`Proxy: ${res.status}`)
      const data = await res.json()
      return Array.isArray(data) ? sample(data) : sample(parseRaw(data))
    }

    async function fetchFlights() {
      if (document.hidden) return
      try {
        // 1차: OpenSky 직접 (CORS OK, Auth 없이), 실패 시 2차: 프록시
        let result
        try {
          result = await fetchDirect()
        } catch {
          result = await fetchProxy()
        }
        if (result === 'rate-limited') {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          setTimeout(() => { if (!cancelled) startPolling() }, RATE_LIMIT_BACKOFF)
          return
        }
        setFlights(result)
        setConnected(true)
        setError(null)
        errorCountRef.current = 0
        saveCache(result)
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
