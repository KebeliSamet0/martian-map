# Curiosity traverse eğim dağılımı: rover kanıtı, insan yürüyüş eşiği değildir (2026-11-15)

## Sonuç (2026-11-15)

**Gerçek kayıtlı traverse, genel ızgaradan daha düşük eğimli hücrelerden geçiyor:** benzersiz hücre medyanı **8.84°**, p90 **16.76°**; genel ızgarada **13.32° / 31.31°**. Bununla birlikte çizginin kestiği hücrelerin **%1.9742**'ünde DEM eğimi **>25°**. Bu gözlem, 25°'nin bu veri için kusursuz bir “gerçekte geçilmez hücre” etiketi olmadığını gösterir; **insan için güvenli sınır veya rover'ın fiziksel olarak 50° eğimde sürdüğü kanıtı değildir**.

**Yol yönü önemlidir:** en dik hücre eğimi yerine DEM gradyanının iz yönündeki bileşeninde uzunluk ağırlıklı mutlak medyan **5.39°**, p99 **23.87°**. Rota yönü, hücrenin en dik yönüyle aynı değildir. Ancak bu da rover IMU/pitch/roll ölçümü değil, DEM'den türetilen bir niceliktir.

**Model:** p_sand>0.4 olan yalnız **3 benzersiz hücre**, iz boyunca **5.814 m = %0.1496** var. Bu hücrelerden kayıtlı traverse geçiyor. **“Curiosity yüksek kum olasılığından kaçınmış” sonucu doğrulanmadı**; kaçınılan alan etiketleri, alternatif görev hedefleri ve bağımsız yer gerçeği yok.

**Eski doğrulama tarihsel:** `docs/validation_msl.json` “zemin modeli yok” derken bugünkü hesap **tam zemin modeli** ile çalıştı. Süre/enerji ve bazı rota ağırlıkları değişmiş. Eski dosya değiştirilmedi.

Kaynak dosyalar: `layers/{slope,elevation,p_sand,p_bigrock,entropy}.npy`, `layers/msl_proposed_path.json`, `docs/validation_msl.json`, `scripts/compare_msl.py`, `api/planner/{comparison,cost,params,route,layers}.py`. Tam veri izi ve komutlar aşağıdadır.

## Veri anlık görüntüsü ve kapsam (2026-11-15)

- Hesap UTC: **2026-11-15T03:46:24.002130+00:00**; İstanbul saati UTC+3.
- Okunan ekip deposu: `C:/Users/Batu/Desktop/mm-pr/martian-map`.
- Yerel `refs/heads/main` dosyasında görülen SHA: `42f60aaf5cbebda49026ebd9ccfaf7818e86c915`. Çalışma dosyalarının Git commit objelerine birebir eşitliği ayrıca doğrulanmadı; gerçek hesap girdilerinin **SHA-256** değerleri bu raporun sonunda. Dosyalar işlem öncesi/sonrası aynı kaldı.
- Grid: **1000×1000**, **2 m** hücre; px **[sütun,satır]**, hücre indisi `floor`. Kaynak: `contracts/grid.json`.
- Kaynak traverse: **854** nokta; tamamı grid içinde kaldı. Sürekli çizginin projeksiyon düzlemindeki uzunluğu **3887.557574 m**. JSON'da yuvarlak uzunluk **3887.5 m** yazıyor; koordinatlardan yeniden hesaplanan sayı esas alındı. Kaynak: `layers/msl_proposed_path.json`.
- Dosyanın kaynak alanı [NASA/JPL MSL_traverse.json](https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json); sol kapsamı “yaklaşık 4459–4983”. Bu oturumda uzak NASA dosyası tekrar indirilmedi; analiz repo kopyasına aittir. `simplification` alanı ham 14336 noktadan 854 nokta, ≥1 m aralık ve maksimum 0.79 m sadeleştirme sapması bildiriyor; bu iddianın bağımsız doğruluğu ve toplam jeolokasyon hatası **doğrulanmadı**.
- Bütün NPY'ler Float32 [1000,1000], sonlu; DEM metre, slope derece, olasılıklar ve entropy [0,1].
- Yalnız **bu Markdown teslimatı** yazıldı. Kaynak kod, `sim/`, `.borje/`, Git, ayarlar ve eski doğrulama dosyaları değiştirilmedi. Yardımcı Python dosyası, JSON/PNG çıktı veya veri kopyası oluşturulmadı.

## 1. Gerçek traverse üzerindeki hücre eğimi (2026-11-15)

### Örnekleme tanımı (2026-11-15)

Birincil sonuç, kayıtlı **sürekli polyline'ın pozitif uzunlukla kestiği benzersiz hücrelerdir**. Her parça integer sütun/satır sınırlarında bölündü, her açık alt aralığın orta noktasına `floor` uygulandı. Yalnız köşeye değen, sıfır uzunluklu yan hücreler sayılmadı. Böylece **3311** alt aralık ve **2330** benzersiz hücre elde edildi. Aynı hücreye dönüş, benzersiz istatistikte bir; uzunluk ağırlığında toplam geçirilen çizgi uzunluğu kadar sayılır. Toplam alt aralık uzunluğu orijinal polyline uzunluğuyla <1e-8 m farkla eşleşti.

Bu, **kayıtlı iz çizgisinin DEM hücreleriyle kesişimidir**. Lastik temas alanı, gerçek sürüş gövde eğimi veya bütün ara noktaların bağımsız lokalizasyon ölçümü değildir. Sadeleştirme, iz doğruluğu ve 2 m DEM çözünürlüğü küçük hücre kuyruklarını etkiler.

Karşılaştırma için repodaki `api/planner/comparison.py::_cells(...,driven=True)` de aynen çalıştırıldı: önce düğümleri floor'a indirir, sonra hücre uzayında `rint(linspace)` ile örnekler. **1785** sıra elemanı, **1703** benzersiz hücre üretir; sürekli çizginin kestiği her hücreyi sayma yöntemi değildir. Izgaraya indirgenmiş yol uzunluğu **4141.271570 m**, sürekli yoldan yaklaşık **%6.53** fazladır. Bu fark “rover fazladan sürdü” demek değil, rasterizasyon farkıdır.

### Dağılım (2026-11-15)

Tüm açılar derece. Benzersiz/grid/örnek dizisi yüzdelikleri NumPy'nin doğrusal percentile yöntemidir; uzunluk ağırlıklı yüzdelikler ağırlıklı CDF'nin ilk eşik aşımıdır. Bir hücreden yalnız kısa köşe geçişi ile uzun geçiş arasındaki farkı uzunluk sütunu gösterir.

| Örnekleme | N | Ortalama | Medyan | p90 | p99 | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Genel ızgara | 1000000 | 16.000 | 13.324 | 31.311 | 47.180 | 76.824 |
| Traverse: benzersiz kesilen hücre | 2330 | 9.791 | 8.839 | 16.755 | 30.476 | 50.290 |
| Traverse: uzunluk ağırlıklı | 2330 | 9.887 | 8.933 | 16.878 | 32.136 | 50.290 |
| Repo `_cells` örnek dizisi | 1785 | 9.913 | 8.963 | 16.875 | 32.156 | 45.748 |

Genel ortalama **16.000139°**; istenen yaklaşık 16° kontrolü sağlandı.

| Eğim dilimi | Genel hücre % | Traverse benzersiz hücre % | Traverse uzunluk % | Repo örnek dizisi % |
| --- | ---: | ---: | ---: | ---: |
| 0 ≤ s < 5° | 9.8876 | 18.2833 | 18.0091 | 17.9832 |
| 5 ≤ s < 10° | 25.1847 | 40.8584 | 40.4722 | 40.2241 |
| 10 ≤ s < 15° | 21.1953 | 26.1373 | 26.2928 | 26.3866 |
| 15 ≤ s < 20° | 14.7020 | 9.6567 | 9.8170 | 9.8599 |
| 20 ≤ s ≤ 25° | 10.2850 | 3.0901 | 3.4413 | 3.5854 |
| s > 25° | 18.7454 | 1.9742 | 1.9676 | 1.9608 |

Dilim sınırları tabloda açıktır; son dilim özellikle **>25°**. Kaynak script ayrıca **≥25°** sayar. Bu oturumun repo dizisinde ≥25° sayısı **35**; sürekli kesişimde >25° **46 benzersiz hücre**. 35 ile 46 farklı örnekleme/paydalardır, çelişen sayım diye ele alınmamalı.

### Dik uç örnekler (2026-11-15)

| px [sütun,satır] | DEM eğimi ° | Hücre içindeki iz uzunluğu m | p_sand | entropy |
| --- | ---: | ---: | ---: | ---: |
| [424,552] | 50.290 | 2.013 | 0.0307 | 0.1822 |
| [423,552] | 47.531 | 0.382 | 0.0307 | 0.1822 |
| [425,552] | 45.748 | 2.013 | 0.0307 | 0.1822 |
| [422,552] | 42.652 | 2.091 | 0.0307 | 0.1822 |
| [421,545] | 41.814 | 2.769 | 0.0013 | 0.1402 |

