"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import DestinationCard from "@/components/DestinationCard";
import SearchAndFilter from "@/components/SearchAndFilter";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import type { Destination, RecommendedDestination } from "@/lib/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function HomeContent() {
  const { user, token } = useAuth();
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [recommended, setRecommended] = useState<RecommendedDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    Promise.all([
      api.getDestinations(),
      api.getRecommendations({ user_id: user.id, limit: 6 }),
    ])
      .then(([destinations, recs]) => {
        if (cancelled) return;
        setAllDestinations(destinations);
        setRecommended(recs);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, token]);

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

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-canopy">
          {getGreeting()}, {user?.name.split(" ")[0]}.
        </h1>
        <p className="text-ink/60 mt-1 mb-10">
          Here&apos;s Yaoundé, picked for you.
        </p>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner label="Loading destinations" />
          </div>
        ) : (
          <>
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

            <section>
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
