# S1 balanced duyarl?l?k analizi ? k?smi, ?l??lm?? teslim (2026-11-15)

**Sonu?:** A, B ve C ba?ar?yla ko?uldu; ??? de GO ve walkback_ok=true. B ayn? yolu korudu; C farkl? h?crelerden ge?en bir yol se?ti. Bu sonu? insan EVA g?venli?i do?rulamas? de?ildir. Yaln?z a?a??daki commitin yaz?l?m modeli ?l??ld?.

## S?r?m ve s?n?rlamalar (2026-11-15)

?l??len yerel checkout commit SHA: `42f60aaf5cbebda49026ebd9ccfaf7818e86c915`; kaynak: `C:\Users\Batu\Desktop\mm-pr\martian-map`. api/, layers/, contracts/, docs/ TEMP kopyas?: `C:\Users\Batu\AppData\Local\Temp\mm-duyarlilik-eca9_a2z\reduced_repo`. Orijinal repo ve TEMP kopyas?ndaki 100 dosyan?n SHA-256 de?erleri ko?u ?ncesi/sonras? ayn?: PASS. `git diff --name-only HEAD -- api layers contracts docs` de?i?mi? izlenen dosya listelemedi; global ignore dosyas? i?in permission warning verdi. Git deposunda de?i?iklik yap?lmad?.

**G?ncel main ko?ulmad?:** salt okunur `git ls-remote origin refs/heads/main` uzak main SHA de?erini `6864c6c548dd0196411a13178de9a79463580531` olarak d?nd?rd?. Dolay?s?yla A, uzak main?in bug?nk? de?erleri diye sunulmuyor. G?ncel ZIP haz?rlama giri?imi ?u hatayla durdu: `C:\Users\Batu\miniconda3\python.exe: can't open file 'C:\\Users\\Batu\\AppData\\Local\\Temp\\mm-duyarlilik-eca9_a2z\\experiment.py': [Errno 13] Permission denied`. ?nce sandbox i?inden GitHub ba?lant?s? da `Failed to connect to github.com port 443` verdi; izinli salt okunur tekrar SHA?y? alabildi. Tam ko?uyu beklemeden mevcut ?al??an kopyada k?smi teslim yap?ld?; uzak main ?zerindeki sonu?lar **?l??lmedi**.

Kaynaklar: [api/planner/params.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/params.py), [api/planner/cost.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/cost.py), [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py), [api/planner/layers.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/layers.py), [api/planner/terrain.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/terrain.py), [layers/demo_scenarios.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/layers/demo_scenarios.json), [contracts/grid.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/contracts/grid.json), [docs/eva_parameters.md](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/docs/eva_parameters.md), [docs/metabolic_model.md](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/docs/metabolic_model.md). Ara?t?rma ba?lam?: [gercek_parametre_arastirmasi.md](gercek_parametre_arastirmasi.md). B de?erleri bu g?revde istenen deney girdileridir; her birinin Mars operasyonuna bilimsel olarak onayland??? **do?rulanmad?**.

## Deney tan?m? (2026-11-15)

S1 ba?lang?? px=[433,525], hedef px=[491,774]; px=[s?tun,sat?r]. Ger?ek 1000?1000, 2 m katmanlar; synthetic=false, provisional_terrain=false test edildi. Kaynak: [layers/demo_scenarios.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/layers/demo_scenarios.json) ve [contracts/grid.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/contracts/grid.json). `planner.plan_one(..., kind="balanced")` do?rudan ?a?r?ld?; HTTP/FastAPI sunucusu kurulmad?. A??rl?klar t=1, k=12, r=22. Her set ayr? Python s?recinde; mod?l sabitleri yaln?z bellekte de?i?tirildi. `cost.CALIBRATION` import an?nda hesapland??? i?in `importlib.reload(cost)` uyguland?; b?ylece eski kalibrasyonun kalmas? ?nlendi. Kaynak: [api/planner/cost.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/cost.py) ve [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py).

| Parametre | A | B | C |
|---|---:|---:|---:|
| BODY_KG | 80.0 | 82.0 | 82.0 |
| SUIT_KG | 120.0 | 104.0 | 104.0 |
| TOOLS_KG | 10.0 | 23.0 | 23.0 |
| BASE_SPEED_MS | 0.8 | 0.75 | 0.75 |
| EVA_MAX_H | 6.0 | 7.0 | 7.0 |
| EVA_MAX_KCAL | 2000.0 | 1800.0 | 1800.0 |
| EVA_MAX_O2_L | 420.0 | 370.0 | 370.0 |
| FLAT_REFERENCE_W | 272.0 | 272.0 | 352.0 |
| STOP_METABOLIC_W | 272.0 | 272.0 | 272.0 |

