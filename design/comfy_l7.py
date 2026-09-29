"""Generate Level 7 visual-development candidates with local ComfyUI + Krea 2.

Usage from the repository root:
  python design/comfy_l7.py landing [--n=2] [--seed=9700]
  python design/comfy_l7.py backgrounds [--n=1] [--seed=9710]
  python design/comfy_l7.py foundation [--n=1] [--seed=9700]

Outputs stay under design/level7-art-comfy for review. They are not runtime assets.
"""

import json
import os
import shutil
import sys
import time
import urllib.parse

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.argv.append("--krea")
import comfy_l3 as C
from key_magenta import key as key_magenta


HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "level7-art-comfy")
RAW = os.path.join(OUT, "production-raw")
FINAL = os.path.join(OUT, "production")

OPTIONS = {
    part.split("=", 1)[0]: part.split("=", 1)[1]
    for part in sys.argv[1:]
    if part.startswith("--") and "=" in part
}


def run_workflow(workflow):
    prompt_id = C.http(
        "/prompt",
        json.dumps({"prompt": workflow, "client_id": "l7-production"}).encode(),
        {"Content-Type": "application/json"},
    )["prompt_id"]
    while True:
        history = C.http("/history/" + prompt_id)
        if prompt_id in history:
            entry = history[prompt_id]
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                messages = status.get("messages", [])
                raise RuntimeError(f"ComfyUI job {prompt_id} failed: {messages[-1:]}")
            if entry.get("outputs"):
                image = entry["outputs"]["10"]["images"][0]
                return C.http(
                    "/view?" + urllib.parse.urlencode({
                        "filename": image["filename"],
                        "subfolder": image["subfolder"],
                        "type": image["type"],
                    }),
                    raw=True,
                )
        time.sleep(1)

VISUAL_RULES = (
    "Semi-realistic grounded near-future industrial game art with practical hard-surface construction, "
    "real metal wear, scratches, edge abrasion, grime, fasteners, seams, vents and service access. "
    "Abandoned civic modernism at early morning: pale concrete, faded mint enamel, oxidized aluminium, "
    "dirty glass, route-map yellow and clean sunlight with long cool shadows. Restrained cyan means Pack "
    "or safe technology; amber means warning; hazard red appears only on immediate danger. Quiet, orderly "
    "and operational after eleven years, not destroyed. No cartoon, anime, chibi, glossy toy, steampunk, "
    "fantasy, white laboratory, purple-blue cyberpunk neon, apocalypse rubble, crowd, watermark or logo."
)

LANDING_PROMPT = (
    "Cinematic 2D platformer key art, wide 16:9. Bix is the exact young technician from the first reference: "
    "messy dark hair, glasses with one cyan lens, worn teal work jacket, layered utility clothing, dark cargo "
    "trousers, gloves, boots and orange hardware accents. He stands on an abandoned elevated civic railway "
    "platform at early morning, facing right toward a waiting automated train. Pack is the exact compact floating "
    "camera-backpack robot from the second and third references, detached from Bix and locked horizontally into a "
    "waist-high relay socket behind him: one dominant large circular cyan camera lens on the front, one antenna, "
    "worn off-white armour, charcoal machinery, orange service panels and two small articulated utility arms. "
    "Pack has one compact rectangular camera body, not a humanoid torso, and has no walking legs, knees or feet. "
    "One bright, thin and clearly visible cyan signal tether leaves Pack, passes through two small relay posts and "
    "reaches the train. Their physical separation is the central idea. Pale concrete, faded mint enamel, dirty "
    "glass, route-map yellow, practical rails and ticket barriers, long cool shadows and clean sunlight. Bix is "
    "left-middle, Pack remains clearly visible behind him, and the train occupies the right. Quiet empty city, "
    "no combat pose, no baked title, no readable signage. " + VISUAL_RULES
)

