// Çevrimdışı yedek (tur4:deploy): planlayıcı API'si yanıt vermezse (çökme, soğuk başlangıç, ağ) POST /route için
// önceden hesaplanmış yanıtı döndürür. Dosyalar deploy/precompute_missions.py ile AYNI planlayıcıdan, gerçek katmanlarla üretilir
// (sim/data/routes/<görev>.json). Yalnız görev çiftleri (başlangıç, hedef, bütçe birebir eşleşirse) kapsanır; /replan hesaplanamaz.
// Arayüzde bu durum her zaman etiketlenir; önceden hesaplanmış rota canlı API gibi sunulmaz.
const HAS_WINDOW = typeof window !== 'undefined' && typeof window.fetch === 'function';   // Node testleri api.js'i pencere olmadan içe aktarır
const realFetch = HAS_WINDOW ? window.fetch.bind(window) : null;
const ROUTES = new URL('../data/routes/', import.meta.url);
let index = null, texts = null, badge = null;

const loadIndex = () => index ??= (async () => {
  const man = await (await realFetch(new URL('../data/missions.json', import.meta.url))).json();
  const out = [];
  for (const m of man.missions ?? []) {
    if (!m.start_px || !m.goal_px) continue;
    try { const r = await realFetch(new URL(`${m.id}.json`, ROUTES)); if (r.ok) out.push(await r.json()); } catch { /* dosya yok */ }
  }
  return out;
})();
const loadTexts = () => texts ??= realFetch(new URL('../data/texts.json', import.meta.url)).then(r => r.json()).catch(() => ({}));
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

async function showBadge() {
  const t = (await loadTexts()).offline?.badge;
  if (!t || badge) return;
  badge = document.createElement('div');
  badge.id = 'offline-badge'; badge.textContent = t; badge.setAttribute('role', 'status');
  badge.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:60;padding:6px 12px;border-radius:6px;background:#3b2a12;color:#ffd9a0;border:1px solid #a86a1c;font:12px system-ui,sans-serif;pointer-events:none';
  document.body.append(badge);
}

if (HAS_WINDOW) window.fetch = async function (input, init) {
  const url = typeof input === 'string' ? input : input?.url ?? String(input);
  const isRoute = init?.method === 'POST' && /\/route(\?|$)/.test(url);
  if (!isRoute) return realFetch(input, init);
  let failure;
  try {
    const res = await realFetch(input, init);
    if (res.status < 500) return res;
    failure = `HTTP ${res.status}`;
  } catch (e) { failure = e?.message ?? String(e); }
  try {
    const body = JSON.parse(init.body);
    const hit = (await loadIndex()).find(d => same(d.request.start, body.start) && same(d.request.goal, body.goal) && same(d.request.budget, body.budget));
    if (!hit) throw new Error('önceden hesaplanmış eşleşme yok');
    console.warn(`[offline] /route yedeği (${failure}); kaynak: ${hit.meta.source}`);
    window.__mmOffline = { since: Date.now(), reason: failure };
    void showBadge();
    return new Response(JSON.stringify(hit.response), { status: 200, headers: { 'Content-Type': 'application/json', 'X-MM-Offline': '1' } });
  } catch (e) {
    throw new Error(`${failure} (yedek yok: ${e.message})`);
  }
};
