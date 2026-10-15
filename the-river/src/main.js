import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { initSlots, loadSlot } from './slots.js';
import { Stage } from './stage.js';
import { RiverOverlay } from './overlay.js';
import { layout, descent, arrival, finale, journey, people, clamp, seg, ease, BEATS } from './choreography.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ------------------------------------------------------------------ cheap DOM writes */
const cache = new WeakMap();
function put(el, prop, value) {
  if (!el) return;
  let c = cache.get(el);
  if (!c) cache.set(el, (c = {}));
  if (c[prop] === value) return;
  c[prop] = value;
  if (prop === 'class-live') el.classList.toggle('is-live', value);
  else if (prop.startsWith('--')) el.style.setProperty(prop, value);
  else el.style[prop] = value;
}
const r3 = (n) => Math.round(n * 1000) / 1000;

/* ------------------------------------------------------------------ setup */
const slots = initSlots();
const canvas = $('#stage');
const stage = Stage.create(canvas);
if (!stage) document.documentElement.classList.add('no-webgl');
const overlay = new RiverOverlay();

let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

const state = { intro: reduced ? 0.1 : 0, carryExtra: 0, time: 0 };
let L = layout(innerWidth, innerHeight);

const trig = (id, start = 'top top', end = 'bottom bottom') => ScrollTrigger.create({ trigger: '#' + id, start, end });
const ST = {
  descent: trig('descent'),
  arrival: trig('arrival'),
  landscape: trig('landscape', 'top bottom', 'bottom top'),
  journey: trig('journey'),
  people: trig('people'),
  finale: trig('finale'),
};

function resize() {
  const W = innerWidth;
  const H = innerHeight;
  L = layout(W, H);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  stage?.resize(W, H, dpr);
}
resize();
addEventListener('resize', () => {
  resize();
  ScrollTrigger.refresh();
});

/* ------------------------------------------------------------------ opening: the line starts to draw by itself */
if (!reduced) {
  const begin = () => gsap.to(state, { intro: 0.1, duration: 4.2, ease: 'power2.inOut', delay: 0.5 });
  document.fonts?.ready ? document.fonts.ready.then(begin) : begin();
}

/* ------------------------------------------------------------------ refs */
const el = {
  title: $('.title'),
  cue: $('#scroll-cue'),
  beats: $$('.beat'),
  journeyPlates: $$('.journey__plate'),
  journeyWords: $$('.journey__words li'),
  peopleGround: $('.people__ground'),
  peopleInsets: [$('.people__inset--a'), $('.people__inset--b'), $('.people__inset--c')],
  peopleWords: $$('.people__words li'),
  big: $('.finale__big'),
  small: $('.finale__small'),
  next: $('#next'),
};

const clipFrom = (v, side) => {
  const hide = (1 - v) * 100;
  const parts = { bottom: `inset(0 0 ${hide}% 0)`, right: `inset(0 ${hide}% 0 0)`, left: `inset(0 0 0 ${hide}%)` };
  return parts[side];
};

