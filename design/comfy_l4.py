"""Level 4 art with a LOCAL ComfyUI + Krea 2 (the same pipeline as Level 3, see comfy_l3.py). Level 4 reuses Level 3's steel decks, catwalks, gate, socket, crane
parts and terminals; this makes only what is new: the Carried Core in its four looks, the scale plate, belt, vent, arc pylon, relay node, market kiosks, customs
desk, lift socket, delivery slip, the core cradle and six area backdrops. Every picture starts from a flat front-elevation silhouette at the size the game draws it
(the game camera is flat side-on), on flat magenta, and is keyed later by design/build_l4_art.py.
Usage (from design/, ComfyUI running at 127.0.0.1:8188):
    python comfy_l4.py list
    python comfy_l4.py make NAME [NAME...] [--n=3] [--seed=1]      sprites -> level4-art-krea/<name>/<seed>.png
    python comfy_l4.py bg AREA [AREA...] [--n=3] [--seed=1]        backdrops -> level4-art-krea/bg-<area>/<seed>.png
    python comfy_l4.py all [--n=3]                                 everything that has no picture yet"""
import os, random, sys
sys.argv.append('--krea')
import comfy_l3 as C
from PIL import Image

OUT = os.path.join(C.ROOT, 'design', 'level4-art-krea'); C.OUT = OUT
P = 'props'

# name: (group, what it is). The colour of every core says its mode (heavy amber, buoyant pale cyan, charged violet); hazard red is left to enemies.
ITEMS = {
    'core-carry':   (P, 'a heavy power core canister: a rounded steel cylinder with riveted caps and cable ports, a small round window glowing soft white-grey, worn paint, chunky and readable'),
    'core-heavy':   (P, 'a heavy power core canister: a rounded steel cylinder with riveted caps and thick weight-plate rings, a hazard stripe band, a round window glowing amber orange, extra armour, chunky and readable'),
    'core-buoy':    (P, 'a light power core canister: a rounded steel cylinder with small vent fins and tiny propeller ducts on top, a round window glowing pale sky cyan, lighter frame, chunky and readable'),
    'core-charge':  (P, 'a charged power core canister: a rounded steel cylinder with exposed copper coil windings, a round window glowing violet purple, tiny electric arcs on it, chunky and readable'),
    'cradle':       (P, 'a low core cradle stand: a steel base with two curved clamps that hold a canister, hazard stripes on the base, worn'),
    'scale-plate':  (P, 'a heavy floor weighing plate set flush into a steel deck: a flat pad with an orange-brass border, load cells at both ends and a small amber status lamp, worn'),
    'scale-plate-on': (P, 'a heavy floor weighing plate set flush into a steel deck: a flat pad with an orange-brass border, load cells at both ends and a small green status lamp glowing, worn'),
    'belt':         (P, 'a conveyor belt segment: a dark rubber tread belt on a steel frame with roller ends and orange guard rails, horizontal, worn'),
    'vent':         (P, 'a floor ventilation fan housing: a steel grille box with a round fan hub and slotted louvres, pale cyan lit slots, worn'),
    'arc-post':     (P, 'a tall slim electrode pylon: a steel post with a white ceramic insulator, a copper cap and a violet lamp at the top, hazard band at the bottom'),
    'relay-node':   (P, 'a ring shaped relay node: a steel torus ring with copper coil windings and a dim violet core in the middle, bolted mounting lugs'),
    'relay-node-on': (P, 'a ring shaped relay node: a steel torus ring with copper coil windings and a bright glowing green-teal core in the middle, bolted mounting lugs'),
    'vending-bot':  (P, 'a squat vending machine robot: a boxy steel body with a lit product window, a coin slot, two small arms and an antenna, orange trim, worn'),
    'busker-bot':   (P, 'a small busker robot: a drum for a torso, a cymbal for a hat, two drumstick arms, orange and steel, worn'),
    'customs-desk': (P, 'an official customs desk: a steel counter with a stamp pad and a rubber stamp, a small glowing monitor and a service bell, off-white panels with orange trim, worn'),
    'lift-socket':  (P, 'a tall lift power socket panel: a big round dark port in the middle with copper contacts, an amber status display above it, a hazard-striped frame, heavy steel'),
    'slip':         (P, 'a small paper delivery slip document with printed lines and one orange stamp mark, slightly curled corner'),
}
SHAPES = {
    'core-carry': ('circle', 1.0), 'core-heavy': ('circle', 1.0), 'core-buoy': ('circle', 1.0), 'core-charge': ('circle', 1.0), 'cradle': ('plate', 3.0),
    'scale-plate': ('plate', 5.0), 'scale-plate-on': ('plate', 5.0), 'belt': ('plate', 8.0), 'vent': ('rect', 2.2), 'arc-post': ('rect', 0.16),
    'relay-node': ('circle', 1.0), 'relay-node-on': ('circle', 1.0), 'vending-bot': ('rect', 0.62), 'busker-bot': ('rect', 0.9), 'customs-desk': ('rect', 1.15),
    'lift-socket': ('rect', 0.62), 'slip': ('rect', 0.8),
}
C.ITEMS.update(ITEMS); C.SHAPES.update(SHAPES)


