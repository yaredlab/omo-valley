import { useState } from 'react';

interface CardItem {
  id: string;
  title: string;
  image: string;
  rotation: number;
  translateX: number;
  translateY: number;
  zIndex: number;
  hasSparkle?: boolean;
}

const CARDS: CardItem[] = [
  {
    id: 'left',
    title: 'YADA',
    image: '/images/cards/card-left.jpg',
    rotation: -14,
    translateX: -28,
    translateY: 8,
    zIndex: 1,
  },
  {
    id: 'center',
    title: 'QuantumMuse',
    image: '/images/cards/card-center.jpg',
    rotation: 0,
    translateX: 0,
    translateY: -8,
    zIndex: 10,
    hasSparkle: true,
  },
  {
    id: 'right',
    title: 'SolarisUnit',
    image: '/images/cards/card-right.jpg',
    rotation: 14,
    translateX: 28,
    translateY: 8,
    zIndex: 2,
  },
];

export default function CardDeck() {
  const [activeCard, setActiveCard] = useState<string>('center');
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* 3D Fanned Card Deck Container */}
      <div
        className="relative w-[190px] h-[190px] flex items-center justify-center cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {CARDS.map((card) => {
          const isCenter = card.id === activeCard;
          const spreadFactor = isHovered ? 1.35 : 1;
          const rot = card.id === 'left' ? -15 * spreadFactor : card.id === 'right' ? 15 * spreadFactor : 0;
          const transX = card.id === 'left' ? -36 * spreadFactor : card.id === 'right' ? 36 * spreadFactor : 0;
          const transY = isCenter ? -10 : 6;
          const zIdx = isCenter ? 20 : card.zIndex;
          const scale = isCenter ? (isHovered ? 1.08 : 1.03) : 0.94;

          return (
            <div
              key={card.id}
              onClick={() => setActiveCard(card.id)}
              className="absolute w-[114px] h-[154px] rounded-2xl bg-[#0c0c0e] border border-white/25 shadow-2xl p-1.5 flex flex-col justify-between overflow-visible transition-all duration-300 ease-out backdrop-blur-md"
              style={{
                transform: `translateX(${transX}px) translateY(${transY}px) rotate(${rot}deg) scale(${scale})`,
                zIndex: zIdx,
                boxShadow: isCenter
                  ? '0 18px 36px rgba(0,0,0,0.65), 0 0 20px rgba(255,255,255,0.12)'
                  : '0 10px 20px rgba(0,0,0,0.5)',
              }}
            >
              {/* Top-left red sparkle star for center card */}
              {card.hasSparkle && (
                <div className="absolute -top-2.5 -left-2.5 z-30 pointer-events-none drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z"
                      fill="#ef4444"
                    />
                  </svg>
                </div>
              )}

              {/* Card Image */}
              <div className="relative w-full h-[108px] rounded-xl overflow-hidden bg-neutral-900">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card Label */}
              <div className="w-full py-1 text-center bg-black/75 rounded-lg border border-white/10 mt-1">
                <span className="text-[10px] font-medium tracking-tight text-white truncate block px-1">
                  {card.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtitle Caption */}
      <p className="mt-2 max-w-[200px] text-center text-[12px] sm:text-[13px] font-normal leading-relaxed text-white/80 select-none">
        explore unique digital pieces and build a collection that&apos;s yours.
      </p>
    </div>
  );
}
