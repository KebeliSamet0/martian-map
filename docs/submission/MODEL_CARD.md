# Terrain model card (5-line summary)

- **Data:** AI4Mars (Curiosity Navcam; volunteer and expert labels), 14,453 train / 1,611 val images; 322 expert-labelled test images. Applied to 391 Navcam frames at 128 stops, sols 4580–4848.
- **Architecture:** DeepLabv3+ with a ResNet34 encoder (ImageNet pre-trained), four classes (soil, bedrock, sand, big rock), MC Dropout (20 passes) for uncertainty; a small U-Net masks the rover body and ground beyond 30 m.
- **Training:** 12 epochs, class-weighted loss (big rock ×2.56), about 2 h on one laptop GPU.
- **Validation:** expert test (3 experts agree): mIoU 0.798, large-rock recall 0.973, calibration error (ECE) 0.004; volunteer val mIoU 0.832. Eyeballed on 18 stops: dominant class right at 16, sand caught at 2 of 7 sandy stops. Stop-level uncertainty does not tell hits from misses (hits 0.21 vs misses 0.18).
- **Limits:** under-calls thin dark sand in this region; large-rock false alarms (IoU 0.294); trained on 2012–2019 terrain, no expert labels for the 2025 boxwork; evidence only along the rover route (map cells far from a stop say "model not sure"). Sources: `ml/rover_terrain/METRICS.md`, `SCAN_CHECK.md`, `SAND_ANALYSIS.md`.
