// Distance-to-river field in world units. The shader opens each image along this field,
// so a photograph literally emerges from the river's corridor.
import { FRAME, OMO } from './geo.js';

const INF = 1e9;

function edt1d(f, n, d, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s;
    for (;;) {
      const p = v[k];
      s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
      if (s <= z[k]) k--;
      else break;
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const dq = q - v[k];
    d[q] = dq * dq + f[v[k]];
  }
}

export function buildDistanceField(width = 1024) {
  const sc = width / FRAME.w;
  const w = width;
  const h = Math.round(FRAME.h * sc);

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.strokeStyle = '#fff';
  g.lineWidth = 1.6;
  g.lineJoin = 'round';
  g.beginPath();
  OMO.forEach(([x, y], i) => (i ? g.lineTo(x * sc, y * sc) : g.moveTo(x * sc, y * sc)));
  g.stroke();
  const px = g.getImageData(0, 0, w, h).data;

  const grid = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) grid[i] = px[i * 4 + 3] > 60 ? 0 : INF;

  const m = Math.max(w, h);
  const f = new Float64Array(m);
  const d = new Float64Array(m);
  const v = new Int32Array(m);
  const z = new Float64Array(m + 1);

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) grid[y * w + x] = d[x];
  }

  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = Math.sqrt(grid[i]) / sc; // world units
  return { data: out, width: w, height: h };
}
