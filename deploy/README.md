# Yayın planı (hazırlık; hiçbir şey yayınlanmadı)

## Ölçülen büyüklükler (2026-11-15)
| Parça | Boyut | Git'te mi |
|---|---|---|
| `sim/data/tiles_fixed` (h 128 MB + t 220 MB + nav + overview) | 355 MB, 7,3 bin dosya | **Hayır** (`build_tiles.py` ile üretilir) |
| `layers/` (gerçek katmanlar) | 45 MB | Evet |
| `sim/` kodu + varlıklar | ~10 MB | Evet |
| **Paket (`deploy/bundle.sh`)** | **412 MB, 7426 dosya** | `deploy/dist/`, git dışı |
| API, gerçek katmanla | 282 MB RAM, `/route` 0,16 sn, açılış <8 sn (yerel) | |

Önemli: Dockerfile (kök, PR #31) yalnız `api/` kopyalıyordu ve katman vermiyordu. `planner.load()` katman dizini yoksa **sentetik 250x250** ızgaraya düşer; sim ise gerçek 1000x1000 ızgarayı bekler. Yani eski imaj sim ile uyumsuzdu. Yeni paket `MM_LAYERS_DIR=/app` ile gerçek katmanı yükler.

## Seçenekler
| Ölçüt | A) Tek konteyner, HF Docker Space | B) Tek konteyner, Render | C) Statik CDN + ayrı API (CF Pages + HF/Render) |
|---|---|---|---|
| Ücretsiz katman | 2 vCPU, 16 GB, 50 GB disk (belge) | Ücretsiz web servisi, 512 MB RAM (API 282 MB; dar) | Statik: ücretsiz; API: A veya B |
| Soğuk başlangıç | 48 sa boşta uyku; uyanma birkaç on sn (doğrulanmadı) | 15 dk boşta uyku, ~1 dk uyanma | Statik hep sıcak; yalnız API uyur |
| CORS / `?api=` | Gerekmez (aynı origin) | Gerekmez | CORS `*` açık; `?api=<url>` şart |
| Veri (412 MB) | **Risk:** Spaces git deposu ~1 GB sınırı bildiriliyor (forum, resmî belge değil); 412 MB sığar | Döşemeler git'te yok: build'de indirme veya depoya ekleme gerekir | CF Pages: dosya sayısı/boyut limitleri doğrulanmadı |
| Kurulum süresi | En kısa: `git push` tek adım (LFS ile) | GitHub bağlama + döşeme sorunu | İki ayrı kurulum |
| Not | Forumda ücretsiz CPU Basic'in kısıtlandığı iddiası var: **hesapta doğrula** | Fly.io: ücretsiz katman doğrulanmadı | Daha çok parça = daha çok kırılma noktası |

Kaynaklar: [HF Spaces genel bakış](https://huggingface.co/docs/hub/en/spaces-overview), [HF depolama sınırları](https://huggingface.co/docs/hub/en/storage-limits), [Render ücretsiz katman](https://render.com/docs/free), [HF forum: Spaces 1 GB sınırı](https://discuss.huggingface.co/t/error-repository-storage-limit-reached-max-1-gb/128910).

## Öneri
**A: tek konteyner, Hugging Face Docker Space.** Tek adres, aynı origin, tek kurulum; jüri tek linke tıklar. Planlayıcı çökerse ya da uyanması uzarsa sim `sim/app/offline.js` ile önceden hesaplanmış rotalara düşer (aşağıda). Sunumdan 10 dk önce linki açıp uyandır.
Yedek plan: HF'te depo sınırı ya da ücretsiz katman engel çıkarsa C (statik `deploy/dist/sim` + `layers/contracts` CF Pages'e doğrudan yükleme; API ayrı Space).

## Çevrimdışı yedek
- `deploy/precompute_missions.py` S1/S2/S3 için gerçek katmanla `POST /route` yanıtını `sim/data/routes/<id>.json` yazar (`--check` bayatlığı söyler).
- `sim/app/offline.js` (`api.js` içe aktarır): `/route` ağ hatası ya da 5xx verirse, başlangıç+hedef+bütçe birebir eşleşen dosyayı döndürür ve ekranda "Çevrimdışı yedek" şeridi gösterir. `/replan` önceden hesaplanamaz: kum anında mevcut rotaya devam edilir (mevcut davranış).
- **Planlayıcı veya katman değişirse** (veri/bilim desk'leri) birleştirme sonrası yeniden üret: `MM_LAYERS_DIR=$PWD python deploy/precompute_missions.py`.
- Bilinen: çevrimdışı rotada bilgi satırı hâlâ "PLANLAYICI API" yazar (metin akis desk'inde); şerit durumu açıkça söyler.

## Samet'in adımları (komut komut)
Ön koşul: ana makinede `sim/data/tiles_fixed` var (yoksa `python -I sim/tools/build_tiles.py --out sim/data/tiles_fixed --work <ayrı klasör> --dtm-dcol 30 --dtm-drow 33`), `brew install git-lfs`.
1. Birleştirmeden sonra paketi topla: `MM_LAYERS_DIR=$PWD .venv/bin/python deploy/precompute_missions.py && deploy/bundle.sh`
2. (Docker varsa, yerelde dene) `docker build -t martian-map deploy/dist && docker run --rm -p 7860:7860 martian-map`, sonra `http://127.0.0.1:7860/`. **Bu makinede Docker yok; imaj denenmedi.**
3. Hugging Face hesabında oturum aç: `huggingface-cli login`.
4. Space oluştur: `huggingface-cli repo create martian-map --type space --space_sdk docker`
5. Yükle: `cd deploy/dist && git init -b main && git lfs install && git add -A && git commit -m "Martian Map paketi" && git remote add space https://huggingface.co/spaces/<kullanici>/martian-map && git push space main`
6. Build'i izle (Space sayfasında Logs). Bitince: `/health`, `/grid`, `/docs`, `/` (S1 akışı).
7. Kontrol: `node qa-shared/flow.js https://<kullanici>-martian-map.hf.space/sim/ canli`. Uyku testi: API'yi kapatan bir `?api=http://127.0.0.1:9` ile çevrimdışı şeridini gör.
Not: Space herkese açıksa kod ve katmanlar da herkese açıktır; GitHub deposunun gizliliğine dokunulmaz.
