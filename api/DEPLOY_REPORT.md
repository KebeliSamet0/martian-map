# Deploy hazırlık raporu (2026-11-14)

PR: https://github.com/KebeliSamet0/martian-map/pull/31
Dal: `samet/deploy`; hedef: `main`; gövde: `Refs #16`. Birleştirilmedi.

## Yapılanlar (2026-11-14)
- Dockerfile: Python 3.12, ayrı kullanıcı, uvicorn `0.0.0.0:7860`.
- README Spaces ön-bilgisi: Docker SDK, port 7860; dar Docker bağlamı.
- `scripts/precompute_routes.py`: HTTP olmadan çekirdekle üç ön ayar üretimi.
- Özel çift listesi, çıktı dizini, sentetik veya gerçek katman seçimi.
- Üç sentetik çift ve `web/public/routes/synthetic-*.json` çıktıları.
- CLI, sözleşme/çekirdek eşitliği, örnek güncelliği ve hatalı girdi testleri.
- `api/planner` dosyaları değiştirilmedi; pull/checkout yapılmadı.
- Commit'ler: `0674d79` Docker paketi, `f3ede4b` B planı; bu rapor ayrı commit.

## Test çıktısı (2026-11-14)
Python: `/Users/samet/Desktop/Spaceapp/martian-map/.venv/bin/python`.
`python -m pytest -q`: **38 passed, 1 warning in 1.16s**.
Uyarı: mevcut Starlette TestClient/httpx kullanımının kullanımdan kaldırılması.
`git diff --check`: temiz.
Docker komutu kurulu değil; `docker build` çalıştırılamadı.
`python -m uvicorn api.main:app --host 0.0.0.0 --port 7860` doğrulandı.
GET /health, GET /grid, POST /route: **200 OK**; üç rota türü doğrulandı.
Yerel kontrol sunucusu kapatıldı. Deploy/HF yüklemesi yapılmadı, token istenmedi.

## Samet'in elle yapacağı adımlar (2026-11-14)
1. Docker olan makinede `docker build -t martian-map-api .` çalıştır.
2. `docker run --rm -p 7860:7860 martian-map-api`; /docs ve /health kontrol et.
3. Hugging Face'te Docker SDK ile Space oluştur; README.md, Dockerfile ve
   api/ dizinini Space deposuna koy. İstersen .dockerignore dosyasını da ekle.
4. Build bitince Space adresinde /health, /grid, /docs ve POST /route doğrula.
5. Web istemcisini API adresine bağla; B planında statik /routes/*.json kullan.
6. Katman/çekirdek değişirse `python scripts/precompute_routes.py
   scripts/route_pairs.example.json --synthetic` komutunu tek satırda çalıştır.
Ayrıntı ve resmî Spaces kaynağı: [DEPLOY.md](DEPLOY.md).

## Bilinen eksikler (2026-11-14)
- İmaj build'i ve gerçek HF ortamı denenmedi; yalnız aynı uvicorn komutu denendi.
- Varsayılan veri sentetik; gerçek veri temini ve model doğrulaması kapsam dışı.
- Paket yalnız API sunar; statik rotalar için otomatik web fallback UI eklenmedi.
- Bağımlılıklar mevcut sürüm aralıklarını kullanır; tam kilit dosyası yoktur.
- Ön hesaplama dosyaları sabittir; yeni hedef/gözlem için yeniden üretim gerekir.
- Borje çalışıyor fakat bu worktree açık değil; build_context erişimi reddedildi.
  Hafıza dosyaları taranmadı; yerel Borje/ajan dosyaları commit edilmedi.
