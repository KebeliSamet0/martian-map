# Martian Map: 7 slides (EN)

Rules: max 7 slides, English, public links, a References field with at least one NASA dataset. Screenshot IDs (`[SHOT-…]`) are placeholders until the other desks deliver frames; the repo figures listed already exist.
Each number carries its source in `[brackets]`.

## 1. Problem
**Title:** Every step on Mars spends oxygen you cannot get back
- Mars gravity is 3/8 of Earth's, yet walking in a suit there is hard; suit mass and walk-back distance are design limits. [`docs/REFERENCES.md`: Ogilvie et al. 2026]
- Terrain sets the cost: sand costs 2.1–2.7× the energy of firm ground (Earth measurement). [Lejeune et al. 1998]
- Route tools draw a line. They do not let you feel the budget, or show *why* and *how sure*.
- **Image:** `layers/ortho_2m.png` (Gale boxwork area, 2 × 2 km, HiRISE orthophoto).

## 2. Solution
**Title:** Rehearse the EVA before you take it
- Pick one of three routes; each has a time, energy, oxygen and dose budget.
- Walk it in 3D on Curiosity's real terrain; the gauges drain live.
- The helmet scanner shows what the terrain model knows and what it does not.
- **Image:** `[SHOT-HUD]` one frame: 3D terrain, four gauges (O₂, energy, time, dose), scanner overlay.

## 3. Data
**Title:** Built on NASA data from where Curiosity actually drove
- Topographic + optical: USGS MSL Gale HiRISE DTM (1 m) and orthophoto (25 cm). [`docs/REFERENCES.md`]
- Rover truth: Curiosity waypoints, 391 Navcam frames at 128 stops, AI4Mars labels. [`ml/rover_terrain/LAYERS.md`]
- Radiation: Curiosity RAD, 0.210 ± 0.040 mGy/day (constant-rate gauge); spectral: CRISM for science-stop context. [Hassler et al. 2014; `docs/data/crism_geology.md`]
- **Image:** `docs/data/img/gale_dtm_ortho_preview.png` + `layers/msl_proposed_path.json` overlay. Optional: `[SHOT-DATA-LAYERS]` four-tile figure (DTM, ortho, Navcam, radiation).

## 4. The chain (what is different)
**Title:** From orbital pixels to an explained route
- Learned terrain class (AI4Mars model) + rock abundance (our HiRISE detector) set each cell's terrain coefficient.
- Pandolf walking-energy equation, calibrated to the Apollo EVA average of 272 W, gives cost per segment. [`docs/metabolic_model.md`; SP-368]
- Every segment shows its reason and the model's confidence; low confidence is shown as "model not sure".
- **Image:** flow diagram (DTM → slope · HiRISE → rocks · Navcam → terrain class → cost map → 3 routes → simulator) plus `[SHOT-SEGMENT-CARD]`. Support: `docs/figures/rover_terrain_examples.png`.

## 5. One mission, start to finish
**Title:** Briefing, route, walk, scan, surprise, debrief
- S1: boxwork ridges to the Atacama drill site, about 0.55 km; shortest / balanced / safest take 18.4 / 18.7 / 19.4 min and 87 / 88 / 91 kcal in the planner. [`ml/rover_terrain/LAYERS.md`, after column]
- A sand event on the route triggers an on-the-spot re-plan; S3 limits oxygen to 80 L so the astronaut must decide to turn back. [`sim/data/missions.json`]
- The debrief compares plan with actual and gives a grade.
- **Image:** `[SHOT-ROUTES]` route choice, `[SHOT-SCAN]` scanner with "model not sure", `[SHOT-REPLAN]` sand and new route, `[SHOT-DEBRIEF]`. Live demo or video is the backup.

## 6. Validation
**Title:** Checked against reality, with the misses shown
- Curiosity drove 3.89 km (science detours); our routes between the same endpoints: 2.26–2.30 km, ~140 m from its track. [`docs/validation_msl.md` §2]
- Terrain model on the expert-labelled test: mIoU 0.798, large-rock recall 0.973, ECE 0.004. [`ml/rover_terrain/METRICS.md`]
- Scanner versus Navcam: 3 of 6 stops matched, 1 partly, 2 missed, both misses sandy. Model p_sand ≤ 0.11 at 13 sand points: sand is the weak spot. [`SCAN_CHECK.md`, `VALIDATION.md` §7]
- Calibrated (pixel ECE 0.004), marks where evidence is thin; it does not catch its own errors. Rocks: of 123 large detections, 120 were ridge outcrops or shadows, 3 boulders. [`MODEL_CARD.md`, `VALIDATION.md` §6]
- **Image:** left `docs/figures/msl_compare.png`, right `docs/figures/navcam_vs_model.png`.

## 7. Impact and next step
**Title:** Rehearse on data today, walk on Mars tomorrow
- Astronauts and mission control see the cost and risk of a route before anyone steps out; every number links to its source.
- Next: replace Earth-measured coefficients when Mars suit tests report; label the 2025 boxwork area; add live RAD/REMS along the route.
- Open data, open code. Limits are planning assumptions, not medical limits.
- **Image:** `[SHOT-DEBRIEF]` debrief screen, plus QR to the repository and demo `[LINK-TO-FILL]`.

## Backup slide (not counted in the 7 if the form allows; otherwise speaker notes)
Measured vs assumed: see `PROJECT.md` Limitations; full text in `docs/sunum_taslak.md` §4.
