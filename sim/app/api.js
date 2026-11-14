// Planlayıcı API istemcisi (issue #49): rota tek kaynağı api/ (localhost:8000: /route, /replan, /assumptions, /grid).
// Izgara sözleşmesi contracts/grid.json: 1000×1000, 2 m, eqc R=3396190, px = [sütun, satır], hücre indeksi = floor, merkez = indeks + 0.5.
// Bu sabitler contracts/grid.json'dan KOPYADIR (API /grid origin döndürmez); sözleşme değişirse burası güncellenmeli.
export const GRID = { ox: 8142276.492786024, oy: -283815.075189438, res: 2.0, w: 1000, h: 1000, R: 3396190 };
const D2R = Math.PI / 180;
const Q = new URLSearchParams(location.search);
export const API_BASE = (Q.get('api') ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
export const API_OFF = Q.get('api') === 'off';

/** ızgara px (sürekli: merkez = idx+0.5) → sim dünya [x,z] */
export function pxToWorld(geo, c, r) {
  const x = GRID.ox + c * GRID.res, y = GRID.oy - r * GRID.res;
  return geo.lonlatToWorld(((x / GRID.R) / D2R), ((y / GRID.R) / D2R));
}
/** sim dünya [x,z] → ızgara px (sürekli) */
export function worldToPx(geo, X, Z) {
  const [lon, lat] = geo.worldToLonlat(X, Z);
  const x = GRID.R * lon * D2R, y = GRID.R * lat * D2R;
  return [(x - GRID.ox) / GRID.res, (GRID.oy - y) / GRID.res];
}
export const pxInside = (p) => p[0] >= 0 && p[1] >= 0 && p[0] < GRID.w && p[1] < GRID.h;

async function call(path, body, ms = 8000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(API_BASE + path, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal });
    if (!res.ok) { let d = ''; try { d = (await res.json()).detail; } catch { /* yut */ } throw new Error(`API ${res.status}${d ? ': ' + (typeof d === 'string' ? d : JSON.stringify(d)) : ''}`); }
    return await res.json();
  } finally { clearTimeout(t); }
}
export const apiHealth = () => call('/health', null, 2500);
export const apiRoute = (start, goal) => call('/route', { start, goal });
export const apiReplan = (start, goal, observations) => call('/replan', { start, goal, observations });
export const apiAssumptions = () => call('/assumptions', null, 4000);

/** API rotası → sim'in iç rota biçimi (nav.describe çıktısı ile aynı alanlar): dense [[x,z]...], heights, segments(idx), total */
export function adaptRoute(rt, { geo, nav, suitSpeed = 0.67056, kind }) {
  const dense = [], segments = [];
  let prevTo = 0;
  for (const s of rt.segments) {
    const from = segments.length ? prevTo : 0;
    for (const p of s.path_px) {
      const w = pxToWorld(geo, p[0] + 0.5, p[1] + 0.5), l = dense[dense.length - 1];
      if (!l || Math.hypot(w[0] - l[0], w[1] - l[1]) > 0.01) dense.push(w);
    }
    prevTo = dense.length - 1;
    const { path_px, ...rest } = s;
    segments.push({ ...rest, path_px, idx: [from, prevTo] });
  }
  const heights = dense.map((p) => { const v = nav.heightAt(p[0], p[1]); return Number.isNaN(v) ? null : v; });
  let up = 0, down = 0;
  for (let i = 1; i < heights.length; i++) if (heights[i] != null && heights[i - 1] != null) { const d = heights[i] - heights[i - 1]; if (d > 0) up += d; else down -= d; }
  let len = 0; for (let i = 1; i < dense.length; i++) len += Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]);
  const t = rt.total;
  return {
    source: 'api', raw: rt, dense, heights, segments, expanded: 0,
    total: { km: t.km, min: t.min, min_suit: Math.round(len / suitSpeed / 60), kcal: t.kcal, dose_uGy: t.dose_uGy, o2_L: t.o2_L, walkback_ok: t.walkback_ok, go: t.go, status: t.status,
      ascent_m: Math.round(up), descent_m: Math.round(down), slope_max: t.slope_max },
    kind: kind || rt.kind, maxSlope: null,
  };
}
