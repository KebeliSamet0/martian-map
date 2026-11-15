# Bulgular — tur 2–3 (25° eşiği) ve TUR 4 (20° eşiği, dosyanın sonunda) (2026-11-15)

Kaynak: `akis_testi.js` T8–T11, yazılım GL (swiftshader), Windows 11, Chrome 157; API `127.0.0.1:8000` (gerçek 1000×1000 ızgara, `/compare` var). Ham kayıt: `tur2_kosu.log`, `test_sonucu_tur2_T8-T11.json`, ekranlar `shots/`.
Sınıflar: **engelleyici** = demo akışı durur · **görünüş** = akış çalışır ama kullanıcı sorunu görür · **kozmetik** = küçük/tasarım notu.

**Sonuç: engelleyici bulgu yok.** Normal oyun akışı (intro → görev seç → brifing → 3 rota → yürüyüş → kum/replan → karne → "Tekrar oyna" / "Başka görev" → ikinci görev), W/A/S/D/Shift/R/L/H/T/?/Esc tuşları ve iki viewport'ta HUD örtüşme taraması hatasız çalıştı. Aşağıdakiler görünüş/kozmetik bulgulardır.

## Kod durumu (hangi sürümde görüldü)
`main-wt` deponuz çalışırken değişti; koşu boyunca çalışma ağacı sabit değildi. Salt okuma `git` ile gördüklerim:
| Zaman | Dal / HEAD |
|---|---|
| koşu sırasında (~10:30) | `batu/yuzlek-prefetch` @ `74be831c7ca2b7cb792500e11c5f8aee0a27f070` (yerel `origin/main` = `c129bc7` + 2 commit; çalışma ağacı temiz) |
| rapor yazılırken (~11:00) | `batu/custom-mission` @ `f5fdcaddefb4068dc45baff60637197b607eb93a`, `sim/app/main.js`, `wire-flow.js`, `wire.js` **yerel değişiklikli** (başkasının çalışması) |

**PR #111 doğrulaması:** `git log --all --grep="#111"` yerel referanslarda sonuç vermedi; yani PR #111 commit'i bu klonda **yok** ve ben `git fetch` yapmadım (salt okuma kuralı). Dolayısıyla "#111 sonrası güncel main'de hâlâ geçerli" iddiasını **doğrulayamadım**. Doğrulanan: bulgu B1, yukarıdaki iki HEAD'den birinde (`74be831`) gözlendi; `sim/ui.css` ve `sim/app/screens.js` için son değişiklik `5f8b692` (2026-11-15). #111 karne düzenini değiştirdiyse, B1 o commit'ten sonra `node akis_testi.js` (T8) ile yeniden denenmeli.

## Bulgu tablosu

