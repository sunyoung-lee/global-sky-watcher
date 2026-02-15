require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { WebSocketServer } = require('ws')
const { fetchFlights } = require('./fetchFlights')

const PORT = process.env.PORT || 4000
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL, 10) || 15000

const app = express()
app.use(cors())

// REST 엔드포인트 (폴백용)
let cachedFlights = []
let lastFetchTime = 0

app.get('/api/flights', (_req, res) => {
  res.json(cachedFlights)
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', flights: cachedFlights.length })
})

// HTTP + WebSocket 서버
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  // 연결 즉시 현재 데이터 전송
  if (cachedFlights.length > 0) {
    ws.send(JSON.stringify(cachedFlights))
  }
})

function broadcast(data) {
  const json = JSON.stringify(data)
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(json)
  })
}

// 주기적 데이터 갱신 (캐시 TTL 적용)
async function pollFlights() {
  const now = Date.now()
  if (now - lastFetchTime < POLL_INTERVAL - 1000) return // 캐시 유효
  try {
    cachedFlights = await fetchFlights()
    lastFetchTime = now
    broadcast(cachedFlights)
    console.log(`[poll] ${cachedFlights.length} flights`)
  } catch (err) {
    console.error('[poll] error:', err.message)
  }
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  pollFlights()
  setInterval(pollFlights, POLL_INTERVAL)
})
