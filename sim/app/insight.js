// Modelin etkisini görünür kılar: ayak altı zemin okuması, segment "neden" metni, model güveni (belirsizlik sisi) katmanı.
// Tüm sayılar API'den gelir (/layers/terrain_u8.bin ← p_*.npy, entropy.npy; segment insight alanı ← /compare, /route).
// Zemin sınıfı ve güven model TAHMİNİDİR, ölçüm değildir; metinler texts.json "insight" anahtarlarındadır.
export const CLASSES = ['soil', 'bedrock', 'sand', 'bigrock'];
export const UNCERTAIN_BELOW = 0.4;   // güven bu değerin altındaysa "belirsiz" (route.CONF_LOW=0.6 entropi ⇒ güven 0.4 ile aynı eşik)

const fmt = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const pct = (v) => Math.round(v * 100);

/** /layers/terrain_u8.bin → { w, h, data(Uint8Array, hücre başına 5 bayt), provisional } */
export async function loadTerrainField(apiBase, grid = { w: 1000, h: 1000 }, fetcher = fetch) {
  const r = await fetcher(`${apiBase}/layers/terrain_u8.bin`);
  if (!r.ok) throw new Error(`terrain_u8 ${r.status}`);
  const data = new Uint8Array(await r.arrayBuffer());
  if (data.length !== grid.w * grid.h * 5) throw new Error(`terrain_u8 boyutu beklenenden farklı (${data.length})`);
  return { w: grid.w, h: grid.h, data, provisional: r.headers.get('x-provisional') === 'true' };
}

/** Sürekli ızgara px [x,y] → hücre örneği (ızgara dışı null). Olasılıklar ve güven 0-1. */
export function sampleField(field, px) {
  const x = Math.floor(px[0]), y = Math.floor(px[1]);
  if (!field || !(x >= 0 && y >= 0 && x < field.w && y < field.h)) return null;
  const i = (y * field.w + x) * 5, d = field.data;
  const p = { soil: d[i] / 255, bedrock: d[i + 1] / 255, sand: d[i + 2] / 255, bigrock: d[i + 3] / 255 };
  const dominant = CLASSES.reduce((a, c) => (p[c] > p[a] ? c : a), 'soil');
  const conf = d[i + 4] / 255;
  return { p, dominant, conf, uncertain: conf < UNCERTAIN_BELOW };
}

/** Ayak altı satırı metni ve parçaları. t: texts.json "insight" nesnesi. */
export function footReading(s, t, provisional = false) {
  if (!s) return null;
  const cls = t[`class_${s.dominant}`] ?? s.dominant;
  const body = fmt(t.foot_line, { sand: pct(s.p.sand), bedrock: pct(s.p.bedrock), soil: pct(s.p.soil), bigrock: pct(s.p.bigrock), conf: pct(s.conf) });
  return { label: t.foot_label, body, dominant: s.dominant, dominantText: cls, uncertain: s.uncertain,
    uncertainText: s.uncertain ? t.foot_uncertain : null, note: provisional ? t.foot_provisional : t.foot_source,
    text: `${t.foot_label}: ${body}${s.uncertain ? ' · ' + t.foot_uncertain : ''}` };
}

/** Segment "neden" cümlesi: sınıf (p) → zemin katsayısı → ek kcal (+ reddedilen alternatif). */
export function segmentWhy(seg, t) {
  const ins = seg?.insight;
  if (!ins) return seg?.reason ?? '';
  const p = ins.p ?? {}, cls = seg.class, extra = ins.extra_kcal;
  const vars = { id: seg.id, cls: t[`class_${cls}`] ?? cls, p: (p[cls] ?? 0).toFixed(1), eta: ins.eta_mean.toFixed(2),
    extra: `${extra >= 0 ? '+' : '−'}${Math.abs(extra).toFixed(extra >= 10 ? 0 : 1)}` };
  const strong = ins.eta_mean >= 1.15 || Math.abs(extra) >= 5;
  const parts = [fmt(strong ? t.seg_line : t.seg_line_flat, vars)];
  if (ins.confidence < UNCERTAIN_BELOW) parts.push(fmt(t.seg_conf_low, { conf: pct(ins.confidence) }));
  if (seg.rejected_alt) parts.push(fmt(t.seg_alt, { alt: seg.rejected_alt.replace(/\.$/, '') }));
  return parts.join('; ') + '.';
}

