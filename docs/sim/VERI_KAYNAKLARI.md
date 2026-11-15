# Simülatörde gösterilen sayılar: nereden geliyor? (2026-11-14)

Hazırlayan: Batu (sim) · Kaynaklar ekibin araştırmalarından: `docs/eva_parameters.md`, `docs/metabolic_model.md`,
`docs/REFERENCES.md`, `docs/data/*.md`. Bu belge **kodu değiştirmez**; neyin gerçek veri, neyin model tahmini,
neyin varsayım olduğunu ayırır. Sunumda bu ayrım korunmalı.

Etiketler: **GERÇEK** = kaynağı olan ölçüm/yayın · **MODEL** = bizim/ekibin model çıktısı (yer gerçeği değil) ·
**VARSAYIM** = kaynaksız ya da kaynağı yalnız öneri aşamasında.

## 1. Yoldaki renk (yeşil → kırmızı)

| Ne | Nereden | Etiket |
|---|---|---|
| Eğim | HiRISE DTM (Calef & Parker 2016, USGS MSL Gale Merged DEM 1 m v3), planlayıcı 2 m ızgarada hesaplar | GERÇEK veri, türetilmiş eğim |
| Segment rengi | Segmentteki **en dik hücre** (`slope_max`): <5° yeşil, 5–10 açık yeşil, 10–15 sarı, 15–20 turuncu, ≥20° kırmızı | Bantlar bizim görselleştirme seçimimiz (VARSAYIM) |
| "Riskli 15° / geçilmez 20°" | `/assumptions` | KAYNAKLI: 15° Artemis planlaması (Acta Astronautica 2023), 20° NASA EVA ConOps (EVA-EXP-0075); Ay için, Mars'a temkinli uygulandı (Emre, #52) |

Dikkat: segmentler 40–70 m uzunluğunda; tek dik hücre tüm segmenti boyar. 2 m DEM sırt kenarında eğimi abartıyor
(`/assumptions`: "2 m DEM ridge edge exaggerates slope"; rover tilt karşılaştırması: `docs/data/gale_dtm_ortho.md`,
`docs/validation_msl.md`). Bu yüzden kırmızı = "tehlikeli" değil, "segmentte bir yerde dik hücre var".
3B bilgi panelinde artık oyuncunun bulunduğu segmentin **maks / ort eğimi** de yazıyor.

## 2. Oksijen, enerji, doz

| Değer | Kaynak | Etiket |
|---|---|---|
| Yürüme enerjisi formülü | Pandolf, Givoni & Goldman 1977, J. Appl. Physiol. 43(4); NASA JSC EVA planlamasında aynı denklem: Kim vd. 2024 (IEEE EMBC, NTRS 20240001423). Bkz. `docs/metabolic_model.md` | GERÇEK (yayınlı formül) |
| Düz zemin 272 W | Waligora & Horrigan 1975, NASA SP-368 (Apollo EVA ortalaması, 158.74 sa) | GERÇEK, **Ay** verisi |
| O₂ dönüşümü 4.8 kcal/L | Péronnet & Massicotte 1991 (RER 0.85 → ≈4.86); NASA da RER 0.85 kullanıyor (Ogilvie vd. 2026) | GERÇEK |
| Doz hızı 8.75 µGy/sa | Curiosity RAD, Hassler vd. 2014, Science 343 (Gale yüzeyi) | GERÇEK ölçüm |
| Referans yürüyüş hızı 0.67 m/s | NASA APACHE slaydı (NTRS 20220010306), eğim aralığı −10…+30 % | GERÇEK (NASA) |
| Zemin katsayıları η (kaya 1.0, toprak 1.2, kum 2.1, büyük kaya 1.5) | Soule & Goldman 1972; Richmond vd. 2015. **Dünya'da ölçüldü**; Mars zeminine eşleme bizim | VARSAYIM (Mars için ölçüm yok) |
| Mars yerçekimi ölçeği 0.378 | g oranı (3.71 / 9.81); yük ve eğim terimlerinin ölçeklenmesi doğrulanmış formül değil | VARSAYIM |
| p_kum, p_büyük kaya, belirsizlik | AI4Mars (Swan vd. 2021) ve ml/ katmanları | MODEL tahmini |
| Tarayıcı sınıfı (scan_class) | `/assumptions` kuralı: eğim, p_kum, kaya, belirsizlik eşikleri | MODEL + VARSAYIM eşik |
| Gale yolu / duraklar | NASA/JPL MMGIS `MSL_waypoints.json`; Navcam ham görüntüleri | GERÇEK |

