// DOM ve Three.js bağımsız; bilinmeyen kaynaklar null, sıfır tüketim değildir.
const valid = n => Number.isFinite(n) && n >= 0;
const mul = (a, b) => valid(a) && valid(b) ? a * b : null;
const add = (a, b) => a == null || b == null ? null : a + b;
export function createVitals({ api, assumptions = [], route, loadKg, stepIntervalSec = 3, arrivalRadiusM = 2 } = {}) {
  const param = (key, name) => {
    const v = Array.isArray(assumptions) ? assumptions.find(a => a.name === name || a.name === key)?.value : assumptions[key];
    return valid(v) ? v : null;
  };
  const body = param('BODY_KG', 'Astronot kütlesi'), suit = param('SUIT_KG', 'Skafandr + yaşam destek');
  const tools = param('TOOLS_KG', 'Ekipman') ?? 0;
  let load = loadKg ?? tools;
  if (!valid(load) || !valid(stepIntervalSec) || stepIntervalSec === 0) throw new TypeError('Geçersiz yük/aralık');
  let rt, limits, previous, elapsed = 0, distance = 0, metabolic = null, firstLimit = null;
  const unknown = { kcal: 0, o2_L: 0, dose_uGy: 0 };
  let used = { kcal: 0, o2_L: 0, dose_uGy: 0 }, returnUsed = { time_min: 0, kcal: 0, o2_L: 0, dose_uGy: 0 };
  let source = 'fallback', status = 'DİKKAT', arrived = false, pending = [], batchSec = 0, flight = null, stepEnabled = !!api?.step;
  const listeners = new Map();
  const emit = (name, value) => { for (const cb of listeners.get(name) ?? []) cb(structuredClone(value)); };
  const on = (name, cb) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(cb); return () => listeners.get(name).delete(cb); };
  const consumption = () => Object.fromEntries(Object.keys(used).map(k => [k, unknown[k] ? null : used[k]]));
  const total = () => rt?.total ?? {};
  const oxygenRatio = () => param('KCAL_PER_L_O2', 'O₂ kalorik eşdeğeri') ?? (total().eva_kcal > 0 && valid(total().o2_L) ? total().o2_L / total().eva_kcal : null);
  // Parametre kcal/L, rota oranı L/kcal.
  const o2PerKcal = () => {
    const p = param('KCAL_PER_L_O2', 'O₂ kalorik eşdeğeri');
    return p > 0 ? 1 / p : oxygenRatio();
  };
  const doseRate = () => param('DOSE_UGY_PER_H', 'Yüzey doz hızı') ?? (total().eva_min > 0 ? mul(total().dose_uGy, 60 / total().eva_min) : null);
  const stopW = () => param('STOP_METABOLIC_W', 'Durak metabolik düzeyi') ?? param('FLAT_REFERENCE_W', 'Düz zemin metabolik düzeyi');
  const loadFactor = () => body != null && suit != null && body + suit + tools > 0 ? (body + suit + load) / (body + suit + tools) : load === tools ? 1 : null;
  function snapshot() {
    const actual = consumption();
    const consumed = { time_min: elapsed / 60, ...actual };
    const reserve = limits.reserve_min;
    const reserveKcal = mul(reserve, mul(stopW(), 60 / 4184));
    const extra = { time_min: reserve, kcal: reserveKcal, o2_L: mul(reserveKcal, o2PerKcal()), dose_uGy: mul(reserve, mul(doseRate(), 1 / 60)) };
    const margin = Object.fromEntries(Object.keys(consumed).map(k => [k,
      valid(limits[k]) && consumed[k] != null && returnUsed[k] != null && extra[k] != null ? limits[k] - consumed[k] - returnUsed[k] - extra[k] : null]));
    const known = Object.values(margin).every(v => v != null);
    const returnPossible = Object.values(margin).some(v => v != null && v < 0) ? false : known ? true : null;
    return { elapsedSec: elapsed, distanceM: distance, kcal: actual.kcal, o2UsedL: actual.o2_L,
      o2RemainingL: valid(limits.o2_L) && actual.o2_L != null ? limits.o2_L - actual.o2_L : null,
      doseUGy: actual.dose_uGy, metabolicW: metabolic, loadKg: load, source, status, firstLimit: firstLimit ? structuredClone(firstLimit) : null,
      returnPossible, returnMargin: margin, loadModel: 'mass-ratio-estimate', arrived };
  }
  function check(px) {
    const values = { time_min: elapsed / 60, ...consumption() };
    const exceeded = Object.keys(values).filter(k => valid(limits[k]) && values[k] != null && values[k] > limits[k]);
    if (!firstLimit && exceeded.length) {
      firstLimit = { resource: exceeded[0], elapsedSec: elapsed, distanceM: distance, gridPx: px ? [...px] : null };
      emit('limit', firstLimit);
    }
    const snap = snapshot();
    const next = exceeded.length || snap.returnPossible === false ? 'NO-GO' : snap.returnPossible == null ? 'DİKKAT' : 'GO';
    if (next !== status) { status = next; if (next !== 'GO') { emit('warning', snapshot()); emit('replan-suggested', snapshot()); } }
  }
  function setRoute(r) {
    rt = r?.raw ?? r;
    limits = { time_min: mul(param('EVA_MAX_H', 'Maksimum EVA süresi'), 60), reserve_min: param('RESERVE_MIN', 'Yedek süre'), ...rt?.total?.budget?.limits };
    arrived = false; check(); // Yaşanmış tüketim ve başlangıç izi korunur.
  }
  function segmentAt(p, px) {
    let best, score = Infinity;
    for (const s of rt?.segments ?? []) {
      const points = px ? s.path_px : route?.dense?.slice(s.idx?.[0], (s.idx?.[1] ?? -1) + 1);
      for (const q of points ?? []) {
        const d = Math.hypot(q[0] - (px ?? p)[0], q[1] - (px ?? p)[1]);
        if (d < score) { best = s; score = d; }
      }
    }
    return best ?? rt?.segments?.[0];
  }
  async function flush() {
    if (flight) { await flight; return flush(); }
    if (!stepEnabled || !pending.length) return snapshot();
    const batch = pending; pending = []; batchSec = 0;
    flight = (async () => {
      try {
        // Adaptör sözleşmesi: bu parçaya ait artışlar; toplam sayaç değildir.
        const reply = await api.step({ trace: batch.map(b => b.trace) });
        const delta = reply?.delta;
        if (!delta || !['kcal', 'o2_L', 'dose_uGy'].every(k => valid(delta[k]))) throw new Error('Geçersiz /step artışı');
        for (const k of ['kcal', 'o2_L', 'dose_uGy']) {
          used[k] += delta[k] - batch.reduce((s, b) => s + (b.estimate[k] ?? 0), 0);
          unknown[k] -= batch.filter(b => b.estimate[k] == null).length;
        }
        source = 'api-step'; check();
      } catch { stepEnabled = false; pending = []; source = rt?.segments?.some(s => valid(s.kcal)) ? 'segments' : 'fallback'; }
      finally { flight = null; }
    })();
    await flight; return snapshot();
  }
  function update(dtSec, worldPos, gridPx) {
    const p = Array.isArray(worldPos) ? [...worldPos] : [worldPos.x, worldPos.z];
    if (!valid(dtSec) || !p.every(Number.isFinite) || (gridPx && !gridPx.every(Number.isFinite))) throw new TypeError('Geçersiz iz');
    const dm = previous ? Math.hypot(p[0] - previous[0], p[1] - previous[1]) : 0;
    const s = segmentAt(p, gridPx), f = loadFactor();
    const kcal = dm > 0 && s?.len_m > 0 && valid(s.kcal) ? mul(s.kcal * dm / s.len_m, f) : mul(dtSec / 4184, mul(stopW(), f));
    const o2 = dm > 0 && s?.len_m > 0 && valid(s.o2_L) ? mul(s.o2_L * dm / s.len_m, f) : mul(kcal, o2PerKcal());
    const dose = mul(dtSec / 3600, doseRate());
    const estimate = { kcal, o2_L: o2, dose_uGy: dose };
    for (const k of Object.keys(used)) {
      if (dtSec === 0 && dm === 0) continue;
      if (estimate[k] == null) unknown[k]++; else used[k] += estimate[k];
    }
    if (dm > 0) {
      returnUsed.time_min = add(returnUsed.time_min, s?.len_m > 0 ? mul(s.min, dm / s.len_m) : null);
      for (const k of Object.keys(used)) returnUsed[k] = add(returnUsed[k], estimate[k]);
    }
    elapsed += dtSec; distance += dm; metabolic = dtSec > 0 ? mul(kcal, 4184 / dtSec) : null;
    source = source === 'api-step' ? source : dm > 0 && valid(s?.kcal) ? 'segments' : 'fallback';
    if (stepEnabled && dtSec > 0 && gridPx) {
      pending.push({ trace: { dt_sec: dtSec, from_world: previous ?? p, world: p, grid_px: [...gridPx], load_kg: load }, estimate });
      batchSec += dtSec;
    }
    previous = p;
    check(gridPx);
    const goal = route?.dense?.at(-1);
    if (!arrived && goal && Math.hypot(p[0] - goal[0], p[1] - goal[1]) <= arrivalRadiusM) { arrived = true; emit('arrived', snapshot()); }
    if (batchSec >= stepIntervalSec && !flight) void flush();
    return snapshot();
  }
  setRoute(route);
  return { update, snapshot, on, flush, setRoute(r) { route = r; setRoute(r); }, addLoad(kg) {
    if (!valid(kg)) throw new TypeError('Yük negatif olamaz');
    const before = loadFactor(); load += kg; const after = loadFactor();
    for (const k of ['kcal', 'o2_L']) returnUsed[k] = before > 0 ? mul(returnUsed[k], after / before) : null;
    check(); return snapshot();
  } };
}
