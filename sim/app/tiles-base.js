// Hangi karo klasörü yüklenecek? Varsayılan `tiles_fixed` (DEM kayması düzeltilmiş, docs/sim/DEM_KAYMA.md); yoksa `tiles` (kaymış, yedek).
// `?tiles=<klasör>` ile elle seçilir (yalnız [A-Za-z0-9_-]); seçilen klasörün manifest.json'u yoksa sıradakine düşülür.
export async function pickTiles(requested) {
  const ok = (n) => /^[A-Za-z0-9_-]+$/.test(n ?? '');
  const order = [...new Set([ok(requested) ? requested : null, 'tiles_fixed', 'tiles'].filter(Boolean))];
  for (const n of order) {
    try { if ((await fetch(`./data/${n}/manifest.json`, { method: 'HEAD' })).ok) { if (n !== order[0]) console.warn(`karo: ${order[0]} yok, ${n} kullanılıyor`); return `./data/${n}`; } } catch { /* sıradaki */ }
  }
  return `./data/${order[order.length - 1]}`;
}
