# Sprint 2 Raporu — 3. Şahıs Astronot ve Takip Kamerası Modülü

**Tarih:** 2026-11-14  
**Hedef:** Sprint 2 (Bu akşam 20:30 demosu için 3. şahıs astronot modülü)  
**Teslim Konumu:** `docs/data/ekip/astronot/`  
**Kural Uyumu:** `sim/`, `.borje/` ve git dizinlerine kesinlikle dokunulmamıştır. Tüm dosyalar yalnız `docs/data/ekip/astronot/` altında oluşturulmuştur. Çıktılar headless Chrome (Playwright + SwiftShader) ile uçtan uca test edilmiş ve ekran görüntüleriyle doğrulanmıştır.

---

## 1. Üretilen Dosyalar

| Dosya | Boyut / Tür | Açıklama |
|---|---|---|
| [`astronaut.js`](./astronaut.js) | ES Modülü (`three@0.160`) | Prosedürel 1.75 m skafandrlı astronot modeli ve eklemli kinematik motoru |
| [`follow-camera.js`](./follow-camera.js) | ES Modülü | Arazi çarpışma korumalı, yay-sönümlü 3. şahıs takip kamerası |
| [`test.html`](./test.html) | HTML5 / Importmap | Test ve görselleştirme sahnesi arayüzü |
| [`test.js`](./test.js) | ES Modülü | Three.js WebGL test sahnesi, arazi modeli ve test senaryoları |
| [`run_test.js`](./run_test.js) | Node.js Test Koşucu | `playwright-core` ile SwiftShader tabanlı otomatik test scripti |
| [`idle.png`](./idle.png) | 90.9 KB PNG | Test Karesi 1: Astronot dururken (boşta / nefes duruşu) |
| [`walk.png`](./walk.png) | 97.9 KB PNG | Test Karesi 2: Astronot düz zeminde yürürken (0.67 m/s, zıt faz kol-bacak) |
| [`terrain.png`](./terrain.png) | 75.4 KB PNG | Test Karesi 3: Dalgalı tepe sırtında yürüyüş, kamera arazinin üstünde takipte |
| [`rapor.md`](./rapor.md) | Markdown | Bu teslimat ve doğrulama raporu |

---

## 2. Modül Detayları ve Mimari

### A. `astronaut.js` — Prosedürel Skafandr ve Kinematik
- **Bağımlılık:** Dış model dosyası (GLTF/OBJ) **yoktur**. Standart Three.js geometrileriyle sıfırdan oluşturulmuştur. Yükleme süresi sıfırdır, bellek ayak izi son derece düşüktür.
- **Boyutlar:** Ayak tabanından kask tepesine tam **1.75 m** boyundadır (NASA skafandrlı antropometri standardı).
- **Gerçekçi Skafandr Bileşenleri:**
  - **Kask ve Vizör:** Beyaz kompozit kask kubbesi, parlak altın kaplama EVVA vizörü (`roughness: 0.08`, `metalness: 0.96`), metalik boyun kilit halkası ve yan EVA fenerleri.
  - **Gövde (HUT):** Omuz takviyeli üst gövde, göğüs üzerinde Display and Control Module (DCM) kutusu, acil durum ve soğutma vanaları (kırmızı/mavi), gösterge paneli ve bel yatağı bileziği.
  - **PLSS Sırt Çantası:** Can destek çantası, alt radyatör ızgarası, üst silindirik OPS oksijen tankı ve iletişim anteni.
  - **Kollar:** Omuz mafsalları, dirsek eklemleri, Phase VI EVA eldivenleri ve metalik bilek kilitleri.
  - **Bacaklar ve Botlar:** Kalça eklemleri, diz mafsalları, alt bacak zırhı ve kalın kauçuk yivli EVA tabanlı botlar.
- **Gölgelendirme:** Tüm parçalar `MeshStandardMaterial` kullanır; `castShadow = true` ve `receiveShadow = true` tanımlıdır.
- **API:**
  ```javascript
  export function createAstronaut(options = {}) -> {
    group,               // Sahneye eklenecek THREE.Group
    update(dt, speedMps, grounded = true), // Animasyon güncellemesi
    height,              // 1.75 m
    setMarsGravity(bool) // Mars zıplama modunu aç/kapa
  }
  ```
