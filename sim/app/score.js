// Görev puanı ve yıldız (#125 B.4). DOM ve Three.js bağımsız; `node --test sim/tests/score.test.mjs`.
// Kural: bütün ölçütler gerçek tüketim sayılarından gelir. Veri yoksa ölçüt sayılmaz —
// eksik veri ödüle de cezaya da çevrilmez; karnede "veri yok" diye görünür.

const num = (v) => (Number.isFinite(v) ? v : null);

/** Bitişte kalan pay: O₂ bütçenin yüzdesi, süre ise dönüş payının yedeğe oranı. */
export function reserves({ actual = {}, limits = {} } = {}) {
  const o2Limit = num(limits.o2_L), used = num(actual.o2_L);
  const o2 = o2Limit > 0 && used != null ? Math.max(0, 1 - used / o2Limit) : null;
  const margin = num(actual.return_margin_min), reserve = num(limits.reserve_min);
  const time = margin != null && reserve > 0 ? margin / reserve : null;
  return { o2, time };
}

/** Kötü karar: planlayıcı riski düşüren bir rota önerdi, oyuncu reddetti. */
export function decisionQuality(decisions = []) {
  let good = 0, bad = 0, unknown = 0;
  for (const d of decisions) {
    const risk = num(d?.delta?.risk);
    if (risk == null) { unknown++; continue; }
    if (risk < 0) (d.accept ? good++ : bad++);
    else if (risk > 0 && !d.accept) good++;   // gereksiz riski almamak da iyi karar
  }
  return { good, bad, unknown, counted: good + bad };
}

/**
 * 1–3 yıldız. Tamamlanmamış görev 0 yıldız alır.
 * Ölçütler: (1) O₂ ve süre rezervi, (2) riskli zeminde geçen metre, (3) karar kalitesi.
 * Verisi olmayan ölçüt sayılmaz; `counted` hangilerinin sayıldığını söyler.
 */
export function missionScore({ actual = {}, limits = {}, decisions = [], hazardM = null, completed = true } = {}) {
  const r = reserves({ actual, limits });
  const q = decisionQuality(decisions);
  const haz = num(hazardM);
  const criteria = [];

  if (r.o2 != null && r.time != null) criteria.push({ key: 'reserve', ok: r.o2 >= 0.25 && r.time >= 1, value: Math.min(r.o2, 1) });
  else criteria.push({ key: 'reserve', ok: null, value: null });

  if (haz != null) criteria.push({ key: 'hazard', ok: haz <= 50, value: haz });
  else criteria.push({ key: 'hazard', ok: null, value: null });

  if (q.counted > 0) criteria.push({ key: 'decision', ok: q.bad === 0, value: q.bad });
  else criteria.push({ key: 'decision', ok: null, value: null });

  const counted = criteria.filter((c) => c.ok !== null);
  const points = counted.filter((c) => c.ok).length;
  const stars = !completed ? 0 : Math.max(1, Math.min(3, 1 + points));
  return { stars, points, criteria, counted: counted.map((c) => c.key), reserves: r, decisions: q };
}

const KEY = 'mm.best.v1';
const safeParse = (s) => { try { return JSON.parse(s) || {}; } catch { return {}; } };

/** Kişisel en iyi: yıldız, sonra kalan O₂. Depolama kapalıysa sessizce null döner. */
export function readBest(missionId, storage = globalThis.localStorage) {
  try { return safeParse(storage?.getItem(KEY))[missionId] ?? null; } catch { return null; }
}

export function writeBest(missionId, record, storage = globalThis.localStorage) {
  if (!missionId || !record) return null;
  try {
    const all = safeParse(storage?.getItem(KEY));
    const old = all[missionId] ?? null;
    const better = !old || record.stars > old.stars
      || (record.stars === old.stars && num(record.o2Left) != null && (num(old.o2Left) ?? -1) < record.o2Left);
    if (!better) return old;
    all[missionId] = record;
    storage?.setItem(KEY, JSON.stringify(all));
    return record;
  } catch { return null; }   // depolama kapalı/dolu: oyun etkilenmez
}
