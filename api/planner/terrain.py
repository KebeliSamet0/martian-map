"""Markdown tablosundan zemin katsayılarının tek yükleme noktası."""
from pathlib import Path
import math


def load_terrain(default_eta, default_speed, path=None):
    path = Path(path) if path is not None else Path(__file__).resolve().parents[2] / 'docs/metabolic_model.md'
    if not path.exists():
        return dict(default_eta), dict(default_speed), 'params varsayılanları (doğrulanacak)'
    # Kararlı tablo sözleşmesi: class | eta | speed; diğer metin/tablolara dokunmaz.
    rows = [list(map(str.strip, line.strip().strip('|').split('|')))
            for line in path.read_text(encoding='utf-8').splitlines() if line.strip().startswith('|')]
    eta, speed = {}, {}
    header = None
    for row in rows:
        if {'class', 'eta', 'speed'} <= set(row):
            header = row
        elif header and row[0] in default_eta:
            try:
                cls = row[header.index('class')]
                eta[cls], speed[cls] = float(row[header.index('eta')]), float(row[header.index('speed')])
            except (ValueError, IndexError) as exc:
                raise ValueError('Zemin katsayı tablosunda sayısal eta/speed bekleniyor') from exc
    if set(eta) != set(default_eta) or any(not math.isfinite(v) or v <= 0 for v in [*eta.values(), *speed.values()]):
        raise ValueError('metabolic_model.md: class | eta | speed tablosunda dört sınıf ve pozitif sonlu katsayılar gerekli')
    return eta, speed, str(path)
