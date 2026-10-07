import { useState, useRef, type MouseEvent } from 'react';

// ============================================================================
// CONFIGURABLE TEXT - Change these values to update the grid text at any time!
// ============================================================================
export const INITIAL_GRID_TEXT = {
  // Row 1 items (each item renders in its own bordered box)
  row1: [
    { text: 'A', widthClass: 'w-[18%] sm:w-[15%] md:w-[12%]' },
    { text: 'NEW', widthClass: 'w-[28%] sm:w-[26%] md:w-[24%]' },
    { text: 'WORLD OF', widthClass: 'flex-1' },
  ],
  // Row 2 items
  row2: [
    { text: 'DIGITAL', widthClass: 'w-[42%] sm:w-[40%] md:w-[36%]' },
    { text: 'OWNERSHIP', widthClass: 'flex-1' },
  ],
};

// Map of specific characters or indices to stylize with pixel/glitch font
const PIXEL_CHAR_MAP: Record<string, boolean> = {
  E: true,
  R: true,
  G: true,
  W: true,
};

interface StylizedWordProps {
  text: string;
  customPixelChars?: string[];
  className?: string;
}

/**
 * Renders uppercase text where select letters use the iconic pixel/matrix glyphs
 * matching the exact aesthetic of the screenshot.
 */
export function StylizedText({ text, customPixelChars, className = '' }: StylizedWordProps) {
  const pixelSet = customPixelChars ? new Set(customPixelChars) : null;

  return (
    <span className={`inline-flex items-center tracking-normal ${className}`}>
      {text.split('').map((char, index) => {
        const upper = char.toUpperCase();
        const isSpace = char === ' ';
        if (isSpace) {
          return <span key={index} className="inline-block w-[0.28em]">&nbsp;</span>;
        }

        // Determine if this character should be pixelated
        // Specific rule to match screenshot: in 'DIGITAL' the 'A' is pixelated
        const isPixel = pixelSet
          ? pixelSet.has(upper)
          : PIXEL_CHAR_MAP[upper] || (text === 'DIGITAL' && upper === 'A') || (text === 'OWNERSHIP' && upper === 'P' && index === text.length - 1);

        if (isPixel) {
          return (
            <span
              key={index}
              className="font-pixel font-bold text-cyber-blue inline-block select-none transition-transform duration-200 hover:scale-110 hover:-translate-y-0.5"
              style={{
                fontFamily: "'Pixelify Sans', 'VT323', monospace",
                fontSize: '1.02em',
                lineHeight: 1,
                transform: 'translateY(-0.02em)',
              }}
            >
              {upper}
            </span>
          );
        }

        return (
          <span
            key={index}
            className="font-display font-black text-cyber-blue inline-block select-none tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', 'Helvetica Now Display', 'Helvetica Neue', sans-serif",
              lineHeight: 1,
            }}
          >
            {upper}
          </span>
        );
      })}
    </span>
  );
}

// Collectible items for the showcase
const COLLECTIBLES = [
  {
    id: 'solaris',
    name: 'Solaris Unit 07',
    tag: 'NEO-KYOTO // ARC UNIT 07',
    image: '/images/cards/card-right.jpg',
    rarity: 'LEGENDARY',
    edition: '07 / 100',
    color: '#38bdf8',
    description: 'High-altitude thermal polymer shell with integrated neural synch and reactive fiber weave.',
  },
  {
    id: 'cyberfrost',
    name: 'Cyber Frost 42',
    tag: 'ICE CYBER // DIGITAL COLLECTIBLE',
    image: '/images/cards/card-left.jpg',
    rarity: 'MYTHIC',
    edition: '42 / 100',
    color: '#00f0ff',
    description: 'Cryo-forged cybernetic horns with dual sub-zero dissipation coils and sub-dermal glow circuits.',
  },
  {
    id: 'quantummuse',
    name: 'Quantum Muse 12',
    tag: 'CYBERPUNK // RARITY: EPIC',
    image: '/images/cards/card-center.jpg',
    rarity: 'EPIC',
    edition: '12 / 100',
    color: '#60a5fa',
    description: 'Tactical ballistic exoskeleton with bio-luminescent HUD visor and quantum datapad.',
  },
];

