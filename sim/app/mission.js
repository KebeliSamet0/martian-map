// Görev tanımındaki mesafeler sim dünya metresi; grid_px için coords adaptörü gerekir.
const DEMO = { id: 'sample-demo', title: 'Örnek numune görevi', goal: { world: [100, 0], radius_m: 2 },
  events: [{ id: 'sand-demo', type: 'sand', world: [50, 0], radius_m: 10 }], sample_kg: 1 };
const point = p => Array.isArray(p) ? p : [p.x, p.z];
const nonnegative = n => Number.isFinite(n) && n >= 0;
const distToTrace = (q, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], d2 = dx * dx + dz * dz;
  const t = d2 ? Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dz) / d2)) : 0;
  return Math.hypot(q[0] - a[0] - t * dx, q[1] - a[1] - t * dz);
};
async function request(fetcher, url, body) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 4000);
  try {
    const r = await fetcher(url, { signal: controller.signal, method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(timer); }
}
function definitions(data) {
  const list = Array.isArray(data) ? data : data?.missions;
  if (!list?.length || !list.every(m => m && typeof m.id === 'string' && m.goal)) throw new TypeError('Görev listesi geçersiz');
  return list;
}
export async function loadMissions({ api, apiBase = 'http://127.0.0.1:8000', fetcher = globalThis.fetch,
  missionsUrl = new URL('../data/missions.json', import.meta.url) } = {}) {
  try {
    const data = api?.missions ? await api.missions() : await request(fetcher, `${apiBase}/missions`);
    return { missions: definitions(data), source: 'api' };
  } catch { /* Dosya yedeğine devam. */ }
  try { return { missions: definitions(await request(fetcher, missionsUrl)), source: 'file' }; }
  catch { return { missions: [structuredClone(DEMO)], source: 'embedded' }; }
}

export function createMission({ definition = DEMO, vitals, coords, api, apiBase = 'http://127.0.0.1:8000', fetcher = globalThis.fetch, source = 'embedded' } = {}) {
  const def = structuredClone(definition), listeners = new Map(), triggered = new Set();
  const world = item => {
    const p = item.world ?? (item.grid_px && coords?.cellToWorld(item.grid_px));
    if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)) throw new TypeError('world veya grid_px + coords gerekli');
    return p;
  };
  let goal = world(def.goal), radius = def.goal.radius_m ?? 2;
  const events = (def.events ?? []).map((e, i) => ({ ...e, id: e.id ?? `event-${i}`, world: world(e), radius_m: e.radius_m ?? 0 }));
  if (!nonnegative(radius) || !nonnegative(def.sample_kg ?? 0) || events.some(e => !nonnegative(e.radius_m) || (e.trigger_m != null && !nonnegative(e.trigger_m))) || new Set(events.map(e => e.id)).size !== events.length)
    throw new TypeError('Geçersiz görev yarıçapı, yükü veya olay kimliği');
  let state = 'briefing', currentEvent = null, sampled = false, previous = null, planned = null, summary = null, finishing = null;
  let leg = 'outbound';   // #125 A.1: gidiş → numune → üsse dönüş
  const emit = (name, data) => { for (const cb of listeners.get(name) ?? []) cb(structuredClone(data)); };
  const snapshot = () => structuredClone({ state, missionId: def.id, source, currentEvent, sampled, leg, triggered: [...triggered], planned, summary });
  const move = next => { state = next; emit('state', snapshot()); return snapshot(); };
  const requireState = expected => { if (state !== expected) throw new Error(`${state} durumunda ${expected} işlemi yapılamaz`); };
  return {
    snapshot,
    on(name, cb) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(cb); return () => listeners.get(name).delete(cb); },
    plan() { requireState('briefing'); return move('planning'); },
    start(route) {
      requireState('planning'); if (!route) throw new TypeError('Rota gerekli');
      planned = structuredClone((route.raw ?? route).total ?? {}); vitals?.setRoute(route); return move('walking');
    },
    update(worldPos) {
      if (state !== 'walking') return snapshot();
      const p = point(worldPos);
      if (!p.every(Number.isFinite)) throw new TypeError('Geçersiz konum');
      const a = previous ?? p;
      for (const e of events) {
        if (!triggered.has(e.id) && distToTrace(e.world, a, p) <= (e.trigger_m ?? e.radius_m)) {
          triggered.add(e.id); currentEvent = e; // önceki konum korunur: aynı karedeki diğer olayları kaçırma
          move('event'); emit('event', e); return snapshot();
        }
      }
      previous = [...p];
      // Varış yalnız mevcut konum hedef yarıçapındaysa; üzerinden geçmek numune almak değildir.
      if (Math.hypot(p[0] - goal[0], p[1] - goal[1]) <= radius) { move('arrived'); emit('arrived', snapshot()); }
      return snapshot();
    },
    resume(route) { requireState('event'); if (route) vitals?.setRoute(route); currentEvent = null; return move('walking'); },
    collectSample() {
      requireState('arrived');
      if (!sampled) { vitals?.addLoad(def.sample_kg ?? 0); sampled = true; emit('sample', { kg: def.sample_kg ?? 0 }); }
      return snapshot();
    },
    // #52-3: rota görev sırasında değişirse özet eski planı değil güncel planı anlatsın.
    updatePlan(total) {
      if (!total || typeof total !== 'object') return snapshot();
      planned = structuredClone(total);
      return snapshot();
    },
    // #125 A.1: numune alındıktan sonra ikinci hedef — üsse dönüş. Gidişte tetiklenen olaylar tekrar açılmaz.
    beginReturn(target = {}) {
      requireState('arrived');
      const q = point(target.world ?? target);
      if (!Array.isArray(q) || q.length !== 2 || !q.every(Number.isFinite)) throw new TypeError('Dönüş hedefi gerekli');
      goal = q;
      if (nonnegative(target.radius_m)) radius = target.radius_m;
      leg = 'return'; previous = null;
      if (target.route) vitals?.setRoute(target.route);
      return move('walking');
    },
    async finish() {
      if (state === 'debrief') return snapshot();
      requireState('arrived');
      if (finishing) return finishing;
      finishing = (async () => {
        await vitals?.flush();
        const actual = vitals?.snapshot() ?? null;
        const delta = (value, expected) => Number.isFinite(value) && Number.isFinite(expected) ? value - expected : null;
        const local = { mission_id: def.id, planned, actual, sampled,
          delta: { min: delta(actual?.elapsedSec == null ? null : actual.elapsedSec / 60, planned.min),
            kcal: delta(actual?.kcal, planned.kcal), m: delta(actual?.distanceM, planned.km == null ? null : planned.km * 1000) }, source: 'local' };
        try {
          const result = api?.debrief ? await api.debrief(local) : await request(fetcher, `${apiBase}/debrief`, local);
          if (!result || typeof result !== 'object' || Array.isArray(result)) throw new TypeError('Geçersiz özet');
          summary = { ...local, remote: result, source: 'api' };
        } catch { summary = local; }
        move('debrief'); emit('debrief', summary); return snapshot();
      })();
      try { return await finishing; } finally { finishing = null; }
    },
  };
}
