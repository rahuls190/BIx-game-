"""Repaint the Level 3 sprites and backdrops with a LOCAL ComfyUI (SDXL + IP-Adapter Plus), in the style of Levels 1 and 2.
The shape, size and side-on camera angle of every picture come from the sprite the game already uses (dist/level3-art.js + atlases): only the
surface, colour and finish are redone. The style comes from the Level 1/2 art (IP-Adapter, style transfer).

Usage:  python design/comfy_l3.py list
        python design/comfy_l3.py make NAME [NAME...] [--n=3] [--seed=1] [--denoise=0.68]
        python design/comfy_l3.py all [--n=3]
ComfyUI must be running (C:/Users/Rahul/ComfyUI/ComfyUI_windows_portable/run_nvidia_gpu.bat) at http://127.0.0.1:8188.
Outputs: design/level3-art-v3-comfy/<name>/<seed>.png on flat magenta (sprites) or opaque (backdrops); keyed later by design/key_magenta.py."""
import io, json, os, random, sys, time, urllib.parse, urllib.request, uuid
import numpy as np
from PIL import Image, ImageFilter

HOST = 'http://127.0.0.1:8188'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLUX = '--flux' in sys.argv          # FLUX.1 schnell instead of SDXL + IP-Adapter (style from the prompt, no reference images)
KREA = '--krea' in sys.argv          # Krea 2 Turbo + the Ostris style-reference LoRA (the Level 1/2 art goes in as a reference image)
OUT = os.path.join(ROOT, 'design', 'level3-art-v3-krea' if KREA else 'level3-art-v3-flux' if FLUX else 'level3-art-v3-comfy')
ASSETS = os.path.join(ROOT, 'dist', 'assets')

# style references: painted Level 1/2 plates and props
REFS = {
    'plates': ['furnace-platform-atlas-v2.png', 'facility-platform-atlas-v1.png', 'furnace-prop-atlas-v2.png'],
    'props': ['furnace-prop-atlas-v2.png', 'facility-prop-atlas-v1.png', 'facility-platform-atlas-v1.png'],
    'drone': ['pack-assist-v2.png', 'enemy-crawler-v2.png', 'furnace-prop-atlas-v2.png'],
    'bg': ['furnace-background-v2.png', 'facility-background-v1.png'],
}

# THE CAMERA: the game is a side-on platformer. Everything is drawn as a flat front elevation: camera level with the object, no perspective,
# no three-quarter or isometric view, no top-down. (Levels 1 and 2 plates show only a thin top edge.)
CAMERA = 'strict orthographic side elevation, front view, camera perfectly level with the object, flat straight-on view, no perspective, no three-quarter angle, no isometric'
STYLE = ('painted stylised industrial hard-surface game art, dark blue-grey and charcoal steel, orange service panels and hazard stripes, worn paint, '
         'scratched edges, crisp dark outlines, chunky readable silhouette, slightly illustrated finish, 2D side-scroller game asset')
BG = 'isolated on a solid flat pure magenta #FF00FF background, single object, centered, nothing else in the picture, no text, no shadow'
NEG = ('busy pattern, dense vertical lines, noisy greeble, cluttered, photo, photorealistic, 3d render, purple, pink, violet, text, watermark, signature, multiple objects, frame, border, blurry, low quality, '
       'characters, people, hands, glossy cartoon, isometric, three-quarter view, perspective, top-down view, angled view, vanishing point')
NEG_BG = 'text, watermark, people, characters, robots, platforms, bright center, low quality, blurry, cartoon, flat vector, isometric, tilted horizon'

