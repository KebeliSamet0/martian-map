"""Zemin modelini tarayıcı için ONNX'e aktarır ve ölçer (#127 B).

Kullanım (repo kökünden):
    python ml/rover_terrain/export_onnx.py --model models/rover_terrain/full/best.pt [--out models/rover_terrain/onnx]

Çıktı: terrain_fp32.onnx, terrain_fp16.onnx (girdi/çıktı float32, ağırlıklar fp16).
Girdi  : [1, 3, 512, 512] float32, gri kare 3 kanala kopyalanmış + ImageNet normalizasyonu (infer_stops.py ile aynı).
Çıktı  : [1, 4, 512, 512] softmax olasılıkları (toprak, ana kaya, kum, büyük kaya).
Tek geçiş (MC Dropout yok): tarayıcıda canlı çıkarım için. Belirsizlik = tek geçişin softmax entropisi, MC değil.
Ölçüm: dosya boyutu, onnxruntime CPU süresi, PyTorch ile argmax uyuşması (gerçek Navcam karelerinde).
"""
import argparse, glob, os, sys, time
import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train import build_model  # noqa: E402

MEAN = np.array([0.485, 0.456, 0.406], np.float32)[:, None, None]
STD = np.array([0.229, 0.224, 0.225], np.float32)[:, None, None]


class Softmaxed(torch.nn.Module):
    def __init__(self, m):
        super().__init__(); self.m = m

    def forward(self, x):
        return torch.softmax(self.m(x), dim=1)


def prep(path, size=512):
    from PIL import Image
    g = np.asarray(Image.open(path).convert("L").resize((size, size), Image.BILINEAR), np.float32) / 255.0
    return ((np.repeat(g[None], 3, 0) - MEAN) / STD)[None].astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--out", default="models/rover_terrain/onnx")
    ap.add_argument("--frames", default="sim/data/navcam_all/*/*.jpg", help="uyuşma ölçümü için gerçek kareler")
    ap.add_argument("--n", type=int, default=12)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    m = build_model(pretrained=False); m.load_state_dict(torch.load(a.model, map_location="cpu")); m.eval()
    net = Softmaxed(m).eval()
    f32 = os.path.join(a.out, "terrain_fp32.onnx"); f16 = os.path.join(a.out, "terrain_fp16.onnx")
    torch.onnx.export(net, torch.zeros(1, 3, 512, 512), f32, input_names=["image"], output_names=["probs"], opset_version=17,
                      dynamo=False)
    import onnx
    from onnxconverter_common import float16
    onnx.save(float16.convert_float_to_float16(onnx.load(f32), keep_io_types=True), f16)
    import onnxruntime as ort
    frames = sorted(glob.glob(a.frames))[:: max(1, len(sorted(glob.glob(a.frames))) // a.n)][: a.n]
    print(f"kare: {len(frames)}")
    for f in (f32, f16):
        s = ort.InferenceSession(f, providers=["CPUExecutionProvider"])
        x0 = prep(frames[0]); s.run(None, {"image": x0})  # ısınma
        ts, agree = [], []
        for fr in frames:
            x = prep(fr)
            t0 = time.perf_counter(); p = s.run(None, {"image": x})[0]; ts.append((time.perf_counter() - t0) * 1000)
            with torch.no_grad():
                q = net(torch.from_numpy(x)).numpy()
            agree.append(float((p.argmax(1) == q.argmax(1)).mean()))
        print(f"{os.path.basename(f)}: {os.path.getsize(f) / 1e6:.1f} MB · CPU ort {np.median(ts):.0f} ms (medyan, {len(ts)} kare) · "
              f"PyTorch ile piksel argmax uyuşması ort {np.mean(agree) * 100:.2f} %, en düşük {min(agree) * 100:.2f} %")


if __name__ == "__main__":
    main()
