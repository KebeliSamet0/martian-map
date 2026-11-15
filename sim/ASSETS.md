# Simülasyon varlıkları ve lisansları (2026-11-14)

Proje herkese açık yayımlanacak; buraya yalnız kamu malı, CC0 ya da CC-BY varlık girer. Her satır: dosya, kaynak, yazar, lisans, kullanım.

| Dosya | Kaynak | Yazar | Lisans | Kullanım |
|---|---|---|---|---|
| `sim/assets/characters/astronaut.glb` | https://poly.pizza/m/3hC2i0CTuO | Quaternius | CC0 1.0 | Üçüncü şahıs astronot (iskeletli; Idle, Walk, Run, Interact klipleri). Malzeme renkleri `astronaut.js` içinde skafandr paletine çevrilir. |
| `sim/lib/addons/loaders/GLTFLoader.js` | three@0.160.0 `examples/jsm` | three.js yazarları | MIT | glTF yükleyici (sim/lib/three.module.js r160 ile aynı sürüm) |
| `sim/lib/addons/utils/BufferGeometryUtils.js` | three@0.160.0 `examples/jsm` | three.js yazarları | MIT | GLTFLoader bağımlılığı |
| `sim/lib/addons/postprocessing/*`, `shaders/*`, `math/SimplexNoise.js` | three@0.160.0 `examples/jsm` | three.js yazarları | MIT | Ard işlem zinciri (`sim/app/fx.js`): EffectComposer, GTAO, bloom, OutputPass, SMAA |
| `sim/data/crism/frt0000b6f1_hyd.png` | MRO CRISM MTRDR browse FRT0000B6F1 HYD (PDS Geosciences), 692 KB | NASA/JPL/JHUAPL | Kamu malı (NASA PDS) | Harita ve 3B yarı saydam spektral katman; `sim/data/science_crism.json` bundan üretilir (`sim/tools/crism_stops.py`). |
| `sim/data/navcam_all/<durak>/*.jpg` (git dışı; `sim/tools/fetch_navcam.py`), manifest `sim/data/navcam_manifest.json` | NASA MSL ham görüntü arşivi https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/SOL5/opgs/edr/ncam/AD.JPG | NASA/JPL-Caltech (Curiosity Navcam) | Kamu malı (NASA) | Kask kamerası (`helmetcam.js`): Curiosity'nin durak başına çektiği gerçek kareler; 391 kareden 390'ı indirilir, 1024 px JPEG kalite 80, toplam ~111 MB. Bir kare (NLB_816331121EDR_F1200082NCAM00309M_, msl_s120_d0082) arşivde 403 döner, atlanır. |
