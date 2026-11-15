"""Martian Map sunumu: Bora'nın Mars Space şablonu (#141) + docs/submission/SLIDES.md içeriği + gerçek simülatör kareleri."""
import sys, copy
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from PIL import Image

TPL, REPO, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
FIG = REPO + '/docs/figures/'
PEACH, ORANGE, WHITE, BLACK, GREY = RGBColor(0xFF, 0xA0, 0x48), RGBColor(0xF0, 0x72, 0x26), RGBColor(255, 255, 255), RGBColor(0, 0, 0), RGBColor(0xBF, 0xBF, 0xBF)

prs = Presentation(TPL)
# örnek slaytları kaldır
sldIdLst = prs.slides._sldIdLst
for sldId in list(sldIdLst):
    prs.part.drop_rel(sldId.rId); sldIdLst.remove(sldId)
# üst bilgi metinleri (layout 1-3)
for lay in prs.slide_layouts:
    for sh in lay.shapes:
        if sh.has_text_frame and not sh.is_placeholder:
            for p in sh.text_frame.paragraphs:
                for r in p.runs:
                    if r.text == 'yourwebsite.com': r.text = 'github.com/KebeliSamet0/martian-map'
                    elif r.text == '2035': r.text = 'SPACE APPS 2026'
L = {l.name: l for l in prs.slide_layouts}
# sağ üst bilgi kutusu dar: genişlet
for name in ('MARS_COVER', 'MARS_MEDIA_ROW', 'MARS_SPLIT_COLLAGE'):
    for sh in L[name].shapes:
        if sh.has_text_frame and not sh.is_placeholder and sh.text_frame.text == 'SPACE APPS 2026':
            sh.left = Inches(9.63); sh.width = Inches(3.0)


def ph(slide, idx):
    for p in slide.placeholders:
        if p.placeholder_format.idx == idx: return p
    raise KeyError(idx)


def put(slide, idx, items, size=None, space=None):
    """items: str | list of paragraphs; a paragraph = str or list of (text, dict) runs."""
    tf = ph(slide, idx).text_frame
    if isinstance(items, str): items = [items]
    for i, para in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        if space is not None and i < len(items) - 1: p.space_after = Pt(space)
        runs = [(para, {})] if isinstance(para, str) else para
        for text, o in runs:
            r = p.add_run(); r.text = text
            if o.get('b'): r.font.bold = True
            if 'c' in o: r.font.color.rgb = o['c']
            if 'sz' in o: r.font.size = Pt(o['sz'])
            elif size: r.font.size = Pt(size)


def photo(slide, file, x, y, w, h, crop=None, round_=True, name='Photo'):
    """Kartı doldur (cover): görseli kart oranına kırp. crop=(l,t,r,b) piksel önkırpma."""
    im = Image.open(file); W, H = im.size
    l, t, r, b = crop or (0, 0, W, H)
    cw, ch = r - l, b - t; target = w / h
    if cw / ch > target:   # fazla geniş: yanlardan
        nw = ch * target; l += (cw - nw) / 2; r = l + nw
    else:
        nh = cw / target; t += (ch - nh) / 2; b = t + nh
    pic = slide.shapes.add_picture(file, Inches(x), Inches(y), Inches(w), Inches(h))
    pic.crop_left, pic.crop_top, pic.crop_right, pic.crop_bottom = l / W, t / H, (W - r) / W, (H - b) / H
    pic.name = name
    if round_: pic._element.nvPicPr.cNvPr.set('descr', 'photo-round')
    else: pic._element.nvPicPr.cNvPr.set('descr', name)
    return pic


def card(slide, x, y, w, h, rgb, transparency=0, name='Card'):
    from pptx.enum.shapes import MSO_SHAPE
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    s.adjustments[0] = min(0.5, 0.28 / min(w, h)); s.name = name
    s.fill.solid(); s.fill.fore_color.rgb = rgb; s.line.fill.background(); s.shadow.inherit = False
    tree = slide.shapes._spTree; tree.remove(s._element); tree.insert(2, s._element)
    if transparency:
        from lxml import etree
        clr = s.fill._xPr.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}srgbClr')
        a = etree.SubElement(clr, '{http://schemas.openxmlformats.org/drawingml/2006/main}alpha'); a.set('val', str(int((100 - transparency) * 1000)))
    return s


