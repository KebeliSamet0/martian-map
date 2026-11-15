// Dinamik rota (#122): yürüyüş boyunca durumu izler, gerektiğinde MEVCUT konumdan yeni plan önerir.
// Sayılar yalnız planlayıcı API yanıtından gelir (/route; total.consumption, km); API yoksa öneri yapılmaz ve bu belirtilir.
// Olay sözleşmesi: window 'mm:route-suggest' {reason:'deviation'|'reserve'|'load'|'observation'|'sand', route, current, delta:{m,kcal,o2_L,risk}, urgent}
//                  window 'mm:route-decision' {accept, reason}. Olay iptal edilebilir: dinleyici preventDefault() derse arayüzü o gösterir;
//                  yoksa yerleşik küçük bant gösterilir (sand: karar beklemeden uygulanır = önceki davranış).
// Çekirdek (eşikler, mesafe, bütçe, debounce) saf ve testlidir: DOM yalnız en altta.

export const DEVIATION_M = 15;       // rotadan bu kadar uzaklaşıp
export const DEVIATION_HOLD_S = 5;   // bu kadar süre kalırsa sapma önerisi
export const RESERVE_FRAC = 0.4;     // O₂ ya da süre payı bunun altına inince üsse dönüş planı
export const RETURN_NEAR = 0.8;      // dönüş maliyeti kalan bütçenin bu oranına yaklaşırsa "dönüşü olmayan nokta"
export const COOLDOWN_S = 45;        // aynı sebep için iki öneri arası
export const DECISION_TIMEOUT_S = 25;
export const LOAD_STEP_KG = 0.5;      // yük bu kadar artınca (numune) kalan rota + dönüş yeni yükle yeniden hesaplanır
export const OBS_RADIUS_M = 20;       // kask kamerası gözlemi için tasarım yarıçapı (≈ maskeli görüş menzili; kaynaklı ölçüm değil)
export const OBS_NEAR_ROUTE_M = 40;   // gözlem yalnız rotaya bu kadar yakınsa dikkate alınır

/** pos [x,z] ile polyline [[x,z]...] arasındaki en kısa mesafe: {dist, idx (en yakın segment başlangıcı), point}. */
export function distToPolyline(pos, dense) {
  let best = { dist: Infinity, idx: 0, point: dense?.[0] ?? null };
  for (let i = 0; i + 1 < (dense?.length ?? 0); i++) {
    const a = dense[i], b = dense[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], d2 = dx * dx + dz * dz;
    const t = d2 ? Math.max(0, Math.min(1, ((pos[0] - a[0]) * dx + (pos[1] - a[1]) * dz) / d2)) : 0;
    const q = [a[0] + t * dx, a[1] + t * dz], d = Math.hypot(pos[0] - q[0], pos[1] - q[1]);
    if (d < best.dist) best = { dist: d, idx: i, point: q };
  }
  return best;
}

/** Kalan bütçe: limitler − kullanılan (vitals.snapshot alanları: elapsedSec, o2UsedL/o2RemainingL, kcal, doseUGy). null = bilinmiyor. */
export function remainingBudget(limits = {}, snap = {}) {
  const num = (v) => (Number.isFinite(v) ? v : null);
  const timeLeft = limits.time_min != null && num(snap.elapsedSec) != null ? limits.time_min - snap.elapsedSec / 60 : null;
  const o2Left = num(snap.o2RemainingL) ?? (limits.o2_L != null && num(snap.o2UsedL) != null ? limits.o2_L - snap.o2UsedL : null);
  const kcalLeft = limits.kcal != null && num(snap.kcal) != null ? limits.kcal - snap.kcal : null;
  const doseLeft = limits.dose_uGy != null && num(snap.doseUGy) != null ? limits.dose_uGy - snap.doseUGy : null;
  const frac = (left, lim) => (left != null && lim ? left / lim : null);
  return { time_min: timeLeft, o2_L: o2Left, kcal: kcalLeft, dose_uGy: doseLeft,
    fracO2: frac(o2Left, limits.o2_L), fracTime: frac(timeLeft, limits.time_min) };
}

