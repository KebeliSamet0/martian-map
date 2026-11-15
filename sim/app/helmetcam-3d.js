// Kask kamerası 3B katmanı (tur4:veri): durağın üstünde, zemine oturan yarı saydam görüş konisi (FOV genişliğinde) + "fotoğraf bu yöne çekildi" oku.
// Saf mantık helmetcam-core.js'te (fanPoints); burada yalnız THREE nesneleri. Sahne window.__mm.T.scene (main.js'e dokunulmaz).
import * as THREE from 'three';
import { fanPoints } from './helmetcam-core.js';

let group = null;
const lift = 0.9;   // zemin üstünde (z-çakışmasını önler); düşük tutulur ki koni zemine yapışık görünsün, göğe taşmasın

/** Sahnedeki arazi döşemesinden (ince) zemin yüksekliği; yoksa nav DEM'i. Koni/ok bu yüzden görünen araziye oturur. */
export const groundFn = (m) => (x, z) => { const y = m.T?.terrain?.heightAt(x, z); return y != null ? y : m.nav.heightAt(x, z); };

export function clearCone() {
  if (!group) return;
  group.parent?.remove(group);
  group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
  group = null;
}

/** x,z: durak dünya konumu; az/fov derece; heightAt(x,z) → yükseklik (NaN olabilir). */
export function showCone({ scene, heightAt, x, z, azDeg, fovDeg, radius = 36 }) {
  clearCone();
  const g = new THREE.Group(); g.renderOrder = 5;
  let lastH = null;   // DEM'de boşluk (NaN) olursa son geçerli zemin yüksekliği taşınır; yükseklik açısı (el) kullanılmaz: koni yalnız zemine serilir
  const h = (px, pz, fallback) => { const v = heightAt(px, pz); if (Number.isFinite(v)) { lastH = v + lift; return lastH; } return lastH ?? fallback; };
  const y0 = h(x, z, 0);
  // yelpaze: radyal halkalar boyunca yüksekliği araziden al (zemine oturur)
  const rings = 8, steps = 24, pos = [], idx = [];
  const ring = (r) => fanPoints(x, z, azDeg, fovDeg, r, steps).slice(1);
  pos.push(x, y0, z);
  for (let k = 1; k <= rings; k++) { for (const [px, pz] of ring((radius * k) / rings)) pos.push(px, h(px, pz, y0), pz); }
  const n = steps + 1;
  for (let i = 0; i < steps; i++) idx.push(0, 1 + i, 2 + i);
  for (let k = 1; k < rings; k++) for (let i = 0; i < steps; i++) {
    const a = 1 + (k - 1) * n + i, b = a + 1, c = 1 + k * n + i, d = c + 1; idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffc890, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false });
  g.add(new THREE.Mesh(geo, mat));
  // kenar çizgileri (koninin iki sınırı)
  const edge = (a) => { const e = fanPoints(x, z, a, 0, radius, 1)[1], pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16, px = x + (e[0] - x) * t, pz = z + (e[1] - z) * t; pts.push(new THREE.Vector3(px, h(px, pz, y0) + 0.1, pz)); } return pts; };
  for (const a of [azDeg - fovDeg / 2, azDeg + fovDeg / 2]) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(edge(a)), new THREE.LineBasicMaterial({ color: 0xffd9b8, transparent: true, opacity: 0.8, fog: false })));
  // ok: zemine serilmiş şerit + uç üçgeni (havada duran 3B ok yok); her köşe arazi yüksekliğinden
  const L = radius * 0.7, hw = 0.5, ar = (azDeg * Math.PI) / 180, fx = Math.sin(ar), fz = -Math.cos(ar), rx = -fz, rz = fx;   // ileri ve sağ birim vektörler (x, z)
  const P = (d, side) => { const px = x + fx * d + rx * side, pz = z + fz * d + rz * side; return [px, h(px, pz, y0) + 0.25, pz]; };
  const tri = [], N = 24, bodyEnd = L - 5;
  for (let i = 0; i < N; i++) { const d0 = (bodyEnd * i) / N, d1 = (bodyEnd * (i + 1)) / N; const a = P(d0, -hw), b2 = P(d0, hw), c = P(d1, -hw), e = P(d1, hw); tri.push(...a, ...b2, ...c, ...b2, ...e, ...c); }
  tri.push(...P(bodyEnd, -2.4), ...P(bodyEnd, 2.4), ...P(L, 0));
  const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
  const am = new THREE.Mesh(ag, new THREE.MeshBasicMaterial({ color: 0xffd9b8, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false }));
  am.renderOrder = 6; g.add(am);
  scene.add(g); group = g;
}