# ---- the per-area kit: deck, underside and catwalk in each area's own materials, plus the gates and the crane ---------------------------------------------------
# Level 3 is blue-grey steel with orange panels; Level 4 must not look like it. Each area has its own material and its palette comes from its own backdrop.
MATERIALS = {
    'deck':    ('dark slate-grey weathered poured concrete with dull brushed steel edge trim, a faded yellow safety line and a dim teal indicator strip', 'a clean transit platform slab, recessed floor lights, bolted panels, lightly worn'),
    'freight': ('rusty corrugated container steel in oxblood red and faded ochre with chipped paint, an orange-yellow hazard lip', 'a freight loading dock deck, forklift scuffs, welded seams, chain hooks, heavy and dusty'),
    'market':  ('warm weathered timber planks and brass trim over dark iron, teal painted fascia, small strung warm lamps along the edge', 'a market walkway deck, cosy and worn'),
    'spine':   ('cold galvanised zinc steel, pale grey-blue, lattice truss and grating, cable clips, a lit blue-white strip', 'an antenna tower gantry walkway with railing posts'),
    'relay':   ('black insulated composite panels with copper busbar trim, white ceramic insulators and violet lit strips', 'a power relay bay deck slab with cable trays'),
    'shaft':   ('oil-black cast iron with heavy rivets, a red warning stripe lip and dull brass brackets', 'a lift shaft landing deck, guide-rail brackets, dark and oily'),
}
UNDER = {'deck': 'concrete beams, pipes and cable ducts', 'freight': 'container racks, chains and hydraulic hoses', 'market': 'timber joists, hanging cables and small lamps',
         'spine': 'a steel truss with cross bracing and dangling cables', 'relay': 'cable trays, transformers and insulator stacks', 'shaft': 'heavy girders, chains and dripping pipes'}