C yaln?z g?revde belirtilen `FLAT_REFERENCE_W` de?erini de?i?tirir. `STOP_METABOLIC_W` ayr? bir mod?l sabitidir ve ?? sette 272 W korunmu?tur: g?revde durak g?c? de?i?ikli?i istenmedi?i i?in yap?lan a??k varsay?m. C?de durak g?c?n? de 352 W yapmak ayr? deneydir, **ko?ulmad?**. Zemin ?/h?z katsay?lar? sabit; bilim 30 dk, rezerv 30 dk, doz 8.75 ?Gy/sa, doz b?t?esi 60 ?Gy. Kaynak: [api/planner/params.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/params.py) ve [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py).

## ?stenen API toplamlar? (2026-11-15)

A?a??daki tablo `plan_one` ??kt?s?ndaki `total` alan?n? aynen kullan?r. **km/dk/kcal tek y?n y?r?y??t?r; O? iki y?n y?r?y??t?r; dose iki y?n y?r?y?? + 30 dk bilimdir.** Rezerv bu ?zet alanlarda yoktur. Bu alanlar?n kapsamlar? ayn? de?ildir; GO karar? alttaki daha geni? b?t?eye dayan?r. Kaynak: [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py) `_budget`.

| Set | km | dk | kcal | O? L | dose ?Gy | Durum | walkback_ok | Limit a??m? m |
|---|---:|---:|---:|---:|---:|---|---|---|
| A | 0.57 | 18.7 | 88.0 | 37.0 | 9.8 | GO | True | None |
| B | 0.57 | 19.9 | 94.0 | 39.0 | 10.2 | GO | True | None |
| C | 0.57 | 19.9 | 122.0 | 51.0 | 10.2 | GO | True | None |

## A?ya g?re fark ? yay?mlanan total alanlar? (2026-11-15)

Form?l: 100 ? (set / A ? 1). API bu alanlar? yuvarlad??? i?in y?zdeler de yuvarlanm?? de?erlerden t?retilmi?tir; e?it g?r?nen km veya dk ger?ek uzunluk/s?renin birebir e?itli?i anlam?na gelmez.

| Set | km ?% | dk ?% | kcal ?% | O? ?% | dose ?% | GO de?i?imi |
|---|---:|---:|---:|---:|---:|---|
| A | +0.000 | +0.000 | +0.000 | +0.000 | +0.000 | yok |
| B | +0.000 | +6.417 | +6.818 | +5.405 | +4.082 | yok |
| C | +0.000 | +6.417 | +38.636 | +37.838 | +4.082 | yok |

## Karar b?t?esi ve daha hassas kar??la?t?rma (2026-11-15)

`budget.used`: iki y?n y?r?y?? + bilim + rezerv; kcal/O? durak ve rezerv metabolizmas?n? da i?erir. `walkback_ok` yaln?z zaman b?t?esini kontrol eder; t?m kaynaklar?n g?venlik onay? de?ildir. `status` b?t?e a??m?na, `go` ayr?ca 25? h?cre e?i?ine bakar; bu ko?ularda ikisi de olumlu. Kaynak: [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py).

| Set | Tek y?n dk (return_min) | Tek y?n kcal (return_kcal) | Taahh?t dk | Taahh?t kcal | Taahh?t O? L | Taahh?t dose ?Gy |
|---|---:|---:|---:|---:|---:|---:|
| A | 18.666 | 87.908 | 97.331 | 409.85 | 85.385 | 14.194 |
| B | 19.91 | 94.256 | 99.82 | 422.547 | 88.031 | 14.557 |
| C | 19.857 | 121.736 | 99.715 | 477.506 | 99.48 | 14.542 |

| Set | Taahh?t dk ?% | Taahh?t kcal ?% | Taahh?t O? ?% | Taahh?t dose ?% |
|---|---:|---:|---:|---:|
| A | +0.000 | +0.000 | +0.000 | +0.000 |
| B | +2.557 | +3.098 | +3.099 | +2.557 |
| C | +2.449 | +16.508 | +16.508 | +2.452 |

