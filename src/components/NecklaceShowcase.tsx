import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION — easy knobs to tune without touching animation logic
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Total scroll height of the pinned section expressed as viewport-heights.
 * Larger = slower, more cinematic scroll.  Smaller = snappier.
 */
const SECTION_VH = 500;

/**
 * How far forward (scale multiplier) the necklace moves at peak foreground.
 * 1.0 = original size.  2.6 means 2.6× magnification.
 */
const NECKLACE_MAX_SCALE = 2.6;

/**
 * Vertical position of the necklace anchor on the portrait as a % of the
 * viewport height. The collarbone sits at roughly 68% of screen height when
 * the portrait fills the viewport with objectPosition:'center top'.
 */
const NECKLACE_TOP_VH = 68; // % of viewport height

/**
 * Horizontal centre of the necklace as % of viewport width.
 */
const NECKLACE_LEFT_VW = 50; // % of viewport width

/**
 * Width of the necklace element expressed as vw (viewport width units).
 * The necklace is a wide collar; 72vw fills the lower-neck area at natural size.
 */
const NECKLACE_WIDTH_VW = 72;

/**
 * White-removal tolerance (0–255). Pixels whose R, G, B are all above this
 * threshold are treated as background and made transparent.
 * Raise to also remove near-white fringe pixels; lower to preserve light tones.
 */
const WHITE_THRESHOLD = 230;

