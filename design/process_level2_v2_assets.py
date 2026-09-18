"""Build the shippable Level 2 v2 art plates from the painted masters.

The generated masters stay untouched in design/level2-art-masters-v2. This
script normalizes sprite margins, downsizes plates to their delivery sizes,
and writes cache-safe v2 files into dist/assets.
"""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
MASTERS = ROOT / "design" / "level2-art-masters-v2"
ASSETS = ROOT / "dist" / "assets"

SHEETS = {
    "pack-assist-v2": (4, 2, (768, 512)),
    "supervisor-head-v2": (4, 2, (768, 512)),
    "enemy-crawler-v2": (4, 2, (768, 512)),
    "enemy-spitter-v2": (4, 2, (768, 512)),
    "enemy-claw-v2": (4, 2, (768, 512)),
    "enemy-wasp-v2": (4, 2, (768, 512)),
    "coolant-mist-v2": (4, 2, (768, 512)),
    "furnace-platform-atlas-v2": (3, 2, (768, 512)),
    "furnace-prop-atlas-v2": (4, 2, (768, 512)),
}


def clean_alpha(image: Image.Image, cutoff: int = 5) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 0 if value < cutoff else value)
    image.putalpha(alpha)
    return image


def process_sheet(name: str, cols: int, rows: int, size: tuple[int, int]) -> None:
    source = clean_alpha(Image.open(MASTERS / f"{name}-master.png"))
    if source.width % cols or source.height % rows:
        raise ValueError(f"{name}: source size {source.size} does not divide into {cols}x{rows}")

    out = Image.new("RGBA", size)
    source_cell = (source.width // cols, source.height // rows)
    target_cell = (size[0] // cols, size[1] // rows)
    inset = (round(target_cell[0] * 0.05), round(target_cell[1] * 0.05))
    fitted = (target_cell[0] - inset[0] * 2, target_cell[1] - inset[1] * 2)

    for index in range(cols * rows):
        # The supervisor plate intentionally reserves its last cell.
        if name == "supervisor-head-v2" and index == 7:
            continue
        sx = index % cols * source_cell[0]
        sy = index // cols * source_cell[1]
        cell = source.crop((sx, sy, sx + source_cell[0], sy + source_cell[1]))
        cell = cell.resize(fitted, Image.Resampling.LANCZOS)
        dx = index % cols * target_cell[0] + inset[0]
        dy = index // cols * target_cell[1] + inset[1]
        out.alpha_composite(cell, (dx, dy))

    out.save(ASSETS / f"{name}.png", optimize=True)


def process_single(name: str, size: tuple[int, int]) -> None:
    source = clean_alpha(Image.open(MASTERS / f"{name}-master.png"))
    source.thumbnail((round(size[0] * 0.9), round(size[1] * 0.9)), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", size)
    out.alpha_composite(source, ((size[0] - source.width) // 2, (size[1] - source.height) // 2))
    out.save(ASSETS / f"{name}.png", optimize=True)


def process_strip(name: str) -> None:
    source = clean_alpha(Image.open(MASTERS / f"{name}-master.png"))
    alpha = source.getchannel("A").point(lambda value: 255 if value >= 8 else 0)
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError(f"{name}: no visible pixels")
    padding = 12
    y0 = max(0, bounds[1] - padding)
    y1 = min(source.height, bounds[3] + padding)
    strip = source.crop((0, y0, source.width, y1))
    strip = strip.resize((1536, 256), Image.Resampling.LANCZOS)
    strip.save(ASSETS / f"{name}.png", optimize=True)


def process_background() -> None:
    source = Image.open(MASTERS / "furnace-background-v2-master.png").convert("RGB")
    source.resize((2172, 724), Image.Resampling.LANCZOS).save(
        ASSETS / "furnace-background-v2.png", optimize=True
    )


def verify() -> None:
    expected = {name: (cols, rows, size) for name, (cols, rows, size) in SHEETS.items()}
    expected.update(
        {
            "casting-mold-v2": (1, 1, (512, 512)),
            "conveyor-belt-v2": (4, 1, (1536, 256)),
            "lava-channel-v2": (4, 1, (1536, 256)),
            "furnace-background-v2": (1, 1, (2172, 724)),
        }
    )

    for name, (cols, rows, size) in expected.items():
        path = ASSETS / f"{name}.png"
        with Image.open(path) as image:
            if image.size != size:
                raise ValueError(f"{name}: expected {size}, got {image.size}")
            if image.width % cols or image.height % rows:
                raise ValueError(f"{name}: output does not divide into {cols}x{rows}")
            if name != "furnace-background-v2" and image.mode != "RGBA":
                raise ValueError(f"{name}: expected RGBA, got {image.mode}")
            print(f"{path.name:34} {image.width:4}x{image.height:<4} {image.mode}")


def build_contact_sheet() -> None:
    names = [*SHEETS, "casting-mold-v2", "conveyor-belt-v2", "lava-channel-v2", "furnace-background-v2"]
    cell_w, cell_h = 380, 250
    sheet = Image.new("RGB", (cell_w * 3, cell_h * 5), "#071217")
    draw = ImageDraw.Draw(sheet)
    for index, name in enumerate(names):
        with Image.open(ASSETS / f"{name}.png") as source:
            preview = source.convert("RGBA")
            preview.thumbnail((cell_w - 28, cell_h - 48), Image.Resampling.LANCZOS)
            x = index % 3 * cell_w + (cell_w - preview.width) // 2
            y = index // 3 * cell_h + 28 + (cell_h - 38 - preview.height) // 2
            sheet.paste(preview, (x, y), preview)
        draw.text((index % 3 * cell_w + 12, index // 3 * cell_h + 9), name, fill="#edf0dc")
    sheet.save(ROOT / "design" / "level2-v2-contact-sheet.png", optimize=True)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    for name, (cols, rows, size) in SHEETS.items():
        process_sheet(name, cols, rows, size)
    process_single("casting-mold-v2", (512, 512))
    process_strip("conveyor-belt-v2")
    process_strip("lava-channel-v2")
    process_background()
    verify()
    build_contact_sheet()


if __name__ == "__main__":
    main()