def text(slide, x, y, w, h, paras, align=PP_ALIGN.LEFT, name='Text'):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)); tb.name = name
    tf = tb.text_frame; tf.word_wrap = True
    for m in ('margin_left', 'margin_right', 'margin_top', 'margin_bottom'): setattr(tf, m, 0)
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph(); p.alignment = align
        for t, o in para:
            r = p.add_run(); r.text = t; r.font.name = o.get('font', 'Poppins'); r.font.size = Pt(o.get('sz', 14))
            r.font.bold = o.get('b', False); r.font.color.rgb = o.get('c', WHITE)
    return tb


def notes(slide, t): slide.notes_slide.notes_text_frame.text = t


B = {'b': True}
# 1 Problem ---------------------------------------------------------------
s = prs.slides.add_slide(L['MARS_PLANET_RIGHT'])
put(s, 100, 'The route sets\nthe EVA budget')
t_ = ph(s, 100); t_.left = Inches(0.6); t_.top = Inches(0.45); t_.width = Inches(5.2); t_.height = Inches(1.6)
b_ = ph(s, 101); b_.left = Inches(0.6); b_.top = Inches(2.3); b_.width = Inches(4.6); b_.height = Inches(4.7)
put(s, 101, [
    'On Mars, the route decides how much oxygen, energy and time an EVA uses.',
    'Gravity is 3/8 of Earth\'s, yet suited walking is hard: suit mass and walk-back distance are design limits.',
    'Terrain sets the cost: walking on sand takes up to 2.7× the energy of firm ground (Earth data).',
    'Route tools draw a line. They do not show why, how sure, or how the budget drains.',
], size=16, space=12)
notes(s, 'Kaynaklar: Ogilvie et al. 2026 (NASA JSC, Mars suit mass); Lejeune et al. 1998 (J Exp Biol 201:2071, sand 2.1–2.7x, Dünya ölçümü). '
         'Konuşma: Mars\'ta yürüyüş rotası, yaşam destek bütçesinin ne kadarının harcanacağını belirler.')

# 2 Solution --------------------------------------------------------------
s = prs.slides.add_slide(L['MARS_MEDIA_ROW'])
put(s, 102, 'REHEARSE THE EVA\nBEFORE YOU TAKE IT')
for i, (f, crop) in enumerate([('sim_01_intro.png', None), ('sim_04_walk_hud.png', None), ('sim_05_helmetcam.png', (560, 60, 1360, 900))]):
    photo(s, FIG + f, 0.7 + 4.0 * i, 3.0, 3.95, 1.95, crop=crop, name=f'Photo {i+1}')
put(s, 103, 'MARTIAN MAP: AN EVA REHEARSAL PROTOTYPE')
put(s, 104, [
    'Pick one of three routes, each with a time, energy, oxygen and dose budget.',
    'Walk it in 3D on HiRISE terrain where Curiosity drove.',
    'The gauges update model estimates; the helmet camera shows real Navcam frames.',
], size=13, space=4)
notes(s, 'Görseller gerçek simülatörden (docs/figures/sim_01, sim_04, sim_05; ?lang=en, 1920x1080). '
         'Ölçüm, model tahmini ve planlama varsayımı ayrı etiketli. "Oyun" kelimesi kullanılmıyor.')

