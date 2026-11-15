// B15 teşhisi: T1 S2 (dev modu) — kum olayı neden tetiklenmiyor / hedefte numune çubuğu ve karne neden gelmiyor? SIM KODUNA DOKUNMAZ.
// Kullanım: sim 127.0.0.1:8010'da servis ediliyor olmalı; node s2_teshis.js [S2|S1|S3]
const { chromium } = require('C:/Users/Batu/Desktop/martian-map-main/martian-map-main/sim/node_modules/playwright-core');
const fs = require('fs');
const ID = process.argv[2] || 'S2';
(async () => {
  const br = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--no-sandbox'] });
  const p = await br.newPage({ viewport: { width: 1200, height: 700 } });
  const con = []; p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) con.push(m.type() + ' ' + m.text().slice(0, 160)); }); p.on('pageerror', (e) => con.push('PAGEERR ' + e.message.slice(0, 200)));
  p.on('response', (r) => { if (/\/(replan|route|step|compare)$/.test(r.url())) console.log('  [HTTP]', r.request().method(), r.url().replace(/^https?:\/\/[^/]+/, ''), r.status(), new Date().toISOString().slice(11, 19)); });
  p.on('requestfailed', (r) => console.log('  [HTTP-FAIL]', r.url().slice(-40), r.failure()?.errorText));
  await p.goto('http://127.0.0.1:8010/sim/?fixedres=1&dev=1', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mm?.mapView && window.__mm?.wire, null, { timeout: 120000 });
  await p.click(`#missions button[data-mission="${ID}"]`);
  await p.waitForSelector('[data-testid="briefing-start"]', { timeout: 30000 });
  const brief = await p.evaluate(() => [...document.querySelectorAll('.mm-modal button')].map((b) => b.innerText + '|' + (b.dataset.testid || '')));
  await p.click('[data-testid="briefing-start"]');
  await p.waitForFunction(() => document.querySelectorAll('.mm-route').length === 3, null, { timeout: 90000 });
  await p.click('.mm-route-safest [data-testid="route-pick"]');
  await p.waitForTimeout(1500);
  if (!(await p.evaluate(() => !!__mm.routeRun))) await p.evaluate(() => __mm.enter3D('auto'));   // dev modunda seçim yürüyüşü kendiliğinden başlatmaz (autoWalk yok)
  await p.waitForFunction(() => __mm.routeRun?.total > 0 && __mm.wire.machine, null, { timeout: 40000 });
  await p.waitForTimeout(3000);
  const setup = await p.evaluate(async () => {
    const { distToPolyline } = await import('./app/dynroute.js');
    const sel = __mm.wire.selected, R = __mm.routeRun, sw = sel.sand ? __mm.wire.coords.cellToWorld(sel.sand.px) : null;
    const near = sw ? distToPolyline(sw, R.r.dense) : null;
    window.__log = []; const t0 = performance.now(); const L = (k, d) => window.__log.push({ t: Math.round(performance.now() - t0), k, ...d });
    window.__L = L;
    const m = __mm.wire.machine;
    for (const n of ['state', 'event', 'arrived', 'sample', 'debrief']) m.on(n, (d) => L('machine:' + n, { st: d?.state ?? null, leg: d?.leg ?? null, P: [Math.round(__mm.P.x), Math.round(__mm.P.z)] }));
    addEventListener('mm:route-suggest', (e) => L('route-suggest', { reason: e.detail.reason }));
    addEventListener('mm:route-decision', (e) => L('route-decision', { ...e.detail }));
    addEventListener('mission:arrived', () => L('mission:arrived', {}));
    setInterval(() => {
      const R2 = __mm.routeRun, sn = __mm.wire.machine?.snapshot();
      L('tick', { s: Math.round(R2?.s ?? -1), tot: Math.round(R2?.total ?? -1), leg: R2?.leg ?? null, P: [Math.round(__mm.P.x), Math.round(__mm.P.z)], ms: sn?.state, mleg: sn?.leg ?? null, paused: __mm.stats().paused, st: __mm.stats().state, hold: !!document.querySelector('.mm-hold'), alert: document.querySelector('.mm-alert')?.innerText.replace(/\n/g, ' ').slice(0, 40) ?? null, flow: document.getElementById('flow')?.dataset.screen ?? null, report: !!document.querySelector('.mm-grade-letter') });
    }, 1000);
    return { sand: sel.sand, limits: sel.limits, hard: !!sel.hard, total: Math.round(R.total), polySandMinM: near ? Math.round(near.dist) : null, thr: sel.sand ? sel.sand.radius_m + 40 : null, machine: m.snapshot().state, leg: m.snapshot().leg ?? null, triggered: m.snapshot().triggered };
  });
  console.log('BRIFING düğmeleri:', JSON.stringify(brief));
  console.log('KURULUM:', JSON.stringify(setup));
  if (process.env.FASTNAT) {   // sim kendi fiziğiyle (çarpışma dahil) hızlı yürüsün: setTimeScale(FASTNAT); sıçrama/teleport YOK
    await p.evaluate((k) => __mm.setTimeScale(k), Number(process.env.FASTNAT));
    const t0 = Date.now(); let held = false, retDone = false, last = "";
    while (Date.now() - t0 < (Number(process.env.MAXS) || 240) * 1000) {
      await p.waitForTimeout(1000);
      const st = await p.evaluate(() => { const sn = __mm.wire.machine?.snapshot(), R = __mm.routeRun; return { s: Math.round(R?.s ?? -1), tot: Math.round(R?.total ?? -1), leg: R?.leg ?? null, P: [Math.round(__mm.P.x), Math.round(__mm.P.z)], ms: sn?.state, hold: !!document.querySelector(".mm-hold"), report: !!document.querySelector(".mm-grade-letter"), trig: sn?.triggered, rep: !!R?.replanned }; });
      const ex = await p.evaluate(() => ({ toast: document.getElementById('toast')?.textContent?.slice(0, 80) ?? null, alert: document.querySelector('.mm-alert')?.innerText.replace(/\n/g, ' ').slice(0, 60) ?? null, decision: document.querySelector('[data-testid="route-decision"]')?.innerText.replace(/\n/g, ' ').slice(0, 140) ?? null, paused: __mm.stats().paused, dyn: JSON.stringify(__mm.dynState?.() ?? null).slice(0, 120) }));
      if (ex.decision && !globalThis.__decided) { globalThis.__decided = true; console.log('KARAR PENCERESİ (data-testid=route-decision, zaman aşımı yok):', ex.decision); await p.screenshot({ path: 's2_teshis_' + ID + '_karar_penceresi.png' }); await p.waitForTimeout(3000); await p.click('[data-testid="decision-accept"]'); console.log('decision-accept tıklandı'); }
      const line = JSON.stringify([st.s, st.tot, st.leg, st.P, st.ms, st.hold, st.trig, st.rep, ex.paused, ex.alert, ex.toast]);
      if (line !== last) { console.log(Math.round((Date.now() - t0) / 1000) + "s", line); last = line; }
      if (st.hold && !held) { held = true; await p.keyboard.down("KeyE"); await p.waitForFunction(() => !document.querySelector(".mm-hold"), null, { timeout: 40000 }).catch(() => {}); await p.keyboard.up("KeyE"); console.log("E bırakıldı (numune)"); }
      if (st.report) { console.log("KARNE AÇILDI"); break; }
    }
    console.log("KONSOL:", JSON.stringify(con)); await p.screenshot({ path: "s2_teshis_" + ID + "_fastnat.png" });
    const lg = await p.evaluate(() => window.__log.filter((x) => x.k !== "tick")); console.log("OLAYLAR:", JSON.stringify(lg).slice(0, 1500));
    await br.close(); return;
  }
  await p.waitForTimeout(process.env.NATURAL ? 45000 : 6000);   // Faz 1: sim kendi hızında yürüsün (NATURAL=1: 45 sn, müdahale yok)
  if (process.env.NATURAL) { const nat = await p.evaluate(() => window.__log.filter((x) => x.k === 'tick').filter((_, i) => i % 3 === 0).map((x) => [x.t, x.s, x.P[0], x.P[1], x.ms])); console.log('DOĞAL YÜRÜYÜŞ (t ms, s, Px, Pz, makine):', JSON.stringify(nat)); await p.screenshot({ path: `s2_teshis_${ID}_dogal.png` }); await br.close(); return; }
  // Faz 2: T1'deki gibi kum merkezine uzaklığa göre adım adım ilerle, her adımı kaydet
  const walk = await p.evaluate(async () => {
    const R = __mm.routeRun, c = __mm.wire.machine, sel = __mm.wire.selected, L = window.__L;
    const sw = __mm.wire.coords.cellToWorld(sel.sand.px), thr = sel.sand.radius_m + 40;
    const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    let s = 0, minD = 1e9, fired = false, steps = 0, closest = null; const trace = [];
    while (s < R.total && steps < 400) {
      R.s = s; const sBefore = R.s; await frames(); steps++; trace.push([Math.round(s), Math.round(R.s), Math.round(__mm.P.x), Math.round(__mm.P.z), __mm.stats().state, !!window.__viewLock]);
      const d = Math.hypot(__mm.P.x - sw[0], __mm.P.z - sw[1]); if (d < minD) { minD = d; closest = { s: Math.round(s), P: [Math.round(__mm.P.x), Math.round(__mm.P.z)] }; }
      if (c.snapshot().state === 'event') { fired = true; L('adim:event-goruldu', { s: Math.round(s), d: Math.round(d) }); break; }
      s += d > thr + 40 ? 12 : 3;
    }
    return { trace: trace.filter((_, i) => i < 6 || i % 8 === 0 || i > trace.length - 3), fired, steps, minDistToSandCenterM: Math.round(minD), closest, thr, sw: sw.map(Math.round), state: c.snapshot().state, sameMachine: c === __mm.wire.machine, routeSame: R === __mm.routeRun };
  });
  console.log('ADIM ADIM İLERLEME:', JSON.stringify(walk));
  await p.screenshot({ path: `s2_teshis_${ID}_adim_sonrasi.png` });
  if (walk.fired) await p.waitForTimeout(8000);
  // Faz 3: hedefe 8 m kala sıçra; 12 sn izle
  const tot = await p.evaluate(() => __mm.routeRun.total);
  await p.evaluate((t) => { window.__L('SICRAMA', { total: Math.round(t), replanned: !!__mm.routeRun.replanned }); __mm.setProgress((t - 8) / t); }, tot);
  await p.waitForTimeout(12000);
  const holdUi = await p.evaluate(() => ({ hold: !!document.querySelector('.mm-hold'), holdTxt: document.querySelector('.mm-hold')?.innerText.replace(/\n/g, ' ') ?? null }));
  console.log('SIÇRAMADAN 12 sn SONRA:', JSON.stringify(holdUi));
  if (holdUi.hold) {
    await p.keyboard.down('KeyE'); await p.waitForFunction(() => !document.querySelector('.mm-hold'), null, { timeout: 40000 }).catch(() => {}); await p.keyboard.up('KeyE'); await p.waitForTimeout(3000);
    const t2 = await p.evaluate(() => ({ leg: __mm.routeRun?.leg ?? null, total: Math.round(__mm.routeRun?.total ?? -1) }));
    console.log('E bırakıldıktan sonra:', JSON.stringify(t2));
    if (t2.leg === 'return') { await p.evaluate((t) => __mm.setProgress((t - 8) / t), t2.total); await p.waitForTimeout(12000); }
  }
  await p.screenshot({ path: `s2_teshis_${ID}_son.png` });
  const fin = await p.evaluate(() => { const sn = __mm.wire.machine?.snapshot(); return { screen: document.getElementById('flow')?.dataset.screen, report: !!document.querySelector('.mm-grade-letter'), ms: sn && { state: sn.state, leg: sn.leg ?? null, triggered: sn.triggered, sampled: sn.sampled }, toast: document.getElementById('toast')?.textContent }; });
  console.log('SON:', JSON.stringify(fin));
  const log = await p.evaluate(() => window.__log); fs.writeFileSync(`s2_teshis_${ID}_zaman_cizelgesi.json`, JSON.stringify({ konsol: con, log }, null, 1));
  console.log('konsol hatası/uyarı sayısı:', con.length, JSON.stringify(con.slice(0, 4)));
  await br.close();
})();
