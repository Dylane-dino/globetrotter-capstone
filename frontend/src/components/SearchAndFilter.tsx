"use client";

import { Search } from "lucide-react";

const CATEGORIES: { id: string; label: string }[] = [
  { id: "", label: "All" },
  { id: "nature", label: "Nature" },
  { id: "history", label: "History" },
  { id: "culture", label: "Culture" },
  { id: "shopping", label: "Shopping" },
  { id: "religious", label: "Religious" },
  { id: "food", label: "Food" },
  { id: "restaurant", label: "Restaurants" },
  { id: "hotel", label: "Hotels" },
];

export default function SearchAndFilter({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  showSearchInput = true,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  showSearchInput?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {showSearchInput && (
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-canopy/40"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search destinations in Yaoundé..."
            className="w-full rounded-full border border-canopy/15 bg-white pl-11 pr-4 py-3 text-ink placeholder:text-ink/35 focus:border-marigold focus:ring-1 focus:ring-marigold outline-none transition-colors"
          />
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id || "all"}
            onClick={() => onCategoryChange(c.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium font-stamp uppercase tracking-wide text-[11px] transition-colors ${
              category === c.id
                ? "bg-canopy text-ivory"
                : "bg-canopy/5 text-canopy/60 hover:bg-canopy/10"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
