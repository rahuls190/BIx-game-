"""Clean the ore-train gantry sprite in dist/assets/l3-world2-v3.webp (crop table entry 'gantry': x 2992, y 0, 699 x 750):
  1. a white/pink blob with a dark smear on the inside edge of its left pillar (an artefact of the cut-out) is replaced with clean pillar texture cloned from just above it;
  2. stray magenta specks left from the flat-magenta background are made transparent.
Run from the repo root: python design/fix_gantry_sprite.py  (safe to run twice)."""
import os
import numpy as np
from PIL import Image
P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist', 'assets', 'l3-world2-v3.webp')
OX, OY, W, H = 2992, 0, 699, 750
im = Image.open(P).convert('RGBA'); a = np.array(im)
g = a[OY:OY + H, OX:OX + W]                                             # a view of the gantry cell
# 1. the blob (rows 335-525): cover it with clean pillar texture cloned from above and below it, same columns and same inside edge
x0, x1 = 46, 96
g[322:500, x0:x1] = g[150:328, x0:x1]          # the upper part: clean pillar from 172 px above
g[500:556, x0:x1] = g[574:630, x0:x1]          # the lower part: clean pillar from below the blob (never from the blob itself)
# 2. magenta specks become transparent, and the pink tint on the semi-transparent edge is removed (the sprite was cut from a flat magenta background)
r, gg, b, al = (g[..., i].astype(int) for i in range(4))
speck = (r > 150) & (b > 150) & (gg < 120) & (al > 0)
g[speck, 3] = 0
edge = (g[..., 3] > 0) & (g[..., 3] < 250)
excess = np.clip(np.minimum(g[..., 0].astype(int), g[..., 2].astype(int)) - g[..., 1].astype(int), 0, 255)
for c in (0, 2):
    g[..., c] = np.where(edge, np.clip(g[..., c].astype(int) - excess, 0, 255), g[..., c]).astype(np.uint8)
print('specks cleared:', int(speck.sum()), '| edge pixels defringed:', int(edge.sum()))
out = Image.fromarray(a, 'RGBA')
before = os.path.getsize(P)
out.save(P, 'WEBP', quality=90, alpha_quality=100, method=6)
print('atlas saved', before, '->', os.path.getsize(P), 'bytes')
