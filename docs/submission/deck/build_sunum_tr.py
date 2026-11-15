#!/usr/bin/env python3
"""Türkçe jüri sunumu iskeleti (SUNUM_PLANI.md): 24 sayfa + 7 yedek.

Tasarım dili: Bora'nın "Mars Surface" şablonunun kendisi (ilk slayt): tam ekran Mars manzarası kapak,
koyu topografik arka plan, geniş harf aralıklı küçük başlık, turuncu etiket, dev beyaz başlık.
Düzenler şablondan gelir (SURFACE_COVER, SURFACE_MEDIA_ROW); renk ve font temadan (Barlow).

Sayfa türleri: kapak (manzara), video (uygulama içi, yer tutucu kutu), görsel (statik kanıt), kart (tek büyük rakam).
Hepsinde video olmak zorunda değil. Konuşma notu: çekim eylemi, söylenecek cümle, sayı ve kaynağı.

Çalıştır:  python3 docs/submission/deck/build_sunum_tr.py
Çıktı:     docs/submission/Martian_Map_Sunum_TR_iskelet.pptx
PowerPoint 2016 uyumlu: temel şekil, metin ve resim; Morph/Zoom/SVG yok.
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
DATAIMG = os.path.join(ROOT, 'docs/data/img')

CARD = '14100E'
WHITE, BEIGE, GREY, ORANGE, GOLD, PEACH = 'FFFFFF', 'EFE6DD', '8C8279', 'F07226', 'D9A66F', 'E3B686'
HEAD, BODY = 'Barlow Condensed', 'Barlow'
TAGS = {'ÖLÇÜM': ORANGE, 'MODEL': GOLD, 'VARSAYIM': GREY, 'BAĞLAM': GREY, 'ÖLÇÜM + MODEL': ORANGE}
X0 = Inches(0.7)                       # şablonun sol kenar boşluğu
MEDIA = dict(x=X0, y=Inches(2.1), w=Inches(9.0), h=Inches(5.06))     # 16:9
COL_X, COL_W = Inches(10.0), Inches(2.63)                            # sağ sütun: etiket + tek rakam


def rgb(h):
    return RGBColor.from_string(h)


def tr_upper(s):
    return s.replace('i', 'İ').replace('ı', 'I').upper()


# Sayfa: dict(kind, section, title, src[(metin,url)], tag, big, bigcap, media, act, say, num)
def P(kind, section, title, src, tag, media, act, say, num='', big=None, bigcap=None):
    return dict(kind=kind, section=section, title=title, src=src, tag=tag, media=media,
                act=act, say=say, num=num, big=big, bigcap=bigcap)


EVA = ('NASA EVA-EXP-0075 (20°) · nasa.gov', 'https://www.nasa.gov/wp-content/uploads/2020/01/topic_1-_eva_lunar_surface_concept_of_operations.pdf')
ACTA = ('Acta Astronautica 2023 (15°) · sciencedirect.com', 'https://www.sciencedirect.com/science/article/pii/S0094576523005179')
MMGIS = ('NASA/JPL MMGIS · science.nasa.gov', 'https://science.nasa.gov/mission/msl-curiosity/location-map/')
NAV = ('NASA/JPL-Caltech Navcam · mars.nasa.gov', 'https://mars.nasa.gov/msl/multimedia/raw-images/')

S = [
 P('cover', 'NASA SPACE APPS 2026 · KONYA', 'Martian Map', [], None, None,
   'Kapak, ek video yok.', 'Mars\'ta yürüyüşü önceden prova ettiriyoruz.',
   bigcap='Gale kraterinde bir astronot görev provası'),
 P('video', 'GALE KRATERİ', 'Simülatör', [], None, '4,5 sn',
   'Görev seçimi, ardından S1 brifingi.', 'Gale kraterinde bir astronot görev provası.'),
 # Arazi ve veri
 P('image', 'ARAZİ VE VERİ', 'Arazi', [('USGS Gale DEM 1 m · astrogeology.usgs.gov', 'https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m')], 'ÖLÇÜM',
   ('data', 'gale_dtm_ortho_preview.png'),
   'Statik: HiRISE DTM + ortofoto (isteğe bağlı: 3B arazide yürüyüş videosu).', 'Arazi gerçek HiRISE yükseklik verisi.', '1 m DTM [USGS]',
   big='1 m', bigcap='HiRISE yükseklik verisi'),
 P('video', 'ARAZİ VE VERİ', 'Curiosity izi', [MMGIS], 'ÖLÇÜM', '4,5 sn',
   'Curiosity izi ve durak işaretçileri.', 'Gerçek rover izinin üstünde yürüyoruz.'),
 P('video', 'ARAZİ VE VERİ', 'Eğim', [EVA, ACTA], 'VARSAYIM', '4,5 sn',
   'Eğim rengi, dik bölgeye yaklaşma.', '15° dikkat, 20° geçilmez. Mars için doğrulanmış değil, planlama varsayımı.', '`docs/eva_parameters.md`',
   big='15° · 20°', bigcap='dikkat · geçilmez'),
 P('video', 'ARAZİ VE VERİ', 'Kayalar', [('HiRISE 25 cm ortofoto · astrogeology.usgs.gov', 'https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm')], 'MODEL', '4,5 sn',
   'Kaya haritası, kayaya çarpmadan yürüme.', 'Kayaları ortofotodan kendi dedektörümüzle buluyoruz.',
   'Yedek: 123 büyük tespitin 120\'si çıkıntı ya da gölge [VALIDATION.md §6]'),
 P('video', 'ARAZİ VE VERİ', 'Zemin', [('AI4Mars · zenodo.org', 'https://zenodo.org/records/15995036')], 'MODEL', '4,5 sn',
   'Ayak altı zemin satırı değişir.', 'Zemin sınıfını Navcam karelerinden modelle tahmin ediyoruz.', 'MODEL_CARD.md'),
 P('video', 'ARAZİ VE VERİ', 'Bilim durakları', [('MRO CRISM · pds-geosciences.wustl.edu', 'https://pds-geosciences.wustl.edu/mro/mro-m-crism-5-rdr-mptargeted-v1/')], 'BAĞLAM', '4,5 sn',
   'Bilim durağına varış.', 'Duraklar yayınlanmış jeoloji birim haritasından seçildi.', 'CRISM piksel düzeyinde kullanılmadı [docs/data/crism_geology.md §3]'),
 # Göstergeler
 P('video', 'GÖSTERGELER', 'Enerji', [('Pandolf vd. 1977 · doi.org', 'https://doi.org/10.1152/jappl.1977.43.4.577')], 'VARSAYIM', '4,5 sn',
   'Enerji göstergesi akar.', 'Pandolf denklemi, Apollo EVA ortalamasına kalibre.', '272 W [SP-368]',
   big='272 W', bigcap='Apollo EVA ortalaması'),
 P('card', 'GÖSTERGELER', 'Oksijen', [('NASA SP-368 · ntrs.nasa.gov', 'https://ntrs.nasa.gov/api/citations/19760005584/downloads/19760005584.pdf')], 'VARSAYIM', None,
   'Kart (isteğe bağlı: O₂ göstergesi videosu).', 'Oksijen enerjiden türetildi.', '1800 kcal ÷ 4,8 kcal/L ≈ 375 L [docs/eva_parameters.md]',
   big='≈ 375 L', bigcap='1800 kcal ÷ 4,8 kcal/L'),
 P('video', 'GÖSTERGELER', 'Radyasyon', [('Hassler vd. 2014 · doi.org', 'https://doi.org/10.1126/science.1244797')], 'ÖLÇÜM', '4,5 sn',
   'Doz sayacı akar.', 'Curiosity\'nin ölçtüğü sabit yüzey doz hızıyla akıyor; rota boyunca ölçüm değil.', '0,210 ± 0,040 mGy/gün; 8,75 µGy/sa [Hassler 2014]',
   big='0,210 mGy/gün', bigcap='Curiosity RAD, yüzey ortalaması'),
 P('card', 'GÖSTERGELER', 'Süre ve yük', [('Ogilvie vd. 2026 · ntrs.nasa.gov', 'https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf')], 'VARSAYIM', None,
   'Kart.', 'Süre 7 saat, yürüme hızı 0,75 m/s.', '[SP-368; Ogilvie 2026]',
   big='7 sa', bigcap='yürüme hızı 0,75 m/s'),
 # Algı
 P('video', 'ALGI', 'Kask kamerası', [NAV], 'ÖLÇÜM + MODEL', '7,5 sn',
   'Durakta gerçek Navcam + model maskesi, sürgü.', 'Gerçek Navcam karesinin üstünde modelin yorumu.'),
 P('video', 'ALGI', 'Tarayıcı', [('SCAN_CHECK.md · ml/rover_terrain', None)], 'MODEL', '4,5 sn',
   'Tarayıcı uyarısı, düşük kanıt işareti.', 'Tarayıcı uyarır ve kanıtın az olduğu yeri de işaretler.'),
 # Rota
 P('video', 'ROTA', '3 rota', [('metabolic_model.md · docs', None)], 'MODEL', '7,5 sn',
   'Rota kartları, segment nedeni.', 'Üç rota, her segmentin nedeni yazılı.', 'S1: 19,9 / 20,1 / 20,9 dk; 95 / 96 / 99 kcal [sim/data/routes/S1.json]'),
 P('video', 'ROTA', 'Kendi rotan', [], None, '4,5 sn',
   'Haritada başlangıç ve hedef seçimi.', 'İstediğin iki noktayı seç, planlayıcı rotayı çıkarsın.'),
 P('video', 'ROTA', 'Canlı rota', [('Planlayıcı · api/planner', None)], 'MODEL', '7,5 sn',
   'Kum yamasına yaklaş, çizgi yön değiştirir.', 'Kum çıkınca çizgi bulunduğun yerden yeniden hesaplanıyor.', '~3 m / 4 sn, ~0,8 sn hesap',
   big='~0,8 sn', bigcap='yeniden hesap süresi'),
 # Görev
 P('video', 'GÖREV', 'Numune ve dönüş', [], None, '7,5 sn',
   'E basılı: numune alma (+8 kg), ardından ağır yükle üsse yürüyüş.', 'Hedefte numune alıyor ve ağırlaşan yükle üsse dönüyoruz.', '+8 kg [PROJECT.md]',
   big='+8 kg', bigcap='numune yükü'),
 P('video', 'GÖREV', 'Karne', [], None, '4,5 sn',
   'Karne ekranı (derece hatası düzeldiyse).', 'Karne planlananla harcananı karşılaştırır.'),
 # Kanıt
 P('image', 'KANIT', 'Curiosity kıyası', [MMGIS], 'ÖLÇÜM + MODEL', ('fig', 'msl_compare.png'),
   'Statik görsel.', 'Aynı iki noktada Curiosity 3,89 km gitti, bizim rotalarımız 2,3 km. Yalnız geometri.', '2,26–2,40 km; ~130 m [DENETIM_masa_arastirmalari §3]',
   big='~130 m', bigcap='Curiosity izine ortalama uzaklık'),
 P('image', 'KANIT', 'Navcam = simülatör', [NAV], 'ÖLÇÜM', ('fig', 'sim_06_navcam_vs_sim.png'),
   'Statik görsel.', 'Aynı durak, aynı yön: solda Navcam, sağda simülatör.'),
 P('card', 'KANIT', 'Zemin modeli', [('METRICS.md · ml/rover_terrain', None)], 'MODEL', None,
   'Metrik kartı.', 'Uzman etiketli testte model iyi ve kalibre.', 'mIoU 0,798; ECE 0,004 [METRICS.md]',
   big='mIoU 0,798', bigcap='uzman etiketli test · kalibrasyon hatası 0,004'),
 P('image', 'SINIR', 'Kumu kaçırıyoruz', [('SCAN_CHECK.md · ml/rover_terrain', None)], 'MODEL', ('fig', 'navcam_vs_model.png'),
   'Statik görsel.', 'Kumu kaçırıyoruz; bunu da gösteriyoruz.', 'Navcam eşleşmesi 3/6; kumlu 7 durağın 2\'sinde yakaladı [SCAN_CHECK.md]',
   big='3 / 6', bigcap='Navcam eşleşmesi'),
 P('cover', 'MARTIAN MAP', 'Teşekkürler', [], None, None,
   'Kapanış.', 'Teşekkürler; sorularınız için hazırız.', 'QR ve link: repo public yapılana ya da demo linki verilene kadar boş',
   bigcap='Sorularınız için hazırız'),
]

BACKUP = [
 ('Kum', 'Model kumu az tahmin ediyor: 13 kum adayında en yüksek p_sand 0,111; kumlu 7 durağın 2\'sinde yakaladı. [ml/orbital/VALIDATION.md §7]'),
 ('Kaya', 'Büyük 123 tespitin 120\'si çıkıntı ya da gölge, 3\'ü tek kaya. [ml/orbital/VALIDATION.md §6]'),
 ('Enerji', 'Enerji muhtemelen az tahmin (kanıtlı alt sınır değil): Dünya katsayıları, Mars için doğrulanmadı. Mars skafandr tasarım ortalaması 352 W, biz Apollo 272 W\'a kalibre ettik. [docs/metabolic_model.md]'),
 ('20°', '20° NASA EVA Ay ConOps gereksinimi (EVA-EXP-0075); Mars için doğrulanmış değil, planlama varsayımı. 15° dikkat eşiği Artemis planlamasından.'),
 ('Güven', 'Model güveni hatayı yakalamıyor: isabetli durakların belirsizliği 0,21, ıskalananlarınki 0,18. Piksel kalibrasyonu iyi (ECE 0,004). [MODEL_CARD.md]'),
 ('Yapay zekâ', 'Zemin modeli DeepLabv3+ (ResNet34), AI4Mars ile eğitildi, MC Dropout ile belirsizlik. Kaya dedektörü klasik görüntü işleme. Kod ve belgelerde yapay zekâ asistanı (Claude Code) kullanıldı; sayılar kaynaklarıyla kontrol edildi. Astronot Quaternius (CC0), three.js (MIT).'),
 ('Model rotayı değiştirmedi', '20° eşiğinde tam model ile eğim + kaya planlayıcı S1–S3 için aynı yolları buluyor (9/9); risk farkı %0–2. Modelin değeri kask kamerasında, ayak altı zeminde ve belirsizlikte. [#127]'),
]


def style_run(r, font=BODY, size=12, color=WHITE, bold=False, spc=None):
    r.font.name, r.font.size, r.font.bold = font, Pt(size), bold
    r.font.color.rgb = rgb(color)
    if spc is not None:
        r.font._element.set('spc', str(spc))


def add_text(slide, x, y, w, h, text, size, color, font=BODY, bold=False, align=PP_ALIGN.LEFT,
             anchor=MSO_ANCHOR.TOP, name=None, spc=None):
    tb = slide.shapes.add_textbox(x, y, w, h)
    if name:
        tb.name = name
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    style_run(p.add_run(), font, size, color, bold, spc)
    p.runs[0].text = text
    return tb


def set_placeholder(ph, text):
    ph.text_frame.text = text


def drop_unused_placeholders(slide, keep):
    for ph in list(slide.placeholders):
        if ph.placeholder_format.idx not in keep:
            ph._element.getparent().remove(ph._element)


def add_sources(slide, src):
    if not src:
        return
    tb = slide.shapes.add_textbox(Inches(5.3), Inches(0.85), Inches(7.33), Inches(0.9))
    tb.name = 'KAYNAK'
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, (text, url) in enumerate(src):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.RIGHT
        r = p.add_run()
        r.text = text
        style_run(r, BODY, 11, GREY)
        if url:
            r.hyperlink.address = url
            r.font.color.rgb = rgb(GREY)


def add_eyebrow(slide, text):
    add_text(slide, X0, Inches(0.85), Inches(4.5), Inches(0.3), text, 12, ORANGE, bold=True,
             name='ETIKET_ALT', spc=300)


def add_tag(slide, tag):
    c = TAGS[tag]
    w = Inches(2.0) if '+' in tag else Inches(1.5)
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, COL_X, MEDIA['y'], w, Inches(0.38))
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
    style_run(r, BODY, 12, c, True, 100)


def add_big(slide, big, cap):
    add_text(slide, COL_X, Inches(3.35), COL_W, Inches(1.1), big, 44, ORANGE, font=HEAD, bold=True,
             anchor=MSO_ANCHOR.BOTTOM, name='RAKAM')
    ln = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, COL_X, Inches(4.55), Inches(0.8), Emu(25400))
    ln.name = 'CIZGI'
    ln.fill.solid(); ln.fill.fore_color.rgb = rgb(ORANGE); ln.line.fill.background()
    add_text(slide, COL_X, Inches(4.7), COL_W, Inches(0.9), cap, 14, PEACH, name='RAKAM_ALT')


def add_video_box(slide, dur):
    m = MEDIA
    box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, m['x'], m['y'], m['w'], m['h'])
    box.name = 'VIDEO_YER'
    box.fill.solid(); box.fill.fore_color.rgb = rgb(CARD)
    box.line.color.rgb = rgb(GREY); box.line.width = Pt(1); box.line.dash_style = MSO_LINE.DASH
    tf = box.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = f'VİDEO · {dur} · 2 tur (yerine koy, bu kutuyu sil)'
    style_run(r, BODY, 18, GREY)


def add_image(slide, which, name):
    from PIL import Image
    path = os.path.join(FIG if which == 'fig' else DATAIMG, name)
    m = MEDIA
    iw, ih = Image.open(path).size
    sc = min(m['w'] / iw, m['h'] / ih)
    pw, ph = int(iw * sc), int(ih * sc)
    pic = slide.shapes.add_picture(path, m['x'], m['y'] + (m['h'] - ph) // 2, pw, ph)
    pic.name = 'GORSEL'


def add_card(slide, big, cap):
    m = MEDIA
    box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, m['x'], m['y'], m['w'], m['h'])
    box.name = 'KART'
    box.fill.solid(); box.fill.fore_color.rgb = rgb(CARD)
    box.line.fill.background()
    add_text(slide, m['x'], m['y'] + Inches(1.4), m['w'], Inches(1.6), big, 100, ORANGE, font=HEAD, bold=True,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, name='KART_SAYI')
    add_text(slide, m['x'], m['y'] + Inches(3.25), m['w'], Inches(0.6), cap, 22, PEACH,
             align=PP_ALIGN.CENTER, name='KART_ALT')


def add_notes(slide, d):
    t = f'GIF/eylem: {d["act"]}\nSöyle: {d["say"]}'
    if d['num']:
        t += f'\nSayı ve kaynak: {d["num"]}'
    slide.notes_slide.notes_text_frame.text = t


def build_cover(prs, lay, d):
    s = prs.slides.add_slide(lay)
    phs = sorted(s.placeholders, key=lambda p: p.top)
    set_placeholder(phs[0], d['section'])
    set_placeholder(phs[1], tr_upper(d['title']).replace(' ', '\n') if d['title'] != 'Teşekkürler' else 'TEŞEKKÜRLER')
    set_placeholder(phs[2], d['bigcap'] or '')
    add_text(s, X0, Inches(7.0), Inches(9.0), Inches(0.25),
             'Arka plan görseli şablondaki sentetik Mars manzarasıdır; NASA verisi değildir.', 10, PEACH, name='SENTETIK_NOT')
    add_notes(s, d)


def build_page(prs, lay, d):
    s = prs.slides.add_slide(lay)
    phs = sorted(s.placeholders, key=lambda p: p.top)
    title = phs[0]
    title.left, title.top, title.width, title.height = X0, Inches(1.15), Inches(11.93), Inches(0.85)
    title.text_frame.text = tr_upper(d['title'])
    for r in title.text_frame.paragraphs[0].runs:
        r.font.size = Pt(44)
        r.font.color.rgb = rgb(WHITE)
    drop_unused_placeholders(s, {title.placeholder_format.idx})
    add_eyebrow(s, d['section'])
    add_sources(s, d['src'])
    if d['kind'] == 'video':
        add_video_box(s, d['media'])
    elif d['kind'] == 'image':
        add_image(s, *d['media'])
    elif d['kind'] == 'card':
        add_card(s, d['big'], d['bigcap'])
    if d['tag']:
        add_tag(s, d['tag'])
    if d['big'] and d['kind'] != 'card':
        add_big(s, d['big'], d['bigcap'])
    add_notes(s, d)
    return s


def main():
    prs = Presentation(TEMPLATE)
    ids = prs.slides._sldIdLst
    for sid in list(ids):
        prs.part.drop_rel(sid.rId)
        ids.remove(sid)
    lays = {l.name: l for l in prs.slide_layouts}
    cover, media = lays['SURFACE_COVER'], lays['SURFACE_MEDIA_ROW']
    for l in list(prs.slide_layouts):          # kullanılmayan düzenler dosyayı şişirir
        if l not in (cover, media):
            prs.slide_layouts.remove(l)
    for d in S:
        (build_cover if d['kind'] == 'cover' else build_page)(prs, cover if d['kind'] == 'cover' else media, d)
    for title, body in BACKUP:
        s = prs.slides.add_slide(media)
        phs = sorted(s.placeholders, key=lambda p: p.top)
        phs[0].left, phs[0].top, phs[0].width, phs[0].height = X0, Inches(1.15), Inches(11.93), Inches(0.85)
        phs[0].text_frame.text = tr_upper('Yedek · ' + title)
        for r in phs[0].text_frame.paragraphs[0].runs:
            r.font.size = Pt(44)
            r.font.color.rgb = rgb(WHITE)
        drop_unused_placeholders(s, {phs[0].placeholder_format.idx})
        add_eyebrow(s, 'YEDEK · SORU GELİRSE')
        add_text(s, X0, Inches(2.4), Inches(10.5), Inches(4.2), body, 28, BEIGE, name='YEDEK_METIN')
        s.notes_slide.notes_text_frame.text = 'Yedek sayfa: yalnız soru gelirse aç. Sunum sırasında geçilmez (Gizle).'
    prs.save(OUT)
    print('yazıldı:', OUT, len(prs.slides._sldIdLst), 'slayt')


if __name__ == '__main__':
    main()
