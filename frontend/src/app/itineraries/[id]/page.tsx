"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Share2, Trash2, X, Check, Pencil } from "lucide-react";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import ShareItineraryModal from "@/components/ShareItineraryModal";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Destination, Itinerary, User } from "@/lib/types";

export default function ItineraryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [destinationsById, setDestinationsById] = useState<Map<string, Destination>>(
    new Map()
  );
  const [owner, setOwner] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isOwner = Boolean(user && itinerary && user.id === itinerary.user_id);

  useEffect(() => {
    Promise.all([api.getItinerary(params.id), api.getDestinations()])
      .then(([itin, destinations]) => {
        setItinerary(itin);
        setTitleDraft(itin.title);
        setDestinationsById(new Map(destinations.map((d) => [d.id, d])));
        if (!user || user.id !== itin.user_id) {
          api.getUser(itin.user_id).then(setOwner).catch(() => {});
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const itemsByDay = useMemo(() => {
    if (!itinerary) return new Map<number, Itinerary["items"]>();
    const grouped = new Map<number, Itinerary["items"]>();
    for (const item of itinerary.items) {
      const existing = grouped.get(item.day) || [];
      grouped.set(item.day, [...existing, item]);
    }
    return new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]));
  }, [itinerary]);

  async function handleSaveTitle() {
    if (!itinerary || !token || !titleDraft.trim()) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const updated = await api.updateItinerary(
        itinerary.id,
        { title: titleDraft.trim() },
        token
      );
      setItinerary(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't rename this trip.");
    } finally {
      setIsEditingTitle(false);
    }
  }

  async function handleRemoveItem(index: number) {
    if (!itinerary || !token) return;
    const newItems = itinerary.items.filter((_, i) => i !== index);
    try {
      const updated = await api.updateItinerary(itinerary.id, { items: newItems }, token);
      setItinerary(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update this trip.");
    }
  }

  async function handleDelete() {
    if (!itinerary || !token) return;
    if (!window.confirm(`Delete "${itinerary.title}"? This can't be undone.`)) return;
    try {
      await api.deleteItinerary(itinerary.id, token);
      router.push("/itineraries");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete this trip.");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navbar />
        <div className="py-24 flex justify-center">
          <Spinner label="Loading trip" />
        </div>
      </div>
    );
  }

  if (notFound || !itinerary) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-2xl text-canopy mb-2">
            We couldn&apos;t find that trip
          </p>
          <p className="text-ink/60 mb-6">
            The link may be broken, or the trip may have been deleted.
          </p>
          <Link href="/home" className="text-laterite font-semibold hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!isOwner && (
          <div className="mb-6 rounded-card bg-canopy/5 border border-canopy/10 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-ink/70">
              {owner ? (
                <>
                  Shared trip by <span className="font-semibold">{owner.name}</span>
                </>
              ) : (
                "A shared trip"
              )}
            </p>
            {!user && (
              <Link href="/" className="text-sm font-semibold text-laterite hover:underline">
                Sign in to plan your own
              </Link>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-4 mb-8">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                className="font-display text-3xl font-semibold text-canopy bg-transparent border-b-2 border-marigold outline-none flex-1"
              />
              <button
                onClick={handleSaveTitle}
                className="p-2 rounded-full bg-canopy text-ivory hover:bg-canopy-light"
                aria-label="Save"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setTitleDraft(itinerary.title);
                  setIsEditingTitle(false);
                }}
                className="p-2 rounded-full text-canopy/50 hover:bg-canopy/10"
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-canopy">
                {itinerary.title}
              </h1>
              {isOwner && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1.5 rounded-full text-canopy/40 hover:bg-canopy/10 hover:text-canopy"
                  aria-label="Rename trip"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
          )}

          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2.5 rounded-full bg-canopy/5 text-canopy hover:bg-canopy/10"
                aria-label="Share trip"
                title="Share"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2.5 rounded-full bg-laterite/10 text-laterite hover:bg-laterite/20"
                aria-label="Delete trip"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-laterite/10 border border-laterite/30 px-3 py-2.5 text-sm text-laterite-dark">
            {error}
          </div>
        )}

        {itinerary.items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-xl text-canopy mb-2">
              No stops yet
            </p>
            <p className="text-ink/60 mb-6">
              Browse destinations and add them to this trip.
            </p>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 rounded-full bg-laterite text-ivory font-semibold text-sm px-5 py-2.5 hover:bg-laterite-dark transition-colors"
            >
              Explore Yaoundé
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {[...itemsByDay.entries()].map(([day, items]) => (
              <section key={day}>
                <span className="font-stamp text-[11px] uppercase tracking-wider bg-canopy text-ivory px-2.5 py-1 rounded-full">
                  Day {day.toString().padStart(2, "0")}
                </span>

                <div className="flex flex-col gap-3 mt-3">
                  {items.map((item) => {
                    const destination = destinationsById.get(item.destination_id);
                    const globalIndex = itinerary.items.indexOf(item);
                    return (
                      <div
                        key={`${item.destination_id}-${globalIndex}`}
                        className="flex items-center gap-4 bg-white rounded-card shadow-card p-3"
                      >
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-canopy/10 shrink-0">
                          {destination?.images?.[0] && (
                            <Image
                              src={`/images/${destination.images[0]}`}
                              alt={destination.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/destinations/${item.destination_id}`}
                            className="font-display font-semibold text-ink hover:text-laterite truncate block"
                          >
                            {destination?.name || "Unknown destination"}
                          </Link>
                          {destination && (
                            <p className="text-sm text-ink/50 truncate">
                              {destination.neighborhood}
                            </p>
                          )}
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => handleRemoveItem(globalIndex)}
                            className="p-2 rounded-full text-canopy/40 hover:bg-laterite/10 hover:text-laterite shrink-0"
                            aria-label="Remove from trip"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {showShareModal && (
        <ShareItineraryModal
          itineraryId={itinerary.id}
          currentSharedWith={itinerary.shared_with}
          onClose={() => setShowShareModal(false)}
          onSuccess={(updated) => {
            setItinerary(updated);
            setShowShareModal(false);
          }}
        />
      )}
    </div>
  );
}
