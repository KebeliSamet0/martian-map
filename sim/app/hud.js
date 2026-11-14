// HUD — yürürken göstergeler (Veysel). Batu için tek satır:
//   import { initHud } from './hud.js';  const hud = initHud(container, vitals);
// vitals.snapshot() yoksa sahte veriyle çizer. DOM ve stil bu dosyada + sim/ui.css.

import { t } from './i18n.js';

const CSS_ID = 'mm-ui-css';
export function ensureUiCss() {
  if (document.getElementById(CSS_ID)) return;
  const l = document.createElement('link');
  l.id = CSS_ID;
  l.rel = 'stylesheet';
  l.href = new URL('../ui.css', import.meta.url).href;
  document.head.appendChild(l);
}

// Tek eşleme noktası: MODULES.md gelince yalnız sağ taraftaki adlar güncellenir.
export const FIELDS = {
  elapsed: 'elapsed_min', timeLimit: 'time_limit_min',
  o2: 'o2_L', o2Limit: 'o2_limit_L',
  kcal: 'kcal', kcalLimit: 'kcal_limit',
  dose: 'dose_uGy', doseLimit: 'dose_limit_uGy',
  load: 'load_kg',
  returnMargin: 'return_margin_min', reserve: 'reserve_min',
  status: 'status',
};

export function readSnapshot(s) {
  const out = {};
  for (const [k, f] of Object.entries(FIELDS)) out[k] = s?.[f];
  return out;
}

const norm = (x) => {
  const u = String(x ?? '').toUpperCase().replace('İ', 'I');
  if (u.startsWith('NO')) return 'NO-GO';
  if (u.startsWith('DIK') || u.startsWith('CAU') || u.startsWith('WARN')) return 'DİKKAT';
  if (u === 'GO') return 'GO';
  return null;
};

export function computeStatus(v) {
  const given = norm(v.status);
  if (given) return given;
  const r = [[v.o2, v.o2Limit], [v.kcal, v.kcalLimit], [v.elapsed, v.timeLimit], [v.dose, v.doseLimit]]
    .filter(([a, b]) => a != null && b > 0).map(([a, b]) => a / b);
  if (r.some((x) => x > 1) || (v.returnMargin != null && v.returnMargin < 0)) return 'NO-GO';
  if (r.some((x) => x > 0.8) || (v.returnMargin != null && v.returnMargin < (v.reserve ?? 30))) return 'DİKKAT';
  return 'GO';
}

// Sahte vitals: 1 gerçek saniye = 1 görev dakikası. Yalnız vitals.js gelene kadar.
export function createFakeVitals({ minutesPerSecond = 1 } = {}) {
  const t0 = performance.now();
  return {
    fake: true,
    snapshot() {
      const m = ((performance.now() - t0) / 1000) * minutesPerSecond;
      const s = {};
      s[FIELDS.elapsed] = m; s[FIELDS.timeLimit] = 360;
      s[FIELDS.o2] = m * 0.92; s[FIELDS.o2Limit] = 420;
      s[FIELDS.kcal] = m * 4.4; s[FIELDS.kcalLimit] = 2000;
      s[FIELDS.dose] = m * 0.146; s[FIELDS.doseLimit] = 60;
      s[FIELDS.load] = 210 + Math.min(6, m / 20);
      s[FIELDS.returnMargin] = 360 - 30 - m * 1.9; s[FIELDS.reserve] = 30;
      return s;
    },
  };
}

const fmtTime = (min) => {
  if (min == null || !isFinite(min)) return '--:--';
  const t = Math.max(0, Math.round(min));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
const fmt = (x, d = 0) => (x == null || !isFinite(x) ? '—' : x.toFixed(d));

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function gauge(label, unit) {
  const row = el('div', 'mm-g');
  const top = el('div', 'mm-g-top');
  const name = el('span', 'mm-g-label', label);
  const val = el('span', 'mm-num');
  const u = el('span', 'mm-g-unit', unit);
  top.append(name, val, u);
  const bar = el('div', 'mm-bar');
  const fill = el('div', 'mm-bar-fill');
  bar.append(fill);
  row.append(top, bar);
  return {
    row,
    set(text, ratio) {
      val.textContent = text;
      if (ratio == null || !isFinite(ratio)) { bar.hidden = true; return; }
      bar.hidden = false;
      const r = Math.max(0, Math.min(1, ratio));
      fill.style.width = `${r * 100}%`;
      fill.dataset.level = ratio > 1 ? 'over' : ratio > 0.8 ? 'warn' : 'ok';
    },
  };
}

export function initHud(container, vitals, { position = 'tl', hz = 5 } = {}) {
  ensureUiCss();
  const src = vitals && typeof vitals.snapshot === 'function' ? vitals : createFakeVitals();

  const root = el('section', `mm-ui mm-hud mm-pos-${position}`);
  root.setAttribute('aria-label', 'Görev göstergeleri');
  const head = el('div', 'mm-hud-head');
  const title = el('span', 'mm-hud-title', t('hud.telemetry'));
  const status = el('span', 'mm-status');
  head.append(title, status);

  const g = {
    time: gauge(t('hud.time'), 'sa:dk'),
    o2: gauge(t('hud.o2'), t('hud.o2.unit')),
    kcal: gauge(t('hud.energy'), 'kcal'),
    dose: gauge(t('hud.dose'), 'µGy'),
    load: gauge(t('hud.load'), 'kg'),
    ret: gauge(t('hud.return'), t('unit.min')),
  };
  root.append(head, ...Object.values(g).map((x) => x.row));
  if (src.fake) root.append(el('div', 'mm-note', 'Sahte veri'));
  container.append(root);

  function update(snap) {
    const v = readSnapshot(snap);
    g.time.set(fmtTime(v.elapsed), v.timeLimit ? v.elapsed / v.timeLimit : null);
    const o2Left = v.o2Limit != null && v.o2 != null ? v.o2Limit - v.o2 : null;
    g.o2.set(fmt(o2Left), v.o2Limit ? v.o2 / v.o2Limit : null);
    g.kcal.set(fmt(v.kcal), v.kcalLimit ? v.kcal / v.kcalLimit : null);
    g.dose.set(fmt(v.dose, 1), v.doseLimit ? v.dose / v.doseLimit : null);
    g.load.set(fmt(v.load, 1), null);
    g.ret.set(fmt(v.returnMargin), null);
    g.ret.row.dataset.level = v.returnMargin == null ? '' : v.returnMargin < 0 ? 'over' : v.returnMargin < (v.reserve ?? 30) ? 'warn' : 'ok';
    const st = computeStatus(v);
    status.textContent = st;
    status.dataset.state = st === 'GO' ? 'go' : st === 'NO-GO' ? 'nogo' : 'warn';
    return st;
  }

  let raf = 0, last = 0, running = true;
  const period = 1000 / hz;
  const loop = (t) => {
    if (!running) return;
    if (t - last >= period) { last = t; try { update(src.snapshot()); } catch (e) { console.warn('HUD:', e); } }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    el: root,
    update,
    setVisible(v) { root.hidden = !v; },
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; raf = requestAnimationFrame(loop); } },
    destroy() { running = false; cancelAnimationFrame(raf); root.remove(); },
  };
}
