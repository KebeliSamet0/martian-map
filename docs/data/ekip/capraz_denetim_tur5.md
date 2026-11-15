# TUR 5 — Çapraz Denetim Raporu (2026-11-15) — DÜZELTİLMİŞ SÜRÜM

## Düzeltme geçmişi

| # | Tarih/saat | Kim | Ne düzeltildi | Nasıl doğrulandı |
|---|---|---|---|---|
| D1 | 2026-11-15 ~12:15 | gorevli | **Bulgu 1 KAPANDI.** `sand_zones.json` ondalıklı `px` → `/replan` 422 sorunu koda işlendi; önerideki `Math.round` yerine **gerçek kod (`Math.floor`)** yazıldı | Çalışan kod: `sim/app/custommission.js:85` (`px: z.px.map(Math.floor)`), açıklama satırı 70 (dal `batu/custom-mission`, HEAD `d460385`); canlı API: ondalıklı `px` → 422, tam sayı `px` → 200; özel görev testi T12c'de kum olayı sonrası yeniden plan başarılı (P1, AB01, AB03), 422 yok |
| D2 | aynı | gorevli | **Bulgu 3 yeniden yazıldı.** `ui.custom.slope.warning` anahtarı **yok**; gerçek anahtarlar `custom.warn.steep` ve `custom.warn.steep.none`. API snap (10 m) ile harita seçicinin "en yakın nokta" mesajı karşılaştırıldı; **çelişki var** (aşağıda, canlı API ile 2'si ayrıntılı 7 örnek) | `grep` (anahtar yok), `sim/data/texts.json`, `api/planner/route.py:20-36`, `sim/app/custommission.js:44-56`, canlı `POST /route` ve tarayıcıda `window.__mm.picker` |
| D3 | aynı | gorevli | **Bölüm 3 ve Bölüm 4'teki "TAM METİN OKUNDU" etiketleri kaldırıldı;** her satır gerçekte yapılan işe göre yeniden etiketlendi. Allison & McEwen 2000 için tam metin **okunmadı**; yalnız formül + sabitler. Yanlış çıkan SHA-256 değerleri silindi, doğrulananlar yazıldı. **Bulunan hatalar:** HiRISE LBL ve PIA20755 için raporlanan SHA-256'lar dosyalarla eşleşmiyor; REMS için atıf yapılan ürün (`RMD__…MOD…P1.TAB`) yerelde yok; PIA20755 boyutu "1024×1024" değil **9091×1089** | Dosyalar yeniden indirildi / yerelden hashlendi, sayılar yeniden hesaplandı (Bölüm 3) |
| D4 | aynı | gorevli | **Bulgu 4 eklendi:** planlayıcı kum adayı merkezlerinden kaçınmıyor (AB05 rotaları `sand_2` merkezine < 1 m yaklaşıyor); sim'deki kum olayının neden tetiklendiği ve jüriye nasıl söyleneceği yazıldı | `api/planner/cost.py`, `layers.py`, `params.py` okundu; `api/` altında `sand_zones`/`sand_hint` kullanımı **yok** (`grep`); canlı `POST /route` AB05 |

Bu düzeltmede **dokunulmayanlar** (açıkça): Bölüm 1.1 sayısal tablosu ve 1.2 `/compare` özeti yeniden türetilmedi (yalnız AB05 kum mesafesi çapraz kontrol edildi, Bulgu 4); Bölüm 2.1–2.2 eşikleri kodla karşılaştırıldı (aşağıda), 2.2'deki S3 sapma sayıları `dinamik_rota_beklenen.md`'den alındığı için **bu düzeltmede doğrulanmadı**. `sim/` ve koda dokunulmadı.

---

Bu rapor, Martian Map simülasyonu ve planlayıcı API'si için TUR 5 çapraz denetimini sunar. `sim/`, kaynak kod, git dalları ve `.borje/` dizinine dokunulmamıştır. Ölçümler canlı API (`http://127.0.0.1:8000`), yerel veri katmanları ve birincil kaynaklar üzerinden yapılmıştır; **her sayısal iddianın doğrulama düzeyi satırında etiketlidir** (`formülle hesaplandı`, `ham dosya indirildi+hesaplandı`, `yerel ham dosyadan yeniden hesaplandı`, `yalnız özet okundu`, `doğrulanamadı`).

---

## 1. A–B Çiftleri API Doğrulaması (5 Çift)

`docs/data/ekip/ab_ciftleri.json` dosyasından seçilen 5 A–B çifti:
1. **AB01**: A [791, 844] → B [518, 999] (Kuş uçuşu: 627.9 m)
2. **AB03**: A [608, 580] → B [413, 577] (Kuş uçuşu: 390.0 m)
3. **AB05**: A [400, 207] → B [134, 679] (Kuş uçuşu: 1083.6 m)
4. **AB09**: A [877, 678] → B [774, 558] (Kuş uçuşu: 316.3 m)
5. **AB12**: A [217, 702] → B [173, 358] (Kuş uçuşu: 693.6 m)

Her çift için canlı API (`POST /route` ve `POST /compare`) çağrılmış; rota çıktıları (km, süre dk, enerji kcal, O₂ tüketimi L, geçilemezlik durumları) ve `sand_zones.json` (16 kum bölgesi) merkezlerine olan mesafe (`radius_m + 40 m` tetikleme eşiği) hücre bazında (2 m çözünürlük) hesaplanmıştır. *Doğrulama düzeyi: canlı API çıktısı + yerel hesap; tablo bu düzeltmede yeniden türetilmedi (AB05 kum mesafesi hariç, bkz. Bulgu 4).*

### 1.1. Sayısal Karşılaştırma Tablosu

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

*AB05 kum mesafesi çapraz kontrolü (D4):* canlı API'den alınan `path_px` ile `sand_zones.json` merkezleri arası en kısa mesafe, hücre indeksleri doğrudan kullanılınca **0,40 m**, tablodaki **0,72 m** hücre-merkezi kaydırma (+0,5) kabulüne bağlıdır; iki kabulde de < 1 m ve eşiğin (49,7 m) çok altındadır, sonuç "EVET" değişmez.

### 1.2. Canlı `/compare` Modeli ve Naif Kıyaslama Özeti

`/compare` uç noktası zemin modeli açık (model) ile zemin modeli kapalı (naif: yalnızca eğim optimizasyonu) rotaları kıyaslar. Canlı API çıktısından elde edilen model kazanımları (`saved`) — *bu düzeltmede yeniden türetilmedi*:
- **AB01**: Model rotası en kısa modda kum havuzlarından kaçınmak için 50 m daha uzundur (−50 m), fakat risk puanını 3.18 azaltır; en güvenli modda 214 m yol optimizasyonu ve 24 kcal enerji tasarrufu sağlar.
- **AB03**: Model rotası naif rotaya göre 109 m kum adayı temasını engellemiş; dengeli modda risk puanını 8.42 düşürmüştür.
- **AB05**: 1083.6 m'lik uzun hatta model rotası en güvenli modda 149 m kum risk bölgesini baypas etmiştir. (**Dikkat:** "kum risk bölgesi" burada `p_sand` ≥ eşik olan *model* katmanıdır; `sand_zones.json` adayları değil. Bkz. Bulgu 4.)
- **AB09 & AB12**: Kum havuzlarına 350 m'den daha uzak olduklarından kum tasarrufu 0 m'dir; farklar doğrudan mikroyüzey eğim ve ana kaya / toprak geçişlerinden kaynaklanmaktadır.

### 1.3. Bulgular: Sorun → Neden → Düzeltme

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

#### Bulgu 3 — 25° eşiği: API snap (10 m) ile harita seçici (en yakın nokta) **çelişiyor** (yeniden yazıldı)

**Önce düzeltmeler.** (a) Önceki metindeki `ui.custom.slope.warning` anahtarı **yoktur** (`grep` ile `sim`, `api`, `docs` altında bulunamadı). Gerçek anahtarlar `sim/data/texts.json` içinde: `custom.warn.steep` ("Burası {slope}°; projenin 25° planlama eşiği aşılmış. Eşiğin altındaki en yakın nokta {m} m uzakta; bu insan yürüyüş sınırı değildir.") ve `custom.warn.steep.none` (yakında eşik altı nokta bulunamazsa). (b) Önceki metin "kullanıcı uyarı alıyor fakat rota yine de hesaplanabiliyor" diyordu; **arayüzde hesaplama kapatılır** (`sim/app/mappicker.js`: A veya B ≥ 25° ise `compute.disabled`), rota yalnız doğrudan API çağrısıyla alınabilir.

**Kurallar (koddan):**
- **API:** `api/planner/route.py:20-36` `_check`: hücre eğimi `≥ P.SLOPE_NOGO_DEG` (25°) ise `P.SNAP_RADIUS_M = 10.0 m` (`params.py:41`) içindeki **en yakın geçilebilir hücreye** bağlar; yoksa `PlanError("Nokta geçilmez eğimde (X°), 10 m içinde geçilebilir hücre yok")`. Bağlandıktan sonra ayrı bir **bağlantılı bileşen** denetimi vardır: başlangıç ve hedef aynı geçilebilir bileşende değilse "geçilebilir yol yok: başlangıç … bileşen #N (… hücre, %…)".
- **Seçici:** `sim/app/custommission.js:44-56` `nearestPassable`: halka arama, **150 hücreye (300 m) kadar**, yalnız `eğim < 25°` koşuluyla; **bağlantılılığa bakmaz**. `cellInfo`: `eğim < 25°` değilse tamamen engeller.

**Canlı denemeler** (API `127.0.0.1:8000`, ızgara 1000×1000, 2 m; seçici `window.__mm.picker` ile; ham çıktı `docs/data/ekip/gorevli/tani_kayitlari/`):

| # | A (eğim) | Seçici gösterir / yapar | Canlı `POST /route` | Sonuç |
|---|---|---|---|---|
| 1 | [197,47] (43°, en yakın eşik altı 18 m) → B [287,117] | "…en yakın nokta **18 m** uzakta…"; hesapla **kapalı** | **422** "Nokta geçilmez eğimde (43°), **10 m içinde geçilebilir hücre yok**" | iki taraf da reddeder (tutarlı); ama seçicinin önerdiği nokta [188,47] için aşağıya bak |
| 2 | A [956,306] → B [866,236] (36°, 18 m) | B için "…**18 m** uzakta…"; hesapla kapalı | **422** "…10 m içinde geçilebilir hücre yok" | tutarlı |
| 3 | [653,501] (44°, en yakın **3 m**) → [744,570] | "…en yakın nokta **3 m** uzakta" (önerilen nokta [652,500]); hesapla **kapalı** | **422** "Başlangıç ile hedef arasında geçilebilir yol yok: başlangıç [653,501] **bileşen #643 (9 hücre, %0.00)**, hedef bileşen #1 (743 390 hücre, %74.34)" | **ÇELİŞKİ:** API 10 m içinde bağladı ama bağlandığı yer 9 hücrelik **ada**; seçicinin "3 m" önerisi de aynı adada |
| 4 | [188,47] (seçicinin 1. satır için önerdiği nokta) → [287,117] | (öneri kabul edilirse eğim < 25°, hesaplanabilir görünür) | **422** "geçilebilir yol yok: başlangıç [188,47] **bileşen #309 (17 hücre)**…" | **ÇELİŞKİ:** önerilen nokta ulaşılamaz ada |
| 5 | [652,500] (3. satırın önerisi) → [744,570] | — | **422** "…bileşen #643 (9 hücre)…" | önerilen nokta ulaşılamaz |
| 6 | [409,724] (25.17°) → [469,744] ve [437,702] (25.92°) → [497,722] | "eğim ≥ 25°" uyarısı; hesapla **kapalı** | **200** rota var (shortest 0.15 km / 0.14 km) | **ÇELİŞKİ:** API bağlar ve rota verir; seçici engeller (daha katı) |
| 7 | [173,20] (26°) ve [393,704] (31°) | uyarı, hesapla kapalı | **422** "geçilebilir yol yok: başlangıç … bileşen #1828 (1 hücre) / #33 (85 hücre)…" | snap bir adaya düşer |

- **Sorun:** Kullanıcı 25° üstü bir noktaya tıkladığında üç katman farklı davranır: (i) seçici **bağlanabilecek noktaları da engeller** (satır 6: API rota verirdi); (ii) seçicinin "eşik altındaki en yakın nokta {m} m" mesajı **ulaşılabilirlikten bağımsızdır**; önerilen noktanın kendisi API'de "geçilebilir yol yok" (422) verebilir (satır 3–5); (iii) API'nin 10 m snap'i de küçük **ayrık adalara** bağlanıp 422 verebilir (satır 3, 7).
- **Neden:** Üç ayrı kural: seçici sert `eğim<25°` + bağlantısız halka arama (150 hücre); API 10 m snap + bağlantılı bileşen denetimi; mesajda ulaşılabilirlik yok. Ayrık ada boyutları gerçek (bileşen #1 ana arazi %74,34; diğerleri 1–85 hücre).
- **Düzeltme önerisi (kod değiştirilmedi):** (1) Seçici, ≥ 25° ve API snap yarıçapı (10 m) içinde ise engellemek yerine uyarıyla hesaplamaya izin versin ya da API'den snap sonucunu istesin; (2) `nearestPassable` yalnız ana bileşene bağlı hücreleri önersin (bileşen etiketi API'den ya da önhesap) ya da mesajda "ana araziye bağlı olmayabilir" desin; (3) API 422 mesajını (ada boyutu) kullanıcıya anlaşılır metne çevirsin; (4) mesaj dürüstlüğü: "25° bir planlama eşiğidir, insan yürüyüş sınırı değildir" cümlesi doğru ve korunmalı (`custom.warn.steep`).

#### Bulgu 4 (YENİ) — Planlayıcı kum adayı merkezlerinden kaçınmıyor; sim'deki kum olayı ayrı bir veriyle tetikleniyor
- **Sorun:** AB05'in üç rotası (shortest/balanced/safest) `sand_zones.json` içindeki `sand_2` adayının merkezine < 1 m yaklaşır (canlı API, hesap: 0,40–0,72 m; yarıçap 9,7 m; tetik eşiği 49,7 m); yine de API üç rotayı da `GO` döndürür.
- **Neden (kodla doğrulandı):** `api/` altında `sand_zones.json` ve `layers/sand_hint.json` **hiçbir yerde okunmaz** (`grep -rnE "sand_zones|sand_hint" api/` boş). Planlayıcı kumu yalnız **model katmanı `p_sand`** üzerinden görür ve yalnız **yumuşak** etkiler: `api/planner/cost.py` `speed_ms` = Σ `probs[c]·TERRAIN_SPEED[c]` ve `eta` = Σ `probs[c]·TERRAIN_ETA[c]` (`params.py:31-33`: kum için η = 2,1, hız çarpanı 0,6, **VARSAYIM**; `load_terrain` ile dosyadan geçersiz kılınabilir (satır 177), çalışan API `/assumptions` η = bedrock 1,0 / soil 1,2 / sand 2,1 / bigrock 1,5 bildirir); `risk_per_m` (cost.py:85-96) eğim, kaya yoğunluğu ve belirsizlikten oluşur, **kum terimi yoktur**; `cost_surface` (cost.py:99-112) maliyeti eğim ≥ 25° için sonsuz yapar (satır 105; isteğe bağlı kullanıcı eğimi ve `MARTIAN_ROCK_BLOCK=1` kaya maskesi de eklenebilir, varsayılan kapalı). AB05 rotası boyunca `p_sand` en çok **0,13–0,14** (canlı API segment alanı); yani model o bölgeyi kum saymıyor. `p_sand` (provizyonel kurallı üretimde) eğim ve kaya sıklığından türetilir (`layers.py:231-252`), ölçüm değildir.
- **Sim'de olay neden tetikleniyor:** Kum olayı planlayıcıdan değil, `sim/data/sand_zones.json`'daki **ortofoto aday** listesinden gelir (`sim/app/custommission.js` `sandForRoute`: rota bir adayın `radius_m + 40 m` yakınından geçiyorsa; S1–S3'te görev tanımındaki `sand`). Olay tetiklenince sim, adayı **gözlem** olarak `/replan`'a verir ve yeniden plan istenir. Yani olay ile planlayıcı farklı bilgi kaynaklarına dayanır.
- **Jüriye dürüst anlatım (1 paragraf):** "Planlayıcı, ortofotoda kum *adayı* olarak işaretlenmiş alanlardan kaçınmaz; yalnız zemin modelinin kum olasılığını (`p_sand`, şu an eğim ve kaya sıklığından türetilen bir model tahmini, ölçüm değil) hız ve enerji maliyetine yumuşakça katar. Dolayısıyla rota bir kum adayının içinden geçebilir ve `GO` görünebilir (AB05'te üç rota da böyle). Simülasyondaki kum uyarısı ise ortofotodan elle/yarı-otomatik işaretlenmiş aday alanlara dayanan ayrı bir veridir; astronot o alana 'radius + 40 m' yaklaşınca olay tetiklenir ve sistem aday alanı gözlem olarak planlayıcıya verip rotayı yeniden hesaplatır. Bu bir görüntü tespitidir (`confidence: aday`), doğrulanmış kum ölçümü değildir, ve planlayıcının önceden kumdan kaçındığını iddia etmemeliyiz; sürprizle karşılaşıp yeniden planlamayı gösteriyoruz."
- **Düzeltme önerisi:** İstenirse `sand_zones.json`, `p_sand` katmanına **ön işleme** olarak (aday çevresine yüksek `p_sand`) eklenebilir; o zamana kadar arayüz/karne metinlerinde "planlayıcı kumdan kaçınır" ifadesi kullanılmamalı. (Bu kod değişikliği önerisidir, uygulanmamıştır.)

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

Her satırda, **bu düzeltmede gerçekte yapılan işlem** yazılıdır (2026-11-15). Tam metin ücretli makaleler için "okundu" denmemiştir.

### 3.1. İddia 1: Yüzlek / kaya katmanı sayımları (`yuzlek_veri_denetimi.md`)
- **İddia:** `sim/data/rocks.json` 829 nesne: `rock=709`, `outcrop=110`, `shadow=10`; outcrop `d_m`: min 2.72, medyan 4.67, p90 7.868, max 9.80 m.
- **Durum: YEREL HAM DOSYADAN YENİDEN HESAPLANDI — eşleşti.** `rocks.json` JSON olarak ayrıştırıldı: 829; `rock 709 / outcrop 110 / shadow 10`; outcrop `d_m`: min 2.72, medyan 4.67, p90 7.868 (numpy doğrusal yüzdelik), max 9.80.
- **Doğrulanamadı:** aynı iddiadaki "123 büyük adaydan 3'ü tek kaya, 706 küçük aday" ayrıntısı bu dosyada yok; bu düzeltmede **kontrol edilmedi**.

### 3.2. İddia 2: APACHE yürüme hızı koşulu (`ozel_gorev_metinleri.md`)
- **İddia:** 0,67 m/s (1,5 mph); N=1, Mark III, ARGOS Mars yerçekimi boşaltması, motorlu koşu bandı.
- **Durum: HAM DOSYA İNDİRİLDİ + METİN OKUNDU — eşleşti.** PDF `https://ntrs.nasa.gov/api/citations/20220010306/downloads/…APACHE Physical Workload Approximation….pdf` indirildi (5 471 179 bayt, **SHA-256 `63eed187ec0a9e0b92c10e5c30566fef0c311817f5bea7690404f43b1f2e9ecd`**); `pdftotext` ile **slayt 23**: "N=1", "powered treadmill at 1.5 mph and varying grade slopes (-10% to 30%)", "Mark III … ARGOS … Martian gravity offload". NTRS API künyesi: yazar Baughman, GeoControl Systems (Houston), "Presentation to be given at 2022 ICES conference".

### 3.3. İddia 3: HiRISE ortofoto güneş açısı ve azimutu (`gunes_geometri_dogrulama.md`)
- **İddia:** `ESP_019698_1750_RED.LBL`: `INCIDENCE_ANGLE = 57.493071°` (güneş yüksekliği 32.507°), `SUB_SOLAR_AZIMUTH = 192.527174°`, `NORTH_AZIMUTH = 270.0°` → kuzeyden saat yönü azimut 282.527°.
- **Durum: HAM DOSYA İNDİRİLDİ + OKUNDU — alanlar eşleşti; SHA-256 düzeltildi.** `https://hirise-pds.lpl.arizona.edu/PDS/RDR/ESP/ORB_019600_019699/ESP_019698_1750/ESP_019698_1750_RED.LBL` indirildi (8 145 bayt): `INCIDENCE_ANGLE = 57.493071 <DEG>`, `SUB_SOLAR_AZIMUTH = 192.527174 <DEG>`, `NORTH_AZIMUTH = 270.000000 <DEG>`. **SHA-256 `7f3abe8c34c39101f0afac769fa54066d8c577af5cc2f60477fc2d434254ecb6`** (yerel kopya `.gemini/…/scratch/ESP_019698_1750_RED.LBL` ile birebir aynı). **Önceki raporun `64a5c5ce…` değeri bu dosyayla eşleşmiyor; silindi.**
- Aritmetik yeniden hesaplandı: 90° − 57.493071° = 32.506929°; (192.527174° − 270° + 360°) mod 360° = 282.527174°.
- **Doğrulanamadı:** `SUB_SOLAR_AZIMUTH − NORTH_AZIMUTH` ile "kuzeyden saat yönü" dönüşümünün **yorumu** (görüntü-ekseni konvansiyonu) bu düzeltmede bağımsız doğrulanmadı.

### 3.4. İddia 4: Mars güneş açısal çapı (`gunes_geometri_dogrulama.md`)
- **İddia:** günberi (r = 1,3814 AU) 23,17′, günöte (1,6660 AU) 19,21′, ortalama (a = 1,52368 AU) 21,00′.
- **Durum: FORMÜLLE HESAPLANDI; Allison & McEwen (2000) tam metni OKUNMADI (ücretli makale).** Formül θ = 2·atan(R☉/d). Sabitler: AU = 149 597 870,7 km (IAU 2012), nominal R☉ = 695 700 km (IAU 2015); bu düzeltmede sabitler yeniden indirilmedi, standart değerler olarak kullanıldı. Yörünge uzaklıkları **NASA NSSDC Mars Fact Sheet**'ten (indirildi, 13 261 bayt): günberi 206,650·10⁶ km (1,38137 AU), günöte 249,261·10⁶ km (1,66621 AU), yarı büyük eksen 1,52366231 AU.
- **Sonuç:** R☉ = 695 700 km ile **23,147′ / 19,190′ / 20,985′**; R☉ = 696 342 km ile 23,168′ / 19,208′ / 21,004′. Önceki rapordaki 23,173 / 19,212 / 21,008 değerleri bu aralığın dışında kalıyor: fark ≈ 0,1% (Güneş yarıçapı seçimi); **üçüncü ondalık anlamsızdır**. Doğru ifade: günberi ≈ **23,15–23,17′**, günöte ≈ **19,19–19,21′**, ortalama ≈ **20,99–21,00′**.

### 3.5. İddia 5: REMS Sol 53 çevre ölçümleri (`rems_gercek_veri.md`)
- **İddia:** Zemin −107,5…+10,8 °C; hava −69,8…−4,7 °C; basınç 7,16…8,07 hPa (ort. 7,62); "10 753 kayıt, kalite bayrağı f=0".
- **Durum: YEREL HAM DOSYADAN YENİDEN HESAPLANDI — sayılar eşleşti; atıf edilen ürün ve SHA yanlış / yerelde yok.** Yerelde bulunan ürün `docs/data/ekip/rems/RME_402151514RMD00530000000_______PA.TAB` (PDS4 `data_calibrated`, 20 153 kayıt, **SHA-256 `8bc155f85042c314c3a9c9ecc87b12ef0a841360da9f29a41a904d9a3afce0ae`**; indirme künyesi `rems_downloads_manifest.json`: `https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00001_00089/SOL00053/…`). Yalnız `-999` yer tutucusu dışlanarak: zemin (`BRIGHTNESS_TEMP`, K→°C) **−107,53 … +10,82** (n = 18 653); hava (`AMBIENT_TEMP`) **−69,81 … −4,74**; basınç **7,16 … 8,07 hPa, ort. 7,619**. Sayılar iddiayla eşleşir.
- **Düzeltmeler / doğrulanamayanlar:** (i) Önceki raporun atıf yaptığı ürün `RMD__400615557MOD____L200530000_______P1.TAB` ve SHA `18f7004f…` yerelde **yoktur**; SHA silindi. (ii) "10 753 kayıt, f=0 filtresi" **tekrarlanamadı** (bu hesapta kalite bayrağı uygulanmadı; n = 18 653 / 20 153). (iii) Tek bir hava sensörü sütunu seçmek sonucu değiştirir (`BOOM1` maks. +5,5 °C, `BOOM2` min −148,8 °C aykırı değerler içerir); iddia `AMBIENT_TEMP` ile uyumludur.

### 3.6. İddia 6: PIA20755 zemin RGB kalibrasyonu (`varlik_manifest.md`)
- **İddia:** sRGB ort. R=103,55, G=105,64, B=107,41; lineer albedo 0,138 / 0,144 / 0,150; "1024×1024 piksel".
- **Durum: HAM DOSYA İNDİRİLDİ + sRGB ortalaması yeniden hesaplandı — sRGB eşleşti; boyut ve albedo ifadeleri DÜZELTİLDİ.** `https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia20/pia20755/PIA20755.jpg` indirildi (1 352 810 bayt, **SHA-256 `0f315fa3308b4c83bc9161ce41c4857683c4d9f7cc25fb53ac5c7d0d29cf3161`**, yerel `varlik/nasa_pia20755/PIA20755.jpg` ile aynı). **Boyut 9091×1089** (JPEG), "1024×1024" **yanlış**. Tüm piksellerin sRGB ortalaması **103,55 / 105,64 / 107,41** (eşleşir). Önceki raporun `95e0c522…` SHA'sı dosyayla eşleşmiyor; silindi.
- **"Lineer albedo" düzeltmesi:** ortalama sRGB → lineer: **0,137 / 0,143 / 0,148** (rapordaki 0,138/0,144/0,150 tam olarak tekrarlanmadı); piksel başına lineerleştirip ortalama: **0,198 / 0,217 / 0,243**. Yani değer yönteme bağlıdır ve bir JPEG'in sRGB→lineer dönüşümüdür; **kalibre edilmiş albedo değildir**. "Albedo" yerine "sRGB'den türetilmiş lineer parlaklık (kaba)" denmelidir.

---

## 4. Kaynak Defteri Girişleri (`docs/data/ekip/kaynaklar/gercek.md` biçimi) — düzeltilmiş

"Durum" sütunu bu düzeltmede gerçekte yapılan işlemi gösterir. **"TAM METİN OKUNDU" etiketi yalnız tam metni gerçekten okunan kaynak için kullanılmıştır.**

| Tarih/saat (Europe/Istanbul) | Tam atıf / belge no | URL / DOI | Ne için tarandı | Durum | Kanıt (hash / değer) | Girdiği rapor |
|---|---|---|---|---|---|---|
| 2026-11-15 ~12:05 | Baughman, A. J.; Kim, K. J.; Suri, K.; Abercromby, A. F. J. (2022). APACHE – Physical Workload Approximation. 51st ICES; NASA NTRS 20220010306. | https://ntrs.nasa.gov/citations/20220010306 ; …/api/citations/20220010306/downloads/07-13-2022%20ICES%20Presentation%20-%20APACHE%20Physical%20Workload%20Approximation-JSLWL0520074362.pdf | Yürüme hızı, deney koşulu | **HAM DOSYA İNDİRİLDİ + slayt 23 metni OKUNDU** (tam sunum metni taranmadı) | SHA-256 `63eed187ec0a9e0b92c10e5c30566fef0c311817f5bea7690404f43b1f2e9ecd`; "N=1", "1.5 mph", "Martian gravity offload" | bu rapor §2.3, §3.2 |
| 2026-11-15 ~12:07 | NASA/JPL-Caltech/Univ. of Arizona. HiRISE PDS3 etiketi ESP_019698_1750_RED.LBL | https://hirise-pds.lpl.arizona.edu/PDS/RDR/ESP/ORB_019600_019699/ESP_019698_1750/ESP_019698_1750_RED.LBL | Güneş geometrisi alanları | **HAM DOSYA İNDİRİLDİ + alanlar OKUNDU** (tam etiket taranmadı; yorum doğrulanmadı) | SHA-256 `7f3abe8c34c39101f0afac769fa54066d8c577af5cc2f60477fc2d434254ecb6` (indirilen = yerel kopya) | §3.3 |
| 2026-11-15 ~12:09 | NASA PDS Atmospheres Node. MSL REMS `data_calibrated` SOL00053 `RME_402151514RMD00530000000_______PA.TAB` | https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00001_00089/SOL00053/RME_402151514RMD00530000000_______PA.TAB | Sol 53 sıcaklık ve basınç | **YEREL HAM DOSYADAN YENİDEN HESAPLANDI** (dosya bu düzeltmede yeniden indirilmedi; indirme künyesi `rems_downloads_manifest.json`) | SHA-256 `8bc155f85042c314c3a9c9ecc87b12ef0a841360da9f29a41a904d9a3afce0ae`; zemin −107,53…+10,82 °C, hava −69,81…−4,74 °C, basınç 7,16…8,07 hPa (ort. 7,619). *Önceki rapordaki `RMD__…MOD…P1.TAB` / `18f7004f…` yerelde yok → silindi* | §3.5 |
| 2026-11-15 ~12:11 | NASA/JPL-Caltech/MSSS. PIA20755 Mastcam Sol 1221 zemin görünümü | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia20/pia20755/PIA20755.jpg | Zemin renk kalibrasyonu | **HAM DOSYA İNDİRİLDİ + sRGB ortalaması hesaplandı** | SHA-256 `0f315fa3308b4c83bc9161ce41c4857683c4d9f7cc25fb53ac5c7d0d29cf3161`; 9091×1089; sRGB 103,55/105,64/107,41. *Önceki "1024×1024" ve `95e0c522…` yanlış → silindi* | §3.6 |
| 2026-11-15 ~12:12 | Allison, M.; McEwen, M. (2000). Planet. Space Sci. 48(2–3):215–235 | https://doi.org/10.1016/S0032-0633(99)00092-6 | Mars güneş açısal çapı ve yörünge | **OKUNMADI (ücretli makale); yalnız formül + sabitler kullanıldı** | Önceki "TAM METİN OKUNDU" etiketi **kanıtsızdı, kaldırıldı** | §3.4 |
| 2026-11-15 ~12:12 | NASA GSFC NSSDC. Mars Fact Sheet | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | Günberi/günöte uzaklıkları, yarı büyük eksen, yüzey yerçekimi | **HAM SAYFA İNDİRİLDİ + ilgili satırlar OKUNDU** | 13 261 bayt; günberi 206,650·10⁶ km, günöte 249,261·10⁶ km, a = 1,52366231 AU, yüzey g (ort.) 3,73 m/s² | §2.4, §3.4 |
| 2026-11-15 ~12:13 | Allison, M.; Schmunk, R. NASA GISS Mars24 Technical Notes on Mars Solar Time | https://www.giss.nasa.gov/tools/mars24/help/notes.html | Sol süresi | **HAM SAYFA İNDİRİLDİ + ilgili cümle OKUNDU** | SHA-256 `e227b6f818051fce6648a6438d37ef3089f31a380bcfff29903a7dee240f5ad7`; "24 hours 39 minutes 35.244 seconds" | §2.4 |
| 2026-11-15 ~12:00 | Martian Map proje verisi `sim/data/rocks.json` (`C:\Users\Batu\Desktop\mm-pr\main-wt`, dal `batu/custom-mission`) | (yerel dosya) | Yüzlek/kaya sayımı | **YEREL HAM DOSYADAN YENİDEN HESAPLANDI** | 829 = 709 rock + 110 outcrop + 10 shadow; outcrop `d_m` min 2,72, medyan 4,67, p90 7,868, max 9,80. *"123 aday / 3 tek kaya" doğrulanmadı* | §3.1 |
