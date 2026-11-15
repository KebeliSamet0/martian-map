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

## 7. Tur 3 sonuçları (2026-11-15)
- **gercek, `gale_dogrulama_tur3.md`:** gercek 2 raporunun "teyit edildi" özeti **kabul edilmedi**. UV sayılarının atfı (yazar, yıl, başlık, DOI) yanlış; Dingo Gap için verilen Arvidson 2014 makalesi olayı kapsamıyor; Heverly'ye bağlanan yüzde-kayma tablosu doğrulanamadı. Destek bulan: Arvidson 2017 özeti megaripple geçişlerinde ~%30 batma (0.50 m tekerlek) ve **%77'ye kadar** slip; Heverly 2013 özeti 10° kumda orta kayma, **17° kumda gömülme**, ana kayada 22° geçilebilirlik. Bu yüzden sim'de kum/zemin için **yalnız** bu doğrulanmış büyüklükler kullanılabilir; yüzde tablosu kullanılmaz.
- **çalışan 2, `msl_egim_dagilimi.md` (rover kanıtı, insan eşiği değil):** Curiosity'nin gerçekten kestiği 2330 hücrede DEM eğimi medyan **8.84°**, p90 **16.76°**; hücrelerin **%98'i ≤25°**, yalnız %1.97'si >25° (ızgara geneli: medyan 13.3°, %18.7 >25°). Yol-yönü eğimi daha düşük (uzunluk ağırlıklı mutlak medyan 5.39°). p_kum>0.4 olan yalnız 3 hücre (iz boyunca %0.15): "Curiosity kumdan kaçındı" sonucu **doğrulanmadı**. Yorum: 15°/25° planlama eşikleri rover izi ile çelişmiyor ama insan için doğrulanmış değil.
- **gercek 2, `varlik_manifest.md`:** 4 CC0 doku seti + PIA20755 indirildi, SHA-256 ve HTTP 200 doğrulandı (iki dosyada bağımsız kontrol). Sim'de zaten bedrock/regolith/sand PBR setleri var; yeni doku eklenmedi. PIA20755 ortalama RGB (103.6, 105.6, 107.4) neredeyse nötr: kalibre renk referansı olarak kullanılmamalı. 24 MB'lık ikili dosyalar repoya girmez (CONTRIBUTING).

## 8. Tur 4: kaynaklı kum uyarısı metinleri (2026-11-15)
`docs/data/ekip/kum_uyari_metinleri.md`: üç metin önerisi (kum bandı `alerts.sand`, replan toast `alerts.replan_done`, `hud.ground_model_hint`), yalnız doğrulanmış rover büyüklükleri (Arvidson 2017: %77'ye kadar kayma; Heverly 2013: 17° kumda gömülme) ve rover≠insan ayrımı. Yasaklar: yüzde-kayma tablosu, insan eğim eşiği, "güvenli" sözcüğü, Dingo Gap için Arvidson 2014 atfı.
Sim'e alınan: **yalnız** `hud.ground_model_hint` anahtarı varsa "Zemin (model)" ipucu `texts.json`'dan okunur (yoksa mevcut inline metin). `alerts.*` metinleri `texts.json` Elif Nisa'nın (#50) alanı olduğundan **öneri olarak** iletildi; Veysel'in `alert.sand.title` başlığı da ("Kum algılandı" yerine "Kum uyarısı") onların kararı.

## 9. Tur 3: gerçek REMS verisi (gercek 2) (2026-11-15)
`docs/data/ekip/rems_gercek_veri.md`: NASA PDS4 `msl_rems_bundle` kalibre RMD ürünleri, sol 53 (Ls~180°), 191 (Ls~267°), 533 (Ls~85°). **Bağımsız yeniden hesapladım** (ham TAB'dan, -999 örnekler ayıklanarak): basınç 716–807 / 863–961 / 838–895 Pa, 1.5 m hava −69.8…−4.7 °C (sol 53), zemin −107.5…+10.8 °C (sol 53) rapordaki değerlerle birebir.
Sınırlar: (1) kayıtlar yerel gün boyunca (00:00→23:06) ama REMS görev çevrimlerinde örnekliyor; 7.3–21 bin kayıt sürekli 24 sa 1 Hz değil, uçlar (en sıcak/soğuk an) kaçmış olabilir. (2) Sol 533 zemin tabanı −174 °C tek tek aykırı örneklere dayanıyor (rapor kendisi p05 = −106.9 °C veriyor); HUD'da min yerine p05 kullanılmalı. (3) Üç sol mevsimin tamamını temsil etmez. HUD'a eklenecekse "ölçülen örnek sol: ..." etiketiyle, Ls'e bağlı tipik aralık olarak, tahmin değil.
Ham TAB dosyaları (18 MB) repoya girmedi (CONTRIBUTING); manifest + özet JSON girdi.
