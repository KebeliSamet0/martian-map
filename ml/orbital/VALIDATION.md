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
