# Yüzlek (outcrop) 3B kontrolü (2026-11-15)

`sim/data/rocks.json` `kind`: rock 709 · outcrop 110 · shadow 10 (toplam 829; "3 kaya" notundaki sayı bu dosyada yok, kontrol ediliyor).
`hazards.js`: shadow çizilmez, outcrop alçak yayvan (çapın %13'ü, zemine gömülü). En yoğun yüzlek kümesi (25 m içinde 9 yüzlek, px [467,574]) üç yönden görüldü:
- `yuzlek_kume_bati.jpg`: alçak, yayvan, tabakalı parçalar zeminle birleşik; doğal görünüyor.
- `yuzlek_kume_kuzey.jpg`: yüzlekler arasında köşeli tek kayalar da var; ikisi ayırt edilebilir.
Not: yazılım GL (swiftshader) ile alındı; renk/ışık gerçek GPU'da farklı görünebilir. Yüzlekler "tespit"tir (HiRISE gölge yöntemi), ölçüm değil; V (saf veri) modu bu katmanı bozmaz.
