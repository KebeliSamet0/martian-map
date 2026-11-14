# Martian Map: project page text (EN)

> Working name: **Martian Map** (repo name). Candidate final names from `docs/sunum_taslak.md` §5: GaleGuide, Gale Rehearsal, RegolithRoute. Replace `[PROJECT NAME]` once the team votes.
> Every number below carries its source in `[brackets]` (paths are relative to the repo root).

## Summary
Martian Map is an astronaut mission rehearsal simulator on real Mars terrain. Before a spacewalk (EVA), the astronaut reads a briefing, picks one of three planned routes (shortest, balanced, safest) and walks it in 3D across the Gale Crater / Mount Sharp boxwork area where Curiosity worked in 2025–2026. Oxygen, energy, time and radiation dose drain live. A helmet scanner marks the ground as safe, caution, no-go or "model not sure". If sand shows up on the route, the route is re-planned on the spot, and a debrief compares plan with outcome.

Every number comes from NASA data, a cited model, or an assumption that the app labels as an assumption. Terrain is the USGS HiRISE DTM (1 m). A terrain-class model trained on AI4Mars and our own orbital rock detector feed a published walking-energy equation, so each route segment carries a reason and a confidence value. This is a research and rehearsal tool, not a flight-certified planner.

## How it works
1. **Data layers** (`pipeline/`, `ml/`): slope from the HiRISE DTM; rock density from a shadow-based detector on the HiRISE orthophoto; terrain class probabilities (soil / bedrock / sand / big rock) with an uncertainty value from a model trained on AI4Mars and applied to Curiosity Navcam frames. [`docs/data/gale_dtm_ortho.md`, `ml/rover_terrain/LAYERS.md`]
2. **Cost map and planner** (`api/`, FastAPI): per-cell suited walking cost (Pandolf equation) and walking time, then three route presets with per-segment reasons. [`docs/metabolic_model.md`]
3. **Simulator** (`sim/`, Three.js): the player walks the chosen route; the simulator reads every budget number from the planner API. The helmet scanner shows the terrain class and the model's confidence; a sand event triggers `/replan`.
4. **Debrief:** planned versus actual time, energy, oxygen and dose, and a grade.

Three missions on the same terrain (`sim/data/missions.json`): S1 easy (Boxwork to Atacama drill site), S2 medium ("Sandy shortcut"), S3 hard (oxygen limited to 80 L).

## What makes it different
Most route tools draw a line on a map. Martian Map links a chain that the astronaut can see and question:

**learned terrain class + rock abundance → suit metabolic cost (terrain coefficient) → explained route segments + model confidence**

- The terrain class (`p_soil, p_sand, p_bedrock, p_bigrock`) comes from a model trained on NASA rover labels (AI4Mars); rock abundance (`rock_cfa`) comes from our own HiRISE detector.
- Both change the metabolic cost of a segment, and the segment card says why.
- The model's uncertainty (`entropy`) is shown, not hidden: where there is no Navcam evidence the scanner says "model not sure" instead of guessing. About 65% of the map is in that state. [`ml/rover_terrain/LAYERS.md`: 64.6% of cells with entropy ≥ 0.6]
- Everything synthetic in the simulator (procedural ground detail) is labelled "synthetic" and can be switched off with the "pure data" mode. [`docs/sim/VERI_KAYNAKLARI.md` §4]

## NASA data used
| Type | Dataset | What we use it for | Source |
|---|---|---|---|
| Topographic | USGS MSL Gale Merged DEM 1 m v3 (HiRISE-based; Calef & Parker 2016) | terrain mesh, slope, route cost | `docs/REFERENCES.md` |
| Optical | USGS MSL Gale Orthophoto Mosaic 25 cm v3 (HiRISE) | surface colour, orbital rock detection | `docs/REFERENCES.md` |
| Optical | Curiosity Navcam raw images (NASA/JPL), 391 frames at 128 stops, sols 4580–4848 | terrain-class model input and scanner check | `ml/rover_terrain/LAYERS.md` |
| Rover truth | NASA/JPL MMGIS Curiosity waypoints and traverse | stops, route validation, DEM check | `docs/validation_msl.md` |
| Labels | AI4Mars (NASA rover images labelled by volunteers and experts; Swan et al. 2021) | terrain-class model training and testing | `ml/rover_terrain/METRICS.md` |
| Radiation | Curiosity RAD surface dose: 0.210 ± 0.040 mGy/day (Hassler et al. 2014) | live dose gauge (constant rate, 8.75 µGy/h) | `docs/REFERENCES.md`, `docs/sim/VERI_KAYNAKLARI.md` §2 |
| Spectral | MRO CRISM MTRDR browse products (target FRT0000B6F1) | geology context for science stops | `docs/data/crism_geology.md` |
| Human factors | NASA suit and EVA data: Apollo EVA metabolic rate 234 kcal/h = 272 W (SP-368); Mars suit study (Ogilvie et al. 2026) | cost model calibration and limits | `docs/eva_parameters.md` |

