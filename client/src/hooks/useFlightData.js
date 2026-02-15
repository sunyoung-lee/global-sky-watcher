import { useState, useEffect, useRef } from 'react'

const API_URL = 'http://localhost:4000/api/flights'

export default function useFlightData(intervalMs = 15000) {
  const [flights, setFlights] = useState([])
  const [error, setError] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    // WebSocket 연결 시도 → 실패 시 REST 폴백
    const ws = new WebSocket('ws://localhost:4000')
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setFlights(data)
        setError(null)
      } catch { /* ignore parse errors */ }
    }

    ws.onerror = () => {
      // WebSocket 실패 시 REST polling 폴백
      ws.close()
      fetchREST()
      const id = setInterval(fetchREST, intervalMs)
      return () => clearInterval(id)
    }

    async function fetchREST() {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(res.statusText)
        const data = await res.json()
        setFlights(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      }
    }

    return () => {
      ws.close()
    }
  }, [intervalMs])

  return { flights, error }
}
