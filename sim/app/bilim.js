// Bilim desk'i bağlama modülü (tur4:bilim): CRISM saha notu + doz göstergesi + veri katmanları paneli.
// main.js'e yalnız `import './bilim.js'; // tur4:bilim` eklenir. Kendi başına window.__mm hazır olunca kurulur.
import * as THREE from 'three';
import { registerSlot } from './slots.js';
import { pxToWorld, worldToPx, API_BASE, API_OFF } from './api.js';
import { loadTexts } from './screens.js';
import { radParams, rateFromAssumptions, createDosePanel, createDoseLine, routeDoseTable, renderDoseCompare } from './radiation.js';
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
  const GRID3 = { width: 1000, height: 1000, res_m: 2, origin_xy_m: [8142276.492786024, -283815.075189438] };
  const note = createFieldNote(document.body, { texts });
  const dose = createDosePanel(document.body, { texts, params, rateUGyH: S.rate, rateSource: S.rateSrc });   // ayrıntı kartı (Y); varsayılan gizli
  const L = window.L; let mapOv = null, terr = null, beacons = null, wasVitals = null, line = null, tabPanel = null;
  const gY = (x, z) => { const y = mm.T?.terrain?.heightAt(x, z); if (y != null) return y; const v = mm.nav.heightAt(x, z); return Number.isNaN(v) ? null : v; };
  const pw = (c, r) => pxToWorld(mm.geo, c, r);
  const budget = () => mm.wire?.selected?.limits?.dose_uGy ?? science.radiation.budget_fallback_uGy;
  const stopCrismPx = stops.map((s) => crism.stops?.[s.id]?.crism_px).filter(Boolean);
  const last = { snap: null, plan: null };
  // Harita katmanları
  let legend = null;
  if (L && mm.mapView?.map) {
    mapOv = createCrismMapOverlay(L, crism);
    addScienceMarkers(L, mm.mapView.map, stops, (s) => { note.el.dataset.pos = 'map'; note.show(s); });
    legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => { const d = L.DomUtil.create('div', 'bl-card'); d.style.cssText = 'position:static;max-width:300px;margin:0 10px 24px'; d.innerHTML = `<span class="bl-badge">${texts.bilim.badge_crism}</span><div class="bl-tiny">CRISM ${crism.product.id} · HYD kompoziti: R=SINDEX2, G=BD2100_2, B=BD1900_2 (hidratlı sülfat) · ham browse, 18 m/piksel, göreli</div>`; return d; };
  }
  // CRISM: harita katmanı varsayılan açık. 3B örtü varsayılan KAPALI; durağa yaklaşınca çevresinde ('local'), panelden açılırsa her yerde ('all').
  S.crismMap = true; S.crismAll = false;
  const ensureTerr = () => {
    const T = mm.T; if (terr || !T?.scene) return terr;
    terr = createCrismTerrainOverlay(THREE, { crism, grid: GRID3, pxToWorld: pw, groundY: gY, stopCrismPx }); T.scene.add(terr.mesh); return terr;
  };
  const setCrism = (on, all = false) => {
    S.crismMap = on; S.crismAll = on && all; const map = mm.mapView?.map;
    if (mapOv && map) { on ? mapOv.addTo(map) : map.removeLayer(mapOv); }
    if (legend && map) { on ? legend.addTo(map) : legend.remove(); }
  };
  const toggles = {
    // Kutu işaretli = harita + 3B durak çevresi. Kapatınca hepsi kapanır; yeniden işaretleyince 3B örtü her yerde açılır.
    crism: { get: () => S.crismMap, set: (v) => setCrism(v, true) },
    rad: { get: () => S.radOn, set: (v) => { S.radOn = v; refresh(); } },
    overview: { get: () => !!mm.mapView?.map?.hasLayer(mm.mapView.overview), set: (v) => { const m = mm.mapView; v ? m.overview.addTo(m.map) : m.map.removeLayer(m.overview); } },
  };
  registerSlot('pause-panel', { id: 'veri-katmanlari', title: texts.bilim.layers.button, render: (c) => renderDataLayers(c, { science, texts, toggles }) });
  registerSlot('pause-panel', { id: 'rad', title: texts.bilim.rad.tab, render: (c) => {
    const p = createDosePanel(c, { texts, params, rateUGyH: S.rate, rateSource: S.rateSrc, inline: true, log: dose.log });
    p.update({ doseUGy: last.snap?.doseUGy ?? null, elapsedSec: last.snap?.elapsedSec ?? 0, budgetUGy: budget(), plan: last.plan }); tabPanel = p;
  } });

  // Karne: rotaların doz farkı
  registerSlot('report-insight', () => {
    const alts = mm.mapView?.alternatives ?? []; if (alts.length < 2) return null;
    return renderDoseCompare(routeDoseTable(alts, { rateUGyH: S.rate, budgetUGy: budget(), chosenKind: mm.mapView.route?.kind }), { texts });
  });

  const watcher = createStopWatcher({ stops, onEnter: (s, o) => { note.current = s; S.silentStop = o.silent ? s.id : null; if (!o.silent && S.screen === 'walk') { note.el.dataset.pos = 'walk'; note.show(s); } }, onLeave: () => { note.hide(); S.silentStop = null; } });
  const toggleDetail = () => { if (S.screen === 'walk' && S.radOn) dose.setVisible(dose.el.hidden); };
  const refresh = () => {
    const walking = S.screen === 'walk';
    if (!walking) { note.hide(); dose.setVisible(false); }
    if (line) line.el.hidden = !(S.radOn && walking);
  };
  addEventListener('mm:screen', (e) => {
    const sc = e.detail?.screen; S.screen = sc === 'resume' ? 'walk' : sc;
    if (sc === 'walk') { watcher.reset(); dose.reset(); S.walkT0 = performance.now(); }
    refresh();
  });
  addEventListener('keydown', (e) => {
    if (S.screen !== 'walk' || e.target?.closest?.('input,textarea,select')) return;
    if (e.code === 'KeyI') { const near = watcher.inside ?? stops[0]; note.el.dataset.pos = 'walk'; note.toggle(near); }
    else if (e.code === 'KeyY') toggleDetail();
  });
  // 3B sahnesi hazır olunca ışık sütunları, CRISM örtü modu, HUD satırı, doz
  setInterval(() => {
    const T = mm.T; if (!T?.scene) return;
    if (!beacons) { beacons = createStopBeacons(THREE, { stops, pxToWorld: pw, groundY: gY }); T.scene.add(beacons.group); }
    const v = mm.wire?.vitals, px = worldToPx(mm.geo, mm.P.x, mm.P.z);
    let nearM = Infinity;
    for (const m of beacons.group.children) { const st = stops.find((x) => x.id === m.userData.stopId), d = Math.hypot(px[0] - st.px[0], px[1] - st.px[1]) * 2; if (st.id !== S.silentStop) nearM = Math.min(nearM, d); m.material.opacity = d < 45 ? 0.1 : 0.4; }
    const want = S.screen === 'walk' && S.crismMap ? (S.crismAll ? 'all' : nearM < 200 && performance.now() - (S.walkT0 ?? 0) > 20000 ? 'local' : 'off') : 'off';
    if (want !== 'off' && !terr) ensureTerr();
    terr?.setMode(want);
    if (v !== wasVitals) { wasVitals = v; dose.reset(); watcher.reset(); }
    if (!line) { line = createDoseLine({ texts, params, onOpen: toggleDetail }); refresh(); }
    line.place(document.querySelector('.mm-hud'));
    if (S.screen !== 'walk' || !v) return;
    const snap = v.snapshot(), plan = mm.mapView?.route?.total, pl = plan ? { min: plan.min } : null;
    Object.assign(last, { snap, plan: pl });
    dose.update({ doseUGy: snap.doseUGy, elapsedSec: snap.elapsedSec, budgetUGy: budget(), plan: pl });
    line?.update(snap.doseUGy, budget());
    watcher.update(px);
  }, 250);
  setCrism(true, false);    // harita açık; 3B yalnız durak çevresi
  window.__bilim = { S, note, dose, setCrism, toggles, watcher, get terr() { return terr; } };
}

(async () => {
  let n = 0; while (!window.__mm?.wire && n++ < 600) await new Promise((r) => setTimeout(r, 100));
  const mm = window.__mm; if (!mm?.wire) return;
  try { await setup(mm); mount(mm); } catch (e) { console.warn('[bilim]', e); }
})();