/** Segment kimliği → rota üzerinde ilerleme indeksine denk gelen segment (nav rotası: seg.idx = dense aralığı). */
export function segmentAt(route, denseIndex) {
  return route?.segments?.find((g) => g.idx && denseIndex >= g.idx[0] && denseIndex <= g.idx[1]) ?? null;
}

/** Düşük güvenli alanları soluk/sisli gösteren RGBA (Uint8ClampedArray, w*h*4). alpha ∝ (1 − güven); güven yüksekse saydam. */
export function fogRGBA(field, { maxAlpha = 190, color = [214, 196, 178] } = {}) {
  const n = field.w * field.h, out = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const c = field.data[i * 5 + 4] / 255, a = Math.max(0, (UNCERTAIN_BELOW + 0.2 - c) / (UNCERTAIN_BELOW + 0.2));   // güven ≥0,6 tamamen saydam
    out[i * 4] = color[0]; out[i * 4 + 1] = color[1]; out[i * 4 + 2] = color[2]; out[i * 4 + 3] = Math.round(Math.min(1, a) * maxAlpha);
  }
  return out;
}

/** Haritaya (Leaflet) güven katmanı: imageOverlay ızgara kutusuna oturur. boundsLatLng: [[s,w],[n,e]]. */
export function fogCanvas(field, opts) {
  const c = document.createElement('canvas'); c.width = field.w; c.height = field.h;
  const g = c.getContext('2d'); g.putImageData(new ImageData(fogRGBA(field, opts), field.w, field.h), 0, 0);
  return c;
}

/** THREE için (3B): izgara boyutunda DataTexture; arazi gölgelendiricisi gorsel/akış desk'inde bağlanır. */
export function fogTexture(THREE, field, opts) {
  const tx = new THREE.DataTexture(new Uint8Array(fogRGBA(field, opts).buffer), field.w, field.h, THREE.RGBAFormat);
  tx.magFilter = tx.minFilter = THREE.LinearFilter; tx.needsUpdate = true; return tx;
}

/**
 * Ayak altı satırı bileşeni. Kullanım:
 *   const foot = await createFootReader({ apiBase, texts: texts.insight, parent: document.body });
 *   her karede/250 ms'de: foot.update(gridPx);  zemin sınıfı değişince satır kısa süre vurgulanır.
 */
export async function createFootReader({ apiBase, texts, parent = document.body, grid, fetcher } = {}) {
  const field = await loadTerrainField(apiBase, grid, fetcher);
  const el = document.createElement('div');
  el.className = 'mm-foot'; el.hidden = true; el.setAttribute('role', 'status');
  el.title = texts.foot_source;
  Object.assign(el.style, { position: 'fixed', left: '50%', bottom: '46px', transform: 'translateX(-50%)', padding: '6px 12px', borderRadius: '8px',
    background: 'rgba(14,10,8,.72)', color: '#f3e3d3', font: '12px/1.3 system-ui', letterSpacing: '.02em', pointerEvents: 'none', zIndex: 20,
    border: '1px solid rgba(255,178,122,.25)', transition: 'box-shadow .25s, border-color .25s' });
  parent.append(el);
  let last = null, flashT = 0;
  return {
    field, el,
    update(px) {
      const s = sampleField(field, px), r = footReading(s, texts, field.provisional);
      if (!r) { el.hidden = true; return null; }
      el.hidden = false;
      el.textContent = r.text;
      el.style.color = r.uncertain ? '#d9c9b8' : '#f3e3d3';
      el.style.opacity = r.uncertain ? '.85' : '1';
      if (last && last !== r.dominant) {   // sınıf değişti → kısa vurgu
        el.style.borderColor = '#ffb27a'; el.style.boxShadow = '0 0 14px rgba(255,178,122,.55)';
        clearTimeout(flashT); flashT = setTimeout(() => { el.style.borderColor = 'rgba(255,178,122,.25)'; el.style.boxShadow = 'none'; }, 1400);
      }
      last = r.dominant; return r;
    },
    setVisible(on) { el.hidden = !on; },
    destroy() { clearTimeout(flashT); el.remove(); },
  };
}

