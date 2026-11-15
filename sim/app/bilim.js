// Bilim desk'i bağlama modülü (tur4:bilim): CRISM saha notu + doz göstergesi + veri katmanları paneli.
// main.js'e yalnız `import './bilim.js'; // tur4:bilim` eklenir. Kendi başına window.__mm hazır olunca kurulur.
import * as THREE from 'three';
import { registerSlot } from './slots.js';
import { pxToWorld, worldToPx, API_BASE, API_OFF } from './api.js';
import { loadTexts } from './screens.js';
import { radParams, rateFromAssumptions, createDosePanel, routeDoseTable, renderDoseCompare } from './radiation.js';
import { loadScienceData, mergeStops, createStopWatcher, createFieldNote, createCrismMapOverlay, addScienceMarkers, createCrismTerrainOverlay, createStopBeacons } from './science.js';
import { renderDataLayers } from './datalayers.js';

const $ = (id) => document.getElementById(id);
const S = { ready: null, texts: null, science: null, crism: null, stops: [], params: null, rate: null, rateSrc: '', crismOn: false, radOn: true, screen: 'intro' };

async function setup(mm) {
  const texts = await loadTexts();
  const { science, crism } = await loadScienceData();
  const call = (p) => fetch(API_BASE + p, { signal: AbortSignal.timeout(6000) }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))));
  const [assum, grid] = await Promise.all([API_OFF ? [] : call('/assumptions').catch(() => []), API_OFF ? null : call('/grid').catch(() => null)]);
  const gridStops = grid?.science_stops?.length ? grid.science_stops : await fetch(new URL('../../layers/science_stops.json', import.meta.url)).then((r) => r.json()).catch(() => []);
  const params = radParams(science.radiation), apiRate = rateFromAssumptions(assum);
  Object.assign(S, { texts, science, crism, params, stops: mergeStops({ gridStops, science, crism, texts }).filter((s) => s.hasNote),
    rate: apiRate ?? params.rateUGyH, rateSrc: apiRate != null ? `API /assumptions · ${science.radiation.source}` : `science.json · ${science.radiation.source}` });
  return S;
}

