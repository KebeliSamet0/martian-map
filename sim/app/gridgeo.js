import { Geo } from './geo.js';

/** /grid origin içermiyorsa contracts/grid.json'u grid olarak verin. */
export function createGridGeo({ grid, manifest, geo = new Geo(manifest) }) {
  const origin = grid.origin_xy_m ?? [grid.ox, grid.oy];
  const res = grid.res_m ?? grid.res;
  const width = grid.width ?? grid.w, height = grid.height ?? grid.h;
  if (![...origin, res, width, height, geo.R].every(Number.isFinite) || res <= 0 || width <= 0 || height <= 0)
    throw new TypeError('Geçerli metrik ızgara ve manifest gerekli');
  const degrees = 180 / (Math.PI * geo.R);
  const pxToWorld = ([c, r]) => geo.lonlatToWorld((origin[0] + c * res) * degrees, (origin[1] - r * res) * degrees);
  const worldToPx = ([x, z]) => {
    const [lon, lat] = geo.worldToLonlat(x, z);
    return [(lon / degrees - origin[0]) / res, (origin[1] - lat / degrees) / res];
  };
  return { pxToWorld, worldToPx,
    cellToWorld: ([c, r]) => pxToWorld([c + 0.5, r + 0.5]),
    worldToCell: p => worldToPx(p).map(Math.floor),
    inside: ([c, r]) => c >= 0 && r >= 0 && c < width && r < height };
}
