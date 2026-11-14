// Curiosity koridoru (issue #47): gerçekte sürülen yol zeminde ince açık renkli çizgi, Navcam duraklarında işaretçi.
// Oyuncu bir durağa NEAR_M yaklaşınca window'a 'corridor:stop' olayı (detail: durak; fotoğraf kartını HUD/Batu gösterir).
// Veri: sim/data/curiosity.json (pipeline/export_curiosity.py). px = [sütun, satır] sürekli; dönüşüm api.js pxToWorld.
// Three.js yalnız çizimde dinamik yüklenir: üst düzey mantık (createStopWatcher, toWorld) node --test ile sınanır.
import { pxToWorld } from './api.js';

export const NEAR_M = 15;    // olay yarıçapı (brif)
export const REARM_M = 25;   // bu kadar uzaklaşınca aynı durak yeniden tetiklenebilir (sınırda titreşmesin)

/** curiosity.json → dünya koordinatları; durağa fotoğrafın tam adresi eklenir. */
export function toWorld(data, geo, { dataBase } = {}) {
  const trail = data.path_px.map(([c, r]) => pxToWorld(geo, c, r));
  const stops = data.stops.map(s => ({ ...s, world: pxToWorld(geo, s.px[0], s.px[1]),
    photo_url: dataBase ? new URL(s.photo, dataBase).href : s.photo }));
  return { trail, stops };
}

/**
 * Yakınlık izleyici. step([x,z] | {x,z}) → { entered, exited }: bu karede `near` içine yeni girilen ve
 * `rearm`'dan uzağa çıkılan duraklar. Aradaki bant (near..rearm) sınırda titreşmeyi önler; çıkılan durak yeniden kurulur.
 * check(pos) = step(pos).entered (geriye uyum).
 */
export function createStopWatcher(stops, { near = NEAR_M, rearm = REARM_M } = {}) {
  const inside = new Set();
  const step = (pos) => {
    const x = Array.isArray(pos) ? pos[0] : pos.x, z = Array.isArray(pos) ? pos[1] : pos.z, entered = [], exited = [];
    for (const s of stops) {
      const d = Math.hypot(s.world[0] - x, s.world[1] - z);
      if (d <= near && !inside.has(s.id)) { inside.add(s.id); entered.push({ ...s, distance_m: d }); }
      else if (d > rearm && inside.delete(s.id)) exited.push({ ...s, distance_m: d });
    }
    return { entered, exited };
  };
  return { step, check: (pos) => step(pos).entered, reset() { inside.clear(); } };
}

/**
 * Navcam kartı denetleyicisi (DOM'dan bağımsız; wire-extras.js bağlar, test sahte nesneyle sınar).
 * view: { show(stop), expand(bool), hide() }. update({entered, exited}, { blocked }) her karede çağrılır.
 * Kural: duraka girince küçük açılır; o duraktan çıkınca (REARM_M) kendiliğinden kapanır;
 * elle kapatılan kart aynı durakta yeniden açılmaz (izleyici çıkış görmeden tekrar giriş üretmez).
 */
export function createStopCard(view) {
  let current = null, big = false;
  const hide = () => { if (current) view.hide(); current = null; big = false; };
  return {
    get current() { return current; },
    get big() { return big; },
    update({ entered = [], exited = [] } = {}, { blocked = false } = {}) {
      if (current && exited.some(s => s.id === current.id)) hide();
      if (entered.length && !blocked) { current = entered[0]; big = false; view.show(current); view.expand(false); }
    },
    toggle() { if (current) { big = !big; view.expand(big); } },
    close() { hide(); },
    escape() { if (big) { big = false; view.expand(false); } else hide(); },
  };
}

/**
 * initCorridor(scene, terrain, geo, opts?) → { stops, update(pos), setVisible(bool), dispose() }
 * terrain: heightAt(x, z) → y | null ve isteğe bağlı version (LOD değişince çizgi yeniden yere oturur).
 * opts: groundY(x,z) (ör. main.js groundY; yoksa terrain.heightAt), data (önceden yüklenmiş JSON), url, lift, width.
 * Her karede update(oyuncuKonumu) çağırın → { entered, exited } ('corridor:stop' / 'corridor:leave' olayları da gönderilir).
 */
