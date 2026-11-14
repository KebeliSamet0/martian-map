// Akış desk'inin ekranlarına diğer desk'lerin modüllerini bağlayan yuva kaydı (tur4:akis).
// Kullanım (kendi modülünün en altında, import edilince kayıt olur):
//   import { registerSlot } from './slots.js';
//   registerSlot('route-extra', async ({ routes, call }) => elementOrNull);
// main.js'e yalnız `import './insight.js'; // tur4:veri` satırı eklenir.
//
// Yuvalar:
//   'route-extra'    fn({ routes, call, geo, mission }) -> Node|null|Promise   rota kartlarının altı (model açık/kapalı karşılaştırması)
//   'report-insight' fn({ planned, actual, route, mission, completed }) -> Node|null|Promise   karnede "verinin etkisi" bölümü
//   'pause-panel'    { id, title, render(container) }   Esc menüsünde sekme (veri katmanları paneli)
//
// Olaylar (window.addEventListener):
//   'mission:arrived'  detail: görev makinesi anlık görüntüsü; tek kez
//   'mm:screen'        detail: { screen, mission? }; screen = intro|select|briefing|computing|route|walk|pause|resume|report
const slots = { 'route-extra': [], 'report-insight': [], 'pause-panel': [] };

export function registerSlot(name, item) {
  if (!slots[name]) throw new Error(`bilinmeyen yuva: ${name}`);
  if (slots[name].includes(item)) return;
  slots[name].push(item);
}

export const slotItems = (name) => [...(slots[name] ?? [])];

// Yuvadaki her bileşeni çağırır; hata veren atlanır (bir desk'in hatası ekranı düşürmez).
export async function fillSlot(name, ctx, into) {
  for (const fn of slotItems(name)) {
    try {
      const node = await fn(ctx);
      if (node) into.append(node);
    } catch (e) { console.warn(`[slot ${name}]`, e); }
  }
}
