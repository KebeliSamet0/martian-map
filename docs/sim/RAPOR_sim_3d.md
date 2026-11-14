# sim/ — gerçek veriden harita → rota → 3D yürüyüş (rapor + PR/issue metni)

Sorumlu: Batu (`sim/`). Önerilen dal: `batu/sim-gercek-harita`. Önerilen issue başlığı: "sim: gerçek HiRISE DTM ile harita, rota ve 3D yürüyüş".

## Yapılanlar
- Leaflet harita (Viking / HiRISE mozaik / CTX tabanları, eğim ve Curiosity waypoint katmanları); A ve B seçilir, rota çizilir.
- Rota: 4 m ızgarada A* (en kısa / dengeli-Tobler), eğim sınırı, segmentler ve `route.json` (sözleşme biçimi; kcal/p_sand vb. null).
- 3D: HiRISE T3 DTM (~1 m) ve LRGB ortofoto (0,25 m), quadtree LOD (8 seviye), gölge, gökyüzü, FPS yürüyüş. Dinamik çözünürlük.
- Dürüstlük: sentetik öğeler (taşlar, uçurum dokusu, detay dokusu) arayüzde etiketli; "saf veri modu" (V) bunları kapatır. NoData (~%26) için A/B en yakın geçerli hücreye çekilir ve bildirilir.
- Doğrulanmış sabitler `sim/data/params.json`: güneş yüksekliği 32,507° / azimut 282,527° (ESP_019698_1750_RED.LBL), skafandr referans hızı 0,67056 m/s (NTRS 20220010306 s.23), MMGIS waypoint'leri.

## Ölçüm (yazılım GL, gerçek GPU değil)
- Sahne ~590–780k üçgen (kalite düşük/yüksek/ultra); yakın L0 döşemesi sayısı kameraya bağlı ~8. JS ≤ ~11 ms/kare. Gerçek GPU FPS'i ÖLÇÜLMEDİ.

## Bilinen sınırlar
- Mars hız–eğim, kalori, gök rengi, taş dağılımı için kaynaklı değer yok (2. tur araştırma sürüyor, `docs/data/GOREV_tur2_brif.md`).
- Veri/ağırlıklar git dışı: `sim/data/tiles`, `*.f32`, `*.glb`; üretim `sim/tools/build_tiles.py`.

## Çakışma notu
Yalnızca `sim/` ve `docs/sim/`, `docs/data/` altına yeni dosya eklenir; başka klasöre dokunulmaz. Codex'in `sim/src`, `sim/vendor`, `sim/node_modules` dosyaları PR'a girmemeli. `docs/REFERENCES.md`'ye eklenecek kaynaklar: HiRISE DTM/ortofoto (USGS), Mars Trek, CTX, Leaflet, Three.js, NASA APACHE.
