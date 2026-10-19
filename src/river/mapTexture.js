// Draws the cartographic base (graticule, borders, lakes, tributaries) once, to a canvas used as a GL texture.
// The Omo itself is NOT in this texture: it is the animated SVG path, drawn on top.
import { DATA, FRAME, toWorld } from './geo.js';

export function drawMapTexture(width = 2048) {
  const s = width / FRAME.w;
  const h = Math.round(FRAME.h * s);
  const c = document.createElement('canvas');
  c.width = width;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#050504';
  g.fillRect(0, 0, width, h);
  g.scale(s, s);
  const px = 1 / s; // one texture pixel in world units
  g.lineJoin = 'round';

  // graticule, every degree
  g.strokeStyle = 'rgba(232,225,210,0.13)';
  g.lineWidth = px * 2.2;
  g.beginPath();
  for (let lon = Math.ceil(FRAME.lon0); lon <= FRAME.lon1; lon++) {
    const [x] = toWorld(lon, FRAME.lat1);
    g.moveTo(x, 0);
    g.lineTo(x, FRAME.h);
  }
  for (let lat = Math.ceil(FRAME.lat0); lat <= FRAME.lat1; lat++) {
    const [, y] = toWorld(FRAME.lon0, lat);
    g.moveTo(0, y);
    g.lineTo(FRAME.w, y);
  }
  g.stroke();

  // tributaries and neighbouring rivers
  g.strokeStyle = 'rgba(205,180,138,0.26)';
  g.lineWidth = px * 2.4;
  for (const d of DATA.rivers) g.stroke(new Path2D(d));

  // lakes
  for (const lake of DATA.lakes) {
    if (lake.name === 'Koka Reservoir') continue; // a dam reservoir, not part of this story
    const p = new Path2D(lake.d);
    const turkana = lake.name === 'Lake Turkana';
    g.fillStyle = turkana ? 'rgba(205,180,138,0.15)' : 'rgba(205,180,138,0.08)';
    g.fill(p);
    g.strokeStyle = turkana ? 'rgba(205,180,138,0.6)' : 'rgba(205,180,138,0.32)';
    g.lineWidth = px * (turkana ? 2.8 : 2.2);
    g.stroke(p);
  }

  // international borders
  g.strokeStyle = 'rgba(232,225,210,0.44)';
  g.lineWidth = px * 2.6;
  g.setLineDash([px * 14, px * 9]);
  for (const d of DATA.borders) g.stroke(new Path2D(d));
  g.setLineDash([]);

  return c;
}
