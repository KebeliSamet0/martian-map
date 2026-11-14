import { useEffect } from 'react'
import { MapContainer, ImageOverlay, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Px, Route, RoverStop, ScienceStop } from './types'

export const CONF_COLOR: Record<string, string> = { high: '#22c55e', mid: '#eab308', low: '#f97316' }
export const SCI_COLOR = '#a855f7'
export const ROVER_COLOR = '#22d3ee'

// Tam sayı hücre indeksi -> hücre merkezi (rota yolları, bilim durakları)
const cell = (h: number, p: Px): L.LatLngTuple => [h - p[1] - 0.5, p[0] + 0.5]
// Sürekli piksel konumu (rover durakları, ör. 479.8)
const cont = (h: number, p: Px): L.LatLngTuple => [h - p[1], p[0]]

function Fit({ pts, fitKey, pad, h, w }: { pts: L.LatLngTuple[]; fitKey: string; pad: number; h: number; w: number }) {
  const map = useMap()
  useEffect(() => {
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(pad))
    else map.fitBounds([[0, 0], [h, w]])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey])
  return null
}

interface Props {
  grid: { width: number; height: number }
  baseUrl: string
  route?: Route | null
  selectedSeg?: number | null
  onSelectSeg?: (id: number) => void
  science?: ScienceStop[]
  rovers?: RoverStop[]
  selectedId?: string | null
  onSelectScience?: (s: ScienceStop) => void
  onSelectRover?: (r: RoverStop) => void
}

export default function MapView(p: Props) {
  const { width: w, height: h } = p.grid
  const science = p.science ?? []
  const rovers = p.rovers ?? []
  const pts: L.LatLngTuple[] = p.route
    ? p.route.segments.flatMap((s) => s.path_px.map((q) => cell(h, q)))
    : [...science.map((s) => cell(h, s.px)), ...rovers.map((r) => cont(h, r.px))]

  return (
    <MapContainer crs={L.CRS.Simple} bounds={[[0, 0], [h, w]]} minZoom={-3} maxZoom={6} zoomSnap={0.25} className="h-full w-full" attributionControl={false}>
      <Fit pts={pts} fitKey={p.route ? p.route.kind : 'stops'} pad={p.route ? 1.5 : 0.4} h={h} w={w} />
      <ImageOverlay url={p.baseUrl} bounds={[[0, 0], [h, w]]} />

      {p.route?.segments.map((s) => {
        const sel = s.id === p.selectedSeg
        return (
          <Polyline
            key={`${p.route!.kind}-${s.id}`}
            positions={s.path_px.map((q) => cell(h, q))}
            pathOptions={{ color: CONF_COLOR[s.conf] ?? '#94a3b8', weight: sel ? 10 : 6, opacity: sel ? 1 : 0.85 }}
            eventHandlers={{ click: () => p.onSelectSeg?.(s.id) }}
          >
            <Tooltip sticky>Segment {s.id} · {s.len_m} m</Tooltip>
          </Polyline>
        )
      })}
      {p.route && (
        <>
          <CircleMarker center={cell(h, p.route.start.px)} radius={7} pathOptions={{ color: '#fff', fillColor: '#3b82f6', fillOpacity: 1 }}>
            <Tooltip>Başlangıç</Tooltip>
          </CircleMarker>
          <CircleMarker center={cell(h, p.route.goal.px)} radius={7} pathOptions={{ color: '#fff', fillColor: '#ef4444', fillOpacity: 1 }}>
            <Tooltip>Hedef</Tooltip>
          </CircleMarker>
        </>
      )}

      {rovers.map((r) => (
        <CircleMarker
          key={r.stop_id}
          center={cont(h, r.px)}
          radius={r.stop_id === p.selectedId ? 7 : 4}
          pathOptions={{ color: '#0f172a', weight: 1, fillColor: ROVER_COLOR, fillOpacity: 0.9 }}
          eventHandlers={{ click: () => p.onSelectRover?.(r) }}
        >
          <Tooltip>{r.stop_id} · sol {r.sol}</Tooltip>
        </CircleMarker>
      ))}
      {science.map((s) => (
        <CircleMarker
          key={s.id}
          center={cell(h, s.px)}
          radius={s.id === p.selectedId ? 13 : 9}
          pathOptions={{ color: '#fff', weight: 2, fillColor: SCI_COLOR, fillOpacity: 0.85 }}
          eventHandlers={{ click: () => p.onSelectScience?.(s) }}
        >
          <Tooltip>{s.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
