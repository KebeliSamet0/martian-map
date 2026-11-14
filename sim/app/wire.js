import { createStepAdapter } from './wire-step.js';
import { API_BASE, API_OFF } from './api.js';
import { createGridGeo } from './gridgeo.js';
import { createVitals } from './vitals.js';
import { createMission, loadMissions } from './mission.js';
import { initHud } from './hud.js';
import { loadTexts, showBriefing, showRoutePicker, showAlert, showReport } from './screens.js';
import { hudSnapshot, missionDefinition, walkPlan, uiTexts } from './wire-adapters.js';

export async function initWire({ map, geo, manifest, enter3D, enterMap, pause, replan, toast }) {
  const root = document.getElementById('mission-ui'), buttons = document.getElementById('missions');
  const call = async (path, body) => {
    if (API_OFF) throw new Error('API kapalı');
    const r = await fetch(API_BASE + path, { method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(8000),
      headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error(`API ${r.status}`); return r.json();
  };
  const [schema, assumptions, contract, texts] = await Promise.all([
    call('/openapi.json').catch(() => null), call('/assumptions').catch(() => []),
    fetch('../contracts/grid.json').then(r => r.json()), loadTexts(),
  ]);
  Object.assign(texts, uiTexts(texts));
  const grid = await call('/grid').catch(() => contract);
  const coords = createGridGeo({ grid: { ...contract, ...grid }, geo });
  const available = path => !!schema?.paths?.[path];
  const api = { missions: () => available('/missions') ? call('/missions') : Promise.reject(new Error('Görev API yok')),
    debrief: data => available('/debrief') ? call('/debrief', data) : Promise.reject(new Error('Özet API yok')) };
  const catalog = await loadMissions({ api });
  let observations = [];
  let selected = null, vitals = null, machine = null, hud = null, planned = null, limits = {}, running = false, generation = 0, busy = false;
  const sourceLabel = document.getElementById('vitals-source');
  Object.assign(map, { call, coords, onBusy(value) { document.getElementById('btn-walk').disabled = value || !map.route; } });
  function freeMode() { selected = null; map.mission = null; document.getElementById('mission-name').textContent = 'Serbest mod · Haritada A/B seç'; }
  map.onManual = freeMode;
  function clearRun() { generation++; running = false; hud?.destroy(); hud = null; machine = null; vitals = null; root.replaceChildren(); sourceLabel.hidden = true; }
  async function selectMission(m) {
    if (busy) return; busy = true;
    try {
      clearRun(); selected = m; map.mission = m; map.setMission(m, coords);
      document.getElementById('mission-name').textContent = `${m.id} · ${texts.missions?.[m.id]?.title ?? m.title}`;
      await showBriefing(root, { name: texts.missions?.[m.id]?.title ?? m.title,
        target: [texts.missions?.[m.id]?.brief, texts.missions?.[m.id]?.objective].filter(Boolean).join(' ') || m.title, limits: m.limits });
      await map.compute();
      await pickRoute();
    } catch (e) { toast(e.message); } finally { busy = false; }
  }
  async function pickRoute() {
    if (!map.alternatives?.length) return;
    const options = map.alternatives.map(r => ({ ...r, label: r.raw?.label ?? r.label, total: { ...(r.raw?.total ?? r.total), status: r.source === 'api' ? r.total.status : 'DİKKAT' } }));
    const choice = await showRoutePicker(root, options);
    map.select(map.alternatives[options.indexOf(choice)]);
  }
  for (const m of catalog.missions.filter(m => m.start_px && m.goal_px)) {
    const b = document.createElement('button'); b.textContent = `${m.id} · ${texts.missions?.[m.id]?.title ?? m.title}`;
    b.dataset.mission = m.id; b.onclick = () => void selectMission(m); buttons.append(b);
  }
  document.getElementById('btn-routes').onclick = () => { if (!busy) void pickRoute(); };
  function alertLimit(what) {
    const id = generation;
    void showAlert(root, 'limit', { what, timeoutMs: 8000 }).then(action => {
      if (id !== generation || !running || action !== 'return') return;
      const base = map.route?.start?.world;
      const pos = lastPosition;
      enterMap();
      if (!base || !pos) return;
      map.reset();
      for (const [name, p] of [['A', pos], ['B', base]]) { const [lng, lat] = geo.worldToLonlat(...p); map._set(name, { lng, lat }); }
      void map.compute(); toast('Üsse dönüş rotası hazırlanıyor; rotayı seçip yürüyüşü başlat.');
    });
  }
  let lastPosition;
  function start(route, position) {
    clearRun(); observations = []; running = true; const id = generation;
    planned = structuredClone(route?.raw?.total ?? route?.total ?? {}); limits = planned.budget?.limits ?? selected?.limits ?? {};
    vitals = createVitals({ assumptions, route, arrivalRadiusM: 10, api: available('/step') && route?.source === 'api' ? createStepAdapter({ call, coords, assumptions, observations: () => observations }) : undefined });
    if (route) {
      machine = createMission({ definition: missionDefinition(selected ?? { id: 'free', sample_kg: 0 }, route), vitals, coords, api, source: selected ? catalog.source : 'free' });
      machine.plan(); machine.start(route);
      machine.on('event', async event => {
        pause(true);
        observations.push({ px: selected.sand.px, radius_m: event.radius_m, cls: 'sand' });
        void showAlert(root, 'sand', { timeoutMs: 5000 });
        try { await replan({ ...event, px: selected.sand.px }); }
        finally { if (id === generation && running) { machine.resume(); pause(false); } }
      });
      machine.on('arrived', () => { void finish(id); });
    }
    vitals.on('warning', s => { if (id === generation && running) alertLimit(s.returnPossible === false ? texts.alerts?.turn_back : 'Kaynak verisi eksik veya limit yaklaşıyor.'); });
    vitals.on('limit', e => { if (id === generation && running) alertLimit(`Sınır aşıldı: ${e.resource}`); });
    hud = initHud(root, { snapshot: () => hudSnapshot(vitals.snapshot(), limits) });
    sourceLabel.hidden = false;
    vitals.update(0, position, coords.worldToPx([position.x, position.z]));
    machine?.update(position); lastPosition = [position.x, position.z];
  }
  async function finish(id) {
    if (!running) return;
    running = false; pause(true); document.exitPointerLock?.();
    root.querySelectorAll('.mm-alert').forEach(e => e.remove());
    machine.collectSample(); await machine.finish();
    if (id !== generation) return;
    sourceLabel.textContent = `Kaynak: ${vitals.snapshot().source} · Görev tamamlandı`;
    const actual = hudSnapshot(vitals.snapshot(), limits);
    const report = showReport(root, { planned: walkPlan(planned), actual });
    // Eksik tüketim varsa ekranın varsayılan A derecesi gösterilmez.
    if ([actual.kcal, actual.o2_L, actual.dose_uGy].some(v => v == null)) {
      root.querySelector('.mm-grade-letter').textContent = '—';
      root.querySelector('.mm-grade .mm-text').textContent = 'Kaynak verisi eksik · derece hesaplanamadı';
    }
    const action = await report;
    if (id !== generation) return;
    if (action === 'retry') enter3D('auto'); else enterMap();
  }
  return { coords, grid, call, available, texts, selectMission, pickRoute,
    get vitals() { return vitals; }, get machine() { return machine; }, get selected() { return selected; },
    start, stop: clearRun,
    setRoute(route) { vitals?.setRoute(route); },
    setVisible(on) { hud?.setVisible(on); sourceLabel.hidden = !on; },
    update(dt, position) {
      if (!running || !vitals) return;
      vitals.update(dt, position, coords.worldToPx([position.x, position.z]));
      sourceLabel.textContent = `Kaynak: ${vitals.snapshot().source} · Efor: ${vitals.snapshot().metabolicW?.toFixed(0) ?? '—'} W`;
      lastPosition = [position.x, position.z]; machine?.update(position);
    },
  };
}
