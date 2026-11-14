// walkfeel.js — yürüyüş hissi denetleyicisi: gerçek zemin katmanlarından hız çarpanı, ayak izi, toz, kamera, ses, tökezleme.
// Mantık walkfeel_core.js'te (planlayıcıyla aynı Tobler/Pandolf katsayıları). Burası onu sahneye bağlar.
//
// main.js bağlaması:
//   wf.sense(P, dt, active)      kareden önce: konumdaki katman örneği → wf.speedMul, wf.effort
//   wf.after(P, dt, active)      hareketten sonra: adım olayları (iz, toz, ses, tökezleme)
//   wf.cam(t, bobOn)             kamera ofseti {dy, pitch, roll}
//   wf.update(dt)                toz/iz güncelle;  wf.applyAstro(astro)  3. şahıs eğim/tökezleme
import * as THREE from 'three';
import { worldToPx } from './api.js';
import { createFootprints, createDust } from './footprints.js';
import * as C from './walkfeel_core.js';

const STRIDE_M = 0.75;          // adım boyu (m): yaklaşık, görsel ayarı (VARSAYIM; ayak izi aralığını belirler)
const FOOT_OFFSET_M = 0.13;     // sağ/sol ayak yanal ofseti
const STUMBLE_S = 0.9;          // tökezleme süresi
const STUMBLE_COOLDOWN_S = 6;
const TONE = { sand: [0.74, 0.52, 0.34], soil: [0.55, 0.37, 0.27], rock: [0.46, 0.41, 0.38] };   // toz tonu (sunum; ortofoto renginden türetilmedi)
const LAYERS = ['slope', 'p_sand', 'p_soil', 'p_bedrock', 'p_bigrock', 'rock_cfa'];
const smooth01 = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

