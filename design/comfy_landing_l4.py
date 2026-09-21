"""Level 4 landing card in ONE Krea 2 generation: Bix, Pack, the power core and the freight backdrop go in as references.
Usage (from design/, ComfyUI running):  python comfy_landing_l4.py [--n=4] [--seed=7000] [--lora=0.8]  -> landing-l4/<seed>.png (1536x864)"""
import os, sys
sys.argv.append('--krea')
import comfy_l3 as C
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'landing-l4')
opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
REFS = [os.path.join(HERE, 'bix-poses', 'front', '1.png'), os.path.join(HERE, 'pack-poses', 'front-wave', '3.png'),
        os.path.join(HERE, 'level4-art-krea', 'core-heavy', '100.png'), os.path.join(C.ASSETS, 'l4-bg-freight-v1.jpg')]
PROMPT = ('Cinematic 2D platformer key art, wide 16:9 scene. Bix, the young man from the first reference image (messy dark hair, glasses with a glowing blue lens, teal-green work jacket, brown harness, dark cargo trousers, '
          'boots, one black fingerless glove and one orange robotic glove, the grey robotic camera backpack on his back), walks along a heavy dark steel deck in the left foreground, side-on, carrying the heavy steel power core canister '
          'from the third reference image in both arms, its round window glowing amber. Pack, the small hovering camera robot from the second reference image (white and orange armour, big cyan lens eye, one antenna, thin arms), floats '
          'beside his shoulder. Behind: a cavernous freight concourse with overhead cranes, stacked containers and amber lamps, as in the fourth reference image, and far ahead a tall lift shaft with a faint daylight glow at the top. '
          'Semi-realistic hard-surface game art, real metal sheen, dramatic amber and cyan lighting, Bix, Pack and the core exactly as in their reference images.')
if __name__ == '__main__':
    n = int(opt.get('--n', 4)); seed0 = int(opt.get('--seed', 7000)); lora = float(opt.get('--lora', 0.8)); os.makedirs(OUT, exist_ok=True)
    refs = [C.upload(p) for p in REFS]
    for k in range(n):
        s = seed0 + k; open(os.path.join(OUT, f'{s}.png'), 'wb').write(C.run(C.workflow_krea(PROMPT, None, None, s, 1.0, refs, lora=lora, size=(1536, 864)))); print('made', s, flush=True)
