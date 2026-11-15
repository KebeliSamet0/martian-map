# API px → sim dünya koordinatı (Sprint 2 / #49)

## Sözleşme ve kaynaklar

Bu dosya dönüşüm önerisidir; uygulamaya kurulmamıştır. Girdiler salt okunur incelendi:

- [Planlayıcı grid.json](C:/Users/Batu/Desktop/mm-pr/martian-map/contracts/grid.json): 1000×1000, `res_m=2`, `origin_xy_m=[8142276.492786024,-283815.075189438]`, küresel EQC `R=3396190`, `lat_ts=lat_0=lon_0=0`.
- [Sim Geo](../../../../sim/app/geo.js) ve [manifest](../../../../sim/data/tiles/manifest.json): dünya X doğu, Y yukarı, Z güney; doğu-batı yönünde `cos(lat0)` ölçeği; dünya başlangıcı manifest'e aittir.
- [Planlayıcı route.py](C:/Users/Batu/Desktop/mm-pr/martian-map/api/planner/route.py): segment `path_px` elemanları `[sütun,satır]` hücre indisleridir.
- [Sim Terrain](../../../../sim/app/terrain.js): `heightAt(X,Z)` dünya Y döndürür; hazır en ince döşemeden bilineer örnekler. [Sim üretici](../../../../sim/tools/build_tiles.py): L0 yüksekliği kaynak DTM örneklerinden üretir, `q=0` geçersizdir.

## Formül

`px=[c,r]`. Önce semantiği seçin:

- **Sürekli grid koordinatı / durak `px` / grid kenarı:** `δ=0`. Ondalıklı science-stop koordinatları ve sınırlar bu sınıftadır.
- **API'nin tam sayı hücre indisinden hücre merkezine yerleştirme:** `δ=0.5`. Bu, tam sayı `[c,r]` için örnekleme/yerleştirme tercihidir; sözleşmenin başlangıcını değiştirmez. Mevcut API `px_note` hücre merkezini açıkça tarif etmediği için entegrasyonda açıkça seçilmelidir. İki modu karıştırmayın.

```text
xp = grid.origin_xy_m[0] + (c + δ) * grid.res_m
yp = grid.origin_xy_m[1] - (r + δ) * grid.res_m

lon_deg = (xp / 3396190) * 180/π
lat_deg = (yp / 3396190) * 180/π

X = (3396190 * lon_deg * π/180 - manifest.origin_proj.x0) * cos(manifest.lat0 * π/180)
Z = manifest.origin_proj.ytop - 3396190 * lat_deg * π/180
```

Aynı projeksiyon ve R altında ara lon/lat adımı cebirsel olarak sadeleşir:

```text
X = (xp - manifest.origin_proj.x0) * cos(manifest.lat0 * π/180)
Z = manifest.origin_proj.ytop - yp
```

Bu veri anlık görüntüsünde `cos(lat0)=0.9964894350619453`, sim başlangıcı `[8140000.284005926,-280315.578653001]`. Dolayısıyla **δ=0** için:

```text
X = 2268.218001362672 + 1.992978870123891 * c   [m]
Z = 3499.496536437015 + 2.0 * r                [m]
```

**δ=0.5** için yukarıdaki sonuca `ΔX=+0.996489435062 m`, `ΔZ=+1.0 m` eklenir. Bu değerler grid/manifest değişirse yeniden hesaplanmalıdır; sabitleri uygulamaya gömmek önerilmez. Kaynak: yukarıdaki iki JSON ve [test sonuçları](test_results.json).

`X=2*c, Z=2*r` yanlıştır: alanın dünya içindeki başlangıcını yok sayar ve X ölçeğini kaçırır. Sim'in kendi `Nav`/export piksel uzayı da planlayıcının 2 m piksel uzayıyla aynı değildir; sim pikselini planner px sanmayın. Kaynaklar: [Geo](../../../../sim/app/geo.js), [Nav](../../../../sim/app/nav.js), [MapView](../../../../sim/app/mapview.js).

## Yükseklik ve dünyadaki Y

```text
q = little-endian uint16
q == 0 → NoData; -4400 m yükseklik DEĞİL
H_areoid = manifest.zmin + q * manifest.zstep = -4400 + q*0.05
Y_world = H_areoid - manifest.z_min_data = H_areoid + 4271.1
```

