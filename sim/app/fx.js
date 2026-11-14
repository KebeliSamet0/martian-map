// fx.js — ard işlem zinciri (three r160 eklentileri, sim/lib/addons altında yerel).
// Sıra: sahne → ortam gölgelemesi (GTAO) → bloom → ton eşleme + sRGB (OutputPass) → kenar yumuşatma (SMAA) → vinyet + gren + hafif kontrast.
// Görsel sunum katmanıdır; arazi verisine dokunmaz. "Saf veri modu"nda main.js bu zinciri kapatır.
//
// Kullanım:
//   const fx = initFx(renderer, scene, camera, { quality });
//   fx.render(dt)            // renderer.render yerine
//   fx.setSize(w, h, ratio)  // pencere ya da dinamik çözünürlük değişince
//   fx.setEnabled(bool), fx.enabled, fx.set({ bloom, ao, grain, vignette })
import * as THREE from 'three';
import { EffectComposer } from '../lib/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/addons/postprocessing/RenderPass.js';
import { ShaderPass } from '../lib/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../lib/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/addons/postprocessing/OutputPass.js';
import { GTAOPass } from '../lib/addons/postprocessing/GTAOPass.js';
import { SMAAPass } from '../lib/addons/postprocessing/SMAAPass.js';

// Son geçiş: ekran uzayında (sRGB) vinyet, film greni, hafif S-eğrisi kontrast ve gölgelerde sıcak ton.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.035 }, uVignette: { value: 0.34 }, uContrast: { value: 0.10 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVignette, uContrast; varying vec2 vUv;
    float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb;
      // S-eğrisi: orta tonları korur, siyah/beyazı hafif sıkar
      vec3 s = col * col * (3.0 - 2.0 * col);
      col = mix(col, s, uContrast);
      // Gölgelere hafif sıcak, parlak alanlara hafif soğuk ton (Mars tozu ışığı)
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col += vec3(0.012, 0.004, -0.008) * (1.0 - l) + vec3(-0.004, 0.0, 0.006) * l;
      // Vinyet
      vec2 d = vUv - 0.5; d.x *= 1.15;
      col *= 1.0 - uVignette * smoothstep(0.25, 0.95, dot(d, d) * 2.2);
      // Gren: parlaklığa göre azalır, zamanla değişir
      float n = hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 91.7) - 0.5;
      col += n * uGrain * (1.0 - 0.6 * l);
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
    }`,
};

export function initFx(renderer, scene, camera, { quality = 'high', ao: aoOn = quality === 'ultra' } = {}) {   // GTAO sahneyi İKİNCİ kez çizer (draw call ~2×, üçgen ~2×): yalnız ultra veya ?ao=1
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);   // r160: yarım kayan noktalı (HDR) ara hedefler
  composer.addPass(new RenderPass(scene, camera));

  // Ortam gölgelemesi: taş diplerinde, kıvrımlarda ve astronotun ayak dibinde temas gölgesi
  let ao = null;
  if (quality !== 'low' && aoOn) {
    ao = new GTAOPass(scene, camera, size.x, size.y);
    ao.output = GTAOPass.OUTPUT.Default;
    ao.blendIntensity = 0.85;
    ao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 1.0, scale: 1.1, samples: quality === 'ultra' ? 16 : 8, distanceFallOff: 1.0, screenSpaceRadius: false });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, radiusExponent: 1, rings: 2, samples: 8 });
    // Zemine yapışık yarı saydam katmanlar (tekerlek izi, kum lekesi, rota çizgisi) derinlik geçişine girerse
    // zeminle aralarındaki milimetrik boşluk kapkara gölge üretir; AO geçişinde gizlenirler.
    const hideInAo = (o) => o.isPoints || o.isLine || (o.isMesh && o.material && !Array.isArray(o.material) && o.material.transparent && o.material.depthWrite === false);
    ao.overrideVisibility = function () {
      const cache = this._visibilityCache;
      this.scene.traverse((o) => { cache.set(o, o.visible); if (hideInAo(o)) o.visible = false; });
    };
    composer.addPass(ao);
  }

  // Bloom: yalnız çok parlak alanlar (güneş diski, vizör/metal parlaması, tarayıcı dalgası); zemini yıkamaz
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.22, 0.6, 0.92);
  composer.addPass(bloom);

  composer.addPass(new OutputPass());   // renderer.toneMapping + sRGB burada uygulanır

  const pr = renderer.getPixelRatio();
  const smaa = new SMAAPass(size.x * pr, size.y * pr);
  composer.addPass(smaa);

  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  let enabled = true, t = 0;
  return {
    get enabled() { return enabled; },
    setEnabled(on) { enabled = !!on; },
    render(dt = 0.016) {
      if (!enabled) { renderer.render(scene, camera); return; }
      t += dt; grade.uniforms.uTime.value = t;
      composer.render(dt);
    },
    setSize(w, h, ratio) {
      if (ratio != null) composer.setPixelRatio(ratio);
      composer.setSize(w, h);
    },
    set({ bloom: b, ao: a, grain, vignette, contrast } = {}) {
      if (b != null) { bloom.enabled = b > 0; bloom.strength = b; }
      if (a != null && ao) { ao.enabled = a > 0; ao.blendIntensity = a; }
      if (grain != null) grade.uniforms.uGrain.value = grain;
      if (vignette != null) grade.uniforms.uVignette.value = vignette;
      if (contrast != null) grade.uniforms.uContrast.value = contrast;
    },
    passes: { ao, bloom, smaa, grade },
    composer,
  };
}
