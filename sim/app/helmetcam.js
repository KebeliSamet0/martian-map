// Kask kamerası (tur4:veri): rotada Curiosity'nin gerçekten durduğu bir noktaya yaklaşınca C → o noktada çekilmiş gerçek Navcam karesi
// + Emre modelinin o duraktaki çıktısından şablonla üretilmiş kısa yorum + (kum > %15 / büyük kaya > %10 ise) ileri uyarı.
// Fotoğrafı olmayan yerde kamera açılmaz; yerine "tahmin" kartı çıkar. main.js'e yalnız `import './helmetcam.js'; // tur4:veri` eklenir.
// Olay sözleşmesi (window CustomEvent):
//   mm:camera-insight  detail { stopId, classFrac, entropy, warn, kinds, aheadM }   kamera bir durakta açıldığında (replan kararı Veysel'de)
//   mm:helmetcam       detail { open: bool, stopId }                                   açılış/kapanış; Navcam kartını gizlemek için
//   mm:helmetcam-view  detail { on: bool, stopId, az, el, fov }                        V ile hizalama (gerçek/simülasyon karşılaştırması) açıldı/kapandı
import { loadTexts } from './screens.js';
import { API_BASE, API_OFF, GRID, worldToPx, pxToWorld } from './api.js';
import { sampleField, sharedField } from './insight.js';
import { showCone, groundFn, clearCone } from './helmetcam-3d.js';
import { liveEnabled, runLive } from './livemodel.js';   // #127 B: ?live=1 ile kask kamerasında canlı model
import './stopcard-dir.js';   // tur4:veri: G (Navcam durak) kartına yön; helmetcam'in hizalama koduna bağlanır
import { loadManifest, nearestStop, stopAt, modelReading, aheadSimilar, cameraInsightDetail, imageCandidates, localFallback, certaintyOf, loadDirs, hasDir, cardinal, alignView } from './helmetcam-core.js';

const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'tr';
const pick = (v) => (v && typeof v === 'object' && 'tr' in v ? (v[lang] ?? v.tr) : v);
const DATA = new URL('../data/', import.meta.url).href;
const fmt = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const mm = () => window.__mm;
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

const S = { stops: null, T: null, walking: false, timer: 0, card: null, hint: null, open: null, field: null, dirs: {}, align: null, loading: null, noPhotoT: 0 };
const ready = () => (S.loading ??= (async () => {
  const all = await loadTexts();
  S.T = Object.fromEntries(Object.entries(all.helmetcam ?? {}).map(([k, v]) => [k, pick(v)]));
  S.stops = await loadManifest(new URL('navcam_manifest.json', DATA).href);
  S.dirs = await loadDirs(new URL('navcam_dirs.json', DATA).href).catch(() => ({}));
  if (!API_OFF) S.field = await sharedField(API_BASE, { w: GRID.w, h: GRID.h }).catch(() => null);
})().catch((e) => { console.warn('[helmetcam]', e); S.stops = []; }));

const box = (css) => { const el = document.createElement('div'); el.hidden = true; Object.assign(el.style, css); document.body.append(el); return el; };
const hintEl = () => (S.hint ??= box({ position: 'fixed', left: '50%', top: '44px', transform: 'translateX(-50%)', padding: '4px 12px', borderRadius: '6px', background: 'rgba(14,10,8,.78)', color: '#ffd9b8',
  font: '12px system-ui', border: '1px solid rgba(255,178,122,.4)', pointerEvents: 'none', zIndex: 21 }));
const cardEl = () => (S.card ??= box({ position: 'fixed', left: '50%', top: '72px', transform: 'translateX(-50%)', width: 'min(720px,92vw)', maxHeight: 'calc(100vh - 140px)', overflow: 'auto', padding: '10px 12px', borderRadius: '10px',
  background: 'rgba(14,10,8,.92)', color: '#f3e3d3', font: '13px/1.4 system-ui', border: '1px solid rgba(255,178,122,.35)', zIndex: 30, boxShadow: '0 8px 30px rgba(0,0,0,.5)' }));