BACKGROUNDS = {
    "dome-exit": (
        "Wide side-scrolling environment backdrop, strict flat side view. The left edge retains warm dusty "
        "amber-green agricultural machinery behind a sealed dome service door, then transitions right into "
        "pale civic concrete, faded mint panels, rain-marked glass, public stairs and cool sunrise. Quiet skyline "
        "and elevated transit infrastructure in the distance. No characters, enemies, readable text, collidable "
        "foreground platforms, visible top surfaces, dramatic perspective or bright focal object."
    ),
    "civic-intake": (
        "Wide side-scrolling environment backdrop, strict flat side view. An empty civic intake with three clearly "
        "stacked elevations: basement service floor, public lobby and upper mezzanine, connected by lift shafts, "
        "ticket-control drops, offset stairs and bridge-counterweight housings. Pale concrete bays, faded mint enamel, "
        "dirty glazed doors, route-map yellow details and restrained cyan status lights. Morning light reaches only "
        "the upper floor. Leave clean visual space for moving gameplay geometry. No characters, readable words, "
        "baked hazards, top-down view or perspective tilt."
    ),
    "relay-court": (
        "Wide municipal relay court in strict flat side elevation. The architecture forms a readable W silhouette: "
        "west descent, rising pedestrian bridge, central inspection-booth drop, second rising bridge and high east "
        "terrace. Bridge pivots, manual hand-wheel stations, civic signal pylons and maintenance rails sit against a "
        "clean distant skyline in early sun. Empty but operational. No characters, drones, readable text, perspective "
        "tilt or visible platform tops."
    ),
    "archive-spine": (
        "Tall four-storey civic records archive composed for a side-scrolling vertical climb, strict orthographic side "
        "view. A central counterweight shaft divides west and east climbing stacks; cross-passages loop around it. "
        "Overhead clamp rails, service ladders, lift landings, shutter housings, dark glass, pale concrete ribs, faded "
        "mint cabinets and restrained cyan edge strips. Strong climb-drop-climb structure with daylight from high "
        "windows. Quiet administrative unease, no horror, characters, text, perspective distortion or top surfaces."
    ),
    "ghost-platform": (
        "Abandoned elevated tram depot still running its morning schedule, strict flat side-on gameplay view. Three "
        "readable elevations: tram roofs and hanging signs above, public platforms in the middle and a service tunnel "
        "below. Ladders, open carriage cuts, gantries and maintenance stairs connect them in alternating vertical "
        "directions. Dirty glass shelters, mint enamel columns, route-map yellow bands and distant apartments in clean "
        "sunrise. Functional rather than haunted. No characters, readable text, fog, strong perspective or neon city."
    ),
    "first-train": (
        "Final civic rail departure complex in strict flat side view. A service pit lies below the platform, two luggage "
        "lifts rise to an overhead signal gantry, and an aged automated train waits beneath with an emergency roof hatch. "
        "The scene reads as one climb from below the tracks to above the train and back down inside it. Practical service "
        "panels, dirty windows, route-map yellow markings, relay infrastructure and a bright unnamed district beyond. "
        "No people, readable destination, heroic fantasy light, cyberpunk neon, destruction or perspective tilt."
    ),
}

SHEET_RULES = (
    "One clean production sprite sheet on a solid flat pure magenta #FF00FF background. Strict orthographic side or "
    "front elevation, even cells, complete subjects fully inside every cell, consistent scale and lighting, no cast "
    "shadow, no floor, no captions, no border, no overlap and no cropped parts. The magenta background must remain "
    "perfectly plain so it can be removed to transparency."
)

MASTER_RULES = (
    "Exactly ONE isolated object only, centred and large, filling about seventy percent of the image. Solid flat pure "
    "magenta #FF00FF background. No duplicate, no sequence, no grid, no atlas, no environment, no building, no room, "
    "no floor, no cast shadow, no label, no border, no cropped part. Strict flat side elevation for a 2D platform game."
)

