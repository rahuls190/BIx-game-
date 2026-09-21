"""Level 3 landing card in ONE Krea 2 generation: Bix (new Krea Bix view), Pack (new Krea Pack view) and the scene (Krea backdrop) all go in as references.
Usage (from design/, ComfyUI running):  python comfy_landing_combined.py [--n=4] [--seed=5000] [--lora=0.8] [--bix=glove-up] [--pack=front-wave] [--scene=2003]  -> landing-combined/<seed>.png"""
import os, sys
sys.argv.append('--krea')
import comfy_l3 as C

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'landing-combined')
opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
BIX = os.path.join(HERE, 'bix-poses', opt.get('--bix', 'glove-up'), '1.png'); PACK = os.path.join(HERE, 'pack-poses', opt.get('--pack', 'front-wave'), '3.png')
SCENE = os.path.join(C.OUT, 'landing-bg2', opt.get('--scene', '2003') + '.png')
PROMPT = ('Cinematic 2D platformer key art, wide 16:9 scene. Bix, the young man from the first reference image (messy dark hair, glasses with a glowing blue lens, teal-green work jacket, brown harness, dark cargo trousers '
          'with knee pads, brown boots, black fingerless glove on one hand, orange robotic mechanical glove on the other, the grey robotic camera backpack on his back), stands on the heavy dark steel platform in the '
          'left foreground, side-on, and raises his orange robotic glove arm toward the huge glowing cyan magnetic vortex on the right; a flat steel plate floats in the vortex, sparks and cyan energy streaming from the '
          'plate toward his glove. Pack, the small hovering camera robot from the second reference image (white and orange armour, big cyan lens eye, one antenna, thin arms with claws), floats beside his shoulder. '
          'Behind: a rusted mineral yard at dusk with a crane, smokestacks and amber lamps, as in the third reference image. Semi-realistic hard-surface game art, real metal sheen, dramatic cyan and amber lighting, '
          'Bix and Pack exactly as in their reference images.')

if __name__ == '__main__':
    n = int(opt.get('--n', 4)); seed0 = int(opt.get('--seed', 5000)); lora = float(opt.get('--lora', 0.8)); os.makedirs(OUT, exist_ok=True)
    refs = [C.upload(p) for p in (BIX, PACK, SCENE)]
    for k in range(n):
        s = seed0 + k; open(os.path.join(OUT, f'{s}.png'), 'wb').write(C.run(C.workflow_krea(PROMPT, None, None, s, 1.0, refs, lora=lora, size=(1536, 864)))); print('made', s, flush=True)
