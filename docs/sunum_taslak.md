# Sunum taslağı (issue #50)

Hazırlayan: Elif Nisa · 2026-11-14 · Sunum: Paz ~21:00 · Slayt metinleri İngilizce (jüri), notlar Türkçe.

> **1 dakikalık özet (bitti koşulu):** Mars'ta yürüyen bir astronot için Gale Krateri'nde rota planlıyoruz.
> Uydu verisinden eğim, kaya ve zemin türünü çıkarıyor, bunları skafandrlı yürüyüşün enerji maliyetine
> çeviriyoruz. Planlayıcı üç rota öneriyor (en kısa, dengeli, en güvenli) ve her parça için "neden bu yol"
> açıklaması ile modelin ne kadar emin olduğunu gösteriyor. Süre, enerji, oksijen ve radyasyon bütçesine
> göre GO / NO-GO kararı veriyor; yolda kum çıkarsa rotayı yeniden hesaplıyor. **Farkımız:** sadece eğim ve en
> kısa yol değil; zemini öğrenen bir model, insan fizyolojisi ve her varsayımı kaynaklı, açıklanabilir bir karar zinciri.

`[PROJECT NAME]` = ekip oylamasıyla seçilecek ad (bölüm 5).

---

## 1. Yedi slayt

### Slayt 1: Problem
- **Başlık:** Walking on Mars is an energy and safety problem
- **Ana mesaj:** A suited astronaut on Mars has a fixed oxygen and energy budget, and every wrong step costs both.
- **Maddeler:**
  - Mars gravity is 3/8 of Earth's; walking in a suit is far harder than on the Moon (NASA, Ogilvie et al. 2026).
  - Terrain matters: loose sand and boulder fields cost much more energy than bedrock.
  - Most route tools optimise only slope and distance. They cannot say *why* a path is chosen or *how sure* they are.
- **Görsel:** `layers/ortho_2m.png` (Gale boxwork bölgesi, 2×2 km) üzerine "?" işaretli iki nokta.

### Slayt 2: Bir segment kartı (çözümü tek karede göster)
- **Başlık:** [PROJECT NAME]: every step explained
- **Ana mesaj:** For each route segment we show the cost, the reason and the model's confidence.
- **Maddeler (kartın içeriği; ÖRNEK değerler, gerçek çıktıyla değiştirilecek):**
  - Segment 7 · 84 m · bedrock · slope 9° · 3.6 min · 21 kcal · confidence: high
  - "Chosen because it stays on bedrock; the alternative crosses sand (+40% energy)."
  - Budget: time, energy, O₂, radiation dose → **GO**
- **Görsel:** Web arayüzünden tek bir segment kartı ekran görüntüsü. `[Samet'ten istenecek: S1 dengeli rota, segment kartı ekran görüntüsü; kart değerleri gerçek çıktıyla değiştirilecek]`

### Slayt 3: Veri
- **Başlık:** Built on real NASA data from where Curiosity drove in 2025–2026
- **Ana mesaj:** Our region is the 2×2 km boxwork area that Curiosity explored in 2025–2026.
- **Maddeler:**
  - Terrain: USGS MSL Gale merged HiRISE DTM (1 m) + orthophoto (25 cm), resampled to a 2 m grid.
  - Ground truth: Curiosity traverse and 128 rover stops (NASA MMGIS), Navcam images, AI4Mars labels.
  - Science and safety: CRISM mineralogy, Curiosity RAD radiation (0.21 mGy/day, Hassler et al. 2014).
- **Görsel:** `docs/data/img/gale_dtm_ortho_preview.png` + Curiosity rotası (`layers/msl_proposed_path.json`) çizgisi.

### Slayt 4: Nasıl çalışıyor
- **Başlık:** From pixels to a GO / NO-GO decision
- **Ana mesaj:** Three data layers become one energy-and-risk cost map, then three routes.
- **Maddeler:**
  - Slope (DTM) + rocks (our shadow-based detector) + terrain class (AI4Mars-trained model with uncertainty).
  - Suited walking energy: Pandolf load-carriage equation, calibrated to Apollo EVA data (272 W).
  - Planner returns shortest / balanced / safest routes with per-segment explanations and an EVA budget check.