Maksimum hücre **[424,552]**, DEM değeri **50.290375°**; repo örnekleyicisinin maksimumu **45.747795°**. Bu nedenle tarihsel 45.7° sayısını rastgele 50.3° ile değiştirmek yerine örnekleme yöntemi birlikte kaydedilmelidir. Her ikisi de `slope.npy` değeridir; gerçek rover pitch/roll'u **ölçülmedi**.

### 1 m konum duyarlılığı (2026-11-15)

Her eksende −0.5/0/+0.5 px, yani −1/0/+1 m kaydırma, **yalnız duyarlılık deneyi** olarak bellekte uygulandı; kaynak rota düzeltilmedi. Bu deney ölçülmüş hata dağılımı değildir.

| Ek kayma px [doğu,güney] | Benzersiz hücre | Medyan ° | p90 ° | p99 ° | Max ° | >25° hücre % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| -0.5, -0.5 | 2336 | 8.723 | 16.830 | 29.605 | 50.290 | 1.8836 |
| 0.0, -0.5 | 2328 | 8.794 | 16.428 | 28.120 | 50.290 | 1.8900 |
| 0.5, -0.5 | 2336 | 8.740 | 16.320 | 27.516 | 50.290 | 1.7123 |
| -0.5, 0.0 | 2336 | 8.789 | 17.037 | 32.132 | 50.290 | 2.0548 |
| 0.0, 0.0 | 2330 | 8.839 | 16.755 | 30.476 | 50.290 | 1.9742 |
| 0.5, 0.0 | 2336 | 8.805 | 16.548 | 28.579 | 50.290 | 1.8408 |
| -0.5, 0.5 | 2336 | 8.828 | 17.505 | 32.259 | 50.017 | 2.1832 |
| 0.0, 0.5 | 2328 | 8.789 | 16.920 | 32.133 | 50.017 | 2.4485 |
| 0.5, 0.5 | 2336 | 8.700 | 16.610 | 29.551 | 50.017 | 2.1832 |

Medyan/p90 genel sonuçları korunuyor; kuyruk oranı ve p99 değişiyor. İzin fiziksel doğruluğu veya DEM'in zemindeki doğru yüzeyi temsil ettiği bu deneyle doğrulanmış olmaz.

## 2. Hücre eğimi ile yol yönü eğimi (2026-11-15)

### Formül ve anlam (2026-11-15)

Kaynak: `layers/elevation.npy`, `layers/slope.npy`, `contracts/grid.json`.

`g_c,g_r = numpy.gradient(H, 2 m)` bileşenleri doğru sırada row/column olarak alındı: kodda `g_r,g_c=np.gradient(H,res)`. Rota parçasının birim yönü `u=(u_c,u_r)`; satır yönü güneydir.

~~~text
s_max = atan(sqrt(g_c^2 + g_r^2))                  [derece]
s_along = atan(g_c*u_c + g_r*u_r)                  [derece, işaretli]
s_along_abs = abs(s_along)
~~~

Aynı hücre merkezi gradyanı ve o hücredeki gerçek parça yönü kullanıldı; alt aralık uzunluğu ile ağırlıklandırıldı. `slope.npy` ile DEM'den yeniden türetilen en dik eğimin maksimum farkı **3.807297e-6°**; ölçek ve türev tanımı tutarlı. Her aralıkta **|s_along| ≤ s_max + 0.001°** testi geçti.

| Metrik | Ortalama ° | Medyan ° | p90 ° | p99 ° | Max ° |
| --- | ---: | ---: | ---: | ---: | ---: |
| DEM hücre eğimi (aynı iz uzunluğu) | 9.887 | 8.933 | 16.878 | 32.136 | 50.290 |
| |Yol yönü eğimi|, gradyan izdüşümü | 6.457 | 5.393 | 13.214 | 23.866 | 40.469 |
| Hücre eğimi − |yol yönü eğimi| | 3.430 | 1.974 | 9.015 | 17.248 | 33.471 |
| Yükseklik farkı, 2 m taban; 1 m adım | 6.399 | 5.213 | 12.853 | 23.988 | 42.122 |
| Yükseklik farkı, 10 m taban; 1 m adım | 5.121 | 4.701 | 9.815 | 15.741 | 25.556 |

İlk üç satır aynı iz alt aralıklarında, **uzunluk ağırlıklı**. Son iki satır bağımsız kontrol: iz her **1 m**'de örneklendi (son kısmi aralık da eklendi, **3889 nokta**); DEM hücre merkezlerinden bilineer yükseklik alındı, `atan2(H(s+b/2)−H(s−b/2), b)` hesaplandı. Uçlarda taban gerçek mevcut yay uzunluğuna kırpıldı. Bu satırlar eşit örnek ağırlıklı, birinci yöntemin aynı türev çekirdeği değildir.

İşaretli izdüşüm: ortalama **2.999°**, min **-33.577°**, max **40.469°**; artı yürüyüş yönünde yükseliş, eksi iniş. Rota boyunca **%0.3325** uzunlukta hücre eğimi >25° olduğu hâlde yol yönü |eğim|≤15°; bu, >25° DEM bölümünün yaklaşık **%16.90**'sidir. Bütün dik hücreleri yalnız yön farkı açıklamıyor.

**Yorum:** Hücre eğimi en dik yerel yönü ölçer; yamaç eş yükselti doğrultusunda geçilebilir. Yol yönü eğimi boyuna yükselme/inişi ölçer. Yan eğim, tekerlek yerleşimi, rover geometrisi ve insan dengesi için tek başına along-track yeterli değildir. 10 m tabanındaki daha küçük kuyruk, çözünürlük/smoothing etkisidir; **ölçülmüş gerçek rover eğimi veya onaylı eşik değildir**. Bu veriden insanın 25°/40°/50° zeminde yürüyebileceği sonucu çıkarılamaz.

## 3. Traverse boyunca model ne söylüyor? (2026-11-15)

Kaynak: `layers/{p_sand,p_bigrock,entropy}.npy`. Olasılıklar boyutsuz, [0,1]. Hücre dağılımı benzersiz; uzunluk dağılımı aynı hücredeki gerçek çizgi uzunluğu ile ağırlıklı.

| Katman / örnekleme | Ortalama | Medyan | p90 | p99 | Max |
| --- | ---: | ---: | ---: | ---: | ---: |
| p_sand / Grid | 0.144691 | 0.155891 | 0.250381 | 0.358135 | 0.411600 |
| p_sand / İz benzersiz hücre | 0.072646 | 0.046779 | 0.188325 | 0.344866 | 0.411600 |
| p_sand / İz uzunluk ağırlıklı | 0.073594 | 0.049352 | 0.188325 | 0.372300 | 0.411600 |
| p_bigrock / Grid | 0.150693 | 0.159062 | 0.278763 | 0.334200 | 0.338700 |
| p_bigrock / İz benzersiz hücre | 0.073452 | 0.045328 | 0.196050 | 0.200200 | 0.338700 |
| p_bigrock / İz uzunluk ağırlıklı | 0.071902 | 0.041370 | 0.195792 | 0.256200 | 0.338700 |
| entropy / Grid | 0.696834 | 0.765009 | 1.000000 | 1.000000 | 1.000000 |
| entropy / İz benzersiz hücre | 0.423399 | 0.326000 | 0.977072 | 1.000000 | 1.000000 |
| entropy / İz uzunluk ağırlıklı | 0.417838 | 0.318200 | 0.951615 | 1.000000 | 1.000000 |

### Kum ve büyük kaya eşikleri (2026-11-15)

- **p_sand > 0.4:** grid **%0.0351**; traverse **3/2330 = %0.1288** benzersiz hücre; **5.814399 m / 3887.557574 m = %0.1496** uzunluk. Eşitlik değil, strict >0.4 kullanıldı.
- **p_bigrock > 0.4:** grid ve traverse **%0**; maksimum zaten **0.3387**. Bu, gerçek yolda büyük kaya yok anlamına gelmez; model eşik üstüne çıkmıyor.
- **entropy ≥0.6:** grid **%64.6238**; traverse benzersiz hücre **%30.4721**, iz uzunluğu **%28.9853**. Gerçek kayıtlı yolda bile modelin belirgin bölümü belirsiz.

| p_sand>0.4 hücresi | p_sand | Geçilen çizgi m | DEM eğimi ° | entropy |
| --- | ---: | ---: | ---: | ---: |
| [470,581] | 0.4116 | 0.996 | 19.078 | 0.4724 |
| [470,582] | 0.4116 | 2.044 | 19.983 | 0.4724 |
| [471,582] | 0.4116 | 2.775 | 16.328 | 0.4724 |

**Kaçınma tutarlılığı hükmü: doğrulanmadı.** Repo gerçek geçmiş yol içerir; “rover'ın görüp özellikle kaçındığı hücreler”, alternatif görev hedefleri, slip/çekiş durumu ve bu üç hücrede bağımsız zemin etiketi yok. Geçmiş yol bu hücreleri kestiği için p_sand>0.4'ü mutlak “Curiosity bile geçemez” etiketi yapmak bu kayıtla uyuşmaz. Fakat 5.8 m'lik model-etiketli kesişim, yüksek kumun güvenli olduğu kanıtı da değildir.