/** Tek yön maliyet: API total.consumption.outbound + km. */
export function oneWay(total) {
  const o = total?.consumption?.outbound;
  return { m: Number.isFinite(total?.km) ? total.km * 1000 : null, min: o?.min ?? null, kcal: o?.kcal ?? null, o2_L: o?.o2_L ?? null, dose_uGy: o?.dose_uGy ?? null };
}
const sub = (a, b) => (Number.isFinite(a) && Number.isFinite(b) ? Math.round((a - b) * 10) / 10 : null);
export const deltaOf = (n, o) => ({ m: sub(n.m, o.m), kcal: sub(n.kcal, o.kcal), o2_L: sub(n.o2_L, o.o2_L), risk: null });
const sum = (a, b) => ({ m: (a.m ?? 0) + (b.m ?? 0), kcal: (a.kcal ?? 0) + (b.kcal ?? 0), o2_L: (a.o2_L ?? 0) + (b.o2_L ?? 0), min: (a.min ?? 0) + (b.min ?? 0) });

/**
 * deps: { call(path, body) → Promise, ctx() → null | { route:{dense,goalPx,kind}, pos:[x,z], px:[c,r], progressM, limits, snap, basePx, worldToPx([x,z])→[c,r] },
 *         propose(detail) → Promise<{accept}|null>, apply(route, reason), onNote?(text) }
 */
