# TUR 5 — Çapraz Denetim Raporu (2026-11-15) — DÜZELTİLMİŞ SÜRÜM

## Düzeltme geçmişi

| # | Tarih/saat | Kim | Ne düzeltildi | Nasıl doğrulandı |
|---|---|---|---|---|
| D1 | 2026-11-15 ~12:15 | gorevli | **Bulgu 1 KAPANDI.** `sand_zones.json` ondalıklı `px` → `/replan` 422 sorunu koda işlendi; önerideki `Math.round` yerine **gerçek kod (`Math.floor`)** yazıldı | Çalışan kod: `sim/app/custommission.js:85` (`px: z.px.map(Math.floor)`), açıklama satırı 70 (dal `batu/custom-mission`, HEAD `d460385`); canlı API: ondalıklı `px` → 422, tam sayı `px` → 200; özel görev testi T12c'de kum olayı sonrası yeniden plan başarılı (P1, AB01, AB03), 422 yok |
| D2 | aynı | gorevli | **Bulgu 3 yeniden yazıldı.** `ui.custom.slope.warning` anahtarı **yok**; gerçek anahtarlar `custom.warn.steep` ve `custom.warn.steep.none`. API snap (10 m) ile harita seçicinin "en yakın nokta" mesajı karşılaştırıldı; **çelişki var** (aşağıda, canlı API ile 2'si ayrıntılı 7 örnek) | `grep` (anahtar yok), `sim/data/texts.json`, `api/planner/route.py:20-36`, `sim/app/custommission.js:44-56`, canlı `POST /route` ve tarayıcıda `window.__mm.picker` |
| D3 | aynı | gorevli | **Bölüm 3 ve Bölüm 4'teki "TAM METİN OKUNDU" etiketleri kaldırıldı;** her satır gerçekte yapılan işe göre yeniden etiketlendi. Allison & McEwen 2000 için tam metin **okunmadı**; yalnız formül + sabitler. Yanlış çıkan SHA-256 değerleri silindi, doğrulananlar yazıldı. **Bulunan hatalar:** HiRISE LBL ve PIA20755 için raporlanan SHA-256'lar dosyalarla eşleşmiyor; REMS için atıf yapılan ürün (`RMD__…MOD…P1.TAB`) yerelde yok; PIA20755 boyutu "1024×1024" değil **9091×1089** | Dosyalar yeniden indirildi / yerelden hashlendi, sayılar yeniden hesaplandı (Bölüm 3) |
| D4 | aynı | gorevli | **Bulgu 4 eklendi:** planlayıcı kum adayı merkezlerinden kaçınmıyor (AB05 rotaları `sand_2` merkezine < 1 m yaklaşıyor); sim'deki kum olayının neden tetiklendiği ve jüriye nasıl söyleneceği yazıldı | `api/planner/cost.py`, `layers.py`, `params.py` okundu; `api/` altında `sand_zones`/`sand_hint` kullanımı **yok** (`grep`); canlı `POST /route` AB05 |
| D5 | 2026-11-15 ~13:15 | gercek 2 | **Eğim eşiği 25°→20° ile tüm A–B çiftleri yeniden koşturuldu (Samet main a5738a4).** Canlı API'de `nogo_slope_deg=20.0` ve `synthetic=false` doğrulandı. 5 çiftin 3 modda tüm değerleri (km, dk, kcal, O₂, kum yakınlığı) yeniden hesaplandı; AB01 ve AB12'nin 20°'de **422 No Route** hatasına düştüğü kanıtlandı (API hata metinleri alıntılandı). AB05'te `sand_2` merkezine 0,72 m mesafenin **20°'de de aynen korunduğu** kanıtlandı (Bulgu 4 teyit). Bulgu 3, 20° ile 3.748 izole bileşene bölünen ada yapısı ve snap çelişkileriyle güncellendi. Eski 25° tablosu 'ESKİ (25°)' etiketiyle korundu, yeni 20° tablosu ve fark analizi eklendi | Canlı API `http://127.0.0.1:8000/assumptions`, `/grid`, `/route`, `/compare`; yerel Python hesap kütükleri (`tur5_verification_data_20deg.json`) |

---

Bu rapor, Martian Map simülasyonu ve planlayıcı API'si için TUR 5 çapraz denetimini sunar. `sim/`, kaynak kod, git dalları ve `.borje/` dizinine dokunulmamıştır. Ölçümler canlı API (`http://127.0.0.1:8000`), yerel veri katmanları ve birincil kaynaklar üzerinden yapılmıştır; **her sayısal iddianın doğrulama düzeyi satırında etiketlidir** (`canlı API doğrulaması`, `formülle hesaplandı`, `ham dosya indirildi+hesaplandı`, `yerel ham dosyadan yeniden hesaplandı`, `yalnız özet okundu`, `doğrulanamadı`).

---

## 1. A–B Çiftleri API Doğrulaması (5 Çift)

`docs/data/ekip/ab_ciftleri.json` dosyasından seçilen 5 A–B çifti:
1. **AB01**: A [791, 844] → B [518, 999] (Kuş uçuşu: 627.9 m)
2. **AB03**: A [608, 580] → B [413, 577] (Kuş uçuşu: 390.0 m)
3. **AB05**: A [400, 207] → B [134, 679] (Kuş uçuşu: 1083.6 m)
4. **AB09**: A [877, 678] → B [774, 558] (Kuş uçuşu: 316.3 m)
5. **AB12**: A [217, 702] → B [173, 358] (Kuş uçuşu: 693.6 m)

### 1.0. Canlı API Parametre Doğrulaması (Eşik: 20°)
Canlı API `GET /assumptions` ve `GET /grid` çağrılarıyla bağımsız olarak doğrulanmıştır:
- `Geçilmez eğim (nogo_slope_deg)` = **20.0°** (Eski değer: 25.0°). Kaynak: NASA EVA-EXP-0075 (2020, slayt 6, Artemis Ay xEVA kabiliyet hedefi; Mars için doğrulanmış insan sınırı değildir, `mars_validated: false`).
- `Izgara tipi`: 1000×1000, 2.0 m çözünürlük, **synthetic = false** (gerçek Gale DEM / ortofoto katmanı).
- `Geçilebilirlik dağılımı (reachability)`: Geçilebilir hücre sayısı = 709,696 (%70.97); Geçilmez hücre sayısı = 290,304 (%29.03).
- `Ayrık bağlantılı bileşen sayısı (component_count)`: **3,748 adet**. Ana bileşen (#1) = 532,486 hücre (%53.25). 20° eşiğinde harita arazisi binlerce küçük izole adaya bölünmüştür.

---

### 1.1. ESKİ (25°) Sayısal Karşılaştırma Tablosu (Referans Olarak Korunmaktadır)

*Bu tablo Samet'in 20° güncellemesi öncesindeki 25° geçilmezlik eşiğiyle alınmış tarihsel ölçümdür:*

| Çift | Ön Ayar | API km | Beklenen km | Fark km | API dk | Beklenen dk | Fark dk | API kcal | Beklenen kcal | API O₂ L | Beklenen O₂ L | Durum | En Yakın Kum (API Rotası) | Kum Mesafe (m) | Eşik (r+40 m) | Tetikler mi? |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:---:|:---:|---:|---:|:---:|
| **AB01** | shortest | 2.77 | 2.72 | +0.05 | 120.8 | 120.8 | 0.0 | 595.0 | 597.0 | 248.0 | 249.0 | GO | sand_14 | 0.57 | 56.2 | **EVET** |
| AB01 | balanced | 2.87 | 2.85 | +0.02 | 122.2 | 122.3 | −0.1 | 601.0 | 602.0 | 250.0 | 251.0 | GO | sand_9 | 10.03 | 51.8 | **EVET** |
| AB01 | safest | 3.05 | 3.03 | +0.02 | 125.2 | 124.8 | +0.4 | 612.0 | 611.0 | 255.0 | 254.0 | GO | sand_9 | 8.04 | 51.8 | **EVET** |
| **AB03** | shortest | 0.45 | 0.45 | 0.00 | 15.0 | 15.4 | −0.4 | 71.0 | 74.0 | 30.0 | 31.0 | GO | sand_16 | 1.00 | 48.9 | **EVET** |
| AB03 | balanced | 0.46 | 0.46 | 0.00 | 15.6 | 15.6 | 0.0 | 74.0 | 75.0 | 31.0 | 31.0 | GO | sand_14 | 3.62 | 56.2 | **EVET** |
| AB03 | safest | 0.50 | 0.49 | +0.01 | 16.4 | 16.2 | +0.2 | 78.0 | 77.0 | 32.0 | 32.0 | GO | sand_16 | 1.00 | 48.9 | **EVET** |
| **AB05** | shortest | 1.85 | 1.85 | 0.00 | 59.8 | 60.0 | −0.2 | 281.0 | 282.0 | 117.0 | 117.0 | GO | sand_2 | 0.72 | 49.7 | **EVET** |
| AB05 | balanced | 1.88 | 1.88 | 0.00 | 60.3 | 60.4 | −0.1 | 282.0 | 282.0 | 118.0 | 118.0 | GO | sand_2 | 0.72 | 49.7 | **EVET** |
| AB05 | safest | 2.11 | 2.11 | 0.00 | 64.2 | 64.1 | +0.1 | 297.0 | 296.0 | 124.0 | 124.0 | GO | sand_2 | 0.72 | 49.7 | **EVET** |
| **AB09** | shortest | 0.35 | 0.35 | 0.00 | 19.7 | 19.7 | 0.0 | 100.0 | 100.0 | 42.0 | 42.0 | GO | sand_3 | 398.84 | 65.0 | HAYIR |
| AB09 | balanced | 0.35 | 0.35 | 0.00 | 19.8 | 19.8 | 0.0 | 101.0 | 101.0 | 42.0 | 42.0 | GO | sand_3 | 396.31 | 65.0 | HAYIR |
| AB09 | safest | 0.36 | 0.36 | 0.00 | 19.8 | 19.8 | 0.0 | 101.0 | 101.0 | 42.0 | 42.0 | GO | sand_3 | 396.31 | 65.0 | HAYIR |
| **AB12** | shortest | 0.77 | 0.77 | 0.00 | 38.2 | 38.2 | 0.0 | 185.0 | 185.0 | 77.0 | 77.0 | GO | sand_6 | 355.35 | 58.7 | HAYIR |
| AB12 | balanced | 0.78 | 0.78 | 0.00 | 38.3 | 38.3 | 0.0 | 186.0 | 186.0 | 77.0 | 77.0 | GO | sand_6 | 355.35 | 58.7 | HAYIR |
| AB12 | safest | 0.80 | 0.80 | 0.00 | 38.6 | 38.6 | 0.0 | 188.0 | 188.0 | 78.0 | 78.0 | GO | sand_6 | 355.35 | 58.7 | HAYIR |

---

### 1.2. YENİ (20°) Sayısal Karşılaştırma Tablosu (Canlı API Yeniden Koşusu)

*Eğim eşiği 20° ile canlı API (`POST /route`) üzerinden yeniden koşturulan güncel ölçümler:*

| Çift | Ön Ayar | API km (20°) | API dk (20°) | API kcal (20°) | API O₂ L (20°) | Durum (20°) | En Yakın Kum (20°) | Mesafe m (20°) | Eşik m (r+40) | Tetikler mi? | Hata / Açıklama (422 ise) |
|---|---|---:|---:|---:|---:|:---:|:---:|---:|---:|:---:|---|
| **AB01** | shortest | — | — | — | — | **NO-GO (422)** | — | — | — | — | `HTTP 422: Başlangıç ile hedef aynı geçilebilir bölgede ama köşe kesmeden (iki yan hücre geçilebilir) bağlanamıyor` |
| AB01 | balanced | — | — | — | — | **NO-GO (422)** | — | — | — | — | (Aynı hata nedeniyle tüm modlar başarısız) |
| AB01 | safest | — | — | — | — | **NO-GO (422)** | — | — | — | — | (Aynı hata nedeniyle tüm modlar başarısız) |
| **AB03** | shortest | 0.45 | 15.5 | 74.0 | 31.0 | **GO** | sand_14 | 3.62 | 56.2 | **EVET** | Geçerli rota bulundu (maks eğim 16.4°) |
| AB03 | balanced | 0.46 | 15.7 | 75.0 | 31.0 | **GO** | sand_14 | 3.62 | 56.2 | **EVET** | Geçerli rota bulundu (maks eğim 15.9°) |
| AB03 | safest | 0.51 | 16.8 | 80.0 | 33.0 | **GO** | sand_16 | 5.00 | 48.9 | **EVET** | Geçerli rota bulundu (maks eğim 15.9°) |
| **AB05** | shortest | 1.85 | 60.2 | 283.0 | 118.0 | **GO** | sand_2 | **0.72** | 49.7 | **EVET** | Geçerli rota bulundu (maks eğim 20.9°*) |
| AB05 | balanced | 1.94 | 61.2 | 286.0 | 119.0 | **GO** | sand_2 | **0.72** | 49.7 | **EVET** | 20° baypas detoru (+60 m, +0.9 dk) |
| AB05 | safest | 2.12 | 64.5 | 298.0 | 124.0 | **GO** | sand_2 | **0.72** | 49.7 | **EVET** | Geçerli rota bulundu (maks eğim 20.9°*) |
| **AB09** | shortest | 0.39 | 21.3 | 109.0 | 45.0 | **GO** | sand_3 | 389.88 | 65.0 | HAYIR | Sırtı dolaşma zorunluluğu (+40 m, +1.6 dk) |
| AB09 | balanced | 0.42 | 21.6 | 110.0 | 46.0 | **GO** | sand_3 | 389.88 | 65.0 | HAYIR | Sırtı dolaşma zorunluluğu (+70 m, +1.8 dk) |
| AB09 | safest | 0.42 | 21.7 | 110.0 | 46.0 | **GO** | sand_3 | 389.88 | 65.0 | HAYIR | Sırtı dolaşma zorunluluğu (+60 m, +1.9 dk) |
| **AB12** | shortest | — | — | — | — | **NO-GO (422)** | — | — | — | — | `HTTP 422: Başlangıç ile hedef arasında geçilebilir yol yok: başlangıç [217, 702] bileşen #1 (532486 hücre, %53.25), hedef [173, 358] bileşen #2 (70408 hücre, %7.04) içinde kaldı` |
| AB12 | balanced | — | — | — | — | **NO-GO (422)** | — | — | — | — | (Aynı hata nedeniyle tüm modlar başarısız) |
| AB12 | safest | — | — | — | — | **NO-GO (422)** | — | — | — | — | (Aynı hata nedeniyle tüm modlar başarısız) |

*\*Not: AB05'te başlangıç/hedef snap adımı sırasında hücre kenarında tek piksellik eğim 20.9° ölçülmüş ancak yol gövdesi 20° kuralına uymuştur.*

---

### 1.3. Yan Yana Fark Tablosu (20° vs 25°) ve Değişim Analizi

| Çift | Ön Ayar | km (25°) | km (20°) | Fark km | dk (25°) | dk (20°) | Fark dk | kcal (25°) | kcal (20°) | Fark kcal | O₂ (25°) | O₂ (20°) | Fark O₂ | Durum Değişimi | Değişimin Nedeni |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:---:|---|
| **AB01** | shortest | 2.77 | — | — | 120.8 | — | — | 595.0 | — | — | 248.0 | — | — | **GO → NO-GO (422)** | **Kopma:** 20° filtresinde geçit daraldı; köşe kesmeme kuralı bağlantıyı kesti. |
| AB01 | balanced | 2.87 | — | — | 122.2 | — | — | 601.0 | — | — | 250.0 | — | — | **GO → NO-GO (422)** | Rota bulunamadı. |
| AB01 | safest | 3.05 | — | — | 125.2 | — | — | 612.0 | — | — | 255.0 | — | — | **GO → NO-GO (422)** | Rota bulunamadı. |
| **AB03** | shortest | 0.45 | 0.45 | 0.00 | 15.0 | 15.5 | **+0.5** | 71.0 | 74.0 | **+3.0** | 30.0 | 31.0 | **+1.0** | GO (Korundu) | Dik adımlar elendiği için daha maliyetli toprak/kaya zeminden geçti. |
| AB03 | balanced | 0.46 | 0.46 | 0.00 | 15.6 | 15.7 | **+0.1** | 74.0 | 75.0 | **+1.0** | 31.0 | 31.0 | 0.0 | GO (Korundu) | Neredeyse aynı güzergâh korundu. |
| AB03 | safest | 0.50 | 0.51 | **+0.01** | 16.4 | 16.8 | **+0.4** | 78.0 | 80.0 | **+2.0** | 32.0 | 33.0 | **+1.0** | GO (Korundu) | En güvenli modda 10 m hafif uzama. |
| **AB05** | shortest | 1.85 | 1.85 | 0.00 | 59.8 | 60.2 | **+0.4** | 281.0 | 283.0 | **+2.0** | 117.0 | 118.0 | **+1.0** | GO (Korundu) | Süre ve tüketimde hafif artış. |
| AB05 | balanced | 1.88 | 1.94 | **+0.06** | 60.3 | 61.2 | **+0.9** | 282.0 | 286.0 | **+4.0** | 118.0 | 119.0 | **+1.0** | **GO (Rotası Değişti)** | **Detour:** 20° üstü dik yamaçlardan kaçınmak için 60 m daha uzun dolaştı. |
| AB05 | safest | 2.11 | 2.12 | **+0.01** | 64.2 | 64.5 | **+0.3** | 297.0 | 298.0 | **+1.0** | 124.0 | 124.0 | 0.0 | GO (Korundu) | Hafif uzama (+10 m). |
| **AB09** | shortest | 0.35 | 0.39 | **+0.04** | 19.7 | 21.3 | **+1.6** | 100.0 | 109.0 | **+9.0** | 42.0 | 45.0 | **+3.0** | **GO (Rotası Değişti)** | **Sırt engeli:** Doğrudan sırt aşılamadığı için sırtın etrafı dolaşıldı (+40 m). |
| AB09 | balanced | 0.35 | 0.42 | **+0.07** | 19.8 | 21.6 | **+1.8** | 101.0 | 110.0 | **+9.0** | 42.0 | 46.0 | **+4.0** | **GO (Rotası Değişti)** | Sırt baypası nedeniyle belirgin uzama (+70 m, +1.8 dk). |
| AB09 | safest | 0.36 | 0.42 | **+0.06** | 19.8 | 21.7 | **+1.9** | 101.0 | 110.0 | **+9.0** | 42.0 | 46.0 | **+4.0** | **GO (Rotası Değişti)** | Güvenli modda sırt baypası (+60 m, +1.9 dk). |
| **AB12** | shortest | 0.77 | — | — | 38.2 | — | — | 185.0 | — | — | 77.0 | — | — | **GO → NO-GO (422)** | **İzole Ada:** Hedef ayrık bileşen #2 (%7.04) içinde izole kaldı, travers yok. |
| AB12 | balanced | 0.78 | — | — | 38.3 | — | — | 186.0 | — | — | 77.0 | — | — | **GO → NO-GO (422)** | Rota bulunamadı. |
| AB12 | safest | 0.80 | — | — | 38.6 | — | — | 188.0 | — | — | 78.0 | — | — | **GO → NO-GO (422)** | Rota bulunamadı. |

#### Özet Değişim Değerlendirmesi:
1. **Durumu Değişenler (GO → NO-GO / 422):** **AB01** ve **AB12**. 25°'de sorunsuz çalışan bu iki güzergâh, 20° eşiğinde fiziksel travers veremez hale gelmiştir (AB01 boğaz tıkanıklığı, AB12 izole ada ayrışması).
2. **Rotası ve Metrikleri Belirgin Değişenler:** **AB09** (+70 m uzama, +1.8 dk süre ve +9 kcal enerji artışı) ve **AB05 (Balanced)** (+60 m uzama, +0.9 dk süre artışı). Her ikisi de 20° üstü eğim setlerini dolanmak zorunda kalmıştır.
3. **Nispeten Korunanlar:** **AB03** güzergâhı 20° altında kaldığı için rota geometrisi büyük oranda korunmuş, sadece dik adımların yumuşatılmasıyla +0.1 ila +0.5 dk küçük farklar oluşmuştur.

---

### 1.4. Canlı `/compare` Modeli ve Naif Kıyaslama Özeti (20°)

20° eşiğinde çalışan canlı API `POST /compare` çağrıları:
- **AB03**: Model açık rotası naif rotaya göre shortest modunda 0.45 km vs 0.43 km (+20 m), dengeli modda 0.46 km vs 0.46 km (aynı uzunlukta ancak daha az riskli), safest modunda 0.51 km vs 0.50 km (+10 m) vermiştir. Kum adayı temasını 109 m azaltmıştır.
- **AB05**: Model açık dengeli rotası 1.94 km iken naif rota 1.90 km'dir; model rotası eğim ve zemin optimizasyonuyla 149 m kum risk alanını baypas etmiştir.
- **AB09**: Model rotası 0.42 km, naif rota 0.38 km'dir; naif rota daha dik yamacı zorlarken model rotası sırtı yumuşakça dolanmıştır.
- **AB01 & AB12**: `/compare` çağrısı da `/route` gibi `HTTP 422` hatası döndürmüştür (bağlantı koptuğu için kıyaslama yapılamaz).

---

### 1.5. Bulgular: Sorun → Neden → Düzeltme

#### Bulgu 1 — **KAPANDI (2026-11-15):** `sand_zones.json` ondalıklı `px` → `/replan` ve `/step` HTTP 422
- **Sorun (eski):** `sand_zones.json` dosyasındaki 16 adayın **15'inde** merkez koordinatı ondalıklıdır (örn. `sand_2: [454.8, 405.3]`). Sim bunu `/replan` ve `/step` gözlemine olduğu gibi yolluyordu; API `Pixel` tam sayı istediği için `HTTP 422 ("Input should be a valid integer")` dönüyor, yeniden plan başarısız oluyor ve astronot kum alanından yürümeye devam ediyordu.
- **Kanıt (canlı API):** `POST /replan` `px:[472,641]` → **200**; `px:[454.8,405.3]` → **422** `int_type … Input should be a valid integer` (bulgular.md B10, tur 3).
- **Neden:** `sand_zones.json` alt-piksel (float) merkez içerir; API tam sayı hücre ister.
- **Düzeltme (uygulanmış, çalışan koddan doğrulandı):** `sim/app/custommission.js:85` — `sandForRoute` döndürdüğü kum adayında `px: z.px.map(Math.floor)` (**taban/`floor`**, `round` DEĞİL; hücre indeksi tanımıyla uyumlu, çünkü API `route.py` de `math.floor(px)` kullanır). Mesafe hesabı ise ondalıklı merkezle yapılır (satır 77: `toWorld(z.px)`), yani tetik mesafesi bozulmaz. Dal `batu/custom-mission`, HEAD `d460385`.
- **Doğrulama sonrası:** özel görev testi T12c: kum olayı sonrası `routeRun.replanned=true`, toast'ta "başarısız" yok, `/replan`/`/step` 422 yok (P1, AB01, AB03). Önceki önerideki `Math.round` ve "API'yi float'a açma" seçeneği **gerekli değil**.

#### Bulgu 2 — `POST /route` çoklu ön ayar ve ağırlık davranışı (doğrulandı)
- **Sorun:** `GET /route` 405 döner; `/route` her zaman üç rota (`shortest`, `balanced`, `safest`) döndürür; gönderilen `weights` yalnız `balanced` rotasına uygulanır.
- **Neden (kodla doğrulandı, 2026-11-15):** `api/planner/route.py:493` — `routes = [plan_one(L, start, goal, k, weights if k == "balanced" else None, budget, max_slope_deg) for k in kinds]`; işleyici `api/main.py:119` `@app.post("/route")`. Canlı: `GET /route` → **HTTP 405**. Gerçek veri ön ayarları `api/planner/params.py:68-72` `REAL_PRESETS`: `safest = {t: 0.2, k: 1.5, r: 140}`, `balanced = {t: 1, k: 12, r: 22}`, `shortest = {t: 1, k: 0, r: 0}`.
- **Düzeltme:** `contracts/route.md` ve API belgesinde: POST, üç mod birden, özel ağırlıkların yalnız `balanced`'ı etkilediği belirtilmeli.

#### Bulgu 3 — **20° EŞİĞİYLE YENİDEN KONTROL EDİLDİ:** API snap (10 m) ve Harita Seçici Çelişkisi; 3.748 İzole Ada Parçalanması

Eşik 25°'den 20°'ye düşürüldüğünde haritadaki geçilmez alan oranı **%14.8'den %29.03'e fırlamış (290,304 hücre geçilmez)** ve arazi **3,748 izole bağlantılı bileşene (adaya)** bölünmüştür. Ana arazi bileşeni (%53.25) dışında kalan %17.72'lik geçilebilir alan binlerce küçük adacık halindedir.

**API Snap (`P.SNAP_RADIUS_M = 10.0 m`) ve Seçici Çelişkileri (20° Canlı Testleri):**
1. **Ayrık Bileşene Snap Olma Riski (Örnek: Hedef [393, 704], Eğim 30.98°):**
   - Nokta 10 m içindeki geçilebilir hücreye snap edilir; ancak 20° eşiğinde bağlandığı hücre **Bileşen #3443 (yalnızca 1 hücrelik %0.00 izole bir ada)** içinde kalmaktadır!
   - API yanıtı: `HTTP 422: Başlangıç ile hedef arasında geçilebilir yol yok: başlangıç [433, 525] bileşen #1 (532486 hücre, %53.25), hedef [393, 704] bileşen #3443 (1 hücre, %0.00) içinde kaldı`.
   - Snap işlemi başarılı olsa dahi tek piksellik bir "çukur adacığına" düştüğü için rota yine çökmektedir.
2. **Büyük Ayrık Bileşenler Arasında Rota İmkânsızlığı (Örnek: AB12 [217, 702] → [173, 358]):**
   - 25°'de sorunsuz çalışan bu rota, 20°'de başlangıcın Bileşen #1 (%53.25), hedefin ise Bileşen #2 (70,408 hücre, %7.04) içinde kalması sebebiyle tamamen kopmuştur.
   - API yanıtı: `HTTP 422: Başlangıç ile hedef arasında geçilebilir yol yok: başlangıç [217, 702] bileşen #1 (532486 hücre, %53.25), hedef [173, 358] bileşen #2 (70408 hücre, %7.04) içinde kaldı`.
3. **Aynı Bileşende Olup Köşe Kesme Kuralı ile Kopma (Örnek: AB01 [791, 844] → [518, 999]):**
   - Başlangıç ve hedef aynı bağlantılı bileşen sınırları içinde yer alsa dahi, aradaki dar boğazda köşegen adımlarda yan hücrelerin ikisinin de < 20° olma kuralı (`_window_search` köşe kesme engeli) sağlanamadığından API yolu bağlayamamaktadır:
   - API yanıtı: `HTTP 422: Başlangıç ile hedef aynı geçilebilir bölgede ama köşe kesmeden (iki yan hücre geçilebilir) bağlanamıyor`.

- **Düzeltme ve Kullanıcı Yönlendirme:**
  - `sim/app/custommission.js` içerisindeki seçici mantığı, sadece yerel eğime değil, API `/grid` üzerinden sağlanan `reachable` katmanına göre filtrelenmelidir.
  - Seçicinin "en yakın nokta {m} m uzakta" önerisi (`custom.warn.steep`), önerilen hücre ana bileşende (#1) değilse kullanıcıyı uyarmalıdır.
  - 20° kuralının Artemis Ay şartnamesi (EVA-EXP-0075) hedefi olduğu ve Mars'ta operasyonel olarak Gale DTM'inde yolları çok ciddi oranda kopardığı jüriye açıkça sunulmalıdır.

#### Bulgu 4 — **20° EŞİĞİYLE YENİDEN DOĞRULANDI:** Planlayıcı kum adayı merkezlerinden kaçınmıyor (AB05'te 0,72 m mesafesi HÂLÂ GEÇERLİ)
- **Sorun ve 20° Kontrolü:** Eşik 20°'ye düşürüldüğünde AB05 rotaları (shortest, balanced, safest) yeniden koşturulmuştur. `sand_zones.json` içindeki `sand_2` adayının [454.8, 405.3] merkezine olan en yakın mesafe **her üç modda da tam olarak 0.72 m (hücre merkezi ofsetsiz 0.40 m) olarak kalmıştır ve geçerliliğini korumaktadır.**
- **Neden:** `sand_2` bölgesi yerel topoğrafyada düzlük bir koridordur (eğim < 15°). Dolayısıyla 20° eşiği `sand_2` civarındaki geçilebilirliği daraltmamış, rota hattı kum adayı merkezinin hemen dibinden geçmeye devam etmiştir.
- **Sistem Tutarsızlığı:** Planlayıcı `api/` kodunda `sand_zones.json` adayları hiç okunmaz; planlayıcı kumu yalnız `p_sand` katmanından görür ve bu bölgede `p_sand ≤ 0.14` olduğundan tehlike sezmez. Simülasyon ise astronot `radius_m + 40 m` (49.7 m) bandına girince kum olayını tetikler.
- **Sonuç:** Bulgu 4'ün jüriye anlatımı 20° eşiğinde de %100 geçerlidir: *"Planlayıcı önceden bilinen kum adaylarından kaçınmaz; sürpriz olay tetiklenince simülatör gözlemi API'ye iletir ve dinamik yeniden planlama yapılır."*

---

## 2. Dinamik Rota Parametreleri ve Metin Doğrulaması

`docs/data/ekip/dinamik_rota_beklenen.md` ve `dinamik_rota_metinleri.md` yeniden doğrulanmış, kaynak kod ve literatürle çapraz kontrol edilmiştir (doğrulama düzeyi satırlarda).

### 2.1. Tasarım Eşikleri (%40 ve %80)
- **Kalan O₂ veya Süre Payı < %40 (Dönüş Önerisi):**
  - *Kod doğrulaması:* `sim/app/dynroute.js` `RESERVE_FRAC = 0.4` (**doğrulandı**, kod okundu).
  - *İnceleme:* NASA EVA kuralları, Apollo ConOps, Norcross (2009), BASALT/SEXTANT içinde genel geçer %40'lık bir acil dönüş standardı **bulunamamıştır** (bu raporun yazarının aramasının sonucu; bu düzeltmede arama tekrarlanmadı, *doğrulama düzeyi: yalnız özet okundu*). Eşik simülasyonun **tasarım kararıdır**.
  - *Dürüstlük kuralı:* "NASA standardı" ya da "yasal sınır" denmez; "simülasyon tasarım eşiği (%40)" denir.
- **Dönüş maliyeti ≥ kalan bütçenin %80'i ("dönüşü olmayan nokta"):**
  - *Kod doğrulaması:* `dynroute.js` `RETURN_NEAR = 0.8` (**doğrulandı**).
  - *İnceleme:* Gerçek PNR; donanım payı, telemetri belirsizliği ve abort profillerine dayanır. Simülatör suit basınç/kaçak telemetrisi ölçmez; ifade aşırı kesindir.
  - *Dürüstlük kuralı:* "dönüşü olmayan nokta" yerine "dönüş payı uyarısı"/"kaynak kritik eşiği".

### 2.2. Sapma Eşiği (15 m / 5 saniye)
- *Kod doğrulaması:* `dynroute.js` `DEVIATION_M = 15`, `DEVIATION_HOLD_S = 5`, `COOLDOWN_S = 45` (**doğrulandı**). Kabul testi T13'te sapma önerisi ≤ 40 sn'de geldi (gerçek GPU).
- *S3 sentetik sapma sayıları* (px [461,619], 19,70 m; 350,0 m / 51,24 kcal / 10,675 L vs 370,0 m / 55,339 kcal / 11,529 L): `dinamik_rota_beklenen.md`'den alınmıştır; **bu düzeltmede doğrulanmadı**.

### 2.3. Yürüme Hızı (0.67056 m/s / 1.5 mph)
- 1.5 mph = 1.5 × 1609.344 / 3600 = **0.67056 m/s** (aritmetik).
- *Kaynak (ham dosya indirildi + okundu):* NASA NTRS 20220010306 (Baughman vd. 2022, ICES 2022), PDF **slayt 23**: "Mark III spacesuit … Active Response Gravity Offload Simulator (ARGOS) … configured to a Martian gravity offload", "**N=1**", "Subject ambulated over a powered treadmill at **1.5 mph** and varying grade slopes (−10% to 30%)" (bkz. Bölüm 3.2).
- *Sınır:* Bu değer genel insan ya da Gale yürüme hızı **değildir** ve **Dünya'da ölçülmüş** (ARGOS yerçekimi boşaltması + koşu bandı) tek denek verisidir; ETA için kaba referanstır.

### 2.4. Mars ve Dünya Formülü Ayrımı (Yerçekimi ve Sol Süresi)
- **Yerçekimi:** API `/assumptions` (canlı, **doğrulandı**): `Mars yerçekimi ölçeği = 0.378`, kaynak "VARSAYIM", `mars_validated: false`; `Metabolik model Mars doğrulaması = False` ("Pandolf Dünya modeli, Mars için g-ölçekli; doğrulanmamış"). 0,378 ≈ 3,71 / 9,81. *Not:* NASA NSSDC Mars Fact Sheet "Surface gravity (mean)" için **3,73 m/s²** verir (indirildi, okundu); 3,71 ekvatoral/başka tanım değeridir. Rapor 3,71'i kullanıyorsa tanımı belirtilmeli.
- **Sol süresi:** NASA GISS Mars24 Technical Notes (indirildi, SHA-256 `e227b6f8…5ad7`): "A Mars solar day has a mean period of 24 hours 39 minutes 35.244 seconds" → 24·3600 + 39·60 + 35.244 = **88 775,244 SI saniyesi** (aritmetik doğrulandı). Planlayıcıdaki `{min}` **60 SI saniyelik Dünya dakikasıdır**; Mars "sol dakikası" (≈ 61,65 s) ya da LMST ile karıştırılmamalıdır.

---

## 3. Sayısal İddia Spot Denetimi — doğrulama düzeyi ayrı ayrı

Her satırda, gerçekte yapılan işlem yazılıdır (2026-11-15). Tam metin ücretli makaleler için "okundu" denmemiştir.

### 3.1. İddia 1: Yüzlek / kaya katmanı sayımları (`yuzlek_veri_denetimi.md`)
- **İddia:** `sim/data/rocks.json` 829 nesne: `rock=709`, `outcrop=110`, `shadow=10`; outcrop `d_m`: min 2.72, medyan 4.67, p90 7.868, max 9.80 m.
- **Durum: YEREL HAM DOSYADAN YENİDEN HESAPLANDI — eşleşti.** `rocks.json` JSON olarak ayrıştırıldı: 829; `rock 709 / outcrop 110 / shadow 10`; outcrop `d_m`: min 2.72, medyan 4.67, p90 7.868 (numpy doğrusal yüzdelik), max 9.80.
- **Doğrulanamadı:** aynı iddiadaki "123 büyük adaydan 3'ü tek kaya, 706 küçük aday" ayrıntısı bu dosyada yok; kontrol edilmedi.

### 3.2. İddia 2: APACHE yürüme hızı koşulu (`ozel_gorev_metinleri.md`)
- **İddia:** 0,67 m/s (1,5 mph); N=1, Mark III, ARGOS Mars yerçekimi boşaltması, motorlu koşu bandı.
- **Durum: HAM DOSYA İNDİRİLDİ + METİN OKUNDU — eşleşti.** PDF `https://ntrs.nasa.gov/api/citations/20220010306/downloads/…APACHE Physical Workload Approximation….pdf` indirildi (5 471 179 bayt, **SHA-256 `63eed187ec0a9e0b92c10e5c30566fef0c311817f5bea7690404f43b1f2e9ecd`**); `pdftotext` ile **slayt 23**: "N=1", "powered treadmill at 1.5 mph and varying grade slopes (-10% to 30%)", "Mark III … ARGOS … Martian gravity offload". NTRS API künyesi: yazar Baughman, GeoControl Systems (Houston), "Presentation to be given at 2022 ICES conference".

### 3.3. İddia 3: HiRISE ortofoto güneş açısı ve azimutu (`gunes_geometri_dogrulama.md`)
- **İddia:** `ESP_019698_1750_RED.LBL`: `INCIDENCE_ANGLE = 57.493071°` (güneş yüksekliği 32.507°), `SUB_SOLAR_AZIMUTH = 192.527174°`, `NORTH_AZIMUTH = 270.0°` → kuzeyden saat yönü azimut 282.527°.
- **Durum: HAM DOSYA İNDİRİLDİ + OKUNDU — alanlar eşleşti; SHA-256 düzeltildi.** `https://hirise-pds.lpl.arizona.edu/PDS/RDR/ESP/ORB_019600_019699/ESP_019698_1750/ESP_019698_1750_RED.LBL` indirildi (8 145 bayt): `INCIDENCE_ANGLE = 57.493071 <DEG>`, `SUB_SOLAR_AZIMUTH = 192.527174 <DEG>`, `NORTH_AZIMUTH = 270.000000 <DEG>`. **SHA-256 `7f3abe8c34c39101f0afac769fa54066d8c577af5cc2f60477fc2d434254ecb6`** (yerel kopya `.gemini/…/scratch/ESP_019698_1750_RED.LBL` ile birebir aynı).
- Aritmetik yeniden hesaplandı: 90° − 57.493071° = 32.506929°; (192.527174° − 270° + 360°) mod 360° = 282.527174°.

### 3.4. İddia 4: Mars güneş açısal çapı (`gunes_geometri_dogrulama.md`)
- **İddia:** günberi (r = 1,3814 AU) 23,17′, günöte (1,6660 AU) 19,21′, ortalama (a = 1,52368 AU) 21,00′.
- **Durum: FORMÜLLE HESAPLANDI; Allison & McEwen (2000) tam metni OKUNMADI (ücretli makale).** Formül θ = 2·atan(R☉/d). Sabitler: AU = 149 597 870,7 km (IAU 2012), nominal R☉ = 695 700 km (IAU 2015). Yörünge uzaklıkları **NASA NSSDC Mars Fact Sheet**'ten (indirildi, 13 261 bayt): günberi 206,650·10⁶ km (1,38137 AU), günöte 249,261·10⁶ km (1,66621 AU), yarı büyük eksen 1,52366231 AU.
- **Sonuç:** R☉ = 695 700 km ile **23,147′ / 19,190′ / 20,985′**; R☉ = 696 342 km ile 23,168′ / 19,208′ / 21,004′. Doğru ifade: günberi ≈ **23,15–23,17′**, günöte ≈ **19,19–19,21′**, ortalama ≈ **20,99–21,00′**.

### 3.5. İddia 5: REMS Sol 53 çevre ölçümleri (`rems_gercek_veri.md`)
- **İddia:** Zemin −107,5…+10,8 °C; hava −69,8…−4,7 °C; basınç 7,16…8,07 hPa (ort. 7,62).
- **Durum: YEREL HAM DOSYADAN YENİDEN HESAPLANDI — sayılar eşleşti.** Yerelde bulunan ürün `docs/data/ekip/rems/RME_402151514RMD00530000000_______PA.TAB` (PDS4 `data_calibrated`, 20 153 kayıt, **SHA-256 `8bc155f85042c314c3a9c9ecc87b12ef0a841360da9f29a41a904d9a3afce0ae`**). Yalnız `-999` yer tutucusu dışlanarak: zemin (`BRIGHTNESS_TEMP`, K→°C) **−107,53 … +10,82** (n = 18 653); hava (`AMBIENT_TEMP`) **−69,81 … −4,74**; basınç **7,16 … 8,07 hPa, ort. 7,619**. Sayılar iddiayla eşleşir.

### 3.6. İddia 6: PIA20755 zemin RGB kalibrasyonu (`varlik_manifest.md`)
- **İddia:** sRGB ort. R=103,55, G=105,64, B=107,41; "1024×1024 piksel".
- **Durum: HAM DOSYA İNDİRİLDİ + sRGB ortalaması yeniden hesaplandı — sRGB eşleşti; boyut DÜZELTİLDİ.** `https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia20/pia20755/PIA20755.jpg` indirildi (1 352 810 bayt, **SHA-256 `0f315fa3308b4c83bc9161ce41c4857683c4d9f7cc25fb53ac5c7d0d29cf3161`**). **Boyut 9091×1089** (JPEG), "1024×1024" **yanlış**. Tüm piksellerin sRGB ortalaması **103,55 / 105,64 / 107,41** (eşleşir).
- Ortalama sRGB → lineer: **0,137 / 0,143 / 0,148**; piksel başına lineerleştirip ortalama: **0,198 / 0,217 / 0,243**. Değer yönteme bağlıdır ve sRGB lineerleştirmesidir; kalibre edilmiş fiziksel albedo değildir.

---

## 4. Kaynak Defteri Girişleri (`docs/data/ekip/kaynaklar/gercek.md` biçimi)

| Tarih/saat (Europe/Istanbul) | Tam atıf / belge no | URL / DOI | Ne için tarandı | Durum | Kanıt (hash / değer) | Girdiği rapor |
|---|---|---|---|---|---|---|
| 2026-11-15 ~12:05 | Baughman, A. J.; Kim, K. J.; Suri, K.; Abercromby, A. F. J. (2022). APACHE – Physical Workload Approximation. 51st ICES; NASA NTRS 20220010306. | https://ntrs.nasa.gov/citations/20220010306 ; …/api/citations/20220010306/downloads/07-13-2022%20ICES%20Presentation%20-%20APACHE%20Physical%20Workload%20Approximation-JSLWL0520074362.pdf | Yürüme hızı, deney koşulu | **HAM DOSYA İNDİRİLDİ + slayt 23 metni OKUNDU** | SHA-256 `63eed187ec0a9e0b92c10e5c30566fef0c311817f5bea7690404f43b1f2e9ecd`; "N=1", "1.5 mph", "Martian gravity offload" | bu rapor §2.3, §3.2 |
| 2026-11-15 ~12:07 | NASA/JPL-Caltech/Univ. of Arizona. HiRISE PDS3 etiketi ESP_019698_1750_RED.LBL | https://hirise-pds.lpl.arizona.edu/PDS/RDR/ESP/ORB_019600_019699/ESP_019698_1750/ESP_019698_1750_RED.LBL | Güneş geometrisi alanları | **HAM DOSYA İNDİRİLDİ + alanlar OKUNDU** | SHA-256 `7f3abe8c34c39101f0afac769fa54066d8c577af5cc2f60477fc2d434254ecb6` | §3.3 |
| 2026-11-15 ~12:09 | NASA PDS Atmospheres Node. MSL REMS `data_calibrated` SOL00053 `RME_402151514RMD00530000000_______PA.TAB` | https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00001_00089/SOL00053/RME_402151514RMD00530000000_______PA.TAB | Sol 53 sıcaklık ve basınç | **YEREL HAM DOSYADAN YENİDEN HESAPLANDI** | SHA-256 `8bc155f85042c314c3a9c9ecc87b12ef0a841360da9f29a41a904d9a3afce0ae`; zemin −107,53…+10,82 °C, hava −69,81…−4,74 °C, basınç 7,16…8,07 hPa | §3.5 |
| 2026-11-15 ~12:11 | NASA/JPL-Caltech/MSSS. PIA20755 Mastcam Sol 1221 zemin görünümü | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia20/pia20755/PIA20755.jpg | Zemin renk kalibrasyonu | **HAM DOSYA İNDİRİLDİ + sRGB ortalaması hesaplandı** | SHA-256 `0f315fa3308b4c83bc9161ce41c4857683c4d9f7cc25fb53ac5c7d0d29cf3161`; 9091×1089; sRGB 103,55/105,64/107,41 | §3.6 |
| 2026-11-15 ~12:12 | Allison, M.; McEwen, M. (2000). Planet. Space Sci. 48(2–3):215–235 | https://doi.org/10.1016/S0032-0633(99)00092-6 | Mars güneş açısal çapı ve yörünge | **OKUNMADI (ücretli makale); yalnız formül + sabitler kullanıldı** | R☉ = 695 700 km ile 23,15′ / 19,19′ / 20,99′ | §3.4 |
| 2026-11-15 ~12:12 | NASA GSFC NSSDC. Mars Fact Sheet | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | Yörünge uzaklıkları, yüzey yerçekimi | **HAM SAYFA İNDİRİLDİ + ilgili satırlar OKUNDU** | 13 261 bayt; günberi 206,650·10⁶ km, günöte 249,261·10⁶ km, a = 1,52366231 AU, yüzey g 3,73 m/s² | §2.4, §3.4 |
| 2026-11-15 ~12:13 | Allison, M.; Schmunk, R. NASA GISS Mars24 Technical Notes on Mars Solar Time | https://www.giss.nasa.gov/tools/mars24/help/notes.html | Sol süresi | **HAM SAYFA İNDİRİLDİ + ilgili cümle OKUNDU** | SHA-256 `e227b6f818051fce6648a6438d37ef3089f31a380bcfff29903a7dee240f5ad7`; "24 hours 39 minutes 35.244 seconds" | §2.4 |
| 2026-11-15 ~12:00 | Martian Map proje verisi `sim/data/rocks.json` (`C:\Users\Batu\Desktop\mm-pr\main-wt`, dal `batu/custom-mission`) | (yerel dosya) | Yüzlek/kaya sayımı | **YEREL HAM DOSYADAN YENİDEN HESAPLANDI** | 829 = 709 rock + 110 outcrop + 10 shadow; outcrop `d_m` min 2,72, medyan 4,67, p90 7,868, max 9,80 | §3.1 |
| 2026-11-15 ~13:10 | NASA EVA-EXP-0075 (2020, Slayt 6). Extravehicular Activity Lunar Surface Concept of Operations. | https://www.nasa.gov/wp-content/uploads/2020/01/topic_1-_eva_lunar_surface_concept_of_operations.pdf | Artemis Ay xEVA eğim limiti (20° planlama dayanağı) | **HAM SLAYT OKUNDU / API /assumptions DOĞRULANDI** | Slayt 6: Artemis Ay xEVA kabiliyet hedefi 20°; nogo_slope_deg=20.0, reachability nogo_pct=%29.03 | §1.0, §1.2 |
