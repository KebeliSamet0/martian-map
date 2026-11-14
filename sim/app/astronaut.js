// astronaut.js — Astronot modülü
// Varsayılan: iskeletli, animasyonlu glTF astronot (sim/assets/characters/astronaut.glb; Quaternius, CC0 — bkz. sim/ASSETS.md).
// Model yüklenene kadar ya da yüklenemezse prosedürel yedek astronot (aşağıda, eski sürüm) görünür.
// Dışa açık arayüz değişmedi: createAstronaut(opts) → { group, update(dt, speedMps, grounded), height, setMarsGravity }.

import * as THREE from 'three';
import { GLTFLoader } from '../lib/addons/loaders/GLTFLoader.js';

/**
 * Prosedürel skafandrlı astronot oluşturur.
 * @param {Object} options
 * @param {boolean} [options.marsGravity=false] - Mars 0.38g zıplayan adım etkisi
 * @param {number} [options.scale=1.0] - Model ölçeği
 * @param {boolean} [options.castShadow=true]
 * @param {boolean} [options.receiveShadow=true]
 * @returns {{group: THREE.Group, update: Function, height: number, setMarsGravity: Function}}
 */
function createProceduralAstronaut(options = {}) {
  const marsGravityEnabled = options.marsGravity ?? false;
  const castShadow = options.castShadow ?? true;
  const receiveShadow = options.receiveShadow ?? true;

  const totalHeight = 1.75; // Ayak tabanından kask tepesine toplam boy (metre)

  const group = new THREE.Group();
  group.name = 'AstronautRoot';

  // -------------------------------------------------------------
  // MALZEMELER (MeshStandardMaterial - PBR Skafandr Yüzeyleri)
  // -------------------------------------------------------------
  const suitMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.68,
    metalness: 0.06,
    name: 'SuitFabric_White'
  });

  const suitTrimMat = new THREE.MeshStandardMaterial({
    color: 0x383d44,
    roughness: 0.82,
    metalness: 0.12,
    name: 'SuitReinforcement_Grey'
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Altın kaplama vizör
    roughness: 0.08,
    metalness: 0.96,
    name: 'HelmetVisor_Gold'
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x9099a2,
    roughness: 0.28,
    metalness: 0.88,
    name: 'SuitHardware_Alloy'
  });

  const dcmMat = new THREE.MeshStandardMaterial({
    color: 0x202428,
    roughness: 0.5,
    metalness: 0.35,
    name: 'DCM_ChestModule'
  });

  const redValveMat = new THREE.MeshStandardMaterial({
    color: 0xbd281e,
    roughness: 0.4,
    metalness: 0.2,
    name: 'EmergencyValve_Red'
  });

  const blueValveMat = new THREE.MeshStandardMaterial({
    color: 0x1f74ad,
    roughness: 0.4,
    metalness: 0.2,
    name: 'CoolingPort_Blue'
  });

  const bootSoleMat = new THREE.MeshStandardMaterial({
    color: 0x1b1d20,
    roughness: 0.92,
    metalness: 0.05,
    name: 'BootSole_Rubber'
  });

  function applyShadow(obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });
    return obj;
  }

  // -------------------------------------------------------------
  // KİNEMATİK DÜĞÜMLER (HIERARCHY RIG)
  // -------------------------------------------------------------
  // Dikey zıplama ve sarsıntı ofseti
  const motionRoot = new THREE.Group();
  motionRoot.name = 'MotionRoot';
  const RIG_SCALE = totalHeight / 1.633;   // [sim] ölçülen ham boy 1.633 m → 1.75 m
  motionRoot.scale.setScalar(RIG_SCALE);
  group.add(motionRoot);

  // Pelvis / Kalça Merkezi (Zemin seviyesinden ~0.96 m yukarıda)
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.83;   // [sim] ayak tabanı y≈0 (orijinal 0.96 → ayaklar ~15 cm havada; +0.03 yürürken burun/topuk dönüşünü karşılar)
  motionRoot.add(pelvis);

  // Pelvis / LTA gövde parçası
  const pelvisGeom = new THREE.CylinderGeometry(0.18, 0.16, 0.16, 16);
  const pelvisMesh = new THREE.Mesh(pelvisGeom, suitMat);
  pelvis.add(pelvisMesh);

  // Bel yatak halkası (Waist Bearing Ring)
  const waistRingGeom = new THREE.TorusGeometry(0.19, 0.016, 8, 24);
  waistRingGeom.rotateX(Math.PI / 2);
  const waistRingMesh = new THREE.Mesh(waistRingGeom, metalMat);
  waistRingMesh.position.y = 0.08;
  pelvis.add(waistRingMesh);

  // Gövde (Torso / HUT - Hard Upper Torso)
  const torso = new THREE.Group();
  torso.position.y = 0.08;
  pelvis.add(torso);

  // Ana Göğüs/Sırt Gövdesi
  const torsoGeom = new THREE.CylinderGeometry(0.24, 0.20, 0.40, 16);
  torsoGeom.scale(1.0, 1.0, 0.82); // Göğüs-sırt derinliği biraz daha basık
  const torsoMesh = new THREE.Mesh(torsoGeom, suitMat);
  torsoMesh.position.y = 0.20;
  torso.add(torsoMesh);

  // Omuz apoletleri / zırh takviyesi
  const shoulderArmorGeom = new THREE.BoxGeometry(0.54, 0.09, 0.30);
  const shoulderArmorMesh = new THREE.Mesh(shoulderArmorGeom, suitTrimMat);
  shoulderArmorMesh.position.y = 0.38;
  torso.add(shoulderArmorMesh);

  // DCM (Display and Control Module) — Göğüs Kontrol Kutusu
  const dcmBoxGeom = new THREE.BoxGeometry(0.22, 0.20, 0.10);
  const dcmBox = new THREE.Mesh(dcmBoxGeom, dcmMat);
  dcmBox.position.set(0, 0.20, 0.19);
  torso.add(dcmBox);

  // DCM Anahtar ve Göstergeleri
  const valveGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.03, 10);
  valveGeom.rotateX(Math.PI / 2);

  const redValve = new THREE.Mesh(valveGeom, redValveMat);
  redValve.position.set(-0.06, 0.23, 0.25);
  torso.add(redValve);

  const blueValve = new THREE.Mesh(valveGeom, blueValveMat);
  blueValve.position.set(0.06, 0.23, 0.25);
  torso.add(blueValve);

  const displayScreenGeom = new THREE.PlaneGeometry(0.12, 0.06);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x142c38 });
  const displayScreen = new THREE.Mesh(displayScreenGeom, screenMat);
  displayScreen.position.set(0, 0.15, 0.242);
  torso.add(displayScreen);

  // PLSS Sırt Çantası (Portable Life Support System)
  const plssGroup = new THREE.Group();
  plssGroup.position.set(0, 0.22, -0.22);
  torso.add(plssGroup);

  const plssMainGeom = new THREE.BoxGeometry(0.40, 0.48, 0.20);
  const plssMain = new THREE.Mesh(plssMainGeom, suitMat);
  plssGroup.add(plssMain);

  // PLSS Alt Çerçeve / Radyatör Izgarası
  const plssGridGeom = new THREE.BoxGeometry(0.36, 0.12, 0.04);
  const plssGrid = new THREE.Mesh(plssGridGeom, suitTrimMat);
  plssGrid.position.set(0, -0.16, -0.10);
  plssGroup.add(plssGrid);

  // OPS (Oxygen Purge System) Üst Silindir Tankı
  const opsTankGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.36, 16);
  opsTankGeom.rotateZ(Math.PI / 2);
  const opsTank = new THREE.Mesh(opsTankGeom, metalMat);
  opsTank.position.set(0, 0.26, -0.04);
  plssGroup.add(opsTank);

  // PLSS İletişim Anteni
  const antennaGeom = new THREE.CylinderGeometry(0.006, 0.008, 0.35, 8);
  const antenna = new THREE.Mesh(antennaGeom, metalMat);
  antenna.position.set(0.16, 0.40, -0.06);
  plssGroup.add(antenna);

  // Boyun Halkası (Neck Ring)
  const neckRingGeom = new THREE.TorusGeometry(0.14, 0.018, 8, 24);
  neckRingGeom.rotateX(Math.PI / 2);
  const neckRing = new THREE.Mesh(neckRingGeom, metalMat);
  neckRing.position.y = 0.44;
  torso.add(neckRing);

  // Kask (Helmet)
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.58;
  torso.add(headGroup);

  // Kask Küresi (Beyaz kompozit dış kabuk)
  const helmetGeom = new THREE.SphereGeometry(0.165, 24, 20);
  helmetGeom.scale(1.0, 1.05, 1.02);
  const helmetMesh = new THREE.Mesh(helmetGeom, suitMat);
  headGroup.add(helmetMesh);

  // Altın Vizör (EVVA Dışbükey Vizör)
  const visorGeom = new THREE.SphereGeometry(0.142, 20, 16, 0, Math.PI, 0, Math.PI * 0.72);
  visorGeom.rotateX(Math.PI / 2);
  visorGeom.scale(1.0, 0.95, 1.15);
  const visorMesh = new THREE.Mesh(visorGeom, visorMat);
  visorMesh.position.set(0, -0.01, 0.05);
  headGroup.add(visorMesh);

  // Kask Yan Projektör Farları (EVA Lights)
  const lightHousingGeom = new THREE.BoxGeometry(0.035, 0.035, 0.05);
  const leftLight = new THREE.Mesh(lightHousingGeom, suitTrimMat);
  leftLight.position.set(-0.165, 0.04, 0.02);
  headGroup.add(leftLight);

  const rightLight = new THREE.Mesh(lightHousingGeom, suitTrimMat);
  rightLight.position.set(0.165, 0.04, 0.02);
  headGroup.add(rightLight);

  // -------------------------------------------------------------
  // KOLLAR (Sol ve Sağ Omuz, Üst Kol, Dirsek, Ön Kol, Eldiven)
  // -------------------------------------------------------------
  function buildArm(isLeft) {
    const side = isLeft ? 1 : -1;
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(side * 0.27, 0.37, 0.0);
    torso.add(shoulderPivot);

    // Omuz eklem mafsalı
    const shoulderBallGeom = new THREE.SphereGeometry(0.075, 12, 12);
    const shoulderBall = new THREE.Mesh(shoulderBallGeom, suitTrimMat);
    shoulderPivot.add(shoulderBall);

    // Üst Kol
    const upperArm = new THREE.Group();
    shoulderPivot.add(upperArm);

    const upperArmGeom = new THREE.CylinderGeometry(0.07, 0.065, 0.24, 12);
    upperArmGeom.translate(0, -0.12, 0);
    const upperArmMesh = new THREE.Mesh(upperArmGeom, suitMat);
    upperArm.add(upperArmMesh);

    // Dirsek Eklemi
    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.24, 0);
    upperArm.add(elbowPivot);

    const elbowBallGeom = new THREE.SphereGeometry(0.062, 12, 12);
    const elbowBall = new THREE.Mesh(elbowBallGeom, suitTrimMat);
    elbowPivot.add(elbowBall);

    // Ön Kol
    const forearm = new THREE.Group();
    elbowPivot.add(forearm);

    const forearmGeom = new THREE.CylinderGeometry(0.065, 0.055, 0.22, 12);
    forearmGeom.translate(0, -0.11, 0);
    const forearmMesh = new THREE.Mesh(forearmGeom, suitMat);
    forearm.add(forearmMesh);

    // Bilek Halkası (Wrist Disconnect Ring)
    const wristRingGeom = new THREE.CylinderGeometry(0.062, 0.062, 0.03, 12);
    wristRingGeom.translate(0, -0.21, 0);
    const wristRing = new THREE.Mesh(wristRingGeom, metalMat);
    forearm.add(wristRing);

    // Eldiven (EVA Glove)
    const handGeom = new THREE.BoxGeometry(0.075, 0.10, 0.045);
    handGeom.translate(0, -0.26, 0.01);
    const handMesh = new THREE.Mesh(handGeom, suitTrimMat);
    forearm.add(handMesh);

    return { shoulderPivot, upperArm, elbowPivot, forearm };
  }

  const leftArm = buildArm(true);
  const rightArm = buildArm(false);

  // -------------------------------------------------------------
  // BACAKLAR (Sol ve Sağ Kalça, Uyluk, Diz, Kaval Kemiği, EVA Bot)
  // -------------------------------------------------------------
  function buildLeg(isLeft) {
    const side = isLeft ? 1 : -1;
    const hipPivot = new THREE.Group();
    hipPivot.position.set(side * 0.13, -0.06, 0.0);
    pelvis.add(hipPivot);

    // Kalça mafsalı
    const hipJointGeom = new THREE.SphereGeometry(0.085, 12, 12);
    const hipJoint = new THREE.Mesh(hipJointGeom, suitTrimMat);
    hipPivot.add(hipJoint);

    // Uyluk (Thigh)
    const thigh = new THREE.Group();
    hipPivot.add(thigh);

    const thighGeom = new THREE.CylinderGeometry(0.095, 0.082, 0.38, 14);
    thighGeom.translate(0, -0.19, 0);
    const thighMesh = new THREE.Mesh(thighGeom, suitMat);
    thigh.add(thighMesh);

    // Diz Eklemi (Knee Pivot)
    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.38, 0);
    thigh.add(kneePivot);

    const kneeBallGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const kneeBall = new THREE.Mesh(kneeBallGeom, suitTrimMat);
    kneePivot.add(kneeBall);

    // Alt Bacak (Calf / Shin)
    const calf = new THREE.Group();
    kneePivot.add(calf);

    const calfGeom = new THREE.CylinderGeometry(0.082, 0.088, 0.36, 14);
    calfGeom.translate(0, -0.18, 0);
    const calfMesh = new THREE.Mesh(calfGeom, suitMat);
    calf.add(calfMesh);

    // EVA Botu (Heavy Tread Boot)
    const foot = new THREE.Group();
    foot.position.set(0, -0.36, 0);
    calf.add(foot);

    // Bot Üst Kısmı
    const bootUpperGeom = new THREE.BoxGeometry(0.14, 0.11, 0.22);
    bootUpperGeom.translate(0, 0.05, 0.04);
    const bootUpper = new THREE.Mesh(bootUpperGeom, suitTrimMat);
    foot.add(bootUpper);

    // Bot Kalın Tabanı (Tread Sole)
    const bootSoleGeom = new THREE.BoxGeometry(0.15, 0.04, 0.25);
    bootSoleGeom.translate(0, 0.02, 0.04);
    const bootSole = new THREE.Mesh(bootSoleGeom, bootSoleMat);
    foot.add(bootSole);

    return { hipPivot, thigh, kneePivot, calf, foot };
  }

  const leftLeg = buildLeg(true);
  const rightLeg = buildLeg(false);

  applyShadow(group);

  // -------------------------------------------------------------
  // ANİMASYON DURUMU VE MOTORU
  // -------------------------------------------------------------
  let walkPhase = 0;
  let idleTime = 0;
  let smoothSpeed = 0;
  let marsGravityActive = marsGravityEnabled;

  /**
   * Modeli günceller (yürüme / duruş / zıplama döngüsü).
   * @param {number} dt - Geçen süre (saniye)
   * @param {number} speedMps - Hız (m/s)
   * @param {boolean} [grounded=true] - Zeminle temas durumu
   */
  function update(dt, speedMps = 0, grounded = true) {
    if (dt <= 0 || dt > 0.5) dt = 0.016; // Güvenli zaman adımı

    smoothSpeed += (Math.max(0, speedMps) - smoothSpeed) * (1 - Math.exp(-9 * dt));   // [sim] duruş↔yürüyüş geçişi pozu sıçratmasın
    const speed = smoothSpeed;
    const isMoving = speed > 0.05;

    if (isMoving) {
      // Adım frekansı: 0.67 m/s referans hızında ~0.8 Hz (APACHE verisi)
      // Düşük hızda 0.45 Hz, koşuda 1.6 Hz'e kadar ölçeklenir
      const strideFreq = 0.50 + 0.45 * (speed / 0.67);
      walkPhase += dt * strideFreq * Math.PI * 2;

      // Genlikler hız ile hafifçe ölçeklenir
      const speedNorm = Math.min(1.4, speed / 0.8);
      // [sim] genlik hız/frekanstan türetilir (ayak kayması azalır): adım yarı-boyu ≈ v/(4f), bacak ≈ 0.86 m
      const legAmplitude = Math.asin(Math.min(0.62, speed / (4 * strideFreq * 0.86)));
      const armAmplitude = 0.40 * speedNorm; // Omuz rotasyon genliği (rad)
      const kneeMaxFlex = 0.75 * speedNorm; // Diz azami bükülme (rad)

      const sinP = Math.sin(walkPhase);
      const cosP = Math.cos(walkPhase);

      // --- Bacak Hareketi ---
      // Sol bacak ve sağ bacak ters fazda
      leftLeg.hipPivot.rotation.x = sinP * legAmplitude;
      rightLeg.hipPivot.rotation.x = -sinP * legAmplitude;

      // Dizler: Bacak arkaya doğru salınırken ve geri çekilirken bükülür
      // Diz arkaya doğru büküldüğünde pozitif açı alır
      leftLeg.kneePivot.rotation.x = Math.max(0, -sinP) * kneeMaxFlex;
      rightLeg.kneePivot.rotation.x = Math.max(0, sinP) * kneeMaxFlex;

      // Ayak bilekleri zemin paralelliğini korur
      leftLeg.foot.rotation.x = -sinP * (legAmplitude * 0.4);
      rightLeg.foot.rotation.x = sinP * (legAmplitude * 0.4);

      // --- Kol Hareketi (Contralateral - Çapraz senkron) ---
      // Sol kol sağ bacakla, sağ kol sol bacakla ileri gider
      leftArm.shoulderPivot.rotation.x = -sinP * armAmplitude;
      rightArm.shoulderPivot.rotation.x = sinP * armAmplitude;

      // Kolların hafif yana açılması (skafandr gövde genişliği)
      leftArm.shoulderPivot.rotation.z = 0.14 + Math.abs(cosP) * 0.05;
      rightArm.shoulderPivot.rotation.z = -0.14 - Math.abs(cosP) * 0.05;

      // Dirsekler ileri salınımda hafifçe daha fazla bükülür
      leftArm.elbowPivot.rotation.x = 0.35 - sinP * 0.22;
      rightArm.elbowPivot.rotation.x = 0.35 + sinP * 0.22;

      // --- Gövde ve Pelvis Sallanması (Trunk Dynamics) ---
      // Omuzlar bacaklara zıt hafif yaw yapar
      torso.rotation.y = -sinP * 0.07;
      // Pelvis hafif yana eğilir (roll)
      pelvis.rotation.z = cosP * 0.035;
      torso.rotation.x = 0.06; // Yürürken hafif öne eğilme

      // --- Dikey Salınım ve Mars Zıplama Hissi ---
      if (marsGravityActive) {
        // Mars 0.38g: Adımlarda belirgin yukarı kalkış ve havada asılma etkisi
        // Her adımda çift tepe yapar (|sin(phase)|)
        const bounceHeight = 0.052 * speedNorm;
        motionRoot.position.y = Math.abs(sinP) * bounceHeight;
      } else {
        // Dünya normal yürüyüş dikey salınımı (hafif)
        const bounceHeight = 0.018 * speedNorm;
        motionRoot.position.y = Math.abs(sinP) * bounceHeight;
      }
    } else {
      // --- Idle (Boşta Duruş) Hareketi ---
      idleTime += dt;
      const breathPhase = idleTime * 1.8; // ~0.29 Hz yavaş solunum

      // Kollar gövde yanında doğal duruş
      leftArm.shoulderPivot.rotation.set(0.06, 0.0, 0.16);
      rightArm.shoulderPivot.rotation.set(0.06, 0.0, -0.16);
      leftArm.elbowPivot.rotation.set(0.32, 0.0, 0.0);
      rightArm.elbowPivot.rotation.set(0.32, 0.0, 0.0);

      // Bacaklar dik
      leftLeg.hipPivot.rotation.set(0.0, 0.0, 0.04);
      rightLeg.hipPivot.rotation.set(0.0, 0.0, -0.04);
      leftLeg.kneePivot.rotation.set(0.04, 0.0, 0.0);
      rightLeg.kneePivot.rotation.set(0.04, 0.0, 0.0);
      leftLeg.foot.rotation.set(0.0, 0.0, 0.0);
      rightLeg.foot.rotation.set(0.0, 0.0, 0.0);

      // Göğüs hafif nefes hareketi
      torso.rotation.set(0.01 + Math.sin(breathPhase) * 0.012, 0.0, 0.0);
      pelvis.rotation.set(0.0, 0.0, 0.0);
      motionRoot.position.y = Math.sin(breathPhase) * 0.005;
    }
  }

  function setMarsGravity(enabled) {
    marsGravityActive = !!enabled;
  }

  return {
    group,
    update,
    height: totalHeight,
    setMarsGravity
  };
}

