# Kaya tespiti doğrulaması (karne)

Tarih: 14 Kasım 2026 · Doğrulayan: Bora (gözle kontrol, elle sayım) · Yöntem: `shadow_rocks.py` (gölge tabanlı)

Bu bir **karne**, model eğitimi değil. Amaç: programın bulduğu kayalara ne kadar güvenebileceğimizi söylemek.

## 1. Bulduğu kayalar doğru mu? (30 rastgele aday, `validation_sheet_1/2.png`)

| Sonuç | Adet |
|---|---|
| Gerçekten kaya / kaya gölgesi (yanlış alarm yok) | 30 / 30 (%100) |
| Aynı kayanın iki kez sayılması (#14-15, #22-23) | 2 çift |
| T şeklinde tek yer şekli, 3 daire (#25-26-27) | 1 grup (1 mi 3 mü sayılır, belirsiz) |
| Dairenin içinde 2 kaya olan, 1'i kaçırılan (#12) | 1 |

- **Doğruluk (bulduğu şey gerçekten kaya mı): %100**, yanlış alarm görülmedi.
- **Çift sayma:** 30 daire = yaklaşık 26-28 ayrı kaya (T şekli 3 sayılırsa 28, 1 sayılırsa 26). Yani sayı **%7-13 şişiyor**.

## 2. Kaçırdığı kayalar (elle sayım)

Görsel: `docs/data/img/rock_abundance_validation.png`
(kırmızı = bulduğu, yeşil = kaçırdığı kaya, sarı = şüpheli: tepecik/çukur olabilir)

| | Kırmızı (bulundu) | Yeşil (kaçırdı) | Sarı (şüpheli) |
|---|---|---|---|
| Tüm kesit (375 m × 375 m) | 131 | 22 | 3 |
| 100 m'lik yakın plan | 7 | 4 | 10 |

**Bulma oranı** = bulunan / (bulunan + kaçırılan):

| | Sarılar kaya değil | Sarıların hepsi kaya |
|---|---|---|
| Tüm kesit | 131 / 153 = **%86** | 131 / 156 = %84 |
| Yakın plan | 7 / 11 = **%64** | 7 / 21 = %33 |

- **Kaçırma oranı:** tüm kesitte yaklaşık **%14** (%16'ya kadar), yakın planda %36.
- Yakın plan küçük ve sarıların çoğu orada, bu yüzden oran çok oynuyor. Tüm kesit rakamı daha güvenilir.

## 3. Net sonuç

- Çift sayma sayıyı yukarı (%7-13), kaçırma aşağı (%14) çekiyor. Bulunan 131'in ayrı kaya karşılığı yaklaşık
  114-122, kaçırılanlarla gerçek sayı yaklaşık 136-144. Yani **raporlanan sayı gerçeğin yaklaşık %5-10 altında.**
- CFA için bu şu demek: ölçtüğümüz %0,65, gerçekte muhtemelen **%0,65-0,72** aralığında. Sunumda "yaklaşık %0,7" demek dürüst.
- **Güvenilirlik:** bulduğu kaya gerçek, ama bir kısmını görmüyor. Kaya yoğunluğu haritası "nerede çok, nerede az"
  için kullanılabilir; kesin kaya sayısı için kullanılmamalı.
- Kapı 2 için yeterli.

## 3b. İkinci doğrulama: Curiosity rotası yakını + dik yamaç (2×2 km haritası, 14 Kasım)

Neden: Elif Rana'nın PR #44 notu. Haritada rota boyunca kaya yoğunluğu kutu ortalamasının ~2 katı çıktı
(rota çizgisi %1,58, ±10 m çevresi %1,45, kutu %0,81); `boxwork` sırtlarının kenar gölgeleri kaya sayılmış olabilir.
İlk doğrulama farklı (sırtsız) bir kesitteydi.

Yöntem: ≥1 m adaylardan **kör** örnek (sayfada grup yazmıyor, sıra karışık), `ml/orbital/validation_sheet_route.py`:
15 aday rota yakınından (±10 m), 15 aday dik yamaçtan (eğim ≥30°, rota dışı). Bora elle işaretledi
(`docs/data/img/validation2_*`).

| Grup | Kaya | Kaya değil | Şüpheli | Kaya oranı |
|---|---|---|---|---|
| Rota yakını (15) | 11 | 3 (#18, 19, 23) | 1 (#12) | %73 |
| Dik yamaç (15) | 12 | 1 (#20) | 2 (#10, 11) | %80 |
| **Toplam (30)** | **23** | **4** | **3** | **%77** (şüpheliler kaya çıkarsa en çok %87) |

- "Kaya değil" denenler çıkıntı/sırt kenarı gölgesi. Bora'nın sırt kenarı dediği 3 aday (#12, 20, 23) üçü de
  kaya değil ya da şüpheli.
- **Yanlış alarm bu bölgelerde ~%13 (şüphelilerle %23'e kadar).** İlk doğrulamadaki sırtsız kesitte 30/30 kaya çıkmıştı;
  yani sorun sırt kenarı ve dik yamaçlarda yoğunlaşıyor.
- Yanlış alarmlar çıkarılsa bile rota çevresi ≈ %1,1-1,3 kalır, kutu ortalamasının (%0,81) belirgin üstünde.
  Yani "rota kayalı yerlerden geçiyor" sonucu büyük ölçüde gerçek, ama bu bölgelerde harita ~%13-23 şişmiş olabilir.
- Hata güvenli yönde: planlayıcı gereksiz yere kaçınır, tehlikeli yeri güvenli göstermez.

**Karar:** Haritayı olduğu gibi bırakıyoruz, sınırı belgeliyoruz. 3-4 örneğe bakıp sırt filtresi eşiği koymak
gerçek kayaları da atabilir (Bora'nın kararı).

## 4. Önerilen iyileştirmeler (henüz uygulanmadı)

1. Birbirine çok yakın daireleri tek kayada birleştir (çift sayma biter).
2. Yeşil kaçırılanlara bakıp gölge eşiğini biraz gevşet, sonra aynı 30 adayla ve yeşil işaretlerle tekrar kontrol et.
3. Güneş yönü Elif Rana'dan doğrulanınca yeniden çalıştır (şu an görüntüden tahmin, ~45°).

## 5. Sınırlar

- Harita sırt kenarı ve dik yamaçlarda kayayı ~%13-23 fazla sayıyor olabilir (bkz. 3b). Bu grupların her biri 15 örnekle
  denendi, sonuçlar kaba. Sırt filtresi (uzun/çizgi gölgeleri ya da çok dik yamaçtaki adayları ele) ileride denenebilir, henüz yapılmadı.
- Sadece 30 örnek ve tek kişinin gözü; çift sayma oranı (%7-13) bu küçük örneklemden geliyor.
- Sarılar (şüpheli) kaya mı değil mi belli değil, iki ihtimal de tabloda gösterildi.
- 1 m'den küçük kayalar fotoğrafta görünmüyor, bu karneye dahil değil.
- Ayrıntılı karar sütunu: `docs/data/img/validation_sample.csv`.

## 6. Büyük tespitler gözle sınıflandırıldı: `kind` alanı (15 Kasım 2026)

`sim/data/rocks.json` 829 tespit içeriyor (S1–S3 koridoru). **Çapı 2,6 m'den büyük 123 tespitin hepsine** ortofotoda tek tek bakıldı
(`docs/data/img/kind_check/sheet_1…7.png`, her kare 48 m, kırmızı işaret tespitin merkezi; karar tablosu `labels.csv`).
Sonuç, `rocks.json`'daki `kind` alanında:

| kind | Adet | Anlamı |
|---|---|---|
| `outcrop` | 110 | Boxwork sırtının/duvarının yüzleği; ışıklı ve gölgeli yüzü olan ana kaya basamağı, tek kaya değil |
| `shadow` | 10 | Gölgenin kendisi: çukur ya da dar yarık/çatlak gölgesi, karşı yüzü ışıklı bir cisim yok |
| `rock` | 3 | Düz, çakıllı zeminde sırttan bağımsız, sıkışık koyu kütle (#98, #99, #120) |
| `rock` (küçük, ≤ 2,6 m) | 706 | Tek tek bakılmadı; varsayılan. Kör örneklem (§3b) 30 adayın 23'ünün kaya olduğunu gösterdi |

**Önemli sınırlar.** (1) Elimizde yalnız 1 m/piksellik ortofoto (`layers/ortho_1m.png`) var; 25 cm'lik kaynak bu makinede yok. Bir tespit
3–10 piksel ediyor, bu yüzden sınıf kararı yüz değeriyle: "sırta bağlı mı, yoksa tek başına mı" sorusunun cevabı. Sınırdaki tespitler
(özellikle 3 `rock` ve 10 `shadow`) tek gözün yargısı, ikinci bir kişi bakmadı. (2) En büyük 60 tespitin hiçbiri tek kaya değil (sırt duvarı ya da gölge); 8 m ve üstü 11 tespitin 11'i `outcrop`.
(3) Büyük tespitler küçük kayalardan sayıca az ama alanca baskın: daire alanı toplamının **%78'i** `outcrop`/`shadow`'dan geliyor.
Yani kaya kaplama oranı (`rock_cfa`) koridorda büyük ölçüde sırt gölgesinden besleniyor; bu, §3b'deki "rota çevresinde ~%13–23 şişme" bulgusuyla
aynı yönde, ama daha büyük olabilir. `rock_cfa` katmanını yeniden üretmek için 25 cm kaynak gerekiyor, bu turda değiştirilmedi.

**Sunum cümlesi.**
- EN: "The orbital detector found 829 rock candidates along the route corridor. We checked all 123 larger than 2.6 m by eye: 120 are ridge outcrops or shadows, only 3 look like single boulders, so we label them and do not count them as rocks. The 706 small ones were not checked one by one (a blind sample of 30 gave 23 rocks, false alarms 13–23%)."
- TR: "Yörünge tespiti rota koridorunda 829 kaya adayı buldu. 2,6 m'den büyük 123'ünün hepsini elle kontrol ettik: 120'si sırt yüzleği ya da gölge, yalnız 3'ü tek kaya gibi; bunları etiketledik ve kaya saymıyoruz. 706 küçük tespite tek tek bakılmadı (30'luk kör örneklemde 23 kaya, yanlış alarm %13–23)."

## 7. Kum noktaları × modelin `p_sand` katmanı (15 Kasım 2026)

Bora'nın 16 noktası (`layers/sand_hint.json`) ile Emre'nin `layers/p_sand.npy` katmanı, noktanın merkez hücresinde (`ml/orbital/sand_vs_model.py`):

| Nokta | yarıçap (m) | p_sand (nokta) | entropy | en yakın durak (m) | o durağın kum payı |
|---|---|---|---|---|---|
| sand_1 | 30 | 0.189 | 1.00 (kanıt yok) | 942 | 0.005 |
| sand_2 | 10 | 0.001 | 0.28 | 38 | 0.001 |
| sand_3 | 25 | 0.281 | 1.00 (kanıt yok) | 930 | 0.372 |
| sand_4 | 15 | 0.080 | 0.44 | 446 | 0.005 |
| sand_5 | 30 | 0.048 | 0.46 | 346 | 0.003 |
| sand_6 | 19 | 0.188 | 1.00 (kanıt yok) | 904 | 0.010 |
| sand_7 | 30 | 0.030 | 0.39 | 294 | 0.017 |
| sand_8 | 15 | 0.025 | 0.15 | 267 | 0.005 |
| sand_9 | 12 | 0.111 | 0.59 | 545 | 0.005 |
| sand_10 | 16 | 0.004 | 0.25 | 136 | 0.010 |
| sand_11 | 20 | 0.021 | 0.08 | 8 | 0.002 |
| sand_12 | 15 | 0.021 | 0.08 | 45 | 0.002 |
| sand_13 | 19 | 0.028 | 0.21 | 47 | 0.028 |
| sand_14 | 16 | 0.010 | 0.27 | 14 | 0.010 |
| sand_15 | 8 | 0.062 | 0.33 | 42 | 0.062 |
| sand_16 | 9 | 0.001 | 0.13 | 47 | 0.001 |

Kanıtlı nokta: 13/16; bunlarda p_sand en çok 0.111, >= 0,2 olan: 0

Entropy 1,00 olan üç nokta en yakın Navcam durağından ~900 m uzakta; orada `p_sand` "kanıt yok" varsayılanı, model tespiti değil.
Okuma ve Emre'nin analizine girdi: `ml/rover_terrain/SAND_ANALYSIS.md`.