| # | Önem | Adım | Beklenen | Görülen | Kanıt | Dosya / sahip |
|---|---|---|---|---|---|---|
| **B1** | görünüş | 1280×720 pencerede S1'i bitir → karne açılır | "Tekrar oyna" ve "Başka görev" ilk ekranda, kaydırmadan görünür | Düğme tabanları **840 px**, pencere **720 px**; kart 696 px yüksekliğinde ve kendi içinde kaydırılıyor (`kaydirilabilir:true`). Düğmeler "Verinin etkisi" bölümünün altında kaldığı için kaydırma gerekiyor. **1920×1080'de sorun yok** (taban 945 ≤ 1080, kaydırma yok) | `shots/T11_1280x720_6_karne.png`, `shots/T11_1920x1080_6_karne.png`; `tur2_kosu.log`: `FAIL [T8] [1280×720 TR] karne: "Tekrar oyna"/"Başka görev" düğmeleri kaydırmadan görünür — {"vh":720,"bottoms":[840,840],"kartYuksek":696,"kaydirilabilir":true}`; 1920: `{"vh":1080,"bottoms":[945,945],"kartYuksek":847,"kaydirilabilir":false}` | `sim/ui.css` (`.mm-card { max-height:100%; overflow:auto }`, `.mm-card-wide { max-height: calc(100vh - 24px) }`), `sim/app/screens.js` `buildReport` (eylem satırı en sonda). Son yazar (git): Samet; iş emrine göre karne düzeni sahibi Veysel (doğrulanmadı). Çözüm önerisi: eylem satırını `position: sticky; bottom: 0` yap |
| **B2** | kozmetik | 1280×720'de rota seçimi aç, "Dengeli" karşılaştırma sekmesine bak | "Görevlere dön" tamamen görünür | Düğme alt kenara değiyor, kenarı kırpılmış görünüyor (kart kaydırılabilir, bu yüzden otomatik taşma taraması geçti) | `shots/T11_1280x720_4_rotalar.png` | `sim/app/screens.js` `showRoutePicker`, `sim/ui.css`; B1 ile aynı çözüm |
| **B3** | görünüş | `?lang=en` ile aç → S1 → rotalar → karne | Rota adları İngilizce | "En kısa", "En güvenli", "EN GÜVENLİ" (sekme) Türkçe; karnede karışık cümle: "One way, En güvenli route. Cost is measured on the real terr…" | `shots/T11_1920x1080_4_rotalar.png`, `shots/T11_1920x1080_6_karne.png`; `tur2_kosu.log`: `FAIL [T10] [1920×1080 EN] 4_rotalar … "En kısa" \| "En güvenli" \| "EN GÜVENLI"` | Etiketler API'den geliyor: `api/planner/params.py` satır 62–69 (`"label": "En kısa"`, `"En güvenli"`); sim tarafında çeviri anahtarı yok (`screens.js` `r.label ?? r.kind`). Sahip: API + sim akış |
| **B4** | görünüş | EN modda yürüyüşe başla | Navcam kartı altyazısı İngilizce | "Sol 4625 · Navcam · büyüt: G" Türkçe sabit metin | `shots/T11_1920x1080_5_yuruyus.png`; `tur2_kosu.log`: `FAIL [T10] [1920×1080 EN] 5_yuruyus … "Sol 4625 · Navcam · büyüt: G"` | `sim/app/wire-extras.js:7` (`` `Sol ${s.sol} · Navcam · büyüt: G` `` i18n dışı; ayrıca büyük görünümde "ham Navcam"). Son yazar (git): Elifranakemal |
| **B5** | görünüş | EN modda yürüyüş HUD'una bak (sağ alt RAD paneli) | "Y: details" gibi İngilizce | "Y: ayrıntı" Türkçe; radyasyon panelindeki ve karnedeki "Rotaların radyasyon farkı", "Tek yön yürüyüş süresi × yüzey doz hızı…" Türkçe | `shots/T11_1920x1080_5_yuruyus.png`, `…_6_karne.png`; `tur2_kosu.log` `FAIL [T10] … 5_yuruyus … "Y: ayrıntı"`, `… 6_karne … "Rotaların radyasyon farkı Radyasyon: RAD"` | `sim/data/texts.json` satır 1198–1201 ve ~1202 (`compare_title`, `compare_note`, `line_key`): düz TR alanlar, `{tr,en}` yapısında değil. Sahip: bilim/veri (radyasyon paneli) |
| **B6** | kozmetik | EN modda HUD'daki süre birimine bak | "hh:mm" | HUD'da "sa:dk" görünüyor, ondalık ayraç virgül ("0,00 µGy"). `texts.json` `unit.hm` anahtarı EN'de `hh:mm` ama HUD bu anahtarı kullanmıyor gibi (kaynak satırı **doğrulanmadı**) | `shots/T11_1920x1080_5_yuruyus.png` (ekran görüntüsünden okundu; otomatik tarama yakalamadı: metin ASCII) | `sim/data/texts.json` `unit.hm` (satır ~627); HUD tarafı (`sim/app/hud.js`) kontrol edilmeli |
| **B7** | kozmetik | Yürüyüşte `H` bas | Tüm HUD gizlenir | Yalnız vitals HUD'u gizleniyor; görev paneli (`.mm-mhud`, `display:block`) görünür kalıyor. Yardımda "H — HUD aç/kapa" yazıyor | `tur2_kosu.log` T9 `H: vitals HUD gizlenir ve geri gelir` PASS; gözlem `gozlemler[4]` | `sim/app/main.js:284` (`wire?.setVisible`), `sim/app/wire-flow.js` (`hudLayer` H'ye bağlı değil). Tasarım kararı olabilir |
| **B8** | kozmetik (tasarım notu) | Normal oyunda `M` bas | — | Hiçbir şey olmaz (harita yalnız `?dev=1`'de var). "Haritaya dön" yalnız dev panelinde; normal oyunda karşılığı karne sonrası "Başka görev". Yardım listesinde M yok, yani tutarlı | `tur2_kosu.log` T9 `M (normal oyun): harita açılmaz`, `M (?dev=1): 3B → haritaya döner` | `sim/app/main.js:278` (`KeyM && DEV`) |
| **B9** | görünüş, **tekrarlanamadı** | Yazılım GL'de CPU yoğunken S1 rota seçimi | Karşılaştırma paneli veya anlaşılır hata | **Bir kez** (ilk deneme koşusu): "Karşılaştırma alınamadı (signal timed out)." ham teknik metin; aynı koşuda alt bantta "Çevrimdışı yedek: önceden hesaplanmış rota (planlayıcı canlı değil)" rozeti. Boşta `POST /compare` 1,8 s, `/route` 0,5 s; yani yazılım GL Chrome'u CPU'yu doyurunca 8 s zaman aşımı aşılmış (kök neden: **test ortamı**, kanıtlanmadı). Sonraki 2 koşuda görülmedi (`rotalar canlı API'den` PASS) | İlk koşunun ekran görüntüsü sonraki koşuyla üzerine yazıldı (yalnız konuşmada incelendi); yeniden üretilebilir kanıt yok | `sim/app/compare.js`, `sim/app/offline.js` (`texts.json` satır ~994 `badge`). Öneri: ham `e.message` yerine yerelleştirilmiş mesaj; ayrıca T8'e eklenen kontrol (`çevrimdışı rozeti yok`) tekrarını yakalar |

## Bulgu olmayanlar (yanlış alarm kontrolü)
- Karnede "Süre 0 dk, Doz 0.0" ve not "C": test `setProgress` ile hedefe sıçradığı için; gerçek yürüyüşte böyle olmaz. **Bulgu değil.**
- Navcam kartı 1920×1080 ilk karede siyah: görüntü yüklenene dek; sonraki koşuda yüklü. Bekleme/zamanlama; **bulgu değil**.
- T11 taraması (HUD kutuları arasında bounding-box örtüşmesi, viewport dışına taşma, yatay kaydırma) iki viewport'ta, intro/seçim/brifing/rotalar/yürüyüş(+tarama)/karne/duraklat ekranlarında **0 örtüşme** buldu. Sınırı: `overflow:auto` olan kartların içeriği "taşma" sayılmaz; bu yüzden B1/B2 ayrıca "düğme tabanı ≤ pencere" ölçümüyle ve ekran görüntüsüyle yakalandı.

---

# Tur 3 bulguları (özel görev #120, dinamik rota #122) — 2026-11-15

Kod: dal `batu/custom-mission` (main-wt), HEAD `2f08ae5` (+ yerel değişiklik olabilir), test: `akis_testi.js` T12/T13, gerçek GPU (`REAL_GPU=1`) ve ilk deneme yazılım GL. Ham kayıt: `t12_real_gpu.log`, `t12_real_gpu.json`, `t12_sw_gl_ilk_deneme.log`.

| # | Önem | Adım | Beklenen | Görülen | Kanıt | Dosya / sahip |
|---|---|---|---|---|---|---|
| **B10** | **engelleyici** (özel görevde kum olayı) | "Kendi rotanı planla" → rota `sand_zones.json`'daki bir kum adayının `radius_m+40` m yakınından geçen bir A–B seç (örn. P1 540,595→304,580) → yürü, kum olayı tetiklenince bekle | Kum olayı tetiklenir ve rota yeniden planlanır (S1–S3'teki gibi) | Olay tetiklenir (`fired:true`) ama yeniden plan **hiç gelmez** (`routeRun.replanned` false kalır, 70 sn beklendi). Oyuncu eski rotadan, kum alanının içinden yürümeye devam eder. Konsolda iki istek 422: `POST /replan` ve `POST /step` ("Input should be a valid integer") | Kök neden doğrulandı: `sand_zones.json` 16 adayın **15'inde `px` ondalıklı** (örn. `[454.8, 405.3]`); sim bunu olduğu gibi gönderiyor: `sim/app/main.js:344` (`observations: [{ px: S.px, … }]`, `/replan`) ve `sim/app/wire.js:113` (`observations.push({ px: selected.sand.px … })`, `/step`). API tamsayı istiyor. Bağımsız kanıt: `curl POST /replan` `px:[472,641]` → HTTP 200; `px:[454.8,405.3]` → **422** `int_type … Input should be a valid integer`. S1–S3'te `px` tamsayı olduğu için orada çalışıyordu. Log: `t12_real_gpu.log`: `FAIL [T12] T12c P1 … {"hasSand":true,"fired":true,"replanned":false,"rep":true}`, aynı P2; `FAIL [T6] … 422 … /replan … /step`. Sahip: batu:custom (`main.js`, `wire.js`). Çözüm önerisi: `px`'i `Math.round` ile tamsayıya çevir (ya da sunucu `float` kabul etsin) |
| **B11** | görünüş (düzeltildi) | Özel görevde P1 (473 m) rota seç | 3 rota kartı | API yüklüyken `/route` 8 sn istemci zaman aşımını aştı → tek "Yerel yedek" kartı (`fallbackWhy: "signal timed out"`), sonra kart akışı bozuldu. Boşta aynı istek 0,5–2,8 sn; yük altında 10–57 sn ölçüldü | `t12_sw_gl_ilk_deneme.log`; gerçek GPU ilk koşu: `{"n":1,"src":"local","why":"signal timed out (yedek yok: …)"}` | `sim/app/api.js` zaman aşımı; **batu:custom 8→25 sn düzeltti (7e09f93)**; düzeltme sonrası koşularda tekrarlanmadı |
| **B12** | kozmetik (düzeltildi) | Paylaşım bağlantısı | `?a=540,595&b=304,580` | `?a=540%2C595&b=304%2C580` (işlev etkilenmez) | `t12_sw_gl_ilk_deneme.log` | `sim/app/mappicker.js` `shareUrl`/`custommission.js` `shareQuery`; **düzeltildi (7e09f93)** |

## Tur 3 ek bulgular (güncel kodda, gerçek GPU, tam koşu `tam_real_gpu.log`)

Kod: `main-wt` dal `batu/custom-mission`, HEAD `d460385` (koşu sırasında #125 A.1 numune/üsse dönüş ve #130 birleşmişti). Tam koşu: `test_sonucu_tam_real_gpu.json` (831 sn).

| # | Önem | Adım | Beklenen | Görülen | Kanıt | Dosya / sahip |
|---|---|---|---|---|---|---|
| **B13** | görünüş (özellik çalışmıyor + konsol kirliliği) | Dinamik rota: `wire.vitals.addLoad(8)` ya da numune al (E, #125) | `mm:route-suggest` `reason=load` ≤ 40 sn | Hiç gelmiyor (60 sn, `delta undefined`). Her yük değişiminde 3 × `POST /route` 422 (konsolda numune başına 3 hata; tam koşuda 39 hata) | `tam_real_gpu.log`: `FAIL [T13] wire.vitals.addLoad(8) … delta undefined`, `FAIL [T6] … 422 … /route`; API: `curl POST /route {"load_kg":8}` → 422 `Extra inputs are not permitted` (hem çalışan 8000'de hem kaynakta: `api/main.py` `RouteInput` içinde `load_kg` yok, yalnız `StepInput`'ta var, satır 52–80) | `sim/app/dynroute.js:91` (`load_kg` gönderiyor); API `api/main.py` `RouteInput`. Sahip: batu:dyn + API |
| **B14** | görünüş | 1280×720, yürüyüş, `L` ile tarama | Görev paneli ve tarama lejantı örtüşmez | `.mm-mhud` × `#scanleg` **87×29 px** örtüşüyor | `shots/T11_1280x720_5b_yuruyus_tarama.png`; `tam_real_gpu.log`: `FAIL [T11] [1280×720 TR] 5b_yuruyus_tarama … ÖRTÜŞME .mm-mhud × #scanleg: 87×29 px`. Önceki tur 2 koşusunda örtüşme yoktu (lejant metni uzamış olabilir: `yüzlek (HiRISE…)` etiketi; **kanıtlanmadı**) | `sim/index.html` `#scanleg { top:130px; left:50% }` ve `.mm-mhud`; sahip: sim akış/HUD |
| **B15** | **KAPANDI — test hatası** (teşhis aşağıda, düzeltme tablosunda) | (a) T1 S2 (sim dev modu): S2'yi yürü, kum bölgesine ilerle. (b) T12 P1 (540,595→304,580, özel görev): kum olayı sonrası hedefe git | Kum olayı tetiklenir, replan olur, hedefte "E ile numune" çubuğu → üsse dönüş → karne | (a) S2: `selected.sand` var ama kum olayı **hiç tetiklenmedi** (`null`), hedefte hiçbir şey açılmadı (`hold:false`, karne yok). (b) P1: olay + replan **başarılı** (`routeRun.replanned=true`, "Yeni rota … kum bölgesi kaçınıldı"), ama hedefe sıçrayınca ne numune çubuğu ne karne geldi; sayfa `walk`ta kaldı. Aynı kodla S1, S3, AB01, AB03 ve kumsuz çiftler tamamlandı. 2 ayrı koşuda ve ayrı tanı koşularında kararlı tekrar | `tam_real_gpu.log` (`FAIL [T1] S2 …`, `FAIL [T12] T12a P1 … karne açılır — screen=walk`), `shots/S2_5_karne.png` (S2: oyuncu hâlâ yürüyüşün başında, süre 00:07), ilk tanı: önceki koşuda makine `arrived` olduğu halde karne yoktu (#125 A.1 `onArrived`: E basılı tutma çubuğu bekleniyor) | Olası: sim `wire.js` `onArrived` (E tutma) ile test sıçramasının yarışı ya da uygulama hatası; **ayırt edilemedi**. Sahip önerisi: batu (#125 A.1) ile birlikte `MM_ONLY=T12 MM_PAIRS=P1` ve `MM_ONLY=T1 MM_SCENARIOS=S2` ile yeniden üret |

### Sorun → neden → düzeltme (tüm tur-3 bulguları)

| # | Sorun | Neden | Düzeltme | Durum |
|---|---|---|---|---|
| B10 | Özel görevde kum olayı sonrası yeniden plan yok; "Yeniden planlama başarısız (API 422)" | `sand_zones.json` `px` ondalıklı (16'nın 15'i), API tam sayı ister | `px`'i tam sayı hücreye çevir (`main.js`, `wire.js`) | **Düzeltildi (cc81ac3)**: T12c yeni koşuda `replan başarılı`, 422 yok (P1, AB01, AB03) |
| B11 | Özel görevde "Yerel yedek" tek rota, `signal timed out` | İstemci zaman aşımı 8 sn; API yükte 10–57 sn | Zaman aşımı 25 sn | **Düzeltildi (7e09f93)** |
| B12 | Paylaşım URL'sinde `%2C` | `URLSearchParams` virgülü kodluyor | Virgülü açık yaz | **Düzeltildi (7e09f93)** |
| B13 | Yük değişimi önerisi hiç gelmez; her numunede 3 × 422 | Sim `/route`'a `load_kg` yolluyor, API `RouteInput` bunu reddediyor | `load_kg`'ı API `RouteInput`'a ekle **ya da** simde göndermeyi bırak/`/step` ile hesapla | **Açık** |
| B14 | Görev paneli × tarama lejantı örtüşmesi (1280×720) | `#scanleg` sabit `top:130px; left:50%`, panel genişliği ile kesişiyor | Lejantı panelin sağına/altına al ya da dar ekranda küçült | **Açık** |
| B15 | S2 kum olayı tetiklenmiyor / P1 hedef sonrası karne yok | **Test hatası** (adım adım teşhis, `tani_kayitlari/s2_teshis.js`): (1) test `R.s`'e ışınlıyordu, sim `collide.step` gerçek kayaları ışınlanan oyuncuya da uyguladığı için oyuncu kayada takılıyor; (2) kum olayı artık bloklayan karar penceresi (`route-decision`, zaman aşımı yok) açıyor, test kabul etmiyordu; (3) hedefte E-basılı-tut + dönüş ayağı gerekiyor | Test `walkNatural` ile sim fiziğiyle `setTimeScale(40)` hızında yürür, kum kararını kabul eder, E basılı tutar, dönüş ayağını bekler | **Test düzeltildi**: S2 T1 12/12, T3 3/3, T4 1/1 (`tani_kayitlari/b15_dogrulama_S2.log`); T12 P1 geçti (`b15_dogrulama_P1P2.log`) |
| B16 | P1 sonrası aynı sayfada P2: kum olayı tetiklenir, karar penceresi açılmaz, replan yok (P2 tek başına geçer) | `wire.js` `dynHandlesSand` (satır 34/74/163) `mm:route-suggest reason=sand` ile bir kez `true` olur, hiç sıfırlanmaz; yeni görevde yerleşik kum akışı `return` ile susar (hipotez: yalnız kod okuması, doğrulanmadı; kanıt `tani_kayitlari/b15_dogrulama_P1P2.log` vs `b15_dogrulama_P2.log`) | Görev başında `dynHandlesSand=false` | **Açık** (sahip: batu) |
| B1 | 1280×720 karne düğmeleri kaydırma gerektirir (840 > 720 px) | `.mm-card` iç kaydırma, eylem satırı en sonda | Eylem satırı `sticky; bottom:0` | **Düzeltilmiş görünüyor (güncel kodda yeniden ölçüldü):** 1280×720'de düğme tabanları artık **705 px ≤ 720** (önce 840); kart yine iç kaydırmalı (`kaydirilabilir:true`) ama düğmeler ilk ekranda. 1920×1080: 955 ≤ 1080. Kanıt: `tam_real_gpu.log` `PASS [T8] [1280×720 TR] karne: … kaydırmadan görünür — {"vh":720,"bottoms":[705,705],…}`. Hangi commit düzeltti **doğrulanmadı** (PR #111 commit'i yerel klonda görülmedi) |
| B3–B5 | EN modda Türkçe: rota adları (API etiketi), Navcam altyazısı, "Y: ayrıntı", radyasyon karşılaştırma metinleri | Etiketler API'den TR; `wire-extras.js:7` sabit metin; `texts.json` radyasyon alanları düz TR | Etiketleri i18n anahtarına bağla; `{tr,en}` ekle | **Açık**; güncel kodda yeniden doğrulandı (`FAIL [T10] [1920×1080 EN] 5_yuruyus`, `6_karne`) |
| Test | "3 görev kartı" ve "soğuma ≥ 45 sn" beklentileri | Yeni "Kendi rotanı planla" kartı (4 kart); soğuma hesaplama başlangıcından sayılıyor | Beklentiler güncellendi (4 kart; ≥ 40 sn) | **Test düzeltildi** |
| Test | Hedefte karne beklentisi | #125 A.1: hedefte E ile numune → üsse dönüş → karne | `finishMission()` (E basılı tut, dönüş ayağı, karne) | **Test uyarlandı** |


