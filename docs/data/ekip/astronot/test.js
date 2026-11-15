// test.js — Astronot ve Takip Kamerası Test ve Görselleştirme Motoru
import * as THREE from 'three';
import { createAstronaut } from './astronaut.js';
import { FollowCamera } from './follow-camera.js';

// -------------------------------------------------------------
// 1. ARAZİ YÜKSEKLİK MODELİ
// -------------------------------------------------------------
export function getTerrainHeight(x, z) {
  // z < 8: Tamamen düz zemin (yürüme/idle kalibrasyonu)
  if (z < 8) return 0.0;

  // z >= 8: Dalgalı Mars tepeleri ve sırtları
  const dz = z - 8;
  const blend = Math.min(1.0, dz / 4.0);
  const mainHill = (Math.sin(x * 0.22) * 1.8 + Math.cos(z * 0.16) * 2.2 + 1.2) * blend;
  const ripples = (Math.sin(x * 0.5 + z * 0.4) * 0.4) * blend;
  return Math.max(0.0, mainHill + ripples);
}

// -------------------------------------------------------------
// 2. THREE.JS SAHNESİ VE RENDERER
// -------------------------------------------------------------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth || 800, window.innerHeight || 600);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb26b43); // Mars gökyüzü rengi
scene.fog = new THREE.FogExp2(0xb26b43, 0.018);

const camera = new THREE.PerspectiveCamera(
  55,
  (window.innerWidth || 800) / (window.innerHeight || 600),
  0.1,
  300
);

// -------------------------------------------------------------
// 3. IŞIKLANDIRMA (Mars Güneş Geometrisi)
// -------------------------------------------------------------
// Ortam Işığı
const hemiLight = new THREE.HemisphereLight(0xffcaa2, 0x482414, 0.75);
scene.add(hemiLight);

// Güneş Işığı (~32.5° yükseklik, 282.5° azimut)
const dirLight = new THREE.DirectionalLight(0xffecd6, 2.2);
const sunDist = 40;
const sunElevRad = THREE.MathUtils.degToRad(32.5);
const sunAzRad = THREE.MathUtils.degToRad(282.5);

dirLight.position.set(
  Math.cos(sunElevRad) * Math.sin(sunAzRad) * sunDist,
  Math.sin(sunElevRad) * sunDist,
  Math.cos(sunElevRad) * Math.cos(sunAzRad) * sunDist
);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 100;
const shadowSize = 18;
dirLight.shadow.camera.left = -shadowSize;
dirLight.shadow.camera.right = shadowSize;
dirLight.shadow.camera.top = shadowSize;
dirLight.shadow.camera.bottom = -shadowSize;
dirLight.shadow.bias = -0.0006;
scene.add(dirLight);

// -------------------------------------------------------------
// 4. ARAZİ MESHİ
// -------------------------------------------------------------
const terrainWidth = 60;
const terrainDepth = 90;
const segX = 120;
const segZ = 180;
const terrainGeom = new THREE.PlaneGeometry(terrainWidth, terrainDepth, segX, segZ);
terrainGeom.rotateX(-Math.PI / 2);

// Vertex yüksekliklerini getTerrainHeight ile güncelle
const posAttr = terrainGeom.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const vx = posAttr.getX(i);
  const vz = posAttr.getZ(i);
  posAttr.setY(i, getTerrainHeight(vx, vz));
}
terrainGeom.computeVertexNormals();

const terrainMat = new THREE.MeshStandardMaterial({
  color: 0x984e2a, // Mars kızıl regolit toprağı
  roughness: 0.90,
  metalness: 0.05
});
const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
terrainMesh.receiveShadow = true;
scene.add(terrainMesh);

// Görsel referans için düz zemin grid kılavuzu (z < 8)
const gridHelper = new THREE.GridHelper(16, 16, 0xff9955, 0x553322);
gridHelper.position.set(0, 0.002, 0);
scene.add(gridHelper);

// -------------------------------------------------------------
// 5. ASTRONOT VE TAKİP KAMERASI
// -------------------------------------------------------------
const astronaut = createAstronaut({ marsGravity: true });
scene.add(astronaut.group);

const followCam = new FollowCamera(camera, {
  distance: 4.5,
  height: 1.8,
  lookAtHeight: 1.25,
  posStiffness: 7.0,
  rotStiffness: 6.0,
  minGroundClearance: 0.5
});

// Durum değişkenleri
const astronautPos = new THREE.Vector3(0, 0, 0);
let astronautYaw = 0;
let currentSpeed = 0.0;
let currentScenario = 'idle';
let simTime = 0;

