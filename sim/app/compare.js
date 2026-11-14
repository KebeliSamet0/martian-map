// Model açık/kapalı karşılaştırması: "Yalnız eğim" rotası ile "Zemin modeli + kaya" rotası, fark ve tek cümlelik sonuç.
// Sayılar API /compare çıktısıdır (api/planner/insight.py); burada hesap yok, yalnız özet ve çizim.
// Naif rota zemin sınıfı bilmeden planlanır, maliyeti gerçek zemin katmanında ölçülür. Zemin katmanı model tahminidir.
import { segmentWhy } from './insight.js';

const fmt = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const num = (v, d = 0) => Number(v).toLocaleString('tr', { minimumFractionDigits: d, maximumFractionDigits: d });

export async function fetchCompare(apiBase, start, goal, { budget, fetcher = fetch, timeoutMs = 20000 } = {}) {
  const r = await fetcher(`${apiBase}/compare`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, goal, ...(budget ? { budget } : {}) }), signal: AbortSignal.timeout(timeoutMs) });
  if (!r.ok) { let d = ''; try { d = (await r.json()).detail; } catch { /* yut */ } throw new Error(`API ${r.status}${d ? ': ' + d : ''}`); }
  return r.json();
}

/** Bir rota türü için kart verisi + tek cümle. t: texts.json "compare" nesnesi. */
export function summarize(c, t) {
  const n = c.naive.metrics, m = c.model.metrics, s = c.saved;
  const hazard = Math.max(0, c.naive_hazard_m - c.model_hazard_m);
  const riskPct = n.risk > 0 ? Math.round((s.risk / n.risk) * 100) : 0;
  const energyMeaningful = s.kcal >= 2 || s.o2_L >= 0.4;
  let key = 'sentence_same', vars = {};
  if (!c.same_path) {
    if (energyMeaningful && s.sand_m > 0) { key = 'sentence_full'; vars = { kcal: num(s.kcal), o2: num(s.o2_L, 1), sand: num(s.sand_m) }; }
    else { key = 'sentence_risk'; vars = { risk_pct: num(Math.max(0, riskPct)), hazard: num(hazard), kcal: `${s.kcal >= 0 ? '+' : '−'}${num(Math.abs(s.kcal), 1)}` }; }
  }
  const row = (label, unit, a, b, d = 0, lowerIsBetter = true) => {
    const diff = a - b;   // naif − model; >0 model azalttı
    const text = Math.abs(diff) < Math.pow(10, -d) / 2 ? t.delta_same : fmt(diff > 0 ? t.delta_better : t.delta_worse, { v: num(Math.abs(diff), d), u: unit });
    return { label, unit, naive: a, model: b, diff, text, good: lowerIsBetter ? diff > 0 : diff < 0, same: text === t.delta_same };
  };
  return {
    kind: c.kind, label: c.label, samePath: c.same_path, sentence: fmt(t[key], vars), sentenceKey: key,
    rows: [row(t.row_dist, t.unit_m, n.m, m.m), row(t.row_kcal, t.unit_kcal, n.kcal, m.kcal), row(t.row_o2, t.unit_l, n.o2_L, m.o2_L, 1),
      row(t.row_risk, t.unit_risk, n.risk, m.risk, 1), row(t.row_hazard, t.unit_m, c.naive_hazard_m, c.model_hazard_m)],
    savedKcal: s.kcal, savedO2: s.o2_L, sandAvoidedM: s.sand_m, hazardAvoidedM: hazard, riskPct,
  };
}

