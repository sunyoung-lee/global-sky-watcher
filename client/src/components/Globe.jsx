import { useEffect, useRef, useState } from 'react'

// 고도(m) → 노란색(#ffbe0b, 저고도) ~ 청록색(#00f5d4, 고고도) 보간
function altitudeColor(d) {
  const t = Math.min(d.altitude / 12000, 1)
  const r = Math.round(255 * (1 - t))
  const g = Math.round(190 + 55 * t)
  const b = Math.round(11 + 201 * t)
  return `rgb(${r},${g},${b})`
}

function createAirplaneSvg(color, heading) {
  return `<svg width="12" height="11" viewBox="0 0 12 11" style="transform:rotate(${heading}deg);transform-origin:6px 5px"><path d="M6 0L7.5 4 12 5 7.5 6 8 10.5 6 9 4 10.5 4.5 6 0 5 4.5 4Z" fill="${color}" opacity=".85"/></svg>`
}

export default function Globe({ flights = [], onFlightClick, focusFlight }) {
  const containerRef = useRef()
  const globeRef = useRef(null)
  const callbackRef = useRef(onFlightClick)
  callbackRef.current = onFlightClick
  const [renderFailed, setRenderFailed] = useState(false)
  const historyRef = useRef({})
  const elCacheRef = useRef(new Map())

  useEffect(() => {
    if (!containerRef.current) return

    let globe
    import('globe.gl').then(({ default: GlobeGL }) => {
      if (!containerRef.current) return

      try {
        globe = GlobeGL({ animateIn: false })
          .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
          .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
          .atmosphereColor('#3a86ff')
          .atmosphereAltitude(0.25)
          // 비행기 아이콘 (HTML SVG)
          .htmlElementsData([])
          .htmlLat('lat')
          .htmlLng('lng')
          .htmlAltitude(0.005)
          .htmlTransitionDuration(800)
          .htmlElement(d => {
            const cache = elCacheRef.current
            let el = cache.get(d.icao24)
            if (el) {
              el.innerHTML = createAirplaneSvg(altitudeColor(d), d.heading)
              return el
            }
            el = document.createElement('div')
            el.innerHTML = createAirplaneSvg(altitudeColor(d), d.heading)
            el.style.cursor = 'pointer'
            cache.set(d.icao24, el)
            return el
          })
          // 비행 궤적선
          .pathsData([])
          .pathPoints('points')
          .pathPointLat(p => p.lat)
          .pathPointLng(p => p.lng)
          .pathColor(() => 'rgba(0, 229, 255, 0.15)')
          .pathStroke(0.5)
          .pathTransitionDuration(0)
          .width(window.innerWidth)
          .height(window.innerHeight)
          (containerRef.current)

        globe.onHtmlElementClick(point => {
          callbackRef.current?.(point)
          globe.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.8 }, 1000)
        })

        // Jeju Auto-Focus
        globe.pointOfView({ lat: 20, lng: 126.5, altitude: 3.5 }, 0)
        setTimeout(() => {
          globe.pointOfView({ lat: 33.5, lng: 126.5, altitude: 2.0 }, 2500)
        }, 500)

        globe.controls().autoRotate = true
        globe.controls().autoRotateSpeed = 0.2
        globe.controls().enableDamping = true
        globe.controls().dampingFactor = 0.1

        globeRef.current = globe
      } catch {
        setRenderFailed(true)
      }
    }).catch(() => setRenderFailed(true))

    const onResize = () => {
      globeRef.current?.width(window.innerWidth).height(window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      if (globe) {
        try {
          globe.htmlElementsData([])
          globe.pathsData([])
          globe.controls().dispose?.()
          globe.renderer().dispose()
          globe.scene().clear()
        } catch { /* cleanup best-effort */ }
        const container = containerRef.current
        if (container) container.innerHTML = ''
      }
      globeRef.current = null
      elCacheRef.current.clear()
    }
  }, [])

  useEffect(() => {
    if (!globeRef.current) return

    // 비행기 아이콘 업데이트
    globeRef.current.htmlElementsData(flights)

    // 궤적 히스토리 추적
    const history = historyRef.current
    const activeIcaos = new Set()

    flights.forEach(f => {
      activeIcaos.add(f.icao24)
      if (!history[f.icao24]) history[f.icao24] = []
      const trail = history[f.icao24]
      const last = trail[trail.length - 1]
      if (!last || Math.abs(last.lat - f.lat) > 0.005 || Math.abs(last.lng - f.lng) > 0.005) {
        trail.push({ lat: f.lat, lng: f.lng })
        if (trail.length > 5) trail.shift()
      }
    })

    // 비활성 항공편 정리
    for (const icao of Object.keys(history)) {
      if (!activeIcaos.has(icao)) delete history[icao]
    }
    for (const icao of elCacheRef.current.keys()) {
      if (!activeIcaos.has(icao)) elCacheRef.current.delete(icao)
    }

    // 궤적선 업데이트
    const paths = Object.values(history)
      .filter(trail => trail.length >= 2)
      .map(trail => ({ points: trail }))

    globeRef.current.pathsData(paths)
  }, [flights])

  useEffect(() => {
    if (focusFlight && globeRef.current) {
      globeRef.current.pointOfView(
        { lat: focusFlight.lat, lng: focusFlight.lng, altitude: 1.8 },
        1000
      )
    }
  }, [focusFlight])

  if (renderFailed) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '16px',
      }}>
        <img
          src="//unpkg.com/three-globe/example/img/earth-night.jpg"
          alt="Earth"
          style={{ width: '300px', borderRadius: '50%', opacity: 0.7 }}
        />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
          WebGL is not available — showing static view
        </p>
      </div>
    )
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
