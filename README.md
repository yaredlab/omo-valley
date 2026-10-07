# Mainframe

Full-screen hero landing page built with React, TypeScript, Vite, and Tailwind CSS.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## What's inside

- `src/components/BackgroundVideo.tsx` — the fixed, full-screen background video. Moving the mouse horizontally scrubs the video forward/backward; a seek queue prevents flooding the `<video>` element with requests while you move the mouse quickly.
- `src/components/Navbar.tsx` — fixed navbar with the logo, desktop nav links, a desktop "Get in touch" CTA, and an animated hamburger that opens a full-screen mobile overlay.
- `src/components/Hero.tsx` — the hero copy: a blurred intro label, a typewriter-animated line, and the five action pills (four solid, one outlined with a copy-to-clipboard email button).
- `src/hooks/useTypewriter.ts` — the typewriter hook (`speed` defaults to 38ms/char, `startDelay` defaults to 600ms).
- `public/videos/mainframe-hero.mp4` — the background video asset.
- `src/index.css` — the `--font-heading` / `--font-body` CSS variables and the `blink` keyframes for the typewriter cursor.

The two Helvetica Now webfont stylesheets are loaded directly in `index.html`, so they'll only resolve correctly with an internet connection.

## Build

```bash
npm run build
npm run preview
```
