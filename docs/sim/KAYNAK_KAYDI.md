# Proje kaynak kaydı (2026-11-15)

Amaç: Martian Map'te kullanılan, taranan ve reddedilen **her kaynağın** tek yerde izlenebilmesi. Sunum, jüri ve References bölümü bu kayda dayanır.

## Kurallar
1. Her araştırma masası taradığı HER kaynağı kendi dosyasına yazar: `docs/data/ekip/kaynaklar/<masa>.md` (gercek, gercek2, calisan2, gorevli). Sütunlar: tarih/saat · tam atıf veya dosya yolu+commit · URL/DOI · ne için bakıldı · durum (`TAM OKUNDU` · `ÖZET OKUNDU` · `OKUNAMADI-neden` · `REDDEDİLDİ-neden`) · hangi rapora girdi.
2. Okunamayan ve reddedilen kaynaklar da kaydedilir (neden dışlandığı bilinsin).
3. Mars'a özgü parametre Dünya formülüyle hesaplanmaz; Mars değeri ayrı kaynakla doğrulanır. Kurumlar (NASA, ESA, JAXA vb.) farklı değer kullanıyorsa hepsi yan yana yazılır.
4. Birincil kaynak kuralı: sayı özet/ikincil yerden alındıysa durum `ÖZET OKUNDU` yazılır; `doğrulandı` denmez.
5. Bu belge `docs/REFERENCES.md`'yi (teslimde References alanı) tamamlar; çakışma olursa REFERENCES.md esastır.

## Mars'a özgü parametreler (doğrulanacak; kaynak kataloğu gercek masasında)
| Parametre | Değer | Dünya karşılığı / not | Durum |
|---|---|---|---|
| Mars günü (sol) | 24 sa 39 dk 35.244 sn = 88775.244 s | Dünya yıldız günü ≈ 86164 s: Mars biraz **yavaş** döner, güneş günü ~%2.7 **uzun** | doğrulanacak (NASA Mars Fact Sheet) |
| Mars yılı | ≈ 668.6 sol ≈ 687 Dünya günü | | doğrulanacak |
| Yerçekimi | 3.71 m/s² (ekvator) | Dünya 9.80665 | JPL SSD (gercek_parametre_arastirmasi.md S5) |
| Eksen eğikliği, eksantriklik | 25.19°, 0.0934 | mevsim uzunlukları eşit değil | doğrulanacak |
| Basınç (Gale) | 716–961 Pa (REMS, 3 örnek sol) | Dünya ~101325 Pa | `rems_gercek_veri.md` (kendi hesabımla doğrulandı) |
| Güneş açısal çapı | 19.21′–23.17′ | Dünya ~32′ | `gunes_geometri_dogrulama.md` (hesap) |
| Zaman sistemleri | LMST / LTST / sol | Dünya saati ile karıştırılmamalı; HUD'daki süreler Dünya dakika/saatidir | uygulama notu |

## Birleşik kaynak listesi (otomatik çıkarıldı)
Aşağıdaki liste `docs/data/ekip/*.md`, `docs/sim/*.md` ve `docs/*.md` içindeki URL/DOI'lerden betikle çıkarıldı; sağ sütun kaynağı anan rapor(lar)dır. Durum bilgisi (okundu/okunamadı) masa dosyalarındadır.

