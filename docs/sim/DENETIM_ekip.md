# Sprint 2 — ekip desk çıktılarının denetimi (2026-11-14, Claude)

Desk'ler yalnız araştırır/üretir ve dosya sunar; sim'e alma kararı ve doğrulama bizdedir.

| Çıktı | Sonuç | Kanıt |
|---|---|---|
| `cevirme` (px→dünya, DEM karşılaştırma) | Kabul. Dönüşüm sim `Geo` ile aynı; **planlayıcı DEM'i ile sim DTM'i eşdeğer değil** (ort. +7,2 m, RMSE 9,7 m; ampirik kayma ≈ +30,7 m D / +33,5 m G ve −15,1 m düşey). Uygulanmadı, yarın sabaha. | `check_coords.py` testleri, 1024 örnek |
| `rehberlik` (DS2 rota rehberliği) | Kabul, tasarım önerisi olarak. 6 alıntıdan 4'ü kaynakta birebir; GameSpot ve Epic bana 403 verdi (doğrulanamadı). DS2 iddiaları (otomatik güvenli rota, ayak izi = basış noktası) rapor tarafından zaten "doğrulanmadı" ayrılmış. | alıntı taraması |
| `astronot` (astronaut.js, follow-camera.js) | **Düzeltilerek** alındı. Kendi testi yalnız ekran görüntüsü üretiyor (doğrulama/assert yok) ve hatayı kaçırdı: ayaklar yerden **14,5 cm havada** (kendi walk.png'sinde gölge ayrık görünüyor), boy iddiası 1,75 m'ydi. Düzeltme: pelvis 0,83, iç ölçek, hız→genlik, hız yumuşatma. Ölçüm (120 kare, 3 hız): ayak tabanı min y: önce +0,145/+0,138/+0,137 m → sonra +0,016/−0,002/−0,003 m. `follow-camera.js` Z yönünü sim'in tersine varsayıyordu; sim'e özgü yörünge kamerası `main.js`'te. | `astro_measure` (headless, sim sayfası) |

Ders: desk testleri "çalıştı/PNG yazıldı" demekten öteye geçmeli; ölçülebilir kabul koşulu (ör. ayak–zemin farkı) yazılmalı.