Kaynak: [manifest](../../../../sim/data/tiles/manifest.json), [Terrain](../../../../sim/app/terrain.js). L0 tile 131×131 örnek, 128×128 hücre + sınır örnekleri taşır. Yerel `(i,j)` örneği dosyada `(i+1,j+1)` adresindedir; sıfır sınırını unutmak bir yerel örnek kaymasına neden olur. `check_coords.py` bu kenarlık ve satır/sütun sırasını asimetrik sentetik alanla test eder.

Rotayı yüzeye oturtmak için öneri: X/Z'yi yukarıdaki dönüşümle bulup **sim'in aynı noktadaki `terrain.heightAt(X,Z)` değerini** kullanın. Dönen değerden tekrar `z_min_data` çıkarmayın; zaten dünya Y'dir. Yalnız çizgi için küçük yükseltme istenirse bunun bir görselleştirme payı olduğu açık olsun. Astronot göz yüksekliği veya çizgi payının doğru değeri bu görevde **ölçülmedi**. L0 henüz yüklenmediyse gelen kaba LOD yüksekliği değişebilir; ince tile geldikten sonra tekrar zemine oturtma önerisidir. Kaynak: [Terrain.heightAt](../../../../sim/app/terrain.js), [main groundY](../../../../sim/app/main.js).

`elevation.npy` yüksekliğini doğrudan dünya Y sanmayın. İki DEM'in nominal aynı konumdaki farkı [raporda](rapor.md) ölçülmüştür; tek dikey sabit bütün farkı gidermez.

## Teslim edilen kullanım örnekleri

JavaScript modülü [px_to_world.js](px_to_world.js), Python fonksiyonu [check_coords.py](check_coords.py) içindedir. İkisi de varsayılan olarak `δ=0` kullanır, isteğe bağlı hücre merkezi sunar; ampirik DEM kaymasını **uygulamaz**.

```js
import {pxToWorld} from './px_to_world.js';
// grid: tam contracts/grid.json; manifest: sim manifest.json.
const p = pxToWorld([433, 525], grid, manifest, {cellCenter: true});
// p = {x,z,lon,lat,inside}. terrain kullanımı aşağıda entegrasyon önerisidir:
const y = terrain.heightAt(p.x, p.z);
if (!p.inside || y === null) { /* yüzey hazır değil / veri yok */ }
// Çizgi/aktör konumu: (p.x, y, p.z). Karakter gözü payı ayrı tanımlanır.
```

```python
from check_coords import px_to_world
p = px_to_world([433, 525], grid, manifest, cell_center=True)
# p['x'], p['z']; dünya Y için sim döşemesinden yükseklik gerekir.
```

## Ters dönüşüm ve sınır ayrımı

```text
c = (manifest.origin_proj.x0 + X/cos(lat0) - grid.origin_xy_m[0]) / grid.res_m - δ
r = (grid.origin_xy_m[1] - manifest.origin_proj.ytop + Z) / grid.res_m - δ
```

Grid **dış kenarları** `(0,0),(1000,0),(0,1000),(1000,1000)`; geçerli tam sayı hücre indisleri ise `0..999`'dur. Dünya dikdörtgeni `0≤X≤6627.873875806`, `0≤Z≤8683.822737876`. Dikdörtgen içinde olmak NoData olmadığı anlamına gelmez; bu görevde ayrıca köşe/durak ve rota noktalarının L0 örnekleri test edildi. Kaynak: [Geo.inside](../../../../sim/app/geo.js), [ölçüm sonuçları](test_results.json).

## Doğrulama

Python ve JS, dört köşe + dört mevcut durak + 1024 örnekte karşılaştırıldı. JS ayrıca **mevcut sim Geo sınıfıyla** iki merkez modunda test edildi. Terrain örnekleyicisi gerçek `Terrain.heightAt` metodu ile, dosyaları değiştirmeden ve renderer kurmadan karşılaştırılır. Detaylı yöntem, komut ve sınırlamalar [rapor.md](rapor.md), ham sonuçlar [test_results.json](test_results.json), örnekler [height_samples.csv](height_samples.csv).
