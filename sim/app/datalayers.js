// "Veri katmanları" paneli (tur 4 / bilim): kullanılan NASA veri türlerini tek yerde listeler.
// Mantık saf; render(container) DOM üretir. Akış desk'inin 'pause-panel' yuvasına bilim.js kaydeder.
import { tx, ensureBlCss } from './radiation.js';

/** science.json > layers + texts → satır modelleri. toggles: {overview,crism,rad} → {get,set} */
export function buildLayerRows({ science, texts, toggles = {} }) {
  return (science?.layers ?? []).map((l) => {
    const T = (k) => tx(texts, `bilim.layers.${l.id}.${k}`, '');
    const tg = toggles[l.toggle];
    return { id: l.id, type: T('type'), name: T('name'), where: T('where'), kind: T('kind'), url: l.url, doc: l.doc,
      mode: l.toggle === 'always' ? 'always' : tg ? 'toggle' : 'info', toggle: tg ?? null };
  });
}

/** Jüri sayacı: ölçüm tabanlı (model olmayan) kaç farklı veri türü var. */
export const countMeasuredTypes = (rows) => new Set(rows.filter((r) => !/model|sentetik/.test(r.kind)).map((r) => r.type)).size;

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

const CSS = `
.bl-layers{font:13px/1.4 system-ui,sans-serif;color:var(--ink,#f3e3d3);max-width:640px}
.bl-layers .intro{color:var(--dim,#c9b4a2);margin:0 0 10px}
.bl-layers .row{display:grid;grid-template-columns:96px 1fr auto;gap:10px;padding:9px 0;border-top:1px solid #4b3a2c;align-items:start}
.bl-layers .type{font-weight:700}
.bl-layers .kind{display:inline-block;font-size:10px;padding:0 7px;border-radius:99px;border:1px solid #8a7766;color:#c9b4a2;margin-left:6px}
.bl-layers .kind.m{border-color:#5ee08a;color:#8cf0ab}.bl-layers .kind.mod{border-color:#ffd60a;color:#ffe55c}
.bl-layers a{color:#9be1ff}.bl-layers .sm{font-size:11px;color:var(--dim,#c9b4a2)}
.bl-layers label{display:flex;gap:6px;align-items:center;white-space:nowrap;cursor:pointer}
.bl-layers .warn{margin-top:10px;font-size:11.5px;color:#ffd7a0}
`;

export function renderDataLayers(container, { science, texts, toggles }) {
  ensureBlCss();
  if (!document.getElementById('bl-layers-css')) { const s = el('style'); s.id = 'bl-layers-css'; s.textContent = CSS; document.head.append(s); }
  const T = (k) => tx(texts, `bilim.layers.${k}`);
  const rows = buildLayerRows({ science, texts, toggles });
  const root = el('div', 'bl-layers');
  root.append(el('h3', null, T('title')), el('p', 'intro', T('intro')));
  for (const r of rows) {
    const row = el('div', 'row'), mid = el('div'), right = el('div');
    const k = el('span', `kind ${/model/.test(r.kind) ? 'mod' : 'm'}`, r.kind);
    const name = el('div'); name.append(el('b', null, r.name), k);
    mid.append(name, el('div', 'sm', `${T('where')}: ${r.where}`));
    const src = el('div', 'sm'); src.append(`${T('source')}: `);
    if (r.url) { const a = el('a', null, r.url.replace(/^https?:\/\//, '').slice(0, 56)); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; src.append(a); }
    src.append(` · ${r.doc}`); mid.append(src);
    if (r.mode === 'toggle') {
      const lab = el('label'), cb = el('input'); cb.type = 'checkbox'; cb.checked = !!r.toggle.get(); cb.onchange = () => r.toggle.set(cb.checked);
      lab.append(cb, T('toggle')); right.append(lab);
    } else right.append(el('span', 'sm', r.mode === 'always' ? T('always') : T('info_only')));
    row.append(el('div', 'type', r.type), mid, right); root.append(row);
  }
  root.append(el('div', 'warn', `${T('crism_warn')} ${T('crism_ctx')}`));
  container.replaceChildren(root);
  return { rows };
}
