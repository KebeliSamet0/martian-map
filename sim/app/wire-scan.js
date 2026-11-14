// texture B: 0 eğim yedeği, 1..4 API scan_class + 1. En yakın hücre, ara sınıf yok.
export function applyScanClasses(data, nav, coords, grid, classes) {
  if (classes.length !== grid.width * grid.height) throw new Error('scan_class boyutu uyuşmuyor');
  if (!classes.every(v => Number.isInteger(v) && v >= 0 && v <= 3)) throw new Error('scan_class kodu geçersiz');
  const origin = coords.worldToPx([nav.cx / 2, nav.cz / 2]);
  const east = coords.worldToPx([nav.cx * 1.5, nav.cz / 2]);
  const south = coords.worldToPx([nav.cx / 2, nav.cz * 1.5]);
  for (let r = 0; r < nav.h; r++) for (let c = 0; c < nav.w; c++) {
    const x = Math.floor(origin[0] + c * (east[0] - origin[0]) + r * (south[0] - origin[0]));
    const y = Math.floor(origin[1] + c * (east[1] - origin[1]) + r * (south[1] - origin[1]));
    if (x >= 0 && y >= 0 && x < grid.width && y < grid.height) data[(r * nav.w + c) * 4 + 2] = classes[y * grid.width + x] + 1;
  }
}
