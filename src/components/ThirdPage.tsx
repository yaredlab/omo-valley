import { useState } from "react";
import CometCardDemo from "./comet-card-demo";

const DEFAULT_DETAILS = [
  ["Group", "Eight walkers and one mountain leader"],
  ["Distance", "10 to 14 km, about five hours with stops"],
  ["Bring", "Boots and a waterproof. We lend poles."],
];

const CARDS_DATA = [
  {
    id: "comet",
    title: "Comet Invitation",
    code: "#F7RA",
    image: "/comet-invite.png",
    alt: "A walker in a green jacket climbing a stony path towards misty Highland peaks",
    heading: "Walk the Highlands in winter, with a guide who knows the ground.",
    description:
      "Comet runs small guided walks through the Scottish Highlands from October to March. Your invite holds one place on the next departure. The guide handles the route, the weather calls and the car park.",
    details: DEFAULT_DETAILS,
    note: "Invite F7RA is held for you until 30 November.",
  },
  {
    id: "quantum",
    title: "Quantum Muse",
    code: "#12/100",
    image: "/images/cards/card-center.jpg",
    alt: "Quantum Muse collectible artifact",
    heading: "Explore the vanguard of digital artifacts & cyber aesthetics.",
    description:
      "Tactical neural synch and reactive fiber weave. Your cryptographic invite unlocks exclusive access to the upcoming Mainframe vault dispatch.",
    details: [
      ["Edition", "12 / 100 Rare Mint"],
      ["Network", "Ethereum L1 Mainnet"],
      ["Metadata", "Decentralized & Immutable"],
    ],
    note: "Pass #12 is reserved for your verified wallet address.",
  },
  {
    id: "solaris",
    title: "Solaris Unit",
    code: "#07/100",
    image: "/images/cards/card-right.jpg",
    alt: "Solaris Unit 07 collectible artifact",
    heading: "Neo-Kyoto Arc Unit: High-altitude thermal shell.",
    description:
      "Engineered with bio-luminescent optics and sub-dermal glow circuitry. Experience the next horizon in immersive wearable hardware.",
    details: [
      ["Unit", "Arc Unit 07 Prototype"],
      ["Protocol", "MF-ARCHIVE 02"],
      ["Status", "Active // Ready for Dispatch"],
    ],
    note: "Prototype hold expires after current session.",
  },
];

export default function ThirdPage() {
  const [selectedCardIdx, setSelectedCardIdx] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const current = CARDS_DATA[selectedCardIdx];

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => {
      // Keep accepted state active for confirmation
    }, 300);
  };

  return (
    <section
      id="third-page"
      className={`relative z-10 w-full min-h-screen py-16 px-6 sm:px-10 lg:px-16 flex flex-col justify-center transition-colors duration-500 font-schibsted ${
        isDarkTheme
          ? "bg-[#061E29] text-[#F1F3EE]"
          : "bg-[#DFE3DD] text-[#17231D]"
      }`}
    >
      {/* Top Transition Gradient from Section 2 (#061E29) */}
      {!isDarkTheme && (
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#061E29] via-[#061E29]/40 to-transparent pointer-events-none" />
      )}

      {/* Control bar: theme toggle & card switcher */}
      <div className="mx-auto w-full max-w-7xl flex flex-wrap items-center justify-between gap-4 pb-6 mb-4 border-b border-current/10 text-xs font-mono uppercase tracking-wider">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-[#1F3A2E] dark:bg-[#00f0ff] animate-pulse" />
          <span className="opacity-75 font-semibold">PAGE 03 // INVITATION SHOWCASE</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Card Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-sm">
            {CARDS_DATA.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCardIdx(idx);
                  setAccepted(false);
                }}
                className={`px-3 py-1 rounded-full text-[11px] transition-all duration-200 ${
                  selectedCardIdx === idx
                    ? isDarkTheme
                      ? "bg-[#00f0ff] text-black font-bold shadow-md"
                      : "bg-[#1F3A2E] text-[#F1F3EE] font-medium shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {c.title.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Theme switch button */}
          <button
            type="button"
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="px-3 py-1.5 rounded-lg border border-current/20 hover:border-current/50 transition-colors text-[11px]"
            title="Toggle between Highland Mist and Dark Mode"
          >
            {isDarkTheme ? "☀ Mist Mode" : "☾ Dark Mode"}
          </button>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 py-4">
        {/* Left Column: 3D Interactive Comet Card */}
        <div className="flex flex-col items-center justify-center select-none py-4">
          <CometCardDemo
            image={current.image}
            title={current.title}
            code={current.code}
            alt={current.alt}
          />
          <span className="mt-3 text-[11px] font-mono opacity-50 tracking-wider">
            [ HOVER & MOVE CURSOR TO TILT 3D CARD ]
          </span>
        </div>

        {/* Right Column: Information, Details Table, & Invitation CTA */}
        <section className="flex flex-col justify-center">
          <h2 className="max-w-[16em] text-[clamp(1.75rem,3.4vw+0.5rem,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
            {current.heading}
          </h2>

          <p
            className={`mt-4 max-w-[34rem] text-base leading-relaxed lg:mt-6 lg:text-lg ${
              isDarkTheme ? "text-[#C2D4CC]" : "text-[#2E3D35]"
            }`}
          >
            {current.description}
          </p>

          {/* Details Table */}
          <dl className="mt-6 max-w-[34rem] border-b border-current/15 text-[15px] lg:mt-8">
            {current.details.map(([term, description]) => (
              <div
                key={term}
                className="grid grid-cols-[5.5rem_1fr] gap-4 border-t border-current/15 py-3 lg:grid-cols-[6.5rem_1fr]"
              >
                <dt className={isDarkTheme ? "text-[#8CA498]" : "text-[#4B5A52]"}>
                  {term}
                </dt>
                <dd className="font-normal">{description}</dd>
              </div>
            ))}
          </dl>

          {/* Action Button & Hold Status */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 lg:mt-8">
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepted}
              className={`h-12 rounded-lg px-7 text-base font-medium transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                accepted
                  ? "bg-[#2563EB] text-white cursor-default scale-100 shadow-md"
                  : isDarkTheme
                  ? "bg-[#00f0ff] text-black hover:bg-[#38bdf8] focus-visible:outline-[#00f0ff] shadow-lg shadow-[#00f0ff]/20 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-[#1F3A2E] text-[#F1F3EE] hover:bg-[#162B22] focus-visible:outline-[#1F3A2E] shadow-md hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {accepted ? "✓ Invite Accepted" : "Accept invite"}
            </button>

            <p
              className={`text-sm ${
                isDarkTheme ? "text-[#8CA498]" : "text-[#4B5A52]"
              }`}
            >
              {accepted
                ? `Place secured! Confirmation code: ${current.code}`
                : current.note}
            </p>
          </div>
        </section>
      </div>

      {/* Footer Meta Ticker */}
      <div className="mx-auto w-full max-w-7xl pt-8 mt-12 border-t border-current/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono opacity-50 gap-3">
        <span>COMET // GUIDED WINTER WALKS & DIGITAL ARTIFACTS</span>
        <div className="flex items-center gap-6">
          <span>SECURE INVITATION DISPATCH</span>
          <span>ALL RIGHTS RESERVED © 2026</span>
        </div>
      </div>
    </section>
  );
}
