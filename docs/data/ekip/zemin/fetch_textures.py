"""Only writes below this research delivery folder. No sim/runtime mutations."""
import concurrent.futures,hashlib,json,pathlib,requests,datetime
D=pathlib.Path(__file__).resolve().parent
ASSETS=['terrain_red_01','sand_03','rock_face_03','dry_ground_01']
S=requests.Session();S.headers['User-Agent']='MartianMapResearch/1.0 (offline CC0 material study)'
def get_meta(asset):
 r=S.get('https://api.polyhaven.com/files/'+asset,timeout=45);r.raise_for_status();d=r.json()
 (D/(asset+'_files.json')).write_text(json.dumps(d,indent=2),encoding='utf-8')
 print(asset,[(k,list(v.get('1k',{}))) for k,v in d.items() if isinstance(v,dict)],flush=True)
 return asset,d
if __name__=='__main__':
 D.mkdir(parents=True,exist_ok=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:meta=dict(pool.map(get_meta,ASSETS))
 from PIL import Image
 now=datetime.datetime.now(datetime.timezone.utc).isoformat()
 license_url='https://polyhaven.com/license'
 lic=S.get(license_url,timeout=45);lic.raise_for_status()
 from html.parser import HTMLParser
 class Text(HTMLParser):
  def __init__(self):super().__init__();self.parts=[]
  def handle_data(self,text):self.parts.append(text)
 text=Text();text.feed(lic.text)
 assert 'Our assets are all licensed as CC0' in ' '.join(' '.join(text.parts).split())
 manifest={'downloaded_utc':now,'license':'CC0-1.0','license_url':license_url,
  'license_quote':'Our assets are all licensed as CC0','license_page_sha256':hashlib.sha256(lic.content).hexdigest(),'assets':[]}
 for asset,d in meta.items():
  info_url='https://api.polyhaven.com/info/'+asset
  info_response=S.get(info_url,timeout=45);info_response.raise_for_status();info=info_response.json()
  (D/(asset+'_info.json')).write_text(json.dumps(info,indent=2),encoding='utf-8')
  row={'id':asset,'source_url':'https://polyhaven.com/a/'+asset,'info_url':info_url,
       'authors':info.get('authors'),'dimensions_mm':info.get('dimensions'),'files':[]}
  dest=D/'textures'/asset;dest.mkdir(parents=True,exist_ok=True)
  for channel in ['Diffuse','nor_gl','Rough','AO','arm']:
   choice=d[channel]['1k']['jpg'];url=choice['url'];target=dest/url.rsplit('/',1)[-1]
   if not target.exists():
    response=S.get(url,timeout=90);response.raise_for_status();target.write_bytes(response.content)
   data=target.read_bytes()
   assert len(data)==choice['size'],(target,len(data),choice['size'])
   assert hashlib.md5(data).hexdigest()==choice['md5'],target
   with Image.open(target) as image:
    assert image.size==(1024,1024),(target,image.size)
    image.verify()
   row['files'].append({'channel':channel,'path':target.relative_to(D).as_posix(),
     'url':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),
     'downloaded_utc':now,'dimensions':[1024,1024],'format':'JPEG','verified':True})
  row['bytes']=sum(x['bytes'] for x in row['files']);assert row['bytes']<=6_000_000,row
  manifest['assets'].append(row);print(asset,row['bytes'],flush=True)
 manifest['total_bytes']=sum(x['bytes'] for x in manifest['assets'])
 assert manifest['total_bytes']<=30_000_000
 (D/'textures_manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
 print('TOTAL',manifest['total_bytes'],flush=True)
