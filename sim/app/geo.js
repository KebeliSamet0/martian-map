// Koordinat dönüşümleri. Dünya çerçevesi (metre): X = doğu, Y = yukarı (yükseklik - zref), Z = güney. Başlangıç = alanın KB köşesi.
// Kaynak: Mars küresi R=3396190 m, ekvatoral equirectangular (x=R·lon, y=R·lat). Doğu-batı ölçeği cos(lat0) ile düzeltilir.
export class Geo {
  constructor(m) {
    this.m = m;
    this.R = m.R;
    this.x0 = m.origin_proj.x0;
    this.ytop = m.origin_proj.ytop;
    this.cosl = Math.cos((m.lat0 * Math.PI) / 180);
    this.resX = m.res_x_m;
    this.resZ = m.res_z_m;
    this.sizeX = m.W * this.resX;
    this.sizeZ = m.H * this.resZ;
    this.zref = m.z_min_data;
    this.yMax = m.z_max_data - m.z_min_data;
  }
  lonlatToWorld(lon, lat) {
    const xp = (this.R * lon * Math.PI) / 180, yp = (this.R * lat * Math.PI) / 180;
    return [(xp - this.x0) * this.cosl, this.ytop - yp];
  }
  worldToLonlat(X, Z) {
    return [((this.x0 + X / this.cosl) / this.R) * 180 / Math.PI, ((this.ytop - Z) / this.R) * 180 / Math.PI];
  }
  inside(X, Z) { return X >= 0 && Z >= 0 && X <= this.sizeX && Z <= this.sizeZ; }
  zOf(q) { return this.m.zmin + q * this.m.zstep; }   // q (uint16) → areoid yüksekliği (m)
}
