"""Level 6 art with a LOCAL ComfyUI + Krea 2. Same pipeline as comfy_l4.py; the prompts come from docs/level-6-art-prompts.md.
Level 6 is warm, dusty and agricultural: it must not read as Level 5's cold storm-grey or Level 3/4's blue-grey steel.
Usage (from design/, ComfyUI running at 127.0.0.1:8188):
    python comfy_l6.py list
    python comfy_l6.py make NAME [NAME...] [--n=2] [--seed=100]   sprites  -> level6-art-krea/<name>/<seed>.png
    python comfy_l6.py bg AREA [AREA...] [--n=2] [--seed=100]     backdrops -> level6-art-krea/bg-<area>/<seed>.png
    python comfy_l6.py all [--n=2]                                everything with no picture yet"""
import os, random, sys
sys.argv.append('--krea')
import comfy_l3 as C
from PIL import Image

OUT = os.path.join(C.ROOT, 'design', 'level6-art-krea'); C.OUT = OUT
P = 'props'

# She is machinery at a terrible size, never a creature. This goes into every Cluckzilla prompt.
CLUCK = ('She is weathered agricultural machinery at a terrible size, not a creature and not a robot: caked in years of grain dust, sun-faded paint peeling to bare galvanised metal, mismatched repair patches welded on, rust in the seams, brass fittings gone green, weathered timber packing. Warm amber lamps. No teeth, no claws, no eyes, no red lights, nothing hostile-looking, nothing clean, nothing sci-fi.')

