// The whole page is a pure function of scroll. Nothing here touches the DOM.
// THE RIVER IS THE TIMELINE: every number below is keyed to how far along the river the reader has travelled.
import { OMO_BBOX, TARGET, TARGET_VIEW_W } from './geo.js';

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (p, a, b) => clamp((p - a) / (b - a));
const io3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const io5 = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
const o3 = (t) => 1 - Math.pow(1 - t, 3);
const sine = (t) => 0.5 - Math.cos(Math.PI * t) / 2;
export const ease = { io3, io5, o3, sine };

export function layout(W, H) {
  const portrait = W < H;
  const spineX = clamp(W * 0.04, 26, 60);

  // 1 · the river alone, right of centre
  const s0 = ((portrait ? 0.68 : 0.76) * H) / OMO_BBOX.h;
  const cam0 = { cx: OMO_BBOX.cx, cy: OMO_BBOX.cy, s: s0, kx: 1, ox: portrait ? 0.6 : 0.64, oy: 0.5 };

  // 2 · pulled back so Lake Turkana, the borders and the highlands come into frame
  const s1 = H * 0.000112;
  const cam1 = { cx: 3150, cy: 4000, s: s1, kx: 1, ox: 0.5, oy: 0.5 };

  // 3 · down onto the bend of the Lower Omo
  const s2 = Math.max(W / TARGET_VIEW_W, H / 1450);
  const cam2 = { cx: TARGET[0], cy: TARGET[1], s: s2, kx: 1, ox: 0.5, oy: 0.5 };

  // the spine: the same river, compressed sideways into a vertical line at the page edge
  const spine = { cx: OMO_BBOX.cx, cy: OMO_BBOX.cy, s: (0.8 * H) / OMO_BBOX.h, kx: 0.2, ox: spineX / W, oy: 0.5 };
  // the river at the centre of the final view, true shape
  // on a tall screen it is smaller and sits low, which leaves the upper part of the screen for the line of text
  const center = { cx: OMO_BBOX.cx, cy: OMO_BBOX.cy, s: ((portrait ? 0.6 : 0.7) * H) / OMO_BBOX.h, kx: 1, ox: 0.5, oy: portrait ? 0.62 : 0.5 };

  const maxR = Math.hypot(W, H) * 1.12;
  return { W, H, cam0, cam1, cam2, spine, center, maxR, spineX };
}

function mixCam(a, b, t) {
  return {
    cx: lerp(a.cx, b.cx, t),
    cy: lerp(a.cy, b.cy, t),
    s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)),
    kx: lerp(a.kx, b.kx, t),
    ox: lerp(a.ox, b.ox, t),
    oy: lerp(a.oy, b.oy, t),
  };
}

// Zoom about the point that is converging on screen, so the descent reads as one approach rather than a pan + a zoom.
function zoomCam(a, b, t) {
  const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), t));
  const k = (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s);
  return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s, kx: 1, ox: lerp(a.ox, b.ox, t), oy: lerp(a.oy, b.oy, t) };
}

const band = (p, a, b, c, d) => seg(p, a, b) * (1 - seg(p, c, d));

