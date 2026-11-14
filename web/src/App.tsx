import { useEffect, useState, type ReactNode } from 'react'
import MapView, { CONF_COLOR, ROVER_COLOR, SCI_COLOR } from './MapView'
import type { GridInfo, RouteResponse, RoverStop, ScienceStop, Segment, Total } from './types'

const CLASS_TR: Record<string, string> = { soil: 'Toprak', bedrock: 'Ana kaya', sand: 'Kum', bigrock: 'Büyük kaya' }
const CONF_TR: Record<string, string> = { high: 'Yüksek', mid: 'Orta', low: 'Düşük' }
const pct = (v?: number) => (v == null ? '–' : `%${Math.round(v * 100)}`)

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} yüklenemedi (${r.status})`)
  return r.json() as Promise<T>
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-slate-400">{k}</span>
      <span className="text-right font-medium text-slate-100">{v}</span>
    </div>
  )
}

function Summary({ t }: { t: Total }) {
  const go = t.status ? t.status === 'GO' : t.go
  return (
    <section className="rounded-xl bg-slate-800 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Rota özeti</h2>
        <span className={`rounded-md px-2 py-0.5 text-sm font-bold text-white ${go ? 'bg-green-600' : 'bg-red-600'}`}>{go ? 'GO' : 'NO-GO'}</span>
      </div>
      <Row k="Uzunluk (tek yön)" v={`${t.km} km`} />
      <Row k="Süre (tek yön)" v={`${t.min} dk`} />
      <Row k="Enerji (tek yön)" v={`${t.kcal} kcal`} />
      {t.eva_min != null && <Row k="EVA süresi" v={`${t.eva_min} / ${t.eva_limit_min ?? '–'} dk`} />}
      {t.o2_L != null && <Row k="O₂ tahmini" v={`${t.o2_L} L`} />}
      <Row k="Radyasyon dozu" v={`${t.dose_uGy} µGy`} />
      {t.slope_max != null && <Row k="En yüksek eğim" v={`${t.slope_max}°`} />}
      {t.low_conf_m != null && <Row k="Düşük güvenli kısım" v={`${t.low_conf_m} m`} />}
      <Row k="Eve dönüş payı" v={t.walkback_ok ? 'Yeterli' : 'Yetersiz'} />
    </section>
  )
}

function SegmentCard({ s }: { s: Segment }) {
  return (
    <section className="rounded-xl border-l-4 bg-slate-800 p-4" style={{ borderColor: CONF_COLOR[s.conf] }}>
      <h2 className="mb-1 font-semibold">Segment {s.id}</h2>
      <p className="mb-3 text-sm leading-relaxed text-slate-200">{s.reason}</p>
      <Row k="Uzunluk" v={`${s.len_m} m`} />
      <Row k="Eğim (en yüksek / ort.)" v={`${s.slope_max}° / ${s.slope_mean ?? '–'}°`} />
      <Row k="Baskın zemin" v={CLASS_TR[s.class ?? ''] ?? s.class ?? '–'} />
      <Row k="Kum olasılığı" v={pct(s.p_sand)} />
      <Row k="Kaya kaplama oranı" v={pct(s.rock_cfa)} />
      <Row k="Model güveni" v={<span style={{ color: CONF_COLOR[s.conf] }}>{CONF_TR[s.conf]}</span>} />
      <Row k="En yakın rover kanıtı" v={s.nearest_evidence_m == null ? 'Yok' : `${s.nearest_evidence_m} m`} />
      <Row k="Enerji / süre" v={`${s.kcal} kcal · ${s.min} dk`} />
      {s.rejected_alt && (
        <p className="mt-3 rounded-md bg-slate-900 p-2 text-sm text-slate-300">
          <span className="font-semibold text-slate-100">Reddedilen alternatif: </span>
          {s.rejected_alt}
        </p>
      )}
    </section>
  )
}

function Photos({ urls }: { urls: string[] }) {
  if (!urls.length) return null
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {urls.slice(0, 4).map((u) => (
        <a key={u} href={u} target="_blank" rel="noreferrer">
          <img src={u} loading="lazy" alt="Navcam" className="aspect-square w-full rounded-md object-cover" />
        </a>
      ))}
    </div>
  )
}

function ScienceCard({ s, rovers }: { s: ScienceStop; rovers: RoverStop[] }) {
  const m = s.evidence?.anchor_stop?.match(/site\s+(\d+)\s+drive\s+(\d+)/)
  const anchor = m ? rovers.find((r) => r.site === +m[1] && r.drive === +m[2]) : undefined
  const e = s.evidence
  return (
    <section className="rounded-xl border-l-4 bg-slate-800 p-4" style={{ borderColor: SCI_COLOR }}>
      <h2 className="mb-1 font-semibold">{s.name}</h2>
      <p className="mb-3 text-sm leading-relaxed text-slate-200">{s.why}</p>
      {e?.sol_range && <Row k="Sol aralığı" v={`${e.sol_range[0]}–${e.sol_range[1]}`} />}
      {e?.mahli_images != null && <Row k="MAHLI / ChemCam" v={`${e.mahli_images} / ${e.chemcam_images ?? '–'}`} />}
      {e?.n_stops != null && <Row k="Rover durağı" v={e.n_stops} />}
      {e?.slope_deg != null && <Row k="Eğim" v={`${e.slope_deg}°`} />}
      {s.lat != null && <Row k="Konum" v={`${s.lat.toFixed(5)}, ${s.lon?.toFixed(5)}`} />}
      {anchor ? (
        <>
          <p className="mt-3 text-xs text-slate-400">Varınca göreceğin: {anchor.stop_id} (sol {anchor.sol}) Navcam</p>
          <Photos urls={anchor.images} />
        </>
      ) : (
        e?.anchor_stop && <p className="mt-3 text-xs text-slate-400">Referans durak: {e.anchor_stop}</p>
      )}
    </section>
  )
}

function RoverCard({ r }: { r: RoverStop }) {
  return (
    <section className="rounded-xl border-l-4 bg-slate-800 p-4" style={{ borderColor: ROVER_COLOR }}>
      <h2 className="mb-2 font-semibold">Rover durağı {r.stop_id}</h2>
      <Row k="Sol" v={r.sol} />
      <Row k="Site / drive" v={`${r.site} / ${r.drive}`} />
      {r.slope_deg != null && <Row k="Eğim" v={`${r.slope_deg}°`} />}
      {r.lat != null && <Row k="Konum" v={`${r.lat.toFixed(5)}, ${r.lon?.toFixed(5)}`} />}
      <Photos urls={r.images} />
    </section>
  )
}

type Sel = { kind: 'sci'; item: ScienceStop } | { kind: 'rov'; item: RoverStop } | null
interface RealData { grid: GridInfo; science: ScienceStop[]; rovers: RoverStop[] }

export default function App() {
  const [view, setView] = useState<'real' | 'demo'>('real')
  const [real, setReal] = useState<RealData | null>(null)
  const [demo, setDemo] = useState<RouteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sel, setSel] = useState<Sel>(null)
  const [routeIdx, setRouteIdx] = useState(0)
  const [segId, setSegId] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      getJson<GridInfo>('/data/grid.json'),
      getJson<ScienceStop[]>('/data/science_stops.json'),
      getJson<RoverStop[]>('/data/rover_stops_selected.json'),
    ])
      .then(([grid, science, rovers]) => setReal({ grid, science, rovers }))
      .catch((e) => setError(String(e)))
    getJson<RouteResponse>('/routes/route.example.json').then(setDemo).catch((e) => setError(String(e)))
  }, [])

  const route = demo?.routes[routeIdx] ?? null
  const seg = route?.segments.find((s) => s.id === segId) ?? null
  const selId = sel ? (sel.kind === 'sci' ? sel.item.id : sel.item.stop_id) : null

  return (
    <div className="flex h-full bg-slate-900 text-slate-100">
      <main className="relative flex-1">
        {view === 'real' && real && (
          <MapView
            key="real"
            grid={real.grid}
            baseUrl="/data/ortho_2m.png"
            science={real.science}
            rovers={real.rovers}
            selectedId={selId}
            onSelectScience={(s) => setSel({ kind: 'sci', item: s })}
            onSelectRover={(r) => setSel({ kind: 'rov', item: r })}
          />
        )}
        {view === 'demo' && demo && route && (
          <MapView key="demo" grid={demo.grid} baseUrl="/base.svg" route={route} selectedSeg={segId} onSelectSeg={setSegId} />
        )}
        {view === 'demo' && demo?.grid.synthetic && (
          <div className="absolute left-3 top-3 z-[1000] rounded-md bg-amber-500/90 px-2 py-1 text-xs font-semibold text-black">SAHTE VERİ — {demo.grid.region}</div>
        )}
        {!real && !demo && <div className="p-6 text-slate-300">{error ?? 'Yükleniyor…'}</div>}
      </main>

      <aside className="flex w-96 flex-col gap-3 overflow-y-auto border-l border-slate-700 p-4">
        <h1 className="text-lg font-bold">Martian Map</h1>
        <div className="flex gap-2">
          {(['real', 'demo'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`flex-1 rounded-md px-2 py-1 text-sm ${view === v ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
              {v === 'real' ? 'Gerçek bölge' : 'Örnek rota (sahte)'}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}

        {view === 'real' && real && (
          <>
            <section className="rounded-xl bg-slate-800 p-4 text-sm">
              <p className="mb-2 text-slate-300">{real.grid.region}</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: SCI_COLOR }} /> Bilim durağı ({real.science.length})</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: ROVER_COLOR }} /> Rover kanıt durağı ({real.rovers.length})</p>
            </section>
            <section className="rounded-xl bg-slate-800 p-2">
              {real.science.map((s) => (
                <button key={s.id} onClick={() => setSel({ kind: 'sci', item: s })} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${s.id === selId ? 'bg-slate-700' : 'hover:bg-slate-700/60'}`}>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: SCI_COLOR }} />
                  <span className="flex-1">{s.name}</span>
                </button>
              ))}
            </section>
            {sel?.kind === 'sci' && <ScienceCard s={sel.item} rovers={real.rovers} />}
            {sel?.kind === 'rov' && <RoverCard r={sel.item} />}
            {!sel && <p className="text-sm text-slate-400">Bir bilim durağına veya rover noktasına tıklayın.</p>}
          </>
        )}

        {view === 'demo' && demo && route && (
          <>
            {demo.routes.length > 1 && (
              <div className="flex gap-2">
                {demo.routes.map((r, i) => (
                  <button key={r.kind} onClick={() => { setRouteIdx(i); setSegId(null) }} className={`flex-1 rounded-md px-2 py-1 text-sm ${i === routeIdx ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    {r.label ?? r.kind}
                  </button>
                ))}
              </div>
            )}
            <Summary t={route.total} />
            <section className="rounded-xl bg-slate-800 p-2">
              {route.segments.map((s) => (
                <button key={s.id} onClick={() => setSegId(s.id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${s.id === segId ? 'bg-slate-700' : 'hover:bg-slate-700/60'}`}>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: CONF_COLOR[s.conf] }} />
                  <span className="flex-1">Segment {s.id} · {CLASS_TR[s.class ?? ''] ?? '–'}</span>
                  <span className="text-slate-400">{s.len_m} m</span>
                </button>
              ))}
            </section>
            {seg ? <SegmentCard s={seg} /> : <p className="text-sm text-slate-400">Ayrıntı için haritada veya listede bir segmente tıklayın.</p>}
          </>
        )}
      </aside>
    </div>
  )
}