B: zaman limiti 420 dk, enerji 1800 kcal, O? 370 L; C ayn? limitler. Her setin exceeded listesi bo?, ilk a??m konumu null, maksimum rota h?cre e?imi 22.9?. GO?NO-GO de?i?imi **yok**; bu k?sa S1 i?in ge?erlidir. K?tle/h?z/b?t?e B?de beraber de?i?ti?inden tek tek parametre duyarl?l?k s?ralamas? ??kar?lamaz. C?B yaln?z y?r?y?? referans g?c?n?n etkisini ve yeniden optimize edilmi? yol de?i?imini birlikte g?sterir; sabit yolda izole etki **?l??lmedi**. Mars biyofizi?inin do?rulu?u **do?rulanmad?**.

## Testler, s?r?mler ve komutlar (2026-11-15)

Python 3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]; NumPy 2.5.4; SciPy 1.18.1; scikit-image 0.26.0. Var olan `C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe` kullan?ld?; paket kurulmad?.

```powershell
python -B C:/Users/Batu/AppData/Local/Temp/mm-duyarlilik-eca9_a2z/reduced.py
git -C C:/Users/Batu/Desktop/mm-pr/martian-map ls-remote origin refs/heads/main
git -C C:/Users/Batu/Desktop/mm-pr/martian-map diff --name-only HEAD -- api layers contracts docs
```

?l??len test ??kt?s?:
```text
A exit=0; PASS: real layers, flat calibration, walkback time, status
B exit=0; PASS: real layers, flat calibration, walkback time, status
C exit=0; PASS: real layers, flat calibration, walkback time, status
PASS: all source and TEMP copy hashes unchanged
```

| Set | D?z zemin kontrol W | Kalibrasyon | Yol h?cresi | Yol SHA-256 |
|---|---:|---:|---:|---|
| A | 272.0 | 0.44179254453970973 | 254 | `3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7` |
| B | 272.0 | 0.4781289526551205 | 254 | `3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7` |
| C | 351.99999999999994 | 0.6187551152007441 | 252 | `a8d4db9a25f53e97d9a4d5e4713d5ae942136c1c1792d9d4013115777f3799d4` |

A/B yol SHA e?it, C farkl?. Toplam alanlar? i?in tam ham ??kt?lar a?a??dad?r. T?m girdilerin SHA-256 listesi TEMP `reduced_snapshot.json` i?inde tutuldu; rapora hesap a??s?ndan temel olanlar?n hashleri eklendi.

- `api/planner/comparison.py`: `cd0d683650622ab81ab9242230dfa35d6856e89a694d229c6d364e877cb3eed6`
- `api/planner/cost.py`: `e13ee05e8e3fccf61bc028f23a077b436d868268bd4cdba6522a5fbf708e2459`
- `api/planner/layers.py`: `27714668c260bd27cbb9d8794e7422dda8fcabb6351d43981232b800c0772c03`
- `api/planner/params.py`: `8da695bd9e2daef18335423a11812691e5f95e01e051d54c98f1f2882c808913`
- `api/planner/route.py`: `fed331ba02c14defb765f319a6caf2a05d7bd8000faff5d06edc641c10a6d179`
- `api/planner/terrain.py`: `d2bf98bff60c6266c0e0b3d2151b95f2fc1f08327a986bf9006d3ee6160c346b`
- `api/planner/__init__.py`: `f3477b27e6f0db6f85974b565ba81ea21d04211e63dd653505430eea8510c027`
- `layers/demo_scenarios.json`: `fdb83a0aa3b39f3068aa01f84bebdb9d526eb92c75538c6cd9df5a7c0c0faf27`
- `layers/elevation.npy`: `fc8b8bebd41bf4847a7a3323e9b4a5cae289cfb152ec1a0193f0d1e9633de048`
- `layers/entropy.npy`: `cad1579f723deba8b0175981377f26a4319a4dc492e2b1fa9d8e20a7153bdb05`
- `layers/p_bedrock.npy`: `70e30fae6f8f92bb0afab724f3085609a97dab6d6280069f16b7daa5a90e22c5`
- `layers/p_bigrock.npy`: `e5163cd0794c16035c99e7a6c97bc571c4e0cbb9aa18d59cc1b5ac4827b1bf2e`
- `layers/p_sand.npy`: `6a85435a6a79c8cabc9e76e55208cd53a5a5b3b6e0fdbc02c5d800a3ffb7ee08`
- `layers/p_soil.npy`: `44abb46c8efa30a6ed7ec1de35dae3380423e899fffa13307e3e37468583db90`
- `layers/rock_cfa.npy`: `7f98358f2a326f640d19dbcad8065b0804efb012950e28e95fce3c34cd30431f`
- `layers/slope.npy`: `19de036a5f008c9de0f04c77e84b02a85b17d7193c0c500ffc946edfca195779`
- `contracts/grid.example.json`: `74e2aea1ad800f422801e2aa343a876d6046dd0ab6c6bc5609d8100907af4466`
- `contracts/grid.json`: `0d8d8351c687157c6bcfb361a11bdd2d4637c20121926abf1ebc1a98f9157993`
- `contracts/route.example.json`: `ffcb4b31e9a4cf0d45cce81548fcee412aa7c1742ee1f548b94936217fe307b4`
- `contracts/rover_stops.example.json`: `aea27d781bec6d0810d2aa35bd830e958fc569007a3c7010ac47c1f1d1e3c1fa`
- `docs/metabolic_model.md`: `b5961199cc7e68b6a05938d764253a4fd7dc2df1921188a3a44ece1f6f5dee94`

