// RAD doz birikimi (tur 4 / bilim). Mantık saf (Node'da test edilir); DOM kısmı aşağıda.
// Doz = yüzey doz hızı × süre. Hız: Curiosity RAD, Hassler vd. 2014 (0,21 ± 0,04 mGy/gün). Konuma bağlı doz haritası YOK:
// RAD rover üzerindeki bir zaman serisidir (docs/data/rad_rems_route.md §5-6); arazi gölgelemesi eklenmedi.

export const tx = (texts, path, dflt = '') => path.split('.').reduce((o, k) => (o == null ? o : o[k]), texts) ?? dflt;
const fin = (v) => typeof v === 'number' && Number.isFinite(v);

/** mGy/gün → µGy/saat */
export const perDayToUGyH = (mGyPerDay) => (mGyPerDay * 1000) / 24;

/** science.json > radiation → hız ve göreli belirsizlik */
export function radParams(rad) {
  const rateUGyH = perDayToUGyH(rad.absorbed_mGy_per_day);
  return {
    rateUGyH, relUnc: rad.absorbed_unc_mGy_per_day / rad.absorbed_mGy_per_day,
    eqPerGy: rad.equivalent_mSv_per_day / rad.absorbed_mGy_per_day,           // türetilmiş: H/D = 0,64/0,21
    solarMinRateUGyH: perDayToUGyH(rad.solar_min_mGy_per_day),
    budgetFallbackUGy: rad.budget_fallback_uGy, source: rad.source,
  };
}

/** API /assumptions içinden "Yüzey doz hızı" (µGy/saat); yoksa null. */
export function rateFromAssumptions(list) {
  const a = (Array.isArray(list) ? list : []).find((x) => x?.name === 'Yüzey doz hızı' && fin(Number(x.value)));
  return a ? Number(a.value) : null;
}

/** t saniyede birikmiş doz (µGy). */
export const doseAt = (rateUGyH, seconds) => (fin(rateUGyH) && fin(seconds) && seconds >= 0 ? (rateUGyH * seconds) / 3600 : null);

/** Ölçüm belirsizlik bandı [alt, üst] (µGy). */
export const doseBand = (dose, relUnc) => (fin(dose) && fin(relUnc) ? [dose * (1 - relUnc), dose * (1 + relUnc)] : null);

/** Doz zaman serisi: seyrek örnekler, bütçe oranı. */
export function createDoseLog({ budgetUGy = null, minStepSec = 15, maxPoints = 600 } = {}) {
  let pts = [];
  return {
    add(elapsedSec, doseUGy) {
      if (!fin(elapsedSec) || !fin(doseUGy)) return;
      const last = pts[pts.length - 1];
      if (last && elapsedSec < last.t) pts = [];                       // yeni koşu / geri sarma
      if (last && elapsedSec - last.t < minStepSec && pts.length > 1) pts[pts.length - 1] = { t: elapsedSec, d: doseUGy };
      else pts.push({ t: elapsedSec, d: doseUGy });
      if (pts.length > maxPoints) pts = pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1);
    },
    reset() { pts = []; },
    points: () => pts.slice(),
    last: () => pts[pts.length - 1] ?? null,
    fraction: () => (fin(budgetUGy) && budgetUGy > 0 && pts.length ? pts[pts.length - 1].d / budgetUGy : null),
    setBudget(b) { budgetUGy = b; },
  };
}

/** Rota alternatiflerinin tek yön doz tablosu. routes: [{kind,label,total:{min}}] */
export function routeDoseTable(routes, { rateUGyH, budgetUGy = null, chosenKind = null } = {}) {
  const rows = (routes ?? []).map((r) => {
    const min = r?.total?.min ?? r?.raw?.total?.min;
    const dose = fin(min) && fin(rateUGyH) ? (rateUGyH * min) / 60 : null;
    return { kind: r.kind, label: r.raw?.label ?? r.label ?? r.kind, min: fin(min) ? min : null, doseUGy: dose, frac: dose != null && fin(budgetUGy) && budgetUGy > 0 ? dose / budgetUGy : null, chosen: r.kind === chosenKind };
  });
  const known = rows.filter((x) => x.doseUGy != null).map((x) => x.doseUGy);
  const lo = known.length ? Math.min(...known) : null;
  return rows.map((x) => ({ ...x, deltaUGy: x.doseUGy != null && lo != null ? x.doseUGy - lo : null }));
}

