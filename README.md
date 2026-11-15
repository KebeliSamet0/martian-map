# Martian Map

**Rehearse a Mars spacewalk before you take it.**
Team SÜNOVA · NASA Space Apps Challenge 2026 · Konya, Türkiye · Challenge: *Interplanetary Survival Guide: Martian Map*

▶ **30-second demo video:** VIDEO_LINK

Martian Map is an astronaut EVA rehearsal simulator on real Mars terrain (Gale Crater, the Mount Sharp boxwork area Curiosity explored in 2025–2026). The astronaut reads a briefing, compares three planned routes by time, energy, oxygen and radiation dose, and walks the chosen one in 3D while the life-support budget drains. The route is re-planned live from wherever the astronaut stands. A helmet camera opens Curiosity's real Navcam photo of that spot with our terrain model's reading on top, and a scanner marks caution / no-go ground and places where the model has little evidence.

Every number in the app comes from NASA data, a published equation or a labelled planning assumption. Full project text: [`docs/submission/PROJECT.md`](docs/submission/PROJECT.md).

## Run it (any machine, 2 commands)

Needs Python 3.10+ (Node.js optional, only for the web map). All terrain tiles, layers, Navcam frames and masks are in the repo.

```sh
git clone https://github.com/KebeliSamet0/martian-map.git && cd martian-map
bash scripts/setup.sh     # once: .venv + API dependencies
bash scripts/dev.sh       # planner API :8000 + simulator :8001
```

Open **http://127.0.0.1:8001/sim/?lang=en** (Turkish UI without `?lang=en`). Controls: W A S D walk, L scanner, C helmet camera, G/V Navcam card, Esc menu, ? help.

## How it works

```
HiRISE DTM 1 m + orthophoto 25 cm ──► slope, rock cover (shadow-based detector)  ─┐
Curiosity Navcam (391 frames) ──► AI4Mars-trained DeepLabv3+ ──► terrain class   ─┼─► walking-energy cost map ─► FastAPI planner ─► 3D simulator
Curiosity RAD, CRISM, MMGIS track ──► dose rate, geology, validation             ─┘     (Pandolf + terrain factors,   (3 routes, live re-plan,     (HUD, scanner,
                                                                                         Apollo 272 W calibration)    /route /replan /compare)    helmet camera)
```

| Part | Folder | What it does |
|---|---|---|
| Data pipeline | `pipeline/` | DTM, orthophoto, slope, grid, CRISM, Curiosity track and stops |
| Terrain model | `ml/rover_terrain/` | DeepLabv3+ (ResNet34) on AI4Mars, MC Dropout uncertainty, Navcam masks, ONNX export |
| Rock detector | `ml/orbital/` | Shadow-based rock detection on HiRISE, with validation |
| Planner API | `api/` | Cost model, routing (20° no-go, rock blocking), re-planning, assumptions endpoint |
| Simulator | `sim/` | Three.js 3D walk, life support, live route, scanner, helmet camera, debrief |
| Web map | `web/` | React + Leaflet route map |
| Documents | `docs/` | Sources, metabolic model, EVA parameters, validation, submission |

Model card: [`docs/submission/MODEL_CARD.md`](docs/submission/MODEL_CARD.md) · References: [`docs/submission/REFERENCES.md`](docs/submission/REFERENCES.md) · Data sources and assumptions: [`docs/sim/VERI_KAYNAKLARI.md`](docs/sim/VERI_KAYNAKLARI.md)

## Honest limits
- Slope limits (15° caution, 20° no-go) and the energy model come from Earth and lunar studies; they are not validated for suited humans on Mars and are labelled as planning assumptions.
- The terrain model under-calls thin dark sand in this region; sand in the demo mission is scenario-defined.
- Small rocks and ground texture in the 3D view are synthetic and labelled; the terrain shape is real HiRISE data.
- Not a flight or operations tool.

## Tests
```sh
.venv/bin/python -m pytest -q      # planner API
node --test sim/tests/             # simulator logic
.venv/bin/python scripts/smoke.py  # end-to-end /route + /replan on real layers
```

## Team SÜNOVA
Selçuk University, Konya. Samet (lead, planner API, integration), Elif Rana (data pipeline), Emre (terrain model), Bora (rock and sand detection), Veysel (simulator interface and game flow), Batu (3D simulator, scanner, routing), Elif Nisa (science documents, sources, presentation).

## Credits and license
Code: MIT ([LICENSE](LICENSE)). NASA data and images: NASA/JPL-Caltech, NASA/JPL/University of Arizona, USGS; see references. Third-party assets (CC0 astronaut model by Quaternius, three.js MIT): [`sim/ASSETS.md`](sim/ASSETS.md). No NASA logos are used.

---

**Türkçe kısa kurulum:** `bash scripts/setup.sh && bash scripts/dev.sh` → http://127.0.0.1:8001/sim/ · Çalışma kuralları: [CONTRIBUTING.md](CONTRIBUTING.md) · HF Space yayını: [api/DEPLOY.md](api/DEPLOY.md)
