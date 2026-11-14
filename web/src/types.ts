export type Px = [number, number] // [x, y] = [sütun, satır], (0,0) sol üst

export interface Segment {
  id: number
  path_px: Px[]
  len_m: number
  slope_max: number
  slope_mean?: number
  class?: string
  p_sand: number
  p_bigrock?: number
  rock_cfa: number
  entropy?: number
  conf: 'high' | 'mid' | 'low'
  nearest_evidence_m: number | null
  kcal: number
  min: number
  risk?: number
  reason: string
  rejected_alt: string | null
}

export interface Total {
  km: number
  min: number
  kcal: number
  eva_min?: number
  eva_limit_min?: number
  o2_L?: number
  dose_uGy: number
  slope_max?: number
  low_conf_m?: number
  walkback_ok: boolean
  go: boolean
  status?: string
}

export interface Route {
  kind: string
  label?: string
  start: { px: Px }
  goal: { px: Px }
  total: Total
  segments: Segment[]
}

export interface GridInfo {
  region?: string
  width: number
  height: number
  res_m: number
  synthetic?: boolean
}

export interface RouteResponse {
  grid: GridInfo
  routes: Route[]
}
