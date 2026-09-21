"""Level 3 landing card: the REAL Bix cutout and Pack from Levels 1/2 and the game's own Level 3 deck and plate art, composited on a backdrop made with
local ComfyUI + Krea 2. Only the backdrop and the energy effects are new.
Usage (from design/, ComfyUI running):  python build_landing_l3.py bg [--n=3] [--seed=1000]   make backdrops
                                          python build_landing_l3.py comp [SEED...]            composite onto each backdrop -> level3-art-v3-krea/landing-final/
"""
import json, math, os, random, sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
sys.argv.append('--krea')
import comfy_l3 as C

W, H = 1536, 864
BGDIR = os.path.join(C.OUT, 'landing-bg2'); FIN = os.path.join(C.OUT, 'landing-final')
BG_PROMPT = ('Cinematic wide scene for a 2D platformer key art, NO people, NO characters, NO robots. A heavy dark steel platform with hazard stripes and orange service panels fills the '
             'foreground from the left to the center, its flat top edge clearly visible. On the right a large glowing cyan magnetic vortex of inward-spiralling energy rings holds a floating steel plate '
             'with sparks flying. Behind: a rusted dead mineral yard at dusk with a crane, smokestacks, a hydraulic press and a distant ore train, coal heaps, warm amber haze and lamps. '
             'Semi-realistic metallic hard-surface game art with real metal sheen, in the exact style of the reference image, cinematic dramatic lighting.')

def bg(n, seed0):
    os.makedirs(BGDIR, exist_ok=True)
    refs = [C.upload(os.path.join(C.ASSETS, 'landing-level2-v1.jpg'))]
    for k in range(n):
        seed = seed0 + k
        open(os.path.join(BGDIR, f'{seed}.png'), 'wb').write(C.run(C.workflow_krea(BG_PROMPT, None, None, seed, 1.0, refs, size=(W, H)))); print('bg', seed, flush=True)

def glow(size, draw_fn, blur):
    """an additive glow layer: draw sharp, then blur and add the sharp on top"""
    L = Image.new('RGBA', size, (0, 0, 0, 0)); draw_fn(ImageDraw.Draw(L))
    return Image.alpha_composite(L.filter(ImageFilter.GaussianBlur(blur)), L)

def add(base, layer, strength=1.0):
    a = layer.copy(); a.putalpha(a.getchannel('A').point(lambda v: int(v * strength)))
    return Image.alpha_composite(base, a)

