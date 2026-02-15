import { useState, useEffect, useRef } from 'react'

const isDev = location.hostname === 'localhost'
const WS_URL = 'ws://localhost:4000'
const API_URL = isDev ? 'http://localhost:4000/api/flights' : '/api/flights'
const POLL_INTERVAL = 15000
const RECONNECT_DELAY = 3000

export default function useFlightData() {
  const [flights, setFlights] = useState([])
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const pollingRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function fetchREST() {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(res.statusText)
        setFlights(await res.json())
        setError(null)
      } catch (err) {
        setError(err.message)
      }
    }

    function startPolling() {
      if (pollingRef.current) return
      fetchREST()
      pollingRef.current = setInterval(fetchREST, POLL_INTERVAL)
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
      // 로컬: WebSocket 우선, REST 폴백
      connectWS()
    } else {
      // 프로덕션 (Vercel): REST polling만 사용
      setConnected(true)
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