### Mars'ta yürümek daha pahalı olabilir
272 W Ay ortalaması. NASA Mars skafandrı tasarım ortalaması 352 W; skafandrlı eve dönüş testinde ~500 W ölçüldü
(Norcross vd. 2009; Ogilvie vd. 2026). **Rota enerji tahminlerimiz alt sınır olarak okunmalı.**

## 3. Limitler (2026-11-15: kaynaklı değerler uygulandı, #147)

| Parametre | Kodda (`params.py`, `missions.json`) | Kaynak |
|---|---|---|
| O₂ bütçesi | **375 L** | Türetilmiş: 1800 kcal ÷ 4.8 kcal/L (belgede 4.86 ile ≈370 L) |
| Enerji bütçesi | **1800 kcal** | Apollo 15–17 PLSS ısı kapasitesi (SP-368) |
| EVA süresi | **7 sa** | Apollo 15–17 PLSS (SP-368) |
| Astronot / skafandr / ekipman | **82 / 104 / 23 kg** | NASA-STD-3001; Ogilvie vd. 2026 |
| Yürüme hızı | **0.75 m/s** | Jones, ALSJ; Ogilvie vd. 2026 |
| Doz bütçesi | **≈61 µGy** | Türetilmiş: 7 sa × RAD yüzey doz hızı (Hassler vd. 2014). Beklenen doz, sağlık limiti değil |
| Yedek süre 30 dk | 30 dk | Apollo OPS acil sisteminin asgari süresi (SP-368); Mars için genel pay değil |
| Bilim durağı 30 dk | 30 dk | Kaynak yok: VARSAYIM (görev planı girdisi) |

HUD'daki O₂ kalanı `sim/data/missions.json` limitinden (375 L) gelir; S3'ün 80 L "yarım tüp" senaryo bütçesi değişmedi.
Değerler Ay (Apollo) ve NASA tasarım hedeflerinden; Mars için doğrulanmış EVA bütçesi yok. Sunumda "limitler tıbbi eşik değil, planlama varsayımıdır" denmeli
(`docs/eva_parameters.md` §2.4).

## 4. Sim'e özgü (görsel) veriler