# 3 Data ------------------------------------------------------------------
s = prs.slides.add_slide(L['MARS_INFO_CARDS'])
card(s, 0.7, 1.3, 5.2, 2.25, GREY, name='Info card 1')
card(s, 0.7, 4.65, 5.2, 2.0, GREY, name='Info card 2')
put(s, 100, 'NASA DATA FROM CURIOSITY\'S ROUTE')
put(s, 101, [
    [('Terrain: ', {'b': True, 'c': BLACK}), ('USGS HiRISE DTM 1 m + orthophoto 25 cm', {'c': BLACK})],
    [('Area: ', {'b': True, 'c': BLACK}), ('2 × 2 km boxwork, Gale crater', {'c': BLACK})],
    [('Rover evidence: ', {'b': True, 'c': BLACK}), ('391 Navcam frames at 128 stops', {'c': BLACK})],
    [('Labels: ', {'b': True, 'c': BLACK}), ('AI4Mars expert test set', {'c': BLACK})],
], size=15, space=3)
put(s, 102, 'SCIENCE AND SAFETY CONTEXT')
put(s, 103, [
    [('Radiation: ', {'b': True, 'c': BLACK}), ('Curiosity RAD, 0.210 ± 0.040 mGy/day', {'c': BLACK})],
    [('Minerals: ', {'b': True, 'c': BLACK}), ('CRISM, for science stops only', {'c': BLACK})],
    [('Target: ', {'b': True, 'c': BLACK}), ('rover stop of the Atacama drill campaign', {'c': BLACK})],
], size=15, space=3)
notes(s, 'Kaynaklar: docs/REFERENCES.md (USGS MSL Gale merged DTM/ortho), ml/rover_terrain/LAYERS.md (391 kare, 128 durak), '
         'Hassler et al. 2014 (RAD), docs/data/crism_geology.md. Kesin sondaj noktası doğrulanmadı; sol aralığıyla eşlendi.')

# 4 Chain -----------------------------------------------------------------
s = prs.slides.add_slide(L['MARS_ACTIVITY'])
put(s, 100, 'Pixels to an explained route')
put(s, 101, [
    [('Slope: ', B), ('HiRISE DTM, 2 m grid; no-go at 20° (lunar EVA planning source).', {})],
    [('Rocks: ', B), ('our HiRISE shadow detector.', {})],
    [('Terrain class: ', B), ('AI4Mars model with uncertainty.', {})],
    [('Energy: ', B), ('Pandolf equation, calibrated to the Apollo EVA average of 272 W.', {})],
    [('Three routes: ', B), ('shortest, balanced, safest, each segment with its reason.', {})],
    [('Honest result: ', B), ('at 20°, the terrain model and the slope + rock planner pick the same S1–S3 paths (9 of 9).', {})],
], size=15, space=10)
photo(s, FIG + 'sim_03_routes_compare.png', 8.55, 1.85, 4.15, 4.9, crop=(580, 80, 1340, 1000), name='Routes screen')
notes(s, 'Kaynaklar: docs/metabolic_model.md, NASA SP-368 (272 W), api/planner/params.py (15°/20°, Artemis 2023 + NASA EVA ConOps; Ay kaynakları). '
         'Emre #127: 20° sonrası model S1-S3 rotalarını değiştirmiyor; "model rotayı değiştirdi" DEME. Modelin değeri: kask kamerası, ayak altı zemin oranı, belirsizlik.')

# 5 Mission ---------------------------------------------------------------
s = prs.slides.add_slide(L['MARS_SPLIT_COLLAGE'])
put(s, 102, 'ONE MISSION, START TO FINISH')
put(s, 103, [
    'Briefing, route choice, walk, decision, sample (+8 kg), return to base, debrief.',
    'A sand patch in the scenario raises a choice: accept the planner\'s new route or continue.',
    'S3 cuts the oxygen budget to 80 L: the astronaut weighs turning back.',
], size=13, space=4)
put(s, 104, 'BRIEFING TO\nDEBRIEF')
photo(s, FIG + 'sim_05_helmetcam.png', 8.3, 0.85, 4.4, 5.65, crop=(600, 70, 1320, 900), name='Helmet camera')
photo(s, FIG + 'sim_07_sand_warning.png', 0.7, 5.3, 6.8, 1.9, crop=(0, 0, 1920, 560), name='Sand warning')
notes(s, 'Kaynak: sim/data/missions.json. Kum olayı senaryoda önceden tanımlı; canlı sensör yok. S3\'te yazılım dönüşü zorunlu kılmıyor. '
         'Kask kamerası: gerçek Navcam (NASA/JPL-Caltech) + model maskesi (tahmin).')

