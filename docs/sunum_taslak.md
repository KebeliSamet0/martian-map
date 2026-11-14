# Sunum taslağı v2: astronot görev provası simülatörü (issue #50)

Hazırlayan: Elif Nisa · 2026-11-14 · Sunum: Paz ~21:00 · Slayt metinleri İngilizce (jüri), notlar Türkçe.
Ürün tanımı: **"astronaut mission rehearsal simulator"**. Sunumda "oyun" ya da "game" kelimesi geçmiyor.

> **1 dakikalık özet (bitti koşulu):** Astronotun Mars'taki bir yürüyüşü, yapılmadan önce prova edebileceği bir
> simülatör geliştirdik. Astronot görev brifingini alır, haritada üç rotadan birini seçer; her rotanın süre,
> enerji, oksijen ve radyasyon dozu bütçesi vardır. Sonra Curiosity'nin gezdiği gerçek Gale arazisinde yürür,
> kaynakları canlı akar. Kask tarayıcısı zemini güvenli, dikkat, geçilmez ya da "model emin değil" diye
> işaretler. Yolda beklenmedik kum çıkarsa rota yeniden planlanır; görev sonunda planlanan ile gerçekleşen
> karşılaştırılır. **Farkımız:** deneyim sürükleyici, ama ekrandaki her sayı NASA verisinden ya da kaynaklı bir modelden geliyor.

`[PROJECT NAME]` = ekip oylamasıyla seçilecek ad (bölüm 5).

---

## 1. Yedi slayt

### Slayt 1: Problem
- **Başlık:** Every step on Mars spends oxygen you cannot get back
- **Ana mesaj:** A suited astronaut on Mars has a fixed oxygen and energy budget, and an EVA cannot be rehearsed on the real terrain beforehand.
- **Maddeler:**
  - Mars gravity is 3/8 of Earth's; NASA reports that walking in a suit there is far harder than on the Moon (Ogilvie et al. 2026).
  - Terrain matters: loose sand and boulder fields cost much more energy than bedrock.
  - Today's route tools show a line on a map. They do not let the astronaut feel the budget, or show *why* and *how sure*.
- **Görsel:** `layers/ortho_2m.png` (Gale boxwork bölgesi, 2×2 km).

### Slayt 2: Çözüm (tek kare)
- **Başlık:** [PROJECT NAME]: rehearse the EVA before you take it
- **Ana mesaj:** An astronaut mission rehearsal simulator on real Mars terrain, where every number has a source.
- **Maddeler:**
  - Choose one of three routes, each with a time, energy, oxygen and radiation budget.
  - Walk it in 3D on Curiosity's real terrain; resources update live.
  - The helmet scanner shows what the terrain model knows, and what it does not.
- **Görsel:** Simülatörden tek kare: 3D arazi, canlı göstergeler (Oksijen, Enerji, Süre, Doz) ve tarayıcı.
  `[Samet'ten istenecek: 21:00 provasından HUD + tarayıcı ekran görüntüsü]`

### Slayt 3: Veri
- **Başlık:** Built on real NASA data from where Curiosity explored in 2025–2026
- **Ana mesaj:** The terrain is the 2×2 km boxwork area that Curiosity studied; the science stops are places it actually stopped.
- **Maddeler:**
  - Terrain: USGS MSL Gale merged HiRISE DTM (1 m) + orthophoto (25 cm), on a 2 m grid.
  - Ground truth: Curiosity traverse and rover stops (NASA MMGIS), Navcam images, AI4Mars terrain labels.
  - Science and safety: CRISM mineralogy, Curiosity RAD surface radiation (0.21 mGy/day, Hassler et al. 2014).
- **Görsel:** `docs/data/img/gale_dtm_ortho_preview.png` + Curiosity rotası (`layers/msl_proposed_path.json`).

### Slayt 4: Nasıl çalışıyor
- **Başlık:** From orbital pixels to live life-support numbers
- **Ana mesaj:** Three data layers become one cost map; a planner turns it into routes, and the simulator spends the budget as you walk.
- **Maddeler:**
  - Slope (DTM) + rocks (our shadow-based detector) + terrain class with uncertainty (AI4Mars-trained model).
  - Suited walking energy: Pandolf load-carriage equation, calibrated to Apollo EVA data (272 W).
  - Planner API returns shortest / balanced / safest routes with per-segment reasons; the simulator reads every number from it.
- **Görsel:** Akış şeması: DTM → eğim · HiRISE → kaya · Navcam → zemin → maliyet haritası → 3 rota → simülatör (HUD, tarayıcı, karne).
  Yardımcı: `docs/data/img/rock_abundance_detection.png`, `docs/figures/rover_terrain_examples.png`.

### Slayt 5: Demo (görev akışı)
- **Başlık:** One mission, start to finish
- **Ana mesaj:** Boxwork ridges to the Atacama drill site (~0.55 km), planned, walked, re-planned and graded.
- **Maddeler (demo sırası):**
  1. **Briefing:** mission S1 and its objective (reach Atacama, collect a sample).
  2. **Plan:** choose one of three routes; compare their time, energy, oxygen and dose budgets.
  3. **Walk:** oxygen, energy, time and dose update live; status GO / CAUTION / NO-GO.
  4. **Scan:** the helmet scanner marks terrain as safe, caution, no-go or "model not sure".
  5. **Surprise:** sand ahead; the route is re-planned on the spot.
  6. **Debrief:** planned vs actual, and a grade.
- **Görsel:** Canlı demo. Yedek: `[Samet'ten istenecek: 21:00 provasının ekran kaydı]`

