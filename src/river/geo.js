// Geography helpers. All coordinates come from src/data/geo.js (Natural Earth, public domain).
import G from './data/geo.js';

export const FRAME = G.frame; // world frame: 1 degree = 1000 units, y grows southward
export const DATA = G;

export const toWorld = (lon, lat) => [(lon - FRAME.lon0) * FRAME.k * FRAME.cos, (FRAME.lat1 - lat) * FRAME.k];

// The Omo, as drawn: [x, y] in world units, plus matching [lon, lat]
export const OMO = G.omoPoints;
export const OMO_LL = G.omoLonLat;

const cum = [0];
for (let i = 1; i < OMO.length; i++) {
  cum.push(cum[i - 1] + Math.hypot(OMO[i][0] - OMO[i - 1][0], OMO[i][1] - OMO[i - 1][1]));
}
export const OMO_LEN = cum[cum.length - 1];

const xs = OMO.map((p) => p[0]);
const ys = OMO.map((p) => p[1]);
export const OMO_BBOX = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
OMO_BBOX.cx = (OMO_BBOX.x0 + OMO_BBOX.x1) / 2;
OMO_BBOX.cy = (OMO_BBOX.y0 + OMO_BBOX.y1) / 2;
OMO_BBOX.w = OMO_BBOX.x1 - OMO_BBOX.x0;
OMO_BBOX.h = OMO_BBOX.y1 - OMO_BBOX.y0;

export const MOUTH = OMO[OMO.length - 1];

/** Point a given fraction (0..1) along the drawn river, by length. */
export function pointAt(frac) {
  const f = Math.min(1, Math.max(0, frac));
  const target = f * OMO_LEN;
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= target) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const t = (target - cum[lo]) / seg;
  const x = OMO[lo][0] + (OMO[hi][0] - OMO[lo][0]) * t;
  const y = OMO[lo][1] + (OMO[hi][1] - OMO[lo][1]) * t;
  const lon = OMO_LL[lo][0] + (OMO_LL[hi][0] - OMO_LL[lo][0]) * t;
  const lat = OMO_LL[lo][1] + (OMO_LL[hi][1] - OMO_LL[lo][1]) * t;
  return { x, y, lon, lat };
}

// Where the descent lands: the bend of the Lower Omo near 5.5 N, 36.1 E.
export const TARGET_LL = [36.12, 5.42];
export const TARGET = toWorld(...TARGET_LL);
// Width of the world window the camera ends on (units; 1000 units = 1 degree of latitude)
export const TARGET_VIEW_W = 780;

// Satellite plate: the exact lon/lat box the satellite image must cover (EPSG:4326).
// scripts/fetch-satellite.mjs reads this same box so the picture registers with the river.
export const SAT_BBOX = { lon0: TARGET_LL[0] - 0.62, lon1: TARGET_LL[0] + 0.62, lat0: TARGET_LL[1] - 0.8, lat1: TARGET_LL[1] + 0.8 };
export const SAT_RECT = (() => {
  const [x0, y0] = toWorld(SAT_BBOX.lon0, SAT_BBOX.lat1);
  const [x1, y1] = toWorld(SAT_BBOX.lon1, SAT_BBOX.lat0);
  return [x0, y0, x1, y1];
})();

export const fmtLat = (lat) => `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
export const fmtLon = (lon) => `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
