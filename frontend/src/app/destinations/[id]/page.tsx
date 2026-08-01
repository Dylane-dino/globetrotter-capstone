"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Wallet } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import Button from "@/components/Button";
import AddToItineraryModal from "@/components/AddToItineraryModal";
import * as api from "@/lib/api";
import type { Destination } from "@/lib/types";
import DestinationMap from "@/components/DestinationMap";
import TravelPlanner from "@/components/TravelPlanner";

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
  if (fcfa === 0) return "Free to visit";
  return `~${fcfa.toLocaleString()} FCFA`;
}

function DestinationDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDestination(params.id)
      .then(setDestination)
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navbar />
        <div className="py-24 flex justify-center">
          <Spinner label="Loading destination" />
        </div>
      </div>
    );
  }

  if (notFound || !destination) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-2xl text-canopy mb-2">
            We couldn&apos;t find that place
          </p>
          <p className="text-ink/60 mb-6">
            It may have been removed, or the link isn&apos;t quite right.
          </p>
          <Link href="/home" className="text-laterite font-semibold hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const image = destination.images?.[0] ? `/images/${destination.images[0]}` : null;

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      <div className="relative h-[42vh] sm:h-[50vh] bg-canopy">
        {image && (
          <Image
            src={image}
            alt={destination.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-canopy-dark/90 via-canopy-dark/10 to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute top-5 left-4 sm:left-6 flex items-center gap-1.5 text-ivory bg-canopy-dark/40 hover:bg-canopy-dark/60 backdrop-blur px-3 py-2 rounded-full text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-4 sm:px-6 pb-6 w-full">
          <span className="font-stamp text-[11px] uppercase tracking-wider bg-marigold text-canopy-dark px-2.5 py-1 rounded-full">
            {CATEGORY_LABELS[destination.category] || destination.category}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ivory mt-3">
            {destination.name}
          </h1>
          <p className="text-ivory/80 mt-1">{destination.neighborhood}, Yaoundé</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <p className="text-ink/80 leading-relaxed text-lg">
              {destination.description}
            </p>

            <section className="mt-7 rounded-card bg-marigold/10 p-5">
              <h2 className="font-display text-xl text-canopy mb-2">✨ What&apos;s Special About This Place</h2>
              <p className="text-ink/75 leading-relaxed">{destination.tags.length ? `${destination.name} is especially loved for its ${destination.tags.map((tag) => tag.replace(/-/g, " ")).join(", ")} atmosphere—one of the local experiences that gives Yaoundé its character.` : "A distinctive Yaoundé stop with its own local character and memorable atmosphere."}</p>
            </section>

            {destination.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {destination.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-canopy/70 bg-canopy/5 px-3 py-1.5 rounded-full capitalize"
                  >
                    {tag.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="bg-white rounded-card shadow-card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-marigold-dark" fill="currentColor" />
                <span className="font-semibold text-ink">
                  {destination.rating.toFixed(1)}
                </span>
                <span className="text-ink/50 text-sm">rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-canopy/60" />
                <span className="text-ink">{formatCost(destination.avg_cost_fcfa)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-canopy/60" />
                <span className="text-ink text-sm">
                  {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                </span>
              </div>

              {destination.category !== "hospital" ? (
                <Button fullWidth onClick={() => setShowModal(true)} className="mt-1">
                  Add to itinerary
                </Button>
              ) : (
                <p className="text-xs text-ink/50 mt-1">
                  Practical information - not typically added to a leisure itinerary.
                </p>
              )}

              {successMessage && (
                <p className="text-sm text-canopy font-medium bg-canopy/5 rounded-lg px-3 py-2">
                  {successMessage}
                </p>
              )}
            </div>
          </aside>
        </div>
        <TravelPlanner destination={destination} />
        <DestinationMap name={destination.name} latitude={destination.lat} longitude={destination.lng} />
      </main>

      {showModal && (
        <AddToItineraryModal
          destinationId={destination.id}
          destinationName={destination.name}
          onClose={() => setShowModal(false)}
          onSuccess={(itinerary) => {
            setShowModal(false);
            setSuccessMessage(`Added to "${itinerary.title}".`);
          }}
        />
      )}
    </div>
  );
}

export default function DestinationDetailPage() {
  return (
    <ProtectedRoute>
      <DestinationDetailContent />
    </ProtectedRoute>
  );
}