export function createWalkFeel({ scene, camera, terrain, geo, audio = null, apiBase, apiOff = false, quality = 'high', toast = () => {}, text = () => null, seed = 4 } = {}) {
  const prints = createFootprints(scene, { max: quality === 'low' ? 160 : 480 });
  const dust = createDust(scene, { max: quality === 'low' ? 80 : 220 });
  const rng = C.mulberry32(seed);
  const sampler = { cur: C.createLayerSampler({ layers: null }) };
  const wf = {
    prints, dust,
    source: apiOff ? 'yedek' : 'bekliyor',      // 'katman' | 'yedek' | 'bekliyor'
    speedMul: 1, effort: 0.15, w: 0, sample: C.fallbackSample(0), tanGrade: 0, surface: 'soil', mix: { sand: 0, soil: 1, rock: 0 },
    stumbles: 0, steps: 0, enabled: true,
  };
  let hx = 0, hz = -1, lx = null, lz = null, stepDist = 0, side = 1, lastSoundAt = -1, stumbleT = 0, cooldown = 0, lastToastAt = -99;
  let cross = 0, tanS = 0, bobPhase = 0, swayAmp = 0, breathPhase = 0, stumbleSide = 1, dispSpeed = 0, lean = 0, gx = 0, gz = 0;
  const tmpN = new THREE.Vector3();

  /** /layers/*.bin yükle (6 × 4 MB, yerel API). Başarısızlıkta yalnız eğimden yedek kullanılır ve etiketlenir. */
  wf.load = async () => {
    if (apiOff) { wf.source = 'yedek'; return false; }
    try {
      const arrs = await Promise.all(LAYERS.map(async (n) => {
        const r = await fetch(`${apiBase}/layers/${n}.bin`, { signal: AbortSignal.timeout(15000) });
        if (!r.ok) throw new Error(`${n} ${r.status}`);
        const b = await r.arrayBuffer(); if (b.byteLength !== 1000 * 1000 * 4) throw new Error(`${n} boyut`);
        return new Float32Array(b);
      }));
      sampler.cur = C.createLayerSampler({ layers: Object.fromEntries(LAYERS.map((n, i) => [n, arrs[i]])) });
      wf.source = 'katman'; return true;
    } catch (e) { wf.source = 'yedek'; toast(text('layers_fallback') || 'Zemin katmanları alınamadı; eğimden hesaplanıyor.'); return false; }
  };

  const hAt = (x, z) => terrain.heightAt(x, z);

  function readGround(P) {
    const d = 1.5, a = hAt(P.x - d, P.z), b = hAt(P.x + d, P.z), c = hAt(P.x, P.z - d), e = hAt(P.x, P.z + d);
    if ([a, b, c, e].some((v) => v == null || Number.isNaN(v))) return null;
    gx = (b - a) / (2 * d); gz = (e - c) / (2 * d);       // arazi gradyanı (yokuş yukarı yön)
    const px = worldToPx(geo, P.x, P.z);
    let s = sampler.cur.sample(px[0], px[1]);
    const terrSlope = (Math.atan(Math.hypot(gx, gz)) * 180) / Math.PI;
    if (!s) s = C.fallbackSample(terrSlope);
    return { s, terrSlope };
  }

  wf.sense = (P, dt, active = true) => {
    if (!active) { wf.speedMul = 1; return; }
    const g = readGround(P); if (!g) return;
    wf.sample = g.s; wf.mix = C.surfaceMix(g.s); wf.surface = C.dominantSurface(g.s);
    const sl = sampler.cur.ready ? g.s.slope : g.terrSlope;
    const gm = Math.hypot(gx, gz) || 1;
    const tan = sampler.cur.ready ? C.tanAlong(sl, gx, gz, hx, hz) : gx * hx + gz * hz;
    cross = (Math.tan((sl * Math.PI) / 180)) * ((gx * -hz + gz * hx) / gm);
    wf.tanGrade = tan; tanS += (tan - tanS) * (1 - Math.exp(-dt * 2.5));
    const e = C.effort01(g.s, tan); wf.w = e.w;
    wf.effort += (e.effort - wf.effort) * (1 - Math.exp(-dt * 1.2));
    let mul = C.speedMultiplier(g.s, tan);
    if (stumbleT > 0) mul *= 0.3 + 0.7 * smooth01(1 - stumbleT / STUMBLE_S);   // tökezleme: kısa yavaşlama
    wf.speedMul = mul; wf.slopeDeg = sl;
  };

  wf.stumble = (strength = 1) => {
    if (stumbleT > 0) return;
    stumbleT = STUMBLE_S; cooldown = STUMBLE_COOLDOWN_S; wf.stumbles++; stumbleSide = rng() < 0.5 ? -1 : 1;
    audio?.stumble?.();
    const y = hAt(lx ?? 0, lz ?? 0);
    if (y != null) dust.emit(16, lx, y, lz, TONE[wf.surface === 'sand' ? 'sand' : wf.surface === 'soil' ? 'soil' : 'rock'], 1.6, hx, hz);
    const now = performance.now() / 1000;
    if (now - lastToastAt > 20) { lastToastAt = now; toast(text('stumble') || 'Tökezledin.'); }
  };

  function footStep(P, now) {
    side = -side; wf.steps++;
    const rx = -hz, rz = hx, x = P.x + rx * FOOT_OFFSET_M * side, z = P.z + rz * FOOT_OFFSET_M * side;
    const y = hAt(x, z); if (y == null || Number.isNaN(y)) return;
    const s = wf.sample, depth = C.printDepth(s), yaw = Math.atan2(hx, -hz);
    if (depth > 0) {
      const d = 0.4, nx = hAt(x - d, z) - hAt(x + d, z), nz = hAt(x, z - d) - hAt(x, z + d);
      tmpN.set(nx, 2 * d, nz).normalize();
      prints.add(x, z, yaw, depth, y, tmpN);
    }
    const m = wf.mix, n = Math.round((m.sand * 8 + m.soil * 4 + m.rock * 1.2) * (0.6 + 0.8 * wf.effort));
    if (n > 0) {
      const rgb = [0, 1, 2].map((k) => TONE.sand[k] * m.sand + TONE.soil[k] * m.soil + TONE.rock[k] * m.rock);
      dust.emit(n, x, y, z, rgb, 0.6 + 0.8 * Math.min(1, m.sand * 1.4), hx, hz);
    }
    if (audio && now - lastSoundAt > 0.42) { lastSoundAt = now; audio.step(m, 0.8 + 0.4 * wf.effort); }   // gösterim hızlandırmasında makineli tüfek olmasın
    const risk = C.stumbleRisk(s, wf.slopeDeg ?? s.slope);
    if (cooldown <= 0 && risk > 0 && rng() < risk) wf.stumble();
  }

  wf.after = (P, dt, active = true) => {
    if (!active) { lx = null; stepDist = 0; dispSpeed = 0; return; }
    if (lx == null) { lx = P.x; lz = P.z; return; }
    const dx = P.x - lx, dz = P.z - lz, d = Math.hypot(dx, dz);
    if (d > 6) { lx = P.x; lz = P.z; stepDist = 0; return; }       // ışınlanma/yeniden başlatma
    dispSpeed += (d / Math.max(1e-3, dt) - dispSpeed) * (1 - Math.exp(-dt * 8));
    if (d > 1e-4) { const k = Math.min(1, d / 0.05); hx += (dx / d - hx) * k * 0.5; hz += (dz / d - hz) * k * 0.5; const n = Math.hypot(hx, hz) || 1; hx /= n; hz /= n; }
    lx = P.x; lz = P.z;
    if (d < 1e-4) return;
    stepDist += d;
    const now = performance.now() / 1000;
    let guard = 4;
    while (stepDist >= STRIDE_M && guard-- > 0) { stepDist -= STRIDE_M; footStep(P, now); }
  };

  /** Kamera ofseti. Baş sallanması adım ritmini izler ama en çok ~2,2 adım/sn (hızlandırılmış gösterimde mide bulandırmasın). */
  wf.cam = (t, dt, bobOn = true, moving = false) => {
    const out = { dy: 0, pitch: 0, roll: 0 };
    if (!bobOn) return out;
    const rate = Math.min(2.2, Math.max(0, dispSpeed) / STRIDE_M);
    bobPhase += dt * rate * Math.PI * 2 * 0.5;                      // yarım faz = bir adım
    swayAmp += ((moving && rate > 0.1 ? 1 : 0) - swayAmp) * (1 - Math.exp(-dt * 4));
    const e = wf.effort;
    breathPhase = (breathPhase + dt * (13 + 27 * e) / 60) % 1;
    out.dy = Math.sin(bobPhase * 2) * 0.018 * (0.7 + 0.6 * e) * swayAmp - Math.sin(breathPhase * Math.PI * 2) * 0.006 * (0.4 + e);
    out.roll = Math.sin(bobPhase) * 0.0035 * swayAmp;
    out.pitch = Math.sin(breathPhase * Math.PI * 2) * 0.003 * (0.4 + e);
    // Eğimde denge: yokuşta hafif öne eğik, inişte hafif geriye; yan eğimde zemini kısmen izle (ufuk büyük ölçüde sabit kalır)
    out.pitch += -0.12 * Math.atan(tanS) * swayAmp;
    out.roll += -0.10 * Math.atan(cross) * swayAmp;
    if (stumbleT > 0) {
      const f = 1 - stumbleT / STUMBLE_S, env = Math.sin(Math.PI * Math.min(1, f * 1.05)) ** 1.5;
      out.dy -= 0.09 * env; out.pitch -= 0.06 * env; out.roll += 0.035 * env * stumbleSide;
    }
    return out;
  };

  wf.update = (dt, pixelHeight = innerHeight) => {
    if (stumbleT > 0) stumbleT = Math.max(0, stumbleT - dt);
    if (cooldown > 0) cooldown -= dt;
    dust.update(dt, pixelHeight, camera.fov);
  };

  /** 3. şahıs: astronot gövdesi eğim ve tökezleme alır (astronaut.setGait). */
  wf.applyAstro = (astro) => astro?.setGait?.({ lean: Math.max(-0.12, Math.min(0.2, 0.22 * Math.atan(tanS))), stumble: stumbleT > 0 ? 1 - stumbleT / STUMBLE_S : -1 });

  wf.clearPrints = () => prints.clear();
  wf.setVisible = (v) => { prints.mesh.visible = v; dust.points.visible = v; };
  return wf;
}
