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

export default function CreateItineraryModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (itinerary: Itinerary) => void;
}) {
  const { user, token } = useAuth();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!user || !token) return;
    if (!title.trim()) {
      setError("Give your trip a name.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const itinerary = await api.createItinerary(
        { user_id: user.id, title: title.trim(), items: [] },
        token
      );
      onSuccess(itinerary);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't create your trip. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New itinerary" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <TextField
          label="Trip name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Weekend in Yaoundé"
          autoFocus
        />
        <ErrorBanner message={error} />
        <Button onClick={handleSubmit} isLoading={isSubmitting} fullWidth>
          Create trip
        </Button>
        <p className="text-xs text-ink/50 text-center">
          You can add destinations to it afterwards.
        </p>
      </div>
    </Modal>
  );
}
