/* Research prototype, Three.js r160 / WebGL2. No sim files are changed.
 * All lengths are metres in a local, floating-origin frame, +Y up.
 * One active material set: diffuse(sRGB), nor_gl(linear), ARM(linear).
 * API deliberately receives THREE rather than importing the application.
 */
export function makeTerrainUniforms(THREE, maps, options = {}) {
  return {
    uTPColor: {value: maps.color}, uTPNormal: {value: maps.normal}, uTPArm: {value: maps.arm},
    uTPTile: {value: options.tileMetres ?? 2},
    uTPFade: {value: new THREE.Vector2(options.fadeStart ?? 12, options.fadeEnd ?? 35)},
    uTPStrength: {value: new THREE.Vector4(options.albedo ?? .28, options.normal ?? .65,
      options.roughness ?? .4, options.ao ?? .25)},
    // Linear-space source mean; loader below computes it from the actual diffuse image.
    uTPMean: {value: maps.mean ?? new THREE.Vector3(.25,.2,.15)},
    uTPRipple: {value: new THREE.Vector4(1,0,options.rippleWavelength ?? .18,options.ripple ?? 0)},
    uTPCavityStrength: {value: options.cavity ?? .2},
  };
}

const common = /* glsl */`
uniform sampler2D uTPColor, uTPNormal, uTPArm;
uniform float uTPTile, uTPCavityStrength;
uniform vec2 uTPFade;
uniform vec4 uTPStrength, uTPRipple;
uniform vec3 uTPMean;
varying float vTPCavity;
struct TPData { vec3 color; vec3 normalTex; vec3 arm; };
vec2 tpHash(vec2 p) {
  // Fixed seed, translation only: normal-map axes do not rotate across cells.
  return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}
TPData tpPatch(vec2 uv, vec2 dx, vec2 dy) {
  TPData d;
  d.color=textureGrad(uTPColor,uv,dx,dy).rgb;
  d.normalTex=textureGrad(uTPNormal,uv,dx,dy).rgb*2.0-1.0;
  d.arm=textureGrad(uTPArm,uv,dx,dy).rgb;
  return d;
}
TPData tpSample(vec2 uv, vec2 dx, vec2 dy) {
  #ifdef TP_STOCHASTIC
    // Triangular grid, continuous barycentric weights, 3 translated samples.
    // This is ordinary blending, NOT Heitz/Neyret histogram-preserving synthesis.
    vec2 skew=vec2(uv.x-0.577350269*uv.y,1.154700538*uv.y);
    vec2 cell=floor(skew), f=fract(skew);
    vec2 a=cell, b, c; vec3 w;
    if(f.x+f.y<1.0) {
      b=cell+vec2(1,0); c=cell+vec2(0,1); w=vec3(1.0-f.x-f.y,f.x,f.y);
    } else {
      a=cell+vec2(1,1); b=cell+vec2(0,1); c=cell+vec2(1,0);
      w=vec3(f.x+f.y-1.0,1.0-f.x,1.0-f.y);
    }
    TPData da=tpPatch(uv+tpHash(a),dx,dy);
    TPData db=tpPatch(uv+tpHash(b),dx,dy);
    TPData dc=tpPatch(uv+tpHash(c),dx,dy);
    TPData d;
    d.color=da.color*w.x+db.color*w.y+dc.color*w.z;
    d.normalTex=da.normalTex*w.x+db.normalTex*w.y+dc.normalTex*w.z;
    d.arm=da.arm*w.x+db.arm*w.y+dc.arm*w.z;
    return d;
  #else
    return tpPatch(uv,dx,dy);
  #endif
}
`;

