// Yakın plan regolit/çakıl ayrıntısı: gürültüyü her piksel için hesaplamak yerine BİR KEZ üretilen, döşenebilir (tileable) bir
// doku olarak örnekler. Mipmap sayesinde uzakta ayrıntı kendiliğinden söner (anti-aliasing), maliyet birkaç doku okumasıdır.
// R = çakıl yüksekliği (0.5 ortalı), G/B = yükseklik gradyanı (x, z), A = ince tane. SENTETİK görünüm katmanıdır; ölçülmüş veri değildir.
import * as THREE from 'three';

const hash = (i, j, s) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const wrap = (a, P) => ((a % P) + P) % P;

function worley(N, P, seed) {
  const out = new Float32Array(N * N), cell = N / P;
  for (let y = 0; y < N; y++) {
    const v = y / cell, j0 = Math.floor(v);
    for (let x = 0; x < N; x++) {
      const u = x / cell, i0 = Math.floor(u); let best = 1e9;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ci = wrap(i0 + di, P), cj = wrap(j0 + dj, P);
        const px = i0 + di + hash(ci, cj, seed), py = j0 + dj + hash(cj, ci, seed + 101), d = (px - u) ** 2 + (py - v) ** 2;
        if (d < best) best = d;
      }
      const t = Math.min(1, Math.sqrt(best) / 0.6);
      out[y * N + x] = 1 - t * t * (3 - 2 * t);
    }
  }
  return out;
}

function vnoise(N, P, seed) {
  const g = new Float32Array(P * P); for (let k = 0; k < g.length; k++) g[k] = hash(k % P, (k / P) | 0, seed);
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
  const H = new Float32Array(N * N); let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < H.length; i++) { H[i] = 0.50 * w1[i] + 0.22 * w2[i] + 0.28 * (0.5 * n1[i] + 0.3 * n2[i] + 0.2 * n3[i]); lo = Math.min(lo, H[i]); hi = Math.max(hi, H[i]); }
  let mean = 0; for (let i = 0; i < H.length; i++) { H[i] = (H[i] - lo) / (hi - lo); mean += H[i]; } mean /= H.length;
  const gx = new Float32Array(N * N), gz = new Float32Array(N * N); let gm = 1e-6;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    gx[i] = H[y * N + wrap(x + 1, N)] - H[y * N + wrap(x - 1, N)]; gz[i] = H[wrap(y + 1, N) * N + x] - H[wrap(y - 1, N) * N + x];
    gm = Math.max(gm, Math.abs(gx[i]), Math.abs(gz[i]));
  }
  const data = new Uint8Array(N * N * 4), c8 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  for (let i = 0; i < N * N; i++) {
    data[i * 4] = c8(H[i] - mean + 0.5);                 // ortalama 0.5 → mipmap ile uzakta parlaklık kaymaz
    data[i * 4 + 1] = c8(0.5 + 0.5 * gx[i] / gm);
    data[i * 4 + 2] = c8(0.5 + 0.5 * gz[i] / gm);
    data[i * 4 + 3] = c8(0.6 * g1[i] + 0.4 * g2[i]);
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = anisotropy; t.needsUpdate = true;
  return t;
}

export const DETAIL = { value: null };
export const SYNTH = { value: 1 };   // 1: sentetik görünüm ayrıntısı açık; 0: SAF VERİ (yalnız DTM + ortofoto, aydınlatma hariç hiçbir ekleme yok)
// Terrain Scanner (DS2 tarzı): merkez xz, yarıçap, görünürlük (0..1); eğim eşikleri (derece). Eşikler BİZİM arayüz ayarıdır (DS2'nin eşikleri kaynakta yok).
export const SCAN = { value: new THREE.Vector4(0, 0, 0, 0) };
export const SCAN_T = { value: 0 };   // tarama süresi (sn): kontur titreşimi
export const SCAN_E = { value: 0 };   // silme yarıçapı: bu yarıçapın içindeki işaretler söner (merkezden dışa süpürme)
export const SCAN_TEX = { value: null };   // R: eğim/64 (derece), G: geçerli (nav 4 m ızgara; rota eğimiyle aynı taban)
export const SCAN_DIM = { value: new THREE.Vector2(1, 1) };   // ızgara dünya boyu (m)
export const SCAN_TH = { value: new THREE.Vector2(10, 20) };
export function ensureDetail(anisotropy) { if (!DETAIL.value) DETAIL.value = makeDetailTexture(512, anisotropy); return DETAIL.value; }

