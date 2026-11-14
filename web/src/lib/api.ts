// Planlayıcı API istemcisi (#48). Adres tek ayardan: VITE_API_URL.
// Biçim: contracts/route.example.json — alanlar silinmez, yalnız yenileri eklenir.

export const API_URL: string = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'
).replace(/\/+$/, '');

/** [sütun, satır]; (0,0) sol üst köşe */
export type Px = [number, number];
export type RouteKind = 'shortest' | 'balanced' | 'safest';
export type Conf = 'high' | 'mid' | 'low';
export type TerrainClass = 'soil' | 'bedrock' | 'sand' | 'bigrock';
export type LayerName =
  | 'elevation' | 'slope' | 'rock_cfa' | 'p_soil' | 'p_bedrock' | 'p_sand' | 'p_bigrock' | 'entropy';

export interface GridMeta {
  region: string;
  width: number;
  height: number;
  res_m: number;
  synthetic: boolean;
  px_note?: string;
}

export interface GridInfo extends GridMeta {
  layers: LayerName[];
  rover_stops: { stop_id: string; px: Px }[];
  science_stops: { id: string; name: string; px: Px; why: string }[];
}

export interface Segment {
  id: number;
  path_px: Px[];
  len_m: number;
  slope_max: number;
  slope_mean: number;
  class: TerrainClass;
  p_sand: number;
  p_bigrock: number;
  rock_cfa: number;
  entropy: number;
  conf: Conf;
  nearest_evidence_m: number;
  kcal: number;
  min: number;
  risk: number;
  rejected_alt?: string | null;
  reason: string;
}

export interface Budget {
  limits: { time_min: number; kcal: number; o2_L: number; dose_uGy: number; reserve_min: number };
  used: { time_min: number; kcal: number; o2_L: number; dose_uGy: number };
  exceeded: string[];
  first_exceeded: string[];
  return_min: number;
  return_kcal: number;
}

export interface RouteTotal {
  km: number;
  min: number;
  eva_min: number;
  eva_limit_min: number;
  kcal: number;
  eva_kcal: number;
  o2_L: number;
  dose_uGy: number;
  slope_max: number;
  low_conf_m: number;
  walkback_ok: boolean;
  go: boolean;
  status: string; // "GO" | "NO-GO"
  limit_exceeded_at_m: number | null;
  limit_exceeded_at_px: Px | null;
  limit_exceeded_at_index: number | null;
  budget?: Budget;
}

export interface Route {
  kind: RouteKind;
  label: string;
  weights: { t: number; k: number; r: number };
  start: { px: Px };
  goal: { px: Px };
  total: RouteTotal;
  segments: Segment[];
}

export interface RouteResponse {
  grid: GridMeta;
  routes: Route[];
}

export interface Assumption {
  name: string;
  value: number | string | Record<string, number>;
  unit: string;
  source: string;
}

export interface Observation {
  px: Px;
  radius_m: number;
  cls: TerrainClass;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(`Planlayıcıya ulaşılamadı (${API_URL}). API açık mı?`, 0);
  }
  if (!res.ok) {
    let msg = `API hatası ${res.status}`;
    try {
      const body = await res.json();
      // Planlayıcı: {detail: "Türkçe metin"}; FastAPI şema hatası: {detail: [{msg,...}]}
      if (typeof body?.detail === 'string') msg = body.detail;
      else if (Array.isArray(body?.detail)) msg = body.detail.map((d: { msg?: string }) => d.msg).join('; ');
    } catch { /* gövde JSON değil */ }
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

export const getHealth = () => request<unknown>('/health');
export const getGrid = () => request<GridInfo>('/grid');
export const getAssumptions = () => request<Assumption[]>('/assumptions');

export const postRoute = (start: Px, goal: Px, weights?: { t: number; k: number; r: number }) =>
  request<RouteResponse>('/route', {
    method: 'POST',
    body: JSON.stringify(weights ? { start, goal, weights } : { start, goal }),
  });

/** Gözlem geçmişi sunucuda tutulmaz: her çağrıda tüm gözlemleri gönder. */
export const postReplan = (start: Px, goal: Px, observations: Observation[]) =>
  request<RouteResponse>('/replan', {
    method: 'POST',
    body: JSON.stringify({ start, goal, observations }),
  });

/** Grid boyutunda RGBA PNG; yalnız görsel içindir, ölçüm türetilmez. */
export const layerUrl = (name: LayerName) => `${API_URL}/layers/${name}.png`;
