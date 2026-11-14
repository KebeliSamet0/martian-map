// "Canlı rota" sekmesi (#48): haritadan iki nokta → POST /route → 3 rota,
// segment kartı ve GO/NO-GO bütçe paneli. Tüm veri planlayıcı API'sinden gelir.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  API_URL, getGrid, layerUrl, postRoute,
  type GridInfo, type LayerName, type Px, type Route, type RouteKind, type Segment,
} from '../lib/api';

const ROUTE_COLOR: Record<RouteKind, string> = {
  shortest: '#f97316', // turuncu
  balanced: '#3b82f6', // mavi
  safest: '#22c55e',   // yeşil
};
const CONF_LABEL = { high: 'Yüksek', mid: 'Orta', low: 'Düşük' } as const;
const CLASS_LABEL = { soil: 'Toprak', bedrock: 'Ana kaya', sand: 'Kum', bigrock: 'Büyük kaya' } as const;
const BASE_LAYERS: { name: LayerName; label: string }[] = [
  { name: 'slope', label: 'Eğim' },
  { name: 'elevation', label: 'Yükseklik' },
  { name: 'rock_cfa', label: 'Kaya' },
  { name: 'p_sand', label: 'Kum olasılığı' },
  { name: 'entropy', label: 'Model belirsizliği' },
];

// px [sütun, satır] → CRS.Simple LatLng (hücre merkezi). Satır aşağı doğru artar.
const toLatLng = ([c, r]: Px): L.LatLngTuple => [-(r + 0.5), c + 0.5];

type Selection = { kind: RouteKind; segId: number | null };

