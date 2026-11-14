# Sprint 2 MVP entegrasyon raporu (2026-11-14)

Dal: `samet/mvp`, hedef: `main`, kapsam: `Refs #51` (birleştirilmedi).

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
