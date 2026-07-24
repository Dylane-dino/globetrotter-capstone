"use client";

import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import TextField from "./TextField";
import ErrorBanner from "./ErrorBanner";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Itinerary } from "@/lib/types";

export default function ShareItineraryModal({
  itineraryId,
  currentSharedWith,
  onClose,
  onSuccess,
}: {
  itineraryId: string;
  currentSharedWith: string[];
  onClose: () => void;
  onSuccess: (itinerary: Itinerary) => void;
}) {
  const { token } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!token) return;
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const itinerary = await api.shareItinerary(itineraryId, email.trim(), token);
      onSuccess(itinerary);
      setEmail("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't share this trip. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Share this trip" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <TextField
          label="Friend's email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          autoFocus
        />
        <ErrorBanner message={error} />
        <Button onClick={handleSubmit} isLoading={isSubmitting} fullWidth>
          Share
        </Button>

        {currentSharedWith.length > 0 && (
          <div>
            <p className="font-stamp text-[11px] uppercase tracking-wider text-canopy/60 mb-2">
              Already shared with
            </p>
            <ul className="flex flex-col gap-1">
              {currentSharedWith.map((e) => (
                <li key={e} className="text-sm text-ink/70">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
