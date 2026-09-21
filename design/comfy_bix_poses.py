"""Bix: new angles and poses with local ComfyUI + Krea 2. The real Bix cutout (landing-bix-cutout-v1.png, with his camera backpack) is the reference.
Usage (from design/, ComfyUI running):  python comfy_bix_poses.py [NAME...] [--seed=1] [--lora=0.8]  -> bix-poses/<name>/<seed>.png (white background)"""
import os, sys
from PIL import Image
sys.argv.append('--krea')
import comfy_l3 as C

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'bix-poses'); TMP = os.path.join(HERE, 'l3tmp', 'vid')
CUT = os.path.join(C.ASSETS, 'landing-bix-cutout-v1.png')
BASE = ('Bix, the same character as the reference image: a young man with messy dark-brown hair and a small round glasses lens with a blue glow over one eye, a worn teal-green work jacket over a beige shirt, '
        'brown leather harness straps and belt with pouches, dark grey cargo trousers with hex knee pads, chunky brown boots with orange trim, a black fingerless glove on one hand and an orange robotic mechanical glove on the other, '
        'and a grey robotic camera backpack strapped on his back. Same face, same outfit, same proportions, same painted semi-realistic game-art finish as the reference. Full body head to boots, '
        'isolated on a plain white background, single character centred, no shadow, no text.')
LORA = float(next((a.split('=')[1] for a in sys.argv if a.startswith('--lora=')), 0.8))
POSES = {
    'front':        'Standing, seen straight from the front, both arms relaxed at his sides, the camera backpack showing over his shoulders.',
    'left-3q':      'Standing, three-quarter view from the front-left, arms relaxed, looking toward the viewer\'s left.',
    'right-3q':     'Standing, three-quarter view from the front-right, arms relaxed, looking toward the viewer\'s right.',
    'side-left':    'Standing in perfect side profile facing the viewer\'s left, arms relaxed, the camera backpack clearly visible on his back.',
    'side-right':   'Standing in perfect side profile facing the viewer\'s right, arms relaxed, the camera backpack clearly visible on his back.',
    'back':         'Standing, seen from directly behind: his back and the grey robotic camera backpack with its lens, harness straps and antenna filling the view, head turned slightly.',
    'back-3q':      'Standing, three-quarter view from behind-left, the camera backpack prominent on his back, looking over his shoulder.',
    'glove-up':     'Standing, three-quarter front view, his orange robotic glove arm raised high above his head, hand open toward the sky, the other arm down.',
    'glove-reach':  'Standing, side view, his orange robotic glove arm stretched straight out forward at shoulder height, hand open, palm out, leaning slightly forward.',
    'wave':         'Standing, front view, his black-gloved hand raised and waving hello with a friendly smile, the other arm down.',
    'run':          'Running fast, side view facing the viewer\'s right, mid-stride, arms pumping, the camera backpack bouncing on his back.',
    'jump':         'Mid-air jump, three-quarter front view, knees bent, both arms out for balance.',
}

def ref():
    p = os.path.join(TMP, 'bix_ref.png')
    if not os.path.exists(p):
        c = Image.open(CUT).convert('RGBA'); bg = Image.new('RGBA', c.size, (255, 255, 255, 255)); bg.alpha_composite(c)
        sq = Image.new('RGB', (1024, 1024), 'white'); s = 1024 / bg.height; r = bg.convert('RGB').resize((round(bg.width * s), 1024), Image.LANCZOS); sq.paste(r, ((1024 - r.width) // 2, 0)); sq.save(p)
    return C.upload(p)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    seed = int(opt.get('--seed', 1)); tag = f'{seed}' if LORA == 0.8 else f'{seed}_l{LORA}'; r = ref()
    for name in (args or list(POSES)):
        d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, f'{tag}.png'), 'wb').write(C.run(C.workflow_krea(f'{POSES[name]} {BASE}', None, None, seed, 1.0, [r], lora=LORA, size=(832, 1216)))); print('made', name, tag, flush=True)
