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
