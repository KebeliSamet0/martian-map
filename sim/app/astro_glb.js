// İsteğe bağlı rigli astronot (?char=glb): Quaternius "Astronaut" (CC0 1.0, Poly Pizza; sim/assets/char/ATTRIBUTION.txt). Stilize düşük poligon; varsayılan prosedürel astronot.
import * as THREE from 'three';
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';

export async function loadGlbAstronaut({ castShadow = true, receiveShadow = true, height = 1.85 } = {}) {
  const gltf = await new GLTFLoader().loadAsync('./assets/char/astronaut_quaternius_2022.glb');
  const model = gltf.scene;
  model.traverse((o) => { if (o.isMesh) { o.castShadow = castShadow; o.receiveShadow = receiveShadow; o.frustumCulled = false; } });
  // boyu height'a, tabanı y=0'a oturt (desk ölçümü: ham boy ≈1.858, minY ≈ −0.0013)
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model, true), h = box.max.y - box.min.y, s = height / h;
  model.scale.setScalar(s); model.position.y = -box.min.y * s;
  const group = new THREE.Group(); group.add(model);
  const mixer = new THREE.AnimationMixer(model);
  const clip = (n) => gltf.animations.find((c) => c.name.endsWith(n));
  const idle = mixer.clipAction(clip('Idle')), walk = mixer.clipAction(clip('Walk'));
  idle.play(); walk.play(); walk.weight = 0; idle.weight = 1;
  let w = 0;
  return {
    group, height,
    update(dt, speed) {
      const moving = speed > 0.08 ? 1 : 0;
      w += (moving - w) * (1 - Math.exp(-dt * 8));                       // Idle ↔ Walk yumuşak geçiş
      walk.weight = w; idle.weight = 1 - w;
      walk.timeScale = Math.min(2.4, Math.max(0.6, speed / 1.2));        // adım hızı yürüme hızına bağlı (ayak kayması azalır, tam çözüm değil)
      mixer.update(dt);
    },
    setMarsGravity() {},
  };
}