---

# Tur 4 — eğim eşiği 20° (2026-11-15 14:25)

Kaynak: `tam_20deg.log` / `test_sonucu_tam_20deg.json` (tam koşu, gerçek GPU, 1463 sn). Sim **`4df17a4`** (salt okunur kopya, bkz. README "Tur 4"), API `127.0.0.1:8000` — `/assumptions`: Geçilmez eğim = 20 °, `/grid`: `synthetic=false`. Kod/sim'e dokunulmadı.

**Sonuç:** 20°'ye geçiş **demo akışını bozmadı**: S1/S2 GO, S3 (zaten NO-GO) aynı; kum olayları, replan, numune, dönüş, karne (T1 36/36, T3 9/9) çalışıyor; kırmızı "Geçilmez alan" katmanı %28,98 (beklenen ≥ 20° = %29,03). Yeni bulgular özel rota (#120) tarafında: **B16 teşhisi netleşti, B17 yeni**.

## Yeni / güncellenen bulgular

| # | Önem | Adım | Beklenen | Görülen | Kanıt |
|---|---|---|---|---|---|
| **B16** (güncel) | **engelleyici olabilir** (kum kararı sessizce atlanıyor) | Aynı sayfada art arda iki kumlu görev (S1→Tekrar oyna, ya da P1 → "Başka görev" → P2) | Her kumlu görevde kum olayı → karar penceresi → kabul → replan | **İlk kumlu görev çalışır; sonrakilerde olay tetiklenir (`machine 'event'`), ama ne `mm:route-suggest` ne karar penceresi ne replan gelir** (`evlog:[]`, `decisions:[]`, `replanned:false`); görev sessizce hedefe gider. Sayfa yenilenince (testte AB01 çelişkisinden sonraki `loadGame`) bir sonraki kumlu görev yine çalışır, ondan sonraki yine bozulur | `tam_20deg.log`: T8 "ikinci tur: varış + karne" FAIL (S1 sand, `evlog:[]`), T12c P2 FAIL (`CUSTOM-sand`, `evlog:[]`), T12c AB04 FAIL; P1 ve AB03 (her biri sayfa tazeyken ilk kumlu görev) PASS. P2 tek başına koşunca PASS: `tani_kayitlari/b15_dogrulama_P2.log`; P1→P2 sırayla FAIL: `b15_dogrulama_P1P2.log` |
| **B17** | görünüş / engelleyici (özel rota) | Seçicide AB01 (791,844→518,999) ya da AB10 (801,147→806,366) seç → "Rotaları hesapla" | Seçici kabul ediyorsa API rota vermeli (ya da seçici reddetmeli) | Seçici **kabul** ediyor (uyarı yok, düğme açık), API `POST /route` **422** ("köşe kesmeden (iki yan hücre geçilebilir) bağlanamıyor"); sim "Yerel yedek" tek rota gösteriyor (`n:1, src:local, why:"API 422"`), 3 rota kartı gelmiyor | `tani_kayitlari/api_422_ciftleri_20deg.log` (curl), `tam_20deg.log` ("harita seçici ile API /route aynı kararı verir" FAIL, AB01 ve AB10), `tam_20deg_kosu1_taslak.log` (AB01: `{"n":1,"src":"local","why":"API 422"}`) |
| **B13** (tekrar) | görünüş | Numune al / yük ekle | `load_kg` ile rota | Hâlâ 422 (T6'da 45 hata; T12 P1, P2, AB03, AB04 "422 yok" FAIL; T13 yük önerisi gelmedi: "yük önce 10 kg, süre 60 sn, delta undefined") | `tam_20deg.log` |
| **B14**, **B3–B5** (tekrar) | görünüş | 1280×720 tarama; EN mod | örtüşme yok; EN'de Türkçe yok | Değişmedi (87×29 px örtüşme; "Y: ayrıntı", Navcam altyazısı, rota adları, radyasyon metinleri) | `tam_20deg.log` T11, T10 |
| **B1** (doğrulandı) | — | 1280×720 karne düğmeleri | kaydırmasız | PASS: düğme tabanları 705 ≤ 720 | `tam_20deg.log` T8 |

### B16 — teşhis (adım adım)
1. Üç ayrı yerde aynı örüntü: T8 ikinci tur, T12 P2, T12 AB04 — hepsi "aynı sayfada daha önce bir kumlu görev tamamlandı".
2. Sayfa yenilenince düzeliyor: AB01 çelişkisinden sonra test sayfayı yeniden yükledi, sonraki kumlu çift (AB03) PASS; ardından AB04 yine FAIL.
3. Olay günlüğü: kum olayı makineden geliyor (`events:[{id:"CUSTOM-sand", …}]`), ama pencerede hiç `mm:route-suggest`/`mm:route-decision` yok (`evlog:[]`) → karar akışı hiç başlamıyor; bu "karar penceresi açıldı ama kabul edilmedi" değil.
4. Kod okuması (**doğrulanmadı**, salt okunur): `4df17a4` `sim/app/wire.js` satır 34/74/163 — `dynHandlesSand` bayrağı `mm:route-suggest reason='sand'` gelince `true` oluyor, hiç sıfırlanmıyor; kum olayı işleyicisinde `if (dynHandlesSand) return;` olduğu için ikinci görevde `replan` hiç çağrılmıyor, dolayısıyla dynroute da öneri üretmiyor. Bu, 1–3 ile birebir uyumlu.
5. Not: sonraki bir HEAD'de (`4ab3b0a`, `main-wt` o sırada) `dynHandlesSand` kaldırılmış (kum doğrudan `replan` → dynroute). **O sürümde B16'nın düzelip düzelmediğini koşmadım.**
6. Öneri: `dynHandlesSand`'i görev başında (`generation` artarken) `false` yap ya da bayrağı kaldır. Sahip: batu.

### B17 — notlar
- 20°'de iki yönlü seçici↔API farkı var: (a) **seçici kabul / API 422** (B17: seçici 8-komşuluk ana bileşeni sınıyor, API ayrıca "köşe kesmeden bağlanma" kuralını uyguluyor); (b) **seçici red / API 200**: küçük bir adadaki iki nokta (örn. P3 179,445→131,369 ya da 41,20→131,90) API'de rota alıyor, seçici ana bileşen dışını reddediyor. (b) tasarım kararı olabilir (#140 "ada hücreleri hedef olamaz"); (a) ise kullanıcıyı sessizce yedek rotaya düşürür.
- Öneri (a): seçicide API'nin köşe-kesme kuralını aynala ya da hesaplamadan önce `/route` ön kontrolü yapıp "API bu çifti reddetti" uyarısı göster.

## Test tarafı düzeltmeleri (uygulama bulgusu DEĞİL)
| # | Sorun | Neden | Düzeltme | Durum |
|---|---|---|---|---|
| T-1 | T12b geçilmez nokta 393,704: beklenen "20.88 m" | çalışan 2 dosyasındaki mesafeyi 25° için yeniden hesapladım ama yuvarlamadım; uygulama "21 m" yazıyor | `Math.round` | **Düzeltildi**, `t12b_dogrulama_20deg.log` PASS |
| T-2 | T12b "çok kısa" uyarısı beklenen yerine eğim uyarısı verdi | B = A+4 hücre 20°'de 23° (geçilmez) | Geçilebilir, < 15 m B seçilir | **Düzeltildi** |
| T-3 | T12 P3 (25° için üretilmişti) A hücresi 20°'de adada | geçilebilir küme parçalandı | Çift üretiminde ana bileşen kuralı | **Düzeltildi** |
| T-4 | T13 bandı bekliyordu; farklı HEAD'de karar kartı | sim sürümleri arası arayüz farkı | Bant ya da karar kartı kabul | **Düzeltildi** |
| T-5 | 25° çalışan-2 verileri bayat | `ab_ciftleri.json` (e580605) 25° ile üretilmiş: AB04 kum mesafesi 17,35→6 m, AB01/AB10/AB12 artık API'de 422, `nearest_passable_m` değişti | Test beklentilerini kendisi bağımsız yeniden hesaplıyor; dosyada eski değerler `calisan2_*_25derece` | **Çalışan 2'ye not:** `ab_ciftleri.json` 20° için yeniden üretilmeli |

## Gözlem / sınırlar
- **T7 (FPS)**: 34 FPS / p95 41,8 ms (eşik ≥ 45 / ≤ 22 ms) FAIL; taslak koşuda 41 FPS / 27,9 ms. Eşiği gevşetmedim. Aynı anda API ve başka tarayıcı oturumları çalışıyordu; sebep doğrulanmadı.
- **Yanlış HEAD'de çalışan koşu** (`main-wt` → `batu/tas-esik @ 4ab3b0a`): seçim ekranı yeniden tasarlanmış, "Kendi rotanı planla" kartı/`mission-go-custom` yok; T12 1/2, T8 36/40, T13 16/18. **Bulgu sayılmadı**, test o arayüze uyarlanmadı.
- `main-wt`'e dokunmadım; `4df17a4` kopyası `git archive` ile (salt okunur) çıkarıldı.
