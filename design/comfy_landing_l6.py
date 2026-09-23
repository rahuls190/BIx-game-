"""Level 6 landing card in one Krea 2 generation: Bix, Pack, a feed pod and the orchard backdrop go in as references.
Usage (from design/, ComfyUI running):  python comfy_landing_l6.py [--n=4] [--seed=8000]  -> landing-l6/<seed>.png"""
import os, sys
sys.argv.append('--krea')
import comfy_l3 as C
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'landing-l6')
opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
def small(p, w=512):
    im = Image.open(p).convert('RGB')
    return C.upload_bytes('s6l_' + os.path.basename(p).rsplit('.', 1)[0] + '.png', C.png(im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)))
REFS = [os.path.join(HERE, 'bix-poses', 'front', '1.png'),
        os.path.join(HERE, 'pack-poses', 'front-wave', '3.png'),
        os.path.join(C.ASSETS, 'l6-bg-orchard-v1.jpg')]
PROMPT = ('Cinematic 2D platformer key art, wide 16:9. Bix, the young man from the first reference image (messy dark hair, glasses with a glowing blue lens, teal-green work jacket, brown harness straps, dark cargo '
          'trousers, boots, one black fingerless glove and one orange robotic glove, a grey robotic camera backpack on his back), stands SMALL in the lower left, side-on, holding up one glowing amber feed pod. '
          'Towering over him and filling the upper frame: the four galvanised hydraulic legs and dust-caked underside of an enormous agricultural brood machine, warm amber lamps glowing along it, her head out of frame '
          'above. Rows of tall green hydroponic columns recede into golden grain haze behind, as in the third reference image. Pack, the small hovering camera robot from the second reference image (white and orange '
          'armour, big cyan lens eye, one antenna), floats at his shoulder. Warm amber and dusty green light, enormous sense of scale, Bix tiny against her legs. Semi-realistic hard-surface game art, real metal sheen. '
          'She is farm machinery, not a monster: no teeth, no claws, no eyes, no red lights.')
if __name__ == '__main__':
    n = int(opt.get('--n', 4)); seed0 = int(opt.get('--seed', 8000)); os.makedirs(OUT, exist_ok=True)
    refs = [small(p) for p in REFS]
    for k in range(n):
        s = seed0 + k
        open(os.path.join(OUT, f'{s}.png'), 'wb').write(C.run(C.workflow_krea(PROMPT, None, None, s, 1.0, refs, lora=0.8, size=(1536, 864))))
        print('made', s, flush=True)
