// DOM photograph slots: lazy <picture> elements with a labelled plate when the file is missing.
import { SLOTS, IMAGE_WIDTHS } from './media.js';

const FORMATS = [
  ['avif', 'image/avif'],
  ['webp', 'image/webp'],
];

function srcset(name, ext) {
  return IMAGE_WIDTHS.map((w) => `/media/${name}-${w}.${ext} ${w}w`).join(', ');
}

function sizesFor(el) {
  if (el.classList.contains('slot--bleed') || el.classList.contains('slot--slit') || el.classList.contains('slot--pano')) return '100vw';
  if (el.classList.contains('people__inset')) return '(min-width: 760px) 30vw, 50vw';
  if (el.classList.contains('slot--tall')) return '(min-width: 760px) 34vw, 100vw';
  return '(min-width: 760px) 72vw, 100vw';
}

function setEmpty(el, name, cfg) {
  el.querySelector('picture, img')?.remove();
  el.dataset.state = 'empty';
  const note = el.querySelector('.slot__note');
  if (note) note.innerHTML = `Photograph needed · media/${name}.jpg<br>${cfg.hint}`;
}

export function loadSlot(el) {
  if (el.dataset.state && el.dataset.state !== 'idle') return;
  const name = el.dataset.slot;
  const cfg = SLOTS[name] || {};
  el.dataset.state = 'loading';

  const mount = (node, onFail) => {
    const img = node.tagName === 'IMG' ? node : node.querySelector('img');
    img.onload = () => {
      el.dataset.state = 'ready';
    };
    img.onerror = onFail;
    el.prepend(node);
  };

  const makeImg = (src, withSet) => {
    const img = document.createElement('img');
    img.alt = cfg.alt || '';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.sizes = sizesFor(el);
    if (withSet) img.srcset = srcset(name, 'jpg');
    img.src = src;
    return img;
  };

  const picture = document.createElement('picture');
  for (const [ext, type] of FORMATS) {
    const s = document.createElement('source');
    s.type = type;
    s.srcset = srcset(name, ext);
    s.sizes = sizesFor(el);
    picture.append(s);
  }
  picture.append(makeImg(`/media/${name}-1920.jpg`, true));

  mount(picture, () => {
    // The responsive set is missing: try a single plain file before giving up.
    picture.remove();
    mount(makeImg(`/media/${name}.jpg`, false), () => setEmpty(el, name, cfg));
  });
}

export function initSlots() {
  const all = [...document.querySelectorAll('[data-slot]')];
  for (const el of all) {
    const cfg = SLOTS[el.dataset.slot] || {};
    el.style.setProperty('--tone', cfg.tone || '#17140f');
    if (cfg.focus) el.style.setProperty('--focus', cfg.focus);
    el.dataset.state = 'idle';
    const note = document.createElement('span');
    note.className = 'slot__note';
    el.append(note);
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          loadSlot(e.target);
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '120% 0px 120% 0px' },
  );
  // Slots inside pinned sequences (journey, people) are loaded by their scene as the sequence advances.
  for (const el of all) if (!el.closest('#journey, #people')) io.observe(el);
  return all;
}
