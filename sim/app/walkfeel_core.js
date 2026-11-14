// walkfeel_core.js — yürüyüş hissinin saf mantığı (DOM/Three.js yok; `node --test sim/tests/`).
// Katsayıların kaynağı api/planner/params.py ve cost.py'dir; her sabitin yanında satırı yazılı.
// sim/tests/walkfeel.test.mjs bu sabitleri params.py ile karşılaştırır: kopya sapma gösterirse test kırılır.
//
// Dürüstlük: hız çarpanı ve efor planlayıcıyla AYNI formüllerdir (Tobler + zemin hız katsayısı, Pandolf).
// Tökezleme olasılığı ve efor→nefes eşlemesi ise SUNUM ayarıdır (VARSAYIM etiketli), ölçüm değildir.

// ---- params.py kopyası (test ile doğrulanır) ----
export const PARAMS = {
  G_MARS: 3.71, G_EARTH: 9.81,                                 // params.py G_MARS, G_EARTH
  BODY_KG: 80.0, SUIT_KG: 120.0, TOOLS_KG: 10.0,               // params.py (VARSAYIM kütleler)
  BASE_SPEED_MS: 0.8,                                          // params.py BASE_SPEED_MS (VARSAYIM)
  FLAT_REFERENCE_W: 272.0,                                     // params.py FLAT_REFERENCE_W
  TERRAIN_ETA: { bedrock: 1.0, soil: 1.2, sand: 2.1, bigrock: 1.5 },        // Pandolf 1977 η
  TERRAIN_SPEED: { bedrock: 1.0, soil: 0.95, sand: 0.6, bigrock: 0.5 },     // VARSAYIM hız çarpanı
  SLOPE_RISKY_DEG: 15.0, SLOPE_NOGO_DEG: 25.0,                 // params.py eğim eşikleri
  SCAN_CAUTION_ROCK_CFA: 0.15,                                 // params.py: dikkat gerektiren kaya kaplama oranı
};
export const CLASSES = ['soil', 'bedrock', 'sand', 'bigrock'];  // AI4Mars sırası (params.CLASSES)

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// ---- cost.py: speed_ms / eta / _pandolf_raw ----
export function terrainSpeed(s) {
  return s.soil * PARAMS.TERRAIN_SPEED.soil + s.bedrock * PARAMS.TERRAIN_SPEED.bedrock + s.sand * PARAMS.TERRAIN_SPEED.sand + s.bigrock * PARAMS.TERRAIN_SPEED.bigrock;
}
export function eta(s) {
  return s.soil * PARAMS.TERRAIN_ETA.soil + s.bedrock * PARAMS.TERRAIN_ETA.bedrock + s.sand * PARAMS.TERRAIN_ETA.sand + s.bigrock * PARAMS.TERRAIN_ETA.bigrock;
}
/** Tobler yürüyüş fonksiyonu, düz zemine normalize (cost.py). tan işaretli: + yokuş yukarı, − aşağı. cost.py |tan| kullanır; burada yön bilindiği için işaretlidir. */
export function tobler(tanGrade) { return Math.exp(-3.5 * Math.abs(tanGrade + 0.05)) / Math.exp(-3.5 * 0.05); }

/** Hız çarpanı: 1 = düz ana kaya. Rota yürüyüşündeki ×timeScale'e çarpan olarak girer. */
export function speedMultiplier(s, tanGrade) {
  return Math.min(1.25, Math.max(0.12, terrainSpeed(s) * tobler(tanGrade)));
}

function pandolfRaw(v, gradePct, etaV, loadKg = 0) {
  const W = PARAMS.BODY_KG, Lk = PARAMS.SUIT_KG + PARAMS.TOOLS_KG + loadKg, gr = PARAMS.G_MARS / PARAMS.G_EARTH;
  return 1.5 * W + 2.0 * (W + Lk) * (Lk / W) ** 2 * gr + etaV * (W + Lk) * (1.5 * v * v + 0.35 * v * gradePct) * gr;
}
const CALIBRATION = PARAMS.FLAT_REFERENCE_W / pandolfRaw(PARAMS.BASE_SPEED_MS, 0, PARAMS.TERRAIN_ETA.bedrock);
/** Metabolik güç (W), düz ana kayada 272 W'a kalibre (cost.py metabolic_w). Eğim |G| (cost.py: iniş ve çıkış aynı). */
export function metabolicW(vMs, gradePct, etaV, loadKg = 0) { return pandolfRaw(vMs, Math.abs(gradePct), etaV, loadKg) * CALIBRATION; }