# the deck as a flat elevation: (the thin lit edge along the very top, the band of material below it)
DECKS = {
    'deck':    ('a thin faded-yellow safety edge strip', 'dark slate-grey concrete panels with dull brushed steel trim and recessed teal light strips'),
    'freight': ('a thick orange-yellow hazard lip', 'rusty oxblood corrugated container steel panels with welded seams, chain hooks and stencilled numbers'),
    'market':  ('a polished brass edge trim with a row of tiny warm lamps', 'warm weathered timber planks strapped with dark iron bands, teal painted fascia'),
    'spine':   ('a thin lit blue-white edge strip', 'galvanised zinc steel grating panels with cross bracing, cable clips and bolted brackets'),
    'relay':   ('a violet lit edge strip', 'black insulated composite panels with copper busbar trim and white ceramic insulators'),
    'shaft':   ('a red warning stripe lip', 'oil-black riveted cast iron plates with heavy bolts and dull brass guide-rail brackets'),
}
AREA_OF = {}
for _a, (_edge, _body) in DECKS.items():
    ITEMS[f'deck-{_a}'] = (P, f'a long heavy deck in flat orthographic side elevation, highly detailed: {_edge} along the very top edge, and below it a band of {_body}. No top surface visible, no perspective, no tilt'); SHAPES[f'deck-{_a}'] = ('plate', 4.9)
    ITEMS[f'hull-{_a}'] = (P, f'the underside of a floating deck seen from the side: hanging {UNDER[_a]}, dark, fading to black at the bottom'); SHAPES[f'hull-{_a}'] = ('hull', 3.0)
    ITEMS[f'ledge-{_a}'] = (P, f'a narrow catwalk plank in flat orthographic side elevation: {_edge} along the very top, and a slim band of {_body} below it. No top surface visible, no perspective'); SHAPES[f'ledge-{_a}'] = ('plate', 4.9)
    AREA_OF[f'deck-{_a}'] = AREA_OF[f'hull-{_a}'] = AREA_OF[f'ledge-{_a}'] = _a
GATES = {
    'gate-sorting': ('freight', 'a tall roll-up freight shutter door slab: horizontal corrugated ribs in ochre and rust, a hazard-striped top housing, a small amber lamp'),
    'gate-customs': ('market', 'a tall customs checkpoint barrier gate slab: pale grey panels with a teal glass strip, a glowing amber scanner light, brass trim'),
    'gate-relay':   ('relay', 'a tall insulated blast door slab: black composite plates with copper trim and violet indicator lights'),
    'gate-cage':    ('shaft', 'a tall welded steel bar cage gate: oxblood painted iron bars, a heavy lock plate and a yellow hazard header'),
}
for _g, (_a, _d) in GATES.items(): ITEMS[_g] = (P, _d); SHAPES[_g] = ('rect', 0.3); AREA_OF[_g] = _a
ITEMS['crane-container'] = (P, 'a hanging cargo crane block: a rusty oxblood red shipping container with corner castings and a spreader beam on top, hazard striped bottom edge'); SHAPES['crane-container'] = ('rect', 1.2); AREA_OF['crane-container'] = 'freight'
ITEMS['crane-cable'] = (P, 'a vertical steel wire rope, straight, with a small hook block at the bottom'); SHAPES['crane-cable'] = ('plate', 0.12); AREA_OF['crane-cable'] = 'freight'
C.ITEMS.update(ITEMS); C.SHAPES.update(SHAPES)

def make_area(item, n, seed0):
    """like comfy_l3.make (Krea branch), but with the area's own material and the area's backdrop as the colour reference"""
    area = AREA_OF[item]; group, desc = ITEMS[item]; mat = MATERIALS[area][0]
    init, m, _ = C.shape_pair(item); mask = C.upload_bytes(f'm_{item}.png', C.png(m)); iname = C.upload_bytes(f'i_{item}.png', C.png(init))
    def small(fn, w=640):                        # big references fill the GPU and make every picture crawl: shrink them first
        im = Image.open(os.path.join(C.ASSETS, fn)).convert('RGB'); im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        return C.upload_bytes('s_' + fn.rsplit('.', 1)[0] + '.png', C.png(im))
    refs = [small(f'l4-bg-{area}-v1.jpg', 512)]          # one small reference: two made every picture five times slower
    flat = ' The very top edge of the picture is the walking surface: nothing rises above it, no wall, no scenery, nothing standing on it; the whole frame is the slab body.' if item.split('-')[0] in ('deck', 'ledge') else ''
    prompt = (f'Semi-realistic metallic game asset in the colour palette and mood of the reference image (the area backdrop). {desc}.{flat} '
              f'Materials: {mat}, with bright specular highlights on the edges, bevelled edges catching light, subtle reflections and sheen, soft ambient occlusion in the seams, paint chipped down to bare shiny metal, '
              f'rivets, bolts and fasteners, crisp dark outlines, high detail, dim moody lighting matching the backdrop (dark, weathered, not bright, not glossy clean). NOT blue-grey steel, NOT orange enamel panels. Flat straight-on front elevation, 2D side-scroller sprite, isolated on flat magenta.')
    os.makedirs(os.path.join(OUT, item), exist_ok=True); seed0 = seed0 if seed0 is not None else random.randint(1, 10**9)
    for k in range(n):
        s = seed0 + k; open(os.path.join(OUT, item, f'{s}.png'), 'wb').write(C.run(C.workflow_krea(prompt, iname, mask, s, 0.95, refs))); print(item, s, 'ok', flush=True)