export default function DigitalOwnership() {
  const [activeCollectible, setActiveCollectible] = useState(0);
  const [gridData, setGridData] = useState(INITIAL_GRID_TEXT);
  const [isEditing, setIsEditing] = useState(false);
  const [editRow1, setEditRow1] = useState('A | NEW | WORLD OF');
  const [editRow2, setEditRow2] = useState('DIGITAL | OWNERSHIP');
  const [copiedContract, setCopiedContract] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const currentItem = COLLECTIBLES[activeCollectible];

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 12, y: -y * 12 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleSaveEdit = () => {
    const r1 = editRow1.split('|').map((s) => s.trim()).filter(Boolean);
    const r2 = editRow2.split('|').map((s) => s.trim()).filter(Boolean);

    setGridData({
      row1: r1.map((txt) => ({ text: txt, widthClass: 'flex-1' })),
      row2: r2.map((txt) => ({ text: txt, widthClass: 'flex-1' })),
    });
    setIsEditing(false);
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText('0x71C...MF902').catch(() => {});
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <section className="relative z-10 w-full min-h-screen bg-[#000000] text-white overflow-hidden py-16 px-4 sm:px-6 md:px-12 lg:px-16 cyber-grid-bg transition-colors duration-500">
      {/* Top Ambient Glow / Section Transition from Hero */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#08070a] via-[#000000]/80 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Top Header Badge / Live Network Status */}
        <div className="w-full flex items-center justify-between pb-6 border-b border-blue-500/20 text-xs text-blue-400/70 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            <span>PROTOCOL // MF-ARCHIVE 02</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[11px] px-3 py-1 rounded border border-blue-500/30 hover:border-blue-400 hover:text-white transition-colors bg-blue-950/30"
              title="Click to live-edit the grid typography"
            >
              {isEditing ? '✕ Close Editor' : '✎ Edit Text'}
            </button>
            <span className="hidden sm:inline-block">ETH BLOCK: #19842091</span>
          </div>
        </div>

        {/* Live Text Editor Modal (Toggleable for quick text changes) */}
        {isEditing && (
          <div className="w-full max-w-2xl mt-4 mb-6 p-4 rounded-xl bg-[#0a0f1d] border border-blue-500/40 shadow-2xl backdrop-blur-md z-30">
            <div className="text-sm font-bold text-blue-400 mb-2 flex items-center justify-between">
              <span>Live Typography Text Editor</span>
              <span className="text-xs text-blue-300/60 font-normal">Separate boxes using |</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-blue-300/80 block mb-1">Row 1 Boxes:</label>
                <input
                  type="text"
                  value={editRow1}
                  onChange={(e) => setEditRow1(e.target.value)}
                  className="w-full bg-black/60 border border-blue-500/30 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400 font-mono"
                  placeholder="A | NEW | WORLD OF"
                />
              </div>
              <div>
                <label className="text-xs text-blue-300/80 block mb-1">Row 2 Boxes:</label>
                <input
                  type="text"
                  value={editRow2}
                  onChange={(e) => setEditRow2(e.target.value)}
                  className="w-full bg-black/60 border border-blue-500/30 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400 font-mono"
                  placeholder="DIGITAL | OWNERSHIP"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setEditRow1('A | NEW | WORLD OF');
                    setEditRow2('DIGITAL | OWNERSHIP');
                  }}
                  className="px-3 py-1 text-xs text-blue-400 hover:text-white"
                >
                  Reset Default
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                >
                  Apply Text Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 1. TOP CHARACTER SHOWCASE (Directly above the Grid Header)   */}
        {/* ------------------------------------------------------------- */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full flex flex-col items-center pt-8 pb-0 select-none"
        >
          {/* Collectible Character View */}
          <div className="relative w-[280px] sm:w-[340px] md:w-[400px] h-[260px] sm:h-[310px] md:h-[360px] flex items-end justify-center overflow-visible">
            {/* Subtle Pedestal / Light Disc */}
            <div className="absolute bottom-2 w-[220px] sm:w-[280px] h-[36px] bg-blue-500/20 rounded-[100%] blur-md pointer-events-none" />
            <div className="absolute bottom-4 w-[180px] sm:w-[220px] h-[16px] bg-[#00f0ff]/40 rounded-[100%] blur-[6px] pointer-events-none" />

            {/* Character Image with Interactive 3D Perspective Tilt */}
            <div
              className="relative z-10 w-full h-full flex items-end justify-center transition-transform duration-200 ease-out"
              style={{
                transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
              }}
            >
              <img
                src={currentItem.image}
                alt={currentItem.name}
                className="w-auto h-[108%] max-w-none object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] transition-all duration-500"
              />
            </div>

            {/* Floating Rarity Badge */}
            <div className="absolute top-2 right-0 sm:-right-6 z-20 px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-400/40 text-[10px] font-mono text-blue-300 tracking-wider backdrop-blur-md">
              {currentItem.rarity} // {currentItem.edition}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. THE EXACT TYPOGRAPHY GRID HEADER                          */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full mt-2 sm:mt-4">
          <div className="w-full border-2 border-blue-500/60 bg-black/95 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
            {/* ROW 1 */}
            <div className="flex flex-row w-full border-b-2 border-blue-500/60 text-2xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black">
              {gridData.row1.map((item, idx) => {
                const isLast = idx === gridData.row1.length - 1;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-center py-4 sm:py-6 md:py-8 px-2 sm:px-6 md:px-8 ${
                      !isLast ? 'border-r-2 border-blue-500/60' : ''
                    } ${item.widthClass || 'flex-1'} transition-colors duration-300 hover:bg-blue-950/20`}
                  >
                    <StylizedText text={item.text} />
                  </div>
                );
              })}
            </div>

            {/* ROW 2 */}
            <div className="flex flex-row w-full text-2xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black">
              {gridData.row2.map((item, idx) => {
                const isLast = idx === gridData.row2.length - 1;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-center py-4 sm:py-6 md:py-8 px-2 sm:px-6 md:px-8 ${
                      !isLast ? 'border-r-2 border-blue-500/60' : ''
                    } ${item.widthClass || 'flex-1'} transition-colors duration-300 hover:bg-blue-950/20`}
                  >
                    <StylizedText text={item.text} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. COLLECTIBLE CONTROLS & SPECIFICATION HUD                   */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Switch between all 3 collectible characters */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
              <span className="text-xs font-mono tracking-wider text-blue-400">SELECT ASSET MODEL</span>
              <span className="text-xs font-mono text-blue-400/60">03 UNITS READY</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {COLLECTIBLES.map((col, idx) => {
                const isSelected = activeCollectible === idx;
                return (
                  <button
                    key={col.id}
                    onClick={() => setActiveCollectible(idx)}
                    className={`relative p-2 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 text-left ${
                      isSelected
                        ? 'border-blue-400 bg-blue-950/50 shadow-[0_0_20px_rgba(0,240,255,0.25)] scale-[1.03]'
                        : 'border-white/10 bg-[#070b14] hover:border-blue-500/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg overflow-hidden bg-black/60">
                      <img src={col.image} alt={col.name} className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="w-full">
                      <div className="text-[11px] font-bold text-white truncate">{col.name}</div>
                      <div className="text-[9px] font-mono text-blue-400">{col.rarity}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Description Box */}
            <div className="p-4 rounded-xl bg-[#060a14] border border-blue-500/20 text-xs text-blue-200/80 leading-relaxed font-sans">
              <span className="font-mono text-blue-400 font-bold block mb-1">SPECIFICATION //</span>
              {currentItem.description}
            </div>
          </div>

          {/* Right Column: Metadata Specs & Web3 Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6 p-6 sm:p-8 rounded-2xl bg-[#050811] border border-blue-500/30 relative overflow-hidden">
            {/* Ambient Corner Light */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase">ACTIVE ASSET</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-display mt-0.5">{currentItem.name}</h3>
                <p className="text-xs font-mono text-blue-400/80">{currentItem.tag}</p>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-blue-400/70">MINT PRICE</span>
                <span className="text-2xl sm:text-3xl font-black text-cyber-blue font-mono">0.085 ETH</span>
              </div>
            </div>

            {/* Spec Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-blue-500/20 text-xs font-mono">
              <div>
                <span className="text-blue-400/60 block text-[10px]">EDITION</span>
                <span className="text-white font-bold">{currentItem.edition}</span>
              </div>
              <div>
                <span className="text-blue-400/60 block text-[10px]">NETWORK</span>
                <span className="text-white font-bold">ETHEREUM L1</span>
              </div>
              <div>
                <span className="text-blue-400/60 block text-[10px]">METADATA</span>
                <span className="text-[#00f0ff] font-bold">IMMUTABLE</span>
              </div>
              <div>
                <span className="text-blue-400/60 block text-[10px]">PROVENANCE</span>
                <button
                  onClick={handleCopyContract}
                  className="text-blue-300 hover:text-white underline underline-offset-2 flex items-center gap-1"
                >
                  {copiedContract ? 'COPIED!' : '0x71C...MF902'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                className="flex-1 min-w-[200px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-[#00a2ff] to-[#00f0ff] text-black font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                MINT ASSET // 0.085 ETH
              </button>

              <button
                type="button"
                className="py-3.5 px-6 rounded-xl bg-blue-950/40 border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-white font-mono text-xs tracking-wider uppercase transition-all duration-300"
              >
                VIEW ON ETHERSCAN
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Ticker Info */}
        <div className="w-full mt-16 pt-8 border-t border-blue-500/20 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-blue-400/50 gap-4">
          <span>OBUL CREATIVE STUDIO © 2026 // MAINFRAME ARCHITECTURE</span>
          <div className="flex items-center gap-6">
            <span>SCROLL: ACTIVE</span>
            <span>SECURE ON-CHAIN VERIFICATION</span>
          </div>
        </div>
      </div>
    </section>
  );
}