- **Animasyon Dinamiği:**
  - **Hız = 0 (Idle):** Omuz ve göğüste $\sim 0.29\text{ Hz}$ frekansta çok hafif dikey nefes alma hareketi ($\pm 5\text{ mm}$); kollar yanlarda doğal hafif bükülü duruş.
  - **Hız > 0 (Yürüyüş):** Adım frekansı hıza göre dinamik ölçeklenir ($0.67\text{ m/s}$ NASA APACHE hızında $\approx 0.8\text{ Hz}$).
  - **Çapraz Koordinasyon:** Sol kol sağ bacakla, sağ kol sol bacakla zıt fazda salınır. Arkaya salınan bacağın dizi bükülür, öne inerken açılır.
  - **Gövde Sway:** Yürüyüşte basan bacağa göre gövde hafif yaw ($\pm 4^\circ$) ve roll ($\pm 2^\circ$) yapar.
  - **Mars 0.38g Zıplama (`marsGravity: true`):** Her adımda gövde havada $\sim 5\text{ cm}$ parabolik zıplama yaparak Mars düşük yerçekimi hissini verir.

---

### B. `follow-camera.js` — 3. Şahıs Takip Kamerası
- **Kamera Konumu:** Astronotun arkasından yatayda $\sim 4.5\text{ m}$, dikeyde $\sim 1.8\text{ m}$ yukarıda; astronotun göğüs/omuz hizasına ($1.25\text{ m}$) odaklanır.
- **Yay-Sönümlü Takip (Critically Damped):**
  - Ani açısal dönüşlerde kameranın sert sıçramasını önleyen en kısa açı farkı ($\Delta \theta \in [-\pi, +\pi]$) sönümleyicisi.
  - Kamera konumu $1 - e^{-\lambda \cdot dt}$ eksponansiyel yay formülüyle hedefin arkasına akar.
- **Arazi Çarpışma Önleme (`heightAtFn`):**
  - Kameranın bulunduğu $(x, z)$ koordinatında zemin kotu $h(x, z)$ sorgulanır; $y_{cam} \ge h(x, z) + 0.45\text{ m}$ garantilenir.
  - Kamera ile hedef arasındaki görüş hattı (Line-of-Sight) boyunca ara noktalar taranır; arada tepe veya sırt varsa kamera otomatik olarak yukarı kaldırılarak araziye gömülmesi engellenir.
- **API:**
  ```javascript
  export class FollowCamera {
    constructor(camera, options = {})
    update(dt, targetPos, targetYaw, heightAtFn)
    reset(targetPos, targetYaw, heightAtFn)
  }
  ```

---

## 3. Test ve Doğrulama

### A. Test Komutu
Test, projenin mevcut `sim/node_modules/playwright-core` kütüphanesi ve Chromium yürütülebilir dosyası kullanılarak SwiftShader (yazılımsal WebGL) modunda çalıştırılmıştır:

```powershell
node docs/data/ekip/astronot/run_test.js
```

### B. Birebir Test Çıktısı (Konsol Logu)
```text
[TEST] Başlatılıyor...
[TEST] Çalışma dizini: C:\Users\Batu\Desktop\martian-map-main\martian-map-main\docs\data\ekip\astronot
[TEST] Three.js vendor yolu: C:\Users\Batu\Desktop\martian-map-main\martian-map-main\sim\vendor\three.module.js
[TEST] HTTP sunucusu dinlemede: http://localhost:8092
[TEST] Chromium başlatılıyor: C:\Users\Batu\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe
[TEST] Sayfa açılıyor: http://localhost:8092/test.html
[TEST] WebGL ve TestController hazır!
[TEST] 1. Kare: Dururken (Idle)...
[TEST] -> idle.png kaydedildi (90.9 KB)
[TEST] 2. Kare: Yürürken (Walk, 0.67 m/s)...
[TEST] -> walk.png kaydedildi (97.9 KB)
[TEST] 3. Kare: Kamera arazi tepesinde (Terrain)...
[TEST] -> terrain.png kaydedildi (75.4 KB)
[TEST] Son durum istatistikleri: {
  "scenario": "terrain",
  "speed": 0.67,
  "pos": {
    "x": 7,
    "y": 3.847052080710067,
    "z": 33
  },
  "cam": {
    "x": 5.042655096499464,
    "y": 5.6470520807100675,
    "z": 28.947988039412955
  }
}
[TEST] BÜTÜN TESTLER BAŞARIYLA TAMAMLANDI!
```

