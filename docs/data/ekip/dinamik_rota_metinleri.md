# Dinamik rota metinleri ve dürüstlük denetimi (2026-11-15)

## Kapsam

Salt okunarak incelendi: `C:\Users\Batu\Desktop\mm-pr\main-wt\sim\data\texts.json` içindeki `ui.dyn.*` anahtarları (dal `batu/custom-mission` olarak belirtilmişti) ve NASA/NTRS ile diğer açık bilimsel kaynakların arama/kayıt sayfaları. Kod ve `texts.json` değiştirilmedi. Bugün erişilen kanıt, iki tasarım yüzdesini doğrulamıyor; %40 ve %80 Samet'in ürün kararları olarak sunulmalı.

## Mevcut metin denetimi ve öneri

Aşağıdaki İngilizce/Türkçe öneriler birer veya iki kısa cümledir. Sayısal fark alanları yalnız planlayıcı çıktısı olduklarında gösterilmeli; mevcut kodda bu alanların hangi baz rotaya göre farkı ifade ettiği ayrıca doğrulanmadı.

| Anahtar | Dürüstlük bulgusu | Önerilen TR | Suggested EN |
|---|---|---|---|
| `dyn.msg.deviation` | “Rotadan uzaklaştın” konum farkını olgu gibi söyler; rota konumu ile oyuncu konumunun nasıl eşleştirildiği doğrulanmadı. “Fark yaratıyor” yönü/bazı belirsiz. | Rota çizgisinden ayrıldın. Buradan hesaplanan yeni rota, eski rotaya katılma seçeneğine göre {m} m, {kcal} kcal ve {o2} L O₂ fark gösteriyor (planlayıcı tahmini). | You are off the route line. The newly calculated route from here differs from rejoining the previous route by {m} m, {kcal} kcal, and {o2} L O₂ (planner estimate). |
| `dyn.msg.reserve` | %40 eşiğinin kaynağı bulunamadı; ayrıca O₂ ve süre yüzdeleri farklı kaynak/birimlerdir. “Altına indi” ancak uygulama gerçekten kalan/başlangıç oranını ölçüyorsa kullanılabilir; model varsa “hesaplanan” denmeli. | Hesaplanan O₂ veya süre payı %40 eşiğinin altında. Bu, bu simülasyonun dönüş önerisini tetikleyen tasarım eşiğidir; üsse dönüş maliyeti {m} m, {kcal} kcal ve {o2} L O₂ olarak hesaplandı. | The estimated O₂ or time margin is below the 40% threshold. This is a simulation design trigger for a return suggestion; the estimated return cost is {m} m, {kcal} kcal, and {o2} L O₂. |
| `dyn.msg.load` | Yeniden hesaplamayı iddia ediyor; farkın hangi önceki yük/rota ile kıyaslandığı metinde yok. | Yük girdisi değişti. Kalan rota ve dönüş yeni yük girdisiyle yeniden hesaplandı; gösterilen farklar planlayıcı tahminidir ({m} m, {kcal} kcal, {o2} L O₂). | The load input changed. The remaining route and return were recalculated with the new load input; displayed differences are planner estimates ({m} m, {kcal} kcal, {o2} L O₂). |
| `dyn.msg.observation` | “Kask kamerası” ve “riskli zemin işaretledi” bir kamera/algı hattının gerçekten var olduğunu ve risk sınıflandırdığını ima ediyor. Model gözlemi “ölçüm değil” notu iyi ama iddiayı tümüyle düzeltmiyor. | Zemin modeli rotaya yakın bir risk adayı işaretledi. Bu girdiye göre hesaplanan yeni rotadaki fark {m} m, {kcal} kcal ve {o2} L O₂ (model tahmini; saha ölçümü değil). | The terrain model flagged a candidate hazard near the route. The recalculated route differs by {m} m, {kcal} kcal, and {o2} L O₂ (model estimate, not a field measurement). |
| `dyn.urgent` | “Dönüşü olmayan nokta” sistemin gerçek kaynak tüketimini ve geri dönüş kabiliyetini bildiğini ima eder. Eşikler deneysel/operasyonel olarak doğrulanmadı. | Dönüş için hesaplanan kaynak ihtiyacı kalan bütçeye yaklaşıyor. Dönüşü şimdi seçmeyi değerlendirin; bu uyarı bir operasyonel sınır doğrulaması değildir. | The estimated resources needed to return are approaching the remaining budget. Consider selecting return now; this alert does not validate an operational limit. |
| `dyn.accept` | Kısa düğme; rota onayının risk onayı gibi anlaşılmaması için eylemi açık etiketlemek daha iyi. | Önerilen rotayı uygula | Apply suggested route |
| `dyn.dismiss` | “Mevcut rotada kal” uygulamanın eski rotayı mutlaka sürdürebildiğini ima eder. | Öneriyi kapat | Dismiss suggestion |
| `dyn.applied.deviation` | Mesafe ve süre “yeni rota” diye sunuluyor; süre yöntemi/metrik birimi belirtilmiyor. | Yeni rota (tahmin): {km} km · {min} dk (geçen SI dakika) | New route (estimate): {km} km · {min} min (elapsed SI minutes) |
| `dyn.applied.reserve` | Dönüş rotası mesafe/süresi kaynaksız model tahmini olabilir; etiket gerekli. | Üsse dönüş (planlayıcı tahmini): {km} km · {min} dk (geçen SI dakika) | Return to base (planner estimate): {km} km · {min} min (elapsed SI minutes) |
| `dyn.applied.load` | Yeni yükle hesaplandığını belirtir, ancak süre yine tahmin etiketi ve zaman birimi ister. | Yeni yük girdisiyle rota (tahmin): {km} km · {min} dk (geçen SI dakika) | Route with updated load input (estimate): {km} km · {min} min (elapsed SI minutes) |
| `dyn.applied.observation` | Gözlem kaynağı model çıktısı ise yalnız “yeni rota” yetersiz bağlam verir. | Model girdisi güncellendikten sonra rota (tahmin): {km} km · {min} dk (geçen SI dakika) | Route after model input update (estimate): {km} km · {min} min (elapsed SI minutes) |

