// insight.js + compare.js'i akış desk'inin yuvalarına ve yürüyüş ekranına bağlar (tur4:veri).
// main.js'e yalnız `import './insight-ui.js'; // tur4:veri` eklenir; her şey burada kendi kendine kaydolur.
//   route-extra     → rota seçim ekranında model açık/kapalı karşılaştırması (+ haritada iki rota)
//   report-insight  → karnede "verinin etkisi"
//   mm:screen walk  → ayak altı zemin satırı + segment değişiminde açıklama (kendi DOM overlay'i)
//   harita paneli   → "Model güveni katmanı" (belirsizlik sisi) düğmesi
import { registerSlot } from './slots.js';
import { loadTexts } from './screens.js';
import { API_BASE, API_OFF, GRID, pxToWorld, worldToPx } from './api.js';
import { fetchCompare, renderCompare, drawCompareOnMap, summarize } from './compare.js';
import { layers3d } from './insight-3d.js';
import { createFootReader, fogCanvas, loadTerrainField, segmentWhy, segmentAt } from './insight.js';

const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'tr';
const pick = (v) => (v && typeof v === 'object' && 'tr' in v ? (v[lang] ?? v.tr) : v);   // {tr,en} alanlı anahtarlar da çalışır
const group = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k, pick(v)]));
let TX = null;
const texts = async () => (TX ??= await loadTexts().then((all) => ({ insight: group(all.insight), compare: group(all.compare) })));
const mm = () => window.__mm;
const kindsOf = (s) => ['shortest', 'balanced', 'safest'].includes(s) ? s : 'balanced';

// ---- ortak: /compare önbelleği ----
const cache = new Map();
async function compareFor(start, goal, call) {
  const key = `${start}|${goal}`;
  if (!cache.has(key)) cache.set(key, (call ? call('/compare', { start, goal }) : fetchCompare(API_BASE, start, goal)).catch((e) => { cache.delete(key); throw e; }));
  return cache.get(key);
}
function toLatLng(geo) {
  return (px) => { const w = pxToWorld(geo, px[0], px[1]), [lo, la] = geo.worldToLonlat(w[0], w[1]); return [la, lo]; };
}

// ---- harita çizimi: rota seçimi sırasında ----
let drawn = null;
const clearDraw = () => { drawn?.clear(); drawn = null; };
function drawOnMap(c, geo, t) {
  clearDraw();
  const map = mm()?.mapView?.map; if (!map || !window.L) return;
  drawn = drawCompareOnMap(window.L, map, c, toLatLng(geo), { t });
}

// ---- yuva: rota seçim ekranı ----
registerSlot('route-extra', async ({ routes, call, geo }) => {
  if (API_OFF) return null;
  const r0 = routes?.find((r) => r.startPx && r.goalPx); if (!r0) return null;
  const { compare: C } = await texts();
  const host = document.createElement('div');
  try {
    const data = await compareFor(r0.startPx, r0.goalPx, call);
    let kind = 'balanced';   // ana karşılaştırma dengeli rota; sekmelerle diğer türler
    const tabs = document.createElement('div'); tabs.style.cssText = 'display:flex;gap:6px;margin:8px 0 0';
    const panel = renderCompare(host, data, C, { kind });
    host.insertBefore(tabs, panel.el);
    const show = (k) => {
      kind = k; panel.setKind(k);
      tabs.querySelectorAll('button').forEach((b) => { b.style.opacity = b.dataset.kind === k ? '1' : '.55'; });
      const cur = data.comparisons.find((c) => c.kind === k);
      drawOnMap(cur, geo ?? mm().geo, C);
      layers3d.configure({ geo: geo ?? mm().geo, comparison: cur, hazard: true });   // 3B: yalnız eğim rotasının kum/kayalık segmentleri araziye boyanır
    };
    for (const c of data.comparisons) {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.kind = c.kind; b.textContent = c.label; b.className = 'ghost';
      b.onclick = () => show(c.kind); tabs.append(b);
    }
    show(kind);
  } catch (e) { host.textContent = C.error.replace('{why}', e.message); host.className = 'tiny'; }
  return host;
});

