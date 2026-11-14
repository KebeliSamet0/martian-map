// Akış ekranlarının saf (DOM'suz) yardımcıları; sim/tests/flow.test.mjs bunları sınar.

// Bakış yönü (yaw, sim: ileri = (sin yaw, −cos yaw)) ile hedef arasındaki göreli açı, radyan, (−π, π].
export function bearingRel(px, pz, yaw, gx, gz) {
  const d = Math.atan2(gx - px, -(gz - pz)) - yaw;
  return Math.atan2(Math.sin(d), Math.cos(d));
}

// Görev kartı özeti: veri yalnız missions.json alanlarından. Mesafe düz hattır (rota mesafesi rota hesaplanınca bilinir).
export function missionSummary(m, coords) {
  let straightM = null;
  try {
    if (m.start_px && m.goal_px && coords?.cellToWorld) {
      const a = coords.cellToWorld(m.start_px), b = coords.cellToWorld(m.goal_px);
      straightM = Math.hypot(a[0] - b[0], a[1] - b[1]);
    }
  } catch { /* koordinat yok */ }
  return { id: m.id, difficulty: m.difficulty ?? null, straightM, timeMin: m.limits?.time_min ?? null, o2L: m.limits?.o2_L ?? null };
}

export const fmtDist = (m) => (m == null ? '—' : m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);
