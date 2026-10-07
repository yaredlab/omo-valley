import { DraggableCardBody, DraggableCardContainer } from "./ui/draggable-card"

export default function DraggableCardDemo() {
  const items = [
    {
      title: "Tyler Durden",
      image: "/images/portrait-man.png",
      className: "absolute top-10 left-[20%] rotate-[-5deg]",
    },
    {
      title: "The Narrator",
      image: "\mainframe\public\images",
      className: "absolute top-40 left-[25%] rotate-[-7deg]",
    },
    {
      title: "Iceland",
      image: "/images/iceland.png",
      className: "absolute top-5 left-[40%] rotate-[8deg]",
    },
    {
      title: "Japan",
      image: "/images/japan.png",
      className: "absolute top-32 left-[55%] rotate-[10deg]",
    },
    {
      title: "Norway",
      image: "/images/norway.png",
      className: "absolute top-20 right-[35%] rotate-[2deg]",
    },
    {
      title: "New Zealand",
      image: "/images/new-zealand.png",
      className: "absolute top-24 left-[45%] rotate-[-7deg]",
    },
    {
      title: "Canada",
      image: "/images/image(6).png",
      className: "absolute top-8 left-[30%] rotate-[4deg]",
    },
  ]
  return (
    <DraggableCardContainer className="relative flex min-h-screen w-full items-center justify-center overflow-clip bg-[#061E29]">
      <p className="absolute top-1/2 mx-auto max-w-sm -translate-y-3/4 text-center text-2xl font-black text-neutral-400 md:text-4xl dark:text-neutral-800">
        If its your first day at Fight Club, you have to fight.
      </p>
      {items.map((item) => (
        <DraggableCardBody key={item.title} className={item.className}>
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.title}
            className="pointer-events-none relative z-10 h-80 w-80 object-cover"
          />
          <h3 className="mt-4 text-center text-2xl font-bold text-neutral-700 dark:text-neutral-300">{item.title}</h3>
        </DraggableCardBody>
      ))}
    </DraggableCardContainer>
  )
}