C = 'plates'; P = 'props'; D = 'drone'
COPPER = {'copper', 'copper-crack', 'copper-broken', 'island2', 'island3', 'net'}
# name: (group, description). The picture is repainted from the sprite of the same name (or SRC[name]).
ITEMS = {
    'steel':        (C, 'a long heavy industrial steel platform deck seen from the side, highly detailed: a thin bright orange-yellow hazard lip along the top edge, a body of riveted armour plates with recessed panels and welded seams, a row of vent slots, two glowing cyan light strips, orange service hatches with bolts and handles, hazard-striped end blocks with heavy corner brackets, pipes and a cable conduit along the bottom'),
    'iron':         (C, 'a narrow heavy iron ledge plate seen from the side, highly detailed: a thin orange-yellow lit top edge, evenly spaced horizontal ribs with bolts, recessed panels, one glowing cyan magnetic strip with inward chevrons along the front, small vents, welded seams and corner brackets'),
    'copper':       (C, 'a narrow heavy copper plate seen from the side, highly detailed: a thin lit top edge, a regular diamond tread pattern, coral orange copper with green verdigris patches and scratches, riveted border frame, bolts, small orange hazard marks, corner brackets'),
    'copper-crack': (C, 'a narrow heavy copper plate seen from the side, highly detailed: diamond tread pattern, coral orange copper, riveted border, with obvious deep cracks running across it and a few loose flakes and chips, warning marks'),
    'copper-broken': (C, 'a narrow heavy copper plate seen from the side, highly detailed, shattered into a few broken jagged pieces hanging from bent rivets, diamond tread pattern, coral orange copper, bent frame'),
    'girder':       (C, 'one straight segment of a heavy iron I-beam girder seen from the side, highly detailed: riveted flanges, bolted end plates, a row of small glowing cyan lights, inward chevron markings, cable clips, scratches'),
    'strip':        (C, 'a tall narrow vertical iron wall strip, highly detailed: stacked ribbed armour panels with bolts, a thin glowing cyan seam down the middle, vents, welded seams, straight and symmetric'),
    'hull':         (C, 'the underside hull of a floating steel deck seen from the side, highly detailed: hanging riveted scrap plating, bundled pipes and cables, dangling chains, small orange lamps, dark, fading to black at the bottom'),
    'steel-thin':   (C, 'a narrow heavy steel catwalk plank seen from the side, highly detailed: orange hazard lip on top, perforated grating, rivets, bolted brackets, small cyan light dots'),
    'pad':          (P, 'a repel pad set into the floor: a flat steel plate with a copper ring and three outward pointing chevrons, dim'),
    'pad-fire':     (P, 'a repel pad set into the floor: a flat steel plate with a glowing coral orange ring and three outward pointing chevrons, sparks and steam bursting up'),
    'net':          (P, 'a repel net: a copper wire mesh stretched between two steel end brackets, horizontal'),
    'crate':        (P, 'a tall heavy movable steel crate with orange corner guards, a hazard stripe band and a round glowing cyan panel on the front'),
    'core-blue':    (P, 'a magnetic core: a caged steel sphere glowing cyan inside with inward pointing chevrons on it'),
    'core-red':     (P, 'a magnetic core: a caged steel sphere glowing coral orange inside with outward pointing chevrons on it'),
    'socket':       (P, 'a square steel wall socket plate with a round dark port in the middle and two small lamps, bolted corners'),
    'beacon':       (P, 'an amber warning beacon lamp in a wire cage on an orange bracket, lit'),
    'press-head':   (P, 'a hydraulic press head: a heavy steel block with two piston sockets on top and a hazard-striped crushing face underneath'),
    'press-rod':    (P, 'a vertical polished steel hydraulic piston rod with a few grease stains, straight'),
    'hopper':       (P, 'a scrap chute hopper: a steel funnel with a shutter at the bottom and a hinged lid, orange trim'),
    'locker':       (P, 'a tall steel locker with the door standing open and one orange robotic glove on the shelf inside'),
    'block':        (P, 'a small dense block of scrap metal with orange paint flecks, chunky cube'),
    'terminal':     (P, 'a control terminal on a stand: a monitor showing a standby bar, a keyboard, off-white and orange casing, worn'),
    'terminal-on':  (P, 'a control terminal on a stand: the monitor glowing bright cyan with a progress bar, keyboard, off-white and orange casing, worn'),
    'hazard-door':  (P, 'a full-height steel gate shutter slab with a hazard-striped frame and a small amber lamp'),
    'emitter':      (P, 'a small laser emitter housing: a dark steel box with a red lens on top'),
    'flatcar':      (P, 'a rusty ore flatbed railway wagon, empty flat deck, two wheel bogies, nothing on the deck'),
    'buffer':       (P, 'a heavy steel buffer stop at the end of a railway line, hazard stripes'),
    'track':        (P, 'a straight railway track segment: two steel rails, wooden sleepers and ballast gravel, horizontal'),
    'gantry':       (P, 'a tall overhead steel gantry frame: two vertical legs and a top beam, rusty, orange bolts'),
    'ore':          (P, 'a big lump of dark ore rock with copper veins'),
    'grab':         (P, 'a magnetic crane grab hanging on a chain with a heavy ball of scrap metal stuck to it'),
    'island0':      (P, 'a floating island of blue-grey steel plating with cyan lights on top and torn scrap hanging beneath, chunky slab, horizontal ribbed top plate'),
    'island1':      (P, 'a floating island of blue-grey steel plating with cyan lights on top and torn scrap hanging beneath, chunky slab, horizontal ribbed top plate'),
    'island4':      (P, 'a floating island of blue-grey steel plating with cyan lights on top and torn scrap hanging beneath, chunky slab, horizontal ribbed top plate'),
    'island2':      (P, 'a floating island of coral copper plating with a diamond tread hatch on top and verdigris, torn scrap hanging beneath, chunky slab'),
    'island3':      (P, 'a floating island of coral copper plating with a diamond tread hatch on top and verdigris, torn scrap hanging beneath, chunky slab'),
    'vault-door':   (P, 'a big vault door with a round latch wheel, copper coil, hazard-striped frame, heavy steel'),
    'door':         (P, 'a slim sealed steel security door with cyan edge lights'),
}
for i, st in enumerate(['idle', 'pushed away, tilted', 'pulled in, tilted', 'destroyed, cracked open, sparking']):
    ITEMS[f'drone-b{i}'] = (D, f'a round grey robotic drone chassis with copper coil aerials and one large cyan eye with inward pointing chevrons, hovering, {st}')
    ITEMS[f'drone-r{i}'] = (D, f'a round grey robotic drone chassis with copper coil aerials and one large coral orange eye with outward pointing chevrons, hovering, {st}')
