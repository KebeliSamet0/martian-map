// Gerçek Mars haritası (Leaflet, enlem/boylam equirectangular): Trek HiRISE mozaiği, CTX, Viking tabanları + kapsama, eğim katmanı.
// Kullanıcı iki nokta işaretler (A, B) → Nav.route() → rota haritada eğim bandına göre renkli çizilir; "3B yürüyüş" ile FPS'e geçilir.
import { GRID, API_OFF, pxToWorld, worldToPx, pxInside, apiRoute, adaptRoute } from './api.js';
const L = window.L;
const TREK = 'https://trek.nasa.gov/tiles/Mars/EQ/';
const BAND = ['#30d158', '#a4d12a', '#ffd60a', '#ff9f0a', '#ff3b30'];
const bandOf = (s) => (s < 5 ? 0 : s < 10 ? 1 : s < 15 ? 2 : s < 20 ? 3 : 4);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class MapView {
  constructor(el, { man, geo, nav, base, onChange, toast, params }) {
    Object.assign(this, { man, geo, nav, base, onChange, toast: toast || (() => {}), params });
    this.a = null; this.b = null; this.route = null; this.mode = 'shortest'; this.maxSlope = 25;
    const b = man.bounds_lonlat;
    this.bounds = L.latLngBounds([b.s, b.w], [b.n, b.e]);
    this.map = L.map(el, { crs: L.CRS.EPSG4326, maxZoom: 19, minZoom: 6, zoomSnap: 0.25, attributionControl: true });
    const hirise = L.tileLayer(TREK + 'curiosity_hirise_mosaic/1.0.0//default/default028mm/{z}/{y}/{x}.png',
      { tileSize: 256, maxNativeZoom: 16, maxZoom: 19, noWrap: true, zIndex: 3, attribution: 'HiRISE · NASA/JPL/UArizona · Mars Trek' });
    const ctx = L.tileLayer('https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/{z}/{y}/{x}',
      { tileSize: 512, zoomOffset: -1, minZoom: 1, maxNativeZoom: 12, maxZoom: 19, noWrap: true, zIndex: 2, attribution: 'CTX · NASA/JPL/MSSS/Caltech Murray Lab · USGS OnMars' });
    const viking = L.tileLayer(TREK + 'Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0//default/default028mm/{z}/{y}/{x}.jpg',
      { tileSize: 256, maxNativeZoom: 7, maxZoom: 19, noWrap: true, zIndex: 1, attribution: 'Viking MDIM2.1 · NASA/USGS · Mars Trek' });
    viking.addTo(this.map); hirise.addTo(this.map);
    this.overview = L.imageOverlay(`${base}/${man.overview.file}`, this.bounds, { opacity: 0.95 });
    this.slopeLayer = L.imageOverlay(this._slopeCanvas(), this.bounds, { opacity: 0.55 });
    this.overview.addTo(this.map);   // yerel (internetsiz de çalışır)
    // Planlayıcı API bölgesi (contracts/grid.json 2×2 km): rota bu kutunun içinde API'den gelir; dışı yerel A* yedeği
    const gc = [[0, 0], [GRID.w, GRID.h]].map(([c, r]) => { const w = pxToWorld(geo, c, r), ll = geo.worldToLonlat(w[0], w[1]); return [ll[1], ll[0]]; });
    this.apiBox = L.rectangle(gc, { color: '#00e5ff', weight: 2, fill: false, dashArray: '4 4', interactive: false }).addTo(this.map);
    this.apiBox.bindTooltip('Planlayıcı API bölgesi (2×2 km)', { permanent: false });
    this.cover = L.rectangle(this.bounds, { color: '#ffd60a', weight: 2, fill: false, dashArray: '6 4', interactive: false }).addTo(this.map);
    // Gerçek Curiosity boxwork konumları (NASA MMGIS MSL_waypoints.json; denetlendi, bkz. tools/export_params.py)
    this.curiosity = L.layerGroup();
    for (const [name, label] of [['G.waypoint_sol_4534', 'sol 4534'], ['G.waypoint_sol_4541', 'sol 4541'], ['G.waypoint_sol_4671', 'sol 4671']]) {
      const w = params?.params?.[name]?.value; if (!w) continue;
      L.circleMarker([w.lat, w.lon], { radius: 7, color: '#fff', weight: 2, fillColor: '#a78bfa', fillOpacity: 1 }).addTo(this.curiosity)
        .bindPopup(`<b>Curiosity ${label}</b><br>site ${w.site} / drive ${w.drive}<br>${w.lat.toFixed(6)}°, ${w.lon.toFixed(6)}°<br>yükseklik (areoid) ${w.elev_geoid} m<br><i>Kaynak: NASA MMGIS MSL_waypoints.json</i>`);
    }
    this.curiosity.addTo(this.map);
    L.control.layers({ 'HiRISE gri (Trek, ≈0.6 m)': hirise, 'CTX': ctx, 'Viking renkli (232 m)': viking },
      { 'Renkli HiRISE (3B arazi dokusu)': this.overview, 'Eğim haritası (DTM)': this.slopeLayer, 'Curiosity boxwork konumları (NASA MMGIS)': this.curiosity }, { collapsed: true, autoZIndex: false }).addTo(this.map);
    L.control.scale({ imperial: false }).addTo(this.map);
    this.routeGroup = L.featureGroup().addTo(this.map);
    this.map.fitBounds(this.bounds.pad(0.08));
    this.map.on('click', (e) => this._click(e.latlng));
    this.map.on('mousemove', (e) => {
      const [x, z] = geo.lonlatToWorld(e.latlng.lng, e.latlng.lat), y = nav.heightAt(x, z);
      const t = document.getElementById('coord');
      if (t) t.textContent = `${e.latlng.lat.toFixed(4)}°, ${e.latlng.lng.toFixed(4)}°` + (isNaN(y) ? '' : ` · yükseklik ${(y + geo.zref).toFixed(0)} m`);
    });
  }

  _slopeCanvas() {
    const { nav } = this, c = document.createElement('canvas'); c.width = nav.w; c.height = nav.h;
    const ctx = c.getContext('2d'), img = ctx.createImageData(nav.w, nav.h), sg = nav.slopeGrid();
    const col = [[48, 209, 88], [164, 209, 42], [255, 214, 10], [255, 159, 10], [255, 59, 48]];
    for (let i = 0; i < sg.length; i++) {
      if (isNaN(sg[i])) { img.data[i * 4 + 3] = 0; continue; }
      const k = col[bandOf(sg[i])]; img.data.set([k[0], k[1], k[2], 200], i * 4);
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  setOptions({ mode, maxSlope }) { if (mode) this.mode = mode; if (maxSlope) this.maxSlope = maxSlope; this.compute(); }

  _marker(ll, label, color) {
    const m = L.marker(ll, { draggable: true, icon: L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14],
      html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid #fff;color:#000;font:700 14px/22px system-ui;text-align:center;box-shadow:0 0 6px #000">${label}</div>` }) });
    m.on('dragend', () => { const p = m.getLatLng(); this._set(label, p, false); this.compute(); });
    return m;
  }
  _set(which, ll, create = true) {
    let [x, z] = this.geo.lonlatToWorld(ll.lng, ll.lat);
    const key = which === 'A' ? 'a' : 'b';
    if (!this.geo.inside(x, z)) { this.toast('Seçilen nokta DTM veri alanı dışında (sarı kesikli çerçevenin içine tıkla).'); return false; }
    // Nokta DTM'in NoData boşluğundaysa en yakın GEÇERLİ yükseklik hücresine taşınır; kullanıcıya söylenir, işaret yeni yere konur.
    let shift = 0;
    if (isNaN(this.nav.heightAt(x, z))) {
      const c = this.nav.nearestValid(...this.nav.cellOf(x, z), 40);
      if (!c) { this.toast('Yakında (≈200 m) geçerli DTM verisi yok; başka bir nokta seç.'); return false; }
      const nx = (c[0] + 0.5) * this.nav.cx, nz = (c[1] + 0.5) * this.nav.cz;
      shift = Math.hypot(nx - x, nz - z); x = nx; z = nz;
      const [lo, la] = this.geo.worldToLonlat(x, z); ll = { lat: la, lng: lo };
      this.toast(`${which} noktası DTM veri boşluğundaydı: en yakın geçerli yükseklik hücresine ${Math.round(shift)} m kaydırıldı.`);
    }
    if (this[key]) { this[key].world = [x, z]; this[key].shift = shift; } else this[key] = { world: [x, z], shift };
    if (create) {
      if (this[key].marker) this.routeGroup.removeLayer(this[key].marker);
      this[key].marker = this._marker(ll, which, which === 'A' ? '#30d158' : '#ff3b30').addTo(this.routeGroup);
    } else if (this[key].marker && shift > 0) this[key].marker.setLatLng(ll);
    return true;
  }
  _click(ll) {
    if (this.a && this.b) { this.reset(false); }
    if (!this.a) { this._set('A', ll); this.toast('Başlangıç (A) işaretlendi. Hedefi (B) seç.'); return; }
    if (this._set('B', ll)) this.compute();
  }
  reset(clearAll = true) {
    this.routeGroup.clearLayers(); this.a = this.b = this.route = null; this.lines = null;
    if (clearAll) this.onChange?.(null);
  }

  async compute() {
    if (!this.a || !this.b) return;
    const tok = (this._tok = (this._tok || 0) + 1), t0 = performance.now();
    let r = null, why = '';
    if (!API_OFF) {
      try {
        const pa = worldToPx(this.geo, ...this.a.world), pb = worldToPx(this.geo, ...this.b.world);
        if (!pxInside(pa) || !pxInside(pb)) throw new Error('A/B planlayıcı bölgesinin (cyan kutu) dışında');
        const s = pa.map(Math.floor), g = pb.map(Math.floor);
        const res = await apiRoute(s, g);
        const rt = res.routes.find((x) => x.kind === this.mode) || res.routes[0];
        r = adaptRoute(rt, { geo: this.geo, nav: this.nav, suitSpeed: this.nav.suitSpeed, kind: this.mode });
        r.startPx = s; r.goalPx = g; r.gridInfo = res.grid;
      } catch (e) { why = String(e.message || e); r = null; }
      if (tok !== this._tok) return;   // daha yeni bir istek var
    }
    if (!r) {
      r = this.nav.route(...this.a.world, ...this.b.world, { mode: this.mode === 'safest' ? 'balanced' : this.mode, maxSlope: this.maxSlope });
      if (r.error) { this.toast(r.error); this._clearLines(); this.route = null; this.onChange?.(null); return; }
      r.source = 'local'; r.fallbackWhy = API_OFF ? 'api=off' : why;
      if (!API_OFF) this.toast(`Planlayıcı API kullanılamadı (${why}) → YEDEK: yerel A* rotası.`);
    }
    r.computeMs = Math.round(performance.now() - t0);
    r.start = { world: this.a.world, lonlat: this.geo.worldToLonlat(...this.a.world), name: 'A', shift_m: Math.round(this.a.shift || 0) };
    r.goal = { world: this.b.world, lonlat: this.geo.worldToLonlat(...this.b.world), name: 'B', shift_m: Math.round(this.b.shift || 0) };
    this.route = r; this._draw(r); this.onChange?.(r);
  }
  _clearLines() { if (this.lines) { this.routeGroup.removeLayer(this.lines); this.lines = null; } }
  _draw(r) {
    this._clearLines();
    const g = L.featureGroup(), ll = (p) => { const [lo, la] = this.geo.worldToLonlat(p[0], p[1]); return [la, lo]; };
    L.polyline(r.dense.map(ll), { color: '#000', weight: 8, opacity: 0.55 }).addTo(g);
    for (const s of r.segments) {
      const pl = L.polyline(r.dense.slice(s.idx[0], s.idx[1] + 1).map(ll), { color: BAND[bandOf(s.slope_max)], weight: 5 }).addTo(g);
      pl.bindPopup(r.source === 'api'
        ? `<b>Segment ${s.id}</b> · ${s.len_m} m · ${s.min} dk · ${s.kcal} kcal<br>eğim maks ${s.slope_max}° · ort ${s.slope_mean}°<br>zemin: ${esc(s.class)} · güven: ${esc(s.conf)} · p_kum ${s.p_sand}<br><i>${esc(s.reason)}</i>`
        : `<b>Segment ${s.id}</b> · ${s.len_m} m · ${s.min} dk<br>eğim maks ${s.slope_max}° · ort ${s.slope_mean}°<br>zemin sınıfı/güven: veri yok (yedek A*)`);
    }
    g.addTo(this.routeGroup); this.lines = g;
    this.map.fitBounds(L.latLngBounds(r.dense.map(ll)).pad(0.25), { maxZoom: 17 });
  }

  routeJSON() {
    const r = this.route; if (!r) return null;
    if (r.raw) return { grid: r.gridInfo, routes: [r.raw], _meta: { source: 'planlayici API /route', note: 'sim/app/api.js' } };
    return {
      kind: r.kind, start: { px: [r.start.world[0] / this.geo.resX, r.start.world[1] / this.geo.resZ].map((v) => Math.round(v * 10) / 10), name: 'A', lonlat: r.start.lonlat },
      goal: { px: [r.goal.world[0] / this.geo.resX, r.goal.world[1] / this.geo.resZ].map((v) => Math.round(v * 10) / 10), name: 'B', lonlat: r.goal.lonlat },
      total: r.total, segments: r.segments.map(({ idx, ...s }) => s),
      _meta: { generator: 'sim/app/nav.js A* (16 komşu) + doğrudan-görüş', max_slope_deg: r.maxSlope,
        snapped_to_valid_dtm_m: { A: r.start.shift_m, B: r.goal.shift_m }, grid: 'px = sim L0 hücre (HiRISE DTM 1,0117 m)',
        dtm: this.man.sources.dtm.id, note: 'Eğim 4 m ızgarada; zemin/kum/radyasyon/kalori planlayıcıdan gelecek (null).' },
    };
  }
}
export { esc };
