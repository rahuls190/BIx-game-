"""Remove the flat magenta-ish background from a generated sprite sheet and write a real RGBA PNG.

Usage:  python design/key_magenta.py input.png output.png [--lo=0.30] [--hi=0.70]

Image generators that cannot make transparent PNGs are asked to shoot each sheet on flat magenta. They rarely hit exactly #FF00FF: the
background comes back dusty pink, purple, or with soft shadows. So this measures the real background colour from the image border and keys on
HUE and SATURATION relative to it (a darker shadow of the background is still background), not on distance to one fixed colour.

  strength = how magenta-like a pixel is (hue close to the border's hue, and saturated)
  alpha    = 1 - smoothstep(lo, hi, strength)         soft edges stay soft
  edge pixels are un-mixed from the background colour so there is no pink fringe; remaining tint in the fringe is pulled toward grey.
Nothing in the art may be magenta, pink or purple; the prompts forbid it. Copper-coral (#FF8F6A) is far from magenta in hue and survives.
"""
import sys
import colorsys
import numpy as np
from PIL import Image, ImageFilter


def border_colour(rgb: np.ndarray, band: int = 12) -> np.ndarray:
    h, w, _ = rgb.shape
    b = np.concatenate([rgb[:band].reshape(-1, 3), rgb[-band:].reshape(-1, 3), rgb[:, :band].reshape(-1, 3), rgb[:, -band:].reshape(-1, 3)])
    return np.median(b, axis=0)


def key(img: Image.Image, lo=0.30, hi=0.70) -> Image.Image:
    rgb = np.asarray(img.convert("RGB"), dtype=np.float64)
    bg = border_colour(rgb)
    hb = colorsys.rgb_to_hsv(*(bg / 255.0))[0]
    hsv = np.asarray(img.convert("RGB").convert("HSV"), dtype=np.float64) / 255.0
    h, s = hsv[..., 0], hsv[..., 1]
    dh = np.minimum(np.abs(h - hb), 1.0 - np.abs(h - hb))
    closeness = np.clip(1.0 - dh / 0.07, 0.0, 1.0)              # within about +-25 degrees of the background hue
    sat = np.clip((s - 0.12) / 0.30, 0.0, 1.0)                  # and clearly coloured (not grey steel)
    strength = closeness * sat
    t = np.clip((strength - lo) / (hi - lo), 0.0, 1.0)
    alpha = 1.0 - t * t * (3 - 2 * t)
    a3 = np.maximum(alpha, 1e-3)[..., None]
    un = (rgb - (1.0 - alpha)[..., None] * bg) / a3
    edge = (alpha > 0) & (alpha < 1)
    out = np.where(edge[..., None], np.clip(un, 0, 255), rgb)
    # pink cast in the fringe: pull red and blue toward green wherever both exceed it by a lot
    fringe = np.asarray(Image.fromarray(((alpha < 0.98) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    spill = np.clip((np.minimum(out[..., 0], out[..., 2]) - out[..., 1]) - 20, 0, None)
    out[..., 0] = np.where(fringe, out[..., 0] - spill * 0.85, out[..., 0])
    out[..., 2] = np.where(fringe, out[..., 2] - spill * 0.85, out[..., 2])
    # anything still pinkish (dust, smoke and glow are see-through, so they inherit the key colour): pull it to neutral grey
    hsv2 = np.asarray(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).convert("HSV"), dtype=np.float64) / 255.0
    dh2 = np.minimum(np.abs(hsv2[..., 0] - hb), 1.0 - np.abs(hsv2[..., 0] - hb))
    pink = np.clip(1.0 - dh2 / 0.18, 0.0, 1.0) * np.clip((hsv2[..., 1] - 0.04) / 0.14, 0.0, 1.0)      # wider and paler than the key itself: dust is a faint pink
    grey = out.mean(axis=2, keepdims=True)
    out = out * (1 - pink[..., None]) + grey * pink[..., None]
    rgba = np.dstack([np.clip(out, 0, 255), alpha * 255.0]).astype(np.uint8)
    rgba[alpha <= 0.004] = 0
    return Image.fromarray(rgba, "RGBA")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    opts = {a.split("=")[0]: float(a.split("=")[1]) for a in sys.argv[1:] if a.startswith("--") and "=" in a}
    src, dst = args[0], args[1]
    im = key(Image.open(src), opts.get("--lo", 0.30), opts.get("--hi", 0.70))
    im.save(dst)
    a = np.asarray(im)[..., 3]
    print(f"{dst}: {im.size}, transparent {np.mean(a == 0):.0%}, opaque {np.mean(a == 255):.0%}, soft edge {np.mean((a > 0) & (a < 255)):.1%}")