// MeshStandardMaterial gölgelendiricisine eklenir: albedo çeşitliliği + normal bozulması + dik yüzeylerde tabakalı kaya dokusu.
export function patchMaterial(shader) {
  shader.uniforms.uDetail = DETAIL; shader.uniforms.uSynth = SYNTH; shader.uniforms.uScan = SCAN; shader.uniforms.uScanTh = SCAN_TH; shader.uniforms.uScanE = SCAN_E; shader.uniforms.uScanT = SCAN_T; shader.uniforms.uScanTex = SCAN_TEX; shader.uniforms.uScanDim = SCAN_DIM;
  shader.vertexShader = 'varying vec3 vWP;\nvarying vec3 vWN;\n' + shader.vertexShader.replace(
    '#include <begin_vertex>', '#include <begin_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\n vWN = normalize(mat3(modelMatrix) * objectNormal);');
  shader.fragmentShader = 'uniform sampler2D uDetail;\nuniform float uSynth;\nuniform vec4 uScan;\nuniform vec2 uScanTh;\nuniform float uScanE;\nuniform float uScanT;\nuniform sampler2D uScanTex;\nuniform vec2 uScanDim;\nvarying vec3 vWP;\nvarying vec3 vWN;\n' + shader.fragmentShader
    .replace('#include <map_fragment>', `#include <map_fragment>
      {
        vec4 a = texture2D(uDetail, vWP.xz / 2.4), b = texture2D(uDetail, (vWP.xz + vec2(13.7, 5.1)) / 0.81), c = texture2D(uDetail, (vWP.xz + vec2(3.3, 9.9)) / 19.0);
        float peb = (a.r - 0.5)*0.55 + (b.r - 0.5)*0.40 + (b.a - 0.5)*0.30;
        diffuseColor.rgb *= 1.0 + (peb + (c.r - 0.5)*0.40 + (c.a - 0.5)*0.15) * uSynth;
        // Dik yüzeylerde (≈35–60°) yukarıdan çekilmiş ortofoto yatay çekilir: tabakalı kaya dokusuna geç (renk: yerel ortalama).
        float steep = smoothstep(0.18, 0.50, 1.0 - clamp(vWN.y, 0.0, 1.0));
        #ifdef USE_MAP
          vec3 avgC = textureLod(map, vMapUv, 4.0).rgb;
        #else
          vec3 avgC = diffuseColor.rgb;
        #endif
        float lay = 0.5 + 0.5*sin(vWP.y*2.3 + (c.r - 0.5)*9.0 + (texture2D(uDetail, vec2(vWP.x + vWP.z, vWP.y) / 7.0).r - 0.5)*3.5);
        vec3 cliffC = avgC * (0.60 + 0.65*lay) * (0.85 + 0.30*texture2D(uDetail, vWP.xz / 5.0 + vec2(0.37)).a);
        diffuseColor.rgb = mix(diffuseColor.rgb, cliffC, steep*0.92*uSynth);
      }`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      if (uScan.w > 0.001) {
        float sd = distance(vWP.xz, uScan.xy);
        if (sd < uScan.z + 3.0) {
          // Sınıf kaynağı Samet'in entegrasyonu: B kanalı = API scan_class + 1 (0 güvenli, 1 dikkat, 2 geçilmez, 3 bilinmiyor); yoksa yerel eğim yedeği.
          // Tarayıcı v2 (referans: Death Stranding Terrain Scanner videosu): YALNIZ tehlikeli bölgeler — 1 dikkat, 2 geçilmez.
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
          // 2) sık ✕ işaretleri (1,6 m ızgara, hücre içinde sapma); geçilmez = kırmızı, dikkat = turuncu; eğim arttıkça yoğunluk artar
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
          float dX = max(min(abs(pp.x - pp.y), abs(pp.x + pp.y)) * 0.7071 - 0.17, max(abs(pp.x), abs(pp.y)) - 0.85) * R0;
          float xm = (1.0 - smoothstep(0.0, 0.03, dX)) * on * vis;
          float halo = (1.0 - smoothstep(0.0, 0.5, length(vWP.xz - ctr))) * on * vis * 0.18;
          vec3 red = mix(vec3(1.0, 0.45, 0.02), vec3(1.0, 0.035, 0.02), step(0.9, dzc));
          float ring = exp(-pow((sd - uScan.z) / 0.9, 2.0)) * uScan.w;     // ince dalga cephesi
          float ring2 = uScanE > 0.5 ? exp(-pow((sd - uScanE) / 0.8, 2.0)) * 0.35 * uScan.w : 0.0;   // silme cephesi
          totalEmissiveRadiance += blue * (line * danger * 2.6 * flick * vis) + red * (xm * 1.9 + halo * 0.6) + vec3(0.55, 0.9, 1.0) * (ring * 1.3 + ring2);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.45, 0.1, 0.08), 0.14 * danger * vis);
        }
      }`)
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      {
        vec4 a = texture2D(uDetail, vWP.xz / 2.4), b = texture2D(uDetail, (vWP.xz + vec2(13.7, 5.1)) / 0.81);
        vec2 gr = (a.gb*2.0 - 1.0)*0.40 + (b.gb*2.0 - 1.0)*0.28;
        vec3 Tx = normalize((viewMatrix*vec4(1.0, 0.0, 0.0, 0.0)).xyz), Tz = normalize((viewMatrix*vec4(0.0, 0.0, 1.0, 0.0)).xyz);
        normal = normalize(normal - (gr.x*Tx + gr.y*Tz) * uSynth);
      }`);
}
