#!/usr/bin/env python3
"""Türkçe jüri sunumu iskeleti (SUNUM_PLANI.md): 25 sayfa + 7 yedek.

Tasarım dili: Bora'nın "Mars Surface" şablonunun teması (renk ve font).
Her sayfa: üstte kısa kaynak (tıklanabilir), Barlow Condensed başlık, ince turuncu çizgi,
tek büyük video/görsel alanı, sağda etiket. Konuşma notu: GIF eylemi, söylenecek cümle, sayı kaynağı.

Çalıştır:  python3 docs/submission/deck/build_sunum_tr.py
Çıktı:     docs/submission/Martian_Map_Sunum_TR_iskelet.pptx
PowerPoint 2016 uyumlu: yalnız temel şekil, metin ve resim; Morph/Zoom/SVG yok.
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.dml import MSO_LINE

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
TEMPLATE = os.path.join(ROOT, 'docs/submission/template/Mars_Surface_Template.pptx')
OUT = os.path.join(ROOT, 'docs/submission/Martian_Map_Sunum_TR_iskelet.pptx')
FIG = os.path.join(ROOT, 'docs/figures')

BG, CARD = 'FF0A0807'[2:], '14100E'
WHITE, BEIGE, GREY, ORANGE, GOLD = 'FFFFFF', 'EFE6DD', '8C8279', 'F07226', 'D9A66F'
HEAD, BODY = 'Barlow Condensed', 'Barlow'
TAGS = {'ÖLÇÜM': ORANGE, 'MODEL': GOLD, 'VARSAYIM': GREY, 'BAĞLAM': GREY,
        'ÖLÇÜM + MODEL': ORANGE}


X0 = Inches(1.867)     # sol kenar: 9,6 in video alanı sayfada ortalanır


def rgb(h):
    return RGBColor.from_string(h)


def tr_upper(s):
    return s.replace('i', 'İ').replace('ı', 'I').upper()


# (başlık, [(kaynak metni, url)], etiket, video süresi, görsel, GIF eylemi, söylenecek, sayı kaynağı)
S = [
 ('Martian Map', [('NASA Space Apps 2026 · Konya · Selçuk Üniversitesi', None)], None, '4,5 sn', None,
  'Açılış ekranı, yavaş yaklaşma.', 'Mars\'ta yürüyüşü önceden prova ettiriyoruz.', ''),
 ('Simülatör', [], None, '4,5 sn', None,
  'Görev seçimi, ardından S1 brifingi.', 'Gale kraterinde bir astronot görev provası.', ''),
 ('Arazi', [('USGS Gale DEM 1 m · astrogeology.usgs.gov', 'https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m')], 'ÖLÇÜM', '4,5 sn', None,
  '3B arazide birkaç saniye yürüyüş.', 'Arazi gerçek HiRISE yükseklik verisi.', '1 m DTM [USGS]'),
 ('Curiosity izi', [('NASA/JPL MMGIS · science.nasa.gov', 'https://science.nasa.gov/mission/msl-curiosity/location-map/')], 'ÖLÇÜM', '4,5 sn', None,
  'Curiosity izi ve durak işaretçileri.', 'Gerçek rover izinin üstünde yürüyoruz.', ''),
 ('Eğim', [('NASA EVA-EXP-0075 (20°) · nasa.gov', 'https://www.nasa.gov/wp-content/uploads/2020/01/topic_1-_eva_lunar_surface_concept_of_operations.pdf'),
           ('Acta Astronautica 2023 (15°) · sciencedirect.com', 'https://www.sciencedirect.com/science/article/pii/S0094576523005179')], 'VARSAYIM', '4,5 sn', None,
  'Eğim rengi, dik bölgeye yaklaşma.', '15° dikkat, 20° geçilmez. Mars için doğrulanmış değil, planlama varsayımı.', '`docs/eva_parameters.md`'),
 ('Kayalar', [('HiRISE 25 cm ortofoto · astrogeology.usgs.gov', 'https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm')], 'MODEL', '4,5 sn', None,
  'Kaya haritası, kayaya çarpmadan yürüme.', 'Kayaları ortofotodan kendi dedektörümüzle buluyoruz.', 'Yedek: 123 büyük tespitin 120\'si çıkıntı ya da gölge [VALIDATION.md §6]'),
 ('Zemin', [('AI4Mars · zenodo.org', 'https://zenodo.org/records/15995036')], 'MODEL', '4,5 sn', None,
  'Ayak altı zemin satırı değişir.', 'Zemin sınıfını Navcam karelerinden modelle tahmin ediyoruz.', 'MODEL_CARD.md'),
 ('Bilim durakları', [('MRO CRISM · pds-geosciences.wustl.edu', 'https://pds-geosciences.wustl.edu/mro/mro-m-crism-5-rdr-mptargeted-v1/')], 'BAĞLAM', '4,5 sn', None,
  'Bilim durağına varış.', 'Duraklar yayınlanmış jeoloji birim haritasından seçildi.', 'CRISM piksel düzeyinde kullanılmadı [docs/data/crism_geology.md §3]'),
 ('Enerji', [('Pandolf vd. 1977 · doi.org', 'https://doi.org/10.1152/jappl.1977.43.4.577')], 'VARSAYIM', '4,5 sn', None,
  'Enerji göstergesi akar.', 'Pandolf denklemi, Apollo EVA ortalamasına kalibre.', '272 W [SP-368]'),
 ('Oksijen', [('NASA SP-368 · ntrs.nasa.gov', 'https://ntrs.nasa.gov/api/citations/19760005584/downloads/19760005584.pdf')], 'VARSAYIM', '4,5 sn', None,
  'O₂ göstergesi akar.', 'Oksijen enerjiden türetildi.', '1800 kcal ÷ 4,8 kcal/L ≈ 375 L [docs/eva_parameters.md]'),
 ('Radyasyon', [('Hassler vd. 2014 · doi.org', 'https://doi.org/10.1126/science.1244797')], 'ÖLÇÜM', '4,5 sn', None,
  'Doz sayacı akar.', 'Curiosity\'nin ölçtüğü sabit yüzey doz hızıyla akıyor; rota boyunca ölçüm değil.', '0,210 ± 0,040 mGy/gün; 8,75 µGy/sa [Hassler 2014]'),
 ('Süre ve yük', [('Ogilvie vd. 2026 · ntrs.nasa.gov', 'https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf')], 'VARSAYIM', '4,5 sn', None,
  'Süre göstergesi, +8 kg yük etkisi.', 'Süre 7 saat, yürüme hızı 0,75 m/s.', '[SP-368; Ogilvie 2026]'),
 ('Kask kamerası', [('NASA/JPL-Caltech Navcam · mars.nasa.gov', 'https://mars.nasa.gov/msl/multimedia/raw-images/')], 'ÖLÇÜM + MODEL', '7,5 sn', None,
  'Durakta gerçek Navcam + model maskesi, sürgü.', 'Gerçek Navcam karesinin üstünde modelin yorumu.', ''),
 ('Tarayıcı', [('SCAN_CHECK.md · ml/rover_terrain', None)], 'MODEL', '4,5 sn', None,
  'Tarayıcı uyarısı, düşük kanıt işareti.', 'Tarayıcı uyarır ve kanıtın az olduğu yeri de işaretler.', ''),
 ('3 rota', [('metabolic_model.md · docs', None)], 'MODEL', '7,5 sn', None,
  'Rota kartları, segment nedeni.', 'Üç rota, her segmentin nedeni yazılı.', 'S1: 19,9 / 20,1 / 20,9 dk; 95 / 96 / 99 kcal [sim/data/routes/S1.json]'),
 ('Kendi rotan', [], None, '4,5 sn', None,
  'Haritada başlangıç ve hedef seçimi.', 'İstediğin iki noktayı seç, planlayıcı rotayı çıkarsın.', ''),
 ('Canlı rota', [('Planlayıcı · api/planner', None)], 'MODEL', '7,5 sn', None,
  'Kum yamasına yaklaş, çizgi yön değiştirir.', 'Kum çıkınca çizgi bulunduğun yerden yeniden hesaplanıyor.', '~3 m / 4 sn, ~0,8 sn hesap'),
 ('Numune', [], None, '4,5 sn', None,
  'E basılı: numune alma, +8 kg.', 'Hedefte numune alıyoruz.', '+8 kg [PROJECT.md]'),
 ('Dönüş', [], None, '4,5 sn', None,
  'Ağır yükle üsse yürüyüş.', 'Ağırlaşan yükle üsse dönüyoruz.', ''),
 ('Karne', [], None, '4,5 sn', None,
  'Karne ekranı (derece hatası düzeldiyse).', 'Karne planlananla harcananı karşılaştırır.', ''),
 ('Curiosity kıyası', [('NASA/JPL MMGIS · science.nasa.gov', 'https://science.nasa.gov/mission/msl-curiosity/location-map/')], 'ÖLÇÜM + MODEL', '', 'msl_compare.png',
  'Statik görsel.', 'Aynı iki noktada Curiosity 3,89 km gitti, bizim rotalarımız 2,3 km. Yalnız geometri.', '2,26–2,40 km; ~130 m [DENETIM_masa_arastirmalari §3]'),
 ('Navcam = simülatör', [('NASA/JPL-Caltech Navcam · mars.nasa.gov', 'https://mars.nasa.gov/msl/multimedia/raw-images/')], 'ÖLÇÜM', '', 'sim_06_navcam_vs_sim.png',
  'Statik görsel.', 'Aynı durak, aynı yön: solda Navcam, sağda simülatör.', ''),
 ('Zemin modeli', [('METRICS.md · ml/rover_terrain', None)], 'MODEL', '', 'CARD:mIoU 0,798|uzman etiketli test · kalibrasyon hatası (ECE) 0,004',
  'Metrik kartı.', 'Uzman etiketli testte model iyi ve kalibre.', 'mIoU 0,798; ECE 0,004 [METRICS.md]'),
 ('Sınır: kum', [('SCAN_CHECK.md · ml/rover_terrain', None)], 'MODEL', '', 'navcam_vs_model.png',
  'Statik görsel.', 'Kumu kaçırıyoruz; bunu da gösteriyoruz.', 'Navcam eşleşmesi 3/6; kumlu 7 durağın 2\'sinde yakalandı [SCAN_CHECK.md]'),
 ('Teşekkürler', [('github.com/KebeliSamet0/martian-map (repo şu an private)', None)], None, '', 'CARD:QR · link|doldurulacak',
  'QR kodu.', 'Teşekkürler; sorularınız için hazırız.', 'Repo public yapılmadıkça QR için başka link gerek'),
]

BACKUP = [
 ('YEDEK · Kum', 'Model kumu az tahmin ediyor: 13 kum adayında en yüksek p_sand 0,111; kumlu 7 durağın 2\'sinde yakaladı. [ml/orbital/VALIDATION.md §7]'),
 ('YEDEK · Kaya', 'Büyük 123 tespitin 120\'si çıkıntı ya da gölge, 3\'ü tek kaya. [ml/orbital/VALIDATION.md §6]'),
 ('YEDEK · Enerji', 'Enerji muhtemelen az tahmin (kanıtlı alt sınır değil): Dünya katsayıları, Mars için doğrulanmadı. Mars skafandr tasarım ortalaması 352 W, biz Apollo 272 W\'a kalibre ettik. [docs/metabolic_model.md]'),
 ('YEDEK · 20°', '20° NASA EVA Ay ConOps gereksinimi (EVA-EXP-0075); Mars için doğrulanmış değil, planlama varsayımı. 15° dikkat eşiği Artemis planlamasından.'),
 ('YEDEK · Güven', 'Model güveni hatayı yakalamıyor: isabetli durakların belirsizliği 0,21, ıskalananlarınki 0,18. Piksel kalibrasyonu iyi (ECE 0,004). [MODEL_CARD.md]'),
 ('YEDEK · Yapay zekâ', 'Zemin modeli DeepLabv3+ (ResNet34), AI4Mars ile eğitildi, MC Dropout ile belirsizlik. Kaya dedektörü klasik görüntü işleme. Kod ve belgelerde yapay zekâ asistanı (Claude Code) kullanıldı; sayılar kaynaklarıyla kontrol edildi. Astronot Quaternius (CC0), three.js (MIT).'),
 ('YEDEK · Model rotayı değiştirmedi', '20° eşiğinde tam model ile eğim + kaya planlayıcı S1–S3 için aynı yolları buluyor (9/9); risk farkı %0–2. Modelin değeri kask kamerasında, ayak altı zeminde ve belirsizlikte. [#127]'),
]


def set_bg(slide):
    f = slide.background.fill
    f.solid()
    f.fore_color.rgb = rgb(BG)


def add_text(slide, x, y, w, h, text, size, color, font=BODY, bold=False, align=PP_ALIGN.LEFT,
             anchor=MSO_ANCHOR.TOP, name=None):
    tb = slide.shapes.add_textbox(x, y, w, h)
    if name:
        tb.name = name
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.name, r.font.size, r.font.bold = font, Pt(size), bold
    r.font.color.rgb = rgb(color)
    return tb


def add_sources(slide, sources):
    tb = slide.shapes.add_textbox(X0, Inches(0.28), Inches(9.6), Inches(0.5))
    tb.name = 'KAYNAK'
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    first = True
    for text, url in sources:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        r = p.add_run()
        r.text = text
        r.font.name, r.font.size = BODY, Pt(11)
        r.font.color.rgb = rgb(GREY)
        if url:
            r.hyperlink.address = url
            r.font.color.rgb = rgb(GREY)


def add_title(slide, title):
    add_text(slide, X0, Inches(0.72), Inches(7.6), Inches(0.8), tr_upper(title), 48, WHITE,
             font=HEAD, bold=True, anchor=MSO_ANCHOR.TOP, name='BASLIK')
    ln = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, X0, Inches(1.52), Inches(1.2), Emu(38100))
    ln.name = 'CIZGI'
    ln.fill.solid()
    ln.fill.fore_color.rgb = rgb(ORANGE)
    ln.line.fill.background()


def add_tag(slide, tag):
    if not tag:
        return
    c = TAGS[tag]
    w = Inches(1.9) if '+' in tag else Inches(1.45)
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, X0 + Inches(9.6) - w, Inches(0.92), w, Inches(0.36))
    sh.name = 'ETIKET'
    sh.adjustments[0] = 0.5
    sh.fill.background()
    sh.line.color.rgb = rgb(c)
    sh.line.width = Pt(1.25)
    tf = sh.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = tag
    r.font.name, r.font.size, r.font.bold = BODY, Pt(12), True
    r.font.color.rgb = rgb(c)


MEDIA = dict(x=X0, y=Inches(1.78), w=Inches(9.6), h=Inches(5.4))   # 16:9


def add_media(slide, dur, img):
    x, y, w, h = MEDIA['x'], MEDIA['y'], MEDIA['w'], MEDIA['h']
    if img and img.startswith('CARD:'):
        big, small = img[5:].split('|')
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
        box.name = 'KART'
        box.fill.solid(); box.fill.fore_color.rgb = rgb(CARD)
        box.line.fill.background()
        add_text(slide, x, y + Inches(1.7), w, Inches(1.4), big, 88, ORANGE, font=HEAD, bold=True,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, name='KART_SAYI')
        add_text(slide, x, y + Inches(3.3), w, Inches(0.6), small, 20, BEIGE, align=PP_ALIGN.CENTER, name='KART_ALT')
    elif img:
        path = os.path.join(FIG, img)
        from PIL import Image
        iw, ih = Image.open(path).size
        sc = min(w / iw, h / ih)
        pw, ph = int(iw * sc), int(ih * sc)
        pic = slide.shapes.add_picture(path, x + (w - pw) // 2, y + (h - ph) // 2, pw, ph)
        pic.name = 'GORSEL'
    else:
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
        box.name = 'VIDEO_YER'
        box.fill.solid(); box.fill.fore_color.rgb = rgb(CARD)
        box.line.color.rgb = rgb(GREY); box.line.width = Pt(1); box.line.dash_style = MSO_LINE.DASH
        tf = box.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
        r = p.add_run(); r.text = f'VİDEO · {dur} · 2 tur (yerine koy, bu kutuyu sil)'
        r.font.name, r.font.size = BODY, Pt(18)
        r.font.color.rgb = rgb(GREY)


def add_notes(slide, i, act, say, num):
    t = f'GIF/eylem: {act}\nSöyle: {say}'
    if num:
        t += f'\nSayı ve kaynak: {num}'
    slide.notes_slide.notes_text_frame.text = t


def main():
    prs = Presentation(TEMPLATE)
    ids = prs.slides._sldIdLst
    for sid in list(ids):
        prs.part.drop_rel(sid.rId)
        ids.remove(sid)
    for lay in list(prs.slide_layouts)[1:]:      # kullanılmayan şablon düzenleri (arka plan görselleri dosyayı şişirir)
        prs.slide_layouts.remove(lay)
    blank = prs.slide_layouts[0]
    for i, (title, src, tag, dur, img, act, say, num) in enumerate(S, 1):
        s = prs.slides.add_slide(blank)
        set_bg(s)
        add_sources(s, src)
        add_title(s, title)
        add_media(s, dur, img)
        add_tag(s, tag)
        add_notes(s, i, act, say, num)
    for title, body in BACKUP:
        s = prs.slides.add_slide(blank)
        set_bg(s)
        add_sources(s, [])
        add_title(s, title)
        add_text(s, X0, Inches(2.2), Inches(9.6), Inches(4.2), body, 30, BEIGE, name='YEDEK_METIN')
        s.notes_slide.notes_text_frame.text = 'Yedek sayfa: yalnız soru gelirse aç. Sunum sırasında geçilmez (Gizle).'
    prs.save(OUT)
    print('yazıldı:', OUT, len(prs.slides._sldIdLst), 'slayt')


if __name__ == '__main__':
    main()
