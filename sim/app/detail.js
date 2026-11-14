// Yakın plan PBR zemin ayrıntısı + zemin sınıfı haritası + dik yamaçlarda üç eksenli (triplanar) eşleme (issue #51 — Adım 2):
// - CC0 PBR dokular (Poly Haven, 1K JPG):
//   * Regolit/çakıl: red_laterite_soil_stones (Amal Kumar, CC0)
//   * Kum: aerial_sand (Rob Tuytel, CC0)
//   * Ana kaya / uçurum: rock_boulder_dry (Dimitrios Savva & Rico Cilliers, CC0)
// - Veri sadakati: HiRISE ortofoto makro rengi %100 korunur (dokudan yalnız yüksek frekanslı mikro-albedo farkı, normal ve pürüzlülük alınır).
// - Zemin sınıfı seçimi: API aktifse /layers/p_sand.bin, /layers/p_bedrock.bin, /layers/p_bigrock.bin (yoksa yerel layers/*.npy + sand_zones.json,
//   o da yoksa eğim tabanlı geçiş).
// - Saf veri modu (V tuşu, SYNTH.value = 0): tüm sentetik PBR/triplanar katmanları sıfırlanır, yalnız ham DTM + ortofoto kalır.
import * as THREE from 'three';
import { API_BASE, API_OFF, GRID, pxToWorld } from './api.js';

const hash = (i, j, s) => {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const wrap = (a, P) => ((a % P) + P) % P;

function worley(N, P, seed) {
  const out = new Float32Array(N * N), cell = N / P;
  for (let y = 0; y < N; y++) {
    const v = y / cell, j0 = Math.floor(v);
    for (let x = 0; x < N; x++) {
      const u = x / cell, i0 = Math.floor(u);
      let best = 1e9;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ci = wrap(i0 + di, P), cj = wrap(j0 + dj, P);
        const px = i0 + di + hash(ci, cj, seed), py = j0 + dj + hash(cj, ci, seed + 101);
        const d = (px - u) ** 2 + (py - v) ** 2;
        if (d < best) best = d;
      }
      const t = Math.min(1, Math.sqrt(best) / 0.6);
      out[y * N + x] = 1 - t * t * (3 - 2 * t);
    }
  }
  return out;
}

function vnoise(N, P, seed) {
  const g = new Float32Array(P * P);
  for (let k = 0; k < g.length; k++) g[k] = hash(k % P, (k / P) | 0, seed);
  const out = new Float32Array(N * N), cell = N / P;
  for (let y = 0; y < N; y++) {
    const v = y / cell, j0 = Math.floor(v), fy = v - j0, sy = fy * fy * (3 - 2 * fy);
    for (let x = 0; x < N; x++) {
      const u = x / cell, i0 = Math.floor(u), fx = u - i0, sx = fx * fx * (3 - 2 * fx);
      const a = g[wrap(j0, P) * P + wrap(i0, P)], b = g[wrap(j0, P) * P + wrap(i0 + 1, P)];
      const c = g[wrap(j0 + 1, P) * P + wrap(i0, P)], d = g[wrap(j0 + 1, P) * P + wrap(i0 + 1, P)];
      out[y * N + x] = (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
    }
  }
  return out;
}

export function makeDetailTexture(N = 512, anisotropy = 8) {
  const w1 = worley(N, 8, 1), w2 = worley(N, 16, 2), n1 = vnoise(N, 8, 3), n2 = vnoise(N, 16, 4), n3 = vnoise(N, 32, 5), g1 = vnoise(N, 64, 7), g2 = vnoise(N, 128, 8);
  const H = new Float32Array(N * N);
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < H.length; i++) {
    H[i] = 0.50 * w1[i] + 0.22 * w2[i] + 0.28 * (0.5 * n1[i] + 0.3 * n2[i] + 0.2 * n3[i]);
    lo = Math.min(lo, H[i]);
    hi = Math.max(hi, H[i]);
  }
  let mean = 0;
  for (let i = 0; i < H.length; i++) { H[i] = (H[i] - lo) / (hi - lo); mean += H[i]; }
  mean /= H.length;
  const gx = new Float32Array(N * N), gz = new Float32Array(N * N);
  let gm = 1e-6;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    gx[i] = H[y * N + wrap(x + 1, N)] - H[y * N + wrap(x - 1, N)];
    gz[i] = H[wrap(y + 1, N) * N + x] - H[wrap(y - 1, N) * N + x];
    gm = Math.max(gm, Math.abs(gx[i]), Math.abs(gz[i]));
  }
  const data = new Uint8Array(N * N * 4), c8 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  for (let i = 0; i < N * N; i++) {
    data[i * 4] = c8(H[i] - mean + 0.5);
    data[i * 4 + 1] = c8(0.5 + 0.5 * gx[i] / gm);
    data[i * 4 + 2] = c8(0.5 + 0.5 * gz[i] / gm);
    data[i * 4 + 3] = c8(0.6 * g1[i] + 0.4 * g2[i]);
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}

