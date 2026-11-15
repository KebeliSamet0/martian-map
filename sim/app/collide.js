// collide.js — gerçek (HiRISE tespitli) kayalar fiziksel engel (tur4:fizik).
// Veri: sim/data/rocks.json (kind: rock | outcrop | shadow). Yalnız rock ve outcrop engeldir; shadow gölge yöntemi artığıdır, engel değildir.
// Sentetik çakıl (rocks_rich.js) ve sentetik taşlar (rocks.js) engel DEĞİLDİR: yalnız görsel.
// Yarıçap hazards.js'in çizdiğiyle uyumlu (okundu, değiştirilmedi):
//   rock:    çizim ölçeği d/2 × (0,85–1,25), köşe sapması ort. ~0,93 → ortalama çizilen yarıçap ≈ d/2
//   outcrop: yayvan elips, yarı eksenler d/2 ve d/2 × (0,55–0,90) → ortalama ≈ 0,86 · d/2 (daire ile yaklaşık)
// Olay: window 'mm:rock-contact' {id, d_m, kind} (kaya başına en çok 2 sn'de bir).
// api.js tarayıcıya bağlı (location); yalnız initCollide içinde tembel yüklenir, çekirdek düğümde test edilebilir.

export const PLAYER_R = 0.35;          // astronot gövde yarıçapı (m): VARSAYIM
const CELL = 8;                        // hash hücresi (m); en büyük kaya ~10 m çap
const OUTCROP_K = 0.86;                // yüzlek ortalama yarıçap çarpanı (yukarıdaki türetme)
const SUBSTEP = 0.2;                   // tek adımda bu kadardan uzun hareket parçalanır (kayanın içinden "tünel" olmasın)
const CONTACT_COOLDOWN_MS = 2000;
export const BLOCKING = new Set(['rock', 'outcrop']);

/** Çizilen yarıçap (m). `kind` yoksa rock sayılır (hazards.js ile aynı). */
export function drawnRadius(rk) { return (rk.d_m / 2) * (rk.kind === 'outcrop' ? OUTCROP_K : 1); }

/** items: [{id, x, z, d_m, kind}] dünya koordinatında. shadow ve bilinmeyen türler elenir. */
export function createCollider(items, { now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()), emit = null } = {}) {
  const list = [];
  const grid = new Map();
  const key = (i, j) => i * 73856093 ^ j * 19349663;
  for (const it of items) {
    const kind = it.kind ?? 'rock';
    if (!BLOCKING.has(kind)) continue;
    const r = drawnRadius({ d_m: it.d_m, kind });
    const rk = { id: it.id, x: it.x, z: it.z, r, d_m: it.d_m, kind, last: -1e9 };
    list.push(rk);
    const i0 = Math.floor((rk.x - r - 1) / CELL), i1 = Math.floor((rk.x + r + 1) / CELL), j0 = Math.floor((rk.z - r - 1) / CELL), j1 = Math.floor((rk.z + r + 1) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = key(i, j); (grid.get(k) ?? grid.set(k, []).get(k)).push(rk); }
  }
  const near = (x, z) => grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) ?? [];

  /** (x,z) noktasını yarıçap `radius` olan astronot için kayalardan dışarı iter; temas edilen kayaları döndürür. */
  function push(p, radius, hits) {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const rk of near(p.x, p.z)) {
        const dx = p.x - rk.x, dz = p.z - rk.z, min = rk.r + radius, d2 = dx * dx + dz * dz;
        if (d2 >= min * min) continue;
        const d = Math.sqrt(d2);
        if (d < 1e-6) { p.x = rk.x + min; moved = true; } else { p.x = rk.x + (dx / d) * min; p.z = rk.z + (dz / d) * min; moved = true; }
        hits.add(rk);
      }
      if (!moved) break;
    }
  }

  /** prev → next hareketi: kayaya girmez, yüzeyi boyunca kayar. prev/next: {x,z} ya da [x,z]. Dönüş {x, z, hit} (hit: temas edilen kaya ya da null). */
  function resolve(prev, next, radius = PLAYER_R) {
    const px = prev.x ?? prev[0], pz = prev.z ?? prev[1], nx = next.x ?? next[0], nz = next.z ?? next[1];
    const dist = Math.hypot(nx - px, nz - pz), n = Math.max(1, Math.ceil(dist / SUBSTEP));
    const p = { x: px, z: pz }, hits = new Set();
    for (let s = 1; s <= n; s++) { p.x = px + ((nx - px) * s) / n; p.z = pz + ((nz - pz) * s) / n; push(p, radius, hits); }
    // Alt adım sürüklenmesinde son nokta hedefe göre kayadan çıkmış olmalı (kayma tamamlandı)
    let hit = null;
    for (const rk of hits) { hit = rk; break; }
    return { x: p.x, z: p.z, hit };
  }

  /** resolve + temas olayı (soğuma süreli). */
  function step(prev, next, radius = PLAYER_R) {
    const r = resolve(prev, next, radius);
    if (r.hit && emit) {
      const t = now();
      if (t - r.hit.last > CONTACT_COOLDOWN_MS) { r.hit.last = t; emit('mm:rock-contact', { id: r.hit.id, d_m: r.hit.d_m, kind: r.hit.kind }); }
    }
    return r;
  }

  /** Verilen konum bir kayanın içinde mi (yarıçap payı ile)? Rota denetimi için. */
  function inside(x, z, radius = 0) { for (const rk of near(x, z)) if (Math.hypot(x - rk.x, z - rk.z) < rk.r + radius) return rk; return null; }

  /** Dünya xz noktasına en yakın engel kayanın yüzeyine uzaklık (m) ve kaya; yoksa null (yakın tarama için). */
  function nearest(x, z, within = 12) {
    let best = null, bd = within;
    const i0 = Math.floor((x - within) / CELL), i1 = Math.floor((x + within) / CELL), j0 = Math.floor((z - within) / CELL), j1 = Math.floor((z + within) / CELL);
    const seen = new Set();
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const rk of grid.get(key(i, j)) ?? []) {
      if (seen.has(rk)) continue; seen.add(rk);
      const d = Math.hypot(x - rk.x, z - rk.z) - rk.r;
      if (d < bd) { bd = Math.max(0, d); best = rk; }
    }
    return best ? { rock: best, dist: bd } : null;
  }

  return { count: list.length, rocks: list, resolve, step, inside, nearest };
}

/** rocks.json (px) → dünya öğeleri. pxToWorld: api.js'ten. */
export function rocksToItems(rocks, geo, pxToWorld) {
  return rocks.map((r, i) => { const [x, z] = pxToWorld(geo, r.px[0], r.px[1]); return { id: i, x, z, d_m: r.d_m, kind: r.kind }; });
}

/** Tarayıcıda: rocks.json'u yükle, çarpıştırıcıyı kur. Veri yoksa null (çarpışma kapalı, oyun bozulmaz). */
export async function initCollide(geo, onContact = null) {
  try {
    const r = await fetch(new URL('../data/rocks.json', import.meta.url));
    if (!r.ok) throw new Error('rocks.json ' + r.status);
    const { pxToWorld } = await import('./api.js');
    const c = createCollider(rocksToItems(await r.json(), geo, pxToWorld), { emit: (name, detail) => { window.dispatchEvent(new CustomEvent(name, { detail })); onContact?.(detail); } });
    return c;
  } catch (e) { console.warn('[collide] kayalar yüklenemedi, çarpışma kapalı:', e); return null; }
}
