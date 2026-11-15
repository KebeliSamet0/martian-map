# Rigli astronot GLB araştırması ve testli teslim — 2026-11-14

**Sonuç:** bir ana model ve iskeletli bir yedek GLB hazır. İkisi de CC0, 12 MB ve 60 bin üçgen sınırlarının altında; Three.js **r160 GLTFLoader** ile gerçek Chrome/SwiftShader testleri geçti. Ana model Idle/Walk içerir. Yedek, indirilen hazır CC0 rigli FBX'in GLB dönüşümüdür; animasyonu ve kaynakta eksik olan dokusu yoktur. **Death Stranding düzeyinde fotogerçekçilik sağlandığı doğrulanmadı; bu modeller stilizedir.**

Yalnız bu `docs/data/ekip/karakter/` dizinine yazıldı. `sim/`, `.borje/`, ayarlar, başka desk dosyaları veya git değiştirilmedi. `sim/lib/three.module.js` ile `sim/node_modules/playwright-core` yalnız okundu. Uygulamaya entegrasyon yapılmadı.

## 1. Seçilen dosyalar

| Özellik | Ana model | Yedek |
| --- | --- | --- |
| Dosya | [astronaut_quaternius_2022.glb](models/astronaut_quaternius_2022.glb) | [astronaut_mrlentereng.glb](models/astronaut_mrlentereng.glb) |
| Yazar | Quaternius | ThunderWare games: özgün karakter; MrLentereng: rig / skin ağırlıkları |
| Kaynak | [Poly Pizza](https://poly.pizza/m/3hC2i0CTuO) | [Rigli kaynak](https://mrlentereng.itch.io/rigged-low-poly-astronaut), [özgün kaynak](https://mariusmopar.itch.io/astronaut-low-poly) |
| Lisans | CC0-1.0 | CC0-1.0, özgün ve rigli kaynakta açıkça belirtilmiş |
| Kaynaktaki birebir lisans etiketi | “Public Domain (CC0)” | “CC0 1.0 Universal” |
| Boyut | **1.944.976 bayt = 1,945 MB** | **757.884 bayt = 0,758 MB** |
| Yüklenen üçgen | **10.558** | **4.038** |
| Three.js kemik sayısı | **62** | **53** |
| SkinnedMesh sayısı | **13** | **1** |
| Animasyon | **24 klip**, Idle ve Walk test edildi | **0 klip**, iskelet deformasyonu test edildi |
| Kaynak edinme tarihi UTC | **2026-11-14 15:42:51.931395** | **2026-11-14 15:31:51.837** (ZIP) |
| GLB üretim tarihi UTC | Doğrudan orijinal GLB | **2026-11-14 15:35:17.659** |

Sayısal kaynaklar: [asset_manifest.json](asset_manifest.json), [test_results.json](test_results.json). MB hesabı ondalıktır (`1 MB=1.000.000 bayt`). Aday web sayfalarındaki yaklaşık üçgen sayıları yerine yüklenen mesh/primitive toplamları kullanıldı.

**Ana model doğrudan indirme URL'si:** [static.poly.pizza/0076345b-bbea-42d5-931c-4a5ad2050b18.glb](https://static.poly.pizza/0076345b-bbea-42d5-931c-4a5ad2050b18.glb). URL model sayfasının yayımladığı `src`/metadata'dan çıkarıldı; tahmin edilmedi. Kaynak sayfa HTML ve JSON anlık görüntüleri `provenance/poly_3hC2i0CTuO.*` içinde saklandı.

**Ana GLB SHA-256:**

```text
c825fb5dc0f3c2875f8c298938c35df79e884c8117d9ff62a6b213d783957758
```

**Yedek GLB SHA-256:**

```text
e7ae57a4ef9d1dbc9d9afebbe7a543708e2c586c4d9ea97fb24d4291655db355
```

Yedek için resmî indirme düğmesiyle **432.271 baytlık** `Rigged Low Poly Astronaut v1.0 — BLEND + FBX.zip` indirildi; hesap/ödeme yapılmadı. Gerçek indirme URL'si, adı, tarih ve hash [itch_download_record.json](provenance/itch_download_record.json) içinde. ZIP SHA-256:

```text
02b9550b0968d9bf73314af0e75fc1e84bd2a2e73e3013b77638a23532ce43dc
```

## 2. Lisans ve atıf

İki modelin tam CC0 metni **birebir**, değiştirilmeden [licenses/CC0-1.0.txt](licenses/CC0-1.0.txt) içinde; resmî kaynak [CC0 legalcode.txt](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt). Kaynak lisans etiketleri yukarıdaki tabloda birebir alıntıdır. Yedek için rig yazarının sayfası hem özgün hem rigli sürümün CC0 olduğunu açıklar; [özgün yazar sayfası](https://mariusmopar.itch.io/astronaut-low-poly) da CC0 belirtir. Kanıt sayfaları `provenance/itch_astronaut.html` ve `provenance/thunderware_original.html` dosyalarında.

Önerilen gönüllü atıf:

```text
Astronaut by Quaternius, via Poly Pizza — CC0 1.0.
Astronaut by ThunderWare games; rig by MrLentereng — CC0 1.0.
Backup converted from FBX to GLB; unavailable texture reference removed.
```

[ATTRIBUTION.txt](ATTRIBUTION.txt) seçilen dosyaların yazar, kaynak, birebir lisans etiketi, tarih, boyut ve SHA-256 kayıtlarını; MIT yardımcılarının kaynak ve bildirimlerini içerir. GLTFLoader ve BufferGeometryUtils istenen **three@0.160.0** unpkg adreslerinden indirildi. Yedek dönüşümü için ek MIT FBXLoader/GLTFExporter/NURBS/TextureUtils yardımcıları da aynı sürümden alındı. `fflate.module.js` kendi başlığında MIT bildirir; sürümü **0.6.9**, yazar Arjun Barrett; [tam lisans](licenses/fflate-MIT.txt) aynı npm sürümünden alındı. Three.js'in birebir MIT metni [three-MIT.txt](licenses/three-MIT.txt) içinde. Her dosyanın indirme tarihi ve hash'i manifest/atıf kayıtlarında.

NASA, Sketchfab, Mixamo, NC, ND, GPL veya lisansı kesinleşmemiş model/animasyon seçilmedi. [En az altı adayın tablosu](adaylar.md) toplam **12 aday** ve eleme nedenlerini içerir.

## 3. Yedek dönüşümünün açık sınırları

Kaynak ZIP'te `Untitled.fbx` (**270.348 bayt**) ve `Untitled.blend` (**268.250 bayt**) var. Blender ortamı kurulmadı. FBX, **r160 FBXLoader → r160 GLTFExporter** ile tarayıcı içinde GLB'ye çevrildi; yeni iskelet veya animasyon üretilmedi. Kaynak dosyalar değiştirilmedi, türetilen GLB bu teslimat dizinine yazıldı. Kaynak: [dönüşüm kodu](viewer.html), [asset manifest](asset_manifest.json).

FBX `AstronautTexture.png` dosyasına başvuruyor fakat ZIP'te görüntü yok. Özgün yazarın ayrıca indirilen `Astronaut01.blend` dosyasında da bu görevde kullanılabilir gömülü PNG/JPEG bulunamadı. Özgün `.blend` **1.155.908 bayt**; gerçek URL/hash/tarih [thunderware_download_record.json](provenance/thunderware_download_record.json) içinde. Doku içeriği yeniden oluşturulmadı veya başka yerden lisansı belirsiz görsel alınmadı.

İlk dışa aktarma eksik görüntü nedeniyle başarısız oldu; hata kanıtı [conversion_failure_before_fix.txt](provenance/conversion_failure_before_fix.txt). Dönüşümde yalnız `Material.001.map` bağlantısı kaldırıldı; kaynak diffuse rengi korundu. Sonuçta yedek **dokusuz/gri** görünüyor. Bu bir görsel eksiktir; doku düzelmiş gibi sunulmuyor. Son GLB'nin yükleme testi hatasız geçti. Animasyon ekleme/retarget, kumaş materyali ve görsel iyileştirme **yapılmadı**.

## 4. Boy, ölçek ve zemin teması

**Varsayım:** gösterimde kask dâhil toplam boy **1,85 m**. Bu, ölçülmüş NASA astronot antropometrisi değildir; modelleri sim'in metre birimine oturtmak için seçilen sunum boyudur. Kaynak glTF dosyasındaki sayısal birim ile gerçek beden boyunun fiziksel doğruluğu **doğrulanmadı**. Test `Box3.setFromObject(model,true)` ile deforme olabilen gerçek köşelerin sınırını ölçer.

| Ölçüm | Ana | Yedek |
| --- | ---: | ---: |
| Ham sayısal yükseklik | 1.858021825 | 189.932357296 |
| 1,85 m için uniform scale | **0.995682598963** | **0.009740309794** |
| Ham minY | −0.001330366 | +0.185888230 |
| Ölçekten sonraki Y ötelemesi | **+0.001324622 m** | **−0.001810609 m** |
| Normalize FootL / foot_l kemik Y | +0.023978135 m | +0.087601544 m |
| Normalize FootR / foot_r kemik Y | +0.023978135 m | +0.087601484 m |

Yedekte **189,93** çıkan ham boy doğrudan metre kabul edilmemeli; FBX dönüşümünden gelen sayısal ölçektir. 1,85 m hedefe göre yeniden ölçek önerisi bu nedenle yaklaşık **0,01**'dir. Ölçümden sonra `root.scale.setScalar(1.85/height)` ve `root.position.y=-minY*scale` kullanıldı. Bind/default pozunda mesh alt sınırı iki modelde de **Y=0**, normalize boy **1,85 m** olarak assert edildi.

Kemik pivoları ayakkabı tabanı değildir. Ayak kemiklerinin Y değerlerini sıfıra zorlamak tabanı zemine gömebilir. Yukarıdaki dönüşüm mesh alt sınırını kullanır. Animasyonda ana modelin örneklenen dört Walk fazında minY değerleri sırasıyla **−0.004825, +0.002717, +0.003281, +0.003155 m**; Idle'da yaklaşık **−0.000493…+0.000051 m**. Bunlar yalnız `t=0,0.25T,0.5T,0.75T` örnekleridir; sürekli çevrimin kesin maksimumları **ölçülmedi**. Kaynak: [test_results.json](test_results.json), `models[].phases[].samples`.

Arazi entegrasyonu önerisi: aktörün dış grubunun dünya konumunu rotadan alınan X/Z ve sim yüzey Y'sine koyun; model ölçek/zemin düzeltmesini iç grupta tutun. Eğimli zeminde iki ayak için IK, ayağın kaymasını giderme ve hız-klip senkronizasyonu ayrı uygulama işidir; bu görevde **yapılmadı**. Yedek bir T-pose rig'dir; animasyon retarget etmeden yürümez. Mevcut `astronaut.js` bu görevde okunup değiştirilmedi; öneri genel entegrasyon içindir.

## 5. Animasyon ve kemikler

Ana modelin önerilen klipleri birebir:

```text
CharacterArmature|Idle  — 1.666666627 s, 21 track
CharacterArmature|Walk  — 1.333333373 s, 37 track
```

İki klip de `AnimationMixer` ile oynatıldı; kemik pozunun değiştiği sayısal olarak doğrulandı. Idle poz farkı L1 toplamı **0.330619**, Walk **6.994636**; bu karma position/quaternion/scale bileşen testi olduğu için bir fiziksel mesafe veya kalite metriği değildir. Yedek `animations=[]` döndürür; Idle/Walk **yok**.

Ana modelde Three.js tarafındaki önemli adlar `Root`, `Hips`, `Torso`, `Head`, `UpperLegL`, `LowerLegL`, `FootL`, `UpperLegR`, `LowerLegR`, `FootR`. Kaynak GLB'de `Foot.L` gibi noktalı adlar, GLTFLoader sonrası **FootL** olur; uygulama tarafında runtime adlarını kullanın. Yedekte `pelvis`, `spine_01`, `spine_02`, `spine_03`, `thigh_l`, `calf_l`, `foot_l`, `ball_l` ve sağ eşleri bulunur. Kaynak/çalışma anı tam isim listeleri [bones_and_clips.md](bones_and_clips.md), tüm ölçümler JSON içinde.

Skin'in yalnız isimden ibaret olmadığı ayrıca test edildi: sol alt bacak kemiğine **0.2 rad** geçici dönüş verildi ve örneklenen mesh köşeleri hareket etti. Ana modelde 2769 örnekte maksimum dünya hareketi **0.085745231 m**, yedekte 202 örnekte **0.115380212 m**. Test sonunda poz geri alındı; dosyaya yeni animasyon kaydedilmedi. Kaynak: JSON `rig_deformation_probe`.

## 6. Gerçek tarayıcı testleri ve komutlar

Workspace kökü `C:/Users/Batu/Desktop/martian-map-main` içinden tekrar test:

```powershell
node martian-map-main/docs/data/ekip/karakter/test_models.cjs
node --check martian-map-main/docs/data/ekip/karakter/test_models.cjs
python -B martian-map-main/docs/data/ekip/karakter/finalize_delivery.py
```

Kaynakları yeniden edinme/dönüştürme sırası (ağ gerekir, modellerin mevcut test kayıtlarını yeniden oluşturur):

```powershell
python -B martian-map-main/docs/data/ekip/karakter/fetch_assets.py
node martian-map-main/docs/data/ekip/karakter/fetch_itch.cjs
python -B martian-map-main/docs/data/ekip/karakter/fetch_assets.py --fbx-vendor
python -B martian-map-main/docs/data/ekip/karakter/prepare_backup.py
node martian-map-main/docs/data/ekip/karakter/test_models.cjs --convert-backup
node martian-map-main/docs/data/ekip/karakter/test_models.cjs
python -B martian-map-main/docs/data/ekip/karakter/finalize_delivery.py
```

Son test ortamı: **Chrome 157.0.8103.78**, `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--use-angle=swiftshader --enable-unsafe-swiftshader`, headless 1200×900. Playwright mevcut `sim/node_modules/playwright-core` dizininden okundu. `THREE.REVISION === "160"` assert edildi. Script yalnız 127.0.0.1 üzerinde geçici dosya sunucusu açar ve sonunda kapatır; sim sunucusuna veya dosyalarına yazmaz. Chrome profili/geçici dosyaları da bu dizinin `runtime/` altındadır; model teslimatının parçası değildir.

```text
node test_models.cjs: exit code 0
passed: true
models: 2
three_unchanged: true
errors: []
warnings: []
Her iki GLB: GLTFLoader HTTP 200 + parse + render PASS
Her iki model: <=12.000.000 bayt ve <=60.000 üçgen PASS
Her iki model: SkinnedMesh + kemik deformasyonu PASS
Her iki model: normalize boy 1.85 m / mesh minY 0 PASS
Ana model: Idle ve Walk poz değişimi + 4 faz örneği PASS
Yedek: Idle/Walk bulunmadı; iskelet şartı PASS, animasyon şartı karşılanmıyor
WebGL getError(): 0
```

Ham test kaydı [test_output.txt](test_output.txt), ayrıntılı [test_results.json](test_results.json); testte yüklenen `three.module.js` SHA-256:

```text
76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495
```

Bu dosyanın test öncesi ve sonrası hash'i eşit. Loader/yardımcı kaynak URL, tarih, boyut ve hash kayıtları [asset_manifest.json](asset_manifest.json), teslimat envanteri [file_manifest.json](file_manifest.json). Harici resim veya buffer talep etmeyen tek dosyalı GLB'lerdir; son browser testinde eksik bağımlılık hatası yoktur. Khronos glTF Validator ayrıca çalıştırılmadı; validator uygunluğu **ölçülmedi**.

## 7. Ekran görüntüleri ve kalite değerlendirmesi

Görüntüler gerçek test render'ından üretildi ve görsel olarak incelendi; üretken görsel kullanılmadı.

- [Ana Idle PNG](astronaut_quaternius_2022_idle.png)
- [Ana Walk PNG](astronaut_quaternius_2022_walk.png)
- [Yedek rig / T-pose PNG](astronaut_mrlentereng_rig.png)

Ana model kapalı vizörlü, beyaz/turuncu koyu parçalı stilize bilimkurgu kıyafetidir; gerçek NASA skafandrının teknik kopyası olduğu **doğrulanmadı**. Normal/basecolor kumaş haritası yok, düz materyaller kullanır. Yakın çekimde çokgen yüzeyler görünür. Yedek daha klasik beyaz astronot siluetindedir fakat dokusu eksik ve hareketi yoktur. İkisinin de Death Stranding 2 düzeyinde malzeme, yüzey, deformasyon veya animasyon kalitesi sunduğu **doğrulanmadı**.

Bu akşam kullanılacak adayım **ana Quaternius GLB**: iki zorunlu klip gerçekten çalışıyor ve ölçeği hemen metre düzeyine oturuyor. Yedek yalnız rigli model alternatifi. Fotogerçekçi nihai karakter için özgün dikiş/kumaş/normal/roughness üretimi, detaylı skafandr tasarımı, doğru deformasyon ve ayak IK çalışması gerekir; bunlar araştırma önerileridir, `sim/` üzerinde uygulanmadı. Gerçek GPU FPS, sim içinde rota takibi, kamera engellenmesi, root-motion hızı ve eğimde ayak teması **ölçülmedi**.
