// Mars gündüz atmosferi ve aydınlatma (issue #51 — Adım 1):
// - Kaynaklı güneş geometrisi: HiRISE ESP_019698_1750_RED.LBL (yükseklik 32.51°, azimut 282.53°, Ls=161.2°, yerel saat 15.75h; sim/data/params.json).
// - Toz optik derinliği (τ ≈ 0.55): Curiosity Mastcam Ls~160° arka plan klimatolojisiyle uyumlu (Lemmon vd. 2015, Smith vd. 2016; görsel varsayım).
// - Mars göğü: demir oksitli toz (r_eff ≈ 1.5 µm) geniş açıda sıcak "butterscotch"/somon saçılımı, zenitte koyu kızıl-boz ton;
//   güneş çevresinde ~12–25° soğuk mavimsi-beyaz Mie ileri saçılım halesi (Pathfinder/Curiosity gözlemleri; spektral RGB değerleri görsel varsayım).
// - Yükseklik sisi (aerial perspective): vadi/çukur tabanlarında daha yoğun toz saçılımı + güneş yönüne bağlı anizotropik Mie iç-saçılımı (görsel varsayım).
// - Küresel çevresel aydınlatma (IBL) + Mars regolit zemin yansıması + yakın alanda keskin (4096 px), kenarı yumuşak gölge haritası.
import * as THREE from 'three';

export const SKY_FOG = {
  sunDir: { value: new THREE.Vector3(-0.823, 0.537, -0.217) },
  camPos: { value: new THREE.Vector3() },
  fogColor: { value: new THREE.Color(0.68, 0.43, 0.27) },
};

let fogPatched = false;
export function installHeightFogShader() {
  if (fogPatched) return;
  fogPatched = true;

  THREE.ShaderChunk.fog_pars_vertex = /* glsl */ `
    #ifdef USE_FOG
      varying float vFogDepth;
      varying vec3 vFogWorldPos;
    #endif
  `;

  THREE.ShaderChunk.fog_vertex = /* glsl */ `
    #ifdef USE_FOG
      vFogDepth = -mvPosition.z;
      vec4 fogWp = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        fogWp = instanceMatrix * fogWp;
      #endif
      fogWp = modelMatrix * fogWp;
      vFogWorldPos = fogWp.xyz;
    #endif
  `;

  THREE.ShaderChunk.fog_pars_fragment = /* glsl */ `
    #ifdef USE_FOG
      uniform vec3 fogColor;
      varying float vFogDepth;
      varying vec3 vFogWorldPos;
      #ifdef FOG_EXP2
        uniform float fogDensity;
      #else
        uniform float fogNear;
        uniform float fogFar;
      #endif
    #endif
  `;

  THREE.ShaderChunk.fog_fragment = /* glsl */ `
    #ifdef USE_FOG
      vec3 fogViewVec = vFogWorldPos - cameraPosition;
      float fogDist = length(fogViewVec);
      vec3 fogRayDir = fogDist > 1e-4 ? fogViewVec / fogDist : vec3(0.0, 0.0, 1.0);
      // Yakın ön planı (0–20 m) berrak tut; orta/uzak mesafede ve çukur/vadilerde (relY < 0) toz saçılımını artır
      float nearMask = smoothstep(14.0, 58.0, fogDist);
      float relY = vFogWorldPos.y - cameraPosition.y;
      float valleyPool = exp(-clamp((relY + 12.0) / 42.0, -0.85, 3.0));
      float effDensity = fogDensity * (0.85 + 0.85 * valleyPool);
      float fogFactor = (1.0 - exp(-effDensity * effDensity * fogDist * fogDist * 0.65 - effDensity * fogDist * 0.88)) * nearMask;
      // Çukur tabanlarında hafif yer-seviyesi toz pusu
      float troughHaze = smoothstep(35.0, 260.0, fogDist) * clamp((-relY + 8.0) / 38.0, 0.0, 1.0) * 0.22;
      fogFactor = clamp(fogFactor + troughHaze, 0.0, 0.93);
      // Güneş yönünde ileri saçılım (Mie): güneşe bakan yamaç ve vadilerde sıcak-soğuk atmosferik pus
      vec3 approxSun = normalize(vec3(-0.823, 0.537, -0.217));
      float sunCos = max(dot(fogRayDir, approxSun), 0.0);
      vec3 warmScatter = fogColor * (0.96 + 0.30 * pow(sunCos, 1.8));
      vec3 coolMie = vec3(0.72, 0.80, 0.92) * pow(sunCos, 4.5) * 0.18;
      vec3 scatterCol = warmScatter + coolMie;
      gl_FragColor.rgb = mix(gl_FragColor.rgb, scatterCol, fogFactor);
    #endif
  `;
}