/** Efor 0..1 (nefes/baş sallanması için). SUNUM eşlemesi (VARSAYIM): düz ana kaya ≈ 0,18; ≈1,7× düz referans = 1. */
export function effort01(sample, tanGrade, loadKg = 0) {
  const mul = speedMultiplier(sample, tanGrade);
  const w = metabolicW(PARAMS.BASE_SPEED_MS * mul, tanGrade * 100, eta(sample), loadKg);
  return { w, effort: clamp01((w / PARAMS.FLAT_REFERENCE_W - 0.85) / 0.85) };
}

/** Yüzey karışımı (ses/ayak izi/toz için): kum, toprak, kaya (ana kaya + büyük kaya). */
export function surfaceMix(s) { return { sand: s.sand, soil: s.soil, rock: s.bedrock + s.bigrock }; }
export function dominantSurface(s) {
  const m = surfaceMix(s);
  return m.sand >= m.soil && m.sand >= m.rock ? 'sand' : m.soil >= m.rock ? 'soil' : 'rock';
}
/** Ayak izi derinliği 0..1: kumda belirgin, toprakta sığ, ana kayada yok. Kaya payı ≥ %65 → iz yok (sunum eşiği, VARSAYIM). */
export function printDepth(s) {
  const soft = s.sand * 1.0 + s.soil * 0.45, hard = s.bedrock + s.bigrock;
  if (hard >= 0.65) return 0;
  return clamp01(soft * 1.6 * (1 - hard * 0.8));
}

/** Adım başına tökezleme olasılığı (SUNUM ayarı, VARSAYIM): kayalık (rock_cfa, büyük kaya olasılığı) ve dik eğim. */
export function stumbleRisk(s, slopeDeg) {
  const rock = Math.max(clamp01(s.rock_cfa / PARAMS.SCAN_CAUTION_ROCK_CFA), clamp01((s.bigrock - 0.2) / 0.2));
  const steep = clamp01((slopeDeg - PARAMS.SLOPE_RISKY_DEG) / (PARAMS.SLOPE_NOGO_DEG - PARAMS.SLOPE_RISKY_DEG));
  const k = Math.max(rock, steep * 0.8);
  return k <= 0 ? 0 : 0.015 + 0.085 * k;      // en çok adımda ~%10
}

export function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** /layers/*.bin (float32, satır-önce, 1000×1000) örnekleyici. Eksik katman → ready=false. */
export function createLayerSampler({ w = 1000, h = 1000, layers }) {
  const L = layers;
  const has = !!(L && L.slope && L.p_sand && L.p_soil && L.p_bedrock && L.p_bigrock && L.rock_cfa);
  const at = (a, i) => { const v = a ? a[i] : 0; return Number.isFinite(v) ? v : 0; };
  return {
    ready: has,
    /** px = sürekli ızgara [sütun, satır]; alan dışı ya da katman yoksa null. */
    sample(px, py) {
      if (!has) return null;
      const c = Math.floor(px), r = Math.floor(py);
      if (c < 0 || r < 0 || c >= w || r >= h) return null;
      const i = r * w + c;
      const s = { soil: at(L.p_soil, i), bedrock: at(L.p_bedrock, i), sand: at(L.p_sand, i), bigrock: at(L.p_bigrock, i), rock_cfa: at(L.rock_cfa, i), slope: at(L.slope, i) };
      const sum = s.soil + s.bedrock + s.sand + s.bigrock;
      if (sum > 0 && Math.abs(sum - 1) > 1e-3) { s.soil /= sum; s.bedrock /= sum; s.sand /= sum; s.bigrock /= sum; }
      return s;
    },
  };
}
/** Katman yokken yedek örnek: yalnız eğim bilinir, zemin "toprak" varsayılır (arayüzde "yedek" etiketlenir). */
export const fallbackSample = (slopeDeg = 0) => ({ soil: 1, bedrock: 0, sand: 0, bigrock: 0, rock_cfa: 0, slope: slopeDeg });

/** Hareket yönü boyunca eğim tanjantı: toplam eğim × (hareket yönü ile yokuş yönü arasındaki kosinüs). (gx,gz) = arazi gradyanı, (hx,hz) = hareket birimi. */
export function tanAlong(slopeDeg, gx, gz, hx, hz) {
  const gm = Math.hypot(gx, gz);
  if (gm < 1e-6) return 0;
  return Math.tan((slopeDeg * Math.PI) / 180) * ((gx * hx + gz * hz) / gm);
}
