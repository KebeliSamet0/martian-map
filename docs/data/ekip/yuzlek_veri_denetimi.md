# Y?zlek / kaya katman? denetimi (2026-11-15)

HEAD `f5fdcaddefb4068dc45baff60637197b607eb93a`; kaynak yaln?z okundu. `sim/data/rocks.json`: 829 nesne, kind say?m? rock=709, outcrop=110, shadow=10. Ger?ek 1000?1000 Mars EQC, 2 m grid.

## ?3 kaya? ile 709 fark?

`ml/orbital/VALIDATION.md` ?6 a??k?a ayr??t?r?yor: 2.6 m?den b?y?k 123 aday elle incelenmi?; 110 y?zlek, 10 g?lge, yaln?z 3 tek kaya olarak etiketlenmi?. Kalan k???k 706 aday tek tek do?rulanmam?? ve varsay?lan `rock` b?rak?lm??. Dolay?s?yla 709 = 3 elle kaya + 706 k???k varsay?lan adayd?r; 3 farkl? s?r?m/filtre de?il, do?rulama kapsam? ve s?n?fland?rma altk?mesidir. ?Kaya saym?yoruz? notu yaln?z 120 b?y?k false-positive y?zlek/g?lgeyi kaya saymamay? ifade ediyor; 706 k???k aday ger?ek do?rulanm?? kaya demek de?ildir. K?r 30 ?rnekte 23 kaya; raporlanan yanl?? alarm %13?23. Tek g?zle s?n?fland?rma, ikinci de?erlendirici yok.

## kind ba??na ?l??mler

| kind | adet | d_m min | medyan | p90 | max | slope medyan? | slope p90? | p_bedrock medyan | p_bedrock p90 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| rock | 709 | 0.60 | 0.78 | 1.924 | 3.26 | 9.705 | 20.428 | 0.9149 | 0.9754 |
| outcrop | 110 | 2.72 | 4.67 | 7.868 | 9.80 | 12.016 | 25.046 | 0.7769 | 0.9609 |
| shadow | 10 | 2.72 | 3.435 | 5.963 | 6.44 | 19.638 | 40.770 | 0.8409 | 0.9453 |

px aral??? col=380.08?539.83, row=483.23?819.97; t?m kay?tlar grid i?inde. Katsay? h?cresi, px?te a?a?? yuvarlanan sat?r/s?tundan ?rneklendi. outcrop?lar ana kaya olas?l??? y?ksek ve orta e?imli; p_bedrock medyan? rock adaylar?ndan d???k. Shadow n=10 oldu?undan istatistik karars?z; medyan e?imi en y?ksek. G?lgeyi dik yama?/s?rt kabul etmek her kay?t i?in do?rulanm?? de?il.

## ?retici ve sim davran???

`ml/orbital/export_sim.py` mevcut HEAD?de eski exporter bi?imini (px,d_m) yaz?yor; kind atama kural? bu dosyada yok. G?ncel kind alan?, `VALIDATION.md` ve g?zle karar tablosu `labels.csv` ile 15 Kas?m s?n?fland?rma ad?m?ndan geliyor. B?y?k tespitlerde ?ap e?i?i >2.6 m yaln?z inceleme kapsam e?i?i; otomatik kind e?i?i de?ildir. K???klerde varsay?lan rock. Tek g?zlemci, ikinci g?z yok; etiket karar?/?l??m yan?lg?s? ve eski CSV?den yeniden export edilince kind kayb? riski var. Bu risk kod s?r?mlerinin ayr??mas?d?r: HEAD `export_sim.py` kind yazm?yor, diskteki rocks.json kind ta??yor.

`sim/app/hazards.js` shadow kay?tlar?n? ?izimden ??kar?yor; outcrop?u yayvan geometriyle, y?kseklik=?ap?0.13 kullan?yor. Bu 0.13 kaynakl? Mars ?l??m? de?il, sanat?? parametresi. Bu nedenle shadow ?izilmemesi etiket semanti?iyle tutarl?; outcrop g?sterimi g?rsel temsildir, fiziksel y?kseklik rekonstr?ksiyonu de?ildir. UI/rota katman?nda b?t?n 709 rock?? do?rulanm?? engel kabul etmek a??r? yorum olur.

## S1/S2/S3 50 m koridoru

Tam dense rota h?crelerini bu konu?mada yeniden taramad?m: **?l??lmedi**. Kind?in planlay?c? rotas? ?evresindeki da??l?m? i?in say? vermiyorum. Eski 829 tespitin t?m? S1?S3 rota koridoru aday paketi olarak tan?mlanm??t?r; bu, her yeni kullan?c? rotas?n?n 50 m band?na d??t??? anlam?na gelmez.

## Tekrar ?retim / do?rulama

Python+NumPy: `json.load(sim/data/rocks.json)`, `np.load(layers/slope.npy)`, `np.load(layers/p_bedrock.npy)`; her nesnede `x,y=px`, h?cre `[floor(y),floor(x)]`; `np.percentile(d_m,[0,50,90,100])`, ayn? h?cre de?erlerinde percentile. Dosyalar? yazan kod ?al??t?r?lmad?. Sadece salt okunur veri ?l??m?.

Mars kontrol?: bu rapor geometrik grid/e?im s?n?flar?n? denetler; e?im a??s? Mars?a ?zg? yer?ekimiyle yeniden hesaplanm?yor. Planner kaynaklar?nda g_Mars=3.71 m/s?, g_Earth=9.81 m/s? ve h?z s?releri fiziksel SI saniye/dakika olarak ayr?d?r. Bu rock s?n?fland?rmas?nda sol, LMST, g?n/y?l, atmosfer ve radyasyon kullan?lm?yor.

Kaynaklar: `sim/data/rocks.json`, `ml/orbital/VALIDATION.md` ?6, `ml/orbital/export_sim.py`, `ml/orbital/labels.csv` (varsa yerel; okunabilirli?i bu turda do?rulanmad?), `sim/app/hazards.js`, `layers/slope.npy`, `layers/p_bedrock.npy`, `contracts/grid.json`. Git ge?mi?inde rocks/exporter i?in HEAD?e giden de?i?iklikler incelendi; s?n?fland?rma do?rulama commit mesaj? `1938708` (?Dogrulama: ? rocks kind alani ??), exporter eski bi?iminde. Kaynak kod de?i?tirilmedi.