/** Mars gökyüzü + zemin yansıması için hızlı equirectangular çevre dokusu (IBL). */
function buildMarsEnvMap(sunDir) {
  const W = 128, H = 64;
  const data = new Uint8Array(W * H * 4);
  const sd = sunDir.clone().normalize();
  const c8 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));

  for (let j = 0; j < H; j++) {
    const theta = ((j + 0.5) / H) * Math.PI;
    const y = Math.cos(theta), sinT = Math.sin(theta);
    for (let i = 0; i < W; i++) {
      const phi = ((i + 0.5) / W) * Math.PI * 2;
      const dx = sinT * Math.cos(phi), dz = sinT * Math.sin(phi);
      let r, g, b;
      if (y >= 0) {
        const t = Math.pow(y, 0.46);
        r = 0.80 * (1 - t) + 0.22 * t;
        g = 0.52 * (1 - t) + 0.14 * t;
        b = 0.34 * (1 - t) + 0.13 * t;
        const s = Math.max(0, dx * sd.x + y * sd.y + dz * sd.z);
        const mie = Math.pow(s, 5.0) * 0.25;
        const blueHalo = Math.pow(s, 18.0) * 0.30;
        r += mie * 0.85 + blueHalo * 0.65;
        g += mie * 0.62 + blueHalo * 0.80;
        b += mie * 0.38 + blueHalo * 1.00;
      } else {
        const gt = Math.min(1, -y * 2.5);
        r = 0.48 * (1 - gt) + 0.28 * gt;
        g = 0.29 * (1 - gt) + 0.15 * gt;
        b = 0.18 * (1 - gt) + 0.09 * gt;
      }
      const idx = (j * W + i) * 4;
      data[idx] = c8(r);
      data[idx + 1] = c8(g);
      data[idx + 2] = c8(b);
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export class Sky {
  constructor(scene, { quality = null } = {}) {
    installHeightFogShader();
    this.scene = scene;
    const q = quality || (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('q') || 'high' : 'high');
    this.quality = q;
    this.enabled = true;
    this.sunDir = new THREE.Vector3(0, 1, 0);
    this.uOpticalDepth = { value: 0.55 }; // τ ≈ 0.55 (Curiosity Mastcam Ls~160° arka plan tozu, görsel varsayım)

    this.mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uSun: { value: this.sunDir },
        uTau: this.uOpticalDepth,
      },
      vertexShader: /* glsl */ `
        varying vec3 vD;
        void main() {
          vD = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSun;
        uniform float uTau;
        varying vec3 vD;

        float hgPhase(float cosTheta, float g) {
          float g2 = g * g;
          return (1.0 - g2) / (4.0 * 3.14159265 * pow(max(1.0 + g2 - 2.0 * g * cosTheta, 1e-4), 1.5));
        }

        void main() {
          vec3 d = normalize(vD);
          float y = d.y;
          vec3 sun = normalize(uSun);
          float sunEl = clamp(sun.y, 0.05, 1.0);

          // Ufukta parlak toz kuşağı (butterscotch/somon), zenitte koyulaşan derin kızıl-boz (görsel varsayım)
          float zenithT = clamp(y, 0.0, 1.0);
          float horizonBand = exp(-max(y, 0.0) * 4.2);
          float horizonRim = exp(-abs(y) * 11.0);

          vec3 zenCol = vec3(0.14, 0.088, 0.082) * (0.55 + 0.45 * sunEl);
          vec3 midCol = vec3(0.43, 0.25, 0.15) * (0.50 + 0.50 * sunEl);
          vec3 horCol = vec3(0.80, 0.52, 0.33) * (0.45 + 0.55 * sunEl);
          vec3 groundCol = vec3(0.28, 0.15, 0.09) * (0.45 + 0.55 * sunEl);

          vec3 c;
          if (y >= 0.0) {
            c = mix(midCol, zenCol, pow(zenithT, 0.46));
            c = mix(c, horCol, horizonBand * 0.76 + horizonRim * 0.24);
            // Yüksek irtifa ince toz/buz tabakası (ufuk üstü ~8–15° hafif atmosferik kuşak)
            float strata = (exp(-pow((y - 0.13) / 0.045, 2.0)) + 0.5 * exp(-pow((y - 0.22) / 0.06, 2.0))) * 0.048;
            c += vec3(0.88, 0.66, 0.48) * strata;
          } else {
            c = mix(horCol, groundCol, clamp(-y * 3.8, 0.0, 1.0));
          }

          // Güneş çevresi saçılımı:
          // 1) Geniş sıcak toz saçılım lobu (Henyey-Greenstein)
          // 2) Mars'a özgü soğuk mavimsi-gümüşi Mie ileri saçılım halesi (~12–28° yarıçap; Pathfinder/Curiosity gözlemi)
          float cosS = max(dot(d, sun), 0.0);
          float warmLobe = hgPhase(cosS, 0.62) * 0.28 * uTau;
          c += vec3(0.95, 0.60, 0.36) * warmLobe;

          // Soğuk mavimsi Mie halesi (güneş çevresinde ~28° açısal bölgede belirgin soğuk hale)
          float coolHalo = pow(cosS, 8.0) * 0.42 + pow(cosS, 24.0) * 0.48 + pow(cosS, 80.0) * 0.52;
          vec3 haloCol = vec3(0.66, 0.79, 0.97) * (0.75 + 0.35 * sunEl);
          c = mix(c, haloCol, clamp(coolHalo * 0.65, 0.0, 0.72));
          c += vec3(0.56, 0.72, 1.0) * pow(cosS, 40.0) * 0.35;

          // Güneş korona ve diski (1.52 AU'da ~0.35°)
          c += vec3(0.86, 0.92, 1.0) * pow(cosS, 750.0) * 5.0;
          c += vec3(1.0, 0.98, 0.95) * smoothstep(0.99972, 0.99992, cosS) * 14.0;

          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(20000, 48, 24), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
    scene.add(this.mesh);

    this.fog = new THREE.FogExp2(new THREE.Color(0.70, 0.45, 0.29), 0.00072);
    scene.fog = this.fog;
    scene.background = new THREE.Color(0x24150d);

    // Regolit yansıma dolgu ışığı (alttan/karşıdan sıcak Mars zemini yansıması)
    this.bounceLight = new THREE.DirectionalLight(0xd88c56, 0.22);
    this.bounceLight.castShadow = false;
    this.bounceLight.name = 'MarsRegolithBounce';
    scene.add(this.bounceLight);

    this.envMap = null;
    this._shadowUpgraded = false;
  }

  /** elev: güneş yüksekliği (derece), az: kuzeyden saat yönünde derece */
  setSun(elev, az) {
    const e = (elev * Math.PI) / 180, a = (az * Math.PI) / 180;
    this.sunDir.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
    SKY_FOG.sunDir.value.copy(this.sunDir);

    const k = Math.min(1, Math.max(0.08, Math.sin(e) * 1.65));
    this.fog.color.setRGB(
      0.72 * (0.38 + 0.62 * k),
      0.46 * (0.33 + 0.67 * k),
      0.30 * (0.28 + 0.72 * k)
    );
    SKY_FOG.fogColor.value.copy(this.fog.color);

    this.bounceLight.position.set(-this.sunDir.x * 100, 35, -this.sunDir.z * 100);
    this.bounceLight.intensity = 0.22 * k;

    if (this.envMap) this.envMap.dispose();
    this.envMap = buildMarsEnvMap(this.sunDir);
    this.scene.environment = this.envMap;
    if ('environmentIntensity' in this.scene) {
      this.scene.environmentIntensity = 0.28 * k;
    }

    for (const ch of this.scene.children) {
      if (ch.isHemisphereLight) {
        ch.color.setHex(0xdca57c);
        ch.groundColor.setHex(0x522c17);
      } else if (ch.isDirectionalLight && ch !== this.bounceLight) {
        ch.color.setHex(0xfff1e0);
      }
    }

    return k;
  }

  setQuality(q) {
    this.quality = q;
    this._shadowUpgraded = false;
  }

  /** Açılış/menü turu için daha berrak hava (pus yoğunluğu ~yarı): uzak katmanlı Mount Sharp okunur. Oyunda setTour(false). */
  setTour(on) {
    this.tour = !!on;
    this.fog.density = this.enabled ? (on ? 0.00034 : 0.00072) : 0.00018;
  }

  setEnabled(on) {
    this.enabled = !!on;
    this.fog.density = on ? (this.tour ? 0.00034 : 0.00072) : 0.00018;
    this.bounceLight.visible = !!on;
  }

  follow(camera) {
    this.mesh.position.copy(camera.position);
    SKY_FOG.camPos.value.copy(camera.position);

    const k = Math.min(1, Math.max(0.08, this.sunDir.y * 1.65));
    for (const ch of this.scene.children) {
      if (ch.isHemisphereLight) {
        ch.intensity = 0.24 + 0.36 * k;
      } else if (ch.isDirectionalLight && ch !== this.bounceLight) {
        ch.intensity = 4.2 * k;
        if (ch.castShadow) {
          // Yüksek kalitede 4096 gölge haritası: hem 130 m sırt gölgeleri korunur hem yakın alanda 2x keskinlik sağlanır
          const targetMapSize = this.quality === 'low' ? 1024 : this.quality === 'med' ? 2048 : 4096;
          if (!this._shadowUpgraded && ch.shadow.mapSize.x !== targetMapSize) {
            ch.shadow.mapSize.set(targetMapSize, targetMapSize);
            if (ch.shadow.map) {
              ch.shadow.map.dispose();
              ch.shadow.map = null;
            }
            this._shadowUpgraded = true;
          }
          ch.shadow.bias = -0.00025;
          ch.shadow.normalBias = 0.12;
          ch.shadow.radius = this.quality === 'low' ? 1.0 : 2.2;
        }
      }
    }
  }
}
