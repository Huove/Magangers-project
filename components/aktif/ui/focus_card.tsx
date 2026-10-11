"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type CardType = {
  title: string;
  src: string;
  href: string;
};

function Card({
  card,
  index,
  hovered,
  setHovered,
}: {
  card: CardType;
  index: number;
  hovered: number | null;
  setHovered: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const isHovered = hovered === index;
  const isOtherHovered = hovered !== null && hovered !== index;

  return (
    <Link href={card.href}>
      <div
        onMouseEnter={() => setHovered(index)}
        onMouseLeave={() => setHovered(null)}
        className={cn(
          "group relative h-64 overflow-hidden rounded-3xl cursor-pointer transition-all duration-300",
          isOtherHovered && "blur-sm scale-[0.96] opacity-80"
        )}
      >
        <Image
          src={card.src}
          alt={card.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-all duration-300 group-hover:from-black/90" />
        <div className="absolute inset-0 flex items-end p-6">
          <div className="w-full">
            <h3
              className={cn(
                "text-2xl font-bold text-white transition-all duration-300",
                isHovered && "-translate-y-2"
              )}
            >
              {card.title}
            </h3>

            <p
              className={cn(
                "mt-2 text-gray-200 transition-all duration-300",
                isHovered
                  ? "opacity-100 translate-y-0"
                  : "opacity-80 translate-y-0"
              )}
            >
              Klik untuk membuka menu →
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FocusCards({
  cards,
}: {
  cards: CardType[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
}