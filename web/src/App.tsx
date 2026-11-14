import { useEffect, useState, type ReactNode } from 'react'
import MapView, { CONF_COLOR } from './MapView'
import type { RouteResponse, Segment, Total } from './types'

const DATA_URL = '/routes/route.example.json'
const CLASS_TR: Record<string, string> = { soil: 'Toprak', bedrock: 'Ana kaya', sand: 'Kum', bigrock: 'Büyük kaya' }
const CONF_TR: Record<string, string> = { high: 'Yüksek', mid: 'Orta', low: 'Düşük' }
const pct = (v?: number) => (v == null ? '–' : `%${Math.round(v * 100)}`)

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
        <h2 className="font-semibold text-slate-100">Rota özeti</h2>
        <span className={`rounded-md px-2 py-0.5 text-sm font-bold ${go ? 'bg-green-600' : 'bg-red-600'} text-white`}>{go ? 'GO' : 'NO-GO'}</span>
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
      <h2 className="mb-1 font-semibold text-slate-100">Segment {s.id}</h2>
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

export default function App() {
  const [data, setData] = useState<RouteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [routeIdx, setRouteIdx] = useState(0)
  const [segId, setSegId] = useState<number | null>(null)

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`${DATA_URL} yüklenemedi (${r.status})`)
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="p-6 text-red-400">{error}</div>
  if (!data) return <div className="p-6 text-slate-300">Yükleniyor…</div>

  const route = data.routes[routeIdx]
  const seg = route.segments.find((s) => s.id === segId) ?? null

  return (
    <div className="flex h-full bg-slate-900 text-slate-100">
      <main className="relative flex-1">
        <MapView grid={data.grid} route={route} selected={segId} onSelect={setSegId} />
        {data.grid.synthetic && (
          <div className="absolute left-3 top-3 z-[1000] rounded-md bg-amber-500/90 px-2 py-1 text-xs font-semibold text-black">SAHTE VERİ — {data.grid.region}</div>
        )}
      </main>
      <aside className="flex w-96 flex-col gap-3 overflow-y-auto border-l border-slate-700 p-4">
        <h1 className="text-lg font-bold">Martian Map</h1>
        {data.routes.length > 1 && (
          <div className="flex gap-2">
            {data.routes.map((r, i) => (
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
      </aside>
    </div>
  )
}
