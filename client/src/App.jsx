import useFlightData from './hooks/useFlightData'
import Globe from './components/Globe'
import Header from './components/Header'
import StatusBar from './components/StatusBar'

function App() {
  const { flights, connected } = useFlightData()

  return (
    <div className="app">
      <Globe flights={flights} />
      <Header />
      <StatusBar connected={connected} flightCount={flights.length} />
    </div>
  )
}

export default App
