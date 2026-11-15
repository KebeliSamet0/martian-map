#!/usr/bin/env python3
"""
Give every picture whose alt text is 'photo-round' a rounded-rectangle shape (0.2 in corner radius),
so 'Change Picture' in PowerPoint keeps the rounded corners.
Usage: python3 postprocess_round.py deck.pptx
"""
import re
import shutil
import sys
import zipfile

RADIUS_EMU = int(0.2 * 914400)
PIC = re.compile(r"<p:pic>.*?</p:pic>", re.S)


def fix(m):
    pic = m.group(0)
    if 'descr="photo-round"' not in pic:
        return pic
    ext = re.search(r'<a:ext cx="(\d+)" cy="(\d+)"', pic)
    cx, cy = int(ext.group(1)), int(ext.group(2))
    adj = min(50000, int(RADIUS_EMU / min(cx, cy) * 100000))
    pic = re.sub(r'<a:prstGeom prst="rect">\s*<a:avLst\s*/>\s*</a:prstGeom>',
                 f'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val {adj}"/></a:avLst></a:prstGeom>', pic)
    return pic.replace('descr="photo-round"', 'descr="Photo"')


def main(path):
    tmp = path + ".tmp"
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename.startswith("ppt/slides/slide") and item.filename.endswith(".xml"):
                data = PIC.sub(fix, data.decode("utf8")).encode("utf8")
            zout.writestr(item, data)
    shutil.move(tmp, path)
    print("rounded photos in", path)


if __name__ == "__main__":
    main(sys.argv[1])
