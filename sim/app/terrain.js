// LOD'lu (quadtree) arazi: döşemeler kameraya göre yüklenir. Her düğüm 128×128 hücre (129×129 köşe) + renkli doku (L0: 512 px).
// Seviye k hücre boyutu = res·2^k. Çatlakları gizlemek için kenar eteği (skirt) kullanılır.
// Kararlılık: LOD histerezisi (bölme/birleştirme eşikleri farklı), kare başına mesh üretim bütçesi, geçişte ebeveyn görünür kalır.
import * as THREE from 'three';
import { patchMaterial, ensureDetail } from './detail.js';

const N = 129, S = 131;   // köşe sayısı, taşma+kenarlı pencere genişliği
const BUILD_BUDGET_MS = 4;  // kare başına mesh üretimi için süre bütçesi (en az 1 döşeme)

export class Terrain {
  constructor(scene, man, geo, { base = './data/tiles', maxLoads = 8, splitFactor = 2.3, cacheMax = 420, shadows = true, anisotropy = 4, renderer = null } = {}) {
    this.renderer = renderer;
    this.scene = scene; this.man = man; this.geo = geo; this.base = base;
    this.K = man.levels - 1;
    this.have = man.level_meta.map((m) => { const s = new Map(); for (const [cx, cy, t] of m.chunks) s.set(cx + '_' + cy, t); return s; });
    this.nodes = new Map();
    this.group = new THREE.Group(); scene.add(this.group);
    this.maxLoads = maxLoads; this.splitFactor = splitFactor; this.cacheMax = cacheMax; this.shadows = shadows; this.anisotropy = anisotropy;
    this.loading = 0; this.queue = []; this.pending = []; this.frame = 0; this.active = new Set(); this.version = 0; this.swaps = 0; this.builtLast = 0;
    this.texLoader = new THREE.TextureLoader();
    this.stats = { ready: 0, active: 0, loading: 0 };
    ensureDetail(Math.min(8, anisotropy * 2), this.geo);
  }
  cell(k) { const f = 2 ** k; return [this.geo.resX * f, this.geo.resZ * f]; }
  size(k) { const [a, b] = this.cell(k); return [a * 128, b * 128]; }
  has(k, cx, cy) { return this.have[k].has(cx + '_' + cy); }

  node(k, cx, cy) {
    const key = k + '/' + cx + '/' + cy;
    let n = this.nodes.get(key);
    if (!n) {
      const [sx, sz] = this.size(k);
      n = { key, k, cx, cy, state: 'idle', x0: cx * sx, z0: cy * sz, x1: (cx + 1) * sx, z1: (cy + 1) * sz, last: 0, want: 0, prio: 0, split: false, u16: null, mesh: null, minY: 0, maxY: this.geo.yMax };
      this.nodes.set(key, n);
    }
    return n;
  }

  dist(n, cam) {
    const dx = Math.max(n.x0 - cam.x, 0, cam.x - n.x1), dz = Math.max(n.z0 - cam.z, 0, cam.z - n.z1);
    const dy = Math.max(n.minY - cam.y, 0, cam.y - n.maxY);
    return Math.hypot(dx, dy, dz);
  }

  update(cam) {
    this.frame++;
    this.camPos = cam;
    this.active = new Set();
    this._drain();
    if (this.has(this.K, 0, 0)) this._visit(this.K, 0, 0, cam);
    let swaps = 0;
    for (const n of this.nodes.values()) if (n.mesh) {
      const v = this.active.has(n);
      if (n.mesh.visible !== v) swaps++;
      n.mesh.visible = v; if (v) n.last = this.frame;
    }
    this.swaps = swaps;
    this._pump();
    this._evict();
    this.stats = { ready: this.nodes.size, active: this.active.size, loading: this.loading + this.queue.length + this.pending.length };
  }

  _request(n, d) {
    n.want = this.frame; n.prio = d;
    if (n.state === 'idle') { n.state = 'queued'; this.queue.push(n); }
  }

