---
title: Martian Map API
emoji: 🪐
colorFrom: red
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
---

# Martian Map (çalışma adı)

Docker/Spaces çalıştırma ve çevrimdışı rota paketi: [deploy rehberi](api/DEPLOY.md).

NASA Space Apps Challenge 2026 · **Interplanetary Survival Guide: Martian Map** · Konya

Mars'ta yürüyen astronota Gale Krateri'nde güvenli rota çizen, her rota parçasında **neden o yolu seçtiğini** ve yapay zekâ modelinin zemin hakkında **ne kadar emin olduğunu** söyleyen, rotayı 3D ortamda prova ettiren bir web uygulaması.

## Akış
```
NASA verisi ──► katmanlar (eğim, kaya, termal) ──┐
Navcam + AI4Mars modeli ──► zemin sınıfı + güven ─┼─► maliyet haritası ─► 3 rota ─► segment açıklaması ─► arayüz + 3D prova
CRISM / jeoloji ──► bilim durakları ──────────────┘
```

## Klasörler
| Klasör | İçerik | Sorumlu |
|---|---|---|
| `pipeline/` | DTM, ortofoto, eğim, ızgara, CRISM, THEMIS işleme | Elif Rana |
| `ml/rover_terrain/` | AI4Mars zemin segmentasyonu + MC Dropout (RTX 4070, Emre'nin makinesi) | Emre |
| `ml/orbital/` | HiRISE kaya tespiti / kaya yoğunluğu (Colab; eğitim gerekirse Samet'in M5 Pro'su) | Bora |
| `api/` | Maliyet modeli, rota, açıklama, FastAPI | Samet |
| `web/` | React + Leaflet arayüz, segment kartları | Veysel |
| `sim/` | Three.js 3D prova simülasyonu | Batu |
| `docs/` | Kaynaklar, metabolik model, proje sayfası, sunum | Elif Nisa |
| `contracts/` | Ekipler arası veri formatları (önce bunu oku) | herkes |

## Kapılar (Türkiye saati)
| Zaman | Kapı | Koşul |
|---|---|---|
| Cmt 14:00 | **Kapı 1 – Veri** | Gale DTM ızgarada; değilse Jezero'ya geçiş |
| Cmt 22:00 | **Kapı 2 – Uçtan uca** | Gerçek veriyle tek rota baştan sona çalışıyor; değilse ekstralar iptal |
| Paz 12:00 | **Kapı 3 – Simülasyon** | 3D hazır değilse 2D ile teslim |
| Paz 16:00 | **Kapı 4 – Kod dondurma** | Sonrası yalnız video, slayt, proje sayfası |
| Paz 22:00 | **Teslim** | Resmî son 23:59 |

Veri keşfi: [docs/data/README.md](docs/data/README.md)

Eğitim makineleri: **RTX 4070** (Emre) ve **M5 Pro** (Samet). Diğer herkes ağır iş için Google Colab kullanır.

Çalışma kuralları: [CONTRIBUTING.md](CONTRIBUTING.md)
