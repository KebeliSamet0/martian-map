// 3B rota rehberi (yol işareti): araziye yapışık, ince (~10 cm), yarı saydam tek kesikli çizgi; segment rengi (eğim bandı, beyaza yumuşatılmış), mesafeyle sönme,
// hedef ışık sütunu ve kum riski bölgesi diski. Veri: rota.dense [[x,z]...], rota.segments[].idx / slope_max. Sentetik değildir: rotanın kendisidir.
import * as THREE from 'three';

const BAND = [0x30d158, 0xa4d12a, 0xffd60a, 0xff9f0a, 0xff3b30];
const WHITE = new THREE.Color(1, 1, 1);
const bandOf = (s) => (s < 5 ? 0 : s < 10 ? 1 : s < 15 ? 2 : s < 20 ? 3 : 4);

// Kesikli çizgi dokusu: v yönü = rota yönü; ~%58 dolu, uçları yumuşak (yumuşak kenar ince şeritte titremeyi azaltır).
function dashTexture() {
  const c = document.createElement('canvas'); c.width = 8; c.height = 64;
  const g = c.getContext('2d'); g.clearRect(0, 0, 8, 64);
  const gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.06, 'rgba(255,255,255,1)'); gr.addColorStop(0.58, 'rgba(255,255,255,1)'); gr.addColorStop(0.66, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 8, 64);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const DASH_M = 1.1;          // kesik periyodu (m)
const NEAR_M = 30, FAR_M = 95;   // kameraya 30 m içinde tam, 95 m'de sönmüş

export class RouteLine {
  // width: görünür çizgi genişliği (m). Tek, ince, yarı saydam, kesikli saha işareti; önündeki ~30 m belirgin, uzağı solar.
  constructor(scene, groundY, { width = 0.10, lift = 0.05, gray = false, opacity = 0.62 } = {}) {
    this.scene = scene; this.groundY = groundY; this.width = width; this.lift = lift; this.gray = gray;
    this.tex = dashTexture();
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, vertexColors: true, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.mat.onBeforeCompile = (sh) => {
      sh.uniforms.uNear = { value: NEAR_M }; sh.uniforms.uFar = { value: FAR_M };
      sh.vertexShader = 'varying float vRlDist;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n      vRlDist = length(mvPosition.xyz);');
      sh.fragmentShader = 'varying float vRlDist; uniform float uNear; uniform float uFar;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n      diffuseColor.a *= mix(1.0, 0.0, smoothstep(uNear, uFar, vRlDist)) * (0.55 + 0.45 * (1.0 - smoothstep(uNear * 0.6, uNear * 1.6, vRlDist)));');
    };
    this.mat.customProgramCacheKey = () => 'routeline-dash-v1';
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 5; this.mesh.visible = false;
    scene.add(this.mesh);
    this.dense = null; this.segments = null; this.built = -1; this.lastBuild = 0;
  }
  set(dense, segments) { this.dense = dense; this.segments = segments; this.built = -1; this.mesh.visible = !!dense; }
  clear() { this.dense = null; this.mesh.visible = false; }
  /** arazi LOD'u değişince (version) ya da yeni rota gelince şeridi yeniden örnekle */
  update(dt, version) {
    if (!this.dense) return;
    this.tex.offset.y -= dt * 0.2;                       // oklar rota yönünde akar
    const now = performance.now();
    if (version !== this.built && now - this.lastBuild > 900) { this.build(); this.built = version; this.lastBuild = now; }
  }
  build() {
    const d = this.dense, n = d.length, w = this.width * 0.5;
    const pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), col = new Float32Array(n * 6), idx = [];
    const segBand = new Uint8Array(n);
    if (this.segments) for (const s of this.segments) { const b = bandOf(s.slope_max ?? 0); for (let i = s.idx[0]; i <= s.idx[1] && i < n; i++) segBand[i] = b; }
    const c = new THREE.Color(); let dist = 0, lastY = 0;
    for (let i = 0; i < n; i++) {
      const a = d[Math.max(0, i - 1)], b = d[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const nx = -tz, nz = tx;                            // yatay normal (soldan sağa)
      if (i) dist += Math.hypot(d[i][0] - d[i - 1][0], d[i][1] - d[i - 1][1]);
      const lx = d[i][0] + nx * w, lz = d[i][1] + nz * w, rx = d[i][0] - nx * w, rz = d[i][1] - nz * w;
      const yl = this.groundY(lx, lz), yr = this.groundY(rx, rz);
      const ym = this.groundY(d[i][0], d[i][1]);
      if (ym != null) lastY = ym;
      pos.set([lx, (yl ?? lastY) + this.lift, lz, rx, (yr ?? lastY) + this.lift, rz], i * 6);
      const v = dist / DASH_M; uv.set([0, v, 1, v], i * 4);
      if (this.gray) c.setHex(0x8a8f98); else c.setHex(BAND[segBand[i]]).lerp(WHITE, 0.35);
      col.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6);
      if (i < n - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    this.mesh.geometry.dispose(); this.mesh.geometry = g;
  }
  dispose() { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mat.dispose(); this.tex.dispose(); }
}

