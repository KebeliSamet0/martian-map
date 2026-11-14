// Gerçek (tespit edilmiş) kayalar ve kum bölgeleri 3B'de (issue #46).
// Kayalar: HiRISE ortofotodan gölge yöntemiyle bulundu (ml/orbital/shadow_rocks.py → export_sim.py → data/rocks.json). Çap ≥ 0,5 m.
// Kum bölgeleri: layers/sand_hint.json → data/sand_zones.json. KESİN kum değil, aday (gözle doğrulandı).
// Sentetik taşlardan (rocks.js, K tuşu) BAĞIMSIZDIR: K kapalıyken de görünür; yalnız setVisible ile kapanır.
//
// Kullanım (tek çağrı, main.js'i Batu bağlar):
//   const hz = await initHazards(scene, terrain, geo);   // { setVisible(bool), count, zones, refresh() }
import * as THREE from 'three';
import { pxToWorld } from './api.js';

const SEAT_LIFT = 0.3;       // kaya merkezi: çevre zeminin en alçağından, dikey yarıçapın bu oranı kadar yukarı (gömülü/havada kalmasın)
const SAND_LIFT = 0.12;      // kum diski zeminden bu kadar (m) yukarıda: z-çakışması olmasın
const RESEAT_MS = 1000;      // daha ince arazi döşemesi geldiyse en çok bu sıklıkta yeniden otur

function hash(a, s) {   // 0..1, deterministik
  let h = (a * 374761393 + s * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

/** Aşınmış, hafif yassı kaya: ikosahedron, köşeler yönüne bağlı çok oktavlı sapma (çatlak yok), pürüzsüz normal. */
function rockGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 2);   // indekssiz: aynı konumdaki köşeler aynı sapmayı alır
  g.deleteAttribute('uv');
  const p = g.attributes.position, v = new THREE.Vector3(), nrm = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const k = (a) => Math.round(a * 8);
    const a = hash(k(v.x) * 31 + k(v.y) * 17 + k(v.z) * 7, 7), b = hash(Math.round(v.x * 21) * 53 + Math.round(v.y * 21) * 29 + Math.round(v.z * 21) * 13, 9);
    const r = 0.80 + 0.28 * a + 0.12 * b;
    nrm.set([v.x, v.y, v.z], i * 3);
    p.setXYZ(i, v.x * r, v.y * r * 0.62, v.z * r);
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}

/** Kenarı yumuşayan radyal alfa dokusu (alphaMap yeşil kanalı okur). */
function softDiscTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.6, '#cfcfcf'); gr.addColorStop(0.9, '#303030'); gr.addColorStop(1, '#000');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}