// =====================================================================
// glTF astronot (iskeletli): Idle / Walk / Run animasyonları hızla karışır.
// Mars 0,38 g: adım frekansı Dünya'ya göre düşük, gövde dikey salınımı belirgin (görsel yaklaşım; hız sim'den gelir).
// =====================================================================
const MODEL_URL = new URL('../assets/characters/astronaut.glb', import.meta.url).href;
const CLIP = { idle: 'CharacterArmature|Idle_Neutral', walk: 'CharacterArmature|Walk', run: 'CharacterArmature|Run', interact: 'CharacterArmature|Interact' };
// Klipteki doğal hızlar (m/s; model 1,75 m'ye ölçeklendikten sonra görsel eşleştirme). Ayak kaymasını azaltmak için klip hızı = gerçek hız / doğal hız.
const CLIP_NATURAL_MPS = { walk: 1.25, run: 3.2 };
// Malzeme adı → skafandr rengi (sRGB), pürüzlülük, metaliklik
const SUIT_PALETTE = {
  SciFi_Main: { c: [0.86, 0.85, 0.82], r: 0.82, m: 0.0 },        // ana kumaş: kirli beyaz
  SciFi_MainDark: { c: [0.66, 0.66, 0.64], r: 0.7, m: 0.1 },      // eklem/körük: orta gri
  SciFi_Light: { c: [0.80, 0.79, 0.76], r: 0.6, m: 0.15 },        // sert parçalar: açık gri
  SciFi_Light_Accent: { c: [0.78, 0.45, 0.22], r: 0.5, m: 0.0 },  // vurgu şeritleri: turuncu
  Grey: { c: [0.16, 0.17, 0.18], r: 0.35, m: 0.4 },               // vizör/ekipman: koyu
};