Yolda ortalama p_sand daha düşükken >0.4 oranının bütün grid oranından yüksek olması mümkündür. Bütün grid tarafında rover kanıtından uzak hücreler **0.25'e** yaklaştırılıyor; yol ise daha çok gözlenen koridorda. Ayrıca modelin girdisi aynı rover güzergâhından Navcam'lerdir: bu karşılaştırma **bağımsız bir kaçınma/genelleme testi değildir**. Kaynaklar: `pipeline/spread_terrain.py`, `ml/rover_terrain/LAYERS.md`, `ml/rover_terrain/METRICS.md`, `ml/rover_terrain/SCAN_CHECK.md`. Bu belgeler kum kaçırma ve yanlış büyük kaya alarmı sınırlarını anlatır; saha doğruluğu burada tekrar etiketlenmedi.

## 4. Tarihsel validation_msl ile bugünkü hesap (2026-11-15)

`scripts/compare_msl.py` **main/CLI çağrısı çalıştırılmadı**, çünkü varsayılan olarak `docs/validation_msl.json` ve PNG'yi değiştiriyor. Bunun yerine **aynı yükleme ve evaluate_msl_comparison fonksiyonları**, aynı gerçek yol üzerinde, **bellekte** çalıştırıldı. Script kaynak kodu değişmedi; render/JSON kaydetme adımı çağrılmadı. Dolayısıyla aşağıdaki yeni sayılar çalıştırılmış mevcut hesap fonksiyonunun çıktısıdır; sadece kaynak okumaya dayalı tahmin değildir.

| Alan | Kayıtlı docs/validation_msl.json | Bu oturumdaki fonksiyon çıktısı |
| --- | --- | --- |
| terrain_model_available | false | true |
| mode | zemin_modeli_yok | tam_zemin_modeli |
| Referans nokta / sıra elemanı | 854 / 1785 | 854 / 1785 |
| Referans sürekli / grid uzunluğu m | 3887.6 / 4141.3 | 3887.6 / 4141.3 |
| Referans DEM ortalama / max ° | 9.9 / 45.7 | 9.9 / 45.7 |
| Referans ≥25° sıra elemanı | 35 | 35 |
| Referans eşdeğer süre dk | 177 | 191.1 |
| Referans eşdeğer enerji kcal | 844.4 | 927.4 |

Buradaki süre ve enerji **Curiosity'nin ölçülmüş sürüş süresi/enerjisi değil**, aynı iz üzerinde planlayıcının tek yönlü astronot-modeli eşdeğeridir. Referans düğüm ve geometri aynı; model ve tercih parametreleri farklı.

| Ön ayar | Uzunluk eski→yeni m (Δ) | Süre eski→yeni dk (Δ) | Enerji eski→yeni kcal (Δ) | Ort. sapma eski→yeni m | Maks. eğim eski→yeni ° |
| --- | --- | --- | --- | --- | --- |
| shortest | 2256.2 → 2257.9 (1.7) | 69.5 → 78 (8.5) | 323.7 → 369.7 (46.0) | 140.02 → 131.44 | 18.6 → 18.6 |
| balanced | 2270.9 → 2284.1 (13.2) | 69.7 → 78.3 (8.6) | 324.6 → 370.7 (46.1) | 140.33 → 133.36 | 19.9 → 19.9 |
| safest | 2297 → 2396.3 (99.3) | 70.3 → 80.3 (10.0) | 327.4 → 378.6 (51.2) | 139.92 → 132.4 | 16.2 → 18.1 |

Ön ayar ağırlıkları da değişmiş:

| Ön ayar | Eski t/k/r | Güncel t/k/r |
| --- | --- | --- |
| shortest | `{"t":1,"k":0,"r":0}` | `{"t":1,"k":0,"r":0}` |
| balanced | `{"t":1,"k":10,"r":4}` | `{"t":1,"k":12,"r":22}` |
| safest | `{"t":1,"k":10,"r":25}` | `{"t":0.2,"k":1.5,"r":140}` |

Bu yüzden “bütün fark yalnız yeni ML yüzünden” sonucu doğru değildir. Bunu ayırmak için ek kontrol: aynı güncel kod ve aynı DEM, fakat **bellekte** `p_bedrock=1, diğer p=0, entropy=0`; disk katmanlarına dokunulmadı.

| Ön ayar | Eski kayıt m / dk / kcal | Güncel kod + tek bedrock m / dk / kcal | Güncel kod + gerçek model m / dk / kcal |
| --- | --- | --- | --- |
| shortest | 2256.2 / 69.5 / 323.7 | 2256.2 / 69.5 / 323.7 | 2257.9 / 78 / 369.7 |
| balanced | 2270.9 / 69.7 / 324.6 | 2289.3 / 69.9 / 325.2 | 2284.1 / 78.3 / 370.7 |
| safest | 2297 / 70.3 / 327.4 | 2414.1 / 72.1 / 333.1 | 2396.3 / 80.3 / 378.6 |

Bu kontrolün referansı yine **177.0 dk / 844.4 kcal**, eski kayıtla aynı; shortest da eski kayıtla aynı. Balanced/safest kontrolü eski kaydı birebir üretmiyor: güncel ağırlıklar farklı. Bu, **veri modeli ve rota tercihi sürümünü birlikte kaydetme gereğini** gösterir. Tam geçmiş kod/bağımlılık ortamı yeniden kurulmadı; eski koşunun bütünü birebir yeniden üretildi iddiası **doğrulanmadı**.

Yeni sonuçlarda üç rota yine GO döndü. Bu, **planlayıcı bütçe/kurallarının çıktısıdır**; gerçek insanlı Mars EVA güvenlik kararı değildir. Referans çizgi “minimum maliyet insan rotası” için bağımsız yer gerçeği sayılmaz.

## 5. Bu kanıtla ne söylenebilir? (2026-11-15)

1. Bu kesitte Curiosity'nin kayıtlı iz koridoru, bütün 2×2 km ızgaradan daha düşük DEM eğimine sahip. Bu bir **dağılım gözlemidir**; sürüş kararının tek nedeninin eğim olduğu doğrulanmadı.
2. **Hücre eğimi, yol yönü eğimi ve gerçek araç gövde eğimi farklı niceliklerdir.** “DEM>25° ise hiçbir geçiş olmaz” kuralı kayıtlı rover iziyle tam örtüşmüyor; bunun nedeni tek başına yön farkı olarak da doğrulanmadı.
3. İnsan eşiğini rover geçmişinden seçmek uygunluğu **doğrulanmadı**. Bu rapor bir insan eşik değeri önermiyor; kamera/DEM konum hatası, yan eğim, skafandr ve zemin taşıma gücü ayrıca gereklidir.
4. p_sand/p_bigrock ve entropy **model tahminidir**; rota üzerinde bulunmaları veya bulunmamaları fiziksel kum/kaya güvenliğini kanıtlamaz. “Kaçınılan yerlerle tutarlı” iddiası için negatif örnek ve bağımsız yer gerçeği gerekir.
5. `validation_msl.json` **tarihsel** olarak korunmalı; güncel karşılaştırma ayrı çalışma kimliğiyle üretilmeli. Bu oturum yalnız bu tek raporu yazdı; eski JSON, PNG, API kodu ve sim dosyalarına dokunmadı.

## 6. Çalıştırılan komut ve yeniden üretim (2026-11-15)

Çalışan Python: `C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe`; Python **3.13.12**, NumPy **2.5.4**, SciPy **1.18.1**, scikit-image **0.26.0**. Eğimin/yay uzunluğunun/olasılıkların hesabı NumPy; mevcut planlayıcı fonksiyonları SciPy/scikit-image kullanıyor. Varsayılan sistem Python'unda scikit-image bulunmadığından mevcut API ortamı seçildi; paket kurulmadı veya ortam değiştirilmedi.

Workspace `C:/Users/Batu/Desktop/martian-map-main` içinden PowerShell komutu aşağıdadır. Kod **geçici dosyaya da yazılmadan stdin'den çalıştırıldı**. `-B` + `dont_write_bytecode` pycache üretimini engeller. Komut kaynakları yalnız okur ve sonucu stdout'a JSON basar; raporu/veriyi kendisi güncellemez.