const RINGS = 5, SEGS = 48;
/** Merkez + RINGS halka × SEGS dilim; konumlar sonradan arazi yüksekliğine oturtulur. */
function sandGeometry() {
  const n = 1 + RINGS * SEGS, uv = new Float32Array(n * 2), idx = [];
  uv.set([0.5, 0.5], 0);
  for (let r = 1; r <= RINGS; r++) for (let s = 0; s < SEGS; s++) {
    const a = (s / SEGS) * Math.PI * 2, f = r / RINGS, i = 1 + (r - 1) * SEGS + s;
    uv.set([0.5 + 0.5 * f * Math.cos(a), 0.5 + 0.5 * f * Math.sin(a)], i * 2);
  }
  for (let s = 0; s < SEGS; s++) idx.push(0, 1 + s, 1 + ((s + 1) % SEGS));
  for (let r = 1; r < RINGS; r++) for (let s = 0; s < SEGS; s++) {
    const a = 1 + (r - 1) * SEGS + s, b = 1 + (r - 1) * SEGS + ((s + 1) % SEGS), c = a + SEGS, d = b + SEGS;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

const NOOP = { setVisible() {}, count: 0, zones: 0, refresh() {} };

export async function initHazards(scene, terrain, geo) {
  const base = new URL('../data/', import.meta.url);
  let rocks, zones;
  try {
    [rocks, zones] = await Promise.all([
      fetch(new URL('rocks.json', base)).then((r) => { if (!r.ok) throw new Error('rocks.json ' + r.status); return r.json(); }),
      fetch(new URL('sand_zones.json', base)).then((r) => { if (!r.ok) throw new Error('sand_zones.json ' + r.status); return r.json(); }),
    ]);
  } catch (e) { console.warn('[hazards] veri yüklenemedi, tehlike katmanı kapalı:', e); return NOOP; }

  const group = new THREE.Group(); group.name = 'hazards'; scene.add(group);

  // --- kayalar: tek InstancedMesh; px → dünya bir kez, yükseklik arazi geldikçe ---
  const N = rocks.length;
  const rx = new Float32Array(N), rz = new Float32Array(N), rr = new Float32Array(N);   // dünya x, z, yarıçap (m)
  const sc = new Float32Array(N * 3), yaw = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const [x, z] = pxToWorld(geo, rocks[i].px[0], rocks[i].px[1]);
    rx[i] = x; rz[i] = z; rr[i] = rocks[i].d_m / 2;
    sc.set([rr[i] * (0.9 + hash(i, 1) * 0.25), rr[i] * 0.95 * (0.85 + hash(i, 2) * 0.3), rr[i] * (0.9 + hash(i, 3) * 0.25)], i * 3);   // çap = d_m (ortalama), yükseklik ~0,6 r
    yaw[i] = hash(i, 4) * Math.PI * 2;
  }
  const rockMesh = new THREE.InstancedMesh(rockGeometry(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 }), Math.max(N, 1));
  rockMesh.name = 'hazard-rocks'; rockMesh.frustumCulled = false; rockMesh.castShadow = true; rockMesh.receiveShadow = true;
  const col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const t = 0.9 + hash(i, 5) * 0.3, w = hash(i, 6);
    col.setRGB((0.17 + 0.05 * w) * t, (0.125 + 0.035 * w) * t, (0.095 + 0.02 * w) * t);   // ortofotoda seçilsin diye sentetik taşlardan biraz açık
    rockMesh.setColorAt(i, col);
  }
  rockMesh.instanceColor.needsUpdate = true;
  group.add(rockMesh);

  // --- kum bölgeleri: zemini izleyen yarı saydam, kenarı yumuşak disk ---
  const tex = softDiscTexture();
  const sandMat = new THREE.MeshBasicMaterial({ color: 0xe9d4a0, transparent: true, opacity: 0.34, alphaMap: tex, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const sand = zones.map((z) => {
    const [x, zz] = pxToWorld(geo, z.px[0], z.px[1]);
    const mesh = new THREE.Mesh(sandGeometry(), sandMat); mesh.name = 'hazard-sand-' + z.id; mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.visible = false;
    group.add(mesh);
    return { x, z: zz, R: z.radius_m, mesh };
  });

  // --- zemine oturtma ---
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), pos = new THREE.Vector3(), zero = new THREE.Vector3(0, 0, 0);
  const AX = [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]];
  let placed = 0;
  function seatRocks() {
    placed = 0;
    for (let i = 0; i < N; i++) {
      let lo = Infinity;
      for (const [ax, az] of AX) { const y = terrain.heightAt(rx[i] + ax * rr[i], rz[i] + az * rr[i]); if (y != null && y < lo) lo = y; }
      if (lo === Infinity) { m.compose(pos.set(rx[i], 0, rz[i]), q.identity(), zero); rockMesh.setMatrixAt(i, m); continue; }   // karo yok: sıfır ölçek, gizli
      e.set(0, yaw[i], 0); q.setFromEuler(e);
      s.set(sc[i * 3], sc[i * 3 + 1], sc[i * 3 + 2]);
      pos.set(rx[i], lo + s.y * SEAT_LIFT, rz[i]);
      m.compose(pos, q, s); rockMesh.setMatrixAt(i, m); placed++;
    }
    rockMesh.instanceMatrix.needsUpdate = true;
  }
  function seatSand() {
    for (const o of sand) {
      const pa = o.mesh.geometry.attributes.position, c = terrain.heightAt(o.x, o.z);
      if (c == null) { o.mesh.visible = false; continue; }
      pa.setXYZ(0, o.x, c + SAND_LIFT, o.z);
      let last = c;
      for (let r = 1; r <= RINGS; r++) for (let k = 0; k < SEGS; k++) {
        const a = (k / SEGS) * Math.PI * 2, d = (r / RINGS) * o.R, x = o.x + Math.cos(a) * d, z = o.z + Math.sin(a) * d;
        const y = terrain.heightAt(x, z) ?? last; last = y;
        pa.setXYZ(1 + (r - 1) * SEGS + k, x, y + SAND_LIFT, z);
      }
      pa.needsUpdate = true; o.mesh.visible = true;
    }
  }

  let lastVersion = -1, lastT = 0, visible = true;
  function refresh(force = false) {
    const v = terrain.version ?? 0, now = performance.now();
    if (!force && (v === lastVersion || now - lastT < RESEAT_MS)) return;
    lastVersion = v; lastT = now;
    seatRocks(); seatSand();
  }
  rockMesh.onBeforeRender = () => refresh();   // kendi kendine günceller; main.js'e ek çağrı gerekmez
  refresh(true);

  const api = {
    get count() { return N; },
    get placed() { return placed; },
    zones: sand.length,
    refresh: () => refresh(true),
    setVisible(on) { visible = !!on; group.visible = visible; if (visible) lastVersion = -1; },
  };
  return api;
}
