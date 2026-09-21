"""Build the Level 3 art from the realistic masters in design/level3-art-masters-v2-real/.
Usage (from the repo root):  python design/process_level3_assets.py
Cuts every sprite out of its sheet (design/cut_sprites.py), scales it to about 2x its size in the game, trims the key-colour fringe,
packs the sprites into a few WebP atlases in dist/assets/, turns the backgrounds into JPG strips (the engine mirrors every other tile so the edges meet), and writes dist/level3-art.js:
  window.L3ART = { atlases:{file:{w,h}}, spr:{name:[atlasFile,sx,sy,sw,sh]}, bg:{area:{file,w,h}} }"""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
sys.path.insert(0, os.path.dirname(__file__))
from cut_sprites import find

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = os.path.join(ROOT, 'design', 'level3-art-masters-v2-real')
OUT = os.path.join(ROOT, 'dist', 'assets')
sheets = {}
def sheet(name, gap=14, minarea=1500):
    if name not in sheets:
        im = Image.open(os.path.join(M, name)).convert('RGBA'); sheets[name] = (im, find(im, gap, minarea))
    return sheets[name]

def drop_above_deck(im):
    """remove everything above the deck line (the flatcar's baked-in lamps): the first row that is more than half as wide as the widest"""
    a = np.asarray(im).copy(); w = (a[..., 3] > 40).sum(axis=1); top = int(np.argmax(w > 0.5 * w.max()))
    a[:top, :, 3] = 0; out = Image.fromarray(a); return out.crop(out.getbbox())

def clean(im):
    """pull the alpha in one pixel and soften it: removes the pink / green key-colour fringe"""
    a = im.getchannel('A').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    out = im.copy(); out.putalpha(a); return out

def grab(name, i, scale, gap=14, minarea=1500, crop=None, clear_top=0):
    im, bx = sheet(name, gap, minarea)
    x, y, w, h = bx[i]
    s = im.crop((x, y, x + w, y + h))
    if crop: s = s.crop(crop)
    if clear_top:
        a = np.asarray(s).copy(); a[:clear_top, :, 3] = 0; s = Image.fromarray(a)
    bb = s.getbbox()
    if bb: s = s.crop(bb)
    s = s.resize((max(1, round(s.width * scale)), max(1, round(s.height * scale))), Image.LANCZOS)
    return clean(s)

BIXA = 'bix-glove-action-v4-real-master.png'
SPECS = {   # atlas -> [(name, factory)]
 'l3-world-v1.webp': [
  ('iron', lambda: grab('mag-plates-v2-real-master.png', 0, .8)), ('copper', lambda: grab('mag-plates-v2-real-master.png', 1, .8)),
  ('steel', lambda: grab('mag-plates-v2-real-master.png', 2, .8)), ('copper-crack', lambda: grab('mag-plates-v2-real-master.png', 3, .8)),
  ('copper-broken', lambda: grab('mag-plates-v2-real-master.png', 4, .8)), ('girder', lambda: grab('mag-plates-v2-real-master.png', 5, .8)),
  ('strip', lambda: grab('mag-plates-v2-real-master.png', 6, .5)),
  ('pad', lambda: grab('repel-and-crate-v2-real-master.png', 0, .4)), ('pad-fire', lambda: grab('repel-and-crate-v2-real-master.png', 1, .4)),
  ('net', lambda: grab('repel-and-crate-v2-real-master.png', 2, .5).rotate(90, expand=True)), ('crate', lambda: grab('repel-and-crate-v2-real-master.png', 3, .45)),
  ('core-blue', lambda: grab('repel-and-crate-v2-real-master.png', 5, .4)), ('core-red', lambda: grab('repel-and-crate-v2-real-master.png', 6, .4)),
  ('socket', lambda: grab('repel-and-crate-v2-real-master.png', 7, .4)),
  ('press-head', lambda: grab('crusher-press-v2-real-master.png', 0, .5)), ('press-rod', lambda: grab('crusher-press-v2-real-master.png', 1, .5)),
  ('beacon', lambda: grab('crusher-press-v2-real-master.png', 3, .3)),
  ('locker', lambda: grab(BIXA, 0, .34, gap=12, crop=(0, 0, 185, 900))),
  ('pack-hang', lambda: grab(BIXA, 6, .3, gap=12)),
 ],
 'l3-world2-v1.webp': [
  ('terminal', lambda: grab('lab-props-v2-real-master.png', 1, .45)), ('terminal-on', lambda: grab('lab-props-v2-real-master.png', 2, .38)),
  ('pedestal', lambda: grab('lab-props-v2-real-master.png', 0, .4)), ('hopper', lambda: grab('lab-props-v2-real-master.png', 5, .45)),
  ('hazard-door', lambda: grab('lab-props-v2-real-master.png', 6, .55)), ('lens', lambda: grab('lab-props-v2-real-master.png', 7, .3)),
  ('flatcar', lambda: drop_above_deck(grab('ore-train-v2-real-master.png', 0, .5))), ('buffer', lambda: grab('ore-train-v2-real-master.png', 2, .4)),
  ('track', lambda: grab('ore-train-v2-real-master.png', 4, .5)), ('gantry', lambda: grab('ore-train-v2-real-master.png', 5, .5)),
  ('ore', lambda: grab('ore-train-v2-real-master.png', 6, .3)), ('grab', lambda: grab('ore-train-v2-real-master.png', 7, .4)),
  ('island0', lambda: grab('vault-islands-v2-real-master.png', 0, .26)), ('island1', lambda: grab('vault-islands-v2-real-master.png', 1, .3)),
  ('island2', lambda: grab('vault-islands-v2-real-master.png', 2, .34)), ('island3', lambda: grab('vault-islands-v2-real-master.png', 3, .38)),
  ('island4', lambda: grab('vault-islands-v2-real-master.png', 4, .26)),
  ('vault-door', lambda: grab('vault-props-v2-real-master.png', 6, .3)), ('door', lambda: grab('vault-props-v2-real-master.png', 7, .6)),
 ],
 'l3-drones-v1.webp': [(f'drone-b{i}', (lambda i=i: grab('polar-drone-v2-real-master.png', i, .3))) for i in range(4)]
                   + [(f'drone-r{i}', (lambda i=i: grab('polar-drone-v2-real-master.png', 4 + i, .3))) for i in range(4)],
}

