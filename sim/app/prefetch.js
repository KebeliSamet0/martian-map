// Soğuk açılışta karoların geç yüklenmesini azaltır: açılış/görev seçimi ekranındayken, 3B yürüyüşün başlayacağı
// noktaların (görev başlangıçları) çevresindeki karoları (yükseklik .u16 + doku .jpg) arka planda, düşük öncelikle önbelleğe çeker.
// Terrain aynı URL'leri fetch/Image ile istediğinde tarayıcı HTTP önbelleğinden okur. Hiçbir şeyi çizmez, hata yutulur,
// veri tasarrufu modunda (navigator.connection.saveData) çalışmaz. Sentetik veri üretmez; yalnız mevcut karoları ısıtır.

/** Dünya konumu merkezli, k düzeyinde radiusM içine düşen var olan karo anahtarları. */
export function tilesNear(terrain, k, x, z, radiusM) {
  const [sx, sz] = terrain.size(k), out = [];
  const c0 = Math.floor((x - radiusM) / sx), c1 = Math.floor((x + radiusM) / sx);
  const r0 = Math.floor((z - radiusM) / sz), r1 = Math.floor((z + radiusM) / sz);
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) if (terrain.has(k, cx, cy)) out.push([k, cx, cy]);
  return out;
}

/** Karo listesi (düzey 0 en ince). Yakın düzeyler dar, uzak/kaba düzeyler geniş yarıçap: toplam birkaç MB. */
export function planPrefetch(terrain, centers, { radiusM = 170, levels = terrain.K + 1 } = {}) {
  const seen = new Set(), list = [];
  for (const [x, z] of centers) {
    for (let k = 0; k < levels; k++) {
      for (const t of tilesNear(terrain, k, x, z, radiusM * (1 + k * 0.6))) {
        const key = t.join('/'); if (!seen.has(key)) { seen.add(key); list.push(t); }
      }
    }
  }
  // Önce kaba düzeyler (az sayıda, tüm sahneyi hızla kurar), sonra ince düzeyler.
  return list.sort((a, b) => b[0] - a[0]);
}

/** Terrain henüz kurulmadan (açılış ekranı) karo geometrisini manifestten kurar: size(k), has(k,cx,cy), K. */
export function tileView(man, geo) {
  const have = man.level_meta.map((m) => new Set(m.chunks.map(([cx, cy]) => cx + '_' + cy)));
  return { K: man.levels - 1, size: (k) => [geo.resX * 2 ** k * 128, geo.resZ * 2 ** k * 128], has: (k, cx, cy) => have[k].has(cx + '_' + cy) };
}

export function startPrefetch({ base, man, geo, missions, toWorld, concurrency = 4, onDone } = {}) {   // toWorld = api.pxToWorld (api.js tarayıcıya özgü, burada içe aktarılmaz)
  try {
    if (navigator.connection?.saveData || !man?.level_meta || !missions?.length) return { cancel() {}, planned: 0 };
    const terrain = tileView(man, geo);
    const centers = [];
    for (const m of missions) for (const p of [m.start_px, m.goal_px]) if (p) { const w = toWorld(geo, p[0] + 0.5, p[1] + 0.5); if (w.every(Number.isFinite)) centers.push(w); }
    const plan = planPrefetch(terrain, centers);
    let i = 0, active = 0, done = 0, cancelled = false, bytes = 0;
    const next = () => {
      while (!cancelled && active < concurrency && i < plan.length) {
        const [k, cx, cy] = plan[i++]; active++;
        const urls = [`${base}/h/${k}/${cx}_${cy}.u16`];
        if (terrain.has(k, cx, cy)) urls.push(`${base}/t/${k}/${cx}_${cy}.jpg`);
        Promise.all(urls.map((u) => fetch(u, { priority: 'low' }).then((r) => (r.ok ? r.blob() : null)).then((b) => { bytes += b?.size ?? 0; }).catch(() => {})))
          .finally(() => { active--; done++; if (done === plan.length) onDone?.({ tiles: plan.length, bytes }); else next(); });
      }
    };
    const kick = () => next();
    if ('requestIdleCallback' in window) requestIdleCallback(kick, { timeout: 1500 }); else setTimeout(kick, 300);
    return { cancel() { cancelled = true; }, planned: plan.length };
  } catch { return { cancel() {}, planned: 0 }; }
}
