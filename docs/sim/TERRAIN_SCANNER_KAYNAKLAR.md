# Death Stranding — Terrain Scanner / Odradek taraması: açık kaynaklı bulgular (Claude, 2026-11-14)

`gercek` desk'inin araştırması gelene kadar resmî sayfalardan ben okudum (erişim 2026-11-14, sayfa metninde birebir görüldü).

| # | Bulgu | Kaynak ve birebir alıntı |
|---|---|---|
| 1 | DS2: Terrain Scanner varsayılan L1; **rotada kalmaya** ve **yol üstü/dışı tehlikeleri** görmeye yarar; düşman kargosunu da işaretler | [PlayStation DS2 Beginner's Guide](https://www.playstation.com/en-il/games/death-stranding-2-on-the-beach/death-stranding-2-on-the-beach-guide/), Traversal / Scan your surroundings: "Remember to use your Terrain Scanner as you travel (L1 button by default). This handy gadget will help you stay on-route and spot hazards on and off the road." |
| 2 | DS1: Odradek ile hareket ederken **güvenli zemin** taranır; ağır yükte engebeli arazi çok etkiler | [Kojima Productions DSTips](https://kojimaproductions.jp/en/DSTips), Long-Distance Deliveries: "Be sure to use your Odradek often and scan for safe ground as you move." |
| 3 | DS1: **kırmızı işaretler derin suyu** gösterir; o alana girilirse araç batar, Sam ve kargo sürüklenir | aynı sayfa, Reverse Trike / Beware of rivers: "The red markers indicate deeper waters, so if you enter that area, your bike will sink and both Sam and the cargo will be washed away." |
| 4 | DS1: tarama **menzili artırılabilir** (gözetleme kulesi) | aynı sayfa, Stealth Strategy: "if you build a Watchtower, you can scan a larger range of your surroundings." |
| 5 | DS2 renk kodları (mavi/sarı/kırmızı) ve "Square basılı tut" | GameSpot "20 Things" — **bana 403 verdi, ben doğrulayamadım**; `gercek` raporu (arastirma.md S5) içinde alıntı var |

Sayısal eğim eşiği, tarama yarıçapı ve bekleme süresi bu kaynaklarda **yok** → simdeki 170 m / 10° / 20° değerleri tasarım ayarıdır (20° = ICES-2025-129 astronot traverse sınırı).

## Sim'e aktarım
- Tarama zemini eğim sınıfına göre boyar (mavi/sarı/kırmızı + çizgili desen); #1 "rotada kal": tarama sırasında **planlanan rota parlar**; tehlike işaretleri rota üstünde zaten görünür.
- #3 analoğu: kırmızı = basma/kaçın (dik veya kum riskli) — kum riski için API `p_sand` işaretleri.
- #4: **Shift+L = geniş tarama** (320 m).

## `gercek` raporu denetimi ve sim'e yansıyanlar (2026-11-14)
Denetim (alıntıları kaynakta aradım): **doğrulandı** Shacknews ("A flash will run down the terrain in front of you", "red Xs"), Akhil Arora, GamesFuze (Proximity Scanner 20 m; Faster Scanner Recharging), Reverse Shot ("blue dots"), PlayStation/Kojima (yukarıda). **Bana 403 verdi, doğrulayamadım:** Push Square, KeenGamer, Nexus Mods. Sayısal değerler (>45°, 20 s mod, 20 m) raporun kendisinde zaten "doğrulanmadı/mod/ayrı özellik" diye ayrılmış; sim'e alınmadı.

Sim'e yansıyan (bulgu → değişiklik):
- DS işaretleri ayrı zemin glifleridir (mavi nokta/sarı üçgen/kırmızı çarpı), yüzeyi tek renge boyamaz → **tarayıcı 3 m ızgarada ○/△/✕/■ glifleri çiziyor**, ortofotoyu boyamıyor.
- "Güvenli sanma" (Akhil Arora: renk işaretleri tam güvenilmez) → efsane ve ipucu metni "yalnız eğim; zemin bilinmiyor; yokluk/sönme güvenli değildir".
- Süre/yarıçap raporun **tasarım önerisi**: 0,8 s yayılma + 4,2 s tutma + 1 s solma, 1 s bekleme, 90 m (Shift+L 220 m). DS'nin değeri değil.
- Veri yok → gri ■ (rapor §5.1).

## Referans video incelemesi (kullanıcı referansı; 2026-11-14)
Video: "Death Stranding Terrain Scanner" (YouTube kkkiMqq4kac, 18,6 sn, 720p; DS1 Odradek — ekranda "The Cargo Scanner" ve "Recharging…" göstergesi). Yerelde indirilip 40 kare (≈0,47 sn aralık) çıkarıldı ve tek tek incelendi; aşağıdakiler **gözlemdir, ölçüm değil** (ekran kaydı):
- t≈4,7 sn: dalga cephesi — ince **kırmızı yatay tarama çizgisi** ve parıltılı parçacıklar; arkasında çalılık/zemin mavi parıldıyor.
- t≈5,2 sn: zemin/kaya yüzeylerine yapışık **neon mavi eş-yükselti (kontur) çizgileri**; en yoğun dik kaya yüzlerinde, dalgalı/düzensiz.
- t≈5,6–6,6 sn: konturlar **sönüyor** (≈1,5 sn); zeminde küçük, sık **kırmızı ✕** işaretleri ve sarı/turuncu parçacıklar kalıyor.
- Tarama sırasında HUD'da "Recharging…" şarj çubuğu (bekleme süresi var; saniyesi videodan çıkarılmadı).
Sim'e aktarım (kullanıcı isteği): yalnız tehlikeli bölgeler (eğim ≥ 20° veya çok dik yüz), **sık ✕** (1,6 m ızgara, eğimle artan yoğunluk), tehlikeli yüzeylerde dalgalı mavi kontur, ince dalga cephesi, merkezden dışa süpürülerek sönme. Mavi ○/sarı △ kaldırıldı.