export function createDynRoute(deps) {
  const { call, ctx, propose, apply } = deps;
  const st = { devT: 0, busy: false, cooldown: {}, reserveDone: false, lastTick: 0, noApiNoted: false, load0: null, loadSeen: null, obsSeen: new Set() };
  const budgetBody = (c) => { const r = remainingBudget(c.limits, c.snap); const b = {}; for (const k of ['time_min', 'o2_L', 'kcal', 'dose_uGy']) if (r[k] != null && r[k] > 0) b[k] = Math.round(r[k] * 100) / 100; return b; };
  const pick = (res, kind) => res?.routes?.find((x) => x.kind === kind) ?? res?.routes?.[0];
  const cdOk = (reason, now) => (st.cooldown[reason] ?? -1e9) + COOLDOWN_S <= now;

  async function deviation(c, near, now) {
    st.busy = true; st.cooldown.deviation = now;
    try {
      const kind = c.route.kind, body = (s, g) => ({ start: s, goal: g, ...(Object.keys(budgetBody(c)).length ? { budget: budgetBody(c) } : {}) });
      const rejoinPx = c.worldToPx(near.point).map(Math.floor);
      const [nw, back, rest] = await Promise.all([call('/route', body(c.px, c.route.goalPx)), call('/route', body(c.px, rejoinPx)), call('/route', body(rejoinPx, c.route.goalPx))]);
      const n = pick(nw, kind), b = pick(back, kind), r = pick(rest, kind);
      if (!n || !b || !r) { deps.onNote?.('dynroute: planlayıcı bu konumdan rota döndürmedi (öneri yok)'); return; }
      const newC = oneWay(n.total), viaOld = sum(oneWay(b.total), oneWay(r.total));
      await propose({ reason: 'deviation', route: n, current: { px: c.px }, delta: deltaOf(newC, viaOld), via: { newRoute: newC, backToRoute: viaOld }, urgent: false });
    } catch (e) { deps.onNote?.(`dynroute: ${e.message}`); } finally { st.busy = false; }
  }

  async function reserve(c, now) {
    st.busy = true; st.cooldown.reserve = now;
    try {
      const res = await call('/route', { start: c.px, goal: c.basePx, ...(Object.keys(budgetBody(c)).length ? { budget: budgetBody(c) } : {}) });
      const r = pick(res, 'safest'); if (!r) { deps.onNote?.('dynroute: üsse dönüş rotası yok'); return; }
      const back = oneWay(r.total), left = remainingBudget(c.limits, c.snap);
      const near = (need, have) => need != null && have != null && have > 0 && need >= RETURN_NEAR * have;
      const urgent = r.total?.go === false || near(back.o2_L, left.o2_L) || near(back.min, left.time_min);
      st.reserveDone = true;
      await propose({ reason: 'reserve', route: r, current: { px: c.px }, delta: { m: back.m, kcal: back.kcal, o2_L: back.o2_L, risk: null }, left, urgent });
    } catch (e) { deps.onNote?.(`dynroute: ${e.message}`); } finally { st.busy = false; }
  }

  async function load(c, extraKg, now) {
    st.busy = true; st.cooldown.load = now;
    try {
      const body = (g, ld) => ({ start: c.px, goal: g, load_kg: ld, ...(Object.keys(budgetBody(c)).length ? { budget: budgetBody(c) } : {}) });
      const [withL, noL, backL] = await Promise.all([call('/route', body(c.route.goalPx, extraKg)), call('/route', body(c.route.goalPx, 0)), c.basePx ? call('/route', body(c.basePx, extraKg)) : null]);
      const n = pick(withL, c.route.kind), o = pick(noL, c.route.kind); if (!n || !o) { deps.onNote?.('dynroute: yük için rota hesaplanamadı'); return; }
      const back = backL ? pick(backL, 'safest') : null;
      await propose({ reason: 'load', route: n, current: { px: c.px }, delta: deltaOf(oneWay(n.total), oneWay(o.total)), extraKg,
        via: { returnWithLoad: back ? oneWay(back.total) : null }, urgent: back?.total?.go === false });
    } catch (e) { deps.onNote?.(`dynroute: ${e.message}`); } finally { st.busy = false; }
  }

  async function observe(c, obs, now) {
    st.busy = true; st.cooldown.observation = now;
    try {
      const body = { start: c.px, goal: c.route.goalPx, observations: [{ px: obs.px.map(Math.floor), radius_m: obs.radius_m ?? OBS_RADIUS_M, cls: obs.cls }], ...(Object.keys(budgetBody(c)).length ? { budget: budgetBody(c) } : {}) };
      const [res, base] = await Promise.all([call('/replan', body), call('/route', { start: c.px, goal: c.route.goalPx, ...(Object.keys(budgetBody(c)).length ? { budget: budgetBody(c) } : {}) })]);
      const n = pick(res, c.route.kind), o = pick(base, c.route.kind); if (!n || !o) { deps.onNote?.('dynroute: gözlem için rota hesaplanamadı'); return; }
      await propose({ reason: 'observation', route: n, current: { px: c.px }, delta: deltaOf(oneWay(n.total), oneWay(o.total)), observation: { ...obs, radius_m: obs.radius_m ?? OBS_RADIUS_M }, urgent: false });
    } catch (e) { deps.onNote?.(`dynroute: ${e.message}`); } finally { st.busy = false; }
  }

  let pendingObs = null;
  return {
    /** Kask kamerası ya da tarayıcı gözlemi: {px:[c,r], cls:'sand'|'bigrock'|..., radius_m?}. Rotaya yakın değilse yok sayılır. */
    observe(obs) {
      const c = ctx(); if (!c || !obs?.px || !obs.cls) return false;
      const key = obs.px.join(',') + obs.cls; if (st.obsSeen.has(key)) return false;
      const w = c.pxToWorld?.(obs.px); if (w && distToPolyline(w, c.route.dense).dist > OBS_NEAR_ROUTE_M + (obs.radius_m ?? OBS_RADIUS_M)) return false;
      st.obsSeen.add(key); pendingObs = obs; return true;
    },
    /** Her kare: dt (sn, gerçek zaman), now (sn). */
    update(dt, now = st.lastTick + dt) {
      st.lastTick = now;
      const c = ctx(); if (!c || st.busy) { if (!c) st.devT = 0; return; }
      const near = distToPolyline(c.pos, c.route.dense);
      st.devT = near.dist > DEVIATION_M ? st.devT + dt : 0;
      const ld = c.snap?.loadKg;
      if (Number.isFinite(ld)) { st.load0 ??= ld; if (st.loadSeen == null) st.loadSeen = ld; if (ld - st.loadSeen >= LOAD_STEP_KG && cdOk('load', now)) { const extra = Math.round((ld - st.load0) * 10) / 10; st.loadSeen = ld; void load(c, extra, now); return; } }
      if (pendingObs && cdOk('observation', now)) { const o = pendingObs; pendingObs = null; void observe(c, o, now); return; }
      const rf = remainingBudget(c.limits, c.snap), low = Math.min(rf.fracO2 ?? 1, rf.fracTime ?? 1) < RESERVE_FRAC;
      if (low && !st.reserveDone && cdOk('reserve', now) && c.basePx) { void reserve(c, now); return; }
      if (st.devT >= DEVIATION_HOLD_S && cdOk('deviation', now)) { st.devT = 0; void deviation(c, near, now); }
    },
    reset() { st.devT = 0; st.busy = false; st.cooldown = {}; st.reserveDone = false; st.load0 = null; st.loadSeen = null; st.obsSeen = new Set(); pendingObs = null; },
    state: () => ({ ...st }),
  };
}

