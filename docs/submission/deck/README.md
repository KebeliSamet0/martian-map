# Sunum dosyası (`../Martian_Map_slides.pptx`)

- Şablon: Bora'nın **Mars Space** şablonu (#141, `Mars_Space_Template.pptx`).
- İçerik: `docs/submission/SLIDES.md` (7 slayt + 1 yedek). Görseller `docs/figures/` altındaki gerçek simülatör kareleri.
- Her slaytın konuşmacı notunda Türkçe kaynak satırı var.
- Sunum bilgisayarına **Poppins** ve **Orbitron** fontları kurulmalı (Google Fonts, ücretsiz). Kurulu değilse PowerPoint başka fonta geçer, düzen kayar.

Yeniden üretmek (ör. `sim_08_debrief.png` güncellenince):

```bash
python -m pip install python-pptx pillow lxml
python docs/submission/deck/build_deck.py <Mars_Space_Template.pptx> . docs/submission/Martian_Map_slides.pptx
python docs/submission/deck/postprocess_round.py docs/submission/Martian_Map_slides.pptx
```

`postprocess_round.py` Bora'nın şablon paketinden; fotoğraf kartlarına yuvarlak köşe verir.
