// Yol bulma: HiRISE DTM'in 4 m'lik kaba ızgarasında A* (16 komşu). İki mod:
//  'shortest' → mesafe (metre) en küçük, eğim sınırı aşılamaz;  'balanced' → Tobler yürüme hızına göre süre.
// Ardından doğrudan-görüş (line-of-sight) ile zikzak temizliği. Zemin sınıfı/kum/radyasyon/kalori YOK: bu bilgi planlayıcıdan
// (AI4Mars + Pandolf) gelecek; çıktıdaki alanlar null ve etiketlidir.
export class Nav {
  constructor(man, geo, u16) {
    this.man = man; this.geo = geo; this.w = man.nav.w; this.h = man.nav.h;
    const f = 2 ** man.nav.k;
    this.cx = geo.resX * f; this.cz = geo.resZ * f;
    this.z = new Float32Array(this.w * this.h);
    for (let i = 0; i < u16.length; i++) this.z[i] = u16[i] ? geo.zOf(u16[i]) - geo.zref : NaN;
  }
  static async load(base, man, geo) {
    const r = await fetch(`${base}/${man.nav.file}`);
    if (!r.ok) throw new Error('nav ' + r.status);
    return new Nav(man, geo, new Uint16Array(await r.arrayBuffer()));
  }
  cellOf(x, z) { return [Math.floor(x / this.cx), Math.floor(z / this.cz)]; }
  valid(i, j) { return i >= 0 && j >= 0 && i < this.w && j < this.h && !isNaN(this.z[j * this.w + i]); }

  /** Bilineer yükseklik (hücre merkezleri), geçersiz komşuda NaN */
  heightAt(x, z) {
    const u = x / this.cx - 0.5, v = z / this.cz - 0.5, i = Math.floor(u), j = Math.floor(v), tx = u - i, tz = v - j;
    if (i < 0 || j < 0 || i + 1 >= this.w || j + 1 >= this.h) return NaN;
    const w = this.w, a = this.z[j * w + i], b = this.z[j * w + i + 1], c = this.z[(j + 1) * w + i], d = this.z[(j + 1) * w + i + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  }

  nearestValid(i, j, r = 40) {
    if (this.valid(i, j)) return [i, j];
    for (let d = 1; d <= r; d++) for (let dj = -d; dj <= d; dj++) for (let di = -d; di <= d; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== d) continue;
      if (this.valid(i + di, j + dj)) return [i + di, j + dj];
    }
    return null;
  }

