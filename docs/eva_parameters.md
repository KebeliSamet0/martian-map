# EVA parametreleri: kaynaklı değerler

Hazırlayan: Elif Nisa · 2026-11-14 · İlgili kod: `api/planner/params.py` (Samet koda alacak) · Refs #22

> **Özet.** Koddaki her VARSAYIM değeri NASA kaynaklarıyla karşılaştırıldı.
> - **272 W Apollo değeri doğrulandı.**
> - Kütle ve hız için Mars'a özel NASA değerleri bulundu (Ogilvie vd. 2026, NASA JSC).
> - EVA süresi ve enerji bütçesi Apollo 15–17 sırt çantası (PLSS) kapasitesine bağlandı.
> - Yeni bir sınır önerisi var: üsten en fazla **3.5 km** uzaklaşılsın (1 saatlik eve dönüş yürüyüşü).
> - Kaynağı bulunamayan değerler VARSAYIM olarak kaldı.
>
> Değerler tutarlı bir set oluşturuyor: 272 W × 7 sa ≈ 1640 kcal; bu, 1800 kcal bütçenin içinde kalıyor.

## 1. Öneri tablosu

| Parametre | Kod adı | Şu an | **Önerilen** | Kaynak | Durum |
|---|---|---|---|---|---|
| Astronot kütlesi | `BODY_KG` | 80 kg | **82 kg** | NASA-STD-3001 Vol. 2 Rev E: erkek 50. persentil 82 kg (kadın 50. p. 65 kg), Ogilvie vd. 2026 Tablo 5 | ✅ kaynaklı |
| Skafandr + PLSS | `SUIT_KG` | 120 kg | **104 kg** | NASA'nın önerdiği Mars skafandrı üst sınırı: 230 lbm ≈ 104 kg (Ogilvie vd. 2026) | ✅ kaynaklı (tasarım hedefi) |
| Taşınan ekipman / numune | `TOOLS_KG` | 10 kg | **23 kg** | Mars için ilk taşıma kütlesi tahmini 50 lbm ≈ 23 kg (Ogilvie vd. 2026) | ✅ kaynaklı (temkinli üst değer) |
| Temel yürüme hızı | `BASE_SPEED_MS` | 0.8 m/s | **0.75 m/s** (2.7 km/sa) | 1 saatten uzun eve dönüş yürüyüşü varsayımı: 2.7 km/sa (Jones, ALSJ "Lunar Gaits"; Ogilvie vd. 2026 içinde) | ✅ kaynaklı |
| Düz zemin metabolik düzeyi | `FLAT_REFERENCE_W` | 272 W | **272 W** (değişmez) | Apollo ay yüzeyi EVA ortalaması 980×10³ J/sa = 234 kcal/sa = 272 W; toplam 158.74 saat EVA (Waligora & Horrigan 1975, SP-368, EVA özet tablosu) | ✅ doğrulandı |
| Maksimum EVA süresi | `EVA_MAX_H` | 6 sa | **7 sa** | Apollo 15–17 genişletilmiş PLSS: "7 saat, 250 kcal/sa" (SP-368, s. 115 bölümü) | ✅ kaynaklı |
| EVA enerji bütçesi | `EVA_MAX_KCAL` | 2000 kcal | **1800 kcal** | Aynı PLSS'nin toplam ısı kapasitesi 7530×10³ J ≈ 1800 kcal (SP-368) | ✅ kaynaklı |
| O₂ bütçesi | `EVA_MAX_O2_L` | 420 L | **370 L** | 1800 kcal ÷ 4.86 kcal/L; türetilmiş değer, enerji bütçesiyle tutarlı olsun diye | 🔁 türetilmiş |
| O₂ kalorik eşdeğeri | `KCAL_PER_L_O2` | 4.8 | 4.8 (değişmez) | RER 0.85'te ≈ 4.86 kcal/L (Péronnet & Massicotte 1991). Fark %1, değiştirmeye gerek yok. NASA da RER 0.85 kullanıyor (Ogilvie vd. 2026) | ✅ yeterli |
| Eve dönüş mesafe sınırı | *(yeni)* | yok | **≤ 3.5 km** (≤ 1 sa dönüş) | Mars'ta 30 dk ya da 1 sa dönüş yürüyüşü değerlendiriliyor. Ek sistem yoksa üsten uzaklık 1 saatlik dönüşü (2.2 mil ≈ 3.5 km) aşmamalı (Ogilvie vd. 2026) | ✅ kaynaklı (NASA çalışma varsayımı) |
| Yedek süre | `RESERVE_MIN` | 30 dk | 30 dk (değişmez) | Kaynak bulunamadı | ⚠️ VARSAYIM |
| Bilim durağı süresi | `SCIENCE_STOP_MIN` | 30 dk | 30 dk (değişmez) | Kaynak bulunamadı | ⚠️ VARSAYIM |
| Mars yerçekimi | `G_MARS` | 3.71 m/s² | 3.71 (değişmez) | Dünya'nın ~3/8'i (Ogilvie vd. 2026) | ✅ |

Kapsam dışı (bu belge ele almıyor): radyasyon bütçesi (`EVA_MAX_DOSE_UGY`). Eğim sınırları (`SLOPE_*`) sonda, "Eğim eşikleri" bölümünde.

## 2. Önemli uyarılar (sunumda dürüst olmak için)

