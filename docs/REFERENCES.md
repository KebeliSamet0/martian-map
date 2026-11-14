# Kullanılan kaynaklar (teslimde References alanına girecek)

## NASA verileri
- JPL Mars Trek — https://trek.nasa.gov/mars/
- USGS-NASA Planetary Geologic Mapping — https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars
- Curiosity's proposed path up Mount Sharp — https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/
- AI4Mars (Zenodo, CC BY 4.0) — https://zenodo.org/records/15995036 · HF: https://huggingface.co/datasets/hassanjbara/AI4MARS

## Yazılım
(eklenecek)

## Makaleler
- Hassler et al. (2014), Mars’ Surface Radiation Environment Measured with the Mars Science Laboratory’s Curiosity Rover. Science 343, 1244797. https://doi.org/10.1126/science.1244797 — Gale yüzeyi GCR soğurulan doz ortalaması 0.210 ± 0.040 mGy/gün; EVA modeli sabit 0.21 kullanır. [Tam metin](https://www.scienceintheclassroom.org/sites/default/files/research-papers/1244797.full_.pdf).

## Gale DTM, ızgara ve rover durakları (Elif Rana, issue #19)

### NASA / USGS verileri
- Calef, F. J. III & Parker, T. (2016), **MSL Gale Merged DEM 1m** (v3, `MSL_Gale_DEM_Mosaic_1m_v3`), USGS Astrogeology / PDS Annex — https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m · dosya: https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_DEM_Mosaic_1m_v3.tif — `layers/elevation.npy`, `layers/slope.npy` kaynağı (HiRISE/CTX/HRSC stereo, MOLA'ya bağlı).
- Calef, F. J. III & Parker, T. (2016), **MSL Gale Merged Orthophoto Mosaic 25cm** (v3, `MSL_Gale_Orthophoto_Mosaic_25cm_v3`), USGS Astrogeology — https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm · dosya: https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif — `layers/ortho_*.png` kaynağı.
- NASA/JPL MMGIS, **Curiosity waypoint'leri** (site, drive, lat/lon, easting/northing, yükseklik, tilt) — https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json · harita: https://science.nasa.gov/mission/msl-curiosity/location-map/ — bölge seçimi, rover durak konumları (site orijini + xyz), DEM yükseklik doğrulaması.
- NASA/JPL **MSL ham görüntüleri** (Navcam, MAHLI, ChemCam RMI) — API: https://mars.nasa.gov/api/v1/raw_image_items · galeri: https://mars.nasa.gov/msl/multimedia/raw-images/ — `layers/rover_stops_selected.json` görüntüleri, `layers/science_stops.json` inceleme yoğunluğu. Görüntü kredisi: NASA/JPL-Caltech (MSSS, LANL/CNES).
- JPL Mars Trek katmanları: *MRO HiRISE, Gale Crater DEM* ve *MRO HiRISE, Curiosity Roving Site Mosaic* — https://trek.nasa.gov/mars/ — kapsama kontrolü.

### Yazılım
- GDAL (`/vsicurl/` pencere okuma) — https://gdal.org · rasterio — https://rasterio.readthedocs.io · pyproj — https://pyproj4.github.io/pyproj/
- NumPy — https://numpy.org · Pillow — https://python-pillow.org · Matplotlib — https://matplotlib.org
- Google Colab — https://colab.research.google.com
