# Sprint 2 MVP entegrasyon raporu (2026-11-14)

PR: https://github.com/KebeliSamet0/martian-map/pull/55 — Dal: `samet/mvp`, hedef: `main`, kapsam: `Refs #51` (birleştirilmedi).

## Yapılanlar
1. **Geçici zemin dolgusu (`api/planner/layers.py`, `route.py`, `params.py`, `main.py`):** `p_soil`, `p_bedrock`, `p_sand`, `p_bigrock` ve `entropy` dosyalarının tamamı eksik olduğunda bellekte eğim ve `rock_cfa` üzerinden geçici katmanlar üretilir (diske yazılmaz). Kısmi pakette anlaşılır Türkçe `LayerError` verilir; beş dosyanın tamamı geldiğinde kod değişmeden gerçek dosyalar kullanılır.
2. **Görünürlük:** Geçici modda `/grid` (`provisional_terrain: true`, `terrain_note`), `/assumptions` ve her segmentin `reason` açıklaması açıkça `"geçici zemin katmanı (model çıktısı değil)"` ibaresini içerir. Mevcut sözleşme alanları korunmuştur.
3. **Uçtan uca duman testi (`scripts/smoke.py`, `api/tests/test_mvp.py`):** Gerçek 1000×1000 Gale katmanlarıyla `science_stops.json` durakları arasında `/route` (3 ön ayar) ve rota ortasına kum gözlemiyle `/replan` çalıştırılır; pytest eşdeğeri gerçek katman yoksa skip eder.
4. **Tek komutla başlatma (`scripts/dev.sh`, `README.md`):** API (`:8000`, `MARTIAN_LAYERS_DIR=repo kökü`), Web (`:5173`, `npm run dev`) ve Sim (`:8001`, `sim/tools/devserver.py`) birlikte başlatılır; Ctrl-C ile temiz kapatılır.

## Geçici dolgu kuralı
- `p_bigrock = clip(0.10 + 0.45*clip(rock_cfa/0.25, 0, 1) + 0.15*clip((slope-15)/10, 0, 1), 0.05, 0.65)`
- `p_sand = clip(0.10 + 0.35*clip((10-slope)/10, 0, 1)*(1 - clip(rock_cfa/0.10, 0, 1)), 0.05, 0.50)`
- Kalan olasılık `rem = 1 - p_bigrock - p_sand`; `bed_share = clip((slope-5)/15, 0.30, 0.70)` ile `p_bedrock = rem * bed_share`, `p_soil = rem * (1 - bed_share)` (toplam = 1.0).
- `entropy = max(normalize_shannon(probs), 0.75)` → tüm hücrelerde düşük güven (`CONF_LOW = 0.60` üstü).

## Duman testi çıktısı ve süre ölçümü (1000×1000, 2 m Gale ızgarası)
```text
Bölge: Gale / Mount Sharp boxwork bolgesi (Curiosity sol ~4459-4983) (1000x1000, 2.0 m)
Not: geçici zemin katmanı (model çıktısı değil)
Duraklar: sci_1_sol4617 [433, 525] -> sci_3_sol4668 [470, 589]
Süreler: yükleme=0.037s, /route=0.080s, /replan=0.079s
/route: shortest: 0.16 km, 6.6 dk, 32 kcal, GO | balanced: 0.16 km, 6.6 dk, 32 kcal, GO | safest: 0.16 km, 6.6 dk, 32 kcal, GO
/replan (kum gözlemi): shortest: 0.16 km, 8.7 dk, 43 kcal, GO | balanced: 0.16 km, 8.7 dk, 43 kcal, GO | safest: 0.16 km, 8.7 dk, 43 kcal, GO
```
- Tüm bilim durağı çiftlerinde `/route` süresi **0.065 s – 0.126 s**, köşeden köşeye (`[100,100] -> [900,900]`) **~0.46 s** ölçüldü (2 sn hedefinin çok altında).
- Testler: `.venv/bin/python -m pytest -q` → **73 passed** (1.47 s).

## Web / Sim başlatma gözlemleri ve bilinen eksikler
- `sim/tools/devserver.py` varsayılan olarak 8000 portunu kullanıyor; API (`:8000`) ile çakışmaması için `scripts/dev.sh` içinde Sim sunucusuna argüman olarak `8001` portu verildi (`web` ve `sim` koduna dokunulmadı).
- Bu makinede `sim/data/tiles` dizini (3D arazi karoları) henüz üretilmemiş; `dev.sh` bunu kontrol edip uyarı basarak Sim sunucusunu başlatmaya devam eder.
- AI4Mars gerçek model çıktıları (`p_soil`, `p_bedrock`, `p_sand`, `p_bigrock`, `entropy`) Emre tarafından üretildiğinde `layers/` altına konulması yeterlidir; geçici dolgu kendiliğinden devre dışı kalacaktır.

## Brif 2 — Gerçek veride rota kalitesi (segmentleme, ayrışma ve bağlantı)

