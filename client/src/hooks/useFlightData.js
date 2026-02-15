import { useState, useEffect, useRef } from 'react'

const OPENSKY_URL = 'https://opensky-network.org/api/states/all'
const isDev = location.hostname === 'localhost'
const WS_URL = 'ws://localhost:4000'
const POLL_INTERVAL = 30000
const RECONNECT_DELAY = 3000
const MAX_FLIGHTS = 5000
const RATE_LIMIT_BACKOFF = 90000

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
  const errorCountRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function fetchOpenSky() {
      // 탭 비활성 시 폴링 건너뛰기
      if (document.hidden) return
      try {
        const res = await fetch(OPENSKY_URL)
        if (res.status === 429) {
          // Rate limit — 폴링 중단 후 90초 뒤 재시도
          clearInterval(pollingRef.current)
          pollingRef.current = null
          setError('Rate limited — retrying shortly')
          setTimeout(() => { if (!cancelled) startPolling() }, RATE_LIMIT_BACKOFF)
          return
        }
        if (!res.ok) throw new Error(`OpenSky: ${res.status}`)
        const data = await res.json()
        setFlights(parseFlights(data))
        setConnected(true)
        setError(null)
        errorCountRef.current = 0
      } catch (err) {
        errorCountRef.current++
        setError(err.message)
        setConnected(false)
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

    // 탭 가시성 변경 시 폴링 제어
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
      // 프로덕션: 브라우저에서 OpenSky API 직접 호출 (CORS 지원)
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