## Ko?ulmayanlar (2026-11-15)

S2/S3 **ko?ulmad?**: kullan?c? kapsam? S1?e daraltt?. D / ??%20 **ko?ulmad?**: daralt?lm?? g?rev d???nda. shortest/safest **ko?ulmad?**: yaln?z balanced istendi. Tam tornado s?ralamas? **hesaplanmad?**: bireysel parametre taramas? yok. Uzak main commitinde tekrar **ko?ulmad?**: indirme/kurulum giri?imindeki eri?im hatas? yukar?da aynen kaydedildi. Bu eksiklerden sonu? t?retilmedi.

## Tekrar ?retim kodu (2026-11-15)

A?a??daki kod ger?ekten ?al??t?r?ld?; yaln?z TEMP kopyas?na ve TEMP ??kt?lar?na yazar. Rapor ?retimi ayr?ca yaln?z bu Markdown dosyas?n? yazd?.

```python
import sys,os,json,shutil,hashlib,subprocess,time,importlib,platform,traceback
from pathlib import Path
sys.dont_write_bytecode=True
W=Path(__file__).resolve().parent
SRC=Path('C:/Users/Batu/Desktop/mm-pr/martian-map')
ROOT=W/'reduced_repo'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
if len(sys.argv)>1:
    case=sys.argv[1];sys.path.insert(0,str(ROOT))
    os.environ['MM_LAYERS_DIR']=str(ROOT)
    os.environ['MARTIAN_ROCK_BLOCK']='0'
    import numpy as np
    from api import planner
    from api.planner import params as P,cost
    if case!='A':
        for k,v in dict(BODY_KG=82.,SUIT_KG=104.,TOOLS_KG=23.,BASE_SPEED_MS=.75,EVA_MAX_H=7.,EVA_MAX_KCAL=1800.,EVA_MAX_O2_L=370.).items():setattr(P,k,v)
    if case=='C':P.FLAT_REFERENCE_W=352.
    # STOP_METABOLIC_W is a separate stored constant; leave unchanged by literal scope.
    importlib.reload(cost)
    L=planner.load(ROOT)
    assert not L.synthetic and not L.provisional_terrain
    s=next(x for x in json.loads((ROOT/'layers/demo_scenarios.json').read_text(encoding='utf-8'))['scenarios'] if x['id']=='S1')
    t=time.perf_counter();r=planner.plan_one(L,s['start']['px'],s['goal']['px'],kind='balanced')
    flat=float(cost.metabolic_w(np.array(P.BASE_SPEED_MS),np.array(0.),np.array(P.TERRAIN_ETA['bedrock'])))
    assert abs(flat-P.FLAT_REFERENCE_W)<1e-8
    total=r['total'];assert total['walkback_ok']==(total['budget']['used']['time_min']<=total['budget']['limits']['time_min'])
    assert total['status']==('NO-GO' if total['limit_exceeded_at_index'] is not None else 'GO')
    keys=['BODY_KG','SUIT_KG','TOOLS_KG','BASE_SPEED_MS','EVA_MAX_H','EVA_MAX_KCAL','EVA_MAX_O2_L','FLAT_REFERENCE_W','STOP_METABOLIC_W','TERRAIN_ETA','TERRAIN_SPEED','DOSE_UGY_PER_H','SCIENCE_STOP_MIN','RESERVE_MIN']
    import scipy,skimage
    out=dict(case=case,total=total,weights=r['weights'],params={k:getattr(P,k) for k in keys},calibration=cost.CALIBRATION,flat_check_W=flat,path_sha256=hashlib.sha256(r['_path'].tobytes()).hexdigest(),path_cells=len(r['_path']),seconds=time.perf_counter()-t,start=s['start']['px'],goal=s['goal']['px'],versions=dict(python=sys.version,numpy=np.__version__,scipy=scipy.__version__,skimage=skimage.__version__),tests='PASS: real layers, flat calibration, walkback time, status')
    (W/(case+'_reduced.json')).write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(out,ensure_ascii=True));sys.exit()
ROOT.mkdir(exist_ok=True)
for folder in ['api','layers','contracts','docs']:
    shutil.copytree(SRC/folder,ROOT/folder,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__'))
hashes={p.relative_to(SRC).as_posix():digest(p) for f in ['api','layers','contracts','docs'] for p in (SRC/f).rglob('*') if p.is_file() and '__pycache__' not in p.parts}
meta=dict(sha=subprocess.check_output(['git','-C',str(SRC),'rev-parse','HEAD'],text=True).strip(),source=str(SRC),root=str(ROOT),hashes=hashes)
(W/'reduced_snapshot.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
py='C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe'
for case in ['A','B','C']:
    p=subprocess.run([py,'-B',str(__file__),case],capture_output=True,text=True,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'},timeout=180)
    (W/(case+'_reduced.log')).write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
    print(case,p.returncode,p.stdout[-500:],p.stderr[-1500:],flush=True)
assert all(digest(SRC/k)==v for k,v in hashes.items()),'Source changed'
assert all(digest(ROOT/k)==v for k,v in hashes.items()),'Copy changed'
print('PASS: all source and TEMP copy hashes unchanged',flush=True)

```

