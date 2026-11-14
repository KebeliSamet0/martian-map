# Demo senaryoları (issue #47)

Makine okunur sürüm: `layers/demo_scenarios.json`. Koordinatlar `px = [sütun, satır]` biçiminde, `contracts/grid.json` ızgarasında.

> **Doğrulama (2026-11-14 17:30):** Senaryolar gerçek katmanlarla API üzerinden doğrulandı:
> - eğim ve kaya (`slope`, `rock_cfa`),
> - Emre'nin kaba zemin katmanları (PR #60, 1 epoch),
> - Bora'nın kum adayları (PR #61).
>
> Emre'nin 12 epoch'luk sürümü gelince senaryolar yeniden doğrulanacak.

## Senaryolar

| | Başlangıç → Hedef | 3 rota (km) | 3 rota (dk) | Sürpriz kum | `/replan` | Curiosity kesiti |
|---|---|---|---|---|---|---|
| **S1** | sci_1 Boxwork (sol 4617) → sci_4 Atacama sondajı | 0,55 / 0,56 / 0,56 | 18,1 / 18,2 / 18,4 | `sand_13` [472, 641], 19,4 m | 3 rota da değişiyor, +0,1–0,5 dk | yol indeksi 430–701, 1229 m |
| **S2** | sci_3 Boxwork (sol 4668) → sci_4 | 0,40 / 0,40 / 0,40 | 12,6 / 12,7 / 13,0 | `sand_11` [487, 672], 20 m | 3 rota da değişiyor, +0,2–0,3 dk | yol indeksi 547–701, 744 m |
| S3 (yedek) | sci_2 Boxwork (sol 4635) → sci_4 | 0,53 / 0,53 / 0,54 | 17,5 / 17,7 / 17,9 | `sand_13` [472, 641], 19,4 m | 3 rota da değişiyor, +0,1–0,5 dk | yol indeksi 455–701, 1106 m |

Rota sırası her zaman en kısa / dengeli / en güvenli. Kesitteki indeksler `layers/msl_proposed_path.json` içindeki `path_px` noktalarıdır.

**Bitti koşulu:** Her senaryoda `/route` 3 farklı rota döndürüyor ve `/replan` en az birini değiştiriyor. Bu koşul üç senaryoda da sağlandı.

## Anlatılacak hikâye

1. **Curiosity ile karşılaştırma.**
   - Bilim durakları Curiosity'nin gerçekten durduğu yerler; gerçek rota başlangıç ve hedefin 0,5 m yakınından geçiyor.
   - Curiosity S1 arasını 1229 m'de gitti, çünkü yol üstünde boxwork sırtlarını inceledi. Planlayıcı aynı mesafeyi yaklaşık 560 m'de gidiyor.
   - Planlayıcının rotaları Curiosity'nin gerçek yolundan ortalama 28–37 m sapıyor.
2. **3 rota neden ayrışıyor?**
   - Bugünkü verilerle 3 rota birbirinden yalnız 1–6 m ayrışıyor.
   - Sebep: 1 epoch'luk modelde kumun baskın olduğu hücre yok (en yüksek `p_sand` 0,23) ve belirsizlik her yerde yüksek (ortalama `entropy` 0,72). Rotaları ayıracak bir kontrast yok.
   - Emre'nin tam eğitimli sürümünde kum ve belirsizlik farkları belirginleşirse ayrışmanın büyümesi beklenir. O zaman bu madde yeniden yazılacak.
3. **Sürpriz kum.** Rover rotanın ortasında kum görüyor (`/replan`, `cls: sand`). 3 rotanın hepsi kumu dolaşacak şekilde yeniden çiziliyor ve süre biraz uzuyor.

## Kum noktaları (Bora, `sand_hint.json`)

- **S2 için `sand_11` [487.0, 672.0]:** İlk geçici seçimimizdi. Bora kör kontrolde bu noktayı kum gibi buldu ve listesine ekledi.
- **S1 ve S3 için `sand_13` [472.6, 641.6]:** Rotanın tam üstünde.
  - İlk geçici noktamız [467, 609] Bora'nın kontrolünde çakıl/kayalık çıktı. Çevresinde kaya yoğunluğu %2–3, bölge ortalaması %0,8. Bu yüzden bırakıldı.
- API tam sayı px istediği için noktaların hücresi kullanılıyor ([472, 641]). Yarıçaplar Bora'nın dosyasındaki değerler.
- Adaylar kesin kum değil. Ortofotodan çıkarıldılar ve gözle kontrol edildiler; bölgede doğrulayacak yer gerçeği yok.

Bora'nın ilk 10 adayı (PR #56) rotaların üstüne düşmüyordu. `sand_4` ve `sand_9` Curiosity yolu üzerinde ama ızgaranın güneyinde. Bilim durağı şartı esnetilirse bu ikisiyle ek bir senaryo kurulabilir.

## Nasıl tekrar üretilir

Planlayıcıyla doğrudan:

```python
from api import planner
L = planner.load()
rs = planner.plan(L, [433, 525], [491, 774])   # S1 (durak px floor)
L2 = planner.apply_observation(L, [472, 641], 19.4, "sand")
rs2 = planner.plan(L2, [433, 525], [491, 774])
```

ya da API üzerinden: `POST /replan` ile
`{"start": [433, 525], "goal": [491, 774], "observations": [{"px": [472, 641], "radius_m": 19.4, "cls": "sand"}]}`.

API px'i tam sayı ister (`StrictInt`). Bu yüzden JSON'daki `start.px` / `goal.px`, durağın ondalıklı konumunun (`stop_px`) floor'udur; planlayıcı da aynı hücreyi kullanır.
