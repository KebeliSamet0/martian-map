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
FiniteCoord = Annotated[float, Field(allow_inf_nan=False)]
PathPoint = tuple[FiniteCoord, FiniteCoord]
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


class Budget(Input):
    time_min: Nonnegative = params.EVA_MAX_H * 60
    kcal: Nonnegative = params.EVA_MAX_KCAL
    o2_L: Nonnegative = params.EVA_MAX_O2_L
    dose_uGy: Nonnegative = params.EVA_MAX_DOSE_UGY
    reserve_min: Nonnegative = params.RESERVE_MIN


class RouteInput(Input):
    start: Pixel
    goal: Pixel
    weights: Weights | None = None
    budget: Budget | None = None


class Observation(Input):
    px: Pixel
    radius_m: Nonnegative
    cls: str


class ReplanInput(RouteInput):
    observations: list[Observation]


class StepInput(Input):
    path: list[PathPoint] = Field(min_length=1)
    load_kg: Nonnegative = params.DEFAULT_LOAD_KG
    observations: list[Observation] | None = None


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
def assumptions(request: Request):
    layers = getattr(request.app.state, "layers", None)
    return params.assumptions(provisional_terrain=bool(layers and layers.provisional_terrain))


def result(layers, body: RouteInput):
    routes = planner.plan(layers, body.start, body.goal,
                          weights=body.weights.model_dump() if body.weights else None,
                          budget=body.budget.model_dump() if body.budget else None)
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


@app.post("/step")
@app.post("/consume")
def step(body: StepInput, request: Request):
    obs_list = [o.model_dump() for o in body.observations] if body.observations else None
    return planner.evaluate_step(
        request.app.state.layers,
        body.path,
        load_kg=body.load_kg,
        observations=obs_list,
    )


LAYER_ALIASES = {
    "o2_L_per_m": "o2_l_per_m",
    "risk_per_m": "risk",
}


def layer_array(request: Request, name: str):
    layers = request.app.state.layers
    info = layers.grid_info()
    canonical = LAYER_ALIASES.get(name, name)
    valid = set(info["layers"]) | set(info.get("aux_layers", []))
    if canonical not in valid:
        raise HTTPException(404, "Bilinmeyen katman")
    return layers.probs[canonical[2:]] if canonical.startswith("p_") else getattr(layers, canonical)


@app.get("/layers/{name}.bin")
def layer_binary(name: str, request: Request, dtype: str = "float32"):
    arr = layer_array(request, name)
    canonical = LAYER_ALIASES.get(name, name)
    if canonical == "scan_class" and dtype == "uint8":
        data = np.asarray(arr, dtype=np.uint8)
    else:
        data = np.asarray(arr, dtype="<f4")
    return Response(data.tobytes(order="C"), media_type="application/octet-stream")


@app.get("/layers/{name}.png")
def layer_png(name: str, request: Request):
    canonical = LAYER_ALIASES.get(name, name)
    data = layer_array(request, canonical)
    finite = np.isfinite(data)
    if canonical == "scan_class":
        codes = np.where(finite, data, 0).astype(int)
        rgb = np.zeros((*data.shape, 3), dtype=np.uint8)
        for meta in params.SCAN_LEGEND.values():
            rgb[codes == meta["code"]] = meta["rgb"]
        rgba = np.dstack((rgb, finite.astype(np.uint8) * 255))
        output = BytesIO()
        Image.fromarray(rgba).save(output, format="PNG")
        return Response(output.getvalue(), media_type="image/png")
    lo, hi = 0.0, 1.0
    if canonical == "slope":
        hi = params.SLOPE_NOGO_DEG
    elif canonical in ("elevation", "speed_mps", "kcal_per_m", "o2_l_per_m", "o2_g_per_m") and finite.any():
        lo, hi = float(data[finite].min()), float(data[finite].max())
    scaled = np.clip((np.where(finite, data, lo) - lo) / max(hi - lo, 1e-9), 0, 1)
    # Düşük: koyu mavi; yüksek: sıcak turuncu. Geçersiz hücreler saydam.
    low, high = np.array([30, 60, 100]), np.array([245, 140, 50])
    rgb = (low + scaled[..., None] * (high - low)).astype(np.uint8)
    rgba = np.dstack((rgb, finite.astype(np.uint8) * 255))
    output = BytesIO()
    Image.fromarray(rgba).save(output, format="PNG")
    return Response(output.getvalue(), media_type="image/png")