// ---------------- Sahne bağlama + yerleşik öneri bandı (DOM) ----------------
export function proposeVia({ t, apply, root = typeof document !== 'undefined' ? document.body : null }) {
  return (detail) => new Promise((resolve) => {
    const ev = new CustomEvent('mm:route-suggest', { detail, cancelable: true });
    let done = false;
    const finish = (accept, auto = false) => {
      if (done) return; done = true; off(); banner?.remove();
      window.dispatchEvent(new CustomEvent('mm:route-decision', { detail: { accept, reason: detail.reason, auto } }));
      if (accept) apply(detail.route, detail.reason);
      resolve({ accept });
    };
    const onDecision = (e) => { if (e.detail?.reason === detail.reason && !e.detail?.auto && !done) { done = true; off(); banner?.remove(); if (e.detail.accept) apply(detail.route, detail.reason); resolve({ accept: !!e.detail.accept }); } };
    const off = () => { window.removeEventListener('mm:route-decision', onDecision); clearTimeout(timer); };
    window.addEventListener('mm:route-decision', onDecision);
    const timer = setTimeout(() => finish(detail.reason === 'sand'), DECISION_TIMEOUT_S * 1000);
    let banner = null;
    const handled = !window.dispatchEvent(ev);                // dinleyici preventDefault() dediyse arayüz onda
    if (handled) return;
    if (detail.reason === 'sand') { finish(true, true); return; }   // yerleşik: kum yeniden planı eskisi gibi hemen uygulanır
    if (!root) return;
    banner = document.createElement('div'); banner.className = 'mm-ui'; banner.dataset.testid = 'dyn-banner'; banner.dataset.reason = detail.reason;
    banner.style.cssText = 'position:fixed;left:50%;top:78px;transform:translateX(-50%);z-index:2300;max-width:min(560px,92vw);padding:10px 14px;border-radius:10px;background:rgba(14,17,23,.94);border:1px solid ' + (detail.urgent ? '#ff6b5a' : '#f2a93b') + ';color:#e8e6e1;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.5)';
    const d = detail.delta ?? {}, signed = detail.reason !== 'reserve', fmt = (v) => (v == null ? '—' : (signed && v > 0 ? '+' : '') + v);
    const msg = document.createElement('div');
    msg.textContent = t(`dyn.msg.${detail.reason}`, { m: fmt(d.m), kcal: fmt(d.kcal), o2: fmt(d.o2_L) }) + (detail.urgent ? ' ' + t('dyn.urgent') : '');
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;margin-top:8px';
    const mk = (label, accept, primary) => { const b = document.createElement('button'); b.textContent = label; b.dataset.testid = accept ? 'dyn-accept' : 'dyn-dismiss';
      b.style.cssText = 'padding:6px 12px;border-radius:8px;cursor:pointer;border:1px solid #f2a93b;' + (primary ? 'background:#f2a93b;color:#0b0e13' : 'background:transparent;color:#f2a93b'); b.onclick = () => finish(accept); return b; };
    row.append(mk(t('dyn.accept'), true, true), mk(t('dyn.dismiss'), false, false)); banner.append(msg, row); root.append(banner);
  });
}
