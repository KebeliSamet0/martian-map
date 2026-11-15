// Ekranlar: brifing, rota seçimi, uyarılar, karne. Metinler i18n.js üzerinden texts.json `ui` bölümünden gelir (tr/en).
// Her ekran bir Promise döndürür. Diğer desk'ler yuva (slots.js) ile içerik ekler.
import { ensureUiCss, readSnapshot } from './hud.js';
import { t, loadTexts, TEXTS } from './i18n.js';
import { fillSlot } from './slots.js';

export { t, loadTexts, TEXTS };
loadTexts();

// --- yardımcılar ---
export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
const n = (x, d = 0) => (x == null || !isFinite(x) ? '—' : Number(x).toFixed(d));
const badge = (status) => {
  const b = el('span', 'mm-status', status);
  b.dataset.state = status === 'GO' ? 'go' : status === 'NO-GO' ? 'nogo' : 'warn';
  return b;
};
function stat(label, value, unit) {
  const r = el('div', 'mm-stat');
  r.append(el('span', 'mm-g-label', label), el('span', 'mm-num', value), el('span', 'mm-g-unit', unit ?? ''));
  return r;
}
function modal(container, title, kicker) {
  ensureUiCss();
  const back = el('div', 'mm-ui mm-modal');
  const card = el('section', 'mm-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', title);
  if (kicker) card.append(el('div', 'mm-kicker', kicker));
  card.append(el('h2', 'mm-card-title', title));
  back.append(card);
  container.append(back);
  requestAnimationFrame(() => back.classList.add('mm-in'));
  return { back, card, close: () => back.remove() };
}
export function button(text, kind = 'primary') {
  const b = el('button', `mm-btn mm-btn-${kind}`, text);
  b.type = 'button';
  return b;
}
const section = (label) => el('h3', 'mm-sub', label);

// --- Brifing ---
// mission: { id, name, target, objective, science, limits, risks: string[], sampleKg }
// Çözümler: true (rotaları hesapla) | false (geri)
export function showBriefing(container, mission = {}) {
  return new Promise((resolve) => {
    const m = modal(container, t('briefing.title'), mission.id);
    m.card.classList.add('mm-card-brief');
    const L = mission.limits ?? {};
    m.card.append(el('div', 'mm-mission', mission.name ?? '—'));
    if (mission.target) m.card.append(el('p', 'mm-text', mission.target));
    if (mission.objective) m.card.append(section(t('briefing.objective')), el('p', 'mm-text mm-objective', mission.objective));
    const cols = el('div', 'mm-brief-cols');
    const left = el('div'), right = el('div');
    left.append(section(t('briefing.limits')));
    const grid = el('div', 'mm-stats mm-stats-col');
    grid.append(
      stat(t('limit.time'), n(L.time_min), t('unit.min')),
      stat(t('limit.kcal'), n(L.kcal), 'kcal'),
      stat(t('limit.o2'), n(L.o2_L), 'L'),
      stat(t('limit.dose'), n(L.dose_uGy), 'µGy'),
    );
    if (L.reserve_min != null) grid.append(stat(t('limit.reserve'), n(L.reserve_min), t('unit.min')));
    left.append(grid);
    right.append(section(t('briefing.risks')));
    const ul = el('ul', 'mm-risks');
    (mission.risks ?? []).forEach((r) => ul.append(el('li', null, r)));
    right.append(ul);
    cols.append(left, right);
    m.card.append(cols);
    if (mission.science) m.card.append(section(t('briefing.science')), el('p', 'mm-text mm-science', mission.science));
    const acts = el('div', 'mm-alert-acts mm-acts-end');
    const back = button(t('briefing.back'), 'ghost'), go = button(t('briefing.start'));
    back.onclick = () => { m.close(); resolve(false); };
    go.dataset.testid = 'briefing-start';
    go.onclick = () => { m.close(); resolve(true); };
    acts.append(back, go);
    m.card.append(acts);
    go.focus();
  });
}

