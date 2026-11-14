# Metabolik model: astronotun yürüme enerjisi

Hazırlayan: Elif Nisa · 2026-11-14 · Kullanan kod: `api/planner/cost.py`, `api/planner/params.py`

> **Özet.** Formül Pandolf (1977) yük taşıma denklemi. NASA JSC (Kim vd. 2024) aynı denklemi Santee
> düzeltmesiyle birlikte EVA rota planlamasında kullanıyor. Koddaki formül orijinalle **birebir aynı**.
> Dünya zeminlerinden türetilmiş katsayılar kullanılmıyor. Kodun okuduğu zemin tablosu kodun mevcut
> varsayım değerleriyle aynı; bu belge kodun davranışını **değiştirmiyor**. NASA 2024 makalesinde zemin
> katsayısı tablosu **yok**. Mars zeminleri için ölçülmüş katsayı da bulunmuyor. Mars yerçekimi için
> doğrulanmış bir formül yok; bu konudaki her şey VARSAYIM olarak işaretli.

## 1. Formül (doğrulandı)

Pandolf, Givoni & Goldman (1977), Kim vd. (2024) içinde denklem (2):

```
M = 1.5·W + 2.0·(W + L)·(L/W)² + η·(W + L)·(1.5·V² + 0.35·V·G)
```

| Sembol | Anlam | Birim |
|---|---|---|
| M | Metabolik hız | W (watt) |
| W | Vücut kütlesi | kg |
| L | Taşınan dış yük (skafandr + ekipman) | kg |
| V | Yürüme hızı | m/s |
| G | Eğim | **yüzde** (%), derece değil: `G = 100·tan(θ)` |
| η | Zemin katsayısı | birimsiz, referans zemin (ana kaya) = 1.0 |

Terimlerin anlamı:
- `1.5·W`: yüksüz ayakta durma maliyeti
- `2.0·(W+L)·(L/W)²`: yükle ayakta durma maliyeti
- `η·(W+L)·(…)`: hız ve eğime bağlı yürüme maliyeti

**Kod kontrolü:** `api/planner/cost.py` → `_pandolf_raw` aynı katsayıları kullanıyor (1.5, 2.0, 1.5, 0.35). ✅
Eğim de doğru birimde: `kcal_per_m` dereceyi `grade = tan(θ)·100` ile yüzdeye çeviriyor. ✅

## 2. İniş düzeltmesi: Santee (doğrulandı, kullanım önerisi)

Pandolf denklemi negatif eğimde (iniş) maliyeti fazla düşük, hatta negatif verebilir. Santee vd. (2001, 2003)
bir düzeltme faktörü önerdi. Kim vd. (2024) denklem (3):

```
CF = η·[ (G·(W+L)·V)/3.5 − ((W+L)·(G+6)²)/W + (25 − V²) ]
M_düzeltilmiş = M − CF
```

- Düzeltme yaygın kullanımda **yalnız iniş (G < 0)** için uygulanıyor. Bu kullanım koşulunu Santee'nin orijinal makalesinden kontrol edemedim.
- **Dikkat:** Sonraki bir karşılaştırma çalışması, orijinal yayında son terimdeki işaretin baskı hatası olduğunu
  bildiriyor (Military Medicine 2018/19; bkz. Kaynaklar). Bu yüzden denklemi koda almadan önce orijinal makaleden kontrol etmek gerekiyor.
- Kim vd. (2024) ayrıca bir "adaptasyon gecikmesi" faktörü (DF) ekliyor. Bu faktör zaman serisi ölçümü için; rota planlamasında kullanılmaz.
- **Koddaki mevcut durum:** Hücre maliyetinde eğim yönü bilinmediği için `|G|` kullanılıyor. Yani iniş de
  çıkış kadar pahalı sayılıyor. Bu temkinli ve savunulabilir bir seçim. **Önerim:** Kapı 2 için bu hâliyle bırakın, sunumda
  "iniş maliyeti temkinli olarak çıkışla eşit sayıldı" deyin.

## 3. Zemin katsayıları (VARSAYIM)

Mars zeminlerinde (ana kaya, toprak, kum, büyük kaya) ölçülmüş bir Pandolf zemin katsayısı **yok**.
NASA 2024 makalesi de katsayı tablosu vermiyor. Bu yüzden aşağıdaki değerler kaynaklı değer değil;
planlayıcının zeminleri **sıralayabilmesi** için kullanılan varsayımlar (kum en pahalı, ana kaya en ucuz).
Değerler `api/planner/params.py`'deki mevcut kod değerleriyle aynı.