BGS = {
    'bg-yard':    'deep misty dead mineral yard at dusk, coal heaps, rusted cranes and a grab bucket, smokestacks, wet ground with puddles, hazard barriers, rust orange haze, warm amber lamps',
    'bg-crusher': 'deep misty hydraulic press hall, giant pistons and gantries, window light shafts through dust, warm amber and charcoal',
    'bg-shaft':   'deep dark vertical ore shaft with rusted iron supports and falling scrap, cold teal grey against rust',
    'bg-lab':     'deep abandoned test laboratory interior with catwalks, monitors and cable trays, teal and cyan lights on dark steel with orange service panels',
    'bg-rail':    'deep misty mag-rail yard with heavy gantry frames, orange warning lamps, ore hoppers and long rails, sooty amber',
    'bg-vault':   'deep dark low gravity sorting chamber, far sorting gantries and faint copper and cyan lights in a black-blue void',
}
for k, v in BGS.items(): ITEMS[k] = ('bg', v + ', dark calm background scene, no characters, level horizon')
SRC = {'hull': 'steel', 'steel-thin': 'steel', 'block': 'crate', 'emitter': 'socket'}      # new cells start from a similar sprite

BUCKETS = [(1024, 1024), (1152, 896), (896, 1152), (1216, 832), (832, 1216), (1344, 768), (768, 1344), (1536, 640), (640, 1536)]
ART = json.loads(open(os.path.join(ROOT, 'dist', 'level3-art.js'), encoding='utf8').read().split('=', 1)[1].strip().rstrip(';'))
_atlas = {}

def sprite(name):
    """the current Level 3 sprite (RGBA), cut from its atlas"""
    fn, x, y, w, h = ART['spr'][SRC.get(name, name)]
    if fn not in _atlas: _atlas[fn] = Image.open(os.path.join(ASSETS, fn)).convert('RGBA')
    return _atlas[fn].crop((x, y, x + w, y + h))

def bucket(aspect):
    return min(BUCKETS, key=lambda b: abs(np.log((b[0] / b[1]) / aspect)))