function makeDummyTex(r = 128, g = 128, b = 255) {
  const d = new Uint8Array([r, g, b, 255]);
  const t = new THREE.DataTexture(d, 1, 1, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

export const DETAIL = { value: null };
export const SYNTH = { value: 1 };   // 1: sentetik ayrıntı açık; 0: SAF VERİ
export const SCAN = { value: new THREE.Vector4(0, 0, 0, 0) };
export const SCAN_E = { value: 0 };   // silme yarıçapı: bu yarıçapın içindeki işaretler söner (merkezden dışa süpürme)
// Mikro rölyef (?ground=rich): zemin mesh'ine yakında 10–30 cm düşük frekanslı kabarıklık (SENTETİK; DTM 1 m'nin altında bilgi vermez). CPU (terrain.js microRelief) ile AYNI işlev.
export const MICRO = { value: 0 };
export const SCAN_T = { value: 0 };   // tarama süresi (sn): kontur titreşimi
export const SCAN_TEX = { value: null };
export const SCAN_DIM = { value: new THREE.Vector2(1, 1) };
export const SCAN_TH = { value: new THREE.Vector2(10, 20) };

// PBR doku üniformaları (regolit/çakıl, kum, ana kaya/uçurum)
export const PBR_MAPS = {
  regDiff: { value: makeDummyTex(128, 128, 128) },
  regNor: { value: makeDummyTex(128, 128, 255) },
  regRough: { value: makeDummyTex(220, 220, 220) },
  sandDiff: { value: makeDummyTex(128, 128, 128) },
  sandNor: { value: makeDummyTex(128, 128, 255) },
  sandRough: { value: makeDummyTex(235, 235, 235) },
  rockDiff: { value: makeDummyTex(128, 128, 128) },
  rockNor: { value: makeDummyTex(128, 128, 255) },
  rockRough: { value: makeDummyTex(195, 195, 195) },
  pbrReady: { value: 0.0 },
};

// Zemin sınıfı haritası: R = p_sand, G = p_bedrock + p_bigrock, B = geçerli (1=API/katman verisi, 0=yok)
export const CLASS_TEX = { value: makeDummyTex(0, 0, 0) };
export const CLASS_BOUNDS = { value: new THREE.Vector4(0, 0, 1, 1) }; // x0, z0, sizeX, sizeZ
export const HAS_CLASS_TEX = { value: 0.0 };

let pbrLoadingPromise = null;

function parseNpyFloat32(buf) {
  const u8 = new Uint8Array(buf);
  // .npy başlığı: \x93NUMPY (6 bayt) + major(1) + minor(1) + header_len(2 veya 4)
  if (u8[0] === 0x93 && u8[1] === 0x4e) {
    const major = u8[6];
    const hlen = major >= 2 ? new DataView(buf).getUint32(8, true) : new DataView(buf).getUint16(8, true);
    const offset = (major >= 2 ? 12 : 10) + hlen;
    return new Float32Array(buf, offset);
  }
  return new Float32Array(buf);
}

export async function fetchLayerFloat32(name) {
  // 1) Önce API (/layers/<name>.bin) dene
  if (!API_OFF) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 1800);
      const r = await fetch(`${API_BASE}/layers/${name}.bin`, { signal: ctl.signal });
      clearTimeout(t);
      if (r.ok) {
        const buf = await r.arrayBuffer();
        if (buf.byteLength === GRID.w * GRID.h * 4) return new Float32Array(buf);
      }
    } catch { /* API kapalıysa yerel dosyaya düş */ }
  }
  // 2) Yerel statik katman (/layers/<name>.npy) yedeği
  try {
    const url = new URL(`../../layers/${name}.npy`, import.meta.url);
    const r = await fetch(url);
    if (r.ok) {
      const buf = await r.arrayBuffer();
      const arr = parseNpyFloat32(buf);
      if (arr.length === GRID.w * GRID.h) return arr;
    }
  } catch { /* yerel katman da yoksa eğim tabanlı seçime düş */ }
  return null;
}

