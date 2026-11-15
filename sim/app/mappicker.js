// "Kendi rotanı planla" harita ekranı (#120): HiRISE ortofoto üstünde A ve B seçimi.
// Katmanlar: geçilmez alan (eğim ≥ 20°, /layers/slope.bin), Curiosity durakları (128), bilim durakları (4), model belirsizliği (entropy).
// Hiçbir şey uydurulmaz: eğim ve belirsizlik planlayıcı katmanlarından; durak bilgisi /grid yanıtından. API yoksa seçim yapılabilir, uyarı verilmez.
import { el, button } from './screens.js';
import { t } from './i18n.js';
import { GRID_W, GRID_H, IMPASSABLE_DEG, MIN_STRAIGHT_M, O2_LIMITED_L, cellInfo, nearestPassable, straightMeters, etaMinutes, buildCustomMission, shareQuery, inGrid } from './custommission.js';

const CSS = `
.mm-picker{position:fixed;inset:0;z-index:2400;display:grid;grid-template-columns:minmax(0,1fr) 340px;background:#0b0e13;color:#e8e6e1;font:14px/1.45 system-ui,sans-serif}
.mm-picker-map{display:grid;place-items:center;min-width:0;min-height:0;background:#0b0e13}
.mm-picker canvas{width:min(100%,100vh);height:min(100%,100vh);aspect-ratio:1/1;display:block;cursor:crosshair;background:#10141b}
.mm-picker-side{padding:16px 18px;overflow:auto;background:rgba(14,17,23,.96);border-left:1px solid #2a303b;display:flex;flex-direction:column;gap:10px}
.mm-picker h2{margin:0;font-size:18px;color:#f2a93b}
.mm-picker .mp-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.mm-picker .mp-warn{color:#ffb4a8;background:rgba(255,70,50,.12);border:1px solid rgba(255,70,50,.35);padding:8px 10px;border-radius:8px;min-height:1.4em}
.mm-picker .mp-warn:empty{display:none}
.mm-picker .mp-eta{font-variant-numeric:tabular-nums}
.mm-picker .mp-info{font-size:13px;color:#cfd3da;background:#151a22;border:1px solid #2a303b;border-radius:8px;padding:8px 10px}
.mm-picker .mp-info:empty{display:none}
.mm-picker label{display:flex;gap:6px;align-items:center;cursor:pointer}
.mm-picker .mp-fine{font-size:12px;color:#9aa1ad}
@media(max-width:900px){.mm-picker{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto}}
`;