export function createAstronaut(options = {}) {
  const totalHeight = 1.75;
  const castShadow = options.castShadow ?? true;
  const receiveShadow = options.receiveShadow ?? true;
  const fallback = createProceduralAstronaut(options);
  const group = new THREE.Group();
  group.name = 'AstronautRoot';
  group.add(fallback.group);

  let mixer = null, actions = null, current = null, model = null, bob = null;
  let smooth = 0, phase = 0, marsGravity = options.marsGravity ?? false;
  let leanT = 0, leanS = 0, stumbleF = -1;   // [his] eğimde gövde eğimi, tökezleme ilerlemesi (0..1; <0 = yok)

  if (options.useModel !== false) {
    new GLTFLoader().load(MODEL_URL, (gltf) => {
      model = gltf.scene;
      // Ölçek: iskelet uygulanmış (skinned) gerçek boy → 1,75 m; ayak tabanı y=0; yüz +Z.
      // FBX kaynaklı modelde armatür düğümü ×100 ölçekli; skinning'siz kutu yanıltır, bu yüzden "precise" kutu kullanılır.
      model.updateMatrixWorld(true);
      model.traverse((o) => { if (o.isSkinnedMesh) o.skeleton.update(); });
      const box = new THREE.Box3().setFromObject(model, true);
      const h = box.max.y - box.min.y || 1;
      const s = totalHeight / h;
      model.scale.multiplyScalar(s);
      model.position.y = -box.min.y * s;
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = castShadow; o.receiveShadow = receiveShadow; o.frustumCulled = false;
          const m = o.material;
          if (m && m.isMeshStandardMaterial) {
            // Modelin özgün paleti koyu bilimkurgu tonları; EVA skafandrına yakın beyaz/gri paletle yeniden renklendirilir
            const tint = SUIT_PALETTE[m.name];
            if (tint) { m.color.setRGB(...tint.c, THREE.SRGBColorSpace); m.roughness = tint.r; m.metalness = tint.m; }
            m.envMapIntensity = 0.6;
          }
        }
      });
      bob = new THREE.Group(); bob.add(model);
      group.add(bob);
      mixer = new THREE.AnimationMixer(model);
      const byName = Object.fromEntries(gltf.animations.map((c) => [c.name, c]));
      actions = {};
      for (const [k, name] of Object.entries(CLIP)) {
        const clip = byName[name] || gltf.animations.find((c) => c.name.toLowerCase().endsWith(k));
        if (clip) { actions[k] = mixer.clipAction(clip); actions[k].enabled = true; }
      }
      if (!actions.idle || !actions.walk) { console.warn('astronaut.glb: Idle/Walk klibi bulunamadı, prosedürel yedek kalıyor'); group.remove(bob); return; }
      for (const a of Object.values(actions)) { a.play(); a.setEffectiveWeight(0); }
      actions.idle.setEffectiveWeight(1); current = 'idle';
      fallback.group.visible = false;
    }, undefined, (err) => console.warn('astronaut.glb yüklenemedi, prosedürel yedek kullanılıyor:', err?.message || err));
  }

  /** Gövde duruşu: lean = eğimde öne(+)/geriye(−) rad; stumble = 0..1 tökezleme ilerlemesi (<0 yok). */
  function setGait({ lean = 0, stumble = -1 } = {}) { leanT = lean; stumbleF = stumble; }
  function applyGait(dt) {
    leanS += (leanT - leanS) * (1 - Math.exp(-dt * 5));
    const dip = stumbleF >= 0 ? 0.32 * Math.sin(Math.PI * Math.min(1, stumbleF * 1.05)) ** 1.5 : 0;   // öne kapanıp toparlanma
    const rx = leanS + dip;
    fallback.group.rotation.x = rx; if (bob) bob.rotation.x = rx;
  }

  function update(dt, speedMps = 0, grounded = true) {
    applyGait(dt > 0 && dt <= 0.5 ? dt : 0.016);
    if (!mixer) return fallback.update(dt, speedMps, grounded);
    if (dt <= 0 || dt > 0.5) dt = 0.016;
    smooth += (Math.max(0, speedMps) - smooth) * (1 - Math.exp(-8 * dt));
    const v = smooth;
    // Ağırlıklar: 0–0,08 m/s idle; 0,08–1,6 yürüyüş; 1,6–2,4 yürüyüş→koşu geçişi
    const wWalk = THREE.MathUtils.smoothstep(v, 0.03, 0.25) * (1 - THREE.MathUtils.smoothstep(v, 1.6, 2.4));
    const wRun = actions.run ? THREE.MathUtils.smoothstep(v, 1.6, 2.4) : 0;
    const wIdle = Math.max(0, 1 - wWalk - wRun);
    actions.idle.setEffectiveWeight(wIdle);
    actions.walk.setEffectiveWeight(actions.run ? wWalk : wWalk + wRun);
    if (actions.run) actions.run.setEffectiveWeight(wRun);
    // Mars: daha uzun, daha yavaş adım → klip hızı gerçek hız/doğal hız, düşük yerçekiminde biraz daha yavaş
    const g = marsGravity ? 0.85 : 1;
    actions.walk.timeScale = THREE.MathUtils.clamp(v / CLIP_NATURAL_MPS.walk, 0.35, 2.2) * g;
    if (actions.run) actions.run.timeScale = THREE.MathUtils.clamp(v / CLIP_NATURAL_MPS.run, 0.5, 1.8) * g;
    mixer.update(dt);
    // Düşük yerçekimi: adım başına hafif yukarı kalkış (görsel)
    if (bob) {
      phase += dt * (0.5 + 0.45 * (v / 0.67)) * Math.PI * 2;
      const amp = (marsGravity ? 0.045 : 0.015) * Math.min(1.4, v / 0.8) * (1 - wIdle);
      bob.position.y = Math.abs(Math.sin(phase)) * amp;
    }
  }

  /** Örnek alma gibi tek seferlik hareket (varsa Interact klibi). */
  function playInteract() {
    if (!actions?.interact) return;
    const a = actions.interact; a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; a.setEffectiveWeight(1); a.fadeOut(1.2);
  }

  return {
    group,
    update, setGait,
    height: totalHeight,
    setMarsGravity(enabled) { marsGravity = !!enabled; fallback.setMarsGravity(enabled); },
    playInteract,
    get usingModel() { return !!mixer; },
  };
}