const playerPx = () => { const m = mm(); return m?.geo && m.P ? worldToPx(m.geo, m.P.x, m.P.z) : null; };
const line = (txt, css = '') => `<div style="margin-top:5px;${css}">${txt}</div>`;
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function close() {
  exitAlign();
  if (!S.open) { if (S.card) S.card.hidden = true; clearCone(); return; }
  clearCone();
  const id = S.open.stop.stop_id; S.open = null; S.card.hidden = true; emit('mm:helmetcam', { open: false, stopId: id });
}

// ---- yön: pusula, 3B koni, hizalama (V) ----
const stopWorld = (st) => pxToWorld(mm().geo, st.px[0], st.px[1]);
function dirBlock(o, c) {
  const T = S.T, d = S.dirs[c.name];
  if (!hasDir(d)) return line(esc(T.dir_unknown), 'font-size:11px;opacity:.7');
  return `<div style="display:flex;gap:10px;align-items:center;margin-top:6px"><canvas class="mm-hc-compass" width="84" height="84" style="flex:none"></canvas><div>` +
    `<div style="font-weight:600;color:#ffd9b8">${esc(fmt(T.dir_label, { az: Math.round(d.az_deg), card: cardinal(d.az_deg, lang === 'en'), el: Math.round(d.el_deg), fov: Math.round(d.fov_deg) }))}</div>` +
    `<button class="mm-hc-align" style="margin-top:4px">${esc(T.btn_align)}</button>` +
    `<div style="font-size:11px;opacity:.65;margin-top:3px">${esc(T.dir_source)}</div></div></div>`;
}
function drawCompass(cv, d) {
  if (!cv || !hasDir(d)) return;
  const g = cv.getContext('2d'), R = 38, cx = 42, cy = 42, rad = (a) => ((a - 90) * Math.PI) / 180;   // 0° = yukarı (kuzey)
  g.clearRect(0, 0, 84, 84); g.strokeStyle = 'rgba(243,227,211,.55)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  g.fillStyle = 'rgba(255,178,122,.38)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, rad(d.az_deg - d.fov_deg / 2), rad(d.az_deg + d.fov_deg / 2)); g.closePath(); g.fill();   // FOV konisi
  g.strokeStyle = '#ffd9b8'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(rad(d.az_deg)) * R, cy + Math.sin(rad(d.az_deg)) * R); g.stroke();   // bakış oku
  g.fillStyle = '#f3e3d3'; g.font = '10px system-ui'; g.textAlign = 'center'; g.fillText(lang === 'en' ? 'N' : 'K', cx, 11);
}
function showDirCone(st, d) {
  clearCone(); const m = mm(); if (!hasDir(d) || !m?.T?.scene || !m.nav) return;
  const w = stopWorld(st); showCone({ scene: m.T.scene, heightAt: groundFn(m), x: w[0], z: w[1], azDeg: d.az_deg, fovDeg: d.fov_deg });
}
function enterAlign() {
  const o = S.open; if (!o) return; const c = o.cands[o.i];
  beginAlign({ world: stopWorld(o.stop), dir: S.dirs[c.name], url: c.url, sol: c.sol, stopId: o.stop.stop_id, frames: { i: o.i, n: o.cands.length } });
}
/** Hizalama hedefi: { world:[x,z], dir:{az_deg,el_deg,fov_deg}, url, sol, stopId, frames?:{i,n}, onExit? }. Kask kamerası ve G (Navcam durak) kartı aynı kodu kullanır. */
const NAVCAM_MAST_H = 1.97;   // m: Curiosity Navcam direği yerden ~1,9–2,0 m (astronot göz yüksekliği EYE=1,75 değil)
function beginAlign(t) {
  const m = mm(); if (!m?.T?.camera || !hasDir(t.dir)) return;
  const cam = m.T.camera, v = alignView(t.dir), saved = S.align?.savedFov ?? cam.fov, w = t.world;
  const W = innerWidth, H = innerHeight, side = Math.min(W, H), vf = (2 * Math.atan(Math.tan((v.fov * Math.PI) / 360) * (H / side)) * 180) / Math.PI;
  clearInterval(S.align?.loadTimer);
  S.align = { savedFov: saved, wipe: S.align?.wipe ?? 0.5, target: t };
  // Kamera = Navcam direği yüksekliği (astronot göz hizası değil); zemin = sahnedeki arazi (tiles_fixed), yoksa nav DEM'i. Yakın zemin kamerayı keserse yukarı itilir.
  const gnd = (x, z) => { const y = m.T.terrain?.heightAt(x, z); if (y != null) return y; const n = m.nav?.heightAt(x, z); return Number.isFinite(n) ? n : null; };
  window.__viewLock = (P) => {
    P.x = w[0]; P.z = w[1]; P.yaw = v.yaw; P.pitch = v.pitch; if (Math.abs(cam.fov - vf) > 1e-6) { cam.fov = vf; cam.updateProjectionMatrix(); }
    const g = gnd(w[0], w[1]); if (g == null) return; let top = g;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const h = gnd(w[0] + dx, w[1] + dz); if (h != null && h > top) top = h; }
    P.y = Math.max(g + NAVCAM_MAST_H, top + 0.6);
  };
  S.align.loadTimer = setInterval(() => { const L = S.alignEl?.querySelector('.mm-hc-load'), st = m.T.terrain?.stats; if (L) L.hidden = !(st && st.loading > 0); }, 250);
  clearCone();   // karşılaştırmada koni görüntüyü örtmesin
  if (S.card) S.card.hidden = true; renderAlign(t, side);
  emit('mm:helmetcam-view', { on: true, stopId: t.stopId, az: t.dir.az_deg, el: t.dir.el_deg, fov: t.dir.fov_deg });
}
export async function alignTo(t) { await ready(); S.T && beginAlign(t); }
export const isAligned = () => !!S.align;
export const isOpen = () => !!S.open;
export { exitAlign };
function exitAlign() {
  if (!S.align) return; const cam = mm()?.T?.camera, t = S.align.target;
  clearInterval(S.align.loadTimer); window.__viewLock = null; if (cam) { cam.fov = S.align.savedFov; cam.updateProjectionMatrix(); }
  S.alignEl?.remove(); S.alignEl = null; const id = t?.stopId; S.align = null;
  if (S.card && S.open) { S.card.hidden = false; const c = S.open.cands[S.open.i]; showDirCone(S.open.stop, S.dirs[c?.name]); }
  t?.onExit?.();
  emit('mm:helmetcam-view', { on: false, stopId: id });
}
function renderAlign(c, side = Math.min(innerWidth, innerHeight)) {
  const T = S.T, A = S.align, o = S.open; S.alignEl?.remove(); const fr = c.frames && o ? c.frames : null;
  const root = document.createElement('div'); Object.assign(root.style, { position: 'fixed', inset: '0', zIndex: 28, pointerEvents: 'none' });
  const left = (innerWidth - side) / 2, wx = left + side * A.wipe;
  root.innerHTML =
    `<div class="mm-hc-photo" style="position:absolute;left:${left}px;top:${(innerHeight - side) / 2}px;width:${side}px;height:${side}px;clip-path:inset(0 ${(1 - A.wipe) * 100}% 0 0);overflow:hidden;background:#000">` +
    `<img src="${esc(c.url)}" alt="Curiosity Navcam, sol ${c.sol}" style="width:100%;height:100%;display:block"></div>` +
    `<div class="mm-hc-bar" style="position:absolute;left:${wx - 1}px;top:${(innerHeight - side) / 2}px;height:${side}px;width:2px;background:#ffd9b8;box-shadow:0 0 8px rgba(0,0,0,.6)"></div>` +
    `<div class="mm-hc-knob" title="${esc(T.wipe_hint)}" style="position:absolute;left:${wx - 16}px;top:${innerHeight / 2 - 16}px;width:32px;height:32px;border-radius:50%;background:rgba(14,10,8,.85);border:2px solid #ffd9b8;color:#ffd9b8;font:14px/28px system-ui;text-align:center;cursor:ew-resize;pointer-events:auto;touch-action:none">↔</div>` +
    `<div style="position:absolute;left:${left + 10}px;top:${(innerHeight - side) / 2 + 8}px;padding:2px 8px;border-radius:5px;background:rgba(14,10,8,.75);color:#f3e3d3;font:12px system-ui">${esc(T.lbl_real)} · ${esc(fmt(T.source_img, { sol: c.sol }))}</div>` +
    `<div style="position:absolute;right:${left + 10}px;top:${(innerHeight - side) / 2 + 8}px;padding:2px 8px;border-radius:5px;background:rgba(14,10,8,.75);color:#f3e3d3;font:12px system-ui">${esc(T.lbl_sim)}</div>` +
    `<div class="mm-hc-load" hidden style="position:absolute;right:${left + 10}px;top:${(innerHeight - side) / 2 + 36}px;padding:2px 8px;border-radius:5px;background:rgba(14,10,8,.75);color:#ffd9b8;font:12px system-ui">${esc(T.align_loading)}</div>` +
    `<div style="position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:8px;background:rgba(14,10,8,.88);color:#f3e3d3;font:12px system-ui;pointer-events:auto;max-width:94vw;flex-wrap:wrap;justify-content:center">` +
    (fr && fr.n > 1 ? `<button class="mm-hc-prev">▲</button><span>${esc(fmt(T.frame, { i: fr.i + 1, n: fr.n }))}</span><button class="mm-hc-next">▼</button>` : '') +
    `<button class="mm-hc-back">${esc(T.btn_back)}</button><span style="opacity:.7;max-width:46ch">${esc(T.align_note)}</span></div>`;
  document.body.append(root); S.alignEl = root; liveBadge();
  const setWipe = (f) => { A.wipe = Math.max(0, Math.min(1, f)); const x = left + side * A.wipe; root.querySelector('.mm-hc-photo').style.clipPath = `inset(0 ${(1 - A.wipe) * 100}% 0 0)`; root.querySelector('.mm-hc-bar').style.left = `${x - 1}px`; root.querySelector('.mm-hc-knob').style.left = `${x - 16}px`; };
  A.setWipe = setWipe;
  const knob = root.querySelector('.mm-hc-knob');
  knob.onpointerdown = (e) => { knob.setPointerCapture(e.pointerId); knob.onpointermove = (ev) => setWipe((ev.clientX - left) / side); knob.onpointerup = () => { knob.onpointermove = null; }; };
  root.querySelector('.mm-hc-back').onclick = () => exitAlign();
  root.querySelector('.mm-hc-prev')?.addEventListener('click', () => stepFrame(-1)); root.querySelector('.mm-hc-next')?.addEventListener('click', () => stepFrame(1));
}
function stepFrame(dir) {
  const o = S.open; if (!o || !S.align) return; o.i = (o.i + dir + o.cands.length) % o.cands.length;
  if (hasDir(S.dirs[o.cands[o.i].name])) { renderStop(); S.card.hidden = true; enterAlign(); } else { renderStop(); exitAlign(); }
}

