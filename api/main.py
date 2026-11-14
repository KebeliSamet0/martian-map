"""Mars rota API'si. Katmanlar her uygulama yaşam döngüsünde bir kez yüklenir."""
from contextlib import asynccontextmanager
from io import BytesIO
from typing import Annotated

import numpy as np
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from PIL import Image
from pydantic import BaseModel, ConfigDict, Field, StrictInt, model_validator

from api import planner
from api.planner import params


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.layers = planner.load()
    yield


app = FastAPI(title="Martian Map Planlayıcı", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

Pixel = tuple[StrictInt, StrictInt]
Nonnegative = Annotated[float, Field(ge=0, allow_inf_nan=False)]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Weights(Input):
    t: Nonnegative
    k: Nonnegative
    r: Nonnegative

    @model_validator(mode="after")
    def nonzero(self):
        if self.t + self.k + self.r == 0:
            raise ValueError("En az bir ağırlık sıfırdan büyük olmalı")
        return self


class RouteInput(Input):
    start: Pixel
    goal: Pixel
    weights: Weights | None = None


class Observation(Input):
    px: Pixel
    radius_m: Nonnegative
    cls: str


class ReplanInput(RouteInput):
    observations: list[Observation]


@app.exception_handler(planner.PlanError)
async def plan_error(request: Request, exc: planner.PlanError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/grid")
def grid(request: Request):
    return request.app.state.layers.grid_info()


@app.get("/assumptions")
def assumptions():
    return params.assumptions()


def result(layers, body: RouteInput):
    routes = planner.plan(layers, body.start, body.goal,
                          weights=body.weights.model_dump() if body.weights else None)
    info = layers.grid_info()
    return {"grid": {k: info[k] for k in ("region", "width", "height", "res_m", "synthetic", "px_note")},
            "routes": routes}


@app.post("/route")
def route(body: RouteInput, request: Request):
    return result(request.app.state.layers, body)


@app.post("/replan")
def replan(body: ReplanInput, request: Request):
    layers = request.app.state.layers
    for obs in body.observations:
        x, y = obs.px
        if not (0 <= x < layers.width and 0 <= y < layers.height):
            raise planner.PlanError(f"Gözlem noktası ızgara dışında: {obs.px}")
        layers = planner.apply_observation(layers, obs.px, obs.radius_m, obs.cls)
    return result(layers, body)


def layer_array(request: Request, name: str):
    layers = request.app.state.layers
    if name not in layers.grid_info()["layers"]:
        raise HTTPException(404, "Bilinmeyen katman")
    return layers.probs[name[2:]] if name.startswith("p_") else getattr(layers, name)


@app.get("/layers/{name}.bin")
def layer_binary(name: str, request: Request):
    data = np.asarray(layer_array(request, name), dtype="<f4")
    return Response(data.tobytes(order="C"), media_type="application/octet-stream")


@app.get("/layers/{name}.png")
def layer_png(name: str, request: Request):
    data = layer_array(request, name)
    finite = np.isfinite(data)
    lo, hi = 0.0, 1.0
    if name == "slope":
        hi = params.SLOPE_NOGO_DEG
    elif name == "elevation" and finite.any():
        lo, hi = float(data[finite].min()), float(data[finite].max())
    scaled = np.clip((np.where(finite, data, lo) - lo) / max(hi - lo, 1e-9), 0, 1)
    # Düşük: koyu mavi; yüksek: sıcak turuncu. Geçersiz hücreler saydam.
    low, high = np.array([30, 60, 100]), np.array([245, 140, 50])
    rgb = (low + scaled[..., None] * (high - low)).astype(np.uint8)
    rgba = np.dstack((rgb, finite.astype(np.uint8) * 255))
    output = BytesIO()
    Image.fromarray(rgba).save(output, format="PNG")
    return Response(output.getvalue(), media_type="image/png")