const fmt = (v, d = 1) => (fin(v) ? Number(v).toLocaleString('tr', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
export { fmt as fmtNum };

// ---------------------------------------------------------------- DOM
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

export const BL_CSS = `
.bl-card{position:fixed;z-index:12;background:#14100df0;border:1px solid var(--line,#5a4332);border-radius:10px;color:var(--ink,#f3e3d3);font:12px/1.35 system-ui,sans-serif;padding:10px 12px;box-shadow:0 6px 20px #0008}
.bl-card[hidden]{display:none}
.bl-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.bl-title{font-weight:700;letter-spacing:.02em}
.bl-badge{font-size:10px;padding:1px 7px;border-radius:99px;border:1px solid #a78bfa;color:#c9b8ff;white-space:nowrap}
.bl-badge.rad{border-color:#5fd0ff;color:#9be1ff}
.bl-dim{color:var(--dim,#c9b4a2)}.bl-tiny{font-size:10.5px;color:var(--dim,#c9b4a2);margin-top:4px}
.bl-x{background:none;border:0;color:var(--dim,#c9b4a2);font-size:16px;line-height:1;cursor:pointer;padding:0 2px}
#bl-rad{right:14px;top:300px;width:290px}
#bl-rad .big{font-size:22px;font-weight:700}
.bl-inline{position:static;width:auto;box-shadow:none;background:none;border:0;padding:0}
.bl-line{position:fixed;z-index:12;box-sizing:border-box;padding:5px 10px 6px;background:#14100df0;border:1px solid var(--line,#5a4332);border-left:3px solid #5fd0ff;border-radius:4px;color:var(--ink,#f3e3d3);pointer-events:auto;cursor:pointer;font:11px/1.3 system-ui,sans-serif}.bl-line[hidden]{display:none}
.bl-line .t{display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:baseline}
.bl-line .k{color:#9be1ff;letter-spacing:.08em;font-weight:600}.bl-line .v{text-align:right;font-variant-numeric:tabular-nums}
.bl-line .bl-bar{margin:3px 0 0;height:6px}
.bl-bar{position:relative;height:10px;border-radius:5px;background:#2b1f18;border:1px solid #4b3a2c;margin:6px 0 2px;overflow:hidden}
.bl-bar i{position:absolute;left:0;top:0;bottom:0;background:#5fd0ff;transition:width .3s}
.bl-bar u{position:absolute;top:0;bottom:0;background:#5fd0ff55;transition:left .3s,width .3s}
.bl-bar[data-level=warn] i{background:#ffd60a}.bl-bar[data-level=over] i{background:#ff453a}
.bl-row{display:flex;justify-content:space-between;gap:10px}
#bl-rad canvas,.bl-inline canvas{display:block;width:100%;height:44px;margin-top:6px;background:#0f0b09;border-radius:6px}
.bl-cmp{margin-top:14px;padding-top:10px;border-top:1px solid #4b3a2c}
.bl-cmp h4{margin:0 0 6px;font-size:13px}
.bl-cmp .r{display:grid;grid-template-columns:96px 1fr 84px;gap:8px;align-items:center;margin:4px 0}
.bl-cmp .r b{font-weight:600}.bl-cmp .r.sel b::after{content:' ●';color:#5fd0ff}
.bl-cmp .bar{height:9px;border-radius:5px;background:#2b1f18;overflow:hidden}.bl-cmp .bar i{display:block;height:100%;background:#5fd0ff}
.bl-cmp .n{text-align:right;font-variant-numeric:tabular-nums}
`;
export function ensureBlCss() {
  if (typeof document === 'undefined' || document.getElementById('bl-css')) return;
  const s = el('style'); s.id = 'bl-css'; s.textContent = BL_CSS; document.head.append(s);
}

/** Yürüyüş sırasında doz çubuğu + grafik. get(): {doseUGy, elapsedSec, budgetUGy, plan:{min}|null} */
export function createDosePanel(parent, { texts, params, rateUGyH, rateSource, inline = false, log: sharedLog = null }) {
  ensureBlCss();
  const T = (k, d) => tx(texts, `bilim.rad.${k}`, d);
  const root = el('section', inline ? 'bl-card bl-inline' : 'bl-card'); if (!inline) { root.id = 'bl-rad'; root.hidden = true; } root.setAttribute('aria-label', T('title'));
  const head = el('div', 'bl-head'); head.append(el('span', 'bl-title', T('title')), el('span', 'bl-badge rad', tx(texts, 'bilim.badge_rad')));
  const big = el('div', 'big'); const sub = el('div', 'bl-row bl-dim'); const bar = el('div', 'bl-bar'); const fill = el('i'); const band = el('u'); bar.append(band, fill);
  const budgetRow = el('div', 'bl-row bl-dim'); const canvas = el('canvas'); canvas.width = 540; canvas.height = 128;
  const cav = el('div', 'bl-tiny', T('caveat'));
  root.append(head, big, sub, bar, budgetRow, canvas, cav); parent.append(root);
  const eqLine = el('div', 'bl-tiny'); root.insertBefore(eqLine, canvas);
  const log = sharedLog ?? createDoseLog({});
  let lastBudget = null, lastPlan = null;

  function draw(budget, plan) {
    const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, pts = log.points();
    g.clearRect(0, 0, W, H);
    const tPlan = plan?.min ? plan.min * 60 : 0, tMax = Math.max(tPlan, pts.at(-1)?.t ?? 0, 60);
    const dPlanEnd = tPlan && fin(rateUGyH) ? doseAt(rateUGyH, tPlan) : 0;
    const dMax = Math.max(budget ?? 0, dPlanEnd, pts.at(-1)?.d ?? 0, 1) * 1.08;
    const X = (t) => 6 + (t / tMax) * (W - 12), Y = (d) => H - 8 - (d / dMax) * (H - 16);
    if (fin(budget)) { g.strokeStyle = '#ff8a5c'; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(6, Y(budget)); g.lineTo(W - 6, Y(budget)); g.stroke(); g.setLineDash([]); g.fillStyle = '#ff8a5c'; g.font = '18px system-ui'; g.fillText(`${T('budget')} ${fmt(budget, 0)}`, 10, Y(budget) - 5); }
    if (tPlan && fin(rateUGyH)) { g.strokeStyle = '#9a8676'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(tPlan), Y(dPlanEnd)); g.stroke(); g.setLineDash([]); }
    if (pts.length > 1) { g.strokeStyle = '#5fd0ff'; g.lineWidth = 3; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(p.t), Y(p.d)) : g.moveTo(X(p.t), Y(p.d)))); g.stroke(); g.lineWidth = 1; }
  }

  return {
    el: root,
    log,
    setVisible(on) { root.hidden = !on; },
    reset() { log.reset(); lastBudget = null; },
    update({ doseUGy, elapsedSec, budgetUGy, plan }) {
      if (budgetUGy !== lastBudget) { log.setBudget(budgetUGy); lastBudget = budgetUGy; }
      lastPlan = plan ?? lastPlan;
      if (fin(doseUGy)) log.add(elapsedSec, doseUGy);
      const d = fin(doseUGy) ? doseUGy : log.last()?.d ?? null, frac = fin(d) && fin(budgetUGy) && budgetUGy > 0 ? d / budgetUGy : null;
      big.textContent = d == null ? T('no_run') : `${fmt(d, 2)} ${T('unit_ugy', 'µGy')}`;
      const b = d != null ? doseBand(d, params.relUnc) : null;
      sub.replaceChildren(el('span', null, `${T('range')}: ${b ? `${fmt(b[0], 2)} – ${fmt(b[1], 2)}` : '—'}`), el('span', null, frac == null ? '' : `%${fmt(frac * 100, 0)}`));
      fill.style.width = `${Math.min(100, (frac ?? 0) * 100)}%`;
      if (b && fin(budgetUGy) && budgetUGy > 0) { band.style.left = `${Math.min(100, (b[0] / budgetUGy) * 100)}%`; band.style.width = `${Math.max(0, Math.min(100, (b[1] / budgetUGy) * 100) - Math.min(100, (b[0] / budgetUGy) * 100))}%`; } else band.style.width = '0';
      bar.dataset.level = frac == null ? '' : frac > 1 ? 'over' : frac > 0.8 ? 'warn' : 'ok';
      budgetRow.replaceChildren(el('span', null, `${T('budget')}: ${fin(budgetUGy) ? `${fmt(budgetUGy, 0)} ${T('unit_ugy', 'µGy')}` : '—'}`), el('span', null, T('rate') + `: ${fmt(rateUGyH, 2)} µGy/sa`));
      budgetRow.title = `${T('budget_note')}\n${rateSource}`;
      eqLine.textContent = d == null ? '' : `${T('equiv')}: ${fmt((d * params.eqPerGy), 1)} µSv`;
      eqLine.title = T('equiv_note');
      draw(budgetUGy, lastPlan);
    },
    destroy() { root.remove(); },
  };
}

