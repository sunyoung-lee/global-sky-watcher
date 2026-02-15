import { useEffect, useRef } from 'react'
import GlobeGL from 'globe.gl'

export default function Globe({ flights = [] }) {
  const containerRef = useRef()
  const globeRef = useRef(null)

  // 초기화 (1회)
  useEffect(() => {
    const globe = GlobeGL()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .atmosphereColor('#3a86ff')
      .atmosphereAltitude(0.25)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor(() => '#ffbe0b')
      .pointAltitude(d => Math.max(d.altitude / 200000, 0.01))
      .pointRadius(0.15)
      .width(window.innerWidth)
      .height(window.innerHeight)
      (containerRef.current)

    // 제주도 상공 초기 시점
    globe.pointOfView({ lat: 33.5, lng: 126.5, altitude: 2.5 }, 0)

    // 자동 회전
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.3

    globeRef.current = globe

    const onResize = () => globe.width(window.innerWidth).height(window.innerHeight)
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      globe._destructor?.()
    }
  }, [])

  // 비행 데이터 업데이트
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointsData(flights)
    }
  }, [flights])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
