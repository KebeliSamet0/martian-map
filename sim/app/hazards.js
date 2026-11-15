// Gerçek (tespit edilmiş) kayalar ve kum bölgeleri 3B'de (issue #46).
// Kayalar: HiRISE ortofotodan gölge yöntemiyle bulundu (ml/orbital/shadow_rocks.py → export_sim.py → data/rocks.json). Çap ≥ 0,5 m.
// Kum bölgeleri: layers/sand_hint.json → data/sand_zones.json. KESİN kum değil, aday (gözle doğrulandı).
// Sentetik taşlardan (rocks.js, K tuşu) BAĞIMSIZDIR: K kapalıyken de görünür; yalnız setVisible ile kapanır.
//
// Kullanım (tek çağrı, main.js'i Batu bağlar):
//   const hz = await initHazards(scene, terrain, geo);   // { setVisible(bool), count, zones, refresh() }
import * as THREE from 'three';
import { pxToWorld } from './api.js';
import { SYNTH } from './detail.js';

const SEAT_LIFT = 0.12;      // kaya merkezi: çevre zeminin en alçağından, dikey yarıçapın bu oranı kadar yukarı (gömülü/havada kalmasın)
const SAND_LIFT = 0.12;      // kum diski zeminden bu kadar (m) yukarıda: z-çakışması olmasın
const OUTCROP_H = 0.13;      // TEMSİLİ sanatçı geometrisi: kaynaklı bir Mars ölçümü değil (Gale'de evrensel yükseklik/çap oranı bulunamadı; Point Lake ≈ 0,25, boxwork sırtı 1–2 m: docs/data/ekip/yuzlek_gorunum_arastirmasi.md). Yüzlek konumu HiRISE gölge TESPİTİdir, ölçüm değil.
const RESEAT_MS = 1000;      // daha ince arazi döşemesi geldiyse en çok bu sıklıkta yeniden otur

function hash(a, s) {   // 0..1, deterministik
  let h = (a * 374761393 + s * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

/** Köşeli, kırık yüzeyli kaya: düşük poligonlu ikosahedron, köşeler yönüne bağlı sapma; düz gölgeleme kırık yüzey hissi verir. */
function rockGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const k = (a) => Math.round(a * 6);
    const a = hash(k(v.x) * 31 + k(v.y) * 17 + k(v.z) * 7, 7), b = hash(k(v.x) * 53 + k(v.y) * 29 + k(v.z) * 13, 9);
    const r = 0.62 + 0.46 * a + 0.16 * b;                       // belirgin düzensizlik
    const flat = v.y < -0.2 ? 0.25 : 0.70 + 0.2 * b;            // alt yarı gömülü, üst yassı
    p.setXYZ(i, v.x * r, v.y * r * flat, v.z * r);
  }
  g.computeVertexNormals();
  // Toz birikmesi: alt kuşak (zemine yakın) açık toz rengine, üst koyu kaya rengine (köşe rengi × örnek rengi; SENTETİK görünüm)
  const cl = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (0.15 - p.getY(i)) / 0.75)), k = 0.82 + 0.5 * t;
    cl[i * 3] = k * (1 + 0.08 * t); cl[i * 3 + 1] = k; cl[i * 3 + 2] = k * (1 - 0.10 * t);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cl, 3));
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

