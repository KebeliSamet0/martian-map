# Yüzlek (outcrop) 3B kontrolü (2026-11-15)

`sim/data/rocks.json` `kind`: rock 709 · outcrop 110 · shadow 10 (toplam 829; "3 kaya" notundaki sayı bu dosyada yok, kontrol ediliyor).
`hazards.js`: shadow çizilmez, outcrop alçak yayvan (çapın %13'ü, zemine gömülü). En yoğun yüzlek kümesi (25 m içinde 9 yüzlek, px [467,574]) üç yönden görüldü:
- `yuzlek_kume_bati.jpg`: alçak, yayvan, tabakalı parçalar zeminle birleşik; doğal görünüyor.
- `yuzlek_kume_kuzey.jpg`: yüzlekler arasında köşeli tek kayalar da var; ikisi ayırt edilebilir.
Not: yazılım GL (swiftshader) ile alındı; renk/ışık gerçek GPU'da farklı görünebilir. Yüzlekler "tespit"tir (HiRISE gölge yöntemi), ölçüm değil; V (saf veri) modu bu katmanı bozmaz.

## Dayanak ve sınırlar (gercek masası, `docs/data/ekip/yuzlek_gorunum_arastirmasi.md`)
- Gale'de **evrensel yükseklik/çap oranı yok**: Point Lake outcrop'u ~2 m × 0,5 m (oran 0,25), Mount Remarkable butte ~5 m, boxwork sırtı ~1–2 m. Sim'deki %13 (`OUTCROP_H`) **temsili sanatçı geometrisidir**, ölçüm değil; kodda böyle etiketlendi.
- Yüzlekler tek tip alçak kaya değil: ince tabakalı çamurtaşı, kırıklı/nodüllü ana kaya, sırtlar, kısmen kumla örtülü yüzeyler. Daha savunulabilir temsil: DTM'ye oturan, tabakalı-kırıklı çıkıntı; laminasyon/nodülleri yükseklik değil normal/albedo ayrıntısı yapmak.
- HiRISE gölge yöntemi sırt/knob gölgelerini kaya sanabilir (MBARS, Hood 2022); örnek boyut belirsizliği ±37,5 cm. Gölge sınıfı ölçülmüş kaya ya da yüzlek geometrisi diye sunulmaz (shadow zaten çizilmiyor).
- Yüzlek PBR albedo/RGB tablosu kaynaklı bulunamadı; renk için NASA görselleri (Earth-white-balanced) fiziksel Mars rengi sayılmaz.
