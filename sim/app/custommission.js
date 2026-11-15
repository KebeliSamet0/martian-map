// Özel görev ("Kendi rotanı planla", #120): oyuncunun haritadan seçtiği A→B ile mission.js'in beklediği görev nesnesini üretir.
// Saf mantık (DOM yok): node --test ile sınanır. Hiçbir sayı uydurulmaz: eğim/katman değerleri planlayıcı katmanlarından (API),
// kum olayı yalnız rota gerçekten sim/data/sand_zones.json'daki bir kum adayının radius_m + 40 m yakınından geçiyorsa.

export const GRID_W = 1000, GRID_H = 1000, RES_M = 2;
export const IMPASSABLE_DEG = 20;          // planlayıcı SLOPE_NOGO_DEG: NASA EVA ConOps 20° skafandr sınırı (params.py)
export const SAND_TRIGGER_EXTRA_M = 40;    // #49: olay merkeze radius_m + 40 m yaklaşınca
export const MIN_STRAIGHT_M = 15;          // /route bundan kısa A–B'yi anlamsız sayar
export const SUIT_SPEED_MS = 0.67056;      // NASA APACHE benchmark hızı (N=1); yalnız TAHMİNİ süre için
export const DEFAULT_LIMITS = { time_min: 360, o2_L: 420, kcal: 2000, dose_uGy: 60 };   // S1 ile aynı varsayılan EVA bütçesi
export const O2_LIMITED_L = 80;            // 'Kısıtlı O₂ bütçesi (80 L)' (S3 bütçesi)

const isInt = (n) => Number.isInteger(n);
export const inGrid = ([c, r]) => isInt(c) && isInt(r) && c >= 0 && r >= 0 && c < GRID_W && r < GRID_H;

/** ?a=col,row&b=col,row → {a:[c,r], b:[c,r]} ya da null (eksik/geçersizse). */
export function parseAB(search) {
  const q = new URLSearchParams(search);
  const read = (k) => {
    const m = /^\s*(\d{1,4})\s*,\s*(\d{1,4})\s*$/.exec(q.get(k) ?? '');
    if (!m) return null;
    const p = [Number(m[1]), Number(m[2])];
    return inGrid(p) ? p : null;
  };
  const a = read('a'), b = read('b');
  return a && b ? { a, b, o2: q.get('o2') === '80' ? O2_LIMITED_L : null } : null;
}

/** Aynı görevi link ile açtıran URL parçası. */
export function shareQuery({ a, b, o2 }) {
  return `a=${a.join(',')}&b=${b.join(',')}${o2 === O2_LIMITED_L ? '&o2=80' : ''}`;   // virgül %2C'ye kodlanmaz: okunaklı bağlantı
}

export const straightMeters = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) * RES_M;
export const etaMinutes = (meters) => meters / SUIT_SPEED_MS / 60;

/**
 * Ana geçilebilir bölge maskesi (Uint8Array, 1 = ana bileşen): planlayıcı layers.py ile aynı kural, 8 komşulukla bağlı
 * geçilebilir (< IMPASSABLE_DEG) hücrelerin EN BÜYÜK bileşeni. Başlangıç ve hedef aynı bileşende değilse /route
 * "geçilebilir yol yok" (422) verir; küçük ayrık adalar bu yüzden hedef/öneri olamaz. Bir kez hesaplanır, önbelleğe alınır.
 */
const maskCache = new WeakMap();
export function mainComponentMask(slope) {
  if (maskCache.has(slope)) return maskCache.get(slope);
  const n = GRID_W * GRID_H, label = new Int32Array(n), stack = new Int32Array(n);
  let best = 0, bestSize = 0, next = 0;
  for (let i = 0; i < n; i++) {
    if (label[i] || !(slope[i] < IMPASSABLE_DEG)) continue;
    const id = ++next; let sp = 0, size = 0; stack[sp++] = i; label[i] = id;
    while (sp) {
      const j = stack[--sp]; size++;
      const c = j % GRID_W, r = (j - c) / GRID_W;
      for (let dr = -1; dr <= 1; dr++) {
        const rr = r + dr; if (rr < 0 || rr >= GRID_H) continue;
        for (let dc = -1; dc <= 1; dc++) {
          const cc = c + dc; if ((!dr && !dc) || cc < 0 || cc >= GRID_W) continue;
          const k = rr * GRID_W + cc;
          if (!label[k] && slope[k] < IMPASSABLE_DEG) { label[k] = id; stack[sp++] = k; }
        }
      }
    }
    if (size > bestSize) { bestSize = size; best = id; }
  }
  const mask = new Uint8Array(n); if (best) for (let i = 0; i < n; i++) if (label[i] === best) mask[i] = 1;
  maskCache.set(slope, mask); return mask;
}

