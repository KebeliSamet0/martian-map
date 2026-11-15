# Masa araştırmalarının denetimi ve güncel doğrulama (2026-11-15)

Denetleyen: Batu (sim). Girdiler: `docs/data/ekip/` altında dört masa raporu. Bu belge **neyi kabul ettiğimizi, neyi etmediğimizi ve neyi
ölçtüğümüzü** yazar. Kod değişikliği yalnız aşağıda "sim'e alınanlar"da belirtilenlerdir.

## 1. Rapor bazında karar

| Rapor | Karar | Gerekçe |
|---|---|---|
| `gercek_parametre_arastirmasi.md`, `gercek_tur2_enerji_modeli.md` (gercek) | **Kabul**, sunumda temel | Her sayıda tam atıf + URL + sayfa; doğrulanmayan yerler açıkça "doğrulanmadı". Uydurma sayı yok. |
| `repo_haritasi.md` (çalışan 2) | **Kabul**, öncelik listesi olarak | Sabit commit 8f142f6 üzerinde 319 dosya envanteri; P0/P1 çelişkiler dosya çiftleriyle. |
| `gale_zemin_ortam_arastirmasi.md` (gercek 2) | **Kısmen kabul** | Ripple ölçeği (Lapotre 2016: 1–3 m büyük rüzgâr dalgacığı) ve CC0 varlık listesi kullanılabilir. **Sayısal tablolar (Heverly 2013 kayma–eğim aralıkları, REMS/UV aralıkları, "doğrulandı" iddiaları) bu turda bağımsız doğrulanmadı**; birincil makale sayfası verilmemiş, bir atıfta yıl/DOI uyuşmuyor (Vicente-Retortillo: metinde 2017, DOI numarası PNAS 2020 serisinde). Sim'e ve sunuma **alınmadı**, "doğrulanmadı" etiketiyle durur. |

## 2. Sim'e alınanlar
- **Mikro rölyef ölçeği:** 5.2 m dalga boyu ±0.15 m, 2.3 m ±0.10 m (önceki 5.3/2.7 m, ±0.17/±0.08 m). Dayanak: Lapotre 2016 büyük rüzgâr dalgacıkları 1–3 m. Genlik, kumun iç sürtünme açısını aşan dik duvar üretmesin diye sınırlı. (PR: `batu/sim-tiles-secici`)
- **`?tiles=` seçici:** repo haritası P0: DEM kayma belgesi "düzeltildi" diyor ama `main.js` `BASE`'i sabit `./data/tiles` idi; `?tiles=tiles_shifted` hiçbir şey yapmıyordu. Artık çalışıyor (yalnız `[A-Za-z0-9_-]` klasör adı kabul edilir). **Varsayılan karolar değişmedi**: düzeltilmiş karoları varsayılan yapmak karar (Samet/Batu) ve 64 MB zip dağıtımı gerektirir.

## 3. Güncel MSL karşılaştırması (yerel ölçüm, 2026-11-15)
`docs/validation_msl.json` eski (zemin modeli yokken koşulmuş: `terrain_model_available=false`). `scripts/compare_msl.py` bugünkü katmanlarla
(`p_soil, p_bedrock, p_sand, p_bigrock, entropy`, 128 durak) yeniden koşuldu; çıktı repo dışına yazıldı:

| Ön ayar | Uzunluk | Süre | Enerji | Maks. eğim | Ort./maks. sapma (Curiosity yolundan) |
|---|---:|---:|---:|---:|---:|
| en kısa | 2257.9 m | 78.0 dk | 369.7 kcal | 18.6° | 131.4 / 326.0 m |
| dengeli | 2284.1 m | 78.3 dk | 370.7 kcal | 19.9° | 133.4 / 324.1 m |
| en güvenli | 2396.3 m | 80.3 dk | 378.6 kcal | 18.1° | 132.4 / 324.1 m |

Curiosity referansı: 3887.6 m (ızgara örnekleme 4141.3 m), eşdeğer tek yön 191.1 dk, 927.4 kcal. Üç ön ayar da GO.
**Yorum (dürüst):** planlayıcı rotaları gerçek Curiosity yolundan ~1.5–1.6 km (%40) kısa ve ~130 m ortalama sapmalı; bu beklenen bir fark çünkü
Curiosity'nin yolu bilim hedefleri ve rover kısıtlarıyla belirlendi, insan için optimum değil. Ama bu karşılaştırma **enerji/süre tahminini
doğrulamaz**; gerçek bir insan ölçümü yok. Sunumda "gerçek rover izi ile çakışma" denmemeli, "gerçek arazide rota üretimi" denmeli.
Samet `docs/validation_msl.json`'ı bu sürümle yeniden üretmeli (dosya Samet'in alanı; dokunmadım).

## 4. Açık P0'lar (repo haritasından; sahipleri)
| Konu | Sahip | Durum |
|---|---|---|
| Kod 420 L / 2000 kcal / 6 sa ↔ belge 370 L / 1800 kcal / 7 sa; 80/120/10 kg ↔ 82/104/23 kg; 0.8 ↔ 0.75 m/s | Samet + Elif Nisa | Karar bekliyor (`VERI_KAYNAKLARI.md` §3) |
| `validation_msl.json` eski | Samet | Yukarıdaki tablo güncel ölçüm |
| 60 µGy "NASA limiti" değil, plan bütçesi | Samet/Veysel (etiket) | `VERI_KAYNAKLARI.md` §6 |
| web `public/data` durak kopyalarında class_frac boş | Veysel | Bilgi |
| `ml/rover_terrain/LAYERS.md` "18 durak" notu eski | Emre | Bilgi |
| PR #98 (kaya engeli + azami eğim) | Emre / Samet | Açık, henüz main değil |

## 5. Sim için sıradaki gerçek-veri işi (öneri)
Repo haritası: `p_sand`, `p_bigrock`, `entropy`, `slope` API'de var (`/layers/*.bin`) ama 3B'de **oyuncunun bulunduğu noktada** gösterilmiyor.
"Zemin tahmini (model)" satırı (eğim, p_kum, p_büyük kaya, belirsizlik + "model tahmini" etiketi) bilgi paneline eklenebilir.

## 6. Uygulandı: 3B panelde 'Zemin (model)' satırı
Bilgi paneline oyuncunun hücresinde planlayıcı katmanları eklendi (eğim, p_kum, p_iri taş, belirsizlik; API yoksa görünmez, 'model tahmini' etiketi). Örnek (S1 kum bölgesi): sim yerel eğimi 10.8°, planlayıcı 2 m hücre eğimi 3°, kum 0.03, belirsizlik 0.21. **Bu iki eğim farkı (1 m DTM ↔ 2 m ortalama) kırmızı yol renginin neden abartılı olabileceğini gösteriyor**; segment rengi hangi eğime göre olmalı kararı Samet'te.
