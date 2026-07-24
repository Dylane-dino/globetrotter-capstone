"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { INTEREST_OPTIONS } from "@/lib/interests";

export default function InterestPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {INTEREST_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            aria-pressed={isSelected}
            className={`group relative aspect-[4/3] rounded-card overflow-hidden text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-marigold ${
              isSelected
                ? "ring-4 ring-marigold ring-offset-2 ring-offset-ivory"
                : "ring-1 ring-canopy/10"
            }`}
          >
            <Image
              src={option.image}
              alt=""
              fill
              className={`object-cover transition-transform duration-300 ${
                isSelected ? "scale-105" : "group-hover:scale-105"
              }`}
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            <div
              className={`absolute inset-0 transition-colors ${
                isSelected
                  ? "bg-canopy-dark/50"
                  : "bg-gradient-to-t from-canopy-dark/85 via-canopy-dark/20 to-transparent"
              }`}
            />

            {isSelected && (
              <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-marigold flex items-center justify-center">
                <Check size={16} strokeWidth={3} className="text-canopy-dark" />
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-display font-semibold text-ivory text-sm sm:text-base leading-tight">
                {option.label}
              </p>
              <p className="font-stamp text-[10px] uppercase tracking-wide text-ivory/70 mt-0.5">
                {option.hint}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
