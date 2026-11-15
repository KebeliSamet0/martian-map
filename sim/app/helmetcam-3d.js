// Kask kamerası 3B katmanı (tur4:veri): durağın üstünde, zemine oturan yarı saydam görüş konisi (FOV genişliğinde) + "fotoğraf bu yöne çekildi" oku.
// Saf mantık helmetcam-core.js'te (fanPoints); burada yalnız THREE nesneleri. Sahne window.__mm.T.scene (main.js'e dokunulmaz).
import * as THREE from 'three';
import { fanPoints } from './helmetcam-core.js';

let group = null;
const lift = 1.4;   // zemin üstünde (z-çakışmasını önler)

export function clearCone() {
  if (!group) return;
  group.parent?.remove(group);
  group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
  group = null;
}

/** x,z: durak dünya konumu; az/fov derece; heightAt(x,z) → yükseklik (NaN olabilir). */
export function showCone({ scene, heightAt, x, z, azDeg, fovDeg, radius = 70 }) {
  clearCone();
  const g = new THREE.Group(); g.renderOrder = 5;
  const h = (px, pz, fallback) => { const v = heightAt(px, pz); return Number.isFinite(v) ? v + lift : fallback; };
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
  const mat = new THREE.MeshBasicMaterial({ color: 0xffb27a, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false });
  g.add(new THREE.Mesh(geo, mat));
  // kenar çizgileri (koninin iki sınırı)
  const edge = (a) => { const e = fanPoints(x, z, a, 0, radius, 1)[1], pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16, px = x + (e[0] - x) * t, pz = z + (e[1] - z) * t; pts.push(new THREE.Vector3(px, h(px, pz, y0) + 0.1, pz)); } return pts; };
  for (const a of [azDeg - fovDeg / 2, azDeg + fovDeg / 2]) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(edge(a)), new THREE.LineBasicMaterial({ color: 0xffd9b8, transparent: true, opacity: 0.8, fog: false })));
  // ok: merkez ekseni boyunca, uçta koni; yer seviyesinde değil biraz yukarıda (kolay görünsün)
  const ar = (azDeg * Math.PI) / 180, L = radius * 0.6, yaw = -ar;   // Object3D.rotation.y: +z → (sin,−cos) yönüne bakması için
  const amber = new THREE.MeshBasicMaterial({ color: 0xffd9b8, depthTest: false, transparent: true, opacity: 0.95, fog: false });
  const arrow = new THREE.Group(); arrow.position.set(x, y0 + 2.5, z); arrow.rotation.y = Math.PI - ar;   // yerel +z = bakış yönü
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, L), amber); shaft.position.z = L / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(3.2, 8, 16), amber); head.rotation.x = Math.PI / 2; head.position.z = L + 4;
  arrow.add(shaft, head); arrow.renderOrder = 7; shaft.renderOrder = 7; head.renderOrder = 7; g.add(arrow);
  scene.add(g); group = g;
}
