# DESK_REPORT: tur5/dyn (dinamik rota gerçekten aktif)

## Sorun → neden → düzeltme
1. **Çift arayüz** → wire.js `mm:route-suggest` dinleyicisi `preventDefault()` demiyordu, dynroute yerleşik bandı da çıkıyordu → dinleyici artık `preventDefault()` der (tek kart: Veysel'in "ROTA KARARI"). Karar `mm:route-decision` ile dynroute'a döner, `busy` temizlenir (ölçüm: kart açıkken busy:true, kabulden sonra false). Zaten açık bir karar varken gelen ikinci öneri sessizce reddedilir (dynroute takılı kalmaz).
2. **Kum tam bütçeyle gidiyordu** → `main.js::fireReplan` artık `dyn.sand()` çağırır: `/replan` KALAN bütçe (`budgetFor`) + `base_px` ile, karşılaştırma aynı bütçeyle kum görmeyen `/route`. wire.js'teki ikinci kum kartı kaldırıldı. Dönüş `/route` (`startReturnLeg`) de kalan bütçeyle. Tükenmiş kaynak 0.01 gönderilir (bütçesiz = sınırsız olmasın).
3. **Sürekli planlama** (`dynroute.js`, reason `periodic`): her ~100 m ya da 60 sn (en az 20 sn arayla), tek `/route`, kalan bütçeyle. İlk hesap sessiz temel; sonra beklenen kalan maliyetten (çıpa − harcanan) ≥%10 sapma ya da GO→NO-GO ise öneri; değişim yoksa sessiz.
4. **Görünürlük**: HUD "Dinamik plan: kalan GO · 2 sn önce hesaplandı (periyodik) · 1× · planlayıcı"; API yoksa "Dinamik plan kapalı (planlayıcı yok)". Karne kararlar bölümüne "planlayıcı N kez yeniden hesap yaptı" satırı (screens.js'e dokunmadan, wire.js'ten eklenir).
5. Ek: oyuncunun hücresi planlayıcı için geçilemez köşeyse (422) başlangıç komşu hücreye kaydırılıp yeniden denenir (turda gerçekten görüldü).

## Test
- `node --test sim/tests/`: 121 geçti, 0 kaldı (yeni: periyodik tetik mesafe/süre/debounce/sapma/NO-GO, budgetFor, kum kalan bütçe+base_px, çift UI olmaması, 422 yeniden deneme).
- `.venv/bin/python -m pytest -q`: 124 geçti.

## Başsız tur (qa-shared/tour_t5dyn.js; kareler qa-shared/out/)
- S1 sapma: `t5dyn_S1_sapma_kart.png` (tek kart, banner 0), `t5dyn_S1_sapma_kabul.png`.
- S3 kum: `t5dyn_S3_kum_kart.png`, `t5dyn_S3_kum_kabul.png`. `/replan` gövdesi: budget {time 359.13, o2 72.1, kcal 1962.07, dose 59.87} (tam bütçe o2 80 değil) + base_px. Planlayıcı kum sonrası S3'te kalan planı NO-GO döndürdü (artık hepsi GO değil); neden ayrıştırılmadı (bütçe mi rota riski mi), planlayıcı yanıtı olduğu gibi gösteriliyor.
- Periyodik: `t5dyn_S1_periyodik_hud.png` (HUD satırı), `..._once.png`. 106 m ilerleyince "periyodik" hesap, öneri yok (değişim <%10).

## Bağlama satırları (`// tur5:dyn`)
- main.js: `budgetFor` import; `fireReplan` → `dyn.sand`; `ctx(force)`; `startReturnLeg` kalan bütçe; `dynLineText`/`dynReportText`; initWire'a `dynLine`, `dynReport`.
- wire.js: suggest dinleyicisi preventDefault; kum için `askDecision` kaldırıldı (kart fireReplan→suggest ile tek); initHud'a `dynLine`; karne satırı. origin/main (#138, setRoute/updatePlan) merge edildi, `installRoute`→`wire.setRoute` davranışı korundu.
- hud.js: "Dinamik plan" satırı. texts.json: `hud.dyn.*`, `report.dyn.*`, `decision.*.periodic`, `dyn.*.periodic/sand` (TR+EN).

## Bilinen eksikler
- Periyodik eşik (≥%10) gerçek yürüyüşte nadiren tetiklenir; "dinamik" his çoğunlukla HUD satırından gelir. Sapma 422 yeniden denemeleri konsolda 422 gürültüsü üretir.
- Karne satırı sayıyı gösterir, kabul/ret ayrı satırlarda zaten listelenir. Zor modda sayılar `selected.limits`'e (yarım O₂) dayanır.
