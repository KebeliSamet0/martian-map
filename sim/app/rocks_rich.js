// ZENGİN yakın plan taş serpintisi (?ground=rich): 4 ölçek sınıfı (çakıl / taş / levha / kaya), kümelenmiş (düşük frekanslı gürültü), eğime duyarlı,
// köşeli düşük poligon (Mars bazaltı gibi), kısmen gömülü. SENTETİK görsel katmandır — NASA verisi DEĞİL (tespit edilmiş gerçek kayalar hazards.js'te). K ile kapanır.
import * as THREE from 'three';
import { fetchLayerFloat32 } from './detail.js';
import { GRID, worldToPx } from './api.js';
import { blockersFromInstances } from './collide.js';   // batu:tas

function hash(a, b, s) {
  let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}
function vnoise(x, z, s) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(xi, zi, s), b = hash(xi + 1, zi, s), c = hash(xi, zi + 1, s), d = hash(xi + 1, zi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function rockGeometry(base, seed) {
  const g = base.index ? base.toNonIndexed() : base;
  const p = g.attributes.position, v = new THREE.Vector3(), seen = new Map();
  for (let i = 0; i < p.count; i++) {   // aynı köşe her yüzde aynı yer değiştirmeyi alır (yüzler ayrılmaz)
    v.fromBufferAttribute(p, i);
    const key = `${Math.round(v.x * 1e3)},${Math.round(v.y * 1e3)},${Math.round(v.z * 1e3)}`;
    if (!seen.has(key)) seen.set(key, 0.72 + 0.5 * hash(Math.round(v.x * 40) + seed, Math.round(v.y * 40 + v.z * 17), seed + 3));
    v.multiplyScalar(seen.get(key)); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const CLASSES = [
  { k: 'grit',    geo: () => rockGeometry(new THREE.OctahedronGeometry(1, 0), 5),     cell: 0.55, radius: 9, lo: 0.02, hi: 0.06, base: 0.6, cap: 2600, yScale: 0.6, shadow: false },
  { k: 'pebble',  geo: () => rockGeometry(new THREE.OctahedronGeometry(1, 1), 11),    cell: 1.1, radius: 22, lo: 0.03, hi: 0.085, base: 0.62, cap: 3000, yScale: 0.55, shadow: false },
  { k: 'cobble',  geo: () => rockGeometry(new THREE.IcosahedronGeometry(1, 1), 23),   cell: 2.4, radius: 55, lo: 0.07,  hi: 0.24, base: 0.34, cap: 1800, yScale: 0.70, shadow: true },
  { k: 'slab',    geo: () => rockGeometry(new THREE.DodecahedronGeometry(1, 0), 37),  cell: 5.5, radius: 90, lo: 0.20,  hi: 0.55, base: 0.20, cap: 300,  yScale: 0.36, shadow: true },
  { k: 'boulder', geo: () => rockGeometry(new THREE.IcosahedronGeometry(1, 1), 51),   cell: 9.0, radius: 140, lo: 0.45, hi: 1.15, base: 0.12, cap: 350,  yScale: 0.78, shadow: true },
];

// Yoğunluk çarpanı: rock_cfa (Bora; kaya kümülatif alan oranı, 0–1). Katman API'den (/layers/rock_cfa.bin) ya da layers/rock_cfa.npy'den gelir,
// 2 m px üzerinde kutu bulanıklaştırılır (yarıçap 4 px) ve yakın çevredeki SENTETİK çakıl serpintisinin olasılığını ölçekler. Yerleşim sentetik; yoğunluk gerçek katmandan.
function blurCfa(a, W, H, r) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H), k = 1 / (2 * r + 1);
  for (let y = 0; y < H; y++) { let acc = 0; for (let x = -r; x <= r; x++) acc += a[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { tmp[y * W + x] = acc * k; acc += a[y * W + Math.min(W - 1, x + r + 1)] - a[y * W + Math.max(0, x - r)]; } }
  for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { out[y * W + x] = acc * k; acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } }
  return out;
}

const QUALITY = { low: { cap: 0.35, rad: 0.55 }, med: { cap: 0.7, rad: 0.8 }, high: { cap: 1, rad: 1 }, ultra: { cap: 1.25, rad: 1.15 } };

export class RocksRich {
  constructor(scene, terrain, { shadows = true, quality = 'high' } = {}) {
    this.terrain = terrain; this.enabled = true; this.userOff = false;
    this.Qf = QUALITY[quality] || QUALITY.high;
    this.cfa = null; this.cfaStats = null;
    fetchLayerFloat32('rock_cfa').then((a) => {
      if (!a) return;
      this.cfa = blurCfa(a, GRID.w, GRID.h, 4);
      let mx = 0; for (let i = 0; i < this.cfa.length; i += 7) mx = Math.max(mx, this.cfa[i]);
      this.cfaStats = { max: mx }; this.last.set(1e9, 0, 1e9);   // yoğunluk geldi: serpintiyi yeniden üret
    }).catch(() => {});
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0.0, flatShading: true });
    this.layers = CLASSES.map((c) => {
      const cap = Math.round(c.cap * this.Qf.cap), mesh = new THREE.InstancedMesh(c.geo(), this.mat, cap);
      mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = shadows && c.shadow; mesh.receiveShadow = shadows;
      scene.add(mesh); return { ...c, cap, mesh };
    });
    this.last = new THREE.Vector3(1e9, 0, 1e9); this.lastVersion = -1; this.lastBuild = 0;
    this.blockers = []; this.blockersRev = 0;   // batu:tas: görünen büyük taşlar (slab/boulder/iri cobble) fiziksel engel
  }
  setEnabled(on) { if (on === this.enabled) return; this.enabled = on; for (const l of this.layers) l.mesh.visible = on; if (!on && this.blockers.length) { this.blockers = []; this.blockersRev++; } if (on) this.last.set(1e9, 0, 1e9); }
  update(cam, version = 0) {
    if (!this.enabled) return;
    const dx = cam.x - this.last.x, dz = cam.z - this.last.z, now = performance.now();
    const moved = dx * dx + dz * dz >= 16, terrainChanged = version !== this.lastVersion && now - this.lastBuild > 1500;
    if (!moved && !terrainChanged) return;
    this.lastVersion = version; this.lastBuild = now; this.last.copy(cam);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), pos = new THREE.Vector3(), col = new THREE.Color();
    const blockers = [];   // batu:tas
    for (let L = 0; L < this.layers.length; L++) {
      const { cell, radius: r0, lo, hi, base, cap, yScale, mesh } = this.layers[L], radius = r0 * this.Qf.rad, seed = 100 + L * 17, r2 = radius * radius;
      const i0 = Math.floor((cam.x - radius) / cell), i1 = Math.floor((cam.x + radius) / cell), j0 = Math.floor((cam.z - radius) / cell), j1 = Math.floor((cam.z + radius) / cell);
      let n = 0;
      for (let j = j0; j <= j1 && n < cap; j++) for (let i = i0; i <= i1 && n < cap; i++) {
        const cx = (i + 0.1 + 0.8 * hash(i, j, seed + 1)) * cell, cz = (j + 0.1 + 0.8 * hash(i, j, seed + 2)) * cell;
        const dd = (cx - cam.x) ** 2 + (cz - cam.z) ** 2;
        if (dd > r2 || dd < 2.5) continue;
        const y = this.terrain.heightAt(cx, cz); if (y == null) continue;
        const sl = this.terrain.slopeDegAt(cx, cz, 2); if (sl == null) continue;
        // kümelenme: büyük ölçekli + küçük ölçekli gürültü; taşlar kümeler halinde, aralar boş kum
        const cl = smooth(0.32, 0.78, vnoise(cx / 16, cz / 16, 7) * 0.62 + vnoise(cx / 4.5, cz / 4.5, 9) * 0.38);
        let dens = 1;
        if (this.cfa) {   // rock_cfa: kaya yoğun yerde serpinti sıklaşır, boş zeminde seyrekleşir
          const [px, py] = worldToPx(this.terrain.geo, cx, cz), ix = Math.round(px), iy = Math.round(py);
          if (ix >= 0 && iy >= 0 && ix < GRID.w && iy < GRID.h) dens = 0.45 + 5.5 * Math.sqrt(this.cfa[iy * GRID.w + ix]);
        }
        const p = base * dens * (0.25 + 1.5 * cl) * (0.55 + Math.min(1, sl / 24));
        if (hash(i, j, seed + 3) > p) continue;
        const fade = 1 - smooth(radius * 0.7, radius, Math.sqrt(dd));
        if (fade <= 0.03) continue;
        const u = hash(i, j, seed + 4), size = fade * (lo + (hi - lo) * Math.min(1, -Math.log(1 - 0.96 * u) / 3.2));
        if (this.keepClear?.(cx, cz, size)) continue;   // tur5:canli sentetik taş rota koridoruna konmaz (planlayıcı bu süs taşlarını bilmez)
        e.set(hash(i, j, seed + 5) * 6.28, hash(i, j, seed + 6) * 6.28, hash(i, j, seed + 8) * 6.28); q.setFromEuler(e);
        s.set(size * (0.8 + hash(i, j, seed + 9) * 0.6), size * yScale * (0.8 + hash(i, j, seed + 10) * 0.5), size * (0.8 + hash(i, j, seed + 11) * 0.6));
        pos.set(cx, y + size * (yScale * 0.5 - 0.35), cz);   // kısmen gömülü
        m.compose(pos, q, s); mesh.setMatrixAt(n, m);
        const t = 0.8 + hash(i, j, seed + 12) * 0.45, w = hash(i, j, seed + 13);   // koyu bazalt ↔ oksitlenmiş kırmızımsı
        col.setRGB((0.10 + 0.13 * w) * t, (0.075 + 0.06 * w) * t, (0.062 + 0.03 * w) * t); mesh.setColorAt(n, col);
        n++;
      }
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      blockersFromInstances(mesh.instanceMatrix.array, n, { out: blockers });   // batu:tas
    }
    this.blockers = blockers; this.blockersRev++;   // batu:tas
  }
}
