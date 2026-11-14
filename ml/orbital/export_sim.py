"""Simülasyon için kaya ve kum verisini dışa aktar (issue #46, Sprint 3).

Çıktılar:
  sim/data/rocks.json       [{"px": [sütun, satır], "d_m": çap}]  — ızgara pikseli (ondalıklı, merkez = indeks + 0.5)
  sim/data/sand_zones.json  [{"id", "px", "radius_m", "confidence"}]

Kaynak:
  data/interim/rock_cfa_rocks.csv   ml/orbital/rock_cfa_grid.py'nin yazdığı tek tek kayalar (gölge yöntemi,
                                    shadow_rocks.py ile aynı tespit). Konum 25 cm'lik ortofoto pikseli (satır, sütun);
                                    ızgara pikseli = (indeks + 0.5) / 8. Bu CSV git dışıdır; yoksa önce rock_cfa_grid.py çalıştır.
  layers/sand_hint.json             kum adayları (Bora gözle doğruladı).

Kullanım (repo kökünden, tekrar çalıştırılabilir):
  python ml/orbital/export_sim.py
"""
import argparse, csv, json, sys
sys.stdout.reconfigure(encoding="utf-8")

p = argparse.ArgumentParser()
p.add_argument("--rocks-csv", default="data/interim/rock_cfa_rocks.csv")
p.add_argument("--sand-hint", default="layers/sand_hint.json")
p.add_argument("--out-dir", default="sim/data")
p.add_argument("--col", type=float, nargs=2, default=[380, 540], help="kapsam: ızgara sütunu aralığı (S1-S3 koridoru)")
p.add_argument("--row", type=float, nargs=2, default=[480, 820], help="kapsam: ızgara satırı aralığı")
p.add_argument("--min-d", type=float, default=0.5, help="en küçük kaya çapı, metre")
p.add_argument("--max-rocks", type=int, default=5000, help="üst sınır; aşılırsa çapa göre en büyükler kalır")
p.add_argument("--ortho-px-per-cell", type=int, default=8, help="ortofoto pikseli / ızgara hücresi (2 m / 25 cm)")
a = p.parse_args()

# --- kayalar ---
rocks, n_all = [], 0
with open(a.rocks_csv, encoding="utf-8") as f:
    for r in csv.DictReader(f):
        n_all += 1
        k = a.ortho_px_per_cell
        col, row, d = (float(r["col_px"]) + 0.5) / k, (float(r["row_px"]) + 0.5) / k, float(r["diam_m"])
        if d < a.min_d or not (a.col[0] <= col < a.col[1] and a.row[0] <= row < a.row[1]):
            continue
        rocks.append({"px": [round(col, 2), round(row, 2)], "d_m": round(d, 2)})
n_in = len(rocks)
rocks.sort(key=lambda x: -x["d_m"])
rocks = rocks[: a.max_rocks]
print(f"CSV'de {n_all} aday; kapsamda (sütun {a.col}, satır {a.row}, çap ≥ {a.min_d} m): {n_in}; yazılan: {len(rocks)}")
if rocks:
    print(f"çap aralığı {rocks[-1]['d_m']}–{rocks[0]['d_m']} m")
with open(f"{a.out_dir}/rocks.json", "w", encoding="utf-8") as f:
    json.dump(rocks, f, separators=(",", ":"))

# --- kum bölgeleri ---
hint = json.load(open(a.sand_hint, encoding="utf-8"))
zones = [{"id": s["id"], "px": s["px"], "radius_m": s["radius_m"], "confidence": s.get("confidence", "aday")} for s in hint["points"]]
with open(f"{a.out_dir}/sand_zones.json", "w", encoding="utf-8") as f:
    json.dump(zones, f, ensure_ascii=False, indent=1)
print(f"{len(zones)} kum bölgesi yazıldı")
