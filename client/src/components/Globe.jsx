import { useEffect, useRef, useCallback } from 'react'
import ReactGlobe from 'react-globe.gl'

export default function Globe({ flights = [] }) {
  const globeRef = useRef()

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return

    // 제주도 상공 초기 시점 (PRD: Jeju Auto-Focus)
    globe.pointOfView({ lat: 33.5, lng: 126.5, altitude: 2.5 }, 0)

    // 자동 회전
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.3
  }, [])

  const pointColor = useCallback(() => '#ffbe0b', [])
  const pointAlt = useCallback((d) => Math.max(d.altitude / 200000, 0.01), [])
  const pointRadius = useCallback(() => 0.15, [])

  return (
    <ReactGlobe
      ref={globeRef}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      atmosphereColor="#3a86ff"
      atmosphereAltitude={0.25}
      width={window.innerWidth}
      height={window.innerHeight}
      pointsData={flights}
      pointLat="lat"
      pointLng="lng"
      pointColor={pointColor}
      pointAltitude={pointAlt}
      pointRadius={pointRadius}
    />
  )
}
