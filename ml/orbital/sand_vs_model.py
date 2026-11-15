"""Bora'nın kum noktaları (layers/sand_hint.json) x modelin p_sand katmanı. Markdown tablo basar.

Kullanım (repo kökünden): python ml/orbital/sand_vs_model.py
p_sand noktanın hücresinde okunur; entropy 1,0 ise hücre hiçbir Navcam durağına yakın değil (varsayılan dağılım), model kanıtı yok.
"""
import json
import numpy as np

ps = np.load("layers/p_sand.npy"); E = np.load("layers/entropy.npy")
hints = json.load(open("layers/sand_hint.json", encoding="utf-8"))["points"]
stops = json.load(open("layers/rover_stops.json", encoding="utf-8"))
print("| Nokta | yarıçap (m) | p_sand (nokta) | entropy | en yakın durak (m) | o durağın kum payı |")
print("|---|---|---|---|---|---|")
ev = []
for p in hints:
    x, y = p["px"]
    d = [np.hypot(s["px"][0] - x, s["px"][1] - y) * 2 for s in stops]; i = int(np.argmin(d))
    e = float(E[int(y), int(x)]); v = float(ps[int(y), int(x)])
    if e < 0.99: ev.append(v)
    print(f"| {p['id']} | {p['radius_m']:.0f} | {v:.3f} | {e:.2f}{' (kanıt yok)' if e >= 0.99 else ''} | {d[i]:.0f} | {stops[i]['class_frac']['sand']:.3f} |")
print(f"\nKanıtlı nokta: {len(ev)}/{len(hints)}; bunlarda p_sand en çok {max(ev):.3f}, >= 0,2 olan: {sum(v >= .2 for v in ev)}")
