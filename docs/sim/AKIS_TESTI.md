# Görev akışı testi: S1, S2, S3 (2026-11-14, gece)

Test eden: Batu (otomatik, başsız Chrome + yazılım GL). Sürüm: `origin/main` + açık PR #85 #86 #90 #93 birleşik yerel dal.
API: `localhost:8000` (gerçek planlayıcı, gerçek katmanlar). Sim: `localhost:8002/sim/`.
Komut dosyası: `sim/tools/qa/` içine alınabilir; ham sonuç: aşağıdaki tablo. Ekran görüntüleri: `docs/sim/shots/akis/`.

> **Sınır (dürüstlük):** yazılım GL ~1 FPS; yürüyüşü gerçek zamanda yürütmek yerine `setProgress` ile ilerlettim.
> Bu yüzden **karnedeki gerçekleşen süre/doz 0 çıkıyor** (zıplatma yapay); gerçek yürüyüşte sayılır.
> Ekran kaydı (video) alınamadı: kayıt Samet'in laptopunda gerçek GPU ile alınmalı.

## Sonuç: 3 görevin 3'ü de karneye ulaşıyor

| Adım | S1 | S2 | S3 |
|---|---|---|---|
| Görev düğmesi → brifing açılır | OK | OK | OK |
| 3 rota kartı (hepsi `/route` API) | OK | OK | OK |
| "En güvenli" seçilir, 3B yürüyüş başlar | OK (610 m) | OK (453 m) | OK (576 m) |
| Kum olayı tetiklenir (`radius_m + 40`) | OK (s=245) | OK (s=165) | OK (s=195) |
| `/replan` ile yeni rota | OK (1664 ms) | OK (1766 ms) | OK (1367 ms) |
| Hedef 10 m'de durur, `mission:arrived`, karne | OK | OK | OK |
| Konsol hatası | yok | yok | yok |

## Bulunan sorunlar

| # | Adım | Beklenen | Görülen | Önem | Sahip |
|---|---|---|---|---|---|
| 1 | S3 rota seçimi | Yarım O₂ tüpü görevinde riskin açık olması | 3 rotanın üçü de **NO-GO** (kasıtlı olabilir) ama oyuncu NO-GO rotada yine de yürüyebiliyor; kum sonrası yeni rota **GO** oluyor | Görünüş (tasarım kararı) | Samet / Elif Nisa |
| 2 | Rota kartı ↔ karne | Aynı büyüklük | Kartta "Oksijen 36 L" (gidiş-dönüş), karnede planlanan "18 L" (tek yön; `wire-adapters.js` bilerek ayırıyor). Etiket açıklamıyor, sunumda karışır | Görünüş | Veysel (etiket "tek yön" yazsın) |
| 3 | Serbest yürüyüş | Oksijen ve dönüş payı sayı göstermeli | Telemetri `—` | Görünüş (bilinen, #48) | Veysel |
| 4 | Karne derecesi | Planlı yürüyüşte A/B | Testte C (süre farkı −18 dk): zıplatmadan kaynaklı, **gerçek yürüyüşte doğrulanmadı** | Doğrulanacak | Batu (laptopta) |
| 5 | Karne açılışı | Tek açılış | Karneyi şimdi `wire.js` açıyor; Veysel `mission:arrived` olayına bağlanırsa çift açılır | Engelleyici olabilir | Samet / Veysel karar |
| 6 | Tarayıcı lejantı | Spesifikasyon "4 renk" | Yalnız dikkat + geçilmez gösteriliyor (kararlı tasarım: yalnız tehlikeli yerler) | Bilgi | Samet onayı |

Engelleyici hata: yok (5 numara karar bekliyor).

## Elle yeniden çalıştırma (laptop)
1. `bash scripts/dev.sh` → `http://127.0.0.1:8001/sim/?perf=1`
2. S1 → Başla → "En güvenli" → "3B yürüyüş" → R (rotaya dön) ile yürü → L tara → kum uyarısı → hedef.
3. Gerçek süre ve FPS: `?perf=1` tablosu; sonuçları buraya ekle.
4. Ekran kaydı: Windows `Win+Alt+R` ya da OBS; dosya bağlantısı bu belgeye.
