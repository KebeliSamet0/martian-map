# Navcam boxwork paketi

Curiosity (MSL) Navcam sol kamera (NAV_LEFT_A/B) tam kare görüntüleri, Gale / Mount Sharp boxwork bölgesi.
Kaynak: NASA/JPL-Caltech ham görüntü API'si (mars.nasa.gov/api/v1/raw_image_items). Ham, kalibre edilmemiş JPEG.
Durak konumları: MMGIS MSL_waypoints.json (site orijini + xyz), grid: Martian Map contracts/grid.json.

Dosya adı: <imageid>__az<mast_az>_el<mast_el>.JPG

Alanlar (API'deki ham değerler):
- mast_az_deg: direğin azimutu, derece (rover çerçevesinde)
- mast_el_deg: direğin yükseklik açısı, derece (negatif = aşağı/zemine bakıyor)
- camera_position_m, camera_vector: kameranın konumu ve bakış vektörü (API'nin verdiği çerçevede)
- camera_model_type / camera_model: CAHVOR kamera modeli bileşenleri
- rover_attitude_quat: rover duruş kuaterniyonu
- xyz_site_m: rover'ın site yerel çerçevesindeki konumu (m; x=kuzey, y=doğu)
- stop_lat, stop_lon, stop_px: durağın küresel konumu ve grid pikseli [sütun, satır]

Not: Çerçeve tanımları NASA PDS MSL kamera dokümantasyonuyla doğrulanmalıdır.
3D için dünya yönü (kuzeye göre) 3d/stops_3d.json içindeki world_az_deg alanındadır.