PRODUCTION_ASSETS = {
    "pack-link-sheet": {
        "size": (1536, 864), "transparent": True, "refs": "pack",
        "prompt": (
            "Eight-frame animation sheet, two rows of four, of the exact canonical Pack reference. Pack is one compact "
            "rectangular transformable backpack robot with one dominant large circular cyan camera lens, one antenna, "
            "worn off-white armour, charcoal machinery, orange service panels and two articulated utility arms. Frames: "
            "attached backpack idle, release latch opening, compact hop, utility arms extending, landing beside socket, "
            "connector arm extending, connector locked with restrained cyan lens pulse, recall launch. Preserve the exact "
            "body proportions and front lens; no humanoid torso, walking legs, knees, feet or redesign. " + SHEET_RULES
        ),
    },
    "bix-relay-actions-sheet": {
        "size": (1536, 864), "transparent": True, "refs": "bix",
        "prompt": (
            "Eight-frame animation sheet, two rows of four, of the exact canonical Bix reference. Preserve his face, "
            "messy dark hair, glasses with one cyan lens, worn teal work jacket, utility straps, dark cargo trousers, "
            "gloves, boots and orange mechanical glove. Frames: neutral side idle, kneel to release Pack, hand on civic "
            "terminal, look back toward Pack, brace during signal transfer, shield raised, sprint toward recall, catch "
            "Pack returning. Practical readable body mechanics, no weapon and no costume change. " + SHEET_RULES
        ),
    },
    "civic-relay-props-atlas": {
        "size": (1536, 1024), "transparent": True, "refs": "style",
        "prompt": (
            "Twelve-cell prop atlas, three rows of four: inactive relay socket, active relay socket, repeater carriage on "
            "rail, return terminal, reset terminal, linked gate, rotating pedestrian bridge segment, traction relay, "
            "ticket barrier, departure-board housing, civic bench and maintenance tram service plate. Worn civic-industrial "
            "construction: pale concrete, faded mint enamel, oxidized aluminium, charcoal mechanics, route-map yellow, "
            "restrained cyan active lights and amber warnings. Clear silhouettes and functional hardware. " + SHEET_RULES
        ),
    },
    "street-sweeper-sheet": {
        "size": (1536, 864), "transparent": True, "refs": "enemy",
        "prompt": (
            "Eight-frame side-view animation sheet, two rows of four, for one low autonomous municipal Street Sweeper. "
            "Compact rectangular public-service body, worn mint and off-white panels, charcoal wheels and brushes, amber "
            "beacon and route-yellow marks. Frames: idle, beacon warning, brush spin-up, sweep forward, full brush extension, "
            "push contact, brush retract and turn pause. Practical machine, no face, eyes, teeth or weapon. " + SHEET_RULES
        ),
    },
    "ticket-drone-sheet": {
        "size": (1536, 864), "transparent": True, "refs": "enemy",
        "prompt": (
            "Eight-frame side-view animation sheet, two rows of four, for one automated civic Ticket Drone. Small hovering "
            "inspection unit with worn off-white and charcoal shell, faded mint civic panel, route-yellow block, restrained "
            "cyan idle scanner and red only during interruption. Frames: idle hover, turn, scan charge, cyan sweep, amber "
            "lock warning, red interruption pulse, recoil and idle. Administrative, not military, no guns or mascot face. " + SHEET_RULES
        ),
    },
    "turnstile-ram-sheet": {
        "size": (1536, 864), "transparent": True, "refs": "enemy",
        "prompt": (
            "Eight-frame side-view animation sheet, two rows of four, for one automated civic Turnstile Ram. Waist-high "
            "access-control carriage constrained to one floor rail, worn off-white and faded mint panels, charcoal magnetic "
            "bumper, route-yellow markings and two amber warning lamps. Frames: idle, first flash, second flash, barrier "
            "lowering, rail charge, shield contact, magnetic-stop capture and reset. No face or combat-vehicle styling. " + SHEET_RULES
        ),
    },
    "service-clamp-sheet": {
        "size": (1536, 864), "transparent": True, "refs": "enemy",
        "prompt": (
            "Eight-frame side-view animation sheet, two rows of four, for one overhead civic Service Clamp on a horizontal "
            "maintenance rail. Articulated clamp, worn aluminium housing, faded mint panel, charcoal joints, route-yellow "
            "stripe and amber status lamp. Frames: parked, rail travel, target tell, descend, lock infrastructure, magnetic "
            "retract, carriage pull and harmless parked state. It never grabs a person. " + SHEET_RULES
        ),
    },
    "signal-auditor-sheet": {
        "size": (1536, 864), "transparent": True, "refs": "enemy",
        "prompt": (
            "Eight-frame side-view animation sheet, two rows of four, for one small municipal Signal Auditor attached to a "
            "thin cyan relay tether. Compact clamp-on inspection body, worn off-white shell, charcoal rollers, faded mint "
            "plate, amber lamp and red only at interruption. Frames: tether attachment, scan, travel, pause tell, Pack ping "
            "reversal, branch diversion, interruption and detach. Mechanical device, no face, weapon or mascot styling. " + SHEET_RULES
        ),
    },
    "link-effects-sheet": {
        "size": (1344, 768), "transparent": True, "refs": "style",
        "prompt": (
            "Twelve-cell 2D effects atlas: cyan tether pulse in six phases, linked-chain icon activation, repeater hand-off "
            "ring, signal-radius boundary marks, amber distance warning, broken-chain interruption, one-second machinery "
            "hold state and recall trail. Crisp thin technical energy, controlled light, clear gameplay silhouettes, no "
            "magic particles, lightning, smoke, lens flare, broad bloom or purple. " + SHEET_RULES
        ),
    },
    "archive-memory-frame": {
        "size": (1344, 768), "transparent": False, "refs": "characters",
        "prompt": (
            "Damaged civic security-camera still, 16:9. The exact canonical Bix enters the civic intake eleven years earlier "
            "with the exact canonical Pack attached as his backpack. Their equipment is cleaner and less worn, but designs "
            "and proportions remain unchanged. High-mounted administrative camera, mild lens distortion, desaturated public "
            "building light, pale concrete gate, subtle timestamp blocks without readable date and gentle compression damage. "
            "Factual, not dreamlike; no extra people, horror, combat or redesign."
        ),
    },
    "departure-story-frame": {
        "size": (1344, 768), "transparent": False, "refs": "characters",
        "prompt": (
            "Cinematic final story frame, 16:9. The exact canonical Bix stands inside an aged automated civic train at sunrise "
            "near the closing door, with the exact canonical Pack attached on his back and the cyan lens visible over one "
            "shoulder. Through the window: empty platform, aged departure-board housing and bright unnamed civic district. "
            "Bix looks determined, not triumphant. Quiet civic unease, pale concrete, faded mint, route-yellow, realistic worn "
            "materials and clean morning light. No combat, crowd, destination name, purple neon or redesign."
        ),
    },
}

