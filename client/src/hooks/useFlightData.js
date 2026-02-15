import { useState, useEffect, useRef } from 'react'

const OPENSKY_URL = 'https://opensky-network.org/api/states/all'
const isDev = location.hostname === 'localhost'
const WS_URL = 'ws://localhost:4000'
const POLL_INTERVAL = 15000
const RECONNECT_DELAY = 3000
const MAX_FLIGHTS = 5000

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
  // 샘플링: MAX_FLIGHTS 초과 시 균등 간격으로 추출
  if (all.length <= MAX_FLIGHTS) return all
  const step = all.length / MAX_FLIGHTS
  const sampled = []
  for (let i = 0; i < MAX_FLIGHTS; i++) {
    sampled.push(all[Math.floor(i * step)])
  }
  return sampled
}

export default function useFlightData() {
  const [flights, setFlights] = useState([])
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const pollingRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function fetchOpenSky() {
      try {
        const res = await fetch(OPENSKY_URL)
        if (!res.ok) throw new Error(`OpenSky: ${res.status}`)
        const data = await res.json()
        setFlights(parseFlights(data))
        setConnected(true)
        setError(null)
      } catch (err) {
        setError(err.message)
        setConnected(false)
      }
    }

    function startPolling() {
      if (pollingRef.current) return
      fetchOpenSky()
      pollingRef.current = setInterval(fetchOpenSky, POLL_INTERVAL)
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

    if (isDev) {
      connectWS()
    } else {
      // 프로덕션: 브라우저에서 OpenSky API 직접 호출 (CORS 지원)
      startPolling()
    }

    return () => {
      cancelled = true
      wsRef.current?.close()
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  return { flights, error, connected }
}