1. **Mars'ta yürümek, Apollo ortalamasından daha pahalı olacak.** 272 W, Ay'daki (1/6 g) bütün EVA etkinliklerinin
   ortalaması; dinlenme anlarını da içeriyor.
   - NASA'nın keşif skafandrı tasarım ortalaması 1200 BTU/sa = **352 W**. NASA, Mars'ta bunun da üstüne çıkılmasını bekliyor (Ogilvie vd. 2026).
   - NASA'nın skafandrlı eve dönüş yürüyüşü testinde 2.2 mil/sa (0.98 m/s) hızda O₂ tüketimi ~19 ml/dk/kg
     ölçüldü. Bu, ortalama bir astronot (73 kg) için yaklaşık **1700 BTU/sa ≈ 500 W** ediyor (Norcross vd. 2009
     verisinden, Ogilvie vd. 2026). Yürüyüş, EVA'nın en pahalı kısmı.
   - **Sonuç:** Rota enerji tahminlerimiz **alt sınır** olarak okunmalı. Duyarlılık testi için
     `FLAT_REFERENCE_W = 352` ile de çalıştırmak önerilir.
2. **Bugünkü skafandrlarla Mars'ta yürümek zor.** xEMU 177 kg (391 lbm). NASA, xEMU'nun Mars'ta kullanılabilir
   olmadığını söylüyor; 120 kg'lık MKIII ile bile Mars yerçekiminde tempolu yürüyüş VO₂max'a yaklaştı.
   Bu yüzden 104 kg'lık **hedef** Mars skafandrını kullandık; bu henüz var olan bir skafandr değil.
3. **Apollo'da yürüme hızı ile metabolik hız arasındaki ilişki zayıf.** Astronotlar sabit bir efor
   düzeyinde yürüdü, hız araziye göre değişti (Apollo 14 verisi, SP-368). Apollo 15'in ilk EVA'sında hız
   1.1–1.6 km/sa idi, ikinci EVA'da 1.6–2.2 km/sa'e çıktı. Yani 0.75 m/s (2.7 km/sa) iyimser değil, ama
   dar bir aralıkta da değil.
4. **Sınırlar tıbbi eşik değil, planlama varsayımıdır.** Sunumda bu ayrım korunmalı.

## 3. Koda etkisi (Samet için)

- Kütle değişikliği: L/W oranı 130/80 = 1.63'ten 127/82 = 1.55'e iniyor. Mutlak düzey yine 272 W'ye kalibre
  edildiği için düz zemindeki kcal değişmez; eğim ve zemin farkları çok az değişir.
- Hız 0.8 → 0.75 m/s: süreler ~%7 uzar.
- EVA 6 → 7 sa ve kcal 2000 → 1800: `walkback_ok` / `limit_exceeded_at_m` sonuçları değişebilir; testlerde sabit
  beklenen değer varsa güncellenmeli.
- 3.5 km sınırı yeni bir kontrol: tek yön rota uzunluğu (`total.km`) > 3.5 ise `go = false`, ya da en azından uyarı.
  `contracts/` alanı eklenecekse önce issue'da haber verilmeli (CONTRIBUTING kuralı 4).

## 4. Açık kalanlar
- [ ] `RESERVE_MIN` ve `SCIENCE_STOP_MIN` için kaynak bulunamadı (VARSAYIM kalır)
- [ ] 3.5 km eve dönüş sınırının koda alınıp alınmayacağı: ekip kararı
- [ ] Duyarlılık testi: `FLAT_REFERENCE_W = 352` ile örnek rota (Samet)

## Kaynaklar
- Ogilvie, R., Swartout, B., Hoffmann, B., McFarland, S., Hickox, L. (2026). *Mars Spacesuit Mass Requirements.*
  ICES-2026-127, NASA JSC. https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf
  - Tablo 1: skafandr kütleleri
  - Tablo 5: insan kütle persentilleri (NASA-STD-3001 Vol. 2 Rev E kaynaklı)
  - Diğer bölümler: yürüme hızı, eve dönüş yürüyüşü, taşıma kütlesi, metabolik hızlar
- Waligora, J. M., Horrigan, D. J. (1975). Metabolism and heat dissipation during Apollo EVA periods. In
  *Biomedical Results of Apollo*, NASA SP-368, bölüm s. 115'te başlar. https://ntrs.nasa.gov/api/citations/19760005584/downloads/19760005584.pdf
- Norcross, J. et al. (2009). *Feasibility of Performing a Suited 10-km Ambulation on the Moon: Final Report of
  the EVA Walkback Test (EWT).* NASA/TP-2009-214796.
- Jones, E. (2010). *Lunar Gaits.* Apollo Lunar Surface Journal.
- NASA-STD-3001 Vol. 2 Rev E (2025). *NASA Spaceflight Human-System Standard: Human Factors, Habitability, and
  Environmental Health.*
- Péronnet, F., Massicotte, D. (1991). Table of nonprotein respiratory quotient: an update. *Can. J. Sport Sci.* 16(1), 23–29.

## Eğim eşikleri (2026-11-15)
| Eşik | Değer | Kaynak |
|---|---|---|
| Dikkat (riskli) | 15° | Artemis güney kutbu EVA yürüyüş planlaması, eğim 15° ile sınırlı (Acta Astronautica 2023, https://www.sciencedirect.com/science/article/pii/S0094576523005179) |
| Geçilmez | 20° (önceki 25° varsayımdı) | NASA EVA Lunar Surface Concept of Operations (EVA-EXP-0075): skafandrlı astronot 20°'ye kadar yokuş yukarı/aşağı/yan (https://www.nasa.gov/wp-content/uploads/2020/01/topic_1-_eva_lunar_surface_concept_of_operations.pdf). Apollo 15 ~17°, en dik ölçülen 22–25° (EPSC 2024). Ay için tanımlı; Mars'ta yerçekimi ~2,3 kat olduğundan doğrudan, temkinli uygulandı. |

Etki: gerçek ızgarada geçilebilir ana bölge haritanın %73,8'inden %43,6'sına indi (4-komşu); S1–S3 rotaları bulunuyor. Önerip kaynakları bulan: Emre (#52).
