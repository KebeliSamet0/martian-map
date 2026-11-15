const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const source=fs.readFileSync(path.join(__dirname,'terrain_patch.glsl.js'),'utf8');
 const {cavityFromGrid}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const n=9,flat=new Float32Array(n*n).fill(2),ramp=new Float32Array(n*n);
 for(let z=0;z<n;z++)for(let x=0;x<n;x++)ramp[z*n+x]=2*x+z;
 assert(cavityFromGrid(flat,n,n).every(x=>x===0));
 assert(cavityFromGrid(ramp,n,n).every(x=>x===0));
 const pit=new Float32Array(flat);pit[4*n+4]=1;
 assert.equal(cavityFromGrid(pit,n,n)[4*n+4],1);
 pit[4*n+6]=-9999;
 assert.equal(cavityFromGrid(pit,n,n,{noData:-9999})[4*n+4],0);
 pit[4*n+6]=NaN;
 assert.equal(cavityFromGrid(pit,n,n)[4*n+4],0);
 const out={passed:true,cases:['flat stays bright','linear slope stays bright','pit darkens','NoData excludes pit','NaN excludes pit']};
 fs.writeFileSync(path.join(__dirname,'cavity_test_results.json'),JSON.stringify(out,null,2));
 console.log(JSON.stringify(out));
})().catch(e=>{console.error(e);process.exitCode=1;});