ITEMS = {
    'feed-pod':        (P, 'a feed pod: a fist-sized ribbed canister of galvanised steel and brass with a perforated grain grille around its middle, a warm amber glow inside showing through the holes, a carry ring on top, worn and dented, chunky and readable'),
    'feed-pod-burst':  (P, 'a burst feed pod on the ground: the canister split open with golden grain scattering out in a low spray, a warm amber glow at the centre, drifting grain dust and husks'),
    'pod-hopper':      (P, 'a feed pod dispenser hopper: a galvanised steel funnel on a braced timber frame, a brass shutter at the bottom with one pod visible in the chute, a small amber lamp lit above the shutter, grain dust caught on every ledge, worn'),
    'pod-hopper-empty':(P, 'a feed pod dispenser hopper: a galvanised steel funnel on a braced timber frame, the chute empty, the brass shutter closed and the amber lamp dark, grain dust caught on every ledge, worn'),
    'trough':          (P, 'a long galvanised feed trough on short timber legs, empty, scoured smooth inside, grain dust in the corners, worn brass end caps'),
    'trough-baited':   (P, 'a long galvanised feed trough on short timber legs heaped with golden grain, a warm amber glow rising out of it, husks drifting above, worn brass end caps'),
    'column':          (P, 'a colossal irrigation column: a dark green glazed pipe tower with brass ring collars, valve wheels, drip nozzles and mineral staining, green growth climbing it, dead straight and vertical, heavy'),
    'column-leaning':  (P, 'a colossal irrigation column tilted over at a steep angle, its base cracked open, brass ring collars sprung and a spray of water bursting from the split, dark green glazed pipe, green growth'),
    'column-fallen':   (P, 'a colossal irrigation column lying on its side as a walkway: dark green glazed pipe seen from the side, brass ring collars along it, cracked open at one end with water pooling, crushed green growth beneath, flat along the top'),
    'alarm':           (P, 'a dome alarm station: a galvanised wall box with a big brass pull lever pointing down, a dark red bell dome on top, a small unlit amber lamp, a faded instruction plate, dusty and untouched for years'),
    'alarm-on':        (P, 'a dome alarm station: a galvanised wall box with the brass pull lever pulled up, a red bell dome ringing, the amber lamp blazing, a faded instruction plate, dusty'),
    'bedding-cart':    (P, 'a heavy bedding cart on rail wheels: a low timber-sided trailer heaped with golden straw, iron corner braces, a tipping hinge at one end, worn brass fittings'),
    'conveyor':        (P, 'a grain conveyor belt segment seen from the side: a dark rubber tread belt on a galvanised frame with roller ends and timber guard rails, grain spilling over the edge, horizontal, worn'),
    'grain-chute':     (P, 'an overhead grain chute: a galvanised funnel and a hanging canvas sleeve, a brass release ring, grain dust caked on the rim, a thin trickle of golden grain falling'),
    'planter':         (P, 'an orchard row planter: a long galvanised trough bed on timber legs, dense green leafy growth spilling out of it, drip lines and small brass nozzles, roots hanging beneath'),
    'cluck-body':      (P, f'the enormous barrel-shaped body of an automated grain brood rig seen from the side, filling the whole frame: a long horizontal drum of dust-caked corrugated panelling banded with galvanised hoops, a row of riveted grain hoppers and canvas feed sleeves along the top, warm amber lamps glowing between the bands, brass inspection hatches, decades of grain dust and welded repair patches. Like a grain silo laid on its side, not a vehicle, not a creature. {CLUCK}'),
    'cluck-underside': (P, f'the underside of a colossal machine seen from the side: hanging feed pipes, canvas sleeves, chain runs and drip lines, dusty steel plating, warm amber light spilling down between the panels, dark and fading to black at the bottom. {CLUCK}'),
    'cluck-leg-plant': (P, f'one support leg of an enormous farm rig seen from the side, straight and vertical: a heavy galvanised strut with a riveted ring collar, one long ribbed hydraulic piston, bundled hoses strapped along it, and a broad flat steel foot pad resting on the ground. Agricultural machinery, like a harvester leg, NOT a robot leg, no armour plating. {CLUCK}'),
    'cluck-leg-lift':  (P, f'one support leg of an enormous farm rig seen from the side, folded at its brass joint with the broad flat foot pad lifted and tilted: a heavy galvanised strut, a long ribbed hydraulic piston part-extended, bundled hoses. Agricultural machinery, like a harvester leg, NOT a robot leg, no armour plating. {CLUCK}'),
    'cluck-head':      (P, f'the feeding head of a grain brood rig on the end of a ribbed steel neck, seen from the side: a long blunt scoop cowl like a combine harvester intake, dust-caked corrugated panelling, a wide slotted intake grille running along its underside, a warm amber lamp glowing inside the slot, brass hinge plates, grain husks caught along the rim. It is an intake scoop, NOT a helmet, NOT a head, no face, no eyes, no visor. {CLUCK}'),
    'cluck-head-feed': (P, f'the feeding head of a grain brood rig lowered flat against the ground, seen from the side: a long blunt scoop cowl like a combine harvester intake, its slotted grille open and glowing warm amber, grain dust kicking up around the rim, dust-caked corrugated panelling, brass hinge plates. An intake scoop, NOT a helmet, no face, no eyes, no visor. {CLUCK}'),
}
SHAPES = {
    'feed-pod': ('circle', 1.0), 'feed-pod-burst': ('pad', 2.0), 'pod-hopper': ('rect', 0.6), 'pod-hopper-empty': ('rect', 0.6),
    'trough': ('plate', 4.0), 'trough-baited': ('plate', 4.0), 'column': ('rect', 0.2), 'column-leaning': ('rect', 0.5),
    'column-fallen': ('plate', 6.0), 'alarm': ('rect', 0.5), 'alarm-on': ('rect', 0.5), 'bedding-cart': ('rect', 2.4),
    'conveyor': ('plate', 8.0), 'grain-chute': ('hull', 0.7), 'planter': ('rect', 1.4),
    'cluck-body': ('hull', 1.6), 'cluck-underside': ('hull', 3.0), 'cluck-leg-plant': ('rect', 0.35),
    'cluck-leg-lift': ('rect', 0.35), 'cluck-head': ('rect', 1.15), 'cluck-head-feed': ('rect', 1.3),
}