/** hedef ışık sütunu + zemin halkası (rota sonu) */
export class Beacon {
  constructor(scene, groundY, color = 0x00e5ff) {
    this.groundY = groundY; this.group = new THREE.Group(); this.group.visible = false; scene.add(this.group);
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 70, 20, 1, true), m); pil.position.y = 35;
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.0, 64), m.clone()); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2;
    this.group.add(pil, ring); this.ring = ring;
  }
  set(x, z) { const y = this.groundY(x, z); this.group.position.set(x, (y ?? 0), z); this.group.visible = true; }
  hide() { this.group.visible = false; }
  update(t) { this.ring.scale.setScalar(1 + 0.12 * Math.sin(t * 2.4)); }
}

/** kum riski bölgesi (kırmızı disk) */
export class HazardDisc {
  constructor(scene, groundY) {
    this.groundY = groundY;
    this.mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    this.mesh.rotation.x = -Math.PI / 2; this.mesh.visible = false; this.mesh.renderOrder = 4; scene.add(this.mesh);
  }
  set(x, z, radius) { this.mesh.position.set(x, (this.groundY(x, z) ?? 0) + 0.3, z); this.mesh.scale.setScalar(radius); this.mesh.visible = true; }
  hide() { this.mesh.visible = false; }
}

/** Segment girişi uyarıları (tasarım: docs/data/ekip/rehberlik/arastirma.md §4.2): eğim ≥ sınır → "⚠ eğim", p_sand ≥ eşik → "kum". Kesin ayak basışı iddiası YOK. */
export class WarnMarkers {
  constructor(scene, groundY) { this.scene = scene; this.groundY = groundY; this.group = new THREE.Group(); scene.add(this.group); }
  clear() { for (const s of this.group.children) { s.material.map.dispose(); s.material.dispose(); } this.group.clear(); }
  static label(lines, color) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,.72)'; g.strokeStyle = color; g.lineWidth = 4; g.beginPath(); g.roundRect(4, 4, 248, 88, 14); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.font = 'bold 26px system-ui'; g.textAlign = 'center'; g.fillText(lines[0], 128, 40); g.font = '22px system-ui'; g.fillStyle = '#ffd7d2'; g.fillText(lines[1] || '', 128, 72);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  set(dense, segments, { slopeWarn = 20, sandWarn = 0.6 } = {}) {
    this.clear();
    let n = 0;
    for (const s of segments) {
      if (n >= 12) break;
      const i = s.idx[0], p = dense[Math.min(dense.length - 1, i)];
      const items = [];
      if ((s.slope_max ?? 0) >= slopeWarn) items.push([`⚠ eğim ${s.slope_max}°`, `segment ${s.id} · sınır ${slopeWarn}°`, '#ff6b5e']);
      if ((s.p_sand ?? 0) >= sandWarn) items.push([`kum skoru ${s.p_sand}`, `segment ${s.id} · model, batma değil`, '#ffd60a']);
      items.forEach((it, k) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: WarnMarkers.label(it.slice(0, 2), it[2]), transparent: true, depthWrite: false, toneMapped: false, sizeAttenuation: true, fog: false }));
        sp.scale.set(5, 1.9, 1); sp.position.set(p[0], (this.groundY(p[0], p[1]) ?? 0) + 3.2 + k * 2.1, p[1]); sp.renderOrder = 8; this.group.add(sp); n++;
      });
    }
  }
}
