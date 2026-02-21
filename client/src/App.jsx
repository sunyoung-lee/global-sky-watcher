import { useState, useMemo } from 'react'
import useFlightData from './hooks/useFlightData'
import Globe from './components/Globe'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import FlightCard from './components/FlightCard'
import FilterPanel, { REGIONS } from './components/FilterPanel'
import Toast from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'

const DEFAULT_FILTERS = { altMin: 0, region: 'all' }

function App() {
  const { flights, error, connected } = useFlightData()
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

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
    return result
  }, [flights, filters])

  return (
    <div className="app">
      <ErrorBoundary>
        <Globe flights={filtered} onFlightClick={setSelected} />
      </ErrorBoundary>
      <Header />
      <StatusBar connected={connected} flightCount={filtered.length} />
      <FilterPanel filters={filters} onFilterChange={setFilters} />
      {selected && <FlightCard flight={selected} onClose={() => setSelected(null)} />}
      {error && <Toast message={`Connection issue: ${error}`} />}
    </div>
  )
}

export default App