function updateHUD() {
  const elMode = document.getElementById('hud-mode');
  const elSpeed = document.getElementById('hud-speed');
  const elPos = document.getElementById('hud-pos');
  const elCam = document.getElementById('hud-cam');

  if (elMode) elMode.textContent = currentScenario.toUpperCase();
  if (elSpeed) elSpeed.textContent = `${currentSpeed.toFixed(2)} m/s`;
  if (elPos) elPos.textContent = `(${astronautPos.x.toFixed(1)}, ${astronautPos.y.toFixed(1)}, ${astronautPos.z.toFixed(1)})`;
  if (elCam) elCam.textContent = `(${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})`;
}

// -------------------------------------------------------------
// 6. SENARYO YÖNETİCİSİ (TEST KONTROLÜ)
// -------------------------------------------------------------
export function setScenario(name) {
  currentScenario = name;
  simTime = 0;

  if (name === 'idle') {
    // Senaryo 1: Düz zeminde dururken
    astronautPos.set(0, 0, 0);
    astronautYaw = 0;
    currentSpeed = 0.0;
    astronaut.group.position.copy(astronautPos);
    astronaut.group.rotation.y = astronautYaw;
    astronaut.update(0.016, 0, true);
    followCam.reset(astronautPos, astronautYaw, getTerrainHeight);
  } else if (name === 'walk') {
    // Senaryo 2: Düz zeminde yürürken (APACHE hızı 0.67 m/s)
    astronautPos.set(0, 0, 2.5);
    astronautYaw = 0;
    currentSpeed = 0.67; // 0.671 m/s NASA deney hızı
    astronaut.group.position.copy(astronautPos);
    astronaut.group.rotation.y = astronautYaw;
    // Bacak/kol salınımının tepe noktasında yakalamak için birkaç adım işlet
    for (let t = 0; t < 1.2; t += 0.016) {
      astronaut.update(0.016, currentSpeed, true);
    }
    followCam.reset(astronautPos, astronautYaw, getTerrainHeight);
  } else if (name === 'terrain') {
    // Senaryo 3: Dalgalı Mars tepesi üzerinde, kamera arazinin üstünde takipte
    astronautPos.set(7.0, 0, 33.0);
    astronautPos.y = getTerrainHeight(astronautPos.x, astronautPos.z);
    astronautYaw = 0.45; // Hafif açılı yön
    currentSpeed = 0.67;
    astronaut.group.position.copy(astronautPos);
    astronaut.group.rotation.y = astronautYaw;
    for (let t = 0; t < 0.8; t += 0.016) {
      astronaut.update(0.016, currentSpeed, true);
    }
    followCam.reset(astronautPos, astronautYaw, getTerrainHeight);
    for (let i = 0; i < 25; i++) {
      followCam.update(0.033, astronautPos, astronautYaw, getTerrainHeight);
    }
  }

  renderer.render(scene, camera);
  updateHUD();
}

// -------------------------------------------------------------
// 7. DIŞ TEST ARAYÜZÜ (window.testController)
// -------------------------------------------------------------
window.testController = {
  isReady: false,
  setScenario: (name) => {
    setScenario(name);
  },
  step: (dt = 0.016, speed = null) => {
    if (speed !== null) currentSpeed = speed;
    simTime += dt;

    if (currentSpeed > 0) {
      // Yön boyunca ilerlet
      const moveDist = currentSpeed * dt;
      astronautPos.x += Math.sin(astronautYaw) * moveDist;
      astronautPos.z += Math.cos(astronautYaw) * moveDist;
      astronautPos.y = getTerrainHeight(astronautPos.x, astronautPos.z);
    }

    astronaut.group.position.copy(astronautPos);
    astronaut.group.rotation.y = astronautYaw;
    astronaut.update(dt, currentSpeed, true);
    followCam.update(dt, astronautPos, astronautYaw, getTerrainHeight);

    renderer.render(scene, camera);
    updateHUD();
  },
  getStats: () => ({
    scenario: currentScenario,
    speed: currentSpeed,
    pos: { x: astronautPos.x, y: astronautPos.y, z: astronautPos.z },
    cam: { x: camera.position.x, y: camera.position.y, z: camera.position.z }
  })
};

// -------------------------------------------------------------
// 8. BAŞLATMA VE ANİMASYON DÖNGÜSÜ
// -------------------------------------------------------------
setScenario('idle');

let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Otomatik yürüyüş demosu (eğer dış test kontrolü aktif değilse)
  if (currentScenario === 'walk_demo') {
    window.testController.step(dt, 0.67);
  } else {
    // Normal render
    astronaut.update(dt, currentSpeed, true);
    followCam.update(dt, astronautPos, astronautYaw, getTerrainHeight);
    renderer.render(scene, camera);
    updateHUD();
  }
}
requestAnimationFrame(animate);

// İlk render tamamlandı bayrağı
setTimeout(() => {
  window.testController.isReady = true;
}, 300);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
