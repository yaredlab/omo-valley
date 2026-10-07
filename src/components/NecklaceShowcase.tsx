import { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION — adjust to align necklace with the hero video character's neck
// ═══════════════════════════════════════════════════════════════════════════════
// NOTE ON CALIBRATION: these two values were measured directly against the
// provided hero-video screen recording (character's neck sits at ~49.5% from
// left, necklace's visual centre ~80% from top, in that capture). If your hero
// background uses `object-fit: cover`, the on-screen position of the neck will
// drift slightly at aspect ratios very different from that recording — nudge
// these two numbers to re-align if that happens at your production breakpoints.
/** Horizontal anchor of the necklace (% from left of viewport) */
const NECK_LEFT = 49.5;
/** Vertical anchor of the necklace (% from top of viewport) */
const NECK_TOP  = 80;
/** Total scroll height of this section (vh). Larger = more room for slower scroll. */
const SECTION_VH = 380;

// ── Independently-controllable motion parameters ──────────────────────────────
/** Peak zoom multiplier applied to the necklace once fully focused */
const MAX_ZOOM_SCALE = 3.2;
/** Lateral lean (vw) applied while the rear split is opening, before the slide */
const LEAN_VW = -9;
/** Lateral travel (vw) of the horizontal slide, left → right */
const SLIDE_VW = 34;
/** Maximum hinge-opening rotation of each rear arc, in degrees */
const MAX_SPLIT_ROTATION_DEG = 40;
/** Maximum outward radial pop as the rear arcs separate, in canvas px */
const MAX_SPLIT_POP = 24;

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
/** Logical canvas width in px (rendered size at 1× zoom) */
const CW = 700;
/** Logical canvas height in px */
const CH = 560;
/** Internal supersampling multiplier so the canvas stays crisp through MAX_ZOOM_SCALE */
const RES_HEADROOM = 3.4;

// ═══════════════════════════════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeIO  = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const inv     = (lo: number, hi: number, v: number) => clamp((v - lo) / (hi - lo), 0, 1);
const ph      = (lo: number, hi: number, v: number) => easeIO(inv(lo, hi, v));

// ═══════════════════════════════════════════════════════════════════════════════
// NECKLACE CANVAS DRAWING
// ═══════════════════════════════════════════════════════════════════════════════

type BeadKind = 'cyan' | 'navy' | 'red';

/**
 * Draws a single 3-D-looking glass bead at (x, y) with radius r.
 * Gradient stops are matched to the reference product photography:
 * turquoise-glass light blue, cobalt deep blue, and saturated red.
 */
function drawBead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  kind: BeadKind,
  alpha = 1,
): void {
  const g = ctx.createRadialGradient(
    x - r * 0.32, y - r * 0.34, r * 0.04,
    x,            y,             r,
  );
  if (kind === 'red') {
    g.addColorStop(0,    '#ffe9e4');
    g.addColorStop(0.22, '#ff5142');
    g.addColorStop(0.55, '#c8121a');
    g.addColorStop(1,    '#450308');
  } else if (kind === 'navy') {
    g.addColorStop(0,    '#d6e4ff');
    g.addColorStop(0.22, '#3455c6');
    g.addColorStop(0.55, '#111f6e');
    g.addColorStop(1,    '#03051c');
  } else {
    // cyan / turquoise glass
    g.addColorStop(0,    '#f2ffff');
    g.addColorStop(0.22, '#48d9f5');
    g.addColorStop(0.55, '#0a9fd6');
    g.addColorStop(1,    '#04425f');
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // Specular highlight (small bright oval, top-left) — glass beads show a
  // near-white glint regardless of body colour, with a faint colour bias.
  ctx.beginPath();
  ctx.ellipse(
    x - r * 0.28, y - r * 0.28,
    r * 0.30, r * 0.19,
    -0.55,
    0, Math.PI * 2,
  );
  ctx.fillStyle = kind === 'red' ? 'rgba(255,232,224,0.6)' : 'rgba(255,255,255,0.62)';
  ctx.fill();
  ctx.restore();
}

/**
 * Draws the full necklace ring (multi-strand beaded choker).
 *
 * The necklace is a rounded ring viewed in near-frontal perspective (deeper
 * / rounder than a flat oval, matching the real reference photography), split
 * into three arcs:
 *   • front arc  — bottom half, fixed (stays around the character's neck)
 *   • rear-right — arc that hinges open up-and-right when splitP > 0
 *   • rear-left  — arc that hinges open up-and-left  when splitP > 0
 *
 * @param ctx      Canvas 2-D context (already DPR/supersample-scaled)
 * @param splitP   0..1 — how far the rear/back of the necklace has opened
 * @param zoomP    0..1 — zoom phase progress (used for ambient glow)
 */
function drawNecklace(
  ctx: CanvasRenderingContext2D,
  splitP: number,
  zoomP: number,
): void {
  ctx.clearRect(0, 0, CW, CH);

  const cx = CW / 2;
  const cy = 310; // necklace optical centre — see CH sizing note above

  const s = easeIO(splitP);

  // Optional ambient glow drawn behind the necklace during the zoom/focus phase
  const glowAlpha = easeIO(zoomP) * 0.32;
  if (glowAlpha > 0.01) {
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cx, cy));
    gr.addColorStop(0,   `rgba(255,196,120,${(glowAlpha * 0.5).toFixed(3)})`);
    gr.addColorStop(0.45,`rgba(180,140,90,${(glowAlpha * 0.22).toFixed(3)})`);
    gr.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, CW, CH);
  }

  // ── Strand definitions ──────────────────────────────────────────────
  // [radiusX, radiusY, beadRadius, kind] — 9 strands, innermost → outermost,
  // matching the alternating cyan / deep-blue / red sequence traced from the
  // reference photography (cyan framing both the throat-line and the outer
  // edge, with red picked out twice as an accent band).
  const strands: [number, number, number, BeadKind][] = [
    [138, 116, 4.3, 'cyan'],
    [155, 129, 4.6, 'navy'],
    [172, 142, 5.4, 'red' ],
    [189, 155, 4.8, 'navy'],
    [206, 168, 5.0, 'cyan'],
    [223, 181, 5.0, 'navy'],
    [240, 194, 5.6, 'red' ],
    [258, 207, 5.2, 'navy'],
    [278, 221, 6.4, 'cyan'],
  ];

  // ── Arc geometry ─────────────────────────────────────────────────────
  // Coordinate conventions (standard canvas: Y increases downward)
  //   angle = 0°   → rightmost  point of ring (3 o'clock)
  //   angle = 90°  → bottommost point           (6 o'clock) = front of neck
  //   angle = 180° → leftmost   point           (9 o'clock)
  //   angle = 270° → topmost    point           (12 o'clock) = back of neck
  //
  // The front arc is widened to ±72° around the bottom point so it wraps
  // convincingly up toward the jaw on both sides (matching how far up the
  // real necklace visibly climbs in the reference footage) — the rear arcs
  // pick up exactly where the front arc ends, so the "opening" reads as the
  // strand continuing on and separating behind the neck, not a shape that
  // pops into existence over the chin.
  const FA  = 18  * DEG;
  const FB  = 162 * DEG;
  // How far each rear arc extends beyond the front arc's endpoint, once
  // fully split. This deliberately stops well short of the true back point
  // (270°): the true back of the neck is never visible from a front-facing
  // camera anyway, and — just as importantly — sweeping a shorter arc keeps
  // each side's hinge rotation from ever carrying its tip past the vertical
  // centreline, which is what caused the two rear arcs to cross through one
  // another like scissors during earlier tuning.
  const REAR_SWEEP = 62 * DEG;

  const maxRot = MAX_SPLIT_ROTATION_DEG * DEG;

  /** Rotate point (px,py) about pivot (ox,oy) by angle theta (radians). */
  function rotateAbout(px: number, py: number, ox: number, oy: number, theta: number) {
    const dx = px - ox, dy = py - oy;
    const c = Math.cos(theta), sn = Math.sin(theta);
    return { x: ox + dx * c - dy * sn, y: oy + dx * sn + dy * c };
  }

  // Draw rear beads first (behind front beads in Z order)
  for (const [rx, ry, r, kind] of strands) {
    const spacing = r * 2.05;

    // Pivot points where each rear arc hinges from the front arc.
    const pivotRight = { x: cx + rx * Math.cos(FA), y: cy + ry * Math.sin(FA) };
    const pivotLeft  = { x: cx + rx * Math.cos(FB), y: cy + ry * Math.sin(FB) };

    // Rear-right: angle decreases from FA by REAR_SWEEP
    const rrN = Math.max(3, Math.round(rx * REAR_SWEEP / spacing));
    for (let i = 0; i <= rrN; i++) {
      const t = i / rrN; // 0 = junction with front arc, 1 = free (rear) tip
      // Displacement magnitude uses an eased power of t so the arc stays
      // nearly rigid near the pivot and most of the swing happens toward
      // the free (rear) end — a hinge, not a uniform twist.
      const td = Math.pow(t, 1.6);
      const a = FA - REAR_SWEEP * t;
      const bx = cx + rx * Math.cos(a);
      const by = cy + ry * Math.sin(a);

      // Hinge-rotate this rear arc open about its front-junction pivot,
      // then add a small outward radial pop for an elegant "separating" feel.
      const theta = -maxRot * s * td;
      const rot = rotateAbout(bx, by, pivotRight.x, pivotRight.y, theta);
      const dirx = bx - cx, diry = by - cy;
      const dlen = Math.hypot(dirx, diry) || 1;
      const pop = MAX_SPLIT_POP * s * td;
      const px = rot.x + (dirx / dlen) * pop;
      const py = rot.y + (diry / dlen) * pop - pop * 0.35; // slight extra lift

      const recede = 1 - 0.12 * s * td;
      const fade   = 1 - 0.10 * s * td;
      drawBead(ctx, px, py, r * recede, kind, fade);
    }

    // Rear-left: angle increases from FB by REAR_SWEEP
    const rlN = Math.max(3, Math.round(rx * REAR_SWEEP / spacing));
    for (let i = 0; i <= rlN; i++) {
      const t = i / rlN;
      const td = Math.pow(t, 1.6);
      const a = FB + REAR_SWEEP * t;
      const bx = cx + rx * Math.cos(a);
      const by = cy + ry * Math.sin(a);

      const theta = maxRot * s * td;
      const rot = rotateAbout(bx, by, pivotLeft.x, pivotLeft.y, theta);
      const dirx = bx - cx, diry = by - cy;
      const dlen = Math.hypot(dirx, diry) || 1;
      const pop = MAX_SPLIT_POP * s * td;
      const px = rot.x + (dirx / dlen) * pop;
      const py = rot.y + (diry / dlen) * pop - pop * 0.35;

      const recede = 1 - 0.12 * s * td;
      const fade   = 1 - 0.10 * s * td;
      drawBead(ctx, px, py, r * recede, kind, fade);
    }
  }

  // Front beads on top (drawn last = highest Z) — never move.
  for (const [rx, ry, r, kind] of strands) {
    const spacing = r * 2.05;
    const fN = Math.max(3, Math.round(rx * (FB - FA) / spacing));
    for (let i = 0; i <= fN; i++) {
      const a = FA + (FB - FA) * (i / fN);
      drawBead(ctx, cx + rx * Math.cos(a), cy + ry * Math.sin(a), r, kind);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function NecklaceShowcase() {
  // DOM refs — all animation is driven imperatively via RAF to avoid React re-renders
  const sectionRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const posRef     = useRef<HTMLDivElement>(null);
  const scaleRef   = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  // Animation state (all refs, never triggers re-render)
  const scrollP  = useRef(0);   // raw scroll progress 0..1
  const smoothP  = useRef(0);   // exponentially smoothed scroll progress
  const rafId    = useRef(0);
  const lastTime = useRef(performance.now());

  // ── Scroll progress listener ──────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const scrolled = -el.getBoundingClientRect().top; // px scrolled past section top
      const total    = el.offsetHeight - window.innerHeight;
      if (total > 0) scrollP.current = clamp(scrolled / total, 0, 1);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // seed on mount
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── RAF animation loop ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ov     = overlayRef.current;
    const pos    = posRef.current;
    const sc     = scaleRef.current;
    if (!canvas || !ov || !pos || !sc) return;

    // HiDPI + zoom-headroom canvas setup: the wrapper is CSS-scaled up to
    // MAX_ZOOM_SCALE during the animation, so the backing bitmap is rendered
    // at RES_HEADROOM× the display size to stay crisp at full zoom instead of
    // upscaling a low-res bitmap.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const res = dpr * RES_HEADROOM;
    canvas.width        = CW * res;
    canvas.height       = CH * res;
    canvas.style.width  = `${CW}px`;
    canvas.style.height = `${CH}px`;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    ctx2d.scale(res, res);

    // Capture narrowed non-null locals for the closure (TS can't narrow refs inside closures)
    const _ov  = ov;
    const _pos = pos;
    const _sc  = sc;
    const _ctx = ctx2d;

    function tick(now: number) {
      rafId.current = requestAnimationFrame(tick);

      const dt = clamp((now - lastTime.current) / 1000, 0, 0.1);
      lastTime.current = now;

      // ── Exponential smoothing of scroll progress (6 convergences / sec) ──
      smoothP.current += (scrollP.current - smoothP.current) * (1 - Math.exp(-6 * dt));
      const p = smoothP.current;

      // ── Derive animation phases from scroll progress ─────────────────────
      //   splitP : 0..1 — rear necklace arc separation
      //   zoomP  : 0..1 — camera zoom toward the necklace
      //   slideP : 0..1 — horizontal float / slide
      //
      //   Phase boundaries are slightly overlapping so transitions feel continuous.
      //   splitP is already ~90% complete before zoomP starts moving, and fully
      //   completes before zoomP reaches its own maximum (as requested).
      const splitP = ph(0.18, 0.44, p);  // scroll 18%–44%
      const zoomP  = ph(0.40, 0.68, p);  // scroll 40%–68%  (starts when split is ~90% done)
      const slideP = ph(0.66, 1.00, p);  // scroll 66%–100%

      // ── Background overlay: transparent → solid #061E29 ──────────────────
      // Fully opaque by the end of the zoom so the necklace reads as cleanly
      // isolated (per the "necklace becomes the focus" requirement) rather
      // than leaving a ghost of the hero video bleeding through.
      _ov.style.opacity = easeIO(zoomP).toFixed(3);

      // ── Necklace opacity: fade in quickly once split begins ──────────────
      _sc.style.opacity = clamp(splitP * 4.5, 0, 1).toFixed(3);

      // ── Zoom scale: necklace grows 1× → MAX_ZOOM_SCALE× (simulates camera zoom) ──
      const scale = 1 + easeIO(zoomP) * (MAX_ZOOM_SCALE - 1);
      _sc.style.transform = `scale(${scale.toFixed(4)})`;

      // ── Lateral position ─────────────────────────────────────────────────
      //   During split: NO lateral movement — the front arc must stay
      //   locked exactly on her neck while only the rear separates.
      //   During zoom:  lean slightly left  (0 → LEAN_VW)  — sets up the sweep
      //   During slide: sweep left→right    (0 → SLIDE_VW) — elegant horizontal float
      const lateral = easeIO(zoomP) * LEAN_VW + easeIO(slideP) * SLIDE_VW;
      _pos.style.left = `calc(${NECK_LEFT}% + ${lateral.toFixed(2)}vw)`;

      // ── Draw necklace on canvas ──────────────────────────────────────────
      drawNecklace(_ctx, splitP, zoomP);
    }

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  return (
    // Tall section creates the scroll space for the animation sequence.
    // z-index 2 ensures it layers above the fixed background video (z-0)
    // and the Hero section (z-1), while remaining below the Navbar (z-50).
    <section
      ref={sectionRef}
      aria-hidden="true"
      style={{
        height: `${SECTION_VH}vh`,
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* ── Sticky viewport ── */}
      {/* Sticks to the top of the viewport for the entire scroll through the section */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* ── Background tint overlay ── */}
        {/* Fades from fully transparent (hero video shows through) to #061E29 */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#061E29',
            opacity: 0,
          }}
        />

        {/* ── Necklace position anchor ── */}
        {/* Absolute position tracks the character's neck location in the video frame.
            JS updates posRef.style.left each frame to handle the lateral slide. */}
        <div
          ref={posRef}
          style={{
            position: 'absolute',
            left: `${NECK_LEFT}%`,
            top: `${NECK_TOP}%`,
            // Center the necklace canvas on the anchor point
            transform: 'translate(-50%, -50%)',
            willChange: 'left',
          }}
        >
          {/* ── Scale + opacity wrapper ── */}
          {/* JS updates scaleRef.style.transform and .opacity each frame */}
          <div
            ref={scaleRef}
            style={{
              opacity: 0,
              transform: 'scale(1)',
              transformOrigin: 'center center',
              willChange: 'transform, opacity',
            }}
          >
            {/* The necklace is drawn onto this canvas each animation frame */}
            <canvas
              ref={canvasRef}
              style={{ display: 'block' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