REPAIR_ASSETS = {
    "ticket-drone": (
        "One small hovering automated civic Ticket Drone, strict flat side view, fully visible and centred. Compact "
        "inspection camera body with no cabin, no wheels and no vehicle shape; worn off-white shell, charcoal underside, "
        "faded mint civic panel, one narrow cyan scanner slit, two tiny stabilizer fans and one route-yellow identifier "
        "block. Administrative inspection hardware, not military, no gun, missile, face, arms, legs, text or mascot shape."
    ),
    "turnstile-ram": (
        "One waist-high automated civic Turnstile Ram, strict flat side view, fully visible and centred. Low rectangular "
        "access-control carriage locked to a short horizontal floor rail, broad charcoal magnetic bumper facing right, "
        "folding barrier arm, worn off-white and faded mint panels, route-yellow markings and two amber warning lamps. "
        "Public-building machinery, not a vehicle: no cabin, windshield, wheels, face, weapon, text or tall body."
    ),
    "service-clamp": (
        "One overhead civic Service Clamp, strict flat side view, fully visible and centred. A compact wheeled carriage "
        "hanging from a short horizontal ceiling rail, with an articulated vertical piston and two blunt mechanical jaws "
        "pointing downward. Worn aluminium, faded mint service panel, charcoal joints, route-yellow stripe and amber status "
        "lamp. Infrastructure maintenance tool, no floor vehicle, wall cabinet, person, face, weapon or text."
    ),
    "signal-auditor": (
        "One tiny municipal Signal Auditor, strict flat side view, fully visible and centred. A palm-sized clamp-on device "
        "gripping a thin horizontal cyan relay cable with two charcoal rollers, worn off-white shell, faded mint plate, one "
        "amber inspection lamp and one small red interruption aperture. Clearly much smaller than a backpack, no large box, "
        "vehicle, arms, legs, face, weapon or text."
    ),
}


def upload_small(path, width=512):
    image = Image.open(path).convert("RGB")
    height = max(8, round(image.height * width / image.width))
    image = image.resize((width, height), Image.LANCZOS)
    name = "l7ref_" + os.path.basename(path).rsplit(".", 1)[0] + ".png"
    return C.upload_bytes(name, C.png(image))


def refs(paths):
    return [upload_small(path) for path in paths]


def generate(name, prompt, reference_paths, seed, count, size):
    target = os.path.join(OUT, name)
    os.makedirs(target, exist_ok=True)
    uploaded = refs(reference_paths)
    for offset in range(count):
        current_seed = seed + offset
        result = run_workflow(
            C.workflow_krea(
                prompt + " " + VISUAL_RULES,
                None,
                None,
                current_seed,
                1.0,
                uploaded,
                steps=8,
                lora=0.8,
                size=size,
            )
        )
        path = os.path.join(target, f"{current_seed}.png")
        with open(path, "wb") as output:
            output.write(result)
        print("made", name, current_seed, flush=True)


def make_landing(seed, count):
    generate(
        "landing",
        LANDING_PROMPT,
        [
            os.path.join(HERE, "bix-poses", "front", "1.png"),
            os.path.join(HERE, "pack-poses", "front-wave", "3.png"),
            os.path.join(HERE, "references", "pack-character-v1.png"),
        ],
        seed,
        count,
        (1536, 864),
    )


def make_backgrounds(seed, count):
    reference_paths = [
        os.path.join(C.ASSETS, "facility-background-v1.png"),
        os.path.join(C.ASSETS, "l6-bg-threshold-v1.jpg"),
    ]
    for index, (name, scene) in enumerate(BACKGROUNDS.items()):
        generate(
            "bg-" + name,
            scene,
            reference_paths,
            seed + index * 10,
            count,
            (1536, 640),
        )


def reference_paths(kind):
    style = [
        os.path.join(C.ASSETS, "facility-prop-atlas-v1.png"),
        os.path.join(C.ASSETS, "furnace-prop-atlas-v2.png"),
    ]
    groups = {
        "style": style,
        "enemy": [
            os.path.join(C.ASSETS, "enemy-crawler-v2.png"),
            os.path.join(C.ASSETS, "facility-prop-atlas-v1.png"),
        ],
        "pack": [
            os.path.join(HERE, "references", "pack-character-v1.png"),
            os.path.join(HERE, "pack-poses", "front-wave", "3.png"),
            os.path.join(HERE, "pack-poses", "side-right", "3.png"),
        ],
        "bix": [
            os.path.join(HERE, "bix-poses", "front", "1.png"),
            os.path.join(HERE, "bix-poses", "glove-reach", "1.png"),
            os.path.join(HERE, "bix-poses", "run", "1.png"),
        ],
        "characters": [
            os.path.join(HERE, "bix-poses", "front", "1.png"),
            os.path.join(HERE, "bix-poses", "side-right", "1.png"),
            os.path.join(HERE, "references", "pack-character-v1.png"),
        ],
    }
    return groups[kind]


def make_production_assets(seed, count):
    os.makedirs(RAW, exist_ok=True)
    os.makedirs(FINAL, exist_ok=True)
    force = OPTIONS.get("--force", "0") == "1"
    for index, (name, spec) in enumerate(PRODUCTION_ASSETS.items()):
        final_path = os.path.join(FINAL, f"l7-{name}-v1.png")
        if os.path.exists(final_path) and not force:
            print("skip", name, "final exists", flush=True)
            continue
        uploaded = refs(reference_paths(spec["refs"]))
        for offset in range(count):
            current_seed = seed + index * 10 + offset
            result = run_workflow(
                C.workflow_krea(
                    spec["prompt"] + " " + VISUAL_RULES,
                    None,
                    None,
                    current_seed,
                    1.0,
                    uploaded,
                    steps=10,
                    lora=0.9,
                    size=spec["size"],
                )
            )
            raw_path = os.path.join(RAW, f"{name}-{current_seed}.png")
            with open(raw_path, "wb") as output:
                output.write(result)
            if offset == 0:
                image = Image.open(raw_path)
                if spec["transparent"]:
                    image = key_magenta(image, 0.25, 0.68)
                else:
                    image = image.convert("RGB")
                image.save(final_path)
            print("made", name, current_seed, flush=True)


