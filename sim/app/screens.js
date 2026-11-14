// Ekranlar (Veysel): brifing, rota seçimi, uyarılar, karne.
// Her ekran bir Promise döndürür; Batu akışı tek satırla bağlar:
//   const route = await showRoutePicker(container, apiResponse.routes);
import { ensureUiCss, readSnapshot } from './hud.js';

// Metinler sim/data/texts.json'dan (Elif Nisa). Gelene kadar yer tutucular.
const PLACEHOLDER = {
  'briefing.title': 'Görev brifingi',
  'briefing.start': 'Göreve başla',
  'briefing.limits': 'Limitler',
  'route.title': 'Rota seç',
  'route.pick': 'Bu rotayı seç',
  'alert.sand.title': 'Kum algılandı',
  'alert.sand.body': 'Önündeki zemin planlanandan yumuşak. Rota yeniden hesaplanabilir.',
  'alert.sand.replan': 'Yeniden planla',
  'alert.sand.continue': 'Devam et',
  'alert.limit.title': 'Sınır aşılıyor',
  'alert.limit.body': '{what} limitine yaklaşıyorsun. Üsse dönüş payını koru.',
  'alert.limit.return': 'Geri dön',
  'alert.limit.continue': 'Devam et',
  'report.title': 'Görev karnesi',
  'report.planned': 'Planlanan',
  'report.actual': 'Gerçekleşen',
  'report.grade': 'Derece',
  'report.close': 'Kapat',
  'report.retry': 'Tekrar dene',
};
const TEXTS = { ...PLACEHOLDER };

export async function loadTexts(url = new URL('../data/texts.json', import.meta.url)) {
  try {
    const r = await fetch(url);
    if (r.ok) Object.assign(TEXTS, await r.json());
  } catch { /* yer tutucularla devam */ }
  return TEXTS;
}
loadTexts();

