# Kendi rotan? planla ? 8 ?iftlik ba??ms?z kabul verisi (2026-11-15)

G?ncel kaynak HEAD `e5806059629cf962ff6c537cd1de63e742169fc3`; ger?ek 1000?1000 grid, 2 m; sentetik de?il. Direct Python `api.planner.plan_one`; `nearest_sand` bu raporda dense balanced path h?creleri ile 16 kum merkezinin ba??ms?z Euclidean?2m taramas?ndan yeniden hesapland?.

|id|A|B|d?z m|preset|km|min|kcal|O? L|status|nearest sand|route mesafe m|e?ik m|triggers|
|---|---|---:|---:|---|---:|---:|---:|---:|---|---|---:|---:|---|
|AB01|[791, 844]|[518, 999]|627.9|shortest|2.72|120.8|597.0|249.0|GO|sand_9|10.03|51.8|True|
|AB01|[791, 844]|[518, 999]|627.9|balanced|2.85|122.3|602.0|251.0|GO|sand_9|10.03|51.8|True|
|AB01|[791, 844]|[518, 999]|627.9|safest|3.03|124.8|611.0|254.0|GO|sand_9|10.03|51.8|True|
|AB03|[608, 580]|[413, 577]|390.0|shortest|0.45|15.4|74.0|31.0|GO|sand_14|3.62|56.2|True|
|AB03|[608, 580]|[413, 577]|390.0|balanced|0.46|15.6|75.0|31.0|GO|sand_14|3.62|56.2|True|
|AB03|[608, 580]|[413, 577]|390.0|safest|0.49|16.2|77.0|32.0|GO|sand_14|3.62|56.2|True|
|AB04|[489, 600]|[539, 319]|570.8|shortest|0.62|19.9|94.0|39.0|GO|sand_14|17.35|56.2|True|
|AB04|[489, 600]|[539, 319]|570.8|balanced|0.65|20.1|94.0|39.0|GO|sand_14|17.35|56.2|True|
|AB04|[489, 600]|[539, 319]|570.8|safest|0.7|21.3|99.0|41.0|GO|sand_14|17.35|56.2|True|
|AB05|[400, 207]|[134, 679]|1083.6|shortest|1.85|60.0|282.0|117.0|GO|sand_2|0.72|49.7|True|
|AB05|[400, 207]|[134, 679]|1083.6|balanced|1.88|60.4|282.0|118.0|GO|sand_2|0.72|49.7|True|
|AB05|[400, 207]|[134, 679]|1083.6|safest|2.11|64.1|296.0|124.0|GO|sand_2|0.72|49.7|True|
|AB09|[877, 678]|[774, 558]|316.3|shortest|0.35|19.7|100.0|42.0|GO|sand_3|396.31|65.0|False|
|AB09|[877, 678]|[774, 558]|316.3|balanced|0.35|19.8|101.0|42.0|GO|sand_3|396.31|65.0|False|
|AB09|[877, 678]|[774, 558]|316.3|safest|0.36|19.8|101.0|42.0|GO|sand_3|396.31|65.0|False|
|AB10|[801, 147]|[806, 366]|438.1|shortest|0.57|26.6|132.0|55.0|GO|sand_3|369.53|65.0|False|
|AB10|[801, 147]|[806, 366]|438.1|balanced|0.58|26.7|132.0|55.0|GO|sand_3|369.53|65.0|False|
|AB10|[801, 147]|[806, 366]|438.1|safest|0.6|27.0|133.0|55.0|GO|sand_3|369.53|65.0|False|
|AB12|[217, 702]|[173, 358]|693.6|shortest|0.77|38.2|185.0|77.0|GO|sand_6|355.35|58.7|False|
|AB12|[217, 702]|[173, 358]|693.6|balanced|0.78|38.3|186.0|77.0|GO|sand_6|355.35|58.7|False|
|AB12|[217, 702]|[173, 358]|693.6|safest|0.8|38.6|188.0|78.0|GO|sand_6|355.35|58.7|False|
|AB13|[704, 529]|[762, 416]|254.0|shortest|0.32|17.4|88.0|37.0|GO|sand_14|408.31|56.2|False|
|AB13|[704, 529]|[762, 416]|254.0|balanced|0.34|17.5|89.0|37.0|GO|sand_14|408.31|56.2|False|
|AB13|[704, 529]|[762, 416]|254.0|safest|0.35|17.7|90.0|37.0|GO|sand_14|408.31|56.2|False|

Da??l?m: 4 kum e?i?ini tetikler; 4 hi?bir kum merkezinin 150 m band?nda de?ildir. E?ik radius_m+40 m.

## Ge?ilmez noktalar

|px|slope?|p_sand|nearest passable px|m|
|---|---:|---:|---|---:|
|[409, 724]|25.17|0.0009|[408, 724]|2.0|
|[393, 704]|30.98|0.0009|[392, 704]|2.0|
|[437, 702]|25.92|0.0009|[436, 702]|2.0|
|[417, 443]|26.32|0.0007|[416, 443]|2.0|
|[384, 421]|26.96|0.0007|[383, 421]|2.0|
|[468, 558]|25.03|0.4116|[467, 558]|2.0|
|[440, 475]|26.22|0.3835|[439, 475]|2.0|
|[346, 427]|61.91|0.3835|[348, 427]|4.0|
|[324, 415]|46.75|0.3761|[322, 416]|4.47|
|[622, 598]|26.66|0.3723|[622, 597]|2.0|

## Duraklar

|id|px|sol|ad|type|
|---|---|---|---|---|
|sci_1_sol4617|[433.5, 525.2]|[4617, 4634]|Boxwork inceleme alanı (sol 4617–4634)|science|
|sci_2_sol4635|[421.2, 545.3]|[4635, 4653]|Boxwork inceleme alanı (sol 4635–4653)|science|
|sci_3_sol4668|[470.5, 589.1]|[4668, 4803]|Boxwork inceleme alanı (sol 4668–4803)|science|
|sci_4_sol4869|[491.3, 774.6]|[4869, 4914]|Atacama sondaj alanı, katmanlı sülfat (sol 4869–4914)|science|
|msl_s117_d0384|[479.8, 419.5]|4580|site 117 drive 384|curiosity_rover|
|msl_s117_d0420|[477.8, 420.8]|4580|site 117 drive 420|curiosity_rover|

## U? durumlar

|case|A|B|m|planner sonucu|HTTP|
|---|---|---|---:|---|---|
|same|[433, 525]|[433, 525]|0.0|accepted: route succeeded|?l??lmedi|
|out_of_grid|[-1, 500]|[433, 525]|869.44|rejected: Nokta ızgara dışında: [-1, 500] (genişlik 1000, yükseklik 1000)|?l??lmedi|
|impassable_B|[433, 525]|[485, 500]|115.39|accepted: route succeeded|?l??lmedi|
|shorter_than_15m|[433, 525]|[439, 525]|12.0|accepted: route succeeded|?l??lmedi|

HTTP kodlar? canl? API?den ?l??lmedi; do?rudan planner ??kt?s? verildi. ?lk `requests` probe system Python??nda mod?l yok hatas? ald?; `.venv-api` ile rota planner ?al??t?r?ld?.

Mars/D?nya: gMars 3.71 m/s?, gEarth 9.81 referans. Rota dakikalar? SI fiziksel zamand?r; Mars sol saati de?ildir.
