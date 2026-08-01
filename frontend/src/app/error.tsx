"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the diagnostic in the browser console while presenting a usable
    // recovery screen instead of a blank page.
    console.error("GlobeTrotter page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-6 text-center">
      <div className="max-w-md rounded-card bg-white p-8 shadow-card">
        <p className="font-stamp text-xs uppercase tracking-wider text-laterite">Something needs a refresh</p>
        <h1 className="mt-3 font-display text-3xl text-canopy">We couldn&apos;t load this page</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">Your account and trip data are safe. Please try loading the page again.</p>
        <button onClick={reset} className="mt-6 rounded-full bg-laterite px-5 py-2.5 text-sm font-semibold text-white hover:bg-laterite-dark">Try again</button>
        <a href="/" className="mt-4 block text-sm font-semibold text-canopy hover:underline">Return to sign in</a>
      </div>
    </main>
  );
}
