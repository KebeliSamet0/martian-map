// CRISM bilim durakları: saha notu kartı, harita ve 3B katmanı (tur 4 / bilim).
// Veri: sim/data/science.json (elle, kaynaklı), sim/data/science_crism.json (sim/tools/crism_stops.py ile PDS browse PNG'sinden üretildi),
// konumlar /grid science_stops (layers/science_stops.json). Mantık saf; DOM/THREE/Leaflet bağımlılıkları aşağıda ve içeri verilir.
import { tx, ensureBlCss } from './radiation.js';

const fin = (v) => typeof v === 'number' && Number.isFinite(v);

export async function loadScienceData(fetcher = fetch, base = new URL('../data/', import.meta.url)) {
  const get = async (f) => { const r = await fetcher(new URL(f, base)); if (!r.ok) throw new Error(`${f} ${r.status}`); return r.json(); };
  const [science, crism] = await Promise.all([get('science.json'), get('science_crism.json')]);
  return { science, crism };
}

/** ızgara px → Mars eqc metre (grid.origin_xy_m, res_m) */
export const gridPxToXY = (px, grid) => [grid.origin_xy_m[0] + px[0] * grid.res_m, grid.origin_xy_m[1] - px[1] * grid.res_m];

/** ızgara px → CRISM görüntü pikseli (sürekli). map_info: ENVI map info (x0,y0,px_m). */
export function crismPixelOf(px, grid, mapInfo) {
  const [x, y] = gridPxToXY(px, grid);
  return [(x - mapInfo.x0) / mapInfo.px_m, (mapInfo.y0 - y) / mapInfo.px_m];
}

/** CRISM piksel (sürekli) → ızgara px; crismPixelOf'un tersi (UV üretimi için). */
export function gridPxOfCrism(ij, grid, mapInfo) {
  const x = mapInfo.x0 + ij[0] * mapInfo.px_m, y = mapInfo.y0 - ij[1] * mapInfo.px_m;
  return [(x - grid.origin_xy_m[0]) / grid.res_m, (grid.origin_xy_m[1] - y) / grid.res_m];
}

/** CRISM footprint ızgara kutusunu kapsıyor mu (4 köşe görüntü içinde mi)? */
export function gridInsideCrism(grid, mapInfo) {
  return [[0, 0], [grid.width, 0], [0, grid.height], [grid.width, grid.height]].every((c) => {
    const [i, j] = crismPixelOf(c, grid, mapInfo); return i >= 0 && j >= 0 && i < mapInfo.w && j < mapInfo.h;
  });
}

/** /grid science_stops + science.json + science_crism.json + texts → birleşik durak listesi */
export function mergeStops({ gridStops, science, crism, texts }) {
  return (gridStops ?? []).filter((s) => Array.isArray(s.px) && s.px.length === 2).map((s) => {
    const note = tx(texts, `bilim.stops.${s.id}`, null), meta = science?.crism?.stops?.[s.id] ?? null, pix = crism?.stops?.[s.id] ?? null;
    return { id: s.id, name: s.name, px: s.px, lat: s.lat, lon: s.lon, solRange: s.evidence?.sol_range ?? null,
      note, unit: meta?.unit ?? null, sources: meta?.sources ?? [], pixel: pix ? { valid: !!pix.valid, SINDEX2: pix.SINDEX2, BD2100_2: pix.BD2100_2, BD1900_2: pix.BD1900_2 } : null,
      hasNote: !!(note && meta) };
  });
}

export function nearestStop(px, stops, maxPx) {
  let best = null, bd = Infinity;
  for (const s of stops) { const d = Math.hypot(px[0] - s.px[0], px[1] - s.px[1]); if (d < bd) { bd = d; best = s; } }
  return best && bd <= maxPx ? { stop: best, distPx: bd } : null;
}

/** Yaklaşma izleyici: giriş ve çıkış (histerezis) olayları. İlk güncellemede içinde olunan durak sessizce "görüldü" sayılır. */
export function createStopWatcher({ stops, resM = 2, enterM = 40, leaveM = 70, onEnter, onLeave }) {
  let inside = null, first = true; const seen = new Set();
  return {
    update(px) {
      if (!px) return;
      if (inside) {
        if (Math.hypot(px[0] - inside.px[0], px[1] - inside.px[1]) * resM > leaveM) { const s = inside; inside = null; onLeave?.(s); }
        return;
      }
      const hit = nearestStop(px, stops, enterM / resM);
      if (hit && !seen.has(hit.stop.id)) {
        seen.add(hit.stop.id); inside = hit.stop;
        onEnter?.(hit.stop, { silent: first });
      } else if (hit) { /* daha önce görüldü */ }
      first = false;
    },
    reset() { inside = null; first = true; seen.clear(); },
    get inside() { return inside; },
  };
}