function renderStop() {
  const o = S.open, T = S.T, st = o.stop, r = o.reading, c = o.cands[o.i], el = cardEl();
  const ahead = o.ahead ? fmt(T.ahead_hit, { m: Math.round(o.ahead.aheadM), cls: T[`class_${o.ahead.kind}`] }) : (r.warn && o.aheadChecked ? fmt(T.ahead_none, { m: 300 }) : '');
  el.innerHTML =
    `<div style="display:flex;justify-content:space-between;align-items:center"><b style="letter-spacing:.06em;color:#ffb27a">${esc(T.title.toUpperCase())}</b>` +
    `<span><span class="mm-hc-frame" style="opacity:.75;font-size:12px">${o.cands.length > 1 ? esc(fmt(T.frame, { i: o.i + 1, n: o.cands.length })) : ''}</span> <button class="mm-hc-x" style="margin-left:8px">${esc(T.close)}</button></span></div>` +
    `<div style="position:relative;margin-top:6px;background:#000;text-align:center"><img class="mm-hc-img" alt="Curiosity Navcam, sol ${c.sol}" style="max-width:100%;max-height:46vh;display:block;margin:0 auto">` +
    `<img class="mm-hc-mask" alt="" hidden style="position:absolute;inset:0;margin:auto;max-width:100%;max-height:46vh;opacity:.5;pointer-events:none"></div>` +
    line(esc(fmt(T.source_img, { sol: c.sol })), 'font-size:11px;opacity:.8') + line(esc(T.source_model), 'font-size:11px;opacity:.8') + dirBlock(o, c) +
    line(`<b>${esc(r.text)}</b>`) + line(esc(fmt(T.certainty_line, { c: Math.round(r.certainty * 100) })), 'font-size:11px;opacity:.75') +
    (r.warn ? line(esc(r.warnText), 'color:#ffb4ad;font-weight:600') : '') + (ahead ? line(esc(ahead), 'color:#ffb4ad') : '') +
    (r.sandNote ? line(esc(T.sand_note), 'font-size:11px;opacity:.65') : '') +
    `<div class="mm-hc-masklabel" hidden style="font-size:11px;opacity:.65;margin-top:3px">${esc(T.mask_label)}</div>`;
  const img = el.querySelector('.mm-hc-img'), mask = el.querySelector('.mm-hc-mask');
  img.onerror = () => {   // arşivde yok / indirilmemiş kare: listeden düş, sıradakine geç; hiç kalmazsa fotoğrafsız kart
    o.cands.splice(o.i, 1); if (!o.cands.length && !o.triedLocal) { o.triedLocal = true; o.cands = localFallback(st, DATA); }
    if (o.i >= o.cands.length) o.i = Math.max(0, o.cands.length - 1);
    if (o.cands.length) renderStop(); else { const id = st.stop_id; S.open = null; showNoPhoto(T.nophoto_near, st, id); }
  };
  img.src = c.url;
  if (c.mask) { mask.onload = () => { mask.hidden = false; const l = el.querySelector('.mm-hc-masklabel'); if (l) l.hidden = false; }; mask.onerror = () => { mask.hidden = true; }; mask.src = c.mask; }   // maske yoksa gizli
  if (liveEnabled()) hookLive(o, c, img, mask, el);
  el.querySelector('.mm-hc-x').onclick = close;
  const ab = el.querySelector('.mm-hc-align'); if (ab) ab.onclick = enterAlign;
  drawCompass(el.querySelector('.mm-hc-compass'), S.dirs[c.name]);
  showDirCone(st, S.dirs[c.name]);
  el.hidden = false;
}