| Ne | Kaynak | Etiket |
|---|---|---|
| Arazi yüksekliği | HiRISE T3 DTM (COG) + MOLA/THEMIS/CTX bağlamı; DEM kayması ≈ +30.7 m D / +33.5 m G düzeltildi (`docs/sim/DEM_KAYMA.md`, Elif Rana'nın 144 durak doğrulaması) | GERÇEK |
| Yüzey rengi | USGS LRGB mozaik / HiRISE ortofoto | GERÇEK |
| Güneş yönü/yüksekliği | HiRISE ESP_019698_1750 etiketi: yükseklik 32.507°, azimut 282.527° | GERÇEK |
| Tespit edilmiş kayalar, kum adayları | Gölge yöntemiyle HiRISE'tan (`ml/orbital`, `data/rocks.json`, `sand_zones.json`) | MODEL |
| Sentetik taş / zemin ayrıntısı (`?ground=rich`, PBR) | Prosedürel; "Saf veri modu" kapatır | **SENTETİK, veri değil** (arayüzde etiketli) |
| Astronot modeli | Quaternius, CC0 1.0 (poly.pizza/m/3hC2i0CTuO) | Varlık |
| Terrain Scanner tasarımı | `docs/sim/TERRAIN_SCANNER_KAYNAKLAR.md` | — |
| Boxwork bağlamı | LPSC 2026 #1716; NASA/JPL 2025 haberleri (`docs/REFERENCES.md`) | GERÇEK |


## 6. Bağımsız kaynak doğrulaması (gercek masası, 2026-11-14)
Tam rapor ve atıflar: `docs/data/ekip/gercek_parametre_arastirmasi.md`. Bu doğrulama yukarıdaki tabloları **sıkılaştırır**:

| Değer | Bulgu | Sunumda nasıl denir |
|---|---|---|
| **0.378 g ölçeği** | Farley & McMahon 1992: yerçekimi %75 azalınca koşu enerjisi %72, **yürüme yalnız %33** azalıyor. Enerjiyi g oranıyla doğrusal ölçeklemek desteklenmiyor. | "Enerji tahmini Dünya formülüne dayanır, Mars g'si için doğrulanmış katsayı yok; alt/üst sınır olarak oku." |
| **Riskli 15° / geçilmez 20° (2026-11-15: 25°→20°)** | Mars insanı için doğrulanmış eşik **bulunamadı**. Apollo yaya eğimleri (Iqbal 2024) ve Ay planlama örneği ±20° (Kim 2025) var; bunlar güvenlik sertifikası değil. | "Eşikler planlama varsayımı; uyarı 'yerel değerlendirme gerekli' anlamında." |
| **Yedek süre 30 dk** | Yalnız Apollo OPS acil sisteminin asgari süresi olarak kaynaklı (SP-368). Genel Mars payı için kaynak yok. | "Yedek süre görev prosedüründen gelmeli." |
| **Bilim durağı 30 dk** | Sabit standart yok; faaliyet başına süre (Johnson 2010). | "Görev planı girdisi." |
| **Doz 60 µGy** | NASA EVA-başına 60 µGy limiti **bulunamadı**. NASA-STD-3001: kariyer <600 mSv, 30 gün/1 yıl organ limitleri; bunlar EVA bütçesine bölünmez. HUD'daki "doz" Curiosity RAD arka planıdır (0.210 mGy/gün → 8.75 µGy/sa, sabit hız varsayımı). | "Doz = tarihsel RAD arka planıyla tahmin; NASA limiti değil, plan bütçesi." |
| **0.67 m/s** | APACHE slayt 23: N=1, Mark III, sabit hız, eğim −%10…+%30. Genel Mars hız yasası değil. | "Tek denekli NASA benchmark hızı." |
| **Kum η 2.1** | Soule & Goldman'ın özgün tablosu bağımsız okunamadı; Lejeune 1998: kumda yürüme **2.1–2.7×** enerji (Dünya). Mars katsayısı yok. | "Dünya ölçümü, Mars için doğrulanmadı." |
| **4.8 kcal/L O₂** | Ogilvie 2026 RER 0.85 senaryosunda ≈5.02 kcal/L O₂ türetiyor; Péronnet-Massicotte özgün tablosu okunmadı. Fark %5 civarı. | "RER 0.85 varsayımlı dönüşüm." |
| **Skafandr kütlesi 104 kg** | Mars suit için NASA ön tasarım üst önerisi; var olan bir skafandr değil. xEMU 177 kg. | "Hedef skafandr." |

Sim tarafı önerisi (Samet/Veysel kararı, kod değişikliği yok): HUD'da doz ve limitler "plan bütçesi" diye etiketlensin;
`/assumptions`'a `verified` yerine `kaynak_dogrulandi` + `mars_icin_gecerli` ayrı alanlar eklensin.
Uçuş/operasyon onay aracı olarak tanıtılmamalı: bu bir **EVA prova ve karar destek araştırma simülatörü**.

## 5. Açık kalanlar
- [ ] 420 → 370 L ve diğer önerilen değerlerin koda alınması: Samet + Elif Nisa kararı.
- [ ] `RESERVE_MIN`, `SCIENCE_STOP_MIN` için kaynak yok.
- [ ] Duyarlılık testi `FLAT_REFERENCE_W = 352` (Samet).
- [ ] Segment renginde `slope_max` yerine ortalama/persentil kullanılsın mı: ekip kararı (şu an en dik hücre, temkinli).