Honest note on the spectral layer: CRISM covers the northern and north-western foot of lower Mount Sharp; whether it covers the exact boxwork box is unknown, and the products are raw and noisy, so science stops are placed from published unit maps (Fraeman et al. 2016) instead of a pixel-level CRISM layer. [`docs/data/crism_geology.md` §3]
The radiation gauge uses a historical Curiosity background rate at a constant value; it is not a measurement along the route. [`docs/sim/VERI_KAYNAKLARI.md` §6]

## Validation (honest numbers)
- **Curiosity traverse comparison.** Same endpoints (straight line 2019.8 m): Curiosity drove 3887.6 m (science detours), our three routes are 2256.2 / 2270.9 / 2297.0 m, on average ~140 m from Curiosity's track. This run used slope and rock density only (no terrain-class model yet), so it is a sanity check, not proof. [`docs/validation_msl.md` §2]
- **Terrain model, expert-labelled AI4Mars test (322 images, pixels where 3 experts agree).** mIoU 0.798, large-rock recall 0.973, calibration error (ECE) 0.004. The price of high large-rock recall is false alarms: large-rock IoU is only 0.294. Where only one expert labelled, mIoU is 0.669. [`ml/rover_terrain/METRICS.md`, Gate 2]
- **Scanner against Navcam, 6 stops, eyeballed by the team.** 3 matched, 1 partly, 2 missed. Not independent ground truth. [`ml/rover_terrain/SCAN_CHECK.md`]
- **Sand is the weak spot.** On a manual check of 18 stops, the model gave a sand share ≥ 0.2 at only 2 of the 7 stops where sand is visible. This is why the sand event and `/replan` exist in the simulator. [`ml/rover_terrain/LAYERS.md`]
- **Rock detector.** On a ridge-free test patch, 30 of 30 sampled detections were real and it found 86% of visible rocks (131 of 153). On a blind check near the Curiosity route and on steep slopes, 77% of 30 candidates were rocks (23 yes, 4 no, 3 unsure), so the map can be inflated by 13–23% there. Errors are on the safe side: the planner avoids too much, not too little. [`ml/orbital/VALIDATION.md` §1–3b]
- **DTM check.** Heights compared at 144 Curiosity waypoints after correcting a shift of about +30.7 m east / +33.5 m south. [`docs/sim/DEM_KAYMA.md`, `docs/sim/VERI_KAYNAKLARI.md` §4]

## Limitations
- **Mars walking cost is assumed.** The Pandolf equation and the terrain coefficients (bedrock 1.0, soil 1.2, sand 2.1, big rock 1.5) are Earth measurements (Soule & Goldman 1972; sand 2.1–2.7× in Lejeune et al. 1998). No Mars-measured values exist; the mapping to Martian terrain is our assumption. [`docs/metabolic_model.md`]
- **Energy is a lower bound.** Gravity scaling (3.71 / 9.81) is not a validated law: walking cost falls much less than gravity does (Farley & McMahon 1992). NASA's Mars suit design average is 352 W versus the 272 W Apollo average we calibrate to. [`docs/sim/VERI_KAYNAKLARI.md` §2, §6]
- **Limits are planning assumptions, not medical limits:** 6 h, 2000 kcal, 420 L O₂, 30 min reserve; slope 15° caution / 25° no-go. Sourced alternatives (7 h, 1800 kcal, 370 L) are listed but not applied. The dose budget per EVA is a demo value, not a NASA limit. [`docs/eva_parameters.md`, `docs/sim/VERI_KAYNAKLARI.md` §3]
- **Terrain model domain shift.** Trained on Curiosity Navcam 2012–2019; there are no expert labels for the 2025 boxwork area. It over-calls large rock on textured outcrops and under-calls sand. [`ml/rover_terrain/METRICS.md`]
- **2 m DEM exaggerates ridge-edge slopes** (35 cells on Curiosity's own track read ≥ 25°), so red does not always mean dangerous. [`docs/validation_msl.md` §4]
- **Rock cover counts only rocks ≥ 1 m** (HiRISE resolution): a lower bound.
- The simulator is not a flight or operations approval tool.

## Team
Selçuk University, Konya (Türkiye), NASA Space Apps Challenge 2026, challenge "Interplanetary Survival Guide: Martian Map". Roles per `README.md`:
- Samet: planner API, cost model, product
- Elif Rana: data pipeline (DTM, orthophoto, slope, grid, CRISM)
- Emre: terrain-class model (AI4Mars, MC Dropout)
- Bora: HiRISE rock detection and validation
- Veysel: web interface
- Batu: 3D simulator
- Elif Nisa: documentation, sources, presentation

## AI usage disclosure
> Draft: team to confirm before submission.
- **AI as a method:** the terrain-class model is a DeepLabv3+ (ResNet34) network trained on the AI4Mars dataset; uncertainty from MC Dropout. The rock detector is classical image processing (shadow-based), not machine learning.
- **AI as a tool:** the team used AI coding and writing assistants (Claude Code) for parts of the code, tests and documents. Team members reviewed outputs; the numbers in this text were checked against the files cited next to them.
- **Not generated by AI:** all NASA data, the Curiosity track, the Navcam frames and the published equations are taken from their sources, not generated.
- **Assets:** astronaut model by Quaternius (CC0); three.js (MIT). See `sim/ASSETS.md`. NASA logos are not used.
