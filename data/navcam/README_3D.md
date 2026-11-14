# 3D paketi (Batu için)

## Koordinat sistemi
- Izgara: 1000x1000 piksel, 2 m/piksel, sol üst köşe = grid.json origin_xy_m (Equirectangular, R=3396190).
- px = [x, y] = [sütun, satır]; (0,0) sol üst (kuzeybatı). x doğuya, y güneye artar.
- Three.js önerisi: X = sütun*2 (m, doğu), Z = satır*2 (m, güney), Y = elevation_m - min_elevation.
- elevation.npy: float32, metre, şekil (1000,1000), indeks [satır, sütun].

## Duraklar (stops_3d.json)
- px, lat/lon, easting/northing, elevation_m (DTM'den örneklendi), rover_yaw_deg.
- images[]: file (paket içi yol), mast_az_deg (rovera göre), mast_el_deg (negatif = aşağı),
  world_az_deg = (rover_yaw + mast_az) mod 360; 0 = kuzey, 90 = doğu (saat yönü).
- Navcam görüş alanı yaklaşık 45x45 derece, 1024x1024 piksel, siyah-beyaz.
- Fotoğrafı yerleştirmek için: durak noktasında, yerden yaklaşık 1.9 m yükseklikte (direk kamerası),
  world_az_deg yönüne ve mast_el_deg açısıyla bakan bir düzlem.

## Doğruluk
- Durak konumu: iki yöntem arası fark <0,5 m.
- yaw_source = "waypoint" ise NASA kaydı; "quaternion" ise fotoğraftaki rover duruşundan hesaplandı.
- Açı kuralları NASA PDS MSL dokümantasyonuyla doğrulanmadı; sahnede görsel kontrol önerilir.
