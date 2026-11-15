"""Read-only inputs; outputs ONLY beside this script. Run python -B check_coords.py.

Requires numpy and node. No sim imports, no pycache, no server mutation.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import hashlib
import json
import math
import subprocess
import urllib.request
from functools import lru_cache
from pathlib import Path
import numpy as np


def px_to_world(px, grid, manifest, cell_center=False):
    c, r = map(float, px)
    if not (math.isfinite(c) and math.isfinite(r)):
        raise ValueError('finite [column,row] required')
    o = 0.5 if cell_center else 0.0
    xp = grid['origin_xy_m'][0] + (c + o) * grid['res_m']
    yp = grid['origin_xy_m'][1] - (r + o) * grid['res_m']
    x = (xp - manifest['origin_proj']['x0']) * math.cos(math.radians(manifest['lat0']))
    z = manifest['origin_proj']['ytop'] - yp
    return dict(x=x, z=z, lon=math.degrees(xp / manifest['R']), lat=math.degrees(yp / manifest['R']),
                inside=0 <= x <= manifest['W'] * manifest['res_x_m'] and 0 <= z <= manifest['H'] * manifest['res_z_m'])


class Tiles:
    def __init__(self, root, manifest):
        self.root, self.m = Path(root), manifest
        self.used = set()

    @lru_cache(maxsize=512)
    def tile(self, cx, cy):
        path = self.root / 'h' / '0' / f'{cx}_{cy}.u16'
        if not path.exists():
            return None
        self.used.add(path)
        a = np.fromfile(path, dtype='<u2')
        s = self.m['chunk_cells'] + 3
        assert a.size == s*s, (path, a.size)
        return a.reshape(s, s)

    def sample(self, points, grid):
        """L0 bilinear, same indexing as terrain.heightAt; absolute areoid metres."""
        p = np.asarray(points, dtype=float)
        xp = grid['origin_xy_m'][0] + p[:, 0] * grid['res_m']
        yp = grid['origin_xy_m'][1] - p[:, 1] * grid['res_m']
        u = (xp - self.m['origin_proj']['x0']) / self.m['res_p']
        v = (self.m['origin_proj']['ytop'] - yp) / self.m['res_p']
        ch = self.m['chunk_cells']
        cx, cy = np.floor(u/ch).astype(int), np.floor(v/ch).astype(int)
        out = np.full(len(p), np.nan)
        for a, b in np.unique(np.stack([cx,cy],axis=1), axis=0):
            ids = np.flatnonzero((cx == a) & (cy == b))
            tile = self.tile(int(a), int(b))
            if tile is None:
                continue
            fu, fv = u[ids] - a*ch, v[ids] - b*ch
            i, j = np.clip(np.floor(fu).astype(int),0,ch-1), np.clip(np.floor(fv).astype(int),0,ch-1)
            tx, tz = np.clip(fu-i,0,1), np.clip(fv-j,0,1)
            q = np.array([tile[j+1,i+1],tile[j+1,i+2],tile[j+2,i+1],tile[j+2,i+2]],dtype=float)
            h = self.m['zmin'] + q*self.m['zstep']
            z = (h[0]*(1-tx)+h[1]*tx)*(1-tz)+(h[2]*(1-tx)+h[3]*tx)*tz
            z[np.any(q == 0,axis=0)] = np.nan
            out[ids] = z
        return out


def stats(sim, planner):
    ok = np.isfinite(sim) & np.isfinite(planner)
    d = sim[ok] - planner[ok]
    return dict(n=int(ok.sum()), nodata=int((~ok).sum()), bias_sim_minus_planner_m=float(d.mean()),
                rmse_m=float(np.sqrt(np.mean(d*d))), centered_rmse_m=float(d.std()),
                median_m=float(np.median(d)), p95_abs_m=float(np.percentile(abs(d),95)), max_abs_m=float(abs(d).max()))


def fetch(url, body=None):
    try:
        req=urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(),
                                   headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(req, timeout=40) as r:
            data=r.read()
            return dict(status=r.status, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                        json=json.loads(data) if 'json' in r.headers.get('Content-Type','') else None)
    except Exception as exc:
        return dict(error=str(exc))


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--planner', default='C:/Users/Batu/Desktop/mm-pr/martian-map')
    ap.add_argument('--sim', default=str(Path(__file__).resolve().parents[4] / 'sim'))
    args=ap.parse_args()
    out=Path(__file__).resolve().parent
    planner,sim=Path(args.planner),Path(args.sim)
    gp,mp,sp,ep=planner/'contracts/grid.json',sim/'data/tiles/manifest.json',planner/'layers/science_stops.json',planner/'layers/elevation.npy'
    source_paths=(gp,mp,sp,ep,sim/'app/geo.js',sim/'app/terrain.js',planner/'pipeline/gale_grid.py')
    before_hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in source_paths}
    g,m,stops=[json.loads(p.read_text(encoding='utf-8')) for p in (gp,mp,sp)]
    elev=np.load(ep, mmap_mode='r')
    assert elev.shape == (g['height'],g['width'])
    assert m['R']==3396190 and m['border']==1 and m['chunk_cells']==128
    tiles=Tiles(sim/'data/tiles',m)
    corners=[('NW',[0,0]),('NE',[g['width'],0]),('SW',[0,g['height']]),('SE',[g['width'],g['height']])]
    locations=[]
    for name,px in corners+[(s['id'],s['px']) for s in stops]:
        loc=dict(id=name,px=px,**px_to_world(px,g,m))
        h=tiles.sample([px],g)[0]
        loc['sim_areoid_m']=float(h) if np.isfinite(h) else None
        loc['world_y_m']=float(h-m['z_min_data']) if np.isfinite(h) else None
        locations.append(loc)
    assert all(p['inside'] for p in locations), 'outside manifest rectangle'
    # Stratified 32x32 cell indices, reproducible seed. Holdout split independent of fitting.
    rng=np.random.default_rng(49)
    axis=np.linspace(40,g['width']-41,32).astype(int)
    c,r=np.meshgrid(axis,axis)
    points=np.column_stack([c.ravel(),r.ravel()])
    values=np.asarray(elev[points[:,1],points[:,0]],float)
    direct=tiles.sample(points,g)
    centered=tiles.sample(points+0.5,g)
    perm=rng.permutation(len(points)); train,hold=perm[:512],perm[512:]
    tp,tv=points[train],values[train]
    def objective(dx,dy):
        s=stats(tiles.sample(tp+[dx,dy],g),tv)
        return s['centered_rmse_m'] if s['n']==len(tp) else float('inf')
    best=(float('inf'),0.,0.)
    for step,radius in [(2.,16),(.2,10),(.02,10)]:
        bx,by=best[1:]
        for dx in bx+np.arange(-radius,radius+1)*step:
            for dy in by+np.arange(-radius,radius+1)*step:
                cand=(objective(float(dx),float(dy)),float(dx),float(dy))
                if cand[0] < best[0]: best=cand
    shift=np.array(best[1:]); fit=tiles.sample(points+shift,g)
    vertical=stats(fit[train],values[train])['bias_sim_minus_planner_m']
    assert stats(direct,values)['n']>=200
    # Run the supplied JS and the ACTUAL current sim Geo class from read-only data URL imports.
    js_test=r"""
