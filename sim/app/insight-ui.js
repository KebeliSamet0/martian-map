// insight.js + compare.js'i sim arayüzüne bağlar (main.js'e birkaç satır): karşılaştırma paneli, harita çizimi,
// model güveni katmanı düğmesi, yürürken ayak altı satırı ve segment açıklaması.
import { API_BASE, API_OFF, GRID, pxToWorld, worldToPx } from './api.js';
import { fetchCompare, renderCompare, drawCompareOnMap } from './compare.js';
import { createFootReader, fogCanvas, loadTerrainField, segmentWhy, segmentAt } from './insight.js';

export function initInsight({ mapView, geo, texts, getRouteRun, toast = () => {} }) {
  const T = texts.insight, C = texts.compare, L = window.L;
  const toLatLng = (px) => { const w = pxToWorld(geo, px[0], px[1]), [lo, la] = geo.worldToLonlat(w[0], w[1]); return [la, lo]; };
  const S = { cache: null, key: '', panel: null, draw: null, foot: null, footTried: false, fog: null, field: null, walkSeg: null, segEl: null, tok: 0 };

  // --- 1) karşılaştırma paneli + harita çizimi ---
  async function onRoute(r) {
    S.panel?.destroy(); S.panel = null; S.draw?.clear(); S.draw = null;
    const host = document.getElementById('route-info');
    if (!r || r.source !== 'api' || API_OFF || !r.startPx || !r.goalPx || !host) return;
    const key = `${r.startPx}|${r.goalPx}`, tok = ++S.tok;
    const loading = document.createElement('div'); loading.className = 'tiny'; loading.textContent = C.loading; host.append(loading);
    try {
      if (S.key !== key) { S.cache = await fetchCompare(API_BASE, r.startPx, r.goalPx); S.key = key; }
    } catch (e) { loading.textContent = C.error.replace('{why}', e.message); return; }
    loading.remove(); if (tok !== S.tok) return;
    S.panel = renderCompare(host, S.cache, C, { kind: r.kind });
    const c = S.cache.comparisons.find((x) => x.kind === r.kind) ?? S.cache.comparisons[1];
    S.draw = drawCompareOnMap(L, mapView.map, c, toLatLng, { t: C });
    // segment açıklamaları (model rotası): "Segment 3: kum (p=0.7) → zemin katsayısı ×1.4 → +38 kcal"
    const d = document.createElement('details'); d.style.marginTop = '6px';
    d.innerHTML = `<summary class="tiny" style="cursor:pointer">${T.seg_title ?? 'Segment açıklamaları'}</summary>` +
      c.model.segments.map((s) => `<div class="tiny" style="padding:2px 0">${segmentWhy(s, T)}</div>`).join('');
    S.panel.el.append(d);
  }

  // --- 2) model güveni (belirsizlik sisi) katmanı: harita düğmesi ---
  const panel = document.getElementById('panel');
  if (panel && !API_OFF) {
    const lab = document.createElement('label'); lab.title = T.fog_hint;
    lab.style.cssText = 'display:flex;gap:6px;align-items:center;margin-top:6px;font-size:12px';
    lab.innerHTML = `<input type="checkbox" id="fog-on"> ${T.fog_button}`; panel.append(lab);
    lab.querySelector('input').onchange = async (e) => {
      try {
        if (!S.field) S.field = await loadTerrainField(API_BASE, { w: GRID.w, h: GRID.h });
        if (!S.fog) {
          const a = toLatLng([0, 0]), b = toLatLng([GRID.w, GRID.h]);
          S.fog = L.imageOverlay(fogCanvas(S.field).toDataURL(), L.latLngBounds(a, b), { opacity: 1, interactive: false, zIndex: 400 });
        }
        if (e.target.checked) { S.fog.addTo(mapView.map); toast(T.fog_hint); } else mapView.map.removeLayer(S.fog);
      } catch (err) { e.target.checked = false; toast(`${T.fog_button}: ${err.message}`); }
    };
  }

  // --- 3) yürürken: ayak altı satırı + segment değişiminde açıklama ---
  function segLine() {
    if (S.segEl) return S.segEl;
    const el = document.createElement('div'); el.hidden = true;
    Object.assign(el.style, { position: 'fixed', left: '50%', bottom: '52px', transform: 'translateX(-50%)', maxWidth: '640px', padding: '6px 12px', borderRadius: '8px',
      background: 'rgba(14,10,8,.72)', color: '#f3e3d3', font: '12px/1.35 system-ui', pointerEvents: 'none', zIndex: 20, textAlign: 'center' });
    document.body.append(el); return (S.segEl = el);
  }
  let hideT = 0;
  async function frame(P, state) {
    if (state === 'map' || API_OFF) { if (S.foot) S.foot.setVisible(false); if (S.segEl) S.segEl.hidden = true; return; }
    if (!S.foot && !S.footTried) {
      S.footTried = true;
      try { S.foot = await createFootReader({ apiBase: API_BASE, texts: T, grid: { w: GRID.w, h: GRID.h } }); } catch (e) { toast(`${T.foot_label}: ${e.message}`); }
    }
    const px = worldToPx(geo, P.x, P.z);
    S.foot?.update(px);
    const R = getRouteRun?.(); if (!R) return;
    let i = R.cum.findIndex((c) => c >= R.s); if (i < 0) i = R.cum.length - 1;
    const seg = segmentAt(R.r, i); if (!seg || seg.id === S.walkSeg) return;
    S.walkSeg = seg.id;
    const model = !R.replanned && S.cache?.comparisons.find((x) => x.kind === R.r.kind)?.model.segments.find((s) => s.id === seg.id);
    const el = segLine(); el.textContent = model ? segmentWhy(model, T) : (seg.reason ?? ''); el.hidden = !el.textContent;
    clearTimeout(hideT); hideT = setTimeout(() => { el.hidden = true; }, 7000);
  }
  return { onRoute, frame, get cache() { return S.cache; }, setKind(k) { S.panel?.setKind(k); } };
}