// ---- yuva: karne "verinin etkisi" ----
registerSlot('report-insight', async ({ route, completed }) => {
  if (API_OFF || !route?.startPx || !route?.goalPx) return null;
  const { compare: C, insight: T } = await texts();
  const data = await compareFor(route.startPx, route.goalPx).catch(() => null); if (!data) return null;
  const c = data.comparisons.find((x) => x.kind === kindsOf(route.kind)) ?? data.comparisons[1], s = summarize(c, C);
  const el = document.createElement('section'); el.className = 'mm-insight-report';
  const top = c.model.segments.slice().sort((a, b) => (b.insight?.extra_kcal ?? 0) - (a.insight?.extra_kcal ?? 0)).slice(0, 3).filter((g) => (g.insight?.extra_kcal ?? 0) >= 0.5);
  el.innerHTML = `<h4 style="margin:12px 0 4px">${C.title}</h4><p style="margin:0 0 6px;font-weight:600">${s.sentence}</p>` +
    s.rows.slice(1, 4).map((r) => `<div class="tiny">${r.label}: ${r.naive.toFixed(r.unit === C.unit_l || r.unit === C.unit_risk ? 1 : 0)} → <b>${r.model.toFixed(r.unit === C.unit_l || r.unit === C.unit_risk ? 1 : 0)} ${r.unit}</b> · ${r.text}</div>`).join('') +
    top.map((g) => `<div class="tiny" style="margin-top:3px">${segmentWhy(g, T)}</div>`).join('') +
    `<div class="tiny" style="opacity:.6;margin-top:4px">${C.scope.replace('{kind}', c.label)}${completed === false ? '' : ''}</div>`;
  return el;
});