def init_pair(name):
    """(the sprite on flat magenta, the mask of where to repaint, size), at an SDXL-friendly size, the sprite filling about 90%"""
    sp = sprite(name); W, H = bucket(sp.width / sp.height)
    k = min(W * 0.9 / sp.width, H * 0.9 / sp.height); sp = sp.resize((max(8, round(sp.width * k)), max(8, round(sp.height * k))), Image.LANCZOS)
    canvas = Image.new('RGB', (W, H), (255, 0, 255)); pos = ((W - sp.width) // 2, (H - sp.height) // 2); canvas.paste(sp, pos, sp)
    a = Image.new('L', (W, H), 0); a.paste(sp.getchannel('A').point(lambda v: 255 if v > 40 else 0), pos)
    return canvas, a.filter(ImageFilter.MaxFilter(21)), (W, H)


# ---- flat front-elevation silhouettes ------------------------------------------------------------------------------------------------
# The old sprites were drawn from a raised three-quarter view; the game camera is flat side-on (like Levels 1 and 2). So each picture starts
# from a plain front-elevation silhouette at the proportions the game draws it (from the art design document), not from the old sprite.
# name: (kind, width:height as the game draws it)
SHAPES = {
    'steel': ('plate', 4.9), 'iron': ('plate', 4.9), 'copper': ('plate', 4.9), 'copper-crack': ('plate', 4.9), 'copper-broken': ('plate', 4.9),
    'steel-thin': ('plate', 4.9), 'girder': ('plate', 4.25), 'strip': ('plate', 0.21), 'hull': ('hull', 3.0), 'net': ('plate', 4.3),
    'pad': ('pad', 2.1), 'pad-fire': ('pad', 2.1), 'crate': ('rect', 0.62), 'block': ('rect', 1.0),
    'core-blue': ('circle', 1.0), 'core-red': ('circle', 1.0), 'socket': ('rect', 1.0), 'beacon': ('rect', 0.82), 'emitter': ('rect', 0.9),
    'press-head': ('rect', 1.2), 'press-rod': ('plate', 0.12), 'hopper': ('hull', 0.62), 'locker': ('rect', 0.5), 'terminal': ('terminal', 0.9),
    'terminal-on': ('terminal', 0.9), 'hazard-door': ('rect', 0.3), 'flatcar': ('flatcar', 4.6), 'buffer': ('rect', 1.56), 'track': ('track', 3.8),
    'gantry': ('gantry', 0.93), 'ore': ('circle', 0.9), 'grab': ('grab', 0.8), 'vault-door': ('rect', 0.65), 'door': ('rect', 0.38),
    'island0': ('island', 1.5), 'island1': ('island', 1.5), 'island4': ('island', 1.5), 'island2': ('island', 1.5), 'island3': ('island', 1.5),
}
for _i in range(4): SHAPES[f'drone-b{_i}'] = ('circle', 1.0); SHAPES[f'drone-r{_i}'] = ('circle', 1.0)
from PIL import ImageDraw

def draw_shape(kind, box):
    """mask (L image, 255 inside) of a silhouette filling box=(w,h) exactly, plus a shading map: brighter near the top"""
    w, h = box; m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m)
    if kind in ('plate', 'rect'): d.rectangle([0, 0, w - 1, h - 1], fill=255)
    elif kind == 'pad': d.polygon([(0, h), (w * 0.08, h * 0.35), (w * 0.92, h * 0.35), (w, h)], fill=255)
    elif kind == 'circle': d.ellipse([0, 0, w - 1, h - 1], fill=255)
    elif kind == 'hull': d.polygon([(0, 0), (w, 0), (w * 0.8, h), (w * 0.2, h)], fill=255)
    elif kind == 'island': d.polygon([(0, 0), (w, 0), (w * 0.94, h * 0.28), (w * 0.72, h * 0.7), (w * 0.5, h), (w * 0.28, h * 0.68), (w * 0.06, h * 0.28)], fill=255)
    elif kind == 'flatcar':
        d.rectangle([0, 0, w - 1, int(h * 0.55)], fill=255)
        for cx in (0.2, 0.8): d.rectangle([int(w * (cx - 0.11)), int(h * 0.5), int(w * (cx + 0.11)), int(h * 0.8)], fill=255); d.ellipse([int(w * (cx - 0.09)), int(h * 0.58), int(w * (cx + 0.09)), h - 1], fill=255)
    elif kind == 'track':
        d.rectangle([0, int(h * 0.05), w - 1, int(h * 0.28)], fill=255)
        d.rectangle([0, int(h * 0.3), w - 1, int(h * 0.55)], fill=255); d.rectangle([0, int(h * 0.55), w - 1, h - 1], fill=255)
    elif kind == 'gantry':
        d.rectangle([0, 0, w - 1, int(h * 0.12)], fill=255); d.rectangle([0, 0, int(w * 0.14), h - 1], fill=255); d.rectangle([int(w * 0.86), 0, w - 1, h - 1], fill=255)
    elif kind == 'grab':
        d.rectangle([int(w * 0.46), 0, int(w * 0.54), int(h * 0.3)], fill=255); d.ellipse([int(w * 0.05), int(h * 0.3), int(w * 0.95), h - 1], fill=255)
    elif kind == 'terminal':
        d.rectangle([int(w * 0.05), 0, int(w * 0.95), int(h * 0.6)], fill=255); d.rectangle([int(w * 0.38), int(h * 0.6), int(w * 0.62), int(h * 0.85)], fill=255); d.rectangle([int(w * 0.15), int(h * 0.85), int(w * 0.85), h - 1], fill=255)
    else: d.rectangle([0, 0, w - 1, h - 1], fill=255)
    return m

