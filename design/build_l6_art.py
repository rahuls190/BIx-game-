"""Turn the pictures made by design/comfy_l6.py (Krea 2 in a local ComfyUI) into the game's Level 6 art.
Usage (repo root):  python design/build_l6_art.py [--tag=v1]
For every name it takes the chosen candidate (design/level6-art-krea/choices.json {name: seed}; else seed 100; else the first file), removes the magenta
background, crops, scales to about twice the size the game draws it at, packs the sprites into dist/assets/l6-world-<tag>.webp and writes dist/level6-art.js
(window.L6ART). Backdrops become 2112x896 JPGs, softened and darkened a little so the sprites stay readable in front of them.
Mother Cluckzilla's parts are packed into their own atlas, because they are large and only she uses them."""
import json, os, sys
from PIL import Image, ImageEnhance, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_l3_from_comfy import key2
from process_level3_assets import clean, pack

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
opts = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
TAG = opts.get('--tag', 'v1'); DIR = os.path.join(ROOT, 'design', 'level6-art-krea'); OUT = os.path.join(ROOT, 'dist', 'assets')
AREAS = ['threshold', 'feedline', 'orchard', 'alarmspine', 'grid', 'nestingbay']

# longest side in the atlas, about 2x what the game draws
SIZE = {'feed-pod': 96, 'feed-pod-burst': 220, 'pod-hopper': 260, 'pod-hopper-empty': 260, 'trough': 420, 'trough-baited': 420,
        'column': 900, 'column-leaning': 900, 'column-fallen': 900, 'alarm': 220, 'alarm-on': 220, 'bedding-cart': 460,
        'conveyor': 900, 'grain-chute': 320, 'planter': 360}
for _a in AREAS: SIZE[f'deck-{_a}'] = 900; SIZE[f'hull-{_a}'] = 900; SIZE[f'ledge-{_a}'] = 500
# she is drawn about 2,600 px tall in the world, so her parts are authored large and live in their own atlas
CLUCK = {'cluck-body': 1600, 'cluck-underside': 1400, 'cluck-leg-plant': 1100, 'cluck-leg-lift': 1100, 'cluck-head': 760, 'cluck-head-feed': 760}
SIZE.update(CLUCK)
NAMES = [n for n in SIZE if n not in CLUCK]

def chosen(name):
    d = os.path.join(DIR, name)
    if not os.path.isdir(d): return None
    ch = json.load(open(os.path.join(DIR, 'choices.json'))) if os.path.exists(os.path.join(DIR, 'choices.json')) else {}
    fs = sorted(f for f in os.listdir(d) if f.endswith('.png') and os.path.getsize(os.path.join(d, f)) > 0)
    if not fs: return None
    for cand in (f'{ch[name]}.png' if name in ch else None, '100.png'):
        if cand and cand in fs: return os.path.join(d, cand)
    return os.path.join(d, fs[0])

def sprite(name):
    p = chosen(name)
    if not p: return None
    im = key2(Image.open(p).convert('RGB'))
    bb = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if bb: im = im.crop(bb)
    k = SIZE[name] / max(im.size)
    return clean(im.resize((max(2, round(im.width * k)), max(2, round(im.height * k))), Image.LANCZOS))

def build(names, fn, art, missing):
    items = []
    for n in names:
        im = sprite(n)
        if im is None: missing.append(n)
        else: items.append((n, im))
    if not items: return
    atlas, boxes = pack(items)
    atlas.save(os.path.join(OUT, fn), quality=92, method=6)
    art['atlases'][fn] = {'w': atlas.width, 'h': atlas.height}
    for n, b in boxes.items(): art['spr'][n] = [fn] + b
    print(fn, atlas.size, os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB', len(boxes), 'sprites')

if __name__ == '__main__':
    art = {'atlases': {}, 'spr': {}, 'bg': {}}; missing = []
    build(NAMES, f'l6-world-{TAG}.webp', art, missing)
    build(list(CLUCK), f'l6-cluck-{TAG}.webp', art, missing)
    for area in AREAS:
        p = chosen(f'bg-{area}')
        if not p: missing.append(f'bg-{area}'); continue
        im = Image.open(p).convert('RGB').resize((2112, 896), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
        im = ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(0.94)).enhance(0.80)
        fn = f'l6-bg-{area}-{TAG}.jpg'; im.save(os.path.join(OUT, fn), quality=82, optimize=True)
        art['bg'][area] = {'file': fn, 'w': im.width, 'h': im.height}; print(fn, os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
    open(os.path.join(ROOT, 'dist', 'level6-art.js'), 'w', encoding='utf8').write(
        '// GENERATED FILE - do not edit by hand. Source: design/build_l6_art.py (pictures from design/comfy_l6.py, Krea 2 in ComfyUI)\nwindow.L6ART=' + json.dumps(art, separators=(',', ':')) + ';\n')
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.startswith('l6-'))
    print(f'total Level 6 art: {total/1048576:.2f} MB   (target: under 4 MB)')
    print('missing:', missing)
