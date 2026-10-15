// Turns the original photographs and video into the responsive set the page expects.
//
//   npm run media                       reads ./media-src, writes ./public/media
//   npm run media -- --src ~/omo --out public/media
//   npm run media -- --no-video         pictures only (the video takes the longest)
//
// Put originals in media-src/ named after their slot, e.g. river-01.jpg, forest-01.tif, people-c.png.
// The slot names are the keys in src/media.js. Three extra names feed the descent:
//   sat-omo.(jpg|png|tif)      the satellite plate, exactly the box printed by `npm run satellite -- --print-bbox`
//   aerial-omo.(jpg|png|tif)   the aerial photograph the satellite dissolves into
//   aerial-omo.(mp4|mov|webm)  the aerial video the photograph dissolves into (no audio is kept)
//
// Slots get AVIF + WebP + JPEG at every width in IMAGE_WIDTHS. Sources are never enlarged.
import { readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import sharp from 'sharp';
import { SLOTS, IMAGE_WIDTHS } from '../src/media.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const SRC = path.resolve(opt('src', 'media-src'));
const OUT = path.resolve(opt('out', 'public/media'));
const SKIP_VIDEO = args.includes('--no-video');
const IMG = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp', '.avif'];
const VID = ['.mp4', '.mov', '.mkv', '.webm', '.m4v'];

const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';
const found = new Map();
let totalBytes = 0;

async function listSources() {
  if (!existsSync(SRC)) {
    console.error(`No source folder at ${SRC}\nCreate it and put the originals inside (see the header of this file).`);
    process.exit(1);
  }
  for (const f of await readdir(SRC)) {
    const ext = path.extname(f).toLowerCase();
    const name = path.basename(f, path.extname(f));
    // keyed by kind as well: aerial-omo is both a photograph and a video
    if (IMG.includes(ext)) found.set(name + ':image', { file: path.join(SRC, f) });
    else if (VID.includes(ext)) found.set(name + ':video', { file: path.join(SRC, f) });
  }
}

async function write(pipeline, file) {
  await pipeline.toFile(file);
  const size = (await stat(file)).size;
  totalBytes += size;
  console.log('  ' + kb(size) + '  ' + path.relative(process.cwd(), file));
}

/** AVIF, WebP and JPEG at each responsive width. Names match src/slots.js. */
async function slot(name, file) {
  const meta = await sharp(file).metadata();
  console.log(`${name}  (${meta.width}×${meta.height})`);
  for (const w of IMAGE_WIDTHS) {
    const base = () => sharp(file).rotate().resize({ width: w, withoutEnlargement: true });
    await write(base().avif({ quality: 64, effort: 4 }), path.join(OUT, `${name}-${w}.avif`));
    await write(base().webp({ quality: 80 }), path.join(OUT, `${name}-${w}.webp`));
    await write(base().jpeg({ quality: 80, mozjpeg: true, progressive: true }), path.join(OUT, `${name}-${w}.jpg`));
  }
}

/** The stage images are loaded as plain JPEG, whole frame, never cropped. */
async function stageImage(name, file) {
  const meta = await sharp(file).metadata();
  console.log(`${name}  (${meta.width}×${meta.height}) · stage layer`);
  for (const w of [1920, 2560]) {
    await write(
      sharp(file).rotate().resize({ width: w, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true, progressive: true }),
      path.join(OUT, `${name}-${w}.jpg`),
    );
  }
}

function ffmpeg(argv) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('error', () => reject(new Error('ffmpeg is not installed or not on PATH')));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg exited with ' + code))));
  });
}

async function video(file) {
  console.log('aerial-omo  video');
  const scale = "scale='min(1920,iw)':-2";
  const mp4 = path.join(OUT, 'aerial-omo.mp4');
  const webm = path.join(OUT, 'aerial-omo.webm');
  const poster = path.join(OUT, 'aerial-omo-poster.jpg');
  // silent, no audio track to download; the page plays it muted and looped
  await ffmpeg(['-i', file, '-an', '-vf', scale, '-c:v', 'libvpx-vp9', '-crf', '37', '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p', webm]);
  await ffmpeg(['-i', file, '-an', '-vf', scale, '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  await ffmpeg(['-i', file, '-vf', scale, '-frames:v', '1', '-q:v', '3', poster]);
  for (const f of [webm, mp4, poster]) {
    const size = (await stat(f)).size;
    totalBytes += size;
    console.log('  ' + kb(size) + '  ' + path.relative(process.cwd(), f));
  }
}

await listSources();
await mkdir(OUT, { recursive: true });

const missing = [];
for (const name of Object.keys(SLOTS)) {
  const s = found.get(name + ':image');
  if (s) await slot(name, s.file);
  else missing.push(name);
}
for (const name of ['sat-omo', 'aerial-omo']) {
  const s = found.get(name + ':image');
  if (s) await stageImage(name, s.file);
  else missing.push(name + ' (image)');
}
const v = found.get('aerial-omo:video');
if (v && !SKIP_VIDEO) await video(v.file);
else if (!v) missing.push('aerial-omo (video)');

console.log(`\nWrote ${(totalBytes / 1048576).toFixed(1)} MB to ${path.relative(process.cwd(), OUT)}`);
if (missing.length) console.log(`Not supplied yet (${missing.length}):\n  ` + missing.join('\n  '));
