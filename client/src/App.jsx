import { useState, useMemo, useEffect, useCallback } from 'react'
import useFlightData from './hooks/useFlightData'
import Globe from './components/Globe'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import FlightCard from './components/FlightCard'
import FilterPanel, { REGIONS } from './components/FilterPanel'
import Toast from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'

const DEFAULT_FILTERS = { altMin: 0, region: 'all', vertState: 'all' }

function classifyVert(vertRate) {
  if (vertRate == null) return 'cruising'
  if (vertRate > 0.5) return 'climbing'
  if (vertRate < -0.5) return 'descending'
  return 'cruising'
}

function App() {
  const { flights, error, connected, lastUpdated } = useFlightData()
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusFlight, setFocusFlight] = useState(null)

  const filtered = useMemo(() => {
    let result = flights
    if (filters.altMin > 0) {
      result = result.filter(f => f.altitude >= filters.altMin)
    }
    if (filters.region !== 'all') {
      const bounds = REGIONS.find(r => r.id === filters.region)?.bounds
      if (bounds) {
        result = result.filter(f =>
          f.lat >= bounds.lamin && f.lat <= bounds.lamax &&
          f.lng >= bounds.lomin && f.lng <= bounds.lomax
        )
      }
    }
    if (filters.vertState !== 'all') {
      result = result.filter(f => classifyVert(f.vertRate) === filters.vertState)
    }
    return result
  }, [flights, filters])

  const handleSearchSubmit = useCallback(() => {
    if (!searchQuery.trim()) return
    const q = searchQuery.trim().toUpperCase()
    const match = flights.find(f => f.callsign.toUpperCase().includes(q))
    if (match) {
      setSelected(match)
      setFocusFlight({ lat: match.lat, lng: match.lng, ts: Date.now() })
    }
  }, [searchQuery, flights])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setSelected(null)
        setSearchQuery('')
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const el = document.querySelector('.header-search')
        if (el && document.activeElement !== el) {
          e.preventDefault()
          el.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="app">
      <ErrorBoundary>
        <Globe flights={filtered} onFlightClick={setSelected} focusFlight={focusFlight} />
      </ErrorBoundary>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />
      <StatusBar connected={connected} flightCount={filtered.length} lastUpdated={lastUpdated} />
      <FilterPanel filters={filters} onFilterChange={setFilters} />
      {selected && <FlightCard flight={selected} onClose={() => setSelected(null)} />}
      {error && <Toast message={`Connection issue: ${error}`} />}
    </div>
  )
}

export default App
