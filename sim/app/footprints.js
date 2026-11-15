// footprints.js — ayak izi (örneklenmiş quad havuzu) ve adım tozu (parçacık havuzu).
// Varlık dosyası yok: iz dokusu canvas ile prosedürel çizilir (lisans gerekmez). Renkler sunum tonudur, ölçüm değildir.
import * as THREE from 'three';

/** Bot izi dokusu (ince, yumuşak kenarlı): R=maske, G=çökük çekirdek, B=kenarda kabaran toprak halkası. Çizgi/tırtıl yok. */
function printTexture() {
  const W = 64, H = 128, data = new Uint8Array(W * H * 4);
  const ell = (x, y, cx, cy, a, b) => (Math.hypot((x - cx) / a, (y - cy) / b) - 1) * Math.min(a, b);
  const sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(ell(x, y, 32, 40, 19, 34), ell(x, y, 32, 99, 14, 23));   // burun + topuk birleşimi, işaretli uzaklık (px)
    const mask = sm(3, -3, d), core = sm(-1, -9, d), rim = sm(9, 2, d) * sm(-2, 3, d);
    const i = (y * W + x) * 4; data[i] = mask * 255; data[i + 1] = core * 255; data[i + 2] = rim * 255; data[i + 3] = 255;
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}
function softTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/**
 * Ayak izi: tek InstancedMesh halkası. Yeni iz en eskinin yerine yazılır (arkada kalan iz rotayı anlatır).
 * add(x, z, yaw, depth, y, normal): depth 0..1 (kum belirgin, ana kaya yok → çağıran 0 verir ve eklenmez).
 */
export function createFootprints(scene, { max = 480 } = {}) {
  const geo = new THREE.PlaneGeometry(0.13, 0.30); geo.rotateX(-Math.PI / 2);   // yatay; +Z topuk yönü
  const alpha = new Float32Array(max);
  const tints = new Float32Array(max * 3);
  geo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alpha, 1)); geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: printTexture() } },
    vertexShader: 'attribute float aAlpha; attribute vec3 aTint; varying vec2 vUv; varying float vA; varying vec3 vT; void main(){ vUv=uv; vA=aAlpha; vT=aTint; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D map; varying vec2 vUv; varying float vA; varying vec3 vT; void main(){ vec3 t=texture2D(map,vUv).rgb; float shade=1.0-0.6*t.g+0.15*t.b; float a=max(t.r,t.b*0.2)*vA; if(a<0.01) discard; gl_FragColor=vec4(vT*shade,a); }',
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.count = 0;
  scene.add(mesh);
  let head = 0, n = 0;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), qy = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  return {
    mesh,
    get count() { return n; },
    add(x, z, yaw, depth, y, normal, rgb = [0.3, 0.2, 0.15]) {
      if (depth <= 0.02) return;
      // Yüzey normaline yatır, sonra yaw (ileri = (sin yaw, −cos yaw)); doku burnu −Z gösterir
      q.setFromUnitVectors(up, normal || up); qy.setFromAxisAngle(up, -yaw); q.multiply(qy);
      const s = 0.92 + 0.2 * depth;
      pos.set(x, y + 0.035, z); sc.set(s, 1, s);
      m.compose(pos, q, sc); mesh.setMatrixAt(head, m);
      alpha[head] = 0.34 + 0.5 * depth; tints.set(rgb, head * 3);
      head = (head + 1) % max; n = Math.min(max, n + 1); mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true; geo.attributes.aAlpha.needsUpdate = true; geo.attributes.aTint.needsUpdate = true;
    },
    clear() { n = 0; head = 0; mesh.count = 0; },
    dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); },
  };
}

/** Adım tozu: balistik parçacıklar (Mars g=3,71; ince atmosferde yüzme yok, hızla çöker). */
export function createDust(scene, { max = 220, g = 3.71 } = {}) {
  const pos = new Float32Array(max * 3), vel = new Float32Array(max * 3), life = new Float32Array(max), ttl = new Float32Array(max);
  const size = new Float32Array(max), col = new Float32Array(max * 3), alpha = new Float32Array(max);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: softTexture() }, scale: { value: 600 } },
    vertexShader: 'attribute float aSize; attribute vec3 aCol; attribute float aAlpha; varying vec3 vC; varying float vA; uniform float scale; void main(){ vC=aCol; vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*scale/max(0.5,-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ float a=texture2D(map,gl_PointCoord).a*vA; if(a<0.01) discard; gl_FragColor=vec4(vC,a); }',
    transparent: true, depthWrite: false,
  });
  for (let i = 0; i < max; i++) { pos[i * 3 + 1] = -1e4; life[i] = 1; ttl[i] = 1; }
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 3; scene.add(pts);
  let head = 0;
  return {
    points: pts,
    /** n parçacık, tonu rgb (0..1), kaynak (x,y,z), yön (ileri birimi fx,fz). */
    emit(n, x, y, z, rgb, strength = 1, fx = 0, fz = 0) {
      for (let k = 0; k < n; k++) {
        const i = head; head = (head + 1) % max;
        const a = Math.random() * Math.PI * 2, sp = (0.25 + Math.random() * 0.6) * strength;
        pos[i * 3] = x + (Math.random() - 0.5) * 0.25; pos[i * 3 + 1] = y + 0.05; pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.25;
        vel[i * 3] = Math.cos(a) * sp * 0.6 + fx * sp * 0.5; vel[i * 3 + 1] = (0.5 + Math.random() * 0.9) * strength; vel[i * 3 + 2] = Math.sin(a) * sp * 0.6 + fz * sp * 0.5;
        life[i] = 0; ttl[i] = 0.5 + Math.random() * 0.5; size[i] = 0.07 + Math.random() * 0.09;
        const j = 0.9 + Math.random() * 0.2; col[i * 3] = rgb[0] * j; col[i * 3 + 1] = rgb[1] * j; col[i * 3 + 2] = rgb[2] * j; alpha[i] = 0.4;
      }
    },
    update(dt, pixelHeight = 900, fov = 66) {
      mat.uniforms.scale.value = pixelHeight / (2 * Math.tan((fov * Math.PI) / 360));
      for (let i = 0; i < max; i++) {
        if (life[i] >= ttl[i]) continue;
        life[i] += dt; const f = life[i] / ttl[i];
        if (f >= 1) { pos[i * 3 + 1] = -1e4; alpha[i] = 0; continue; }
        vel[i * 3 + 1] -= g * dt; const d = Math.exp(-dt * 1.4); vel[i * 3] *= d; vel[i * 3 + 2] *= d;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        alpha[i] = 0.4 * (1 - f) * (1 - f); size[i] += dt * 0.12;
      }
      geo.attributes.position.needsUpdate = geo.attributes.aAlpha.needsUpdate = geo.attributes.aSize.needsUpdate = true;
    },
    dispose() { scene.remove(pts); geo.dispose(); mat.dispose(); },
  };
}
