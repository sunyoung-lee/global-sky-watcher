import { lazy, Suspense } from 'react'
import useFlightData from './hooks/useFlightData'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import ErrorBoundary from './components/ErrorBoundary'

const Globe = lazy(() => import('./components/Globe'))

function App() {
  const { flights, connected } = useFlightData()

  return (
    <div className="app">
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Globe flights={flights} />
        </Suspense>
      </ErrorBoundary>
      <Header />
      <StatusBar connected={connected} flightCount={flights.length} />
    </div>
  )
}

export default App
