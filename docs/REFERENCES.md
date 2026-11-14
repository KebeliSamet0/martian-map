# Kullanılan kaynaklar (teslimde References alanına girecek)

## NASA verileri
- JPL Mars Trek — https://trek.nasa.gov/mars/
- USGS-NASA Planetary Geologic Mapping — https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars
- Curiosity's proposed path up Mount Sharp — https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/
- USGS MSL Gale 25 cm Orthophoto Mosaic v3 — https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif
- AI4Mars (Zenodo, CC BY 4.0) — https://zenodo.org/records/15995036 · HF: https://huggingface.co/datasets/hassanjbara/AI4MARS
- MRO CRISM MTRDR (`MRO-M-CRISM-5-RDR-MPTARGETED-V1.0`), PDS Geosciences Node — https://pds-geosciences.wustl.edu/mro/mro-m-crism-5-rdr-mptargeted-v1/ · örnek gözlem FRT0000B6F1 (browse PHY/HYD) · arama: Mars Orbital Data Explorer https://ode.rsl.wustl.edu/mars/
- Tanaka et al. (2014), Geologic Map of Mars, USGS SIM 3292, 1:20M. https://doi.org/10.3133/sim3292 — yalnız bölgesel bağlam; Gale ölçeği için yetersiz.
- NASA/JPL (2025), NASA's Curiosity Rover Sees Martian 'Spiderwebs' Up Close (boxwork) — https://www.jpl.nasa.gov/news/nasas-curiosity-rover-sees-martian-spiderwebs-up-close/
- NASA (2025), NASA's Curiosity Mars Rover Starts Unpacking Boxwork Formations — https://www.nasa.gov/centers-and-facilities/nasas-curiosity-mars-rover-starts-unpacking-boxwork-formations/
- NASA/JPL PIA26306, HiRISE Views Mount Sharp's Boxwork — https://photojournal.jpl.nasa.gov/catalog/PIA26306

## Yazılım
- MBARS (MIT) — https://github.com/dhood14/MBARS
- Hugging Face Docker Spaces — https://huggingface.co/docs/hub/spaces-sdks-docker (Docker SDK ve 7860 portu, 2026-11-14)

## Makaleler
- Hood et al. 2022, MBARS, Earth and Space Science 9(9), doi:10.1029/2022EA002410
- Prieur et al. 2023, BoulderNet, JGR Planets, doi:10.1029/2023JE008013
- Golombek et al. 2012, Selection of the MSL landing site, Space Sci. Rev., doi:10.1007/s11214-012-9892-2
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
(eklenecek)

## RAD / REMS / rota veri keşfi

