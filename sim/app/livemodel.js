// Kask kamerası: zemin modeli tarayıcıda canlı (#127 B, Emre). İsteğe bağlı: ?live=1. Kapalıyken hiçbir şey yüklenmez.
// Model: DeepLabv3+ ResNet34 (AI4Mars), ONNX fp16, 512 px, tek geçiş (MC Dropout yok) → ml/rover_terrain/export_onnx.py.
// Geçersiz alan (rover gövdesi, 30 m ötesi) için gövde-maskesi modeli tarayıcıda çalışmaz; hazır maskenin (navcam_masks/*.png)
// saydamlığı kullanılır. Her hata hazır maskeye düşer: canlı çıkarım yalnız gösterim katmanıdır, oyun verisini değiştirmez.
const ON = new URLSearchParams(location.search).get('live') === '1';
const ORT_VER = '1.20.1';
const ORT_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist/`;
const MODEL_URL = new URL('../data/onnx/terrain_fp16.onnx', import.meta.url).href;
const SIZE = 512;
// export_masks.py PALETTE ile aynı: toprak, ana kaya, kum, büyük kaya
const PAL = [[0xb0, 0x7a, 0x4a], [0x8a, 0x8a, 0x8a], [0xe8, 0xc3, 0x5a], [0xd0, 0x44, 0x3a]];
const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];

let sessionP = null, backend = '';

export const liveEnabled = () => ON;

function loadOrt() {
  if (window.ort) return Promise.resolve(window.ort);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = ORT_URL + 'ort.webgpu.min.js';
    s.onload = () => (window.ort ? res(window.ort) : rej(new Error('ort yok')));
    s.onerror = () => rej(new Error('onnxruntime-web indirilemedi'));
    document.head.appendChild(s);
  });
}

async function session() {
  if (!sessionP) sessionP = (async () => {
    const ort = await loadOrt();
    ort.env.wasm.wasmPaths = ORT_URL;
    const eps = navigator.gpu ? ['webgpu', 'wasm'] : ['wasm'];
    for (const ep of eps) {
      try { const s = await ort.InferenceSession.create(MODEL_URL, { executionProviders: [ep] }); backend = ep === 'webgpu' ? 'WebGPU' : 'WASM'; return { ort, s }; }
      catch (e) { console.warn('livemodel', ep, e); }
    }
    throw new Error('ONNX oturumu açılamadı');
  })();
  try { return await sessionP; } catch (e) { sessionP = null; throw e; }
}

function toTensor(ort, img) {
  const c = document.createElement('canvas'); c.width = c.height = SIZE;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, SIZE, SIZE);
  const d = g.getImageData(0, 0, SIZE, SIZE).data, n = SIZE * SIZE, x = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    const v = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;   // gri (Navcam zaten tek kanal)
    for (let k = 0; k < 3; k++) x[k * n + i] = (v - MEAN[k]) / STD[k];
  }
  return new ort.Tensor('float32', x, [1, 3, SIZE, SIZE]);
}

function alphaOf(maskImg, w, h) {
  if (!maskImg || !maskImg.naturalWidth) return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(maskImg, 0, 0, w, h);
  return g.getImageData(0, 0, w, h).data;   // RGBA: hazır maske (A = 0 → geçersiz)
}

/** Kare üzerinde canlı çıkarım. Dönen: { url (PNG dataURL, kare boyutunda), ms, backend, agree (hazır maskeyle sınıf uyuşması 0–1 | null) } */
export async function runLive(img, maskImg) {
  const { ort, s } = await session();
  const x = toTensor(ort, img);
  const t0 = performance.now();
  const out = await s.run({ image: x });
  const ms = performance.now() - t0;
  const p = out.probs.data, n = SIZE * SIZE;
  const w = img.naturalWidth || SIZE, h = img.naturalHeight || SIZE;
  const ref = alphaOf(maskImg, SIZE, SIZE);
  const c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE;
  const g = c.getContext('2d'); const id = g.createImageData(SIZE, SIZE), o = id.data;
  let same = 0, valid = 0;
  for (let i = 0; i < n; i++) {
    let k = 0, b = p[i];
    for (let j = 1; j < 4; j++) if (p[j * n + i] > b) { b = p[j * n + i]; k = j; }
    const a = ref ? ref[i * 4 + 3] : 255;
    o[i * 4] = PAL[k][0]; o[i * 4 + 1] = PAL[k][1]; o[i * 4 + 2] = PAL[k][2]; o[i * 4 + 3] = a > 0 ? 255 : 0;
    if (ref && a > 0) {
      valid++;
      const r = ref[i * 4], gg = ref[i * 4 + 1], bb = ref[i * 4 + 2];
      let rk = 0, rd = 1e9;
      for (let j = 0; j < 4; j++) { const dd = Math.abs(PAL[j][0] - r) + Math.abs(PAL[j][1] - gg) + Math.abs(PAL[j][2] - bb); if (dd < rd) { rd = dd; rk = j; } }
      if (rk === k) same++;
    }
  }
  g.putImageData(id, 0, 0);
  const big = document.createElement('canvas'); big.width = w; big.height = h;
  const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, w, h);
  return { url: big.toDataURL('image/png'), ms, backend, agree: valid ? same / valid : null };
}
