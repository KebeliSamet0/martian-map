# Veri analizi: RAD, REMS ve Mount Sharp rotası

Analizi yapan: Samet · Tarih: 2026-11-14 · Kapsam: #16 Aşama 0.
Sayısal ölçümler kaynaklıdır; hesaplar **türetilmiş**, operasyon tercihleri **VARSAYIM** olarak ayrılmıştır.

## 1. Ne
- RAD: kalibre yüzey radyasyonu, `MSL-M-RAD-3-RDR-V1.0`; [PDS kayıt ve indirme geçidi][rad].
- REMS: `MSL-M-REMS-5-MODRDR-V1.0` sıcaklık/UV, ADR güneş geometrisi ve ayrı UVRDR düzeltmeli UV; güncel dağıtım [PDS4 bundle][rems4].
- Rota: [NASA önerilen Mount Sharp yolu][map] ve [PDS PLACES gerçek lokalizasyonları][places].
- Kullanım: açık NASA/PDS bilim arşivleri; ürün ve üretici atıfları korunmalı. Makale figürleri kamu malı kabul edilmedi. NASA rota görseli çok kurumlu kredilidir; bu teslimde görsel atlandı.

## 2. Erişim
| Ürün | İndirme / format | Boyut ve doğrulama |
|---|---|---|
| RAD | [PDS/PPI][radfiles]; sol bazlı ASCII veri + ayrık PDS etiketi | Tam arşiv/kesit: bilinmiyor; bu çalışmada makale değerleri kullanıldı. |
| REMS MODRDR | [Güncel örnek dizin][sample]: `RME_410851407RMD01510000000_______P9.TAB` + `.xml`/`.LBL`; ASCII tablo | Dizin TAB için yaklaşık **5.0M**, XML için **27K** gösteriyor [PDS][sample]; örnek geçici klasöre indirildi, repoya eklenmedi. Tam arşiv: bilinmiyor. |
| REMS UVRDR | [data_uv_corrected][uvdir]; virgülle ayrılmış sabit genişlikli ASCII TAB + etiket | İlk **100 sol** dosyası yaklaşık **1.1G** [PDS][uvdir]; büyük dosya indirilmedi. |
| Gerçek rota | [data_localizations][places]; `localized_pos.csv` + `.csv.xml`, sıklaştırılmış `localized_interp.csv` alternatifi | Sırasıyla yaklaşık **341K / 11M** [PDS dizini][places]; yerel indirme denenmedi. |
| Önerilen rota | [NASA GIF][map]; jeoreferanslı raster değil | **1041 × 586 piksel, 2.86 MB** [NASA][map]; indirilmedi. |

REMS için tekrarlanabilir indirme (repo dışına; etiket de aynı dizinden alınmalı):
```sh
curl -fL 'https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00090_00179/SOL00151/RME_410851407RMD01510000000_______P9.TAB' -o /tmp/rems_sample.tab
```
- Eski PDS3 örnek URL'si erişim denemesinde bulunamadı; yukarıdaki güncel PDS4 dizinini kullan.
- RAD/REMS raster değildir: rover konumu + zaman serisi. Örnekleme **1 Hz**, tipik saat başına **5 dakika**, ek **60 dakika** bloklar [PDS REMS][rems]. Sürekli kayıt varsayma.
- PLACES koordinatlarını XML/SIS'teki referans haritasıyla yorumla; Dünya WGS84 atama. HiRISE/CTX DTM'nin Mars CRS'sine dönüştür; sonra grid affine ters dönüşümüyle `[sütun,satır]` üret. Kaynaklar: [PLACES SIS][sis], [grid sözleşmesi](../../contracts/README.md).
- Raster çözünürlüğü/nihai CRS: seçilecek DTM'ye bağlı, bilinmiyor; GIF piksel boyutu arazi çözünürlüğü değildir.

