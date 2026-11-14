# Deploy hazırlığı (2026-11-14)

## Docker / Hugging Face Spaces

Repo kökünde `docker build -t martian-map-api .`, ardından
`docker run --rm -p 7860:7860 martian-map-api` çalıştırılır.
Docker yoksa aynı komut: `python -m uvicorn api.main:app --host 0.0.0.0 --port 7860`.
Bu makinede Python: `/Users/samet/Desktop/Spaceapp/martian-map/.venv/bin/python`.
`/health`, `/grid`, `/docs` ve `POST /route` üzerinden doğrulayın.

Samet elle bir Hugging Face Space oluşturup Docker SDK seçebilir; kökteki
README.md, Dockerfile ve api/ dizinini Space deposuna koymalıdır.
README ön-bilgisi `sdk: docker`, `app_port: 7860` olarak hazırdır.
Bu çalışma deploy veya HF yüklemesi yapmaz. İmaj yalnız API sunar; web arayüzü
ayrı çalıştırılır. `/` yerine `/docs` açılır. Varsayılan veri sentetiktir.
Gerçek katmanlar imaja dahil değildir; yerelde salt okunur volume bağlayıp
`MM_LAYERS_DIR` ayarlanabilir. Spaces için gerçek veri sağlama ayrı iştir.
Kaynak: [resmî Docker Spaces belgesi](https://huggingface.co/docs/hub/spaces-sdks-docker).

## B planı: statik rota çıktıları

Repo kökünde, mevcut Python ortamıyla:

```sh
python scripts/precompute_routes.py scripts/route_pairs.example.json --synthetic
```

Her `{name,start,goal}` çifti için `web/public/routes/<name>.json` üretilir.
Girdi koordinatları tam sayı `[x,y]`; her dosya `{grid,routes}` sözleşmesini
ve shortest/balanced/safest rotalarını içerir. Örnek üç dosya sentetiktir.
Özel çift listesi, `--output-dir` ve `--layers-dir /tam/yol` desteklenir.
Kaynak seçilmezse çekirdeğin varsayılan katman yüklemesi kullanılır.
Aynı adlı çıktılar yenilenir; diğer dosyalar korunur. Hesaplama hatasında
hiçbir çıktı yazılmaz. API/HTTP veya token gerekmez.
Web istemcisi `/routes/synthetic-crossing.json` gibi bir dosyayı fetch ederek
mevcut rota yanıtı gibi kullanabilir; otomatik fallback UI bu pakete dahil değil.
Veri veya çekirdek değişince dosyalar yeniden üretilmelidir.