### Eşiklerin dürüst sunumu

| Kural | Araştırma sonucu | Metin/ürün önerisi |
|---|---|---|
| Kalan O₂ veya süre payı <%40 | NASA, Apollo, Norcross EWT, BASALT/SEXTANT veya erişilebilen Mars EVA kaynaklarında bu oran için normatif/deneysel dayanak bulunamadı. Kaynak bulunamadı. | “Simülasyon tasarım eşiği (%40)” olarak belirt; O₂ yüzdesi ve süre yüzdesini ayrı hesapla/göster. Kurumsal limit veya fizyolojik eşik diye sunma. |
| Dönüş maliyeti kalan bütçenin %80'ine yaklaşınca “dönüşü olmayan nokta” | %80 değeri veya bu uygulama için doğrulanmış bir point-of-no-return eşiği bulunamadı. “Yaklaşır” için tolerans/histerezis de tanımlı değil. | “Dönüş payı uyarısı” kullan. Gerçek PNR demek için belirli kaynak modeli, hata payı, dönüş güzergâhı ve bağımsız operasyonel onay gerekir. |
| 3.5 km ve 1 saat walk-back | Bu Mars EVA önerisini birincil kaynakta doğrulayamadım. 3.5 km/sa hızla bir saatte 3.5 km, ancak aritmetik/varsayımsal mesafe olur; Mars'ta doğrulanmış hız değildir. NASA'nın erişilen 2024 Ay CONOPS belgesi rover arızası için <5 saat yürüyüş ve yaklaşık 10 km'yi 2 km/sa varsayımıyla söyler; eğim/engel hesabı olmadığını açıkça belirtir (s.42). 2026 NASA/NTRS aramasında 1 saat / 2.0 km **Ay** simülasyonlu CO₂ contingency çalışması bulundu; bu Mars tavsiyesi değil. | 3.5 km/1 saat'i Mars kuralı olarak kullanma. Kaynaklı emsal verirken bağlamı “Ay” diye etiketle; Mars rotası süresini model tahmini ve SI geçen dakika olarak göster. |
| Apollo LRV walkback | NASA OCHMO teknik özeti, Ay'da Apollo LRV operasyonlarının 7.6 km “Walkback Limit” içinde tutulduğunu ve bunun rover arızasında yaya dönüş kabiliyeti olduğunu söylüyor (s.2). | Bu tarihsel Ay operasyon emsalidir; Mars insanı, Mars suit'i veya bu simülasyonun rota eşiği değildir. |
| EWT/Norcross 2009 | NASA/TP-2009-214796 tam metninin açık kopyası LPI/USRA üzerinden bulundu ve okundu. Rapor 10 km yürüyüşünü Ay bağlamında 6 uygun erkek astronotla test ediyor; Executive Summary (basılı s.1, PDF s.8) der ki: “All subjects completed the 10-km walkback in less than 2 hours.” Aynı özet, Mars benzetimli 3/8-g testlerinde hızlı yürüyüşte fizyolojik eforun maksimuma yaklaştığını bildiriyor. | 10 km/2 saat Ay walkback senaryosudur; Mars için operasyonel eşik değildir. [Açık tam metin](https://www.lpi.usra.edu/lunar/artemis/NorcrossEtAl_NASA-TP-2009-214796_EVA%20Walkback%20Test.pdf) |
| BASALT / SEXTANT | Açık erişimli makale özeti SEXTANT'ın mevcut kaynak tahsislerine göre plan traverslerini iyileştirdiğini söylüyor; %40/%80 eşiği veya Mars operasyonel PNR değeri vermiyor. Tam metin bu oturumda okunamadı (yayıncı yönlendirme hatası). | Yalnız kavramsal olarak kaynak kısıtlı planlama örneği diye an; sayısal eşiği bu projeye mal etme. |

### Süre birimi: sol ile karıştırmayın

`{min}` alanı bir duvar saati zamanı değil, rota modeliyle hesaplanan **geçen süre** olmalıdır. Metinde `dk` / `min`, 60 SI saniyelik dakika anlamında ve Dünya dakika birimidir; “sol dakika” değildir. Gösterilen süre ölçüm değil planlayıcı tahminidir. Kaynakların çoğu Ay simülasyonu veya Dünya analogudur; Mars yerçekimi (3.71 m/s²), Mars EVA suit'i, Gale topografyası ve Mars'a özgü biyomedikal/operasyon onayı bu eşiklerde doğrulanmış değildir.

### Kullanılmaması gereken ifade ve iddialar

- “Güvenli”, “garanti”, “NASA onayladı”: sistem için doğrulanmış kanıt yok.
- “Dönüşü olmayan nokta”: %80 eşiği kanıtlanmadı ve kalan kaynak hesabı ölçüm değil.
- “%40 NASA/NASA EVA sınırı”: kaynak bulunamadı; ürün tasarım kararı.
- “Kask kamerası tespit etti”: ancak canlı kamera/algı sistemi gerçekten varsa kullanılabilir. Modelin harita katmanı ise “model adayı işaretledi” denmeli.
- “Kalan süre/O₂ kesin”: hesap modeli belirsizlik ve donanım tüketimini ölçmüyorsa “hesaplanan/tahmini” ile etiketlenmeli.
- `{min}` alanını Mars yerel saati veya sol ile aynı birimmiş gibi sunma.

## Kaynaklar ve doğrulama notları (erişim: 2026-11-15)

| Kaynak | Yer / kısa alıntı | Bu rapordaki kullanım ve durum |
|---|---|---|
| Yerel UI: `sim/data/texts.json`, dal `batu/custom-mission`, `ui.dyn.*` | `dyn.msg.reserve`: “%40'ın altına indi”; `dyn.urgent`: “dönüşü olmayan nokta olabilir”; applied metinleri `{km}` / `{min}` gösteriyor. | TAM METİN OKUNDU; mevcut metin denetiminin girdisi. |
| NASA, EHP Integrated Concept of Operations, EHP-10033 Rev B Admin Chg 1, 20 June 2024, §4.1.4.9, p.42. | “less than a 5-hour walk back”; “approximately 10 km”; hız “2 km/hr”; “does not account for slope or obstacles”. [PDF](https://ntrs.nasa.gov/api/citations/20240011450/downloads/EHP-10033_EHP%20Integrated%20Con%20Ops%20RevB_Final.pdf) | TAM METİN OKUNDU. Lunar rover arızası bağlamı; Mars'a genellenmedi. |
| NASA OCHMO Technical Brief OCHMO-TB-023, Extraterrestrial Surface Transport Vehicles (Rovers), 2023-11-28, p.2, “Walkback Limit”. | “7.6 km ‘Walkback Limit’”; “if the LRV stopped working”. [PDF](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-023-extraterrestrial-surface-transport-vehicles-rovers.pdf) | TAM METİN OKUNDU. Apollo/Ay bağlamını doğrulamak için. |
| Norcross, J. R. et al. (2009), *Feasibility of Performing a Suited 10-km Ambulation on the Moon: Final Report of the EVA Walkback Test (EWT)*, NASA/TP-2009-214796. [LPI/USRA açık tam metin](https://www.lpi.usra.edu/lunar/artemis/NorcrossEtAl_NASA-TP-2009-214796_EVA%20Walkback%20Test.pdf) | Executive Summary, basılı s.1 (PDF s.8): “All subjects completed the 10-km walkback in less than 2 hours”; aynı özet Mars 3/8-g hızlı yürüyüşte near-maximal effort der. | TAM METİN OKUNDU. Walkback deneyi Ay senaryosudur; Mars 3/8-g kısmı ayrı metabolik testtir. |
| Scott, I. et al. (2019), “Future Needs for Science-Driven Geospatial and Temporal Extravehicular Activity Planning and Execution,” *Astrobiology*. | Abstract: “SEXTANT improved plan traverses based on available resource allocations.” [Yayıncı](https://journals.sagepub.com/doi/10.1089/ast.2018.1838) | ÖZET OKUNDU; yayıncı tam metin yönlendirmesi erişilemedi. Kavramsal planlama dışında eşik kanıtı değil. |
| NASA NTRS 20240013261 (2024), “Time Course of Effects of Carbon Dioxide Exposure in a Simulated Surface EVA Contingency Scenario.” | “simulating a 2.0 km contingency EVA walkback to a habitat on the lunar surface”; 1 saat, 15 kişi. [NASA NTRS](https://ntrs.nasa.gov/citations/20240013261) | Özet ve açık PDF içeriği okundu; Ay/Lunar VR ve CO₂ contingency çalışmasıdır. Mars 3.5 km/1 saat kuralını desteklemez. |
| Kluis, L. (2024), *A Novel Metabolic Model for Ambulation in Hypogravity and Applications to Planetary Extravehicular Activity*, Texas A&M dissertation. | Abstract “a path planning tool to optimize metabolic cost”; deney/model değişkenleri gravity, speed, incline. [Açık kurumsal tez kaydı](https://oaktrust.library.tamu.edu/items/3a4cf95a-78b4-42a7-b15a-ee4c581e5adb) | Özet okundu; başlık/yıl Ogilvie 2026 diye kullanıcı tarafından belirtilen kaynağı doğrulamaz. Ogilvie 2026 iddiası için bu oturumda eşleşen birincil kaynak bulunamadı. |
