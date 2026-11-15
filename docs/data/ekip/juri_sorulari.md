# Jüri soruları — 2026-11-15

Sunum hazırlığı; araştırma teslimatıdır, uygulama değiştirilmedi. Belgeler `C:/Users/Batu/Desktop/mm-pr/main-wt` üzerinden okundu; aşağıdaki bağlantılar okunan kopyalara gider. Erişim tarihi: **2026-11-15**. Yerel test sonuçları ekip kayıtlarıdır; bu çalışmada testler yeniden çalıştırılmadı. Çelişkide tarihli denetim, eski doğrulama raporundan önce kullanıldı; öneri, uygulanmış özellik sayılmadı.

## 20 soru ve kısa yanıtlar (2026-11-15)

### 1. Veriler gerçekten Mars'tan mı, görüntüdeki her taş gerçek mi?

**Cevap:** Arazi yükseklikleri ve ortogörüntü Mars yörünge verilerine, zemin sınıflandırmasının girdileri Curiosity görüntülerine dayanıyor; yakın plan detayları ve modelin veri olmayan yere yaydığı sınıflar ayrıca modelleniyor. Görsel ayrıntı, ölçülmüş çözünürlükten daha yüksek bilimsel doğruluk anlamına gelmiyor.

**Dayanak:** [Veri kaynakları][veri], [katman üretimi][katman]; USGS ürün sayfaları bu tur doğrudan açılışta **403** verdi, dolayısıyla ürün metadatası bu tur yeniden doğrulanmadı.

**Kaçın:** “Ekrandaki her taşın yeri ve boyutu ölçülmüş.”

### 2. Gerçek bir astronot bunu yarın kullanabilir mi; ‘güvenli rota’ ne demek?

**Cevap:** Şu an bu, rota seçeneklerini ve varsayımların etkisini karşılaştıran bir prova prototipi; operasyonel güvenlik sertifikası veya Mars'ta insan doğrulaması yok. ‘Güvenli’ yerine, tanımladığımız maliyetler ve kısıtlar altında daha düşük risk puanı alan rota diyoruz.

**Dayanak:** [EVA parametreleri][eva], [denetim][denetim], [akış testinin sınırları][akis].

**Kaçın:** “Astronotun güvenliğini garanti ediyor.”

### 3. Neden Gale ve boxwork; burası insan inişi için seçildi mi?

**Cevap:** Gale, Curiosity'nin görüntüleri ve gerçek geçiş izi sayesinde karşılaştırma yapabildiğimiz bir çalışma alanı; boxwork ise yeraltı suyuyla ilişkili oluşum hipotezi nedeniyle bilimsel açıdan ilginç. NASA'nın insan iniş alanı seçimini veya yaşam bulunduğunu iddia etmiyoruz.