// ---- yürüyüş ekranı: ayak altı satırı + segment açıklaması ----
const W = { foot: null, tried: false, timer: 0, seg: null, segEl: null, hideT: 0, on: false };
function segEl() {
  if (W.segEl) return W.segEl;
  const el = document.createElement('div'); el.hidden = true; el.setAttribute('role', 'status');
  Object.assign(el.style, { position: 'fixed', left: '50%', bottom: '84px', transform: 'translateX(-50%)', maxWidth: '640px', padding: '6px 12px', borderRadius: '8px',
    background: 'rgba(14,10,8,.72)', color: '#f3e3d3', font: '12px/1.35 system-ui', pointerEvents: 'none', zIndex: 20, textAlign: 'center' });
  document.body.append(el); return (W.segEl = el);
}
async function tick() {
  const m = mm(); if (!m?.geo || !W.on) return;
  const { insight: T } = await texts();
  if (!W.foot && !W.tried) { W.tried = true; try { W.foot = await createFootReader({ apiBase: API_BASE, texts: T, grid: { w: GRID.w, h: GRID.h } }); } catch (e) { console.warn('[insight foot]', e); } }
  W.foot?.update(worldToPx(m.geo, m.P.x, m.P.z));
  const R = m.routeRun; if (!R) return;
  if (!layers3d.state.hasComparison && R.r.startPx) { const d = await compareFor(R.r.startPx, R.r.goalPx).catch(() => null); const cur = d?.comparisons.find((x) => x.kind === R.r.kind); if (cur) layers3d.configure({ geo: m.geo, comparison: cur, hazard: true }); legend3d(true); }
  let i = R.cum.findIndex((c) => c >= R.s); if (i < 0) i = R.cum.length - 1;
  const seg = segmentAt(R.r, i); if (!seg || seg.id === W.seg) return;
  W.seg = seg.id;
  let model = null;
  if (!R.replanned && R.r.startPx) { const d = await compareFor(R.r.startPx, R.r.goalPx).catch(() => null); model = d?.comparisons.find((x) => x.kind === R.r.kind)?.model.segments.find((g) => g.id === seg.id); }
  const el = segEl(); el.textContent = model ? segmentWhy(model, T) : (seg.reason ?? ''); el.hidden = !el.textContent;
  clearTimeout(W.hideT); W.hideT = setTimeout(() => { el.hidden = true; }, 7000);
}
let legendEl = null;
async function legend3d(show) {
  const { compare: C } = await texts();
  if (!legendEl) {
    legendEl = document.createElement('div'); legendEl.hidden = true;
    Object.assign(legendEl.style, { position: 'fixed', left: '50%', top: '10px', transform: 'translateX(-50%)', padding: '4px 10px', borderRadius: '6px', background: 'rgba(14,10,8,.7)', color: '#ffb4ad', font: '11px system-ui', pointerEvents: 'none', zIndex: 20 });
    legendEl.textContent = '■ ' + C.hazard3d_legend; document.body.append(legendEl);
  }
  legendEl.hidden = !(show && layers3d.state.hazard && layers3d.state.hasComparison);
}
function walking(on) {
  W.on = on; clearInterval(W.timer);
  if (on) { W.seg = null; W.timer = setInterval(() => void tick(), 250); void tick(); }
  else { W.foot?.setVisible(false); if (W.segEl) W.segEl.hidden = true; }
}
addEventListener('mm:screen', (e) => {
  const d = e.detail, screen = typeof d === 'string' ? d : d?.screen;
  if (screen === 'walk' || screen === 'yürüyüş') walking(true);
  else if (screen === 'resume') walking(true);
  else if (['pause', 'report', 'intro', 'select', 'briefing'].includes(screen)) { walking(false); if (screen !== 'select') clearDraw(); }
  if (['walk', 'report', 'select', 'briefing', 'intro'].includes(screen)) clearDraw();
  if (['select', 'briefing', 'intro'].includes(screen)) layers3d.configure({ comparison: null });
  legend3d(screen === 'walk' || screen === 'resume');
});

// ---- harita paneli: model güveni katmanı düğmesi ----
(function fogButton() {
  if (API_OFF) return;
  const wait = setInterval(async () => {
    const m = mm(), panel = document.getElementById('panel'); if (!m?.mapView?.map || !panel) return;
    clearInterval(wait);
    const { insight: T } = await texts(), L = window.L; let overlay = null, field = null;
    const mk = (label, title, on, handler) => {
      const lab = document.createElement('label'); lab.title = title; lab.style.cssText = 'display:flex;gap:6px;align-items:center;margin-top:6px;font-size:12px';
      lab.innerHTML = `<input type="checkbox"${on ? ' checked' : ''}> ${label}`; panel.append(lab); lab.querySelector('input').onchange = handler;
    };
    const ensureField = async () => (field ??= await loadTerrainField(API_BASE, { w: GRID.w, h: GRID.h }));
    mk(T.fog_button, T.fog_hint, false, async (e) => {
      try {
        await ensureField();
        overlay ??= L.imageOverlay(fogCanvas(field).toDataURL(), L.latLngBounds(toLatLng(m.geo)([0, 0]), toLatLng(m.geo)([GRID.w, GRID.h])), { interactive: false, zIndex: 400 });
        if (e.target.checked) overlay.addTo(m.mapView.map); else m.mapView.map.removeLayer(overlay);
        layers3d.configure({ geo: m.geo, field, fog: e.target.checked });   // aynı düğme 3B arazide de sis
      } catch (err) { e.target.checked = false; console.warn('[insight fog]', err); }
    });
    mk(T.hazard_button, T.hazard_button, true, (e) => { layers3d.configure({ geo: m.geo, hazard: e.target.checked }); legend3d(true); });
    window.__insight = { layers3d };
  }, 500);
})();