/** Karşılaştırma paneli (DOM). container: ör. #route-info. Dönüş: { el, setKind(kind), destroy() } */
export function renderCompare(container, data, t, { kind = 'balanced', hazardColor = '#ff453a' } = {}) {
  const el = document.createElement('section'); el.className = 'mm-compare';
  Object.assign(el.style, { marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,178,122,.2)', font: '12px/1.4 system-ui' });
  const draw = (k) => {
    const c = data.comparisons.find((x) => x.kind === k) ?? data.comparisons[0], s = summarize(c, t);
    const head = (txt, sub, cl) => `<div style="flex:1"><b style="color:${cl}">${txt}</b><div class="tiny" style="opacity:.7">${sub}</div></div>`;
    el.innerHTML = `<div style="font-weight:700;margin-bottom:6px">${t.title}</div>` +
      `<div style="display:flex;gap:8px">${head(t.naive, t.naive_sub, '#9aa7b4')}${head(t.model, t.model_sub, '#ffb27a')}</div>` +
      s.rows.map((r) => `<div style="display:flex;gap:8px;padding:2px 0;border-top:1px solid rgba(255,255,255,.06)"><span style="width:84px;opacity:.7">${r.label}</span>` +
        `<span style="flex:1">${num(r.naive, r.unit === t.unit_l || r.unit === t.unit_risk ? 1 : 0)} ${r.unit}</span><span style="flex:1"><b>${num(r.model, r.unit === t.unit_l || r.unit === t.unit_risk ? 1 : 0)} ${r.unit}</b></span>` +
        `<span style="width:92px;text-align:right;color:${r.same ? '#8d99a6' : r.good ? '#5fd68a' : '#ff9f6b'}">${r.text}</span></div>`).join('') +
      `<p style="margin:8px 0 2px;font-weight:600">${s.sentence}</p>` +
      `<div class="tiny" style="opacity:.7"><span style="color:${hazardColor}">■</span> ${t.hazard_note}</div>` +
      `<div class="tiny" style="opacity:.6">${fmt(t.scope, { kind: c.label })}${data.provisional_terrain ? ' ' + t.provisional : ''}</div>`;
    return s;
  };
  container.append(el);
  let cur = draw(kind);
  return { el, summary: () => cur, setKind(k) { cur = draw(k); return cur; }, destroy() { el.remove(); } };
}

/** Rota yolunu hücre [x,y] dizisine düzleştir (segmentler birleşik, tekrar eden uç noktalar atılır). */
export function pathPx(route) {
  const out = [];
  for (const s of route.segments) for (const p of s.path_px) { const l = out[out.length - 1]; if (!l || l[0] !== p[0] || l[1] !== p[1]) out.push(p); }
  return out;
}

/**
 * Haritaya karşılaştırmayı çiz (Leaflet). toLatLng(px[x,y] sürekli ızgara) → [lat,lng].
 * Naif rota gri kesikli; naifin kum/kayalık segmentleri kırmızı kalın; model rotası turuncu.
 * Dönüş: { group, clear() }.
 */
export function drawCompareOnMap(L, map, c, toLatLng, { hazardColor = '#ff453a', t = {} } = {}) {
  const group = L.featureGroup().addTo(map), ll = (pts) => pts.map((p) => toLatLng([p[0] + 0.5, p[1] + 0.5]));
  L.polyline(ll(pathPx(c.naive)), { color: '#9aa7b4', weight: 4, opacity: 0.9, dashArray: '2 7' }).addTo(group).bindTooltip(t.naive ?? 'naive');
  for (const s of c.naive.segments) {
    if (!s.insight?.hazard) continue;
    L.polyline(ll(s.path_px), { color: hazardColor, weight: 7, opacity: 0.9 }).addTo(group).bindPopup(`<b>${t.naive ?? ''}</b> · ${segmentWhyShort(s)}`);
  }
  L.polyline(ll(pathPx(c.model)), { color: '#ffb27a', weight: 4, opacity: 1 }).addTo(group).bindTooltip(t.model ?? 'model');
  return { group, clear() { map.removeLayer(group); } };
}
const segmentWhyShort = (s) => `${s.len_m} m · ${s.class} · p_kum ${s.p_sand} · kaya ${(s.rock_cfa * 100).toFixed(0)} %`;
export { segmentWhy };