export async function loadTerrainClassMap(geo) {
  if (!geo) return;
  const [x0, z0] = pxToWorld(geo, 0, 0);
  const [x1, z1] = pxToWorld(geo, GRID.w, GRID.h);
  CLASS_BOUNDS.value.set(x0, z0, x1 - x0, z1 - z0);

  const [pSand, pBedrock, pBigrock, sandZones] = await Promise.all([
    fetchLayerFloat32('p_sand'),
    fetchLayerFloat32('p_bedrock'),
    fetchLayerFloat32('p_bigrock'),
    fetch(new URL('../data/sand_zones.json', import.meta.url)).then((r) => (r.ok ? r.json() : [])).catch(() => []),
  ]);

  const W = GRID.w, H = GRID.h;
  if (!pSand && !pBedrock && (!sandZones || !sandZones.length)) return;

  const data = new Uint8Array(W * H * 4);
  const c8 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));

  for (let i = 0; i < W * H; i++) {
    const s = pSand ? pSand[i] : 0;
    const b = (pBedrock ? pBedrock[i] : 0) + (pBigrock ? pBigrock[i] : 0);
    // 1-epoch modelde p_sand ~0.12-0.23 aralığında olduğundan kontrastı görünür kılmak için yumuşak ölçekleme
    const sandWeight = Math.min(1, Math.max(0, (s - 0.08) * 3.2));
    const rockWeight = Math.min(1, Math.max(0, (b - 0.15) * 1.8));
    data[i * 4] = c8(sandWeight);
    data[i * 4 + 1] = c8(rockWeight);
    data[i * 4 + 2] = (pSand || pBedrock) ? 255 : 0;
    data[i * 4 + 3] = 255;
  }

  // Bora'nın kum aday bölgelerini (sand_zones.json) p_sand kanalına yumuşak geçişle işle
  if (Array.isArray(sandZones)) {
    for (const z of sandZones) {
      if (!z.px) continue;
      const cx = z.px[0], cy = z.px[1], radPx = (z.radius_m || 18) / GRID.res;
      const rPad = Math.ceil(radPx * 1.35);
      const xMin = Math.max(0, Math.floor(cx - rPad)), xMax = Math.min(W - 1, Math.ceil(cx + rPad));
      const yMin = Math.max(0, Math.floor(cy - rPad)), yMax = Math.min(H - 1, Math.ceil(cy + rPad));
      for (let y = yMin; y <= yMax; y++) {
        for (let x = xMin; x <= xMax; x++) {
          const d = Math.hypot(x - cx, y - cy) / Math.max(1, radPx);
          if (d >= 1.25) continue;
          const w = 1 - Math.min(1, Math.max(0, (d - 0.5) / 0.75));
          const idx = (y * W + x) * 4;
          data[idx] = Math.max(data[idx], c8(w * 0.92));
          data[idx + 2] = 255;
        }
      }
    }
  }

  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  CLASS_TEX.value = tex;
  HAS_CLASS_TEX.value = 1.0;
}

export function ensureDetail(anisotropy = 8, geo = null) {
  if (!DETAIL.value) {
    DETAIL.value = makeDetailTexture(512, anisotropy);
  }
  if (!pbrLoadingPromise && typeof Image !== 'undefined') {
    const loader = new THREE.TextureLoader();
    const base = new URL('../assets/textures/', import.meta.url);
    const loadOne = (file) =>
      new Promise((resolve) => {
        loader.load(
          new URL(file, base).href,
          (t) => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.colorSpace = THREE.NoColorSpace;
            t.magFilter = THREE.LinearFilter;
            t.minFilter = THREE.LinearMipmapLinearFilter;
            t.generateMipmaps = true;
            t.anisotropy = anisotropy;
            t.needsUpdate = true;
            resolve(t);
          },
          undefined,
          () => resolve(null)
        );
      });

    pbrLoadingPromise = Promise.all([
      loadOne('regolith_diff.jpg'),
      loadOne('regolith_nor.jpg'),
      loadOne('regolith_rough.jpg'),
      loadOne('sand_diff.jpg'),
      loadOne('sand_nor.jpg'),
      loadOne('sand_rough.jpg'),
      loadOne('bedrock_diff.jpg'),
      loadOne('bedrock_nor.jpg'),
      loadOne('bedrock_rough.jpg'),
      loadTerrainClassMap(geo),
    ]).then(([rD, rN, rR, sD, sN, sR, bD, bN, bR]) => {
      if (rD && rN && rR && sD && sN && sR && bD && bN && bR) {
        PBR_MAPS.regDiff.value = rD;
        PBR_MAPS.regNor.value = rN;
        PBR_MAPS.regRough.value = rR;
        PBR_MAPS.sandDiff.value = sD;
        PBR_MAPS.sandNor.value = sN;
        PBR_MAPS.sandRough.value = sR;
        PBR_MAPS.rockDiff.value = bD;
        PBR_MAPS.rockNor.value = bN;
        PBR_MAPS.rockRough.value = bR;
        PBR_MAPS.pbrReady.value = 1.0;
      }
      return DETAIL.value;
    });
    DETAIL.ready = pbrLoadingPromise;
  } else if (geo && HAS_CLASS_TEX.value === 0) {
    loadTerrainClassMap(geo);
  }
  return DETAIL.value;
}

