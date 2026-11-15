# Kum zayıflığı: neden kaçıyor? (2026-11-15)

Olgu: elle kontrol edilen 18 durakta kum görülen 7 duraktan 2'sinde model kum payını ≥ 0,2 verdi (s120_d2366, s120_d3056; `LAYERS.md`).
Kaçıran 5 durağın kum payı 0,01–0,03; kum görülmeyen 11 durakta da 0,00–0,03. Yani kumlu ve kumsuz duraklar sayıdan ayırt edilemiyor.

## Hangi açıklama veriyle çelişiyor, hangisi tutuyor
| Aday neden | Karar | Dayanak |
|---|---|---|
| **Çözünürlük** | Elenir | Model HiRISE'a değil Navcam karelerine (santimetre ölçeği) uygulanıyor. HiRISE'ın 1 m pikseli `p_sand`'ı etkilemiyor. |
| **Sınıf dengesizliği** | Zayıf | Kum, AI4Mars'ta nadir değil: uzman testinde kum IoU 0,974, val'de 0,870 (`METRICS.md`); kum ağırlığı 0,70. Model kumu, AI4Mars'ın etiketlediği biçimde iyi buluyor. |
| **Alan ve etiket kayması** | En olası | Kaçanlar ince, koyu kum: kaya plakalarının arasında (s120_d3056 → "ana kaya %81") ve rover izinde kum+çakıl (s120_d2366 bu karede "toprak %81"). Eğitim 2012–2019 başka arazide; kum, toprak ve ana kaya arasındaki sınır etiketçiler için de belirsiz. |
| **Durak ortalaması ve eşik** | Katkı verir | Durak değeri karelerin ortalaması; küçük kum şeridi payı seyreltir. s120_d2366'da tek kare 0,01, durak 0,37. Haritaya 200 m'ye kadar tek değer yayılır (`LAYERS.md`). |
| **Kontrol zayıflığı** | Olası | "Kum görüldü" tek kişinin gözü; 18 durak, 7 kumlu. Sonuç kaba. |

Bu makinede model ağırlıkları ve Navcam kareleri yok; adayları ayırmak için karelerde yeniden çıkarım gerekir. Burada yalnız belgelenmiş
sayılarla yapılan ayrım var.

## Bora'nın 16 kum noktasıyla kesişim
`python ml/orbital/sand_vs_model.py` (tablo `ml/orbital/VALIDATION.md` §6). Kısa sonuç: modelin kanıtı olan 13 noktada `p_sand` en çok 0,111,
**hiçbirinde ≥ 0,2 yok**. Üç nokta (sand_1, 3, 6) 0,19–0,28 görünüyor, ama bunlar entropy 1,0 hücre: en yakın durak 900 m ötede,
değer "kanıt yok" varsayılanı, tespit değil. Noktalar ve modelin kum durakları da örtüşmüyor: kum payı ≥ 0,2 olan 7 durağın en yakın
Bora noktasına uzaklığı 34–111 m (hiçbiri nokta yarıçapında değil). Bora'nın noktaları ortofotodan **aday** (düz, pürüzsüz, kayasız, çevresinden alçak);
Navcam'de kum olduğunu kanıtlamıyor, yani kesişmemesi tek başına modeli yanlışlamaz. Ama iki bağımsız kaynak aynı yeri göstermiyor.

## Sunumda tek cümle
- EN: "The terrain model reads sand well where AI4Mars labels it, but it under-calls the thin dark sand between bedrock slabs in this new region (2 of 7 sandy stops), so the simulator treats sand as a surprise and re-plans when the astronaut sees it."
- TR: "Zemin modeli AI4Mars'ın etiketlediği kumu iyi buluyor, ama bu yeni bölgedeki kaya plakaları arasındaki ince koyu kumu az tahmin ediyor (7 kumlu durağın 2'si); simülatör kumu bir sürpriz sayıp astronot görünce rotayı yeniden planlıyor."