## 3. Kapsama
- Gale / aşağı Mount Sharp: **Evet**, yalnız rover izi ve ölçüm konumları; tüm boxwork alanı için meteoroloji/radyasyon haritası yok. Kesin kesişim ve koordinat sınırları: bilinmiyor, seçilen DTM ile kontrol edilmeli.
- RAD başlangıç yüzey örneği **Ağustos 2012–Haziran 2013** [Hassler][h14]; sonraki güneş minimumu örneği **Kasım 2019–Ekim 2020** [Ehresmann][e23].
- Güncel REMS dizini **sol 1–4843** kapsama ilan ediyor [PDS][rems]; her değişkenin her solü dolu değildir. UVRDR belgelenmiş kapsama **sol 1–3423** [PDS UV katalog][uvcat].
- Önerilen rota görseli **15 Mayıs 2019** tarihli [NASA][map]; tarihsel plan, gerçekleşmiş güzergâh veya güncel boxwork hedefiyle özdeş sayılmaz.

## 4. İçerik
### RAD: soğurulan doz D ve doz eşdeğeri H
| Durum | D (mGy / Dünya günü) | H (mSv / Dünya günü) | Birincil kaynak / yorum |
|---|---:|---:|---|
| Gale, erken görev GCR ortalaması | **0.210 ± 0.040** | **0.64 ± 0.12** | [Hassler, Science][h14]; doku benzeri doz, organ etkin dozu değil. |
| Güneş minimumu | **0.314** | **0.721 ± 0.042** | [Ehresmann, Icarus][e23]; erken görev aralığının üstüne çıkar. |
| Eylül 2017 SEP öncesi, B dedektörü | **0.240** | **0.543** | [Zeitlin, Tablo 1][z18]; B, sudaki doza çevrilmiş. |
| Aynı olayın tepe hızı, B | **0.718** | **0.841** | [Zeitlin, Tablo 1][z18]; GCR dahil toplam hız. |

Görevdeki yaklaşık **0.180–0.225 mGy/gün** ifadesinin tek bir ölçüm aralığı olarak kaynağı **bilinmiyor**; doğrulanmış merkez ve belirsizlik için [Hassler][h14] satırını kullan. Evrensel alt/üst sınır değildir.
SEP'in arka plan üstü olay-integrali B'de **0.544 mGy**, E'de **0.369 mGy** [Zeitlin][z18]; günlük hız veya her EVA'ya eklenecek sabit değildir. Bu olay en kötü durum sınırı değildir; GCR kalite faktörü SEP'e aynen uygulanamaz.

### REMS ve gün ışığı
- MODRDR: ortam/hava sıcaklığı, zemin parlaklık sıcaklığı, belirsizlik ve kalite alanları [PDS sıcaklık][temp]; UV akıları **W/m²** [PDS UV][uv]. Kesit min/maks/ortalama ve nodata oranı hesaplanmadı: bilinmiyor.
- MODRDR UV belirsizlikleri mevcut değil [PDS UV][uv]. UVRDR toz ve açısal yanıt düzeltmesi ile belirsizlik verir; rover referansında güneş zenit açısı **55°** üstünde değerler **−999** olabilir [PDS UV katalog][uvcat]. Eksik UV, gece anlamına gelmez.
- Gün ışığı bağımsız bir REMS görünür-ışık/lüks kanalı değildir. ADR güneş konumu + zaman, gerekirse [PDS NAIF MSL SPICE][spice] ile doğuş/batış hesaplanır; DTM ufku eklenerek rota gölgesi sınanır.
- **EVA için kullanılabilir:** geçmiş sol/mevsim profillerini karşılaştırmak için. Başlangıç aday penceresi **09:00–15:00 LMST (VARSAYIM; doğrulanmış güvenli pencere bilinmiyor)**; sabah/akşam soğuğu ile öğle UV yükü birlikte değerlendirilir [ölçülecek alanlar: PDS][temp]. LMST, LTST ve Dünya saatini karıştırma; gün ışığı ve dönüş koşulu pencereye üstün gelir.
- Bu pencereye sığmayan uzun EVA genişletilmiş gündüz doğrulaması gerektirir; yerel sıcaklık/UV güvenlik sınırları skafandr verisi olmadan **bilinmiyor**.