export default function ApiRoutesView({ header }: { header?: ReactNode }) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const baseOverlay = useRef<L.ImageOverlay | null>(null);
  const pointsLayer = useRef<L.LayerGroup | null>(null);
  const routesLayer = useRef<L.LayerGroup | null>(null);
  const clickRef = useRef<(px: Px) => void>(() => {});

  const [grid, setGrid] = useState<GridInfo | null>(null);
  const [base, setBase] = useState<LayerName>('slope');
  const [start, setStart] = useState<Px | null>(null);
  const [goal, setGoal] = useState<Px | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [sel, setSel] = useState<Selection>({ kind: 'safest', segId: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) Izgarayı API'den al
  useEffect(() => {
    getGrid().then(setGrid).catch((e) => setError(e.message));
  }, []);

  // 2) Haritayı ızgara boyutuna göre kur
  useEffect(() => {
    if (!grid || !mapDiv.current || map.current) return;
    const bounds: L.LatLngBoundsExpression = [[-grid.height, 0], [0, grid.width]];
    const m = L.map(mapDiv.current, { crs: L.CRS.Simple, minZoom: -3, maxZoom: 4, zoomSnap: 0.25, attributionControl: false });
    m.fitBounds(bounds);
    m.setMaxBounds(L.latLngBounds(bounds).pad(0.2));
    baseOverlay.current = L.imageOverlay(layerUrl(base), bounds).addTo(m);
    routesLayer.current = L.layerGroup().addTo(m);
    pointsLayer.current = L.layerGroup().addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => {
      const c = Math.floor(e.latlng.lng);
      const r = Math.floor(-e.latlng.lat);
      if (c < 0 || r < 0 || c >= grid.width || r >= grid.height) return;
      clickRef.current([c, r]);
    });
    map.current = m;
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  // 3) Altlık katmanı değişince yalnız görseli değiştir
  useEffect(() => { baseOverlay.current?.setUrl(layerUrl(base)); }, [base]);

  // 4) Rota iste
  async function plan(s: Px, g: Px) {
    setLoading(true);
    setError(null);
    try {
      const res = await postRoute(s, g);
      setRoutes(res.routes);
      setSel({ kind: 'safest', segId: null });
    } catch (e) {
      setRoutes([]);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Tıklama: 1. tık başlangıç, 2. tık hedef (rota ister), 3. tık yeniden başlar
  clickRef.current = (px: Px) => {
    if (!start || goal) {
      setStart(px); setGoal(null); setRoutes([]); setError(null);
    } else {
      setGoal(px);
      plan(start, px);
    }
  };

  function pickStops(s: Px, g: Px) {
    setStart(s); setGoal(g); plan(s, g);
  }

  // 5) Noktaları çiz (duraklar, başlangıç, hedef)
  useEffect(() => {
    const lg = pointsLayer.current;
    if (!lg || !grid) return;
    lg.clearLayers();
    grid.rover_stops.forEach((s) =>
      L.circleMarker(toLatLng(s.px), { radius: 2, color: '#94a3b8', weight: 1, fillOpacity: 0.8 })
        .bindTooltip(s.stop_id).addTo(lg));
    grid.science_stops.forEach((s) =>
      L.circleMarker(toLatLng(s.px), { radius: 6, color: '#a855f7', weight: 2, fillOpacity: 0.6 })
        .bindTooltip(`${s.name}<br/><small>${s.why}</small>`).addTo(lg));
    if (start) L.circleMarker(toLatLng(start), { radius: 7, color: '#fff', fillColor: '#16a34a', fillOpacity: 1, weight: 2 })
      .bindTooltip('Başlangıç').addTo(lg);
    if (goal) L.circleMarker(toLatLng(goal), { radius: 7, color: '#fff', fillColor: '#dc2626', fillOpacity: 1, weight: 2 })
      .bindTooltip('Hedef').addTo(lg);
  }, [grid, start, goal]);

  // 6) Rotaları çiz; seçili rota en üstte, düşük güvenli segment kesikli
  useEffect(() => {
    const lg = routesLayer.current;
    if (!lg) return;
    lg.clearLayers();
    const ordered = [...routes].sort((a, b) => Number(a.kind === sel.kind) - Number(b.kind === sel.kind));
    for (const r of ordered) {
      const active = r.kind === sel.kind;
      for (const seg of r.segments) {
        const isSel = active && seg.id === sel.segId;
        L.polyline(seg.path_px.map(toLatLng), {
          color: ROUTE_COLOR[r.kind],
          weight: isSel ? 8 : active ? 5 : 3,
          opacity: active ? 0.95 : 0.45,
          dashArray: seg.conf === 'low' ? '6 6' : undefined,
        })
          .on('click', (e) => { L.DomEvent.stopPropagation(e); setSel({ kind: r.kind, segId: seg.id }); })
          .addTo(lg);
      }
    }
  }, [routes, sel]);

  const route = routes.find((r) => r.kind === sel.kind) ?? null;
  const segment = useMemo<Segment | null>(
    () => route?.segments.find((s) => s.id === sel.segId) ?? null,
    [route, sel.segId],
  );

  return (
    <div className="flex h-full">
      <div className="relative flex-1">
        <div ref={mapDiv} className="h-full w-full bg-slate-900" />
        <div className="absolute left-14 top-2 z-[1000] rounded bg-slate-900/85 px-3 py-2 text-sm text-slate-100">
          {!grid && !error && 'Izgara yükleniyor…'}
          {grid && !start && 'Başlangıç noktasını seç'}
          {grid && start && !goal && 'Hedef noktasını seç'}
          {loading && 'Rotalar hesaplanıyor…'}
          {grid && goal && !loading && routes.length > 0 && 'Segmente tıkla · yeni rota için haritaya tıkla'}
        </div>
        {grid?.synthetic && (
          <div className="absolute bottom-2 left-2 z-[1000] rounded bg-amber-500/90 px-2 py-1 text-xs font-medium text-black">
            Sentetik veri: {grid.region}
          </div>
        )}
      </div>

      <aside className="flex w-96 flex-col gap-3 overflow-y-auto border-l border-slate-700 p-4 text-sm text-slate-100">
        {header}
        {error && (
          <div className="rounded border border-red-500 bg-red-950/60 p-3">
            {error}
            <div className="mt-1 text-xs text-red-300">API: {API_URL}</div>
          </div>
        )}

        <label className="flex items-center gap-2">
          Altlık
          <select className="flex-1 rounded bg-slate-800 p-1" value={base} onChange={(e) => setBase(e.target.value as LayerName)}>
            {BASE_LAYERS.filter((b) => !grid || grid.layers.includes(b.name)).map((b) => (
              <option key={b.name} value={b.name}>{b.label}</option>
            ))}
          </select>
        </label>

        {grid && grid.science_stops.length >= 2 && (
          <StopPicker grid={grid} onPick={pickStops} />
        )}

        {routes.length > 0 && (
          <div className="flex flex-col gap-2">
            {routes.map((r) => (
              <button
                key={r.kind}
                onClick={() => setSel({ kind: r.kind, segId: null })}
                className={`rounded border-l-4 bg-slate-800 p-2 text-left ${r.kind === sel.kind ? 'ring-2 ring-slate-300' : ''}`}
                style={{ borderLeftColor: ROUTE_COLOR[r.kind] }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r.label}</span>
                  <StatusBadge go={r.total.go} status={r.total.status} />
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  {r.total.km.toFixed(2)} km · {Math.round(r.total.min)} dk · {Math.round(r.total.kcal)} kcal ·
                  maks. eğim {r.total.slope_max.toFixed(0)}° · düşük güven {Math.round(r.total.low_conf_m)} m
                </div>
              </button>
            ))}
          </div>
        )}

        {route && <BudgetPanel route={route} />}
        {segment && route && <SegmentCard seg={segment} color={ROUTE_COLOR[route.kind]} />}
      </aside>
    </div>
  );
}

function StopPicker({ grid, onPick }: { grid: GridInfo; onPick: (s: Px, g: Px) => void }) {
  const [a, setA] = useState(grid.science_stops[0].id);
  const [b, setB] = useState(grid.science_stops[1].id);
  const find = (id: string) => grid.science_stops.find((s) => s.id === id)!.px;
  return (
    <div className="flex flex-col gap-1 rounded bg-slate-800 p-2">
      <span className="text-xs text-slate-400">Bilim durağından seç</span>
      <div className="flex gap-1">
        <select className="flex-1 rounded bg-slate-700 p-1" value={a} onChange={(e) => setA(e.target.value)}>
          {grid.science_stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="flex-1 rounded bg-slate-700 p-1" value={b} onChange={(e) => setB(e.target.value)}>
          {grid.science_stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <button className="rounded bg-slate-600 py-1 hover:bg-slate-500 disabled:opacity-40" disabled={a === b}
        onClick={() => onPick(find(a), find(b))}>
        Rota hesapla
      </button>
    </div>
  );
}

function StatusBadge({ go, status }: { go: boolean; status: string }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-bold ${go ? 'bg-green-600' : 'bg-red-600'}`}>{status}</span>
  );
}

function BudgetPanel({ route }: { route: Route }) {
  const t = route.total;
  const b = t.budget;
  const rows = b
    ? [
        { label: 'Süre', used: b.used.time_min, limit: b.limits.time_min, unit: 'dk' },
        { label: 'Enerji', used: b.used.kcal, limit: b.limits.kcal, unit: 'kcal' },
        { label: 'Oksijen', used: b.used.o2_L, limit: b.limits.o2_L, unit: 'L' },
        { label: 'Doz', used: b.used.dose_uGy, limit: b.limits.dose_uGy, unit: 'µGy' },
      ]
    : [];
  return (
    <div className="rounded bg-slate-800 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">Bütçe: {route.label}</span>
        <StatusBadge go={t.go} status={t.status} />
      </div>
      {rows.map((r) => {
        const pct = Math.min(100, (r.used / r.limit) * 100);
        const over = r.used > r.limit;
        return (
          <div key={r.label} className="mb-2">
            <div className="flex justify-between text-xs">
              <span>{r.label}</span>
              <span className={over ? 'text-red-400' : 'text-slate-300'}>
                {Math.round(r.used)} / {Math.round(r.limit)} {r.unit}
              </span>
            </div>
            <div className="h-1.5 rounded bg-slate-700">
              <div className={`h-1.5 rounded ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-green-500'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="text-xs text-slate-400">
        Dönüş ve {b?.limits.reserve_min ?? '–'} dk yedek dahil. Geri yürüyüş {t.walkback_ok ? 'mümkün' : 'mümkün değil'}.
        {t.limit_exceeded_at_m != null && <> İlk aşım {Math.round(t.limit_exceeded_at_m)} m'de.</>}
      </div>
    </div>
  );
}

function SegmentCard({ seg, color }: { seg: Segment; color: string }) {
  return (
    <div className="rounded border-l-4 bg-slate-800 p-3" style={{ borderLeftColor: color }}>
      <div className="mb-1 flex justify-between">
        <span className="font-semibold">Segment {seg.id}</span>
        <span className={`text-xs ${seg.conf === 'low' ? 'text-amber-400' : 'text-slate-300'}`}>
          Model güveni: {CONF_LABEL[seg.conf]}
        </span>
      </div>
      <p className="mb-2">{seg.reason}</p>
      {seg.rejected_alt && <p className="mb-2 text-slate-300">{seg.rejected_alt}</p>}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-300">
        <span>Zemin: {CLASS_LABEL[seg.class] ?? seg.class}</span>
        <span>Uzunluk: {seg.len_m.toFixed(0)} m</span>
        <span>Eğim: {seg.slope_mean.toFixed(1)}° (maks. {seg.slope_max.toFixed(1)}°)</span>
        <span>Süre: {seg.min.toFixed(1)} dk</span>
        <span>Kum olasılığı: %{Math.round(seg.p_sand * 100)}</span>
        <span>Enerji: {seg.kcal.toFixed(0)} kcal</span>
        <span>Kaya örtüsü: %{(seg.rock_cfa * 100).toFixed(1)}</span>
        <span>En yakın kanıt: {Math.round(seg.nearest_evidence_m)} m</span>
      </div>
    </div>
  );
}