### 1. Önce / Sonra karşılaştırma tablosu
| Çift / Ön ayar | Önce (km / dk / kcal / seg / ort. eğim / ort. kaya) | Sonra (km / dk / kcal / seg / ort. eğim / ort. kaya) | Ortak hücre oranı (Önce → Sonra) |
|---|---|---|---|
| `[433,525]→[491,774]` shortest | 0.55 / 21.4 / 103 / **114** / 6.72° / 0.0100 | 0.55 / 21.4 / 103 / **8** / 6.72° / 0.0100 | S–B: %68.5 → **%78.6** |
| `[433,525]→[491,774]` balanced | 0.55 / 21.4 / 103 / **113** / 6.74° / 0.0012 | 0.56 / 21.5 / 103 / **8** / 6.70° / 0.0001 | B–Saf: %6.6 → **%55.9** |
| `[433,525]→[491,774]` safest | 0.55 / 21.5 / 105 / **111** / 7.27° / 0.0006 | 0.57 / 21.6 / 104 / **8** / **6.49°** / **0.0000** | S–Saf: %6.1 → **%48.1** |
| `[150,150]→[850,850]` shortest | 2.79 / 135.9 / 670 / **568** / 10.13° / 0.0012 | 2.79 / 135.9 / 670 / **24** / 10.13° / 0.0012 | S–B: %57.5 → **%42.1** |
| `[150,150]→[850,850]` balanced | 2.81 / 136.1 / 670 / **581** / 10.02° / 0.0001 | 2.85 / 136.3 / 671 / **24** / **9.85°** / 0.0001 | B–Saf: %37.3 → **%26.0** |
| `[150,150]→[850,850]` safest | 2.82 / 136.8 / 676 / **563** / 10.14° / 0.0000 | 2.99 / 138.6 / 681 / **24** / **9.29°** / **0.0000** | S–Saf: %31.7 → **%15.7** |

### 2. Neden analizi ve yapılan belgeli varsayımlar (`params.py` & `/assumptions`)
- **Neden:** Gerçek Gale verisinde medyan `s_per_m=2.83` (std 1.42) iken `risk_per_m=0.22` (std 0.15) düzeyindeydi; ayrıca `layers/rover_stops.json` kökten çağrıldığında yüklenmediği için kanıt mesafesi `NaN` kalıyor ve geçici entropi sabit (0.75) oluyordu. Eğim riski de 10° altında sıfır olduğu için `safest` rota 6–10° arası yamaçları düz zeminden ayırt etmiyordu.
- **Segmentleme (`SEG_MIN_M=40`, `SEG_MAX_M=70`, `SEG_MAX_COUNT=24`, `SEG_SMOOTH_M=30`, `SEG_HYSTERESIS_DEG=1.5`):** 2 m ızgarada eğim ve sınıf olasılıkları 30 m pencere ortalaması ve 1.5° bant histerezisi ile yumuşatıldı; kısa parçalar komşusuna katılarak 8–24 segment aralığı sağlandı (segment toplamları rota toplamına eşit).
- **Risk ve ön ayarlar (`REAL_PRESETS`, `RISK_STEER_SLOPE_DEG=8.0`, `RISK_ROCK_SCALE=0.15`):** Gerçek veride eğim riski doğrusal + 8° üstü karesel bileşenle tanımlandı; rover kanıtlarına uzaklıkla artan geçici entropi (`0.65–0.95`) bağlandı; `balanced` (`t=1, k=12, r=22`) ve `safest` (`t=0.2, k=1.5, r=140`) ağırlıklarıyla hem ortalama eğim hem kaya oranı düzenli azalacak şekilde ayrışma sağlandı. Sentetik veri sözleşmesi (`PRESETS`) korundu.

### 3. Bağlantı ölçümü ve erişilebilirlik katmanı
- **1000×1000 Gale ızgarası:** Geçilebilir hücre (`slope < 25°`) oranı **%81.25** (812.546 hücre); geçilmez (`≥ 25°`) **187.454 hücre (%18.75)**.
- **8-komşuluk bağlı bileşenler:** Toplam **2.281** bileşen; en büyük ana bileşen **743.390 hücre** (tüm ızgaranın **%74.34**'ü, geçilebilir alanın **%91.49**'u). `#2` bileşen %2.80 (28.000 hücre), `#3` bileşen %1.19 (11.918 hücre).
- **Yeni maske ve hata mesajı:** `/grid` yanıtına `reachability` özeti ve `aux_layers: ["reachable"]`, katman uçlarına `/layers/reachable.png` (ve `.bin`: ana bileşen `1.0`, izole geçilebilir adalar `0.35`, NOGO `0.0`) eklendi. `[100,800]→[900,200]` artık `"başlangıç [100, 800] bileşen #1 (743390 hücre, %74.34), hedef [900, 200] bileşen #269 (19 hücre, %0.00) içinde kaldı"` mesajıyla 422 döner.

### 4. Bilinen eksikler
- Emre'nin gerçek AI4Mars zemin katmanları geldiğinde sınıf/entropi dağılımı değişeceğinden `REAL_PRESETS` ağırlıkları gerçek model çıktısıyla yeniden gözden geçirilmelidir.
