# Simülasyon API Veri Katmanları ve Uçları Raporu (2026-11-14)

PR: https://github.com/KebeliSamet0/martian-map/pull/76 — Dal: `samet/sim-api`, kapsam: `Refs #51` (birleştirilmedi).

## 1. Yeni Katmanlar ve Uç Noktalar
- **Türetilmiş katmanlar (`/layers/{name}.bin|png`, `/grid` → `aux_layers`):**
  - `speed_mps`: hücrede yürüme hızı (`cost.speed_ms`, m/s)
  - `kcal_per_m`: metre başına enerji (`cost.kcal_per_m`, kcal/m)
  - `o2_l_per_m` ve `o2_g_per_m`: metre başına O₂ (`cost.o2_l_per_m`, L/m ve g/m; `1 L O₂ = 4.8 kcal = 1.429 g`)
  - `risk`: metre başına birleşik risk (`cost.risk_per_m`, 0–1)
  - `scan_class`: arazi tarayıcı sınıfı (`0` güvenli, `1` dikkat, `2` geçilmez, `3` bilinmiyor; `.bin` varsayılan `<f4` veya `?dtype=uint8`, `.png` `/grid` → `scan_legend` renklerinde RGBA)
- **`POST /step` (ve `POST /consume`):** `{"path": [[x,y],...], "load_kg": 0, "observations": [...]}` → yürüyüş izi boyunca `duration_s` (`sec`, `min`), `kcal`, `o2_L`, `o2_g`, `dose_uGy`, `risk`, `ascent_m`/`descent_m`, `directional` özet, `terrain_classes`, `scan_classes` ve hücre listesi (`cells`).
- **Ek yük (`load_kg`):** `/route`, `/replan`, `/step`, `/debrief` isteğe bağlı `load_kg >= 0` alır; Pandolf `L = SUIT_KG + TOOLS_KG + load_kg` terimine girer (`load_kg=0` geriye uyumlu).
- **`GET /missions`:** `layers/demo_scenarios.json` ve `layers/sand_hint.json` dosyalarını değiştirmeden okur; her görev için `id`, `name`/`title`, `start_px`, `goal_px`, `limits` ve `sand_events` + `sand_points` sunar.
- **`POST /debrief`:** `{"planned": <route>, "actual_path": [[x,y],...], "load_kg": 0}` → `planned`, `actual`, `deltas` (süre/kcal/O₂/doz ve `mean_deviation_m`/`max_deviation_m`), `remaining` (EVA ve tek yön kalan paylar) ve `grade` (`A`/`B`/`C`) + Türkçe `reason`.

## 2. Örnek İstekler
```sh
curl http://localhost:8000/layers/scan_class.png -o /tmp/scan_class.png
curl http://localhost:8000/missions
curl -X POST http://localhost:8000/step -H 'Content-Type: application/json' \
  -d '{"path":[[433,525],[434,526],[435,527]],"load_kg":5}'
curl -X POST http://localhost:8000/debrief -H 'Content-Type: application/json' \
  -d '{"planned":{"path_px":[[433,525],[434,525]]},"actual_path":[[433,525],[434,526]],"load_kg":5}'
```

## 3. Süre Ölçümleri (1000×1000 Gale ızgarası, `scripts/smoke.py`)
| İşlem | Ölçülen Süre | Hedef |
|---|---|---|
| Katman yükleme (`planner.load`) | **40 ms** (0.040 s) | Başlangıçta 1 kez |
| `POST /step` (40 hücrelik yürüyüş izi) | **2.19 ms** | < 50 ms |
| `GET /missions` | **1.88 ms** | Anlık |
| `POST /debrief` (tam rota karşılaştırması) | **13.33 ms** | < 50 ms |
| `POST /route` (`sci_1` → `sci_4`, 3 ön ayar) | **132 ms** (0.132 s) | < 2000 ms |
| `POST /replan` (kum gözlemli, 3 ön ayar) | **164 ms** (0.164 s) | < 2000 ms |

## 4. Belgelenmiş Varsayımlar (`params.py` ve `/assumptions`)
- **Yönsüz hücre maliyeti:** Tek hücre katmanlarında yürüyüş yönü bilinmediğinden `|slope|` ile çıkış yönsüz özet olarak kullanılır; yönlü adım hesabı `/step` ucunda yapılır.
- **`scan_class` önceliği:** `2` geçilmez (`slope >= 25°` veya `p_sand >= 0.55 & slope >= 12°`) → `3` bilinmiyor (`entropy >= 0.60`) → `1` dikkat (`slope >= 15°` veya `p_sand >= 0.40` veya `rock_cfa >= 0.15`) → `0` güvenli.
- **Karne (`/debrief`) derecesi:** Bütçe ve NOGO ihlali yokken `ek_tüketim <= %10` ve `ort_sapma <= 20 m` ise **A**; `<= %25` ve `<= 60 m` ise **B**; aksi durumda **C**.

## 5. Bilinen Eksikler
- `layers/demo_scenarios.json` içindeki not uyarınca mevcut zemin olasılıkları 1-epoch kaba model çıktısıdır; 12-epoch AI4Mars çıktıları geldiğinde `scan_class` ve rota ayrışması kod değişmeden güncellenecektir.