// #127 B (Emre): canlı çıkarım hazır maskenin yerine geçer; hata olursa hazır maske kalır. Kart değiştiyse sonuç atılır.
// Karşılaştırma (hizalama) görünümü kartı gizler; canlı model durumu orada da görünsün (Geri → kartta maske).
function liveBadge() {
  const root = S.alignEl; if (!root || !S.liveMsg) return;
  let b = root.querySelector('.mm-hc-live');
  if (!b) { b = document.createElement('div'); b.className = 'mm-hc-live'; Object.assign(b.style, { position: 'absolute', left: '50%', top: '10px', transform: 'translateX(-50%)', padding: '3px 10px', borderRadius: '6px', background: 'rgba(14,10,8,.85)', color: '#ffd9b8', font: '12px system-ui', pointerEvents: 'none' }); root.append(b); }
  b.textContent = S.liveMsg + ' · maske için Geri';
}
function hookLive(o, c, img, mask, el) {
  const label = el.querySelector('.mm-hc-masklabel');
  const loaded = (im) => new Promise((res) => { if (im.complete && im.naturalWidth) res(true); else { im.addEventListener('load', () => res(true), { once: true }); im.addEventListener('error', () => res(false), { once: true }); } });
  const say = (txt) => { S.liveMsg = txt; if (label) { label.hidden = false; label.textContent = txt; } liveBadge(); };
  say('Model tarayıcıda yükleniyor…');
  (async () => {
    const okImg = await loaded(img); const okMask = c.mask ? await loaded(mask) : false;
    if (!okImg) return;
    const r = await runLive(img, okMask ? mask : null);
    if (S.open !== o || o.cands[o.i] !== c) return;
    mask.src = r.url; mask.hidden = false;
    say(`Model şu an tarayıcında çalışıyor · ${Math.round(r.ms)} ms (${r.backend}, tek geçiş)` + (r.agree == null ? '' : ` · hazır maskeyle uyuşma %${Math.round(r.agree * 100)}`));
  })().catch((e) => { console.warn('livemodel', e); if (S.open === o) say(`Canlı model çalışmadı (${e.message}); hazır maske gösteriliyor.`); });
}

