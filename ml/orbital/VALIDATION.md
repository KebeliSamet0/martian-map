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

Görsel: `docs/data/img/rock_abudance_validation_i_checked_this_one_so_trust_me_real_quick.png`
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

## 4. Önerilen iyileştirmeler (henüz uygulanmadı)

1. Birbirine çok yakın daireleri tek kayada birleştir (çift sayma biter).
2. Yeşil kaçırılanlara bakıp gölge eşiğini biraz gevşet, sonra aynı 30 adayla ve yeşil işaretlerle tekrar kontrol et.
3. Güneş yönü Elif Rana'dan doğrulanınca yeniden çalıştır (şu an görüntüden tahmin, ~45°).

## 5. Sınırlar

- Sadece 30 örnek ve tek kişinin gözü; çift sayma oranı (%7-13) bu küçük örneklemden geliyor.
- Sarılar (şüpheli) kaya mı değil mi belli değil, iki ihtimal de tabloda gösterildi.
- 1 m'den küçük kayalar fotoğrafta görünmüyor, bu karneye dahil değil.
- Ayrıntılı karar sütunu: `docs/data/img/validation_sample.csv`.