def make_repair_masters(seed):
    os.makedirs(RAW, exist_ok=True)
    repair_refs = {
        "ticket-drone": [
            os.path.join(C.ASSETS, "enemy-wasp-v2.png"),
            os.path.join(C.ASSETS, "pack-assist-v2.png"),
        ],
        "turnstile-ram": [
            os.path.join(C.ASSETS, "enemy-crawler-v2.png"),
            os.path.join(C.ASSETS, "facility-prop-atlas-v1.png"),
        ],
        "service-clamp": [
            os.path.join(C.ASSETS, "enemy-claw-v2.png"),
            os.path.join(C.ASSETS, "facility-prop-atlas-v1.png"),
        ],
        "signal-auditor": [
            os.path.join(C.ASSETS, "pack-assist-v2.png"),
            os.path.join(C.ASSETS, "facility-prop-atlas-v1.png"),
        ],
    }
    for index, (name, prompt) in enumerate(REPAIR_ASSETS.items()):
        current_seed = seed + index * 10
        raw_path = os.path.join(RAW, f"master-{name}-{current_seed}.png")
        uploaded = refs(repair_refs[name])
        result = run_workflow(
            C.workflow_krea(
                prompt + " " + MASTER_RULES + " " + VISUAL_RULES,
                None,
                None,
                current_seed,
                1.0,
                uploaded,
                steps=10,
                lora=0.9,
                size=(1024, 1024),
            )
        )
        with open(raw_path, "wb") as output:
            output.write(result)
        keyed = key_magenta(Image.open(raw_path), 0.25, 0.68)
        keyed.save(os.path.join(RAW, f"master-{name}.png"))
        print("made repair master", name, current_seed, flush=True)


def crop_alpha(image):
    image = image.convert("RGBA")
    box = image.getchannel("A").getbbox()
    return image.crop(box) if box else image


def key_white(image):
    rgb = np.asarray(image.convert("RGB"), dtype=np.float64)
    low = np.min(rgb, axis=2)
    alpha = np.clip((250.0 - low) / 22.0, 0.0, 1.0)
    alpha = (alpha * alpha * (3.0 - 2.0 * alpha) * 255.0).astype(np.uint8)
    rgba = np.dstack([rgb.astype(np.uint8), alpha])
    rgba[alpha < 3] = 0
    return Image.fromarray(rgba, "RGBA")


