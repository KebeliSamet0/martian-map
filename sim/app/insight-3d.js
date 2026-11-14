// 3B arazide veri etkisi (tur4:veri): (1) model güveni sisi, (2) "yalnız eğim" rotasının geçeceği kum/kayalık segmentler.
// Tek bir ızgara boyutlu doku (canvas) arazi gölgelendiricisine uniform olarak verilir; detail.js'te yalnız EXTRA_PATCH kancası var.
// Doku dünya eksenlerine hizalıdır (ızgara köşeleri → dünya köşeleri); güven = 1 − normalize entropi (model tahmini, ölçüm değil).
import * as THREE from 'three';
import { EXTRA_PATCH } from './detail.js';
import { fogRGBA } from './insight.js';
import { GRID, pxToWorld } from './api.js';

const U = { tex: { value: null }, rect: { value: new THREE.Vector4(0, 0, 1, 1) }, on: { value: 0 } };
EXTRA_PATCH.push((shader) => {
  shader.uniforms.uInsTex = U.tex; shader.uniforms.uInsRect = U.rect; shader.uniforms.uInsOn = U.on;
  shader.fragmentShader = 'uniform sampler2D uInsTex;\nuniform vec4 uInsRect;\nuniform float uInsOn;\n' + shader.fragmentShader.replace('#include <dithering_fragment>',
    `#include <dithering_fragment>
    if (uInsOn > 0.5) { vec2 iuv = (vWP.xz - uInsRect.xy) / uInsRect.zw;
      if (iuv.x >= 0.0 && iuv.x <= 1.0 && iuv.y >= 0.0 && iuv.y <= 1.0) { vec4 ov = texture2D(uInsTex, iuv); gl_FragColor.rgb = mix(gl_FragColor.rgb, ov.rgb, ov.a); } }`);
});

const S = { geo: null, canvas: null, field: null, fog: false, hazard: false, cmp: null };

function redraw() {
  const any = (S.fog && S.field) || (S.hazard && S.cmp);
  U.on.value = any ? 1 : 0;
  if (!any) return;
  if (!S.canvas) { S.canvas = document.createElement('canvas'); S.canvas.width = GRID.w; S.canvas.height = GRID.h; S.tex = new THREE.CanvasTexture(S.canvas); S.tex.flipY = false; S.tex.minFilter = S.tex.magFilter = THREE.LinearFilter; S.tex.generateMipmaps = false; U.tex.value = S.tex; }
  const g = S.canvas.getContext('2d'); g.clearRect(0, 0, GRID.w, GRID.h);
  if (S.fog && S.field) g.putImageData(new ImageData(fogRGBA(S.field, { maxAlpha: 110 }), GRID.w, GRID.h), 0, 0);
  if (S.hazard && S.cmp) {
    const line = (px, w, color) => { g.beginPath(); px.forEach((p, i) => (i ? g.lineTo(p[0] + 0.5, p[1] + 0.5) : g.moveTo(p[0] + 0.5, p[1] + 0.5))); g.lineWidth = w; g.strokeStyle = color; g.lineJoin = g.lineCap = 'round'; g.stroke(); };
    for (const seg of S.cmp.naive.segments) { if (seg.insight?.hazard) line(seg.path_px, 5, 'rgba(255,69,58,.62)'); }   // 5 px = 10 m şerit
  }
  S.tex.needsUpdate = true;
}
function setRect(geo) {
  if (S.geo === geo) return; S.geo = geo;
  const a = pxToWorld(geo, 0, 0), b = pxToWorld(geo, GRID.w, GRID.h);
  U.rect.value.set(a[0], a[1], b[0] - a[0], b[1] - a[1]);
}

/** layers3d.configure({ geo, fog?, hazard?, field?, comparison? }) — verilen alanlar güncellenir. */
export const layers3d = {
  configure({ geo, fog, hazard, field, comparison }) {
    if (geo) setRect(geo);
    if (field !== undefined) S.field = field;
    if (fog !== undefined) S.fog = !!fog;
    if (hazard !== undefined) S.hazard = !!hazard;
    if (comparison !== undefined) S.cmp = comparison;
    redraw();
  },
  get state() { return { fog: S.fog, hazard: S.hazard, hasComparison: !!S.cmp, on: U.on.value }; },
};