# per area: (the thin lit edge along the very top, the band of material below it, what hangs under the deck)
DECKS = {
    'threshold':  ('a pale painted safety edge stripe', 'dusty poured concrete slabs with galvanised trim and a faded yellow line', 'conduit and dusty pipework'),
    'feedline':   ('a brass edge rail with grain dust caught along it', 'weathered timber decking strapped with galvanised bands, faded ochre paint', 'grain chutes, sacks and hoppers'),
    'orchard':    ('a moss-green edge lip with small drip nozzles', 'galvanised grating over dark soil trays with green growth creeping through', 'irrigation pipes and trailing roots'),
    'alarmspine': ('a bare galvanised edge angle', 'open steel grating walkway panels with cross bracing, cable clips and bolted brackets', 'a steel truss with cross bracing and dangling cables'),
    'grid':       ('a wet brass edge trim with a thin water line', 'dark green glazed irrigation panels with brass valve fittings and mineral staining', 'water pipes, brass valves and drip lines'),
    'nestingbay': ('a worn timber edge beam with straw caught on it', 'thick timber planks over iron joists with bedding straw spilling at the edges', 'timber joists, straw and hanging lamps'),
}
AREA_OF = {}
for _a, (_edge, _body, _under) in DECKS.items():
    ITEMS[f'deck-{_a}'] = (P, f'a long heavy deck in flat orthographic side elevation, highly detailed: {_edge} along the very top edge, and below it a band of {_body}. No top surface visible, no perspective, no tilt'); SHAPES[f'deck-{_a}'] = ('plate', 4.9)
    ITEMS[f'hull-{_a}'] = (P, f'the underside of a raised deck seen from the side: hanging {_under}, dark, fading to black at the bottom'); SHAPES[f'hull-{_a}'] = ('hull', 3.0)
    ITEMS[f'ledge-{_a}'] = (P, f'a narrow catwalk plank in flat orthographic side elevation: {_edge} along the very top, and a slim band of {_body} below it. No top surface visible, no perspective'); SHAPES[f'ledge-{_a}'] = ('plate', 4.9)
    AREA_OF[f'deck-{_a}'] = AREA_OF[f'hull-{_a}'] = AREA_OF[f'ledge-{_a}'] = _a
C.ITEMS.update(ITEMS); C.SHAPES.update(SHAPES)

BG_WRAP = ('Wide 2D side-scroller game backdrop, painted stylised industrial game art, semi-realistic materials, dark and moody so a foreground platform stays readable, '
           'centre calm and darker, no characters, no people, no robots, no text, no platforms in the foreground. ')
BG_PROMPTS = {
    'threshold':  'the inside of a vast agricultural dome seen from the side, near the entrance: a tall airlock arch, dusty concrete apron, hanging warm work lamps, faint grain haze in the air, distant curved dome ribs rising out of sight, cool daylight leaking through the arch behind',
    'feedline':   'a long automated feed hall seen from the side: overhead grain chutes and conveyor lines running into the distance, sacks and hoppers stacked along the walls, warm amber lamps, thick dust in the light beams, dull galvanised steel and faded ochre paint',
    'orchard':    'the inside of an enormous hydroponic orchard seen from the side: tall rows of green growing columns receding into haze, irrigation pipes overhead, soft green under-lighting, warm work lamps between the rows, dust motes, overgrown and abandoned',
    'alarmspine': 'a tall service shaft inside a dome seen from the side: a lattice of galvanised ladders and catwalks going up, vent ducts and cable runs, a pale shaft of daylight from a broken roof panel far above, cool grey-green light, drifting dust',
    'grid':       'a vast irrigation grid hall seen from the side: rows of massive green hydroponic columns with brass fittings and valve wheels, overhead sprinkler rails, warm amber lamps low down, deep green shadow, humid haze',
    'nestingbay': 'a quiet bedding bay inside an agricultural dome seen from the side: deep straw bedding, timber stall partitions, rails running along the floor, a few dim warm lamps, dust settling in still air, calm and almost peaceful',
}

def small(fn, w=512):                      # one small reference: two, or a big one, makes every picture five times slower
    im = Image.open(os.path.join(C.ASSETS, fn)).convert('RGB')
    return C.upload_bytes('s6_' + fn.rsplit('.', 1)[0] + '.png', C.png(im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)))