def comp(seed):
    base = Image.open(os.path.join(BGDIR, f'{seed}.png')).convert('RGB').resize((W, H), Image.LANCZOS)
    base = ImageEnhance.Brightness(base).enhance(0.82).convert('RGBA')
    art = C.ART
    def spr(name):
        fn, x, y, w, h = art['spr'][name]; return Image.open(os.path.join(C.ASSETS, fn)).convert('RGBA').crop((x, y, x + w, y + h))
    # the deck (the game's steel deck and its hull), wide across the foreground
    deck = spr('steel'); dw = 1000; deck = deck.resize((dw, round(deck.height * dw / deck.width)), Image.LANCZOS)
    hull = spr('hull'); hull = hull.resize((dw - 60, round(hull.height * (dw - 60) / hull.width)), Image.LANCZOS)
    dx, dy = 90, 730
    base.alpha_composite(hull, (dx + 30, dy + deck.height - 18)); base.alpha_composite(deck, (dx, dy))
    top = dy + 8                                                  # walking surface
    # Bix, unchanged (the canonical cutout) standing on the deck
    bix = Image.open(os.path.join(C.ASSETS, 'landing-bix-cutout-v1.png')).convert('RGBA'); bh = 610; bix = bix.resize((round(bix.width * bh / bix.height), bh), Image.LANCZOS)
    bx, by = 330, top - bh + 14
    shadow = glow((W, H), lambda d: d.ellipse([bx - 10, top - 14, bx + bix.width + 30, top + 12], fill=(0, 0, 0, 150)), 10); base = Image.alpha_composite(base, shadow)
    # the glove (viewer's right hand in the cutout) and the field
    hx, hy = bx + round(335 * bh / 1003), by + round(500 * bh / 1003)
    # Pack (the real Level 2 sprite) hovering behind his shoulder
    pc = [25, 51, 137, 160];        # cell 0 of pack-assist-v2 (level2-art.js)
    pack = Image.open(os.path.join(C.ASSETS, 'pack-assist-v2.png')).convert('RGBA').crop((pc[0], pc[1], pc[0] + pc[2], pc[1] + pc[3]))
    ph = 230; pack = pack.resize((round(pack.width * ph / pack.height), ph), Image.LANCZOS); pack = pack.transpose(Image.FLIP_LEFT_RIGHT)
    base.alpha_composite(pack, (bx - 150, by + 190))
    # the plate being pulled in: the game's iron plate, tilted toward the glove
    plate = spr('iron'); plate = plate.resize((420, round(plate.height * 420 / plate.width)), Image.LANCZOS).rotate(-14, expand=True, resample=Image.BICUBIC)
    px, py = 900, 250
    # field: inward chevrons and rings from the plate to the glove, cyan
    cx, cy = px + plate.width // 2, py + plate.height // 2
    def fx(d):
        for i in range(5):                                        # rings converging on the glove
            r = 30 + i * 26; d.ellipse([hx - r, hy - r, hx + r, hy + r], outline=(95, 212, 255, int(230 - i * 38)), width=5 - min(3, i // 2))
        n = 9
        for i in range(n):                                        # chevrons streaming from the plate to the hand, pointing at the hand
            t = (i + 0.5) / n; x = cx + (hx - cx) * t; y = cy + (hy - cy) * t + math.sin(t * 9) * 14
            ang = math.atan2(hy - cy, hx - cx); s = 12 + 10 * (1 - t); a = int(90 + 165 * t)
            p1 = (x - math.cos(ang) * s - math.sin(ang) * s, y - math.sin(ang) * s + math.cos(ang) * s); p2 = (x, y); p3 = (x - math.cos(ang) * s + math.sin(ang) * s, y - math.sin(ang) * s - math.cos(ang) * s)
            d.line([p1, p2, p3], fill=(140, 230, 255, a), width=6)
        rnd = random.Random(seed)
        for i in range(26):                                       # sparks
            a = rnd.uniform(0, 6.28); r = rnd.uniform(20, 95); x, y = hx + math.cos(a) * r, hy + math.sin(a) * r
            d.line([x, y, x + math.cos(a) * 14, y + math.sin(a) * 14], fill=(200, 245, 255, 230), width=3)
        for k in range(4):                                        # lightning from the glove toward the plate
            pts = [(hx, hy)]
            for j in range(1, 8):
                t = j / 7; pts.append((hx + (cx - hx) * t * 0.55 + rnd.uniform(-16, 16), hy + (cy - hy) * t * 0.55 + rnd.uniform(-16, 16)))
            d.line(pts, fill=(170, 235, 255, 235), width=3)
    layer = glow((W, H), fx, 9)
    hand = glow((W, H), lambda d: d.ellipse([hx - 42, hy - 42, hx + 42, hy + 42], fill=(160, 235, 255, 210)), 22)
    base.alpha_composite(plate, (px, py))
    base = add(base, glow((W, H), lambda d: d.ellipse([cx - 210, cy - 90, cx + 210, cy + 90], fill=(95, 212, 255, 70)), 40))
    base.alpha_composite(bix, (bx, by)); base = add(base, layer); base = add(base, hand)
    # rim light on the yard side and a vignette
    vig = Image.new('L', (W, H), 0); ImageDraw.Draw(vig).ellipse([-260, -180, W + 260, H + 220], fill=255); vig = ImageChops_invert(vig.filter(ImageFilter.GaussianBlur(160)))
    base = Image.composite(Image.new('RGBA', (W, H), (4, 8, 12, 255)), base, vig.point(lambda v: int(v * 0.65)))
    os.makedirs(FIN, exist_ok=True)
    out = base.convert('RGB'); out.save(os.path.join(FIN, f'{seed}.png')); return out

def ImageChops_invert(im):
    from PIL import ImageChops
    return ImageChops.invert(im)

def refine(seed, denoise=0.38):
    """pass the composite through Krea 2 at low denoise: lighting, glow and finish are blended in, Bix and the layout stay"""
    src = os.path.join(FIN, f'{seed}.png'); iname = C.upload_bytes(f'l3land_{seed}.png', open(src, 'rb').read())
    ref = C.upload(os.path.join(C.ASSETS, 'landing-level2-v1.jpg'))
    prompt = ('Cinematic key art for a 2D platformer level card in the exact style of the reference image: Bix raises his orange robotic glove and a glowing cyan magnetic field pulls a steel plate toward it, '
              'energy rings and sparks, Pack floating beside him, a heavy metallic steel platform, rusted mineral yard at dusk behind. Semi-realistic metallic hard-surface game art, real metal sheen, '
              'dramatic rim light, cohesive lighting and atmosphere across the whole picture.')
    out = os.path.join(C.OUT, 'landing-refined'); os.makedirs(out, exist_ok=True)
    open(os.path.join(out, f'{seed}.png'), 'wb').write(C.run(C.workflow_krea(prompt, iname, None, int(seed) + 7, denoise, [ref]))); print('refined', seed, flush=True)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    if args and args[0] == 'bg': bg(int(opt.get('--n', 3)), int(opt.get('--seed', 1000)))
    elif args and args[0] == 'refine':
        for sd in args[1:]: refine(sd, float(opt.get('--denoise', 0.38)))
    elif args and args[0] == 'comp':
        for s in (args[1:] or [f[:-4] for f in sorted(os.listdir(BGDIR))]): comp(s); print('comp', s)