- **Görsel:** Akış şeması: DTM → eğim · HiRISE → kaya · Navcam → zemin → maliyet haritası → 3 rota → kart → GO/NO-GO.
  Yardımcı görseller: `docs/data/img/rock_abundance_detection.png`, `docs/figures/rover_terrain_examples.png`.

### Slayt 5: Demo
- **Başlık:** Live demo: Boxwork to the Atacama drill site
- **Ana mesaj:** Between two real Curiosity science stops, we plan, explain, and re-plan when sand appears.
- **Maddeler:**
  - Route: Boxwork (sol 4617) → Atacama drill site, ~0.55 km, ~23 min (S1, `docs/demo_senaryolari.md`).
  - Surprise sand on the balanced route → `/replan` redraws all three routes.
  - The same route is walked in 3D.
- **Görsel:** Canlı demo (web + 3D). Yedek: `[Samet'ten istenecek: 21:00 provasının ekran kaydı]`

### Slayt 6: Doğrulama ve varsayımlar
- **Başlık:** What we validated, and what we assume
- **Ana mesaj:** We separate measurements from assumptions, and show both.
- **Maddeler:**
  - Curiosity drove 1229 m between our two stops (it stopped for science); our balanced route is ~560 m and stays on average 29 m from its real track.
  - Rock detector: 30/30 detections are real rocks; ~86% of visible rocks found (≥1 m only, so rock cover is a lower bound).
  - Assumptions are labelled in the app (`/assumptions`): Earth-measured terrain coefficients, Mars gravity scaling, EVA limits.
