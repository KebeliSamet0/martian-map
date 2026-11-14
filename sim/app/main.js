// Martian Map — sim: gerçek HiRISE DTM + renkli ortofoto üzerinde harita → iki nokta → en kısa yol → birinci şahıs yürüyüş.
import * as THREE from 'three';
import { Geo } from './geo.js';
import { Terrain } from './terrain.js';
import { Sky } from './sky.js';
import { Rocks } from './rocks.js';
import { RocksRich } from './rocks_rich.js';
import { Nav } from './nav.js';
import { SYNTH, SCAN, SCAN_E, SCAN_T, SCAN_TEX, SCAN_DIM, MICRO } from './detail.js';
import { MissionMap as MapView } from './wire-map.js';
import { initWire } from './wire.js';
import { initExtras } from './wire-extras.js';
import { applyScanClasses } from './wire-scan.js';
import { API_BASE, API_OFF } from './api.js';
import { worldToPx, adaptRoute, GRID } from './api.js';
import { RouteLine, Beacon, HazardDisc, WarnMarkers } from './routeline.js';
import { createAstronaut } from './astronaut.js';
import { initFx } from './fx.js';
import { initAudio } from './audio.js';
import './bilim.js'; // tur4:bilim

const BASE = './data/tiles';
const Q = new URLSearchParams(location.search);
const quality = Q.get('q') || 'high';
MICRO.value = Q.get('ground') === 'rich' && Q.get('micro') !== '0' ? 1 : 0;   // ?ground=rich: tas serpintisi + mikro rolyef
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const EYE = 1.75;   // skafandrlı astronot göz yüksekliği (varsayım)

let toastTimer;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4200); }