// ── Storytelling copy ──────────────────────────────────────────────────────
// Edit this array — no other changes needed.
const STORY_SECTIONS = [
  {
    heading: 'The Art of Adornment',
    body: 'For centuries, beaded jewellery has served as a visual language — marking celebration, identity, and craftsmanship. Each strand is positioned with intention, its colours chosen from a palette refined across generations of makers.',
  },
  {
    heading: 'Materials and Craftsmanship',
    body: 'Crafted from hand-formed glass beads, the necklace layers turquoise, cobalt and coral in alternating arcs. Each bead is individually strung and aligned, a process that can take an artisan hours to complete for a single piece.',
  },
  {
    heading: 'A Living Cultural Tradition',
    body: 'Beaded collar necklaces of this form are worn across many communities of East Africa and beyond. They are made by hand, passed between generations, and continue to be crafted and worn today as both personal adornment and cultural expression.',
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// WHITE-BACKGROUND REMOVAL UTILITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Loads an image URL, draws it onto an offscreen canvas, erases all pixels
 * whose R, G and B components are all ≥ threshold, then returns a new data
 * URL with a transparent background.  The returned URL is used as the src
 * of the necklace <img> element so the background is already stripped before
 * any compositing happens — no blend-mode tricks needed.
 */
function removeWhiteBackground(
  src: string,
  threshold = WHITE_THRESHOLD,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No 2D context')); return; }

      ctx.drawImage(img, 0, 0);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Flood-fill from edges to capture only background white pixels
      // (prevents erasing bright whites that are part of the necklace beads
      // themselves — e.g. specular highlights — while only removing the
      // surrounding plain white background).
      const w = canvas.width;
      const h = canvas.height;
      const visited = new Uint8Array(w * h);
      const queue: number[] = [];

      // Seed from all four border edges
      for (let x = 0; x < w; x++) {
        queue.push(0 * w + x, (h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        queue.push(y * w + 0, y * w + (w - 1));
      }

      while (queue.length) {
        const idx = queue.pop()!;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const px = idx * 4;
        const r = data[px], g = data[px + 1], b = data[px + 2];

        if (r >= threshold && g >= threshold && b >= threshold) {
          // Make this pixel transparent
          data[px + 3] = 0;

          // Add 4-connected neighbours
          const x = idx % w, y = Math.floor(idx / w);
          if (x > 0)     queue.push(idx - 1);
          if (x < w - 1) queue.push(idx + 1);
          if (y > 0)     queue.push(idx - w);
          if (y < h - 1) queue.push(idx + w);
        }
      }

      ctx.putImageData(new ImageData(data, w, h), 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = reject;
    img.src = src;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NecklaceShowcase() {
  const sectionRef    = useRef<HTMLDivElement>(null);
  const stickyRef     = useRef<HTMLDivElement>(null);
  const portraitRef   = useRef<HTMLDivElement>(null);
  const necklaceRef   = useRef<HTMLImageElement>(null);
  const necklaceWrapRef = useRef<HTMLDivElement>(null);
  const textPanelRef  = useRef<HTMLDivElement>(null);
  const storyItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef    = useRef<HTMLDivElement>(null);
  const closingRef    = useRef<HTMLDivElement>(null);

  // ── Strip white background from necklace image on mount ─────────────────
  useEffect(() => {
    const necklaceEl = necklaceRef.current;
    if (!necklaceEl) return;

    removeWhiteBackground('/images/necklace-isolated.png', WHITE_THRESHOLD)
      .then(dataUrl => {
        if (necklaceEl) necklaceEl.src = dataUrl;
      })
      .catch(() => {
        // Fallback: use original with screen blend mode if canvas fails
        if (necklaceEl) {
          necklaceEl.style.mixBlendMode = 'screen';
        }
      });
  }, []);

  // ── GSAP ScrollTrigger animation ─────────────────────────────────────────
  useEffect(() => {
    const section      = sectionRef.current;
    const sticky       = stickyRef.current;
    const portrait     = portraitRef.current;
    const necklaceWrap = necklaceWrapRef.current;
    const textPanel    = textPanelRef.current;
    const overlay      = overlayRef.current;
    const closing      = closingRef.current;
    if (!section || !sticky || !portrait || !necklaceWrap || !textPanel || !overlay || !closing) return;

    // Respect prefers-reduced-motion: show everything static, skip animation
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(necklaceWrap, { xPercent: -50, yPercent: -50 });
      gsap.set([overlay, portrait, necklaceWrap, textPanel], { opacity: 1 });
      gsap.set(storyItemsRef.current.filter(Boolean), { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      // Set initial state: centre the necklace via GSAP xPercent/yPercent
      // so that GSAP scale/rotate/x transforms don't clobber the centering.
      gsap.set(necklaceWrap, {
        xPercent: -50,
        yPercent: -50,
        transformPerspective: 800,
        transformOrigin: 'center center',
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: `+=${SECTION_VH}vh`,
          scrub: 1.6,        // ↑ increase for slower/silkier scrub
          pin: sticky,
          pinSpacing: false, // the tall section element itself provides the height
          anticipatePin: 1,
        },
      });

      // ── Scene 1 → dark background in + portrait fades in ──────────────
      tl.fromTo(overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.06, ease: 'none' },
        0,
      );

      tl.fromTo(portrait,
        { opacity: 0 },
        { opacity: 1, duration: 0.12, ease: 'power2.out' },
        0,
      );

      // ── Scene 2 → necklace emerges at rest position ───────────────────
      tl.fromTo(necklaceWrap,
        { opacity: 0, scale: 1 },
        { opacity: 1, duration: 0.10, ease: 'power2.inOut' },
        0.10,
      );

      // ── Scene 2 → 3: necklace moves toward viewer ─────────────────────
      // Scale: necklace grows toward viewer
      tl.to(necklaceWrap,
        {
          scale: NECKLACE_MAX_SCALE,
          duration: 0.30,
          ease: 'power2.inOut',
        },
        0.16,
      );

      // Portrait darkens + recedes slightly for depth
      tl.to(portrait,
        {
          scale: 0.94,
          filter: 'brightness(0.50)',
          duration: 0.30,
          ease: 'power2.inOut',
        },
        0.16,
      );

      // Subtle 3-D tilt — necklace tilts slightly as it comes forward
      tl.to(necklaceWrap,
        {
          rotationX: 6,
          rotationY: -3,
          duration: 0.30,
          ease: 'power2.inOut',
        },
        0.16,
      );

      // ── Scene 3 → 4: text panel slides in, necklace shifts left ───────
      tl.to(necklaceWrap,
        {
          x: '-14vw',
          duration: 0.20,
          ease: 'power3.inOut',
        },
        0.40,
      );

      tl.fromTo(textPanel,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.18, ease: 'power3.out' },
        0.44,
      );

      // Story items stagger in sequentially
      storyItemsRef.current.forEach((el, i) => {
        if (!el) return;
        tl.fromTo(el,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' },
          0.48 + i * 0.10,
        );
      });

      // ── Scene 5: text fades, necklace centres for cinematic close-up ──
      tl.to(textPanel,
        { opacity: 0, x: 40, duration: 0.10, ease: 'power2.in' },
        0.80,
      );

      tl.to(necklaceWrap,
        {
          x: 0,
          scale: NECKLACE_MAX_SCALE * 1.18,
          rotationX: 0,
          rotationY: 0,
          duration: 0.16,
          ease: 'power2.inOut',
        },
        0.82,
      );

      // Drop shadow intensifies at close-up
      tl.to(necklaceWrap,
        {
          filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.80)) drop-shadow(0 4px 16px rgba(0,0,0,0.60))',
          duration: 0.14,
          ease: 'power2.inOut',
        },
        0.82,
      );

      // ── Scene 5 → transition: fade to ThirdPage bg colour ─────────────
      tl.fromTo(closing,
        { opacity: 0 },
        { opacity: 1, duration: 0.08, ease: 'none' },
        0.93,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    /*
      The section is tall to create the scroll budget.
      z-index 2 places it above the fixed video (z-0) and Hero (z-1).
    */
    <section
      ref={sectionRef}
      aria-label="Necklace storytelling section"
      style={{
        height: `${SECTION_VH}vh`,
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* ── Sticky viewport — remains at top while scrolling through section */}
      <div
        ref={stickyRef}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >

        {/* ── Nearly-black background (covers hero video underneath) ──── */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#04080a',
            opacity: 0,
          }}
        />

        {/* ── Portrait ───────────────────────────────────────────────── */}
        {/*
          Uses objectFit:cover + objectPosition:'center top' so the face is
          always centered and the top of the image aligns with the viewport top.
          The portrait was AI-generated with the necklace removed, so the neck
          area is clear — the animated necklace overlay sits on top.
        */}
        <div
          ref={portraitRef}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            transformOrigin: 'center center',
            willChange: 'transform, opacity, filter',
          }}
        >
          <img
            src="/images/portrait-no-necklace.png"
            alt="Cinematic portrait of a woman with face adornment against a dark background"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </div>

        {/* ── Necklace overlay ─────────────────────────────────────── */}
        {/*
          Positioning:
          The anchor div sits at (NECKLACE_LEFT_VW, NECKLACE_TOP_VH) in the
          viewport.  The necklace <img> is translated -50%/-50% to centre
          on that anchor.  This makes the necklace appear exactly where the
          collarbone sits in the portrait.

          The white background of the PNG source is removed at runtime by
          the removeWhiteBackground() canvas utility above, so the necklace
          floats cleanly over the portrait and the dark background.
        */}
        <div
          style={{
            position: 'absolute',
            left: `${NECKLACE_LEFT_VW}%`,
            top: `${NECKLACE_TOP_VH}%`,
            zIndex: 2,
            pointerEvents: 'none',
            // Ensure mix-blend is applied only within this isolated context
            isolation: 'isolate',
          }}
        >
          <div
            ref={necklaceWrapRef}
            style={{
              width: `${NECKLACE_WIDTH_VW}vw`,
              transformOrigin: 'center center',
              opacity: 0,
              willChange: 'transform, opacity, filter',
            }}
          >
            <img
              ref={necklaceRef}
              src="/images/necklace-isolated.png"
              alt="Multi-strand beaded necklace in turquoise, cobalt and coral"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                userSelect: 'none',
                pointerEvents: 'none',
                // Initial drop shadow — intensifies during close-up phase
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.60))',
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* ── Storytelling text panel ──────────────────────────────── */}
        <div
          ref={textPanelRef}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 'clamp(260px, 34vw, 500px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'clamp(20px, 4vw, 60px)',
            opacity: 0,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {/* Top decorative rule */}
          <div
            style={{
              width: 36,
              height: 1,
              background: 'rgba(199,168,105,0.55)',
              marginBottom: 28,
            }}
          />

          {STORY_SECTIONS.map((s, i) => (
            <div
              key={s.heading}
              ref={el => { storyItemsRef.current[i] = el; }}
              style={{
                marginBottom: i < STORY_SECTIONS.length - 1 ? 36 : 0,
                opacity: 0,
              }}
            >
              <h3
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(15px, 1.5vw, 21px)',
                  fontWeight: 400,
                  color: '#c7a869',
                  letterSpacing: '0.01em',
                  lineHeight: 1.25,
                  margin: '0 0 10px',
                }}
              >
                {s.heading}
              </h3>
              <p
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 'clamp(12px, 1.05vw, 15px)',
                  fontWeight: 400,
                  color: 'rgba(244,243,239,0.68)',
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {s.body}
              </p>
            </div>
          ))}

          {/* Bottom decorative rule */}
          <div
            style={{
              width: 36,
              height: 1,
              background: 'rgba(199,168,105,0.55)',
              marginTop: 32,
            }}
          />
        </div>

        {/* ── Closing transition overlay (fades to ThirdPage bg #061E29) */}
        <div
          ref={closingRef}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#061E29',
            opacity: 0,
            zIndex: 4,
            pointerEvents: 'none',
          }}
        />

      </div>
    </section>
  );
}
