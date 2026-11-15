# Tüketim kapsamı (`total.consumption`) — 2026-11-15

`/route` ve `/replan` yanıtındaki her rotanın `total` nesnesi, eski alanlara **ek olarak** `consumption` taşır. Hepsi aynı birimlerde: `min` (dakika), `kcal`, `o2_L` (litre O₂), `dose_uGy` (µGy).

| Alan | Kapsam |
|---|---|
| `outbound` | Gidiş yürüyüşü (rota profili toplamı) |
| `return` | Dönüş yürüyüşü. **Varsayım:** aynı yol, |eğim| modeli iniş/çıkışı ayırmaz; gidişe eşit |
| `science` | Hedefte bilim durağı (`SCIENCE_STOP_MIN`), durak metabolizması |
| `reserve` | Yedek pay (`reserve_min`), durak metabolizması |
| `committed` | outbound + return + science + reserve. **`budget.used` ile aynı sayı**; GO/NO-GO bu toplamla karar verir |

Eski alanların kapsamı (değişmedi, istemci uyumu için): `total.kcal` yalnız gidiş; `eva_kcal` ve `o2_L` iki yön yürüyüş (bilim ve rezerv hariç); `dose_uGy` iki yön + bilim (rezerv hariç); `budget.used` = committed.

HUD "görev tüketimi" gösterecekse `consumption.committed` kullanmalı; yalnız yürüyüşü göstermek için `outbound + return`.

Hepsi planlayıcı modelinin çıktısıdır (Pandolf Dünya modeli, Mars için g-ölçekli; `mars_validated=false`), ölçüm değildir.

## Diğer sözleşme eklemeleri (aynı tur)
- `total.endpoints.{start,goal}`: `requested`, `used`, `snap_m`, `requested_slope_deg`. İstenen uç geçilmez eğimdeyse (DEM abartısı) yakın hücreye bağlanır; bağlantı hücreleri yola dahildir (maliyet toplamlara girer), bağlantı geçilmez eğimden geçiyorsa 422.
- `total.slope_limit_deg`, `total.slope_limit_violations`, `total.warnings`: kullanıcı `max_slope_deg` verdiğinde uç hücre sınırı aşarsa `go=false` ve uyarı.
- Çapraz adım (8-komşuluk) yalnız iki yan hücre de geçilebilirse yapılır (köşe kesme yok).
- `metabolic_w` negatif/sonsuz/NaN güçte `ModelDomainError` fırlatır (HTTP 422); sessiz clamp yok. `/step` `directional` hesabında inişin 0'a kesildiği `descent_grade_clamped: true` ile açıkça işaretlidir.
- `/assumptions`: Pandolf, g-ölçek ve düz referans kalemlerinde `mars_validated: false`; ayrıca "Metabolik model Mars doğrulaması" kalemi.
