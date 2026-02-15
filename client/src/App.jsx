import useFlightData from './hooks/useFlightData'
import Globe from './components/Globe'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { flights, connected } = useFlightData()

  return (
    <div className="app">
      <ErrorBoundary>
        <Globe flights={flights} />
      </ErrorBoundary>
      <Header />
      <StatusBar connected={connected} flightCount={flights.length} />
    </div>
  )
}

export default App