# 6 Validation ------------------------------------------------------------
s = prs.slides.add_slide(L['MARS_MEDIA_ROW'])
put(s, 102, 'CHECKED AGAINST\nROVER DATA')
photo(s, FIG + 'msl_compare.png', 0.7, 2.95, 2.15, 2.15, round_=False, name='Curiosity track vs routes')
photo(s, FIG + 'navcam_vs_model.png', 3.0, 2.95, 2.87, 2.15, round_=False, name='Navcam vs model')
stats = [('2.26–2.40 km', 'our routes vs 3.89 km Curiosity drove, same endpoints'), ('0.798 mIoU', 'expert-labelled test; large-rock recall 0.97'), ('3 of 6', 'stops right in scanner vs Navcam; misses were sandy')]
for i, (big, small) in enumerate(stats):
    text(s, 6.4, 2.95 + i * 0.75, 6.3, 0.7, [[(big + '  ', {'sz': 22, 'b': True, 'c': PEACH}), (small, {'sz': 13})]], name=f'Stat {i+1}')
put(s, 103, 'GEOMETRY ONLY; HUMAN ENERGY IS UNVALIDATED')
put(s, 104, ['Sand is the weak spot: highest model p_sand at 13 sand candidates is 0.111. Pixel calibration (ECE 0.004) does not mean the model catches its own errors.'], size=13)
notes(s, 'Kaynaklar: docs/sim/DENETIM_masa_arastirmalari_2026-11-15.md §3 (2257.9/2284.1/2396.3 m, ~130 m sapma), ml/rover_terrain/METRICS.md (test_min3: 0,798 / 0,973 / 0,004), '
         'ml/rover_terrain/SCAN_CHECK.md, ml/orbital/VALIDATION.md §7. Kıyas yalnız geometri.')

# 7 Impact ----------------------------------------------------------------
s = prs.slides.add_slide(L['MARS_FULLBLEED'])
photo(s, FIG + 'sim_08_debrief.png', 0.6, 0.9, 5.6, 4.6, name='Debrief')
card(s, 7.15, 2.9, 5.6, 3.95, RGBColor(0x2E, 0x3F, 0x52), transparency=25, name='Slate card')
put(s, 100, 'REHEARSE WITH\nREAL DATA')
put(s, 101, [
    'Compare the cost and risk of routes before anyone steps out, with every assumption labelled.',
    'Next: Mars suit test data for the coefficients, labels for the 2025 boxwork area, RAD/REMS records as context.',
    'Open code. A prototype using NASA data, without operational approval.',
], size=14, space=8)
text(s, 0.6, 6.7, 6.0, 0.35, [[('github.com/KebeliSamet0/martian-map', {'sz': 13, 'c': WHITE})]], name='Repo link')
notes(s, 'Güvenlik etkisi ölçülmedi. Sınırlar tıbbi eşik değil, planlama varsayımı. Demo/video linki ve QR gelince eklenecek. '
         'Karne görseli: S1, gerçek yürüyüş (docs/figures/sim_08).')

# 8 Backup ----------------------------------------------------------------
s = prs.slides.add_slide(L['MARS_ACTIVITY'])
put(s, 100, 'Backup: measured vs assumed')
b_ = ph(s, 101); b_.left = Inches(0.7); b_.top = Inches(1.85); b_.width = Inches(6.2); b_.height = Inches(4.95)
put(s, 101, [
    [('Measured: ', B), ('DTM elevation and slope; Curiosity RAD dose rate; Apollo EVA average 272 W.', {})],
    [('Earth data applied to Mars: ', B), ('Pandolf energy; terrain coefficients (sand 2.1, low end of 2.1–2.7×).', {})],
    [('Assumed: ', B), ('Mars gravity scaling, so energy is likely underestimated (not a proven lower bound).', {})],
    [('Planning limits: ', B), ('6 h, 2000 kcal, 420 L O₂; dose budget 60 µGy is not a NASA limit.', {})],
    [('Slope: ', B), ('15° caution, 20° no-go, both from lunar EVA sources; not validated for Mars.', {})],
    [('Terrain model: ', B), ('64.6% of cells above the uncertainty threshold; it under-reports sand.', {})],
], size=13, space=8)
notes(s, 'Tam metin: docs/sunum_taslak.md bölüm 4; docs/eva_parameters.md; docs/metabolic_model.md.')

prs.core_properties.title = 'Martian Map: EVA rehearsal'
prs.core_properties.author = 'Martian Map team'
prs.save(OUT)
print('saved', OUT, len(prs.slides))
