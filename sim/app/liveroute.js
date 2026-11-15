// Canlı rota (Samet, 15 Kasım): nerede olursan ol, çizgi O ANKİ konumdan hedefe planlayıcının en iyi yolunu gösterir.
// Karar kartı yok: oyuncu hareket ettikçe rota sessizce yeniden hesaplanır (GPS gibi). Sayılar yalnız planlayıcı yanıtından gelir;
// API yoksa canlı rota kapalıdır ve bu açıkça yazılır. Kum ve kask kamerası uyarıları gözlem olarak sonraki hesaplara girer (/replan).
// Çekirdek (ne zaman istek atılır, gövde, gözlemler) saf ve testlidir; DOM ve sahne main.js'te.

export const LIVE_MOVE_M = 3;        // son istekten bu kadar yürüyünce yeniden hesap
export const LIVE_IDLE_S = 4;        // ya da bu kadar süre geçince (en az LIVE_MIN_MOVE_M hareketle)
export const LIVE_MIN_MOVE_M = 0.5;
export const LIVE_MIN_GAP_S = 0.8;   // iki istek arası en az

/** İstek atılmalı mı? st: {busy, lastPos:[x,z]|null, lastAt}, pos:[x,z], nowS. */
export function shouldRequest(st, pos, nowS) {
  if (st.busy) return false;
  if (!st.lastPos) return true;
  if (nowS - st.lastAt < LIVE_MIN_GAP_S) return false;
  const moved = Math.hypot(pos[0] - st.lastPos[0], pos[1] - st.lastPos[1]);
  if (moved >= LIVE_MOVE_M) return true;
  return nowS - st.lastAt >= LIVE_IDLE_S && moved >= LIVE_MIN_MOVE_M;
}

/** İstek gövdesi: gözlem varsa /replan (kumdan/uyarılı bölgeden kaçınsın), yoksa /route. */
export function requestFor({ px, goalPx, budget, basePx }, obs = []) {
  const body = { start: px, goal: goalPx };
  if (budget && Object.keys(budget).length) body.budget = budget;
  if (basePx && !(basePx[0] === goalPx[0] && basePx[1] === goalPx[1])) body.base_px = basePx;
  if (obs.length) return { path: '/replan', body: { ...body, observations: obs.map((o) => ({ px: o.px, radius_m: o.radius_m, cls: o.cls })) } };
  return { path: '/route', body };
}

/** 422 (başlangıç hücresi geçilemez) için komşu hücreler: yakından uzağa. */
export function neighbourStarts(px, r = 2) {
  const out = [];
  for (let d = 1; d <= r; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
    out.push([px[0] + dx, px[1] + dy]);
  }
  return out;
}

/**
 * deps: { call(path, body) → Promise<json>, ctx() → null | {pos:[x,z], px:[c,r], goalPx, kind, budget, basePx, gen},
 *         install(route, info), onStatus?(status) }
 */
export function createLiveRoute(deps) {
  const st = { busy: false, lastPos: null, lastAt: -1e9, n: 0, last: null, obs: [], err: null };
  const pick = (res, kind) => res?.routes?.find((r) => r.kind === kind) ?? res?.routes?.[0];
  async function run(c, nowS) {
    st.busy = true; st.lastPos = c.pos; st.lastAt = nowS;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    try {
      let res = null, startPx = c.px;
      const tryOnce = async (px) => { const q = requestFor({ ...c, px }, st.obs); return deps.call(q.path, q.body); };
      try { res = await tryOnce(c.px); } catch (e) {
        if (!/422/.test(String(e?.message))) throw e;
        for (const nb of neighbourStarts(c.px)) { try { res = await tryOnce(nb); startPx = nb; break; } catch (e2) { if (!/422/.test(String(e2?.message))) throw e2; } }
        if (!res) throw e;
      }
      const now = deps.ctx(); if (!now || now.gen !== c.gen) return null;   // bu arada rota/aşama değişti: sonucu at
      const rt = pick(res, c.kind); if (!rt) return null;
      st.n += 1; st.err = null;
      const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
      st.last = { at: Date.now() / 1000, ms, km: rt.total?.km ?? null, go: rt.total?.go ?? null, status: rt.total?.status ?? null, obs: st.obs.length };
      deps.install(rt, { startPx, ms, obs: st.obs.length });
      deps.onStatus?.(st.last);
      return rt;
    } catch (e) { st.err = String(e?.message ?? e); return null; }
    finally { st.busy = false; }
  }
  return {
    /** Her karede çağrılır; gerekiyorsa tek istek başlatır. */
    update(nowS) { const c = deps.ctx(); if (!c || !shouldRequest(st, c.pos, nowS)) return null; return run(c, nowS); },
    /** Hemen yeniden hesapla (gözlem eklendi, aşama değişti). */
    force(nowS) { st.lastPos = null; st.lastAt = -1e9; return this.update(nowS); },
    /** Kum / kask kamerası uyarısı: sonraki tüm hesaplarda bu bölgeden kaçınılır. */
    observe(o) { if (!o?.px) return; if (st.obs.some((x) => x.px[0] === o.px[0] && x.px[1] === o.px[1])) return; st.obs.push({ px: o.px, radius_m: o.radius_m ?? 20, cls: o.cls ?? 'sand' }); },
    reset() { st.busy = false; st.lastPos = null; st.lastAt = -1e9; st.n = 0; st.last = null; st.obs = []; st.err = null; },
    state: () => ({ ...st, obs: st.obs.slice() }),
  };
}