## 5. Kalite ve sorunlar
- RAD rover üzerindeki dedektör ortamını ölçer; skafandr, vücut, yön ve habitat zırhlaması farklıdır. D → H → NASA etkin/organ dozu otomatik birim dönüşümü değildir [Hassler][h14], [NASA standart][nasa].
- REMS kalite bayrakları, rover ısısı/gölgesi, sensör tozu ve aralıklı örnekleme filtrelenmeli [PDS sıcaklık][temp], [UV katalog][uvcat]. Boş saatleri uzun doğrusal interpolasyonla doldurma.
- NASA görseli HiRISE/CTX/CRISM/HRSC bileşimidir [NASA][map]. Sabit kareyi ortofotoyla ortak krater/sırt noktalarından jeoreferanslayıp çizgiyi elle sayısallaştırmak mümkün; perspektif varsa basit affine yeterli olmayabilir. Bağımsız kontrol noktalarıyla artık hata ölçülmeden grid doğruluğu iddia edilmez; hata şu anda **bilinmiyor**.
- PLACES için lokalize noktalar ile interpolasyonlu ara noktaları ayır; aralarındaki doğru parçası yürünebilir koridor kanıtı değildir. `demv2` ve eski referans çözümlerini karıştırma [SIS][sis].

## 6. Bizim için kullanımı
- RAD → zamana bağlı doz maliyeti; REMS → tarih/saat uygunluk filtresi; rota → karşılaştırma referansı. RAD ortalaması mekânsal risk rasteri değildir.
- **Pratik seçim: PLACES CSV → Mars CRS → grid.** [Analyst’s Notebook Resources][an] gerçek traverse indirmesini doğruluyor. Hazır resmî MSL GeoJSON / Mars Trek waypoint dışa aktarma uç noktası **bilinmiyor**; CSV'den yerel GeoJSON üretilebilir, Mars koordinatlarını web haritada Dünya koordinatı diye yorumlatma.
- Önerilen yolu karşılaştırmak ayrıca gerekiyorsa GIF sayısallaştırması B planı; gerçek traverse farklı bir soruyu yanıtlar. İşleme süresi ölçülmedi: **bilinmiyor**.

### EVA doz ve süre bütçesi
Dünya saati cinsinden `t = gidiş + bilim + dönüş + yedek`; `D = D_gün × t / 24`, `H = H_gün × t / 24` (birim dönüşümü; günlük kaynaklar [Hassler][h14], [Zeitlin][z18]). Gerçek zaman serisinde segment integrali kullanılır.
Aşağıdaki süreler görev senaryosudur; sonuçlar **türetilmiş** ve yuvarlanmıştır. SEP sütunları ölçülmüş tepe hızının bütün EVA boyunca sabit kaldığı senaryodur; gözlenen EVA dozu değildir.

| EVA (Dünya saati) | Sakin D (mGy) | Sakin H (mSv) | SEP tepe D (mGy) | SEP tepe H (mSv) | Kaynak |
|---:|---:|---:|---:|---:|---|
| 4 (senaryo) | 0.035 | 0.107 | 0.120 | 0.140 | [Hassler][h14], [Zeitlin][z18]; yukarıdaki formül |
| 6 (senaryo) | 0.0525 | 0.160 | 0.180 | 0.210 | [Hassler][h14], [Zeitlin][z18]; yukarıdaki formül |
| 8 (senaryo) | 0.070 | 0.213 | 0.239 | 0.280 | [Hassler][h14], [Zeitlin][z18]; yukarıdaki formül |

NASA kariyer uzay uçuşu **etkin dozu <600 mSv**; **30 günlük** kan yapıcı organ sınırı **250 mGy-Eq**, göz merceği **1000 mGy-Eq**, deri **1500 mGy-Eq** [NASA-STD-3001, V1 4030 ve Tablo 4.8-1][nasa]. Bunlar EVA başına RAD-H limitleri değildir; geçmiş uçuş, transit, habitat ve organ taşıma modeli gerekir. Gezegen yüzeyinde uzun görev habitatı için **0.9 mSv/gün** tasarım şartı da EVA kesme eşiği değildir [V1 4033][nasa].

