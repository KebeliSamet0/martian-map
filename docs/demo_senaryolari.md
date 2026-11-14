# Demo senaryoları (issue #47)

Makine okunur sürüm: `layers/demo_scenarios.json`. Koordinatlar `px = [sütun, satır]` biçiminde, `contracts/grid.json` ızgarasında.

> **Geçici:** Bu senaryolar, zemin olasılıkları yerine dolgu değerlerle doğrulandı: `p_* = 0.25`, `entropy = 0`. Emre'nin #45 katmanları henüz yok. Eğim (`slope`) ve kaya (`rock_cfa`) katmanları gerçek. Kum noktaları ortofotodan seçildi; Bora'nın `sand_hint.json` adaylarından hiçbiri rotaların üstünde değil (aşağıya bakın). Emre'nin katmanları gelince senaryolar yeniden doğrulanacak.

## Senaryolar

| | Başlangıç → Hedef | 3 rota (km) | 3 rota (dk) | Sürpriz kum | `/replan` | Curiosity kesiti |
|---|---|---|---|---|---|---|
| **S1** | sci_1 Boxwork (sol 4617) → sci_4 Atacama sondajı | 0,55 / 0,56 / 0,56 | 23,4 / 23,5 / 23,7 | [467, 609], 20 m | 3 rota da değişiyor, +0,2–0,4 dk | yol indeksi 430–701, 1229 m |
| **S2** | sci_3 Boxwork (sol 4668) → sci_4 | 0,40 / 0,40 / 0,41 | 16,4 / 16,5 / 16,8 | [487, 672], 20 m | 3 rota da değişiyor, +0,3–0,4 dk | yol indeksi 547–701, 744 m |
| S3 (yedek) | sci_2 Boxwork (sol 4635) → sci_4 | 0,53 / 0,53 / 0,55 | 22,6 / 22,8 / 23,1 | [467, 609], 30 m | 3 rota da değişiyor, +0,5–0,6 dk | yol indeksi 455–701, 1106 m |

Rota sırası her zaman en kısa / dengeli / en güvenli. Kesitteki indeksler `layers/msl_proposed_path.json` içindeki `path_px` noktalarıdır.

**Bitti koşulu:** Her senaryoda `/route` 3 farklı rota döndürüyor ve `/replan` en az birini değiştiriyor. Bu koşul üç senaryoda da sağlandı. S3'te 20 m'lik kum yarıçapı en güvenli rotayı değiştirmiyor, bu yüzden 30 m kullanıldı.

## Anlatılacak hikâye

1. **Curiosity ile karşılaştırma.** Bilim durakları Curiosity'nin gerçekten durduğu yerlerdir; gerçek rota başlangıç ve hedefin 0,5 m yakınından geçiyor. Curiosity S1 arasını 1229 m'de gitti, çünkü yol üstünde boxwork sırtlarını inceledi. Planlayıcı aynı mesafeyi yaklaşık 560 m'de gidiyor. Dengeli rota gerçek yoldan ortalama 29 m, en fazla 115 m sapıyor; en büyük sapma, Curiosity'nin inceleme için saptığı yerde.
2. **3 rota neden ayrışıyor?** Bugünkü verilerle rotalar yalnız eğim ve kaya maliyetinde ayrışıyor ve fark birkaç metre (dk farkı 0,3). Kum ve belirsizlik katmanları (`p_sand`, `entropy`) geldiğinde en güvenli rotanın emin olunmayan bölgeden uzak durması beklenir. Ayrışma o zaman büyür; o noktada bu madde yeniden yazılacak.
3. **Sürpriz kum.** Rover dengeli rotanın ortasında kum görüyor (`/replan`, `cls: sand`). 3 rotanın hepsi kumu dolaşacak şekilde yeniden çiziliyor ve süre biraz uzuyor.

## Kum noktası nasıl seçildi (geçici)

- Ortofotoda (`ortho_2m.png`) en karanlık %15'lik dilimde,
- eğimi 8°'nin altında,
- 3×3 komşuluğunda kaya olmayan (`rock_cfa = 0`),
- ve dengeli rotanın orta kısmına (%30–70) en yakın hücre.

Bu kurallara uyan hücreler ızgaranın %3,3'ü. Bu seçim yalnız bir yer tutucu; kum olduğu doğrulanmadı.

## Bora'nın kum adayları (`sand_hint.json`, PR #56)

Bora 10 aday çıkardı ve gözle doğruladı. Hiçbiri senaryo rotalarının üstüne düşmüyor: bu rotalar bilim durakları arasında, yaklaşık satır 525–775 bandında. Rotada olmayan bir kum `/replan` ile rotayı değiştirmez, bitti koşulu bozulur. Bu yüzden senaryolarda ortofotodan seçilen noktalar kaldı.

- En yakın aday `sand_8` [427.7, 809.9] (yarıçap 15 m); hedef durak sci_4'e 145 m uzakta.
- Curiosity yolu üzerindeki adaylar `sand_4` (8 m) ve `sand_9` (0 m) ızgaranın güneyinde. Bilim durağı şartı esnetilirse bu adaylarla ek bir senaryo kurulabilir.

## Nasıl tekrar üretilir

Planlayıcıyla doğrudan:

```python
from api import planner
L = planner.load()
rs = planner.plan(L, [433, 525], [491, 774])   # S1 (durak px floor)
L2 = planner.apply_observation(L, [467, 609], 20, "sand")
rs2 = planner.plan(L2, [433, 525], [491, 774])
```

ya da API üzerinden: `POST /replan` ile
`{"start": [433, 525], "goal": [491, 774], "observations": [{"px": [467, 609], "radius_m": 20, "cls": "sand"}]}`.

API px'i tam sayı ister (`StrictInt`). Bu yüzden JSON'daki `start.px` / `goal.px`, durağın ondalıklı konumunun (`stop_px`) floor'udur; planlayıcı da aynı hücreyi kullanır.