export async function initCorridor(scene, terrain, geo, { groundY, data, url, lift = 0.05, width = 0.38, track = 2.8 } = {}) {
  const THREE = await import('three');
  const src = url ?? new URL('../data/curiosity.json', import.meta.url);
  if (!data) { const r = await fetch(src); if (!r.ok) throw new Error(`curiosity.json HTTP ${r.status}`); data = await r.json(); }
  const { trail, stops } = toWorld(data, geo, { dataBase: new URL('.', src) });
  const gy = groundY ?? ((x, z) => terrain.heightAt(x, z));
  const group = new THREE.Group(); group.name = 'curiosity-corridor'; scene.add(group);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0x2b1b12, transparent: true, opacity: 0.34, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const line = new THREE.Mesh(new THREE.BufferGeometry(), lineMat); line.frustumCulled = false; line.renderOrder = 4; group.add(line);

  const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), headGeo = new THREE.OctahedronGeometry(0.11);
  const markMat = new THREE.MeshBasicMaterial({ color: 0xe0a23a, toneMapped: false, transparent: true, opacity: 0.85 });
  const markers = stops.map(s => {
    const m = new THREE.Group(), pole = new THREE.Mesh(poleGeo, markMat), head = new THREE.Mesh(headGeo, markMat);
    pole.position.y = 0.55; head.position.y = 1.22; m.add(pole, head); m.userData.stop = s; group.add(m); return m;
  });

  function build() {  // Curiosity'nin iki tekerlek izi: yol ekseninin ±track/2 yanında, her biri `width` genişlikte ince şerit (temsili; iz genişliği ≈ 2,8 m)
    const n = trail.length, w = width / 2, pos = new Float32Array(n * 12), idx = [];
    let lastY = 0;
    const Y = (x, z) => { const y = gy(x, z); if (y != null) lastY = y; return lastY; };
    for (let i = 0; i < n; i++) {
      const a = trail[Math.max(0, i - 1)], b = trail[Math.min(n - 1, i + 1)], p = trail[i];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const nx = -tz, nz = tx;   // yola dik
      let o = i * 12;
      for (const side of [-1, 1]) {
        const cx = p[0] + nx * side * track / 2, cz = p[1] + nz * side * track / 2;
        const x1 = cx - nx * w, z1 = cz - nz * w, x2 = cx + nx * w, z2 = cz + nz * w;
        pos.set([x1, Y(x1, z1) + lift, z1, x2, Y(x2, z2) + lift, z2], o); o += 6;
      }
      if (i < n - 1) for (const k of [i * 4, i * 4 + 2]) idx.push(k, k + 1, k + 4, k + 1, k + 5, k + 4);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    line.geometry.dispose(); line.geometry = g;
    for (const m of markers) { const [x, z] = m.userData.stop.world; m.position.set(x, gy(x, z) ?? lastY, z); }
  }

  const watcher = createStopWatcher(stops);
  let built = -1, lastBuild = 0;
  build();
  return {
    stops,
    update(pos) {
      const v = terrain?.version ?? 0, now = performance.now();
      if (v !== built && now - lastBuild > 900) { build(); built = v; lastBuild = now; }
      if (!pos || !group.visible) return { entered: [], exited: [] };
      const r = watcher.step(pos);
      for (const s of r.entered) globalThis.dispatchEvent?.(new CustomEvent('corridor:stop', { detail: s }));
      for (const s of r.exited) globalThis.dispatchEvent?.(new CustomEvent('corridor:leave', { detail: s }));
      return r;
    },
    setVisible(on) { group.visible = !!on; if (!on) watcher.reset(); },
    dispose() {
      scene.remove(group); line.geometry.dispose(); lineMat.dispose(); poleGeo.dispose(); headGeo.dispose(); markMat.dispose();
    },
  };
}