## Ham ?l??mler (2026-11-15)

```json
[
  {
    "case": "A",
    "total": {
      "km": 0.57,
      "min": 18.7,
      "eva_min": 67.3,
      "eva_limit_min": 360.0,
      "kcal": 88.0,
      "eva_kcal": 176.0,
      "o2_L": 37.0,
      "dose_uGy": 9.8,
      "slope_max": 22.9,
      "low_conf_m": 0,
      "walkback_ok": true,
      "limit_exceeded_at_m": null,
      "go": true,
      "status": "GO",
      "limit_exceeded_at_px": null,
      "limit_exceeded_at_index": null,
      "budget": {
        "limits": {
          "time_min": 360.0,
          "kcal": 2000.0,
          "o2_L": 420.0,
          "dose_uGy": 60.0,
          "reserve_min": 30.0
        },
        "used": {
          "time_min": 97.331,
          "kcal": 409.85,
          "o2_L": 85.385,
          "dose_uGy": 14.194
        },
        "exceeded": [],
        "first_exceeded": [],
        "return_min": 18.666,
        "return_kcal": 87.908
      }
    },
    "weights": {
      "t": 1.0,
      "k": 12.0,
      "r": 22.0
    },
    "params": {
      "BODY_KG": 80.0,
      "SUIT_KG": 120.0,
      "TOOLS_KG": 10.0,
      "BASE_SPEED_MS": 0.8,
      "EVA_MAX_H": 6.0,
      "EVA_MAX_KCAL": 2000.0,
      "EVA_MAX_O2_L": 420.0,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "TERRAIN_ETA": {
        "bedrock": 1.0,
        "soil": 1.2,
        "sand": 2.1,
        "bigrock": 1.5
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "DOSE_UGY_PER_H": 8.75,
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0
    },
    "calibration": 0.44179254453970973,
    "flat_check_W": 272.0,
    "path_sha256": "3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7",
    "path_cells": 254,
    "seconds": 0.19336350000230595,
    "start": [
      433,
      525
    ],
    "goal": [
      491,
      774
    ],
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "tests": "PASS: real layers, flat calibration, walkback time, status"
  },
  {
    "case": "B",
    "total": {
      "km": 0.57,
      "min": 19.9,
      "eva_min": 69.8,
      "eva_limit_min": 420.0,
      "kcal": 94.0,
      "eva_kcal": 189.0,
      "o2_L": 39.0,
      "dose_uGy": 10.2,
      "slope_max": 22.9,
      "low_conf_m": 0,
      "walkback_ok": true,
      "limit_exceeded_at_m": null,
      "go": true,
      "status": "GO",
      "limit_exceeded_at_px": null,
      "limit_exceeded_at_index": null,
      "budget": {
        "limits": {
          "time_min": 420.0,
          "kcal": 1800.0,
          "o2_L": 370.0,
          "dose_uGy": 60.0,
          "reserve_min": 30.0
        },
        "used": {
          "time_min": 99.82,
          "kcal": 422.547,
          "o2_L": 88.031,
          "dose_uGy": 14.557
        },
        "exceeded": [],
        "first_exceeded": [],
        "return_min": 19.91,
        "return_kcal": 94.256
      }
    },
    "weights": {
      "t": 1.0,
      "k": 12.0,
      "r": 22.0
    },
    "params": {
      "BODY_KG": 82.0,
      "SUIT_KG": 104.0,
      "TOOLS_KG": 23.0,
      "BASE_SPEED_MS": 0.75,
      "EVA_MAX_H": 7.0,
      "EVA_MAX_KCAL": 1800.0,
      "EVA_MAX_O2_L": 370.0,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "TERRAIN_ETA": {
        "bedrock": 1.0,
        "soil": 1.2,
        "sand": 2.1,
        "bigrock": 1.5
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "DOSE_UGY_PER_H": 8.75,
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0
    },
    "calibration": 0.4781289526551205,
    "flat_check_W": 272.0,
    "path_sha256": "3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7",
    "path_cells": 254,
    "seconds": 0.1614069999923231,
    "start": [
      433,
      525
    ],
    "goal": [
      491,
      774
    ],
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "tests": "PASS: real layers, flat calibration, walkback time, status"
  },
  {
    "case": "C",
    "total": {
      "km": 0.57,
      "min": 19.9,
      "eva_min": 69.7,
      "eva_limit_min": 420.0,
      "kcal": 122.0,
      "eva_kcal": 243.0,
      "o2_L": 51.0,
      "dose_uGy": 10.2,
      "slope_max": 22.9,
      "low_conf_m": 0,
      "walkback_ok": true,
      "limit_exceeded_at_m": null,
      "go": true,
      "status": "GO",
      "limit_exceeded_at_px": null,
      "limit_exceeded_at_index": null,
      "budget": {
        "limits": {
          "time_min": 420.0,
          "kcal": 1800.0,
          "o2_L": 370.0,
          "dose_uGy": 60.0,
          "reserve_min": 30.0
        },
        "used": {
          "time_min": 99.715,
          "kcal": 477.506,
          "o2_L": 99.48,
          "dose_uGy": 14.542
        },
        "exceeded": [],
        "first_exceeded": [],
        "return_min": 19.857,
        "return_kcal": 121.736
      }
    },
    "weights": {
      "t": 1.0,
      "k": 12.0,
      "r": 22.0
    },
    "params": {
      "BODY_KG": 82.0,
      "SUIT_KG": 104.0,
      "TOOLS_KG": 23.0,
      "BASE_SPEED_MS": 0.75,
      "EVA_MAX_H": 7.0,
      "EVA_MAX_KCAL": 1800.0,
      "EVA_MAX_O2_L": 370.0,
      "FLAT_REFERENCE_W": 352.0,
      "STOP_METABOLIC_W": 272.0,
      "TERRAIN_ETA": {
        "bedrock": 1.0,
        "soil": 1.2,
        "sand": 2.1,
        "bigrock": 1.5
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "DOSE_UGY_PER_H": 8.75,
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0
    },
    "calibration": 0.6187551152007441,
    "flat_check_W": 351.99999999999994,
    "path_sha256": "a8d4db9a25f53e97d9a4d5e4713d5ae942136c1c1792d9d4013115777f3799d4",
    "path_cells": 252,
    "seconds": 0.16845219999959227,
    "start": [
      433,
      525
    ],
    "goal": [
      491,
      774
    ],
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "tests": "PASS: real layers, flat calibration, walkback time, status"
  }
]
```
