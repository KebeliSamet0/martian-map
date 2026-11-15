# Martian Map: 7 slides (EN)

Rules: max 7 slides, English, public links, a References field with at least one NASA dataset. All `docs/figures/sim_*.png` frames are real screenshots from the simulator (see *Frames* at the end); no montage.
Each number carries its source in `[brackets]`.

## 1. Problem
**Title:** On Mars, the route decides how much of the life-support budget an EVA uses
- Mars gravity is 3/8 of Earth's, yet walking in a suit there is hard; suit mass and walk-back distance are design limits. [`docs/REFERENCES.md`: Ogilvie et al. 2026]
- Terrain sets the cost: sand costs 2.1–2.7× the energy of firm ground (Earth measurement). [Lejeune et al. 1998]
- Route tools draw a line. They do not let you feel the budget, or show *why* and *how sure*.
- **Image:** `layers/ortho_2m.png` (Gale boxwork area, 2 × 2 km, HiRISE orthophoto).

## 2. Solution
**Title:** Rehearse the EVA before you take it
- Pick one of three routes; each has a time, energy, oxygen and dose budget.
- Walk it in 3D on terrain built from HiRISE data where Curiosity drove; the gauges update model estimates as you walk.
- The helmet scanner gives rule-based warnings and shows where the terrain model has little evidence.
- **Image:** `docs/figures/sim_01_intro.png` (opening screen) + `docs/figures/sim_04_walk_hud.png` (3D walk, life-support gauges O₂ / energy / time / dose, model ground readout).

## 3. Data
**Title:** Built on NASA data from where Curiosity actually drove
- Topographic + optical: USGS MSL Gale HiRISE DTM (1 m) and orthophoto (25 cm). [`docs/REFERENCES.md`]
- Rover truth: Curiosity waypoints, 391 Navcam frames at 128 stops, AI4Mars labels. [`ml/rover_terrain/LAYERS.md`]
- Radiation: Curiosity RAD, 0.210 ± 0.040 mGy/day (constant-rate gauge); spectral: CRISM for science-stop context. [Hassler et al. 2014; `docs/data/crism_geology.md`]
- **Image:** `docs/data/img/gale_dtm_ortho_preview.png` + `layers/msl_proposed_path.json` overlay. Plus `docs/figures/sim_06_navcam_vs_sim.png`: real Curiosity Navcam frame (left) against the simulator view from the same stop and direction (right).

## 4. The chain (what is different)
**Title:** From orbital pixels to an explained route
- Learned terrain class (AI4Mars model) + rock abundance (our HiRISE detector) set each cell's terrain coefficient.
- Pandolf walking-energy equation, calibrated to the Apollo EVA average of 272 W, gives cost per segment. [`docs/metabolic_model.md`; SP-368]
- Every segment shows its reason and the model's confidence; where evidence is thin, the interface shows an uncertainty warning.
- Honest result: with the 20° slope limit, the full terrain model and the slope + rock planner find the same S1–S3 paths (9 of 9); the risk difference is 0–2%. The model's value shows in the helmet camera, the ground readout and its uncertainty. [`#127`, Emre]
- **Image:** flow diagram (DTM → slope · HiRISE → rocks · Navcam → terrain class → cost map → 3 routes → simulator) plus `docs/figures/sim_03_routes_compare.png` (three routes + "What does the terrain model buy you?": slope-only vs terrain model + rock). Support: `docs/figures/rover_terrain_examples.png`.

## 5. One mission, start to finish
**Title:** Briefing, route, walk, decide, sample, return, debrief
- S1: boxwork ridges to the Atacama drill site, about 0.55 km; shortest / balanced / safest take 18.4 / 18.7 / 19.4 min and 87 / 88 / 91 kcal in the planner. [`ml/rover_terrain/LAYERS.md`, after column]
- A sand patch defined in the scenario raises a decision card: accept the planner's new route or continue; S3 cuts the oxygen budget to 80 L, and the astronaut has to weigh turning back. [`sim/data/missions.json`]
- At the target the astronaut holds E to collect the sample (+8 kg), then walks back to base with the heavier load.
- The debrief compares plan with actual, lists the decisions and gives a grade.
- **Image:** `docs/figures/sim_02_missions.png` (mission cards with map preview), `docs/figures/sim_05_helmetcam.png` (helmet camera: real Navcam frame + model mask, a prediction), `docs/figures/sim_07_sand_warning.png` (sand warning, replan choice). Live demo or video is the backup.

## 6. Validation
**Title:** Checked against reality, with the misses shown
- Curiosity drove 3.89 km; our routes between the same endpoints: 2.26–2.40 km, ~130 m from its track. Geometry only; human energy and time are unvalidated. [`docs/sim/DENETIM_masa_arastirmalari_2026-11-15.md` §3]
- Terrain model on the expert-labelled test: mIoU 0.798, large-rock recall 0.973, ECE 0.004. [`ml/rover_terrain/METRICS.md`]
- Scanner versus Navcam: 3 of 6 stops matched, 1 partly, 2 missed, both misses sandy. Highest model p_sand at 13 sand candidates: 0.111; sand is the weak spot. [`SCAN_CHECK.md`, `VALIDATION.md` §7]
- Calibrated (pixel ECE 0.004), marks where evidence is thin; it does not catch its own errors. Rocks: of 123 large detections, 120 were ridge outcrops or shadows, 3 boulders. [`MODEL_CARD.md`, `VALIDATION.md` §6]
- **Image:** left `docs/figures/msl_compare.png`, right `docs/figures/navcam_vs_model.png`.

## 7. Impact and next step
**Title:** Rehearse with real terrain data today, and see the model's limits
- Astronauts and mission control can compare the cost and risk of routes before anyone steps out; measurements, model estimates and planning assumptions are labelled apart. Safety impact has not been measured.
- Next: replace Earth-measured coefficients when Mars suit tests report; label the 2025 boxwork area; add RAD/REMS records with location and time as context.
- Open code; data and asset licences listed per source. Limits are planning assumptions, not medical limits. An independent prototype using NASA data, without operational approval.
- **Image:** `docs/figures/sim_08_debrief.png` (debrief: grade, planned vs actual, what the terrain model changed), plus QR to the repository and demo `[LINK-TO-FILL]`.

## Backup slide (not counted in the 7 if the form allows; otherwise speaker notes)
Measured vs assumed: see `PROJECT.md` Limitations; full text in `docs/sunum_taslak.md` §4.

## Frames (how the screenshots were taken)
- Source: the simulator on `main` (f0431a9) plus this PR's text fixes (S3 title, sand warning), run locally with `bash scripts/dev.sh` (planner API live, not the offline fallback), Chrome on a real GPU, 1920 × 1080, `?lang=en`, mission S1, balanced route. Captured 2026-11-15 by Elif Nisa (#128).
- The walk was not skipped: the route was walked with the time scale raised; the debrief numbers (`sim_08`) come from that walk. `sim_08` is a crop of the full 1920 × 1080 frame (top of the report card only).
- The route-comparison box (`sim_03`) is the real `/compare` output of the local API. On this laptop `/compare` takes ~8 s, longer than the simulator's 8 s client timeout, so the response was cached and served on the second open. Same numbers, no edits.
- Synthetic parts stay labelled in the frames (rocks and regolith detail are synthetic; model outputs are predictions).

