"""Pack (Bix's camera backpack drone): new angles and poses with local ComfyUI + Krea 2, using frames of the 360-degree video as the design reference.
Usage (from design/, ComfyUI running):  python comfy_pack_poses.py [NAME...] [--seed=1]  -> pack-poses/<name>/<seed>.png (white background)
Video frames (l3tmp/vid/f00..f15) are 16 evenly spaced frames of "make 360 dgree and maoving its hand .mp4"."""
import os, sys
from PIL import Image
sys.argv.append('--krea')
import comfy_l3 as C

HERE = os.path.dirname(os.path.abspath(__file__)); VID = os.path.join(HERE, 'l3tmp', 'vid'); OUT = os.path.join(HERE, 'pack-poses')
BASE = ('Pack, the small hovering camera robot from the reference images, drawn with exactly the same design: a boxy body of matte off-white armour panels over a dark charcoal lower half, '
        'a few small rust-orange armour blocks at the top corners and shoulders, a big round camera lens eye with a black ring and a glowing cyan iris, ONE thin black antenna on top, thin dark '
        'segmented mechanical arms with pale cylindrical forearm pods and small three-fingered black claw hands, dense intricate mechanical detail: panel seams, bolts, hydraulic pistons, braided cables, vents, scratched and chipped paint, real metal sheen. Highly detailed semi-realistic hard-surface game render, '
        'isolated on a plain white background, single robot centred, nothing else, no shadow, no text.')
# name: (reference frame, what changes)
POSES = {
    'front-idle':      ('f09', 'Seen straight from the front, lens facing the viewer, both arms hanging relaxed at his sides, hovering.'),
    'front-wave':      ('f09', 'Seen straight from the front, lens facing the viewer, his right arm raised high and waving hello with the open claw, the other arm down.'),
    'left-3q':         ('f00', 'Three-quarter view from the front-left, lens looking toward the viewer\'s left, both arms down and slightly forward.'),
    'left-3q-wave':    ('f03', 'Three-quarter view from the front-left, one arm raised waving with the claw open, the other arm down.'),
    'right-3q':        ('f12', 'Three-quarter view from the front-right, lens looking toward the viewer\'s right, arms hanging down.'),
    'right-3q-reach':  ('f14', 'Three-quarter view from the front-right, one arm stretched out forward reaching to grab something, claw open.'),
    'side-left':       ('f07', 'Perfect side profile, level with the camera, the lens pointing to the viewer\'s left, arms hanging, flat side-on elevation.'),
    'side-right':      ('f13', 'Perfect side profile, level with the camera, the lens pointing to the viewer\'s right, arms hanging, flat side-on elevation.'),
    'back':            ('f13', 'REAR VIEW, the camera is behind the robot looking at the back of his body: a flat blank armoured back plate with a service hatch, vents, bolts, cable bundles, two mounting brackets and a harness clamp where he straps onto a backpack, the antenna on top. The camera lens is on the other side of the body so NO lens, NO eye and NO glowing part is visible anywhere on this side. Arms hang down at the sides.'),
    'back-3q':         ('f14', 'REAR THREE-QUARTER VIEW from behind-left: the blank armoured back plate with hatch, vents and cable bundles fills most of the view, only the rim of the round lens housing peeks out at the edge of the body, arms hanging.'),
    'side-grab-plate': ('f07', 'Side-on view, lens pointing left, both arms stretched forward gripping the edges of a flat rusty steel plate in front of him.'),
    'side-point-up':   ('f00', 'Side-on view, lens pointing left, one arm pointing straight up with a single finger extended, the other arm down, alert.'),
}

LORA = float(next((a.split('=')[1] for a in sys.argv if a.startswith('--lora=')), 0.7))
LORA = float(next((a.split('=')[1] for a in sys.argv if a.startswith('--lora=')), 0.7))
FRONT = 'f09'        # a second reference: the clean front view fixes the design on every pose

def ref(name):
    p = os.path.join(VID, f'r_{name}.png')
    if not os.path.exists(p): Image.open(os.path.join(VID, f'{name}.png')).convert('RGB').resize((1024, 1024), Image.LANCZOS).save(p)
    return C.upload(p)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    seed = int(opt.get('--seed', 1)); os.makedirs(OUT, exist_ok=True); tag = f'{seed}' if LORA == 0.7 else f'{seed}_l{LORA}'; tag = f'{seed}' if LORA == 0.7 else f'{seed}_l{LORA}'
    for name in (args or list(POSES)):
        fr, what = POSES[name]; d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True); p = os.path.join(d, f'{tag}.png')
        open(p, 'wb').write(C.run(C.workflow_krea(f'{what} {BASE}', None, None, seed, 1.0, [ref(fr)] + ([ref(FRONT)] if fr != FRONT else []), lora=LORA, size=(1024, 1024)))); print('made', name, seed, flush=True)
