// follow-camera.js — 3. Şahıs Yay-Sönümlü Takip Kamerası Modülü
// Martian Map projesi için arazi çarpışma önlemeli ve yumuşak sönümlü kamera kontrolcüsü.

import * as THREE from 'three';

export class FollowCamera {
  /**
   * @param {THREE.Camera} camera - Kontrol edilecek Three.js kamerası
   * @param {Object} [options]
   * @param {number} [options.distance=4.5] - Astronotun arkasından yatay mesafe (m)
   * @param {number} [options.height=1.8] - Astronot referansından dikey yükseklik (m)
   * @param {number} [options.lookAtHeight=1.2] - Astronotun bakılacak gövde yüksekliği (m)
   * @param {number} [options.posStiffness=6.5] - Pozisyon sönümleme sertliği (1/s)
   * @param {number} [options.rotStiffness=5.5] - Yön sönümleme sertliği (1/s)
   * @param {number} [options.minGroundClearance=0.45] - Arazi zemininden asgari mesafe (m)
   */
  constructor(camera, options = {}) {
    this.camera = camera;

    this.distance = options.distance ?? 4.5;
    this.height = options.height ?? 1.8;
    this.lookAtHeight = options.lookAtHeight ?? 1.2;

    this.posStiffness = options.posStiffness ?? 6.5;
    this.rotStiffness = options.rotStiffness ?? 5.5;
    this.minGroundClearance = options.minGroundClearance ?? 0.45;

    // Mevcut sönümlenmiş durum değişkenleri
    this.currentPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this.currentYaw = 0;
    this.initialized = false;

    // Geçici hesap vektörleri (GC baskısını önlemek için)
    this._desiredPos = new THREE.Vector3();
    this._targetLookAt = new THREE.Vector3();
    this._samplePoint = new THREE.Vector3();
  }

  /**
   * En kısa açısal farkı (-PI ... +PI) hesaplar.
   * @private
   */
  _normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  /**
   * Kamerayı her karede günceller.
   * @param {number} dt - Geçen süre (saniye)
   * @param {THREE.Vector3|{x:number, y:number, z:number}} targetPos - Astronotun pozisyonu
   * @param {number} targetYaw - Astronotun yön açısı (radyan)
   * @param {function(number, number): number} [heightAtFn] - (x, z) noktasındaki arazi yüksekliği
   */
  update(dt, targetPos, targetYaw = 0, heightAtFn = null) {
    if (dt <= 0 || dt > 0.5) dt = 0.016;

    const tx = targetPos.x;
    const ty = targetPos.y;
    const tz = targetPos.z;

    // 1. Hedef bakış noktası (astronotun omuz/göğüs hizası)
    this._targetLookAt.set(tx, ty + this.lookAtHeight, tz);

    if (!this.initialized) {
      this.currentYaw = targetYaw;
      const initBackX = tx - Math.sin(this.currentYaw) * this.distance;
      const initBackZ = tz - Math.cos(this.currentYaw) * this.distance;
      let initY = ty + this.height;

      if (typeof heightAtFn === 'function') {
        const gh = heightAtFn(initBackX, initBackZ);
        if (initY < gh + this.minGroundClearance) {
          initY = gh + this.minGroundClearance;
        }
      }

      this.currentPos.set(initBackX, initY, initBackZ);
      this.currentLookAt.copy(this._targetLookAt);
      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(this.currentLookAt);
      this.initialized = true;
      return;
    }

    // 2. Açısal sönümleme (Yumuşak kamera dönüşü)
    const yawDiff = this._normalizeAngle(targetYaw - this.currentYaw);
    const rotFactor = 1.0 - Math.exp(-this.rotStiffness * dt);
    this.currentYaw += yawDiff * rotFactor;

    // 3. İdeal kamera arkası konumu
    const backX = tx - Math.sin(this.currentYaw) * this.distance;
    const backZ = tz - Math.cos(this.currentYaw) * this.distance;
    let idealY = ty + this.height;

    this._desiredPos.set(backX, idealY, backZ);

    // 4. Arazi Engeli ve Zemin İçine Girmeme Kontrolü (Terrain Collision Avoidance)
    if (typeof heightAtFn === 'function') {
      // 4a. Kameranın bulunduğu (x, z) noktasındaki zemin kotu
      const directGroundH = heightAtFn(this._desiredPos.x, this._desiredPos.z);
      const minSafeY = directGroundH + this.minGroundClearance;
      if (this._desiredPos.y < minSafeY) {
        this._desiredPos.y = minSafeY;
      }

      // 4b. Hedef ile kamera arasındaki görüş hattı (Line-of-Sight Ray Obstacle Check)
      // Arada tepe veya sırt varsa kamera araziye gömülmemesi için numuneler alınır
      const samples = 4;
      for (let i = 1; i < samples; i++) {
        const t = i / samples;
        const sx = THREE.MathUtils.lerp(tx, this._desiredPos.x, t);
        const sz = THREE.MathUtils.lerp(tz, this._desiredPos.z, t);
        const lineY = THREE.MathUtils.lerp(this._targetLookAt.y, this._desiredPos.y, t);

        const sampleTerrainH = heightAtFn(sx, sz);
        const requiredLineY = sampleTerrainH + this.minGroundClearance;

        if (lineY < requiredLineY) {
          // Tepe görüşü engelliyor, kameranın dikey kotunu yukarı ayarla
          const neededElev = (requiredLineY - this._targetLookAt.y) / t + this._targetLookAt.y;
          if (neededElev > this._desiredPos.y) {
            this._desiredPos.y = neededElev;
          }
        }
      }

      // Son kontrol: Mevcut kamera konumunda da zemin altına inilmemesini garantile
      const curGroundH = heightAtFn(this.currentPos.x, this.currentPos.z);
      if (this.currentPos.y < curGroundH + this.minGroundClearance) {
        this.currentPos.y = curGroundH + this.minGroundClearance;
      }
    }

    // 5. Yay-Sönümlü Pozisyon Güncellemesi (Critically Damped Smooth Position)
    const posFactor = 1.0 - Math.exp(-this.posStiffness * dt);
    this.currentPos.lerp(this._desiredPos, posFactor);

    // 6. Bakış Noktası Sönümlemesi
    this.currentLookAt.lerp(this._targetLookAt, posFactor);

    // 7. Kamerayı konumlandır ve yönlendir
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * Takip hedefini sıfırlar ve kamerayı hemen hedefin arkasına oturtur.
   */
  reset(targetPos, targetYaw = 0, heightAtFn = null) {
    this.initialized = false;
    this.update(0.016, targetPos, targetYaw, heightAtFn);
  }
}