const fs=require('fs');
const load=async p=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(p)).toString('base64'));
(async()=>{
const [ours,actual]=await Promise.all([load(process.argv[1]),load(process.argv[2])]);
const input=JSON.parse(fs.readFileSync(0,'utf8')), geo=new actual.Geo(input.m);
// Drop only imports IN MEMORY; do not call rendering constructor or change source files.
const terrainSource=fs.readFileSync(input.terrain,'utf8').replace(/^import .*;\r?$/gm,'');
const {Terrain}=await import('data:text/javascript;base64,'+Buffer.from(terrainSource).toString('base64'));
const terrain=Object.create(Terrain.prototype);terrain.man=input.m;terrain.geo=geo;terrain.K=0;terrain.nodes=new Map();
let maxHeight=0;
for(let n=0;n<input.height_points.length;n++){
 const p=input.height_points[n], w=ours.pxToWorld(p,input.g,input.m);
 const cx=Math.floor(w.x/(geo.resX*128)),cy=Math.floor(w.z/(geo.resZ*128)), key='0/'+cx+'/'+cy;
 if(!terrain.nodes.has(key)){
  const buf=fs.readFileSync(input.tile_root+'/h/0/'+cx+'_'+cy+'.u16');
  const u16=new Uint16Array(buf.length/2);for(let i=0;i<u16.length;i++)u16[i]=buf.readUInt16LE(i*2);
  terrain.nodes.set(key,{state:'ready',x0:cx*geo.resX*128,z0:cy*geo.resZ*128,u16});
 }
 const actualY=terrain.heightAt(w.x,w.z),expectedY=input.height_expected[n]-geo.zref;
 if(actualY===null)throw Error('unexpected terrain NoData');
 maxHeight=Math.max(maxHeight,Math.abs(actualY-expectedY));
}
if(maxHeight>1e-6)throw Error('height sampler differs from real Terrain.heightAt');
let maxGeo=0,maxRoundtrip=0;
for(const p of input.points){
 for(const center of [false,true]){
 const a=ours.pxToWorld(p,input.g,input.m,{cellCenter:center});
 const b=geo.lonlatToWorld(a.lon,a.lat);
 maxGeo=Math.max(maxGeo,Math.abs(a.x-b[0]),Math.abs(a.z-b[1]));
 const q=ours.worldToPx(a,input.g,input.m,{cellCenter:center});
 maxRoundtrip=Math.max(maxRoundtrip,Math.abs(q[0]-p[0]),Math.abs(q[1]-p[1]));
 }
}
if(maxGeo>1e-6||maxRoundtrip>1e-6)throw Error('coordinate mismatch');
if(ours.decodedWorldY(0,input.m)!==null)throw Error('nodata');
if(Math.abs(ours.decodedWorldY(10000,input.m)-(-3900-input.m.z_min_data))>1e-8)throw Error('height decode');
let rejected=false;try{ours.pxToWorld([NaN,0],input.g,input.m)}catch{rejected=true}if(!rejected)throw Error('NaN accepted');
console.log(JSON.stringify({pass:true,n:input.points.length,center_modes:2,max_geo_m:maxGeo,max_roundtrip_px:maxRoundtrip,
 actual_terrain_height_points:input.height_points.length,max_terrain_height_error_m:maxHeight,
 converted:input.points.map(p=>ours.pxToWorld(p,input.g,input.m))}));
})().catch(e=>{console.error(e);process.exit(1)});
"""
    testpoints=[p for _,p in corners]+[s['px'] for s in stops]+points.tolist()
    proc=subprocess.run(['node','-e',js_test,str(out/'px_to_world.js'),str(sim/'app/geo.js')],
        input=json.dumps(dict(g=g,m=m,points=testpoints,terrain=str(sim/'app/terrain.js'),tile_root=str(sim/'data/tiles'),
                             height_points=points.tolist(),height_expected=direct.tolist())),text=True,capture_output=True,check=True)
    js=json.loads(proc.stdout); converted=js.pop('converted')
    max_pyjs=max(max(abs(a[k]-px_to_world(p,g,m)[k]) for k in ('x','z','lon','lat')) for p,a in zip(testpoints,converted))
    assert max_pyjs<1e-8
    # Independent known projected sample: contract NW must map to its explicit origin difference.
    nw=px_to_world([0,0],g,m)
    assert abs(nw['z']-(m['origin_proj']['ytop']-g['origin_xy_m'][1]))<1e-9
    try: px_to_world([float('nan'),0],g,m)
    except ValueError: pass
    else: raise AssertionError('NaN accepted')
    # Synthetic asymmetric field checks row/column order, 1-pixel border, interpolation and nodata.
    synth=object.__new__(Tiles); synth.m=m
    s=m['chunk_cells']+3; yy,xx=np.mgrid[:s,:s]
    synth.tile=lambda cx,cy: (1000+3*(xx-1)+7*(yy-1)).astype('<u2')
    sg={'origin_xy_m':[m['origin_proj']['x0'],m['origin_proj']['ytop']], 'res_m':m['res_p']}
    hv=synth.sample([[2.25,3.75]],sg)[0]
    assert abs(hv-(m['zmin']+(1000+3*2.25+7*3.75)*m['zstep']))<1e-6
    synth.tile=lambda cx,cy: np.zeros((s,s),dtype='<u2')
    assert np.isnan(synth.sample([[2.25,3.75]],sg)[0])
    api=fetch('http://127.0.0.1:8000/grid')
    live=api.pop('json',None)
    if live is not None:
        api['summary']={k:live.get(k) for k in ('width','height','res_m','synthetic','provisional_terrain','origin_xy_m','crs','px_note')}
        api['science_stop_count']=len(live.get('science_stops',[]))
        api['dimensions_match_disk']=all(live[k]==g[k] for k in ('width','height','res_m'))
        assert api['dimensions_match_disk']
    route_checks=[]
    for endpoint,body in [('route',dict(start=[433,525],goal=[491,774])),
                         ('replan',dict(start=[433,525],goal=[491,774],observations=[dict(px=[467,609],radius_m=20,cls='sand')]))]:
        response=fetch('http://127.0.0.1:8000/'+endpoint,body)
        data=response.pop('json',None)
        if data is not None:
            checks=[]
            for route in data.get('routes',[]):
                pts=[p for seg in route['segments'] for p in seg['path_px']]
                ws=[px_to_world(p,g,m) for p in pts]
                hs=tiles.sample(pts,g)
                ch=dict(kind=route['kind'],points=len(pts),all_inside=all(w['inside'] for w in ws),
                        valid_l0_heights=int(np.isfinite(hs).sum()),first_px=pts[0],last_px=pts[-1],
                        first_world=ws[0],last_world=ws[-1])
                assert ch['all_inside'] and ch['valid_l0_heights']==len(pts)
                assert pts[0]==body['start'] and pts[-1]==body['goal']
                checks.append(ch)
            response['routes']=checks
        route_checks.append(dict(endpoint=endpoint,request=body,**response))
    sim_http=fetch('http://127.0.0.1:8001/sim/data/tiles/manifest.json')
    if 'json' in sim_http and sim_http['json'] is not None:
        sim_http['matches_disk']=sim_http.pop('json')==m
    inputs={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in source_paths}
    result=dict(inputs_sha256=inputs,locations=locations,science_stop_count=len(stops),
        baseline_edge=stats(direct,values),baseline_cell_center=stats(centered,values),
        fit=dict(search='[-32,+32] px step 2, +/-2 px step 0.2, +/-0.2 px step 0.02; centered RMSE objective; 512 train / 512 holdout',
            dx_px=float(shift[0]),dy_px=float(shift[1]),dx_projected_m=float(shift[0]*g['res_m']),dy_south_m=float(shift[1]*g['res_m']),
            sim_minus_planner_vertical_m=vertical,all=stats(fit,values),train=stats(fit[train],values[train]),holdout=stats(fit[hold],values[hold]),
            holdout_after_train_vertical_correction=stats(fit[hold]-vertical,values[hold])),
        tests=dict(js=js,max_python_js_error=max_pyjs,source_inputs_unchanged_during_run=inputs==before_hashes,
                   python_assertions='PASS: dimensions, bounds, >=200 valid, finite guard, known NW, asymmetric tile interpolation, border and NoData'),
        api_grid=api,api_route_tests=route_checks,sim_http_manifest=sim_http,tile_files_read=len(tiles.used))
    # No arbitrary output parameter: every artifact stays inside authorized delivery directory.
    (out/'test_results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    lines=['column,row,planner_m,sim_edge_m,sim_center_m,sim_fitted_m,edge_delta_m']
    for p,a,b,d,e in zip(points,values,direct,centered,fit):
        lines.append(','.join(map(str,[*p,a,b,d,e,b-a])))
    (out/'height_samples.csv').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    log=json.dumps({k:result[k] for k in ('science_stop_count','baseline_edge','baseline_cell_center','fit','tests','api_grid','api_route_tests','sim_http_manifest','tile_files_read')},ensure_ascii=False,indent=2)
    (out/'test_output.txt').write_text(log+'\n',encoding='utf-8')
    print(log)


if __name__=='__main__': main()