const sample = /* glsl */`
// Derivatives are computed before distance/axis branches for stable mip selection.
vec3 tpN=normalize(vWN);
vec3 tpS=step(vec3(0.0),tpN)*2.0-1.0;
vec3 tpW=pow(abs(tpN),vec3(4.0));
tpW/=max(dot(tpW,vec3(1.0)),0.00001);
vec3 tpP=vWP/max(uTPTile,0.01);
vec2 tpUX=vec2(-tpS.x*tpP.z,tpP.y);
vec2 tpUY=vec2(tpP.x,-tpS.y*tpP.z);
vec2 tpUZ=vec2(tpS.z*tpP.x,tpP.y);
vec2 tpDX=dFdx(tpUX),tpEX=dFdy(tpUX);
vec2 tpDY=dFdx(tpUY),tpEY=dFdy(tpUY);
vec2 tpDZ=dFdx(tpUZ),tpEZ=dFdy(tpUZ);
vec2 tpWind=normalize(uTPRipple.xy+vec2(0.00001));
float tpPhase=dot(vWP.xz,tpWind)*6.28318530718/max(uTPRipple.z,.02);
float tpWaveAA=1.0-smoothstep(.4,1.5,fwidth(tpPhase));
float tpFade=1.0-smoothstep(uTPFade.x,uTPFade.y,distance(cameraPosition,vWP));
vec3 tpColor=vec3(0),tpArm=vec3(0),tpGradient=vec3(0);
float tpWeight=0.0;
if(tpFade>0.0001) {
  if(tpW.x>0.01) {
    TPData d=tpSample(tpUX,tpDX,tpEX); tpColor+=d.color*tpW.x; tpArm+=d.arm*tpW.x;
    vec2 q=d.normalTex.xy/max(d.normalTex.z,0.25);
    tpGradient+=vec3(0,q.y,-tpS.x*q.x)*tpW.x; tpWeight+=tpW.x;
  }
  if(tpW.y>0.01) {
    TPData d=tpSample(tpUY,tpDY,tpEY); tpColor+=d.color*tpW.y; tpArm+=d.arm*tpW.y;
    vec2 q=d.normalTex.xy/max(d.normalTex.z,0.25);
    tpGradient+=vec3(q.x,0,-tpS.y*q.y)*tpW.y; tpWeight+=tpW.y;
  }
  if(tpW.z>0.01) {
    TPData d=tpSample(tpUZ,tpDZ,tpEZ); tpColor+=d.color*tpW.z; tpArm+=d.arm*tpW.z;
    vec2 q=d.normalTex.xy/max(d.normalTex.z,0.25);
    tpGradient+=vec3(tpS.z*q.x,q.y,0)*tpW.z; tpWeight+=tpW.z;
  }
  tpColor/=max(tpWeight,0.001); tpArm/=max(tpWeight,0.001);
  tpGradient/=max(tpWeight,0.001);
  // Preserve the orthophoto's broad colour, modulate only bounded local contrast.
  vec3 ratio=clamp(tpColor/max(uTPMean,vec3(.02)),vec3(.45),vec3(1.75));
  diffuseColor.rgb*=mix(vec3(1.0),ratio,uTPStrength.x*tpFade);
}
`;

function replaceOnce(source, marker, replacement) {
  if (source.split(marker).length !== 2) throw new Error('Terrain patch: missing/duplicate '+marker);
  return source.replace(marker,replacement);
}

/** Existing vWP/vWN: set worldVaryingsProvided:true and supply them before this hook.
 * Existing procedural DETAIL/strata should be replaced by the integrator, not doubled.
 * Scanner/emissive and all PBR light chunks are preserved.
 * vWP/vWN must share cameraPosition's origin; geometry/model units must be metres.
 * Instanced/skinned/displaced meshes need caller-supplied final world varyings.
 */
