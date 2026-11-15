"""Local integrity/render-difference checks; writes only this delivery directory."""
import pathlib,json,hashlib
from PIL import Image,ImageChops,ImageStat
D=pathlib.Path(__file__).resolve().parent
m=json.loads((D/'textures_manifest.json').read_text(encoding='utf-8'))
checks=[];attribution=['PBR TEXTURE ATTRIBUTION — accessed/downloaded 2026-11-14 UTC',
 'All bundled texture pixels are unmodified Poly Haven assets, CC0-1.0.',
 'License: https://polyhaven.com/license',
 'Source location: Asset License, first licensing paragraph.',
 'Exact quote: "Our assets are all licensed as CC0"',
 'CC0 deed: https://creativecommons.org/publicdomain/zero/1.0/',
 'Credit is voluntary; retained here for traceability.',
 'Earth materials are visual proxies, NOT measured/calibrated Mars surface data.',
 'API provenance: https://api.polyhaven.com/files/{asset_id} and /info/{asset_id}',
 'SHA-256 identifies the downloaded JPEG bytes. Full URLs are in textures_manifest.json.','']
hashes=[]
for a in m['assets']:
 total=0
 attribution+=['Asset: '+a['id'],'Authors: '+', '.join(a['authors']),a['source_url'],
  'License: CC0-1.0; accessed 2026-11-14; downloaded '+m['downloaded_utc']]
 for f in a['files']:
  p=D/f['path'];data=p.read_bytes();sha=hashlib.sha256(data).hexdigest()
  assert sha==f['sha256'] and len(data)==f['bytes'],p
  with Image.open(p) as im:assert im.size==(1024,1024);im.verify()
  total+=len(data);hashes.append(sha+'  '+f['path'])
  attribution.append('  '+f['channel']+' | '+f['path']+' | SHA-256 '+sha)
 assert total<=6_000_000
 checks.append({'asset':a['id'],'verified_files':len(a['files']),'bytes':total,'passed':True})
 attribution.append('')
assert sum(c['bytes'] for c in checks)==m['total_bytes']<=30_000_000
(D/'ATTRIBUTION.txt').write_text('\n'.join(attribution)+'\n',encoding='utf-8')
(D/'SHA256SUMS.txt').write_text('\n'.join(hashes)+'\n',encoding='utf-8')
diffs=[]
for shape in ['flat','wavy']:
 before=Image.open(D/'screenshots'/f'{shape}_before.png').convert('RGB')
 after=Image.open(D/'screenshots'/f'{shape}_after.png').convert('RGB')
 assert before.size==after.size==(1100,720)
 # Exclude HUD and sky; compare the same geometry/lighting/camera at the near ground.
 region=(0,430,1100,720)
 diff=ImageChops.difference(before.crop(region),after.crop(region))
 mae=sum(ImageStat.Stat(diff).mean)/3
 pixels=diff.get_flattened_data() if hasattr(diff,'get_flattened_data') else diff.getdata()
 changed=sum(1 for rgb in pixels if max(rgb)>5)/(1100*290)
 assert mae>1 and changed>.1,(shape,mae,changed)
 diffs.append({'shape':shape,'region':list(region),'mean_absolute_channel_difference_0_255':mae,
  'fraction_pixels_with_any_channel_difference_gt5':changed,'passed':True})
browser=json.loads((D/'test_results.json').read_text(encoding='utf-8'))
assert browser['passed'] and len(browser['cases'])==14
out={'date':'2026-11-14','texture_checks':checks,'total_bytes':m['total_bytes'],
 'render_difference_checks':diffs,'browser_cases':len(browser['cases']),'passed':True}
(D/'verification.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print(json.dumps(out,indent=2))
