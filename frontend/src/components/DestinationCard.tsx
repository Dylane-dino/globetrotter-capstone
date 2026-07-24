import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Destination } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  nature: "Nature",
  history: "History",
  culture: "Culture",
  shopping: "Shopping",
  religious: "Religious Site",
  food: "Restaurant",
  restaurant: "Restaurant",
  hotel: "Hotel",
  hospital: "Health",
};

function formatCost(fcfa: number): string {
  if (fcfa === 0) return "Free";
  return `${fcfa.toLocaleString()} FCFA`;
}

export default function DestinationCard({
  destination,
}: {
  destination: Destination;
}) {
  const image = destination.images?.[0]
    ? `/images/${destination.images[0]}`
    : null;

  return (
    <Link
      href={`/destinations/${destination.id}`}
      className="group flex flex-col rounded-card overflow-hidden bg-white shadow-card hover:shadow-lifted transition-shadow duration-200"
    >
      <div className="relative aspect-[4/3] bg-canopy/10 overflow-hidden">
        {image && (
          <Image
            src={image}
            alt={destination.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        )}
        <span className="absolute top-3 left-3 font-stamp text-[10px] uppercase tracking-wider bg-canopy-dark/80 text-ivory px-2 py-1 rounded-full">
          {CATEGORY_LABELS[destination.category] || destination.category}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="font-display font-semibold text-ink text-lg leading-tight">
          {destination.name}
        </h3>
        <p className="text-sm text-ink/50">{destination.neighborhood}</p>

        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1 text-marigold-dark">
            <Star size={14} fill="currentColor" strokeWidth={0} />
            <span className="text-sm font-semibold text-ink/80">
              {destination.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-sm font-medium text-canopy/70">
            {formatCost(destination.avg_cost_fcfa)}
          </span>
        </div>
      </div>
    </Link>
  );
}
