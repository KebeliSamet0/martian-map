// Kask kamerası (tur4:veri): rotada Curiosity'nin gerçekten durduğu bir noktaya yaklaşınca C → o noktada çekilmiş gerçek Navcam karesi
// + Emre modelinin o duraktaki çıktısından şablonla üretilmiş kısa yorum + (kum > %15 / büyük kaya > %10 ise) ileri uyarı.
// Fotoğrafı olmayan yerde kamera açılmaz; yerine "tahmin" kartı çıkar. main.js'e yalnız `import './helmetcam.js'; // tur4:veri` eklenir.
// Olay sözleşmesi (window CustomEvent):
//   mm:camera-insight  detail { stopId, classFrac, entropy, warn, kinds, aheadM }   kamera bir durakta açıldığında (replan kararı Veysel'de)
//   mm:helmetcam       detail { open: bool, stopId }                                   açılış/kapanış; Navcam kartını gizlemek için
import { loadTexts } from './screens.js';
import { API_BASE, API_OFF, GRID, worldToPx } from './api.js';
import { sampleField, sharedField } from './insight.js';
import { loadManifest, nearestStop, stopAt, modelReading, aheadSimilar, cameraInsightDetail, imageCandidates, localFallback, certaintyOf } from './helmetcam-core.js';

const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'tr';
const pick = (v) => (v && typeof v === 'object' && 'tr' in v ? (v[lang] ?? v.tr) : v);
const DATA = new URL('../data/', import.meta.url).href;
const fmt = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const mm = () => window.__mm;
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

const S = { stops: null, T: null, walking: false, timer: 0, card: null, hint: null, open: null, field: null, loading: null, noPhotoT: 0 };
const ready = () => (S.loading ??= (async () => {
  const all = await loadTexts();
  S.T = Object.fromEntries(Object.entries(all.helmetcam ?? {}).map(([k, v]) => [k, pick(v)]));
  S.stops = await loadManifest(new URL('navcam_manifest.json', DATA).href);
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
  if (!S.open) { if (S.card) S.card.hidden = true; return; }
  const id = S.open.stop.stop_id; S.open = null; S.card.hidden = true; emit('mm:helmetcam', { open: false, stopId: id });
}

function renderStop() {
  const o = S.open, T = S.T, st = o.stop, r = o.reading, c = o.cands[o.i], el = cardEl();
  const ahead = o.ahead ? fmt(T.ahead_hit, { m: Math.round(o.ahead.aheadM), cls: T[`class_${o.ahead.kind}`] }) : (r.warn && o.aheadChecked ? fmt(T.ahead_none, { m: 300 }) : '');
  el.innerHTML =
    `<div style="display:flex;justify-content:space-between;align-items:center"><b style="letter-spacing:.06em;color:#ffb27a">${esc(T.title.toUpperCase())}</b>` +
    `<span><span class="mm-hc-frame" style="opacity:.75;font-size:12px">${o.cands.length > 1 ? esc(fmt(T.frame, { i: o.i + 1, n: o.cands.length })) : ''}</span> <button class="mm-hc-x" style="margin-left:8px">${esc(T.close)}</button></span></div>` +
    `<div style="position:relative;margin-top:6px;background:#000;text-align:center"><img class="mm-hc-img" alt="Curiosity Navcam, sol ${c.sol}" style="max-width:100%;max-height:46vh;display:block;margin:0 auto">` +
    `<img class="mm-hc-mask" alt="" hidden style="position:absolute;inset:0;margin:auto;max-width:100%;max-height:46vh;opacity:.5;pointer-events:none"></div>` +
    line(esc(fmt(T.source_img, { sol: c.sol })), 'font-size:11px;opacity:.8') + line(esc(T.source_model), 'font-size:11px;opacity:.8') +
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
  el.querySelector('.mm-hc-x').onclick = close;
  el.hidden = false;
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
  else if (S.open && (e.code === 'ArrowLeft' || e.code === 'ArrowRight') && S.open.cands.length > 1) {
    e.stopImmediatePropagation(); e.preventDefault();
    S.open.i = (S.open.i + (e.code === 'ArrowRight' ? 1 : S.open.cands.length - 1)) % S.open.cands.length; renderStop();
  }
}, true);
window.__helmetcam = { state: S, openCamera, close };