function showNoPhoto(first, stop, closedId) {
  const T = S.T, px = playerPx(), el = cardEl(), n = px ? nearestStop(S.stops, px, GRID.res) : null;
  const cell = S.field && px ? sampleField(S.field, px) : null, cert = cell ? cell.conf : (n ? certaintyOf(n.stop) : null);
  el.innerHTML = `<b style="letter-spacing:.06em;color:#ffb27a">${esc(T.title.toUpperCase())}</b>` + line(esc(first ?? T.nophoto)) +
    (cert != null && n ? line(esc(fmt(T.nophoto_meta, { c: Math.round(cert * 100), d: Math.round(n.distM) })), 'font-size:12px;opacity:.85') : '');
  el.hidden = false; clearTimeout(S.noPhotoT); S.noPhotoT = setTimeout(() => { if (!S.open) el.hidden = true; }, 9000);
  if (closedId) emit('mm:helmetcam', { open: false, stopId: closedId });
}

async function openCamera() {
  await ready(); if (!S.stops?.length) return;
  const px = playerPx(); if (!px) return;
  const hit = stopAt(S.stops, px, GRID.res);
  if (!hit) { close(); showNoPhoto(null, null); return; }
  const stop = hit.stop, reading = modelReading(stop, S.T), R = mm().routeRun;
  const ahead = reading.warn && R && S.field ? aheadSimilar({ dense: R.r.dense, cum: R.cum, s: R.s }, reading.kinds, (p) => sampleField(S.field, p), (w) => worldToPx(mm().geo, w[0], w[1])) : null;
  S.open = { stop, reading, cands: imageCandidates(stop, DATA), i: 0, ahead, aheadChecked: !!(R && S.field) };
  clearTimeout(S.noPhotoT); renderStop();
  emit('mm:helmetcam', { open: true, stopId: stop.stop_id });
  emit('mm:camera-insight', cameraInsightDetail(stop, reading, { kinds: reading.kinds, aheadM: ahead ? Math.round(ahead.aheadM) : null }));
}

