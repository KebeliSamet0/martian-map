# Sim mantık modülleri — 2026-11-14

DOM/Three.js bağımlılığı ve derleme yok. `node --test sim/tests/`.

- `createGridGeo({grid, manifest, geo?})`: `pxToWorld([c,r])`, `worldToPx([x,z])`,
  `cellToWorld`, `worldToCell`, `inside`. Sürekli px; hücre merkezi indeks + 0.5.
  `/grid` origin vermiyorsa `contracts/grid.json` kullanın; `Geo` tekrar kullanılır.
- `createVitals({api?, assumptions?, route?, loadKg?, stepIntervalSec=3, arrivalRadiusM=2})`:
  `update(dtSec, [x,z] | {x,z}, gridPx?)`, `setRoute(route)`, `addLoad(kg)`,
  `snapshot()`, `on(event, cb)` (unsubscribe döner), `await flush()`.
  İlk konumu `update(0, ...)` ile verin; süre simülasyon saniyesidir.
  Olaylar: `warning`, `limit`, `replan-suggested`, `arrived`; payload snapshot/ilk limit.
  Ham tek rota veya `adaptRoute` çıktısı kabul edilir; `setRoute` sayaç sıfırlamaz.
  Varsayımlar `/assumptions` dizisi veya kod adlarıyla sayısal nesnedir.
- HUD snapshot: `elapsedSec` s, `distanceM` m, `kcal`, `o2UsedL`/`o2RemainingL` L,
  `doseUGy` µGy, `metabolicW` W, `loadKg` kg; `source` api-step/segments/fallback,
  `status` GO/DİKKAT/NO-GO, `firstLimit` {resource,elapsedSec,distanceM,gridPx},
  `returnPossible` boolean/null, `returnMargin` {time_min,kcal,o2_L,dose_uGy}, `arrived`.
  Bilinmeyenler null; eşitlik aşım değildir. İlk limit görev boyunca korunur.
- Dönüş: yürünmüş izin aynı tüketimle geri yürünmesi + bütçedeki yedek;
  yük artınca dönüş enerjisi güncellenir. Döngülü izde temkinli fazla tahmin eder.
  `loadModel: mass-ratio-estimate`: toplam kütle oranı; Pandolf yeniden hesabı değildir.
- İsteğe bağlı API adaptörü: `api.step({trace:[{dt_sec,from_world,world,grid_px,load_kg}]})`
  → `{delta:{kcal,o2_L,dose_uGy}}` (yalnız gönderilen parçaların tüketim artışı).
  Adaptör POST /step istek/yanıtını bu arayüze dönüştürür ve timeout uygular.
  Uç henüz yok; hata/uyumsuz yanıtta yerel tahmin korunur, yeni çağrı yapılmaz.
  Yanıt yerel tahmini düzeltir; dönüş hesabı yerel tahmin olarak kalır.

Batu için bağlama (mevcut `geo`, `man`, `route`, `P`, `apiAssumptions` ile):
```js
import { createGridGeo } from './gridgeo.js';
import { createVitals } from './vitals.js';
const grid = await fetch('../contracts/grid.json').then(r => r.json());
const coords = createGridGeo({grid, manifest: man, geo});
const assumptions = await apiAssumptions().catch(() => []);
const vitals = createVitals({assumptions, route});
vitals.update(0, P, coords.worldToPx([P.x, P.z]));
vitals.on('warning', s => toast(s.status));
vitals.on('limit', s => toast(`Limit: ${s.resource}`));
vitals.on('replan-suggested', s => console.info('Dönüş payı', s.returnMargin));
vitals.on('arrived', s => console.info('Varış', s));
function updateResources(dtSec) { // yürüyüş karesinden, timeScale uygulanmış dt
  const s = vitals.update(dtSec, P, coords.worldToPx([P.x, P.z]));
  return s; // Veysel: HUD render(s); null alanları “bilinmiyor” göster
}
// Yeniden planlamada vitals.setRoute(newRoute); görev sonunda await vitals.flush();
```

- `await loadMissions({api?,apiBase?,fetcher?,missionsUrl?})` → `{missions,source}`.
  Sıra: GET /missions → sim/data/missions.json → etiketli gömülü demo.
- `createMission({definition,vitals,coords?,api?,apiBase?,fetcher?,source})` →
  `plan()`, `start(route)`, `update(worldPos)`, `resume(route?)`, `collectSample()`,
  `await finish()`, `snapshot()`, `on(event,cb)`. Olaylar: state/event/arrived/sample/debrief.
  Akış: briefing → planning → walking ↔ event → arrived → debrief.
  Tanım: `{id,goal:{world:[x,z],radius_m},events:[{id,type:'sand',world,radius_m}],sample_kg}`;
  world yerine grid_px hücre indeksi + coords verilebilir. API/dosya: dizi veya `{missions:[]}`.
  `api.missions()` ve `api.debrief(summary)` opsiyonel adaptörler; aksi halde fetch kullanılır.
  Karede önce vitals.update, sonra mission.update; event sonrası yeniden planlayıp resume çağırın.
  Hedefte collectSample bir kez yük ekler; finish plan/gerçek farkını ve API/yerel özetini döndürür.

## dynroute.js (batu:dyn, #122)
Yürüyüş boyunca durumu izler ve MEVCUT konumdan yeni plan önerir; sayılar yalnız planlayıcı API yanıtından (`/route`, `total.consumption.outbound`, `km`).
- Sapma: rotadan > 15 m ve 5 sn → `reason:'deviation'` (yeni rota ↔ rotaya dön+devam farkı: m, kcal, O₂).
- Rezerv: O₂ ya da süre payı < %40 → üsse dönüş rotası (`reason:'reserve'`), kalan bütçeyle; dönüş maliyeti kalan bütçenin %80'ine yaklaşırsa `urgent` ("dönüşü olmayan nokta").
- Kum: mevcut `/replan` aynı sözleşmeyle (`reason:'sand'`, `urgent:true`); arayüz yoksa eskisi gibi hemen uygulanır.
- Olaylar: `window` `mm:route-suggest` {reason, route, current, delta:{m,kcal,o2_L,risk}, urgent} (iptal edilebilir: dinleyici `preventDefault()` derse arayüz onda; yoksa yerleşik bant) ve `mm:route-decision` {accept, reason}.
- Test: `sim/tests/dynroute.test.mjs` (API taklidiyle eşik, debounce, soğuma, olay üretimi).