  _visit(k, cx, cy, cam) {
    const n = this.node(k, cx, cy);
    const d = this.dist(n, cam);
    if (n.state === 'idle') this._request(n, d); else if (n.state === 'queued') { n.want = this.frame; n.prio = d; }
    // Histerezis: bölünmüş düğüm ancak eşiğin %30 ötesinde birleşir → LOD sınırında gidip gelme (titreme) olmaz.
    const thr = this.splitFactor * Math.max(...this.size(k)) * (n.split ? 1.3 : 1.0);
    n.split = k > 0 && d < thr;
    if (n.split) {
      const kids = [];
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const ccx = cx * 2 + dx, ccy = cy * 2 + dy;
        if (this.has(k - 1, ccx, ccy)) kids.push(this.node(k - 1, ccx, ccy));
      }
      if (kids.length) {
        let all = true;
        for (const c of kids) {
          const cd = this.dist(c, cam);
          if (c.state === 'idle') this._request(c, cd); else if (c.state === 'queued') { c.want = this.frame; c.prio = cd; }
          if (c.state !== 'ready') all = false;
        }
        if (all) { for (const c of kids) this._visit(c.k, c.cx, c.cy, cam); return; }
      }
    }
    if (n.state === 'ready') this.active.add(n);
  }

  _pump() {
    this.queue = this.queue.filter((n) => { if (n.want === this.frame || n.want === this.frame - 1) return true; n.state = 'idle'; return false; });
    this.queue.sort((a, b) => a.prio - b.prio);
    while (this.loading < this.maxLoads && this.queue.length) {
      const n = this.queue.shift(); n.state = 'loading'; this.loading++;
      this._load(n).finally(() => { this.loading--; });
    }
  }

  async _load(n) {
    try {
      const hasTex = this.have[n.k].get(n.cx + '_' + n.cy);
      const [buf, tex] = await Promise.all([
        fetch(`${this.base}/h/${n.k}/${n.cx}_${n.cy}.u16`).then((r) => { if (!r.ok) throw new Error('h ' + r.status); return r.arrayBuffer(); }),
        hasTex ? new Promise((res) => this.texLoader.load(`${this.base}/t/${n.k}/${n.cx}_${n.cy}.jpg`, res, undefined, () => res(null))) : null,
      ]);
      n.u16 = new Uint16Array(buf);
      n.state = 'built-wait'; this.pending.push({ n, tex });      // mesh üretimi kare bütçesi içinde (takılma/hitch önleme)
    } catch (e) { n.state = 'failed'; console.warn('döşeme yüklenemedi', n.key, e.message); }
  }

  _drain() {
    const t0 = performance.now(); let built = 0;
    this.pending.sort((a, b) => this.dist(a.n, this.camPos) - this.dist(b.n, this.camPos));
    while (this.pending.length && (built === 0 || performance.now() - t0 < BUILD_BUDGET_MS)) {
      const { n, tex } = this.pending.shift();
      if (!this.nodes.has(n.key)) { tex?.dispose(); continue; }
      this._build(n, tex); n.state = 'ready'; built++; this.version++;
    }
    this.builtLast = built;
  }

  _build(n, tex) {
    const { man, geo } = this;
    const [cxm, czm] = this.cell(n.k), u = n.u16;
    const total = N * N + 4 * N;
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
    const Y = (i, j) => { const q = u[(j + 1) * S + (i + 1)]; return q ? man.zmin + q * man.zstep - geo.zref : NaN; };
    let lo = Infinity, hi = -Infinity;
    const valid = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const y = Y(i, j), k3 = (j * N + i) * 3;
      if (!isNaN(y)) { valid[j * N + i] = 1; lo = Math.min(lo, y); hi = Math.max(hi, y); }
      pos[k3] = n.x0 + i * cxm; pos[k3 + 1] = y; pos[k3 + 2] = n.z0 + j * czm;
    }
    if (!isFinite(lo)) { lo = 0; hi = 0; }
    n.minY = lo; n.maxY = hi;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i, k3 = k * 3;
      let y = pos[k3 + 1]; if (isNaN(y)) { y = lo; pos[k3 + 1] = lo; }
      const g = (ii, jj) => { const v = Y(ii, jj); return isNaN(v) ? y : v; };
      const dx = (g(i + 1, j) - g(i - 1, j)) / (2 * cxm), dz = (g(i, j + 1) - g(i, j - 1)) / (2 * czm);
      const il = 1 / Math.hypot(dx, 1, dz);
      nor[k3] = -dx * il; nor[k3 + 1] = il; nor[k3 + 2] = -dz * il;
      uv[k * 2] = i / 128; uv[k * 2 + 1] = 1 - j / 128;
    }
    // etekler: 0 üst(j=0), 1 alt(j=128), 2 sol(i=0), 3 sağ(i=128). LOD sınırı çatlağı, eğimli yerde birkaç hücreyi bulabilir.
    const depth = Math.max(cxm, czm) * (n.k === 0 ? 2.5 : 4);
    const edge = (e, t) => (e === 0 ? t : e === 1 ? 128 * N + t : e === 2 ? t * N : t * N + 128);
    for (let e = 0; e < 4; e++) for (let t = 0; t < N; t++) {
      const s = N * N + e * N + t, k = edge(e, t);
      pos[s * 3] = pos[k * 3]; pos[s * 3 + 1] = pos[k * 3 + 1] - depth; pos[s * 3 + 2] = pos[k * 3 + 2];
      nor[s * 3] = nor[k * 3]; nor[s * 3 + 1] = nor[k * 3 + 1]; nor[s * 3 + 2] = nor[k * 3 + 2];
      uv[s * 2] = uv[k * 2]; uv[s * 2 + 1] = uv[k * 2 + 1];
    }
    const idx = [];
    for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) {
      const a = j * N + i, b = a + 1, c = a + N, d = c + 1;
      if (valid[a] && valid[b] && valid[c] && valid[d]) idx.push(a, c, b, b, c, d);
    }
    for (let e = 0; e < 4; e++) for (let t = 0; t < 128; t++) {
      const k0 = edge(e, t), k1 = edge(e, t + 1);
      if (!valid[k0] || !valid[k1]) continue;
      const s0 = N * N + e * N + t, s1 = s0 + 1;
      idx.push(k0, k1, s0, k1, s1, s0);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geom.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
    geom.computeBoundingSphere(); geom.computeBoundingBox();
    if (tex) { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = this.anisotropy; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; }
    if (tex && this.renderer) this.renderer.initTexture(tex);   // GPU yüklemesi mesh bütçesi içinde yapılır (ilk çizimde takılma olmasın)
    const mat = new THREE.MeshStandardMaterial({ map: tex || null, color: tex ? 0xffffff : 0x8b6a52, roughness: 0.96, metalness: 0, side: THREE.DoubleSide });
    mat.onBeforeCompile = patchMaterial;
    mat.customProgramCacheKey = () => 'mars-terrain-v4';
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = this.shadows; mesh.receiveShadow = this.shadows; mesh.visible = false;
    this.group.add(mesh);
    n.mesh = mesh;
  }

  _evict() {
    if (this.nodes.size <= this.cacheMax) return;
    const old = [...this.nodes.values()].filter((n) => n.state === 'ready' && !this.active.has(n) && n.k < this.K && this.frame - n.last > 120)
      .sort((a, b) => a.last - b.last);
    for (const n of old.slice(0, this.nodes.size - this.cacheMax)) {
      this.group.remove(n.mesh); n.mesh.geometry.dispose(); n.mesh.material.map?.dispose(); n.mesh.material.dispose();
      this.nodes.delete(n.key);
    }
  }

  /** En ince hazır döşemeden bilineer yükseklik (Y, dünya). Veri yoksa null. */
  heightAt(x, z) {
    for (let k = 0; k <= this.K; k++) {
      const [sx, sz] = this.size(k), cx = Math.floor(x / sx), cy = Math.floor(z / sz);
      const n = this.nodes.get(k + '/' + cx + '/' + cy);
      if (!n || n.state !== 'ready') continue;
      const [cxm, czm] = this.cell(k);
      const fu = (x - n.x0) / cxm, fv = (z - n.z0) / czm;
      const i = Math.min(127, Math.max(0, Math.floor(fu))), j = Math.min(127, Math.max(0, Math.floor(fv)));
      const tx = Math.min(1, Math.max(0, fu - i)), tz = Math.min(1, Math.max(0, fv - j));
      const q = (ii, jj) => n.u16[(jj + 1) * S + (ii + 1)];
      const q00 = q(i, j), q10 = q(i + 1, j), q01 = q(i, j + 1), q11 = q(i + 1, j + 1);
      if (!(q00 && q10 && q01 && q11)) continue;
      const m = this.man, f = (v) => m.zmin + v * m.zstep - this.geo.zref;
      return (f(q00) * (1 - tx) + f(q10) * tx) * (1 - tz) + (f(q01) * (1 - tx) + f(q11) * tx) * tz;
    }
    return null;
  }

  slopeDegAt(x, z, d = 1.5) {
    const a = this.heightAt(x - d, z), b = this.heightAt(x + d, z), c = this.heightAt(x, z - d), e = this.heightAt(x, z + d);
    if (a == null || b == null || c == null || e == null) return null;
    return (Math.atan(Math.hypot((b - a) / (2 * d), (e - c) / (2 * d))) * 180) / Math.PI;
  }
}