// --- Rota seçimi: API /route yanıtındaki routes dizisi ---
// ctx.call / ctx.geo / ctx.mission yuvalara aktarılır. Geri düğmesi null döndürür.
export function showRoutePicker(container, routes = [], ctx = {}) {
  return new Promise((resolve) => {
    const m = modal(container, t('route.title'), ctx.mission?.id);
    m.card.classList.add('mm-card-wide');
    const row = el('div', 'mm-routes');
    routes.forEach((r) => {
      const tt = r.total ?? {};
      const c = el('article', `mm-route mm-route-${r.kind}`);
      c.dataset.testid = 'route-card';
      const top = el('div', 'mm-route-top');
      top.append(el('span', 'mm-route-name', r.label ?? r.kind), badge(tt.status ?? (tt.go ? 'GO' : 'NO-GO')));
      const s = el('div', 'mm-stats mm-stats-col');
      s.append(
        stat(t('route.distance'), n(tt.km, 2), t('unit.km')),
        stat(t('route.time'), n(tt.min), t('unit.min')),
        stat(t('route.energy'), n(tt.kcal), 'kcal'),
        stat(t('route.o2rt'), n(tt.o2_L), 'L'),
      );
      const pick = button(t('route.pick'), 'ghost');
      pick.dataset.testid = 'route-pick';
      pick.onclick = () => { m.close(); resolve(r); };
      c.append(top, s, pick);
      row.append(c);
    });
    m.card.append(row);
    // Veri desk'inin "model açık/kapalı" karşılaştırması ve benzerleri buraya girer.
    const extra = el('div', 'mm-route-extra');
    m.card.append(extra);
    void fillSlot('route-extra', { routes, ...ctx, container: extra }, extra);
    m.card.append(el('p', 'mm-fine', t('route.hint')));
    const acts = el('div', 'mm-alert-acts mm-acts-end');
    const back = button(t('briefing.back'), 'ghost');
    back.onclick = () => { m.close(); resolve(null); };
    acts.append(back);
    m.card.append(acts);
    row.querySelector('button')?.focus();
  });
}

// --- Uyarılar: ekranın üstünde bant; oyun durmaz ---
// kind: 'sand' → 'replan' | 'continue';  kind: 'limit' → 'return' | 'continue'
export function showAlert(container, kind, { what = '', timeoutMs = 0, actions = true } = {}) {
  ensureUiCss();
  return new Promise((resolve) => {
    container.querySelector(`.mm-alert[data-kind="${kind}"]`)?.remove();
    const a = el('div', 'mm-ui mm-alert');
    a.dataset.kind = kind; a.dataset.testid = 'event-alert';
    a.setAttribute('role', 'alert');
    const txt = el('div', 'mm-alert-text');
    txt.append(el('strong', null, t(`alert.${kind}.title`)), el('span', null, kind === 'limit' ? what : t(`alert.${kind}.body`, { what })));
    a.append(txt);
    let timer = 0;
    const done = (v) => { clearTimeout(timer); a.classList.remove('mm-in'); setTimeout(() => a.remove(), 250); document.body.classList.remove('mm-event'); resolve(v); };
    if (actions) {
      const acts = el('div', 'mm-alert-acts');
      const choices = kind === 'sand' ? ['replan', 'continue'] : ['return', 'continue'];
      choices.forEach((c, i) => {
        const b = button(t(`alert.${kind}.${c}`), i === 0 ? 'primary' : 'ghost');
        b.onclick = () => done(c);
        acts.append(b);
      });
      a.append(acts);
    }
    container.append(a);
    requestAnimationFrame(() => a.classList.add('mm-in'));
    if (kind === 'sand') document.body.classList.add('mm-event');   // kırmızı kenar vurgusu (CSS)
    if (timeoutMs > 0) timer = setTimeout(() => done('continue'), timeoutMs);
  });
}