/**
 * Gerçek yürüyüş günlüğü: oyuncunun rotada fiilen katettiği aralıklar (s0→s1, m) boyunca zemin sınıfı ve model güveni.
 * Sınıf ve güven model TAHMİNİDİR; metre ise rota ilerlemesinden gelir (örnekleme ≈ hücre boyu).
 *   const log = createWalkLog(field);  log.advance(dense, cum, s0, s1, toPx);  log.summary();
 * dense: [[x,z]...] dünya, cum: kümülatif uzunluk (m), toPx: ([x,z]) → ızgara px.
 */
export function createWalkLog(field, { step = 2 } = {}) {
  const byClass = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  let total = 0, outside = 0, confSum = 0, lowConf = 0, sandP = 0;
  const addPoint = (px, len) => {
    const s = sampleField(field, px);
    if (!s) { outside += len; return; }
    byClass[s.dominant] += len; total += len; confSum += s.conf * len; sandP += s.p.sand * len;
    if (s.uncertain) lowConf += len;
  };
  return {
    advance(dense, cum, s0, s1, toPx) {
      if (!(s1 > s0) || !dense?.length) return;
      for (let i = 1; i < dense.length; i++) {
        const a = Math.max(s0, cum[i - 1]), b = Math.min(s1, cum[i]);
        if (!(b > a)) continue;
        const span = (cum[i] - cum[i - 1]) || 1, n = Math.max(1, Math.round((b - a) / step)), len = (b - a) / n;
        for (let k = 0; k < n; k++) {
          const u = ((a + (k + 0.5) * len) - cum[i - 1]) / span;
          addPoint(toPx([dense[i - 1][0] + (dense[i][0] - dense[i - 1][0]) * u, dense[i - 1][1] + (dense[i][1] - dense[i - 1][1]) * u]), len);
        }
      }
    },
    summary() {
      return { total_m: total, outside_m: outside, by_class_m: { ...byClass }, mean_conf: total ? confSum / total : null,
        low_conf_m: lowConf, low_conf_frac: total ? lowConf / total : 0, mean_p_sand: total ? sandP / total : null };
    },
    reset() { CLASSES.forEach((c) => { byClass[c] = 0; }); total = outside = confSum = lowConf = sandP = 0; },
  };
}

/** Günlük özetini karne satırlarına çevirir. t: texts.json "insight" nesnesi (walk_* anahtarları). */
export function walkSummaryText(sum, t) {
  if (!sum || sum.total_m < 5) return null;
  const parts = CLASSES.map((c) => ({ c, m: sum.by_class_m[c], f: sum.by_class_m[c] / sum.total_m })).filter((x) => x.f >= 0.005).sort((a, b) => b.m - a.m);
  const mix = parts.map((x) => fmt(t.walk_class, { cls: t[`class_${x.c}`] ?? x.c, pct: pct(x.f), m: Math.round(x.m) })).join(' · ');
  return { mix, parts, conf: fmt(t.walk_conf, { conf: pct(sum.mean_conf), low: pct(sum.low_conf_frac), lowm: Math.round(sum.low_conf_m) }),
    total: fmt(t.walk_total, { m: Math.round(sum.total_m) }) };
}

/** Tek indirme: yürüyüş günlüğü, ayak altı okuyucu ve kask kamerası aynı zemin alanını kullanır. */
let _field = null;
export const sharedField = (apiBase, grid, fetcher) => (_field ??= loadTerrainField(apiBase, grid, fetcher).catch((e) => { _field = null; throw e; }));