  /** Eğim bandı kaydı (derece) – harita katmanı için */
  slopeGrid() {
    const { w, h, z } = this, out = new Float32Array(w * h).fill(NaN);
    for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) {
      const a = z[j * w + i - 1], b = z[j * w + i + 1], c = z[(j - 1) * w + i], d = z[(j + 1) * w + i];
      if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) continue;
      out[j * w + i] = (Math.atan(Math.hypot((b - a) / (2 * this.cx), (d - c) / (2 * this.cz))) * 180) / Math.PI;
    }
    return out;
  }

  static toblerMps(tan) { return (6 * Math.exp(-3.5 * Math.abs(tan + 0.05))) / 3.6; }   // m/s

  /** Kullanıcının eğim sınırı yol boyunca ~6 m tabanda ölçülen eğime uygulanır: A*, 4 m ızgara kenarlarında daha gevşek
   *  ölçtüğü için sonuç sınırı aşarsa, A* sınırı aşım kadar kısılarak (en çok 4 kez) yeniden çözülür. */
  route(sx, sz, gx, gz, { mode = 'shortest', maxSlope = 20 } = {}) {
    let lim = maxSlope, best = null;
    for (let it = 0; it < 4; it++) {
      const r = this._route(sx, sz, gx, gz, { mode, maxSlope: lim });
      if (r.error) return best || r;
      best = r;
      const over = r.total.slope_max - maxSlope;
      if (over <= 0.5 || lim < 8) break;
      lim = Math.max(8, lim - over - 0.5);
    }
    best.maxSlope = maxSlope; best.astarLimit = Math.round(lim * 10) / 10;
    return best;
  }

  _route(sx, sz, gx, gz, { mode, maxSlope }) {
    const { w, h, z, cx, cz } = this, N = w * h;
    const s0 = this.nearestValid(...this.cellOf(sx, sz)), g0 = this.nearestValid(...this.cellOf(gx, gz));
    if (!s0 || !g0) return { error: 'Başlangıç veya hedef DTM veri alanının dışında.' };
    const start = s0[1] * w + s0[0], goal = g0[1] * w + g0[0];
    const tanMax = Math.tan((maxSlope * Math.PI) / 180);
    const steps = [];
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
      if ((di === 0 && dj === 0) || (Math.abs(di) === 2 && Math.abs(dj) === 2)) continue;
      if (Math.abs(di) === 2 && Math.abs(dj) === 0) continue; if (Math.abs(dj) === 2 && Math.abs(di) === 0) continue;
      steps.push([di, dj, Math.hypot(di * cx, dj * cz)]);
    }
    const cmin = mode === 'shortest' ? 1 : 1 / Nav.toblerMps(-0.05);
    const g = new Float32Array(N).fill(Infinity), par = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    let cap = 1 << 20, hf = new Float32Array(cap), hi = new Int32Array(cap), hn = 0;
    const push = (f, i) => {
      if (hn === cap) { cap *= 2; const nf = new Float32Array(cap), ni = new Int32Array(cap); nf.set(hf); ni.set(hi); hf = nf; hi = ni; }
      let k = hn++; while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= f) break; hf[k] = hf[p]; hi[k] = hi[p]; k = p; } hf[k] = f; hi[k] = i;
    };
    const pop = () => {
      const top = hi[0], f = hf[--hn], i = hi[hn]; let k = 0;
      for (;;) { let c = 2 * k + 1; if (c >= hn) break; if (c + 1 < hn && hf[c + 1] < hf[c]) c++; if (hf[c] >= f) break; hf[k] = hf[c]; hi[k] = hi[c]; k = c; }
      hf[k] = f; hi[k] = i; return top;
    };
    const heur = (i) => Math.hypot(((i % w) - (goal % w)) * cx, (((i / w) | 0) - ((goal / w) | 0)) * cz) * cmin;
    g[start] = 0; push(heur(start), start);
    let expanded = 0;
    while (hn > 0) {
      const a = pop(); if (closed[a]) continue; closed[a] = 1; expanded++;
      if (a === goal) break;
      const ai = a % w, aj = (a / w) | 0, za = z[a];
      for (const [di, dj, d] of steps) {
        const bi = ai + di, bj = aj + dj; if (bi < 0 || bj < 0 || bi >= w || bj >= h) continue;
        const b = bj * w + bi, zb = z[b]; if (isNaN(zb) || closed[b]) continue;
        const tan = (zb - za) / d; if (Math.abs(tan) > tanMax) continue;
        const cost = mode === 'shortest' ? d * (1 + 0.04 * (Math.abs(tan) / tanMax) ** 2) : d / Nav.toblerMps(tan);
        const ng = g[a] + cost;
        if (ng < g[b]) { g[b] = ng; par[b] = a; push(ng + heur(b), b); }
      }
    }
    if (!isFinite(g[goal])) return { error: `Eğim sınırı ${maxSlope}° içinde bağlantı yok (veya arada veri boşluğu).`, expanded };
    let cells = []; for (let k = goal; k !== -1; k = par[k]) cells.push(k); cells.reverse();
    let pts = cells.map((k) => [((k % w) + 0.5) * cx, (((k / w) | 0) + 0.5) * cz]);
    if (!isNaN(this.heightAt(sx, sz))) pts[0] = [sx, sz];
    if (!isNaN(this.heightAt(gx, gz))) pts[pts.length - 1] = [gx, gz];
    pts = this.pull(pts, tanMax);
    return { points: pts, expanded, ...this.describe(pts, mode, maxSlope) };
  }

  /** Doğrudan-görüş ile zikzak temizliği */
  pull(pts, tanMax) {
    const ok = (a, b) => {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / (this.cx * 0.75)));
      let prev = this.heightAt(a[0], a[1]);
      if (isNaN(prev)) return false;
      for (let t = 1; t <= n; t++) {
        const x = a[0] + ((b[0] - a[0]) * t) / n, z = a[1] + ((b[1] - a[1]) * t) / n, y = this.heightAt(x, z);
        if (isNaN(y) || Math.abs(y - prev) / (d / n) > tanMax) return false;
        prev = y;
      }
      return true;
    };
    const out = [pts[0]]; let i = 0;
    while (i < pts.length - 1) {
      let j = Math.min(pts.length - 1, i + 80);
      while (j > i + 1 && !ok(pts[i], pts[j])) j--;
      out.push(pts[j]); i = j;
    }
    return out;
  }

  /** 2 m'de yeniden örnekle, segmentlere böl (≤100 m veya eğim bandı değişince), sözleşme biçiminde özet çıkar */
  describe(pts, mode, maxSlope) {
    const step = 2, dense = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(d / step));
      for (let t = 0; t < n; t++) dense.push([a[0] + ((b[0] - a[0]) * t) / n, a[1] + ((b[1] - a[1]) * t) / n]);
    }
    dense.push(pts[pts.length - 1]);
    const y = dense.map((p) => { const v = this.heightAt(p[0], p[1]); return isNaN(v) ? null : v; });
    const band = (s) => (s < 5 ? 0 : s < 10 ? 1 : s < 15 ? 2 : s < 20 ? 3 : 4);
    const segs = []; let cur = null, total = { m: 0, s: 0, up: 0, down: 0, max: 0 };
    // Eğim ~6 m tabanda (±3 örnek) ölçülür: 2 m'lik adımlarda bilineer yüzey gürültüsü sahte dik eğim üretir.
    const cd = [0]; for (let i = 1; i < dense.length; i++) cd.push(cd[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    for (let i = 0; i < dense.length - 1; i++) {
      const d = cd[i + 1] - cd[i];
      const a = Math.max(0, i - 2), b = Math.min(dense.length - 1, i + 3);
      const tanS = y[a] != null && y[b] != null && cd[b] > cd[a] ? (y[b] - y[a]) / (cd[b] - cd[a]) : 0;
      const sl = (Math.atan(Math.abs(tanS)) * 180) / Math.PI, dy = y[i] != null && y[i + 1] != null ? y[i + 1] - y[i] : 0;
      const t = d / Nav.toblerMps(tanS);
      if (!cur || (cur.len >= 100) || (cur.len >= 20 && Math.abs(band(sl) - cur.band) >= 2)) {
        cur = { len: 0, max: 0, sum: 0, time: 0, from: i, band: band(sl) }; segs.push(cur);
      }
      cur.len += d; cur.max = Math.max(cur.max, sl); cur.sum += sl * d; cur.time += t; cur.to = i + 1;
      total.m += d; total.s += t; total.max = Math.max(total.max, sl);
      if (dy > 0) total.up += dy; else total.down -= dy;
    }
    const geo = this.geo;
    const px = (p) => [Math.round((p[0] / geo.resX) * 10) / 10, Math.round((p[1] / geo.resZ) * 10) / 10];
    const segments = segs.map((s, k) => {
      const mean = s.sum / s.len;
      return {
        id: k + 1, idx: [s.from, s.to], path_px: [px(dense[s.from]), px(dense[s.to])], len_m: Math.round(s.len), slope_max: Math.round(s.max * 10) / 10,
        slope_mean: Math.round(mean * 10) / 10, p_sand: null, rock_cfa: null, conf: 'unknown', nearest_evidence_m: null,
        kcal: null, min: Math.round((s.time / 60) * 10) / 10,
        reason: `Segment ${k + 1}: ${Math.round(s.len)} m, maksimum eğim ${s.max.toFixed(1)}°, ortalama ${mean.toFixed(1)}°. Zemin sınıfı ve model güveni: veri yok (zemin modeli bağlı değil). Süre yalnız eğimden (Tobler).`,
        rejected_alt: null,
      };
    });
    return {
      dense, heights: y, segments,
      // min = Tobler (Dünya yürüyüşü, eğime duyarlı); min_suit = yol uzunluğu / NASA APACHE skafandr referans hızı (sabit; eğim etkisi Mars için doğrulanmadı)
      total: { km: Math.round(total.m) / 1000, min: Math.round(total.s / 60), min_suit: Math.round(total.m / (this.suitSpeed || 0.67056) / 60), kcal: null, dose_uGy: null, walkback_ok: null, go: null,
               ascent_m: Math.round(total.up), descent_m: Math.round(total.down), slope_max: Math.round(total.max * 10) / 10 },
      kind: mode === 'shortest' ? 'shortest' : 'balanced', maxSlope,
    };
  }
}
