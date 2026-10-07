import { useEffect, useRef } from 'react';

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let mouseX = window.innerWidth / 2;
    let targetTime = 0;
    let smoothTime = 0;
    let animationFrame = 0;
    let isSeeking = false;
    let initialized = false;
    let lastFrameAt = performance.now();

    // Source video is 12fps -> one frame = ~0.0833s. Below this, there is
    // literally no new frame to show, so don't bother re-seeking.
    const FRAME_DURATION = 1 / 12;
    const SEEK_THRESHOLD = FRAME_DURATION / 2;

    // How quickly smoothTime chases targetTime, in "convergence per second"
    // rather than "convergence per frame". Exponential decay keyed to
    // elapsed time ensures consistent speed across 60Hz, 120Hz, 144Hz+ displays.
    const SMOOTHING_SPEED = 10;

    const hasFrameCallback =
      typeof (video as any).requestVideoFrameCallback === 'function';

    const markSeekDone = () => {
      isSeeking = false;
    };

    // requestVideoFrameCallback fires once the seeked frame is actually
    // painted to the screen — more reliable than 'seeked', preventing stutter.
    const waitForPaint = () => {
      if (hasFrameCallback) {
        (video as any).requestVideoFrameCallback(markSeekDone);
      }
    };

    if (!hasFrameCallback) {
      video.addEventListener('seeked', markSeekDone);
    }

    // Full window pointer tracking across the entire viewport
    const handlePointerMove = (e: MouseEvent | PointerEvent | TouchEvent) => {
      if ('clientX' in e) {
        mouseX = e.clientX;
      } else if (e.touches && e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
      }
    };

    const updateTarget = () => {
      if (!video.duration || !Number.isFinite(video.duration)) {
        return;
      }
      const progress = Math.max(0, Math.min(1, mouseX / window.innerWidth));
      const maxSeekable = Math.max(0, video.duration - FRAME_DURATION);
      targetTime = progress * maxSeekable;
    };

    const onLoadedMetadata = () => {
      updateTarget();
      if (!initialized && video.duration) {
        smoothTime = targetTime;
        video.currentTime = targetTime;
        initialized = true;
      }
    };

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);

      if (!video.duration || !Number.isFinite(video.duration)) {
        return;
      }

      const now = performance.now();
      // Clamp so a dropped/backgrounded tab can't cause sudden huge delta
      const dt = Math.min((now - lastFrameAt) / 1000, 0.1);
      lastFrameAt = now;

      // Calculate progress across the full window width (0.0 to 1.0)
      const progress = Math.max(0, Math.min(1, mouseX / window.innerWidth));
      const maxSeekable = Math.max(0, video.duration - FRAME_DURATION);
      targetTime = progress * maxSeekable;

      // On first frame where duration becomes known, snap directly to avoid sweeps
      if (!initialized) {
        smoothTime = targetTime;
        video.currentTime = targetTime;
        initialized = true;
      }

      // Frame-rate-independent exponential smoothing
      const smoothingFactor = 1 - Math.exp(-SMOOTHING_SPEED * dt);
      smoothTime += (targetTime - smoothTime) * smoothingFactor;

      if (isSeeking) return;

      if (Math.abs(video.currentTime - smoothTime) > SEEK_THRESHOLD) {
        isSeeking = true;
        video.currentTime = smoothTime;
        waitForPaint();
      }
    };

    // Never allow the background video to play automatically
    const stopPlayback = () => {
      video.pause();
    };

    // Listen across full window and document for all pointer / touch movements
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('resize', updateTarget, { passive: true });
    video.addEventListener('play', stopPlayback);
    video.addEventListener('loadedmetadata', onLoadedMetadata);

    if (video.readyState >= 1) {
      onLoadedMetadata();
    }

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', updateTarget);
      video.removeEventListener('play', stopPlayback);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      if (!hasFrameCallback) {
        video.removeEventListener('seeked', markSeekDone);
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="fixed inset-0 z-0 w-full h-full object-cover object-[70%_center] pointer-events-none select-none"
      muted
      playsInline
      preload="auto"
    >
      <source src="/videos/mainframe-hero.webm" type="video/webm" />
      <source src="/videos/mainframe-hero.mp4" type="video/mp4" />
    </video>
  );
}