const man = await (await fetch(`${BASE}/manifest.json`)).json();
// Denetlenmiş gerçek parametreler (sim/data/params.json ← docs/data/real_params.json; bkz. tools/export_params.py). Yoksa varsayılanlara düşer ve etiketlenir.
const params = await fetch('./data/params.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
const pv = (name, dflt) => params?.params?.[name]?.value ?? dflt;
const SUN0 = { el: pv('B.ESP_019698_1750.solar_elevation', 38), az: pv('B.ESP_019698_1750.solar_azimuth_north_clockwise', 235), real: !!params };
const SUIT_V = pv('A.apache_test_speed', 0.67056);   // m/s: NASA APACHE, Mark III skafandr, Mars yerçekimi simülasyonu, N=1 (slayt 23)
let timeScale = 4;                                    // gösterim hızlandırması (gerçek skafandr hızı ×1)
$('sun-el').value = SUN0.el; $('sun-az').value = SUN0.az;
$('sun-src').textContent = SUN0.real
  ? `Varsayılan = HiRISE ESP_019698_1750 çekim güneşi (yükseklik ${SUN0.el.toFixed(1)}°, kuzeyden ${SUN0.az.toFixed(1)}°; PDS etiketi). Ortofotodaki gölgeler bu yöne aittir.`
  : 'Güneş varsayılanı kaynaksız (params.json yüklenemedi).';
const geo = new Geo(man);
const nav = await Nav.load(BASE, man, geo);
nav.suitSpeed = SUIT_V;
$('status').textContent = `HiRISE DTM ${man.W}×${man.H} @ ${man.res_p.toFixed(3)} m · ${(geo.sizeX / 1000).toFixed(1)}×${(geo.sizeZ / 1000).toFixed(1)} km · USGS/NASA`;

let mapView, wire;
let paused = false;
function onRouteChange(r) {
  $('btn-routes').disabled = !r; $('btn-walk').disabled = !r; $('btn-json').disabled = !r;
  $('route-info').hidden = !r;
  if (!r) return;
  const t = r.total;
  $('route-stats').innerHTML =
    `<div><b>${t.km.toFixed(2)} km</b><span>mesafe</span></div><div><b>${t.min_suit} dk</b><span>skafandr ref. ${SUIT_V.toFixed(2)} m/s</span></div>` +
    `<div><b>${t.slope_max}°</b><span>maks. eğim</span></div><div><b>+${t.ascent_m} / −${t.descent_m} m</b><span>tırmanış / iniş</span></div>`;
  const sh = [r.start.shift_m > 1 ? `A ${r.start.shift_m} m` : '', r.goal.shift_m > 1 ? `B ${r.goal.shift_m} m` : ''].filter(Boolean).join(', ');
  $('route-shift').textContent = sh ? `⚠ ${sh} kaydırıldı (işaretlenen nokta DTM NoData boşluğundaydı; en yakın geçerli hücre kullanıldı).` : '';
  if (r.source === 'api') {
    $('route-note').title = 'Rota planlayıcı API üzerinden (/route). Süre, kcal, zemin sınıfı ve güven planlayıcı modelidir (varsayımlar /assumptions; doğrulanmamış).';
    $('route-note').textContent = `PLANLAYICI API · ${t.status} · ${t.min} dk · ${t.kcal} kcal · O₂ ${t.o2_L} L · ${r.segments.length} segment · ${r.computeMs} ms · ızgara 2 m`;
  } else {
    $('route-note').title = `Dünya yürüyüşü (Tobler): ${t.min} dk. Skafandr hızı NASA APACHE (Mark III, Mars yerçekimi simülasyonu, tek katılımcı, 1,5 mph); eğim etkisi Mars için doğrulanmadı.`;
    $('route-note').textContent = `YEDEK yerel A* (${r.fallbackWhy || 'API yok'}) · Tobler (Dünya yürüyüşü): ${t.min} dk · ${r.segments.length} segment · hesap ${r.computeMs} ms (${r.expanded.toLocaleString('tr')} düğüm) · zemin sınıfı, kalori ve radyasyon yok`;
  }
  const c = $('profile'), g = c.getContext('2d'), ys = r.heights.map((v) => (v == null ? NaN : v)), n = ys.length;
  const lo = Math.min(...ys.filter((v) => !isNaN(v))), hi = Math.max(...ys.filter((v) => !isNaN(v)));
  g.clearRect(0, 0, c.width, c.height); g.strokeStyle = '#ffb27a'; g.lineWidth = 2; g.beginPath();
  ys.forEach((v, i) => { const x = (i / (n - 1)) * c.width, y = c.height - 6 - ((v - lo) / ((hi - lo) || 1)) * (c.height - 14); i ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.stroke(); g.fillStyle = '#f3e3d3'; g.font = '11px system-ui'; g.fillText(`${Math.round(hi + geo.zref)} m`, 4, 11); g.fillText(`${Math.round(lo + geo.zref)} m`, 4, c.height - 8);
}
mapView = new MapView($('map'), { man, geo, nav, base: BASE, toast, onChange: onRouteChange, params });
$('mode').onchange = () => mapView.setOptions({ mode: $('mode').value });
$('maxslope').oninput = () => { $('maxslope-v').textContent = $('maxslope').value + '°'; };
$('maxslope').onchange = () => mapView.setOptions({ maxSlope: Number($('maxslope').value) });
$('btn-reset').onclick = () => mapView.reset();
$('btn-json').onclick = () => {
  const blob = new Blob([JSON.stringify(mapView.routeJSON(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'route.json'; a.click();
};
$('btn-walk').onclick = () => enter3D('auto');
$('btn-free').onclick = () => enter3D('walk');
$('btn-map').onclick = () => enterMap();

// ===================== 3B =====================
let T = null;      // üç boyut durumu (ilk girişte kurulur)
const P = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
let state = 'map';  // map | auto | walk | fly
const keys = new Set();
let view = Q.get('view') === 'fps' ? 'fps' : 'tps';   // 3. şahıs (varsayılan) | fps; T tuşu değiştirir
let aSpeed = 0, aLastX = null, aLastZ = null;
// Terrain Scanner (L): çevreye dalga yayılır, zemin eğime göre mavi (≤10°) / sarı (10–20°) / kırmızı (≥20°) boyanır; birkaç sn kalıp söner
// Süreler/yarıçap TASARIM ayarıdır (docs/data/ekip/rehberlik/terrain_scanner.md §5): 0,8 sn yayılma + 4,2 sn tutma + 1 sn solma; 1 sn bekleme; DS'nin sayısal değeri kaynakta yok
const scanner = { t0: -1, x: 0, z: 0, R: 90, ramp: 0.8, hold: 4.2, fade: 1.6, cool: 1.0 };
function ensureScanTex() {
  if (SCAN_TEX.value) return;
  const sg = nav.slopeGrid(), n = nav.w * nav.h, d = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { const v = sg[i]; if (Number.isNaN(v)) { d[i * 4 + 1] = 0; } else { d[i * 4] = Math.min(255, Math.round((v / 64) * 255)); d[i * 4 + 1] = 255; } d[i * 4 + 3] = 255; }
  const tx = new THREE.DataTexture(d, nav.w, nav.h, THREE.RGBAFormat); tx.magFilter = THREE.LinearFilter; tx.minFilter = THREE.LinearFilter; tx.needsUpdate = true;
  SCAN_TEX.value = tx; SCAN_DIM.value.set(nav.w * nav.cx, nav.h * nav.cz);
}
function scanStart(wide = false) {
  audio?.alert('scan');
  const nowS = performance.now() / 1000; if (scanner.t0 >= 0 && nowS - scanner.t0 < scanner.cool) return;   // bekleme
  scanner.fix = null; ensureScanTex(); scanner.R = wide ? 220 : 90; scanner.t0 = performance.now() / 1000; scanner.x = P.x; scanner.z = P.z; $('scanleg').hidden = false; toast(wide ? 'Geniş tarama (220 m) — rota parlar' : `Arazi tarayıcı: ${scanner.source ?? 'eğim yedeği'} · renkler ve çizgiler için lejant. Shift+L: geniş`); }
function scanUpdate(now) {
  if (scanner.t0 < 0) { SCAN.value.w = 0; SCAN_E.value = 0; return; }
  const e = scanner.fix ?? (now - scanner.t0), { R, ramp, hold, fade } = scanner, e0 = ramp + hold, Rmax = R + 8;
  const front = Math.min(R, (e / ramp) * R), erase = e < e0 ? 0 : Math.min(Rmax, ((e - e0) / fade) * Rmax);
  SCAN.value.set(scanner.x, scanner.z, front, 1); SCAN_E.value = erase; SCAN_T.value = e;
  if (T) T.line.mat.color.setScalar(1 + 0.9 * (e < e0 ? 1 : Math.max(0, 1 - (e - e0) / fade)));   // tarama sırasında planlanan rota parlar ('rotada kal' ipucu)
  if (e > e0 + fade) { scanner.t0 = -1; SCAN.value.w = 0; SCAN_E.value = 0; $('scanleg').hidden = true; if (T) T.line.mat.color.setScalar(1); }
}
let routeRun = null, lastLook = 0, hudHidden = false, bobOn = false;   // baş sallanması varsayılan KAPALI (görüntü kararlılığı)

function initThree() {
  if (T) return T;
  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const maxRatio = Math.min(devicePixelRatio, quality === 'high' || quality === 'ultra' ? 1.25 : 1);
  renderer.setPixelRatio(maxRatio);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = quality !== 'low'; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const sky = new Sky(scene);
  const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.25, 30000);
  camera.rotation.order = 'YXZ';
  const hemi = new THREE.HemisphereLight(0xc29a78, 0x4a2e1e, 0.8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0de, 3.6);
  sun.castShadow = quality !== 'low';
  const smap = quality === 'ultra' ? 4096 : 2048;
  sun.shadow.mapSize.set(smap, smap);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.35;
  scene.add(sun, sun.target);
  const terrain = new Terrain(scene, man, geo, { base: BASE, shadows: quality !== 'low', anisotropy: renderer.capabilities.getMaxAnisotropy(), splitFactor: quality === 'ultra' ? 1.0 : quality === 'low' ? 0.45 : 0.65, renderer });
  const rocks = Q.get('ground') === 'rich' ? new RocksRich(scene, terrain, { shadows: quality !== 'low' }) : new Rocks(scene, terrain, { shadows: quality !== 'low', max: quality === 'ultra' ? 4000 : 2200, radius: quality === 'ultra' ? 110 : 80 });
  rocks.userOff = pure || !$('rocks-on').checked;
  T = { renderer, scene, sky, camera, hemi, sun, terrain, rocks, sunEl: Number($('sun-el').value), sunAz: Number($('sun-az').value), shadowExtent: 0, shadowMap: smap,
    ratio: maxRatio, maxRatio, ft: 0, lastAdapt: 0, adaptive: !Q.get('fixedres'), budget: 1 / (Number(Q.get('fps')) || 60), cpuMax: 0 };
  const gY = (x, z) => groundY(x, z);
  T.line = new RouteLine(scene, gY); T.oldLine = new RouteLine(scene, gY, { gray: true, opacity: 0.55, width: 1.1 }); T.beacon = new Beacon(scene, gY); T.hazard = new HazardDisc(scene, gY); T.warns = new WarnMarkers(scene, gY);
  T.astro = createAstronaut({ marsGravity: true, castShadow: quality !== 'low', receiveShadow: quality !== 'low' }); T.astro.group.visible = false; scene.add(T.astro.group);
  T.extrasReady = initExtras({ scene, terrain, geo, groundY: gY }).then(extras => { T.extras = extras; }).catch(e => toast(`Katman yüklenemedi: ${e.message}`));
  applySun();
  const ov = new Image(); ov.src = `${BASE}/${man.overview.file}`; T.overview = ov;
  // Ard işlem (fx.js): ?fx=off ile kapatılır; P tuşu aç/kapa; saf veri modunda kapalı
  T.fx = Q.get('fx') === 'off' ? null : initFx(renderer, scene, camera, { quality, ao: Q.get('ao') === '1' || quality === 'ultra' });
  renderer.info.autoReset = false;
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); T.fx?.setSize(innerWidth, innerHeight, renderer.getPixelRatio()); });
  renderer.setAnimationLoop(frame);
  return T;
}

function applySun() {
  const k = T.sky.setSun(T.sunEl, T.sunAz);
  T.sun.intensity = 3.6 * k; T.hemi.intensity = 0.3 + 0.55 * k;
}
$('sun-el').oninput = () => { if (T) { T.sunEl = Number($('sun-el').value); applySun(); } };
$('sun-az').oninput = () => { if (T) { T.sunAz = Number($('sun-az').value); applySun(); } };
$('exp').oninput = () => { if (T) T.renderer.toneMappingExposure = Number($('exp').value); };
// Saf veri modu: sentetik taş, çakıl/regolit, dik yamaç dokusu ve baş sallaması kapanır (yalnız DTM + ortofoto + aydınlatma kalır)
let pure = false, fxOn = true;
const audio = Q.get('ses') === 'off' ? null : initAudio();   // skafandr içi ses (prosedürel); N: aç/kapa
let auX = null, auZ = null;
function applyPure() {
  SYNTH.value = pure ? 0 : 1;
  $('pure').checked = pure; $('rocks-on').disabled = pure;
  if (T) T.rocks.userOff = pure || !$('rocks-on').checked;
  if (pure) bobOn = false;
}
$('rocks-on').onchange = () => { if (T) T.rocks.userOff = pure || !$('rocks-on').checked; };
$('pure').onchange = () => { pure = $('pure').checked; applyPure(); toast(pure ? 'SAF VERİ modu: yalnız DTM + ortofoto, sentetik ayrıntı yok' : 'Sentetik görünüm ayrıntısı açık'); };

function groundY(x, z) {
  const y = T.terrain.heightAt(x, z);
  if (y != null) return y;
  const v = nav.heightAt(x, z);
  return isNaN(v) ? null : v;
}

function enter3D(kind) {
  paused = false; keys.clear(); initThree();
  $('mapwrap').hidden = true; $('gl').hidden = false; $('hud').hidden = hudHidden; $('ctl').hidden = false; $('mini').hidden = false; $('hint').hidden = false;
  const r = mapView.route;
  if (kind === 'auto' && r) {
    const cum = [0]; for (let i = 1; i < r.dense.length; i++) cum.push(cum[i - 1] + Math.hypot(r.dense[i][0] - r.dense[i - 1][0], r.dense[i][1] - r.dense[i - 1][1]));
    routeRun = { r, cum, total: cum[cum.length - 1], s: 0, speed: SUIT_V };
    P.x = r.dense[0][0]; P.z = r.dense[0][1];
    P.yaw = Math.atan2(r.dense[Math.min(4, r.dense.length - 1)][0] - r.dense[0][0], -(r.dense[Math.min(4, r.dense.length - 1)][1] - r.dense[0][1])); P.pitch = view === 'tps' ? -0.22 : -0.05;
    state = 'auto';
  } else {
    routeRun = null;
    const a = mapView.a?.world || [geo.sizeX / 2, geo.sizeZ / 2];
    const c = nav.nearestValid(...nav.cellOf(...a), 400) || [0, 0];
    P.x = (c[0] + 0.5) * nav.cx; P.z = (c[1] + 0.5) * nav.cz; P.yaw = 0; P.pitch = -0.1; state = 'walk';
  }
  T.oldLine.clear(); T.hazard.hide();
  if (r) { T.line.set(r.dense, r.segments); T.beacon.set(...r.dense[r.dense.length - 1]); T.warns.set(r.dense, r.segments); } else { T.line.clear(); T.beacon.hide(); T.warns.clear(); }
  T.extras?.close(); wire?.start(r, P); wire?.setVisible(!hudHidden);
  const gy = groundY(P.x, P.z); P.y = (gy ?? 0) + EYE; T.snap = true;
  toast(state === 'auto' ? 'Rota yürüyüşü başladı. Fareyle etrafa bak, W/A/S/D ile rotadan çık (R: rotaya dön).' : 'Serbest yürüyüş: W/A/S/D, Shift koş, F uçuş, M harita.');
}
function enterMap() {
  if (document.pointerLockElement) document.exitPointerLock();
  T?.extras?.close(); wire?.stop(); paused = false; keys.clear();
  state = 'map'; $('mapwrap').hidden = false; $('gl').hidden = true; $('hud').hidden = true; $('ctl').hidden = true; $('mini').hidden = true; $('hint').hidden = true;
  mapView.map.invalidateSize();
  if (T) T.renderer.setAnimationLoop(null);
  if (T) T.renderer.setAnimationLoop(frame);
}

// Girdi
addEventListener('keydown', (e) => {
  if (state === 'map' || paused || e.target.tagName === 'INPUT') return;
  keys.add(e.code);
  if (e.code === 'KeyM') enterMap();
  if (e.code === 'KeyL') scanStart(e.shiftKey);
  if (e.code === 'KeyT') { view = view === 'tps' ? 'fps' : 'tps'; toast(view === 'tps' ? '3. şahıs görünüm (T: birinci şahıs)' : 'Birinci şahıs görünüm (T: 3. şahıs)'); }
  if (e.code === 'KeyF') { state = state === 'fly' ? 'walk' : 'fly'; toast(state === 'fly' ? 'Serbest uçuş (Space/C yukarı-aşağı)' : 'Yürüyüş'); }
  if (e.code === 'KeyR' && routeRun) { state = 'auto'; }
  if (e.code === 'KeyK') { $('rocks-on').checked = !$('rocks-on').checked; T.rocks.userOff = pure || !$('rocks-on').checked; }
  if (e.code === 'KeyH') { hudHidden = !hudHidden; $('hud').hidden = hudHidden; wire?.setVisible(!hudHidden); }
  if (e.code === 'KeyB' && !pure) { bobOn = !bobOn; toast(bobOn ? 'Baş sallanması açık' : 'Baş sallanması kapalı'); }
  if (e.code === 'KeyP' && T?.fx) { fxOn = !fxOn; toast(fxOn ? 'Ard işlem açık (bloom, ortam gölgesi, kenar yumuşatma, gren)' : 'Ard işlem kapalı'); }
  if (e.code === 'KeyN' && audio) { audio.setEnabled(!audio.enabled); toast(audio.enabled ? 'Ses açık (skafandr içi: nefes, adım, fan, telsiz)' : 'Ses kapalı'); }
  if (e.code === 'KeyV') { pure = !pure; applyPure(); toast(pure ? 'SAF VERİ modu: yalnız DTM + ortofoto, sentetik ayrıntı yok' : 'Sentetik görünüm ayrıntısı açık'); }
  if (e.code === 'BracketRight') { timeScale = Math.min(40, timeScale * 1.5); toast(`Hız ×${timeScale.toFixed(1)} (×1 = ${SUIT_V.toFixed(2)} m/s skafandr referansı)`); }
  if (e.code === 'BracketLeft') { timeScale = Math.max(1, timeScale / 1.5); toast(`Hız ×${timeScale.toFixed(1)} (×1 = ${SUIT_V.toFixed(2)} m/s skafandr referansı)`); }
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code) && state === 'auto') state = 'walk';
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
$('gl').addEventListener('click', () => { if (!document.pointerLockElement) $('gl').requestPointerLock?.(); });
let dragging = false;
$('gl').addEventListener('pointerdown', () => { dragging = true; });
addEventListener('pointerup', () => { dragging = false; });
addEventListener('mousemove', (e) => {
  if (state === 'map') return;
  if (document.pointerLockElement === $('gl') || dragging) {
    P.yaw += e.movementX * 0.0022; P.pitch = clamp(P.pitch - e.movementY * 0.0022, -1.45, 1.45); lastLook = performance.now();
  }
});

// Rotadan sapma uyarısı (histerezis: >8 m uyar, <4 m kaldır); yalnız serbest yürüyüşte
let offRoute = false, devT = 0;
function deviationCheck(now) {
  if (now - devT < 200) return; devT = now;
  const w = $('warn');
  if (!routeRun || state === 'auto' || state === 'map') { if (offRoute) { offRoute = false; w.hidden = true; } return; }
  let best = Infinity; for (const p of routeRun.r.dense) { const d = Math.hypot(p[0] - P.x, p[1] - P.z); if (d < best) best = d; }
  if (!offRoute && best > 8) offRoute = true; else if (offRoute && best < 4) offRoute = false;
  w.hidden = !offRoute; if (offRoute) w.textContent = `Rotadan saptın (${Math.round(best)} m) — R: rotaya dön`;
}

async function fireReplan(S) {
  const R = routeRun; if (!R || R.r.source !== 'api') { toast('API yok: kum uyarısı gösterildi, yerel rotaya devam.'); return; }
  const oldGeneration = R;
  T.hazard.set(S.world[0], S.world[1], S.radius_m);
  audio?.alert('sand');
  toast('⚠ Kum tespit edildi (kırmızı bölge) — rota yeniden planlanıyor (POST /replan)…');
  try {
    const cur = worldToPx(geo, P.x, P.z).map(Math.floor).map((v) => clamp(v, 0, GRID.w - 1));
    const t0 = performance.now();
    const res = await wire.call('/replan', { start: cur, goal: R.r.goalPx, observations: [{ px: S.px, radius_m: S.radius_m, cls: 'sand' }], ...(wire.selected?.limits ? { budget: wire.selected.limits } : {}) });
    if (routeRun !== oldGeneration || state === 'map') return;
    const rt = res.routes.find((x) => x.kind === R.r.kind) || res.routes[0];
    const nr = adaptRoute(rt, { geo, nav, suitSpeed: SUIT_V, kind: R.r.kind }); nr.goalPx = R.r.goalPx; nr.startPx = cur; nr.start = R.r.start; nr.goal = R.r.goal; nr.computeMs = Math.round(performance.now() - t0);
    const cum = [0]; for (let i = 1; i < nr.dense.length; i++) cum.push(cum[i - 1] + Math.hypot(nr.dense[i][0] - nr.dense[i - 1][0], nr.dense[i][1] - nr.dense[i - 1][1]));
    const oldLeft = (R.total - R.s) / 1000;
    T.oldLine.set(R.r.dense, R.r.segments); T.line.set(nr.dense, nr.segments); T.warns.set(nr.dense, nr.segments);
    routeRun = { r: nr, cum, total: cum[cum.length - 1], s: 0, speed: SUIT_V, replanned: true, prev: { km: R.r.total.km, min: R.r.total.min } };
    wire?.setRoute(nr);
    toast(`Yeni rota (${nr.computeMs} ms): ${nr.total.km} km · ${nr.total.min} dk · ${nr.total.status} — eski kalan ${oldLeft.toFixed(2)} km (gri). Kum bölgesi kaçınıldı.`);
  } catch (e) { toast(`Yeniden planlama başarısız (${e.message}) — mevcut rotaya devam edilir.`); }
}

function stepPlayer(dt, t) {
  let moving = false;
  if (state === 'auto' && routeRun) {
    const R = routeRun; R.s = Math.min(R.total, R.s + R.speed * timeScale * dt);
    let i = 1; while (i < R.cum.length - 1 && R.cum[i] < R.s) i++;
    const u = (R.s - R.cum[i - 1]) / ((R.cum[i] - R.cum[i - 1]) || 1), a = R.r.dense[i - 1], b = R.r.dense[i];
    P.x = a[0] + (b[0] - a[0]) * u; P.z = a[1] + (b[1] - a[1]) * u;
    const j = Math.min(R.cum.length - 1, i + 7), h = R.r.dense[j];
    if (performance.now() - lastLook > 2500) {
      let d = Math.atan2(h[0] - P.x, -(h[1] - P.z)) - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      const step = d * Math.min(1, dt * 1.6), lim = dt * 0.7;          // yumuşak takip + en çok ~40°/sn dönüş: rota köşelerinde sarsıntı yok
      P.yaw += Math.max(-lim, Math.min(lim, step));
    }
    moving = R.s < R.total;
    if (!moving && !R.done) { R.done = true; audio?.alert('arrive'); toast('Hedefe ulaşıldı. M: haritaya dön.'); }
  } else {
    const run = keys.has('ShiftLeft') || keys.has('ShiftRight');
    let sp = state === 'fly' ? (run ? 260 : 50) : SUIT_V * timeScale * (run ? 2.5 : 1);
    const f = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0), r = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
    if (f || r) {
      const sl = state === 'fly' ? 0 : T.terrain.slopeDegAt(P.x, P.z) ?? 0;
      sp *= state === 'fly' ? 1 : clamp(1 - sl / 48, 0.2, 1);
      const cp = state === 'fly' ? Math.cos(P.pitch) : 1;
      let vx = Math.sin(P.yaw) * f * cp + Math.cos(P.yaw) * r, vz = -Math.cos(P.yaw) * f * cp + Math.sin(P.yaw) * r;
      const n = Math.hypot(vx, vz) || 1; P.x += (vx / n) * sp * dt; P.z += (vz / n) * sp * dt;
      if (state === 'fly') P.y += Math.sin(P.pitch) * f * sp * dt;
      moving = true;
    }
    if (state === 'fly') { if (keys.has('Space')) P.y += sp * dt; if (keys.has('KeyC')) P.y -= sp * dt; }
  }
  P.x = clamp(P.x, 1, geo.sizeX - 1); P.z = clamp(P.z, 1, geo.sizeZ - 1);
  const gy = groundY(P.x, P.z);
  if (gy != null) {
    if (state === 'fly') P.y = Math.max(P.y, gy + 2);
    else {   // kritik sönümlü takip: daha ince arazi döşemesi gelince zemin yüksekliği değişse de kamera sıçramaz
      const target = gy + EYE; P.y += (target - P.y) * (T.snap ? 1 : 1 - Math.exp(-dt * 7)); T.snap = false;
    }
  }
  const tps = view === 'tps' && state !== 'fly' && gy != null;
  T.astro.group.visible = tps;
  if (tps) {
    // Astronot hızı (animasyon için): gerçek yer değiştirmeden
    const sp = aLastX == null ? 0 : Math.hypot(P.x - aLastX, P.z - aLastZ) / Math.max(1e-3, dt); aLastX = P.x; aLastZ = P.z;
    aSpeed += (Math.min(sp, 8) - aSpeed) * (1 - Math.exp(-dt * 10));
    const foot = P.y - EYE;   // P.y zaten sönümlü zemin + göz yüksekliği
    T.astro.group.position.set(P.x, foot, P.z); T.astro.group.rotation.y = Math.PI - P.yaw;   // model +Z'ye bakar; sim ileri = (sin yaw, −cos yaw)
    T.astro.update(dt, aSpeed, true);
    // 3. şahıs yörünge kamerası: hedef = astronotun omuz hizası; fareyle yaw/pitch ile dönülür, arazi içine girmez
    const D = 5.2, cp = Math.cos(P.pitch), tgt = [P.x, foot + 1.35, P.z];
    let cx = tgt[0] - Math.sin(P.yaw) * cp * D, cy = tgt[1] - Math.sin(P.pitch) * D, cz = tgt[2] + Math.cos(P.yaw) * cp * D;
    const cg = groundY(cx, cz); if (cg != null) cy = Math.max(cy, cg + 0.6);
    T.camera.position.set(cx, cy, cz); T.camera.lookAt(tgt[0], tgt[1], tgt[2]);
  } else {
    aLastX = null;
    const bob = bobOn && state !== 'fly' && moving ? Math.sin(t * 7.2) * 0.035 : 0;
    T.camera.position.set(P.x, P.y + bob, P.z);
    T.camera.rotation.set(P.pitch, -P.yaw, 0);
  }
  return gy;
}

let lastT = performance.now(), hudT = 0, miniT = 0, fpsAcc = 0, fpsN = 0, fps = 0;
function frame(now) {
  if (state === 'map' || !T) return;
  const c0 = performance.now();
  const rdt = (now - lastT) / 1000, dt = Math.min(0.05, rdt); lastT = now;   // gerçek kare süresi ölçülür, simülasyon adımı sınırlanır
  T.ft = T.ft ? T.ft * 0.92 + rdt * 0.08 : rdt; fps = 1 / T.ft;
  // Dinamik çözünürlük: kare süresi sürekli yüksekse çözünürlük düşer, boşta artar → FPS kararlı kalır
  if (T.adaptive && now - T.lastAdapt > 1200) {
    T.lastAdapt = now;
    let r = T.ratio;
    if (T.ft > T.budget * 1.15) r = Math.max(0.55, r * 0.9); else if (T.ft < T.budget * 0.7 && r < T.maxRatio) r = Math.min(T.maxRatio, r * 1.05);
    if (Math.abs(r - T.ratio) > 0.005) { T.ratio = r; T.renderer.setPixelRatio(r); T.renderer.setSize(innerWidth, innerHeight, false); T.fx?.setSize(innerWidth, innerHeight, r); }
  }
  const gy = paused ? groundY(P.x, P.z) : stepPlayer(dt, now / 1000);
  if (audio) {   // ses: gerçek yer değiştirmeden hız; efor eğim ve hızdan (görsel/işitsel sunum, tüketim modeli değil)
    const d = auX == null ? 0 : Math.hypot(P.x - auX, P.z - auZ); auX = P.x; auZ = P.z;
    const sp = d / Math.max(1e-3, dt), sl = state === 'fly' ? 0 : (T.terrain.slopeDegAt(P.x, P.z) ?? 0), mv = !paused && state !== 'fly' && sp > 0.05 && sp < 30;
    audio.update(dt, { speed: sp, moving: mv, effort: mv ? clamp(0.3 + sl / 28, 0, 1) : 0.12, surface: sl > 18 ? 'bedrock' : 'soil' });
  }
  if (!paused) wire?.update(dt * timeScale, P);
  if (!paused) T.extras?.update(P);
  deviationCheck(now); scanUpdate(now / 1000);
  T.terrain.update(T.camera.position);
  if (window.__trace) window.__trace.push({ dt: rdt, y: P.y, gy, yaw: P.yaw, pitch: P.pitch, x: P.x, z: P.z, swaps: T.terrain.swaps, loading: T.terrain.stats.loading, built: T.terrain.builtLast || 0 });
  const nearGround = gy != null && P.y - gy < 80;
  T.rocks.setEnabled(nearGround && !T.rocks.userOff);
  T.rocks.update(T.camera.position, T.terrain.version);
  T.line.update(dt, T.terrain.version); T.oldLine.update(dt, T.terrain.version); T.beacon.update(now / 1000);
  // Gölge kamerası oyuncuyu izler; merkez IŞIK UZAYINDA gölge-haritası texel'ine yakalanır (dünya eksenine yakalamak gölgeyi titretirdi)
  const ext = state === 'fly' ? 420 : 130;
  if (T.shadowExtent !== ext) { const c = T.sun.shadow.camera; c.left = c.bottom = -ext; c.right = c.top = ext; c.near = 10; c.far = 1400; c.updateProjectionMatrix(); T.shadowExtent = ext; }
  const lz = T.sky.sunDir.clone().normalize(), lx = new THREE.Vector3(0, 1, 0).cross(lz).normalize(), ly = lz.clone().cross(lx), texel = (2 * ext) / T.shadowMap;
  const ctr = new THREE.Vector3(P.x, gy ?? P.y, P.z), sx = Math.round(ctr.dot(lx) / texel) * texel, sy = Math.round(ctr.dot(ly) / texel) * texel;
  const tgt = lx.clone().multiplyScalar(sx).addScaledVector(ly, sy).addScaledVector(lz, Math.round(ctr.dot(lz)));
  T.sun.target.position.copy(tgt);
  T.sun.position.copy(tgt).addScaledVector(lz, 600);
  T.sun.target.updateMatrixWorld();
  T.sky.follow(T.camera);
  const logic = performance.now() - c0;   // render() HARİÇ JS süresi (arazi/taş/gölge mantığı)
  T.renderer.info.reset();   // ard işlem birden çok geçiş çizer; üçgen sayacı kare başına bir kez sıfırlanır
  if (T.fx && fxOn && !pure) T.fx.render(dt); else T.renderer.render(T.scene, T.camera);
  T.cpuMax = Math.max(T.cpuMax * 0.98, logic);
  if (now - hudT > 250) { hudT = now; hud(gy, now); }
  if (now - miniT > 150) { miniT = now; minimap(); }
}

function hud(gy, now) {
  if (hudHidden) return;
  const [lon, lat] = geo.worldToLonlat(P.x, P.z), sl = T.terrain.slopeDegAt(P.x, P.z);
  const s = T.terrain.stats;
  let route = '';
  if (routeRun) {
    const rem = routeRun.total - routeRun.s, eta = (rem / SUIT_V) / 60;
    const ci = routeRun.cum.findIndex((c) => c >= routeRun.s), seg = ci < 0 ? null : routeRun.r.segments?.find((g) => g.idx && ci >= g.idx[0] && ci <= g.idx[1]);
    const segTxt = seg?.slope_max == null ? '' : `<div class="r"><span title="Rota rengi segmentteki EN DİK hücreye göre (HiRISE DTM, 2 m). Yeşil <5°, kırmızı ≥20°. Segment 40–70 m; tek dik hücre tüm segmenti boyar.">Rota rengi</span><b>maks ${seg.slope_max}° · ort ${seg.slope_mean ?? '—'}°</b></div>`;   // gerçek zamanlı skafandr referans hızıyla kalan süre
    route = `<div class="r"><span>Rota</span><b>${(routeRun.s / 1000).toFixed(2)} / ${(routeRun.total / 1000).toFixed(2)} km</b></div><div class="r"><span>Kalan</span><b>${Math.round(rem)} m · ${eta.toFixed(0)} dk</b></div>` + segTxt;
  }
  const head = ((P.yaw * 180) / Math.PI + 360) % 360, dirs = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  $('hud').innerHTML =
    `<div class="r"><span>Mod</span><b>${state === 'auto' ? 'Rota yürüyüşü' : state === 'fly' ? 'Serbest uçuş' : 'Yürüyüş'}${state === 'fly' ? '' : ' ×' + timeScale.toFixed(1)}</b></div>` +
    (state === 'fly' ? '' : `<div class="tiny">×1 = ${SUIT_V.toFixed(2)} m/s (NASA APACHE skafandr, N=1); ×${timeScale.toFixed(1)} hızlandırılmış gösterim</div>`) +
    `<div class="r"><span>Konum</span><b>${lat.toFixed(5)}°, ${lon.toFixed(5)}°</b></div>` +
    `<div class="r"><span>Yükseklik</span><b>${gy == null ? '—' : (gy + geo.zref).toFixed(1) + ' m'} (areoid)</b></div>` +
    `<div class="r"><span>Eğim</span><b>${sl == null ? '—' : sl.toFixed(1) + '°'}</b></div>` +
    (pure ? '<div class="tiny" style="color:#7ee787">SAF VERİ: yalnız HiRISE DTM + ortofoto (taş/regolit/yamaç dokusu yok)</div>'
      : sl != null && sl >= 35 ? '<div class="tiny" style="color:#ffb27a">≥35° yamaç: doku kısmen PROSEDÜREL (ortofoto yerine); gerçek görüntü değil</div>' : '') +
    `<div class="r"><span>Yön</span><b>${Math.round(head)}° ${dirs[Math.round(head / 45) % 8]}</b></div>` + route +
    `<div class="tiny">${fps.toFixed(0)} FPS · çözünürlük ×${T.ratio.toFixed(2)}${T.adaptive ? ' (oto)' : ''} · ${(T.renderer.info.render.triangles / 1000).toFixed(0)}k üçgen · JS ≤${T.cpuMax.toFixed(0)} ms · döşeme ${s.active}/${s.ready}${s.loading ? ' · yükleniyor ' + s.loading : ''} · taş/zemin ayrıntısı: ${pure ? 'kapalı' : 'sentetik'}</div>`;
}

function minimap() {
  const c = $('mini'), g = c.getContext('2d'), ov = T.overview;
  if (!ov.complete) return;
  const w = c.width = 210, h = c.height = Math.round(210 * geo.sizeZ / geo.sizeX);
  g.drawImage(ov, 0, 0, w, h);
  const sx = w / geo.sizeX, sz = h / geo.sizeZ;
  if (routeRun) { g.strokeStyle = '#00e5ff'; g.lineWidth = 2; g.beginPath(); routeRun.r.dense.forEach((p, i) => (i ? g.lineTo(p[0] * sx, p[1] * sz) : g.moveTo(p[0] * sx, p[1] * sz))); g.stroke(); }
  g.save(); g.translate(P.x * sx, P.z * sz); g.rotate(P.yaw); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, -8); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill(); g.stroke(); g.restore();
}

wire = await initWire({ map: mapView, geo, manifest: man, enter3D, enterMap, pause: value => { paused = value; keys.clear(); }, replan: fireReplan, toast });

ensureScanTex();
scanner.source = 'yalnız eğim';
if (!API_OFF && wire.grid.aux_layers?.includes('scan_class')) {
  try {
    const response = await fetch(`${API_BASE}/layers/scan_class.bin?dtype=uint8`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`scan_class ${response.status}`);
    applyScanClasses(SCAN_TEX.value.image.data, nav, wire.coords, wire.grid, new Uint8Array(await response.arrayBuffer()));
    SCAN_TEX.value.needsUpdate = true; scanner.source = 'API scan_class (alan dışında eğim)';
  } catch { toast('Tarayıcı sınıfı alınamadı; eğim yedeği kullanılıyor.'); }
}
const legend = $('scanleg'); legend.replaceChildren();
for (const [key, mark, color] of [['caution','═','#ff8a1f'], ['nogo','≡','#ff2a1a']]) {   // tarayıcı v2: yalnız tehlikeli bölgeler
  const span = document.createElement('span'); span.style.color = color; span.textContent = `${mark} ${wire.texts.scan[key]}  `; legend.append(span);
}
legend.append(document.createTextNode(` · ${scanner.source}`));
legend.title = 'API sınıfları model tahminidir; alan dışında 10°/20° eğim yedeği. İşaretin sönmesi güvenli demek değildir.';

// ?perf=1: 30 sn FPS/performans ölçüm probu (sim/tools/qa/perf_probe.js; gerçek GPU'da demo cihazında çalıştır)
if (Q.get('perf')) { const s = document.createElement('script'); s.src = './tools/qa/perf_probe.js'; document.body.append(s); }

// Test/otomasyon kancası
window.__mm = {
  man, geo, nav, get mapView() { return mapView; }, get T() { return T; }, P,
  enter3D, enterMap, get wire() { return wire; }, get routeRun() { return routeRun; },
  setTimeScale(value) { timeScale = clamp(value, 1, 2000); },
  teleport(x, z, yaw = 0, pitch = -0.1, st = 'walk', heightAbove) {
    if (!T) enter3D('walk');
    state = st; P.x = x; P.z = z; P.yaw = yaw; P.pitch = pitch; routeRun = st === 'auto' ? routeRun : null;
    const gy = groundY(x, z); P.y = (gy ?? 0) + (heightAbove ?? EYE); T.snap = true;
  },
  setProgress(f) { if (routeRun) { routeRun.s = clamp(f, 0, 1) * routeRun.total; T.snap = true; } },
  stats: () => ({ ...T.terrain.stats, fps, state, paused, scannerSource: scanner.source }),
  scan: (w) => { scanStart(!!w); },
  scanAt: (e) => { scanner.fix = e; },   // test: tarama zamanını sabitle
};
if (Q.get('mod') === '3d') enter3D('walk');

addEventListener('corridor:stop', () => audio?.alert('stop'));