**Dayanak:** [Rota karşılaştırması][denetim]; [NASA/JPL boxwork açıklaması](https://www.jpl.nasa.gov/images/pia26560-curiosity-views-boxwork-patterns-at-a-distance/), açıklama: “believed to have formed from groundwater trickling through rock cracks”.

**Kaçın:** “NASA astronotları buraya indirecek.”

### 4. Makine öğrenmesi modeliniz ne kadar başarılı?

**Cevap:** Ekip kaydında, üç uzman etiketinin uzlaştığı test piksellerinde mIoU yaklaşık **0,798**; bu, tüm haritada yüzde 79,8 doğru karar veya görev başarısı demek değil. Aynı değerlendirmede büyük kaya IoU'sunun yaklaşık **0,294** olması, sınıflar arasında belirgin fark bulunduğunu gösteriyor.

**Dayanak:** [METRICS][metrik], `ml/rover_terrain/metrics_test.json`, `test_min3`: mIoU 0,7984 ve bigrock IoU 0,2944; saha alanına aktarım ayrıca doğrulanmalı.

**Kaçın:** “Yapay zekâmız Mars'ta yüzde 98 güvenilir.”

### 5. SCAN_CHECK gerçekten kum tehlikesini doğruladı mı?

**Cevap:** Hayır; kayıtlı altı duraklık tarayıcı kontrolünde üç eşleşme, bir kısmi eşleşme ve iki başarısızlık var, başarısız örnekler kumlu zemin içeriyor. Bu küçük, elle seçilmiş ve uzman yer gerçeği olmayan kontrol, genel başarı oranı çıkarmaya yetmez ama kaçırılan tehlikeleri açıkça gösterir.

**Dayanak:** [SCAN_CHECK][scan], baştaki tarayıcı kuralı karşılaştırması; belgenin sonraki segmentasyon karşılaştırması ayrı değerlendirmedir.

**Kaçın:** “Kum algılama sahada doğrulandı.”

### 6. Entropy düşükse modelden emin olabilir miyiz; tüm araziyi görüyor musunuz?

**Cevap:** Normalize entropy, sınıf olasılıklarının dağınıklığını gösterir; hata olasılığı veya güvenlik sertifikası değildir ve düşük entropy ile yanlış tahmin de kaydedilmiş. Harita katmanları, Navcam gözlemlerinden uzaklığa bağlı yayılım içerdiği için her hücre doğrudan gözlenmiş zemin değildir.

**Dayanak:** [LAYERS][katman], entropy tanımı ve mekânsal yayılım; [SCAN_CHECK][scan], `s120d3056` örneği.

**Kaçın:** “Düşük entropy olan her yer güvenlidir.”

### 7. Planlayıcı Curiosity'den yaklaşık 1,5 km kısa yol bulduysa NASA'dan daha mı iyi?

**Cevap:** Hayır; son denetim kaydında en kısa seçenek **2257,9 m**, Curiosity referansı **3887,6 m**, ancak başlangıç–bitiş karşılaştırması bilim duraklarını ve rover operasyon hedeflerini eşitlemiyor. Bu fark algoritmanın kestirme ürettiğini gösterir; insan enerji/süre modelini veya NASA'dan üstünlüğü doğrulamaz.

**Dayanak:** [Denetim §3][denetim]; [eski doğrulama raporunun][msl] sayıları ve katman durumu güncel kayıtla karıştırılmamalı.

**Kaçın:** “NASA'nın rotasını yüzde 40 iyileştirdik.”

### 8. ‘En kısa’, ‘dengeli’ ve ‘en güvenli’ seçeneklerin hangisi gerçekten doğru?

**Cevap:** Bunlar mesafe, eğim ve zemin maliyetlerine farklı ağırlık veren alternatifler; tek bir fiziksel doğru rota ölçümü değiller. Tercihin nedenini ve modelin belirsizliğini kullanıcıya gösteriyoruz; ağırlıkların insanlı Mars operasyonuna uygunluğu doğrulanmadı.

**Dayanak:** [Güncel karşılaştırma ve sınırlamalar][denetim], [parametre gerekçeleri][eva].

**Kaçın:** “En güvenli düğmesi gerçek kaza olasılığını en aza indiriyor.”

### 9. İnsan için 15° riskli, 25° geçilmez eşiğini NASA mı belirledi?

**Cevap:** Hayır; bu projedeki **15° ve 25°**, insan için doğrulanmış NASA eşikleri değil, açıkça işaretlenmesi gereken planlama varsayımları. Rover geçişleri bu değerleri insanlara aktarmayı haklı çıkarmaz; ayrıca hücrenin en dik eğimi ile yürüyüş yönündeki eğim aynı büyüklük değildir.

**Dayanak:** [Gerçek parametre araştırması][tur1], [MSL eğim dağılımı][egim], `api/planner/params.py`.

**Kaçın:** “25° NASA'nın astronot yürüyüş sınırı.”

### 10. Enerji modeliniz Mars'ta doğrulandı mı; 272 W neyi temsil ediyor?

**Cevap:** Hayır; Pandolf Dünya kökenli bir model ve kodun **272 W** düz zemin referansı, dinlenme de içeren Apollo EVA ortalamasından alınmış bir kalibrasyon tercihi. Bu eşleme, Mars skafandrıyla yürüyüşü doğrulamaz ve çıktının kesin alt sınır olduğu da kanıtlanmış değildir.

**Dayanak:** [Metabolik model][metabolik], [parametre araştırması][tur1], [ikinci tur enerji incelemesi][tur2].

**Kaçın:** “Astronotun harcayacağı kaloriyi bilimsel kesinlikle hesaplıyoruz.”

### 11. Mars'ın 0,378 g değerini enerjiye doğrudan çarpmak neden yanlış olabilir?

**Cevap:** Ağırlığın azalması vücut ve skafandr kütlesini, hareket ataletini ve tüm metabolik bileşenleri aynı oranda azaltmaz. Farley–McMahon'un benzetilmiş düşük yerçekimi deneyinde yerçekimi yüzde **75** azalırken yürüme enerjisi yalnız yüzde **33** azalmış; bu sonuç doğrusal ölçeklemeye karşı kanıttır, kendi başına Mars regresyonu değildir.

**Dayanak:** [Farley & McMahon, 1992, özet](https://pubmed.ncbi.nlm.nih.gov/1490989/), “decreased by only 33%”; [katsayı ve geçerlilik denetimi][tur2].

**Kaçın:** “Mars kalorisi Dünya kalorisinin tam yüzde 37,8'idir.”

### 12. HUD'daki oksijen gerçek bir PLSS kapasitesi veya sensör ölçümü mü?

**Cevap:** Hayır; tüketim enerji hesabından dönüşümle tahmin ediliyor, gerçek zamanlı oksijen sensörüne bağlı değil. Mevcut **420 L** bütçesi varsayım; belgelerdeki **370 L** önerisi de doğrudan doğrulanmış Mars PLSS kapasitesi sayılmamalı.

**Dayanak:** [EVA parametreleri][eva], [O₂ ve kapasite ayrımı][tur1], `api/planner/params.py`; öneri ile uygulanan değer ayrıdır.

**Kaçın:** “NASA skafandrında tam bu kadar oksijen var ve HUD kalanını ölçüyor.”

### 13. 60 µGy NASA'nın EVA radyasyon limiti mi?

**Cevap:** Hayır; **60 µGy** proje içi bütçe varsayımı, doğrulanmış NASA EVA limiti değil. NASA-STD-3001 Vol 1 Rev C'deki **600 mSv** kariyer etkin doz sınırı farklı kapsam ve doz büyüklüğüdür; µGy ile doğrudan eşitlenemez ve EVA başına bölünerek kullanılamaz.

**Dayanak:** [Parametre denetimi][tur1]; [NASA-STD-3001 Vol 1 Rev C](https://standards.nasa.gov/sites/default/files/standards/NASA/C/nasa-std-3001-vol-1-rev-c-signature.pdf), §4.8.2, basılı s.40; “shall be less than 600 mSv”.

**Kaçın:** “60 µGy altında NASA'ya göre radyasyon açısından güvenliyiz.”

### 14. Dönüş payı ve EVA süresi NASA kurallarıyla mı belirleniyor?

**Cevap:** Kodun **30 dakika** yedeği Mars için doğrulanmış evrensel kural değil; süre ve dönüş hesabı varsayımları görünür olmalı. **3,5 km** yürüyerek dönüş önerisi de Ogilvie'nin belirli hız ve skafandr kapasitesi koşullarına bağlı değerlendirmesi; her eğim ve zeminde geçerli menzil değildir.

**Dayanak:** [İkinci tur, süre/dönüş incelemesi][tur2]; [Ogilvie vd., Mars Spacesuit Mass Requirements, ICES-2026-127](https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf), s.11, Walking Speed.

**Kaçın:** “NASA her Mars EVA'sı için 30 dakika yedek ve 3,5 km dönüş sınırı koyuyor.”

### 15. Kum uyarısının gerçek dayanağı ne; yüzde 40 kum ne demek?

**Cevap:** Curiosity çalışmasında tekerlek çapının yaklaşık **%30'u** kadar batma ve **%77'ye** ulaşan kayma raporlanması, kumlu arazinin rover için ciddi hareket riski olabildiğini gösterir; bunlar astronot sonuçları değildir. `p_sand >= 0.4` ise modelin kum sınıfı skoruna uygulanan proje eşiği; yüzde 40 batma, kaza veya insanın geçememe olasılığı değildir.

**Dayanak:** [Kaynaklı kum metinleri][kum]; [Arvidson vd., 2017, JFR, özet](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21647), tekerlek batması ve azami kayma; insan eşikleri türetilmedi.

**Kaçın:** “Astronot bu kumda yüzde 77 kayar.”

### 16. HiRISE DEM görüntüyle kayıyorsa nasıl düzelttiniz; sorun tamamen çözüldü mü?

**Cevap:** Yerel hizalama çalışması yaklaşık **30,7 m doğu / 33,5 m güney** ofset saptayıp kaydırılmış yükseklik ve navigasyon karoları üretmiş. Son denetime göre bu karolar `?tiles=tiles_shifted` ile seçiliyor, varsayılan hâlâ `tiles`; tüm haritanın bağımsız metrik doğruluğu veya sunum oturumunda doğru setin açıldığı bu çalışmada doğrulanmadı.

**Dayanak:** [DEM_KAYMA][dem], [denetim §2][denetim], `sim/app/main.js` karo seçicisi; kaydırma, DTM'nin özgün çözünürlüğünü artırmaz.

**Kaçın:** “DEM kayması her yerde tamamen düzeltildi; hata yarım metre.”

### 17. Yakın plan güzel görünüyorsa gerçek zemini ve basılacak taşı biliyor musunuz?

**Cevap:** Hayır; metre düzeyindeki DTM, astronotun her adımındaki küçük taşları ve taşıma dayanımını çözmez. Detay dokusu ve sentetik geometri görsel prova sağlar; ayak yerleştirme doğrulaması veya zemin taşıma kapasitesi ölçümü olarak sunulmamalı.

**Dayanak:** [Veri çözünürlükleri ve görsel katmanlar][veri], [varlık manifesti][varlik], [denetimin dokulara ilişkin notları][denetim].

**Kaçın:** “Gösterilen ayak izi gerçek Mars'ta basılabilecek noktadır.”

### 18. Gerçek GPU'da kaç FPS; performansı ölçtünüz mü?

**Cevap:** Elimizdeki akış kaydı headless Chrome ve yazılımsal grafik yolunda yaklaşık **1 FPS** bildiriyor; bunu fiziksel GPU performansı diye sunamayız. Bu görevde gerçek GPU üzerinde güncel, tekrarlanabilir FPS ölçümü yapılmadı; tamamlanan akış kontrolleri de gerçek zamanlı tüm yürüyüşü ölçmüyor.

**Dayanak:** [AKIS_TESTI][akis], yazılımsal GL ortamı ve `setProgress` ile hızlandırılmış ilerleme; eğitim GPU'su bilgisi görüntüleme performansı değildir.

**Kaçın:** “Her bilgisayarda akıcı 60 FPS çalışıyor.”

### 19. Tarayıcı yeni tehlikeyi gerçekten görüyor mu; yeniden planlama neyi kanıtlıyor?

**Cevap:** Gösterimdeki sanal tarayıcı önceden üretilmiş model katmanlarıyla çalışıyor; yeni fiziksel sensör ölçümü yapmıyor ve bazı kum olayları önceden seçilmiş senaryo tetikleri. `/replan` çağrısının yeni rota üretmesi yazılım akışını gösterir, yanlış zemin tahminini kendiliğinden düzelttiğini göstermez.

**Dayanak:** [Katman üretimi][katman], [SCAN_CHECK][scan], [demo senaryoları][demo], [akış testi][akis].

**Kaçın:** “Yapay zekâ canlı Mars yüzeyini tarayıp her tehlikeyi anında gideriyor.”

### 20. Lisanslar temiz mi; NASA ve CC0 demek her şeyi serbestçe kullanabiliriz mi?

**Cevap:** Lisanslar varlık bazında ele alınmalı: Poly Haven ve ambientCG doku varlıkları CC0, Three.js bileşenleri ise kendi MIT koşullarına tabi. NASA materyallerinde kaynak gösterimi ve üçüncü taraf hakları kontrol edilmeli; AI4Mars ayna/orijinal lisans farkı ekip kaydında bulunduğu için tüm veri sürümünün yeniden bağımsız lisans doğrulaması tamamlandı diyemeyiz.

**Dayanak:** [Varlık manifesti][varlik], [sim varlıkları][assets], [AI4Mars lisans kaydı][ai4mars]; [Poly Haven](https://polyhaven.com/license/) “Our assets are all licensed as CC0”, [ambientCG](https://docs.ambientcg.com/license/), [NASA medya kuralları](https://www.nasa.gov/nasa-brand-center/images-and-media/) “NASA should be acknowledged as the source of the material.”

**Kaçın:** “Projedeki her şey CC0 ve NASA ürünü onaylıyor.”

## Asla söylenmemesi gereken 8 iddia (2026-11-15)

1. “Bu araç astronot için güvenli rotayı garanti eder ve operasyona hazırdır.”
2. “Enerji ve oksijen modeli insanlarla Mars'ta doğrulandı; Mars tüketimi Dünya'nın tam 0,378 katıdır.”
3. “15°/25° insan yürüyüş eşikleri ve 60 µGy/EVA limiti NASA standardıdır.”
4. “Test mIoU'su görev başarı oranıdır; düşük entropy yanlış karar olmayacağını gösterir.”
5. “Curiosity'den kısa rota bulmamız NASA'dan iyi planladığımızı ve insan enerji modelimizi doğrular.”
6. “Roverın kumdaki kayma/batma yüzdeleri astronotlara aynen uygulanır.”
7. “DEM her yerde düzeltilmiştir ve gerçek GPU'da 60 FPS ölçülmüştür.”
8. “Tüm varlıklar CC0'dır; NASA görselleri koşulsuzdur ve NASA projeyi onaylıyor.”

## Okunan ekip kayıtları — bağlantı dizini (2026-11-15)

Bağlantılar sunum hazırlığında incelenen main-wt kopyalarına gider; depo taşındığında aynı göreli dosya adları izlenmeli. Dış kaynak alıntıları özgün dilinde kısa tutuldu; sayısal model çıktıları bağımsız fiziksel ölçüm gibi değerlendirilmedi.

[veri]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/sim/VERI_KAYNAKLARI.md
[denetim]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/sim/DENETIM_masa_arastirmalari_2026-11-15.md
[eva]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/eva_parameters.md
[metabolik]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/metabolic_model.md
[msl]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/validation_msl.md
[tur1]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/data/ekip/gercek_parametre_arastirmasi.md
[tur2]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/data/ekip/gercek_tur2_enerji_modeli.md
[kum]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/data/ekip/kum_uyari_metinleri.md
[egim]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/data/ekip/msl_egim_dagilimi.md
[metrik]: C:/Users/Batu/Desktop/mm-pr/main-wt/ml/rover_terrain/METRICS.md
[scan]: C:/Users/Batu/Desktop/mm-pr/main-wt/ml/rover_terrain/SCAN_CHECK.md
[katman]: C:/Users/Batu/Desktop/mm-pr/main-wt/ml/rover_terrain/LAYERS.md
[akis]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/sim/AKIS_TESTI.md
[dem]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/sim/DEM_KAYMA.md
[varlik]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/data/ekip/varlik_manifest.md
[assets]: C:/Users/Batu/Desktop/mm-pr/main-wt/sim/ASSETS.md
[ai4mars]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/data/ai4mars.md
[demo]: C:/Users/Batu/Desktop/mm-pr/main-wt/docs/demo_senaryolari.md
