// footprints.js — ayak izi (örneklenmiş quad havuzu) ve adım tozu (parçacık havuzu).
// Varlık dosyası yok: iz dokusu canvas ile prosedürel çizilir (lisans gerekmez). Renkler sunum tonudur, ölçüm değildir.
import * as THREE from 'three';

/** Bot tabanı alfa dokusu: tabanın gövdesi + topuk boşluğu + sığ tırtıl çizgileri. */
function printTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d'); g.clearRect(0, 0, 64, 128);
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(32, 38, 20, 34, 0, 0, Math.PI * 2); g.fill();        // ayak önü
  g.beginPath(); g.ellipse(32, 100, 15, 21, 0, 0, Math.PI * 2); g.fill();       // topuk
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
  g.fillRect(14, 70, 36, 5);                                                   // topuk-ön arası boşluk
  for (let y = 14; y < 112; y += 11) g.fillRect(16, y, 32, 2.2);               // tırtıl
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; return t;
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
export function createFootprints(scene, { max = 480, tint = [0.11, 0.055, 0.035] } = {}) {
  const geo = new THREE.PlaneGeometry(0.22, 0.44); geo.rotateX(-Math.PI / 2);   // yatay; +Z topuk yönü
  const alpha = new Float32Array(max);
  geo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: printTexture() }, tint: { value: new THREE.Color(...tint) } },
    vertexShader: 'attribute float aAlpha; varying vec2 vUv; varying float vA; void main(){ vUv=uv; vA=aAlpha; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 tint; varying vec2 vUv; varying float vA; void main(){ float a=texture2D(map,vUv).a*vA; if(a<0.01) discard; gl_FragColor=vec4(tint,a); }',
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
    add(x, z, yaw, depth, y, normal) {
      if (depth <= 0.02) return;
      // Yüzey normaline yatır, sonra yaw (ileri = (sin yaw, −cos yaw)); doku burnu −Z gösterir
      q.setFromUnitVectors(up, normal || up); qy.setFromAxisAngle(up, -yaw); q.multiply(qy);
      const s = 0.85 + 0.45 * depth;   // derin iz biraz daha geniş görünür
      pos.set(x, y + 0.035, z); sc.set(s, 1, s);
      m.compose(pos, q, sc); mesh.setMatrixAt(head, m);
      alpha[head] = 0.35 + 0.55 * depth;
      head = (head + 1) % max; n = Math.min(max, n + 1); mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true; geo.attributes.aAlpha.needsUpdate = true;
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
        life[i] = 0; ttl[i] = 0.7 + Math.random() * 0.7; size[i] = 0.3 + Math.random() * 0.3;
        const j = 0.9 + Math.random() * 0.2; col[i * 3] = rgb[0] * j; col[i * 3 + 1] = rgb[1] * j; col[i * 3 + 2] = rgb[2] * j; alpha[i] = 0.85;
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
        alpha[i] = 0.85 * (1 - f) * (1 - f); size[i] += dt * 0.5;
      }
      geo.attributes.position.needsUpdate = geo.attributes.aAlpha.needsUpdate = geo.attributes.aSize.needsUpdate = true;
    },
    dispose() { scene.remove(pts); geo.dispose(); mat.dispose(); },
  };
}