### `api/planner/params.py` için öneri tablosu (bu PR kodu değiştirmez)
| Sabit | Önerilen değer | Statü / birincil dayanak |
|---|---|---|
| `DOSE_UGY_PER_H` | **8.75 µGy/saat** | Mevcut ad; türetilmiş erken görev ortalaması [Hassler][h14]. |
| `DOSE_EQ_MSV_PER_H` | **0.026667 mSv/saat** | Türetilmiş erken görev H [Hassler][h14]; etkin doz değildir. |
| `SEP_PEAK_UGY_PER_H` | **29.9167 µGy/saat** | Türetilmiş B tepe hızı [Zeitlin][z18]; en kötü olay değil. |
| `SEP_PEAK_EQ_MSV_PER_H` | **0.035042 mSv/saat** | Türetilmiş B tepe H [Zeitlin][z18]. |
| `EVA_MAX_H` | **6 Dünya saati** | VARSAYIM; operasyonel NASA limiti bilinmiyor, görev senaryosu. |
| `RESERVE_MIN` | **30 Dünya dakikası** | VARSAYIM; mevcut demo tercihi, doğrulanmış kaynak bilinmiyor. |
| `EVA_DOSE_EQ_BUDGET_MSV` | **0.20 mSv** | VARSAYIM; demo bütçesi, biyolojik güvenlik sınırı için kaynak bilinmiyor. |
| `EVA_LMST_WINDOW` | **[09:00, 15:00]** | VARSAYIM; [REMS][rems] ile sınanacak, güvenli aralık kaynağı bilinmiyor. |

**Demo GO:** dönüş ve yedek dahil süre limite sığar, H demo bütçesini aşmaz, gün ışığı/sıcaklık/UV verisi yeterlidir ve SEP alarmı yoktur. Herhangi biri sağlanmıyorsa **NO-GO**; gerekli veri yoksa **NO-GO (veri yetersiz)**. SEP alarmında sayısal bütçeden bağımsız yeni EVA başlatma. Skafandr termal/UV uygunluğu bilinmiyorsa gerçek operasyon için GO üretilemez.
Mevcut `go` alanı dönüş/eğim kontrolüne dayanıyor; bu rapordaki radyasyon/REMS kuralları henüz uygulanmış değildir. `dose_uGy` alanına mSv yazılmaz. Kariyer/organ limitleri ayrı denetlenir; RAD-H toplamı bunların yerine geçmez.

## 7. Karar
**KULLAN:** RAD yayın ortalamalarıyla açıklanabilir demo doz hesabı ve PLACES gerçek rota; **B PLANI:** REMS geçmiş zaman profili ve önerilen yolun elle sayısallaştırılması. Kalan bilinmeyenler: kesin DTM kesişimi/hizalama hatası, REMS kesit istatistikleri, skafandr sıcaklık/UV limitleri, kişisel organ dozları ve resmî GeoJSON uç noktası; bunlar gerçek EVA güvenlik onayı vermez.

[h14]: https://doi.org/10.1126/science.1244797
[e23]: https://doi.org/10.1016/j.icarus.2022.115035
[z18]: https://doi.org/10.1029/2018GL077760
[rad]: https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=MSL-M-RAD-3-RDR-V1.0
[radfiles]: https://pds-ppi.igpp.ucla.edu/bundle/MSL-M-RAD-3-RDR-V1.0
[rems]: https://pdsatmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html
[rems4]: https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/
[sample]: https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00090_00179/SOL00151/
[temp]: https://pdsatmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems_temperature.html
[uv]: https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems_uv.html
[uvdir]: https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_uv_corrected/
[uvcat]: https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/document/REMS_UVRDR_DS.CAT
[map]: https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/
[places]: https://planetarydata.jpl.nasa.gov/img/data/msl/msl_places/data_localizations/
[sis]: https://planetarydata.jpl.nasa.gov/img/data/msl/msl_places/document/PLACES_PDS_SIS.pdf
[an]: https://an.rsl.wustl.edu/help/Content/Using%20the%20Notebook/Main%20sections/Maps/Traverse%20map.htm
[spice]: https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=MSL-M-SPICE-6-V1.0
[nasa]: https://www.nasa.gov/reference/4-0-human-performance/