/** Karne bölümü: rotaların tek yön doz farkı (çubuklar). */
export function renderDoseCompare(rows, { texts }) {
  ensureBlCss();
  const T = (k, d) => tx(texts, `bilim.rad.${k}`, d);
  const root = el('section', 'bl-cmp');
  const h = el('h4', null, T('compare_title')); h.append(' ', el('span', 'bl-badge rad', tx(texts, 'bilim.badge_rad'))); root.append(h);
  const max = Math.max(...rows.map((r) => r.doseUGy ?? 0), 1e-9);
  for (const r of rows) {
    const row = el('div', `r${r.chosen ? ' sel' : ''}`);
    const bar = el('div', 'bar'); const i = el('i'); i.style.width = `${((r.doseUGy ?? 0) / max) * 100}%`; bar.append(i);
    row.append(el('b', null, r.label), bar, el('span', 'n', r.doseUGy == null ? '—' : `${fmt(r.doseUGy, 2)} µGy${r.deltaUGy > 0.004 ? ` (+${fmt(r.deltaUGy, 2)})` : ''}`));
    row.title = r.min == null ? '' : `${fmt(r.min, 0)} dk`;
    root.append(row);
  }
  root.append(el('div', 'bl-tiny', `${T('compare_note')} ${T('caveat')}`));
  return root;
}

