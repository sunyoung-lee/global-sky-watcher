import { useState } from 'react'
import useFlightData from './hooks/useFlightData'
import Globe from './components/Globe'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import FlightCard from './components/FlightCard'
import Toast from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { flights, error, connected } = useFlightData()
  const [selected, setSelected] = useState(null)

  return (
    <div className="app">
      <ErrorBoundary>
        <Globe flights={flights} onFlightClick={setSelected} />
      </ErrorBoundary>
      <Header />
      <StatusBar connected={connected} flightCount={flights.length} />
      {selected && <FlightCard flight={selected} onClose={() => setSelected(null)} />}
      {error && <Toast message={`Connection issue: ${error}`} />}
    </div>
  )
}

export default App