/** Kaya malzemesi: CC0 ana kaya dokusu (sim/assets/textures, bkz. sim/ASSETS.md); doku yoksa düz renk. */
function rockMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0, flatShading: true, vertexColors: true });
  const L = new THREE.TextureLoader(), base = new URL('../assets/textures/', import.meta.url);
  const load = (name, srgb, set) => L.load(new URL(name, base).href, (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); if (srgb) t.colorSpace = THREE.SRGBColorSpace; set(t); m.needsUpdate = true;
  }, undefined, () => {});
  load('bedrock_diff.jpg', true, (t) => { m.map = t; });
  load('bedrock_nor.jpg', false, (t) => { m.normalMap = t; m.normalScale = new THREE.Vector2(0.8, 0.8); });
  return m;
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
  // rocks.json `kind`: 'rock' tek kaya (olduğu gibi), 'outcrop' sırt yüzleği/mostra (alçak yayvan parça), 'shadow' gölge yöntemi artığı (ÇİZİLMEZ).
  // `kind` yoksa (eski veri) rock sayılır.
  rocks = rocks.filter((r) => r.kind !== 'shadow');
  const N = rocks.length;
  const isOut = new Uint8Array(N);
  const rx = new Float32Array(N), rz = new Float32Array(N), rr = new Float32Array(N);   // dünya x, z, yarıçap (m)
  const sc = new Float32Array(N * 3), yaw = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const [x, z] = pxToWorld(geo, rocks[i].px[0], rocks[i].px[1]);
    const out = rocks[i].kind === 'outcrop'; isOut[i] = out ? 1 : 0;
    rx[i] = x; rz[i] = z; rr[i] = rocks[i].d_m / 2;
    if (out) {   // yüzlek: tam çapta yayvan (bir yönde uzamış), yükseklik çapın ~%13'ü
      const el = 0.55 + 0.35 * hash(i, 2);
      sc.set([rr[i] * 1.0, rocks[i].d_m * OUTCROP_H, rr[i] * el], i * 3);
    } else sc.set([rr[i] * (0.85 + hash(i, 1) * 0.4), rr[i] * (0.75 + hash(i, 2) * 0.5), rr[i] * (0.85 + hash(i, 3) * 0.4)], i * 3);
    yaw[i] = hash(i, 4) * Math.PI * 2;
  }
  const rockMesh = new THREE.InstancedMesh(rockGeometry(), rockMaterial(), Math.max(N, 1));
  rockMesh.name = 'hazard-rocks'; rockMesh.frustumCulled = false; rockMesh.castShadow = true; rockMesh.receiveShadow = true;
  const col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const t = 0.9 + hash(i, 5) * 0.3, w = hash(i, 6);
    col.setRGB((0.50 + 0.14 * w) * t, (0.35 + 0.09 * w) * t, (0.27 + 0.06 * w) * t);   // tozlu kırmızı-kahve; doku ile çarpılır
    rockMesh.setColorAt(i, col);
  }
  rockMesh.instanceColor.needsUpdate = true;
  group.add(rockMesh);

  // Diplerinde toz birikintisi: zemine yatık, kenarı yumuşayan yarı saydam disk (SENTETİK; kaya konumu gerçek tespit, toz görsel)
  const dustTex = softDiscTexture();
  const dustMat = new THREE.MeshStandardMaterial({ color: 0xa4764f, roughness: 1, metalness: 0, transparent: true, opacity: 0.55, alphaMap: dustTex, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: -1.5 });
  const dustMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), dustMat, Math.max(N, 1));
  dustMesh.name = 'hazard-dust'; dustMesh.frustumCulled = false; dustMesh.receiveShadow = true; dustMesh.renderOrder = 1;
  group.add(dustMesh);

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
      const ext = isOut[i] ? 0.8 : 1; for (const [ax, az] of AX) { const y = terrain.heightAt(rx[i] + ax * rr[i] * ext, rz[i] + az * rr[i] * ext); if (y != null && y < lo) lo = y; }
      if (lo === Infinity) { m.compose(pos.set(rx[i], 0, rz[i]), q.identity(), zero); rockMesh.setMatrixAt(i, m); dustMesh.setMatrixAt(i, m); continue; }   // karo yok: sıfır ölçek, gizli
      e.set(0, yaw[i], 0); q.setFromEuler(e);
      s.set(sc[i * 3], sc[i * 3 + 1], sc[i * 3 + 2]);
      pos.set(rx[i], lo + s.y * (isOut[i] ? 0.12 : SEAT_LIFT), rz[i]);   // outcrop: daha gömülü
      m.compose(pos, q, s); rockMesh.setMatrixAt(i, m); placed++;
      const dr = rr[i] * (isOut[i] ? 1.12 : 1.55 + 0.4 * hash(i, 8));   // toz halkası: yarıçapın ~1,5–2 katı; en yüksek çevre zemin yüksekliğine oturur
      let hi = lo; for (const [ax, az] of AX) { const y = terrain.heightAt(rx[i] + ax * dr, rz[i] + az * dr); if (y != null && y > hi) hi = y; }
      e.set(0, yaw[i], 0); q.setFromEuler(e); pos.set(rx[i], hi + 0.03, rz[i]); s.set(dr, 1, dr * (0.85 + 0.2 * hash(i, 9)));
      m.compose(pos, q, s); dustMesh.setMatrixAt(i, m);
    }
    rockMesh.instanceMatrix.needsUpdate = true; dustMesh.instanceMatrix.needsUpdate = true;
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
  rockMesh.onBeforeRender = () => { dustMesh.visible = SYNTH.value > 0.5; refresh(); };   // saf veri modunda (V) sentetik toz gizlenir   // kendi kendine günceller; main.js'e ek çağrı gerekmez
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