// ---------------------------------------------------------------- DOM
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

const NOTE_CSS = `
#bl-note{left:14px;top:168px;width:312px;max-height:min(350px,calc(100vh - 168px - 230px));overflow:auto;font-size:11.5px}
#bl-note[data-pos=map]{left:auto;right:14px;top:14px;max-height:calc(100vh - 28px)}
#bl-note h3{margin:0 0 2px;font-size:14px}
#bl-note .lab{margin-top:8px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#c9b8ff}
#bl-note p{margin:2px 0 0}
#bl-note .idx{display:grid;grid-template-columns:78px 1fr 30px;gap:6px;align-items:center;margin:3px 0}
#bl-note .idx .b{height:8px;border-radius:4px;background:#2b1f18;overflow:hidden}#bl-note .idx .b i{display:block;height:100%}
#bl-note .idx .n{text-align:right;font-variant-numeric:tabular-nums}
#bl-note ul{margin:2px 0 0;padding-left:16px}#bl-note a{color:#9be1ff}
.bl-crism{image-rendering:pixelated}
.bl-pin{background:#a78bfa;border:2px solid #fff;border-radius:50%;width:16px;height:16px;box-shadow:0 0 6px #000}
`;

/** Saha notu kartı. show(stop) / hide() / toggle(). */
export function createFieldNote(parent, { texts }) {
  ensureBlCss();
  if (!document.getElementById('bl-note-css')) { const s = el('style'); s.id = 'bl-note-css'; s.textContent = NOTE_CSS; document.head.append(s); }
  const T = (k) => tx(texts, `bilim.${k}`);
  const root = el('aside', 'bl-card'); root.id = 'bl-note'; root.hidden = true; root.setAttribute('aria-label', T('note_title'));
  let current = null;
  const api = {
    el: root,
    get current() { return current; },
    set current(s) { current = s; },
    get visible() { return !root.hidden; },
    fill(stop) { root.replaceChildren(...noteBody(stop, texts, () => api.hide())); },
    show(stop) { current = stop; api.fill(stop); root.hidden = false; },
    hide() { root.hidden = true; },
    toggle(fallbackStop) { if (!root.hidden) return api.hide(); const s = current ?? fallbackStop; if (s) api.show(s); },
    destroy() { root.remove(); },
  };
  parent.append(root);
  return api;
}

const INDEX_COLORS = { SINDEX2: '#ff6b6b', BD2100_2: '#5ee08a', BD1900_2: '#6aa8ff' };   // HYD kompozitinin R, G, B bantları

export function noteBody(stop, texts, onClose) {
  const T = (k) => tx(texts, `bilim.${k}`), n = stop.note ?? {};
  const head = el('div', 'bl-head'), close = el('button', 'bl-x', '×'); close.title = T('note_close'); close.setAttribute('aria-label', T('note_close')); close.onclick = (e) => { e.stopPropagation(); onClose?.(); };
  const tb = el('div'); tb.append(el('span', 'bl-badge', T('badge_crism'))); head.append(tb, close);
  const out = [head, el('h3', null, n.title ?? stop.name)];
  out.push(el('div', 'bl-dim', `${T('unit_label')}: ${n.unit ?? '—'}${stop.solRange ? ` · sol ${stop.solRange[0]}–${stop.solRange[1]}` : ''}`));
  if (n.signature) out.push(el('div', 'lab', T('sig_label')), el('p', null, n.signature));
  if (n.why) out.push(el('div', 'lab', T('why_label')), el('p', null, n.why));
  out.push(el('div', 'lab', T('pixel_label')));
  if (stop.pixel?.valid) {
    for (const k of ['SINDEX2', 'BD2100_2', 'BD1900_2']) {
      const row = el('div', 'idx'), bar = el('div', 'b'), i = el('i'); i.style.width = `${(stop.pixel[k] / 255) * 100}%`; i.style.background = INDEX_COLORS[k]; bar.append(i);
      row.append(el('span', 'bl-dim', k), bar, el('span', 'n', String(stop.pixel[k]))); out.push(row);
    }
    out.push(el('div', 'bl-tiny', T('pixel_note')));
  } else out.push(el('div', 'bl-tiny', T('pixel_invalid')));
  out.push(el('div', 'lab', T('src_label')));
  const ul = el('ul');
  for (const s of stop.sources ?? []) { const li = el('li'); if (s.url) { const a = el('a', null, s.label); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; li.append(a); } else li.textContent = s.label; ul.append(li); }
  out.push(ul);
  return out;
}

