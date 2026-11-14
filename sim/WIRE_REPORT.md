# Simülasyon bağlama raporu — 2026-11-14

PR #77: önce 1–4 ve 7 teslim edildi; ardından 5, 6, 8 ve yeni /step bağlandı.
Dal Batu'nun batu/sim-extra merge'ünü ve izin verilen origin/main güncellemesini içerir.

Bağlananlar:
- S1/S2/S3 görev düğmeleri, güncel texts.json brifingi; elle A/B serbest mod.
- Üç API rotası renkli haritada ve seçim kartında; seçilen rota 3B'de yürünür.
- Vitals + gerçek HUD; simülasyon zamanı hız ölçeğiyle aynı ilerler.
- /step: sürekli px izi, ekipmandan ayrı ek yük, kum gözlemleri; hata halinde segment yedeği.
- API dozunun model süresi yerine gerçekleşen simülasyon süresi kullanılır; durak tüketimi korunur.
- Görev kum noktasında uyarı, /replan, özgün görev bütçesinin korunması.
- 10 m varışta durma, tek numune, tek yön plan/gerçek karne, yeniden oyna/haritaya dön.
- Bora'nın 829 kayası/kum bölgeleri; Elif Rana'nın corridor.js'i ve 23 Navcam durağı.
- 15 m durak yaklaşımında fotoğraf; Esc/kapat. Yeni corridor.js yazılmadı.
- scan_class 0..3, en yakın hücre örnekleme; alan dışında/API yokken eğim yedeği.
- Tarama dalgası korundu; nokta/çizgi işaretleri + dört renk + texts.json lejantı.

Doğrulama:
- `node --test sim/tests/`: 18 test geçti, 0 başarısız.
- Chromium --headless=new, gerçek Gale API: S1 → üç rota → otomatik yürüyüş
  → S1-sand → /replan → debrief; source=api-step, sampled=true, replanned=true.
- `?api=off`: aynı görev → yerel rota → debrief; source=fallback.
- Her iki koşu: yeniden oyna sayaç sıfırlama; fotoğraf yüklenmesi/Esc; K/V;
  gerçek kaya yerleşimi; tarama; JS ve konsol hatası 0.
- Başsız test dış harita servislerini engeller, yerel ortofotoyu kullanır.
- Tekrar: `python3 sim/tools/devserver.py 8017`; başka terminalde
  `CHROME_BIN=/tam/yol/Chromium node sim/tools/wire_smoke.mjs` (ve `--off`).
  SIM_URL ile sunucu adresi değiştirilebilir. Görüntüler /tmp/wire-{report,scan}.png.

Tuşlar: WASD, Shift, fare, R, [, ], F, K, H, B, V, L/Shift+L, T, M korunur;
Esc fotoğrafı kapatır. Karne/yeniden planlama sırasında hareket durur.

Bilinen sınırlar ve ekip modülleri:
- Veysel: HUD alanları vitals ile farklı; texts.json iç içe, ekran anahtarları düz.
  wire-adapters eşler; karne EVA gidiş-dönüşünü tek yönle karıştırmaz.
  Bilinmeyen kaynaklarda varsayılan A yerine hesaplanamadı gösterilir.
- Samet: dönüş payı ve anlık W yerel segment tahmini; /step tüketimi bunları yenilemez.
  /missions ve /debrief yok; dosya/yerel yedek kullanılır. /step durak modeli düz W'dir.
- Batu: kısa rotada dense[4] erişimi ve saf veri modunda K ile taş açılması düzeltildi.
  detail.js yalnız yeni tarama işaretleri/API sınıf kanalı için değiştirildi.
- Bora: kaya şekilleri tespit edilmiş konum/çaplardan üretilir; birebir kaya mesh'i değildir.
- Elif Rana: corridor modülü değiştirilmeden bağlandı; yüksek hızda dar durak atlanabilir.
- Elif Nisa: güncel S1/S2/S3 metinleri kullanılır; tarama ifadeleri model tahminidir.
- Donanım FPS ve dar mobil ekran testi yapılmadı; başsız render yazılım GPU'suyla.
- Brifler ve git-dışı karo sembolik bağı commit edilmedi; test sunucusu teslimde kapatıldı.