// MeshStandardMaterial gölgelendiricisine eklenir:
// - CC0 PBR regolit/kum/kaya mikro-albedo ayrıntısı (HiRISE ortofoto rengini koruyarak, uzaklıkla sönümlenen)
// - API zemin sınıfı (/layers/p_sand.bin, p_bedrock.bin) veya eğim tabanlı doku seçimi
// - Dik yamaçlarda (≥25°) 3 eksenli (triplanar) kaya dokusu ve sedimanter tabaka yapısı
// - PBR pürüzlülük (roughness) ve normal haritası karışımı
export function patchMaterial(shader) {
  shader.uniforms.uDetail = DETAIL;
  shader.uniforms.uSynth = SYNTH;
  shader.uniforms.uScan = SCAN;
  shader.uniforms.uScanTh = SCAN_TH;
  shader.uniforms.uScanE = SCAN_E;
  shader.uniforms.uScanTex = SCAN_TEX;
  shader.uniforms.uMicro = MICRO;
  shader.uniforms.uScanT = SCAN_T;
  shader.uniforms.uScanDim = SCAN_DIM;

  shader.uniforms.uRegDiff = PBR_MAPS.regDiff;
  shader.uniforms.uRegNor = PBR_MAPS.regNor;
  shader.uniforms.uRegRough = PBR_MAPS.regRough;
  shader.uniforms.uSandDiff = PBR_MAPS.sandDiff;
  shader.uniforms.uSandNor = PBR_MAPS.sandNor;
  shader.uniforms.uSandRough = PBR_MAPS.sandRough;
  shader.uniforms.uRockDiff = PBR_MAPS.rockDiff;
  shader.uniforms.uRockNor = PBR_MAPS.rockNor;
  shader.uniforms.uRockRough = PBR_MAPS.rockRough;
  shader.uniforms.uPbrReady = PBR_MAPS.pbrReady;

  shader.uniforms.uClassTex = CLASS_TEX;
  shader.uniforms.uClassBounds = CLASS_BOUNDS;
  shader.uniforms.uHasClassTex = HAS_CLASS_TEX;

  const MICRO_GLSL = /* glsl */ `
uniform float uMicro;
float mh(vec2 c) { vec3 p3 = fract(vec3(c.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float mn(vec2 p) { vec2 i = floor(p), f = p - i, u = f * f * (3.0 - 2.0 * f); return mix(mix(mh(i), mh(i + vec2(1.0, 0.0)), u.x), mix(mh(i + vec2(0.0, 1.0)), mh(i + vec2(1.0, 1.0)), u.x), u.y); }
float microD(vec2 w) { return (mn(w / 5.3) - 0.5) * 0.34 + (mn(w / 2.7 + vec2(17.1, 3.7)) - 0.5) * 0.16; }
float microFade(vec3 w) { return uMicro * (1.0 - smoothstep(25.0, 70.0, distance(cameraPosition, w))); }
`;
  shader.vertexShader =
    'varying vec3 vWP;\nvarying vec3 vWN;\n' + MICRO_GLSL +
    shader.vertexShader
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      if (uMicro > 0.001) {
        vec3 wp0 = (modelMatrix * vec4(position, 1.0)).xyz;
        float mf = microFade(wp0);
        if (mf > 0.001) {
          float e = 0.35; vec2 w = wp0.xz;
          vec2 g = vec2(microD(w + vec2(e, 0.0)) - microD(w - vec2(e, 0.0)), microD(w + vec2(0.0, e)) - microD(w - vec2(0.0, e))) / (2.0 * e) * mf;
          objectNormal = normalize(vec3(objectNormal.x - g.x * objectNormal.y, objectNormal.y, objectNormal.z - g.y * objectNormal.y));
        }
      }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      if (uMicro > 0.001) { vec3 wp1 = (modelMatrix * vec4(transformed, 1.0)).xyz; transformed.y += microD(wp1.xz) * microFade(wp1); }
      vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vWN = normalize(mat3(modelMatrix) * objectNormal);`);

  const preamble = /* glsl */ `
    uniform sampler2D uDetail;
    uniform float uSynth;
    uniform vec4 uScan;
    uniform vec2 uScanTh;
    uniform float uScanT;
    uniform float uScanE;
    uniform sampler2D uScanTex;
    uniform vec2 uScanDim;

    uniform sampler2D uRegDiff;
    uniform sampler2D uRegNor;
    uniform sampler2D uRegRough;
    uniform sampler2D uSandDiff;
    uniform sampler2D uSandNor;
    uniform sampler2D uSandRough;
    uniform sampler2D uRockDiff;
    uniform sampler2D uRockNor;
    uniform sampler2D uRockRough;
    uniform float uPbrReady;

    uniform sampler2D uClassTex;
    uniform vec4 uClassBounds;
    uniform float uHasClassTex;

    varying vec3 vWP;
    varying vec3 vWN;

    // Karo tekrarını kıran stokastik örnekleme: her hücreye rastgele öteleme, 4 komşu hücre ağırlıklı karışır (tur4:gorsel).
    vec4 nt_hash4(vec2 p) { return fract(sin(vec4(1.0 + dot(p, vec2(37.0, 17.0)), 2.0 + dot(p, vec2(11.0, 47.0)), 3.0 + dot(p, vec2(41.0, 29.0)), 4.0 + dot(p, vec2(23.0, 31.0)))) * 103.0); }
    vec4 texNoTile(sampler2D s, vec2 x) {
      vec2 p = floor(x), f = fract(x), dx = dFdx(x), dy = dFdy(x);
      vec4 acc = vec4(0.0); float tw = 0.0;
      for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
        vec2 g = vec2(float(i), float(j));
        vec4 o = nt_hash4(p + g);
        vec2 r = g - f + o.xy;
        float w = exp(-4.0 * dot(r, r));
        acc += w * textureGrad(s, x + o.zw, dx, dy); tw += w;
      }
      return acc / tw;
    }

    // Karo tekrarını (tiling) kırmak için hafif döndürülmüş ikinci örnekleme
    vec2 rotUv(vec2 uv) {
      return vec2(uv.x * 0.866 - uv.y * 0.5, uv.x * 0.5 + uv.y * 0.866);
    }

    // Üç eksenli (triplanar) doku örnekleme (dik yamaçlarda UV sündürmesini önler)
    vec3 sampleTriplanar(sampler2D tex, vec3 wp, vec3 wn, float scale) {
      vec3 w = pow(abs(wn), vec3(4.0));
      w /= max(w.x + w.y + w.z, 1e-5);
      vec3 sx = texture2D(tex, wp.zy * scale).rgb;
      vec3 sy = texture2D(tex, wp.xz * scale).rgb;
      vec3 sz = texture2D(tex, wp.xy * scale).rgb;
      return sx * w.x + sy * w.y + sz * w.z;
    }

    // Konuma ve eğime göre (wSand, wRock, steep) ağırlıklarını hesaplar
    vec3 getTerrainWeights(vec3 wp, vec3 wn) {
      float slope = 1.0 - clamp(wn.y, 0.0, 1.0); // 1 - cos(theta)
      float steep = smoothstep(0.09, 0.34, slope); // ~24°..48° arası dik yamaç geçişi
      float flatGround = 1.0 - smoothstep(0.015, 0.08, slope); // <10° düz/hafif eğimli çukurlar

      // Eğim tabanlı varsayılan ağırlıklar
      float wSand = flatGround * 0.35;
      float wRock = clamp(smoothstep(0.05, 0.22, slope), 0.0, 1.0);

      // API / katman sınıfı verisi varsa (/layers/p_sand.bin, p_bedrock.bin) onunla birleştir
      if (uHasClassTex > 0.5) {
        vec2 cuv = (wp.xz - uClassBounds.xy) / uClassBounds.zw;
        if (cuv.x >= 0.0 && cuv.x <= 1.0 && cuv.y >= 0.0 && cuv.y <= 1.0) {
          vec4 cl = texture2D(uClassTex, cuv);
          if (cl.b > 0.5) {
            wSand = clamp(mix(wSand, cl.r, 0.78) + cl.r * 0.35, 0.0, 1.0);
            wRock = clamp(mix(wRock, cl.g, 0.65) + steep * 0.6, 0.0, 1.0);
          }
        }
      }
      wSand *= (1.0 - steep);
      return vec3(wSand, wRock, steep);
    }
  `;

  shader.fragmentShader =
    preamble +
    shader.fragmentShader
      .replace(
        '#include <map_fragment>',
        /* glsl */ `#include <map_fragment>
        {
          float camDist = distance(vWP, cameraPosition);
          // Mikro ayrıntı yakında (0-55 m) tam, orta mesafede (55-160 m) yumuşakça sönümlenir → ortofoto rengi bozulmaz
          float nearFade = 1.0 - smoothstep(14.0, 68.0, camDist);
          float midFade = 1.0 - smoothstep(45.0, 185.0, camDist);

          vec4 a = texture2D(uDetail, vWP.xz / 2.2);
          vec4 b = texture2D(uDetail, (vWP.xz + vec2(13.7, 5.1)) / 0.75);
          vec4 c = texture2D(uDetail, (vWP.xz + vec2(3.3, 9.9)) / 18.0);

          vec3 tw = getTerrainWeights(vWP, normalize(vWN));
          float wSand = tw.x, wRock = tw.y, steep = tw.z;

          float microMod = 0.0;
          if (uPbrReady > 0.5 && midFade > 0.005) {
            vec2 uvFine = rotUv(vWP.xz / 0.68);
            vec2 uv1 = vWP.xz / 1.65;
            vec2 uv2 = rotUv(vWP.xz / 5.8 + vec2(4.1, 7.3));

            // Regolit/çakıl yüksek frekanslı mikro-albedo farkı (ortalama = 0, ortofoto rengini değiştirmez)
            float regFine = dot(texture2D(uRegDiff, uvFine).rgb, vec3(0.333)) - 0.48;
            float regHi = dot(texNoTile(uRegDiff, uv1).rgb, vec3(0.333)) - 0.48;
            float regMid = dot(texture2D(uRegDiff, uv2).rgb, vec3(0.333)) - 0.48;
            float closeFade = 1.0 - smoothstep(2.5, 10.0, camDist);   // en ince ölçek: ayak dibi (24 cm karo)
            float regVF = dot(texture2D(uRegDiff, rotUv(vWP.xz / 0.24 + vec2(7.7, 2.9))).rgb, vec3(0.333)) - 0.48;
            float regDet = (regFine * 0.62 + regHi * 0.85) * nearFade + regMid * 0.48 * midFade + regVF * 0.75 * closeFade;

            // Kum dalgacıkları mikro-albedo farkı
            float sandFine = dot(texture2D(uSandDiff, vWP.xz / 0.75).rgb, vec3(0.333)) - 0.52;
            float sandHi = dot(texNoTile(uSandDiff, vWP.xz / 1.6).rgb, vec3(0.333)) - 0.52;
            float sandMid = dot(texture2D(uSandDiff, rotUv(vWP.xz / 5.0)).rgb, vec3(0.333)) - 0.52;
            float sandVF = dot(texture2D(uSandDiff, rotUv(vWP.xz / 0.3 + vec2(1.3, 5.1))).rgb, vec3(0.333)) - 0.52;
            float sandDet = (sandFine * 0.48 + sandHi * 0.68) * nearFade + sandMid * 0.38 * midFade + sandVF * 0.5 * closeFade;

            // Ana kaya mikro-çatlak ve yüzey dokusu (triplanar + düzlemsel karışım)
            vec3 rockTri = sampleTriplanar(uRockDiff, vWP, normalize(vWN), 0.52);
            vec3 rockTriFine = sampleTriplanar(uRockDiff, vWP, normalize(vWN), 1.35);
            float rockHi = (dot(rockTri, vec3(0.333)) - 0.46) * 0.85 + (dot(rockTriFine, vec3(0.333)) - 0.46) * 0.55;
            float rockMid = dot(texture2D(uRockDiff, uv2).rgb, vec3(0.333)) - 0.46;
            float rockDet = rockHi * nearFade + rockMid * 0.55 * midFade;

            float blendedPbr = mix(regDet, sandDet, wSand);
            blendedPbr = mix(blendedPbr, rockDet, wRock);
            microMod = clamp(blendedPbr * 1.8, -0.48, 0.48);
          } else {
            float peb = (a.r - 0.5) * 0.48 * nearFade + (b.r - 0.5) * 0.35 * nearFade;
            microMod = peb + (c.r - 0.5) * 0.28 * midFade;
          }

          // Ortofoto makro rengi korunur; yalnız mikro-albedo kontrastı eklenir
          diffuseColor.rgb *= 1.0 + (microMod + (c.r - 0.5) * 0.22 * midFade) * uSynth;

          // Dik yüzeylerde (≥25°) üç eksenli (triplanar) kaya dokusu + Mount Sharp sedimanter katmanlaşması
          if (steep > 0.005) {
            #ifdef USE_MAP
              vec3 avgC = textureLod(map, vMapUv, 3.5).rgb;
            #else
              vec3 avgC = diffuseColor.rgb;
            #endif
            vec3 triRock = uPbrReady > 0.5
              ? sampleTriplanar(uRockDiff, vWP, normalize(vWN), 0.26)
              : vec3(0.46 + (a.r - 0.5) * 0.3);
            float triLum = clamp(dot(triRock, vec3(0.333)) / 0.46, 0.62, 1.38);
            float strata = 0.5 + 0.5 * sin(vWP.y * 2.4 + (c.r - 0.5) * 8.0 + (a.r - 0.5) * 2.5);
            vec3 cliffC = avgC * triLum * (0.72 + 0.48 * strata);
            diffuseColor.rgb = mix(diffuseColor.rgb, cliffC, steep * 0.88 * midFade * uSynth);
          }
        }`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `#include <roughnessmap_fragment>
        if (uPbrReady > 0.5 && uSynth > 0.01) {
          float camDistR = distance(vWP, cameraPosition);
          float rFade = 1.0 - smoothstep(20.0, 110.0, camDistR);
          if (rFade > 0.01) {
            vec3 twR = getTerrainWeights(vWP, normalize(vWN));
            vec2 uvR = vWP.xz / 2.1;
            float rReg = texture2D(uRegRough, uvR).r;
            float rSand = texture2D(uSandRough, vWP.xz / 1.8).r;
            float rRock = sampleTriplanar(uRockRough, vWP, normalize(vWN), 0.32).r;
            float pbrR = mix(rReg, rSand, twR.x);
            pbrR = mix(pbrR, rRock * 0.86, max(twR.y, twR.z));
            roughnessFactor = mix(roughnessFactor, clamp(0.68 + pbrR * 0.30, 0.65, 0.99), rFade * uSynth);
          }
        }`
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
      if (uScan.w > 0.001) {
        float sd = distance(vWP.xz, uScan.xy);
        if (sd < uScan.z + 3.0) {
          // Sınıf kaynağı Samet'in entegrasyonu: B kanalı = API scan_class + 1 (0 güvenli, 1 dikkat, 2 geçilmez, 3 bilinmiyor); yoksa yerel eğim yedeği.
          // Tarayıcı v2: YALNIZ tehlikeli bölgeler — 1 dikkat (çift çizgi), 2 geçilmez (üç çizgi).
          vec4 st = texture2D(uScanTex, vWP.xz / uScanDim);
          float sl = st.r * 64.0;
          float cls0 = st.b > 0.001 ? floor(st.b * 255.0 + 0.5) - 1.0 : (st.g < 0.5 ? 3.0 : (sl < uScanTh.x ? 0.0 : (sl < uScanTh.y ? 1.0 : 2.0)));
          float fine = smoothstep(27.0, 33.0, degrees(acos(clamp(normalize(vWN).y, 0.0, 1.0))));   // 1 m mesh: çok dik yüz her zaman tehlikeli
          float danger = max(step(0.5, cls0) * step(cls0, 2.5) * (cls0 > 1.5 ? 1.0 : 0.6), fine);
          float born = smoothstep(0.0, 7.0, uScan.z - sd);                 // işaret, dalga geçtikçe belirir
          float alive = smoothstep(uScanE, uScanE + 7.0, sd);              // sonra merkezden dışa süpürülerek söner
          float vis = born * alive * uScan.w;
          // 1) tehlikeli yüzeylerde neon mavi eş-yükselti (kontur) hologramı
          float wob = (texture2D(uDetail, vWP.xz / 7.0).r - 0.5) * 0.55 + (texture2D(uDetail, vWP.xz / 2.3).r - 0.5) * 0.18;
          float fw = max(fwidth(vWP.y), 1e-4);
          float cd = abs(fract((vWP.y + wob) / 0.42 + 0.5) - 0.5) * 0.42;
          float line = 1.0 - smoothstep(0.0, 1.4 * fw, cd);
          float flick = 0.72 + 0.28 * sin(vWP.y * 5.0 + vWP.x * 1.7 - uScanT * 8.0);
          vec3 blue = vec3(0.12, 0.55, 1.0);
          // 2) sık çizgi işaretleri (1,6 m ızgara, hücre içinde sapma ve yön); dikkat = çift çizgi (turuncu), geçilmez = üç çizgi (kırmızı); eğim arttıkça yoğunluk artar
          float G = 1.6;
          vec2 cell = floor(vWP.xz / G);
          float h1 = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
          float h2 = fract(sin(dot(cell, vec2(39.346, 11.135))) * 24634.6345);
          float h3 = fract(sin(dot(cell, vec2(73.156, 52.235))) * 17353.1337);
          vec2 ctr = (cell + 0.25 + 0.5 * vec2(h1, h2)) * G;
          vec4 stc = texture2D(uScanTex, ctr / uScanDim);
          float slc = stc.r * 64.0;
          float clsc = stc.b > 0.001 ? floor(stc.b * 255.0 + 0.5) - 1.0 : (stc.g < 0.5 ? 3.0 : (slc < uScanTh.x ? 0.0 : (slc < uScanTh.y ? 1.0 : 2.0)));
          float dzc = max(step(0.5, clsc) * step(clsc, 2.5) * (clsc > 1.5 ? 1.0 : 0.55), fine);
          float dens = 0.40 + 0.5 * dzc + 0.1 * smoothstep(20.0, 36.0, slc);
          float on = step(h3, dens) * step(0.5, dzc);
          float R0 = 0.34 + 0.16 * h3;
          vec2 pp = (vWP.xz - ctr) / R0;
          float ang = h1 * 3.14159;
          vec2 qq = vec2(cos(ang) * pp.x + sin(ang) * pp.y, -sin(ang) * pp.x + cos(ang) * pp.y);
          float nL = mix(2.0, 3.0, step(0.9, dzc)), offL = (nL - 1.0) * 0.5;
          float idxL = clamp(floor(qq.y / 0.34 + offL + 0.5), 0.0, nL - 1.0);
          float dX = max(abs(qq.x) - 0.8, abs(qq.y - (idxL - offL) * 0.34) - 0.075) * R0;
          float xm = (1.0 - smoothstep(0.0, 0.03, dX)) * on * vis;
          float halo = (1.0 - smoothstep(0.0, 0.5, length(vWP.xz - ctr))) * on * vis * 0.18;
          vec3 red = mix(vec3(1.0, 0.45, 0.02), vec3(1.0, 0.035, 0.02), step(0.9, dzc));
          float ring = exp(-pow((sd - uScan.z) / 0.9, 2.0)) * uScan.w;     // ince dalga cephesi
          float ring2 = uScanE > 0.5 ? exp(-pow((sd - uScanE) / 0.8, 2.0)) * 0.35 * uScan.w : 0.0;   // silme cephesi
          totalEmissiveRadiance += blue * (line * danger * 2.6 * flick * vis) + red * (xm * 1.9 + halo * 0.6) + vec3(0.55, 0.9, 1.0) * (ring * 1.3 + ring2);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.45, 0.1, 0.08), 0.14 * danger * vis);
        }
      }`
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
        {
          float camDistN = distance(vWP, cameraPosition);
          float nearFadeN = 1.0 - smoothstep(12.0, 62.0, camDistN);
          float midFadeN = 1.0 - smoothstep(35.0, 150.0, camDistN);
          vec4 a = texture2D(uDetail, vWP.xz / 2.2);
          vec4 b = texture2D(uDetail, (vWP.xz + vec2(13.7, 5.1)) / 0.75);
          vec2 gr = ((a.gb * 2.0 - 1.0) * 0.32 + (b.gb * 2.0 - 1.0) * 0.22) * midFadeN;

          if (uPbrReady > 0.5 && midFadeN > 0.005) {
            vec3 twN = getTerrainWeights(vWP, normalize(vWN));
            vec2 uvFine = rotUv(vWP.xz / 0.68);
            vec2 uv1 = vWP.xz / 1.65;
            vec2 uv2 = rotUv(vWP.xz / 5.8 + vec2(4.1, 7.3));

            vec2 nReg = ((texture2D(uRegNor, uvFine).xy * 2.0 - 1.0) * 0.75 + (texNoTile(uRegNor, uv1).xy * 2.0 - 1.0) * 1.45) * nearFadeN
                      + (texture2D(uRegNor, uv2).xy * 2.0 - 1.0) * 0.65 * midFadeN;
            vec2 nSand = ((texture2D(uSandNor, vWP.xz / 0.75).xy * 2.0 - 1.0) * 0.65 + (texNoTile(uSandNor, vWP.xz / 1.6).xy * 2.0 - 1.0) * 1.2) * nearFadeN
                       + (texture2D(uSandNor, rotUv(vWP.xz / 5.0)).xy * 2.0 - 1.0) * 0.55 * midFadeN;
            vec3 triN = sampleTriplanar(uRockNor, vWP, normalize(vWN), 0.52) * 2.0 - 1.0;
            vec3 triNFine = sampleTriplanar(uRockNor, vWP, normalize(vWN), 1.35) * 2.0 - 1.0;
            vec2 nRock = (triN.xy * 1.15 + triNFine.xy * 0.70) * nearFadeN + (texture2D(uRockNor, uv2).xy * 2.0 - 1.0) * 0.75 * midFadeN;

            // Kumda rüzgâr dalgacığı (sentetik): iki yönlü sinüs, kum ağırlığıyla; yalnız yakında
            float rp = dot(vWP.xz, vec2(0.94, 0.34)) * 5.2 + sin(dot(vWP.xz, vec2(-0.34, 0.94)) * 0.9) * 1.6;
            vec2 nRip = vec2(0.94, 0.34) * cos(rp) * 0.55 * nearFadeN;
            nSand += nRip * smoothstep(0.25, 0.7, twN.x);
            float closeFadeN = 1.0 - smoothstep(2.5, 10.0, camDistN);
            nReg += (texture2D(uRegNor, rotUv(vWP.xz / 0.24 + vec2(7.7, 2.9))).xy * 2.0 - 1.0) * 1.0 * closeFadeN;
            nSand += (texture2D(uSandNor, rotUv(vWP.xz / 0.3 + vec2(1.3, 5.1))).xy * 2.0 - 1.0) * 0.7 * closeFadeN;
            vec2 pbrGr = mix(nReg * 1.15, nSand * 0.85, twN.x);
            pbrGr = mix(pbrGr, nRock * 1.35, max(twN.y, twN.z));
            gr = mix(gr, pbrGr, 0.90);
          }

          vec3 Tx = normalize((viewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
          vec3 Tz = normalize((viewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
          normal = normalize(normal - (gr.x * Tx + gr.y * Tz) * uSynth);
        }`
      );
}