export async function loadPickerLayers(apiBase, call) {
  const get = async (n) => {
    const r = await fetch(`${apiBase}/layers/${n}.bin`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(n);
    const a = new Float32Array(await r.arrayBuffer());
    if (a.length !== GRID_W * GRID_H) throw new Error(`${n} boyutu`);
    return a;
  };
  const out = {};
  for (const n of ['slope', 'entropy']) { try { out[n] = await get(n); } catch { /* katman yok: o özellik kapalı */ } }
  return out;
}

/**
 * opts: { root, geo, coords, overviewUrl, grid({rover_stops,science_stops}), layers({slope,entropy}), initial({a,b,o2}),
 *         onCompute(mission), onBack() }
 * Dönen: { close(), state(), setA(c,r), setB(c,r), compute() } (test kancası da window.__mm.picker olarak bağlanır).
 */
export function openMapPicker(opts) {
  const { root, geo, coords, overviewUrl, grid = {}, layers = {}, initial, onCompute, onBack } = opts;
  if (!document.getElementById('mm-picker-css')) { const s = document.createElement('style'); s.id = 'mm-picker-css'; s.textContent = CSS; document.head.append(s); }
  const wrap = el('div', 'mm-picker'); wrap.dataset.testid = 'mappicker';
  const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 1000; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', t('custom.map.aria'));
  const side = el('aside', 'mm-picker-side');
  const mapBox = el('div', 'mm-picker-map'); mapBox.append(cv);
  wrap.append(mapBox, side); root.append(wrap);

  const st = { a: initial?.a ?? null, b: initial?.b ?? null, o2: initial?.o2 ?? null, warn: '', info: '', layersOn: { imp: true, rover: true, sci: true, ent: false }, next: 'a' };
  const g = cv.getContext('2d');
  const img = new Image(); let imgOk = false;
  img.onload = () => { imgOk = true; draw(); }; img.src = overviewUrl;

  // Izgara (px) ↔ dünya doğrusal (eqc): köşelerden iki nokta yeter.
  const w0 = coords.pxToWorld([0, 0]), w1 = coords.pxToWorld([GRID_W, GRID_H]);
  const toCanvas = ([c, r]) => [(c / GRID_W) * cv.width, (r / GRID_H) * cv.height];
  const toPx = (cx, cy) => [Math.floor((cx / cv.width) * GRID_W), Math.floor((cy / cv.height) * GRID_H)];

  // Ön-render: geçilmez alan ve belirsizlik katmanı (1000×1000 → canvas ölçeği).
  const paintLayer = (arr, fn) => {
    if (!arr) return null;
    const c = document.createElement('canvas'); c.width = GRID_W; c.height = GRID_H;
    const x = c.getContext('2d'), d = x.createImageData(GRID_W, GRID_H);
    for (let i = 0; i < arr.length; i++) { const px = fn(arr[i]); if (px) d.data.set(px, i * 4); }
    x.putImageData(d, 0, 0); return c;
  };
  const impLayer = paintLayer(layers.slope, (s) => (s >= IMPASSABLE_DEG ? [255, 59, 48, 110] : null));
  const entLayer = paintLayer(layers.entropy, (e) => (e >= 0.6 ? [180, 120, 255, Math.round(40 + 90 * Math.min(1, (e - 0.6) / 0.4))] : null));

  function draw() {
    g.clearRect(0, 0, cv.width, cv.height);
    if (imgOk) {
      const u = (x) => (x / geo.sizeX) * img.naturalWidth, v = (z) => (z / geo.sizeZ) * img.naturalHeight;
      g.drawImage(img, u(w0[0]), v(w0[1]), u(w1[0] - w0[0]), v(w1[1] - w0[1]), 0, 0, cv.width, cv.height);
    } else { g.fillStyle = '#1a2029'; g.fillRect(0, 0, cv.width, cv.height); }
    if (st.layersOn.ent && entLayer) g.drawImage(entLayer, 0, 0, cv.width, cv.height);
    if (st.layersOn.imp && impLayer) g.drawImage(impLayer, 0, 0, cv.width, cv.height);
    if (st.layersOn.rover) for (const s of grid.rover_stops ?? []) { const [x, y] = toCanvas(s.px); g.fillStyle = 'rgba(242,169,59,.9)'; g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); }
    if (st.layersOn.sci) for (const s of grid.science_stops ?? []) {
      const [x, y] = toCanvas(s.px); g.strokeStyle = '#4fd1ff'; g.lineWidth = 3; g.fillStyle = 'rgba(79,209,255,.25)';
      g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.stroke();
    }
    if (st.a && st.b) { const [ax, ay] = toCanvas(st.a), [bx, by] = toCanvas(st.b); g.setLineDash([8, 6]); g.strokeStyle = '#f2a93b'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.setLineDash([]); }
    for (const [p, label, fill] of [[st.a, 'A', '#0b0e13'], [st.b, 'B', '#f2a93b']]) {
      if (!p) continue; const [x, y] = toCanvas(p);
      g.beginPath(); g.arc(x, y, 13, 0, 7); g.fillStyle = fill; g.fill(); g.lineWidth = 3; g.strokeStyle = '#f2a93b'; g.stroke();
      g.fillStyle = fill === '#f2a93b' ? '#0b0e13' : '#f2a93b'; g.font = 'bold 16px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x, y + 1);
    }
  }

  // ---- Yan panel ----
  const title = el('h2', null, t('custom.title'));
  const help = el('p', 'mp-fine', t('custom.help'));
  const abLine = el('div', 'mm-num'); const etaLine = el('div', 'mp-eta'); etaLine.dataset.testid = 'mp-eta';
  const warnBox = el('div', 'mp-warn'); warnBox.dataset.testid = 'mp-warn'; warnBox.setAttribute('role', 'alert');
  const infoBox = el('div', 'mp-info'); infoBox.dataset.testid = 'mp-info';
  const toggles = el('div');
  const mkToggle = (key, label, avail = true) => {
    const l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.checked = st.layersOn[key]; c.disabled = !avail;
    c.onchange = () => { st.layersOn[key] = c.checked; draw(); };
    l.append(c, document.createTextNode(label)); toggles.append(l);
  };
  mkToggle('imp', t('custom.layer.impassable'), !!impLayer); mkToggle('rover', t('custom.layer.rover')); mkToggle('sci', t('custom.layer.science')); mkToggle('ent', t('custom.layer.uncertainty'), !!entLayer);
  const o2Box = document.createElement('label'), o2In = document.createElement('input'); o2In.type = 'checkbox'; o2In.checked = st.o2 === O2_LIMITED_L; o2In.dataset.testid = 'mp-o2';
  o2In.onchange = () => { st.o2 = o2In.checked ? O2_LIMITED_L : null; refresh(); };
  o2Box.append(o2In, document.createTextNode(t('custom.o2.limited')));
  const o2Hint = el('div', 'mp-fine', t('custom.o2.hint'));
  const compute = button(t('custom.compute')); compute.dataset.testid = 'mp-compute';
  const share = button(t('custom.share'), 'ghost'); share.dataset.testid = 'mp-share';
  const back = button(t('custom.back'), 'ghost'); back.dataset.testid = 'mp-back';
  const row = el('div', 'mp-row'); row.append(compute, share, back);
  const note = el('div', 'mp-fine', t('custom.eta.note'));
  side.append(title, help, abLine, etaLine, warnBox, infoBox, toggles, o2Box, o2Hint, row, note);

  const fmt = (p) => (p ? `${p[0]}, ${p[1]}` : '—');
  function stopInfo(p) {
    const near = (arr, rad) => (arr ?? []).map((s) => ({ s, d: Math.hypot(s.px[0] - p[0], s.px[1] - p[1]) })).filter((x) => x.d <= rad).sort((x, y) => x.d - y.d)[0]?.s;
    const sci = near(grid.science_stops, 8), rov = near(grid.rover_stops, 6);
    const brief = (s) => (s && s.length > 170 ? s.slice(0, 167).replace(/\s+\S*$/, '') + '…' : s);   // uzun bilim notu: ilk cümleler
    if (sci) return `${t('custom.stop.science')}: ${sci.name ?? sci.id}${sci.why ? ` — ${brief(sci.why)}` : ''}`;
    if (rov) return `${t('custom.stop.rover')}: sol ${rov.sol}${rov.stop_id ? ` (${rov.stop_id})` : ''}`;
    return '';
  }
  function refresh() {
    abLine.textContent = `A: ${fmt(st.a)}   B: ${fmt(st.b)}`;
    let warn = '', blocked = false;
    for (const [name, p] of [['A', st.a], ['B', st.b]]) {
      if (!p || !layers.slope) continue;
      const ci = cellInfo(layers.slope, p);
      if (!ci.ok) {
        blocked = true;
        const np = nearestPassable(layers.slope, p);
        warn += (warn ? ' ' : '') + `${name}: ` + (np ? t('custom.warn.steep', { slope: Math.round(ci.slope), m: np.m }) : t('custom.warn.steep.none', { slope: Math.round(ci.slope) }));
        st['near' + name] = np?.px ?? null;
      } else st['near' + name] = null;
    }
    if (st.a && st.b && straightMeters(st.a, st.b) < MIN_STRAIGHT_M) { warn += (warn ? ' ' : '') + t('custom.warn.short'); blocked = true; }
    st.warn = warn; warnBox.textContent = warn;
    if (st.a && st.b) { const m = straightMeters(st.a, st.b); etaLine.textContent = t('custom.eta', { m: Math.round(m), min: etaMinutes(m).toFixed(0) }); } else etaLine.textContent = '';
    st.info = st.b ? stopInfo(st.b) : ''; infoBox.textContent = st.info;
    compute.disabled = !(st.a && st.b) || blocked;
    share.disabled = !(st.a && st.b);
    draw();
  }
  function setPoint(which, c, r) {
    const p = [c, r]; if (!inGrid(p)) return false;
    st[which] = p; st.next = which === 'a' ? 'b' : 'a'; refresh(); return true;
  }
  const doCompute = () => {
    if (compute.disabled) return null;
    const m = buildCustomMission({ a: st.a, b: st.b, o2: st.o2, title: t('mission.CUSTOM.title') });
    close(); onCompute?.(m); return m;
  };
  const shareUrl = () => `${location.origin}${location.pathname}?${shareQuery({ a: st.a, b: st.b, o2: st.o2 })}`;
  share.onclick = async () => {
    if (!st.a || !st.b) return;
    const url = shareUrl();
    try { await navigator.clipboard.writeText(url); share.textContent = t('custom.share.done'); } catch { prompt(t('custom.share'), url); }
    setTimeout(() => { share.textContent = t('custom.share'); }, 2000);
  };
  compute.onclick = doCompute;
  back.onclick = () => { close(); onBack?.(); };
  cv.addEventListener('click', (e) => {
    const rc = cv.getBoundingClientRect(); const [c, r] = toPx(((e.clientX - rc.left) / rc.width) * cv.width, ((e.clientY - rc.top) / rc.height) * cv.height);
    setPoint(st.next, c, r);
  });
  const onKey = (e) => { if (e.code === 'Escape') { close(); onBack?.(); } };
  addEventListener('keydown', onKey);
  function close() { removeEventListener('keydown', onKey); wrap.remove(); if (window.__mm?.picker === api) delete window.__mm.picker; }

  const api = { close, setA: (c, r) => setPoint('a', c, r), setB: (c, r) => setPoint('b', c, r), compute: doCompute, shareUrl,
    state: () => ({ a: st.a, b: st.b, o2: st.o2, warn: st.warn, info: st.info, straightM: st.a && st.b ? straightMeters(st.a, st.b) : null,
      etaMin: st.a && st.b ? etaMinutes(straightMeters(st.a, st.b)) : null, canCompute: !compute.disabled, nearA: st.nearA ?? null, nearB: st.nearB ?? null }) };
  window.__mm = window.__mm ?? {}; window.__mm.picker = api;
  refresh(); compute.focus();
  return api;
}