~~~powershell
@'
import sys
sys.dont_write_bytecode=True
import json,hashlib,runpy,math,os,time
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
import scipy,skimage
ROOT=Path('C:/Users/Batu/Desktop/mm-pr/martian-map')
paths=[ROOT/'contracts/grid.json',ROOT/'layers/msl_proposed_path.json',ROOT/'docs/validation_msl.json',ROOT/'scripts/compare_msl.py']
paths+=sorted((ROOT/'layers').glob('*.npy'))+sorted((ROOT/'api').rglob('*.py'))
def hashes():return {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
before=hashes()
def loadj(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
g=loadj('contracts/grid.json');ref=loadj('layers/msl_proposed_path.json');old=loadj('docs/validation_msl.json')
fields={k:np.load(ROOT/f'layers/{k}.npy',allow_pickle=False) for k in ['slope','elevation','p_soil','p_bedrock','p_sand','p_bigrock','entropy']}
assert all(a.shape==(1000,1000) and np.isfinite(a).all() for a in fields.values())
cmd=runpy.run_path(str(ROOT/'scripts/compare_msl.py'),run_name='readonly_research')
pts=np.asarray(cmd['clip_reference_path'](ref['path_px'],1000,1000),float)
res=float(g['res_m']); ds=np.linalg.norm(np.diff(pts,axis=0),axis=1)*res
def rasterize(segment_pts):
    distances=np.linalg.norm(np.diff(segment_pts,axis=0),axis=1)*res
    records=[]
    for a,b,distance in zip(segment_pts[:-1],segment_pts[1:],distances):
        if distance<=1e-12:continue
        d=b-a;cuts=[0.,1.]
        for k in [0,1]:
            if abs(d[k])>1e-12:
                edges=np.arange(math.floor(min(a[k],b[k]))+1,math.ceil(max(a[k],b[k])))
                ts=(edges-a[k])/d[k];cuts.extend(ts[(ts>1e-12)&(ts<1-1e-12)].tolist())
        cuts=np.unique(cuts)
        for l,h in zip(cuts[:-1],cuts[1:]):
            if h-l<=1e-12:continue
            c,r=np.floor(a+(l+h)/2*d).astype(int)
            records.append([c,r,distance*(h-l),d[0]/(distance/res),d[1]/(distance/res)])
    return np.asarray(records)
records=rasterize(pts)
rec=np.asarray(records);cells=rec[:,:2].astype(int);weights=rec[:,2]
assert (cells>=0).all() and (cells<1000).all()
unique,inv=np.unique(cells,axis=0,return_inverse=True)
cell_weights=np.bincount(inv,weights=weights)
assert abs(weights.sum()-ds.sum())<1e-8
def quant(a,w=None):
    a=np.asarray(a,float)
    if w is None:q=np.percentile(a,[50,90,99]);mean=a.mean()
    else:
        ix=np.argsort(a);cdf=np.cumsum(w[ix])/np.sum(w)
        q=a[ix[np.searchsorted(cdf,[.5,.9,.99],side='left')]];mean=np.average(a,weights=w)
    return dict(n=len(a),mean=float(mean),median=float(q[0]),p90=float(q[1]),p99=float(q[2]),min=float(a.min()),max=float(a.max()))
def bands(a,w=None):
    a=np.asarray(a);w=np.ones(len(a)) if w is None else np.asarray(w)
    masks=[(a>=l)&(a<h) for l,h in [(0,5),(5,10),(10,15),(15,20)]]
    masks += [(a>=20)&(a<=25),a>25]
    return [float(w[m].sum()/w.sum()*100) for m in masks]
r,c=unique[:,1],unique[:,0]
s=fields['slope'];e=fields['elevation'].astype(float)
gr,gc=np.gradient(e,res)
sderived=np.degrees(np.arctan(np.hypot(gc,gr)))
slope_match=float(np.max(abs(sderived-s)))
assert slope_match<1e-3
along=np.degrees(np.arctan(gc[cells[:,1],cells[:,0]]*rec[:,3]+gr[cells[:,1],cells[:,0]]*rec[:,4]))
max_on_intervals=s[cells[:,1],cells[:,0]]
assert (np.abs(along)<=max_on_intervals+1e-3).all()
# Independent height differences over 2m / 10m arc baselines; bilinear at source cell centers.
arc=np.r_[0.,np.cumsum(ds)]; keep=np.r_[True,np.diff(arc)>1e-10];arc=arc[keep];ip=pts[keep]
sample_s=np.unique(np.r_[np.arange(0.,arc[-1],1.),arc[-1]])
def heights_at(svals):
    pc=np.interp(svals,arc,ip[:,0])-.5;pr=np.interp(svals,arc,ip[:,1])-.5
    pc=np.clip(pc,0,e.shape[1]-1.00000001);pr=np.clip(pr,0,e.shape[0]-1.00000001)
    i=np.floor(pc).astype(int);j=np.floor(pr).astype(int);u=pc-i;v=pr-j
    return (e[j,i]*(1-u)+e[j,i+1]*u)*(1-v)+(e[j+1,i]*(1-u)+e[j+1,i+1]*u)*v
finite_difference={}
for baseline in [2.,10.]:
    left=np.maximum(0,sample_s-baseline/2);right=np.minimum(arc[-1],sample_s+baseline/2)
    angle=np.degrees(np.arctan2(heights_at(right)-heights_at(left),right-left))
    finite_difference[str(baseline)]=dict(absolute=quant(abs(angle)),signed=quant(angle))
L,meta=cmd['load_layers_with_fallback'](ROOT)
repo_cells=cmd['_cells'](L,pts,driven=True)
repo_s=s[repo_cells[:,1],repo_cells[:,0]]
now,_,_=cmd['evaluate_msl_comparison'](L,pts,terrain_meta=meta,source_meta=ref)
# Counterfactual: current code/data geometry, legacy single bedrock & entropy zero.
from api.planner.layers import Layers
counter_L=Layers(L.width,L.height,L.res_m,L.elevation,L.slope,L.rock_cfa,
    {k:np.full_like(L.slope,1. if k=='bedrock' else 0.) for k in L.probs},
    np.zeros_like(L.entropy),L.rover_stops,L.science_stops,synthetic=False,region=L.region,provisional_terrain=False)
counter,_,_=cmd['evaluate_msl_comparison'](counter_L,pts,terrain_meta={'terrain_model_available':False,'mode':'counterfactual_bedrock_entropy0'},source_meta=ref)
prob={}
for name in ['p_sand','p_bigrock','entropy']:
    a=fields[name];v=a[r,c];prob[name]=dict(grid=quant(a.ravel()),route_unique=quant(v),route_length_weighted=quant(v,cell_weights),
        grid_gt04_pct=float((a>.4).mean()*100),route_unique_gt04_count=int((v>.4).sum()),route_unique_gt04_pct=float((v>.4).mean()*100),
        route_length_gt04_m=float(cell_weights[v>.4].sum()),route_length_gt04_pct=float(cell_weights[v>.4].sum()/weights.sum()*100))
    if name=='entropy':prob[name].update(grid_ge06_pct=float((a>=.6).mean()*100),route_unique_ge06_pct=float((v>=.6).mean()*100),route_length_ge06_pct=float(cell_weights[v>=.6].sum()/weights.sum()*100))
ix=np.argsort(s[r,c])[-8:][::-1]
steep=[dict(px=unique[i].tolist(),slope=float(s[r[i],c[i]]),length_m=float(cell_weights[i]),p_sand=float(fields['p_sand'][r[i],c[i]]),p_bigrock=float(fields['p_bigrock'][r[i],c[i]]),entropy=float(fields['entropy'][r[i],c[i]])) for i in ix]
# Known-plane direction and rasterization tests.
assert abs(np.degrees(np.arctan(.1))-5.710593137499643)<1e-10
h=np.arange(9)[None,:]*res*.1+np.arange(9)[:,None]*res*.2
tr,tc=np.gradient(h,res)
assert np.max(abs(tc-.1))<1e-12 and np.max(abs(tr-.2))<1e-12
assert abs(np.degrees(np.arctan(np.dot([.1,.2],[1.,0.])))-5.710593137499643)<1e-10
assert abs(np.degrees(np.arctan(np.dot([.1,.2],[-2,1])/np.sqrt(5))))<1e-10
psum=sum(fields[k] for k in ['p_soil','p_bedrock','p_sand','p_bigrock'])
assert np.max(abs(psum-1))<1e-5
sensitivity=[]
for dx,dy in [(dx,dy) for dy in [-.5,0.,.5] for dx in [-.5,0.,.5]]:
    rr=rasterize(pts+[dx,dy])
    uu=np.unique(rr[:,:2].astype(int),axis=0)
    vals=s[uu[:,1],uu[:,0]]
    sensitivity.append(dict(dx_px=dx,dy_px=dy,unique_cells=len(uu),median=float(np.median(vals)),p90=float(np.percentile(vals,90)),p99=float(np.percentile(vals,99)),max=float(vals.max()),gt25_pct=float((vals>25).mean()*100)))
for aa,bb,expected in [([.25,.25],[2.25,.25],4.),([.25,.25],[2.25,2.25],4*np.sqrt(2))]:
    rr=rasterize(np.array([aa,bb]))
    assert abs(rr[:,2].sum()-expected)<1e-10
    assert len(np.unique(rr[:,:2],axis=0))==3
sand_vals=fields['p_sand'][r,c]
sand_cells=[dict(px=unique[i].tolist(),p_sand=float(sand_vals[i]),length_m=float(cell_weights[i]),slope=float(s[r[i],c[i]]),entropy=float(fields['entropy'][r[i],c[i]])) for i in np.flatnonzero(sand_vals>.4)]
assert before==hashes(),'Input changed concurrently'
gitmain=ROOT/'.git/refs/heads/main'
result=dict(utc=datetime.now(timezone.utc).isoformat(),root=str(ROOT),main_ref_file=gitmain.read_text().strip() if gitmain.exists() else None,
    versions=dict(python=sys.version,numpy=np.__version__,scipy=scipy.__version__,skimage=skimage.__version__),source=ref,
    route=dict(original_points=len(ref['path_px']),clipped_points=len(pts),polyline_length_m=float(ds.sum()),unique_cells=len(unique),positive_length_intervals=len(rec),
        repo_cells_sequence=len(repo_cells),repo_unique_cells=len(np.unique(repo_cells,axis=0)),repo_length_m=float(np.linalg.norm(np.diff(repo_cells,axis=0),axis=1).sum()*res)),
    slope=dict(grid=quant(s.ravel()),unique=quant(s[r,c]),length_weighted=quant(s[r,c],cell_weights),repo_sequence=quant(repo_s),
        bands_grid=bands(s.ravel()),bands_unique=bands(s[r,c]),bands_length=bands(s[r,c],cell_weights),bands_repo=bands(repo_s),
        unique_gt25_count=int((s[r,c]>25).sum()),repo_ge25_count=int((repo_s>=25).sum()),gradient_slope_max_error_deg=slope_match),
    shift_sensitivity=sensitivity,high_sand_cells=sand_cells,along=dict(signed=quant(along,weights),absolute=quant(abs(along),weights),max_minus_along=quant(max_on_intervals-abs(along),weights),
        length_pct_slope_gt25_along_le15=float(weights[(max_on_intervals>25)&(abs(along)<=15)].sum()/weights.sum()*100),
        finite_difference=finite_difference),prob=prob,steep_cells=steep,
    current_comparison=now,stored_comparison=old,counterfactual_comparison=counter,
    input_hashes=before,tests='PASS: horizontal/diagonal rasterization; finite/shapes; exact path length conservation; inbounds; gradient consistency; along<=steepest; synthetic plane; probability sum; no input change')
result['source']={k:v for k,v in ref.items() if k!='path_px'}
print(json.dumps(result,ensure_ascii=True))

'@ | C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe -B -
~~~

## 7. Test sonucu ve ham hesap çıktısı (2026-11-15)

Çalıştırma **exit code 0**. Doğrulamalar:

- İki sentetik çizgi (yatay/diagonal): beklenen 3 hücre ve 4 m / 4√2 m uzunluk PASS.
- Boyut/sonluluk, yol iç sınır kontrolü, tüm aralıkların uzunluk koruması PASS.
- DEM türevinden slope.npy eşleşmesi PASS (max fark 3.807297e-6°).
- Her aralıkta mutlak along-track ≤ en dik gradyan; bilinen eğik düzlemde paralel/eş-yükselti yön testi PASS.
- Dört olasılığın toplamı 1 (1e-5 tolerans) PASS.
- Aşağıdaki bütün kaynak dosyaların işlem öncesi ve sonrası SHA-256 eşitliği PASS.
- Kaynak scriptin gerçek hesap fonksiyonu ve üç güncel rota çalıştı; eski JSON'a yazım yapılmadı.

Tam sayısal kayıt (bu rapor dışında JSON dosyası oluşturulmadı):

~~~json
{
  "utc": "2026-11-15T03:46:24.002130+00:00",
  "root": "C:\\Users\\Batu\\Desktop\\mm-pr\\martian-map",
  "main_ref_file": "42f60aaf5cbebda49026ebd9ccfaf7818e86c915",
  "versions": {
    "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
    "numpy": "2.5.4",
    "scipy": "1.18.1",
    "skimage": "0.26.0"
  },
  "source": {
    "description": "Curiosity'nin bu izgarada GERCEKTE surdugu rota (referans). Planlayici rotasiyla karsilastirma icin (api.planner.comparison.compare_reference).",
    "source": "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json",
    "source_note": "NASA/JPL MMGIS MSL traverse; kutuya giris kuzey kenar, cikis guney kenar; sol ~4459-4983 (MMGIS waypoint)",
    "px_note": "path_px = [[sutun, satir], ...] ondalikli, contracts/grid.json origin_xy_m ve res_m ile; hucre = floor",
    "simplification": "ham 14336 nokta -> 854 nokta, >=1 m aralik, maks sapma 0.79 m",
    "length_m": 3887.5
  },
  "route": {
    "original_points": 854,
    "clipped_points": 854,
    "polyline_length_m": 3887.5575736165265,
    "unique_cells": 2330,
    "positive_length_intervals": 3311,
    "repo_cells_sequence": 1785,
    "repo_unique_cells": 1703,
    "repo_length_m": 4141.271570324364
  },
  "slope": {
    "grid": {
      "n": 1000000,
      "mean": 16.000138715619432,
      "median": 13.323933601379395,
      "p90": 31.31105728149414,
      "p99": 47.17986400604249,
      "min": 0.027312885969877243,
      "max": 76.82396697998047
    },
    "unique": {
      "n": 2330,
      "mean": 9.791102608980795,
      "median": 8.838828563690186,
      "p90": 16.7551176071167,
      "p99": 30.475925388336208,
      "min": 0.12124232947826385,
      "max": 50.290374755859375
    },
    "length_weighted": {
      "n": 2330,
      "mean": 9.887384682800114,
      "median": 8.93327808380127,
      "p90": 16.87830924987793,
      "p99": 32.135894775390625,
      "min": 0.12124232947826385,
      "max": 50.290374755859375
    },
    "repo_sequence": {
      "n": 1785,
      "mean": 9.91329979433232,
      "median": 8.96265983581543,
      "p90": 16.875416183471682,
      "p99": 32.15607498168947,
      "min": 0.12124232947826385,
      "max": 45.74779510498047
    },
    "bands_grid": [
      9.8876,
      25.1847,
      21.1953,
      14.702000000000002,
      10.285,
      18.7454
    ],
    "bands_unique": [
      18.283261802575108,
      40.858369098712444,
      26.13733905579399,
      9.656652360515022,
      3.0901287553648067,
      1.9742489270386268
    ],
    "bands_length": [
      18.009090498777912,
      40.47219684000844,
      26.292781893263793,
      9.816966487644391,
      3.4413254467880434,
      1.9676388335174129
    ],
    "bands_repo": [
      17.983193277310924,
      40.22408963585434,
      26.38655462184874,
      9.859943977591037,
      3.5854341736694675,
      1.9607843137254901
    ],
    "unique_gt25_count": 46,
    "repo_ge25_count": 35,
    "gradient_slope_max_error_deg": 0.0000038072972756708623
  },
  "shift_sensitivity": [
    {
      "dx_px": -0.5,
      "dy_px": -0.5,
      "unique_cells": 2336,
      "median": 8.723445892333984,
      "p90": 16.829607009887695,
      "p99": 29.604616165161133,
      "max": 50.290374755859375,
      "gt25_pct": 1.8835616438356164
    },
    {
      "dx_px": 0,
      "dy_px": -0.5,
      "unique_cells": 2328,
      "median": 8.793939590454102,
      "p90": 16.428478240966797,
      "p99": 28.120220184326172,
      "max": 50.290374755859375,
      "gt25_pct": 1.8900343642611683
    },
    {
      "dx_px": 0.5,
      "dy_px": -0.5,
      "unique_cells": 2336,
      "median": 8.74019718170166,
      "p90": 16.319522857666016,
      "p99": 27.516416549682617,
      "max": 50.290374755859375,
      "gt25_pct": 1.7123287671232876
    },
    {
      "dx_px": -0.5,
      "dy_px": 0,
      "unique_cells": 2336,
      "median": 8.78927230834961,
      "p90": 17.03706169128418,
      "p99": 32.13217544555664,
      "max": 50.290374755859375,
      "gt25_pct": 2.054794520547945
    },
    {
      "dx_px": 0,
      "dy_px": 0,
      "unique_cells": 2330,
      "median": 8.838829040527344,
      "p90": 16.755117416381836,
      "p99": 30.47592544555664,
      "max": 50.290374755859375,
      "gt25_pct": 1.9742489270386268
    },
    {
      "dx_px": 0.5,
      "dy_px": 0,
      "unique_cells": 2336,
      "median": 8.805110931396484,
      "p90": 16.54788589477539,
      "p99": 28.579273223876953,
      "max": 50.290374755859375,
      "gt25_pct": 1.8407534246575343
    },
    {
      "dx_px": -0.5,
      "dy_px": 0.5,
      "unique_cells": 2336,
      "median": 8.82757568359375,
      "p90": 17.505306243896484,
      "p99": 32.25895309448242,
      "max": 50.01681900024414,
      "gt25_pct": 2.183219178082192
    },
    {
      "dx_px": 0,
      "dy_px": 0.5,
      "unique_cells": 2328,
      "median": 8.788946151733398,
      "p90": 16.920379638671875,
      "p99": 32.133026123046875,
      "max": 50.01681900024414,
      "gt25_pct": 2.448453608247423
    },
    {
      "dx_px": 0.5,
      "dy_px": 0.5,
      "unique_cells": 2336,
      "median": 8.70009994506836,
      "p90": 16.61009407043457,
      "p99": 29.551481246948242,
      "max": 50.01681900024414,
      "gt25_pct": 2.183219178082192
    }
  ],
  "high_sand_cells": [
    {
      "px": [
        470,
        581
      ],
      "p_sand": 0.4115999937057495,
      "length_m": 0.995508306683559,
      "slope": 19.078350067138672,
      "entropy": 0.4724000096321106
    },
    {
      "px": [
        470,
        582
      ],
      "p_sand": 0.4115999937057495,
      "length_m": 2.0440517227324833,
      "slope": 19.98323631286621,
      "entropy": 0.4724000096321106
    },
    {
      "px": [
        471,
        582
      ],
      "p_sand": 0.4115999937057495,
      "length_m": 2.7748386393753144,
      "slope": 16.327856063842773,
      "entropy": 0.4724000096321106
    }
  ],
  "along": {
    "signed": {
      "n": 3311,
      "mean": 2.9992431538568893,
      "median": 3.5420426517778623,
      "p90": 11.771525883580278,
      "p99": 21.622547935173323,
      "min": -33.57737743847074,
      "max": 40.46938213857952
    },
    "absolute": {
      "n": 3311,
      "mean": 6.457212929804908,
      "median": 5.393465674713958,
      "p90": 13.214008272741246,
      "p99": 23.866319828901528,
      "min": 0.005510749793888155,
      "max": 40.46938213857952
    },
    "max_minus_along": {
      "n": 3311,
      "mean": 3.430171752995203,
      "median": 1.9744387515533643,
      "p90": 9.015326835030677,
      "p99": 17.248143248163156,
      "min": 0.000005018196022277266,
      "max": 33.4713983622403
    },
    "length_pct_slope_gt25_along_le15": 0.3325018145804758,
    "finite_difference": {
      "2.0": {
        "absolute": {
          "n": 3889,
          "mean": 6.399266466801231,
          "median": 5.212963793790815,
          "p90": 12.852749659879535,
          "p99": 23.98782955638434,
          "min": 0.000349485603248269,
          "max": 42.122099562064975
        },
        "signed": {
          "n": 3889,
          "mean": 3.026636161661393,
          "median": 3.493785001383381,
          "p90": 11.576489261754341,
          "p99": 22.140475530636174,
          "min": -36.13921056908738,
          "max": 42.122099562064975
        }
      },
      "10.0": {
        "absolute": {
          "n": 3889,
          "mean": 5.1214375990623315,
          "median": 4.701047472717908,
          "p90": 9.81541138362559,
          "p99": 15.740934449006948,
          "min": 0.0009369455374366858,
          "max": 25.556264853769136
        },
        "signed": {
          "n": 3889,
          "mean": 3.051030700780689,
          "median": 3.4890295037634393,
          "p90": 9.264414732891044,
          "p99": 15.13940208649852,
          "min": -25.556264853769136,
          "max": 24.606719998577137
        }
      }
    }
  },
  "prob": {
    "p_sand": {
      "grid": {
        "n": 1000000,
        "mean": 0.14469059888314106,
        "median": 0.1558908075094223,
        "p90": 0.2503814399242401,
        "p99": 0.3581351041793823,
        "min": 0.00009999999747378752,
        "max": 0.4115999937057495
      },
      "route_unique": {
        "n": 2330,
        "mean": 0.07264563122452831,
        "median": 0.04677900671958923,
        "p90": 0.18832500278949738,
        "p99": 0.34486600130796774,
        "min": 0.00009999999747378752,
        "max": 0.4115999937057495
      },
      "route_length_weighted": {
        "n": 2330,
        "mean": 0.07359384465979871,
        "median": 0.04935164749622345,
        "p90": 0.18832500278949738,
        "p99": 0.37229999899864197,
        "min": 0.00009999999747378752,
        "max": 0.4115999937057495
      },
      "grid_gt04_pct": 0.0351,
      "route_unique_gt04_count": 3,
      "route_unique_gt04_pct": 0.12875536480686695,
      "route_length_gt04_m": 5.814398668791357,
      "route_length_gt04_pct": 0.14956431020473154
    },
    "p_bigrock": {
      "grid": {
        "n": 1000000,
        "mean": 0.15069263394957993,
        "median": 0.1590617150068283,
        "p90": 0.27876267135143273,
        "p99": 0.334199994802475,
        "min": 0.00019999999494757503,
        "max": 0.33869999647140503
      },
      "route_unique": {
        "n": 2330,
        "mean": 0.07345191809589711,
        "median": 0.045327989384531975,
        "p90": 0.1960500031709671,
        "p99": 0.20020000636577606,
        "min": 0.00019999999494757503,
        "max": 0.33869999647140503
      },
      "route_length_weighted": {
        "n": 2330,
        "mean": 0.07190160503699505,
        "median": 0.04136968031525612,
        "p90": 0.195791557431221,
        "p99": 0.25619998574256897,
        "min": 0.00019999999494757503,
        "max": 0.33869999647140503
      },
      "grid_gt04_pct": 0,
      "route_unique_gt04_count": 0,
      "route_unique_gt04_pct": 0,
      "route_length_gt04_m": 0,
      "route_length_gt04_pct": 0
    },
    "entropy": {
      "grid": {
        "n": 1000000,
        "mean": 0.6968344000800661,
        "median": 0.7650091648101807,
        "p90": 1,
        "p99": 1,
        "min": 0.016100000590085983,
        "max": 1
      },
      "route_unique": {
        "n": 2330,
        "mean": 0.4233989382586382,
        "median": 0.32600000500679016,
        "p90": 0.9770720899105071,
        "p99": 1,
        "min": 0.016100000590085983,
        "max": 1
      },
      "route_length_weighted": {
        "n": 2330,
        "mean": 0.41783760086601607,
        "median": 0.3181999921798706,
        "p90": 0.9516154527664185,
        "p99": 1,
        "min": 0.016100000590085983,
        "max": 1
      },
      "grid_gt04_pct": 79.6906,
      "route_unique_gt04_count": 1029,
      "route_unique_gt04_pct": 44.163090128755364,
      "route_length_gt04_m": 1704.487385953808,
      "route_length_gt04_pct": 43.844685350039796,
      "grid_ge06_pct": 64.6238,
      "route_unique_ge06_pct": 30.472103004291846,
      "route_length_ge06_pct": 28.985347164414332
    }
  },
  "steep_cells": [
    {
      "px": [
        424,
        552
      ],
      "slope": 50.290374755859375,
      "length_m": 2.0125259287306005,
      "p_sand": 0.030700000002980232,
      "p_bigrock": 0.0015999999595806003,
      "entropy": 0.18219999969005585
    },
    {
      "px": [
        423,
        552
      ],
      "slope": 47.5311164855957,
      "length_m": 0.3823799264588095,
      "p_sand": 0.030700000002980232,
      "p_bigrock": 0.0015999999595806003,
      "entropy": 0.18219999969005585
    },
    {
      "px": [
        425,
        552
      ],
      "slope": 45.74779510498047,
      "length_m": 2.0125259287306005,
      "p_sand": 0.030700000002980232,
      "p_bigrock": 0.0015999999595806003,
      "entropy": 0.18219999969005585
    },
    {
      "px": [
        422,
        552
      ],
      "slope": 42.65179443359375,
      "length_m": 2.09138456704598,
      "p_sand": 0.030700000002980232,
      "p_bigrock": 0.0015999999595806003,
      "entropy": 0.18219999969005585
    },
    {
      "px": [
        421,
        545
      ],
      "slope": 41.8143424987793,
      "length_m": 2.768650738294472,
      "p_sand": 0.0013000000035390258,
      "p_bigrock": 0.007000000216066837,
      "entropy": 0.14020000398159027
    },
    {
      "px": [
        420,
        545
      ],
      "slope": 39.474735260009766,
      "length_m": 3.3533677179764902,
      "p_sand": 0.0013000000035390258,
      "p_bigrock": 0.007000000216066837,
      "entropy": 0.14020000398159027
    },
    {
      "px": [
        423,
        553
      ],
      "slope": 38.693111419677734,
      "length_m": 1.7593059499716257,
      "p_sand": 0.030700000002980232,
      "p_bigrock": 0.0015999999595806003,
      "entropy": 0.18219999969005585
    },
    {
      "px": [
        422,
        546
      ],
      "slope": 37.9181022644043,
      "length_m": 0.974666666666667,
      "p_sand": 0.0013000000035390258,
      "p_bigrock": 0.007000000216066837,
      "entropy": 0.14020000398159027
    }
  ],
  "current_comparison": {
    "region": "Gale / Mount Sharp boxwork bolgesi (Curiosity sol ~4459-4983)",
    "grid": {
      "width": 1000,
      "height": 1000,
      "res_m": 2,
      "synthetic": false
    },
    "terrain_model": {
      "terrain_model_available": true,
      "mode": "tam_zemin_modeli",
      "label": "tam zemin modeli (p_soil, p_bedrock, p_sand, p_bigrock, entropy)"
    },
    "endpoints": {
      "start_px": [
        790,
        1
      ],
      "goal_px": [
        629,
        998
      ],
      "reference_start_px": [
        790.55,
        1.38
      ],
      "reference_goal_px": [
        629.97,
        998.58
      ],
      "euclidean_distance_m": 2019.8
    },
    "reference": {
      "source": "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json",
      "source_note": "NASA/JPL MMGIS MSL traverse; kutuya giris kuzey kenar, cikis guney kenar; sol ~4459-4983 (MMGIS waypoint)",
      "point_count": 854,
      "sampled_cell_count": 1785,
      "length_m": 3887.6,
      "grid_length_m": 4141.3,
      "min": 191.1,
      "kcal": 927.4,
      "slope_mean_deg": 9.9,
      "slope_max_deg": 45.7,
      "steep_cells_ge_nogo": 35
    },
    "presets": [
      {
        "kind": "shortest",
        "label": "En kısa",
        "weights": {
          "t": 1,
          "k": 0,
          "r": 0
        },
        "length_m": 2257.9,
        "delta_length_m": -1629.7,
        "delta_grid_length_m": -1883.4,
        "mean_deviation_m": 131.44,
        "max_deviation_m": 326.02,
        "min": 78,
        "delta_min": -113.1,
        "kcal": 369.7,
        "delta_kcal": -557.7,
        "slope_max_deg": 18.6,
        "status": "GO",
        "go": true
      },
      {
        "kind": "balanced",
        "label": "Dengeli",
        "weights": {
          "t": 1,
          "k": 12,
          "r": 22
        },
        "length_m": 2284.1,
        "delta_length_m": -1603.4,
        "delta_grid_length_m": -1857.1,
        "mean_deviation_m": 133.36,
        "max_deviation_m": 324.06,
        "min": 78.3,
        "delta_min": -112.8,
        "kcal": 370.7,
        "delta_kcal": -556.7,
        "slope_max_deg": 19.9,
        "status": "GO",
        "go": true
      },
      {
        "kind": "safest",
        "label": "En güvenli",
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140
        },
        "length_m": 2396.3,
        "delta_length_m": -1491.3,
        "delta_grid_length_m": -1745,
        "mean_deviation_m": 132.4,
        "max_deviation_m": 324.06,
        "min": 80.3,
        "delta_min": -110.8,
        "kcal": 378.6,
        "delta_kcal": -548.9,
        "slope_max_deg": 18.1,
        "status": "GO",
        "go": true
      }
    ]
  },
  "stored_comparison": {
    "region": "Gale / Mount Sharp boxwork bolgesi (Curiosity sol ~4459-4983)",
    "grid": {
      "width": 1000,
      "height": 1000,
      "res_m": 2,
      "synthetic": false
    },
    "terrain_model": {
      "terrain_model_available": false,
      "mode": "zemin_modeli_yok",
      "label": "zemin modeli yok (yalnız eğim + rock_cfa; tek tip referans zemin: p_bedrock=1, entropy=0)",
      "missing_layers": [
        "p_soil",
        "p_bedrock",
        "p_sand",
        "p_bigrock",
        "entropy"
      ]
    },
    "endpoints": {
      "start_px": [
        790,
        1
      ],
      "goal_px": [
        629,
        998
      ],
      "reference_start_px": [
        790.55,
        1.38
      ],
      "reference_goal_px": [
        629.97,
        998.58
      ],
      "euclidean_distance_m": 2019.8
    },
    "reference": {
      "source": "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json",
      "source_note": "NASA/JPL MMGIS MSL traverse; kutuya giris kuzey kenar, cikis guney kenar; sol ~4459-4983 (MMGIS waypoint)",
      "point_count": 854,
      "sampled_cell_count": 1785,
      "length_m": 3887.6,
      "grid_length_m": 4141.3,
      "min": 177,
      "kcal": 844.4,
      "slope_mean_deg": 9.9,
      "slope_max_deg": 45.7,
      "steep_cells_ge_nogo": 35
    },
    "presets": [
      {
        "kind": "shortest",
        "label": "En kısa",
        "weights": {
          "t": 1,
          "k": 0,
          "r": 0
        },
        "length_m": 2256.2,
        "delta_length_m": -1631.3,
        "delta_grid_length_m": -1885,
        "mean_deviation_m": 140.02,
        "max_deviation_m": 326.02,
        "min": 69.5,
        "delta_min": -107.5,
        "kcal": 323.7,
        "delta_kcal": -520.6,
        "slope_max_deg": 18.6,
        "status": "GO",
        "go": true
      },
      {
        "kind": "balanced",
        "label": "Dengeli",
        "weights": {
          "t": 1,
          "k": 10,
          "r": 4
        },
        "length_m": 2270.9,
        "delta_length_m": -1616.7,
        "delta_grid_length_m": -1870.4,
        "mean_deviation_m": 140.33,
        "max_deviation_m": 326.02,
        "min": 69.7,
        "delta_min": -107.4,
        "kcal": 324.6,
        "delta_kcal": -519.8,
        "slope_max_deg": 19.9,
        "status": "GO",
        "go": true
      },
      {
        "kind": "safest",
        "label": "En güvenli",
        "weights": {
          "t": 1,
          "k": 10,
          "r": 25
        },
        "length_m": 2297,
        "delta_length_m": -1590.5,
        "delta_grid_length_m": -1844.3,
        "mean_deviation_m": 139.92,
        "max_deviation_m": 326.02,
        "min": 70.3,
        "delta_min": -106.8,
        "kcal": 327.4,
        "delta_kcal": -517,
        "slope_max_deg": 16.2,
        "status": "GO",
        "go": true
      }
    ]
  },
  "counterfactual_comparison": {
    "region": "Gale / Mount Sharp boxwork bolgesi (Curiosity sol ~4459-4983)",
    "grid": {
      "width": 1000,
      "height": 1000,
      "res_m": 2,
      "synthetic": false
    },
    "terrain_model": {
      "terrain_model_available": false,
      "mode": "counterfactual_bedrock_entropy0"
    },
    "endpoints": {
      "start_px": [
        790,
        1
      ],
      "goal_px": [
        629,
        998
      ],
      "reference_start_px": [
        790.55,
        1.38
      ],
      "reference_goal_px": [
        629.97,
        998.58
      ],
      "euclidean_distance_m": 2019.8
    },
    "reference": {
      "source": "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json",
      "source_note": "NASA/JPL MMGIS MSL traverse; kutuya giris kuzey kenar, cikis guney kenar; sol ~4459-4983 (MMGIS waypoint)",
      "point_count": 854,
      "sampled_cell_count": 1785,
      "length_m": 3887.6,
      "grid_length_m": 4141.3,
      "min": 177,
      "kcal": 844.4,
      "slope_mean_deg": 9.9,
      "slope_max_deg": 45.7,
      "steep_cells_ge_nogo": 35
    },
    "presets": [
      {
        "kind": "shortest",
        "label": "En kısa",
        "weights": {
          "t": 1,
          "k": 0,
          "r": 0
        },
        "length_m": 2256.2,
        "delta_length_m": -1631.3,
        "delta_grid_length_m": -1885,
        "mean_deviation_m": 140.02,
        "max_deviation_m": 326.02,
        "min": 69.5,
        "delta_min": -107.5,
        "kcal": 323.7,
        "delta_kcal": -520.6,
        "slope_max_deg": 18.6,
        "status": "GO",
        "go": true
      },
      {
        "kind": "balanced",
        "label": "Dengeli",
        "weights": {
          "t": 1,
          "k": 12,
          "r": 22
        },
        "length_m": 2289.3,
        "delta_length_m": -1598.3,
        "delta_grid_length_m": -1852,
        "mean_deviation_m": 139.87,
        "max_deviation_m": 324.06,
        "min": 69.9,
        "delta_min": -107.1,
        "kcal": 325.2,
        "delta_kcal": -519.2,
        "slope_max_deg": 18.1,
        "status": "GO",
        "go": true
      },
      {
        "kind": "safest",
        "label": "En güvenli",
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140
        },
        "length_m": 2414.1,
        "delta_length_m": -1473.4,
        "delta_grid_length_m": -1727.2,
        "mean_deviation_m": 135.9,
        "max_deviation_m": 324.06,
        "min": 72.1,
        "delta_min": -105,
        "kcal": 333.1,
        "delta_kcal": -511.2,
        "slope_max_deg": 15.2,
        "status": "GO",
        "go": true
      }
    ]
  },
  "input_hashes": {
    "contracts\\grid.json": "0d8d8351c687157c6bcfb361a11bdd2d4637c20121926abf1ebc1a98f9157993",
    "layers\\msl_proposed_path.json": "d5fca4e2e615701402471f59e7d32a04ae1a67f37335e237e9afa94ab277e0c2",
    "docs\\validation_msl.json": "ca238a7792962a8036bfff3ac4734bda96164bdf98700504aebf0bccfb1b3835",
    "scripts\\compare_msl.py": "f1712431b28b88de43b092bf0070bddaf2c6d352ec9032e5524924fbde48383b",
    "layers\\elevation.npy": "fc8b8bebd41bf4847a7a3323e9b4a5cae289cfb152ec1a0193f0d1e9633de048",
    "layers\\elevation_norm.npy": "8d09cf83c58007d1e98cdfd1c96a9a9d2429a0eee5ccc65815b00ba019954ac6",
    "layers\\entropy.npy": "cad1579f723deba8b0175981377f26a4319a4dc492e2b1fa9d8e20a7153bdb05",
    "layers\\p_bedrock.npy": "70e30fae6f8f92bb0afab724f3085609a97dab6d6280069f16b7daa5a90e22c5",
    "layers\\p_bigrock.npy": "e5163cd0794c16035c99e7a6c97bc571c4e0cbb9aa18d59cc1b5ac4827b1bf2e",
    "layers\\p_sand.npy": "6a85435a6a79c8cabc9e76e55208cd53a5a5b3b6e0fdbc02c5d800a3ffb7ee08",
    "layers\\p_soil.npy": "44abb46c8efa30a6ed7ec1de35dae3380423e899fffa13307e3e37468583db90",
    "layers\\rock_cfa.npy": "7f98358f2a326f640d19dbcad8065b0804efb012950e28e95fce3c34cd30431f",
    "layers\\rock_cfa_ge1m.npy": "34081d2a440f351282637bd06e5c9baefa8a9e05f0d5e152d6b8abed2538da54",
    "layers\\slope.npy": "19de036a5f008c9de0f04c77e84b02a85b17d7193c0c500ffc946edfca195779",
    "layers\\slope_norm.npy": "e70d2b8dd0c337a74ab5685c9d0b91c856d23e534b6c949089520f2fec19ca0b",
    "api\\benchmarks\\route_perf.py": "9426a0d15089f928ff7c944403290935df0bab01dbd14cc05113e6059517f9c4",
    "api\\main.py": "2b5de8bb1dcdf3ff5beb60fcffe3b72ba9f4f7e70f53bb873422a510a093d4f8",
    "api\\planner\\__init__.py": "f3477b27e6f0db6f85974b565ba81ea21d04211e63dd653505430eea8510c027",
    "api\\planner\\comparison.py": "cd0d683650622ab81ab9242230dfa35d6856e89a694d229c6d364e877cb3eed6",
    "api\\planner\\cost.py": "e13ee05e8e3fccf61bc028f23a077b436d868268bd4cdba6522a5fbf708e2459",
    "api\\planner\\layers.py": "27714668c260bd27cbb9d8794e7422dda8fcabb6351d43981232b800c0772c03",
    "api\\planner\\params.py": "8da695bd9e2daef18335423a11812691e5f95e01e051d54c98f1f2882c808913",
    "api\\planner\\route.py": "fed331ba02c14defb765f319a6caf2a05d7bd8000faff5d06edc641c10a6d179",
    "api\\planner\\terrain.py": "d2bf98bff60c6266c0e0b3d2151b95f2fc1f08327a986bf9006d3ee6160c346b",
    "api\\tests\\test_api.py": "11c8b54aa2fe3787394e6aa6bc8ef5918bcea2df0eb3c7041e063142bfc8a83e",
    "api\\tests\\test_compare_msl.py": "4f44f1957e1b48de8a42f6b186740243e5719e12ffd8d3654109d0adefc2a1e8",
    "api\\tests\\test_data_compat.py": "f68131a95749206febe0b825f6843e40f8e069f4c5cea65231c29fcc152b0391",
    "api\\tests\\test_gate2.py": "a0844537e3b8a9ccf450f3d76b22a5dc89f60d838d49cc9fcd46c93dbfecb2d6",
    "api\\tests\\test_mvp.py": "b4e92292a6b1f20bc92256b5e4ed702a9d59382399bf263dff6e9105de93e944",
    "api\\tests\\test_precompute.py": "19b0c6e07bc1c5e0d50dba38152d4379e892703ed8c5d29f10b0483f30ca411a",
    "api\\tests\\test_sim_api.py": "e62d91ff589b1e4ae3fe0860dc7db75ff38d550f6d72a0f4888e0399c4116998"
  },
  "tests": "PASS: horizontal/diagonal rasterization; finite/shapes; exact path length conservation; inbounds; gradient consistency; along<=steepest; synthetic plane; probability sum; no input change"
}
~~~

