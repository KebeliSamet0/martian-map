DURUM: TAMAMLANDI (tur 3) — T12 (Kendi rotanı planla) ve T13 (dinamik rota) eklendi, 14 grubun hepsi güncel kodda **gerçek GPU** ile koşuldu. **1 bulgu teşhis edilemedi (B15)**; ayrıntı [`bulgular.md`](bulgular.md).
Sürüm: test edilen sim `main-wt` dal `batu/custom-mission` @ `d460385` (koşu sırasında #125 numune/üsse dönüş ve #130 birleşti; dal başkasının elinde değişebilir).

## Tur 3 — güncel sonuç (gerçek GPU, 2026-11-15)

Koşu komutu: `REAL_GPU=1 node akis_testi.js` (tam, 831 sn) + test beklentileri güncellendikten sonra `REAL_GPU=1 MM_ONLY=T8,T13 node akis_testi.js` (213 sn). Birleşik sonuç: `test_sonucu.json` (`birlestirme`, `ozet` alanları); ham günlükler: `tam_real_gpu.log`, `t8_t13_real_gpu.log`.
**Yazılım GL ile tam koşu (~14 dk/koşu) yalnız tur 1–2'de (eski sim sürümü) iki kez yapıldı; tur 3'te süre ve bellek nedeniyle gerçek GPU kullanıldı.** Önceki sonuçlar aşağıda korunmuştur.

| # | Test | Sonuç | Kanıt (günlük, ekran görüntüsü) | Neden kalan test (uygulama / test) |
|---|---|---|---|---|
| ON | Ön koşullar (API gerçek ızgara, `/compare`) | **PASS 4/4** | `tam_real_gpu.log` | — |
| T1 | S1/S2/S3 tam akış | **FAIL 28/32** | `tam_real_gpu.log`; [S2 sonu](shots/S2_5_karne.png) | **B15** (açık): S2'de kum olayı tetiklenmedi, hedefte numune çubuğu/karne gelmedi; S1, S3 PASS. Uygulama mı test mi **ayırt edilemedi** |
| T2 | L taraması (lejant Dikkat + Geçilmez) | **PASS 3/3** | [scan_lines](shots/scan_lines.png) | — |
| T3 | Kum olayı `radius_m+40` | **FAIL 6/7** | S2 satırı (B15) | S1 ve S3 PASS |
| T4 | `mission:arrived` | **FAIL 2/3** | S2 satırı (B15) | S1 ve S3 PASS |
| T5 | HUD satırları | **PASS 2/2** | [hud](shots/hud.png) | — |
| T6 | Konsolda hata yok | **FAIL** (39 hata) | `tam_real_gpu.log`, [T6 konsol](shots/T6_konsol.png) | **B13** (uygulama): her numune/yük değişiminde `POST /route` 422 |
| T7 | `?perf=1` | **FAIL 4/5** | `tam_real_gpu.log`; [perf](shots/perf.png) | AMD Radeon iGPU: ort 39,1 FPS, p95 28,4 ms (hedef ≥45 / ≤22). Gerçek ölçüm, bu makinenin sınırı |
| T8 | Normal oyun girişi (dev yok), karne, "Tekrar oyna"/"Başka görev", E ile numune + üsse dönüş | **PASS 40/40** (güncellenmiş beklentilerle) | `t8_t13_real_gpu.log`; [Tekrar oyna](shots/T8_tekrar_oyna.png), [Başka görev](shots/T8_baska_gorev.png), [karne 1280×720](shots/T11_1280x720_6_karne.png) | 1280×720'de karne düğmeleri artık **705 px ≤ 720** (B1 düzelmiş) |
| T9 | Gerçek klavye (WASD, Shift, R, T, H, L, ?, M) | **PASS 14/14** | `tam_real_gpu.log`; [yürüme](shots/T9_yurume.png), [T tuşu](shots/T9_t_tusu.png), [tarama](shots/T9_tarama.png) | — |
| T10 | TR/EN metin | **FAIL 13/15** | `t8_t13_real_gpu.log`; [EN yürüyüş](shots/T11_1920x1080_5_yuruyus.png), [EN karne](shots/T11_1920x1080_6_karne.png) | **B3–B5** (uygulama): EN modda Türkçe kalıntılar |
| T11 | Yerleşim 1280×720 + 1920×1080 | **FAIL 13/14** | `t8_t13_real_gpu.log`; [tarama örtüşmesi](shots/T11_1280x720_5b_yuruyus_tarama.png) | **B14** (uygulama): `.mm-mhud` × `#scanleg` 87×29 px |
| T12 | Kendi rotanı planla (#120) | **FAIL 114/119** | `tam_real_gpu.log`; [harita](shots/T12_harita.png), [uyarı](shots/T12_uyari.png), [süre](shots/T12_secim_eta.png), [URL brifing](shots/T12_url_brifing.png), [80 L brifing](shots/T12_o2_brifing.png), [80 L rotalar](shots/T12_o2_rotalar.png), [karne](shots/T12_karne.png) | 5 kalan: **B15** (P1: kum+replan başarılı, ama hedefte karne yok; P2 onun zincirleme istisnası) ve **B13** (AB01, AB03: kümülatif 422 sayacı `/route`). Diğer tüm çiftler/testler PASS |
| T13 | Dinamik rota (#122) | **FAIL 17/18** | `t8_t13_real_gpu.log`; [öneri bandı](shots/T13_oneri_bant.png), [ikinci öneri](shots/T13_ikinci_oneri.png), [kabul](shots/T13_kabul.png), [gözlem](shots/T13_gozlem.png) | Yalnız **B13**: yük değişimi önerisi hiç gelmiyor (`/route` `load_kg` → 422). Sapma, soğuma, kabul, kamera gözlemi **PASS** |

### T12 / T13 ayrıntısı
- **T12 çiftleri:** `ab_ciftleri_gorevli.json` — 5 kendi çiftim (gerçek ızgarada `slope.bin` < 25°, kuş uçuşu 150–1000 m, 2 kumlu P1–P2 + 3 kumsuz P3–P5; her biri API `/route` ve `sand_zones.json` ile bağımsız doğrulandı) **+ çalışan 2'nin `ab_ciftleri.json`'undan** 2 kumlu (AB01, AB03) + 2 kumsuz (AB09, AB10) çapraz doğrulama ve 3 geçilmez nokta. **Toplam 9 çift tarayıcıda baştan sona oynandı** (harita → rota → yürüyüş → hedef → karne): P3, P4, P5, AB01, AB03, AB09, AB10 tamamlandı; P1 ve P2 B15 yüzünden tamamlanamadı.
- **T12b:** 6 geçilmez nokta (3 kendi + 3 çalışan 2'den): uyarı metnindeki "X m" ve eğim bağımsız hesapla birebir; hesapla düğmesi kapalı; "çok kısa" uyarısı; geçilebilir çift uyarısız.
- **T12c:** kum olayı **yalnız** kum adayı `radius_m+40` m yakınında (P1, P2, AB01, AB03 `selected.sand` dolu ve tetikler; P3–P5, AB09, AB10 `sand=null`, rota boyunca olay **yok**). Replan başarılı; toast'ta "başarısız/failed" yok; `/replan` ve `/step` 422 yok (B10 düzeltmesi doğrulandı).
- **T12d:** `?a=&b=` ve `&o2=80` bağlantıları doğrudan brifing; geçersiz bağlantı → normal intro; paylaşım düğmesi aynı URL (virgül kodu çözülünce); `%2C` kozmetiği (B12) düzeltilmiş.
- **T12e:** 80 L düğmesi bütçeyi 80 L yapar; brifing ve 3 rota kartı; URL'de `&o2=80`.
- **T13:** sapma (`P += 45 m` uygun yöne): `mm:route-suggest` `deviation` ≤ 40 sn, `delta.m` ve `delta.kcal` sayı, bant + `dyn-accept`/`dyn-dismiss`; "Vazgeç" kararı; geri dönünce ve 45 sn soğumada ikinci öneri **yok**; soğuma bitince ikinci öneri gelir (aralık ≥ 40 sn; uygulama soğumayı hesaplama başlangıcından sayar); "Kabul" → yeni `routeRun` (`replanned`, uzunluk > 0); kask kamerası `mm:camera-insight` → `observation` önerisi + kabul. Yük (`load`) → **B13**.
- **Mars/Dünya kuralı:** T12a canlı süre beklentisi uygulamanın 0,67056 m/s sabitini (NASA APACHE benchmark, Dünya'da ölçülmüş giysili yürüyüş; **Mars değeri değil**) yineler; yalnız metin tutarlılığını sınar. T13 süreleri duvar saatidir.

### Tekrarlanabilirlik / kararlılık (dürüst)
- Tur 1–2 (T1–T11, yazılım GL, eski sim sürümü): T1–T7 iki ardışık koşuda kararlı PASS (`test_sonucu_kosu1/2.json`).
- Tur 3 (gerçek GPU): tam suit **tek** koşu; B15 aynı pair/senaryoda 4/4 tekrarlandı (kararlı hata); diğer sonuçlar tek koşuya dayanır.
- Tanı kayıtları: `tani_kayitlari/` (P1 teşhis günlükleri, ilk yazılım GL T12 denemesi: API yükü yüzünden 8 sn zaman aşımı).



# Martian Map — otomatik kabul testi (`akis_testi.js`)

Tek komutla çalışan uçtan uca test paketi. Elle test yerine; Samet'in laptopunda kabul testi için.
Yazan: gorevli · koşu tarihi: 2026-11-15 · sim kökü: `mm-pr/main-wt` (dal `batu/sim-tiles-secici`, 0b53eb3).
Kaynak kaydı: [`../kaynaklar/gorevli.md`](../kaynaklar/gorevli.md)

## Tek komut

```bash
cd martian-map-main/docs/data/ekip/gorevli
node akis_testi.js
```

Betik sim'i kendisi başlatır (`127.0.0.1:8010`, repo kökünü statik servis eder), API'yi (`127.0.0.1:8000`) kontrol eder, headless Chrome ile 7 test grubunu koşar, `test_sonucu.json` yazar ve özet tablo basar. Çıkış kodu: hepsi PASS ise 0.

İki kez üst üste: `MM_RUNS=2 node akis_testi.js` (ayrı süreçlerde; kararlılık `test_sonucu.json → kararlilik` alanına yazılır).

### Önkoşullar
- Node 18+ ve `playwright-core` (betik şu sırayla arar: `PW_CORE`, `require('playwright-core')`, `<repo>/sim/node_modules/playwright-core`).
- Google Chrome (yol: `CHROME_PATH`; vars. Windows `C:/Program Files/Google/Chrome/Application/chrome.exe`, macOS `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`).
- API çalışıyor olmalı ve **gerçek Gale verisiyle** başlatılmış olmalı (aşağıda "API nasıl başlatılır"). Betik bunu ön koşul olarak denetler.
- Repo kökü: `MM_REPO_ROOT` (vars: `C:/Users/Batu/Desktop/mm-pr/main-wt`, yoksa betiğin üstündeki ilk `sim/index.html` olan klasör). Python gerekmez.

### Ortam değişkenleri
| Değişken | Anlamı |
|---|---|
| `CHROME_PATH` | Chrome yolu |
| `PW_CORE` | playwright-core yolu |
| `REAL_GPU=1` | swiftshader bayraklarını kapatır, gerçek GPU kullanır; `?perf=1` sonucu (ort FPS, p95 ms…) `test_sonucu.json → perf` alanına yazılır ve **eşik assert edilir** (p95 ≤ 22 ms, ort ≥ 45 FPS; probun kendi eşikleri) |
| `HEADED=1` | pencereli Chrome |
| `MM_API` | API tabanı (vars. `http://127.0.0.1:8000`; farklıysa sim'e `?api=` ile iletilir) |
| `MM_PORT` | sim portu (8010) |
| `MM_RUNS=N` | N kez koş, kararlılığı raporla |
| `MM_ONLY=T7` | yalnız seçilen grupları koş (hızlı deneme) |
| `MM_SCENARIOS` | `S1,S2,S3` alt kümesi |
| `MM_SHOTS=0` | ekran görüntüsü alma |
| `MM_RESULT_FILE` | sonuç dosya adı |

### macOS (Samet, M5, Chrome) — NOT: macOS'ta denenmedi
```bash
cd martian-map-main/docs/data/ekip/gorevli
npm i --no-save playwright-core            # ya da PW_CORE=/yol/playwright-core
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export MM_REPO_ROOT="$HOME/martian-map"     # içinde sim/index.html olan klasör
MM_API=http://127.0.0.1:8000 REAL_GPU=1 node akis_testi.js
```
`REAL_GPU=1` olmadan yazılım GL kullanılır ve **bir koşu ~14 dk** sürer; gerçek GPU'da ~2 dk.

### API nasıl başlatılır (gerçek veriyle)
```bash
cd <repo kökü>                      # ör. mm-pr/main-wt
MARTIAN_LAYERS_DIR=<repo kökü> python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```
`MARTIAN_LAYERS_DIR` verilmezse API **sessizce sentetik 250×250 / 8 m ızgara** sunar (`api/planner/layers.py: load()` → `synthetic()`); görev piksel koordinatları (ör. S1 433,525 → 491,774) bu ızgaranın dışında kalır ve görev seçimi "B noktası arazi dışında" hatasıyla başarısız olur. Test bunu `[ON]` bölümünde yakalar (`/grid`: `synthetic=false`, 1000×1000, 2 m).

## Test grupları ve sonuç (2026-11-15)

Yazılım GL (swiftshader), API `127.0.0.1:8011` (8000 ile aynı kod, doğru `MARTIAN_LAYERS_DIR`), **iki ardışık tam koşu: ikisi de PASS, sonuç KARARLI** (`MM_RUNS=2`; 870 sn ve 857 sn). Ayrıntı: `test_sonucu.json` (+ `test_sonucu_kosu1.json`, `test_sonucu_kosu2.json`).

| # | Test | Assert'ler | Sonuç (2 koşu) | Ekran görüntüsü |
|---|---|---|---|---|
| ON | Ön koşullar | API `/assumptions` 200; `/grid` gerçek (synthetic=false, 1000×1000, 2 m); `POST /compare` var (404 değil); sim sunucusu | PASS 4/4 | — |
| T1 | S1, S2, S3 tam akış | her senaryoda: brifing açılır · 3 rota kartı · 3 rota `source=api*` · en güvenli seçilir (`kind=safest`) · 3B yürüyüş (total>0, durum=walking) · kum olayı · replan · hedefte durur (`paused`) · karne açılır · karne içeriği boş değil | PASS 30/30 | [S1 brifing](shots/S1_1_brifing.png) · [S1 rotalar](shots/S1_2_rotalar.png) · [S1 yürüyüş](shots/S1_3_yuruyus.png) · [S2 brifing](shots/S2_1_brifing.png) · [S2 rotalar](shots/S2_2_rotalar.png) · [S2 yürüyüş](shots/S2_3_yuruyus.png) · [S3 brifing](shots/S3_1_brifing.png) · [S3 rotalar](shots/S3_2_rotalar.png) · [S3 yürüyüş](shots/S3_3_yuruyus.png) |
| T2 | L taraması | `#scanleg` görünür; metinde "Dikkat" ve "Geçilmez" | PASS 3/3 | [scan_lines](shots/scan_lines.png) |
| T3 | Kum olayı `radius_m+40` m | olay mission machine'den gelir; `trigger_m == radius_m+40`; oyuncu eşikten −8…+2 m içinde, kum dairesine girmeden | PASS 9/9 (S1 58,9 m / eşik 59,4; S2 59,9 / 60; S3 57,9 / 59,4) | [S1](shots/T3_kum_olayi_S1.png) · [S2](shots/T3_kum_olayi_S2.png) · [S3](shots/T3_kum_olayi_S3.png) · [replan S1](shots/S1_4_kum_replan.png) |
| T4 | `mission:arrived` window olayı | her senaryoda olay en az 1 kez gelir (`detail.state="debrief"`) | PASS 3/3 | [S1 karne](shots/S1_5_karne.png) · [S2](shots/S2_5_karne.png) · [S3](shots/S3_5_karne.png) |
| T5 | HUD satırları | `#hud` metninde "Zemin (model)" ve "Gale ortam (REMS)" | PASS 2/2 | [hud](shots/hud.png) |
| T6 | Konsolda hata yok | tüm sayfalarda `error`/`pageerror` = 0. Hariç tutma kuralı vardı (`ERR_FAILED` ve `tiles_fixed` 404), son koşularda **hiçbir kayıt hariç tutulmadı** | PASS 1/1 | [T6 konsol](shots/T6_konsol.png) |
| T7 | `?perf=1` probu | prob açılır; 30 sn senaryo bitip rapor penceresi açılır; `[PerfProbe HATA]` yok; rapor okunur (ort FPS, p95 ms) | PASS 4/4 (yazılım GL: ort 0,82 FPS, p95 ≈ 2000 ms — **GPU performansı değildir**) | [perf](shots/perf.png) |

### Tur 2 — normal oyun girişi (`?dev=1` YOK), yazılım GL, 1 koşu (1549 sn)
Koşu: `MM_ONLY=T8,T9,T10,T11 node akis_testi.js` → `test_sonucu_tur2_T8-T11.json`, günlük `tur2_kosu.log`. **API 8000** (gerçek ızgara, `/compare` var). Test edilen sim: `main-wt` çalışırken değişti (bkz. `bulgular.md → Kod durumu`).

| # | Test | Assert'ler | Sonuç | Ekran görüntüsü |
|---|---|---|---|---|
| T8 | Normal oyun girişi | intro (body.dev yok, dev panelleri gizli) · görev seç → 3 kart · dil anahtarı TR↔EN · Geri · S1 brifing · 3 rota kartı · rotalar canlı API'den ve çevrimdışı rozeti yok · yürüyüş HUD (görev paneli, hedef mesafesi, vitals) · kum+replan · karne (harf, tablo, 2 düğme) · **karne düğmeleri kaydırmadan görünür** · "Tekrar oyna" (yürüyüş baştan, karne kapanır) · Esc duraklat menüsü + Devam · ikinci varış · "Başka görev" (seçime döner, HUD gizli, makine temiz) · karne sonrası S2 brifingi · "Görevlere dön" | **FAIL 39/40** (yalnız B1: 1280×720'de karne düğmeleri 840 px > 720 px) | [intro](shots/T11_1280x720_1_intro.png) · [seçim](shots/T11_1280x720_2_gorev_secimi.png) · [brifing](shots/T11_1280x720_3_brifing.png) · [rotalar](shots/T11_1280x720_4_rotalar.png) · [yürüyüş](shots/T11_1280x720_5_yuruyus.png) · [karne](shots/T11_1280x720_6_karne.png) · [Tekrar oyna](shots/T8_tekrar_oyna.png) · [Başka görev](shots/T8_baska_gorev.png) |
| T9 | Gerçek klavye (Playwright `keyboard`) | W (otomatik yürüyüşten devralır, ileri) · S (geri) · D (sağ) · A (sol) · Shift+W (koşu) · R (rotaya dön) · T (astronot görünürlüğü) · H · L (lejant Dikkat+Geçilmez) · ? (yardım, vaat edilen tuşlar listede) · M (normal oyunda yok; `?dev=1`'de haritaya döner) | **PASS 14/14** | [yürüme](shots/T9_yurume.png) · [T](shots/T9_t_tusu.png) · [L](shots/T9_tarama.png) · [M dev](shots/T9_m_dev.png) |
| T10 | TR/EN metin | her ekranda boş anahtar (`hud.xxx`), `{yer tutucu}`, `undefined/NaN`, ham teknik hata metni, boş düğme yok; **EN modda Türkçe karakter/kalıntı yok**; statik: `texts.json` 137+ anahtarın hepsinde tr+en dolu, kodda `t('…')` ile çağrılan her anahtar mevcut, zorluk etiketleri tanımlı | **FAIL 16/19** (B3, B4, B5: EN modda Türkçe kalıntılar) | [EN seçim](shots/T10_en_gorev_secimi.png) · [EN rotalar](shots/T11_1920x1080_4_rotalar.png) · [EN yürüyüş](shots/T11_1920x1080_5_yuruyus.png) · [EN karne](shots/T11_1920x1080_6_karne.png) |
| T11 | Yerleşim | 1280×720 ve 1920×1080 × (intro, seçim, brifing, rotalar, yürüyüş, yürüyüş+tarama, karne, duraklat): viewport dışına taşma, yatay kaydırma, metin kırpılması, HUD kutuları arasında bounding-box örtüşmesi | **PASS 14/14** (0 örtüşme/taşma) | [1280 duraklat](shots/T11_1280x720_7_duraklat.png) · [1920 intro](shots/T11_1920x1080_1_intro.png) · [1920 karne](shots/T11_1920x1080_6_karne.png) |

**T8/T10 FAIL kanıtı = uygulama hatası, test hatası değil:** B1 ölçülmüş sayılarla (`bottoms:[840,840]`, `vh:720`) ve ekran görüntüsüyle; B3–B5 hem kaynak satırlarıyla (`api/planner/params.py:62-69`, `sim/app/wire-extras.js:7`, `sim/data/texts.json:1198-1201`) hem ekran görüntüsüyle doğrulandı. Test hataları (örn. ilk denemede hedef mesafesi HUD'unun yazılım GL'de geç dolması) ayrı düzeltildi (40 sn'ye kadar bekleme).

### Gerçek GPU (`REAL_GPU=1`) — tek koşu, AMD Radeon(TM) Graphics (iGPU, D3D11)
`test_sonucu_real_gpu_tek_kosu.json`: tüm testler PASS, süre **132 sn**; yalnız T7'nin GPU eşiği **FAIL**: ort **41,49 FPS** (hedef ≥ 45), p95 **27,9 ms** (hedef ≤ 22), 1000×600. Bu gerçek bir ölçümdür ve eşik, probun kendi varsayım eşiğidir (`perf_probe.js: THRESHOLDS`). Samet'in M5'inde sonuç farklı olabilir; kendi makinesinde `REAL_GPU=1` ile koşmalı. Bu koşu için ekran görüntüsü alınmadı (`MM_SHOTS=0`).

## Kök neden notları (test hatası / uygulama hatası)
| Bulgu | Tür | Kanıt / çözüm |
|---|---|---|
| Görev düğmeleri yalnız `?dev=1`'de görünür (`body:not(.dev) #mapwrap {display:none}`), eski betikler bunu bilmiyordu | test hatası | test `?dev=1` ile açılır |
| Brifing düğmesi artık "Rotaları hesapla" (`data-testid="briefing-start"`), "Başla" değil | test hatası | seçici `data-testid` oldu |
| `python -m http.server` yazılım GL'de paralel karo isteklerinde `ERR_CONNECTION_REFUSED` verdi | test altyapısı | betik içi Node statik sunucu (backlog 1024); `MM_PYTHON=1` ile python'a dönülür |
| T3 S3 ilk koşuda mesafe 9,2 m (eşik 59,4) | **test hatası** | ölçüm "olayı fark ettiğin an"dı: betik oyuncuyu kare beklemeden 5 m'lik adımlarla atlatıyordu, yazılım GL ~1 FPS olduğu için olay raporlanana kadar 20–50 m ilerlemişti. Çözüm: eşiğe yakınken 3 m adım + her adımda 2 kare bekleme, alt sınır assert'i |
| T6 ilk koşuda `/compare` 404 | **uygulama değil, ortam** | 8000'deki API eski sürümdü (`/compare` yok); güncel `main` API'sinde var |
| Yeniden başlatılan 8000 API'sinde S1–S3 "arazi dışında" | **ortam/konfigürasyon hatası** | API `MARTIAN_LAYERS_DIR` olmadan başlatılmış → `/grid` `synthetic=true, 250×250, 8 m` |

## Açık notlar (dürüst sınırlar)
1. **8000 API düzeltildi** (tur 2 başında `MARTIAN_LAYERS_DIR` ile yeniden başlatıldı; `[ON]` kontrolleri PASS). T1–T7 koşuları API 8011 üzerinde yapılmıştı (aynı kod, doğru ortam); T8–T11 8000 üzerinde. **Tam 11 gruplu tek koşu yapılmadı**: `test_sonucu.json` iki ayrı koşunun birleşimidir (`birlestirme` alanı).
2. Gerçek-GPU modu için **ikinci (ardışık) koşu yapılamadı**: sistem belleği kritik düştüğü için arka plan görevi durduruldu; bu yüzden gerçek-GPU kararlılığı ölçülmedi (yalnız tek koşu var). Tekrar başlatmadım.
3. T1–T7 `?dev=1` arayüzünü sürer; **normal oyun girişi tur 2'de T8–T11 ile kapsandı**. 3B yürüyüş T1/T8'de rota konumu doğrudan ilerletilerek (`setProgress`) sürülür (karne süre/doz 0 çıkar: beklenen); gerçek tuşla yürüme yalnız T9'da kısa süreli denenir.
4. macOS ve Samet'in laptopu denenmedi; yalnız Windows 11 + Chrome 157 + yazılım GL ve AMD iGPU üzerinde koşuldu. macOS notları: T9 fiziksel tuş kodu (`KeyW`…) gönderir, Cmd gerekmez; yardım için `?` karakteri basılır (ABD klavye düzeni varsayımı); headless'ta pointer lock kullanılmaz.
5. Yazılım GL koşusunda perf değerleri anlamsızdır (~0,8 FPS); T7 yalnız probun açılıp bitmesini ve hatasız olmasını doğrular. Gerçek perf kararı için `REAL_GPU=1`.
6. 3B yürüyüş rota konumunu doğrudan ilerleterek (`routeRun.s`) sürülür; gerçek klavye/fare yürüyüşü test edilmez. Kum olayı tetik mesafesi bu yüzden "kare başına" ölçümle ±3 m adım hassasiyetindedir.
7. Mars/Dünya değerleri: pakette sol süresi, yerçekimi (g=3,71), doz, hız veya süre BİRİMİ için sayısal beklenti **yoktur**. Betikteki süreler duvar saatidir (bekleme/zaman aşımı). Sim'in gösterdiği süre/enerji değerleri ("18 dk", "87 kcal"…) yalnız log'a düşer, assert edilmez.

## Sorun giderme
- **`[ON] /grid synthetic` FAIL** → API `MARTIAN_LAYERS_DIR` olmadan çalışıyor; yukarıdaki "API nasıl başlatılır".
- **`[ON] /compare` FAIL** → API eski sürüm; güncel `main`'den yeniden başlat.
- **API hiç yok (`/assumptions` 000)** → API'yi başlat; farklı port kullanıyorsan `MM_API=http://127.0.0.1:PORT`.
- **Port 8010 dolu** → betik 8010'da zaten sim varsa onu yeniden kullanır; başka program tutuyorsa `MM_PORT=8020`.
- **Chrome bulunamadı** → `CHROME_PATH=...` ver.
- **`Cannot find module 'playwright-core'`** → `PW_CORE=/yol/playwright-core` ya da `npm i --no-save playwright-core`.
- **T1'de "page.click: Timeout"** → görev düğmeleri görünmüyordur: sim `?dev=1` olmadan açılmıştır ya da API yanlış ızgara sunuyordur (bkz. ilk madde).
- **Yazılım GL yavaş/zaman aşımı** → normal; koşu ~14 dk. `MM_ONLY=T2,T5` ile parça parça koş.
- **Bellek azsa** → aynı anda başka ağır uygulama açma; yazılım GL koşusu birkaç Chrome süreci tutar.

## Dosyalar
| Dosya | İçerik |
|---|---|
| `akis_testi.js` | test paketi |
| `test_sonucu.json` | `MM_RUNS=2` yazılım GL koşusunun nihai sonucu (+ `kararlilik`, `ekran_goruntuleri`, `ortam`, `perf`) |
| `test_sonucu_kosu1.json`, `test_sonucu_kosu2.json` | tek tek koşular |
| `test_sonucu_real_gpu_tek_kosu.json` | `REAL_GPU=1` tek koşu (T7 eşik FAIL, diğerleri PASS) |
| `shots/` | ekran görüntüleri (yukarıdaki tablodan bağlantılı) |
| `bulgular.md` | gerçek uygulama bulguları (adım / beklenen / görülen / önem / kanıt / sahip) |
| `test_sonucu_tur2_T8-T11.json`, `tur2_kosu.log` | tur 2 (T8–T11) ham sonuç ve günlük |