export const t = (key, vars = {}) =>
  String(TEXTS[key] ?? PLACEHOLDER[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

// --- yardımcılar ---
function el(tag, cls, text) {
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
function modal(container, title) {
  ensureUiCss();
  const back = el('div', 'mm-ui mm-modal');
  const card = el('section', 'mm-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', title);
  card.append(el('h2', 'mm-card-title', title));
  back.append(card);
  container.append(back);
  return { back, card, close: () => back.remove() };
}
function button(text, kind = 'primary') {
  const b = el('button', `mm-btn mm-btn-${kind}`, text);
  b.type = 'button';
  return b;
}

// --- Brifing kartı ---
// mission: { name, target, limits: { time_min, kcal, o2_L, dose_uGy, reserve_min } }
// limits için API rotasının total.budget.limits nesnesi doğrudan verilebilir.
export function showBriefing(container, mission = {}) {
  return new Promise((resolve) => {
    const m = modal(container, t('briefing.title'));
    const L = mission.limits ?? {};
    m.card.append(
      el('div', 'mm-mission', mission.name ?? 'Görev adı'),
      el('p', 'mm-text', mission.target ?? 'Hedef: —'),
      el('h3', 'mm-sub', t('briefing.limits')),
    );
    const grid = el('div', 'mm-stats');
    grid.append(
      stat('Süre', n(L.time_min), 'dk'),
      stat('Enerji', n(L.kcal), 'kcal'),
      stat('Oksijen', n(L.o2_L), 'L'),
      stat('Doz', n(L.dose_uGy), 'µGy'),
      stat('Yedek', n(L.reserve_min), 'dk'),
    );
    const go = button(t('briefing.start'));
    go.onclick = () => { m.close(); resolve(); };
    m.card.append(grid, go);
    go.focus();
  });
}

// --- Rota seçim kartı: API /route yanıtındaki routes dizisi ---
export function showRoutePicker(container, routes = []) {
  return new Promise((resolve) => {
    const m = modal(container, t('route.title'));
    m.card.classList.add('mm-card-wide');
    const row = el('div', 'mm-routes');
    routes.forEach((r) => {
      const tt = r.total ?? {};
      const c = el('article', `mm-route mm-route-${r.kind}`);
      const top = el('div', 'mm-route-top');
      top.append(el('span', 'mm-route-name', r.label ?? r.kind), badge(tt.status ?? (tt.go ? 'GO' : 'NO-GO')));
      const s = el('div', 'mm-stats mm-stats-col');
      s.append(
        stat('Mesafe', n(tt.km, 2), 'km'),
        stat('Süre', n(tt.min), 'dk'),
        stat('Enerji', n(tt.kcal), 'kcal'),
        stat('Oksijen', n(tt.o2_L), 'L'),
      );
      const pick = button(t('route.pick'), 'ghost');
      pick.onclick = () => { m.close(); resolve(r); };
      c.append(top, s, pick);
      row.append(c);
    });
    m.card.append(row);
    row.querySelector('button')?.focus();
  });
}

// --- Uyarılar: ekranın üstünde bant; oyun durmaz ---
// kind: 'sand' → 'replan' | 'continue';  kind: 'limit' → 'return' | 'continue'
export function showAlert(container, kind, { what = 'Oksijen', timeoutMs = 0 } = {}) {
  ensureUiCss();
  return new Promise((resolve) => {
    container.querySelector(`.mm-alert[data-kind="${kind}"]`)?.remove();
    const a = el('div', 'mm-ui mm-alert');
    a.dataset.kind = kind;
    a.setAttribute('role', 'alert');
    const txt = el('div', 'mm-alert-text');
    txt.append(el('strong', null, t(`alert.${kind}.title`)), el('span', null, t(`alert.${kind}.body`, { what })));
    const acts = el('div', 'mm-alert-acts');
    const choices = kind === 'sand' ? ['replan', 'continue'] : ['return', 'continue'];
    let timer = 0;
    const done = (v) => { clearTimeout(timer); a.remove(); resolve(v); };
    choices.forEach((c, i) => {
      const b = button(t(`alert.${kind}.${c}`), i === 0 ? 'primary' : 'ghost');
      b.onclick = () => done(c);
      acts.append(b);
    });
    a.append(txt, acts);
    container.append(a);
    if (timeoutMs > 0) timer = setTimeout(() => done('continue'), timeoutMs);
  });
}

// --- Karne ---
// planned: seçilen rotanın total nesnesi; actual: vitals.snapshot() çıktısı.
export function gradeMission(planned, actual, { completed = true } = {}) {
  const a = readSnapshot(actual);
  if (!completed) return { grade: 'F', note: 'Görev tamamlanmadı' };
  const over = [[a.o2, a.o2Limit], [a.kcal, a.kcalLimit], [a.elapsed, a.timeLimit], [a.dose, a.doseLimit]]
    .some(([x, l]) => x != null && l > 0 && x > l);
  if (over) return { grade: 'D', note: 'Bir limit aşıldı' };
  const dev = [[a.elapsed, planned?.eva_min ?? planned?.min], [a.kcal, planned?.eva_kcal ?? planned?.kcal]]
    .filter(([x, p]) => x != null && p > 0).map(([x, p]) => Math.abs(x - p) / p);
  const worst = dev.length ? Math.max(...dev) : 0;
  if (worst <= 0.1) return { grade: 'A', note: 'Plana çok yakın' };
  if (worst <= 0.25) return { grade: 'B', note: 'Plandan küçük sapma' };
  return { grade: 'C', note: 'Plandan belirgin sapma' };
}

export function showReport(container, { planned = {}, actual = {}, completed = true, title } = {}) {
  return new Promise((resolve) => {
    const m = modal(container, title ?? t('report.title'));
    m.card.classList.add('mm-card-wide');
    const a = readSnapshot(actual);
    const g = gradeMission(planned, actual, { completed });

    const head = el('div', 'mm-grade');
    head.append(el('span', 'mm-grade-letter', g.grade), el('span', 'mm-text', `${t('report.grade')}: ${g.note}`));
    head.dataset.grade = g.grade;

    const tbl = el('table', 'mm-table');
    const thead = el('tr');
    ['', t('report.planned'), t('report.actual'), 'Fark'].forEach((h) => thead.append(el('th', null, h)));
    tbl.append(thead);
    const rows = [
      ['Süre (dk)', planned.eva_min ?? planned.min, a.elapsed, 0],
      ['Enerji (kcal)', planned.eva_kcal ?? planned.kcal, a.kcal, 0],
      ['Oksijen (L)', planned.o2_L, a.o2, 0],
      ['Doz (µGy)', planned.dose_uGy, a.dose, 1],
    ];
    rows.forEach(([label, p, x, d]) => {
      const tr = el('tr');
      const diff = p != null && x != null ? x - p : null;
      const td = el('td', 'mm-num', diff == null ? '—' : `${diff > 0 ? '+' : ''}${n(diff, d)}`);
      if (diff != null && p > 0) td.dataset.level = Math.abs(diff) / p > 0.25 ? 'over' : Math.abs(diff) / p > 0.1 ? 'warn' : 'ok';
      tr.append(el('td', null, label), el('td', 'mm-num', n(p, d)), el('td', 'mm-num', n(x, d)), td);
      tbl.append(tr);
    });

    const acts = el('div', 'mm-alert-acts');
    const retry = button(t('report.retry'), 'ghost');
    const close = button(t('report.close'));
    retry.onclick = () => { m.close(); resolve('retry'); };
    close.onclick = () => { m.close(); resolve('close'); };
    acts.append(retry, close);
    m.card.append(head, tbl, acts);
    close.focus();
  });
}