- **Görsel:** Rota karşılaştırma görseli (bizim rota ve Curiosity'nin gerçek yolu). `[Samet'ten istenecek: S1 karşılaştırma görseli]`
- **Tam metin:** bölüm 4.

### Slayt 7: Etki ve sonraki adım
- **Başlık:** From Curiosity's path to the first human footsteps
- **Ana mesaj:** Explainable, budget-aware route planning is what EVA planners will need on Mars.
- **Maddeler:**
  - Impact: safer EVAs, less wasted oxygen, decisions astronauts and mission control can check.
  - Next: train the terrain model fully, add measured Mars suit data when NASA's Mars suit tests report.
  - Open data and open code: every number links to its source.
- **Görsel:** 3D sahneden bir kare (`sim/`). `[Samet'ten istenecek: 3D ekran görüntüsü]`

---

## 2. Jüri kriterleri tablosu

| Kriter | Slayt | Karşılayan cümle |
|---|---|---|
| **Impact** | 1, 7 | "A suited astronaut on Mars has a fixed oxygen and energy budget, and every wrong step costs both." / "Safer EVAs, less wasted oxygen, decisions astronauts and mission control can check." |
| **Creativity** | 2, 4 | "For each route segment we show the cost, the reason and the model's confidence." Zemin modeli + insan fizyolojisi + açıklanabilir karar zinciri bir arada. |
| **Validity** | 3, 6 | "Built on real NASA data from where Curiosity drove in 2025–2026." / "Our balanced route stays on average 29 m from Curiosity's real track." / "We separate measurements from assumptions, and show both." |
| **Relevance** | 1, 3, 5 | Challenge "Interplanetary Survival Guide: Martian Map": Mars yüzeyinde insanlı yürüyüş rotası, gerçek Curiosity bölgesinde, NASA verisiyle. |
| **Presentation** | 2, 5 | Tek segment kartı ile hızlı anlatım; canlı demo; 30 sn video (bölüm 3). |

---

## 3. 30 saniyelik video senaryosu

| # | Süre | Ekranda | Seslendirme (EN) |
|---|---|---|---|
| 1 | 0–4 sn | Gale Krateri'nden boxwork bölgesine yakınlaşma (ortofoto) | "This is Gale Crater, where Curiosity explored in 2025–2026." |
| 2 | 4–9 sn | Eğim, kaya ve zemin katmanları sırayla açılıyor | "We turn NASA orbital data into slope, rocks and terrain type." |
| 3 | 9–15 sn | Üç rota çiziliyor; bir segment kartı açılıyor | "Three routes: shortest, balanced, safest. Every segment explains why, and how sure we are." |
| 4 | 15–20 sn | Bütçe paneli: süre, enerji, O₂, doz → GO | "Time, energy, oxygen and radiation decide: go or no-go." |
| 5 | 20–26 sn | 3D yürüyüş; kum çıkıyor, rota yeniden çiziliyor | "Sand ahead? The route is re-planned instantly." |
| 6 | 26–30 sn | Proje adı + "Every number has a source." | "[PROJECT NAME]. Safe steps on Mars." |

Not: Altyazı seslendirme metniyle aynı. Render: Batu. Ekran kaydı 21:00 MVP provasından alınacak.

---

## 4. Varsayımlar ve kaynaklar slaytının tam metni (Slayt 6 ek / yedek slayt)

**Measured (from data)**
- Terrain elevation and slope: USGS MSL Gale merged HiRISE DTM, 1 m, resampled to 2 m. Checked against 144 Curiosity waypoints (median height difference 0.0 m).
- Surface radiation: 0.21 mGy/day, Curiosity RAD (Hassler et al. 2014).
- Apollo lunar EVA metabolic rate: 234 kcal/h = 272 W, average over 158.7 h of EVA (Waligora & Horrigan 1975, NASA SP-368).
- Rock detection quality: 30/30 correct detections, ~86% of visible rocks found (our own manual check).

**From the literature, applied to Mars (assumption)**
- Walking energy: Pandolf et al. (1977) equation, validated on Earth; NASA uses the same equation for EVA traverse planning (Kim et al. 2024).
- Terrain coefficients are **Earth measurements** (Soule & Goldman 1972). **No Mars-measured values exist.** Mapping them to Martian terrain classes is our assumption: bedrock 1.0, soil 1.2, sand 2.1, boulders 1.5.
- Mars gravity: load and walking terms are scaled by 3.71 / 9.81. Real Mars walking is likely costlier, because walking cost does not fall in proportion to gravity (Farley & McMahon 1992). Our energy values are a **lower bound**.

**Mission planning assumptions (not medical limits)**
- EVA limits used by the app: 6 h, 2000 kcal, 420 L O₂, 30 min science stop, 30 min reserve.
- Sourced alternatives in `docs/eva_parameters.md`: 7 h and 1800 kcal (Apollo 15–17 life support), walk-back distance ≤ 3.5 km (NASA Mars suit study, Ogilvie et al. 2026).
- Radiation dose budget per EVA: demo value; not a NASA limit (`docs/data/rad_rems_route.md`).
- Rock cover counts only rocks ≥ 1 m (HiRISE resolution), so it is a lower bound.
- Terrain model is trained on Curiosity images from 2012–2019; it has not seen the boxwork area.

**Sources:** `docs/REFERENCES.md` · `docs/metabolic_model.md` · `docs/eva_parameters.md` · `docs/data/rad_rems_route.md`

---

## 5. Proje adı: 3 öneri

GitHub'da Mars bağlamında arandı; "MarsWalk" 86 depoda geçiyor.

| Ad | Gerekçe | GitHub çakışması |
|---|---|---|
| **Cairn** (önerim) | Dağ yürüyüşünde güvenli patikayı işaretleyen taş yığını; uygulama da astronota güvenli yolu işaretliyor ("Cairns mark safe trails on Earth; Cairn marks them on Mars"). | "Cairn" + Mars: 0 |
| **GaleGuide** | Gale Krateri için rehber; yarışmanın "Survival Guide" adıyla doğrudan örtüşüyor. | 0 |
| **SharpPath** | Mount Sharp üzerindeki yol; "sharp" aynı zamanda "akıllı" anlamında, açıklanabilir rotaya uygun. | 4 depo, hepsi alakasız (oyun/C# araçları) |
