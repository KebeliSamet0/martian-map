# Kaynak kaydı — gorevli (2026-11-15)

İş: otomatik kabul testi (`docs/data/ekip/gorevli/akis_testi.js`). Saatler yerel (TR), 2026-11-15.
Durum: OKUNDU = dosya içeriği açıldı; KISMEN = yalnız ilgili satırlar/grep; OKUNAMADI-neden.
Yol kısaltmaları: `E2E` = `C:\Users\Batu\Desktop\mm-audit\e2e`, `WT` = `C:\Users\Batu\Desktop\mm-pr\main-wt` (repo kökü, dal `batu/sim-tiles-secici`).

## Kod ve betikler

| Tarih/saat | Dosya / URL | Ne için bakıldı | Durum | Teslimde nerede kullanıldı |
|---|---|---|---|---|
| 11-15 ~08:40 | `E2E/akis.js` | S1–S3 akışı (görev → brifing → 3 rota → en güvenli → 3B → kum → replan → karne) | OKUNDU | `akis_testi.js` `runScenario` (T1/T3/T4) |
| 11-15 ~08:40 | `E2E/scan_lines.js` | L taraması, `#scanleg` lejantı, kum bölgesi merkezi (3210, 4782) | OKUNDU | `runScan` (T2), `SAND_XZ` |
| 11-15 ~08:40 | `E2E/env_row.js`, `E2E/zemin_row.js` | HUD satırları (`#hud .r`) | OKUNDU | `runHud` (T5) |
| 11-15 ~08:40 | `E2E/probe.js`, `E2E/accept.js`, `E2E/arrive.js` | perf probu açma, kum tetik mesafesi ve varış olayı örnekleri | OKUNDU | `runPerf` (T7), T3/T4 dinleyicileri |
| 11-15 ~08:45 | `WT/sim/app/mission.js` (dal `batu/sim-tiles-secici`, 2771b7e→0b53eb3) | `trigger_m ?? radius_m` kuralı, `update()` segment mesafesi, `arrived` olayı | OKUNDU | T3 assert'i (`trigger_m = radius_m + 40`, alt/üst sınır) |
| 11-15 ~08:45 | `WT/sim/app/wire-adapters.js` | `trigger_m: radius_m + 40` tanımının yeri | KISMEN (grep, ilgili satır) | T3 gerekçesi |
| 11-15 ~08:45 | `WT/sim/app/wire.js` | `selectMission`, `pickRoute`, `start`, `finish`, `mission:arrived` olayı | OKUNDU | T1/T4 adımları, `?api=` ve `busy` davranışı |
| 11-15 ~08:50 | `WT/sim/app/screens.js` | brifing düğmesi `data-testid="briefing-start"`, `.mm-route`, `route-pick` | KISMEN | akış seçicileri (T1) |
| 11-15 ~08:50 | `WT/sim/app/main.js` (satır 28–32, 475–512; diff 2771b7e..0b53eb3) | `?dev=1` kapısı, HUD'daki "Zemin (model)" ve "Gale ortam (REMS)" satırları, lejant `scanleg`, `?perf=1` yükleyici, karo hata kartı | KISMEN | `?dev=1` kullanımı, T2/T5/T7 beklentileri |
| 11-15 ~08:50 | `WT/sim/index.html` | `body:not(.dev)` kuralı (görev düğmeleri yalnız `?dev=1`'de görünür) | KISMEN | ilk T1 hatasının kök nedeni (README) |
| 11-15 ~08:50 | `WT/sim/tools/qa/perf_probe.js` | probun bitişi (`#perf-probe-overlay`), `window.__perfReport` alanları, eşikler (p95 ≤ 22 ms, ort ≥ 45 FPS) | OKUNDU | T7, `perf` alanı |
| 11-15 ~08:55 | `WT/sim/app/tiles-base.js`, `WT/sim/app/api.js` | `tiles_fixed` yedeği, `?api=` parametresi | KISMEN | T6 gerekçesi, `MM_API` → `&api=` |
| 11-15 ~09:00 | `WT/sim/app/insight.js`, `WT/sim/app/compare.js` | `/compare` ve `/layers/terrain_u8.bin` bağımlılığı | KISMEN (grep) | T6 `/compare` 404 teşhisi |
| 11-15 ~09:00 | `WT/api/main.py` | uç noktalar (`/compare` var, `/missions` yok) | KISMEN (grep) | ön koşul kontrolü |
| 11-15 ~09:10 | `WT/api/planner/layers.py` (satır 14–24, 255–300) | `MARTIAN_LAYERS_DIR` yoksa `synthetic()` döner | OKUNDU | ön koşul: `/grid` `synthetic=false`; README sorun giderme |
| 11-15 ~09:10 | `WT/api/planner/cost.py` | `MARTIAN_ROCK_BLOCK` bayrağı | KISMEN (grep) | kullanılmadı (bilgi) |
| 11-15 ~09:10 | `WT/contracts/grid.json` | gerçek ızgara: 1000×1000, 2 m | OKUNDU (ilk 700 bayt) | ön koşul beklentisi |
| 11-15 ~09:05 | `WT/sim/data/missions.json` | S1 başlangıç/hedef pikselleri (433,525 → 491,774), kum `radius_m` 19.4 | KISMEN | "arazi dışında" teşhisi |
| 11-15 ~09:05 | `WT` `git log`, `git status`, `git diff HEAD~3 --stat` | dalın sırasında değiştiği (2771b7e → 85c102a → 0b53eb3) | OKUNDU | README "bilinen sınırlar" |
| 11-15 ~09:10 | `C:\Users\Batu\Desktop\mm-pr\api.log`, `api3.err` (son satırlar) | API süreç günlüğü | KISMEN | teşhis (kullanılmadı) |

## Çalışan servisler (canlı sorgu)

| Tarih/saat | URL / süreç | Ne için bakıldı | Durum | Teslimde nerede kullanıldı |
|---|---|---|---|---|
| 11-15 ~08:35 | `http://127.0.0.1:8000/assumptions` | API ayakta mı | OKUNDU (200) | ön koşul |
| 11-15 ~09:00 | `http://127.0.0.1:8000/openapi.json`, `/missions`, `/compare`, `/layers/terrain_u8.bin` | eski API sürümünün tespiti | OKUNDU (`/compare`, `/missions`, `terrain_u8` 404) | T6 ilk koşu teşhisi |
| 11-15 ~09:10 | `http://127.0.0.1:8000/grid` (yeniden başlatılmış API) | sentetik ızgara tespiti: `synthetic=true`, 250×250, 8 m | OKUNDU | ön koşul + README sorun giderme |
| 11-15 ~09:12 | `http://127.0.0.1:8011/grid` (benim açtığım, `MARTIAN_LAYERS_DIR` ayarlı API) | düzeltmenin doğrulanması: `synthetic=false`, 1000×1000, 2 m | OKUNDU | testin koştuğu API |
| 11-15 ~08:55 | `Get-NetTCPConnection` / `Win32_Process` (8000/8001/8002 dinleyicileri) | hangi süreç hangi dizinden sunuyor | OKUNDU | teşhis |

## Okunamayan / bilerek okunmayan

| Tarih/saat | Dosya | Neden | Durum |
|---|---|---|---|
| 11-15 ~09:05 | `martian-map-main/docs/data/ekip/sunum_denetimi.md` (başka masanın teslimatı) | görevle ilgisi yok | OKUNAMADI-açılmadı (kapsam dışı) |
| 11-15 | web kaynakları | hiç web araması/URL okunmadı | — |

## Kural (A) kontrolü — Mars/Dünya değerleri

Test paketi sol, yerçekimi, doz, hız veya süre BİRİMİ için hiçbir sayısal beklenti içermez. Tüm bekleme süreleri duvar-saati (ms/sn) ve test mekaniğidir; sim içi "dk" değerlerine (ör. "18 dk" rota süresi) assert yazılmamıştır, yalnız kayıt amaçlı çıktıya düşer. Bu, README'de de belirtilir.

---

# Tur 2 (2026-11-15, ~09:20–11:05): normal oyun girişi testleri (T8–T11) ve bulgular

| Tarih/saat | Dosya / URL | Ne için bakıldı | Durum | Teslimde nerede kullanıldı |
|---|---|---|---|---|
| 11-15 ~09:20 | `WT/sim/app/wire-flow.js` | intro → görev seçimi → yürüyüş HUD'u → duraklat menüsü akışı, `data-testid`'ler, `onReport` | OKUNDU | T8 adımları |
| 11-15 ~09:20 | `WT/sim/app/screens.js` (satır 60–234) | brifing, rota seçimi, uyarı, **karne** (`buildReport`, düğmeler "Tekrar oyna"/"Başka görev") | OKUNDU | T8, B1/B2 |
| 11-15 ~09:20 | `WT/sim/app/i18n.js` | dil çözümleme (`t()`, `?lang=`, `localStorage mm.lang`) | OKUNDU | T10 |
| 11-15 ~09:22 | `WT/sim/app/main.js` (satır 230–300, 540–581) | tuş haritası (W/A/S/D, R, L, H, M, T…), `__mm` kancası, `initFlow` koşulu (`!DEV`) | KISMEN (ilgili aralıklar) | T9, B7, B8 |
| 11-15 ~09:22 | `WT/sim/data/texts.json` (ui anahtarları; satır 625–632, 1190–1202, ~994) | `report.retry`="Tekrar oyna", `report.other`="Başka görev", `unit.hm`, radyasyon paneli düz TR alanlar, çevrimdışı rozet | KISMEN (node ile anahtar listesi + ilgili satırlar) | T10, B5, B6, B9 |
| 11-15 ~09:25 | `WT/sim/ui.css` (satır 58–67, 107, 140–143, 213–216) | `.mm-card { overflow:auto; max-height }`, `.mm-card-wide`, `.mm-alert-acts` | KISMEN (grep) | B1/B2 |
| 11-15 ~09:25 | `WT/sim/app/wire-extras.js` (satır 7) | Navcam altyazısı (i18n dışı) | KISMEN (grep) | B4 |
| 11-15 ~09:25 | `WT/api/planner/params.py` (satır 62–69) | rota etiketleri "En kısa/En güvenli" (API'den) | KISMEN (grep) | B3 |
| 11-15 ~09:30 | `WT/sim/app/hud.js`, `bilim.js`, `compare.js`, `offline.js` | `setVisible` (H), "Y: ayrıntı" arama, karşılaştırma ve çevrimdışı yedek | KISMEN (grep) | B5–B9 |
| 11-15 ~10:30 | `git -C WT rev-parse/branch/log/status/merge-base` (salt okuma) | test edilen sürüm; PR #111 yerel referansta var mı | OKUNDU | `bulgular.md → Kod durumu` |
| 11-15 ~10:30 | `git -C WT log --all --grep="#111"` | PR #111 (karne düzeni) commit'i | OKUNAMADI-yerel klonda yok; `git fetch` yapılmadı (salt okuma kuralı) | B1'de "doğrulanamadı" notu |
| 11-15 ~10:35 | `POST http://127.0.0.1:8000/compare`, `/route` (boşta süre ölçümü) | B9: /compare 1,8 s, /route 0,5 s | OKUNDU | B9 |
| 11-15 ~10:50 | `shots/T11_*`, `shots/T8_*`, `shots/T10_*` (kendi ekran görüntülerim) | EN/TR kalıntıları, karne ve rota seçimi yerleşimi (gözle) | OKUNDU | `bulgular.md` |

**Kural (A) — Mars/Dünya:** T8–T11'de yine sol/g/doz/hız sayısal beklentisi yok. Karnede "Süre 0 / Doz 0.0" test sıçraması (`setProgress`) yüzündendir; bulgu sayılmadı. Yardım/HUD'daki "hh:mm", "µGy" gibi birimler yalnız metin kontrolüne girdi, değer olarak doğrulanmadı.

---

# Tur 3 (2026-11-15, ~11:10–13:00): T12 "Kendi rotanı planla" (#120), T13 dinamik rota (#122), güncel kodda yeniden koşu

| Tarih/saat | Dosya / URL | Ne için bakıldı | Durum | Teslimde nerede kullanıldı |
|---|---|---|---|---|
| 11-15 ~11:15 | `WT/sim/app/custommission.js` (91 sat.) | A/B ayrıştırma, `IMPASSABLE_DEG=25`, `nearestPassable`, `sandForRoute`, `SUIT_SPEED_MS=0.67056` (APACHE), `shareQuery` | OKUNDU | T12 beklentileri (uyarı metni, ETA, kum kuralı, paylaşım) |
| 11-15 ~11:15 | `WT/sim/app/mappicker.js` (180 sat.) | `data-testid`'ler, `window.__mm.picker`, uyarı/ETA/paylaşım davranışı | OKUNDU | T12 |
| 11-15 ~11:16 | `WT/sim/app/wire-flow.js` (özel kart), `wire.js` (satır 108, 113, 127–160) | kart `mission-custom`, kum olayı `selected.sand`, `onArrived` (E ile numune → üsse dönüş), `finish` | KISMEN (ilgili aralıklar) | T12, `finishMission()`, B10, B15 |
| 11-15 ~11:20 | `WT/sim/data/sand_zones.json` | 16 kum adayı; 15'inin `px`'i ondalıklı | OKUNDU | B10 kök neden |
| 11-15 ~11:20 | `WT/sim/data/texts.json` (`custom.*`, `mission.CUSTOM.*`) | uyarı/ETA metin şablonları (beklenen metni üretmek için) | KISMEN (node ile ilgili anahtarlar) | T12b, T12a |
| 11-15 ~11:25 | `http://127.0.0.1:8000/layers/slope.bin`, `/route`, `/replan` | bağımsız çift üretimi ve doğrulama; B10 kanıtı (`px:[454.8,405.3]` → 422); B11 süre ölçümü | OKUNDU | `ab_ciftleri_gorevli.json`, B10, B11 |
| 11-15 ~11:30 | `docs/data/ekip/ab_ciftleri.json` (çalışan 2, 17 KB: 14 çift, 10 geçilmez) | çapraz doğrulama | OKUNDU (anahtarlar, ilk kayıtlar, 4 çift + 3 geçilmez kullanıldı) | T12 ek çiftler/geçilmez noktalar |
| 11-15 ~11:40 | `WT/sim/app/dynroute.js` (131 sat.) | sapma/yük/gözlem/rezerv eşikleri, `mm:route-suggest`/`mm:route-decision`, `dyn-banner`, soğuma `COOLDOWN_S=45` | OKUNDU | T13 |
| 11-15 ~11:40 | `WT/sim/app/main.js` (satır 321–392, 444–458, 476) | dinamik rota kurulumu, `applyDyn`, `__mm.dynState`, `mm:camera-insight` dinleyicisi, otomatik yürüyüş P güncellemesi, `startReturnLeg` | KISMEN (ilgili aralıklar) | T13, B13, B15 teşhisi |
| 11-15 ~11:45 | `WT/api/main.py` (satır 52–82), `api/planner/layers.py` | `RouteInput` içinde `load_kg` yok (yalnız `StepInput`), `Input` fazla alanı reddediyor | KISMEN | **B13 kanıtı** |
| 11-15 ~11:50 | `WT/sim/app/mission.js` (`beginReturn`), `screens.js` (`showHold`) | numune/dönüş ayağı akışı | KISMEN | `finishMission()` |
| 11-15 ~12:00 | `git -C WT log/rev-parse/status` (salt okuma) | sürüm ve yerel değişiklik tespiti | OKUNDU | README "Sürüm" satırı, `bulgular.md` |
| 11-15 ~13:00 | kendi ekran görüntülerim `shots/S2_5_karne.png`, `T11_1280x720_5b_yuruyus_tarama.png` | B14/B15 gözlemi | OKUNDU | `bulgular.md` |

**Kural (A) — Mars/Dünya:** T12a'daki "tahmini süre" beklentisi uygulamanın `0,67056 m/s` sabitini kullanır (NASA APACHE benchmark: Dünya'da ölçülmüş giysili yürüyüş hızı). Bu bir **Dünya ölçümü**dür, Mars değeri değildir; test yalnız uygulamanın kendi formülüyle tutarlılığını sınar, değeri doğrulamaz. T13'teki süreler (≤ 40 sn, 45 sn soğuma) duvar saati. `sol`/g/doz/hız için başka sayısal beklenti yok.

**Okunamayan:** yok. (Yerel klonda olmayan PR #111 commit'i tur 2'de "OKUNAMADI" olarak not edildi; `git fetch` yapılmadı.)

---

# Tur 4 (2026-11-15, ~12:00–12:25): `capraz_denetim_tur5.md` düzeltmesi

| Tarih/saat | Dosya / URL | Ne için bakıldı | Durum | Teslimde nerede kullanıldı |
|---|---|---|---|---|
| 12:00 | `docs/data/ekip/capraz_denetim_tur5.md` (düzeltilen rapor) | düzeltilecek iddialar | OKUNDU (tamamı) | yerinde güncellendi |
| 12:02 | `WT/sim/app/custommission.js` (satır 44–56, 70–85) | `sandForRoute` `px.map(Math.floor)`, `nearestPassable` | OKUNDU | Bulgu 1 (KAPANDI), Bulgu 3 |
| 12:03 | `WT/sim/data/texts.json` (`custom.warn.steep*`) | gerçek anahtar adları; `ui.custom.slope.warning` yok (`grep` boş) | OKUNDU | Bulgu 3 |
| 12:04 | `WT/api/planner/route.py` (20–50, 493), `params.py` (31–41, 61–72, 177), `cost.py` (18–112), `layers.py` (231–252), `main.py` (52–82, 119) | snap yarıçapı, ön ayarlar, kum etkisi, `sand_zones` kullanımı yok | OKUNDU / KISMEN (ilgili aralıklar, `grep`) | Bulgu 2, 3, 4 |
| 12:08 | canlı `POST /route`, `/replan`, `/assumptions`, `GET /layers/slope.bin`, `GET /route` (`127.0.0.1:8000`) | 7 steep A/B örneği; ada (bileşen) 422'leri; AB05 `sand_2` mesafesi; `mars_validated` | OKUNDU | Bulgu 1, 3, 4; `tani_kayitlari/steep_ornekler.js`, `steep_snap.js`, `steep_snap_ok.js` |
| 12:09 | tarayıcıda `window.__mm.picker` (gerçek GPU Chrome) | seçici uyarı/hesapla durumu | OKUNDU | Bulgu 3 |
| 12:10 | `WT/sim/data/rocks.json` | 829/709/110/10 ve outcrop `d_m` yeniden hesap | OKUNDU (ham dosya) | §3.1 |
| 12:11 | `docs/data/ekip/rems/RME_402151514RMD00530000000_______PA.TAB` + `.xml`, `rems_downloads_manifest.json` | REMS Sol 53 yeniden hesap; SHA-256 | OKUNDU (ham dosya) | §3.5 |
| 12:12 | `docs/data/ekip/varlik/nasa_pia20755/PIA20755.jpg` ve NASA assets URL | boyut 9091×1089, sRGB ortalaması, SHA-256 (indirilen = yerel) | OKUNDU (ham dosya, yeniden indirildi) | §3.6 |
| 12:13 | https://hirise-pds.lpl.arizona.edu/PDS/RDR/ESP/ORB_019600_019699/ESP_019698_1750/ESP_019698_1750_RED.LBL ve yerel kopya | etiket alanları, SHA-256 | OKUNDU (ham dosya, yeniden indirildi) | §3.3 |
| 12:15 | https://ntrs.nasa.gov/api/citations/20220010306 (+ PDF indirmesi, `pdftotext`) | slayt 23 | OKUNDU (PDF, SHA-256 `63eed187…`) | §2.3, §3.2 |
| 12:18 | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | günberi/günöte/yarı büyük eksen/yerçekimi | OKUNDU (sayfa, ilgili satırlar) | §2.4, §3.4 |
| 12:19 | https://www.giss.nasa.gov/tools/mars24/help/notes.html | sol süresi | OKUNDU (sayfa, ilgili cümle; SHA-256 `e227b6f8…`) | §2.4 |
| 12:20 | https://doi.org/10.1016/S0032-0633(99)00092-6 (Allison & McEwen 2000) | tam metin | **OKUNAMADI-ücretli makale (açılmadı)** | §3.4: yalnız formül + sabitler |
| — | `.gemini/antigravity-cli/brain/…/scratch/ESP_019698_1750_RED.LBL` (başka masanın kopyası) | SHA-256 karşılaştırması | OKUNDU (yalnız hash) | §3.3 |

**Kural (A) — Mars/Dünya:** düzeltmede g = 3,73 (NSSDC ortalama) / 3,71 (rapordaki) farkı ve sol = 88 775,244 SI s ile dakika = 60 SI s ayrımı açıkça yazıldı; APACHE 0,67056 m/s'nin **Dünya'da (ARGOS + koşu bandı) ölçülmüş tek denek** verisi olduğu belirtildi.

## Tur 4b — B15/B16 teşhisi
- `tani_kayitlari/s2_teshis.js`, `b15_dogrulama_S2.log`, `b15_dogrulama_P1P2.log`, `b15_dogrulama_P2.log`: kendi koşularım (gerçek GPU, API 8000).
- Salt-okunur kod: `sim/app/wire.js` (satır 34, 60–80, 155–170 `askDecision`, `dynHandlesSand`, `onArrived`), `sim/app/main.js` (collide.step). B16 nedeni yalnız kod okumasıdır, doğrulanmadı.
