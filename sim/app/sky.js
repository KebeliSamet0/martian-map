// Mars gündüz atmosferi: tozlu "butterscotch" gökyüzü, ufukta sıcak ışıma, güneş çevresinde mavimsi halo (Mars'ın bilinen özelliği),
// mesafeye bağlı toz sisi. Renkler görsel yaklaşımdır; ölçülmüş spektral veri değildir.
import * as THREE from 'three';

export class Sky {
  constructor(scene) {
    this.sunDir = new THREE.Vector3(0, 1, 0);
    this.mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSun: { value: this.sunDir } },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: /* glsl */ `
        uniform vec3 uSun; varying vec3 vD;
        void main(){
          vec3 d = normalize(vD); float y = d.y;
          vec3 hor = vec3(0.62, 0.36, 0.20), zen = vec3(0.20, 0.15, 0.14), low = vec3(0.35, 0.20, 0.12);
          vec3 c = y > 0.0 ? mix(hor, zen, pow(y, 0.42)) : mix(hor, low, clamp(-y*4.0, 0.0, 1.0));
          float s = max(dot(d, normalize(uSun)), 0.0);
          c += vec3(1.0, 0.62, 0.34) * pow(s, 5.0) * 0.22;
          c += vec3(0.45, 0.62, 1.0) * pow(s, 700.0) * 9.0;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(20000, 40, 20), this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = -10;
    scene.add(this.mesh);
    this.fog = new THREE.FogExp2(new THREE.Color(0.55, 0.32, 0.18), 0.00021);
    scene.fog = this.fog;
    scene.background = new THREE.Color(0x1a0f0a);
  }
  /** elev: güneş yüksekliği (derece), az: kuzeyden saat yönünde derece */
  setSun(elev, az) {
    const e = (elev * Math.PI) / 180, a = (az * Math.PI) / 180;
    this.sunDir.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
    const k = Math.min(1, Math.max(0.05, Math.sin(e) * 1.6));
    this.fog.color.setRGB(0.55 * (0.35 + 0.65 * k), 0.32 * (0.3 + 0.7 * k), 0.18 * (0.25 + 0.75 * k));
    return k;
  }
  follow(camera) { this.mesh.position.copy(camera.position); }
}