def pack(items, width=4096, pad=6):
    x = y = rowh = 0; pos = []
    for n, im in items:
        if x + im.width + pad > width: x = 0; y += rowh + pad; rowh = 0
        pos.append((n, x, y, im)); x += im.width + pad; rowh = max(rowh, im.height)
    H = y + rowh
    atlas = Image.new('RGBA', (width, H), (0, 0, 0, 0))
    for n, px, py, im in pos: atlas.paste(im, (px, py))
    return atlas, {n: [px, py, im.width, im.height] for n, px, py, im in pos}

def seamless(im, ov):
    a = np.asarray(im, dtype=np.float32); W = a.shape[1]
    t = np.linspace(0, 1, ov)[None, :, None]
    head = a[:, W - ov:] * (1 - t) + a[:, :ov] * t
    out = np.concatenate([head, a[:, ov:W - ov]], axis=1)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    art = {'atlases': {}, 'spr': {}, 'bg': {}}
    for fn, items in SPECS.items():
        atlas, boxes = pack([(n, f()) for n, f in items])
        atlas.save(os.path.join(OUT, fn), quality=90, method=6)
        art['atlases'][fn] = {'w': atlas.width, 'h': atlas.height}
        for n, b in boxes.items(): art['spr'][n] = [fn] + b
        print(fn, atlas.size, os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB', len(boxes), 'sprites')
    for area in ['yard', 'crusher', 'shaft', 'lab', 'rail', 'vault']:
        im = Image.open(os.path.join(M, f'level3-bg-{area}-v2-real-master.png')).convert('RGB')
        im = im.resize((round(im.width * 896 / im.height), 896), Image.LANCZOS)
        # the backdrop is depth-of-field: softened, darker and a little desaturated, so the sprites in front of it read clearly
        im = im.filter(ImageFilter.GaussianBlur(3.2))
        im = ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(.78)).enhance(.62)
        fn = f'l3-bg-{area}-v1.jpg'; im.save(os.path.join(OUT, fn), quality=80, optimize=True)
        art['bg'][area] = {'file': fn, 'w': im.width, 'h': im.height}
        print(fn, im.size, os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
    with open(os.path.join(ROOT, 'dist', 'level3-art.js'), 'w') as f:
        f.write('// GENERATED FILE - do not edit by hand. Source: design/process_level3_assets.py\nwindow.L3ART=' + json.dumps(art, separators=(',', ':')) + ';\n')
