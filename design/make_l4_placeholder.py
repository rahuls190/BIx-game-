"""Placeholder landing card for Level 4 (the real picture is made later): the level's climb profile, coloured by the core's mode, with the title.
Run: python design/make_l4_placeholder.py  ->  dist/assets/landing-level4-placeholder.jpg (1280x720)"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1280, 720
img = Image.new('RGB', (W, H)); d = ImageDraw.Draw(img)
for y in range(H):
    t = y / H; d.line([(0, y), (W, y)], fill=(int(14 + 14 * t), int(22 + 14 * t), int(30 + 12 * t)))
# the climb: x 0..20400 mapped across the card, y from the level's surfaces
segs = [(0, 2200, '#8fa3b5', 600), (2200, 6200, '#c9822f', 560), (6200, 9000, '#8fa3b5', 480), (9000, 12800, '#9fd0e6', 0), (12800, 16800, '#b58cff', -470), (16800, 20400, '#e5533d', -900)]
def P(x, y): return (60 + x / 20400 * (W - 120), 640 - (600 - y) / 1890 * 430)          # higher in the world = higher on the card
pts = [P(0, 600), P(2200, 600), P(6200, 520), P(9000, 480), P(12500, -470), P(16800, -470), P(20200, -1290)]
pts = [(x, y) for x, y in pts]
glow = Image.new('RGB', (W, H)); gd = ImageDraw.Draw(glow)
for (x0, x1, col, _), (a, b) in zip(segs, zip(pts, pts[1:])):
    gd.line([a, b], fill=col, width=16)
img = Image.blend(img, Image.composite(glow.filter(ImageFilter.GaussianBlur(14)), img, glow.convert('L').filter(ImageFilter.GaussianBlur(14)).point(lambda v: min(255, v * 2))), .8)
d = ImageDraw.Draw(img)
for (x0, x1, col, _), (a, b) in zip(segs, zip(pts, pts[1:])):
    d.line([a, b], fill=col, width=6)
d.polygon(pts + [(pts[-1][0], H), (pts[0][0], H)], fill=(12, 18, 24))
for (x0, x1, col, _), (a, b) in zip(segs, zip(pts, pts[1:])): d.line([a, b], fill=col, width=6)
for (x0, x1, col, _) in segs: d.ellipse([P(x0, 0)[0] - 5, 671, P(x0, 0)[0] + 5, 681], fill=col)
try:
    big = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 92); mid = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 30); sm = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 26)
except Exception:
    big = mid = sm = ImageFont.load_default()
d.text((70, 84), 'LEVEL 04', font=mid, fill='#f08a2e'); d.text((66, 122), 'DELIVERY', font=big, fill='#e8edf2'); d.text((66, 214), 'ATTEMPT', font=big, fill='#f08a2e')
d.text((70, 330), 'One core. One lift. Heavy, buoyant, charged.', font=sm, fill='#93a3b3')
img.save(os.path.join(ROOT, 'dist', 'assets', 'landing-level4-placeholder.jpg'), quality=88)
print('ok')