### C. Alınan Karelerin Analizi
1. **`idle.png` (90.9 KB):**
   - Astronot düz zemin üzerinde durmaktadır ($x=0, y=0, z=0$).
   - Göğüs ve DCM modülü, altın vizör, PLSS sırt çantası ve gölgesi zemine net düşmektedir. Kollar yanlarda bekleme pozisyonundadır.
2. **`walk.png` (97.9 KB):**
   - Hız $0.67\text{ m/s}$ iken sol bacak önde, sağ bacak arkada dizden bükülü; kollar ters fazda salınım yapmaktadır.
   - Mars yerçekimi zıplama etkisiyle gövde zemin kotunun üzerinde dinamik yükselme göstermektedir.
3. **`terrain.png` (75.4 KB):**
   - Astronot $y = 3.85\text{ m}$ yüksekliğindeki tepe sırtında yürümektedir.
   - Takip kamerası $y = 5.65\text{ m}$ kotuna yumuşakça yükselmiş; arazi içine girmeden astronotu arkadan $\sim 4.5\text{ m}$ mesafeden kadrajlamıştır.

---

## 4. Bilinen Eksikler ve Sınırlar (Dürüst Değerlendirme)

1. **İleri Kinematik (FK) / Zemin Eğimi Uyumu:**
   - Bacak animasyonu Forward Kinematics (FK) ile matematiksel açısal salınım yapar.
   - Çok dik yamaçlarda ($\ge 25^\circ$) ayak tabanının zemin yüzey normaline tam oturması için Inverse Kinematics (IK) veya iki eklemli ayak bileği pitch düzeltmesi henüz eklenmemiştir; bu durum dik bayırlarda bot tabanının zemine hafifçe gömülmesine yol açabilir.
2. **Parmak Eklemleri:**
   - Modelde eldivenler tek parça kalıp halinde parmakları hafif kıvrık EVA eldiven bloğu olarak modellenmiştir; parmaklar bağımsız hareket etmemektedir.
3. **Kamera Engel Algılama Sınırı:**
   - Takip kamerasının arazi engeli kontrolü $h(x, z)$ 2.5D yükseklik fonksiyonuna dayanmaktadır. Mağara tavanı veya 3D kaya çıkıntıları gibi tam 3B mesh çarpışmalarını (tam raycasting) kapsamaz (HiRISE DTM zaten bir 2.5D yükseklik haritası olduğundan bu durum mevcut simülasyon için yeterlidir).
4. **Gölge Kalitesi (SwiftShader vs GPU):**
   - Headless testlerde yazılımsal render (SwiftShader) kullanıldığı için gölgeler temel PCF modundadır; gerçek GPU donanımında çok daha yumuşak ve yüksek kaliteli gölgelendirme elde edilecektir.

---

## 5. Sim'e Entegrasyon Önerisi

Bu modül `sim/app/main.js` içine tek satırlık import ile bağlanabilir:

```javascript
import { createAstronaut } from '../../docs/data/ekip/astronot/astronaut.js';
import { FollowCamera } from '../../docs/data/ekip/astronot/follow-camera.js';

// Kurulum:
const astronaut = createAstronaut({ marsGravity: true });
scene.add(astronaut.group);

const followCam = new FollowCamera(camera, { distance: 4.5, height: 1.8 });

// Her render karesinde:
astronaut.group.position.set(playerX, playerY, playerZ);
astronaut.group.rotation.y = playerYaw;
astronaut.update(dt, playerSpeed, true);

followCam.update(dt, astronaut.group.position, playerYaw, (x, z) => terrain.getHeightAt(x, z));
```

Bütün teslimat dosyaları hazırdır ve `docs/data/ekip/astronot/` altında incelenebilir.
