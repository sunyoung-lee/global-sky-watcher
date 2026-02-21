import { useEffect, useRef, useState } from 'react'

// 고도(m) → 노란색(#ffbe0b, 저고도) ~ 청록색(#00f5d4, 고고도) 보간
function altitudeColor(d) {
  const t = Math.min(d.altitude / 12000, 1) // 0~12km 범위 정규화
  const r = Math.round(255 * (1 - t))
  const g = Math.round(190 + 55 * t)
  const b = Math.round(11 + 201 * t)
  return `rgb(${r},${g},${b})`
}

export default function Globe({ flights = [], onFlightClick }) {
  const containerRef = useRef()
  const globeRef = useRef(null)
  const callbackRef = useRef(onFlightClick)
  callbackRef.current = onFlightClick
  const [renderFailed, setRenderFailed] = useState(false)

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
          .pointLat('lat')
          .pointLng('lng')
          .pointColor(altitudeColor)
          .pointAltitude(d => Math.max(d.altitude / 200000, 0.01))
          .pointRadius(0.15)
          .width(window.innerWidth)
          .height(window.innerHeight)
          (containerRef.current)

        globe.onPointClick(point => callbackRef.current?.(point))

        // Jeju Auto-Focus: 넓은 시점에서 시작 → 제주도로 부드럽게 줌인
        globe.pointOfView({ lat: 20, lng: 126.5, altitude: 4 }, 0)
        setTimeout(() => {
          globe.pointOfView({ lat: 33.5, lng: 126.5, altitude: 2.2 }, 2000)
        }, 300)

        globe.controls().autoRotate = true
        globe.controls().autoRotateSpeed = 0.3

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
          globe.pointsData([])
          globe.controls().dispose?.()
          globe.renderer().dispose()
          globe.scene().clear()
        } catch { /* cleanup best-effort */ }
        const container = containerRef.current
        if (container) container.innerHTML = ''
      }
      globeRef.current = null
    }
  }, [])

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointsData(flights)
    }
  }, [flights])

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
