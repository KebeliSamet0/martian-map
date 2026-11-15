# Sunum taslağı v3: astronot görev provası simülatörü (issue #50)

Hazırlayan: Elif Nisa · 2026-11-15 (v3: Batu'nun iddia denetimine göre düzeltildi, `docs/data/ekip/sunum_denetimi.md`) · Sunum: Paz ~21:00 · Slayt metinleri İngilizce (jüri), notlar Türkçe.
Ürün tanımı: **"astronaut mission rehearsal simulator"** (bir EVA prova prototipi). Sunumda "oyun" ya da "game" kelimesi geçmiyor.
Söylenmeyecekler (denetimde YASAK): "NASA onayladı", "güvenli rota garantisi", "60 µGy NASA limiti", "20° Mars için doğrulanmış insan sınırı" (20° Ay ConOps gereksinimi), "hatalar hep güvenli yönde", gerçek GPU FPS sayısı.

> **1 dakikalık özet (bitti koşulu):** Astronotun Mars'taki bir yürüyüşü, yapılmadan önce prova edebileceği bir
> simülatör prototipi geliştirdik. Astronot görev brifingini alır, haritada üç rotadan birini seçer; her rotanın süre,
> enerji, oksijen ve radyasyon dozu bütçesi vardır. Sonra Curiosity'nin gezdiği bölgenin yörünge ve rover verisinden
> kurulmuş arazisinde yürür; göstergeler yürüdükçe model tahminleriyle güncellenir. Kask tarayıcısı katmanlardan kural
> tabanlı uyarılar üretir ve modelin kanıtının az olduğu yerleri gösterir. Senaryoda tanımlı bir kum alanı yeniden
> planlamayı tetikler; görev sonunda planlanan ile gerçekleşen karşılaştırılır. **Farkımız:** ölçümü, model tahminini ve
> planlama varsayımını birbirinden ayırıp gösteriyoruz. Mars'ta insan enerji tüketimi ve operasyonel güvenlik henüz doğrulanmadı.

`[PROJECT NAME]` = teslim paketinde (`docs/submission/`) çalışma adı **Martian Map**; nihai ad kesinleşmedi (bölüm 5).

---

## 1. Yedi slayt

### Slayt 1: Problem
- **Başlık:** On Mars, the route decides how much of the life-support budget an EVA uses
- **Ana mesaj:** Life-support resources are consumed throughout an EVA, and route choice changes the planned budget. Before anyone visits, the terrain can only be rehearsed virtually, rebuilt from orbital and rover data.
- **Maddeler:**
  - Mars gravity is 3/8 of Earth's; NASA design studies assess suit mass and metabolic limits for walking there (Ogilvie et al. 2026).
  - Terrain matters: on Earth, walking on sand costs 2.1–2.7× the energy of firm ground (Lejeune et al. 1998).
  - We combine terrain layers, route explanations and a 3D rehearsal in one workflow.
- **Görsel:** `layers/ortho_2m.png` (Gale boxwork bölgesi, 2×2 km).

### Slayt 2: Çözüm (tek kare)
- **Başlık:** [PROJECT NAME]: rehearse the EVA before you take it
- **Ana mesaj:** An astronaut mission rehearsal prototype on real Mars terrain data, separating measurements, model estimates and planning assumptions.
- **Maddeler:**
  - Choose one of three routes, each with a time, energy, oxygen and radiation budget.
  - Walk it in 3D on terrain built from HiRISE data where Curiosity drove; the gauges update model estimates as you walk.
  - The helmet scanner gives rule-based warnings and shows where the terrain model has little evidence.
- **Görsel:** Simülatörden tek kare: 3D arazi, göstergeler (Oksijen, Enerji, Süre, Doz) ve tarayıcı (`docs/figures/sim_*.png`). Tarayıcı karesi #106 (tarayıcı + belirsizlik sisi) birleştikten sonra alınacak.

### Slayt 3: Veri
- **Başlık:** Built on real NASA data from where Curiosity explored in 2025–2026
- **Ana mesaj:** The terrain is the 2×2 km boxwork area that Curiosity studied; the mission target is a rover stop linked to the Atacama drill campaign by sol range (exact drill location not verified).
- **Maddeler:**
  - Terrain: USGS MSL Gale merged HiRISE DTM (1 m) + orthophoto (25 cm), on a 2 m grid.
  - Rover evidence: Curiosity positions (NASA MMGIS), Navcam images, AI4Mars labelled test images. Ground truth does not cover the whole map.
  - Context: CRISM mineralogy for the science stops (not a route-cost layer); Curiosity RAD surface dose rate 0.210 ± 0.040 mGy/day (Hassler et al. 2014).
- **Görsel:** `docs/data/img/gale_dtm_ortho_preview.png` + Curiosity rotası (`layers/msl_proposed_path.json`).

### Slayt 4: Nasıl çalışıyor
- **Başlık:** From orbital pixels to an explained route
- **Ana mesaj:** Three data layers become one cost map; a planner turns it into routes, and the simulator spends the budget as you walk.
- **Maddeler:**
  - Slope (DTM) + rocks (our shadow-based detector) + terrain class with uncertainty (AI4Mars-trained model).
  - Suited walking energy: Pandolf load-carriage equation, calibrated to Apollo EVA data (272 W).
  - The planner returns shortest / balanced / safest routes with per-segment reasons; mission limits and walk telemetry are computed in the simulator.
- **Konuşmacı notu (15 Kasım, Emre #127):** Geçilmez eğim 20° olunca zemin modeli S1–S3 rotalarını değiştirmiyor: tam model ile "eğim + kaya" 9 durumun 9'unda aynı yolu buluyor, risk farkı %0–2. "Model rotayı değiştirdi" deme; modelin değerini kask kamerası (gerçek Navcam + maske), ayak altı zemin oranı ve dürüst belirsizlik üzerinden anlat.
- **Görsel:** Akış şeması: DTM → eğim · HiRISE → kaya · Navcam → zemin → maliyet haritası → 3 rota → simülatör (HUD, tarayıcı, karne).
  Yardımcı: `docs/data/img/rock_abundance_detection.png`, `docs/figures/rover_terrain_examples.png`.

### Slayt 5: Demo (görev akışı)
- **Başlık:** One mission, start to finish
- **Ana mesaj:** From the boxwork ridges to the Atacama campaign stop (~0.55 km) and back: planned, walked, decided, sampled and graded.
- **Maddeler (demo sırası):**
  1. **Briefing:** mission S1 and its objective (reach Atacama, collect a sample).
  2. **Plan:** choose one of three routes; compare their time, energy, oxygen and dose budgets.
  3. **Walk:** oxygen, energy, time and dose estimates update as you walk; status GO / CAUTION / NO-GO.
  4. **Scan:** the helmet scanner marks caution and no-go ground and shows where the model has little evidence.
  5. **Decision:** a sand patch defined in the scenario raises a card: accept the planner's new route or continue.
  6. **Sample and return:** at the target, hold E to collect the sample (+8 kg), then walk back to base with the heavier load.
  7. **Debrief:** planned vs actual, the decisions taken, and a grade.
- **Three missions, three lessons** (`sim/data/missions.json`):
  - S1, easy: comfortable budget, all three routes GO.
  - S2, medium, "Sandy shortcut": a sand candidate sits on the shortest route; the re-plan goes around it.
  - S3, hard, "Limited O₂ budget": oxygen cut to 80 L; the routes start as NO-GO and the astronaut has to weigh turning back.
- **Görsel:** Canlı demo. Yedek: ekran kaydı (demo bilgisayarında, gerçek GPU ile).
- **Konuşmacı notu:** Kum olayı senaryoda önceden tanımlı; canlı sensör algılaması yok. S3'te yazılım dönüşü zorunlu kılmıyor; ders, kararın astronotta olması.
- **Demo uyarısı (15 Kasım denetimi, #125):** Karne şu an dönüşlü yürüyüşü yalnız gidiş planıyla karşılaştırıyor (S1'de C çıkıyor) ve S3'te uyarı dönüş yolunda geliyor. Düzelmezse demoda karne derecesine değil tabloya ve karar satırlarına odaklan; S3'ü planlama ekranındaki NO-GO kararıyla anlat.

### Slayt 6: Doğrulama
Slayt metni (İngilizce, başlık ve dipnot dahil 40 kelime; 40 sınırı):

- **Başlık:** Checked against rover data
- **Sol yarı (Curiosity'nin gerçek yolu):** Curiosity drove 3.89 km; our routes, same endpoints: 2.26–2.40 km.
- **Sağ yarı (zemin modeli):** Model (expert test): mIoU 0.798, large-rock recall 0.97, ECE 0.004.
- **Sağ yarı alt satır:** Scanner vs Navcam: 3 of 6 right, 1 partly; misses were sandy.
- **Dipnot:** Geometry only; energy unvalidated.

Görseller:
- Sol: `docs/figures/msl_compare.png` (bizim üç rota + Curiosity'nin gerçek yolu).
- Sağ: `docs/figures/navcam_vs_model.png` (Emre; üç durak: #6 tuttu, #15 kum kaçtı, #13 kum yakalandı).

Sayıların kaynağı (her sayı dosyadaki değerle aynı):

| Slayttaki sayı | Kaynak dosya | Dosyadaki değer |
|---|---|---|
| 3.89 km | `docs/validation_msl.md` §2 | Curiosity polyline `3887.6 m` |
| 2.26–2.40 km | `docs/sim/DENETIM_masa_arastirmalari_2026-11-15.md` §3 (zemin modeliyle yeniden koşu; `validation_msl.md` eski) | en kısa `2257.9`, dengeli `2284.1`, en güvenli `2396.3` m |
| mIoU 0.798 | `ml/rover_terrain/METRICS.md` (Kapı 2, test_min3) | `0,798` |
| large-rock recall 0.97 | `ml/rover_terrain/METRICS.md` (Kapı 2, test_min3) | `0,973` |
| ECE 0.004 | `ml/rover_terrain/METRICS.md` (Kapı 2, test_min3) | `0,004` |
| 3 of 6 right, 1 partly, 2 missed (sandy) | `ml/rover_terrain/SCAN_CHECK.md` | "6 duraktan 3'ünde tuttu, 1'inde kısmen, 2'sinde tutmadı; tutmayan ikisi de kumlu" |

Konuşmacı notu (TR, slaytta yok):
- Curiosity aynı giriş–çıkış arasında 3,89 km gitti; bizim rotalar 2,26–2,40 km ve onun izinden ortalama ~130 m uzakta (DENETIM §3, zemin modeli dahil). Rover ile yaya planının bilim hedefleri ve hareket kısıtları farklı; uzunluk farkı üstünlük kanıtı değil. Bu kıyas yalnız geometri: insan enerji ve süre tahminini doğrulamaz.
- mIoU: sınıf örtüşmesinin ortalaması; uzmanların uzlaştığı AI4Mars test pikselleri (eğitimde gönüllü etiketleri kullanıldı). ECE 0,004: testte piksel düzeyinde kalibrasyon hatası düşük. Ama durak düzeyinde belirsizlik, yanlış tahminleri doğrulardan ayıramadı (`SCAN_CHECK.md`); bunu da söyle.
- Zayıf yanı açıkça söyle: model kumu kaçırıyor (18 durakta kum 7'nin 2'sinde yakalandı, `ml/rover_terrain/LAYERS.md`). Simülatördeki kum olayı yeniden planlamayı gösterir; modelin kaçırdığı kumu otomatik düzelttiğini kanıtlamaz.
- Varsayımlar (Dünya'da ölçülmüş zemin katsayıları, Mars yerçekimi ölçeklemesi, EVA sınırları) uygulamada `/assumptions` sayfasında; tam metin yedek slaytta (bölüm 4).


### Slayt 7: Etki ve sonraki adım
- **Başlık:** Rehearse with real terrain data today, and see the model's limits
- **Ana mesaj:** The tool helps examine route assumptions and compare options before an EVA; its safety impact has not been measured.
- **Maddeler:**
  - Impact: astronauts and mission control see the cost and the risk of a route before anyone steps out.
  - Next: label the 2025 boxwork area; replace Earth-measured coefficients when Mars suit tests report; validate energy with human data.
  - Open code; data and asset licences are listed per source (not everything is CC0). An independent prototype using NASA data, without operational approval.
- **Görsel:** 3D sahneden karne ekranı (`docs/figures/sim_*.png`).

---

## 2. Jüri kriterleri tablosu

| Kriter | Slayt | Karşılayan cümle |
|---|---|---|
| **Impact** | 1, 7 | "On Mars, the route decides how much of the life-support budget an EVA uses." / "Astronauts and mission control see the cost and the risk of a route before anyone steps out." |
| **Creativity** | 2, 5 | "An astronaut mission rehearsal simulator on real Mars terrain." Tarayıcı, modelin kanıtının az olduğu yeri gösteriyor. |
| **Validity** | 3, 6 | "Built on real NASA data from where Curiosity explored." / "Checked against rover data": Curiosity'nin gerçek yolu (3.89 km ↔ 2.26–2.40 km, yalnız geometri) + uzman etiketli test (large-rock recall 0.97, ECE 0.004) + Navcam kıyası (3/6 tuttu, ikisi kumda kaçtı) / yedek slaytta her varsayım etiketli. |
| **Relevance** | 1, 3, 5 | Challenge "Interplanetary Survival Guide: Martian Map": Mars yüzeyinde insanlı yürüyüşün hazırlığı, gerçek Curiosity bölgesinde, NASA verisiyle. |
| **Presentation** | 2, 5 | Tek karede ürün; baştan sona tek görev demosu; 30 sn video (bölüm 3). |

---

## 3. 30 saniyelik video senaryosu

| # | Süre | Ekranda | Seslendirme (EN) |
|---|---|---|---|
| 1 | 0–4 sn | Görev brifingi: "Boxwork'ten Atacama sondajına" | "Mission briefing: reach the Atacama drill campaign stop." |
| 2 | 4–9 sn | Haritada üç rota ve bütçeleri | "Three routes. Each one costs time, energy, oxygen and radiation." |
| 3 | 9–15 sn | 3D yürüyüş; Oksijen, Enerji, Süre, Doz göstergeleri akıyor | "Walk it on terrain built from Curiosity's area, and watch the estimates drain." |
| 4 | 15–19 sn | Kask tarayıcısı: dikkat / geçilmez ve belirsizlik | "The scanner warns, and shows where the model has little evidence." |
| 5 | 19–25 sn | Kum uyarısı; rota yeniden çiziliyor | "A sand patch in the scenario. The planner finds a new route." |
| 6 | 25–30 sn | Karne: planlanan / gerçekleşen; proje adı | "Rehearse the EVA before you take it. [PROJECT NAME]." |

Not: Altyazı seslendirme metniyle aynı. Ekran kaydı demo bilgisayarında, gerçek GPU ile; süre ve çözünürlük kayıttan sonra kontrol edilecek.

---

## 4. Varsayımlar ve kaynaklar slaytının tam metni (Slayt 6 ek / yedek slayt)

**Measured (from data)**
- Terrain elevation and slope: USGS MSL Gale merged HiRISE DTM, 1 m, resampled to 2 m. DEM cell slope is not the actual walking slope; local checks report ~2–4 m residual shift after the simulator's DEM correction (`docs/sim/DEM_KAYMA.md`).
- Surface radiation: 0.210 ± 0.040 mGy/day, Curiosity RAD (Hassler et al. 2014); used as a constant background rate, not a personal dosimeter.
- Apollo lunar EVA metabolic rate: 234 kcal/h = 272 W, average over 158.7 h of EVA (Waligora & Horrigan 1975, NASA SP-368).
- Rock detection: in the first test patch ~86% of visible rocks were found; along ridges and steep slopes ~13–23% of detections are false alarms. Of 123 large candidates, 120 were ridge outcrops or shadows and 3 looked like single boulders (`ml/orbital/VALIDATION.md` §3b, §6).

**From the literature, applied to Mars (assumption)**
- Walking energy: Pandolf et al. (1977) equation, validated on Earth; NASA research uses a similar approach for EVA traverse planning (Kim et al. 2024). Our Mars adaptation is unvalidated.
- Terrain coefficients are **Earth measurements** (Soule & Goldman 1972, read through the Richmond et al. 2015 review). **The reviewed sources gave no validated terrain coefficients for human walking on Mars.** Mapping them to Martian terrain classes is our assumption: bedrock 1.0, soil 1.2, sand 2.1, boulders 1.5. The sand value sits at the low end of a second Earth measurement: walking on sand costs 2.1–2.7× more energy (Lejeune et al. 1998).
- Mars gravity: load and walking terms are scaled by 3.71 / 9.81. Real Mars walking is likely costlier, because walking cost does not fall in proportion to gravity (Farley & McMahon 1992). Our energy values are therefore **likely underestimates**, but not a proven lower bound.
- Extra load in the simulator (e.g. a collected sample) is estimated from the total mass ratio, not a full Pandolf recalculation.

**Mission planning assumptions (not medical limits)**
- EVA limits used by the app: 6 h, 2000 kcal, 420 L O₂, 30 min science stop, 30 min reserve.
- For context, not our mission limits (`docs/eva_parameters.md`): 7 h and 1800 kcal (Apollo 15–17 life support), walk-back ≤ 3.5 km (a conditional proposal in a NASA Mars suit study, Ogilvie et al. 2026). 420 L O₂ is a planning value, not a measured suit capacity.
- Radiation dose budget per EVA (60 µGy): demonstration planning value, not a NASA per-EVA limit (`docs/data/rad_rems_route.md`).
- Slope thresholds: 15° caution (Artemis south-pole traverse planning, Acta Astronautica 2023) and 20° no-go (NASA EVA lunar surface ConOps, EVA-EXP-0075: suited walking up to 20°). Both are **lunar** sources; Mars gravity is ~2.3× the Moon's, so they are planning thresholds, not validated human limits for Mars. 12° no-go on sand and the scanner thresholds remain our assumptions (`api/planner/params.py`, `docs/eva_parameters.md`).
- Rock cover: small rocks (< 1 m, below HiRISE resolution) are missed, while outcrop and shadow false alarms can inflate it; both effects exist.
- Terrain model: trained on AI4Mars (Curiosity Navcam, 2012–2019), applied to 391 Navcam frames at 128 rover stops in our area. Under our propagation method 64.6% of cells exceed the uncertainty threshold (entropy ≥ 0.6; this is not direct image coverage). Far from the stops the probabilities approach an uninformative distribution, and the interface shows an uncertainty warning. The 200 m / 800 m propagation distances are modelling choices. The model under-reports sand (2 of 7 checked stops).

**Sources:** `docs/REFERENCES.md` · `docs/metabolic_model.md` · `docs/eva_parameters.md` · `docs/data/rad_rems_route.md`

---

## 5. Proje adı: 3 öneri

Durum (2026-11-15): Teslim paketi (`docs/submission/`) **Martian Map** çalışma adını kullanıyor; nihai ad kesinleşmedi.
Aşağıdaki adlar web ve GitHub'da oyun/uygulama aramasıyla kontrol edildi (#50 yorumu); marka uygunluğu hukuken doğrulanmadı.

| Ad | Gerekçe |
|---|---|
| **GaleGuide** (önerim) | Gale Krateri'nde astronot için rehber; yarışmanın "Interplanetary Survival Guide" adıyla doğrudan örtüşüyor. |
| **Gale Rehearsal** | Ürünü tam olarak anlatıyor: Gale'de astronot görev provası. |
| **RegolithRoute** | Regolit, Mars yüzeyinin gevşek örtüsü; "Mars toprağında rota". |

Elenenler: Cairn (2026 dağcılık oyunu), SolStride (aynı adlı oyun), SharpPath (GameMaker yol bulma aracı), MarsWalk (kural).
