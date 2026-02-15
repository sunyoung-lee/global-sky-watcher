import { useState, useEffect, useRef } from 'react'

const WS_URL = 'ws://localhost:4000'
const API_URL = 'http://localhost:4000/api/flights'
const RECONNECT_DELAY = 3000

export default function useFlightData() {
  const [flights, setFlights] = useState([])
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const pollingRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    function connectWS() {
      if (cancelled) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setError(null)
        // WebSocket 연결되면 REST polling 중지
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
          // REST 폴백 시작
          startPolling()
          // WebSocket 재연결 시도
          setTimeout(connectWS, RECONNECT_DELAY)
        }
      }

      ws.onerror = () => ws.close()
    }

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
      pollingRef.current = setInterval(fetchREST, 15000)
    }

    connectWS()

    return () => {
      cancelled = true
      wsRef.current?.close()
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  return { flights, error, connected }
}
