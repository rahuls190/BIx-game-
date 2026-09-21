"""Turn the pictures made by design/comfy_l3.py (Krea 2 in a local ComfyUI) into the game's Level 3 art.
Usage (repo root):  python design/build_l3_from_comfy.py [--dir=level3-art-v3-krea] [--tag=v2]
For every name it takes the chosen candidate (design/<dir>/choices.json {name: seed}; else the first file), removes the magenta background,
crops, scales to about twice the size the game draws it at, packs the sprites into atlases in dist/assets/ and writes dist/level3-art.js.
Backdrops become 2112x896 JPGs, softened and darkened a little so the sprites stay readable in front of them."""
import json, os, sys
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
import comfy_l3 as C
from process_level3_assets import clean, pack
from key_magenta import key

ROOT = C.ROOT
opts = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
DIR = os.path.join(ROOT, 'design', opts.get('--dir', 'level3-art-v3-krea')); TAG = opts.get('--tag', 'v2')
OUT = os.path.join(ROOT, 'dist', 'assets')

# longest side of the sprite in the atlas (about 2x the size the game draws it)
SIZE = {'steel': 900, 'iron': 900, 'copper': 900, 'copper-crack': 900, 'copper-broken': 900, 'girder': 800, 'strip': 500, 'hull': 900, 'steel-thin': 500,
        'pad': 300, 'pad-fire': 300, 'net': 500, 'crate': 320, 'core-blue': 130, 'core-red': 130, 'socket': 130, 'beacon': 90, 'press-head': 300,
        'press-rod': 400, 'hopper': 400, 'locker': 260, 'block': 120, 'terminal': 250, 'terminal-on': 250, 'hazard-door': 600, 'emitter': 60,
        'flatcar': 1000, 'buffer': 320, 'track': 800, 'gantry': 750, 'ore': 160, 'grab': 240, 'island0': 600, 'island1': 600, 'island2': 600, 'island3': 600,
        'island4': 600, 'vault-door': 620, 'door': 440}
for i in range(4): SIZE[f'drone-b{i}'] = 140; SIZE[f'drone-r{i}'] = 140
ATLAS = {
    f'l3-world-{TAG}.webp': ['steel', 'iron', 'copper', 'copper-crack', 'copper-broken', 'girder', 'strip', 'hull', 'steel-thin', 'pad', 'pad-fire', 'net', 'crate',
                             'core-blue', 'core-red', 'socket', 'beacon', 'press-head', 'press-rod', 'locker', 'block', 'emitter'],
    f'l3-world2-{TAG}.webp': ['terminal', 'terminal-on', 'hopper', 'hazard-door', 'flatcar', 'buffer', 'track', 'gantry', 'ore', 'grab', 'island0', 'island1',
                              'island2', 'island3', 'island4', 'vault-door', 'door'],
    f'l3-drones-{TAG}.webp': [f'drone-{c}{i}' for c in 'br' for i in range(4)],
}

def chosen(name):
    d = os.path.join(DIR, name)
    if not os.path.isdir(d): return None
    ch = {}
    if os.path.exists(os.path.join(DIR, 'choices.json')): ch = json.load(open(os.path.join(DIR, 'choices.json')))
    fs = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    if not fs: return None
    f = f'{ch[name]}.png' if name in ch and os.path.exists(os.path.join(d, f'{ch[name]}.png')) else fs[0]
    return os.path.join(d, f)

def key2(im):
    """magenta key that also removes the pink halo left where the repaint mask ended: anything in the magenta-pink hue range and saturated"""
    rgba = key(im, 0.30, 0.70)
    hsv = np.asarray(im.convert('RGB').convert('HSV'), dtype=np.float64) / 255.0
    h, s, v = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
    pink = ((h > 285) & (h < 350) & (s > 0.30) & (v > 0.35)).astype(np.uint8) * 255
    pink = np.asarray(Image.fromarray(pink).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8)), dtype=np.float64) / 255.0
    a = np.asarray(rgba)[..., 3].astype(np.float64) * (1 - pink)
    out = np.asarray(rgba).copy(); out[..., 3] = np.clip(a, 0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def sprite(name):
    p = chosen(name)
    if not p: return None
    im = key2(Image.open(p).convert('RGB'))
    bb = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if bb: im = im.crop(bb)
    k = SIZE[name] / max(im.size)
    im = im.resize((max(2, round(im.width * k)), max(2, round(im.height * k))), Image.LANCZOS)
    return clean(im)

if __name__ == '__main__':
    old = json.loads(open(os.path.join(ROOT, 'dist', 'level3-art.js'), encoding='utf8').read().split('=', 1)[1].strip().rstrip(';'))
    art = {'atlases': {}, 'spr': {}, 'bg': {}}
    missing = []
    for fn, names in ATLAS.items():
        items = []
        for n in names:
            im = sprite(n)
            if im is None: missing.append(n); continue
            items.append((n, im))
        atlas, boxes = pack(items)
        atlas.save(os.path.join(OUT, fn), quality=92, method=6)
        art['atlases'][fn] = {'w': atlas.width, 'h': atlas.height}
        for n, b in boxes.items(): art['spr'][n] = [fn] + b
        print(fn, atlas.size, os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB', len(boxes), 'sprites')
    for n in missing:            # a picture that was not made yet keeps its old version
        if n in old['spr']:
            fn = old['spr'][n][0]; art['atlases'].setdefault(fn, old['atlases'][fn]); art['spr'][n] = old['spr'][n]
    for area in ['yard', 'crusher', 'shaft', 'lab', 'rail', 'vault']:
        p = chosen(f'bg-{area}')
        if not p: art['bg'][area] = old['bg'][area]; continue
        im = Image.open(p).convert('RGB').resize((2112, 896), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
        im = ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(0.92)).enhance(0.78)
        fn = f'l3-bg-{area}-{TAG}.jpg'; im.save(os.path.join(OUT, fn), quality=82, optimize=True)
        art['bg'][area] = {'file': fn, 'w': im.width, 'h': im.height}; print(fn, os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
    open(os.path.join(ROOT, 'dist', 'level3-art.js'), 'w', encoding='utf8').write(
        '// GENERATED FILE - do not edit by hand. Source: design/build_l3_from_comfy.py (pictures from design/comfy_l3.py, Krea 2 in ComfyUI)\nwindow.L3ART=' + json.dumps(art, separators=(',', ':')) + ';\n')
    print('missing (kept the old picture):', missing)
