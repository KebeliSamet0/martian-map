// "Kendi rotanı planla" harita ekranı (#120): HiRISE ortofoto üstünde A ve B seçimi.
// Katmanlar: geçilmez alan (eğim ≥ 20°, /layers/slope.bin), Curiosity durakları (128), bilim durakları (4), model belirsizliği (entropy).
// Hiçbir şey uydurulmaz: eğim ve belirsizlik planlayıcı katmanlarından; durak bilgisi /grid yanıtından. API yoksa seçim yapılabilir, uyarı verilmez.
import { el, button } from './screens.js';
import { t } from './i18n.js';
import { RES_M, GRID_W, GRID_H, IMPASSABLE_DEG, MIN_STRAIGHT_M, O2_LIMITED_L, cellInfo, nearestPassable, mainComponentMask, lineImpassable, straightMeters, etaMinutes, buildCustomMission, shareQuery, inGrid } from './custommission.js';

const ZOOM_MAX = 8, TILE_ZOOM_MIN = 1.5;   // 8× → 0,25 m/piksel karo dokusu (HiRISE)
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
.mm-picker .mp-zoom{display:flex;gap:6px;align-items:center}
.mm-picker .mp-zoom button{min-width:38px}
.mm-picker canvas.mp-drag{cursor:grabbing}
.mm-picker.mp-embed{position:relative;inset:auto;z-index:auto;height:min(64vh,calc(100vh - 330px));min-height:380px;border:1px solid #2a303b;border-top:3px solid #f2a93b}
.mm-picker.mp-embed{grid-template-rows:minmax(0,1fr)}
.mm-picker.mp-embed .mm-picker-map{overflow:hidden;position:relative}
.mm-picker.mp-embed canvas{position:absolute;inset:0;margin:auto;height:100%;width:auto;max-width:100%;max-height:100%;aspect-ratio:1/1}
.mm-picker.mp-embed .mm-picker-side{padding:12px 14px;gap:8px}
.mm-picker .mp-hover{font-size:13px;font-variant-numeric:tabular-nums;color:#cfd3da;min-height:1.4em}
.mm-picker .mp-hover[data-ok="0"]{color:#ffb4a8}.mm-picker .mp-hover[data-ok="1"]{color:#8fe3a1}
.mm-picker .mp-reach{font-size:13px;border-radius:8px;padding:8px 10px;border:1px solid #2a303b;background:#151a22}
.mm-picker .mp-reach:empty{display:none}.mm-picker .mp-reach[data-lvl="bad"]{color:#ffb4a8;border-color:rgba(255,70,50,.35)}
.mm-picker .mp-reach[data-lvl="warn"]{color:#ffd9a0;border-color:rgba(242,169,59,.4)}.mm-picker .mp-reach[data-lvl="ok"]{color:#8fe3a1}
.mm-picker .mp-snap{display:flex;gap:6px;flex-wrap:wrap}.mm-picker .mp-snap:empty{display:none}
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
  const { root, geo, coords, overviewUrl, grid = {}, layers = {}, initial, onCompute, onBack, embedded = false } = opts;   // tur5:secim embedded: seçim ekranının içinde, tam ekran değil
  if (!document.getElementById('mm-picker-css')) { const s = document.createElement('style'); s.id = 'mm-picker-css'; s.textContent = CSS; document.head.append(s); }
  const wrap = el('div', 'mm-picker'); wrap.dataset.testid = 'mappicker'; if (embedded) wrap.classList.add('mp-embed');
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
  // Görünüm: ızgara birimiyle kare pencere {x0, y0, w}; w = 1000 tüm harita, küçüldükçe yakınlaşır (en fazla ZOOM_MAX ×).
  const view = { x0: 0, y0: 0, w: GRID_W };
  const zoomOf = () => GRID_W / view.w;
  const clampView = () => { view.w = Math.max(GRID_W / ZOOM_MAX, Math.min(GRID_W, view.w)); view.x0 = Math.max(0, Math.min(GRID_W - view.w, view.x0)); view.y0 = Math.max(0, Math.min(GRID_H - view.w, view.y0)); };
  const toCanvas = ([c, r]) => [((c - view.x0) / view.w) * cv.width, ((r - view.y0) / view.w) * cv.height];
  const toPx = (cx, cy) => [Math.floor(view.x0 + (cx / cv.width) * view.w), Math.floor(view.y0 + (cy / cv.height) * view.w)];
  const zoomAt = (cxFrac, cyFrac, factor) => {   // imleç altındaki nokta yerinde kalır
    const gx = view.x0 + cxFrac * view.w, gy = view.y0 + cyFrac * view.w;
    view.w /= factor; clampView(); view.x0 = gx - cxFrac * view.w; view.y0 = gy - cyFrac * view.w; clampView(); draw();
  };

  // Yakında yüksek çözünürlük: görünür pencere için HiRISE doku karoları (3B sahnenin kullandığı /t/k/cx_cy.jpg dosyaları).
  const tileBase = overviewUrl.replace(/\/[^/]*$/, ''), tileCache = new Map();
  let raf = 0; const redraw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };
  const getTile = (k, cx, cy) => {
    const key = `${k}/${cx}_${cy}`; let e = tileCache.get(key);
    if (!e) { e = { img: new Image(), ok: false }; e.img.onload = () => { e.ok = true; redraw(); }; e.img.src = `${tileBase}/t/${key}.jpg`; tileCache.set(key, e); }
    return e.ok ? e.img : null;
  };
  const tileMpp = (k) => (geo.resX * 128 * 2 ** k) / (k === 0 ? 512 : 256);   // karo doku çözünürlüğü (m/piksel)
  const drawTiles = () => {
    if (zoomOf() < TILE_ZOOM_MIN) return;
    const mpp = (view.w * RES_M) / cv.width;                   // tuvalin bir pikseli kaç metre
    let k = 0; while (k < 7 && tileMpp(k + 1) <= mpp) k++;      // yeterince keskin en kaba düzey
    const sx = geo.resX * 128 * 2 ** k, sz = geo.resZ * 128 * 2 ** k;
    const gxOf = (X) => ((X - w0[0]) / (w1[0] - w0[0])) * GRID_W, gyOf = (Z) => ((Z - w0[1]) / (w1[1] - w0[1])) * GRID_H;
    const fx = (X) => ((gxOf(X) - view.x0) / view.w) * cv.width, fy = (Z) => ((gyOf(Z) - view.y0) / view.w) * cv.height;
    const wxOf = (gx) => w0[0] + (gx / GRID_W) * (w1[0] - w0[0]), wzOf = (gy) => w0[1] + (gy / GRID_H) * (w1[1] - w0[1]);
    const xa = wxOf(view.x0), xb = wxOf(view.x0 + view.w), za = wzOf(view.y0), zb = wzOf(view.y0 + view.w);
    for (let ty = Math.floor(za / sz); ty <= Math.floor(zb / sz); ty++) for (let tx = Math.floor(xa / sx); tx <= Math.floor(xb / sx); tx++) {
      if (tx < 0 || ty < 0) continue;
      const im = getTile(k, tx, ty); if (!im) continue;
      g.drawImage(im, fx(tx * sx), fy(ty * sz), fx((tx + 1) * sx) - fx(tx * sx) + 0.6, fy((ty + 1) * sz) - fy(ty * sz) + 0.6);
    }
  };

  // Ön-render: geçilmez alan ve belirsizlik katmanı (1000×1000 → canvas ölçeği).
  const paintLayer = (arr, fn) => {
    if (!arr) return null;
    const c = document.createElement('canvas'); c.width = GRID_W; c.height = GRID_H;
    const x = c.getContext('2d'), d = x.createImageData(GRID_W, GRID_H);
    for (let i = 0; i < arr.length; i++) { const px = fn(arr[i]); if (px) d.data.set(px, i * 4); }
    x.putImageData(d, 0, 0); return c;
  };
  const impLayer = paintLayer(layers.slope, (s) => (s >= IMPASSABLE_DEG ? [255, 59, 48, 80] : null));
  const entLayer = paintLayer(layers.entropy, (e) => (e >= 0.6 ? [180, 120, 255, Math.round(40 + 90 * Math.min(1, (e - 0.6) / 0.4))] : null));

  function draw() {
    zoomLbl.textContent = `${zoomOf().toFixed(1)}×`; zout.disabled = zoomOf() <= 1.001; zin.disabled = zoomOf() >= ZOOM_MAX - 0.001;
    g.clearRect(0, 0, cv.width, cv.height);
    if (imgOk) {
      const u = (x) => (x / geo.sizeX) * img.naturalWidth, v = (z) => (z / geo.sizeZ) * img.naturalHeight;
      const wx = (f) => w0[0] + f * (w1[0] - w0[0]), wz = (f) => w0[1] + f * (w1[1] - w0[1]);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(img, u(wx(view.x0 / GRID_W)), v(wz(view.y0 / GRID_H)), u(wx((view.x0 + view.w) / GRID_W) - wx(view.x0 / GRID_W)), v(wz((view.y0 + view.w) / GRID_H) - wz(view.y0 / GRID_H)), 0, 0, cv.width, cv.height);
      drawTiles();
    } else { g.fillStyle = '#1a2029'; g.fillRect(0, 0, cv.width, cv.height); }
    if (st.layersOn.ent && entLayer) g.drawImage(entLayer, view.x0, view.y0, view.w, view.w, 0, 0, cv.width, cv.height);
    if (st.layersOn.imp && impLayer) { g.imageSmoothingEnabled = false; g.drawImage(impLayer, view.x0, view.y0, view.w, view.w, 0, 0, cv.width, cv.height); g.imageSmoothingEnabled = true; }
    if (st.layersOn.rover) for (const s of grid.rover_stops ?? []) { const [x, y] = toCanvas(s.px); g.fillStyle = 'rgba(242,169,59,.9)'; g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); }
    if (st.layersOn.sci) for (const s of grid.science_stops ?? []) {
      const [x, y] = toCanvas(s.px); g.strokeStyle = '#4fd1ff'; g.lineWidth = 3; g.fillStyle = 'rgba(79,209,255,.25)';
      g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.stroke();
    }
    if (st.a && st.b) {
      const [ax, ay] = toCanvas(st.a), [bx, by] = toCanvas(st.b); g.setLineDash([8, 6]); g.strokeStyle = '#f2a93b'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      const li = st.line;   // tur5:secim: düz hattın geçilmez (≥20°) kısımları kırmızı
      if (li && li.fraction > 0) {
        g.strokeStyle = '#ff3b30'; g.lineWidth = 4; g.setLineDash([]); g.beginPath();
        for (let i = 0; i < li.samples; i++) if (li.hit[i]) { const f = i / (li.samples - 1), [x, y] = toCanvas([st.a[0] + (st.b[0] - st.a[0]) * f, st.a[1] + (st.b[1] - st.a[1]) * f]); g.moveTo(x - 0.1, y); g.lineTo(x + 0.1, y + 0.1); }
        g.stroke();
      }
      g.setLineDash([]);
    }
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
  const hoverBox = el('div', 'mp-hover'); hoverBox.dataset.testid = 'mp-hover';   // tur5:secim
  const reachBox = el('div', 'mp-reach'); reachBox.dataset.testid = 'mp-reach';
  const snapBox = el('div', 'mp-snap'); snapBox.dataset.testid = 'mp-snap';
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
  const zin = button('+', 'ghost'), zout = button('−', 'ghost'), zreset = button(t('custom.zoom.reset'), 'ghost');
  zin.dataset.testid = 'mp-zoom-in'; zout.dataset.testid = 'mp-zoom-out'; zreset.dataset.testid = 'mp-zoom-reset';
  zin.setAttribute('aria-label', t('custom.zoom.in')); zout.setAttribute('aria-label', t('custom.zoom.out'));
  const zoomRow = el('div', 'mp-zoom'); const zoomLbl = el('span', 'mp-fine'); zoomLbl.dataset.testid = 'mp-zoom-label'; zoomRow.append(zout, zin, zreset, zoomLbl);
  const zoomHint = el('div', 'mp-fine', t('custom.zoom.hint'));
  zin.onclick = () => zoomAt(0.5, 0.5, 1.6); zout.onclick = () => zoomAt(0.5, 0.5, 1 / 1.6); zreset.onclick = () => { view.x0 = 0; view.y0 = 0; view.w = GRID_W; draw(); };
  const row = el('div', 'mp-row'); row.append(compute, share, back);
  const note = el('div', 'mp-fine', t('custom.eta.note'));
  if (embedded) back.hidden = true;
  side.append(title, help, row, hoverBox, abLine, etaLine, warnBox, snapBox, reachBox, infoBox, toggles, o2Box, o2Hint, zoomRow, zoomHint, note);   // tur5:secim: Rotaları hesapla kıvrımın altında kalmasın

  const fmt = (p) => (p ? `${p[0]}, ${p[1]}` : '—');
  function stopInfo(p) {
    const near = (arr, rad) => (arr ?? []).map((s) => ({ s, d: Math.hypot(s.px[0] - p[0], s.px[1] - p[1]) })).filter((x) => x.d <= rad).sort((x, y) => x.d - y.d)[0]?.s;
    const sci = near(grid.science_stops, 8), rov = near(grid.rover_stops, 6);
    const brief = (s) => (s && s.length > 170 ? s.slice(0, 167).replace(/\s+\S*$/, '') + '…' : s);   // uzun bilim notu: ilk cümleler
    if (sci) return `${t('custom.stop.science')}: ${sci.name ?? sci.id}${sci.why ? ` — ${brief(sci.why)}` : ''}`;
    if (rov) return `${t('custom.stop.rover')}: sol ${rov.sol}${rov.stop_id ? ` (${rov.stop_id})` : ''}`;
    return '';
  }
  let maskMemo = null; const mainMask = () => (maskMemo ??= mainComponentMask(layers.slope));
  function refresh() {
    abLine.textContent = `A: ${fmt(st.a)}   B: ${fmt(st.b)}`;
    let warn = '', blocked = false;
    for (const [name, p] of [['A', st.a], ['B', st.b]]) {
      if (!p || !layers.slope) continue;
      const mask = mainMask();
      const ci = cellInfo(layers.slope, p, mask);
      if (!ci.ok) {
        blocked = true;
        const np = nearestPassable(layers.slope, p, 150, mask);   // yalnız ana geçilebilir bölge: ayrık adalar öneri olmaz
        const k = ci.island ? 'custom.warn.island' : 'custom.warn.steep';
        const sl = ci.island ? ci.slope.toFixed(1) : Math.round(ci.slope);   // eşik altı yazılırken yuvarlama 20° göstermesin
        warn += (warn ? ' ' : '') + `${name}: ` + (np ? t(k, { slope: sl, m: np.m }) : t(k + '.none', { slope: sl }));
        st['near' + name] = np?.px ?? null;
      } else st['near' + name] = null;
    }
    if (st.a && st.b && straightMeters(st.a, st.b) < MIN_STRAIGHT_M) { warn += (warn ? ' ' : '') + t('custom.warn.short'); blocked = true; }
    st.warn = warn; warnBox.textContent = warn;
    // tur5:secim: anında geçerlilik — taşı düğmesi, düz hat geçilmezlik oranı, eğim açısından erişilebilirlik
    snapBox.replaceChildren();
    for (const [name, key, which] of [['A', 'nearA', 'a'], ['B', 'nearB', 'b']]) {
      if (!st[key]) continue;
      const b = button(t('custom.snap', { p: name }), 'ghost'); b.dataset.testid = `mp-snap-${which}`;
      b.onclick = () => setPoint(which, st[key][0], st[key][1]); snapBox.append(b);
    }
    st.line = null; st.reach = null; reachBox.textContent = ''; reachBox.dataset.lvl = '';
    if (st.a && st.b && layers.slope && !blocked) {
      st.line = lineImpassable(layers.slope, st.a, st.b); st.reach = true;   // iki uç da ana bileşende (mainComponentMask) → eğim açısından erişilebilir; ayrı BFS gerekmez
      const pct = Math.round(st.line.fraction * 100);
      if (pct > 0) { reachBox.dataset.lvl = 'warn'; reachBox.textContent = t('custom.reach.detour', { pct }); }
      else { reachBox.dataset.lvl = 'ok'; reachBox.textContent = t('custom.reach.clear'); }
    }
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
  // Tekerlek = yakınlaştır (imleç noktasında); sürükle = kaydır; kısa tık = nokta seç.
  const frac = (e) => { const rc = cv.getBoundingClientRect(); return [(e.clientX - rc.left) / rc.width, (e.clientY - rc.top) / rc.height]; };
  cv.addEventListener('wheel', (e) => { e.preventDefault(); const [fx, fy] = frac(e); zoomAt(fx, fy, e.deltaY < 0 ? 1.25 : 1 / 1.25); }, { passive: false });
  let drag = null, moved = false;
  cv.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; drag = { x: e.clientX, y: e.clientY, x0: view.x0, y0: view.y0 }; moved = false; });
  cv.addEventListener('pointermove', (e) => {   // tur5:secim: imleç altındaki hücrenin eğimi ve geçerliliği
    if (!drag && layers.slope) {
      const rc = cv.getBoundingClientRect(), [c, r] = toPx(((e.clientX - rc.left) / rc.width) * cv.width, ((e.clientY - rc.top) / rc.height) * cv.height), ci = cellInfo(layers.slope, [c, r], mainMask());
      hoverBox.dataset.ok = ci.outside ? '' : ci.ok ? '1' : '0';
      hoverBox.textContent = ci.outside ? '' : `${c}, ${r} · ${Number.isFinite(ci.slope) ? ci.slope.toFixed(1) : '—'}° · ${t(ci.ok ? 'custom.hover.ok' : 'custom.hover.bad')}`;
    }
    if (!drag) return; const rc = cv.getBoundingClientRect(), dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    moved = true; cv.classList.add('mp-drag'); try { cv.setPointerCapture(e.pointerId); } catch {}
    view.x0 = drag.x0 - (dx / rc.width) * view.w; view.y0 = drag.y0 - (dy / rc.height) * view.w; clampView(); draw();
  });
  const endDrag = () => { drag = null; cv.classList.remove('mp-drag'); };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('click', (e) => {
    if (moved) { moved = false; return; }
    const rc = cv.getBoundingClientRect(); const [c, r] = toPx(((e.clientX - rc.left) / rc.width) * cv.width, ((e.clientY - rc.top) / rc.height) * cv.height);
    setPoint(st.next, c, r);
  });
  const onKey = (e) => { if (!embedded && e.code === 'Escape') { close(); onBack?.(); } };
  addEventListener('keydown', onKey);
  function close() { removeEventListener('keydown', onKey); wrap.remove(); if (window.__mm?.picker === api) delete window.__mm.picker; }

  const api = { close, view: () => ({ ...view, zoom: zoomOf() }), zoomBy: (f, fx = 0.5, fy = 0.5) => zoomAt(fx, fy, f), setA: (c, r) => setPoint('a', c, r), setB: (c, r) => setPoint('b', c, r), compute: doCompute, shareUrl,
    state: () => ({ a: st.a, b: st.b, o2: st.o2, warn: st.warn, info: st.info, straightM: st.a && st.b ? straightMeters(st.a, st.b) : null,
      etaMin: st.a && st.b ? etaMinutes(straightMeters(st.a, st.b)) : null, canCompute: !compute.disabled, nearA: st.nearA ?? null, nearB: st.nearB ?? null, lineFraction: st.line?.fraction ?? null, reachable: st.reach ?? null }) };
  window.__mm = window.__mm ?? {}; window.__mm.picker = api;
  refresh(); if (!embedded) compute.focus();
  return api;
}