- Hassler vd., Mars yüzey radyasyonu — https://doi.org/10.1126/science.1244797
- Ehresmann vd., güneş minimumunda RAD — https://doi.org/10.1016/j.icarus.2022.115035
- Zeitlin vd., Eylül 2017 yüzey SEP dozu — https://doi.org/10.1029/2018GL077760
- NASA PDS RAD RDR — https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=MSL-M-RAD-3-RDR-V1.0
- NASA PDS REMS arşivi — https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/
- NASA PDS PLACES lokalizasyonları — https://planetarydata.jpl.nasa.gov/img/data/msl/msl_places/data_localizations/
- NASA-STD-3001 radyasyon sınırları — https://www.nasa.gov/reference/4-0-human-performance/
- Ürün etiketleri, erişim ayrıntıları ve ek birincil kaynaklar: [RAD/REMS/rota raporu](data/rad_rems_route.md).
- Milliken, R. E., Grotzinger, J. P., Thomson, B. J. (2010), Paleoclimate of Mars as captured by the stratigraphic record in Gale Crater. GRL 37, L04201. https://doi.org/10.1029/2009GL041870 — Mount Sharp'ta kil → sülfat geçişi.
- Anderson, R. B., Bell, J. F. III (2010), Geologic mapping and characterization of Gale Crater… Mars 5, 76–128. https://doi.org/10.1555/mars.2010.0004
- Fraeman, A. A. et al. (2013), A hematite-bearing layer in Gale Crater, Mars: Mapping and implications for past aqueous conditions. Geology 41(10), 1103–1106. https://doi.org/10.1130/G34613.1 — hematit sırtı (Vera Rubin).
- Viviano-Beck, C. E. et al. (2014), Revised CRISM spectral parameters and summary products based on the currently detected mineral diversity on Mars. JGR Planets 119, 1403–1431. https://doi.org/10.1002/2014JE004627 — MTRDR browse ürünlerinin (PHY, HYD, FEM…) tanımı.
- Fraeman, A. A. et al. (2016), The stratigraphy and evolution of lower Mount Sharp from spectral, morphological, and thermophysical orbital data sets. JGR Planets 121, 1713–1736. https://doi.org/10.1002/2016JE005095 — alt Mount Sharp birim haritası (MF1–3, PhU, HR, SS, LS). [Açık erişim](https://pmc.ncbi.nlm.nih.gov/articles/PMC5101845)
- Fraeman, A. A. et al. (2020), Synergistic Ground and Orbital Observations of Iron Oxides on Mt. Sharp and Vera Rubin Ridge. JGR Planets 125, e2019JE006294. https://doi.org/10.1029/2019JE006294 — yörünge/zemin hematit karşılaştırması.
- Sheppard, R. Y., Milliken, R. E., Parente, M., Itoh, Y. (2021), Updated Perspectives and Hypotheses on the Mineralogy of Lower Mt. Sharp, Mars, as Seen From Orbit. JGR Planets 126(2). https://doi.org/10.1029/2020JE006372
- Fedo, C. M. et al. (2022), Geology and Stratigraphic Correlation of the Murray and Carolyn Shoemaker Formations Across the Glen Torridon Region, Gale Crater. JGR Planets. [NTRS PDF](https://ntrs.nasa.gov/api/citations/20230001590/downloads/JGR%20Planets%20-%202022%20-%20Fedo%20-%20Geology%20and%20Stratigraphic%20Correlation%20of%20the%20Murray%20and%20Carolyn%20Shoemaker%20Formations%20Across%20the.pdf)
- Curiosity's Investigation of the Distinctive "Boxwork" Interval in Gale Crater, Mars. GSA Connects 2025 özeti — https://gsameetings.secure-platform.com/connects25/solicitations/103002/sessiongallery/schedule/items/95386/application/10634 — boxwork LSu içinde; temas sol 4534.
- Pandolf, K. B., Givoni, B., Goldman, R. F. (1977), Predicting energy expenditure with loads while standing or walking very slowly. J. Appl. Physiol. 43(4), 577–581. https://doi.org/10.1152/jappl.1977.43.4.577 — metabolik model formülü.
- Kim, K. J. et al. (2024), Improving Metabolic Workload Estimation Accuracy for Planning and Analyzing Exploration Traverses. IEEE EMBC 2024, NASA JSC. https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf
- Santee, W. R. et al. (2001), A proposed model for load carriage on sloped terrain. Aviat. Space Environ. Med. 72(6), 562–566. — iniş düzeltmesi.
- Farley, C. T., McMahon, T. A. (1992), Energetics of walking and running: insights from simulated reduced-gravity experiments. J. Appl. Physiol. 73(6), 2709–2712.
- Ogilvie, R. et al. (2026), Mars Spacesuit Mass Requirements. ICES-2026-127, NASA JSC. https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf — skafandr kütlesi, yürüme hızı, eve dönüş sınırı, metabolik hızlar.
- Waligora, J. M., Horrigan, D. J. (1975), Metabolism and heat dissipation during Apollo EVA periods. Biomedical Results of Apollo, NASA SP-368. https://ntrs.nasa.gov/api/citations/19760005584/downloads/19760005584.pdf — Apollo EVA ortalaması 234 kcal/sa (272 W), PLSS 7 sa / 1800 kcal.
- Norcross, J. et al. (2009), Feasibility of Performing a Suited 10-km Ambulation on the Moon — Final Report of the EVA Walkback Test (EWT). NASA/TP-2009-214796.
- NASA Curiosity Blog, Sols 4867–4872: Sand Fill in Antofagasta Crater and Finding Our Next Drill Target (2026) — https://science.nasa.gov/blog/curiosity-blog-sols-4867-4872-sand-fill-in-antofagasta-crater-and-finding-our-next-drill-target
- NASA Curiosity Blog, Sols 4873–4878: Welcome to the Atacama Drill Target (2026) — https://science.nasa.gov/blog/curiosity-blog-sols-4873-4878-welcome-to-the-atacama-drill-target/ — boxwork sonrası ilk katmanlı sülfat sondajı (sci_4).
- NASA Curiosity Blog, Sols 4886–4892: Ingenuity and Perseverance, Curiosity Style (2026) — https://science.nasa.gov/blog/curiosity-blog-sols-4886-4892-ingenuity-and-perseverance-curiosity-style/ — Toro / Inca de Oro dokanağı.
- Swan, R. M. et al. (2021). AI4MARS: A Dataset for Terrain-Aware Autonomous Driving on Mars. CVPR Workshops (AI4Space).
- Soule, R. G., Goldman, R. F. (1972), Terrain coefficients for energy cost prediction. J. Appl. Physiol. 32(5), 706–708. — zemin katsayıları (Dünya ölçümü; Mars için ölçülmüş değer yok).
- Richmond, P. W., Potter, A. W., Santee, W. R. (2015), Terrain Factors for Predicting Walking and Load Carriage Energy Costs: Review and Refinement. J. Sport Hum. Perform. 3(3). https://jhp-ojs-tamucc.tdl.org/jhp/article/view/67
- Kim, K. J. et al. (2023), Uneven terrain affects metabolic cost and gait in simulated complex lunar surfaces. Physiol. Meas. 44(10), 104001. https://doi.org/10.1088/1361-6579/acf993 — NASA Rock Yard, karışık arazi +%58.
- Johnson, A. W. et al. (2010), An Integrated Traverse Planner and Analysis Tool for Planetary Exploration (SEXTANT). AIAA SPACE 2010. https://web.mit.edu/aeroastro/www/people/dnewman/pdf2/DJN_AJohnsonSPACEAUG2010.pdf
- Quaternius, Astronaut (animated glTF model), CC0 1.0 — https://poly.pizza/m/3hC2i0CTuO — simülatördeki astronot modeli (`sim/ASSETS.md`).
- three.js r160 (GLTFLoader, BufferGeometryUtils), MIT — https://threejs.org/ — simülatör 3D motoru.
