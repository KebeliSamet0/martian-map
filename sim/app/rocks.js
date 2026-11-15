// SENTETİK yakın plan taş dağılımı: kameranın çevresinde, eğime bağlı olasılıkla, deterministik hash ile. NASA verisi DEĞİLDİR;
// yalnız görsel ölçek hissi içindir ve arayüzde etiketlenir. Kapatılabilir (K).
import * as THREE from 'three';
import { blockersFromInstances } from './collide.js';   // batu:tas

function hash(a, b, s) {
  let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

export class Rocks {
  constructor(scene, terrain, { max = 2200, radius = 80, cell = 3.2, shadows = true } = {}) {
    this.terrain = terrain; this.radius = radius; this.cell = cell; this.max = max;
    let g = new THREE.IcosahedronGeometry(1, 2);
    g.deleteAttribute('uv'); g.deleteAttribute('normal');   // IcosahedronGeometry zaten indekssiz
    const mergeKey = (x, y, z) => `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
    const p = g.attributes.position, v = new THREE.Vector3(), seen = new Map();
    for (let i = 0; i < p.count; i++) {      // aynı köşe her yüzde aynı yer değiştirmeyi alır (çatlak yok): çok oktavlı, aşınmış kaya
      v.fromBufferAttribute(p, i);
      const key = mergeKey(v.x, v.y, v.z);
      if (!seen.has(key)) {
        const a = hash(Math.round(v.x * 8), Math.round(v.y * 8 + v.z * 13), 7), b = hash(Math.round(v.x * 21), Math.round(v.y * 21 + v.z * 5), 9);
        seen.set(key, 0.80 + 0.28 * a + 0.12 * b);
      }
      v.multiplyScalar(seen.get(key)); p.setXYZ(i, v.x, v.y * 0.58, v.z);
    }
    // yumuşak normaller: aynı konumdaki köşelerin yüz normalleri toplanır (geometri paylaşımsız olduğundan computeVertexNormals düz gölge verirdi)
    const acc = new Map(), a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), c3 = new THREE.Vector3(), fn = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a3.fromBufferAttribute(p, i); b3.fromBufferAttribute(p, i + 1); c3.fromBufferAttribute(p, i + 2);
      fn.subVectors(c3, b3).cross(a3.clone().sub(b3));
      for (let k = 0; k < 3; k++) {
        const key = mergeKey(p.getX(i + k), p.getY(i + k), p.getZ(i + k));
        const s = acc.get(key) || new THREE.Vector3(); s.add(fn); acc.set(key, s);
      }
    }
    const nrm = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const s = acc.get(mergeKey(p.getX(i), p.getY(i), p.getZ(i))).clone().normalize();
      nrm.set([s.x, s.y, s.z], i * 3);
    }
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    this.mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, flatShading: false }), max);
    this.mesh.count = 0; this.mesh.frustumCulled = false;
    this.mesh.castShadow = shadows; this.mesh.receiveShadow = shadows;
    scene.add(this.mesh);
    this.last = new THREE.Vector3(1e9, 0, 1e9);
    this.enabled = true; this.blockers = []; this.blockersRev = 0;   // batu:tas: görünen büyük taşlar fiziksel engel (collide.setDynamic)
  }
  setEnabled(on) { if (on === this.enabled) return; this.enabled = on; this.mesh.visible = on; if (!on && this.blockers.length) { this.blockers = []; this.blockersRev++; } if (on) this.last.set(1e9, 0, 1e9); }
  update(cam, version = 0) {
    if (!this.enabled) return;
    const dx = cam.x - this.last.x, dz = cam.z - this.last.z, now = performance.now();
    // Yeniden üret: 6 m'den fazla hareket VEYA (daha ince arazi döşemesi geldiyse ve son üretimden ≥1.5 sn geçtiyse: taşlar havada/gömülü kalmasın)
    const moved = dx * dx + dz * dz >= 36, terrainChanged = version !== this.lastVersion && now - (this.lastBuild || 0) > 1500;
    if (!moved && !terrainChanged) return;
    this.lastVersion = version; this.lastBuild = now;
    this.last.copy(cam);
    const { cell, radius, terrain } = this, m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), pos = new THREE.Vector3(), col = new THREE.Color();
    const i0 = Math.floor((cam.x - radius) / cell), i1 = Math.floor((cam.x + radius) / cell);
    const j0 = Math.floor((cam.z - radius) / cell), j1 = Math.floor((cam.z + radius) / cell);
    let n = 0;
    for (let j = j0; j <= j1 && n < this.max; j++) for (let i = i0; i <= i1 && n < this.max; i++) {
      const cx = (i + hash(i, j, 1)) * cell, cz = (j + hash(i, j, 2)) * cell;
      const dd = (cx - cam.x) ** 2 + (cz - cam.z) ** 2;
      if (dd > radius * radius || dd < 5) continue;
      const y = terrain.heightAt(cx, cz);
      if (y == null) continue;
      const sl = terrain.slopeDegAt(cx, cz, 2);
      if (sl == null) continue;
      const p = Math.min(0.55, 0.12 + sl * 0.014);
      if (hash(i, j, 3) > p) continue;
      const edgeFade = 1 - Math.min(1, Math.max(0, (Math.sqrt(dd) - radius * 0.72) / (radius * 0.28)));   // yarıçap kenarında taşlar küçülerek kaybolur (ani belirme yok)
      if (edgeFade <= 0.02) continue;
      const size = edgeFade * Math.min(0.55, 0.04 + -Math.log(1 - 0.999 * hash(i, j, 4)) * 0.075);   // çoğu 4–15 cm, nadiren yarım metre
      e.set(hash(i, j, 5) * 6.28, hash(i, j, 6) * 6.28, hash(i, j, 8) * 0.8);
      q.setFromEuler(e);
      s.set(size * (0.8 + hash(i, j, 9) * 0.6), size * 0.8, size * (0.8 + hash(i, j, 10) * 0.6));
      pos.set(cx, y - size * 0.06, cz);
      m.compose(pos, q, s);
      this.mesh.setMatrixAt(n, m);
      const t = 0.9 + hash(i, j, 11) * 0.3;
      const w = hash(i, j, 12);
      col.setRGB((0.13 + 0.05 * w) * t, (0.10 + 0.03 * w) * t, (0.085 + 0.01 * w) * t);
      this.mesh.setColorAt(n, col);
      n++;
    }
    this.mesh.count = n;
    this.blockers = blockersFromInstances(this.mesh.instanceMatrix.array, n); this.blockersRev++;   // batu:tas
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
