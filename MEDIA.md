# Media for The River

The page runs without any media (empty slots show a labelled plate). Everything below is what turns it into the finished piece.
Nothing here is generated or imitated: every picture must be a real photograph or real satellite data with a licence you hold.

## Where things stand

Six supplied photographs fill every picture slot (see `media-src/CREDITS.md` for which goes where, and for the rights that still need confirming).
Two layers are still stand-ins:

- the **video** is a 16-second looping push on the aerial photograph, not footage. Replace it with `media-src/aerial-omo.mp4`.
- the **satellite plate** is missing, so the descent goes straight from the map to the photograph. Run `npm run satellite` on a machine that can reach NASA GIBS.

The cropped placeholder files in `media-src/` are not shipped; `python3 scripts/cut-placeholders.py` recreates them from `media-src/originals/`, and `python3 scripts/make-placeholder-loop.py` recreates the video loop (both need Pillow; the loop needs `ffmpeg`).
`npm run media -- --no-video` re-encodes the pictures without redoing the video, which is the slow part.

## The one-minute path

```
npm run satellite                 # fetches the satellite plate for the exact map box (needs internet access to NASA GIBS)
mkdir media-src                   # put your originals here, named as in the table below
npm run media                     # writes AVIF / WebP / JPEG sets, the video and poster into public/media
npm run dev
```

`npm run media` lists what is still missing when it finishes.

## The descent: map → satellite → photograph → video

| File in `media-src/` | What it must be |
|---|---|
| `sat-omo.jpg` | True-colour satellite of **exactly** the box from `npm run satellite -- --print-bbox` (35.50–36.74 °E, 4.62–6.22 °N, EPSG:4326), uncropped. If it is off by even a few kilometres the river on the map will not sit on the river in the picture. `npm run satellite` makes one from NASA GIBS (MODIS, 250 m, soft up close). For a sharper plate, export Sentinel-2 or Landsat for the same box and save it here. Choose a cloud-free dry-season scene. |
| `aerial-omo.jpg` | A real aerial photograph of the Omo, landscape, at least 2560 px wide. The satellite dissolves into this. |
| `aerial-omo.mp4` (or `.mov`) | A real aerial video of the river, 10–30 s, seamless loop if possible. Audio is removed. Output is VP9 WebM + H.264 MP4 at up to 1920 px. Keep the source under about 1 GB. |

The photograph and the video are shown full-bleed behind the arrival text and again in the finale, so the river should run roughly top to bottom through the frame.

## The landscape chapters and the journey

Name the original after its slot. Any of jpg, png, tif, webp. At least 2560 px on the long side is ideal; sources are never enlarged.

| Slot | Picture |
|---|---|
| `river-01` | The Omo from the air, wide, 16:9 or wider |
| `floodplain-01` | Floodplain beside the river, 16:9 |
| `grassland-01` | Savannah, vertical 3:4 |
| `grassland-02` | Open savannah or grazing land, 16:10 |
| `forest-01` | Riverine woodland along the banks, full-bleed |
| `valley-01` | The valley, panoramic 21:9 or wider |
| `journey-aerial` `journey-water` `journey-riverbank` `journey-vegetation` `journey-landscape` `journey-communities` `journey-valley` | Seven full-bleed frames in travelling order, aerial → water → bank → vegetation → landscape → a community seen from a distance → valley. Each one dissolves into the next, so keep the horizon and the light consistent. |
| `people-ground` | A wide landscape. The three pictures below appear inside it. |
| `people-a` `people-b` `people-c` | Land and its use (4:5), daily life (1:1), people in their place (4:5) |

Edit `alt` for each slot in `src/media.js` once the real picture is in, so it describes what is actually in the photograph.

## Licensing

- Photographs of people need the consent of the people shown, and a licence or a signed release for this use. Credit the photographer.
- NASA GIBS imagery is free to use with acknowledgement ("Imagery provided by NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)").
- Sentinel-2 (Copernicus) and Landsat (USGS) are open, with attribution. Check the licence of any third-party tiled service before use; some are non-commercial only.
- Map data: Natural Earth (public domain). Regenerate it with `npm run geo`, which documents its inputs in `scripts/build-geo.py`.

## What is already real

The river line, lakes and borders come from Natural Earth. The drawn Omo is the Natural Earth centreline: it starts at 9.15 °N, 37.03 °E and ends at Lake Turkana near 4.54 °N, 36.04 °E. The coordinate readout while it draws is computed from that same line.
The copy was checked against UNESCO (inscription 1980), Wikipedia's Omo River and Omo National Park pages, and Mongabay (at least 200,000 people in the Lower Omo). The drop of about 1,900 m is the difference between the source (about 2,281 m) and Lake Turkana (about 360 m).
