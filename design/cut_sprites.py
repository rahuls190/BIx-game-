"""Find the separate sprites on a keyed (RGBA) sheet: connected components of the alpha channel, with nearby pieces merged.
Usage: python design/cut_sprites.py sheet.png [--gap=24] [--min=2500] [--sheet=out_contact.png]
Prints one line per sprite: index, x, y, w, h (reading order: rows top to bottom, then left to right)."""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

def find(im, gap=24, minarea=2500, thr=40):
    a = np.asarray(im.convert('RGBA'))[..., 3] > thr
    d = ndi.binary_dilation(a, structure=np.ones((3, 3)), iterations=gap)
    lab, n = ndi.label(d)
    boxes = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = a[sl] & (lab[sl] == i)
        if m.sum() < minarea: continue
        ys, xs = np.nonzero(m)
        boxes.append([sl[1].start + xs.min(), sl[0].start + ys.min(), xs.max() - xs.min() + 1, ys.max() - ys.min() + 1])
    # reading order: bucket rows by centre y
    boxes.sort(key=lambda b: b[1] + b[3] / 2)
    rows, cur = [], []
    for b in boxes:
        if cur and (b[1] + b[3] / 2) - np.mean([c[1] + c[3] / 2 for c in cur]) > 0.6 * np.median([c[3] for c in boxes]): rows.append(cur); cur = []
        cur.append(b)
    if cur: rows.append(cur)
    return [b for r in rows for b in sorted(r, key=lambda b: b[0])]

def contact(im, boxes, path):
    bg = Image.new('RGBA', im.size, (40, 44, 52, 255)); bg.alpha_composite(im.convert('RGBA'))
    dr = ImageDraw.Draw(bg)
    f = ImageFont.truetype('arial.ttf', max(28, im.size[0] // 60))
    for i, (x, y, w, h) in enumerate(boxes):
        dr.rectangle([x, y, x + w, y + h], outline=(255, 220, 0, 255), width=3); dr.text((x + 6, y + 4), str(i), fill=(255, 255, 0, 255), font=f)
    bg.convert('RGB').resize((im.size[0] // 2, im.size[1] // 2)).save(path)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    o = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    im = Image.open(args[0]); bx = find(im, int(o.get('--gap', 24)), int(o.get('--min', 2500)))
    for i, b in enumerate(bx): print(i, *b)
    if '--sheet' in o: contact(im, bx, o['--sheet'])
