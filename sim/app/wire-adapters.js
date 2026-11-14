// Ekip modüllerinin sözleşmelerini tek yerde eşleştirir; kaynak modüller değişmez.
export function hudSnapshot(s, limits = {}) {
  return { elapsed_min: s.elapsedSec / 60, time_limit_min: limits.time_min,
    o2_L: s.o2UsedL, o2_limit_L: limits.o2_L, kcal: s.kcal, kcal_limit: limits.kcal,
    dose_uGy: s.doseUGy, dose_limit_uGy: limits.dose_uGy, load_kg: s.loadKg,
    return_margin_min: s.returnMargin?.time_min, reserve_min: limits.reserve_min, status: s.status };
}
export function missionDefinition(m, route) {
  return { ...m, goal: { world: route.dense.at(-1), radius_m: 10 },
    events: m?.sand ? [{ id: `${m.id}-sand`, type: 'sand', grid_px: m.sand.px, radius_m: m.sand.radius_m }] : [] };
}
export function walkPlan(total) {
  // total.o2_L gidiş-dönüş, dose_uGy EVA süresi içindir. Karne tek yön yürüyüşü karşılaştırır.
  return { ...total, eva_min: total.min, eva_kcal: total.kcal,
    o2_L: total.eva_kcal > 0 ? total.o2_L * total.kcal / total.eva_kcal : null,
    dose_uGy: total.eva_min > 0 ? total.dose_uGy * total.min / total.eva_min : null };
}
export function uiTexts(texts) {
  return { ...texts, 'alert.sand.body': texts.alerts?.sand, 'alert.limit.body': '{what}',
    'report.title': texts.debrief?.title ?? 'Görev karnesi',
    'report.planned': texts.debrief?.planned ?? 'Planlanan', 'report.actual': texts.debrief?.actual ?? 'Gerçekleşen',
    'report.retry': 'Yeniden oyna', 'report.close': 'Haritaya dön' };
}
