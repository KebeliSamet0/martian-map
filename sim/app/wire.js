import { createStepAdapter } from './wire-step.js';
import { API_BASE, API_OFF } from './api.js';
import { createGridGeo } from './gridgeo.js';
import { createVitals } from './vitals.js';
import { createMission, loadMissions } from './mission.js';
import { initHud } from './hud.js';
import { showBriefing, showRoutePicker, showAlert, showReport, showHold, showDecision } from './screens.js';
import { loadTexts, t, has, missionText } from './i18n.js';
import { hudSnapshot, missionDefinition, walkPlan, uiTexts } from './wire-adapters.js';
import { sandForRoute } from './custommission.js';   // batu:custom

export async function initWire({ map, geo, manifest, enter3D, enterMap, pause, replan, toast, flow = {}, returnToBase, audio }) {
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
  const sandZones = await fetch(new URL('../data/sand_zones.json', import.meta.url)).then(r => (r.ok ? r.json() : [])).catch(() => []);   // batu:custom: özel görevde kum olayı yalnız gerçek aday yakınında
  let observations = [];
  let selected = null, vitals = null, machine = null, hud = null, planned = null, limits = {}, running = false, generation = 0, busy = false, hold = null;
  let decisions = [], pendingDecision = null, dynHandlesSand = false;   // #125 A.2
  const sourceLabel = document.getElementById('vitals-source');
  Object.assign(map, { call, coords, onBusy(value) { document.getElementById('btn-walk').disabled = value || !map.route; } });
  function freeMode() { selected = null; map.mission = null; document.getElementById('mission-name').textContent = 'Serbest mod · Haritada A/B seç'; }
  map.onManual = freeMode;
  function clearRun() { generation++; running = false; clearFeedback(); hold?.cancel?.(); hold = null; pendingDecision?.close?.(); pendingDecision = null; decisions = []; hud?.destroy(); hud = null; machine = null; vitals = null; root.replaceChildren(); sourceLabel.hidden = true; }

  // #125 A.3: eşikler aşılınca görsel/işitsel geri bildirim. Eşikler bütçeden, değerler vitals'tan.
  let lowO2 = false, lowReturn = false;
  function feedback(s) {
    const lim = limits.o2_L;
    const left = lim > 0 && Number.isFinite(s?.o2UsedL) ? 1 - s.o2UsedL / lim : null;
    const low = left != null && left < 0.30;
    if (low !== lowO2) {
      lowO2 = low;
      document.body.classList.toggle('mm-low-o2', low);
      if (low) audio?.alert?.('limit');
    }
    const margin = s?.returnMargin?.time_min, reserve = Number.isFinite(limits.reserve_min) ? limits.reserve_min : 30;
    const tight = Number.isFinite(margin) && margin < reserve * 1.5;
    if (tight !== lowReturn) { lowReturn = tight; hud?.el?.classList.toggle('mm-hud-alarm', tight); }
  }
  function clearFeedback() { lowO2 = false; lowReturn = false; document.body.classList.remove('mm-low-o2'); }

  // #125 A.2: Batu'nun önerisi (#122 sözleşmesi) oyuncuya karar olarak sorulur, sonuç geri yollanır.
  async function askDecision(detail = {}) {
    const id = generation;
    pause(true);
    pendingDecision = showDecision(root, { reason: detail.reason ?? 'observation', delta: detail.delta, urgent: !!detail.urgent });
    const accept = await pendingDecision;
    pendingDecision = null;
    if (id !== generation) return false;
    decisions.push({ reason: detail.reason ?? 'observation', accept, urgent: !!detail.urgent });
    window.dispatchEvent(new CustomEvent('mm:route-decision', { detail: { accept, reason: detail.reason ?? 'observation' } }));
    if (running) pause(false);
    return accept;
  }
  addEventListener('mm:route-suggest', (e) => {
    const d = e.detail ?? {};
    if (d.reason === 'sand') dynHandlesSand = true;   // kum artık dynroute'ta: yerleşik akış devre dışı
    if (!running || pendingDecision) return;
    void askDecision(d);
  });
  const missionTitle = m => missionText(m.id, 'title') || m.title;
  function briefingInfo(m) {
    const L = m.limits ?? {}, risks = [];
    if (m.sand) risks.push(t('risk.sand', { r: Math.round(m.sand.radius_m) }));
    if (L.o2_L != null && L.o2_L < 200) risks.push(t('risk.o2', { o2: L.o2_L }));
    risks.push(t('risk.slope'));
    if (L.dose_uGy != null) risks.push(t('risk.dose', { d: L.dose_uGy }));
    if (m.sample_kg) risks.push(t('risk.sample', { kg: m.sample_kg }));
    return { id: m.id, name: missionTitle(m), target: missionText(m.id, 'brief') || m.title, objective: missionText(m.id, 'objective'),
      science: missionText(m.id, 'science'), limits: m.limits, risks };
  }
  async function selectMission(m) {
    if (busy) return; busy = true;
    try {
      clearRun(); selected = m; map.mission = m; map.setMission(m, coords);
      document.getElementById('mission-name').textContent = `${m.id} · ${missionTitle(m)}`;
      flow.onScreen?.('briefing', m);
      const go = await showBriefing(root, briefingInfo(m));
      if (!go) { flow.onScreen?.('select'); flow.onBack?.(); return; }
      flow.onScreen?.('computing', m);
      await map.compute();
      if (!await pickRoute()) { flow.onScreen?.('select'); flow.onBack?.(); }
    } catch (e) {
      // #103 A.1: sessizce seçim ekranına dönmek yerine görünür mesaj + tekrar dene
      toast(e.message);
      if (flow.onError) flow.onError({ message: e.userMessage ?? t('error.route'), detail: e.message, retry: () => selectMission(m) });
      else flow.onBack?.();
    } finally { busy = false; }
  }
  // Rota seçildi → true (oyun akışında yürüyüş kendiliğinden başlar); geri → false
  async function pickRoute({ autoWalk = flow.autoWalk } = {}) {
    if (!map.alternatives?.length) { const err = new Error('no alternatives'); err.userMessage = t('error.noroute'); throw err; }
    // Rota adı API'den Türkçe geliyordu; ?lang=en'de kart başlıkları Türkçe kalıyordu (#103 A.5).
    const name = r => (r.source !== 'api' ? t('route.fallback')
      : has(`route.kind.${r.kind}`) ? t(`route.kind.${r.kind}`) : r.raw?.label ?? r.label);
    const options = map.alternatives.map(r => ({ ...r, label: name(r), total: { ...(r.raw?.total ?? r.total), status: r.source === 'api' ? r.total.status : t('route.caution') } }));
    flow.onScreen?.('route', selected);
    const choice = await showRoutePicker(root, options, { call, geo, mission: selected });
    if (!choice) return false;
    map.select(map.alternatives[options.indexOf(choice)]);
    if (autoWalk) enter3D('auto');
    return true;
  }
  for (const m of catalog.missions.filter(m => m.start_px && m.goal_px)) {
    const b = document.createElement('button'); b.textContent = `${m.id} · ${missionTitle(m)}`;
    b.dataset.mission = m.id; b.onclick = () => void selectMission(m); buttons.append(b);
  }
  document.getElementById('btn-routes').onclick = () => { if (!busy) pickRoute().catch(e => toast(e.message)); };
  // Uyarı bandında ham kaynak anahtarı ("o2_L") değil cümle görünsün (tr/en).
  const limitText = r => t({ o2_L: 'alerts.limit_o2', time_min: 'alerts.limit_time', kcal: 'alerts.limit_kcal', dose_uGy: 'alerts.limit_dose' }[r] ?? 'alerts.limit_o2');
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
      void map.compute().then(() => { if (flow.autoWalk) return pickRoute(); toast(t('flow.return.prep')); });
    });
  }
  let lastPosition;
  function start(route, position) {
    clearRun(); observations = []; running = true; const id = generation;
    planned = structuredClone(route?.raw?.total ?? route?.total ?? {}); limits = planned.budget?.limits ?? selected?.limits ?? {};
    vitals = createVitals({ assumptions, route, arrivalRadiusM: 10, api: available('/step') && route?.source === 'api' ? createStepAdapter({ call, coords, assumptions, observations: () => observations }) : undefined });
    if (route) {
      if (selected?.custom) selected.sand = sandForRoute(route.dense, sandZones, p => coords.pxToWorld(p));   // batu:custom: rota gerçek kum adayına yaklaşmıyorsa olay yok
      machine = createMission({ definition: missionDefinition(selected ?? { id: 'free', sample_kg: 0 }, route), vitals, coords, api, source: selected ? catalog.source : 'free' });
      machine.plan(); machine.start(route);
      machine.on('event', async event => {
        pause(true);
        observations.push({ px: selected.sand.px, radius_m: event.radius_m, cls: 'sand' });
        try {
          // #125 A.2: kum da bir karar anı. dynroute kumu devraldıysa (mm:route-suggest reason='sand') burası susar.
          if (dynHandlesSand) return;
          if (await askDecision({ reason: 'sand', urgent: true })) await replan({ ...event, px: selected.sand.px });
        } finally { if (id === generation && running) { machine.resume(); pause(false); } }
      });
      machine.on('arrived', () => { void onArrived(id); });
    }
    vitals.on('warning', s => { if (id === generation && running) alertLimit(s.returnPossible === false ? t('alerts.turn_back') : t('alerts.data_missing')); });
    vitals.on('limit', e => { if (id === generation && running) alertLimit(limitText(e.resource)); });
    hud = initHud(root, { snapshot: () => hudSnapshot(vitals.snapshot(), limits) }, { position: 'br' });
    sourceLabel.hidden = false;
    vitals.update(0, position, coords.worldToPx([position.x, position.z]));
    machine?.update(position); lastPosition = [position.x, position.z];
  }
  // #125 A.1: hedefte E ile numune al, sonra üsse dönüş ayağını aç. Dönüşte varınca karne.
  async function onArrived(id) {
    if (id !== generation || !running) return;
    const snap = machine.snapshot();
    const kg = selected?.sample_kg ?? 0;
    if (snap.leg !== 'outbound' || !(kg > 0) || !returnToBase) return void finish(id);
    hold = showHold(root, { title: t('sample.hold.title'), hint: t('sample.hold.hint'), seconds: 6 });
    const ok = await hold; hold = null;
    if (!ok || id !== generation || !running) return;
    machine.collectSample();
    audio?.alert?.('arrive');
    toast(t('sample.done', { kg }), true);
    const back = await returnToBase();
    if (id !== generation || !running) return;
    if (!back) return void finish(id);   // dönüş rotası alınamadı: görevi burada bitir
    machine.beginReturn({ world: back.home, radius_m: 10 });
    flow.setObjective?.(t('objective.return'));
  }
  async function finish(id) {
    if (!running) return;   // tek giriş: varış olayı çift gelse de karne bir kez açılır
    running = false; pause(true); document.exitPointerLock?.();
    root.querySelectorAll('.mm-alert').forEach(e => e.remove());
    machine.collectSample(); await machine.finish();
    window.dispatchEvent(new CustomEvent('mission:arrived', { detail: machine.snapshot() }));
    if (id !== generation) return;
    sourceLabel.textContent = `Kaynak: ${vitals.snapshot().source} · Görev tamamlandı`;
    const actual = hudSnapshot(vitals.snapshot(), limits);
    flow.onScreen?.('report', selected);
    const action = await showReport(root, { planned: walkPlan(planned), actual, route: map.route, mission: selected, decisions: [...decisions] });
    if (id !== generation) return;
    if (action === 'retry') enter3D('auto');
    else { enterMap(); if (flow.onReport) flow.onReport(action); }
  }
  return { coords, grid, call, available, texts, selectMission, pickRoute, catalog, missionTitle,
    get vitals() { return vitals; }, get machine() { return machine; }, get selected() { return selected; },
    start, stop: clearRun,
    setRoute(route) { vitals?.setRoute(route); },
    setVisible(on) { hud?.setVisible(on); sourceLabel.hidden = !on; },
    update(dt, position) {
      if (!running || !vitals) return;
      vitals.update(dt, position, coords.worldToPx([position.x, position.z]));
      feedback(vitals.snapshot());
      sourceLabel.textContent = `Kaynak: ${vitals.snapshot().source} · Efor: ${vitals.snapshot().metabolicW?.toFixed(0) ?? '—'} W`;
      lastPosition = [position.x, position.z]; machine?.update(position);
    },
  };
}
