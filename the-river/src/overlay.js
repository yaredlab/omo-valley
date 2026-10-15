// The Omo as an SVG path, re-projected every frame from the real coordinates.
// Two instances of the same line: one in map space (camera driven) and one as the page's spine.
import { OMO, MOUTH, pointAt, fmtLat, fmtLon, toWorld } from './geo.js';

const NS = 'http://www.w3.org/2000/svg';

function project(x, y, cam, W, H) {
  return [cam.ox * W + (x - cam.cx) * cam.s * cam.kx, cam.oy * H + (y - cam.cy) * cam.s];
}

// The source line is a generalised centreline, so it is drawn as a smooth curve through segment midpoints
// rather than as visible straight facets when the camera is close.
function pathD(cam, W, H) {
  const n = OMO.length;
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    px[i] = cam.ox * W + (OMO[i][0] - cam.cx) * cam.s * cam.kx;
    py[i] = cam.oy * H + (OMO[i][1] - cam.cy) * cam.s;
  }
  let d = 'M' + px[0].toFixed(1) + ',' + py[0].toFixed(1);
  for (let i = 1; i < n - 1; i++) {
    const mx = (px[i] + px[i + 1]) / 2;
    const my = (py[i] + py[i + 1]) / 2;
    d += 'Q' + px[i].toFixed(1) + ',' + py[i].toFixed(1) + ' ' + mx.toFixed(1) + ',' + my.toFixed(1);
  }
  return d + 'L' + px[n - 1].toFixed(1) + ',' + py[n - 1].toFixed(1);
}

const camKey = (c, W, H) => [c.cx, c.cy, c.s, c.kx, c.ox, c.oy, W, H].map((n) => n.toFixed(4)).join('|');

export class RiverOverlay {
  constructor() {
    this.svg = document.getElementById('river');
    const grab = (id) => {
      const g = document.getElementById(id);
      return {
        g,
        c: g.querySelector('.r-case'),
        base: g.querySelector('.r-base'),
        draw: g.querySelector('.r-draw'),
        flow: g.querySelector('.r-flow'),
        head: g.querySelector('.r-head'),
        key: '',
      };
    };
    this.map = grab('river-map');
    this.spine = grab('river-spine');

    for (const set of [this.map, this.spine]) {
      for (const el of [set.c, set.base, set.draw, set.flow]) {
        if (!el) continue;
        el.setAttribute('pathLength', '1');
      }
      for (const el of [set.c, set.base]) if (el) el.style.strokeDasharray = '1 1';
    }
    this.map.base.style.display = 'none'; // the line in map space is only ever the drawn part

    // the line that leaves the mouth and runs off the bottom of the page
    this.ext = document.createElementNS(NS, 'path');
    this.ext.setAttribute('class', 'r-draw');
    this.ext.setAttribute('pathLength', '1');
    this.ext.style.strokeDasharray = '1 1';
    this.ext.style.strokeDashoffset = '1';
    this.spine.g.append(this.ext);

    this.labels = [...document.querySelectorAll('#labels .label')].map((el) => ({
      el,
      w: toWorld(parseFloat(el.dataset.lon), parseFloat(el.dataset.lat)),
    }));
    this.readout = document.getElementById('readout');
    this.rLat = document.getElementById('readout-lat');
    this.rLon = document.getElementById('readout-lon');
    this.lastReadout = '';
  }

  update(f) {
    const { W, H } = f;
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // ---- map-space line
    const m = f.map;
    const mapShown = m.alpha > 0.002;
    this.map.g.style.display = mapShown ? '' : 'none';
    if (mapShown) {
      this.map.g.style.opacity = m.alpha;
      const key = camKey(m.cam, W, H);
      if (key !== this.map.key) {
        this.map.key = key;
        const d = pathD(m.cam, W, H);
        this.map.draw.setAttribute('d', d);
        this.map.flow.setAttribute('d', d);
      }
      this.map.draw.style.strokeDashoffset = String(1 - m.drawn);
      this.map.flow.style.opacity = m.flow * (m.drawn >= 0.999 ? 1 : 0);
      this.map.flow.style.strokeDashoffset = String(-f.time * 0.03);

      if (m.drawn > 0.002) {
        const p = pointAt(m.drawn);
        const [hx, hy] = project(p.x, p.y, m.cam, W, H);
        this.map.head.setAttribute('cx', hx.toFixed(1));
        this.map.head.setAttribute('cy', hy.toFixed(1));
        this.map.head.style.opacity = m.head;
        const text = fmtLat(p.lat) + '|' + fmtLon(p.lon);
        if (text !== this.lastReadout) {
          this.lastReadout = text;
          const [a, b] = text.split('|');
          this.rLat.textContent = a;
          this.rLon.textContent = b;
        }
      } else {
        this.map.head.style.opacity = 0;
      }
      this.readout.style.opacity = m.readout;

      // place names, only while the sheet is on screen
      for (const l of this.labels) {
        const [x, y] = project(l.w[0], l.w[1], m.cam, W, H);
        l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        l.el.style.opacity = f.labels;
      }
    } else {
      this.readout.style.opacity = 0;
      for (const l of this.labels) l.el.style.opacity = 0;
    }

    // ---- spine
    const s = f.spine;
    const spineShown = s.alpha > 0.002 && s.draw > 0.001;
    this.spine.g.style.display = spineShown ? '' : 'none';
    if (spineShown) {
      this.spine.g.style.opacity = s.alpha;
      const key = camKey(s.cam, W, H);
      if (key !== this.spine.key) {
        this.spine.key = key;
        const d = pathD(s.cam, W, H);
        for (const el of [this.spine.c, this.spine.base, this.spine.draw, this.spine.flow]) el.setAttribute('d', d);
        const [mx, my] = project(MOUTH[0], MOUTH[1], s.cam, W, H);
        this.ext.setAttribute('d', `M${mx.toFixed(1)},${my.toFixed(1)}L${mx.toFixed(1)},${(my + H * 1.6).toFixed(1)}`);
      }
      const off = String(1 - s.draw);
      this.spine.c.style.strokeDashoffset = off;
      this.spine.base.style.strokeDashoffset = off;
      this.spine.draw.style.strokeDashoffset = String(1 - s.bright);
      this.spine.flow.style.opacity = s.draw >= 0.999 ? s.flow : 0;
      this.spine.flow.style.strokeDashoffset = String(-f.time * 0.03);
      this.ext.style.strokeDashoffset = String(1 - s.ext);
      this.ext.style.opacity = s.ext > 0.001 ? 1 : 0;

      if (s.bright > 0.002 && s.bright < 0.999 && s.ext < 0.001) {
        const p = pointAt(s.bright);
        const [hx, hy] = project(p.x, p.y, s.cam, W, H);
        this.spine.head.setAttribute('cx', hx.toFixed(1));
        this.spine.head.setAttribute('cy', hy.toFixed(1));
        this.spine.head.style.opacity = 1;
      } else {
        this.spine.head.style.opacity = 0;
      }
    }
  }
}
