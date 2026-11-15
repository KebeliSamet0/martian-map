/* node docs/data/ekip/zemin/run_test.cjs ; no application server or sim mutation. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {createRequire}=require('node:module');
const D=__dirname,root=path.resolve(D,'../../../..');
const {chromium}=createRequire(path.join(root,'sim/package.json'))('playwright-core');
const testBase='/docs/data/ekip/zemin/';
const output=path.join(D,'screenshots'),profile=path.join(D,'_chrome_profile'),temp=path.join(D,'_chrome_tmp');
for(const p of [output,profile,temp])fs.mkdirSync(p,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
const errors=[],warnings=[],requests=[],cases=[];
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),pathname=decodeURIComponent(url.pathname);
  const file=path.resolve(root,'.'+pathname);
  const allowed=(pathname.startsWith(testBase)&&file.startsWith(D+path.sep)) || pathname==='/sim/lib/three.module.js';
  if(!allowed){res.writeHead(403);res.end('forbidden');return;}
  try{const data=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);}
  catch(e){res.writeHead(404);res.end('not found');}
});
let context;
(async()=>{
 await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',resolve).once('error',reject));
 const origin=`http://127.0.0.1:${server.address().port}`;
 context=await chromium.launchPersistentContext(profile,{
   executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,
   viewport:{width:1100,height:720},deviceScaleFactor:1,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-shader-disk-cache',
      '--disk-cache-dir='+path.join(profile,'cache'),'--no-first-run'],
   env:{...process.env,TEMP:temp,TMP:temp},downloadsPath:path.join(temp,'downloads'),timeout:60000});
 const page=await context.newPage();
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());if(msg.type()==='warning')warnings.push(msg.text());});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',req=>requests.push({url:req.url(),error:req.failure()?.errorText}));
 page.on('response',res=>{if(res.status()>=400)requests.push({url:res.url(),status:res.status()});});
 async function run(name,params,shot=false,view=null){
   const started=Date.now();
   await page.goto(origin+testBase+'test.html?'+new URLSearchParams(params),{waitUntil:'networkidle',timeout:90000});
   await page.waitForFunction(()=>window.__ready===true,{timeout:90000});
   if(view)await page.evaluate(v=>window.__setView(v.position,v.target),view);
   const stats=await page.evaluate(()=>window.__stats());
   if(shot)await page.screenshot({path:path.join(output,name+'.png')});
   cases.push({name,params,...stats,elapsed_ms:Date.now()-started,screenshot:shot?'screenshots/'+name+'.png':null});
   if(stats.glError!==0||stats.failedPrograms!==0)errors.push(name+': GL or program failure');
   console.log(name,JSON.stringify(stats));
 }
 for(const shape of ['flat','wavy'])for(const mode of ['before','after','regular'])
   await run(shape+'_'+mode,{shape,mode},true);
 for(const asset of ['sand_03','rock_face_03','dry_ground_01'])
   await run(asset+'_after',{asset,shape:'wavy',mode:'after'},true);
 await run('provided_varyings',{mode:'after',shape:'wavy',varyings:'provided'});
 await run('far_fade',{mode:'after',shape:'wavy',far:'1'});
 await run('three_axis_oblique',{asset:'rock_face_03',mode:'after',shape:'wavy'},true,
   {position:[6,4,4],target:[-1,.4,-5]});
 // Top view reveals tiling behaviour with fixed lighting and identical camera.
 for(const mode of ['regular','after'])await run('tiling_'+mode,{mode,shape:'flat'},true,
   {position:[0,15,-7.999],target:[0,0,-8]});
 const report={date_utc:new Date().toISOString(),chrome:context.browser()?.version()||'persistent context',
  viewport:{width:1100,height:720},engine_path:'sim/lib/three.module.js',
  command:'node docs/data/ekip/zemin/run_test.cjs',cases,console_errors:errors,
  console_warnings:warnings,failed_requests:requests,
  passed:errors.length===0&&requests.length===0&&cases.length===14};
 fs.writeFileSync(path.join(D,'test_results.json'),JSON.stringify(report,null,2));
 if(!report.passed)process.exitCode=1;
})().catch(error=>{
 console.error(error);fs.writeFileSync(path.join(D,'test_failure.txt'),String(error.stack||error));process.exitCode=1;
}).finally(async()=>{
 if(context)await context.close();await new Promise(resolve=>server.close(resolve));
 // Only browser-generated disposable directories, resolved and checked inside D.
 for(const target of [profile,temp]){
   const resolved=path.resolve(target);
   if(!resolved.startsWith(path.resolve(D)+path.sep)||!['_chrome_profile','_chrome_tmp'].includes(path.basename(resolved)))throw new Error('Unsafe cleanup target');
   fs.rmSync(resolved,{recursive:true,force:true,maxRetries:3,retryDelay:200});
 }
});
