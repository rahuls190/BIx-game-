# Computes the tight alpha bounding box of every cell of every Level 2 plate
# and writes dist/level2-art.js (window.L2ART), the crop table the renderer
# feeds to ctx.drawImage(img, sx,sy,sw,sh, dx,dy,dw,dh).
#
# Tight bounds keep each sprite's true aspect ratio. The three TILING plates
# (conveyor belt, lava channel, furnace background) are exempt: a tight crop
# would eat their seam, so they get the full cell rectangle instead.
# A fully transparent cell (a spare) emits null.
import os, json
from PIL import Image
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'dist', 'assets')
OUTJS = os.path.join(HERE, '..', 'dist', 'level2-art.js')
GEN = 'design/build_level2_artbounds.py'

# name, cols, rows, tiling?
PLATES = [
    ('pack-assist-v2.png',            4, 2, False),
    ('supervisor-head-v2.png',        4, 2, False),
    ('enemy-crawler-v2.png',          4, 2, False),
    ('enemy-spitter-v2.png',          4, 2, False),
    ('enemy-claw-v2.png',             4, 2, False),
    ('enemy-wasp-v2.png',             4, 2, False),
    ('furnace-platform-atlas-v2.png', 3, 2, False),
    ('furnace-prop-atlas-v2.png',     4, 2, False),
    ('casting-mold-v2.png',           1, 1, False),
    ('coolant-mist-v2.png',           4, 2, False),
    ('conveyor-belt-v2.png',          4, 1, True),
    ('lava-channel-v2.png',           4, 1, True),
    ('furnace-background-v2.png',     1, 1, True),
]

def alpha_of(path):
    im = Image.open(path)
    if im.mode != 'RGBA': im = im.convert('RGBA')
    return np.array(im)[..., 3], im.size

def bounds(name, cols, rows, tiling):
    """Return (meta dict, per-cell list of [sx,sy,sw,sh] or None, alpha array)."""
    a, (W, H) = alpha_of(os.path.join(ASSETS, name))
    assert W % cols == 0 and H % rows == 0, f'{name}: {W}x{H} does not divide {cols}x{rows}'
    cw, ch = W // cols, H // rows
    cells = []
    for i in range(cols * rows):
        ox, oy = (i % cols) * cw, (i // cols) * ch
        if tiling:
            cells.append([ox, oy, cw, ch]); continue
        sub = a[oy:oy + ch, ox:ox + cw]
        ys, xs = np.nonzero(sub)
        if xs.size == 0:
            cells.append(None); continue        # spare / fully transparent
        x0, x1 = int(xs.min()), int(xs.max())
        y0, y1 = int(ys.min()), int(ys.max())
        cells.append([ox + x0, oy + y0, x1 - x0 + 1, y1 - y0 + 1])
    return {'w': W, 'h': H, 'cols': cols, 'rows': rows, 'cells': cells}, a

def verify(name, meta, a):
    """Rect inside its cell, sw/sh > 0, and zero non-transparent pixels clipped."""
    W, H, cols, rows = meta['w'], meta['h'], meta['cols'], meta['rows']
    cw, ch = W // cols, H // rows
    errs = []
    for i, r in enumerate(meta['cells']):
        ox, oy = (i % cols) * cw, (i // cols) * ch
        sub = a[oy:oy + ch, ox:ox + cw]
        total = int((sub > 0).sum())
        if r is None:
            if total: errs.append(f'{name}#{i}: null but {total} opaque px')
            continue
        sx, sy, sw, sh = r
        if not all(isinstance(v, int) for v in r): errs.append(f'{name}#{i}: non-integer {r}')
        if sw <= 0 or sh <= 0: errs.append(f'{name}#{i}: degenerate {r}')
        if sx < ox or sy < oy or sx + sw > ox + cw or sy + sh > oy + ch:
            errs.append(f'{name}#{i}: {r} escapes cell [{ox},{oy},{cw},{ch}]')
        kept = int((a[sy:sy + sh, sx:sx + sw] > 0).sum())
        if kept != total: errs.append(f'{name}#{i}: clipped {total - kept} of {total} opaque px')
    return errs

def emit(data):
    lines = [
        '// GENERATED FILE - do not edit by hand.',
        f'// Source: {GEN} (re-run it to regenerate).',
        '// Tight alpha bounding box of every cell of every Level 2 plate, as the',
        '// [sx,sy,sw,sh] source rect for ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh).',
        '// Cells read left-to-right, top-to-bottom from index 0. A null cell is a',
        '// fully transparent spare. EXCEPTION: the tiling plates (conveyor-belt-v2,',
        '// lava-channel-v2, furnace-background-v2) carry the FULL cell rect, not the',
        '// alpha bounds - a tight crop would break their seamless repeat.',
        'window.L2ART={',
    ]
    for j, (name, meta) in enumerate(data):
        cells = ','.join('null' if c is None else '[' + ','.join(str(v) for v in c) + ']'
                         for c in meta['cells'])
        tail = '' if j == len(data) - 1 else ','
        lines.append(f'"{name}":{{w:{meta["w"]},h:{meta["h"]},cols:{meta["cols"]},'
                     f'rows:{meta["rows"]},cells:[{cells}]}}{tail}')
    lines.append('};')
    with open(OUTJS, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines) + '\n')

data, allerrs = [], []
print(f'{"plate":32} {"cell":>4}  {"sx":>5} {"sy":>5} {"sw":>5} {"sh":>5}')
print('-' * 64)
for name, cols, rows, tiling in PLATES:
    meta, a = bounds(name, cols, rows, tiling)
    allerrs += verify(name, meta, a)
    for i, r in enumerate(meta['cells']):
        tag = ' (tiling)' if tiling else ''
        cellstr = 'null (empty spare)' if r is None else f'{r[0]:5} {r[1]:5} {r[2]:5} {r[3]:5}{tag}'
        print(f'{name:32} {i:4}  {cellstr}')
    data.append((name, meta))
emit(data)

print('-' * 64)
n = sum(len(m['cells']) for _, m in data)
nn = sum(1 for _, m in data for c in m['cells'] if c is None)
print(f'{len(data)} plates, {n} cells ({nn} null).')
print('VERIFY:', 'ALL CHECKS PASS' if not allerrs else 'FAILURES:\n  ' + '\n  '.join(allerrs))
print('wrote', os.path.normpath(OUTJS))
