"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import HomeHero from "@/components/HomeHero";
import DestinationCard from "@/components/DestinationCard";
import SearchAndFilter from "@/components/SearchAndFilter";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import type { Destination, RecommendedDestination } from "@/lib/types";

const NOT_PROMOTED_CATEGORIES = new Set(["hospital"]);

function DestinationRow({ destinations }: { destinations: Destination[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
      {destinations.map((d) => (
        <DestinationCard key={d.id} destination={d} />
      ))}
    </div>
  );
}

function HomeContent() {
  const { user, token } = useAuth();
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [recommended, setRecommended] = useState<RecommendedDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const exploreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      api.getDestinations(),
      api.getRecommendations({ user_id: user.id, limit: 6 }),
    ])
      .then(([destinations, recs]) => {
        if (cancelled) return;
        // Keep this defensive check next to the state assignment as well as
        // in the API client. It makes the render contract explicit.
        if (!Array.isArray(destinations) || !Array.isArray(recs)) {
          throw new Error("The server returned invalid destination data.");
        }
        setAllDestinations(destinations);
        setRecommended(recs);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        setAllDestinations([]);
        setRecommended([]);
        setError(requestError instanceof Error ? requestError.message : "Destinations could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, token]);

  const popular = useMemo(() => {
    return [...allDestinations]
      .filter((d) => !NOT_PROMOTED_CATEGORIES.has(d.category))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [allDestinations]);

  const filtered = useMemo(() => {
    return allDestinations.filter((d) => {
      const matchesQuery =
        !query ||
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || d.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [allDestinations, query, category]);

  function scrollToExplore() {
    exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      <HomeHero
        name={user?.name.split(" ")[0] || ""}
        query={query}
        onQueryChange={setQuery}
        onSubmit={scrollToExplore}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner label="Loading destinations" />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-8 rounded-card border border-laterite/20 bg-laterite/5 p-4 text-sm text-ink/75" role="alert">
                {error} Please refresh or try again shortly.
              </div>
            )}
            {popular.length > 0 && (
              <section className="mb-14">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="font-stamp text-[11px] uppercase tracking-wider text-canopy/60">
                      Popular in Yaoundé
                    </span>
                  </div>
                  <button
                    onClick={scrollToExplore}
                    className="text-sm font-semibold text-laterite hover:underline"
                  >
                    View all
                  </button>
                </div>
                <DestinationRow destinations={popular} />
              </section>
            )}

            {recommended.length > 0 && (
              <section className="mb-14">
                <div className="flex items-center gap-2 mb-5">
                  <span className="font-stamp text-[11px] uppercase tracking-wider text-laterite">
                    Recommended for you
                  </span>
                  <div className="flex-1 h-px bg-canopy/10" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {recommended.map((d) => (
                    <DestinationCard key={d.id} destination={d} />
                  ))}
                </div>
              </section>
            )}

            <section ref={exploreRef} className="scroll-mt-20">
              <div className="flex items-center gap-2 mb-5">
                <span className="font-stamp text-[11px] uppercase tracking-wider text-canopy/60">
                  Explore all of Yaoundé
                </span>
                <div className="flex-1 h-px bg-canopy/10" />
              </div>

              <div className="mb-6">
                <SearchAndFilter
                  query={query}
                  onQueryChange={setQuery}
                  category={category}
                  onCategoryChange={setCategory}
                  showSearchInput={false}
                />
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center text-ink/50">
                  <p className="font-display text-xl mb-1">Nothing matches yet</p>
                  <p className="text-sm">Try a different search term or category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {filtered.map((d) => (
                    <DestinationCard key={d.id} destination={d} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
