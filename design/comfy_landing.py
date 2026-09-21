"""Landing-card key art for Level 3 with local ComfyUI + Krea 2 (Bix cutout and the Level 2 card as references).
Usage: python design/comfy_landing.py [--n=4] [--seed=1]   ->  design/level3-art-v3-krea/landing/<seed>.png"""
import os, sys, random
sys.argv.append('--krea')
import comfy_l3 as C

PROMPT = ('Cinematic key art for a 2D platformer level card, in the exact art style of the second reference image. The character from the first reference image (Bix, a tired technician in a '
          'teal jacket with a camera backpack and one orange robotic glove) stands on a heavy dark steel platform in a rusted mineral yard at dusk, raising his orange glove: a glowing cyan magnetic '
          'field with inward-flowing energy rings pulls a loose steel plate toward it, sparks flying. Pack, his small off-white and orange robot companion with one cyan lens, floats beside him. '
          'Behind: coal heaps, a rusted crane, smokestacks, warm amber haze, a hydraulic press and an ore train far away. Semi-realistic metallic hard-surface game art with real metal sheen, '
          'orange service panels, hazard stripes, cyan lights, dramatic rim light, 16:9 composition.')

if __name__ == '__main__':
    opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    n = int(opt.get('--n', 4)); seed0 = int(opt.get('--seed', random.randint(1, 10**9)))
    refs = [C.upload(os.path.join(C.ASSETS, 'landing-bix-cutout-v1.png')), C.upload(os.path.join(C.ASSETS, 'landing-level2-v1.jpg'))]
    out = os.path.join(C.OUT, 'landing'); os.makedirs(out, exist_ok=True)
    for k in range(n):
        seed = seed0 + k
        wf = C.workflow_krea(PROMPT, None, None, seed, 1.0, refs, size=(1536, 864))
        open(os.path.join(out, f'{seed}.png'), 'wb').write(C.run(wf)); print('landing', seed, 'ok', flush=True)