## 8. Girdi SHA-256 veri izi (2026-11-15)

Dosya yolları yukarıdaki `C:/Users/Batu/Desktop/mm-pr/martian-map` köküne göredir. Hash'ler **yerel dosyanın gerçek baytları**, dolayısıyla Windows CRLF metin hash'i uzak LF Git blobundan farklı olabilir. NPY'ler binary olarak kullanıldı.

| Kaynak yol | SHA-256 |
| --- | --- |
| `contracts/grid.json` | `0d8d8351c687157c6bcfb361a11bdd2d4637c20121926abf1ebc1a98f9157993` |
| `layers/msl_proposed_path.json` | `d5fca4e2e615701402471f59e7d32a04ae1a67f37335e237e9afa94ab277e0c2` |
| `docs/validation_msl.json` | `ca238a7792962a8036bfff3ac4734bda96164bdf98700504aebf0bccfb1b3835` |
| `scripts/compare_msl.py` | `f1712431b28b88de43b092bf0070bddaf2c6d352ec9032e5524924fbde48383b` |
| `layers/elevation.npy` | `fc8b8bebd41bf4847a7a3323e9b4a5cae289cfb152ec1a0193f0d1e9633de048` |
| `layers/elevation_norm.npy` | `8d09cf83c58007d1e98cdfd1c96a9a9d2429a0eee5ccc65815b00ba019954ac6` |
| `layers/entropy.npy` | `cad1579f723deba8b0175981377f26a4319a4dc492e2b1fa9d8e20a7153bdb05` |
| `layers/p_bedrock.npy` | `70e30fae6f8f92bb0afab724f3085609a97dab6d6280069f16b7daa5a90e22c5` |
| `layers/p_bigrock.npy` | `e5163cd0794c16035c99e7a6c97bc571c4e0cbb9aa18d59cc1b5ac4827b1bf2e` |
| `layers/p_sand.npy` | `6a85435a6a79c8cabc9e76e55208cd53a5a5b3b6e0fdbc02c5d800a3ffb7ee08` |
| `layers/p_soil.npy` | `44abb46c8efa30a6ed7ec1de35dae3380423e899fffa13307e3e37468583db90` |
| `layers/rock_cfa.npy` | `7f98358f2a326f640d19dbcad8065b0804efb012950e28e95fce3c34cd30431f` |
| `layers/rock_cfa_ge1m.npy` | `34081d2a440f351282637bd06e5c9baefa8a9e05f0d5e152d6b8abed2538da54` |
| `layers/slope.npy` | `19de036a5f008c9de0f04c77e84b02a85b17d7193c0c500ffc946edfca195779` |
| `layers/slope_norm.npy` | `e70d2b8dd0c337a74ab5685c9d0b91c856d23e534b6c949089520f2fec19ca0b` |
| `api/benchmarks/route_perf.py` | `9426a0d15089f928ff7c944403290935df0bab01dbd14cc05113e6059517f9c4` |
| `api/main.py` | `2b5de8bb1dcdf3ff5beb60fcffe3b72ba9f4f7e70f53bb873422a510a093d4f8` |
| `api/planner/__init__.py` | `f3477b27e6f0db6f85974b565ba81ea21d04211e63dd653505430eea8510c027` |
| `api/planner/comparison.py` | `cd0d683650622ab81ab9242230dfa35d6856e89a694d229c6d364e877cb3eed6` |
| `api/planner/cost.py` | `e13ee05e8e3fccf61bc028f23a077b436d868268bd4cdba6522a5fbf708e2459` |
| `api/planner/layers.py` | `27714668c260bd27cbb9d8794e7422dda8fcabb6351d43981232b800c0772c03` |
| `api/planner/params.py` | `8da695bd9e2daef18335423a11812691e5f95e01e051d54c98f1f2882c808913` |
| `api/planner/route.py` | `fed331ba02c14defb765f319a6caf2a05d7bd8000faff5d06edc641c10a6d179` |
| `api/planner/terrain.py` | `d2bf98bff60c6266c0e0b3d2151b95f2fc1f08327a986bf9006d3ee6160c346b` |
| `api/tests/test_api.py` | `11c8b54aa2fe3787394e6aa6bc8ef5918bcea2df0eb3c7041e063142bfc8a83e` |
| `api/tests/test_compare_msl.py` | `4f44f1957e1b48de8a42f6b186740243e5719e12ffd8d3654109d0adefc2a1e8` |
| `api/tests/test_data_compat.py` | `f68131a95749206febe0b825f6843e40f8e069f4c5cea65231c29fcc152b0391` |
| `api/tests/test_gate2.py` | `a0844537e3b8a9ccf450f3d76b22a5dc89f60d838d49cc9fcd46c93dbfecb2d6` |
| `api/tests/test_mvp.py` | `b4e92292a6b1f20bc92256b5e4ed702a9d59382399bf263dff6e9105de93e944` |
| `api/tests/test_precompute.py` | `19b0c6e07bc1c5e0d50dba38152d4379e892703ed8c5d29f10b0483f30ca411a` |
| `api/tests/test_sim_api.py` | `e62d91ff589b1e4ae3fe0860dc7db75ff38d550f6d72a0f4888e0399c4116998` |

