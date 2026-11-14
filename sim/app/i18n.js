// Dil ve metin çözümleme (akış desk'i). Metinler sim/data/texts.json içindeki `ui` bölümünde {tr, en} alanlı tutulur.
// Çözümleme sırası: ui[key][lang] → ui[key].tr → düz anahtar (eski texts.json) → yer tutucu → anahtarın kendisi.
const PLACEHOLDER = {};
export const TEXTS = {};
const hasDom = typeof location !== 'undefined' && typeof document !== 'undefined';
const Q = new URLSearchParams(hasDom ? location.search : '');
const stored = (() => { try { return hasDom && localStorage.getItem('mm.lang'); } catch { return null; } })();
let lang = ['tr', 'en'].includes(Q.get('lang')) ? Q.get('lang') : ['tr', 'en'].includes(stored) ? stored : 'tr';
const subs = new Set();

export const getLang = () => lang;
export function setLang(l) {
  if (!['tr', 'en'].includes(l) || l === lang) return;
  lang = l;
  try { localStorage.setItem('mm.lang', l); } catch { /* depolama kapalı */ }
  if (hasDom) document.documentElement.lang = l;
  subs.forEach((fn) => fn(l));
}
export const onLang = (fn) => { subs.add(fn); return () => subs.delete(fn); };
if (hasDom) document.documentElement.lang = lang;

let loading = null;
export function loadTexts(url = new URL('../data/texts.json', import.meta.url)) {
  loading ??= (async () => {
    try { const r = await fetch(url); if (r.ok) Object.assign(TEXTS, await r.json()); } catch { /* yer tutucularla devam */ }
    return TEXTS;
  })();
  return loading;
}

export function t(key, vars = {}) {
  const u = TEXTS.ui?.[key];
  const raw = (u && (u[lang] ?? u.tr)) ?? TEXTS[key] ?? PLACEHOLDER[key] ?? key;
  return String(raw).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
export const has = (key) => !!TEXTS.ui?.[key];
// Görev metni: ui.mission.<id>.<alan> varsa onu, yoksa eski texts.missions.<id>.<alan> değerini verir.
export const missionText = (id, field) => (has(`mission.${id}.${field}`) ? t(`mission.${id}.${field}`) : TEXTS.missions?.[id]?.[field] ?? '');
