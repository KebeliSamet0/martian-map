"""Tek konteyner: planlayıcı API + statik sim, aynı origin (CORS ve ?api= gerekmez).
  /            → /sim/ (yönlendirme)
  /sim/        → istemci (ES modülleri, derleme yok)       /contracts/ → ızgara sözleşmesi
  /layers/*.npy → statik katman yedeği (API'nin /layers/*.bin ve *.png uçları önceliklidir)
  gerisi       → api.main.app (değiştirilmez: /health /grid /route /replan /step /layers/*.bin /docs ...)
Çalıştır (repo veya paket kökünden):  MM_LAYERS_DIR=$PWD python -m uvicorn deploy.server:app --port 7860"""
import os
from pathlib import Path

from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault("MM_LAYERS_DIR", str(ROOT))   # gerçek katmanlar; ayarlanmazsa API sentetiğe düşer ve ızgara uyuşmaz

from api.main import app as api_app  # noqa: E402

STATIC_PREFIXES = ("/sim", "/contracts", "/layers/")
IMMUTABLE = ("/sim/data/tiles/", "/sim/data/tiles_fixed/", "/sim/assets/", "/sim/lib/")


class CacheHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        resp = await call_next(request)
        # döşemeler değişmez; kod/veri her seferinde doğrulanır
        resp.headers["Cache-Control"] = "public, max-age=86400" if request.url.path.startswith(IMMUTABLE) else "no-cache"
        return resp


def _root(request):
    return RedirectResponse("/sim/")


static_app = Starlette(
    routes=[Route("/", _root)] + [Mount(m, StaticFiles(directory=ROOT / s, html=True)) for m, s in
                                  (("/sim", "sim"), ("/contracts", "contracts"), ("/layers", "layers")) if (ROOT / s).is_dir()],
    middleware=[Middleware(CacheHeaders)])


def _is_static(path: str) -> bool:
    if path == "/":
        return True
    if path.startswith("/layers/"):
        return path.endswith(".npy") or path.endswith(".json")      # .bin/.png API'nin
    return path.startswith(("/sim/", "/contracts/")) or path in ("/sim", "/contracts")


async def app(scope, receive, send):
    if scope["type"] == "http" and _is_static(scope["path"]):
        await static_app(scope, receive, send)
    else:                                                            # lifespan dahil: katmanlar API'nin yaşam döngüsünde yüklenir
        await api_app(scope, receive, send)
