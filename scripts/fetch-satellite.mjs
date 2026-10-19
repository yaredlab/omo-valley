// Fetches the satellite plate for the descent: a true-colour image of exactly SAT_BBOX (src/geo.js),
// so it registers with the river drawn on the map.
//
//   npm run satellite                                    NASA GIBS, MODIS Terra true colour (250 m)
//   npm run satellite -- --time 2025-01-18 --width 3072
//   npm run satellite -- --layer <GIBS layer name>       any true-colour layer GIBS serves in EPSG:4326
//   npm run satellite -- --print-bbox                    prints the box, to cut your own plate (Sentinel-2, Landsat…)
//
// 250 m pixels are soft at the closest zoom. For a sharper plate, export a Sentinel-2 or Landsat scene of the
// printed box from a source whose licence you have checked, save it as media-src/sat-omo.jpg, and run `npm run media`.
// GIBS imagery: NASA GIBS / ESDIS, open use with acknowledgement. Credit it where the page credits its sources.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { SAT_BBOX } from '../src/geo.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const r4 = (n) => Math.round(n * 1e4) / 1e4;
const lon0 = r4(SAT_BBOX.lon0);
const lon1 = r4(SAT_BBOX.lon1);
const lat0 = r4(SAT_BBOX.lat0);
const lat1 = r4(SAT_BBOX.lat1);
const box = { west: lon0, south: lat0, east: lon1, north: lat1 };

if (args.includes('--print-bbox')) {
  console.log(
    `west ${lon0.toFixed(4)}  south ${lat0.toFixed(4)}  east ${lon1.toFixed(4)}  north ${lat1.toFixed(4)}   (EPSG:4326)\n` +
      `The picture must cover exactly this box, uncropped. Aspect (lon:lat in degrees) = ${(lon1 - lon0).toFixed(3)}:${(lat1 - lat0).toFixed(3)}`,
  );
  process.exit(0);
}

const endpoint = opt('url', 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi');
const layer = opt('layer', 'MODIS_Terra_CorrectedReflectance_TrueColor');
const time = opt('time', '2024-01-20'); // dry season: the Lower Omo is clearest in January and February
const width = Math.round(Number(opt('width', '2048')));
const height = Math.round((width * (lat1 - lat0)) / (lon1 - lon0)); // square pixels in degrees
const out = path.resolve(opt('out', 'public/media/sat-omo.jpg'));

// WMS 1.1.1 keeps longitude first, so there is no axis-order trap with EPSG:4326
const url = new URL(endpoint);
const q = {
  SERVICE: 'WMS',
  REQUEST: 'GetMap',
  VERSION: '1.1.1',
  LAYERS: layer,
  STYLES: '',
  SRS: 'EPSG:4326',
  BBOX: [box.west, box.south, box.east, box.north].join(','),
  WIDTH: String(width),
  HEIGHT: String(height),
  FORMAT: 'image/jpeg',
  TIME: time,
};
for (const [k, v] of Object.entries(q)) url.searchParams.set(k, v);

console.log(`GET ${layer} @ ${time}  ${width}×${height}  box ${box.west.toFixed(3)},${box.south.toFixed(3)} → ${box.east.toFixed(3)},${box.north.toFixed(3)}`);
let res;
try {
  res = await fetch(url, { headers: { 'user-agent': 'the-river/0.1 (satellite plate fetch)' } });
} catch (err) {
  console.error(`Could not reach ${url.host}: ${err.cause?.code || err.message}\nCheck the connection, or use --url for another WMS server.`);
  process.exit(1);
}
const type = res.headers.get('content-type') || '';
if (!res.ok || !type.startsWith('image/')) {
  console.error(`The server did not return an image (${res.status}, ${type || 'no content-type'}).\n` + (await res.text()).slice(0, 600));
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, buf);
await writeFile(
  out.replace(/\.jpg$/, '.json'),
  JSON.stringify({ source: url.host.endsWith('earthdata.nasa.gov') ? 'NASA GIBS' : url.host, endpoint, layer, time, bbox: box, width, height, fetched: new Date().toISOString() }, null, 2) + '\n',
);
console.log(`Saved ${(buf.length / 1024).toFixed(0)} KB → ${path.relative(process.cwd(), out)}`);
console.log('Open it and check for cloud before you keep it. Try another --time if it is cloudy.');
