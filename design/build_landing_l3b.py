"""Level 3 landing card, v2: the REAL Bix (canonical cutout, glove arm raised from his own pixels) and the real Pack, on a Krea 2 scene (landing-bg2).
Usage (from design/):  python build_landing_l3b.py [SEED...]   -> level3-art-v3-krea/landing-final2/<seed>.png"""
import math, os, random, sys
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter
sys.argv.append('--krea')
import comfy_l3 as C
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'l3tmp'))
import pose_bix as PB
from build_landing_l3 import glow, add

W, H = 1536, 864
BGDIR = os.path.join(C.OUT, 'landing-bg2'); FIN = os.path.join(C.OUT, 'landing-final2')
# per scene: (feet y on the platform top, Bix left x, Bix height, target (the vortex centre) x, y)
SCENES = {'2000': (545, 330, 540, 1190, 300), '2002': (532, 300, 520, 1230, 340), '2003': (560, 360, 540, 1190, 400)}
ANGLE = 132

def comp(seed):
    feet, bxl, bh, tx, ty = SCENES[seed]
    base = Image.open(os.path.join(BGDIR, f'{seed}.png')).convert('RGB').resize((W, H), Image.LANCZOS)
    base = ImageEnhance.Brightness(base).enhance(0.9).convert('RGBA')
    bix, (pivot, bb, pad) = PB.pose(ANGLE)
    # the glove centre in the posed cutout (rotate the original glove point about the shoulder pivot)
    px = bix.load(); pts = [(x, y) for y in range(0, bix.height // 8) for x in range(bix.width * 6 // 10, bix.width) if px[x, y][3] > 200 and px[x, y][0] - px[x, y][2] > 80 and px[x, y][0] > 140]
    gx = sum(p[0] for p in pts) / len(pts); gy = sum(p[1] for p in pts) / len(pts)      # the orange glove, found in the posed pixels
    s = bh / bix.height; bix = bix.resize((round(bix.width * s), bh), Image.LANCZOS); gx, gy = gx * s, gy * s
    bx, by = bxl, feet - bh + 12                                     # boots overlap the surface a little
    hx, hy = bx + gx, by + gy
    # contact shadow under his boots
    al = bix.getchannel('A'); half = bix.width // 2; boots = []
    for x0, x1 in ((0, half), (half, bix.width)):
        bb2 = al.crop((x0, bix.height - 90, x1, bix.height)).point(lambda v: 255 if v > 128 else 0).getbbox()
        if bb2: boots.append((bx + x0 + bb2[0], bx + x0 + bb2[2], by + bix.height - 90 + bb2[3]))
    def shadows(d):
        for x0, x1, yb in boots: d.ellipse([x0 - 6, yb - 14, x1 + 14, yb + 6], fill=(0, 0, 0, 200))
    SH = Image.new('RGBA', (W, H), (0, 0, 0, 0)); shadows(ImageDraw.Draw(SH)); base = Image.alpha_composite(base, SH.filter(ImageFilter.GaussianBlur(7)))
    # Pack, the real Level 2 sprite, floating behind his lower shoulder
    pc = [25, 51, 137, 160]
    pack = Image.open(os.path.join(C.ASSETS, 'pack-assist-v2.png')).convert('RGBA').crop((pc[0], pc[1], pc[0] + pc[2], pc[1] + pc[3]))
    ph = 190; pack = pack.resize((round(pack.width * ph / pack.height), ph), Image.LANCZOS)
    kx, ky = bx - 190, by + 210
    # the field, drawn at 2x and softened: open arcs round the glove, forked lightning to the vortex, sparks
    rnd = random.Random(int(seed)); SS = 2
    def bolt(d, x0, y0, x1, y1, jit, w, col):
        pts = [(x0 * SS, y0 * SS)]
        for j in range(1, 11):
            t = j / 10; pts.append(((x0 + (x1 - x0) * t + rnd.uniform(-jit, jit) * math.sin(t * 3.14)) * SS, (y0 + (y1 - y0) * t + rnd.uniform(-jit, jit) * math.sin(t * 3.14)) * SS))
        d.line(pts, fill=col, width=w * SS, joint='curve')
    def layer_of(draw_fn, blur, core=None):
        L = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0)); draw_fn(ImageDraw.Draw(L))
        g = L.filter(ImageFilter.GaussianBlur(blur * SS)); g = Image.alpha_composite(g, g)
        if core: C2 = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0)); core(ImageDraw.Draw(C2)); g = Image.alpha_composite(g, C2.filter(ImageFilter.GaussianBlur(0.6 * SS)))
        return g.resize((W, H), Image.LANCZOS)
    def arcs(d):
        for i, (r, a0, a1) in enumerate([(46, -70, 120), (66, 40, 250), (88, 200, 380), (112, -20, 90)]):
            d.arc([(hx - r) * SS, (hy - r) * SS, (hx + r) * SS, (hy + r) * SS], a0, a1, fill=(110, 220, 255, 200 - i * 35), width=(5 - i) * SS)
        for _ in range(34):
            a = rnd.uniform(0, 6.28); r = rnd.uniform(30, 150); x, y = hx + math.cos(a) * r, hy + math.sin(a) * r; l = rnd.uniform(6, 18)
            d.line([x * SS, y * SS, (x + math.cos(a) * l) * SS, (y + math.sin(a) * l) * SS], fill=(215, 250, 255, 235), width=2 * SS)
    def bolts_glow(d):
        for _ in range(3): bolt(d, hx + 10, hy - 6, tx - 90, ty + 10, 26, 8, (90, 205, 255, 235))
    def bolts_core(d):
        for _ in range(3): bolt(d, hx + 10, hy - 6, tx - 90, ty + 10, 26, 2, (235, 252, 255, 255))
    stream = layer_of(bolts_glow, 5, bolts_core); ring = layer_of(arcs, 1.4)
    def radial(cx, cy, r, alpha):
        m = Image.radial_gradient('L').resize((r * 2, r * 2)); m = ImageChops.invert(m).point(lambda v: int(v * v / 255 * alpha / 255))
        L = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c = Image.new('RGBA', (r * 2, r * 2), (120, 225, 255, 255)); c.putalpha(m); L.alpha_composite(c, (round(cx - r), round(cy - r))); return L
    halo = radial(hx, hy, 150, 170); halo2 = radial(hx, hy, 60, 110)
    base.alpha_composite(pack, (round(kx), round(ky)))
    base = add(base, halo); base = add(base, halo2)
    base.alpha_composite(bix, (bx, by))                                  # the glove stays clear on top of the glow
    base = add(base, stream); base = add(base, ring)
    vig = Image.new('L', (W, H), 0); ImageDraw.Draw(vig).ellipse([-260, -180, W + 260, H + 220], fill=255); vig = ImageChops.invert(vig.filter(ImageFilter.GaussianBlur(160)))
    base = Image.composite(Image.new('RGBA', (W, H), (4, 8, 12, 255)), base, vig.point(lambda v: int(v * 0.6)))
    os.makedirs(FIN, exist_ok=True); out = base.convert('RGB'); out.save(os.path.join(FIN, f'{seed}.png')); return out

if __name__ == '__main__':
    for s in ([a for a in sys.argv[1:] if not a.startswith('--')] or list(SCENES)): comp(s); print('comp', s, flush=True)
