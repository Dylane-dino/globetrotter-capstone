"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, MapPin } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import CreateItineraryModal from "@/components/CreateItineraryModal";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import type { Destination, Itinerary } from "@/lib/types";

function ItineraryCard({
  itinerary,
  destinationsById,
}: {
  itinerary: Itinerary;
  destinationsById: Map<string, Destination>;
}) {
  const thumbnails = itinerary.items
    .map((item) => destinationsById.get(item.destination_id))
    .filter((d): d is Destination => Boolean(d))
    .slice(0, 3);

  return (
    <Link
      href={`/itineraries/${itinerary.id}`}
      className="flex flex-col rounded-card bg-white shadow-card hover:shadow-lifted transition-shadow overflow-hidden"
    >
      <div className="relative h-32 bg-canopy/10 flex">
        {thumbnails.length > 0 ? (
          thumbnails.map((d, i) => (
            <div key={i} className="relative flex-1">
              {d.images?.[0] && (
                <Image
                  src={`/images/${d.images[0]}`}
                  alt={d.name}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              )}
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-canopy/30">
            <MapPin size={28} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-ink text-lg">
          {itinerary.title}
        </h3>
        <p className="text-sm text-ink/50 mt-0.5">
          {itinerary.items.length === 0
            ? "No stops yet"
            : `${itinerary.items.length} stop${itinerary.items.length === 1 ? "" : "s"}`}
        </p>
      </div>
    </Link>
  );
}

function ItinerariesContent() {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [destinationsById, setDestinationsById] = useState<Map<string, Destination>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.getUserItineraries(user.id), api.getDestinations()])
      .then(([itins, destinations]) => {
        setItineraries(itins);
        setDestinationsById(new Map(destinations.map((d) => [d.id, d])));
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-canopy">
              My Trips
            </h1>
            <p className="text-ink/60 mt-1">Your Yaoundé itineraries, in one place.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-laterite text-ivory font-semibold text-sm px-5 py-2.5 hover:bg-laterite-dark transition-colors"
          >
            <Plus size={16} /> New trip
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner label="Loading your trips" />
          </div>
        ) : itineraries.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl text-canopy mb-2">
              No trips yet
            </p>
            <p className="text-ink/60 mb-6">
              Start by browsing destinations, or create an empty trip to fill in later.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-laterite text-ivory font-semibold text-sm px-5 py-2.5 hover:bg-laterite-dark transition-colors"
            >
              <Plus size={16} /> Create your first trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {itineraries.map((itinerary) => (
              <ItineraryCard
                key={itinerary.id}
                itinerary={itinerary}
                destinationsById={destinationsById}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setShowCreateModal(true)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-laterite text-ivory shadow-lifted flex items-center justify-center"
          aria-label="New trip"
        >
          <Plus size={24} />
        </button>
      </main>

      {showCreateModal && (
        <CreateItineraryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(itinerary) => {
            setItineraries((prev) => [...prev, itinerary]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

export default function ItinerariesPage() {
  return (
    <ProtectedRoute>
      <ItinerariesContent />
    </ProtectedRoute>
  );
}