/* ------------------------------------------------------------------ chapters (scroll-scrubbed, one idea each) */
const ctx = gsap.context(() => {
  if (reduced) return;
  const scrub = { ease: 'none' };

  // 1 · the first photograph settles back from a slightly closer lens
  gsap.fromTo('.chapter--river .slot', { '--zoom': 1.1 }, { '--zoom': 1, ...scrub, scrollTrigger: { trigger: '.chapter--river', start: 'top bottom', end: 'bottom top', scrub: true } });

  // 2 · the floodplain opens from the river side, left to right
  gsap.fromTo('.chapter--floodplain .slot', { clipPath: 'inset(0 100% 0 0)', '--zoom': 1.14 }, { clipPath: 'inset(0 0% 0 0)', '--zoom': 1, ...scrub, scrollTrigger: { trigger: '.chapter--floodplain .slot', start: 'top 90%', end: 'top 30%', scrub: true } });

  // 3 · grassland: a tall plate drops in from the top, the wide one is drawn in from the right
  gsap.fromTo('.chapter--grassland .slot--tall', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', ...scrub, scrollTrigger: { trigger: '.chapter--grassland .slot--tall', start: 'top 85%', end: 'top 25%', scrub: true } });
  gsap.fromTo('.chapter--grassland .slot--wide-low', { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', ...scrub, scrollTrigger: { trigger: '.chapter--grassland .slot--wide-low', start: 'top 90%', end: 'top 40%', scrub: true } });

  // 4 · the forest is a slit that opens as you pass through it
  gsap.fromTo('.chapter--forest .slot--slit', { clipPath: 'inset(0 38% 0 38%)' }, { clipPath: 'inset(0 0% 0 0%)', ...scrub, scrollTrigger: { trigger: '.chapter--forest', start: 'top 40%', end: 'bottom bottom', scrub: true } });

  // 5 · the valley is a panorama, crossed slowly from side to side
  gsap.fromTo('.chapter--valley .slot--pano', { '--pan': -4 }, { '--pan': 4, ...scrub, scrollTrigger: { trigger: '.chapter--valley .slot--pano', start: 'top bottom', end: 'bottom top', scrub: true } });
});

/* ------------------------------------------------------------------ the frame */
let leaving = false;
const startedKinds = new Set();
const want = (k) => {
  if (!stage || startedKinds.has(k)) return;
  startedKinds.add(k);
  stage.ensure(k);
};
// satellite starts fetching once the opening has settled; the heavy layers wait until the scroll is near them
setTimeout(() => want('sat'), 1500);

gsap.ticker.add((time) => {
  const W = L.W;
  const H = L.H;
  const sy = window.scrollY;
  const t = reduced ? 0 : time;
  state.time = t;

  const pD = ST.descent.progress;
  const pA = ST.arrival.progress;
  const pJ = ST.journey.progress;
  const pP = ST.people.progress;
  const pF = ST.finale.progress;

  /* travel along the spine: from the end of the first arrival beat to the end of the people sequence */
  const aStart = ST.arrival.start + 0.3 * (ST.arrival.end - ST.arrival.start);
  const travel = clamp((sy - aStart) / (ST.people.end - aStart));

  /* ---- descent */
  const D = descent(pD, L, state.intro, reduced, stage?.hasSat !== false);
  const inDescent = pD < 1;
  const inArrival = !inDescent && pA < 1;
  const nearFinale = sy >= ST.finale.start - H;
  const zone = inDescent ? 'descent' : inArrival ? 'arrival' : nearFinale ? 'finale' : 'idle';

  put(el.title, 'opacity', r3(D.title));
  put(el.cue, 'opacity', r3(D.cue));

  if (pD > 0.2) want('photo');
  if (pD > 0.4 || !inDescent) want('video');

  /* ---- arrival */
  const A = arrival(inDescent ? 0 : pA);
  el.beats.forEach((b, i) => put(b, 'opacity', r3(A.beats[i])));

  /* ---- finale */
  const F = finale(pF, L, state.carryExtra);
  put(el.big, 'opacity', r3(F.big));
  put(el.big, 'letterSpacing', r3(F.bigSpacing) + 'em');
  put(el.small, 'opacity', r3(F.small));
  put(el.next, 'opacity', r3(F.next));
  put(el.next, 'class-live', F.next > 0.9);

  /* ---- stage */
  if (stage) {
    if (zone === 'idle') {
      stage.playVideo(false);
    } else {
      let u;
      if (zone === 'descent') u = D.stage;
      else if (zone === 'arrival') u = { cam: L.cam2, mapA: 0, satR: 0, photoR: 0, videoA: 1, photoZoom: 1, videoZoom: 1, scrim: A.scrim, fade: 1 };
      else u = { cam: L.cam2, mapA: 0, satR: 0, photoR: 0, videoA: 1, photoZoom: 1, ...F.stage };
      stage.playVideo(zone !== 'descent' || pD > 0.88);
      stage.render({ ...u, t });
    }
  }

  /* ---- river overlay */
  const spineDraw = inDescent ? 0 : A.spineDraw;
  const finaleOn = pF > 0 || (pA >= 1 && nearFinale && sy >= ST.finale.start - 2);
  overlay.update({
    W,
    H,
    time: t,
    labels: D.labels,
    map: { cam: D.cam, drawn: D.drawn, alpha: inDescent ? D.riverAlpha : 0, head: D.head, flow: D.flow, readout: D.readout },
    spine: {
      cam: finaleOn ? F.cam : L.spine,
      draw: spineDraw,
      bright: Math.min(travel, spineDraw),
      alpha: 1,
      flow: finaleOn ? F.flow : 0.4,
      ext: finaleOn ? F.extension : 0,
    },
  });

  /* ---- journey */
  const nearJourney = sy > ST.journey.start - H * 1.5 && sy < ST.journey.end + H;
  if (nearJourney) {
    const J = journey(pJ);
    el.journeyPlates.forEach((p, i) => {
      if (J.f > i - 2.2) loadSlot(p);
      const v = J.plates[i];
      put(p, 'opacity', r3(v.opacity));
      put(p, 'transform', reduced ? 'none' : `translate3d(${r3(v.x)}%,0,0) scale(${r3(v.scale)})`);
    });
    el.journeyWords.forEach((w, i) => {
      put(w, 'opacity', r3(J.words[i].opacity));
      put(w, 'transform', `translate3d(0,${r3(J.words[i].y)}px,0)`);
    });
  }

  /* ---- people */
  const nearPeople = sy > ST.people.start - H * 1.5 && sy < ST.people.end + H;
  if (nearPeople) {
    const P = people(pP);
    for (const s of [el.peopleGround, ...el.peopleInsets]) loadSlot(s);
    put(el.peopleGround, 'transform', reduced ? 'none' : `translate3d(0,${r3(P.ground.y)}%,0) scale(${r3(P.ground.scale)})`);
    put(el.peopleInsets[0], 'clipPath', clipFrom(P.insetA, 'bottom'));
    put(el.peopleInsets[1], 'clipPath', clipFrom(P.insetB, 'bottom'));
    put(el.peopleInsets[2], 'clipPath', clipFrom(P.insetC, 'bottom'));
    el.peopleWords.forEach((w, i) => w.classList.toggle('is-on', i === P.word));
  }
});

/* ------------------------------------------------------------------ leaving for the next page */
el.next.addEventListener('click', (e) => {
  if (leaving) return;
  e.preventDefault();
  leaving = true;
  const href = el.next.dataset.next || el.next.getAttribute('href');
  lenis?.stop();
  const go = () => {
    window.dispatchEvent(new CustomEvent('river:leave', { detail: { href } }));
    window.location.href = href;
  };
  if (reduced) return go();
  gsap.to(state, { carryExtra: 0.95, duration: 1.6, ease: 'power2.in' });
  gsap.to('#veil', { opacity: 1, duration: 0.7, delay: 1.0, ease: 'power1.inOut', onComplete: go });
});

// handy for review: window.__river.goto(0..1) scrolls to a point on the whole page
window.__river = {
  ST,
  stage,
  lenis,
  goto(f) {
    const max = document.documentElement.scrollHeight - innerHeight;
    const y = clamp(f) * max;
    lenis ? lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
  },
  gotoSection(id, f = 0) {
    const s = ST[id];
    const y = s.start + clamp(f) * (s.end - s.start);
    lenis ? lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
  },
};

window.addEventListener('pagehide', () => {
  ctx.revert();
  ScrollTrigger.getAll().forEach((s) => s.kill());
  lenis?.destroy();
});