export function injectTerrainShader(shader, uniforms, options = {}) {
  Object.assign(shader.uniforms,uniforms);
  if(options.stochastic !== false) shader.defines={...shader.defines,TP_STOCHASTIC:1};
  if(!options.worldVaryingsProvided) {
    shader.vertexShader='varying vec3 vWP; varying vec3 vWN;\n'+shader.vertexShader;
    shader.vertexShader=replaceOnce(shader.vertexShader,'#include <worldpos_vertex>',`
      #include <worldpos_vertex>
      vWP=(modelMatrix*vec4(transformed,1.0)).xyz;
      // inverseTransformDirection handles non-uniform model scaling via normalMatrix.
      vWN=inverseTransformDirection(normalize(normalMatrix*objectNormal),viewMatrix);
    `);
    shader.fragmentShader='varying vec3 vWP; varying vec3 vWN;\n'+shader.fragmentShader;
  }
  shader.vertexShader='attribute float tpCavity; varying float vTPCavity;\n'+shader.vertexShader;
  shader.vertexShader=replaceOnce(shader.vertexShader,'#include <begin_vertex>',
    '#include <begin_vertex>\nvTPCavity=tpCavity;');
  shader.fragmentShader=common+shader.fragmentShader;
  shader.fragmentShader=replaceOnce(shader.fragmentShader,'#include <map_fragment>',
    '#include <map_fragment>\n'+sample);
  shader.fragmentShader=replaceOnce(shader.fragmentShader,'#include <roughnessmap_fragment>',`
    #include <roughnessmap_fragment>
    if(tpFade>0.0001) roughnessFactor=mix(roughnessFactor,clamp(tpArm.g,.55,1.0),uTPStrength.z*tpFade);
  `);
  shader.fragmentShader=replaceOnce(shader.fragmentShader,'#include <normal_fragment_maps>',`
    #include <normal_fragment_maps>
    if(tpFade>0.0001) {
      vec3 gradient=tpGradient;
      // Optional art-directed ripple; apply only to classified sand, not all terrain.
      vec2 wave=tpWind*cos(tpPhase)*uTPRipple.w*tpWaveAA;
      gradient+=vec3(wave.x,0,wave.y)*smoothstep(.65,.95,tpN.y);
      gradient-=tpN*dot(gradient,tpN);
      vec3 detailedWorld=normalize(tpN+gradient*uTPStrength.y*tpFade);
      normal=normalize((viewMatrix*vec4(detailedWorld,0)).xyz);
    }
  `);
  shader.fragmentShader=replaceOnce(shader.fragmentShader,'#include <aomap_fragment>',`
    #include <aomap_fragment>
    // Only indirect diffuse: never multiply direct sunlight or the entire final colour.
    float microAO=mix(1.0,tpArm.r,uTPStrength.w*tpFade);
    float cavityAO=1.0-clamp(vTPCavity,0.0,1.0)*uTPCavityStrength;
    reflectedLight.indirectDiffuse*=microAO*cavityAO;
  `);
}

export function installTerrainPatch(material, uniforms, options = {}) {
  // Standalone entry point; integrate injectTerrainShader manually if another hook exists.
  if(Object.prototype.hasOwnProperty.call(material,'onBeforeCompile'))
    throw new Error('Existing shader hook: use injectTerrainShader for explicit composition');
  material.onBeforeCompile=shader=>injectTerrainShader(shader,uniforms,options);
  material.customProgramCacheKey=()=>`terrain-research-r160-v1-${options.stochastic!==false}-${!!options.worldVaryingsProvided}`;
  material.needsUpdate=true;
  return material;
}

export async function loadTerrainSet(THREE, base, asset, renderer) {
  const loader=new THREE.TextureLoader();
  const load=async(channel,color)=>{
    const t=await loader.loadAsync(`${base}/${asset}/${asset}_${channel}_1k.jpg`);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
    t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    t.needsUpdate=true;return t;
  };
  const [color,normal,arm]=await Promise.all([load('diff',true),load('nor_gl',false),load('arm',false)]);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(color.image,0,0,64,64);
  const pixels=ctx.getImageData(0,0,64,64).data,mean=new THREE.Vector3();
  const linear=x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);
  for(let i=0;i<pixels.length;i+=4) {
    mean.x+=linear(pixels[i]/255);mean.y+=linear(pixels[i+1]/255);mean.z+=linear(pixels[i+2]/255);
  }
  mean.multiplyScalar(1/(64*64));
  return {color,normal,arm,mean,dispose(){color.dispose();normal.dispose();arm.dispose();}};
}

/** Regular grid input, rows along +Z, cols along +X. Excludes NoData and tile edges.
 * Unitless concavity proxy, NOT ray-traced physical AO. Bake once, never per frame.
 * halo neighbours should be provided by the integrator to avoid tile seams.
 */
export function cavityFromGrid(heights, cols, rows, {radius=2, depth=.35, noData=NaN}={}) {
  const out=new Float32Array(heights.length);
  const valid=h=>Number.isFinite(h)&&h!==noData;
  for(let z=radius;z<rows-radius;z++)for(let x=radius;x<cols-radius;x++) {
    const i=z*cols+x,h=heights[i];if(!valid(h))continue;
    let sum=0,count=0;
    for(const [dx,dz] of [[radius,0],[-radius,0],[0,radius],[0,-radius]]) {
      const q=heights[(z+dz)*cols+x+dx];if(valid(q)){sum+=q;count++;}
    }
    if(count===4)out[i]=Math.max(0,Math.min(1,(sum/4-h)/Math.max(depth,.001)));
  }
  return out;
}
