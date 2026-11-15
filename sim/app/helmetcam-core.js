// Kask kamerası mantığı (tur4:veri): saf işlevler, DOM yok, node ile test edilir.
// Veri: sim/data/navcam_manifest.json (layers/rover_stops.json'dan; 128 durak, gerçek Navcam dosya adları, Emre modelinin durak çıktısı).
// Model yorumu şablondur (texts.json "helmetcam"), sohbet modeli yok. Sınıf payları ve entropi model TAHMİNİDİR; kesinlik = 1 − entropi.
export const OPEN_RADIUS_M = 30;     // oyuncu bir durağa bu kadar yakınken kask kamerası açılır
export const WARN_SAND = 0.15;       // durakta kum bunun üstündeyse ileri uyarı
export const WARN_BIGROCK = 0.10;    // durakta büyük kaya bunun üstündeyse ileri uyarı
export const LOW_CERTAINTY = 0.4;    // kesinlik (1 − entropi) bunun altında: "model bu durakta kararsız" (insight.js UNCERTAIN_BELOW ile aynı)
const SHOW_MIN = 0.05;               // yorumda adı geçen en küçük sınıf payı
const CLASS_KEYS = ['bedrock', 'soil', 'sand', 'bigrock'];

const fmt = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const pct = (v) => Math.round(v * 100);

export async function loadManifest(url, fetcher = fetch) {
  const r = await fetcher(url);
  if (!r.ok) throw new Error(`navcam_manifest ${r.status}`);
  const d = await r.json();
  return d.stops.filter((s) => s.in_grid !== false);
}

/** px [x,y] → en yakın durak ve uzaklık (m). res = ızgara çözünürlüğü (m/px). */
export function nearestStop(stops, px, res = 2) {
  let best = null, bd = Infinity;
  for (const s of stops) { const d = Math.hypot(s.px[0] - px[0], s.px[1] - px[1]); if (d < bd) { bd = d; best = s; } }
  return best ? { stop: best, distM: bd * res } : null;
}

/** Oyuncu bir durağın açılış yarıçapındaysa o durak (yoksa null). */
export function stopAt(stops, px, res = 2, radiusM = OPEN_RADIUS_M) {
  const n = nearestStop(stops, px, res);
  return n && n.distM <= radiusM ? n : null;
}

export const certaintyOf = (stop) => Math.max(0, Math.min(1, 1 - stop.entropy));

/** Durak model çıktısı → şablon metni + uyarı. t: texts.json "helmetcam" nesnesi. */
export function modelReading(stop, t) {
  const f = stop.class_frac, cert = certaintyOf(stop), low = cert < LOW_CERTAINTY;
  const named = CLASS_KEYS.filter((k) => k !== 'sand' && f[k] >= SHOW_MIN).sort((a, b) => f[b] - f[a]);
  const list = named.map((k) => fmt(t.part, { pct: pct(f[k]), cls: t[`class_${k}`] })).join(', ') || t.class_none;
  const sandText = f.sand < 0.02 ? t.sand_none : fmt(t.sand_some, { pct: pct(f.sand) });
  const text = [fmt(t.comment, { list, sand: sandText }), low ? t.certain_low : t.certain_high].join(' ');
  const kinds = [];
  if (f.sand > WARN_SAND) kinds.push('sand');
  if (f.bigrock > WARN_BIGROCK) kinds.push('bigrock');
  return { text, certainty: cert, low, warn: kinds.length > 0, kinds,
    warnText: kinds.length ? fmt(t.warn, { what: kinds.map((k) => fmt(t.warn_part, { cls: t[`class_${k}`], pct: pct(f[k]) })).join(', ') }) : null,
    sandNote: f.sand < WARN_SAND ? t.sand_note : null };
}

/**
 * Rota üzerinde, oyuncunun ilerlemesinden sonra, durakta uyarılan zemine benzeyen ilk nokta (m ileride).
 * sample(px) → { p:{soil,bedrock,sand,bigrock}, conf } | null (insight.sampleField). "Benzer": o sınıfın olasılığı eşiğin üstünde.
 * Dönüş: { aheadM, kind } | null (ufukta yok).
 */
