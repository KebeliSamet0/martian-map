// G / küçük Navcam durak kartına yön (tur4:veri): fotoğrafın çekildiği yön için zemin konisi + ok, kartta pusula, "Bu yöne bak (V)" ve gerçek/simülasyon karşılaştırması.
// wire-extras.js'e dokunmadan: #stop-photo öğesini izler (görünürlük ve img.src), kartın gösterdiği durağı curiosity.json'dan eşler.
// Yön önceliği: navcam_dirs.json[photo_source kare adı] (az/el/fov, NASA kamera modeli + rover duruşu); yoksa curiosity.json photo_world_az_deg (yalnız az: koni gösterilir, hizalama kapalı).
import { loadTexts } from './screens.js';
import { pxToWorld } from './api.js';
import { loadDirs, cardinal, dirFor } from './helmetcam-core.js';
import { showCone, groundFn, clearCone } from './helmetcam-3d.js';
import { alignTo, exitAlign, isAligned, isOpen } from './helmetcam.js';

const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'tr';
const pick = (v) => (v && typeof v === 'object' && 'tr' in v ? (v[lang] ?? v.tr) : v);
const DATA = new URL('../data/', import.meta.url).href;
const fmt = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const mm = () => window.__mm;
const NAVCAM_FOV = 45.4;   // yalnız dir yokken koni genişliği için; Navcam yatay görüş açısı (navcam_dirs.json'daki tüm karelerde 45,4°)

const S = { stops: null, dirs: {}, T: null, el: null, cur: null, ui: null, hiddenByAlign: false, loading: null };
const ready = () => (S.loading ??= (async () => {
  const [all, cur, dirs] = await Promise.all([loadTexts(), fetch(new URL('curiosity.json', DATA)).then((r) => r.json()), loadDirs(new URL('navcam_dirs.json', DATA).href).catch(() => ({}))]);
  S.T = Object.fromEntries(Object.entries(all.helmetcam ?? {}).map(([k, v]) => [k, pick(v)]));
  S.stops = cur.stops.map((s) => ({ ...s, url: new URL(s.photo, DATA).href })); S.dirs = dirs;
})().catch((e) => { console.warn('[stopcard-dir]', e); S.stops = []; }));

function ensureUi() {
  if (S.ui) return S.ui;
  const ui = document.createElement('div'); ui.className = 'mm-sd';
  ui.innerHTML = '<canvas width="56" height="56" style="position:absolute;left:10px;top:10px;pointer-events:none;background:rgba(14,10,8,.55);border-radius:50%"></canvas>' +
    '<div class="mm-sd-row" style="margin-top:5px;font-size:11px;line-height:1.35"><div class="mm-sd-label" style="color:#ffd9b8"></div>' +
    '<span class="mm-sd-btn" role="button" tabindex="0" style="display:inline-block;margin-top:3px;padding:2px 8px;border:1px solid #ffb27a;border-radius:5px;cursor:pointer;color:#ffd9b8"></span></div>';
  S.el.append(ui); S.ui = ui;
  const go = () => void toggleAlign();
  ui.querySelector('.mm-sd-btn').onclick = (e) => { e.stopPropagation(); go(); };
  ui.querySelector('.mm-sd-btn').onkeydown = (e) => { if (e.code === 'Enter' || e.code === 'Space') { e.stopPropagation(); e.preventDefault(); go(); } };
  return ui;
}
function drawCompass(cv, d) {
  const g = cv.getContext('2d'), R = 24, cx = 28, cy = 28, rad = (a) => ((a - 90) * Math.PI) / 180, fov = d.fov_deg ?? NAVCAM_FOV;
  g.clearRect(0, 0, 56, 56); g.strokeStyle = 'rgba(243,227,211,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  g.fillStyle = 'rgba(255,178,122,.45)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, rad(d.az_deg - fov / 2), rad(d.az_deg + fov / 2)); g.closePath(); g.fill();
  g.strokeStyle = '#ffd9b8'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(rad(d.az_deg)) * R, cy + Math.sin(rad(d.az_deg)) * R); g.stroke();
  g.fillStyle = '#f3e3d3'; g.font = '9px system-ui'; g.textAlign = 'center'; g.fillText(lang === 'en' ? 'N' : 'K', cx, 9);
}

async function refresh() {
  await ready(); const el = S.el; if (!S.stops?.length || !el) return;
  if (el.hidden) { if (!isAligned() && !isOpen()) clearCone(); S.cur = null; if (S.ui) S.ui.hidden = true; return; }
  const img = el.querySelector('img'), stop = S.stops.find((s) => img.src === s.url);
  if (!stop) { S.cur = null; if (S.ui) S.ui.hidden = true; return; }
  const d = dirFor(stop, S.dirs); S.cur = d ? { stop, d } : null;
  const ui = ensureUi(); ui.hidden = !d; if (!d) return;
  const T = S.T, cv = ui.querySelector('canvas'); drawCompass(cv, d);
  ui.querySelector('.mm-sd-label').textContent = fmt(T.dir_label_short, { az: Math.round(d.az_deg), card: cardinal(d.az_deg, lang === 'en') });
  const btn = ui.querySelector('.mm-sd-btn'); btn.hidden = !d.exact; btn.textContent = T.btn_align;
  const m = mm(), w = pxToWorld(m.geo, stop.px[0], stop.px[1]);
  if (!isOpen() && m?.T?.scene && m.nav) showCone({ scene: m.T.scene, heightAt: groundFn(m), x: w[0], z: w[1], azDeg: d.az_deg, fovDeg: d.fov_deg ?? NAVCAM_FOV });
}

async function toggleAlign() {
  if (isAligned()) { exitAlign(); return; }
  await ready(); const c = S.cur; if (!c || !c.d.exact || isOpen()) return;
  const m = mm(), w = pxToWorld(m.geo, c.stop.px[0], c.stop.px[1]);
  S.el.style.visibility = 'hidden';   // kart hizalama katmanının üstünde kalmasın (z-index 2050)
  await alignTo({ world: w, dir: c.d, url: c.stop.url, sol: c.stop.sol, stopId: c.stop.id, onExit: () => { S.el.style.visibility = ''; void refresh(); } });
}

function init() {
  const el = document.getElementById('stop-photo'); if (!el) return;
  S.el = el; const run = () => void refresh();
  new MutationObserver(run).observe(el, { attributes: true, attributeFilter: ['hidden', 'class'] });
  new MutationObserver(run).observe(el.querySelector('img'), { attributes: true, attributeFilter: ['src'] });
  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyV' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || isOpen()) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? '')) return;
    if (!isAligned() && (el.hidden || !S.cur?.d.exact)) return;
    e.stopImmediatePropagation(); e.preventDefault(); void toggleAlign();
  }, true);
  window.__stopcardDir = { state: S, refresh };
}
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', init); else init();
