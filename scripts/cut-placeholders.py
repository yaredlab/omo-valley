# Run from anywhere: python3 scripts/cut-placeholders.py
# Cuts the six supplied photographs into the shape of each slot. Crops are (x, y, w, h) in source pixels.
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
O = str(ROOT / "media-src" / "originals") + "/"
OUT = str(ROOT / "media-src") + "/"
SRC = {
  "A": "Filming-and-photography-in-Ethiopia-omo-valley.webp",          # aerial meanders, 2048x1364
  "B": "Filming-and-photography-in-Ethiopia-omo-river-crossing.webp",  # canoe + woodland, 2048x1000
  "C": "Filming-and-photography-in-Ethiopia-great-rift-valley-3-980x479.webp",  # lake shore, 980x479
  "D": "Kenya-Simon-Morris-44.jpg",                                    # man + savannah, 2000x1024
  "E": "Omo_River_Valley_IMG_9888.jpg",                                # hazy hills, 500x333
  "F": "cropEthiopia_9594.jpg",                                        # goats on bank, 2000x1024
}
img = {k: Image.open(O + v).convert("RGB") for k, v in SRC.items()}
CUTS = {
  # landscape chapters
  "river-01":      ("B", None),
  "floodplain-01": ("C", None),
  "grassland-01":  ("D", (280, 0, 768, 1024)),
  "grassland-02":  ("F", (300, 0, 1638, 1024)),
  "forest-01":     ("A", (0, 560, 2048, 760)),
  "valley-01":     ("A", (0, 300, 2048, 878)),
  # the river journey, in travelling order
  "journey-aerial":      ("A", None),
  "journey-water":       ("B", (300, 380, 1400, 620)),
  "journey-riverbank":   ("F", None),
  "journey-vegetation":  ("B", (900, 100, 1148, 600)),
  "journey-landscape":   ("D", (0, 100, 1250, 800)),
  "journey-communities": ("A", (240, 576, 1400, 788)),
  "journey-valley":      ("C", None),
  # river -> land -> life -> people
  "people-ground": ("B", None),
  "people-a":      ("E", (200, 0, 266, 333)),
  "people-b":      ("F", (700, 0, 1024, 1024)),
  "people-c":      ("D", (1181, 0, 819, 1024)),
  # the stage photograph the satellite dissolves into
  "aerial-omo":    ("A", None),
}
for name, (k, box) in CUTS.items():
    im = img[k]
    if box: x, y, w, h = box; im = im.crop((x, y, x + w, y + h))
    im.save(OUT + name + ".jpg", quality=95, subsampling=0)
    print(f"{name:22s} {k}  {im.size[0]}x{im.size[1]}")
