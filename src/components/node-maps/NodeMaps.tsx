'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Map, { Marker, type MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './NodeMaps.module.css'

const MarkerCircle = ({
  name,
  logo,
  position,
  count
}: {
  name?: string | null
  logo?: string | null
  position: number
  count: number
}) => {
  const getOffset = (count: number): [number, number] => {
    const baseOffset = 16
    switch (count) {
      case 1:
        return [0, baseOffset / 2]
      case 2:
        return position === 0 ? [-baseOffset, -baseOffset / 2] : [baseOffset, baseOffset / 2]
      case 3:
        switch (position) {
          case 0:
            return [-baseOffset, -baseOffset]
          case 1:
            return [baseOffset, -baseOffset]
          case 2:
            return [0, baseOffset]
        }
      case 4:
        switch (position) {
          case 0:
            return [-baseOffset, -baseOffset]
          case 1:
            return [baseOffset, -baseOffset]
          case 2:
            return [-baseOffset, baseOffset]
          case 3:
            return [baseOffset, baseOffset]
        }
      default:
        if (position < 4) {
          return getOffset(4) as [number, number]
        } else {
          return [baseOffset, baseOffset] // Position for the "+X" marker
        }
    }
  }

  const [offsetX, offsetY] = getOffset(count)

  const containerStyle = {
    position: 'absolute' as const,
    width: '64px',
    height: '64px',
    transform: `translate(${-28 + (offsetX ?? 0)}px, ${-28 + (offsetY ?? 0)}px)`
  }

  if (count > 4 && position === 3) {
    return (
      <div style={containerStyle}>
        <svg width="64" height="64">
          <circle cx="28" cy="28" r="26" fill="#888888" fillOpacity="0.20" />
          <text x="27" y="34" textAnchor="middle" fill="#FFFFFF" fillOpacity="0.6" fontSize="16" fontWeight="bold">
            +{count - 3}
          </text>
        </svg>
      </div>
    )
  }

  if (!logo) {
    return (
      <div style={containerStyle}>
        <svg width="64" height="64" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx="28" cy="28" r="26" fill="#888888" fillOpacity="0.19" />
          <circle cx="28" cy="28" r="12" fill="#888888" />
        </svg>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <svg width="64" height="64" style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx="28" cy="28" r="26" fill="#888888" fillOpacity="0.20" />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          overflow: 'hidden'
        }}
      >
        <Image
          src={logo ?? '/images/icons/avatar.png'}
          alt={name ?? 'Avatar'}
          width={26}
          height={26}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  )
}

interface DecentralizedTrainingMapProps {
  nodes: {
    id: string
    latitude?: number | null
    longitude?: number | null
    name?: string | null
    avatar?: string | null
    computeUnitsContributed?: bigint
  }[]
}

const SECONDS_PER_REVOLUTION = 60
const ROTATION_INTERVAL_MS = 10
const MAX_SPIN_ZOOM = 5
const SLOW_SPIN_ZOOM = 2

const NodeMaps = ({ nodes }: DecentralizedTrainingMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapHeight, setMapHeight] = useState(0)

  const mapRef = useRef<MapRef>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  const spinGlobe = useCallback(() => {
    if (!mapRef.current) return

    const zoom = mapRef.current.getZoom()
    if (zoom < MAX_SPIN_ZOOM) {
      let distancePerSecond = 360 / SECONDS_PER_REVOLUTION
      if (zoom > SLOW_SPIN_ZOOM) {
        const zoomDif = (MAX_SPIN_ZOOM - zoom) / (MAX_SPIN_ZOOM - SLOW_SPIN_ZOOM)
        distancePerSecond *= zoomDif
      }
      const center = mapRef.current.getCenter()
      center.lng -= distancePerSecond / (1000 / ROTATION_INTERVAL_MS)
      mapRef.current.easeTo({
        center,
        duration: ROTATION_INTERVAL_MS,
        easing: (n) => n
      })
    }
  }, [mapRef])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(spinGlobe, 10)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [spinGlobe])

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setMapHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    requestAnimationFrame(updateHeight)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setMapHeight(containerRef.current.clientHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const groupedNodes = useMemo(() => {
    const groups: { [key: string]: typeof nodes } = {}

    nodes
      .filter((node) => node.latitude && node.longitude)
      .sort((a, b) => Number(b.computeUnitsContributed) - Number(a.computeUnitsContributed))
      .forEach((node) => {
        if (node.latitude && node.longitude) {
          const key = `${node.latitude},${node.longitude}`
          if (!groups[key]) {
            groups[key] = []
          }
          groups[key]?.push(node)
        }
      })
    return groups
  }, [nodes])

  return (
    <div ref={containerRef} className={`w-full h-full min-h-[40vh] relative`}>
      <div className="absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-black to-transparent p-2 lg:p-4 h-16">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-ibm-plex-sans text-base font-medium">Locations</h2>
        </div>
      </div>
      {mapHeight > 0 && (
        <Map
          ref={mapRef}
          style={{ width: '100%', height: mapHeight }}
          initialViewState={{
            longitude: -32,
            latitude: 40,
            zoom: 1.5
          }}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          minZoom={0}
        >
          {Object.entries(groupedNodes).map(([key, groupNodes]) => {
            const [latitude, longitude] = key.split(',').map(Number)
            return (
              <Marker key={key} longitude={longitude ?? 0} latitude={latitude ?? 0} anchor="bottom">
                <div className="position-relative">
                  {groupNodes.slice(0, Math.min(4, groupNodes.length)).map((node, index) => (
                    <MarkerCircle
                      key={node.id}
                      logo={node.avatar}
                      name={node.name}
                      position={index}
                      count={groupNodes.length}
                    />
                  ))}
                </div>
              </Marker>
            )
          })}
        </Map>
      )}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-b from-black to-transparent rotate-180"></div>
    </div>
  )
}

export default NodeMaps
