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

/** Yakınlık izleyici: check([x,z] | {x,z}) → bu karede yarıçapa yeni girilen duraklar. */
export function createStopWatcher(stops, { near = NEAR_M, rearm = REARM_M } = {}) {
  const inside = new Set();
  return {
    check(pos) {
      const x = Array.isArray(pos) ? pos[0] : pos.x, z = Array.isArray(pos) ? pos[1] : pos.z, hits = [];
      for (const s of stops) {
        const d = Math.hypot(s.world[0] - x, s.world[1] - z);
        if (d <= near && !inside.has(s.id)) { inside.add(s.id); hits.push({ ...s, distance_m: d }); }
        else if (d > rearm) inside.delete(s.id);
      }
      return hits;
    },
    reset() { inside.clear(); },
  };
}

/**
 * initCorridor(scene, terrain, geo, opts?) → { stops, update(pos), setVisible(bool), dispose() }
 * terrain: heightAt(x, z) → y | null ve isteğe bağlı version (LOD değişince çizgi yeniden yere oturur).
 * opts: groundY(x,z) (ör. main.js groundY; yoksa terrain.heightAt), data (önceden yüklenmiş JSON), url, lift, width.
 * Her karede update(oyuncuKonumu) çağırın.
 */
export async function initCorridor(scene, terrain, geo, { groundY, data, url, lift = 0.12, width = 0.6 } = {}) {
  const THREE = await import('three');
  const src = url ?? new URL('../data/curiosity.json', import.meta.url);
  if (!data) { const r = await fetch(src); if (!r.ok) throw new Error(`curiosity.json HTTP ${r.status}`); data = await r.json(); }
  const { trail, stops } = toWorld(data, geo, { dataBase: new URL('.', src) });
  const gy = groundY ?? ((x, z) => terrain.heightAt(x, z));
  const group = new THREE.Group(); group.name = 'curiosity-corridor'; scene.add(group);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf3e7c9, transparent: true, opacity: 0.8, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const line = new THREE.Mesh(new THREE.BufferGeometry(), lineMat); line.frustumCulled = false; line.renderOrder = 4; group.add(line);

  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), headGeo = new THREE.SphereGeometry(0.28, 12, 8);
  const markMat = new THREE.MeshBasicMaterial({ color: 0xffc94d, toneMapped: false });
  const markers = stops.map(s => {
    const m = new THREE.Group(), pole = new THREE.Mesh(poleGeo, markMat), head = new THREE.Mesh(headGeo, markMat);
    pole.position.y = 0.8; head.position.y = 1.75; m.add(pole, head); m.userData.stop = s; group.add(m); return m;
  });

  function build() {  // şerit: her noktada yola dik ±width/2, yükseklik araziden (yoksa son bilinen)
    const n = trail.length, w = width / 2, pos = new Float32Array(n * 6), idx = [];
    let lastY = 0;
    for (let i = 0; i < n; i++) {
      const a = trail[Math.max(0, i - 1)], b = trail[Math.min(n - 1, i + 1)], p = trail[i];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const y = gy(p[0], p[1]); if (y != null) lastY = y;
      const yl = gy(p[0] - tz * w, p[1] + tx * w) ?? lastY, yr = gy(p[0] + tz * w, p[1] - tx * w) ?? lastY;
      pos.set([p[0] - tz * w, yl + lift, p[1] + tx * w, p[0] + tz * w, yr + lift, p[1] - tx * w], i * 6);
      if (i < n - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
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
      if (!pos || !group.visible) return [];
      const hits = watcher.check(pos);
      for (const s of hits) globalThis.dispatchEvent?.(new CustomEvent('corridor:stop', { detail: s }));
      return hits;
    },
    setVisible(on) { group.visible = !!on; if (!on) watcher.reset(); },
    dispose() {
      scene.remove(group); line.geometry.dispose(); lineMat.dispose(); poleGeo.dispose(); headGeo.dispose(); markMat.dispose();
    },
  };
}
