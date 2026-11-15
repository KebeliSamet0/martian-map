// Saf donusum; sim'e import/kurulum yapmaz. Tarayici ES module.
export function pxToWorld(px, grid, manifest, {cellCenter = false} = {}) {
  if (!Array.isArray(px) || px.length !== 2 || !px.every(Number.isFinite))
    throw new TypeError('px must be finite [column,row]');
  const offset = cellCenter ? 0.5 : 0;
  const xp = grid.origin_xy_m[0] + (px[0] + offset) * grid.res_m;
  const yp = grid.origin_xy_m[1] - (px[1] + offset) * grid.res_m;
  const lon = xp / manifest.R * 180 / Math.PI;
  const lat = yp / manifest.R * 180 / Math.PI;
  const x = (xp - manifest.origin_proj.x0) * Math.cos(manifest.lat0 * Math.PI / 180);
  const z = manifest.origin_proj.ytop - yp;
  const inside = x >= 0 && z >= 0 && x <= manifest.W * manifest.res_x_m && z <= manifest.H * manifest.res_z_m;
  return {x, z, lon, lat, inside};
}

export function worldToPx({x,z}, grid, manifest, {cellCenter = false} = {}) {
  const offset = cellCenter ? 0.5 : 0;
  return [(manifest.origin_proj.x0 + x / Math.cos(manifest.lat0 * Math.PI / 180) - grid.origin_xy_m[0]) / grid.res_m - offset,
    (grid.origin_xy_m[1] - manifest.origin_proj.ytop + z) / grid.res_m - offset];
}

export function decodedWorldY(q, manifest) {
  return q === 0 ? null : manifest.zmin + q * manifest.zstep - manifest.z_min_data;
}