// ---------------------------------------------------------------- Leaflet
/** CRISM HYD browse'u footprint sınırlarında yarı saydam görüntü katmanı (nearest neighbour; 18 m piksel görünür). */
export function createCrismMapOverlay(L, crism, { opacity = 0.35, base = new URL('../', import.meta.url) } = {}) {
  const f = crism.footprint_latlon;
  return L.imageOverlay(new URL(crism.product.file, base).href, [[f.south, f.west], [f.north, f.east]], { opacity, className: 'bl-crism', interactive: false });
}

/** Bilim duraklarını haritaya işaret olarak koyar; tıklayınca saha notu açılır. */
export function addScienceMarkers(L, map, stops, onPick) {
  const grp = L.layerGroup();
  for (const s of stops) {
    if (!fin(s.lat) || !fin(s.lon)) continue;
    const m = L.marker([s.lat, s.lon], { icon: L.divIcon({ className: '', iconSize: [16, 16], iconAnchor: [8, 8], html: '<div class="bl-pin"></div>' }), title: s.note?.title ?? s.name });
    m.on('click', () => onPick(s)); m.addTo(grp);
  }
  grp.addTo(map); return grp;
}

// ---------------------------------------------------------------- THREE
/** CRISM HYD'yi arazi üzerine yarı saydam örtü olarak çizer (ızgara kutusu). groundY(x,z) → yükseklik|null. */
export function createCrismTerrainOverlay(THREE, { crism, grid, pxToWorld, groundY, base = new URL('../', import.meta.url), segments = 200, opacity = 0.3, lift = 0.35 }) {
  const mi = crism.map_info, N = segments, pos = new Float32Array((N + 1) ** 2 * 3), uv = new Float32Array((N + 1) ** 2 * 2);
  let k = 0, u = 0, lastY = 0;
  for (let r = 0; r <= N; r++) for (let c = 0; c <= N; c++) {
    const gp = [(c / N) * grid.width, (r / N) * grid.height], [x, z] = pxToWorld(gp[0], gp[1]), gy = groundY(x, z);
    if (fin(gy)) lastY = gy;
    pos[k++] = x; pos[k++] = lastY + lift; pos[k++] = z;
    const [i, j] = crismPixelOf(gp, grid, mi); uv[u++] = i / mi.w; uv[u++] = 1 - j / mi.h;
  }
  const idx = new Uint32Array(N * N * 6); let q = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const a = r * (N + 1) + c, b = a + 1, d = a + N + 1, e = d + 1; idx.set([a, d, b, b, d, e], q); q += 6; }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geom.setIndex(new THREE.BufferAttribute(idx, 1));
  const tex = new THREE.TextureLoader().load(new URL(crism.product.file, base).href);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false });
  const mesh = new THREE.Mesh(geom, mat); mesh.name = 'bl-crism-overlay'; mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.visible = false;
  return { mesh, setVisible(on) { mesh.visible = !!on; }, setOpacity(o) { mat.opacity = o; }, dispose() { geom.dispose(); mat.dispose(); tex.dispose(); } };
}

/** Bilim duraklarına ince ışık sütunu (3B'de yer işareti). */
export function createStopBeacons(THREE, { stops, pxToWorld, groundY, height = 22 }) {
  const grp = new THREE.Group(); grp.name = 'bl-stop-beacons';
  for (const s of stops) {
    const [x, z] = pxToWorld(s.px[0], s.px[1]), gy = groundY(x, z) ?? 0;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, height, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false }));
    m.position.set(x, gy + height / 2, z); m.userData.stopId = s.id; grp.add(m);
  }
  return { group: grp, dispose() { grp.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); } };
}