/** Sağ altta, yaşam destek bloğunun hemen üstünde tek satırlık şerit (kendi öğemiz; akışın HUD'una dokunmaz). place(hudEl) bloğun konumunu OKUR. */
export function createDoseLine({ texts, params, onOpen }) {
  ensureBlCss();
  const T = (k, d) => tx(texts, `bilim.rad.${k}`, d);
  const root = el('div', 'bl-line'); root.title = T('line_hint'); root.hidden = true; root.setAttribute('role', 'button');
  const top = el('div', 't'), k = el('span', 'k', 'RAD'), v = el('span', 'v'), h = el('span', 'bl-dim', T('line_key'));
  const bar = el('div', 'bl-bar'), fill = el('i'), band = el('u'); bar.append(band, fill);
  top.append(k, v, h); root.append(top, bar); root.onclick = () => onOpen?.();
  document.body.append(root);
  return { el: root,
    place(hudEl) {
      const r = hudEl?.getBoundingClientRect();
      if (!r || !r.width) { root.style.visibility = 'hidden'; return; }
      Object.assign(root.style, { visibility: 'visible', width: `${r.width}px`, right: `${innerWidth - r.right}px`, bottom: `${innerHeight - r.top + 6}px` });
    },
    update(doseUGy, budgetUGy) {
      const frac = fin(doseUGy) && fin(budgetUGy) && budgetUGy > 0 ? doseUGy / budgetUGy : null;
      v.textContent = fin(doseUGy) ? `${fmt(doseUGy, 2)} µGy · %${fmt((frac ?? 0) * 100, 0)}` : '—';
      fill.style.width = `${Math.min(100, (frac ?? 0) * 100)}%`;
      const b = fin(doseUGy) ? doseBand(doseUGy, params.relUnc) : null;
      if (b && fin(budgetUGy) && budgetUGy > 0) { const lo = Math.min(100, (b[0] / budgetUGy) * 100), hi = Math.min(100, (b[1] / budgetUGy) * 100); band.style.left = `${lo}%`; band.style.width = `${Math.max(0, hi - lo)}%`; } else band.style.width = '0';
      bar.dataset.level = frac == null ? '' : frac > 1 ? 'over' : frac > 0.8 ? 'warn' : 'ok';
    } };
}
