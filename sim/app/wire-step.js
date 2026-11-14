// /step modeli mesafe tabanlıdır; simülasyon saati ve durak tüketimi ayrıca korunur.
export function createStepAdapter({ call, coords, assumptions, observations = () => [] }) {
  const value = name => assumptions.find(p => p.name === name)?.value;
  const tools = value('Ekipman') ?? 0;
  const stopW = value('Düz zemin metabolik düzeyi');
  const oxygen = value('Oksijen dönüşümü')?.kcal_per_L_o2;
  const doseRate = value('Yüzey doz hızı');
  return { async step({ trace }) {
    const groups = [];
    for (const item of trace) {
      let g = groups.at(-1);
      if (!g || g.load !== item.load_kg) { g = { load: item.load_kg, trace: [] }; groups.push(g); }
      g.trace.push(item);
    }
    const delta = { kcal: 0, o2_L: 0, dose_uGy: 0 }, obs = structuredClone(observations());
    for (const group of groups) {
      const path = [coords.worldToPx(group.trace[0].from_world)];
      let idleSec = 0, elapsedSec = 0;
      for (const item of group.trace) {
        path.push(item.grid_px); elapsedSec += item.dt_sec;
        if (Math.hypot(item.world[0] - item.from_world[0], item.world[1] - item.from_world[1]) < 1e-6) idleSec += item.dt_sec;
      }
      if (!path.every(p => coords.inside(p))) throw new Error('İz API alanı dışında');
      const result = await call('/step', { path, load_kg: Math.max(0, group.load - tools), observations: obs });
      const idleKcal = idleSec ? idleSec * stopW / 4184 : 0;
      delta.kcal += result.kcal + idleKcal;
      delta.o2_L += result.o2_L + (idleSec ? idleKcal / oxygen : 0);
      // /step dose_uGy, model yürüyüş süresine aittir; gerçek sim saniyesiyle ölçekle.
      const rate = Number.isFinite(doseRate) ? doseRate / 3600 : result.duration_s > 0 ? result.dose_uGy / result.duration_s : NaN;
      delta.dose_uGy += elapsedSec * rate;
    }
    return { delta };
  } };
}