function mount(mm) {
  const { texts, science, crism, stops, params } = S;
  const note = createFieldNote(document.body, { texts }), dose = createDosePanel(document.body, { texts, params, rateUGyH: S.rate, rateSource: S.rateSrc });
  const L = window.L; let mapOv = null, terr = null, beacons = null, wasVitals = null;
  const gY = (x, z) => { const y = mm.T?.terrain?.heightAt(x, z); if (y != null) return y; const v = mm.nav.heightAt(x, z); return Number.isNaN(v) ? null : v; };
  const pw = (c, r) => pxToWorld(mm.geo, c, r);
  // Harita katmanları
  if (L && mm.mapView?.map) {
    mapOv = createCrismMapOverlay(L, crism);
    addScienceMarkers(L, mm.mapView.map, stops, (s) => { note.el.dataset.pos = 'map'; note.show(s); });
  }
  let legend = null;
  if (L && mm.mapView?.map) {
    legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => { const d = L.DomUtil.create('div', 'bl-card'); d.style.cssText = 'position:static;max-width:300px;margin:0 10px 24px'; d.innerHTML = `<span class="bl-badge">${texts.bilim.badge_crism}</span><div class="bl-tiny">CRISM ${crism.product.id} · HYD kompoziti: R=SINDEX2, G=BD2100_2, B=BD1900_2 (hidratlı sülfat) · ham browse, 18 m/piksel, göreli</div>`; return d; };
  }
  const setCrism = (on) => {
    S.crismOn = on; const map = mm.mapView?.map;
    if (legend && map) { on ? legend.addTo(map) : legend.remove(); }
    if (mapOv && map) { on ? mapOv.addTo(map) : map.removeLayer(mapOv); }
    const T = mm.T;
    if (on && T?.scene && !terr) { terr = createCrismTerrainOverlay(THREE, { crism, grid: { ...(S.grid ?? {}), width: 1000, height: 1000, res_m: 2, origin_xy_m: [8142276.492786024, -283815.075189438] }, pxToWorld: pw, groundY: gY }); T.scene.add(terr.mesh); }
    terr?.setVisible(on);
  };
  const toggles = {
    crism: { get: () => S.crismOn, set: setCrism },
    rad: { get: () => S.radOn, set: (v) => { S.radOn = v; refresh(); } },
    overview: { get: () => !!mm.mapView?.map?.hasLayer(mm.mapView.overview), set: (v) => { const m = mm.mapView; v ? m.overview.addTo(m.map) : m.map.removeLayer(m.overview); } },
  };
  registerSlot('pause-panel', { id: 'veri-katmanlari', title: texts.bilim.layers.button, render: (c) => renderDataLayers(c, { science, texts, toggles }) });

  // Karne: rotaların doz farkı
  registerSlot('report-insight', () => {
    const alts = mm.mapView?.alternatives ?? []; if (alts.length < 2) return null;
    return renderDoseCompare(routeDoseTable(alts, { rateUGyH: S.rate, budgetUGy: budget(), chosenKind: mm.mapView.route?.kind }), { texts });
  });

  const budget = () => mm.wire?.selected?.limits?.dose_uGy ?? science.radiation.budget_fallback_uGy;
  const watcher = createStopWatcher({ stops, onEnter: (s, o) => { note.current = s; if (!o.silent && S.screen === 'walk') { note.el.dataset.pos = 'walk'; note.show(s); } }, onLeave: () => note.hide() });
  const refresh = () => { const walking = S.screen === 'walk'; if (!walking) note.hide(); dose.setVisible(walking && S.radOn && !!mm.wire?.vitals); };
  addEventListener('mm:screen', (e) => {
    const sc = e.detail?.screen; S.screen = sc === 'resume' ? 'walk' : sc;
    if (sc === 'walk') { watcher.reset(); dose.reset(); }
    refresh();
  });
  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyI' || S.screen !== 'walk' || e.target?.closest?.('input,textarea,select')) return;
    const near = watcher.inside ?? stops[0]; note.el.dataset.pos = 'walk'; note.toggle(near);
  });
  // 3B sahnesi hazır olunca ışık sütunları + (açıksa) CRISM örtüsü
  setInterval(() => {
    const T = mm.T; if (!T?.scene) return;
    if (!beacons) { beacons = createStopBeacons(THREE, { stops, pxToWorld: pw, groundY: gY }); T.scene.add(beacons.group); }
    if (S.crismOn && !terr) setCrism(true);
    for (const m of beacons.group.children) { const st = stops.find((x) => x.id === m.userData.stopId), px = worldToPx(mm.geo, mm.P.x, mm.P.z); m.material.opacity = Math.hypot(px[0] - st.px[0], px[1] - st.px[1]) * 2 < 45 ? 0.1 : 0.4; }
    const v = mm.wire?.vitals;
    if (v !== wasVitals) { wasVitals = v; dose.reset(); watcher.reset(); }
    if (S.screen !== 'walk' || !v) return;
    const snap = v.snapshot(), plan = mm.mapView?.route?.total;
    dose.update({ doseUGy: snap.doseUGy, elapsedSec: snap.elapsedSec, budgetUGy: budget(), plan: plan ? { min: plan.min } : null });
    watcher.update(worldToPx(mm.geo, mm.P.x, mm.P.z));
    refresh();
  }, 250);
  setCrism(true);    // haritada varsayılan açık; 3B'de de açılır, panelden kapatılır
  window.__bilim = { S, note, dose, setCrism, toggles, watcher };
}

(async () => {
  let n = 0; while (!window.__mm?.wire && n++ < 600) await new Promise((r) => setTimeout(r, 100));
  const mm = window.__mm; if (!mm?.wire) return;
  try { await setup(mm); mount(mm); } catch (e) { console.warn('[bilim]', e); }
})();