BG_PROMPTS = {
    'deck':    'a clean, dim, lit industrial transit deck interior seen from the side: a wide hall with steel columns, a far archway, soft blue-grey lights, hazard-striped pillars, quiet and tidy, distant ceiling gantries',
    'freight': 'a cavernous freight concourse interior seen from the side: overhead cargo cranes on rails, stacked shipping containers, conveyor lines in the far distance, amber sodium lamps, dusty haze, worn steel',
    'market':  'an underground depot market hall seen from the side: rows of empty stalls with hanging warm lamps, shuttered kiosks, cable bunting, teal and green signage glow, cosy and abandoned, no people',
    'spine':   'the inside of a tall antenna tower seen from the side: crossing steel lattice, cable bundles, dish antennas, storm clouds and a lit window in the far distance, cold blue-grey dusk light, vertical depth',
    'relay':   'a power relay bay interior seen from the side: rows of transformers, thick cable trunks, insulator stacks, violet and blue glow from the equipment, dark, dramatic, steel catwalks far away',
    'shaft':   'a tall vertical lift shaft interior seen from the side: guide rails running up, cables, red warning lamps far below, a faint daylight glow at the very top, deep dark, dramatic',
}

def bg(area, n, seed0):
    os.makedirs(os.path.join(OUT, f'bg-{area}'), exist_ok=True)
    refs = [C.upload(os.path.join(C.ASSETS, 'l3-bg-lab-v3.jpg'))]
    prompt = ('Wide 2D side-scroller game backdrop, painted stylised industrial hard-surface game art, semi-realistic metal materials, dark and moody so a foreground platform stays readable, '
              'centre calm and darker, no characters, no people, no robots, no text, no platforms in the foreground. ' + BG_PROMPTS[area] + '. In the exact style of the reference image.')
    seed0 = seed0 if seed0 is not None else random.randint(1, 10**9)
    for k in range(n):
        s = seed0 + k; open(os.path.join(OUT, f'bg-{area}', f'{s}.png'), 'wb').write(C.run(C.workflow_krea(prompt, None, None, s, 1.0, refs, lora=0.8, size=(1536, 640)))); print('bg', area, s, 'ok', flush=True)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    n = int(opt.get('--n', 3)); seed = int(opt['--seed']) if '--seed' in opt else None
    if not args or args[0] == 'list':
        for k, v in ITEMS.items(): print(f'{k:16} {v[1][:90]}')
        for k in BG_PROMPTS: print(f'bg {k}')
    elif args[0] == 'make':
        for k in args[1:]: (make_area if k in AREA_OF else C.make)(k, n, seed)
    elif args[0] == 'bg':
        for k in args[1:]: bg(k, n, seed)
    elif args[0] == 'all':
        for k in ITEMS:
            d = os.path.join(OUT, k)
            if os.path.isdir(d) and any(f.endswith('.png') for f in os.listdir(d)): continue
            (make_area if k in AREA_OF else C.make)(k, n, seed)
        for k in BG_PROMPTS:
            d = os.path.join(OUT, f'bg-{k}')
            if os.path.isdir(d) and any(f.endswith('.png') for f in os.listdir(d)): continue
            bg(k, n, seed)