def bg(area, n, seed0):
    os.makedirs(os.path.join(OUT, f'bg-{area}'), exist_ok=True)
    refs = [small('l4-bg-market-v2.jpg')]                 # the warmest backdrop we already have, for palette and mood only
    prompt = BG_WRAP + BG_PROMPTS[area] + '. Warm, dusty and agricultural: grain haze, warm work lamps, green growth, weathered timber and galvanised steel. NOT cold storm-grey, NOT blue-grey steel with orange panels.'
    seed0 = seed0 if seed0 is not None else random.randint(1, 10**9)
    for k in range(n):
        s = seed0 + k; open(os.path.join(OUT, f'bg-{area}', f'{s}.png'), 'wb').write(C.run(C.workflow_krea(prompt, None, None, s, 1.0, refs, lora=0.8, size=(1536, 640)))); print('bg', area, s, 'ok', flush=True)

def prompt_for(item):
    """Level 6's own wording. comfy_l3.make() hard-codes orange enamel service panels, which is the Level 3/4 look; nothing here may use it."""
    _, desc = ITEMS[item]
    area = AREA_OF.get(item)
    kind = item.split('-')[0]
    extra = ''
    if kind in ('deck', 'ledge'):
        extra = ' The very top edge of the picture is the walking surface: nothing rises above it, no wall, no scenery, nothing standing on it; the whole frame is the slab body.'
    if kind == 'hull' and area:
        # name the deck above it, or the model invents a bright orange band every time
        extra = f' The narrow strip along the very top is the edge of the deck above, made of {DECKS[area][1]}. Everything below it is dark structure fading to black.'
    return (f'Semi-realistic game asset{" in the colour palette and mood of the reference image" if area else ""}. {desc}.{extra} '
            'Warm dusty agricultural materials: galvanised steel gone dull, weathered timber, brass gone green, sun-faded paint peeling to bare metal, grain dust caught in every seam, '
            'bright specular highlights on the edges, bevelled edges catching light, soft ambient occlusion, rivets and bolts, crisp dark outlines, high detail, dim moody lighting. '
            'NOT blue-grey steel, NO orange panels, NO orange enamel, NOT cold storm-grey, nothing clean, nothing sci-fi. '
            'Flat straight-on front elevation, 2D side-scroller sprite, isolated on flat magenta.')

def make_item(item, n, seed0):
    """every Level 6 sprite: area pieces take their own backdrop as the colour reference, props take none"""
    area = AREA_OF.get(item)
    init, m, _ = C.shape_pair(item)
    mask = C.upload_bytes(f'm6_{item}.png', C.png(m)); iname = C.upload_bytes(f'i6_{item}.png', C.png(init))
    refs = []
    if area:
        bgfile = f'l6-bg-{area}-v1.jpg'
        refs = [small(bgfile)] if os.path.exists(os.path.join(C.ASSETS, bgfile)) else [small('l4-bg-market-v2.jpg')]
    os.makedirs(os.path.join(OUT, item), exist_ok=True); seed0 = seed0 if seed0 is not None else random.randint(1, 10**9)
    for k in range(n):
        s2 = seed0 + k
        open(os.path.join(OUT, item, f'{s2}.png'), 'wb').write(C.run(C.workflow_krea(prompt_for(item), iname, mask, s2, 0.95, refs)))
        print(item, s2, 'ok', flush=True)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    n = int(opt.get('--n', 2)); seed = int(opt['--seed']) if '--seed' in opt else None
    if not args or args[0] == 'list':
        for k, v in ITEMS.items(): print(f'{k:20} {v[1][:86]}')
        for k in BG_PROMPTS: print(f'bg {k}')
    elif args[0] == 'make':
        for k in args[1:]: make_item(k, n, seed)
    elif args[0] == 'bg':
        for k in args[1:]: bg(k, n, seed)
    elif args[0] == 'all':
        for k in BG_PROMPTS:                                   # backdrops first: the area pieces use them as their colour reference
            if not (os.path.isdir(os.path.join(OUT, f'bg-{k}')) and os.listdir(os.path.join(OUT, f'bg-{k}'))): bg(k, n, seed)
        for k in ITEMS:
            d = os.path.join(OUT, k)
            if os.path.isdir(d) and any(f.endswith('.png') for f in os.listdir(d)): continue
            make_item(k, n, seed)