def shape_pair(name):
    kind, asp = SHAPES[name]; W, H = bucket(asp)
    fw = min(W * 0.9, H * 0.9 * asp); fh = fw / asp
    if fh > H * 0.9: fh = H * 0.9; fw = fh * asp
    fw, fh = max(24, round(fw)), max(24, round(fh))
    sil = draw_shape(kind, (fw, fh)); pos = ((W - fw) // 2, (H - fh) // 2)
    canvas = Image.new('RGB', (W, H), (255, 0, 255))
    body = Image.new('RGB', (fw, fh), (88, 100, 112))
    grad = Image.linear_gradient('L').resize((fw, fh)).point(lambda v: 255 - v)         # lighter at the top, like a lit walking edge
    body = Image.composite(Image.new('RGB', (fw, fh), (150, 160, 170)), body, grad.point(lambda v: v // 2))
    canvas.paste(body, pos, sil)
    mask = Image.new('L', (W, H), 0); mask.paste(sil, pos)
    return canvas, mask.filter(ImageFilter.MaxFilter(13)), (W, H)

def bg_init(area):
    im = Image.open(os.path.join(ASSETS, f'l3-bg-{area}-v1.jpg')).convert('RGB')
    W, H = 1536, 640; k = max(W / im.width, H / im.height); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((l, t, l + W, t + H))

def http(path, data=None, headers=None, raw=False):
    req = urllib.request.Request(HOST + path, data=data, headers=headers or {})
    with urllib.request.urlopen(req, timeout=600) as r:
        b = r.read()
    return b if raw else json.loads(b)

def upload_bytes(name, data):
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n').encode() + data + f'\r\n--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n'.encode()
    return http('/upload/image', body, {'Content-Type': f'multipart/form-data; boundary={b}'})['name']

def upload(path): return upload_bytes(os.path.basename(path), open(path, 'rb').read())

def png(im):
    b = io.BytesIO(); im.save(b, 'PNG'); return b.getvalue()

def workflow(prompt, neg, init_name, mask_name, seed, refs, denoise, weight=0.85):
    wf = {
        '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'sd_xl_base_1.0.safetensors'}},
        '2': {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': ['1', 1]}},
        '3': {'class_type': 'CLIPTextEncode', 'inputs': {'text': neg, 'clip': ['1', 1]}},
        '5': {'class_type': 'IPAdapterModelLoader', 'inputs': {'ipadapter_file': 'ip-adapter-plus_sdxl_vit-h.safetensors'}},
        '6': {'class_type': 'CLIPVisionLoader', 'inputs': {'clip_name': 'clip_vision_vit_h.safetensors'}},
        '20': {'class_type': 'LoadImage', 'inputs': {'image': init_name}},
        '21': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['20', 0], 'vae': ['1', 2]}},
    }
    latent = ['21', 0]
    if mask_name:
        wf['22'] = {'class_type': 'LoadImageMask', 'inputs': {'image': mask_name, 'channel': 'red'}}
        wf['23'] = {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['21', 0], 'mask': ['22', 0]}}
        latent = ['23', 0]
    prev = None
    for i, r in enumerate(refs):
        nid = f'1{i}0'; wf[nid] = {'class_type': 'LoadImage', 'inputs': {'image': r}}
        if prev is None: prev = [nid, 0]
        else:
            bid = f'1{i}1'; wf[bid] = {'class_type': 'ImageBatch', 'inputs': {'image1': prev, 'image2': [nid, 0]}}; prev = [bid, 0]
    wf['7'] = {'class_type': 'IPAdapterAdvanced', 'inputs': {'model': ['1', 0], 'ipadapter': ['5', 0], 'image': prev, 'weight': weight, 'weight_type': 'style transfer',
               'combine_embeds': 'average', 'start_at': 0.0, 'end_at': 0.9, 'embeds_scaling': 'V only', 'clip_vision': ['6', 0]}}
    wf['8'] = {'class_type': 'KSampler', 'inputs': {'model': ['7', 0], 'positive': ['2', 0], 'negative': ['3', 0], 'latent_image': latent, 'seed': seed, 'steps': 32,
               'cfg': 6.0, 'sampler_name': 'dpmpp_2m', 'scheduler': 'karras', 'denoise': denoise}}
    wf['9'] = {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['1', 2]}}
    wf['10'] = {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': 'l3'}}
    return wf


def workflow_flux(prompt, init_name, mask_name, seed, denoise):
    wf = {
        '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'flux1-schnell-fp8.safetensors'}},
        '2': {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': ['1', 1]}},
        '3': {'class_type': 'CLIPTextEncode', 'inputs': {'text': '', 'clip': ['1', 1]}},
        '20': {'class_type': 'LoadImage', 'inputs': {'image': init_name}},
        '21': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['20', 0], 'vae': ['1', 2]}},
    }
    latent = ['21', 0]
    if mask_name:
        wf['22'] = {'class_type': 'LoadImageMask', 'inputs': {'image': mask_name, 'channel': 'red'}}
        wf['23'] = {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['21', 0], 'mask': ['22', 0]}}
        latent = ['23', 0]
    wf['8'] = {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': ['2', 0], 'negative': ['3', 0], 'latent_image': latent, 'seed': seed, 'steps': 8,
               'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': denoise}}
    wf['9'] = {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['1', 2]}}
    wf['10'] = {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': 'l3f'}}
    return wf

def workflow_krea(prompt, init_name, mask_name, seed, denoise, ref_names, steps=8, lora=1.0, size=None):
    wf = {
        '1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'krea2_turbo_fp8_scaled.safetensors', 'weight_dtype': 'default'}},
        '2': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen3vl_4b_fp8_scaled.safetensors', 'type': 'krea2'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'qwen_image_vae.safetensors'}},
        '4': {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['1', 0], 'lora_name': 'krea2_style_reference.safetensors', 'strength_model': lora}},
        '5': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': ['4', 0], 'shift': 3.0}},
        '6': {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': ['2', 0]}},
        '7': {'class_type': 'CLIPTextEncode', 'inputs': {'text': '', 'clip': ['2', 0]}},
    }
    cond = ['6', 0]
    for i, r in enumerate(ref_names):                       # each reference picture becomes a reference latent on the conditioning
        wf[f'3{i}0'] = {'class_type': 'LoadImage', 'inputs': {'image': r}}
        wf[f'3{i}1'] = {'class_type': 'VAEEncode', 'inputs': {'pixels': [f'3{i}0', 0], 'vae': ['3', 0]}}
        wf[f'3{i}2'] = {'class_type': 'ReferenceLatent', 'inputs': {'conditioning': cond, 'latent': [f'3{i}1', 0]}}
        cond = [f'3{i}2', 0]
    if init_name:
        wf['20'] = {'class_type': 'LoadImage', 'inputs': {'image': init_name}}
        wf['21'] = {'class_type': 'VAEEncode', 'inputs': {'pixels': ['20', 0], 'vae': ['3', 0]}}
        latent = ['21', 0]
        if mask_name:
            wf['22'] = {'class_type': 'LoadImageMask', 'inputs': {'image': mask_name, 'channel': 'red'}}
            wf['23'] = {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['21', 0], 'mask': ['22', 0]}}
            latent = ['23', 0]
    else:
        wf['21'] = {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': size[0], 'height': size[1], 'batch_size': 1}}
        latent = ['21', 0]
    wf['8'] = {'class_type': 'KSampler', 'inputs': {'model': ['5', 0], 'positive': cond, 'negative': ['7', 0], 'latent_image': latent, 'seed': seed, 'steps': steps,
               'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': denoise}}
    wf['9'] = {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['3', 0]}}
    wf['10'] = {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': 'l3k'}}
    return wf

def run(wf):
    pid = http('/prompt', json.dumps({'prompt': wf, 'client_id': 'l3'}).encode(), {'Content-Type': 'application/json'})['prompt_id']
    while True:
        h = http('/history/' + pid)
        if pid in h and h[pid].get('outputs'): break
        time.sleep(1)
    im = h[pid]['outputs']['10']['images'][0]
    return http('/view?' + urllib.parse.urlencode({'filename': im['filename'], 'subfolder': im['subfolder'], 'type': im['type']}), raw=True)

def make(item, n=3, seed0=None, denoise=None):
    group, desc = ITEMS[item]
    refs = [] if FLUX else [upload(os.path.join(ASSETS, f)) for f in (REFS[group][:1] if KREA else REFS[group])]
    if group == 'bg':
        init = bg_init(item[3:]); mask = None; prompt = f'{desc}, {STYLE}'; neg = NEG_BG; d = denoise or 0.62
    else:
        init, m, _ = (shape_pair(item) if item in SHAPES and '--sprite' not in sys.argv else init_pair(item)); mask = upload_bytes(f'm_{item}.png', png(m)); prompt = (f'2D side-scroller video game asset, {desc}. Flat straight-on front elevation view, no perspective, no tilt. Painted stylised industrial game art, dark blue-grey and charcoal steel, orange service panels and hazard stripes, worn paint, crisp dark outlines, chunky simple readable shapes. Isolated on a solid flat pure magenta background.' + (' The object is a flat rectangle that fills the whole frame edge to edge, seen straight on like a 2D platformer tile, no top surface visible, no depth, no perspective.' if SHAPES.get(item, ('',))[0] in ('plate', 'rect') else '')) if FLUX else f'{desc}, {CAMERA}, {STYLE}, {BG}'; neg = NEG; d = denoise or (0.95 if KREA else 0.88)
        if KREA:
            mat = ('brushed and scratched coral-orange copper with a regular diamond tread pattern and green verdigris patches, dark steel frame' if item in COPPER else 'brushed and scratched dark blue-grey steel')
            prompt = f'Semi-realistic metallic game asset matching the reference image. {desc}. Real metal materials: {mat} with bright specular highlights on the edges, bevelled and rounded edges catching light, subtle reflections and sheen, soft ambient occlusion in the seams, orange enamel service panels with paint chipped down to bare shiny metal, rivets, bolts and fasteners, crisp dark outlines, high detail. Flat straight-on front elevation, 2D side-scroller sprite, isolated on flat magenta.'
    iname = upload_bytes(f'i_{item}.png', png(init))
    os.makedirs(os.path.join(OUT, item), exist_ok=True)
    seed0 = seed0 if seed0 is not None else random.randint(1, 10**9)
    for k in range(n):
        seed = seed0 + k
        if KREA: wf = workflow_krea(prompt, iname, mask, seed, d, refs)
        elif FLUX: wf = workflow_flux(prompt, iname, mask, seed, d)
        else: wf = workflow(prompt, neg, iname, mask, seed, refs, d)
        open(os.path.join(OUT, item, f'{seed}.png'), 'wb').write(run(wf))
        print(item, seed, 'ok', flush=True)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    n = int(opt.get('--n', 3)); seed = int(opt['--seed']) if '--seed' in opt else None; dn = float(opt['--denoise']) if '--denoise' in opt else None
    if not args or args[0] == 'list':
        for k, v in ITEMS.items(): print(f'{k:16} {v[1][:80]}')
    elif args[0] == 'all':
        for k in ITEMS:
            d = os.path.join(OUT, k)
            if seed is not None and os.path.exists(os.path.join(d, f'{seed}.png')): continue      # this seed is already made
            if seed is None and os.path.isdir(d) and any(f.endswith('.png') for f in os.listdir(d)): continue
            make(k, n, seed, dn)
    elif args[0] == 'make':
        for k in args[1:]: make(k, n, seed, dn)