**Kodun okuduğu tablo.** `api/planner/terrain.py` bu tabloyu okur. Sütun ve sınıf adlarını değiştirmeyin.
Tablo silinirse API hata verir. `speed`, düz ana kayadaki temel hıza göre hız çarpanıdır.

| class | eta | speed | not |
|---|---|---|---|
| bedrock | 1.0 | 1.0 | VARSAYIM (referans zemin) |
| soil | 1.2 | 0.95 | VARSAYIM |
| sand | 2.1 | 0.6 | VARSAYIM |
| bigrock | 1.5 | 0.5 | VARSAYIM |

Sunumda söylenecek cümle: *"Zemin katsayıları Mars'ta ölçülmüş değerler değil, zeminleri sıralayan
varsayımlar. Gerçek değerler Mars'ta ölçülene kadar arayüzde VARSAYIM olarak gösteriliyor."*

## 4. Mars yerçekimi varsayımı

- `g_Mars = 3.71 m/s²`, `g_Mars / g_Dünya = 0.378`.
- Pandolf denkleminde yerçekimi terimi yok; formül Dünya'da ölçülmüş verilere dayanıyor. **Mars için doğrulanmış bir sürümü yok.**
- Koddaki yaklaşım: yük ve hareket terimleri g oranıyla çarpılıyor, ardından sonuç düz ana kayada Apollo EVA
  ortalamasına (~272 W) kalibre ediliyor. Kalibrasyon mutlak düzeyi belirliyor; Pandolf yalnız **göreli**
  farkları veriyor (kum ana kayadan ne kadar pahalı, eğim ne kadar pahalı gibi).
- **Bu bir VARSAYIM.** Azaltılmış yerçekimi deneyleri, yürüme maliyetinin yerçekimiyle orantılı azalmadığını,
  daha az azaldığını gösteriyor (Farley & McMahon 1992). Yani g oranıyla ölçeklemek Mars'taki maliyeti
  muhtemelen **düşük tahmin ediyor**. Skafandrın eklem direnci de formülde yok. Kalibrasyonun gerçek bir
  EVA ölçümüne (Apollo) dayanması bu hatayı kısmen telafi ediyor.
- Sunumda söylenecek cümle: *"Pandolf denklemi Dünya'da doğrulanmış bir denklem. Mars için yük terimlerini yerçekimi oranıyla
  ölçekledik ve mutlak düzeyi Apollo EVA ölçümlerine kalibre ettik. Bu bir planlama tahmini; tıbbi bir sınır değil."*

## 5. Açık kalanlar
- [ ] Santee düzeltmesindeki işaret hatası: orijinal makaleden kontrol edilecek (kod şu an `|G|` kullandığı için acil değil)
- [ ] Apollo 272 W kalibrasyon değeri: Waligora & Horrigan (1975, NASA SP-368) orijinalinden doğrulanacak (EVA parametreleri işinde)
- [ ] Mars zeminleri için ölçülmüş zemin katsayısı yok; değerler VARSAYIM kalır
- [ ] Kim vd. 2024'teki zemin katsayısı ifadesinin issue'dan düzeltilmesi

## Kaynaklar
- Pandolf, K. B., Givoni, B., Goldman, R. F. (1977). Predicting energy expenditure with loads while standing or
  walking very slowly. *J. Appl. Physiol.* 43(4), 577–581. https://doi.org/10.1152/jappl.1977.43.4.577
- Kim, K. J., Hoffmann, B., Estep, P., Marshall-Goebel, K., Buckland, D. (2024). Improving Metabolic Workload
  Estimation Accuracy for Planning and Analyzing Exploration Traverses. IEEE EMBC 2024, NASA JSC.
  https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf
- Santee, W. R., Allison, W. F., Blanchard, L. A., Small, M. G. (2001). A proposed model for load carriage on
  sloped terrain. *Aviat. Space Environ. Med.* 72(6), 562–566.
- Santee, W. R., Blanchard, L. A., Speckman, K. L., Gonzalez, J. A., Wallace, R. F. (2003). Load carriage model
  development and testing with field data. USARIEM Tech. Note TN03-3.
- Santee düzeltmesinin işaret hatası notu: *Military Medicine* 183(9–10), e357.
  https://academic.oup.com/milmed/article/183/9-10/e357/5025891
- Farley, C. T., McMahon, T. A. (1992). Energetics of walking and running: insights from simulated
  reduced-gravity experiments. *J. Appl. Physiol.* 73(6), 2709–2712.