### Slayt 6: Doğrulama ve varsayımlar
- **Başlık:** What we checked against reality, and what we assume
- **Ana mesaj:** We test the model against Curiosity's real images and real path, and label every assumption.
- **Maddeler:**
  - Scanner vs Navcam: `[Emre'den gelecek: tarayıcı sınıflarının Navcam görüntüleriyle karşılaştırması, tek cümle + sayı]`
  - Curiosity's real path: Curiosity crossed our area in 3.89 km; between the same entry and exit our routes are 2.26–2.30 km, 140 m from its track on average. Most of the gap is Curiosity's science detours to the boxwork ridges (PR #65; slope and rocks only, without the terrain model).
  - Assumptions are shown in the app (`/assumptions`): Earth-measured terrain coefficients, Mars gravity scaling, EVA limits. Full text: bölüm 4.
- **Görsel:** `docs/figures/msl_compare.png` (PR #65, bizim rotalar + Curiosity'nin gerçek yolu) + Emre'nin karşılaştırma görseli `[Emre'den gelecek]`.

### Slayt 7: Etki ve sonraki adım
- **Başlık:** Rehearse on data today, walk on Mars tomorrow
- **Ana mesaj:** A rehearsal on real terrain with honest numbers makes EVA plans safer and easier to check.
- **Maddeler:**
  - Impact: astronauts and mission control see the cost and the risk of a route before anyone steps out.
  - Next: train the terrain model fully; replace Earth-measured coefficients when Mars suit tests report.
  - Open data and open code: every number links to its source.
- **Görsel:** 3D sahneden karne ekranı. `[Samet'ten istenecek: debrief ekran görüntüsü]`

---

## 2. Jüri kriterleri tablosu

| Kriter | Slayt | Karşılayan cümle |
|---|---|---|
| **Impact** | 1, 7 | "Every step on Mars spends oxygen you cannot get back." / "Astronauts and mission control see the cost and the risk of a route before anyone steps out." |
| **Creativity** | 2, 5 | "An astronaut mission rehearsal simulator on real Mars terrain." Tarayıcının "model not sure" etiketi: modelin bilmediğini gösteren bir arayüz. |
| **Validity** | 3, 6 | "Built on real NASA data from where Curiosity explored." / Navcam karşılaştırması ve Curiosity'nin gerçek yoluyla kıyas / "label every assumption". |
| **Relevance** | 1, 3, 5 | Challenge "Interplanetary Survival Guide: Martian Map": Mars yüzeyinde insanlı yürüyüşün hazırlığı, gerçek Curiosity bölgesinde, NASA verisiyle. |
| **Presentation** | 2, 5 | Tek karede ürün; baştan sona tek görev demosu; 30 sn video (bölüm 3). |

---

## 3. 30 saniyelik video senaryosu

| # | Süre | Ekranda | Seslendirme (EN) |
|---|---|---|---|
| 1 | 0–4 sn | Görev brifingi: "Boxwork'ten Atacama sondaj alanına" | "Mission briefing: reach the Atacama drill site on Mars." |
| 2 | 4–9 sn | Haritada üç rota ve bütçeleri | "Three routes. Each one costs time, energy, oxygen and radiation." |
| 3 | 9–15 sn | 3D yürüyüş; Oksijen, Enerji, Süre, Doz göstergeleri akıyor | "Walk it on Curiosity's real terrain, and watch the budget drain." |
| 4 | 15–19 sn | Kask tarayıcısı: güvenli / dikkat / geçilmez / model emin değil | "The scanner shows what the model knows, and what it does not." |
| 5 | 19–25 sn | Kum uyarısı; rota yeniden çiziliyor | "Sand ahead. The route is re-planned on the spot." |
| 6 | 25–30 sn | Karne: planlanan / gerçekleşen; proje adı | "Rehearse the EVA before you take it. [PROJECT NAME]." |

Not: Altyazı seslendirme metniyle aynı. Render: Batu. Ekran kaydı 21:00 provasından.

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
- Extra load in the simulator (e.g. a collected sample) is estimated from the total mass ratio, not a full Pandolf recalculation.

**Mission planning assumptions (not medical limits)**
- EVA limits used by the app: 6 h, 2000 kcal, 420 L O₂, 30 min science stop, 30 min reserve.
- Sourced alternatives in `docs/eva_parameters.md`: 7 h and 1800 kcal (Apollo 15–17 life support), walk-back distance ≤ 3.5 km (NASA Mars suit study, Ogilvie et al. 2026).
- Radiation dose budget per EVA: demo value; not a NASA limit (`docs/data/rad_rems_route.md`).
- Rock cover counts only rocks ≥ 1 m (HiRISE resolution), so it is a lower bound.
- Terrain model is trained on Curiosity images from 2012–2019; it has not seen the boxwork area. Where it is unsure, the scanner says so.

**Sources:** `docs/REFERENCES.md` · `docs/metabolic_model.md` · `docs/eva_parameters.md` · `docs/data/rad_rems_route.md`

---

## 5. Proje adı: 3 öneri

Var olan oyun ve proje adlarına karşı kontrol edildi (GitHub + web'de oyun/uygulama araması). Ayrıntı: #50 yorumu.

| Ad | Gerekçe |
|---|---|
| **GaleGuide** (önerim) | Gale Krateri'nde astronot için rehber; yarışmanın "Interplanetary Survival Guide" adıyla doğrudan örtüşüyor. |
| **Gale Rehearsal** | Ürünü tam olarak anlatıyor: Gale'de astronot görev provası. |
| **RegolithRoute** | Regolit, Mars yüzeyinin gevşek örtüsü; "Mars toprağında rota". |

Elenenler: Cairn (2026 dağcılık oyunu), SolStride (aynı adlı oyun), SharpPath (GameMaker yol bulma aracı), MarsWalk (kural).
