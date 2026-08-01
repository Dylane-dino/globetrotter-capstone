"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { FormEvent } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeHero({
  name,
  query,
  onQueryChange,
  onSubmit,
}: {
  name: string;
  query: string;
  onQueryChange: (v: string) => void;
  onSubmit: () => void;
}) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <div className="relative h-[60vh] min-h-[440px] max-h-[620px] w-full overflow-hidden bg-canopy-dark">
      <Image
        src="/images/mont-febe.jpg"
        alt="Hillside view over Yaoundé from Mont Fébé"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-canopy-dark/90 via-canopy-dark/35 to-canopy-dark/20" />
      <div className="grain-overlay" />

      <div className="relative z-10 h-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col justify-center">
        <span className="font-stamp text-xs uppercase tracking-[0.2em] text-marigold mb-3">
          {getGreeting()}, {name}
        </span>
        <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-ivory drop-shadow-lg">
          Discover Yaoundé
          <br />
          <span className="text-marigold">your way</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-ivory/85 max-w-md leading-relaxed">
          Personalized recommendations for restaurants, culture, nature, and
          more — tailored to what you love.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex w-full max-w-xl rounded-full bg-white/95 shadow-lifted overflow-hidden"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Where do you want to go?"
            className="flex-1 min-w-0 bg-transparent px-5 sm:px-6 py-3.5 text-ink placeholder:text-ink/40 outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-laterite hover:bg-laterite-dark text-ivory font-semibold px-5 sm:px-7 transition-colors shrink-0"
          >
            <Search size={18} />
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>
      </div>
    </div>
  );
}
