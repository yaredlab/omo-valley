// Media manifest. Every photograph, plate and video on this page is a named slot.
// Put originals in media-src/ and run `npm run media` (see MEDIA.md); until then a slot shows a labelled tone plate.
//
//  tone  – the plate colour shown while a slot is empty
//  hint  – what the picture should be (shown on the empty plate only)
//  alt   – alternative text once a real photograph is in place; edit to describe the real picture
//  focus – CSS object-position for the crop

export const SLOTS = {
  // landscape chapters
  'river-01': { tone: '#2b261c', hint: 'The Omo from the air, wide, horizontal. 16:9 or wider.', alt: 'The Omo winding through green lowland at sunset, seen from the air', focus: '50% 62%' },
  'floodplain-01': { tone: '#3a3224', hint: 'Floodplain beside the river. 16:9.', alt: 'A still lake and a flat, sandy shore under a clear dusk sky', focus: '50% 55%' },
  'grassland-01': { tone: '#4a4125', hint: 'Grassland, vertical. 3:4.', alt: 'Dry savannah below a range of rocky mountains', focus: '50% 50%' },
  'grassland-02': { tone: '#40391f', hint: 'Open grassland or rangeland, horizontal. 16:10.', alt: 'A herd going down a muddy riverbank to drink, with acacia trees behind', focus: '50% 50%' },
  'forest-01': { tone: '#1d261b', hint: 'Riverine woodland along the banks. Full-bleed, any ratio.', alt: 'Dense woodland along the bank of a wide brown river', focus: '50% 50%' },
  'valley-01': { tone: '#3b2a1f', hint: 'The valley, panoramic. 21:9 or wider.', alt: 'The river valley from above, with the sun setting over distant hills', focus: '50% 50%' },

  // the river journey, in travelling order
  'journey-aerial': { tone: '#2b261c', hint: 'Aerial of the river.', alt: 'The Omo winding through green lowland at sunset, seen from the air', focus: '50% 62%' },
  'journey-water': { tone: '#2c2a22', hint: 'The water: surface, current, silt.', alt: 'Two men poling a canoe across the wide brown river', focus: '50% 50%' },
  'journey-riverbank': { tone: '#33291d', hint: 'The riverbank.', alt: 'A herd going down a muddy riverbank to the water', focus: '50% 50%' },
  'journey-vegetation': { tone: '#26301f', hint: 'Vegetation at the water.', alt: 'Woodland on the river bank under a glowing sky', focus: '50% 50%' },
  'journey-landscape': { tone: '#3d3522', hint: 'The wider landscape.', alt: 'Open savannah below rocky mountains', focus: '50% 50%' },
  'journey-communities': { tone: '#3a2b1f', hint: 'A community in its landscape, seen from a distance.', alt: 'A village in the green lowland beside a bend of the river, seen from above', focus: '50% 50%' },
  'journey-valley': { tone: '#3b2a1f', hint: 'The valley.', alt: 'A lake shore at dusk under a clear sky', focus: '50% 50%' },

  // river → land → life → people
  'people-ground': { tone: '#2f2a1f', hint: 'A wide landscape. People appear inside it in the next three pictures.', alt: 'Two men in a canoe on a wide river, with woodland on the far bank', focus: '50% 50%' },
  'people-a': { tone: '#4a4125', hint: 'Land and its use. 4:5.', alt: 'Green hills in haze, seen through leaves', focus: '50% 50%' },
  'people-b': { tone: '#3a3224', hint: 'Daily life. 1:1.', alt: 'A herd of goats on a river bank', focus: '50% 50%' },
  'people-c': { tone: '#3b2a1f', hint: 'People, in their place. 4:5.', alt: 'A man in beaded necklaces and a green wrap looks through binoculars across the savannah', focus: '50% 50%' },
};

// Stage media: the three layers that follow the map in the descent.
export const STAGE = {
  satellite: {
    candidates: ['/media/sat-omo-1920.jpg', '/media/sat-omo-2560.jpg', '/media/sat-omo.jpg'],
    tone: '#23251a',
    label: 'Satellite plate needed · public/media/sat-omo.jpg · see MEDIA.md',
  },
  photo: {
    candidates: ['/media/aerial-omo-1920.jpg', '/media/aerial-omo-2560.jpg', '/media/aerial-omo.jpg'],
    tone: '#2e2a1f',
    label: 'Aerial photograph · public/media/aerial-omo.jpg',
  },
  video: {
    sources: [
      { src: '/media/aerial-omo.webm', type: 'video/webm; codecs="vp9"' },
      { src: '/media/aerial-omo.mp4', type: 'video/mp4' },
    ],
    poster: ['/media/aerial-omo-poster.jpg'],
    tone: '#36301f',
    label: 'Aerial video · public/media/aerial-omo.webm / .mp4',
  },
};

export const IMAGE_WIDTHS = [640, 1280, 1920, 2560];

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => (img.naturalWidth > 0 ? resolve(img) : reject(new Error('empty')));
    img.onerror = () => reject(new Error('missing ' + url));
    img.src = url;
  });
}

export async function loadFirst(urls) {
  for (const u of urls) {
    try {
      return await loadImage(u);
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

/** Try each source in turn; resolves with a playing-ready <video>, or null. */
export function loadVideo(sources) {
  const probe = document.createElement('video');
  const usable = sources.filter((s) => probe.canPlayType(s.type) !== '');
  return new Promise((resolve) => {
    const next = (i) => {
      if (i >= usable.length) return resolve(null);
      const v = document.createElement('video');
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.crossOrigin = 'anonymous';
      let done = false;
      const fail = () => {
        if (done) return;
        done = true;
        next(i + 1);
      };
      v.addEventListener('error', fail, { once: true });
      v.addEventListener(
        'loadeddata',
        () => {
          if (done) return;
          done = true;
          resolve(v);
        },
        { once: true },
      );
      v.src = usable[i].src;
      v.load();
    };
    next(0);
  });
}

/** A flat, labelled plate for a layer whose file has not been supplied. Never imitates a photograph. */
export function plateCanvas(w, h, tone, label) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = tone;
  g.fillRect(0, 0, w, h);
  if (label) {
    g.fillStyle = 'rgba(232,225,210,0.42)';
    g.font = `${Math.round(h * 0.014)}px "Familjen Grotesk", system-ui, sans-serif`;
    g.textBaseline = 'bottom';
    g.fillText(label, w * 0.12, h * 0.94);
    g.strokeStyle = 'rgba(232,225,210,0.1)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, w - 2, h - 2);
  }
  return c;
}
