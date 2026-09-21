"""Turn the pictures made by design/comfy_l4.py (Krea 2 in a local ComfyUI) into the game's Level 4 art.
Usage (repo root):  python design/build_l4_art.py [--tag=v1]
For every name it takes the chosen candidate (design/level4-art-krea/choices.json {name: seed}; else seed 100; else the first file), removes the magenta
background, crops, scales to about twice the size the game draws it at, packs the sprites into dist/assets/l4-world-<tag>.webp and writes dist/level4-art.js
(window.L4ART). Backdrops become 2112x896 JPGs, softened and darkened a little so the sprites stay readable in front of them. Level 4 also uses Level 3's
sprites (steel, hull, steel-thin, hazard-door, press-head, press-rod, socket, locker...) through window.L3ART."""
import json, os, sys
from PIL import Image, ImageEnhance, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_l3_from_comfy import key2
from process_level3_assets import clean, pack

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
opts = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
TAG = opts.get('--tag', 'v1'); DIR = os.path.join(ROOT, 'design', 'level4-art-krea'); OUT = os.path.join(ROOT, 'dist', 'assets')

# longest side in the atlas (about 2x what the game draws)
SIZE = {'core-carry': 110, 'core-heavy': 110, 'core-buoy': 110, 'core-charge': 110, 'cradle': 280, 'scale-plate': 520, 'scale-plate-on': 520, 'belt': 900, 'vent': 280,
        'arc-post': 220, 'relay-node': 220, 'relay-node-on': 220, 'vending-bot': 240, 'busker-bot': 220, 'customs-desk': 260, 'lift-socket': 300, 'slip': 64}
AREAS = ['deck', 'freight', 'market', 'spine', 'relay', 'shaft']
for _a in AREAS: SIZE[f'deck-{_a}'] = 900; SIZE[f'hull-{_a}'] = 900; SIZE[f'ledge-{_a}'] = 500          # each area's own deck, underside and catwalk
for _g in ('gate-sorting', 'gate-customs', 'gate-relay', 'gate-cage'): SIZE[_g] = 520
SIZE['crane-container'] = 300; SIZE['crane-cable'] = 400
NAMES = list(SIZE)

def chosen(name):
    d = os.path.join(DIR, name)
    if not os.path.isdir(d): return None
    ch = json.load(open(os.path.join(DIR, 'choices.json'))) if os.path.exists(os.path.join(DIR, 'choices.json')) else {}
    fs = sorted(f for f in os.listdir(d) if f.endswith('.png'))
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

if __name__ == '__main__':
    art = {'atlases': {}, 'spr': {}, 'bg': {}}; items = []; missing = []
    for n in NAMES:
        im = sprite(n)
        if im is None: missing.append(n)
        else: items.append((n, im))
    if items:
        atlas, boxes = pack(items); fn = f'l4-world-{TAG}.webp'
        atlas.save(os.path.join(OUT, fn), quality=92, method=6); art['atlases'][fn] = {'w': atlas.width, 'h': atlas.height}
        for n, b in boxes.items(): art['spr'][n] = [fn] + b
        print(fn, atlas.size, os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB', len(boxes), 'sprites')
    for area in AREAS:
        p = chosen(f'bg-{area}')
        if not p: missing.append(f'bg-{area}'); continue
        im = Image.open(p).convert('RGB').resize((2112, 896), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
        im = ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(0.92)).enhance(0.78)
        fn = f'l4-bg-{area}-{TAG}.jpg'; im.save(os.path.join(OUT, fn), quality=82, optimize=True)
        art['bg'][area] = {'file': fn, 'w': im.width, 'h': im.height}; print(fn, os.path.getsize(os.path.join(OUT, fn)) // 1024, 'KB')
    open(os.path.join(ROOT, 'dist', 'level4-art.js'), 'w', encoding='utf8').write(
        '// GENERATED FILE - do not edit by hand. Source: design/build_l4_art.py (pictures from design/comfy_l4.py, Krea 2 in ComfyUI)\nwindow.L4ART=' + json.dumps(art, separators=(',', ':')) + ';\n')
    print('missing:', missing)
