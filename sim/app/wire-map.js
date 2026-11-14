import { MapView } from './mapview.js';
import { API_OFF, adaptRoute } from './api.js';
const COLORS = { shortest: '#f97316', balanced: '#3b82f6', safest: '#22c55e' };

// MapView'ın işaret, sürükleme ve yerel A* davranışını koruyan entegrasyon.
export class MissionMap extends MapView {
  _set(...args) { if (!this.settingMission) this.onManual?.(); return super._set(...args); }
  reset(...args) { this._tok = (this._tok ?? 0) + 1; this.alternatives = []; super.reset(...args); if (!this.settingMission) this.onManual?.(); }
  setMission(m, coords) {
    this.settingMission = true;
    try {
      this.reset();
      for (const [name, px] of [['A', m.start_px], ['B', m.goal_px]]) {
        const [lng, lat] = this.geo.worldToLonlat(...coords.cellToWorld(px));
        if (!this._set(name, { lng, lat })) throw new Error(`${name} noktası arazi dışında`);
      }
    } finally { this.settingMission = false; }
  }
  async compute() {
    if (!this.a || !this.b) return;
    const token = this._tok = (this._tok ?? 0) + 1, start = performance.now();
    const a = this.a, b = this.b;
    this.onBusy?.(true);
    try {
      let routes, why;
      try {
        if (API_OFF) throw new Error('api=off');
        const from = this.coords.worldToPx(a.world), to = this.coords.worldToPx(b.world);
        if (!this.coords.inside(from) || !this.coords.inside(to)) throw new Error('API bölgesi dışında');
        const startPx = from.map(Math.floor), goalPx = to.map(Math.floor);
        const res = await this.call('/route', { start: startPx, goal: goalPx, ...(this.mission?.limits ? { budget: this.mission.limits } : {}) });
        routes = res.routes.map(raw => Object.assign(adaptRoute(raw, { geo: this.geo, nav: this.nav, suitSpeed: this.nav.suitSpeed }), { startPx, goalPx, gridInfo: res.grid }));
      } catch (e) { why = e.message; }
      if (token !== this._tok) return;
      if (!routes?.length) {
        const local = this.nav.route(...a.world, ...b.world, { mode: this.mode === 'safest' ? 'balanced' : this.mode, maxSlope: this.maxSlope });
        if (local.error) throw new Error(local.error);
        routes = [{ ...local, kind: 'local', label: 'Yerel yedek', source: 'local', fallbackWhy: why }];
      }
      for (const r of routes) {
        r.computeMs = Math.round(performance.now() - start);
        r.start = { world: [...a.world], shift_m: Math.round(a.shift ?? 0), lonlat: this.geo.worldToLonlat(...a.world) };
        r.goal = { world: [...b.world], shift_m: Math.round(b.shift ?? 0), lonlat: this.geo.worldToLonlat(...b.world) };
      }
      this.alternatives = routes;
      this.select(routes.find(r => r.kind === this.mode) ?? routes[0]);
    } catch (e) { if (token === this._tok) { this.route = null; this._clearLines(); this.onChange?.(null); this.toast(e.message); } }
    finally { if (token === this._tok) this.onBusy?.(false); }
  }
  select(r) { this.route = r; this.mode = r.kind; this._draw(r); this.onChange?.(r); }
  _draw(r) {
    super._draw(r);
    for (const alt of this.alternatives ?? []) {
      if (alt === r) continue;
      const ll = alt.dense.map(p => { const [lon, lat] = this.geo.worldToLonlat(...p); return [lat, lon]; });
      window.L.polyline(ll, { color: COLORS[alt.kind], weight: 3, opacity: 0.8, dashArray: '6 4' }).addTo(this.lines).bindTooltip(alt.raw?.label ?? alt.kind);
    }
    // Seçili rota aynı karşılaştırma rengiyle en üstte.
    window.L.polyline(r.dense.map(p => { const [lon, lat] = this.geo.worldToLonlat(...p); return [lat, lon]; }),
      { color: COLORS[r.kind] ?? '#ffb27a', weight: 4 }).addTo(this.lines);
  }
}
