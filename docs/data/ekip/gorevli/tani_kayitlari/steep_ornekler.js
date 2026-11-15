// Salt okuma: API /layers/slope.bin ile eğimi >=25° hücreler için en yakın geçilebilir hücre mesafesini (hücre merkezleri arası, 2 m/hücre) hesaplar.
const http = require('http');
const get = (u) => new Promise((res) => http.get(u, (r) => { const c = []; r.on('data', (x) => c.push(x)); r.on('end', () => res(Buffer.concat(c))); }));
(async () => {
  const b = await get('http://127.0.0.1:8000/layers/slope.bin');
  const s = new Float32Array(b.buffer, b.byteOffset, 1000 * 1000);
  const ok = (c, r) => c >= 0 && r >= 0 && c < 1000 && r < 1000 && s[r * 1000 + c] < 25;
  const nearest = (c, r, max = 150) => { let best = Infinity; for (let d = 1; d <= max && best === Infinity; d++) for (let dc = -d; dc <= d; dc++) for (let dr = -d; dr <= d; dr++) if (Math.max(Math.abs(dc), Math.abs(dr)) === d && ok(c + dc, r + dr)) best = Math.min(best, Math.hypot(dc, dr)); for (let d = Math.floor(best); d <= Math.ceil(best) + 1 && best !== Infinity; d++) for (let dc = -d; dc <= d; dc++) for (let dr = -d; dr <= d; dr++) if (ok(c + dc, r + dr)) best = Math.min(best, Math.hypot(dc, dr)); return best === Infinity ? null : best * 2; };
  const near = [], far = []; let tot = 0, steep = 0;
  for (let r = 20; r < 980; r += 3) for (let c = 20; c < 980; c += 3) { tot++; if (s[r * 1000 + c] >= 25) { steep++; const m = nearest(c, r); if (m !== null && m > 10 && far.length < 400) far.push({ px: [c, r], slope: Math.round(s[r * 1000 + c]), nearestM: Math.round(m) }); else if (m !== null && m <= 10 && near.length < 400) near.push({ px: [c, r], slope: Math.round(s[r * 1000 + c]), nearestM: Math.round(m) }); } }
  const st = (a) => ({ n: a.length, ornek: a.slice(0, 3) });
  console.log(JSON.stringify({ ornekleme: tot, eg25: steep, snapIcinde_le10m: st(near), snapDisinda_gt10m: st(far.sort((x, y) => y.nearestM - x.nearestM)) }, null, 1));
})();