export function aheadSimilar({ dense, cum, s }, kinds, sample, toPx, { horizonM = 300, step = 4, fromM = 15, minP = { sand: 0.1, bigrock: 0.1 } } = {}) {   // fromM: durağın kendi çevresi sayılmaz
  if (!dense?.length || !kinds?.length) return null;
  for (let d = Math.max(step, fromM); d <= horizonM && s + d <= cum[cum.length - 1]; d += step) {
    let i = 1; while (i < cum.length - 1 && cum[i] < s + d) i++;
    const u = (s + d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), a = dense[i - 1], b = dense[i];
    const c = sample(toPx([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]));
    const hit = c && kinds.find((k) => c.p[k] >= minP[k]);
    if (hit) return { aheadM: d, kind: hit };
  }
  return null;
}

/** `mm:camera-insight` olay gövdesi (sözleşme): oyun mantığı bunu dinleyip karar verir; bu modül replan tetiklemez. */
export function cameraInsightDetail(stop, reading, extra = {}) {
  return { stopId: stop.stop_id, classFrac: { ...stop.class_frac }, entropy: stop.entropy, warn: reading.warn, ...extra };
}

/** Görüntü adayları: indirilen kareler (navcam_all). Arşivde olmayan/indirilmemiş kare arayüzde elenir. */
export function imageCandidates(stop, dataBase) {
  return stop.files.map((f) => ({ name: f.name, sol: f.sol, url: `${dataBase}navcam_all/${stop.stop_id}/${f.name}`,
    mask: `${dataBase}navcam_masks/${stop.stop_id}/${f.name.replace(/\.jpg$/i, '.png')}` }));
}

/** navcam_all hiç yoksa (indirme çalışmadıysa) repodaki yerel tek kare; yalnız manifestte local:true olan duraklar (23). */
export function localFallback(stop, dataBase) {
  return stop.local ? [{ name: `${stop.stop_id}.jpg`, sol: stop.sol, url: `${dataBase}navcam/${stop.stop_id}.jpg`, mask: null, local: true }] : [];
}

/** sim/data/navcam_dirs.json → { <görüntü adı>: {az_deg, el_deg, fov_deg, ...} } (az null = bilinmiyor). */
export async function loadDirs(url, fetcher = fetch) {
  const r = await fetcher(url); if (!r.ok) throw new Error(`navcam_dirs ${r.status}`);
  return (await r.json()).frames;
}

/** Yön geçerli mi (uydurma yok: az/el/fov hepsi sayı olmalı). */
export const hasDir = (d) => !!d && [d.az_deg, d.el_deg, d.fov_deg].every((v) => typeof v === 'number' && Number.isFinite(v));

const CARD = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'], CARD_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const cardinal = (az, en = false) => (en ? CARD_EN : CARD)[Math.round((((az % 360) + 360) % 360) / 45) % 8];

/** Görüş konisi: durağın (x,z) dünya noktasından az (kuzeyden saat yönü; sim: kuzey = −z, doğu = +x) yönünde FOV genişliğinde yelpaze. [[x,z],...] (ilk nokta merkez). */
export function fanPoints(x, z, azDeg, fovDeg, radius, steps = 24) {
  const pts = [[x, z]];
  for (let i = 0; i <= steps; i++) {
    const a = ((azDeg - fovDeg / 2 + (fovDeg * i) / steps) * Math.PI) / 180;
    pts.push([x + Math.sin(a) * radius, z - Math.cos(a) * radius]);
  }
  return pts;
}

/** Hizalama: kamera yaw/pitch (radyan) ve dikey fov — kare fotoğraf ekran yüksekliğini kaplar (aspect ≥ 1), bu yüzden dikey fov = fotoğraf fov'u. */
export function alignView(d) {
  return { yaw: (d.az_deg * Math.PI) / 180, pitch: (d.el_deg * Math.PI) / 180, fov: d.fov_deg };
}

/** Kartın gösterdiği durak için yön: { az_deg, el_deg, fov_deg, source, exact } (el/fov yoksa null; uydurma yok). */
export function dirFor(stop, dirs) {
  const frame = stop.photo_source ? stop.photo_source.split('/').pop().replace(/\.[^.]+$/, '') + '.jpg' : null, d = frame ? dirs[frame] : null;
  if (hasDir(d)) return { az_deg: d.az_deg, el_deg: d.el_deg, fov_deg: d.fov_deg, source: 'navcam_dirs', exact: true, diff: angDiff(d.az_deg, stop.photo_world_az_deg) };
  if (typeof stop.photo_world_az_deg === 'number') return { az_deg: stop.photo_world_az_deg, el_deg: null, fov_deg: null, source: 'curiosity.json', exact: false, diff: null };
  return null;
}
export const angDiff = (a, b) => (typeof a === 'number' && typeof b === 'number' ? ((a - b + 540) % 360) - 180 : null);

