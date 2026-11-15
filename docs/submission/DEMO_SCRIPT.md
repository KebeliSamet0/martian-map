# Live demo: 3 minutes (TR + EN)

Demo: mission **S1** on the final build (`sim/`, API on `:8000`). Presenter says the EN line; the TR line is for the Turkish-speaking jury or Q&A. Time marks are cumulative.

| Time | Screen / action | EN | TR |
|---|---|---|---|
| 0:00–0:20 | Slide 1–2, then briefing S1 | "An astronaut cannot rehearse a Mars walk on the real ground. We built that rehearsal, on Curiosity's terrain, with sourced numbers." | "Astronot Mars yürüyüşünü gerçek zeminde prova edemez. Biz bu provayı Curiosity'nin arazisinde, kaynaklı sayılarla yaptık." |
| 0:20–0:50 | Route planner: three routes, budgets | "Three routes: shortest, balanced, safest. Each shows time, energy, oxygen and dose, and why each segment was chosen." | "Üç rota: en kısa, dengeli, en güvenli. Her biri süre, enerji, oksijen ve doz gösteriyor; her segmentin nedeni yazıyor." |
| 0:50–1:30 | 3D walk, HUD running | "Gauges drain as we walk. Energy comes from the Pandolf equation, calibrated to Apollo EVA data, with a terrain coefficient." | "Yürürken göstergeler akıyor. Enerji, Apollo EVA verisine kalibre Pandolf denkleminden ve zemin katsayısından geliyor." |
| 1:30–2:00 | Scanner on | "The scanner reads the ground. Where the model has no evidence, it says 'model not sure' instead of guessing." | "Tarayıcı zemini okuyor. Model kanıt görmüyorsa tahmin yürütmüyor, 'model emin değil' diyor." |
| 2:00–2:20 | Sand event, re-plan | "Sand ahead. The model under-calls sand, so we re-plan from what the astronaut sees." | "Önde kum. Model kumu az tahmin ediyor; astronotun gördüğüne göre rotayı yeniden planlıyoruz." |
| 2:20–2:40 | Debrief | "Debrief: planned versus actual, and a grade." | "Karne: planlanan ve gerçekleşen, bir de not." |
| 2:40–3:00 | Slide 6 (validation) | "We checked it: Curiosity drove 3.89 km, our routes 2.3 km. Terrain model mIoU 0.798, calibrated. Scanner matched Navcam at 3 of 6 stops; the model misses sand, and its confidence does not flag its errors. We show the misses." | "Doğruladık: Curiosity 3,89 km gitti, rotalarımız 2,3 km. Zemin modeli mIoU 0,798. Tarayıcı Navcam ile 6 durakta 3 tuttu; model kumu kaçırıyor, güveni hatayı yakalamıyor. Kaçırdıklarımızı da gösteriyoruz." |

## Backup plan
1. **API down:** `./scripts/dev.sh` restarts API `:8000`, web `:5173`, sim `:8001`; smoke test `.venv/bin/python scripts/smoke.py`.
2. **Sim or GPU fails:** play `VIDEO_30S` render, then the recorded full run `[LINK-TO-FILL: screen recording]`, and narrate over it.
3. **Network down:** the sim and layers are local; use the offline route package (`api/DEPLOY.md`). Keep slides as PDF on the laptop.
4. **Everything fails:** slides 5 and 6 only, with the saved frames `[SHOT-…]`.
5. Rehearse mission S2 ("Sandy shortcut") as an alternative if S1 stalls.

## Likely questions
- *Is the energy real?* A lower bound: Earth-measured coefficients, Mars gravity scaling is unvalidated. [`docs/metabolic_model.md`]
- *Is the radiation live?* No: constant Curiosity RAD background (0.210 mGy/day), not an EVA limit. [`docs/sim/VERI_KAYNAKLARI.md` §6]
- *Why does it miss sand?* Trained on 2012–2019 Navcam; p_sand ≤ 0.11 at 13 of Bora's sand points, 2 of 7 sandy stops caught. The re-plan covers that gap.
- *Does the confidence flag errors?* No. It is calibrated (pixel ECE 0.004) and marks where evidence is thin, but hits and misses have similar stop-level uncertainty.
- *How many rocks are real?* Of 123 large detections, 120 are ridge outcrops or shadows, 3 boulders (checked by eye).
- *Is this flight-ready?* No. It is a rehearsal and decision-support research tool.
