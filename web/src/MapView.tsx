import { useEffect } from 'react'
import { MapContainer, ImageOverlay, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { GridInfo, Px, Route } from './types'

export const CONF_COLOR: Record<string, string> = {
  high: '#22c55e',
  mid: '#eab308',
  low: '#f97316',
}

const ll = (h: number, p: Px): L.LatLngTuple => [h - p[1] - 0.5, p[0] + 0.5]

function FitToRoute({ route, h, w }: { route: Route; h: number; w: number }) {
  const map = useMap()
  useEffect(() => {
    const pts = route.segments.flatMap((s) => s.path_px.map((p) => ll(h, p)))
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(1.5))
    else map.fitBounds([[0, 0], [h, w]])
  }, [map, route, h, w])
  return null
}

interface Props {
  grid: GridInfo
  route: Route
  selected: number | null
  onSelect: (id: number) => void
}

export default function MapView({ grid, route, selected, onSelect }: Props) {
  const { width: w, height: h } = grid
  return (
    <MapContainer crs={L.CRS.Simple} bounds={[[0, 0], [h, w]]} minZoom={-3} maxZoom={6} zoomSnap={0.25} className="h-full w-full" attributionControl={false}>
      <FitToRoute route={route} h={h} w={w} />
      <ImageOverlay url="/base.svg" bounds={[[0, 0], [h, w]]} />
      {route.segments.map((s) => {
        const isSel = s.id === selected
        return (
          <Polyline
            key={`${route.kind}-${s.id}`}
            positions={s.path_px.map((p) => ll(h, p))}
            pathOptions={{ color: CONF_COLOR[s.conf] ?? '#94a3b8', weight: isSel ? 10 : 6, opacity: isSel ? 1 : 0.85 }}
            eventHandlers={{ click: () => onSelect(s.id) }}
          >
            <Tooltip sticky>Segment {s.id} · {s.len_m} m</Tooltip>
          </Polyline>
        )
      })}
      <CircleMarker center={ll(h, route.start.px)} radius={7} pathOptions={{ color: '#fff', fillColor: '#3b82f6', fillOpacity: 1 }}>
        <Tooltip>Başlangıç</Tooltip>
      </CircleMarker>
      <CircleMarker center={ll(h, route.goal.px)} radius={7} pathOptions={{ color: '#fff', fillColor: '#ef4444', fillOpacity: 1 }}>
        <Tooltip>Hedef</Tooltip>
      </CircleMarker>
    </MapContainer>
  )
}