async function tick() {
  if (!S.walking) return; await ready(); if (!S.stops?.length) return;
  const px = playerPx(); if (!px) return;
  const near = stopAt(S.stops, px, GRID.res);
  if (S.open && !near) { close(); }   // durağın yarıçapından çıkıldı
  const h = hintEl();
  if (near && !S.open) { h.textContent = fmt(S.T.hint, { sol: near.stop.sol }); h.hidden = false; } else h.hidden = true;
}

function walking(on) {
  S.walking = on; clearInterval(S.timer);
  if (on) { S.timer = setInterval(() => void tick(), 400); void tick(); void ready(); }
  else { close(); if (S.hint) S.hint.hidden = true; if (S.card) S.card.hidden = true; }
}
addEventListener('mm:screen', (e) => {
  const d = e.detail, screen = typeof d === 'string' ? d : d?.screen;
  if (screen === 'walk' || screen === 'resume') walking(true);
  else if (['pause', 'report', 'intro', 'select', 'briefing', 'route', 'computing'].includes(screen)) walking(false);
});
addEventListener('keydown', (e) => {
  if (!S.walking || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? '')) return;
  try { if (mm()?.stats().state === 'fly') return; } catch { /* henüz yok */ }
  if (e.code === 'KeyC') { e.stopImmediatePropagation(); if (S.open || (S.card && !S.card.hidden)) { close(); if (S.card) S.card.hidden = true; } else void openCamera(); }
  else if (S.open && e.code === 'KeyV') { e.stopImmediatePropagation(); e.preventDefault(); if (S.align) exitAlign(); else enterAlign(); }
  else if (S.align && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { e.stopImmediatePropagation(); e.preventDefault(); S.align.setWipe(S.align.wipe + (e.code === 'ArrowRight' ? 0.04 : -0.04)); }
  else if (S.align && S.open && (e.code === 'ArrowUp' || e.code === 'ArrowDown') && S.open.cands.length > 1) { e.stopImmediatePropagation(); e.preventDefault(); stepFrame(e.code === 'ArrowDown' ? 1 : -1); }
  else if (S.open && (e.code === 'ArrowLeft' || e.code === 'ArrowRight') && S.open.cands.length > 1) {
    e.stopImmediatePropagation(); e.preventDefault();
    S.open.i = (S.open.i + (e.code === 'ArrowRight' ? 1 : S.open.cands.length - 1)) % S.open.cands.length; renderStop();
  }
}, true);
window.__helmetcam = { state: S, openCamera, close };
