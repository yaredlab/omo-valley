import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from 'react';
import { useTypewriter } from '../hooks/useTypewriter';
import CardDeck from './CardDeck';

const PILL_LABELS = [
  'Pitch us an idea',
  'Come work here',
  'Send a brief hello',
  'See how we operate',
];

const TYPEWRITER_TEXT =
  'OMO / WHERE THE RIVER REMEMBERS ';

interface GlowButtonProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

function GlowButton({ children, style, className = '', onClick }: GlowButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;

    const maxTilt = 4.5;
    const ry = (x - 0.5) * maxTilt;
    const rx = (0.5 - y) * maxTilt;

    btn.style.setProperty('--rx', ry.toFixed(2) + 'deg');
    btn.style.setProperty('--ry', rx.toFixed(2) + 'deg');
    btn.style.setProperty('--px', (x * 100).toFixed(1) + '%');
    btn.style.setProperty('--py', (y * 100).toFixed(1) + '%');
  };

  const handlePointerEnter = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.setProperty('--spin-dur', '1.4s');
    btn.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.2, 0.4, 1), box-shadow 0.35s ease';
  };

  const handlePointerLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.setProperty('--rx', '0deg');
    btn.style.setProperty('--ry', '0deg');
    btn.style.setProperty('--spin-dur', '3.2s');
    btn.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease';
  };

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    const ripple = rippleRef.current;
    if (!btn || !ripple) return;
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.remove('play');
    void ripple.offsetWidth;
    ripple.classList.add('play');
  };

  return (
    <button
      ref={btnRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      style={style}
      className={`btn-glass ${className}`}
      type="button"
    >
      <span className="hotspot" />
      <span className="sheen" />
      <span ref={rippleRef} className="ripple" />
      <span className="btn-content">{children}</span>
    </button>
  );
}

export default function Hero() {
  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT, 38, 600);
  const [pillsVisible, setPillsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setPillsVisible(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('hello@mainframe.co').catch(() => {
      // Clipboard API unavailable — nothing further to do.
    });
  };

  const pillStyle: CSSProperties = {
    opacity: pillsVisible ? 1 : 0,
    transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
  };

  return (
    <section className="relative z-[1] flex h-screen w-full flex-col justify-end overflow-hidden px-6 pb-8 sm:px-10 sm:pb-12 md:px-12 md:pb-14 lg:pb-16">
      <div className="relative z-10 flex w-full flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
        {/* Left column: Heading & Action Pills */}
        <div className="max-w-xl lg:max-w-2xl">
          {/* Blurred intro label */}
          <p
            className="pointer-events-none mb-4 select-none sm:mb-5"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.3,
              fontWeight: 400,
              color: '#fff',
              filter: 'blur(4px)',
            }}
          >
            Meet .YA.R.E.D
            <br />
            Mainframe&apos;s Adaptive Response Interface Agent
          </p>

          {/* Typewriter text */}
          <p
            className="mb-5 sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
              fontWeight: 400,
              minHeight: '54px',
              color: '#fff',
              textShadow: '0 1px 12px rgba(0,0,0,0.18)',
            }}
          >
            {displayed}
            {!done && (
              <span
                className="ml-[2px] inline-block h-[1.1em] w-[2px] align-middle bg-white"
                style={{ animation: 'blink 1s step-end infinite' }}
              />
            )}
          </p>

          {/* Action pills */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2.5 sm:gap-x-3 sm:gap-y-3">
            {PILL_LABELS.map((label) => (
              <GlowButton
                key={label}
                style={pillStyle}
                className="px-4 py-2 text-[13px] sm:px-5 sm:py-2.5 sm:text-[14px]"
              >
                {label}
              </GlowButton>
            ))}

            {/* Email CTA */}
            <GlowButton
              onClick={handleCopyEmail}
              style={pillStyle}
              className="px-4 py-2 text-[13px] sm:gap-2.5 sm:px-5 sm:py-2.5 sm:text-[14px]"
            >
              <span>
                Reach us:{' '}
                <span className="underline underline-offset-1">
                  hello@mainframe.co
                </span>
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect
                  x="1"
                  y="1"
                  width="7"
                  height="7"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <rect
                  x="4"
                  y="4"
                  width="7"
                  height="7"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </GlowButton>
          </div>
        </div>

        {/* Right column: 3D Fanned Card Deck */}
        <div className="hidden md:flex flex-col items-center justify-end pb-2 shrink-0">
          <CardDeck />
        </div>
      </div>
    </section>
  );
}
