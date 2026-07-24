"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import TextField from "./TextField";
import ErrorBanner from "./ErrorBanner";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Itinerary } from "@/lib/types";

export default function AddToItineraryModal({
  destinationId,
  destinationName,
  onClose,
  onSuccess,
}: {
  destinationId: string;
  destinationName: string;
  onClose: () => void;
  onSuccess: (itinerary: Itinerary) => void;
}) {
  const { user, token } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [selection, setSelection] = useState<string>("new");
  const [newTitle, setNewTitle] = useState(`${destinationName} trip`);
  const [day, setDay] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .getUserItineraries(user.id)
      .then(setItineraries)
      .finally(() => setIsLoadingList(false));
  }, [user]);

  async function handleSubmit() {
    if (!user || !token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      let result: Itinerary;
      if (selection === "new") {
        if (!newTitle.trim()) {
          setError("Give your itinerary a name.");
          setIsSubmitting(false);
          return;
        }
        result = await api.createItinerary(
          {
            user_id: user.id,
            title: newTitle.trim(),
            items: [{ destination_id: destinationId, day }],
          },
          token
        );
      } else {
        const target = itineraries.find((i) => i.id === selection);
        if (!target) throw new Error("Itinerary not found");
        result = await api.updateItinerary(
          target.id,
          {
            items: [...target.items, { destination_id: destinationId, day }],
          },
          token
        );
      }
      onSuccess(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't update your itinerary. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Add to itinerary" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink/60">
          Adding <span className="font-semibold text-ink">{destinationName}</span>
        </p>

        {!isLoadingList && itineraries.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="font-stamp text-[11px] uppercase tracking-wider text-canopy/70">
              Itinerary
            </label>
            <select
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              className="rounded-lg border border-canopy/20 bg-white px-4 py-2.5 text-ink outline-none focus:border-marigold focus:ring-1 focus:ring-marigold"
            >
              <option value="new">+ Create a new itinerary</option>
              {itineraries.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {selection === "new" && (
          <TextField
            label="Itinerary name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Weekend in Yaoundé"
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label className="font-stamp text-[11px] uppercase tracking-wider text-canopy/70">
            Day
          </label>
          <input
            type="number"
            min={1}
            value={day}
            onChange={(e) => setDay(Math.max(1, Number(e.target.value)))}
            className="rounded-lg border border-canopy/20 bg-white px-4 py-2.5 text-ink outline-none focus:border-marigold focus:ring-1 focus:ring-marigold w-24"
          />
        </div>

        <ErrorBanner message={error} />

        <Button onClick={handleSubmit} isLoading={isSubmitting} fullWidth>
          Add to trip
        </Button>
      </div>
    </Modal>
  );
}
