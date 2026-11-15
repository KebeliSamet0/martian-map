# DEM kayması: hangisi doğru? (2026-11-14, Batu/Claude; Elif Rana'nın notu üzerine)

**Sonuç: Elif haklı — kayma sim'in HiRISE T3 DTM'inde; ortofoto ve planlayıcı aynı çerçevede.**

Yöntem: `layers/msl_proposed_path.json` (Curiosity'nin gerçek yolu, 854 nokta, 3,9 km) sim'in ortofotosu (`MSL_Gale_HiRISE-LRGB_78quads_sharp_cog`, 0,5 m'ye örneklendi) üzerinde her yöne kaydırıldı; yol boyunca ortofotonun yüksek-geçiren (20 m yerel ortalaması çıkarılmış) parlaklığının ortalaması hesaplandı (`sim/data/_work/path_scan.py`).

| Kayma (yol → ortofoto) | skor |
|---|---|
| **0 m (kaymasız)** | **+2,10** (±12 m taramanın en yükseği +2,51 @ dE=+1 m) |
| +30,7 m D / +33,5 m G | −0,30 |
| −30,7 m D / +33,5 m K | −0,47 |
| ±70 m taramanın ortalaması ± std | 0,01 ± 0,51 |

Kaymasız konumda yol boyu sinyal yaklaşık 4σ üstte ve ±4 m içinde düşüyor (tekerlek izi genişliği). Yani izler ortofotoda planlayıcı koordinatında. Görsel: `docs/data/ekip/dem_kayma_tarama.png`.

**Sonuç:** Sim'in DTM'i ortofotoya göre ≈ +30,7 m doğu / +33,5 m güney kaymış (`cevirme` ölçümüyle tutarlı). 3B'de bu, yükseltinin ortofotodaki özelliklerle çakışmaması ve rotanın araziye 30 m kayık oturması demek.

**Düzeltme (uygulandı, ayrı klasörde):** `build_tiles.py --dtm-dcol 30 --dtm-drow 33` yüksekliği DTM(col+30, row+33)'ten okur (≈0,4 piksel artık hata). Çıktı `sim/data/tiles_shifted` (yalnız yükseklik + nav; dokular aynı), `?tiles=tiles_shifted` ile açılır. Demo karoları (`tiles`) değiştirilmedi. Düşey fark (−15,1 m) sim'i etkilemez: sim planlayıcının yüksekliğini kullanmaz.

**Sınırlar:** (1) Ölçüm, izlerin ortofotoda açık/parlak göründüğü varsayımına dayanır; sinyalin işareti kaynaktan doğrulanmadı, ama kaymasızdaki keskin tepe işaretten bağımsız bir çakışma kanıtıdır. (2) Kayma tüm alanda sabit varsayıldı; yalnız yol boyunda test edildi. (3) 1 DTM pikseli ≈ 1 m, artık hata ≈ 0,5 m.

## Bağımsız doğrulama ve düzeltilmiş karolar (2026-11-15, doğrula desk'i)
Yol–ortofoto yöntemine bağlı olmayan iki ölçüm; ikisi de kayma gerçek diyor.
1. **DEM'e karşı DEM** (`ml/orbital/dem_shift_check.py`): karo yüksekliği ile `layers/elevation.npy` yüksek-geçiren korelasyonu.
   Tüm kutuda en iyi örtüşme karo çerçevesi planlayıcıya göre **30 m doğu / 32 m güney** (korelasyon 0,11 → 0,75); dört çeyrekte 28–32 m D, 30–36 m G, koridorda 28 / 32. Düşey fark 14,9 m. Kayma kutuda sabit (±4 m).
2. **Ortofoto eğim kontrolü:** ortofotonun yüksek-geçiren parlaklığı, DEM eğiminin (x,y) doğrusal birleşimiyle (güneş yönü gerekmez) yalnız karo DEM'i (+30 D, +33 G) okununca ve planlayıcı DEM'i ile açıklanıyor (R² 0,003–0,024); kaymasız karo DEM'inde 0,000. Mutlak değerler küçük (albedo etkisi), ayrım tek yönlü.
3. **Dokular zaten doğru çerçevede:** karo dokuları ile `layers/ortho_1m.png` kaymasız örtüşüyor (korelasyon 0,895 @ 0 m). Yani yalnız yükseklik kayık; düzeltme yalnız yüksekliğe uygulanır, doku yeniden üretilmez.
Düzeltilmiş karolar `martian-map/sim/data/tiles_fixed` (git dışı): `build_tiles.py --dtm-dcol 30 --dtm-drow 33 --no-texture`, doku klasörü `tiles/t`'den kopyalanıp komut onun üstüne koşuldu (manifest doku bayrakları dosyalardan türediği için elle düzeltme gerekmedi). **`--work` mutlaka ayrı klasör olmalı**: `tiles/../_work/L0_*.done` varsa betik DTM'i yeniden okumaz ve kaymasız karo üretir. Sonuç: DEM korelasyonu 0,11 → 0,75 (koridor 0,07 → 0,875), artık kayma ≤ 2–4 m. Kenarda 8 (L0) + 1 (L1) döşemenin dokusu yok (bayrak 0, sim bunu destekliyor); 13+5+1 kenar döşemesi düştü.
Açmak için `?tiles=tiles_fixed` gerekir (PR #99'daki seçici). Rota görseli: `docs/sim/hizalama/s1_kirmizi_alan_once_sonra.png`.