def place_in_cell(sheet, image, index, cols=4, rows=2, padding=18, y_offset=0):
    cell_w, cell_h = sheet.width // cols, sheet.height // rows
    image = crop_alpha(image)
    scale = min((cell_w - 2 * padding) / image.width, (cell_h - 2 * padding) / image.height)
    image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.LANCZOS)
    x = (index % cols) * cell_w + (cell_w - image.width) // 2
    y = (index // cols) * cell_h + (cell_h - image.height) // 2 + y_offset
    sheet.alpha_composite(image, (x, y))
    return (x, y, image.width, image.height)


def glow_circle(canvas, centre, radius, colour):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((centre[0] - radius, centre[1] - radius, centre[0] + radius, centre[1] + radius), fill=colour)
    layer = layer.filter(ImageFilter.GaussianBlur(max(3, radius // 3)))
    canvas.alpha_composite(layer)


def make_pack_sheet():
    source = crop_alpha(Image.open(os.path.join(HERE, "references", "pack-character-v1.png")))
    sheet = Image.new("RGBA", (1536, 864), (0, 0, 0, 0))
    states = [
        (0, 0, 1.00), (-3, -5, 0.98), (-7, -36, 0.94), (6, -22, 0.96),
        (0, 12, 0.97), (0, 0, 1.00), (0, 0, 1.00), (-8, -45, 0.90),
    ]
    for index, (angle, y_offset, factor) in enumerate(states):
        frame = source.resize((round(source.width * factor), round(source.height * factor)), Image.LANCZOS)
        if angle:
            frame = frame.rotate(angle, Image.Resampling.BICUBIC, expand=True)
        box = place_in_cell(sheet, frame, index, y_offset=y_offset)
        cell_x = (index % 4) * 384
        cell_y = (index // 4) * 432
        if index in (5, 6):
            draw = ImageDraw.Draw(sheet)
            y = cell_y + 240
            draw.line((cell_x + 282, y, cell_x + 372, y), fill=(88, 219, 195, 230), width=6)
            draw.ellipse((cell_x + 360, y - 12, cell_x + 384, y + 12), outline=(244, 203, 83, 255), width=5)
        if index == 6:
            glow_circle(sheet, (cell_x + 192, cell_y + 200), 42, (30, 235, 220, 95))
    sheet.save(os.path.join(FINAL, "l7-pack-link-sheet-v1.png"))


def make_bix_sheet():
    pose_paths = [
        ("side-right", "1.png"), ("front", "1.png"), ("glove-reach", "1.png"), ("side-left", "1.png"),
        ("glove-up", "1.png"), ("front", "1.png"), ("run", "1.png"), ("jump", "1.png"),
    ]
    sheet = Image.new("RGBA", (1536, 864), (0, 0, 0, 0))
    for index, parts in enumerate(pose_paths):
        image = key_white(Image.open(os.path.join(HERE, "bix-poses", *parts)))
        place_in_cell(sheet, image, index, padding=10)
    sheet.save(os.path.join(FINAL, "l7-bix-relay-actions-sheet-v1.png"))


def make_effects_sheet():
    sheet = Image.new("RGBA", (1344, 768), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sheet)
    cols, rows = 4, 3
    cw, ch = sheet.width // cols, sheet.height // rows
    cyan = (88, 219, 195, 255)
    amber = (244, 203, 83, 255)
    red = (255, 82, 109, 255)
    for index in range(12):
        x, y = (index % cols) * cw, (index // cols) * ch
        cx, cy = x + cw // 2, y + ch // 2
        if index < 6:
            width = 2 + index
            draw.line((x + 35, cy, x + cw - 35, cy), fill=cyan, width=width)
            for p in range(4):
                px = x + 55 + p * 65 + index * 5
                draw.ellipse((px - 6, cy - 6, px + 6, cy + 6), fill=(150, 255, 240, 220))
        elif index == 6:
            draw.ellipse((cx - 70, cy - 70, cx + 70, cy + 70), outline=cyan, width=9)
            draw.ellipse((cx - 35, cy - 35, cx + 35, cy + 35), outline=cyan, width=5)
        elif index == 7:
            for px in range(x + 35, x + cw - 25, 35):
                draw.line((px, cy - 16, px + 14, cy), fill=cyan, width=5)
                draw.line((px + 14, cy, px, cy + 16), fill=cyan, width=5)
        elif index == 8:
            draw.arc((cx - 75, cy - 75, cx + 75, cy + 75), 210, 510, fill=amber, width=12)
            draw.polygon([(cx + 72, cy - 8), (cx + 98, cy), (cx + 72, cy + 8)], fill=amber)
        elif index == 9:
            draw.line((x + 40, cy, cx - 20, cy), fill=red, width=8)
            draw.line((cx + 20, cy, x + cw - 40, cy), fill=red, width=8)
            draw.line((cx - 18, cy - 25, cx + 18, cy + 25), fill=red, width=6)
            draw.line((cx + 18, cy - 25, cx - 18, cy + 25), fill=red, width=6)
        elif index == 10:
            draw.rounded_rectangle((cx - 80, cy - 55, cx + 80, cy + 55), radius=18, outline=amber, width=8)
            draw.line((cx - 45, cy, cx + 45, cy), fill=amber, width=8)
        else:
            points = [(x + 35 + p * 25, cy + int(np.sin(p * 0.7) * 24)) for p in range(11)]
            draw.line(points, fill=cyan, width=8)
            for px, py in points[::2]:
                draw.ellipse((px - 7, py - 7, px + 7, py + 7), fill=(220, 255, 248, 230))
    glow = sheet.filter(ImageFilter.GaussianBlur(14))
    glow.putalpha(glow.getchannel("A").point(lambda value: value // 3))
    glow.alpha_composite(sheet)
    glow.save(os.path.join(FINAL, "l7-link-effects-sheet-v1.png"))


def make_enemy_sheet(name, accent="cyan"):
    master_path = os.path.join(RAW, f"master-{name}.png")
    if not os.path.exists(master_path):
        raise SystemExit(f"Missing repair master: {master_path}")
    source = crop_alpha(Image.open(master_path))
    sheet = Image.new("RGBA", (1536, 864), (0, 0, 0, 0))
    offsets = [(0, 0), (0, -8), (8, -4), (24, 0), (45, 0), (12, 3), (-8, -4), (0, 0)]
    for index, (dx, dy) in enumerate(offsets):
        cell_x, cell_y = (index % 4) * 384, (index // 4) * 432
        under = ImageDraw.Draw(sheet)
        if name == "ticket-drone" and index in (2, 3, 4, 5):
            colour = (88, 219, 195, 60) if index < 4 else (244, 203, 83, 80) if index == 4 else (255, 82, 109, 80)
            under.polygon([(cell_x + 185, cell_y + 205), (cell_x + 65, cell_y + 390), (cell_x + 305, cell_y + 390)], fill=colour)
        if name == "turnstile-ram":
            under.line((cell_x + 25, cell_y + 350, cell_x + 360, cell_y + 350), fill=(120, 132, 132, 255), width=8)
        if name == "service-clamp":
            under.line((cell_x + 20, cell_y + 55, cell_x + 364, cell_y + 55), fill=(110, 122, 124, 255), width=12)
        if name == "signal-auditor":
            colour = (255, 82, 109, 255) if index == 6 else (88, 219, 195, 255)
            under.line((cell_x + 18, cell_y + 210, cell_x + 366, cell_y + 210), fill=colour, width=5)
        frame = source
        if index in (2, 5):
            frame = frame.rotate(-3 if index == 2 else 3, Image.Resampling.BICUBIC, expand=True)
        place_in_cell(sheet, frame, index, padding=30, y_offset=dy)
        if index in (1, 2, 4):
            colour = (244, 203, 83, 85) if index != 4 else (255, 82, 109, 80)
            glow_circle(sheet, (cell_x + 205, cell_y + 100), 28, colour)
    sheet.save(os.path.join(FINAL, f"l7-{name}-sheet-v1.png"))


def make_story_frames():
    bix = crop_alpha(Image.open(os.path.join(C.ASSETS, "landing-bix-cutout-v1.png")))
    pack = crop_alpha(Image.open(os.path.join(HERE, "references", "pack-character-v1.png")))

    def raw_story(name):
        candidates = sorted(
            filename for filename in os.listdir(RAW)
            if filename.startswith(name + "-") and filename.endswith(".png")
        )
        if not candidates:
            raise SystemExit(f"Missing raw story frame: {name}")
        return os.path.join(RAW, candidates[-1])

    archive = Image.open(raw_story("archive-memory-frame")).convert("RGBA")
    pack_a = pack.resize((round(pack.width * 245 / pack.height), 245), Image.LANCZOS)
    bix_a = bix.resize((round(bix.width * 530 / bix.height), 530), Image.LANCZOS)
    archive.alpha_composite(pack_a, (690, 390))
    archive.alpha_composite(bix_a, (650, 250))
    overlay = Image.new("RGBA", archive.size, (30, 55, 60, 20))
    od = ImageDraw.Draw(overlay)
    for y in range(0, archive.height, 8):
        od.line((0, y, archive.width, y), fill=(210, 235, 225, 18), width=1)
    od.rectangle((26, 24, 300, 65), fill=(5, 18, 22, 145), outline=(170, 200, 192, 120), width=2)
    od.rectangle((archive.width - 265, archive.height - 62, archive.width - 24, archive.height - 24), fill=(5, 18, 22, 145))
    archive = Image.alpha_composite(archive, overlay)
    archive.convert("RGB").save(os.path.join(FINAL, "l7-archive-memory-frame-v1.png"), quality=95)

    departure = Image.open(raw_story("departure-story-frame")).convert("RGBA")
    bix_d = bix.resize((round(bix.width * 560 / bix.height), 560), Image.LANCZOS)
    pack_d = pack.resize((round(pack.width * 250 / pack.height), 250), Image.LANCZOS)
    cover = Image.new("RGBA", departure.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(cover)
    cd.rounded_rectangle((875, 165, 1190, 755), radius=16, fill=(57, 90, 84, 255), outline=(32, 54, 53, 255), width=9)
    cd.rectangle((910, 215, 1160, 670), fill=(27, 42, 43, 255), outline=(115, 130, 124, 255), width=5)
    departure.alpha_composite(cover)
    departure.alpha_composite(pack_d, (905, 380))
    departure.alpha_composite(bix_d, (850, 260))
    departure.convert("RGB").save(os.path.join(FINAL, "l7-departure-story-frame-v1.png"), quality=95)


def curate_production():
    os.makedirs(FINAL, exist_ok=True)
    make_pack_sheet()
    make_bix_sheet()
    make_effects_sheet()
    for name in REPAIR_ASSETS:
        make_enemy_sheet(name)
    make_story_frames()
    make_contact_sheet()
    print("curated production pack", flush=True)


def package_backgrounds(seed):
    os.makedirs(FINAL, exist_ok=True)
    for index, name in enumerate(BACKGROUNDS):
        source = os.path.join(OUT, "bg-" + name, f"{seed + index * 10}.png")
        if not os.path.exists(source):
            raise SystemExit(f"Missing generated background: {source}")
        target = os.path.join(FINAL, f"l7-bg-{name}-v2.png")
        Image.open(source).convert("RGB").save(target, optimize=True)
    landing = os.path.join(OUT, "landing-fixed", "landing-level7-candidate-v1.png")
    if os.path.exists(landing):
        shutil.copy2(landing, os.path.join(FINAL, "l7-landing-v1.png"))


def checker(size, cell=24):
    image = Image.new("RGB", size, (30, 44, 48))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(48, 64, 68))
    return image


def make_contact_sheet():
    os.makedirs(FINAL, exist_ok=True)
    files = sorted(
        path for path in os.listdir(FINAL)
        if path.lower().endswith(".png") and path != "level7-production-contact-sheet.png"
    )
    cell_w, cell_h, label_h, columns = 500, 290, 28, 3
    rows = (len(files) + columns - 1) // columns
    sheet = Image.new("RGB", (cell_w * columns, cell_h * rows), (6, 19, 23))
    draw = ImageDraw.Draw(sheet)
    for index, filename in enumerate(files):
        x = (index % columns) * cell_w
        y = (index // columns) * cell_h
        source = Image.open(os.path.join(FINAL, filename)).convert("RGBA")
        preview = checker((cell_w, cell_h - label_h))
        scale = min(cell_w / source.width, (cell_h - label_h) / source.height)
        resized = source.resize((max(1, round(source.width * scale)), max(1, round(source.height * scale))), Image.LANCZOS)
        preview.paste(resized, ((cell_w - resized.width) // 2, (cell_h - label_h - resized.height) // 2), resized)
        sheet.paste(preview, (x, y + label_h))
        draw.rectangle((x, y, x + cell_w - 1, y + label_h - 1), fill=(12, 35, 42))
        draw.text((9, y + 8), filename, fill=(88, 219, 195))
        draw.rectangle((x, y, x + cell_w - 1, y + cell_h - 1), outline=(36, 80, 90), width=1)
    path = os.path.join(FINAL, "level7-production-contact-sheet.png")
    sheet.save(path, optimize=True)
    inventory = []
    for filename in files:
        asset = Image.open(os.path.join(FINAL, filename))
        alpha = asset.getchannel("A") if "A" in asset.getbands() else None
        inventory.append({
            "file": filename,
            "width": asset.width,
            "height": asset.height,
            "mode": asset.mode,
            "transparent": bool(alpha and alpha.getextrema()[0] < 255),
        })
    manifest = {
        "status": "complete visual-development graphics pack; game integration pending",
        "canonical_pack": "design/references/pack-character-v1.png",
        "asset_count": len(files),
        "assets": inventory,
    }
    with open(os.path.join(FINAL, "manifest.json"), "w", encoding="ascii") as output:
        json.dump(manifest, output, indent=2)
    print("made contact sheet", path, flush=True)


def fix_landing(source_seed, seed):
    source_path = os.path.join(OUT, "landing", f"{source_seed}.png")
    source = Image.open(source_path).convert("RGB")
    if source.size != (1536, 864):
        raise SystemExit(f"Unexpected landing size: {source.size}")

    mask = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((432, 170, 565, 548), radius=48, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(8))

    source_name = C.upload_bytes(f"l7_landing_{source_seed}.png", C.png(source))
    mask_name = C.upload_bytes(f"l7_landing_{source_seed}_mask.png", C.png(mask))
    prompt = (
        "Empty worn concrete railway-station column and open platform air continuing the surrounding architecture, "
        "same pale concrete, faded mint paint and early sunlight. Absolutely empty background surface: no backpack, "
        "no box, no robot, no machine, no luggage, no equipment and no new character."
    )
    background_reference = C.upload(os.path.join(C.ASSETS, "facility-background-v1.png"))
    edited = run_workflow(
        C.workflow(
            prompt,
            "backpack, box, robot, machine, luggage, equipment, character, person, text, watermark",
            source_name,
            mask_name,
            seed,
            [background_reference],
            1.0,
            weight=0.65,
        )
    )
    fixed_dir = os.path.join(OUT, "landing-fixed")
    os.makedirs(fixed_dir, exist_ok=True)
    inpaint_path = os.path.join(fixed_dir, f"{source_seed}-inpaint-{seed}.png")
    with open(inpaint_path, "wb") as output:
        output.write(edited)

    canvas = Image.open(inpaint_path).convert("RGBA")
    pack = Image.open(os.path.join(HERE, "references", "pack-character-v1.png")).convert("RGBA")
    pack = pack.crop(pack.getbbox())
    target_height = 300
    pack = pack.resize((round(pack.width * target_height / pack.height), target_height), Image.LANCZOS)

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse((250, 722, 475, 768), fill=(25, 34, 34, 68))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.alpha_composite(pack, (225, 420))

    final_path = os.path.join(fixed_dir, f"{source_seed}-canonical-pack-v1.png")
    canvas.convert("RGB").save(final_path, quality=95)
    print("made landing-fixed", final_path, flush=True)


if __name__ == "__main__":
    command = next((arg for arg in sys.argv[1:] if not arg.startswith("--")), "foundation")
    count = int(OPTIONS.get("--n", 1))
    seed = int(OPTIONS.get("--seed", 9700))
    if command in ("landing", "foundation"):
        make_landing(seed, count)
    if command in ("backgrounds", "foundation"):
        make_backgrounds(seed + 10, count)
    if command == "fix-landing":
        fix_landing(int(OPTIONS.get("--source", 9703)), seed)
    if command in ("assets", "production"):
        make_production_assets(seed + 1000, count)
    if command == "production":
        make_backgrounds(seed, count)
        package_backgrounds(seed)
        make_contact_sheet()
    if command == "package":
        package_backgrounds(seed)
        make_contact_sheet()
    if command == "repair":
        make_repair_masters(seed)
        curate_production()
    if command == "curate":
        curate_production()
    if command not in ("landing", "backgrounds", "foundation", "fix-landing", "assets", "production", "package", "repair", "curate"):
        raise SystemExit("Use landing, backgrounds, foundation, fix-landing, assets, production, package, repair, or curate")