/** Everything the descent needs, for scroll progress p in [0,1] through #descent. */
export function descent(p, L, intro, reduced, hasSat = true) {
  // the line draws from the highlands to the lake; the first stretch draws by itself on load
  const drawn = Math.max(intro, seg(p, 0.012, 0.34));

  const envA = o3(seg(p, 0.3, 0.46));
  const pull = io3(seg(p, 0.3, 0.48));
  let cam;
  if (p <= 0.5) cam = mixCam(L.cam0, L.cam1, pull);
  else if (reduced) cam = mixCam(L.cam1, L.cam2, io3(seg(p, 0.56, 0.86)));
  else cam = zoomCam(L.cam1, L.cam2, io5(seg(p, 0.56, 0.86)));

  const satT = sine(seg(p, 0.64, 0.8));
  const photoT = sine(seg(p, 0.82, 0.92));
  const videoA = sine(seg(p, 0.92, 0.99));

  return {
    drawn,
    cam,
    stage: {
      cam,
      mapA: envA * (1 - seg(p, 0.79, 0.85)),
      satR: L.maxR * Math.pow(satT, 1.5),
      photoR: L.maxR * 1.05 * Math.pow(photoT, 1.4),
      videoA,
      photoZoom: 1 + 0.05 * seg(p, 0.8, 1),
      videoZoom: 1.04 - 0.04 * seg(p, 0.92, 1),
      scrim: 0,
      fade: 1,
    },
    labels: band(p, 0.38, 0.47, 0.52, 0.6),
    // the vector line gives way to the real river in the picture (the satellite, or the photograph if there is no satellite)
    riverAlpha: hasSat ? 1 - seg(p, 0.64, 0.78) : 1 - seg(p, 0.8, 0.9),
    flow: seg(p, 0.4, 0.5) * (1 - seg(p, 0.62, 0.72)) * 0.5,
    head: 1 - seg(p, 0.34, 0.4),
    readout: seg(p, 0.015, 0.04) * (1 - seg(p, 0.34, 0.42)),
    title: 1 - seg(p, 0.07, 0.2),
    cue: 1 - seg(p, 0.004, 0.02),
  };
}

export const BEATS = [
  [0.05, 0.13, 0.3, 0.38],
  [0.37, 0.45, 0.6, 0.68],
  [0.67, 0.75, 0.9, 0.97],
];

/** Arrival: the aerial view, the spine appears, three short beats of text. */
export function arrival(a) {
  return {
    spineDraw: ease.sine(seg(a, 0.0, 0.3)),
    spineAlpha: 1,
    beats: BEATS.map(([i0, i1, o0, o1]) => band(a, i0, i1, o0, o1)),
    scrim: seg(a, 0.0, 0.12) * (1 - seg(a, 0.9, 1)),
  };
}

/** Finale: back in the air. The river moves from the page edge to the centre, then carries on down the page. */
export function finale(q, L, carryExtra = 0) {
  const morph = ease.io3(seg(q, 0.0, 0.16));
  const carry = ease.io3(seg(q, 0.62, 0.9));
  const cam = mixCam(L.spine, L.center, morph);
  cam.oy = lerp(cam.oy, 0.2, carry) - carryExtra;

  const textIn1 = seg(q, 0.15, 0.27);
  const textIn2 = seg(q, 0.27, 0.37);
  const textOut = seg(q, 0.5, 0.58);
  return {
    cam,
    extension: carry,
    big: textIn1 * (1 - textOut),
    bigSpacing: lerp(0.24, 0.14, textIn1),
    small: textIn2 * (1 - textOut),
    flow: lerp(0.45, 0.85, seg(q, 0.55, 0.75)),
    next: seg(q, 0.8, 0.92),
    stage: {
      scrim: seg(q, 0.0, 0.1) * (1 - seg(q, 0.46, 0.56)),
      fade: 1 - seg(q, 0.66, 0.94),
      videoZoom: 1 + 0.035 * seg(q, 0, 0.7),
    },
  };
}

/** Journey: seven plates, each one dissolving in over the last and settling forward like a slow dolly. */
export function journey(j, count = 7) {
  const f = clamp(j) * (count - 1);
  const plates = [];
  const words = [];
  for (let i = 0; i < count; i++) {
    const fadeIn = i === 0 ? 1 : seg(f, i - 0.55, i - 0.1);
    const settle = clamp((f - i + 0.55) / 1.65);
    plates.push({ opacity: fadeIn, scale: 1 + 0.055 * settle, x: -1.4 * settle });
    const d = Math.abs(f - i);
    words.push({ opacity: 1 - seg(d, 0.18, 0.44), y: (f - i) * -10 });
  }
  return { f, plates, words };
}

/** People: river → land → life → people, inside one landscape. */
export function people(q) {
  const step = clamp(q) * 3.999;
  return {
    word: Math.floor(step),
    ground: { scale: 1.07 - 0.07 * ease.sine(seg(q, 0, 1)), y: -2 * q },
    insetA: ease.io3(seg(q, 0.28, 0.42)),
    insetB: ease.io3(seg(q, 0.5, 0.64)),
    insetC: ease.io3(seg(q, 0.74, 0.9)),
  };
}
