# Picture ledger

Six photographs were supplied for this build (in `originals/`). **Their photographers and licences are not confirmed.**
Do not publish the page until each one is cleared, credited, or replaced. The filenames are the only provenance available:

| Original | Size | Used in | Notes |
|---|---|---|---|
| `Filming-and-photography-in-Ethiopia-omo-valley.webp` | 2048×1364 | forest-01, valley-01, journey-aerial, journey-communities, aerial-omo (stage photograph), and the placeholder video | Aerial of the river and a village at sunset. Carries most of the page. |
| `Filming-and-photography-in-Ethiopia-omo-river-crossing.webp` | 2048×1000 | river-01, journey-water, journey-vegetation, people-ground | Two men in a dugout canoe. |
| `cropEthiopia_9594.jpg` | 2000×1024 | grassland-02, journey-riverbank, people-b | A herd on a riverbank. |
| `Kenya-Simon-Morris-44.jpg` | 2000×1024 | grassland-01, journey-landscape, people-c | **Filename says Kenya.** It is not a picture of the Omo. Replace it before publishing, or caption it truthfully. It is the only close portrait, so it stands in for "people". |
| `Filming-and-photography-in-Ethiopia-great-rift-valley-3-980x479.webp` | 980×479 | floodplain-01, journey-valley | Small, so it is soft at full width. |
| `Omo_River_Valley_IMG_9888.jpg` | 500×333 | people-a | Very small. Kept to a small inset on purpose. |

Several photographs are reused in different crops because only six were supplied. Each reuse is far from its twin on the page.
The people shown need to have agreed to appear, and the right to use these photographs needs to be confirmed in writing.

## Placeholders still in place

- **Video layer** (`aerial-omo.mp4`): a 16-second looping push on the aerial photograph, made by `ffmpeg`. It is not footage. Put real aerial footage at `media-src/aerial-omo.mp4` and run `npm run media`.
- **Satellite plate** (`sat-omo`): not supplied. Run `npm run satellite` on a machine that can reach NASA GIBS, or cut Sentinel-2 / Landsat to the box printed by `npm run satellite -- --print-bbox`. Until then the descent shows a flat plate between the map and the photograph.

## Other data

`download.xlsx` is UNESCO's World Heritage List. Its row for *Lower Valley of the Omo* (id 17) agrees with the page: inscribed 1980, criteria (iii)(iv), site point 4.80 °N, 35.97 °E.