| Kaynak | Anan raporlar |
|---|---|
| https://academic.oup.com/milmed/article/183/9-10/e357/5025891 | metabolic_model.md |
| https://aeolisresearch.com/papers/REMS_paper.pdf | gale_dogrulama_tur3.md |
| https://agupubs.onlinelibrary.wiley.com/doi/full/10.1002/2013JE004605 | gale_dogrulama_tur3.md |
| https://agupubs.onlinelibrary.wiley.com/doi/full/10.1002/2017JE005324 | gale_dogrulama_tur3.md |
| https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2020JE006489 | gale_dogrulama_tur3.md |
| https://akhilarora.com/2025/12/death-stranding-2-review-ps5/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://ambientcg.com/get?file=Rock009_1K-JPG.zip | gale_zemin_ortam_arastirmasi.md |
| https://ambientcg.com/get?file=Rocks012_1K-JPG.zip | gale_zemin_ortam_arastirmasi.md, varlik_manifest.md |
| https://ambientcg.com/view?id=Rock009 | gale_zemin_ortam_arastirmasi.md |
| https://ambientcg.com/view?id=Rocks012 | gale_zemin_ortam_arastirmasi.md, varlik_manifest.md |
| https://apollojournals.org/alsj/a17/a17.sta6.html | gercek_parametre_arastirmasi.md |
| https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_DEM_Mosaic_1m_v3.tif | REFERENCES.md |
| https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif | REFERENCES.md |
| https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia20/pia20755/PIA20755.jpg | varlik_manifest.md |
| https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars | REFERENCES.md |
| https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m | REFERENCES.md |
| https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm | REFERENCES.md |
| https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/ | REFERENCES.md |
| https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00001_00089/SOL00053/RME_402151514RMD00530000000_______PA.TAB | rems_gercek_veri.md |
| https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00001_00089/SOL00053/RME_402151514RMD00530000000_______PA.xml | rems_gercek_veri.md |
| https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00180_00269/SOL00191/RME_414402384RMD01910000000_______P8.TAB | rems_gercek_veri.md |
| https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00180_00269/SOL00191/RME_414402384RMD01910000000_______P8.xml | rems_gercek_veri.md |
| https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00450_00583/SOL00533/RME_444763232RMD05330000000_______P5.TAB | rems_gercek_veri.md |
| https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00450_00583/SOL00533/RME_444763232RMD05330000000_______P5.xml | rems_gercek_veri.md |
| https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/{d[ | rems_gercek_veri.md |
| https://authors.library.caltech.edu/records/ctwqe-jcm25 | gale_dogrulama_tur3.md |
| https://colab.research.google.com | REFERENCES.md |
| https://creativecommons.org/publicdomain/zero/1.0/ | varlik_manifest.md |
| https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dry_ground_01/dry_ground_01_1k.zip | gale_zemin_ortam_arastirmasi.md |
| https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_03/ | varlik_manifest.md |
| https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_03/rock_face_03_1k.zip | gale_zemin_ortam_arastirmasi.md |
| https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sand_03/ | varlik_manifest.md |
| https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sand_03/sand_03_1k.zip | gale_zemin_ortam_arastirmasi.md |
| https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/terrain_red_01/ | varlik_manifest.md |
| https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/terrain_red_01/terrain_red_01_1k.zip | gale_zemin_ortam_arastirmasi.md |
| https://docs.ambientcg.com/license/ | juri_sorulari.md |
| https://doi.org/10.1002/2013JE004488 | gale_dogrulama_tur3.md, gale_zemin_ortam_arastirmasi.md |
| https://doi.org/10.1002/2013JE004605 | gale_dogrulama_tur3.md, gale_zemin_ortam_arastirmasi.md |
| https://doi.org/10.1002/2014JE004627 | REFERENCES.md |
| https://doi.org/10.1002/2016JE005095 | REFERENCES.md |
| https://doi.org/10.1002/2017JE005324 | gale_dogrulama_tur3.md, gale_zemin_ortam_arastirmasi.md |
| https://doi.org/10.1002/rob.21481 | gale_dogrulama_tur3.md, gale_zemin_ortam_arastirmasi.md, gercek_tur2_enerji_modeli.md, kum_uyari_metinleri.md |
| https://doi.org/10.1002/rob.21647 | gale_dogrulama_tur3.md, gale_zemin_ortam_arastirmasi.md, juri_sorulari.md, kum_uyari_metinleri.md |
| https://doi.org/10.1002/rob.22011 | gale_dogrulama_tur3.md |
| https://doi.org/10.1007/s11214-012-9892-2 | REFERENCES.md |
| https://doi.org/10.1007/s11214-012-9921-1 | gale_dogrulama_tur3.md, gale_zemin_ortam_arastirmasi.md |
| https://doi.org/10.1016/j.actaastro.2024.07.006 | gercek_parametre_arastirmasi.md |
| https://doi.org/10.1016/j.icarus.2022.115035 | REFERENCES.md |
| https://doi.org/10.1029/2009GL041870 | REFERENCES.md |
| https://doi.org/10.1029/2018GL077760 | REFERENCES.md |
| https://doi.org/10.1029/2019JE006294 | REFERENCES.md |
| https://doi.org/10.1029/2020JE006372 | REFERENCES.md |
| https://doi.org/10.1029/2020JE006489 | gale_dogrulama_tur3.md |
| https://doi.org/10.1029/2022EA002410 | REFERENCES.md |
| https://doi.org/10.1029/2023JE008013 | REFERENCES.md |
| https://doi.org/10.1073/pnas.2001424117 | gale_dogrulama_tur3.md, gale_zemin_ortam_arastirmasi.md |
| https://doi.org/10.1073/pnas.2426611122 | gale_dogrulama_tur3.md |
| https://doi.org/10.1088/1361-6579/acf993 | REFERENCES.md, gercek_parametre_arastirmasi.md, metabolic_model.md |
| https://doi.org/10.1126/science.1244797 | REFERENCES.md, gercek_parametre_arastirmasi.md |
| https://doi.org/10.1126/science.aaf3206 | gale_dogrulama_tur3.md, gale_zemin_ortam_arastirmasi.md |
| https://doi.org/10.1130/G34613.1 | REFERENCES.md |
| https://doi.org/10.1152/jappl.1972.32.5.706 | gercek_parametre_arastirmasi.md |
| https://doi.org/10.1152/jappl.1977.43.4.577 | REFERENCES.md, metabolic_model.md |
| https://doi.org/10.1152/jappl.1992.73.6.2709 | gercek_parametre_arastirmasi.md, gercek_tur2_enerji_modeli.md |
| https://doi.org/10.1152/japplphysiol.00627.2024 | gercek_parametre_arastirmasi.md, gercek_tur2_enerji_modeli.md |
| https://doi.org/10.1242/jeb.201.13.2071 | REFERENCES.md, gercek_parametre_arastirmasi.md, metabolic_model.md |
| https://doi.org/10.12922/jshp.0067.2015 | gercek_parametre_arastirmasi.md |
| https://doi.org/10.1555/mars.2010.0004 | REFERENCES.md |
| https://doi.org/10.17189/vwva-ms24 | rems_gercek_veri.md |
| https://doi.org/10.3133/sim3292 | REFERENCES.md |
| https://gamermatters.com/death-stranding-2-on-the-beach-review/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://gamertweak.com/how-to-scan-death-stranding/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://games.gg/death-stranding-2-on-the-beach/guides/death-stranding-2-on-the-beach-advamced-tips-tricks/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://gamesfuze.com/game-tips/death-stranding-2-best-enhancements-to-unlock-first-apas-guide/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://gdal.org | REFERENCES.md |
| https://github.com/dhood14/MBARS | REFERENCES.md |
| https://gsameetings.secure-platform.com/connects25/solicitations/103002/sessiongallery/schedule/items/95386/application/10634 | REFERENCES.md |
| https://huggingface.co/datasets/hassanjbara/AI4MARS | REFERENCES.md |
| https://huggingface.co/docs/hub/spaces-sdks-docker | REFERENCES.md |
| https://jhp-ojs-tamucc.tdl.org/jhp/article/view/67 | REFERENCES.md, metabolic_model.md |
| https://journals.biologists.com/jeb/article-abstract/201/13/2071/7687/Mechanics-and-Energetics-of-Human-Locomotion-on?redirectedFrom=PDF | gercek_parametre_arastirmasi.md |
| https://journals.physiology.org/doi/10.1152/japplphysiol.00627.2024 | gercek_parametre_arastirmasi.md |
| https://journals.physiology.org/doi/abs/10.1152/jappl.1992.73.6.2709 | gercek_tur2_enerji_modeli.md |
| https://journals.physiology.org/doi/full/10.1152/japplphysiol.00627.2024 | gercek_tur2_enerji_modeli.md |
| https://journals.physiology.org/doi/pdf/10.1152/jappl.1972.32.5.706 | gercek_parametre_arastirmasi.md |
| https://journals.tdl.org/jhp/index.php/JHP/article/view/67 | gercek_parametre_arastirmasi.md |
| https://kojimaproductions.jp/en/DSTips | TERRAIN_SCANNER_KAYNAKLAR.md |
| https://link.springer.com/article/10.1007/s11214-012-9921-1 | gale_dogrulama_tur3.md |
| https://mars.nasa.gov/api/v1/raw_image_items | REFERENCES.md |
| https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json | msl_egim_dagilimi.md |
| https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json | REFERENCES.md |
| https://mars.nasa.gov/msl/mission-updates/curiosity-rover-crosses-mars-sand-dune/ | gale_zemin_ortam_arastirmasi.md |
| https://mars.nasa.gov/msl/multimedia/raw-images/ | REFERENCES.md |
| https://mars.nasa.gov/msl/spacecraft/rover/wheels/ | gercek_tur2_enerji_modeli.md |
| https://mars.nasa.gov/news/curiosity-rover-backs-out-of-valley/ | gale_zemin_ortam_arastirmasi.md |
| https://matplotlib.org | REFERENCES.md |
| https://ntrs.nasa.gov/api/citations/19760005584/downloads/19760005584.pdf | REFERENCES.md, eva_parameters.md, gercek_parametre_arastirmasi.md |
| https://ntrs.nasa.gov/api/citations/19760005607/downloads/19760005607.pdf | gercek_parametre_arastirmasi.md |
| https://ntrs.nasa.gov/api/citations/20160003093/downloads/20160003093.pdf | gercek_tur2_enerji_modeli.md |
| https://ntrs.nasa.gov/api/citations/20170006616/downloads/20170006616.pdf | gercek_tur2_enerji_modeli.md |
| https://ntrs.nasa.gov/api/citations/20205008200/downloads/EVA-EXP-0042%20xEVA%20System%20Con%20Ops%20Rev%20B%20Final%20dtd%2010192020_REF%20DOC.pdf?attachment=true | gercek_tur2_enerji_modeli.md |
| https://ntrs.nasa.gov/api/citations/20220010306/downloads/07-13-2022%20ICES%20Presentation%20-%20APACHE%20Physical%20Workload%20Approximation-JSLWL0520074362.pdf | gercek_parametre_arastirmasi.md |
| https://ntrs.nasa.gov/api/citations/20230001590/downloads/JGR%20Planets%20-%202022%20-%20Fedo%20-%20Geology%20and%20Stratigraphic%20Correlation%20of%20the%20Murray%20and%20Carolyn%20Shoemaker%20Formations%20Across%20the.pdf | REFERENCES.md |
| https://ntrs.nasa.gov/api/citations/20230008644/downloads/ICES_Presentation-xPLSS%20Structural%20Backplate%20Design%20Manufacture%20and%20Test%20Overview.pdf | gercek_parametre_arastirmasi.md |
| https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf | REFERENCES.md, gercek_parametre_arastirmasi.md, metabolic_model.md |
| https://ntrs.nasa.gov/api/citations/20240015813/downloads/20240015813-Dibb%20et%20al%20202X%20-%20Observed%20correlation.pdf | gale_dogrulama_tur3.md |
| https://ntrs.nasa.gov/api/citations/20250001829/downloads/ICES%202025%20TraverseModel.pdf | gercek_parametre_arastirmasi.md, gercek_tur2_enerji_modeli.md |
| https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf | REFERENCES.md, eva_parameters.md, gercek_parametre_arastirmasi.md, gercek_tur2_enerji_modeli.md, juri_sorulari.md |
| https://ntrs.nasa.gov/citations/20110003409 | gercek_parametre_arastirmasi.md |
| https://ntrs.nasa.gov/citations/20160003093 | gercek_tur2_enerji_modeli.md |
| https://numpy.org | REFERENCES.md |
| https://ode.rsl.wustl.edu/mars/ | REFERENCES.md |
| https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21481 | gale_dogrulama_tur3.md, gercek_tur2_enerji_modeli.md, kum_uyari_metinleri.md |
| https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21647 | gale_dogrulama_tur3.md, juri_sorulari.md, kum_uyari_metinleri.md |
| https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.22011 | gale_dogrulama_tur3.md |
| https://pds-geosciences.wustl.edu/mro/mro-m-crism-5-rdr-mptargeted-v1/ | REFERENCES.md |
| https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=MSL-M-RAD-3-RDR-V1.0 | REFERENCES.md |
| https://photojournal.jpl.nasa.gov/catalog/PIA16225 | gale_zemin_ortam_arastirmasi.md |
| https://photojournal.jpl.nasa.gov/catalog/PIA19401 | gale_zemin_ortam_arastirmasi.md |
| https://photojournal.jpl.nasa.gov/catalog/PIA20755 | gale_zemin_ortam_arastirmasi.md, varlik_manifest.md |
| https://photojournal.jpl.nasa.gov/catalog/PIA26306 | REFERENCES.md |
| https://photojournal.jpl.nasa.gov/tiff/PIA16225.tif | gale_zemin_ortam_arastirmasi.md |
| https://photojournal.jpl.nasa.gov/tiff/PIA20755.tif | gale_zemin_ortam_arastirmasi.md |
| https://planetarydata.jpl.nasa.gov/img/data/msl/msl_places/data_localizations/ | REFERENCES.md |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC12130865/ | gale_dogrulama_tur3.md |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC1392602/?page=-1 | gercek_parametre_arastirmasi.md |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC5101845 | REFERENCES.md |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC7261083/ | gale_dogrulama_tur3.md |
| https://poly.pizza/m/3hC2i0CTuO | REFERENCES.md |
| https://polyhaven.com/a/dry_ground_01 | gale_zemin_ortam_arastirmasi.md |
| https://polyhaven.com/a/rock_face_03 | gale_zemin_ortam_arastirmasi.md, varlik_manifest.md |
| https://polyhaven.com/a/sand_03 | gale_zemin_ortam_arastirmasi.md, varlik_manifest.md |
| https://polyhaven.com/a/terrain_red_01 | gale_zemin_ortam_arastirmasi.md, varlik_manifest.md |
| https://polyhaven.com/license | varlik_manifest.md |
| https://polyhaven.com/license/ | juri_sorulari.md |
| https://prod.mars.jpllab.net/msl/spacecraft/rover/wheels/ | gercek_parametre_arastirmasi.md, gercek_tur2_enerji_modeli.md |
| https://pubmed.ncbi.nlm.nih.gov/1490989/ | gercek_parametre_arastirmasi.md, juri_sorulari.md |
| https://pubmed.ncbi.nlm.nih.gov/37703896/ | gercek_parametre_arastirmasi.md |
| https://pubmed.ncbi.nlm.nih.gov/40354557/ | gale_dogrulama_tur3.md |
| https://pubmed.ncbi.nlm.nih.gov/40879065/ | gercek_parametre_arastirmasi.md, gercek_tur2_enerji_modeli.md |
| https://pyproj4.github.io/pyproj/ | REFERENCES.md |
| https://python-pillow.org | REFERENCES.md |
| https://rasterio.readthedocs.io | REFERENCES.md |
| https://repository.si.edu/bitstream/handle/10088/30823/Haberle_et_al-2014-Journal_of_Geophysical_Research%253A_Planets.pdf?isAllowed=y&sequence=1 | gale_dogrulama_tur3.md |
| https://reverseshot.org/features/3379/kojima_death_stranding | TERRAIN_SCANNER_ARASTIRMA.md |
| https://samurai-gamers.com/death-stranding/surveying-sensor-terrain-guide/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://science.nasa.gov/blog/curiosity-blog-sols-4867-4872-sand-fill-in-antofagasta-crater-and-finding-our-next-drill-target | REFERENCES.md |
| https://science.nasa.gov/blog/curiosity-blog-sols-4873-4878-welcome-to-the-atacama-drill-target/ | REFERENCES.md |
| https://science.nasa.gov/blog/curiosity-blog-sols-4886-4892-ingenuity-and-perseverance-curiosity-style/ | REFERENCES.md |
| https://science.nasa.gov/mission/mars-2020-perseverance/rover-components/?trk=article-ssr-frontend-pulse_little-text-block | gercek_parametre_arastirmasi.md |
| https://science.nasa.gov/mission/msl-curiosity/location-map/ | REFERENCES.md |
| https://science.nasa.gov/resource/curiosity-tracks-in-hidden-valley-on-mars/ | kum_uyari_metinleri.md |
| https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/ | REFERENCES.md |
| https://science.nasa.gov/resource/looking-up-the-ramp-holding-bonanza-king-on-mars/ | kum_uyari_metinleri.md |
| https://ssd.jpl.nasa.gov/planets/phys_par.html | gercek_parametre_arastirmasi.md |
| https://sseh.uchicago.edu/doc/Lapotre_et_al_Science_2016.pdf | gale_dogrulama_tur3.md |
| https://standards.nasa.gov/node/238 | gercek_parametre_arastirmasi.md |
| https://standards.nasa.gov/sites/default/files/standards/NASA/C/nasa-std-3001-vol-1-rev-c-signature.pdf | gercek_parametre_arastirmasi.md, juri_sorulari.md |
| https://tech.yahoo.com/gaming/articles/18-tips-help-keep-balance-120000656.html | TERRAIN_SCANNER_ARASTIRMA.md |
| https://threejs.org/ | REFERENCES.md |
| https://threejs.org/docs/pages/InstancedMesh.html | TERRAIN_SCANNER_ARASTIRMA.md |
| https://threejs.org/docs/pages/Material.html | TERRAIN_SCANNER_ARASTIRMA.md |
| https://threejs.org/docs/pages/ShaderMaterial.html | TERRAIN_SCANNER_ARASTIRMA.md |
| https://timesofindia.indiatimes.com/sports/esports/news/how-to-use-the-odradek-in-death-stranding-2/articleshow/122107077.cms | TERRAIN_SCANNER_ARASTIRMA.md |
| https://trek.nasa.gov/mars/ | REFERENCES.md |
| https://web.mit.edu/aeroastro/www/people/dnewman/pdf2/DJN_AJohnsonSPACEAUG2010.pdf | REFERENCES.md, gercek_parametre_arastirmasi.md, metabolic_model.md |
| https://www-robotics.jpl.nasa.gov/media/documents/lpsc_2016_arvidson_ripple_crossing.pdf | gale_dogrulama_tur3.md, kum_uyari_metinleri.md |
| https://www-robotics.jpl.nasa.gov/media/documents/ROB-20-0040_R3.pdf | gale_dogrulama_tur3.md |
| https://www.avforums.com/threads/death-stranding-2.2438471/page-14 | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.gamecast.it/death-stranding-2-guida-iniziale-alla-platinum/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.gamepressure.com/death-stranding/starting-tips/z3cc85 | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.gamespot.com/gallery/death-stranding-2-tips-beginners-guide/2900-6684/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.gamespot.com/gallery/death-stranding-walkthrough-guide-prologue-tips/2900-3162/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.hou.usra.edu/meetings/8thmars2014/pdf/1081.pdf | gale_dogrulama_tur3.md, kum_uyari_metinleri.md |
| https://www.hou.usra.edu/meetings/lpsc2014/pdf/1281.pdf | gale_dogrulama_tur3.md |
| https://www.jpl.nasa.gov/images/pia26560-curiosity-views-boxwork-patterns-at-a-distance/ | juri_sorulari.md |
| https://www.jpl.nasa.gov/news/nasas-curiosity-rover-sees-martian-spiderwebs-up-close/ | REFERENCES.md |
| https://www.jpl.nasa.gov/news/through-the-gap-curiosity-mars-rover-crosses-dune/ | kum_uyari_metinleri.md |
| https://www.kbr.com/sites/default/files/documents/2025-08/TechnicalJournal20242025_25.pdf | gercek_parametre_arastirmasi.md |
| https://www.keengamer.com/articles/guides/death-stranding-2-guide-37-best-survival-tips/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.kojimaproductions.jp/en/DSTips | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.nasa.gov/centers-and-facilities/nasas-curiosity-mars-rover-starts-unpacking-boxwork-formations/ | REFERENCES.md |
| https://www.nasa.gov/nasa-brand-center/images-and-media/ | juri_sorulari.md, varlik_manifest.md |
| https://www.nasa.gov/reference/4-0-human-performance/ | REFERENCES.md |
| https://www.nexusmods.com/deathstranding/mods/125?tab=description | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8 | gercek_parametre_arastirmasi.md |
| https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9 | gercek_parametre_arastirmasi.md |
| https://www.pcgamer.com/games/action/death-stranding-2-fragile-lou-location/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.playstation.com/en-il/games/death-stranding-2-on-the-beach/death-stranding-2-on-the-beach-guide/ | TERRAIN_SCANNER_KAYNAKLAR.md |
| https://www.playstation.com/en-us/games/death-stranding-2-on-the-beach/death-stranding-2-on-the-beach-guide/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.pushsquare.com/guides/death-stranding-how-to-use-the-scanner | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.researchgate.net/publication/260283339_Traverse_Performance_Characterization_for_the_Mars_Science_Laboratory_Rover | gale_dogrulama_tur3.md |
| https://www.researchgate.net/publication/284163892_TERRAIN_FACTORS_FOR_PREDICTING_WALKING_AND_LOAD_CARRIAGE_ENERGY_COSTS_REVIEW_AND_REFINEMENT | gercek_parametre_arastirmasi.md |
| https://www.researchgate.net/publication/297790794_Mars_Science_Laboratory_Curiosity_Rover_Megaripple_Crossings_up_to_Sol_710_in_Gale_Crater | gale_dogrulama_tur3.md |
| https://www.researchgate.net/publication/382006984_Slopes_along_Apollo_EVAs_Astronaut_experience_as_input_for_future_mission_planning | gercek_parametre_arastirmasi.md |
| https://www.researchgate.net/publication/391675044_Ultraviolet_and_biological_effective_dose_observations_at_Gale_Crater_Mars | gale_dogrulama_tur3.md |
| https://www.researchgate.net/publication/394929719_A_Novel_Metabolic_Model_for_Ambulation_in_Hypogravity_and_Applications_to_Planetary_Extravehicular_Activity | gercek_tur2_enerji_modeli.md |
| https://www.researchgate.net/publication/395035485_Characterization_of_the_Effects_of_Sex_Speed_and_Incline_on_Metabolic_Rate_during_Partial_Gravity_Ambulation | gercek_tur2_enerji_modeli.md |
| https://www.scienceintheclassroom.org/sites/default/files/research-papers/1244797.full_.pdf | REFERENCES.md, gercek_parametre_arastirmasi.md |
| https://www.shacknews.com/article/114845/how-to-use-the-odradek-in-death-stranding | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.shacknews.com/article/144962/best-apas-enhancements-death-stranding-2 | TERRAIN_SCANNER_ARASTIRMA.md |
| https://www.videogamer.com/guides/death-stranding-2-apas-enhancements-explained-how-to-get-more-memory/ | TERRAIN_SCANNER_ARASTIRMA.md |
| https://zenodo.org/records/15995036 | REFERENCES.md |
