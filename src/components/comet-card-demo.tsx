import { CometCard } from "@/components/ui/comet-card";

interface CometCardDemoProps {
  image?: string;
  title?: string;
  code?: string;
  alt?: string;
}

export default function CometCardDemo({
  image = "/comet-invite.png",
  title = "Comet Invitation",
  code = "#F7RA",
  alt = "A walker in a green jacket climbing a stony path towards misty Highland peaks",
}: CometCardDemoProps) {
  return (
    <CometCard>
      <figure
        className="flex w-[min(21rem,34dvh)] flex-col rounded-[20px] bg-[#1F2121] p-2.5 sm:p-3 saturate-0 hover:saturate-100 transition-[filter] duration-300 md:p-4 lg:w-[min(23rem,54dvh)] shadow-2xl border border-white/10"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="mx-1 sm:mx-2 flex-1">
          <div className="relative mt-1 sm:mt-2 aspect-[3/4] w-full overflow-hidden rounded-[16px]">
            <img
              className="absolute inset-0 h-full w-full rounded-[16px] bg-black object-cover contrast-[0.9] hover:contrast-100 transition-all duration-300 select-none"
              alt={alt}
              src={image}
              style={{ boxShadow: "rgba(0, 0, 0, 0.25) 0px 8px 16px 0px" }}
            />
          </div>
        </div>
        <figcaption className="mt-2 flex flex-shrink-0 items-center justify-between px-3 py-2.5 font-mono text-white">
          <span className="text-xs sm:text-sm font-medium tracking-wide">{title}</span>
          <span className="text-xs sm:text-sm text-gray-400 font-semibold">{code}</span>
        </figcaption>
      </figure>
    </CometCard>
  );
}
