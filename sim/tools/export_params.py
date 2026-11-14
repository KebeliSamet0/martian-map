"""docs/data/real_params.json'dan uygulamanın KULLANDIĞI, denetlenmiş parametreleri sim/data/params.json'a aktarır.

Kullanım: python sim/tools/export_params.py
Denetim (Claude, 2026-11-14): 'audited' = değer birincil kaynaktan bağımsız olarak yeniden doğrulandı.
  - B.*  : HiRISE ESP_019698_1750_RED.LBL (hirise-pds.lpl.arizona.edu) etiketi okundu: incidence 57.493071, Ls 161.208019, sub-solar az 192.527174, north az 270.
  - G.waypoint_* : NASA MMGIS MSL_waypoints.json okundu: 116_0 / 119_486 koordinatları birebir.
  - A.apache_test_speed : NTRS 20220010306, slayt 23: "N = 1 ... 1.5 mph ... (-10% to 30%) ... up to 45 mL/kg·min".
  - G.boxwork_morphology : LPSC 2026 #1716 özeti: ~5 m sırt, ~10-20 m poligon, 1-2 m derin, 14 km batı, sol 4534 = 8 Mayıs 2025.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "data" / "real_params.json"
OUT = ROOT / "sim" / "data" / "params.json"
USE = {
    "A.apache_test_speed": True, "A.apache_grade_range": False, "A.apache_mars_participants": False,
    "B.ESP_019698_1750.solar_elevation": True, "B.ESP_019698_1750.solar_azimuth_north_clockwise": True,
    "B.ESP_019698_1750.solar_longitude": True, "B.ESP_019698_1750.local_time": True, "B.ESP_019698_1750.start_time": True,
    "B.ESP_019988_1750.solar_elevation": True, "B.ESP_019988_1750.solar_azimuth_north_clockwise": True,
    "G.waypoint_sol_4534": True, "G.waypoint_sol_4541": True, "G.waypoint_sol_4671": True, "G.boxwork_morphology": True,
    "K.gravity_reference": False, "E.generic_absolute_accuracy": False,
}


def main():
    src = {p["name"]: p for p in json.loads(SRC.read_text(encoding="utf-8"))}
    out = {}
    for name, audited in USE.items():
        p = src.get(name)
        if not p:
            raise SystemExit(f"parametre yok: {name}")
        out[name] = {k: p[k] for k in ("value", "unit", "source_url", "quote", "accessed", "verified")}
        out[name]["audited"] = audited
    OUT.write_text(json.dumps({"source": "docs/data/real_params.json", "params": out}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(out)} parametre → {OUT}")


if __name__ == "__main__":
    main()