/**
 * Hücre eğimi (derece) dizisinden (Float32Array, satır-sütun) bir hücrenin durumu.
 * mask verilirse (mainComponentMask): eğimi uygun ama ana bölgeye bağlı olmayan hücre ok:false, island:true döner.
 */
export function cellInfo(slope, [c, r], mask = null) {
  if (!slope || !inGrid([c, r])) return { ok: false, outside: true, slope: null };
  const s = slope[r * GRID_W + c];
  const flat = Number.isFinite(s) && s < IMPASSABLE_DEG;
  const island = !!mask && flat && !mask[r * GRID_W + c];
  return { ok: flat && !island, outside: false, slope: s, island };
}

/** En yakın geçilebilir (< IMPASSABLE_DEG) hücre (halka arama, ≤ maxCells hücre). mask verilirse yalnız ana bölgede. {px:[c,r], m} ya da null. */
export function nearestPassable(slope, [c, r], maxCells = 150, mask = null) {
  const ok = (cc, rr) => inGrid([cc, rr]) && slope[rr * GRID_W + cc] < IMPASSABLE_DEG && (!mask || mask[rr * GRID_W + cc] === 1);
  if (ok(c, r)) return { px: [c, r], m: 0 };
  let best = null;
  for (let d = 1; d <= maxCells; d++) {
    if (best && d > Math.ceil(best.d) + 1) break;        // daha uzak halkada daha yakın hücre çıkamaz
    for (let dc = -d; dc <= d; dc++) for (let dr = -d; dr <= d; dr++) {
      if (Math.max(Math.abs(dc), Math.abs(dr)) !== d) continue;
      if (ok(c + dc, r + dr)) { const dist = Math.hypot(dc, dr); if (!best || dist < best.d) best = { px: [c + dc, r + dr], d: dist }; }
    }
  }
  return best ? { px: best.px, m: Math.round(best.d * RES_M) } : null;
}

/** Görev nesnesi (S1'in biçimi). sand başta yok: rota seçilince sandForRoute ile belirlenir. */
export function buildCustomMission({ a, b, o2 = null, title = 'Özel görev' }) {
  if (!inGrid(a) || !inGrid(b)) throw new RangeError('A/B ızgara dışında');
  if (straightMeters(a, b) < MIN_STRAIGHT_M) throw new RangeError('A ve B çok yakın');
  const limits = { ...DEFAULT_LIMITS, ...(o2 ? { o2_L: o2 } : {}) };
  return { id: 'CUSTOM', custom: true, title, start_px: [...a], goal_px: [...b], limits, sample_kg: 8, difficulty: o2 ? 'zor' : 'orta',
    goal: { grid_px: [...b], radius_m: 5.0 }, events: [], share: shareQuery({ a, b, o2 }) };
}

/**
 * Rota (dünya koordinatı noktaları [[x,z]...]) bir kum adayının radius_m+40 m yakınından geçiyorsa o adayı döndürür:
 * {id, px (TAM SAYI hücre: /replan Pixel tam sayı ister), radius_m, min_dist_m, threshold_m}; yoksa null (UYDURMA OLAY YOK).
 * zones: sand_zones.json; toWorld: px → dünya [x,z] (coords.pxToWorld).
 */
export function sandForRoute(dense, zones, toWorld) {
  if (!dense?.length || !zones?.length) return null;
  let best = null;
  for (const z of zones) {
    const w = toWorld(z.px), thr = z.radius_m + SAND_TRIGGER_EXTRA_M;
    let min = Infinity;
    for (let i = 0; i < dense.length; i++) {
      const p = dense[i], q = dense[Math.min(i + 1, dense.length - 1)];
      const dx = q[0] - p[0], dz = q[1] - p[1], d2 = dx * dx + dz * dz;
      const t = d2 ? Math.max(0, Math.min(1, ((w[0] - p[0]) * dx + (w[1] - p[1]) * dz) / d2)) : 0;
      min = Math.min(min, Math.hypot(w[0] - p[0] - t * dx, w[1] - p[1] - t * dz));
    }
    if (min <= thr && (!best || min - thr < best.min_dist_m - best.threshold_m)) best = { id: z.id, px: z.px.map(Math.floor), radius_m: z.radius_m, min_dist_m: Math.round(min), threshold_m: thr };
  }
  return best;
}