// --- Karne ---
// planned: seçilen rotanın tek yön özeti (walkPlan); actual: hud.js alan adlarıyla anlık görüntü.
export function gradeMission(planned, actual, { completed = true } = {}) {
  const a = readSnapshot(actual);
  const out = (grade) => ({ grade, note: t(`report.note.${grade}`) });
  if (!completed) return out('F');
  const over = [[a.o2, a.o2Limit], [a.kcal, a.kcalLimit], [a.elapsed, a.timeLimit], [a.dose, a.doseLimit]]
    .some(([x, l]) => x != null && l > 0 && x > l);
  if (over) return out('D');
  const dev = [[a.elapsed, planned?.eva_min ?? planned?.min], [a.kcal, planned?.eva_kcal ?? planned?.kcal]]
    .filter(([x, p]) => x != null && p > 0).map(([x, p]) => Math.abs(x - p) / p);
  const worst = dev.length ? Math.max(...dev) : 0;
  return out(worst <= 0.1 ? 'A' : worst <= 0.25 ? 'B' : 'C');
}

// Karne TEK KEZ açılır: açıkken yeniden çağrılırsa aynı Promise döner (AKIS_TESTI sorun 5).
let activeReport = null;
export function showReport(container, opts = {}) {
  if (activeReport) return activeReport;
  const p = buildReport(container, opts).finally(() => { activeReport = null; });
  activeReport = p;
  return p;
}
export const reportOpen = () => !!activeReport;

function buildReport(container, { planned = {}, actual = {}, completed = true, title, route, mission } = {}) {
  return new Promise((resolve) => {
    const m = modal(container, title ?? t('report.title'), mission?.id);
    m.card.classList.add('mm-card-wide', 'mm-card-report');
    const a = readSnapshot(actual);
    const missing = [a.kcal, a.o2, a.dose].some((v) => v == null);
    const g = gradeMission(planned, actual, { completed });
    if (missing && completed) { g.grade = '—'; g.note = t('report.missing'); }

    const head = el('div', 'mm-grade');
    head.append(el('span', 'mm-grade-letter', g.grade), el('span', 'mm-text', g.note));
    head.dataset.grade = g.grade; head.firstChild.dataset.testid = 'debrief-grade';

    const tbl = el('table', 'mm-table'); tbl.dataset.testid = 'debrief';
    const thead = el('tr');
    ['', t('report.planned'), t('report.actual'), t('report.diff')].forEach((h) => thead.append(el('th', null, h)));
    tbl.append(thead);
    const rows = [
      [t('report.row.time'), planned.eva_min ?? planned.min, a.elapsed, 0],
      [t('report.row.kcal'), planned.eva_kcal ?? planned.kcal, a.kcal, 0],
      [t('report.row.o2'), planned.o2_L, a.o2, 0],
      [t('report.row.dose'), planned.dose_uGy, a.dose, 1],
    ];
    rows.forEach(([label, p, x, d]) => {
      const tr = el('tr');
      const diff = p != null && x != null ? x - p : null;
      const td = el('td', 'mm-num', diff == null ? '—' : `${diff > 0 ? '+' : ''}${n(diff, d)}`);
      if (diff != null && p > 0) td.dataset.level = Math.abs(diff) / p > 0.25 ? 'over' : Math.abs(diff) / p > 0.1 ? 'warn' : 'ok';
      tr.append(el('td', null, label), el('td', 'mm-num', n(p, d)), el('td', 'mm-num', n(x, d)), td);
      tbl.append(tr);
    });

    // "Verinin etkisi": veri desk'inin yuvası. Boşsa bölüm hiç görünmez (uydurma içerik yok).
    const insight = el('div', 'mm-insight');
    insight.hidden = true;
    const body = el('div', 'mm-insight-body');
    insight.append(section(t('report.insight')), body);
    void fillSlot('report-insight', { planned, actual, route, mission, completed, container: body }, body).then(() => { insight.hidden = !body.childNodes.length; });

    const acts = el('div', 'mm-alert-acts mm-acts-end');
    const retry = button(t('report.retry'), 'ghost');
    const other = button(t('report.other'));
    retry.onclick = () => { m.close(); resolve('retry'); };
    other.onclick = () => { m.close(); resolve('other'); };
    acts.append(retry, other);
    m.card.append(head, tbl, insight, acts);
    other.focus();
  });
}
