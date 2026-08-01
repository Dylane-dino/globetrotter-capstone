"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bot, MapPin, MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import type { ChatResponse } from "@/lib/types";

type ChatItem = { role: "user" | "assistant"; message: string; response?: ChatResponse };

const INITIAL_MESSAGE: ChatItem = {
  role: "assistant",
  message: "Hi! I’m Trip AI. Ask me to plan a Yaoundé outing, compare transport costs, or explain GlobeTrotter.",
};
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;

function historyKey(userId: string) {
  return `globetrotter_trip_ai_history_${userId}`;
}

export default function TripAiChat() {
  const { user, token, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState<ChatItem[]>([INITIAL_MESSAGE]);

  useEffect(() => {
    if (!user) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(historyKey(user.id)) || "null") as {
        savedAt: number;
        items: ChatItem[];
      } | null;
      setItems(saved && Date.now() - saved.savedAt < HISTORY_TTL_MS && saved.items.length ? saved.items : [INITIAL_MESSAGE]);
    } catch {
      setItems([INITIAL_MESSAGE]);
    }
  }, [user]);

  useEffect(() => {
    if (!user || items.length === 1) return;
    window.localStorage.setItem(historyKey(user.id), JSON.stringify({ savedAt: Date.now(), items: items.slice(-24) }));
  }, [items, user]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || sending || !token) return;

    const history = items.slice(-12).map(({ role, message: past }) => ({ role, message: past }));
    setItems((current) => [...current, { role: "user", message }]);
    setText("");
    setSending(true);
    try {
      const response = await api.chat({ message, history }, token);
      setItems((current) => [...current, { role: "assistant", message: response.message, response }]);
    } catch (error) {
      setItems((current) => [...current, { role: "assistant", message: error instanceof Error ? error.message : "Trip AI is unavailable right now. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  if (isLoading || !user || !token) return null;

  return <>
    <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-laterite px-5 py-3 text-sm font-semibold text-white shadow-lifted hover:bg-laterite-dark" aria-label="Open Trip AI">
      <MessageCircle size={19} /> Trip AI
    </button>
    {open && <section className="fixed bottom-5 right-4 z-50 flex h-[min(680px,calc(100vh-2.5rem))] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-canopy/15 bg-ivory shadow-2xl">
      <header className="flex items-center justify-between bg-canopy px-5 py-4 text-ivory">
        <div className="flex items-center gap-2"><Bot size={21} /><div><h2 className="font-display text-lg font-semibold">Trip AI</h2><p className="text-xs text-ivory/70">Your Yaoundé travel companion</p></div></div>
        <button onClick={() => setOpen(false)} className="p-1 hover:text-marigold" aria-label="Close Trip AI"><X size={20} /></button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {items.map((item, index) => <div key={index} className={item.role === "user" ? "ml-8 rounded-2xl rounded-br-sm bg-laterite p-3 text-sm text-white" : "mr-4 rounded-2xl rounded-bl-sm bg-white p-3 text-sm text-ink shadow-card"}>
          <p className="whitespace-pre-wrap leading-relaxed">{item.message}</p>
          {item.response?.suggested_destinations.map((place) => <div key={place.id} className="mt-3 rounded-lg border border-canopy/15 bg-canopy/5 p-3">
            <div className="flex gap-1 font-semibold text-canopy"><MapPin size={16} />{place.name}</div>
            <p className="mt-1 text-xs text-ink/70"><b>What&apos;s special:</b> {place.special_highlight}</p><p className="mt-1 text-xs text-ink/70"><b>Best time:</b> {place.best_time_to_visit}</p><p className="mt-1 text-xs text-ink/70"><b>Suggested stay:</b> {place.estimated_stay_duration}</p>
            <div className="mt-2 space-y-1">{place.transport.map((option) => <p key={option.mode} className="text-xs text-ink/70"><b>{option.mode}:</b> {option.duration_minutes ? `${option.duration_minutes} min · ` : ""}{option.estimated_cost_fcfa.toLocaleString()} FCFA — {option.notes}</p>)}</div>
            <a href={`/destinations/${place.id}`} className="mt-2 inline-block text-xs font-semibold text-laterite hover:underline">View destination</a>
          </div>)}
        </div>)}
        {sending && <div className="mr-4 w-fit rounded-2xl bg-white px-3 py-2 text-sm text-ink/60 shadow-card">Trip AI is thinking…</div>}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-canopy/10 bg-white p-3"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask Trip AI anything…" className="min-w-0 flex-1 rounded-full border border-canopy/20 px-4 py-2 text-sm outline-none focus:border-laterite" /><button disabled={sending || !text.trim()} className="rounded-full bg-laterite p-2.5 text-white disabled:opacity-50" aria-label="Send message"><Send size={17} /></button></form>
    </section>}
  </>;
}
